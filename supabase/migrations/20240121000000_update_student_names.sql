-- Update students table to use separate name fields
-- Add new name columns
ALTER TABLE students 
ADD COLUMN family_name TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN middle_name TEXT;

-- Migrate existing full_name data to new fields (best effort)
-- This assumes names are in "First Middle Last" format
UPDATE students 
SET 
  family_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) >= 2 
    THEN string_to_array(full_name, ' ')[array_length(string_to_array(full_name, ' '), 1)]
    ELSE full_name
  END,
  first_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) >= 2 
    THEN string_to_array(full_name, ' ')[1]
    ELSE ''
  END,
  middle_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) >= 3 
    THEN array_to_string(string_to_array(full_name, ' ')[2:array_length(string_to_array(full_name, ' '), 1)-1], ' ')
    ELSE ''
  END
WHERE full_name IS NOT NULL;

-- Make family_name and first_name required
ALTER TABLE students 
ALTER COLUMN family_name SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL;

-- Create a computed column for display name (family_name, first_name middle_name)
-- Add a view or function to generate full display name
CREATE OR REPLACE FUNCTION get_student_display_name(family_name TEXT, first_name TEXT, middle_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
  IF middle_name IS NOT NULL AND middle_name != '' THEN
    RETURN family_name || ', ' || first_name || ' ' || middle_name;
  ELSE
    RETURN family_name || ', ' || first_name;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for sorting/display
ALTER TABLE students 
ADD COLUMN display_name TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN middle_name IS NOT NULL AND middle_name != '' 
    THEN family_name || ', ' || first_name || ' ' || middle_name
    ELSE family_name || ', ' || first_name
  END
) STORED;

-- Update RLS policies to work with new structure (no changes needed as they use owner_id)

-- Create index for sorting
CREATE INDEX idx_students_display_name ON students(owner_id, display_name);
CREATE INDEX idx_students_family_first ON students(owner_id, family_name, first_name);

-- We'll keep full_name for backward compatibility initially, but mark it as deprecated
-- Later we can drop it after confirming everything works
ALTER TABLE students ADD COLUMN full_name_deprecated BOOLEAN DEFAULT TRUE;
