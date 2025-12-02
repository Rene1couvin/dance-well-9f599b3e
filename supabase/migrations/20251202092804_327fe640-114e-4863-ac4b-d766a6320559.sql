-- Add new columns to classes table for Regular/Private categories
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS class_type TEXT DEFAULT 'regular' CHECK (class_type IN ('regular', 'private')),
ADD COLUMN IF NOT EXISTS regular_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS private_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixed_days TEXT[], -- Days for regular classes (e.g., ['Monday', 'Wednesday'])
ADD COLUMN IF NOT EXISTS available_days TEXT[]; -- Available days for private classes

-- Update existing classes to have default values
UPDATE public.classes
SET 
  class_type = 'regular',
  regular_price = COALESCE(price, 0),
  private_price = COALESCE(price, 0),
  fixed_days = ARRAY['Monday', 'Wednesday'],
  available_days = ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
WHERE class_type IS NULL;

-- Create enrollments table extension for private class scheduling
CREATE TABLE IF NOT EXISTS public.class_enrollment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE CASCADE NOT NULL,
  selected_days TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_enrollment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_enrollment_schedule
CREATE POLICY "Users can view own enrollment schedules"
ON public.class_enrollment_schedule
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_enrollments.id = enrollment_id
    AND class_enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own enrollment schedules"
ON public.class_enrollment_schedule
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_enrollments.id = enrollment_id
    AND class_enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all enrollment schedules"
ON public.class_enrollment_schedule
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role)
);

-- Create mobile_payments table for USSD payment tracking
CREATE TABLE IF NOT EXISTS public.mobile_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'RWF',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mtn', 'tigo')),
  phone_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  ussd_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.mobile_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for mobile_payments
CREATE POLICY "Users can view own payments"
ON public.mobile_payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments"
ON public.mobile_payments
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
ON public.mobile_payments
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'editor'::app_role)
);

CREATE POLICY "System can update payment status"
ON public.mobile_payments
FOR UPDATE
USING (true);

-- Add payment_status to class_enrollments
ALTER TABLE public.class_enrollments
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed'));