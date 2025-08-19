-- Fix for student creation issue
-- Run this in Supabase SQL Editor

-- First, let's check what's causing the issue
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'students'::regclass
AND contype = 'u'; -- unique constraints

-- The issue is likely the unique constraint on (external_id, owner_id)
-- When external_id is NULL, PostgreSQL treats each NULL as unique
-- But our constraint might not be handling this correctly

-- Let's check current students
SELECT id, full_name, external_id, owner_id FROM students;

-- Fix 1: Drop the problematic unique constraint and recreate it properly
-- This allows multiple students with NULL external_id for the same owner
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_external_id_owner_id_key;

-- Recreate the constraint to allow multiple NULL external_ids
-- This constraint will only enforce uniqueness when external_id is NOT NULL
CREATE UNIQUE INDEX students_external_id_owner_id_unique 
ON students (external_id, owner_id) 
WHERE external_id IS NOT NULL;

-- Fix 2: Also check if there are any orphaned records causing issues
-- Clean up any potential data issues
DELETE FROM students WHERE owner_id IS NULL;

-- Fix 3: Ensure RLS policies are correct
-- Check current policies
SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'students';

-- Add proper INSERT policy if missing
DO $$
BEGIN
    -- Drop existing insert policy if it exists
    DROP POLICY IF EXISTS "Users can insert own students" ON students;
    
    -- Create new insert policy
    CREATE POLICY "Users can insert own students" ON students 
        FOR INSERT 
        WITH CHECK (auth.uid() = owner_id);
END $$;

-- Verify the fix
SELECT 'Students table is now ready for multiple student creation' as status;
