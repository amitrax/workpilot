-- ============================================================================
-- WorkPilot - Final Security Fix: RLS Recursion and Least-Privilege Policies
-- Migration: 20260907000000_fix_workspace_members_rls_recursion.sql
-- ============================================================================
--
-- SECURITY MODEL:
--   - All membership checks inside RLS policies use PL/pgSQL SECURITY DEFINER
--     helpers to prevent recursive RLS evaluation (PostgreSQL error 42P17).
--   - Workspace provisioning is handled by get_or_create_workspace() which is
--     defined in migrations 20260902000000 and 20260907000001. It is NOT
--     redefined here to avoid PostgreSQL error 42P13 (cannot change return type
--     of existing function) when applying this migration against a live database
--     that already has the function installed.
--   - Invitation claiming is handled by the NEW claim_workspace_invitation()
--     RPC defined in this file, replacing the previously vulnerable UPDATE
--     policy that relied on an unverified JWT email claim.
--   - Write access to AI Agents, Knowledge Base, and Automations is restricted
--     to workspace owners and admins only.
--   - RLS is never disabled on any table.
--   - No service-role key or secret is used in any frontend path.
--   - This migration is IDEMPOTENT: all DROPs use IF EXISTS.
-- ============================================================================

-- ============================================================================
-- READ-ONLY DIAGNOSTIC QUERY (run this in Supabase SQL Editor to inspect
-- the existing function's return type BEFORE applying this migration):
-- ============================================================================
--
-- SELECT
--   n.nspname                               AS schema,
--   p.proname                               AS function_name,
--   pg_get_function_arguments(p.oid)        AS arguments,
--   pg_get_function_result(p.oid)           AS return_type,
--   p.prosecdef                             AS security_definer,
--   p.proconfig                             AS config
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_or_create_workspace',
--     'claim_workspace_invitation',
--     'get_my_workspace_ids',
--     'get_my_admin_workspace_ids',
--     'is_workspace_member',
--     'is_workspace_admin'
--   )
-- ORDER BY p.proname;
-- ============================================================================


-- ============================================================================
-- SECTION 1: PL/pgSQL SECURITY DEFINER Helpers
-- ============================================================================
-- These functions execute with the definer's privileges (bypassing RLS on
-- workspace_members). They are the ONLY safe way to query workspace_members
-- from within an RLS policy on workspace_members itself, because PL/pgSQL
-- bodies are opaque to the query planner and cannot be inlined — which is
-- the root cause of the 42P17 recursion.
--
-- All four functions:
--   • Fix search_path = public  (prevents search-path hijacking)
--   • Revoke EXECUTE from PUBLIC before granting only to 'authenticated'
--   • Are declared STABLE

-- Helper 1: All active workspace IDs for the calling user
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

-- Helper 2: Active workspace IDs where the caller is owner or admin
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
    AND wm.role   IN ('owner', 'admin')
    AND wm.status = 'active';
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_admin_workspace_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_admin_workspace_ids() TO authenticated;

-- Helper 3: Boolean — is the caller an active member of a specific workspace?
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
      AND wm.user_id      = auth.uid()
      AND wm.status       = 'active'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;

-- Helper 4: Boolean — is the caller an owner/admin of a specific workspace?
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
      AND wm.user_id      = auth.uid()
      AND wm.role         IN ('owner', 'admin')
      AND wm.status       = 'active'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;


-- ============================================================================
-- SECTION 2: Secure Invitation Claim RPC — claim_workspace_invitation()
-- ============================================================================
-- NEW function (first definition — no 42P13 risk).
--
-- SECURITY: Replaces the previously vulnerable UPDATE policy:
--   USING  (user_id IS NULL AND lower(email) = lower(auth.jwt()->>'email'))
--   WITH CHECK (user_id = auth.uid())
--
-- PROBLEMS WITH THE OLD APPROACH:
--   1. auth.jwt()->>'email' is the raw JWT claim — NOT the verified email from
--      auth.users. A user with a crafted JWT could match any invitation row.
--   2. The WITH CHECK only enforces user_id = auth.uid() in the NEW row. It
--      does NOT prevent the caller from also changing role, workspace_id, or
--      status, because PostgreSQL RLS has no column-level enforcement.
--   3. A request body of {role: 'owner'} would pass both USING and WITH CHECK,
--      enabling privilege escalation to workspace owner.
--
-- SOLUTION:
--   • Reads the caller's verified email from auth.users (not the JWT claim).
--   • Matches the invitation strictly: email (verified), user_id IS NULL,
--     status = 'invited' only.
--   • Updates ONLY user_id, status, and joined_at. Never touches role or
--     workspace_id.
--   • The WHERE clause on UPDATE re-checks conditions to guard against TOCTOU
--     race conditions (two simultaneous claim attempts).
--   • Returns a JSONB summary; raises descriptive exceptions on failure.
--   • search_path = public prevents search-path hijacking.
--   • EXECUTE is restricted to 'authenticated' only.

CREATE OR REPLACE FUNCTION public.claim_workspace_invitation(
  p_workspace_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id            UUID;
  v_user_email         TEXT;
  v_email_confirmed_at TIMESTAMPTZ;
  v_member             RECORD;
BEGIN
  -- 1. Require authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Read the VERIFIED email from auth.users, NOT from the JWT claim.
  --    auth.users.email is set by Supabase Auth; email_confirmed_at ensures
  --    the user has actually verified ownership of this address.
  SELECT email, COALESCE(email_confirmed_at, confirmed_at)
  INTO v_user_email, v_email_confirmed_at
  FROM auth.users
  WHERE id = v_user_id;

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated user has no verified email address';
  END IF;

  IF v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'Email address must be confirmed before claiming a workspace invitation';
  END IF;

  -- 3. Locate the pending invitation. All conditions are server-side.
  --    a. email matches (verified source, case-insensitive)
  --    b. user_id IS NULL — invite has not already been claimed
  --    c. status = 'invited' — only pending invitations may be claimed
  --    d. if p_workspace_id is provided, match that specific workspace
  SELECT id, workspace_id, role, status, email
  INTO v_member
  FROM public.workspace_members
  WHERE lower(email) = lower(v_user_email)
    AND user_id      IS NULL
    AND status       = 'invited'
    AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_member.id IS NULL THEN
    RAISE EXCEPTION
      'No pending invitation found for this email address, or it has already been claimed';
  END IF;

  -- 4. Claim the invitation.
  --    ONLY user_id, status, and joined_at are updated.
  --    workspace_id and role are left exactly as the admin originally set them.
  --    The WHERE clause re-checks conditions to guard against TOCTOU races.
  UPDATE public.workspace_members
  SET user_id    = v_user_id,
      status     = 'active',
      joined_at  = NOW(),
      updated_at = NOW()
  WHERE id      = v_member.id
    AND user_id IS NULL
    AND status  = 'invited';

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Invitation claim failed: the invitation was already claimed by another request';
  END IF;

  -- 5. Return a safe summary (no secrets; workspace_id and role are what the
  --    caller already knows from the invitation email they received)
  RETURN jsonb_build_object(
    'claimed',      TRUE,
    'workspace_id', v_member.workspace_id,
    'role',         v_member.role,
    'status',       'active'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.claim_workspace_invitation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_workspace_invitation(UUID) TO authenticated;


-- ============================================================================
-- SECTION 3: workspace_members RLS Policies
-- ============================================================================
-- REMOVED dangerous policies (replaced by RPCs):
--   X "authenticated users can insert initial owner membership"
--       Replaced by: get_or_create_workspace() RPC (defined in 20260902000000
--       and 20260907000001). That RPC performs a global, RLS-bypassed existence
--       check before creating anything, preventing workspace hijacking.
--   X "invited users can claim their membership"
--       Replaced by: claim_workspace_invitation() RPC (Section 2 above). That
--       RPC reads the verified email from auth.users and only updates user_id,
--       status, and joined_at — never role or workspace_id.
--
-- INSERT and UPDATE policies below allow ONLY owner/admin operations.
-- Self-provisioning and invitation claiming MUST go through the RPCs.

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Dynamic clean-sweep of all existing policies across all affected tables.
-- In PostgreSQL, policies for the same command combine using boolean OR.
-- Dropping all existing policies dynamically ensures no legacy, typoed,
-- or permissive UI-generated policy remains to bypass security boundaries.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'workspaces',
        'workspace_members',
        'ai_agents',
        'knowledge_base',
        'automations',
        'automation_runs',
        'conversations',
        'messages',
        'leads',
        'customers',
        'customer_activities',
        'appointments',
        'integrations',
        'notifications'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "workspace_members: members can view teammates"                              ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can manage team"                           ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: users can see their own row"                             ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: authenticated users can insert own membership"           ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: authenticated users can insert initial owner membership" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: invited users can claim their membership"                ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can insert team"                           ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can update team"                           ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members: owners/admins can delete team"                           ON public.workspace_members;

-- SELECT 3a: Every authenticated user can always see their own membership row.
-- Safe from recursion: user_id = auth.uid() is a direct column comparison.
CREATE POLICY "workspace_members: users can see their own row"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT 3b: Active workspace members can view their teammates.
-- Non-recursive: uses the SECURITY DEFINER helper (Section 1) instead of
-- a direct subquery on workspace_members from within workspace_members policy.
CREATE POLICY "workspace_members: members can view teammates"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- INSERT 3c: Only owners/admins may add new members (create invitation rows).
-- There is intentionally NO self-insert policy.
-- New users must go through get_or_create_workspace() (Section 2 of 000001).
CREATE POLICY "workspace_members: owners/admins can insert team"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

-- UPDATE 3d: Only owners/admins may update team member records.
-- There is intentionally NO self-claim policy.
-- Invitation claiming must go through claim_workspace_invitation() (Section 2).
CREATE POLICY "workspace_members: owners/admins can update team"
  ON public.workspace_members FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

-- DELETE 3e: Only owners/admins may remove team members.
CREATE POLICY "workspace_members: owners/admins can delete team"
  ON public.workspace_members FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));


-- ============================================================================
-- SECTION 4: workspaces Policies
-- ============================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces: members can view their workspace"         ON public.workspaces;
DROP POLICY IF EXISTS "workspaces: owners/admins can update their workspace" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces: authenticated users can insert workspace" ON public.workspaces;

CREATE POLICY "workspaces: members can view their workspace"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "workspaces: owners/admins can update their workspace"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING    (id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (id IN (SELECT public.get_my_admin_workspace_ids()));

-- NOTE ON WORKSPACE INSERTION (Preventing Orphaned Workspaces):
-- Direct table INSERT on public.workspaces by authenticated users is intentionally
-- NOT permitted. An unrestricted INSERT policy (e.g. WITH CHECK (auth.uid() IS NOT NULL))
-- bypasses workspace_members creation and leads to orphaned workspaces without an owner.
-- All workspace provisioning MUST go through the SECURITY DEFINER RPC
-- public.get_or_create_workspace() (defined in migrations 20260902000000 / 20260907000001),
-- which atomically creates the workspace and assigns the caller as 'owner' in
-- public.workspace_members in a single transaction.


-- ============================================================================
-- SECTION 5: AI Agents Policies (Least Privilege)
-- ============================================================================
-- Read: all active workspace members.
-- Write (INSERT/UPDATE/DELETE): workspace owners and admins ONLY.

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_agents: members can view their workspace agents" ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: admins/owners can manage agents"         ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: members can insert workspace agents"     ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: members can update workspace agents"     ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: admins/owners can insert agents"         ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: admins/owners can update agents"         ON public.ai_agents;
DROP POLICY IF EXISTS "ai_agents: admins/owners can delete agents"         ON public.ai_agents;

CREATE POLICY "ai_agents: members can view their workspace agents"
  ON public.ai_agents FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "ai_agents: admins/owners can insert agents"
  ON public.ai_agents FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "ai_agents: admins/owners can update agents"
  ON public.ai_agents FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "ai_agents: admins/owners can delete agents"
  ON public.ai_agents FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));


-- ============================================================================
-- SECTION 6: Knowledge Base Policies (Least Privilege)
-- ============================================================================
-- Read: all active workspace members.
-- Write (INSERT/UPDATE/DELETE): workspace owners and admins ONLY.

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_base: members can view"         ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: admins/owners can manage" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: members can insert"       ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: members can update"       ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: members can delete"       ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: admins/owners can insert" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: admins/owners can update" ON public.knowledge_base;
DROP POLICY IF EXISTS "knowledge_base: admins/owners can delete" ON public.knowledge_base;

CREATE POLICY "knowledge_base: members can view"
  ON public.knowledge_base FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "knowledge_base: admins/owners can insert"
  ON public.knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "knowledge_base: admins/owners can update"
  ON public.knowledge_base FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "knowledge_base: admins/owners can delete"
  ON public.knowledge_base FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));


-- ============================================================================
-- SECTION 7: Automations and Automation Runs Policies (Least Privilege)
-- ============================================================================
-- Automation definitions: read for all members, write for owners/admins only.
-- Automation run logs: all active members may read and record executions.

ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automations: members can view workspace automations"   ON public.automations;
DROP POLICY IF EXISTS "automations: admins/owners can manage automations"     ON public.automations;
DROP POLICY IF EXISTS "automations: members can insert workspace automations" ON public.automations;
DROP POLICY IF EXISTS "automations: members can update workspace automations" ON public.automations;
DROP POLICY IF EXISTS "automations: members can delete workspace automations" ON public.automations;
DROP POLICY IF EXISTS "automations: admins/owners can insert automations"     ON public.automations;
DROP POLICY IF EXISTS "automations: admins/owners can update automations"     ON public.automations;
DROP POLICY IF EXISTS "automations: admins/owners can delete automations"     ON public.automations;

CREATE POLICY "automations: members can view workspace automations"
  ON public.automations FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "automations: admins/owners can insert automations"
  ON public.automations FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "automations: admins/owners can update automations"
  ON public.automations FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

CREATE POLICY "automations: admins/owners can delete automations"
  ON public.automations FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_runs: members can view"   ON public.automation_runs;
DROP POLICY IF EXISTS "automation_runs: members can insert" ON public.automation_runs;
DROP POLICY IF EXISTS "automation_runs: members can update" ON public.automation_runs;

CREATE POLICY "automation_runs: members can view"
  ON public.automation_runs FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "automation_runs: members can insert"
  ON public.automation_runs FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "automation_runs: members can update"
  ON public.automation_runs FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 8: Conversations and Messages Policies
-- ============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations: members can view workspace conversations"  ON public.conversations;
DROP POLICY IF EXISTS "conversations: agents and above can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: agents and above can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "conversations: members can insert conversations"          ON public.conversations;
DROP POLICY IF EXISTS "conversations: members can update conversations"          ON public.conversations;
DROP POLICY IF EXISTS "conversations: admins/owners can delete conversations"   ON public.conversations;

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
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: admins/owners can delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages: members can view workspace messages"   ON public.messages;
DROP POLICY IF EXISTS "messages: agents and above can insert messages"  ON public.messages;
DROP POLICY IF EXISTS "messages: senders can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "messages: members can insert messages"           ON public.messages;
DROP POLICY IF EXISTS "messages: members can update messages"           ON public.messages;

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
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 9: Leads and Customers Policies
-- ============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads: members can view workspace leads"  ON public.leads;
DROP POLICY IF EXISTS "leads: agents and above can insert leads" ON public.leads;
DROP POLICY IF EXISTS "leads: agents and above can update leads" ON public.leads;
DROP POLICY IF EXISTS "leads: admins/owners can delete leads"   ON public.leads;

CREATE POLICY "leads: members can view workspace leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: agents and above can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: agents and above can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: admins/owners can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers: members can view workspace customers"  ON public.customers;
DROP POLICY IF EXISTS "customers: agents and above can insert customers" ON public.customers;
DROP POLICY IF EXISTS "customers: agents and above can update customers" ON public.customers;
DROP POLICY IF EXISTS "customers: admins/owners can delete customers"   ON public.customers;
DROP POLICY IF EXISTS "customers: members can insert customers"          ON public.customers;
DROP POLICY IF EXISTS "customers: members can update customers"          ON public.customers;

CREATE POLICY "customers: members can view workspace customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: agents and above can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: agents and above can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: admins/owners can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customer_activities: members can view"            ON public.customer_activities;
DROP POLICY IF EXISTS "customer_activities: agents and above can insert" ON public.customer_activities;
DROP POLICY IF EXISTS "customer_activities: members can insert"          ON public.customer_activities;

CREATE POLICY "customer_activities: members can view"
  ON public.customer_activities FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customer_activities: members can insert"
  ON public.customer_activities FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 10: Appointments, Integrations and Notifications
-- ============================================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments: members can view workspace appointments"  ON public.appointments;
DROP POLICY IF EXISTS "appointments: agents and above can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments: agents and above can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments: admins/owners can delete appointments"   ON public.appointments;

CREATE POLICY "appointments: members can view workspace appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: agents and above can insert appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: agents and above can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: admins/owners can delete appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integrations: members can view workspace integrations" ON public.integrations;
DROP POLICY IF EXISTS "integrations: admins/owners can manage integrations"   ON public.integrations;

CREATE POLICY "integrations: members can view workspace integrations"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "integrations: admins/owners can manage integrations"
  ON public.integrations FOR ALL
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: users can only see their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications: users can mark their notifications as read" ON public.notifications;
DROP POLICY IF EXISTS "notifications: service role can insert notifications"      ON public.notifications;
DROP POLICY IF EXISTS "notifications: admins/owners can manage notifications"     ON public.notifications;

CREATE POLICY "notifications: users can only see their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications: users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications: admins/owners can manage notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING    (workspace_id IN (SELECT public.get_my_admin_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.get_my_admin_workspace_ids()));


-- ============================================================================
-- READ-ONLY POST-MIGRATION VERIFICATION QUERIES
-- Run these in Supabase SQL Editor AFTER applying this migration to confirm
-- all policies, helper functions, and security boundaries are active:
-- ============================================================================
--
-- 1. Verify RLS is enabled on all tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'workspaces', 'workspace_members', 'ai_agents', 'knowledge_base',
--     'automations', 'automation_runs', 'conversations', 'messages',
--     'leads', 'customers', 'customer_activities', 'appointments',
--     'integrations', 'notifications'
--   )
-- ORDER BY tablename;
--
-- 2. Verify all active policies and their commands:
-- SELECT
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual       AS using_expression,
--   with_check AS with_check_expression
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd, policyname;
--
-- 3. Confirm that NO permissive legacy insert/claim policies exist:
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     policyname ILIKE '%authenticated users can insert workspace%'
--     OR policyname ILIKE '%authenticated users can insert own membership%'
--     OR policyname ILIKE '%authenticated users can insert initial owner membership%'
--     OR policyname ILIKE '%invited users can claim their membership%'
--   );
-- (Expected result: 0 rows)
--
-- 4. Confirm helper functions and RPC signatures:
-- SELECT
--   p.proname                        AS function_name,
--   pg_get_function_arguments(p.oid) AS arguments,
--   pg_get_function_result(p.oid)    AS return_type,
--   p.prosecdef                      AS is_security_definer,
--   p.proconfig                      AS config
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_or_create_workspace',
--     'claim_workspace_invitation',
--     'get_my_workspace_ids',
--     'get_my_admin_workspace_ids',
--     'is_workspace_member',
--     'is_workspace_admin'
--   )
-- ORDER BY p.proname;
-- ============================================================================

-- ============================================================================
-- END OF MIGRATION
-- NOT APPLIED - Audit and review only.
-- To apply: paste this file into the Supabase SQL Editor for project
-- vdtlkzuonmeavelwtmqe and click Run.
-- ============================================================================
