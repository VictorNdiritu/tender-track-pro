
-- Drop old tables and types
DROP TABLE IF EXISTS public.entry_tasks CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.procurement_entries CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.entry_type CASCADE;
DROP TYPE IF EXISTS public.entry_status CASCADE;

-- Create bid stage enum
CREATE TYPE public.bid_stage AS ENUM ('new_lead', 'qualified', 'in_progress', 'submitted', 'won', 'lost');

-- Create bids table
CREATE TABLE public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  estimated_value NUMERIC DEFAULT 0,
  deadline TIMESTAMPTZ,
  stage public.bid_stage NOT NULL DEFAULT 'new_lead',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  document_links TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all bids" ON public.bids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update bids" ON public.bids FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete bids" ON public.bids FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Create bid activities table
CREATE TABLE public.bid_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bid_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activities" ON public.bid_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create activities" ON public.bid_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create bid notes table
CREATE TABLE public.bid_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bid_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view notes" ON public.bid_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create notes" ON public.bid_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete own notes" ON public.bid_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger for bids
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for bids
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
