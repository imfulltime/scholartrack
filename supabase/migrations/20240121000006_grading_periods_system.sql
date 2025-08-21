-- Create Philippine K-12 grading periods system
-- 4 grading periods per school year with assessment types per period

-- Create grading_periods table
CREATE TABLE IF NOT EXISTS public.grading_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL, -- '1st Grading', '2nd Grading', etc.
  period_number INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 4),
  school_year VARCHAR(9) NOT NULL, -- e.g., '2024-2025'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique period number per school year per teacher
  UNIQUE(owner_id, school_year, period_number)
);

-- Add grading period reference to assessment_types
ALTER TABLE public.assessment_types 
ADD COLUMN IF NOT EXISTS grading_period_id UUID REFERENCES public.grading_periods(id) ON DELETE CASCADE;

-- Add grading period reference to assessments
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS grading_period_id UUID REFERENCES public.grading_periods(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_grading_periods_owner_id ON public.grading_periods(owner_id);
CREATE INDEX IF NOT EXISTS idx_grading_periods_school_year ON public.grading_periods(owner_id, school_year);
CREATE INDEX IF NOT EXISTS idx_grading_periods_current ON public.grading_periods(owner_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_assessment_types_grading_period ON public.assessment_types(grading_period_id);
CREATE INDEX IF NOT EXISTS idx_assessments_grading_period ON public.assessments(grading_period_id);

-- Enable RLS
ALTER TABLE public.grading_periods ENABLE ROW LEVEL SECURITY;

-- Create a unique partial index to enforce only one current period per owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_grading_periods_one_current_per_owner 
ON public.grading_periods (owner_id) 
WHERE is_current = true;

-- Add a trigger function to enforce only one current period per owner
CREATE OR REPLACE FUNCTION public.enforce_single_current_period()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting is_current to true, set all others to false for this owner
  IF NEW.is_current = true THEN
    UPDATE public.grading_periods 
    SET is_current = false 
    WHERE owner_id = NEW.owner_id 
    AND id != NEW.id 
    AND is_current = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER enforce_single_current_period_trigger
  BEFORE INSERT OR UPDATE ON public.grading_periods
  FOR EACH ROW 
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.enforce_single_current_period();

-- RLS Policies for grading_periods
CREATE POLICY "Teachers can manage their grading periods" ON public.grading_periods
FOR ALL USING (auth.uid() = owner_id);

-- Function to create default school year with 4 grading periods
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

    -- Create default assessment types for this period
    -- Quiz: 30%, Assignment: 40%, Exam: 30%
    -- Use ON CONFLICT to handle existing assessment types gracefully
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
    ON CONFLICT (owner_id, name) DO NOTHING;

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

-- Updated percentage validation function to work per grading period
CREATE OR REPLACE FUNCTION public.validate_assessment_types_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage DECIMAL(5,2);
BEGIN
  -- Skip validation if no grading period is set (backward compatibility)
  IF NEW.grading_period_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate total percentage for this grading period's active assessment types
  SELECT COALESCE(SUM(percentage_weight), 0) 
  INTO total_percentage
  FROM public.assessment_types 
  WHERE owner_id = NEW.owner_id 
  AND grading_period_id = NEW.grading_period_id
  AND is_active = true 
  AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Add the new/updated percentage
  total_percentage := total_percentage + NEW.percentage_weight;
  
  -- Check if total exceeds 100%
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'Total percentage for this grading period cannot exceed 100%%. Current total would be: %', total_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate period grade (same logic as before but for specific period)
CREATE OR REPLACE FUNCTION public.calculate_period_grade(
  p_student_id UUID,
  p_class_id UUID,
  p_grading_period_id UUID
) RETURNS TABLE (
  period_grade DECIMAL(5,2),
  letter_grade VARCHAR(2),
  breakdown JSONB
) AS $$
DECLARE
  assessment_type_record RECORD;
  type_average DECIMAL(5,2);
  weighted_total DECIMAL(5,2) := 0;
  total_weight DECIMAL(5,2) := 0;
  breakdown_obj JSONB := '{}';
  final_score DECIMAL(5,2);
  letter VARCHAR(2);
  class_owner UUID;
BEGIN
  -- Get the class owner
  SELECT owner_id INTO class_owner FROM public.classes WHERE id = p_class_id;
  
  -- Loop through active assessment types for this grading period
  FOR assessment_type_record IN 
    SELECT at.id, at.name, at.percentage_weight
    FROM public.assessment_types at
    WHERE at.owner_id = class_owner 
    AND at.grading_period_id = p_grading_period_id
    AND at.is_active = true
  LOOP
    -- Calculate average score for this assessment type in this period
    SELECT AVG(s.raw_score / a.max_score * 100)
    INTO type_average
    FROM public.scores s
    JOIN public.assessments a ON s.assessment_id = a.id
    WHERE s.student_id = p_student_id 
    AND a.class_id = p_class_id
    AND a.assessment_type_id = assessment_type_record.id
    AND (a.grading_period_id = p_grading_period_id OR a.grading_period_id IS NULL);
    
    -- If student has scores for this type, include in calculation
    IF type_average IS NOT NULL THEN
      weighted_total := weighted_total + (type_average * assessment_type_record.percentage_weight / 100);
      total_weight := total_weight + assessment_type_record.percentage_weight;
      
      -- Add to breakdown
      breakdown_obj := breakdown_obj || jsonb_build_object(
        assessment_type_record.name, 
        jsonb_build_object(
          'average', type_average,
          'weight', assessment_type_record.percentage_weight,
          'weighted_score', type_average * assessment_type_record.percentage_weight / 100
        )
      );
    END IF;
  END LOOP;
  
  -- Calculate period grade
  IF total_weight > 0 THEN
    final_score := weighted_total * 100 / total_weight;
  ELSE
    final_score := 0;
  END IF;
  
  -- Determine letter grade
  CASE 
    WHEN final_score >= 97 THEN letter := 'A+';
    WHEN final_score >= 93 THEN letter := 'A';
    WHEN final_score >= 90 THEN letter := 'A-';
    WHEN final_score >= 87 THEN letter := 'B+';
    WHEN final_score >= 83 THEN letter := 'B';
    WHEN final_score >= 80 THEN letter := 'B-';
    WHEN final_score >= 77 THEN letter := 'C+';
    WHEN final_score >= 73 THEN letter := 'C';
    WHEN final_score >= 70 THEN letter := 'C-';
    WHEN final_score >= 67 THEN letter := 'D+';
    WHEN final_score >= 65 THEN letter := 'D';
    ELSE letter := 'F';
  END CASE;
  
  RETURN QUERY SELECT final_score, letter, breakdown_obj;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate final grade (average of 4 grading periods)
CREATE OR REPLACE FUNCTION public.calculate_final_grade_yearly(
  p_student_id UUID,
  p_class_id UUID,
  p_school_year VARCHAR(9)
) RETURNS TABLE (
  final_grade DECIMAL(5,2),
  letter_grade VARCHAR(2),
  period_grades JSONB,
  periods_completed INTEGER
) AS $$
DECLARE
  period_record RECORD;
  period_grade_result RECORD;
  total_grade DECIMAL(5,2) := 0;
  period_count INTEGER := 0;
  final_score DECIMAL(5,2);
  letter VARCHAR(2);
  grades_obj JSONB := '{}';
  class_owner UUID;
BEGIN
  -- Get the class owner
  SELECT owner_id INTO class_owner FROM public.classes WHERE id = p_class_id;
  
  -- Loop through all grading periods for this school year
  FOR period_record IN 
    SELECT gp.id, gp.name, gp.period_number
    FROM public.grading_periods gp
    WHERE gp.owner_id = class_owner 
    AND gp.school_year = p_school_year
    ORDER BY gp.period_number
  LOOP
    -- Calculate grade for this period
    SELECT * INTO period_grade_result 
    FROM public.calculate_period_grade(p_student_id, p_class_id, period_record.id);
    
    IF period_grade_result.period_grade > 0 THEN
      total_grade := total_grade + period_grade_result.period_grade;
      period_count := period_count + 1;
      
      grades_obj := grades_obj || jsonb_build_object(
        period_record.name,
        jsonb_build_object(
          'grade', period_grade_result.period_grade,
          'letter', period_grade_result.letter_grade,
          'breakdown', period_grade_result.breakdown
        )
      );
    END IF;
  END LOOP;
  
  -- Calculate final grade (average of completed periods)
  IF period_count > 0 THEN
    final_score := total_grade / period_count;
  ELSE
    final_score := 0;
  END IF;
  
  -- Determine letter grade
  CASE 
    WHEN final_score >= 97 THEN letter := 'A+';
    WHEN final_score >= 93 THEN letter := 'A';
    WHEN final_score >= 90 THEN letter := 'A-';
    WHEN final_score >= 87 THEN letter := 'B+';
    WHEN final_score >= 83 THEN letter := 'B';
    WHEN final_score >= 80 THEN letter := 'B-';
    WHEN final_score >= 77 THEN letter := 'C+';
    WHEN final_score >= 73 THEN letter := 'C';
    WHEN final_score >= 70 THEN letter := 'C-';
    WHEN final_score >= 67 THEN letter := 'D+';
    WHEN final_score >= 65 THEN letter := 'D';
    ELSE letter := 'F';
  END CASE;
  
  RETURN QUERY SELECT final_score, letter, grades_obj, period_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for grading_periods
CREATE OR REPLACE FUNCTION public.update_grading_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grading_periods_updated_at_trigger ON public.grading_periods;
CREATE TRIGGER update_grading_periods_updated_at_trigger
  BEFORE UPDATE ON public.grading_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_grading_periods_updated_at();

-- Create default school year for existing users
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

-- Add comments
COMMENT ON TABLE public.grading_periods IS 'Philippine K-12 grading periods (4 per school year)';
COMMENT ON FUNCTION public.create_default_school_year IS 'Creates 4 grading periods with default assessment types';
COMMENT ON FUNCTION public.calculate_period_grade IS 'Calculates grade for a specific grading period';
COMMENT ON FUNCTION public.calculate_final_grade_yearly IS 'Calculates final grade as average of 4 grading periods';
