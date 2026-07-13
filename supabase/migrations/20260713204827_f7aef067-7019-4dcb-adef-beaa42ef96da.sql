
CREATE POLICY "Admins read hostess photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'hostess-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete hostess photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'hostess-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update hostess photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'hostess-photos' AND public.has_role(auth.uid(), 'admin'));
