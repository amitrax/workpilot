-- ============================================================================
-- WorkPilot — Customers RLS & Secure Creation Function
-- Migration: 20260906000001_customers_rls_and_provisioning.sql
-- ============================================================================

-- 1. Ensure RLS is enabled on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Cleanly ensure policies on customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'customers: members can view workspace customers'
  ) THEN
    CREATE POLICY "customers: members can view workspace customers"
      ON public.customers FOR SELECT
      USING (workspace_id IN (SELECT public.get_my_workspace_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'customers: members can insert customers'
  ) THEN
    CREATE POLICY "customers: members can insert customers"
      ON public.customers FOR INSERT
      TO authenticated
      WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'customers: members can update customers'
  ) THEN
    CREATE POLICY "customers: members can update customers"
      ON public.customers FOR UPDATE
      TO authenticated
      USING (workspace_id IN (SELECT public.get_my_workspace_ids()))
      WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customers' AND policyname = 'customers: admins/owners can delete customers'
  ) THEN
    CREATE POLICY "customers: admins/owners can delete customers"
      ON public.customers FOR DELETE
      TO authenticated
      USING (
        workspace_id IN (
          SELECT workspace_id FROM public.workspace_members
          WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND status = 'active'
        )
      );
  END IF;
END $$;

-- 3. Cleanly ensure policies on customer_activities
ALTER TABLE public.customer_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customer_activities' AND policyname = 'customer_activities: members can view'
  ) THEN
    CREATE POLICY "customer_activities: members can view"
      ON public.customer_activities FOR SELECT
      USING (workspace_id IN (SELECT public.get_my_workspace_ids()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'customer_activities' AND policyname = 'customer_activities: members can insert'
  ) THEN
    CREATE POLICY "customer_activities: members can insert"
      ON public.customer_activities FOR INSERT
      TO authenticated
      WITH CHECK (workspace_id IN (SELECT public.get_my_workspace_ids()));
  END IF;
END $$;

-- 4. Atomic customer creation function (SECURITY DEFINER)
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

-- 5. Atomic customer update function (SECURITY DEFINER)
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

