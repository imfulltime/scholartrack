-- Seed data for ScholarTrack MVP
-- This creates a sample teacher with classes, students, and assessments

-- Insert a sample teacher user (assuming auth.users already has this user)
-- Note: In practice, this would be created through the auth signup process
INSERT INTO users (id, full_name, email, role) VALUES
  ('12345678-1234-1234-1234-123456789012', 'Sarah Johnson', 'sarah.johnson@school.edu', 'TEACHER_ADMIN')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- Insert subjects
INSERT INTO subjects (id, name, code, owner_id) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Mathematics', 'MATH', '12345678-1234-1234-1234-123456789012'),
  ('a2222222-2222-2222-2222-222222222222', 'Science', 'SCI', '12345678-1234-1234-1234-123456789012');

-- Insert classes
INSERT INTO classes (id, name, subject_id, year_level, owner_id) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Grade 8 Mathematics', 'a1111111-1111-1111-1111-111111111111', 8, '12345678-1234-1234-1234-123456789012'),
  ('b2222222-2222-2222-2222-222222222222', 'Grade 9 Biology', 'a2222222-2222-2222-2222-222222222222', 9, '12345678-1234-1234-1234-123456789012');

-- Insert students
INSERT INTO students (id, full_name, year_level, external_id, owner_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Emma Wilson', 8, 'STU001', '12345678-1234-1234-1234-123456789012'),
  ('c2222222-2222-2222-2222-222222222222', 'Liam Brown', 8, 'STU002', '12345678-1234-1234-1234-123456789012'),
  ('c3333333-3333-3333-3333-333333333333', 'Olivia Davis', 9, 'STU003', '12345678-1234-1234-1234-123456789012'),
  ('c4444444-4444-4444-4444-444444444444', 'Noah Miller', 9, 'STU004', '12345678-1234-1234-1234-123456789012');

-- Insert enrollments
INSERT INTO enrollments (class_id, student_id, owner_id) VALUES
  -- Grade 8 Math students
  ('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', '12345678-1234-1234-1234-123456789012'),
  ('b1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', '12345678-1234-1234-1234-123456789012'),
  -- Grade 9 Biology students
  ('b2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', '12345678-1234-1234-1234-123456789012'),
  ('b2222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', '12345678-1234-1234-1234-123456789012');

-- Insert grading scheme
INSERT INTO grading_schemes (id, name, scale, owner_id) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Standard Scale', 
   '{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}', 
   '12345678-1234-1234-1234-123456789012');

-- Insert assessments
INSERT INTO assessments (id, class_id, title, type, date, weight, max_score, status, owner_id) VALUES
  -- Math assessments
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Algebra Quiz 1', 'QUIZ', '2024-01-15', 1.00, 20.00, 'PUBLISHED', '12345678-1234-1234-1234-123456789012'),
  ('e2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Geometry Test', 'EXAM', '2024-01-22', 2.00, 100.00, 'PUBLISHED', '12345678-1234-1234-1234-123456789012'),
  ('e3333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111111', 'Problem Solving Assignment', 'ASSIGNMENT', '2024-01-29', 1.50, 50.00, 'DRAFT', '12345678-1234-1234-1234-123456789012'),
  -- Science assessments
  ('e4444444-4444-4444-4444-444444444444', 'b2222222-2222-2222-2222-222222222222', 'Cell Structure Quiz', 'QUIZ', '2024-01-16', 1.00, 25.00, 'PUBLISHED', '12345678-1234-1234-1234-123456789012'),
  ('e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'Photosynthesis Lab', 'ASSIGNMENT', '2024-01-23', 1.25, 30.00, 'PUBLISHED', '12345678-1234-1234-1234-123456789012');

-- Insert scores
INSERT INTO scores (assessment_id, student_id, raw_score, comment, last_updated_by, owner_id) VALUES
  -- Algebra Quiz 1 scores
  ('e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 18.50, 'Great work on algebraic expressions!', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  ('e1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 16.00, 'Good effort, review negative numbers', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  -- Geometry Test scores
  ('e2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 87.00, 'Excellent understanding of geometric principles', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  ('e2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 73.00, 'Work on angle calculations', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  -- Cell Structure Quiz scores
  ('e4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', 23.00, 'Perfect understanding of cell organelles', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  ('e4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 21.50, 'Good work, review mitochondria function', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  -- Photosynthesis Lab scores
  ('e5555555-5555-5555-5555-555555555555', 'c3333333-3333-3333-3333-333333333333', 28.00, 'Excellent lab technique and analysis', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012'),
  ('e5555555-5555-5555-5555-555555555555', 'c4444444-4444-4444-4444-444444444444', 25.50, 'Good observations, improve conclusion', '12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789012');

-- Insert announcements
INSERT INTO announcements (id, scope, class_id, title, body, published_at, owner_id) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'SCHOOL', NULL, 
   'Welcome to the New Semester', 
   'Welcome back students! We have an exciting semester ahead with new learning opportunities and challenges.',
   NOW() - INTERVAL '2 days', '12345678-1234-1234-1234-123456789012'),
  ('f2222222-2222-2222-2222-222222222222', 'CLASS', 'b1111111-1111-1111-1111-111111111111',
   'Math Test Next Week', 
   'Reminder: We have our geometry test next Monday. Please review chapters 5-7 and complete the practice problems.',
   NOW() - INTERVAL '1 day', '12345678-1234-1234-1234-123456789012'),
  ('f3333333-3333-3333-3333-333333333333', 'CLASS', 'b2222222-2222-2222-2222-222222222222',
   'Lab Equipment Safety', 
   'Before our next lab session, please review the safety guidelines handout. Proper safety equipment is mandatory.',
   NOW(), '12345678-1234-1234-1234-123456789012');

-- Insert some audit log entries
INSERT INTO audit_log (user_id, action, entity, entity_id, meta, owner_id) VALUES
  ('12345678-1234-1234-1234-123456789012', 'CREATE', 'assessment', 'e1111111-1111-1111-1111-111111111111', 
   '{"title": "Algebra Quiz 1", "class": "Grade 8 Mathematics"}', '12345678-1234-1234-1234-123456789012'),
  ('12345678-1234-1234-1234-123456789012', 'PUBLISH', 'assessment', 'e1111111-1111-1111-1111-111111111111', 
   '{"status_change": "DRAFT -> PUBLISHED"}', '12345678-1234-1234-1234-123456789012'),
  ('12345678-1234-1234-1234-123456789012', 'UPDATE', 'score', 'e1111111-1111-1111-1111-111111111111', 
   '{"student": "Emma Wilson", "score": 18.5}', '12345678-1234-1234-1234-123456789012');
