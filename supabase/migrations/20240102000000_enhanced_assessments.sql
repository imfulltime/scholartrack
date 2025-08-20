-- Enhanced Assessment System Migration
-- Adds support for rubrics, weighted categories, and advanced grading

-- Add assessment categories table for weighted grading
CREATE TABLE assessment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    weight NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    description TEXT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, class_id, owner_id)
);

-- Add rubrics table for detailed assessment criteria
CREATE TABLE rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL DEFAULT '[]', -- Array of criteria objects
    scale JSONB NOT NULL DEFAULT '{"min": 0, "max": 4, "labels": ["Unsatisfactory", "Developing", "Proficient", "Exemplary"]}',
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance assessments table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES assessment_categories(id) ON DELETE SET NULL;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS rubric_id UUID REFERENCES rubrics(id) ON DELETE SET NULL;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN DEFAULT TRUE;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS late_penalty NUMERIC(5,2) DEFAULT 0.00;

-- Enhance scores table
ALTER TABLE scores ADD COLUMN IF NOT EXISTS rubric_scores JSONB; -- Detailed rubric scoring
ALTER TABLE scores ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS grade_letter TEXT;

-- Add grade scale table for letter grades
CREATE TABLE grade_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scale JSONB NOT NULL DEFAULT '[
        {"min": 97, "max": 100, "letter": "A+", "gpa": 4.0},
        {"min": 93, "max": 96, "letter": "A", "gpa": 4.0},
        {"min": 90, "max": 92, "letter": "A-", "gpa": 3.7},
        {"min": 87, "max": 89, "letter": "B+", "gpa": 3.3},
        {"min": 83, "max": 86, "letter": "B", "gpa": 3.0},
        {"min": 80, "max": 82, "letter": "B-", "gpa": 2.7},
        {"min": 77, "max": 79, "letter": "C+", "gpa": 2.3},
        {"min": 73, "max": 76, "letter": "C", "gpa": 2.0},
        {"min": 70, "max": 72, "letter": "C-", "gpa": 1.7},
        {"min": 67, "max": 69, "letter": "D+", "gpa": 1.3},
        {"min": 65, "max": 66, "letter": "D", "gpa": 1.0},
        {"min": 0, "max": 64, "letter": "F", "gpa": 0.0}
    ]',
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add analytics cache table for performance
CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cache_key, owner_id)
);

-- Enable RLS on new tables
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_categories
CREATE POLICY "Users can manage own assessment categories" ON assessment_categories
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for rubrics
CREATE POLICY "Users can manage own rubrics" ON rubrics
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for grade_scales
CREATE POLICY "Users can manage own grade scales" ON grade_scales
    FOR ALL USING (auth.uid() = owner_id);

-- RLS Policies for password_reset_tokens
CREATE POLICY "Users can view own password reset tokens" ON password_reset_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage password reset tokens" ON password_reset_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for analytics_cache
CREATE POLICY "Users can manage own analytics cache" ON analytics_cache
    FOR ALL USING (auth.uid() = owner_id);

-- Create indexes for performance
CREATE INDEX idx_assessment_categories_class_id ON assessment_categories(class_id);
CREATE INDEX idx_assessment_categories_owner_id ON assessment_categories(owner_id);
CREATE INDEX idx_rubrics_class_id ON rubrics(class_id);
CREATE INDEX idx_rubrics_owner_id ON rubrics(owner_id);
CREATE INDEX idx_assessments_category_id ON assessments(category_id);
CREATE INDEX idx_assessments_rubric_id ON assessments(rubric_id);
CREATE INDEX idx_assessments_due_date ON assessments(due_date);
CREATE INDEX idx_scores_submitted_at ON scores(submitted_at);
CREATE INDEX idx_grade_scales_class_id ON grade_scales(class_id);
CREATE INDEX idx_grade_scales_owner_id ON grade_scales(owner_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessment_categories_updated_at BEFORE UPDATE ON assessment_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rubrics_updated_at BEFORE UPDATE ON rubrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grade_scales_updated_at BEFORE UPDATE ON grade_scales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to calculate weighted grades
CREATE OR REPLACE FUNCTION calculate_weighted_grade(p_student_id UUID, p_class_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_weighted_score NUMERIC := 0;
    total_weight NUMERIC := 0;
    category_record RECORD;
    category_average NUMERIC;
BEGIN
    -- Loop through each assessment category
    FOR category_record IN 
        SELECT ac.id, ac.weight
        FROM assessment_categories ac
        WHERE ac.class_id = p_class_id
    LOOP
        -- Calculate average score for this category
        SELECT AVG(s.raw_score::NUMERIC / a.max_score::NUMERIC * 100)
        INTO category_average
        FROM scores s
        JOIN assessments a ON s.assessment_id = a.id
        WHERE s.student_id = p_student_id 
        AND a.category_id = category_record.id
        AND a.status = 'PUBLISHED';
        
        -- If student has scores in this category, include in calculation
        IF category_average IS NOT NULL THEN
            total_weighted_score := total_weighted_score + (category_average * category_record.weight / 100);
            total_weight := total_weight + category_record.weight;
        END IF;
    END LOOP;
    
    -- Calculate final weighted grade
    IF total_weight > 0 THEN
        RETURN total_weighted_score / total_weight * 100;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get letter grade
CREATE OR REPLACE FUNCTION get_letter_grade(p_score NUMERIC, p_class_id UUID)
RETURNS TEXT AS $$
DECLARE
    scale_record RECORD;
    grade_item JSONB;
BEGIN
    -- Get the grade scale for this class
    SELECT scale INTO scale_record
    FROM grade_scales 
    WHERE class_id = p_class_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If no custom scale, use default
    IF scale_record.scale IS NULL THEN
        scale_record.scale := '[
            {"min": 97, "max": 100, "letter": "A+"},
            {"min": 93, "max": 96, "letter": "A"},
            {"min": 90, "max": 92, "letter": "A-"},
            {"min": 87, "max": 89, "letter": "B+"},
            {"min": 83, "max": 86, "letter": "B"},
            {"min": 80, "max": 82, "letter": "B-"},
            {"min": 77, "max": 79, "letter": "C+"},
            {"min": 73, "max": 76, "letter": "C"},
            {"min": 70, "max": 72, "letter": "C-"},
            {"min": 67, "max": 69, "letter": "D+"},
            {"min": 65, "max": 66, "letter": "D"},
            {"min": 0, "max": 64, "letter": "F"}
        ]'::JSONB;
    END IF;
    
    -- Find matching grade
    FOR grade_item IN SELECT * FROM jsonb_array_elements(scale_record.scale)
    LOOP
        IF p_score >= (grade_item->>'min')::NUMERIC AND p_score <= (grade_item->>'max')::NUMERIC THEN
            RETURN grade_item->>'letter';
        END IF;
    END LOOP;
    
    RETURN 'F'; -- Default fallback
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
