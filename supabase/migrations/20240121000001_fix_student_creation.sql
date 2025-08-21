-- Fix student creation by adding proper trigger for automatic field population
-- This migration ensures new student records work properly with the new name structure

-- First, let's make sure full_name can be NULL for new records
ALTER TABLE public.students 
ALTER COLUMN full_name DROP NOT NULL;

-- Create a function to automatically populate display_name and full_name
CREATE OR REPLACE FUNCTION public.update_student_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate display_name: "Family, First Middle"
    NEW.display_name := NEW.family_name || ', ' || NEW.first_name || COALESCE(' ' || NEW.middle_name, '');
    
    -- Generate full_name for backward compatibility: "First Middle Family"  
    NEW.full_name := NEW.first_name || COALESCE(' ' || NEW.middle_name, '') || ' ' || NEW.family_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function before insert or update
DROP TRIGGER IF EXISTS set_student_names ON public.students;
CREATE TRIGGER set_student_names
    BEFORE INSERT OR UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_student_names();

-- Remove the generated column since we'll use the trigger instead
ALTER TABLE public.students DROP COLUMN IF EXISTS display_name;

-- Add display_name as a regular column that will be populated by the trigger
ALTER TABLE public.students ADD COLUMN display_name TEXT;

-- Update existing records to populate the new fields if they don't have them
UPDATE public.students 
SET 
    family_name = COALESCE(family_name, split_part(full_name, ' ', array_length(string_to_array(full_name, ' '), 1))),
    first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
    middle_name = CASE 
        WHEN array_length(string_to_array(full_name, ' '), 1) > 2 
        THEN array_to_string(string_to_array(full_name, ' ')[2:array_length(string_to_array(full_name, ' '), 1)-1], ' ')
        ELSE middle_name
    END
WHERE family_name IS NULL OR first_name IS NULL;

-- Now trigger the function to populate display_name and full_name for existing records
UPDATE public.students SET updated_at = updated_at;

-- Ensure NOT NULL constraints are in place for required fields
ALTER TABLE public.students 
ALTER COLUMN family_name SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN display_name SET NOT NULL;
