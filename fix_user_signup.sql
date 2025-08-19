-- Fix for user signup issue
-- Run this in your Supabase SQL Editor

-- First, let's check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table with error handling
  BEGIN
    INSERT INTO public.users (id, full_name, email, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
      NEW.email, 
      'TEACHER_ADMIN'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error (you can check logs in Supabase dashboard)
    RAISE LOG 'Error inserting user: %', SQLERRM;
    -- Re-raise the error to prevent user creation if profile creation fails
    RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Check RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Add missing RLS policy for INSERT if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id)';
    END IF;
END $$;

-- Verify the users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
