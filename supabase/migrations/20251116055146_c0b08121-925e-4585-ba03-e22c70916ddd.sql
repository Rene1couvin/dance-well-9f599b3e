-- Grant admin role to help user access admin panel
-- This creates a function to easily make a user an admin
-- Usage: SELECT make_user_admin('user-email@example.com');

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Remove any existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Add super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin');

  RAISE NOTICE 'User % is now a super admin', user_email;
END;
$$;