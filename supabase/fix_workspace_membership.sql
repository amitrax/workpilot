-- ============================================================
-- WorkPilot: Workspace Membership Diagnostic & Fix
-- Run this in the Supabase SQL Editor (it runs as service role)
-- ============================================================
-- Target user:
--   auth.uid() = 7bd9fc11-f1a6-4487-a1cc-baaae24362f9
--   email      = amitmishra71202@gmail.com
-- ============================================================

DO $$
DECLARE
  v_user_id   UUID := '7bd9fc11-f1a6-4487-a1cc-baaae24362f9';
  v_email     TEXT := 'amitmishra71202@gmail.com';
  v_workspace_id  UUID;
  v_mem_id        UUID;
  v_row_count     INT;
BEGIN
  RAISE NOTICE '====================================================';
  RAISE NOTICE 'WorkPilot Workspace Membership Diagnostic & Fix';
  RAISE NOTICE 'User ID  : %', v_user_id;
  RAISE NOTICE 'Email    : %', v_email;
  RAISE NOTICE '====================================================';

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 1: Report workspace_members rows for this user_id
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 1: workspace_members by user_id ---';
  FOR v_mem_id, v_workspace_id IN
    SELECT id, workspace_id FROM public.workspace_members WHERE user_id = v_user_id
  LOOP
    RAISE NOTICE '  Found row: id=%, workspace_id=%', v_mem_id, v_workspace_id;
  END LOOP;
  SELECT COUNT(*) INTO v_row_count FROM public.workspace_members WHERE user_id = v_user_id;
  RAISE NOTICE '  Total rows by user_id: %', v_row_count;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 2: Report workspace_members rows for this email
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 2: workspace_members by email ---';
  FOR v_mem_id, v_workspace_id IN
    SELECT id, workspace_id FROM public.workspace_members WHERE lower(email) = lower(v_email)
  LOOP
    RAISE NOTICE '  Found row: id=%, workspace_id=%', v_mem_id, v_workspace_id;
  END LOOP;
  SELECT COUNT(*) INTO v_row_count FROM public.workspace_members WHERE lower(email) = lower(v_email);
  RAISE NOTICE '  Total rows by email: %', v_row_count;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 3: Report workspaces where billing_email matches
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 3: workspaces by billing_email ---';
  FOR v_workspace_id IN
    SELECT id FROM public.workspaces WHERE lower(billing_email) = lower(v_email)
  LOOP
    RAISE NOTICE '  Found workspace: id=%', v_workspace_id;
  END LOOP;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 4: Link any email-matched membership rows to this user_id
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 4: Linking email-matched rows to user_id ---';
  UPDATE public.workspace_members
  SET
    user_id   = v_user_id,
    status    = 'active',
    joined_at = COALESCE(joined_at, NOW()),
    updated_at = NOW()
  WHERE lower(email) = lower(v_email)
    AND (user_id IS NULL OR user_id <> v_user_id);
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RAISE NOTICE '  Linked % row(s) by email to user_id', v_row_count;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 5: If still no active membership, find or create a workspace
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 5: Ensure active membership exists ---';

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = v_user_id AND status = 'active'
    LIMIT 1
  ) THEN
    -- Try to reuse workspace that has billing_email for this user
    SELECT id INTO v_workspace_id
    FROM public.workspaces
    WHERE lower(billing_email) = lower(v_email)
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_workspace_id IS NOT NULL THEN
      RAISE NOTICE '  Found workspace % via billing_email. Inserting membership...', v_workspace_id;
      INSERT INTO public.workspace_members (workspace_id, user_id, email, role, status, joined_at)
      VALUES (v_workspace_id, v_user_id, v_email, 'owner', 'active', NOW())
      ON CONFLICT (workspace_id, user_id) DO UPDATE
        SET status    = 'active',
            email     = EXCLUDED.email,
            updated_at = NOW();
      RAISE NOTICE '  Membership upserted for workspace_id=%', v_workspace_id;

    ELSE
      -- Try to find any workspace linked to this user_id (any status)
      SELECT workspace_id INTO v_workspace_id
      FROM public.workspace_members
      WHERE user_id = v_user_id
      ORDER BY joined_at ASC NULLS LAST
      LIMIT 1;

      IF v_workspace_id IS NOT NULL THEN
        RAISE NOTICE '  Reusing existing workspace_id=% (activating membership)...', v_workspace_id;
        UPDATE public.workspace_members
          SET status = 'active', updated_at = NOW()
          WHERE workspace_id = v_workspace_id AND user_id = v_user_id;
      ELSE
        -- Provision a brand-new workspace
        RAISE NOTICE '  No workspace found at all. Provisioning new workspace...';
        INSERT INTO public.workspaces (name, slug, billing_email, plan, ai_credits_total, ai_credits_used)
        VALUES (
          'WorkPilot Workspace',
          'workpilot-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8),
          v_email,
          'starter',
          10000,
          0
        )
        RETURNING id INTO v_workspace_id;
        RAISE NOTICE '  Provisioned workspace_id=%', v_workspace_id;

        INSERT INTO public.workspace_members (workspace_id, user_id, email, role, status, joined_at)
        VALUES (v_workspace_id, v_user_id, v_email, 'owner', 'active', NOW());
        RAISE NOTICE '  Created owner membership for workspace_id=%', v_workspace_id;
      END IF;
    END IF;
  ELSE
    SELECT workspace_id INTO v_workspace_id
    FROM public.workspace_members
    WHERE user_id = v_user_id AND status = 'active'
    ORDER BY joined_at ASC NULLS LAST
    LIMIT 1;
    RAISE NOTICE '  Active membership already exists for workspace_id=%', v_workspace_id;
  END IF;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 6: Verify get_or_create_workspace function exists
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 6: Check get_or_create_workspace function ---';
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_or_create_workspace'
  ) THEN
    RAISE NOTICE '  get_or_create_workspace EXISTS';
  ELSE
    RAISE NOTICE '  WARNING: get_or_create_workspace does NOT exist! Creating it now...';

    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.get_or_create_workspace(
        p_company_name TEXT DEFAULT NULL
      )
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      DECLARE
        v_user_id       UUID;
        v_user_email    TEXT;
        v_workspace_id  UUID;
        v_workspace_name TEXT;
        v_role          TEXT;
      BEGIN
        v_user_id    := auth.uid();
        v_user_email := (SELECT email FROM auth.users WHERE id = v_user_id LIMIT 1);
        IF v_user_id IS NULL THEN
          RAISE EXCEPTION 'Not authenticated';
        END IF;

        SELECT wm.workspace_id, wm.role, w.name
        INTO v_workspace_id, v_role, v_workspace_name
        FROM public.workspace_members wm
        JOIN public.workspaces w ON w.id = wm.workspace_id
        WHERE wm.user_id = v_user_id AND wm.status = 'active'
        ORDER BY wm.joined_at ASC NULLS LAST
        LIMIT 1;

        IF v_workspace_id IS NOT NULL THEN
          RETURN json_build_object('workspace_id', v_workspace_id, 'workspace_name', v_workspace_name, 'role', v_role);
        END IF;

        UPDATE public.workspace_members
        SET user_id = v_user_id, status = 'active', joined_at = COALESCE(joined_at, NOW()), updated_at = NOW()
        WHERE lower(email) = lower(v_user_email)
          AND (user_id IS NULL OR user_id <> v_user_id)
        RETURNING workspace_id, role INTO v_workspace_id, v_role;

        IF v_workspace_id IS NOT NULL THEN
          SELECT name INTO v_workspace_name FROM public.workspaces WHERE id = v_workspace_id;
          RETURN json_build_object('workspace_id', v_workspace_id, 'workspace_name', v_workspace_name, 'role', v_role);
        END IF;

        INSERT INTO public.workspaces (name, slug, billing_email, plan, ai_credits_total, ai_credits_used)
        VALUES (
          COALESCE(p_company_name, 'WorkPilot Workspace'),
          'workpilot-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8),
          v_user_email, 'starter', 10000, 0
        )
        RETURNING id, name INTO v_workspace_id, v_workspace_name;

        INSERT INTO public.workspace_members (workspace_id, user_id, email, role, status, joined_at)
        VALUES (v_workspace_id, v_user_id, v_user_email, 'owner', 'active', NOW());

        RETURN json_build_object('workspace_id', v_workspace_id, 'workspace_name', v_workspace_name, 'role', 'owner');
      END;
      $body$;
    $func$;
    RAISE NOTICE '  get_or_create_workspace created';
  END IF;

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 7: Check create_conversation_in_workspace function
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- STEP 7: Check create_conversation_in_workspace function ---';
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_conversation_in_workspace'
  ) THEN
    RAISE NOTICE '  create_conversation_in_workspace EXISTS';
  ELSE
    RAISE NOTICE '  ERROR: create_conversation_in_workspace does NOT exist!';
  END IF;

  -- ────────────────────────────────────────────────────────────────────────────
  -- FINAL VERIFICATION
  -- ────────────────────────────────────────────────────────────────────────────
  RAISE NOTICE '--- FINAL VERIFICATION ---';
  SELECT wm.workspace_id INTO v_workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = v_user_id AND wm.status = 'active'
  LIMIT 1;

  IF v_workspace_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = v_workspace_id) THEN
      RAISE NOTICE 'SUCCESS: User has active workspace_id=% and it exists in workspaces table', v_workspace_id;
    ELSE
      RAISE NOTICE 'ERROR: workspace_id=% is in workspace_members but NOT in workspaces table!', v_workspace_id;
    END IF;
  ELSE
    RAISE NOTICE 'ERROR: User STILL has no active workspace membership after all steps!';
  END IF;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'Paste the workspace_id from above into your browser console to verify.';
  RAISE NOTICE '====================================================';
END $$;
