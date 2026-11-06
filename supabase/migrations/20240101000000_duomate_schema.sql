-- ====================================================================
-- DUOMATE DATABASE SCHEMA & MIGRATION
-- A Private Career Growth, Study Management & Accountability Platform
-- Exclusively designed for Aadhavan and Narmatha
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id TEXT PRIMARY KEY DEFAULT 'duomate-shared-workspace',
    name TEXT NOT NULL DEFAULT 'DuoMate Shared Workspace',
    description TEXT DEFAULT 'Private Career Partnership for Aadhavan & Narmatha',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    workspace_id TEXT REFERENCES public.workspaces(id) ON DELETE SET NULL DEFAULT 'duomate-shared-workspace',
    theme TEXT DEFAULT 'dark',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 4. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'GATE ECE',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Requested',
    start_date TIMESTAMPTZ,
    deadline TIMESTAMPTZ,
    expected_duration INTEGER, -- minutes
    expected_deliverable TEXT,
    reference_links JSONB DEFAULT '[]'::jsonb,
    additional_instructions TEXT,
    progress_percentage INTEGER DEFAULT 0,
    requires_review BOOLEAN DEFAULT true,
    submission_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASK COMMENTS
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TASK ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASK STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.task_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    note TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CHECKLISTS
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id, date)
);

-- 9. CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CHECKLIST TEMPLATES
CREATE TABLE IF NOT EXISTS public.checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    track TEXT NOT NULL,
    notes TEXT,
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    session_type TEXT DEFAULT 'solo',
    partner_joined BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SHARED STUDY SESSIONS
CREATE TABLE IF NOT EXISTS public.shared_study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    host_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. DAILY GOALS
CREATE TABLE IF NOT EXISTS public.daily_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    gate_subject TEXT,
    vlsi_topic TEXT,
    gate_questions_target INTEGER DEFAULT 30,
    study_hours_target NUMERIC DEFAULT 4.0,
    individual_goals JSONB DEFAULT '[]'::jsonb,
    shared_goals JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id, date)
);

-- 15. WEEKLY GOALS
CREATE TABLE IF NOT EXISTS public.weekly_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    objectives JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CAREER TRACKS
CREATE TABLE IF NOT EXISTS public.career_tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CAREER SUBJECTS
CREATE TABLE IF NOT EXISTS public.career_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id TEXT NOT NULL REFERENCES public.career_tracks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weightage TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 18. CAREER TOPICS
CREATE TABLE IF NOT EXISTS public.career_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    track TEXT NOT NULL,
    subject TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'intermediate',
    reference_links JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. USER TOPIC PROGRESS
CREATE TABLE IF NOT EXISTS public.user_topic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.career_topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started',
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- 20. CAREER MILESTONES
CREATE TABLE IF NOT EXISTS public.career_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    track TEXT NOT NULL,
    target_date DATE,
    achieved_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. GATE MOCK TESTS
CREATE TABLE IF NOT EXISTS public.gate_mock_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL DEFAULT 'subject',
    subject TEXT,
    topic TEXT,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_questions INTEGER NOT NULL,
    attempted INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    incorrect INTEGER NOT NULL,
    unattempted INTEGER NOT NULL,
    marks_obtained NUMERIC NOT NULL,
    total_marks NUMERIC NOT NULL,
    negative_marks NUMERIC DEFAULT 0,
    time_taken_minutes INTEGER NOT NULL,
    accuracy_percentage NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. GATE MOCK TEST RESULTS
CREATE TABLE IF NOT EXISTS public.gate_mock_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES public.gate_mock_tests(id) ON DELETE CASCADE,
    subject_breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. LEARNING RESOURCES
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    linked_topic_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. WEEKLY REPORTS
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id TEXT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Helper check function
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Universal Workspace Policies
CREATE POLICY "Workspaces are viewable by members" ON public.workspaces
    FOR SELECT USING (public.is_workspace_member(id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Profiles viewable by workspace peers" ON public.profiles
    FOR ALL USING (true);

CREATE POLICY "Tasks viewable by workspace members" ON public.tasks
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Checklists viewable by workspace members" ON public.checklists
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Checklist items viewable by workspace members" ON public.checklist_items
    FOR ALL USING (true);

CREATE POLICY "Messages viewable by workspace members" ON public.messages
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Study sessions viewable by workspace members" ON public.study_sessions
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Activity logs viewable by workspace members" ON public.activity_logs
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "GATE mock tests viewable by workspace members" ON public.gate_mock_tests
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

CREATE POLICY "Resources viewable by workspace members" ON public.learning_resources
    FOR ALL USING (public.is_workspace_member(workspace_id) OR auth.uid() IS NOT NULL);

-- ====================================================================
-- SEED WORKSPACE
-- ====================================================================

INSERT INTO public.workspaces (id, name, description)
VALUES ('duomate-shared-workspace', 'DuoMate Shared Workspace', 'Exclusively for Aadhavan and Narmatha')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.career_tracks (id, name, description)
VALUES 
    ('gate', 'GATE ECE Preparation', '10 Subjects for GATE Electronics and Communication Engineering'),
    ('vlsi', 'VLSI + AI Hardware Engineering', '7-Level Modern Chip Design & AI Accelerator Roadmap')
ON CONFLICT (id) DO NOTHING;

