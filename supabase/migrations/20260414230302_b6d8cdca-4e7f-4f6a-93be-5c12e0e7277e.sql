-- Allow authenticated users to delete profiles (admin check done in app)
CREATE POLICY "Authenticated can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (true);
