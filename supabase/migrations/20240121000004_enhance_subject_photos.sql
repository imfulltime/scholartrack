-- Enhance subject photos with multiple photos and auto-expiry
-- This allows up to 5 photos per subject that expire after 48 hours

-- Create subject_photos table for multiple photos per subject
CREATE TABLE IF NOT EXISTS public.subject_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_public_id TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subject_photos_subject_id ON public.subject_photos(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_photos_owner_id ON public.subject_photos(owner_id);
CREATE INDEX IF NOT EXISTS idx_subject_photos_expires_at ON public.subject_photos(expires_at);
CREATE INDEX IF NOT EXISTS idx_subject_photos_subject_order ON public.subject_photos(subject_id, display_order);

-- Enable RLS
ALTER TABLE public.subject_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subject_photos
CREATE POLICY "Teachers can view their subject photos" ON public.subject_photos
FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Teachers can insert their subject photos" ON public.subject_photos
FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Teachers can update their subject photos" ON public.subject_photos
FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Teachers can delete their subject photos" ON public.subject_photos
FOR DELETE USING (auth.uid() = owner_id);

-- Function to clean up expired photos
CREATE OR REPLACE FUNCTION public.cleanup_expired_photos()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.subject_photos 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup in audit_log if we have any deletions
  IF deleted_count > 0 THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, changes)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid, -- System user
      'DELETE',
      'subject_photos',
      '00000000-0000-0000-0000-000000000000'::uuid,
      jsonb_build_object('cleanup_count', deleted_count, 'reason', 'auto_expiry')
    );
  END IF;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce 5-photo limit per subject
CREATE OR REPLACE FUNCTION public.enforce_photo_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this insert would exceed the 5-photo limit
  IF (
    SELECT COUNT(*) 
    FROM public.subject_photos 
    WHERE subject_id = NEW.subject_id 
    AND expires_at > NOW()
  ) >= 5 THEN
    RAISE EXCEPTION 'Subject can have maximum 5 active photos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce photo limit
DROP TRIGGER IF EXISTS enforce_photo_limit_trigger ON public.subject_photos;
CREATE TRIGGER enforce_photo_limit_trigger
  BEFORE INSERT ON public.subject_photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_photo_limit();

-- Update trigger for subject_photos
CREATE OR REPLACE FUNCTION public.update_subject_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subject_photos_updated_at_trigger ON public.subject_photos;
CREATE TRIGGER update_subject_photos_updated_at_trigger
  BEFORE UPDATE ON public.subject_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_subject_photos_updated_at();

-- Migrate existing photo data from subjects table to subject_photos table
INSERT INTO public.subject_photos (subject_id, photo_url, photo_public_id, expires_at, owner_id, created_at)
SELECT 
  id as subject_id,
  photo_url,
  photo_public_id,
  photo_uploaded_at + INTERVAL '48 hours' as expires_at,
  owner_id,
  photo_uploaded_at as created_at
FROM public.subjects 
WHERE photo_url IS NOT NULL 
AND photo_uploaded_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.subject_photos IS 'Multiple photos per subject with 48-hour auto-expiry';
COMMENT ON COLUMN public.subject_photos.expires_at IS 'Photos automatically expire after 48 hours';
COMMENT ON COLUMN public.subject_photos.display_order IS 'Order for displaying photos (1-5)';
COMMENT ON FUNCTION public.cleanup_expired_photos() IS 'Removes expired photos automatically';
COMMENT ON FUNCTION public.enforce_photo_limit() IS 'Ensures maximum 5 photos per subject';
