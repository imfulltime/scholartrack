-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('TEACHER_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'SUPER_ADMIN');
CREATE TYPE assessment_type AS ENUM ('QUIZ', 'EXAM', 'ASSIGNMENT');
CREATE TYPE assessment_status AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE announcement_scope AS ENUM ('SCHOOL', 'CLASS');

-- Users profile table (mirrors auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'TEACHER_ADMIN',
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  year_level INTEGER NOT NULL CHECK (year_level >= 1 AND year_level <= 12),
  external_id TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, owner_id)
);

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, owner_id)
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  year_level INTEGER NOT NULL CHECK (year_level >= 1 AND year_level <= 12),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table (many-to-many between classes and students)
CREATE TABLE enrollments (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- Grading schemes table
CREATE TABLE grading_schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  scale JSONB NOT NULL, -- e.g., {"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type assessment_type NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC(5,2) DEFAULT 1.00 CHECK (weight >= 0),
  max_score NUMERIC(6,2) NOT NULL CHECK (max_score > 0),
  status assessment_status DEFAULT 'DRAFT',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table
CREATE TABLE scores (
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  raw_score NUMERIC(6,2) CHECK (raw_score >= 0),
  comment TEXT,
  last_updated_by UUID NOT NULL REFERENCES auth.users(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (assessment_id, student_id)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope announcement_scope NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (scope = 'SCHOOL' AND class_id IS NULL) OR 
    (scope = 'CLASS' AND class_id IS NOT NULL)
  )
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  meta JSONB,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_students_owner_id ON students(owner_id);
CREATE INDEX idx_students_year_level ON students(year_level);
CREATE INDEX idx_subjects_owner_id ON subjects(owner_id);
CREATE INDEX idx_classes_owner_id ON classes(owner_id);
CREATE INDEX idx_classes_subject_id ON classes(subject_id);
CREATE INDEX idx_enrollments_owner_id ON enrollments(owner_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_grading_schemes_owner_id ON grading_schemes(owner_id);
CREATE INDEX idx_assessments_owner_id ON assessments(owner_id);
CREATE INDEX idx_assessments_class_id ON assessments(class_id);
CREATE INDEX idx_assessments_date ON assessments(date);
CREATE INDEX idx_scores_owner_id ON scores(owner_id);
CREATE INDEX idx_scores_assessment_id ON scores(assessment_id);
CREATE INDEX idx_scores_student_id ON scores(student_id);
CREATE INDEX idx_announcements_owner_id ON announcements(owner_id);
CREATE INDEX idx_announcements_class_id ON announcements(class_id);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_audit_log_owner_id ON audit_log(owner_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: can only access own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Students: owner-based access
CREATE POLICY "Users can view own students" ON students
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own students" ON students
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own students" ON students
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own students" ON students
  FOR DELETE USING (auth.uid() = owner_id);

-- Subjects: owner-based access
CREATE POLICY "Users can view own subjects" ON subjects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own subjects" ON subjects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own subjects" ON subjects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own subjects" ON subjects
  FOR DELETE USING (auth.uid() = owner_id);

-- Classes: owner-based access
CREATE POLICY "Users can view own classes" ON classes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own classes" ON classes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own classes" ON classes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own classes" ON classes
  FOR DELETE USING (auth.uid() = owner_id);

-- Enrollments: owner-based access
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own enrollments" ON enrollments
  FOR DELETE USING (auth.uid() = owner_id);

-- Grading schemes: owner-based access
CREATE POLICY "Users can view own grading schemes" ON grading_schemes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own grading schemes" ON grading_schemes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own grading schemes" ON grading_schemes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own grading schemes" ON grading_schemes
  FOR DELETE USING (auth.uid() = owner_id);

-- Assessments: owner-based access
CREATE POLICY "Users can view own assessments" ON assessments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own assessments" ON assessments
  FOR DELETE USING (auth.uid() = owner_id);

-- Scores: owner-based access
CREATE POLICY "Users can view own scores" ON scores
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own scores" ON scores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own scores" ON scores
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own scores" ON scores
  FOR DELETE USING (auth.uid() = owner_id);

-- Announcements: owner-based access
CREATE POLICY "Users can view own announcements" ON announcements
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own announcements" ON announcements
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own announcements" ON announcements
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own announcements" ON announcements
  FOR DELETE USING (auth.uid() = owner_id);

-- Audit log: owner-based access for reading, controlled insert
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = owner_id);

-- Function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unnamed User'), NEW.email, 'TEACHER_ADMIN');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grading_schemes_updated_at BEFORE UPDATE ON grading_schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
