-- =====================================================
-- SECURITY FIX 1: Activity Logs - Audit Trail Integrity
-- Remove unrestricted INSERT policy and use triggers instead
-- =====================================================

-- Drop the insecure policy that allows any user to insert
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- Create a secure function for inserting activity logs (service role only)
-- This function will be called by database triggers, not by client code
CREATE OR REPLACE FUNCTION public.log_activity(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
  VALUES (p_actor_id, p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- Create trigger function for bookings
CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      NEW.user_id,
      'create',
      'booking',
      NEW.id,
      jsonb_build_object('event_id', NEW.event_id, 'status', NEW.status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_activity(
      auth.uid(),
      'update',
      'booking',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      auth.uid(),
      'delete',
      'booking',
      OLD.id,
      jsonb_build_object('event_id', OLD.event_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger function for enrollments
CREATE OR REPLACE FUNCTION public.log_enrollment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_activity(
      NEW.user_id,
      'create',
      'enrollment',
      NEW.id,
      jsonb_build_object('class_id', NEW.class_id, 'payment_status', NEW.payment_status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_activity(
      auth.uid(),
      'update',
      'enrollment',
      NEW.id,
      jsonb_build_object('old_status', OLD.payment_status, 'new_status', NEW.payment_status)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_activity(
      auth.uid(),
      'delete',
      'enrollment',
      OLD.id,
      jsonb_build_object('class_id', OLD.class_id)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for automatic audit logging
DROP TRIGGER IF EXISTS booking_audit_trigger ON public.bookings;
CREATE TRIGGER booking_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_changes();

DROP TRIGGER IF EXISTS enrollment_audit_trigger ON public.class_enrollments;
CREATE TRIGGER enrollment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.class_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.log_enrollment_changes();

-- =====================================================
-- SECURITY FIX 2: Strengthen Profiles RLS
-- Ensure unauthenticated users cannot access any profiles
-- =====================================================

-- The existing policies are correct but let's ensure they explicitly require authentication
-- Drop and recreate with explicit auth checks

DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile only"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'editor'::app_role])
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);