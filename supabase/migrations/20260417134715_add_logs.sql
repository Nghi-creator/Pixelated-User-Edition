CREATE TABLE public.access_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    path text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to insert access logs" 
ON public.access_logs FOR INSERT 
WITH CHECK (true);
CREATE POLICY "Allow admins to read access logs" 
ON public.access_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);