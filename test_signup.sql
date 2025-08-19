-- Test script to verify user signup fix
-- Run this AFTER running the fix script

-- Test 1: Check if trigger function exists and is working
SELECT 
    proname as function_name,
    prorettype::regtype as return_type,
    proargnames as argument_names
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Test 2: Check if trigger is properly attached
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies on users table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test 4: Verify users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 5: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- If everything looks good, the signup should work now!
