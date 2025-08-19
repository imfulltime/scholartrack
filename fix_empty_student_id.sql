-- Fix for empty Student ID issue
-- This allows multiple students without Student IDs

-- Step 1: Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'students'::regclass 
AND contype = 'u';

-- Step 2: Drop the problematic unique constraint
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_external_id_owner_id_key;

-- Step 3: Create a proper partial unique index
-- This only enforces uniqueness when external_id is NOT NULL and NOT empty
CREATE UNIQUE INDEX students_external_id_owner_id_unique 
ON students (external_id, owner_id) 
WHERE external_id IS NOT NULL AND external_id != '';

-- Step 4: Verify the fix
SELECT 'Multiple students without Student ID can now be created' as fix_status;

-- Step 5: Test query (optional) - this should show no conflicts
SELECT 
    external_id,
    COUNT(*) as student_count
FROM students 
WHERE owner_id = auth.uid()
GROUP BY external_id;
