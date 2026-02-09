
-- ============================================
-- FIX 1: Bookings SELECT policies (RESTRICTIVE → PERMISSIVE)
-- ============================================
DROP POLICY IF EXISTS "Admins and editors can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

CREATE POLICY "Admins and editors can view all bookings" ON public.bookings
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can delete bookings" ON public.bookings
  FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- ============================================
-- FIX 2: Class Enrollments SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Admins and editors can view all enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users can enroll in classes" ON public.class_enrollments;
DROP POLICY IF EXISTS "Users can unenroll from classes" ON public.class_enrollments;
DROP POLICY IF EXISTS "Admins can update enrollments" ON public.class_enrollments;

CREATE POLICY "Admins and editors can view all enrollments" ON public.class_enrollments
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own enrollments" ON public.class_enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in classes" ON public.class_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unenroll from classes" ON public.class_enrollments
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can update enrollments" ON public.class_enrollments
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- ============================================
-- FIX 3: Profiles SELECT policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY (ARRAY['super_admin'::app_role, 'editor'::app_role])
  ));

CREATE POLICY "Users can view own profile only" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- ============================================
-- FIX 4: Media UPDATE policy (missing)
-- ============================================
CREATE POLICY "Editors and admins can update media" ON public.media
  FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- ============================================
-- FEATURE: Waitlist table for full-capacity classes
-- ============================================
CREATE TABLE public.class_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notified_at timestamp with time zone,
  UNIQUE(user_id, class_id)
);

ALTER TABLE public.class_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join waitlist" ON public.class_waitlist
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own waitlist" ON public.class_waitlist
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can leave waitlist" ON public.class_waitlist
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all waitlist" ON public.class_waitlist
  FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins can manage waitlist" ON public.class_waitlist
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to auto-assign waitlist position
CREATE OR REPLACE FUNCTION public.assign_waitlist_position()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
  FROM public.class_waitlist
  WHERE class_id = NEW.class_id AND status = 'waiting';
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_waitlist_position
  BEFORE INSERT ON public.class_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_waitlist_position();

-- Function to auto-enroll from waitlist when someone unenrolls
CREATE OR REPLACE FUNCTION public.process_waitlist_on_unenroll()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_user RECORD;
  class_capacity integer;
  current_enrolled integer;
BEGIN
  -- Get class capacity
  SELECT capacity INTO class_capacity FROM public.classes WHERE id = OLD.class_id;
  
  -- Count current enrollments
  SELECT COUNT(*) INTO current_enrolled FROM public.class_enrollments WHERE class_id = OLD.class_id;
  
  -- If there's now space, enroll next waitlisted user
  IF current_enrolled < class_capacity THEN
    SELECT * INTO next_user FROM public.class_waitlist
    WHERE class_id = OLD.class_id AND status = 'waiting'
    ORDER BY position ASC LIMIT 1;
    
    IF next_user IS NOT NULL THEN
      -- Create enrollment
      INSERT INTO public.class_enrollments (user_id, class_id, payment_status)
      VALUES (next_user.user_id, OLD.class_id, 'pending');
      
      -- Update waitlist status
      UPDATE public.class_waitlist SET status = 'enrolled', notified_at = now()
      WHERE id = next_user.id;
      
      -- Create notification
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        next_user.user_id,
        'waitlist',
        'Spot Available!',
        'A spot has opened up in a class you were waitlisted for. You have been automatically enrolled.'
      );
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER process_waitlist_after_unenroll
  AFTER DELETE ON public.class_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.process_waitlist_on_unenroll();
