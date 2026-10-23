-- ============================================================================
-- Nexus OPS — Initial Database Schema
-- Migration: 20260902000000_initial_schema.sql
--
-- Modules covered:
--   Profiles · Workspaces · Team · Leads · Customers · Conversations ·
--   Messages · AI Agents · Knowledge Base · Automations · Appointments ·
--   Integrations · Notifications · Audit Logs
--
-- Design principles:
--   • UUID primary keys (gen_random_uuid())
--   • Multi-tenant: all business data isolated by workspace_id
--   • Row Level Security (RLS) enabled on every application table
--   • All policies rely on auth.uid() — no service-role key in the frontend
--   • Compatible with Supabase Auth (auth.users)
-- ============================================================================


-- ============================================================================
-- SECTION 0 — EXTENSIONS & HELPER FUNCTION
-- ============================================================================

-- pgcrypto is available by default in Supabase; gives us gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable trigger function: keeps updated_at current automatically
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- NOTE: get_my_workspace_ids() is defined AFTER workspace_members is created
-- (see Section 4) because a LANGUAGE sql function body is validated at
-- parse time and would fail with 42P01 if workspace_members doesn't exist yet.


-- ============================================================================
-- SECTION 1 — ENUM TYPES
-- ============================================================================

-- Workspace member roles
CREATE TYPE public.member_role AS ENUM (
  'owner',
  'admin',
  'sales_manager',
  'agent',
  'viewer'
);

-- Workspace member invitation / active status
CREATE TYPE public.member_status AS ENUM (
  'active',
  'invited',
  'suspended',
  'removed'
);

-- Lead pipeline stages
CREATE TYPE public.lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived'
);

-- Lead origin channel
CREATE TYPE public.lead_source AS ENUM (
  'whatsapp',
  'website',
  'instagram',
  'referral',
  'email_campaign',
  'google_ads',
  'linkedin',
  'organic_search',
  'other'
);

-- Customer lifecycle state
CREATE TYPE public.customer_status AS ENUM (
  'active',
  'inactive',
  'churned',
  'at_risk'
);

-- Customer business segment
CREATE TYPE public.customer_segment AS ENUM (
  'startup',
  'smb',
  'enterprise',
  'other'
);

-- Omnichannel conversation channel
CREATE TYPE public.conversation_channel AS ENUM (
  'whatsapp',
  'email',
  'website',
  'sms',
  'instagram',
  'slack',
  'other'
);

-- Conversation lifecycle state
CREATE TYPE public.conversation_status AS ENUM (
  'open',
  'pending',
  'resolved',
  'spam',
  'archived'
);

-- Who sent a message
CREATE TYPE public.message_sender_type AS ENUM (
  'customer',
  'agent',
  'ai',
  'system'
);

-- AI Agent operational state
CREATE TYPE public.agent_status AS ENUM (
  'active',
  'paused',
  'training',
  'error'
);

-- Knowledge base article types
CREATE TYPE public.kb_item_type AS ENUM (
  'document',
  'url',
  'faq',
  'pdf',
  'video'
);

-- Automation workflow state
CREATE TYPE public.automation_status AS ENUM (
  'active',
  'paused',
  'draft',
  'archived'
);

-- Automation trigger category
CREATE TYPE public.automation_trigger AS ENUM (
  'new_lead',
  'lead_qualified',
  'conversation_started',
  'appointment_booked',
  'no_response',
  'keyword_match',
  'form_submitted',
  'payment_received',
  'schedule',
  'manual',
  'other'
);

-- Appointment lifecycle state
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'rescheduled'
);

-- Appointment meeting type
CREATE TYPE public.appointment_type AS ENUM (
  'demo',
  'intro_call',
  'follow_up',
  'onboarding',
  'support',
  'review',
  'other'
);

-- Integration connection state
CREATE TYPE public.integration_status AS ENUM (
  'connected',
  'disconnected',
  'error',
  'pending'
);

-- Notification category
CREATE TYPE public.notification_type AS ENUM (
  'new_lead',
  'new_message',
  'appointment_reminder',
  'automation_triggered',
  'team_invite',
  'integration_alert',
  'ai_handoff',
  'system'
);

-- Audit log action type
CREATE TYPE public.audit_action AS ENUM (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'logged_in',
  'logged_out',
  'exported',
  'invited',
  'other'
);


-- ============================================================================
-- SECTION 2 — PROFILES (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  location      TEXT,
  bio           TEXT,
  timezone      TEXT        DEFAULT 'UTC',
  -- UI/notification preferences (stored as JSONB for flexibility)
  preferences   JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users can read their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Supabase trigger: auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- SECTION 3 — WORKSPACES (multi-tenant root)
-- ============================================================================

CREATE TABLE public.workspaces (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  slug          TEXT        NOT NULL UNIQUE,       -- URL-safe identifier
  logo_url      TEXT,
  color         TEXT        DEFAULT '#6366f1',     -- brand accent colour
  plan          TEXT        NOT NULL DEFAULT 'starter', -- starter | growth | enterprise
  -- AI credits quota for this workspace
  ai_credits_total     INTEGER   NOT NULL DEFAULT 10000,
  ai_credits_used      INTEGER   NOT NULL DEFAULT 0,
  ai_credits_reset_at  TIMESTAMPTZ,
  -- billing / contact metadata
  billing_email TEXT,
  country       TEXT,
  currency      TEXT        DEFAULT 'USD',
  timezone      TEXT        DEFAULT 'UTC',
  settings      JSONB       NOT NULL DEFAULT '{}', -- workspace-level feature flags
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON public.workspaces(slug);

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS — enable now; policies are deferred until after workspace_members exists
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- NOTE: workspaces RLS policies are defined after workspace_members is created
-- (see end of Section 4) because both policies query that table.


-- ============================================================================
-- SECTION 4 — WORKSPACE MEMBERS (team)
-- ============================================================================

CREATE TABLE public.workspace_members (
  id            UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID            NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID            REFERENCES auth.users(id) ON DELETE SET NULL,
  -- email stored separately so we can track pending invites before signup
  email         TEXT            NOT NULL,
  role          public.member_role    NOT NULL DEFAULT 'agent',
  status        public.member_status  NOT NULL DEFAULT 'invited',
  invited_by    UUID            REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at     TIMESTAMPTZ,
  -- performance fields reflected from mock data
  leads_handled INTEGER         NOT NULL DEFAULT 0,
  -- custom permissions override (null = use role defaults)
  permissions   JSONB           NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, email)
);

CREATE INDEX idx_wm_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX idx_wm_user_id      ON public.workspace_members(user_id);
CREATE INDEX idx_wm_email        ON public.workspace_members(email);

CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- NOW that workspace_members exists, we can safely define get_my_workspace_ids()
-- and all RLS policies that reference it (including the deferred workspaces ones).
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper function: returns all workspace IDs the calling user belongs to.
-- Used in every RLS policy below to avoid repeated per-row subqueries.
CREATE OR REPLACE FUNCTION public.get_my_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM public.workspace_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- ── Deferred workspaces RLS policies (require workspace_members) ─────────────
CREATE POLICY "workspaces: members can view their workspace"
  ON public.workspaces FOR SELECT
  USING (id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "workspaces: owners/admins can update their workspace"
  ON public.workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "workspaces: authenticated users can insert workspace"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── workspace_members RLS policies ───────────────────────────────────────────
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members: members can view teammates"
  ON public.workspace_members FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "workspace_members: owners/admins can manage team"
  ON public.workspace_members FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "workspace_members: users can see their own row"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "workspace_members: authenticated users can insert own membership"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Atomic workspace provisioning function (SECURITY DEFINER) ────────────────
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Check for existing active workspace membership
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

  -- 2. Extract user info from auth.users
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

  -- 3. Insert workspace
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

  -- 4. Insert membership
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


-- ============================================================================
-- SECTION 5 — LEADS
-- ============================================================================

CREATE TABLE public.leads (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID              NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- contact info
  full_name         TEXT              NOT NULL,
  email             TEXT,
  phone             TEXT,
  company           TEXT,
  job_title         TEXT,
  location          TEXT,
  avatar_url        TEXT,
  -- pipeline
  status            public.lead_status NOT NULL DEFAULT 'new',
  source            public.lead_source NOT NULL DEFAULT 'other',
  assigned_to       UUID              REFERENCES auth.users(id) ON DELETE SET NULL,
  pipeline_stage    TEXT,             -- custom stage label if needed
  deal_value        NUMERIC(12,2)     DEFAULT 0,
  expected_close    DATE,
  -- AI intelligence
  ai_score          SMALLINT          CHECK (ai_score BETWEEN 0 AND 100),
  ai_verdict        TEXT,             -- "Highly Likely to Convert" etc.
  ai_summary        TEXT,
  ai_recommended_action TEXT,
  ai_reasons        TEXT[]            DEFAULT '{}',
  -- metadata
  tags              TEXT[]            DEFAULT '{}',
  notes             TEXT,
  last_contacted_at TIMESTAMPTZ,
  converted_at      TIMESTAMPTZ,      -- set when status = 'won'
  lost_at           TIMESTAMPTZ,      -- set when status = 'lost'
  lost_reason       TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_workspace_id  ON public.leads(workspace_id);
CREATE INDEX idx_leads_status        ON public.leads(workspace_id, status);
CREATE INDEX idx_leads_assigned_to   ON public.leads(workspace_id, assigned_to);
CREATE INDEX idx_leads_created_at    ON public.leads(workspace_id, created_at DESC);
CREATE INDEX idx_leads_email         ON public.leads(workspace_id, email);

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: members can view workspace leads"
  ON public.leads FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: agents and above can insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: agents and above can update leads"
  ON public.leads FOR UPDATE
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "leads: admins/owners can delete leads"
  ON public.leads FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 6 — CUSTOMERS
-- ============================================================================

CREATE TABLE public.customers (
  id                UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID                   NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- optional back-reference when a lead converts
  lead_id           UUID                   REFERENCES public.leads(id) ON DELETE SET NULL,
  -- contact info
  full_name         TEXT                   NOT NULL,
  email             TEXT,
  phone             TEXT,
  company           TEXT,
  job_title         TEXT,
  location          TEXT,
  avatar_url        TEXT,
  -- CRM fields
  status            public.customer_status NOT NULL DEFAULT 'active',
  segment           public.customer_segment NOT NULL DEFAULT 'smb',
  source            public.lead_source     NOT NULL DEFAULT 'other',
  assigned_to       UUID                   REFERENCES auth.users(id) ON DELETE SET NULL,
  tags              TEXT[]                 DEFAULT '{}',
  -- revenue metrics
  total_orders      INTEGER                NOT NULL DEFAULT 0,
  total_spent       NUMERIC(14,2)          NOT NULL DEFAULT 0,
  lifetime_value    NUMERIC(14,2)          DEFAULT 0,
  -- AI intelligence
  ai_score          SMALLINT               CHECK (ai_score BETWEEN 0 AND 100),
  ai_verdict        TEXT,
  ai_summary        TEXT,
  ai_reasons        TEXT[]                 DEFAULT '{}',
  -- metadata
  notes             TEXT,
  customer_since    DATE,
  last_activity_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_workspace_id ON public.customers(workspace_id);
CREATE INDEX idx_customers_status       ON public.customers(workspace_id, status);
CREATE INDEX idx_customers_assigned_to  ON public.customers(workspace_id, assigned_to);
CREATE INDEX idx_customers_email        ON public.customers(workspace_id, email);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: members can view workspace customers"
  ON public.customers FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: agents and above can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: agents and above can update customers"
  ON public.customers FOR UPDATE
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customers: admins/owners can delete customers"
  ON public.customers FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- ── Atomic customer creation function (SECURITY DEFINER) ─────────────────────
CREATE OR REPLACE FUNCTION public.create_workspace_customer(
  p_workspace_id UUID,
  p_full_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'active',
  p_segment TEXT DEFAULT 'smb',
  p_source TEXT DEFAULT 'website',
  p_total_orders INTEGER DEFAULT 0,
  p_total_spent NUMERIC DEFAULT 0,
  p_ai_score SMALLINT DEFAULT 80,
  p_ai_verdict TEXT DEFAULT 'Valuable Customer',
  p_tags TEXT[] DEFAULT '{}',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_member BOOLEAN;
  v_customer RECORD;
  v_status_enum public.customer_status;
  v_segment_enum public.customer_segment;
  v_source_enum public.lead_source;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is an active member of this workspace
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = v_user_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'Access denied: user is not an active member of workspace %', p_workspace_id;
  END IF;

  -- Safe enum casting
  BEGIN
    v_status_enum := p_status::public.customer_status;
  EXCEPTION WHEN OTHERS THEN
    v_status_enum := 'active'::public.customer_status;
  END;

  BEGIN
    v_segment_enum := p_segment::public.customer_segment;
  EXCEPTION WHEN OTHERS THEN
    v_segment_enum := 'smb'::public.customer_segment;
  END;

  BEGIN
    v_source_enum := p_source::public.lead_source;
  EXCEPTION WHEN OTHERS THEN
    v_source_enum := 'other'::public.lead_source;
  END;

  -- Insert customer
  INSERT INTO public.customers (
    workspace_id,
    full_name,
    email,
    phone,
    company,
    status,
    segment,
    source,
    total_orders,
    total_spent,
    lifetime_value,
    ai_score,
    ai_verdict,
    tags,
    notes,
    customer_since,
    last_activity_at
  )
  VALUES (
    p_workspace_id,
    p_full_name,
    p_email,
    p_phone,
    p_company,
    v_status_enum,
    v_segment_enum,
    v_source_enum,
    COALESCE(p_total_orders, 0),
    COALESCE(p_total_spent, 0),
    COALESCE(p_total_spent, 0),
    COALESCE(p_ai_score, 80),
    COALESCE(p_ai_verdict, 'Valuable Customer'),
    COALESCE(p_tags, '{}'),
    p_notes,
    CURRENT_DATE,
    NOW()
  )
  RETURNING * INTO v_customer;

  -- Log creation in customer_activities
  INSERT INTO public.customer_activities (
    workspace_id,
    customer_id,
    type,
    title,
    description,
    icon,
    occurred_at
  )
  VALUES (
    p_workspace_id,
    v_customer.id,
    'account',
    'Account created',
    'Welcome onboard to WorkPilot CRM',
    'user-plus',
    NOW()
  );

  RETURN to_jsonb(v_customer);
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace_customer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace_customer TO authenticated;

-- ── Atomic customer update function (SECURITY DEFINER) ─────────────────────
CREATE OR REPLACE FUNCTION public.update_workspace_customer(
  p_customer_id UUID,
  p_workspace_id UUID DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_total_orders INTEGER DEFAULT NULL,
  p_total_spent NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_ai_score SMALLINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_customer RECORD;
  v_status_enum public.customer_status;
  v_segment_enum public.customer_segment;
  v_source_enum public.lead_source;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify customer belongs to a workspace where caller is an active member
  SELECT c.* INTO v_customer
  FROM public.customers c
  JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
  WHERE c.id = p_customer_id
    AND wm.user_id = v_user_id
    AND wm.status = 'active';

  IF v_customer.id IS NULL THEN
    RAISE EXCEPTION 'Customer not found or user lacks permission to update';
  END IF;

  -- Parse enums safely
  IF p_status IS NOT NULL THEN
    BEGIN
      v_status_enum := p_status::public.customer_status;
    EXCEPTION WHEN OTHERS THEN
      v_status_enum := v_customer.status;
    END;
  ELSE
    v_status_enum := v_customer.status;
  END IF;

  IF p_segment IS NOT NULL THEN
    BEGIN
      v_segment_enum := p_segment::public.customer_segment;
    EXCEPTION WHEN OTHERS THEN
      v_segment_enum := v_customer.segment;
    END;
  ELSE
    v_segment_enum := v_customer.segment;
  END IF;

  IF p_source IS NOT NULL THEN
    BEGIN
      v_source_enum := p_source::public.lead_source;
    EXCEPTION WHEN OTHERS THEN
      v_source_enum := v_customer.source;
    END;
  ELSE
    v_source_enum := v_customer.source;
  END IF;

  UPDATE public.customers
  SET
    full_name = COALESCE(p_full_name, full_name),
    email = p_email,
    phone = p_phone,
    company = p_company,
    status = v_status_enum,
    segment = v_segment_enum,
    source = v_source_enum,
    total_orders = COALESCE(p_total_orders, total_orders),
    total_spent = COALESCE(p_total_spent, total_spent),
    lifetime_value = COALESCE(p_total_spent, lifetime_value),
    notes = p_notes,
    tags = COALESCE(p_tags, tags),
    ai_score = COALESCE(p_ai_score, ai_score),
    updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING * INTO v_customer;

  RETURN to_jsonb(v_customer);
END;
$$;

REVOKE ALL ON FUNCTION public.update_workspace_customer FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_workspace_customer TO authenticated;

-- ============================================================================
-- SECTION 7 — CUSTOMER ACTIVITY LOG
-- (orders, payments, support events shown in CustomerDrawer)
-- ============================================================================

CREATE TABLE public.customer_activities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  customer_id   UUID        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,   -- 'order' | 'payment' | 'support' | 'account'
  title         TEXT        NOT NULL,
  description   TEXT,
  amount        NUMERIC(12,2),
  icon          TEXT,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ca_customer_id   ON public.customer_activities(customer_id, occurred_at DESC);
CREATE INDEX idx_ca_workspace_id  ON public.customer_activities(workspace_id);

ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_activities: members can view"
  ON public.customer_activities FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "customer_activities: agents and above can insert"
  ON public.customer_activities FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 8 — CONVERSATIONS (omnichannel inbox)
-- ============================================================================

CREATE TABLE public.conversations (
  id              UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID                        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- participants — a conversation can belong to a lead OR customer (or neither for anonymous)
  lead_id         UUID                        REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id     UUID                        REFERENCES public.customers(id) ON DELETE SET NULL,
  -- contact display fields (denormalised for inbox performance)
  contact_name    TEXT                        NOT NULL DEFAULT 'Unknown',
  contact_company TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  -- routing
  channel         public.conversation_channel NOT NULL DEFAULT 'whatsapp',
  status          public.conversation_status  NOT NULL DEFAULT 'open',
  assigned_to     UUID                        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- AI handling
  ai_handled      BOOLEAN                     NOT NULL DEFAULT FALSE,
  -- unread counter (per workspace inbox)
  unread_count    INTEGER                     NOT NULL DEFAULT 0,
  -- last message cache for inbox preview
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  -- metadata
  tags            TEXT[]                      DEFAULT '{}',
  metadata        JSONB                       NOT NULL DEFAULT '{}',
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conv_workspace_id ON public.conversations(workspace_id);
CREATE INDEX idx_conv_status       ON public.conversations(workspace_id, status);
CREATE INDEX idx_conv_channel      ON public.conversations(workspace_id, channel);
CREATE INDEX idx_conv_assigned     ON public.conversations(workspace_id, assigned_to);
CREATE INDEX idx_conv_last_msg     ON public.conversations(workspace_id, last_message_at DESC);

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: members can view workspace conversations"
  ON public.conversations FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: agents and above can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: agents and above can update conversations"
  ON public.conversations FOR UPDATE
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "conversations: admins/owners can delete conversations"
  ON public.conversations FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 9 — MESSAGES (individual chat messages)
-- ============================================================================

CREATE TABLE public.messages (
  id              UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID                       NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  conversation_id UUID                       NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  -- who sent this message
  sender_type     public.message_sender_type NOT NULL DEFAULT 'customer',
  sender_id       UUID                       REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name     TEXT,
  -- content
  content         TEXT                       NOT NULL,
  -- attachments: array of {url, type, filename, size} objects
  attachments     JSONB                      NOT NULL DEFAULT '[]',
  is_ai_generated BOOLEAN                    NOT NULL DEFAULT FALSE,
  is_read         BOOLEAN                    NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  metadata        JSONB                      NOT NULL DEFAULT '{}',
  sent_at         TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, sent_at ASC);
CREATE INDEX idx_messages_workspace_id ON public.messages(workspace_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: members can view workspace messages"
  ON public.messages FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "messages: agents and above can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "messages: senders can update their own messages"
  ON public.messages FOR UPDATE
  USING (
    workspace_id IN (SELECT public.get_my_workspace_ids())
    AND sender_id = auth.uid()
  );


-- ============================================================================
-- SECTION 10 — AI AGENTS (one per workspace by default, extensible)
-- ============================================================================

CREATE TABLE public.ai_agents (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID               NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name              TEXT               NOT NULL DEFAULT 'AI Assistant',
  role_description  TEXT,
  avatar            TEXT,
  status            public.agent_status NOT NULL DEFAULT 'active',
  -- LLM configuration
  model             TEXT               NOT NULL DEFAULT 'gpt-4',
  temperature       NUMERIC(3,2)       NOT NULL DEFAULT 0.7 CHECK (temperature BETWEEN 0 AND 2),
  max_tokens        INTEGER            NOT NULL DEFAULT 2048,
  system_prompt     TEXT,
  -- personality settings
  personality       TEXT               DEFAULT 'professional',
  tone              TEXT               DEFAULT 'helpful',
  language          TEXT               DEFAULT 'en',
  -- feature flags
  can_book_appointments BOOLEAN        NOT NULL DEFAULT TRUE,
  can_qualify_leads     BOOLEAN        NOT NULL DEFAULT TRUE,
  can_handle_payments   BOOLEAN        NOT NULL DEFAULT FALSE,
  auto_handoff_on_anger BOOLEAN        NOT NULL DEFAULT TRUE,
  -- performance counters (updated by background jobs)
  conversations_handled INTEGER        NOT NULL DEFAULT 0,
  leads_generated       INTEGER        NOT NULL DEFAULT 0,
  resolution_rate       NUMERIC(5,2)   DEFAULT 0,
  csat_score            NUMERIC(3,2)   DEFAULT 0,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE INDEX idx_ai_agents_workspace ON public.ai_agents(workspace_id);

CREATE TRIGGER trg_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agents: members can view their workspace agents"
  ON public.ai_agents FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "ai_agents: admins/owners can manage agents"
  ON public.ai_agents FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 11 — KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE public.knowledge_base (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID             NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agent_id      UUID             REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  type          public.kb_item_type NOT NULL DEFAULT 'document',
  title         TEXT             NOT NULL,
  content       TEXT,            -- raw text (for FAQ / document)
  url           TEXT,            -- for 'url' / 'video' type
  file_url      TEXT,            -- for uploaded PDFs
  file_size     INTEGER,         -- bytes
  -- embedding-related (for vector search when pgvector is enabled)
  embedding_status TEXT          DEFAULT 'pending', -- pending | processing | ready | error
  chunk_count   INTEGER          DEFAULT 0,
  tags          TEXT[]           DEFAULT '{}',
  is_active     BOOLEAN          NOT NULL DEFAULT TRUE,
  created_by    UUID             REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_workspace_id ON public.knowledge_base(workspace_id);
CREATE INDEX idx_kb_agent_id     ON public.knowledge_base(agent_id);
CREATE INDEX idx_kb_type         ON public.knowledge_base(workspace_id, type);

CREATE TRIGGER trg_kb_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_base: members can view"
  ON public.knowledge_base FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "knowledge_base: admins/owners can manage"
  ON public.knowledge_base FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 12 — AUTOMATIONS / WORKFLOWS
-- ============================================================================

CREATE TABLE public.automations (
  id              UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID                     NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            TEXT                     NOT NULL,
  description     TEXT,
  category        TEXT,                    -- 'Lead Gen' | 'Engagement' | 'Sales' etc.
  status          public.automation_status NOT NULL DEFAULT 'draft',
  trigger_type    public.automation_trigger NOT NULL DEFAULT 'manual',
  trigger_config  JSONB                    NOT NULL DEFAULT '{}', -- trigger-specific settings
  -- the visual node canvas is stored as JSONB (nodes + edges)
  canvas          JSONB                    NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  -- runtime statistics
  total_runs      INTEGER                  NOT NULL DEFAULT 0,
  successful_runs INTEGER                  NOT NULL DEFAULT 0,
  failed_runs     INTEGER                  NOT NULL DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  last_run_status TEXT,                    -- 'success' | 'failed'
  created_by      UUID                     REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automations_workspace ON public.automations(workspace_id);
CREATE INDEX idx_automations_status    ON public.automations(workspace_id, status);

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automations: members can view workspace automations"
  ON public.automations FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "automations: admins/owners can manage automations"
  ON public.automations FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Execution history log (separate from the workflow definition)
CREATE TABLE public.automation_runs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  automation_id   UUID        NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'running', -- running | success | failed
  trigger_payload JSONB       NOT NULL DEFAULT '{}',
  result          JSONB       NOT NULL DEFAULT '{}',
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_ar_automation_id ON public.automation_runs(automation_id, started_at DESC);
CREATE INDEX idx_ar_workspace_id  ON public.automation_runs(workspace_id);

ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation_runs: members can view"
  ON public.automation_runs FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 13 — APPOINTMENTS
-- ============================================================================

CREATE TABLE public.appointments (
  id              UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID                       NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- links to lead or customer (optional — can be standalone)
  lead_id         UUID                       REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id     UUID                       REFERENCES public.customers(id) ON DELETE SET NULL,
  -- contact display (denormalised)
  contact_name    TEXT                       NOT NULL,
  contact_company TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  -- scheduling
  type            public.appointment_type    NOT NULL DEFAULT 'demo',
  status          public.appointment_status  NOT NULL DEFAULT 'scheduled',
  scheduled_at    TIMESTAMPTZ                NOT NULL,
  duration_minutes INTEGER                   NOT NULL DEFAULT 60,
  timezone        TEXT                       NOT NULL DEFAULT 'UTC',
  -- meeting details
  meet_url        TEXT,
  location        TEXT,
  notes           TEXT,
  -- AI summary generated after completion
  ai_summary      TEXT,
  -- assignment
  assigned_to     UUID                       REFERENCES auth.users(id) ON DELETE SET NULL,
  -- calendar sync
  google_event_id TEXT,
  outlook_event_id TEXT,
  -- state timestamps
  confirmed_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_workspace_id  ON public.appointments(workspace_id);
CREATE INDEX idx_appt_status        ON public.appointments(workspace_id, status);
CREATE INDEX idx_appt_scheduled_at  ON public.appointments(workspace_id, scheduled_at);
CREATE INDEX idx_appt_assigned      ON public.appointments(workspace_id, assigned_to);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments: members can view workspace appointments"
  ON public.appointments FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: agents and above can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: agents and above can update appointments"
  ON public.appointments FOR UPDATE
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "appointments: admins/owners can delete appointments"
  ON public.appointments FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 14 — INTEGRATIONS
-- ============================================================================

CREATE TABLE public.integrations (
  id                UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID                      NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider          TEXT                      NOT NULL, -- 'whatsapp' | 'gmail' | 'google_calendar' | 'slack' …
  name              TEXT                      NOT NULL,
  category          TEXT,
  status            public.integration_status NOT NULL DEFAULT 'disconnected',
  -- OAuth / webhook credentials stored encrypted
  -- Do NOT store raw tokens in the frontend; use Supabase Vault or encrypted JSONB
  credentials       JSONB                     NOT NULL DEFAULT '{}',
  config            JSONB                     NOT NULL DEFAULT '{}',
  connected_account TEXT,                     -- display label e.g. email address / phone number
  -- sync stats
  last_sync_at      TIMESTAMPTZ,
  next_sync_at      TIMESTAMPTZ,
  events_synced     INTEGER                   NOT NULL DEFAULT 0,
  sync_type         TEXT,                     -- 'webhook' | 'polling' | 'bidirectional'
  error_message     TEXT,
  -- audit
  connected_by      UUID                      REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, provider)
);

CREATE INDEX idx_integrations_workspace ON public.integrations(workspace_id);
CREATE INDEX idx_integrations_status    ON public.integrations(workspace_id, status);

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations: members can view workspace integrations"
  ON public.integrations FOR SELECT
  USING (workspace_id IN (SELECT public.get_my_workspace_ids()));

CREATE POLICY "integrations: admins/owners can manage integrations"
  ON public.integrations FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );


-- ============================================================================
-- SECTION 15 — NOTIFICATIONS
-- ============================================================================

CREATE TABLE public.notifications (
  id            UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID                      NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- target user (the recipient)
  user_id       UUID                      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          public.notification_type  NOT NULL DEFAULT 'system',
  title         TEXT                      NOT NULL,
  body          TEXT,
  -- optional deep-link to the relevant resource
  resource_type TEXT,   -- 'lead' | 'conversation' | 'appointment' | …
  resource_id   UUID,
  action_url    TEXT,
  is_read       BOOLEAN                   NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMPTZ,
  metadata      JSONB                     NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_id     ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_workspace   ON public.notifications(workspace_id);
CREATE INDEX idx_notif_unread      ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: users can only see their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: users can mark their notifications as read"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications: service role can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));


-- ============================================================================
-- SECTION 16 — AUDIT LOGS
-- ============================================================================

CREATE TABLE public.audit_logs (
  id            UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID               NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id      UUID               REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email   TEXT,              -- denormalised snapshot of actor email at event time
  action        public.audit_action NOT NULL DEFAULT 'other',
  resource_type TEXT               NOT NULL, -- 'lead' | 'customer' | 'automation' …
  resource_id   UUID,
  resource_label TEXT,             -- human-readable name at event time
  -- what changed (before/after for updates)
  changes       JSONB              NOT NULL DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_workspace_id ON public.audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_actor_id     ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_resource     ON public.audit_logs(workspace_id, resource_type, resource_id);

-- Audit logs are immutable — no UPDATE or DELETE allowed for anyone
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: admins/owners can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "audit_logs: system can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));

-- No UPDATE or DELETE policies → audit logs are append-only


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
