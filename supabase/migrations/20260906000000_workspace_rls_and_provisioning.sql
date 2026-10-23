-- ============================================================================
-- WorkPilot — Workspace RLS & Atomic Provisioning Fix
-- Migration: 20260906000000_workspace_rls_and_provisioning.sql
-- ============================================================================

-- 1. Allow authenticated users to insert their new workspace
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workspaces' AND policyname = 'workspaces: authenticated users can insert workspace'
  ) THEN
    CREATE POLICY "workspaces: authenticated users can insert workspace"
      ON public.workspaces FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 2. Allow authenticated users to add their own membership row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'workspace_members' AND policyname = 'workspace_members: authenticated users can insert own membership'
  ) THEN
    CREATE POLICY "workspace_members: authenticated users can insert own membership"
      ON public.workspace_members FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 3. Atomic SECURITY DEFINER function to get or provision the user's workspace
CREATE OR REPLACE FUNCTION public.get_or_create_workspace(
  p_company_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_meta JSONB;
  v_membership RECORD;
  v_workspace RECORD;
  v_company_name TEXT;
  v_slug_base TEXT;
  v_slug TEXT;
BEGIN
  -- 1. Verify caller is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Check for existing active workspace membership
  SELECT wm.workspace_id, wm.role, wm.status, w.name, w.slug, w.logo_url, w.color, w.plan, w.ai_credits_total, w.ai_credits_used, w.ai_credits_reset_at
  INTO v_membership
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = v_user_id
    AND wm.status = 'active'
  ORDER BY wm.joined_at ASC
  LIMIT 1;

  IF v_membership.workspace_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'workspace_id', v_membership.workspace_id,
      'workspace_name', v_membership.name,
      'role', v_membership.role,
      'workspace', jsonb_build_object(
        'id', v_membership.workspace_id,
        'name', v_membership.name,
        'slug', v_membership.slug,
        'logo_url', v_membership.logo_url,
        'color', v_membership.color,
        'plan', v_membership.plan,
        'ai_credits_total', v_membership.ai_credits_total,
        'ai_credits_used', v_membership.ai_credits_used,
        'ai_credits_reset_at', v_membership.ai_credits_reset_at
      )
    );
  END IF;

  -- 3. Extract user information from auth.users
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_meta
  FROM auth.users
  WHERE id = v_user_id;

  v_company_name := COALESCE(
    NULLIF(TRIM(p_company_name), ''),
    NULLIF(TRIM(v_user_meta->>'company_name'), ''),
    NULLIF(TRIM(v_user_meta->>'full_name'), '') || '''s Workspace',
    'WorkPilot'
  );

  v_slug_base := regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g');
  v_slug_base := trim(both '-' from v_slug_base);
  IF v_slug_base = '' THEN
    v_slug_base := 'workspace';
  END IF;
  v_slug := v_slug_base || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 6);

  -- 4. Provision new workspace
  INSERT INTO public.workspaces (
    name,
    slug,
    billing_email,
    plan,
    ai_credits_total,
    ai_credits_used
  )
  VALUES (
    v_company_name,
    v_slug,
    v_user_email,
    'starter',
    10000,
    0
  )
  RETURNING id, name, slug, logo_url, color, plan, ai_credits_total, ai_credits_used, ai_credits_reset_at
  INTO v_workspace;

  -- 5. Add user as owner in workspace_members
  INSERT INTO public.workspace_members (
    workspace_id,
    user_id,
    email,
    role,
    status,
    joined_at
  )
  VALUES (
    v_workspace.id,
    v_user_id,
    COALESCE(v_user_email, 'user@workpilot.io'),
    'owner',
    'active',
    NOW()
  );

  -- 6. Initialize default AI agent
  INSERT INTO public.ai_agents (
    workspace_id,
    name,
    role_description,
    status,
    model,
    system_prompt
  )
  VALUES (
    v_workspace.id,
    'WorkPilot Assistant',
    'AI Business Operations Expert',
    'active',
    'gpt-4',
    'You are WorkPilot Assistant, a helpful and professional AI agent for WorkPilot.'
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'workspace_id', v_workspace.id,
    'workspace_name', v_workspace.name,
    'role', 'owner',
    'workspace', jsonb_build_object(
      'id', v_workspace.id,
      'name', v_workspace.name,
      'slug', v_workspace.slug,
      'logo_url', v_workspace.logo_url,
      'color', v_workspace.color,
      'plan', v_workspace.plan,
      'ai_credits_total', v_workspace.ai_credits_total,
      'ai_credits_used', v_workspace.ai_credits_used,
      'ai_credits_reset_at', v_workspace.ai_credits_reset_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_workspace(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_workspace(TEXT) TO authenticated;
