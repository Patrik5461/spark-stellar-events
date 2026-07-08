
-- 1. Move has_role to a private schema so it is not exposed via the API
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

revoke all on function private.has_role(uuid, public.app_role) from public;
grant execute on function private.has_role(uuid, public.app_role) to anon, authenticated, service_role;

-- 2. Recreate all policies that referenced public.has_role to use private.has_role

-- user_roles
drop policy if exists "roles self read" on public.user_roles;
create policy "roles self read" on public.user_roles
  for select to authenticated
  using ((auth.uid() = user_id) or private.has_role(auth.uid(), 'admin'::public.app_role));

-- gallery_images
drop policy if exists "gallery admin write" on public.gallery_images;
create policy "gallery admin write" on public.gallery_images
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- site_settings
drop policy if exists "settings admin update" on public.site_settings;
create policy "settings admin update" on public.site_settings
  for update to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- services
drop policy if exists "services admin write" on public.services;
create policy "services admin write" on public.services
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- contact_messages
drop policy if exists "messages admin delete" on public.contact_messages;
create policy "messages admin delete" on public.contact_messages
  for delete to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "messages admin read" on public.contact_messages;
create policy "messages admin read" on public.contact_messages
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "messages admin update" on public.contact_messages;
create policy "messages admin update" on public.contact_messages
  for update to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));

-- health_logs
drop policy if exists "health admin read" on public.health_logs;
create policy "health admin read" on public.health_logs
  for select to authenticated
  using (private.has_role(auth.uid(), 'admin'::public.app_role));

-- storage.objects gallery policies
drop policy if exists "gallery admin delete" on storage.objects;
create policy "gallery admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and private.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "gallery admin insert" on storage.objects;
create policy "gallery admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and private.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "gallery admin update" on storage.objects;
create policy "gallery admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery' and private.has_role(auth.uid(), 'admin'::public.app_role))
  with check (bucket_id = 'gallery' and private.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Drop the public.has_role function now that nothing references it
drop function if exists public.has_role(uuid, public.app_role);

-- 4. Replace "always true" WITH CHECK policies with meaningful checks

-- contact_messages: validate the submission has required fields
drop policy if exists "messages public insert" on public.contact_messages;
create policy "messages public insert" on public.contact_messages
  for insert to anon
  with check (
    length(btrim(name)) between 1 and 200
    and length(btrim(email)) between 3 and 200
    and email like '%_@_%.__%'
    and length(btrim(message)) between 1 and 5000
  );

drop policy if exists "messages auth insert" on public.contact_messages;
create policy "messages auth insert" on public.contact_messages
  for insert to authenticated
  with check (
    length(btrim(name)) between 1 and 200
    and length(btrim(email)) between 3 and 200
    and email like '%_@_%.__%'
    and length(btrim(message)) between 1 and 5000
  );

-- health_logs: restrict inserts to admins only
drop policy if exists "health auth insert" on public.health_logs;
create policy "health admin insert" on public.health_logs
  for insert to authenticated
  with check (private.has_role(auth.uid(), 'admin'::public.app_role));
