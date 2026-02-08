-- Create holidays table for storing disabled dates
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view holidays (needed for date picker)
CREATE POLICY "Anyone can view holidays"
  ON public.holidays
  FOR SELECT
  USING (true);

-- Only admins can manage holidays
CREATE POLICY "Admins can insert holidays"
  ON public.holidays
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update holidays"
  ON public.holidays
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete holidays"
  ON public.holidays
  FOR DELETE
  USING (public.is_admin());

-- Add index for efficient date queries
CREATE INDEX idx_holidays_date ON public.holidays(date);