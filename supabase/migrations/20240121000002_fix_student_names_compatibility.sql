-- Fixed migration for student name structure (PostgreSQL compatibility)
-- This replaces the problematic array slicing syntax

-- First, ensure we have the new columns
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS family_name TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Make full_name nullable for backward compatibility
ALTER TABLE public.students 
ALTER COLUMN full_name DROP NOT NULL;

-- Create a safer function to split names
CREATE OR REPLACE FUNCTION public.split_full_name(input_name TEXT)
RETURNS TABLE(first_name TEXT, middle_name TEXT, family_name TEXT) AS $$
DECLARE
    name_parts TEXT[];
    parts_count INTEGER;
BEGIN
    -- Split the name and get the count
    name_parts := string_to_array(trim(input_name), ' ');
    parts_count := array_length(name_parts, 1);
    
    -- Handle different cases
    IF parts_count = 1 THEN
        -- Only one name - treat as first name
        first_name := name_parts[1];
        middle_name := NULL;
        family_name := name_parts[1]; -- Fallback
    ELSIF parts_count = 2 THEN
        -- First and last name
        first_name := name_parts[1];
        middle_name := NULL;
        family_name := name_parts[2];
    ELSE
        -- Three or more names: First [Middle...] Last
        first_name := name_parts[1];
        family_name := name_parts[parts_count];
        
        -- Build middle name from parts 2 to second-to-last
        IF parts_count > 2 THEN
            middle_name := '';
            FOR i IN 2..(parts_count-1) LOOP
                IF i > 2 THEN
                    middle_name := middle_name || ' ';
                END IF;
                middle_name := middle_name || name_parts[i];
            END LOOP;
        ELSE
            middle_name := NULL;
        END IF;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Update existing records using the safer function
UPDATE public.students 
SET 
    family_name = COALESCE(family_name, (SELECT split.family_name FROM public.split_full_name(full_name) AS split)),
    first_name = COALESCE(first_name, (SELECT split.first_name FROM public.split_full_name(full_name) AS split)),
    middle_name = COALESCE(middle_name, (SELECT split.middle_name FROM public.split_full_name(full_name) AS split))
WHERE full_name IS NOT NULL AND (family_name IS NULL OR first_name IS NULL);

-- Create the trigger function for automatic name population
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

-- Update existing records to populate display_name and full_name using the trigger
UPDATE public.students 
SET updated_at = updated_at
WHERE family_name IS NOT NULL AND first_name IS NOT NULL;

-- Now make the required fields NOT NULL
ALTER TABLE public.students 
ALTER COLUMN family_name SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN display_name SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_display_name ON public.students(owner_id, display_name);
CREATE INDEX IF NOT EXISTS idx_students_family_first ON public.students(owner_id, family_name, first_name);

-- Clean up the helper function (optional)
DROP FUNCTION IF EXISTS public.split_full_name(TEXT);

-- Add a comment to track this migration
COMMENT ON TABLE public.students IS 'Updated with structured name fields: family_name, first_name, middle_name, display_name';
