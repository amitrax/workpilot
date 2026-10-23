-- ============================================================================
-- WorkPilot — Complete Workspace Provisioning, Helper Functions, and RLS Fix
-- Migration: 20260907000001_conversations_rls_and_provisioning.sql
-- ============================================================================

-- ── 1. PL/pgSQL SECURITY DEFINER Helpers (Eliminates RLS Recursion) ──────────

-- Helper 1: get_my_workspace_ids()
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT wm.workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = auth.uid()
    AND wm.status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_workspace_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_workspace_ids() TO authenticated;

-- Helper 2: get_my_admin_workspace_ids()
CREATE OR REPLACE FUNCTION public.get_my_admin_workspace_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT wm.workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
    AND wm.status = 'active';
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_admin_workspace_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_admin_workspace_ids() TO authenticated;

-- Helper 3: is_workspace_member()
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;

-- Helper 4: is_workspace_admin()
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
      AND wm.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- ── 2. Atomic Workspace Provisioning Function (Deterministic Resolution) ────

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

  -- 2. Extract user email and metadata from auth.users
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_meta
  FROM auth.users
  WHERE id = v_user_id;

  -- 3. Check for existing active workspace membership by user_id
  SELECT wm.workspace_id, wm.role, wm.status, w.name, w.slug, w.logo_url, w.color, w.plan, w.ai_credits_total, w.ai_credits_used, w.ai_credits_reset_at
  INTO v_membership
  FROM public.workspace_members wm
  JOIN public.workspaces w ON w.id = wm.workspace_id
  WHERE wm.user_id = v_user_id
    AND wm.status = 'active'
  ORDER BY wm.joined_at ASC NULLS LAST
  LIMIT 1;

  -- 4. If not found by user_id, check if an invite / seed row exists by email and link it
  IF v_membership.workspace_id IS NULL AND v_user_email IS NOT NULL THEN
    SELECT wm.workspace_id, wm.role, wm.status, w.name, w.slug, w.logo_url, w.color, w.plan, w.ai_credits_total, w.ai_credits_used, w.ai_credits_reset_at
    INTO v_membership
    FROM public.workspace_members wm
    JOIN public.workspaces w ON w.id = wm.workspace_id
    WHERE lower(wm.email) = lower(v_user_email)
    ORDER BY wm.created_at ASC
    LIMIT 1;

    IF v_membership.workspace_id IS NOT NULL THEN
      -- Link user_id and activate membership
      UPDATE public.workspace_members
      SET user_id = v_user_id,
          status = 'active',
          joined_at = COALESCE(joined_at, NOW()),
          updated_at = NOW()
      WHERE workspace_id = v_membership.workspace_id
        AND lower(email) = lower(v_user_email);
    END IF;
  END IF;

  -- 5. If still not found, check if a workspace exists with matching billing_email
  IF v_membership.workspace_id IS NULL AND v_user_email IS NOT NULL THEN
    SELECT w.id AS workspace_id, 'owner'::public.member_role AS role, 'active'::public.member_status AS status,
           w.name, w.slug, w.logo_url, w.color, w.plan, w.ai_credits_total, w.ai_credits_used, w.ai_credits_reset_at
    INTO v_membership
    FROM public.workspaces w
    WHERE lower(w.billing_email) = lower(v_user_email)
    ORDER BY w.created_at ASC
    LIMIT 1;

    IF v_membership.workspace_id IS NOT NULL THEN
      INSERT INTO public.workspace_members (
        workspace_id,
        user_id,
        email,
        role,
        status,
        joined_at
      )
      VALUES (
        v_membership.workspace_id,
        v_user_id,
        v_user_email,
        'owner',
        'active',
        NOW()
      )
      ON CONFLICT (workspace_id, email) DO UPDATE
      SET user_id = v_user_id,
          status = 'active',
          joined_at = COALESCE(public.workspace_members.joined_at, NOW()),
          updated_at = NOW();
    END IF;
  END IF;

  -- If membership found, return workspace details
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

  -- 6. Otherwise provision a new workspace
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

  -- Insert owner membership
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

  -- Initialize default AI agent
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

-- ── 3. Atomic Conversation & Initial Message Creation Function ───────────────

CREATE OR REPLACE FUNCTION public.create_conversation_in_workspace(
  p_workspace_id UUID,
  p_contact_name TEXT,
  p_contact_company TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT 'whatsapp',
  p_initial_message TEXT DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN;
  v_conv RECORD;
  v_channel_enum public.conversation_channel;
  v_now TIMESTAMPTZ := NOW();
  v_last_msg TEXT;
BEGIN
  -- 1. Authenticate caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Verify active workspace membership
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = v_user_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Access denied: user is not an active member of workspace %', p_workspace_id;
  END IF;

  -- 3. Resolve channel enum safely
  BEGIN
    v_channel_enum := lower(p_channel)::public.conversation_channel;
  EXCEPTION WHEN OTHERS THEN
    v_channel_enum := 'whatsapp'::public.conversation_channel;
  END;

  v_last_msg := COALESCE(NULLIF(TRIM(p_initial_message), ''), 'Conversation started');

  -- 4. Insert conversation record
  INSERT INTO public.conversations (
    workspace_id,
    lead_id,
    customer_id,
    contact_name,
    contact_company,
    contact_phone,
    contact_email,
    channel,
    status,
    last_message,
    last_message_at,
    created_at,
    updated_at
  )
  VALUES (
    p_workspace_id,
    p_lead_id,
    p_customer_id,
    COALESCE(NULLIF(TRIM(p_contact_name), ''), 'New Contact'),
    NULLIF(TRIM(p_contact_company), ''),
    NULLIF(TRIM(p_contact_phone), ''),
    NULLIF(TRIM(p_contact_email), ''),
    v_channel_enum,
    'open',
    v_last_msg,
    v_now,
    v_now,
    v_now
  )
  RETURNING *
  INTO v_conv;

  -- 5. Insert initial message if provided
  IF p_initial_message IS NOT NULL AND TRIM(p_initial_message) <> '' THEN
    INSERT INTO public.messages (
      workspace_id,
      conversation_id,
      sender_type,
      sender_name,
      content,
      is_ai_generated,
      sent_at,
      created_at
    )
    VALUES (
      p_workspace_id,
      v_conv.id,
      'customer',
      COALESCE(NULLIF(TRIM(p_contact_name), ''), 'Contact'),
      TRIM(p_initial_message),
      FALSE,
      v_now,
      v_now
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_conv.id,
    'workspace_id', v_conv.workspace_id,
    'lead_id', v_conv.lead_id,
    'customer_id', v_conv.customer_id,
    'contact_name', v_conv.contact_name,
    'contact_company', v_conv.contact_company,
    'contact_phone', v_conv.contact_phone,
    'contact_email', v_conv.contact_email,
    'channel', v_conv.channel,
    'status', v_conv.status,
    'last_message', v_conv.last_message,
    'last_message_at', v_conv.last_message_at,
    'unread_count', v_conv.unread_count,
    'created_at', v_conv.created_at,
    'updated_at', v_conv.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_conversation_in_workspace(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_conversation_in_workspace(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;

-- ── 4. Rebuild workspaces & workspace_members RLS policies ───────────────────
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspaces: members can view their workspace" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces: owners/admins can update their workspace" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces: authenticated users can insert workspace" ON public.workspaces;

CREATE POLICY "workspaces: members can view their workspace"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "workspaces: owners/admins can update their workspace"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "workspaces: authenticated users can insert workspace"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspace_members: members can view teammates" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: users can see their own row" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: authenticated users can insert own membership" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can insert team" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can update team" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can delete team" ON public.workspace_members;

CREATE POLICY "workspace_members: users can see their own row"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "workspace_members: members can view teammates"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "workspace_members: authenticated users can insert own membership"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workspace_members: owners/admins can insert team"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "workspace_members: owners/admins can update team"
  ON public.workspace_members FOR UPDATE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "workspace_members: owners/admins can delete team"
  ON public.workspace_members FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

-- ── 5. Rebuild conversations & messages RLS policies ─────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations: members can view workspace conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: agents and above can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: members can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: agents and above can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: members can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: admins/owners can delete conversations" ON public.conversations;

CREATE POLICY "conversations: members can view workspace conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: members can insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: members can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: admins/owners can delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages: members can view workspace messages" ON public.messages;
DROP POLICY IF EXISTS "messages: agents and above can insert messages" ON public.messages;
DROP POLICY IF EXISTS "messages: members can insert messages" ON public.messages;
DROP POLICY IF EXISTS "messages: senders can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "messages: members can update messages" ON public.messages;

CREATE POLICY "messages: members can view workspace messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "messages: members can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "messages: members can update messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- ── 6. One-Time Data Reconciliation for Existing Users ───────────────────────
DO $$
DECLARE
  v_u RECORD;
  v_w_id UUID;
BEGIN
  FOR v_u IN (SELECT id, email, raw_user_meta_data FROM auth.users) LOOP
    -- Step A: Link any workspace_members rows where email matches
    UPDATE public.workspace_members
    SET user_id = v_u.id,
        status = 'active',
        joined_at = COALESCE(joined_at, NOW()),
        updated_at = NOW()
    WHERE lower(email) = lower(v_u.email)
      AND (user_id IS NULL OR user_id <> v_u.id);

    -- Step B: If user still has no active membership, check workspaces by billing_email
    IF NOT EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE user_id = v_u.id AND status = 'active'
    ) THEN
      SELECT id INTO v_w_id
      FROM public.workspaces
      WHERE lower(billing_email) = lower(v_u.email)
      ORDER BY created_at ASC
      LIMIT 1;

      IF v_w_id IS NOT NULL THEN
        INSERT INTO public.workspace_members (
          workspace_id, user_id, email, role, status, joined_at
        )
        VALUES (
          v_w_id, v_u.id, v_u.email, 'owner', 'active', NOW()
        )
        ON CONFLICT (workspace_id, email) DO UPDATE
        SET user_id = v_u.id, status = 'active', joined_at = COALESCE(public.workspace_members.joined_at, NOW());
      ELSE
        -- Step C: Provision a clean workspace for this user
        INSERT INTO public.workspaces (
          name, slug, billing_email, plan, ai_credits_total, ai_credits_used
        )
        VALUES (
          COALESCE(v_u.raw_user_meta_data->>'company_name', 'WorkPilot Workspace'),
          'workpilot-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8),
          v_u.email,
          'starter',
          10000,
          0
        )
        RETURNING id INTO v_w_id;

        INSERT INTO public.workspace_members (
          workspace_id, user_id, email, role, status, joined_at
        )
        VALUES (
          v_w_id, v_u.id, v_u.email, 'owner', 'active', NOW()
        );
      END IF;
    END IF;
  END LOOP;
END $$;

