-- Add photo functionality to subjects table
-- This allows teachers to upload photos for subjects that parents can view

-- Add photo-related columns to subjects table
ALTER TABLE public.subjects 
ADD COLUMN photo_url TEXT,
ADD COLUMN photo_public_id TEXT,
ADD COLUMN photo_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_photo_url ON public.subjects(owner_id, photo_url) WHERE photo_url IS NOT NULL;

-- Add RLS policies for photo access
-- Teachers can manage their own subject photos
CREATE POLICY "Teachers can manage subject photos" ON public.subjects
FOR UPDATE USING (auth.uid() = owner_id);

-- Add comment to track this feature
COMMENT ON COLUMN public.subjects.photo_url IS 'URL to subject photo for parent viewing';
COMMENT ON COLUMN public.subjects.photo_public_id IS 'Cloudinary/Storage public ID for photo management';
COMMENT ON COLUMN public.subjects.photo_uploaded_at IS 'Timestamp when photo was uploaded';
