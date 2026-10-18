-- =============================================================================
-- FINOVA: Phase 2 Database Foundation (Supabase PostgreSQL + RLS)
-- Project: FINOVA (Smart Financial Assistance Platform)
-- Team: YUGMA
-- Description: Core schema, enums, tables, constraints, indexes, triggers, and RLS policies.
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_status AS ENUM ('CONFIRMED', 'UNCONFIRMED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_type AS ENUM ('FAILED', 'PENDING', 'DELAYED', 'DEBITED_NOT_CREDITED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE resolution_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES

-- A. User Profiles (minimal application user record, aligns with Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- B. Financial Activities (shared hub connecting all financial events)
CREATE TABLE IF NOT EXISTS financial_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    amount BIGINT NOT NULL CHECK (amount > 0), -- Stored in minor units (paise)
    currency TEXT NOT NULL DEFAULT 'INR',
    status activity_status NOT NULL DEFAULT 'UNCONFIRMED',
    source_module TEXT NOT NULL DEFAULT 'FINANCIAL_ACTIVITY',
    confidence_or_verification_state TEXT NOT NULL DEFAULT 'USER_REPORTED',
    date TIMESTAMPTZ NOT NULL,
    reference_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_fin_act_user_date ON financial_activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_fin_act_user_status ON financial_activities(user_id, status);

CREATE TRIGGER trg_financial_activities_updated_at
BEFORE UPDATE ON financial_activities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- C. Payment Cases (tracks failed, pending, delayed, debited-not-credited disputes)
CREATE TABLE IF NOT EXISTS payment_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    financial_activity_id UUID NOT NULL UNIQUE REFERENCES financial_activities(id) ON DELETE CASCADE,
    payment_method TEXT DEFAULT 'UPI',
    issue_type issue_type NOT NULL,
    reported_status TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED', -- Explicit: never claims live bank verification
    amount BIGINT CHECK (amount IS NULL OR amount > 0),    -- In paise
    currency TEXT NOT NULL DEFAULT 'INR',
    reference_number TEXT,
    issue_description TEXT,
    resolution_status resolution_status NOT NULL DEFAULT 'OPEN',
    next_action_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payment_cases_user_res ON payment_cases(user_id, resolution_status);
CREATE INDEX IF NOT EXISTS idx_payment_cases_act_id ON payment_cases(financial_activity_id);

CREATE TRIGGER trg_payment_cases_updated_at
BEFORE UPDATE ON payment_cases
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- D. Risk Assessments (persisted rule-based scam checker results)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    financial_activity_id UUID UNIQUE REFERENCES financial_activities(id) ON DELETE SET NULL,
    assessment_method TEXT NOT NULL DEFAULT 'RULE_ENGINE_V1',
    risk_level risk_level NOT NULL,
    triggered_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations_disclosed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_created ON risk_assessments(user_id, created_at);

-- E. Cash Flow Items (income, expenses, confirmed & unconfirmed receivables)
CREATE TABLE IF NOT EXISTS cash_flow_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    financial_activity_id UUID REFERENCES financial_activities(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount >= 0), -- In minor units (paise)
    currency TEXT NOT NULL DEFAULT 'INR',
    is_income BOOLEAN NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT false,
    availability_status TEXT NOT NULL DEFAULT 'PENDING',
    due_date TIMESTAMPTZ,
    description TEXT,
    scenario_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_cf_items_user_due ON cash_flow_items(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_cf_items_user_confirmed ON cash_flow_items(user_id, is_confirmed);

CREATE TRIGGER trg_cash_flow_items_updated_at
BEFORE UPDATE ON cash_flow_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- F. Action Centre Items (persisted action items and overrides)
CREATE TABLE IF NOT EXISTS action_centre_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    financial_activity_id UUID REFERENCES financial_activities(id) ON DELETE CASCADE,
    payment_case_id UUID REFERENCES payment_cases(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    urgency urgency_level NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'PENDING',
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_action_items_user_status ON action_centre_items(user_id, status);

CREATE TRIGGER trg_action_centre_items_updated_at
BEFORE UPDATE ON action_centre_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_centre_items ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for financial_activities
CREATE POLICY "financial_activities_select_own" ON financial_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "financial_activities_insert_own" ON financial_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_activities_update_own" ON financial_activities
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_activities_delete_own" ON financial_activities
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for payment_cases
CREATE POLICY "payment_cases_select_own" ON payment_cases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_cases_insert_own" ON payment_cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_cases_update_own" ON payment_cases
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_cases_delete_own" ON payment_cases
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for risk_assessments
CREATE POLICY "risk_assessments_select_own" ON risk_assessments
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "risk_assessments_insert_own" ON risk_assessments
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policies for cash_flow_items
CREATE POLICY "cash_flow_items_select_own" ON cash_flow_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cash_flow_items_insert_own" ON cash_flow_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cash_flow_items_update_own" ON cash_flow_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cash_flow_items_delete_own" ON cash_flow_items
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for action_centre_items
CREATE POLICY "action_centre_items_select_own" ON action_centre_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "action_centre_items_insert_own" ON action_centre_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "action_centre_items_update_own" ON action_centre_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "action_centre_items_delete_own" ON action_centre_items
    FOR DELETE USING (auth.uid() = user_id);
