-- CRITICAL SECURITY FIX: Restrict profiles table to owner-only access
-- Drop existing public read policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create owner-only read policy
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'editor')
  )
);

-- Configure password requirements
-- Enable leaked password protection in auth settings (handled via configure-auth tool)

-- Create bookings view table for admin with full user details
CREATE TABLE IF NOT EXISTS public.booking_details_view (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on booking_details_view
ALTER TABLE public.booking_details_view ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view booking details
CREATE POLICY "Admins can view booking details"
ON public.booking_details_view
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'editor')
  )
);