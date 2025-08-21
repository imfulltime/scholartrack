-- Remove external_id field since we now have universal_id
-- This migration removes the optional Student ID field

-- 1. Remove the external_id column from students table
ALTER TABLE public.students 
DROP COLUMN IF EXISTS external_id;

-- 2. Drop any indexes related to external_id
DROP INDEX IF EXISTS idx_students_external_id;

-- 3. Update any existing data that might reference external_id (cleanup)
-- Note: The universal_id system replaces all external_id functionality

-- Add a comment about the change
COMMENT ON TABLE public.students IS 'Students table - external_id removed in favor of universal_id system';
