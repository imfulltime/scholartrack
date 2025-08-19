-- Debug script for student creation issues
-- Run this in Supabase SQL Editor to identify the problem

-- 1. Check the students table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check unique constraints on students table
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'students'
AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 3. Check current students in the database
SELECT 
    id,
    full_name,
    year_level,
    external_id,
    owner_id,
    created_at
FROM students
ORDER BY created_at DESC;

-- 4. Check RLS policies on students table
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'students';

-- 5. Test if there are any foreign key constraint issues
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'students'
AND tc.constraint_type = 'FOREIGN KEY';

-- 6. Check for any potential issues with external_id uniqueness
-- This is likely the culprit - external_id might be required to be unique
SELECT 
    external_id,
    COUNT(*) as count
FROM students 
GROUP BY external_id
HAVING COUNT(*) > 1;

-- 7. Show the exact constraint that might be causing issues
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conkey as column_positions,
    confkey as foreign_column_positions
FROM pg_constraint 
WHERE conrelid = 'students'::regclass;
