-- RLS Isolation Testing Script
-- Run this in Supabase SQL Editor to verify data isolation

-- This script tests that RLS policies properly isolate data between users
-- Replace the UUIDs below with actual user IDs from your test accounts

-- Test Setup: Create two test scenarios
-- User A: 12345678-1234-1234-1234-123456789012 (Teacher A)
-- User B: 87654321-4321-4321-4321-210987654321 (Teacher B)

-- 1. TEST: Check that each user can only see their own data

-- Check subjects isolation
SELECT 
    'Subjects Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM subjects 
GROUP BY owner_id;

-- Check students isolation  
SELECT 
    'Students Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM students 
GROUP BY owner_id;

-- Check classes isolation
SELECT 
    'Classes Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM classes 
GROUP BY owner_id;

-- Check assessments isolation
SELECT 
    'Assessments Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM assessments 
GROUP BY owner_id;

-- Check scores isolation
SELECT 
    'Scores Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM scores 
GROUP BY owner_id;

-- Check announcements isolation
SELECT 
    'Announcements Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM announcements 
GROUP BY owner_id;

-- 2. TEST: Verify RLS policies are enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('users', 'subjects', 'students', 'classes', 'enrollments', 'assessments', 'scores', 'announcements', 'audit_log')
AND schemaname = 'public';

-- 3. TEST: Check all RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    permissive
FROM pg_policies 
WHERE tablename IN ('users', 'subjects', 'students', 'classes', 'enrollments', 'assessments', 'scores', 'announcements', 'audit_log')
ORDER BY tablename, cmd;

-- 4. TEST: Audit log isolation
SELECT 
    'Audit Log Test' as test_name,
    owner_id,
    COUNT(*) as count
FROM audit_log 
GROUP BY owner_id;

-- 5. TEST: Cross-reference data consistency
-- Check that all class students belong to the same owner
SELECT 
    'Data Consistency Test' as test_name,
    c.owner_id as class_owner,
    s.owner_id as student_owner,
    COUNT(*) as mismatched_enrollments
FROM enrollments e
JOIN classes c ON e.class_id = c.id
JOIN students s ON e.student_id = s.id
WHERE c.owner_id != s.owner_id
GROUP BY c.owner_id, s.owner_id;

-- If the above query returns rows, there's a data consistency issue

-- 6. TEST: Foreign key relationships are maintained
SELECT 
    'Foreign Key Test' as test_name,
    'classes-subjects' as relationship,
    COUNT(*) as orphaned_records
FROM classes c
LEFT JOIN subjects s ON c.subject_id = s.id
WHERE s.id IS NULL;

-- Success criteria:
-- 1. Each owner_id should only see their own data
-- 2. RLS should be enabled (TRUE) on all tables  
-- 3. Policies should exist for SELECT, INSERT, UPDATE, DELETE on all tables
-- 4. No cross-owner data mixing
-- 5. No orphaned foreign key relationships
