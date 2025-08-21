-- Create customizable assessment types system
-- Allows teachers to define custom assessment types with percentage weights

-- Create assessment_types table
CREATE TABLE IF NOT EXISTS public.assessment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  percentage_weight DECIMAL(5,2) NOT NULL CHECK (percentage_weight >= 0 AND percentage_weight <= 100),
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique names per teacher
  UNIQUE(owner_id, name)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_assessment_types_owner_id ON public.assessment_types(owner_id);
CREATE INDEX IF NOT EXISTS idx_assessment_types_active ON public.assessment_types(owner_id, is_active);

-- Enable RLS
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can manage their assessment types" ON public.assessment_types
FOR ALL USING (auth.uid() = owner_id);

-- Add custom assessment type to assessments table
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS assessment_type_id UUID REFERENCES public.assessment_types(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_type_id ON public.assessments(assessment_type_id);

-- Function to validate total percentage doesn't exceed 100%
CREATE OR REPLACE FUNCTION public.validate_assessment_types_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage DECIMAL(5,2);
BEGIN
  -- Calculate total percentage for this teacher's active assessment types
  SELECT COALESCE(SUM(percentage_weight), 0) 
  INTO total_percentage
  FROM public.assessment_types 
  WHERE owner_id = NEW.owner_id 
  AND is_active = true 
  AND id != COALESCE(OLD.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Add the new/updated percentage
  total_percentage := total_percentage + NEW.percentage_weight;
  
  -- Check if total exceeds 100%
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'Total percentage of all active assessment types cannot exceed 100%%. Current total would be: %', total_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate percentages
DROP TRIGGER IF EXISTS validate_assessment_types_percentage_trigger ON public.assessment_types;
CREATE TRIGGER validate_assessment_types_percentage_trigger
  BEFORE INSERT OR UPDATE ON public.assessment_types
  FOR EACH ROW 
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.validate_assessment_types_percentage();

-- Update trigger for assessment_types
CREATE OR REPLACE FUNCTION public.update_assessment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assessment_types_updated_at_trigger ON public.assessment_types;
CREATE TRIGGER update_assessment_types_updated_at_trigger
  BEFORE UPDATE ON public.assessment_types
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_types_updated_at();

-- Create default assessment types for existing users
-- This will populate common assessment types for all existing teachers
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT owner_id 
        FROM public.subjects 
        WHERE owner_id IS NOT NULL
    LOOP
        -- Only insert if user doesn't have any assessment types yet
        IF NOT EXISTS (
            SELECT 1 FROM public.assessment_types 
            WHERE owner_id = user_record.owner_id
        ) THEN
            INSERT INTO public.assessment_types (name, description, percentage_weight, is_default, owner_id) VALUES
            ('Quizzes', 'Short assessments and pop quizzes', 20.00, true, user_record.owner_id),
            ('Assignments', 'Homework and class assignments', 25.00, true, user_record.owner_id),
            ('Midterm Exam', 'Middle of term comprehensive exam', 25.00, true, user_record.owner_id),
            ('Final Exam', 'End of term comprehensive exam', 30.00, true, user_record.owner_id);
        END IF;
    END LOOP;
END $$;

-- Function to calculate final grades based on assessment type percentages
CREATE OR REPLACE FUNCTION public.calculate_final_grade(
  p_student_id UUID,
  p_class_id UUID
) RETURNS TABLE (
  final_grade DECIMAL(5,2),
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
BEGIN
  -- Get the class owner to find their assessment types
  DECLARE class_owner UUID;
  SELECT owner_id INTO class_owner FROM public.classes WHERE id = p_class_id;
  
  -- Loop through active assessment types for this teacher
  FOR assessment_type_record IN 
    SELECT at.id, at.name, at.percentage_weight
    FROM public.assessment_types at
    WHERE at.owner_id = class_owner AND at.is_active = true
  LOOP
    -- Calculate average score for this assessment type
    SELECT AVG(s.raw_score / a.max_score * 100)
    INTO type_average
    FROM public.scores s
    JOIN public.assessments a ON s.assessment_id = a.id
    WHERE s.student_id = p_student_id 
    AND a.class_id = p_class_id
    AND a.assessment_type_id = assessment_type_record.id;
    
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
  
  -- Calculate final grade (adjust for missing assessment types)
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

-- Add comments
COMMENT ON TABLE public.assessment_types IS 'Teacher-defined assessment types with percentage weights';
COMMENT ON COLUMN public.assessment_types.percentage_weight IS 'Percentage weight of this assessment type in final grade (0-100)';
COMMENT ON FUNCTION public.calculate_final_grade IS 'Calculates weighted final grade based on assessment type percentages';
