-- ==========================================
-- SkillSwap Advanced Database Schema
-- Supabase PostgreSQL
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- Linked to Supabase Auth users
-- ==========================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    skills_offered TEXT[] DEFAULT '{}',
    skills_wanted TEXT[] DEFAULT '{}',
    credits INTEGER DEFAULT 5,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ==========================================
-- 2. MATCHES TABLE
-- Stores pre-computed or discovered matches
-- ==========================================
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_score INTEGER DEFAULT 0,
    matched_skills TEXT[] DEFAULT '{}',
    is_viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    UNIQUE(requester_id, matched_user_id)
);

-- ==========================================
-- 3. SESSIONS TABLE
-- Learning sessions between users
-- ==========================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    credits_used INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ==========================================
-- 4. REVIEWS TABLE
-- Ratings and comments after sessions
-- ==========================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
    UNIQUE(session_id, reviewer_id)
);

-- ==========================================
-- 5. NOTIFICATIONS TABLE
-- In-app notifications for users
-- ==========================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general' CHECK (type IN ('booking', 'match', 'system', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_skills_offered ON profiles USING GIN(skills_offered);
CREATE INDEX idx_profiles_skills_wanted ON profiles USING GIN(skills_wanted);

CREATE INDEX idx_matches_requester_id ON matches(requester_id);
CREATE INDEX idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX idx_matches_score ON matches(match_score DESC);

CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);
CREATE INDEX idx_sessions_status ON sessions(status);

CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ==========================================
-- TRIGGER: Auto-create profile on auth signup
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, credits)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        5
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- TRIGGER: Create notification on new session
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify teacher
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        NEW.teacher_id,
        'New Session Booking',
        'You have been booked to teach ' || NEW.skill_name,
        'booking'
    );
    -- Notify student
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        NEW.student_id,
        'Session Confirmed',
        'Your session for ' || NEW.skill_name || ' has been scheduled',
        'booking'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_session_created
    AFTER INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_session();

-- ==========================================
-- TRIGGER: Create notification on new match
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_match()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
        NEW.requester_id,
        'New Match Found',
        'We found someone who can teach you a skill you want!',
        'match'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_match_created
    AFTER INSERT ON matches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_match();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Matches: Users see their own matches
CREATE POLICY "Users can view own matches"
    ON matches FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "System can create matches"
    ON matches FOR INSERT WITH CHECK (true);

-- Sessions: Participants can view
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);

CREATE POLICY "Users can create sessions"
    ON sessions FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Reviews: Readable by all, creatable by reviewer
CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews"
    ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications: Users see their own
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT WITH CHECK (true);

-- ==========================================
-- ADMIN FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status FROM profiles WHERE id = user_uuid;
    RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin bypass policies
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all sessions"
    ON sessions FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage credits"
    ON profiles FOR UPDATE
    USING (is_admin(auth.uid()));

-- ==========================================
-- SAMPLE SEED DATA
-- ==========================================

-- Note: Seed users must be created via Supabase Auth first.
-- These INSERTs assume auth users with these UUIDs exist.
-- For demo purposes, run these after creating users in the app.

/*
-- Example seed data (uncomment and adjust UUIDs after creating auth users):
INSERT INTO profiles (id, username, full_name, skills_offered, skills_wanted, credits, is_admin)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'alice', 'Alice Smith', ARRAY['Photoshop', 'Illustrator'], ARRAY['Guitar', 'Piano'], 5, false),
    ('00000000-0000-0000-0000-000000000002', 'bob', 'Bob Johnson', ARRAY['Guitar', 'Bass'], ARRAY['Photoshop', 'Excel'], 5, false),
    ('00000000-0000-0000-0000-000000000003', 'carol', 'Carol Davis', ARRAY['Excel', 'Python'], ARRAY['Illustrator', 'Cooking'], 5, false),
    ('00000000-0000-0000-0000-000000000004', 'admin', 'Admin User', ARRAY['Management'], ARRAY['Learning'], 10, true);

-- Seed matches
INSERT INTO matches (requester_id, matched_user_id, match_score, matched_skills)
VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 1, ARRAY['Guitar']),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 1, ARRAY['Photoshop']),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 1, ARRAY['Illustrator']),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 1, ARRAY['Excel']);
*/

-- ==========================================
-- AI PLACEHOLDER FUNCTIONS
-- These are PostgreSQL function stubs for future AI integration
-- ==========================================

-- Placeholder: Calculate AI match score between two users
CREATE OR REPLACE FUNCTION calculate_ai_match_score(user_a UUID, user_b UUID)
RETURNS INTEGER AS $$
BEGIN
    -- Future: Call OpenAI API or run ML model here
    -- For now, return basic overlap count
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM (
            SELECT UNNEST(p1.skills_wanted)
            FROM profiles p1 WHERE p1.id = user_a
            INTERSECT
            SELECT UNNEST(p2.skills_offered)
            FROM profiles p2 WHERE p2.id = user_b
        ) AS overlap
    );
END;
$$ LANGUAGE plpgsql;

-- Placeholder: Generate AI skill recommendations
CREATE OR REPLACE FUNCTION get_ai_recommendations(user_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
    -- Future: Integrate with OpenAI to suggest skills
    -- For now, return popular skills from other users
    RETURN ARRAY['Machine Learning', 'Public Speaking', 'Data Analysis'];
END;
$$ LANGUAGE plpgsql;
