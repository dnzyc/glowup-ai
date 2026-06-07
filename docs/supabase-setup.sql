-- ============================================
-- GlowUp AI — Supabase Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 10,           -- new users get 10 free credits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_url TEXT,
  output_url TEXT,
  media_type TEXT DEFAULT 'photo'
    CHECK (media_type IN ('photo', 'video')),
  credit_cost INTEGER DEFAULT 1,
  replicate_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. CREDIT TRANSACTIONS
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  stripe_session_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON credit_transactions(user_id);

-- 5. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service update profile" ON profiles;
CREATE POLICY "Service update profile" ON profiles
  FOR UPDATE USING (true) WITH CHECK (true);  -- backend service role only

-- Jobs: users CRUD their own
DROP POLICY IF EXISTS "Users view own jobs" ON jobs;
CREATE POLICY "Users view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own jobs" ON jobs;
CREATE POLICY "Users create own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service update jobs" ON jobs;
CREATE POLICY "Service update jobs" ON jobs
  FOR UPDATE USING (true) WITH CHECK (true);  -- backend service role only

-- Credit transactions: users view their own
DROP POLICY IF EXISTS "Users view own transactions" ON credit_transactions;
CREATE POLICY "Users view own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service insert transactions" ON credit_transactions;
CREATE POLICY "Service insert transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- 6. STORAGE BUCKETS (run in Storage > Policies section or via API)
-- Create these manually in Supabase Dashboard: Storage > New Bucket
-- Bucket 1: "uploads" — user uploaded originals, public read
-- Bucket 2: "results" — processed outputs, public read
-- Bucket policies: authenticated INSERT, public SELECT
