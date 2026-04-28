-- ============================================================
-- Consultation Log — Supabase Schema
-- Run this in: Supabase dashboard → SQL Editor → New query
-- ============================================================

-- Profiles (one row per user, linked to auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'consultant', 'customer')),
  job_title   TEXT NOT NULL DEFAULT '',  -- e.g. "Senior Consultant"
  company     TEXT NOT NULL DEFAULT '',  -- for customers
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  customer_company TEXT NOT NULL DEFAULT '',
  customer_contact TEXT NOT NULL DEFAULT '',
  included_hours   NUMERIC NOT NULL DEFAULT 10,
  overage_rate     NUMERIC NOT NULL DEFAULT 2500,
  start_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Who is assigned to each project (consultants + customers)
CREATE TABLE project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN ('consultant', 'customer')),
  UNIQUE(project_id, user_id, member_type)
);

-- Meeting logs
CREATE TABLE logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL REFERENCES profiles(id),
  date          DATE NOT NULL,
  hours         NUMERIC NOT NULL CHECK (hours > 0),
  billable      BOOLEAN NOT NULL DEFAULT TRUE,
  topic         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs            ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Profiles: all authenticated users can read; users write their own row
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR is_admin());

-- Projects: admins full access; members can read their assigned projects
CREATE POLICY "projects_admin"       ON projects FOR ALL    TO authenticated USING (is_admin());
CREATE POLICY "projects_member_read" ON projects FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()));

-- Project members: admins full access; users can read their own memberships
CREATE POLICY "members_admin"  ON project_members FOR ALL    TO authenticated USING (is_admin());
CREATE POLICY "members_select" ON project_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Logs: admins full access; consultants can insert for their projects; members can read
CREATE POLICY "logs_admin"            ON logs FOR ALL    TO authenticated USING (is_admin());
CREATE POLICY "logs_consultant_insert" ON logs FOR INSERT TO authenticated
  WITH CHECK (
    consultant_id = auth.uid() AND
    EXISTS (SELECT 1 FROM project_members WHERE project_id = logs.project_id AND user_id = auth.uid() AND member_type = 'consultant')
  );
CREATE POLICY "logs_member_read" ON logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = logs.project_id AND user_id = auth.uid()));

-- ── Auto-create profile on signup ─────────────────────────────────────────────
-- New users get role='customer' by default; admin promotes them in the dashboard.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'customer'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
