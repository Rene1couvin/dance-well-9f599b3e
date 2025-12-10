-- Allow admins to update bookings (for confirmation)
CREATE POLICY "Admins can update bookings"
ON public.bookings
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Allow admins to update class enrollments (for confirmation)
CREATE POLICY "Admins can update enrollments"
ON public.class_enrollments
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));