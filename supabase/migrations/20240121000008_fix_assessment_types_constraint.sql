-- Fix assessment types unique constraint to allow same names across grading periods
-- The issue: existing constraint prevents "Quizzes" from existing in multiple grading periods

-- First, drop the existing unique constraint that's too restrictive
ALTER TABLE public.assessment_types 
DROP CONSTRAINT IF EXISTS assessment_types_owner_id_name_key;

-- Create a new unique constraint that includes grading_period_id
-- This allows same name in different grading periods, but prevents duplicates within same period
ALTER TABLE public.assessment_types 
ADD CONSTRAINT assessment_types_owner_period_name_key 
UNIQUE (owner_id, grading_period_id, name);

-- Also handle the case where grading_period_id is NULL (legacy assessment types)
-- Create a partial unique index for legacy types (where grading_period_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_types_legacy_unique
ON public.assessment_types (owner_id, name)
WHERE grading_period_id IS NULL;

-- Clean up any existing duplicate assessment types that might block the migration
-- This handles cases where users might already have assessment types with same names
DO $$
DECLARE
    duplicate_record RECORD;
    keep_id UUID;
BEGIN
    -- Find duplicates and keep only the most recent one for each owner/name combination
    FOR duplicate_record IN 
        SELECT owner_id, name, array_agg(id ORDER BY created_at DESC) as ids
        FROM public.assessment_types 
        WHERE grading_period_id IS NULL
        GROUP BY owner_id, name 
        HAVING COUNT(*) > 1
    LOOP
        -- Keep the first (most recent) ID, delete the rest
        keep_id := duplicate_record.ids[1];
        
        -- Delete the older duplicates
        DELETE FROM public.assessment_types 
        WHERE id = ANY(duplicate_record.ids[2:])
        AND owner_id = duplicate_record.owner_id;
        
        RAISE NOTICE 'Cleaned up duplicate assessment type "%" for owner %, kept ID: %', 
                     duplicate_record.name, duplicate_record.owner_id, keep_id;
    END LOOP;
END $$;

-- Update the create_default_school_year function to handle existing assessment types
CREATE OR REPLACE FUNCTION public.create_default_school_year(
  p_owner_id UUID,
  p_school_year VARCHAR(9) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  school_year_str VARCHAR(9);
  current_year INTEGER;
  period_record RECORD;
  period_id UUID;
  result JSONB := '{"grading_periods": [], "assessment_types": []}';
  periods_array JSONB := '[]';
  types_array JSONB := '[]';
BEGIN
  -- Generate school year if not provided (e.g., '2024-2025')
  IF p_school_year IS NULL THEN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    -- If after June, it's the next school year
    IF EXTRACT(MONTH FROM CURRENT_DATE) >= 6 THEN
      school_year_str := current_year || '-' || (current_year + 1);
    ELSE
      school_year_str := (current_year - 1) || '-' || current_year;
    END IF;
  ELSE
    school_year_str := p_school_year;
  END IF;

  -- Create 4 grading periods
  FOR i IN 1..4 LOOP
    INSERT INTO public.grading_periods (
      name, 
      period_number, 
      school_year, 
      is_current,
      owner_id
    ) VALUES (
      CASE i
        WHEN 1 THEN '1st Grading'
        WHEN 2 THEN '2nd Grading'
        WHEN 3 THEN '3rd Grading'
        WHEN 4 THEN '4th Grading'
      END,
      i,
      school_year_str,
      i = 1, -- First period is current by default
      p_owner_id
    ) RETURNING id INTO period_id;

    -- Add to result
    periods_array := periods_array || jsonb_build_object(
      'id', period_id,
      'name', CASE i
        WHEN 1 THEN '1st Grading'
        WHEN 2 THEN '2nd Grading'
        WHEN 3 THEN '3rd Grading'
        WHEN 4 THEN '4th Grading'
      END,
      'period_number', i
    );

    -- Create default assessment types for this period (with INSERT ... ON CONFLICT)
    -- This prevents duplicate key errors if types already exist
    INSERT INTO public.assessment_types (
      name, 
      description, 
      percentage_weight, 
      is_default, 
      grading_period_id,
      owner_id
    ) VALUES 
    ('Quizzes', 'Short assessments and recitations', 30.00, true, period_id, p_owner_id),
    ('Assignments', 'Homework, projects, and activities', 40.00, true, period_id, p_owner_id),
    ('Exams', 'Periodic and major examinations', 30.00, true, period_id, p_owner_id)
    ON CONFLICT (owner_id, grading_period_id, name) DO NOTHING;

    -- Add to result
    types_array := types_array || jsonb_build_array(
      jsonb_build_object('name', 'Quizzes', 'weight', 30, 'grading_period', i),
      jsonb_build_object('name', 'Assignments', 'weight', 40, 'grading_period', i),
      jsonb_build_object('name', 'Exams', 'weight', 30, 'grading_period', i)
    );
  END LOOP;

  result := jsonb_build_object(
    'school_year', school_year_str,
    'grading_periods', periods_array,
    'assessment_types', types_array
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run the default school year creation for existing users (now safe from duplicates)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT owner_id 
        FROM public.subjects 
        WHERE owner_id IS NOT NULL
    LOOP
        -- Only create if user doesn't have any grading periods yet
        IF NOT EXISTS (
            SELECT 1 FROM public.grading_periods 
            WHERE owner_id = user_record.owner_id
        ) THEN
            PERFORM public.create_default_school_year(user_record.owner_id);
        END IF;
    END LOOP;
END $$;

-- Add helpful comments
COMMENT ON CONSTRAINT assessment_types_owner_period_name_key ON public.assessment_types IS 'Allows same assessment type names across different grading periods';
COMMENT ON INDEX idx_assessment_types_legacy_unique IS 'Ensures unique names for legacy assessment types (no grading period)';
