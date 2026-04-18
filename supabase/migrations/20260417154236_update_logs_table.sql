-- Link to the profiles table for user_id foreign key.
ALTER TABLE public.access_logs DROP CONSTRAINT IF EXISTS access_logs_user_id_fkey;

ALTER TABLE public.access_logs 
  ADD CONSTRAINT access_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- Drop the old restrictive RLS policy
DROP POLICY IF EXISTS "Allow admins to read access logs" ON public.access_logs;

-- Create the proper policy that includes Super Admins
CREATE POLICY "Allow admins and super_admins to read access logs" 
ON public.access_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  )
);
