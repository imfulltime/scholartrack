-- Add gender field to students and implement universal student ID system

-- 1. Add gender field to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('Male', 'Female'));

-- 2. Create a global student ID sequence for universal IDs
CREATE SEQUENCE IF NOT EXISTS public.global_student_id_seq START 1000001;

-- 3. Add universal student ID field
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS universal_id VARCHAR(20) UNIQUE;

-- 4. Create function to generate universal student ID
CREATE OR REPLACE FUNCTION public.generate_universal_student_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  next_id INTEGER;
  formatted_id VARCHAR(20);
  current_year INTEGER;
BEGIN
  -- Get current school year
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get next ID from sequence
  next_id := nextval('public.global_student_id_seq');
  
  -- Format: SY2024-1000001 (School Year + Sequential Number)
  formatted_id := 'SY' || current_year || '-' || LPAD(next_id::text, 7, '0');
  
  RETURN formatted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to auto-generate universal ID on student creation
CREATE OR REPLACE FUNCTION public.set_universal_student_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set universal_id if it's not already provided
  IF NEW.universal_id IS NULL THEN
    NEW.universal_id := public.generate_universal_student_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS set_universal_student_id_trigger ON public.students;
CREATE TRIGGER set_universal_student_id_trigger
  BEFORE INSERT ON public.students
  FOR EACH ROW 
  EXECUTE FUNCTION public.set_universal_student_id();

-- 6. Backfill universal IDs for existing students
DO $$
DECLARE
  student_record RECORD;
BEGIN
  FOR student_record IN 
    SELECT id FROM public.students WHERE universal_id IS NULL
  LOOP
    UPDATE public.students 
    SET universal_id = public.generate_universal_student_id()
    WHERE id = student_record.id;
  END LOOP;
END $$;

-- 7. Set default gender for existing students (can be updated by teachers)
UPDATE public.students 
SET gender = 'Male' 
WHERE gender IS NULL;

-- 8. Now make gender NOT NULL
ALTER TABLE public.students 
ALTER COLUMN gender SET NOT NULL;

-- 9. Update the update trigger function for students to handle new fields
CREATE OR REPLACE FUNCTION public.update_student_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Update display_name and full_name as before
    NEW.display_name := NEW.family_name || ', ' || NEW.first_name || COALESCE(' ' || NEW.middle_name, '');
    NEW.full_name := NEW.first_name || COALESCE(' ' || NEW.middle_name, '') || ' ' || NEW.family_name;
    
    -- Ensure universal_id is set
    IF NEW.universal_id IS NULL THEN
        NEW.universal_id := public.generate_universal_student_id();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_gender ON public.students(gender);
CREATE INDEX IF NOT EXISTS idx_students_universal_id ON public.students(universal_id);
CREATE INDEX IF NOT EXISTS idx_students_gender_family_name ON public.students(gender, family_name);

-- 11. Update RLS policies to include new fields (they inherit owner_id restrictions)
-- No additional RLS changes needed as gender and universal_id are student attributes

-- Add helpful comments
COMMENT ON COLUMN public.students.gender IS 'Student gender: Male or Female';
COMMENT ON COLUMN public.students.universal_id IS 'Universal student ID unique across the entire school system';
COMMENT ON SEQUENCE public.global_student_id_seq IS 'Global sequence for generating unique student IDs across all teachers/schools';
COMMENT ON FUNCTION public.generate_universal_student_id() IS 'Generates unique student IDs in format SY2024-1000001';
