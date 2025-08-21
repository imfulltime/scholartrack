-- Fix the grading periods exclusion constraint
-- Remove the problematic GIST constraint and use a simpler approach

-- Drop the problematic constraint
ALTER TABLE public.grading_periods 
DROP CONSTRAINT IF EXISTS grading_periods_owner_id_is_current_excl;

-- Create a unique partial index instead
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_grading_periods_one_current_per_owner 
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
DROP TRIGGER IF EXISTS enforce_single_current_period_trigger ON public.grading_periods;
CREATE TRIGGER enforce_single_current_period_trigger
  BEFORE INSERT OR UPDATE ON public.grading_periods
  FOR EACH ROW 
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.enforce_single_current_period();

-- Also ensure we have proper constraints
ALTER TABLE public.grading_periods 
DROP CONSTRAINT IF EXISTS unique_period_per_school_year;

ALTER TABLE public.grading_periods 
ADD CONSTRAINT unique_period_per_school_year 
UNIQUE (owner_id, school_year, period_number);

-- Add comment
COMMENT ON INDEX idx_grading_periods_one_current_per_owner IS 'Ensures only one current grading period per teacher';
