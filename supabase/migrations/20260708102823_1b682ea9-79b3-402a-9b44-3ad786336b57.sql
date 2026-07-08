
create extension if not exists pgcrypto with schema public;

do $$ begin
  create type public.app_role as enum ('admin', 'editor', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles self read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text,
  url text not null,
  alt text not null default '',
  caption text not null default '',
  category text not null default 'Ostatné',
  sort_order int not null default 0,
  is_active boolean not null default true,
  featured_on_homepage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.gallery_images to anon;
grant select, insert, update, delete on public.gallery_images to authenticated;
grant all on public.gallery_images to service_role;
alter table public.gallery_images enable row level security;
create policy "gallery public read active" on public.gallery_images for select to anon using (is_active = true);
create policy "gallery auth read all" on public.gallery_images for select to authenticated using (true);
create policy "gallery admin write" on public.gallery_images for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger gallery_updated before update on public.gallery_images for each row execute function public.set_updated_at();

create table if not exists public.site_settings (
  id int primary key default 1,
  contact_person text not null default 'Jana Henčeková',
  phone text not null default '+421 905 454 498',
  email text not null default 'info@nu-u.sk',
  address text not null default 'Gazdovská 1901/7b, 900 41 Rovinka',
  instagram_url text default 'https://instagram.com',
  linkedin_url text default 'https://linkedin.com',
  facebook_url text default 'https://facebook.com',
  billing_name text default 'nua s.r.o.',
  billing_address text default 'Gazdovská 1901/7b, 900 41 Rovinka',
  billing_ico text default '550428872',
  billing_dic text default '2121851754',
  billing_ic_dph text default 'SK2121851754',
  billing_iban text default 'SK39 8330 0000 0020 0248 9216',
  hero_headline text default 'Ľudia, ktorí robia rozdiel na každom evente.',
  hero_subtitle text default 'Profesionálny hostessing, promotéri, helperi a kompletné personálne zabezpečenie eventov na Slovensku aj v zahraničí.',
  cta_primary text default 'Kontaktujte nás',
  cta_secondary text default 'Naše služby',
  about_text text default 'Vyberáme ľudí, ktorých by sme s pokojom poslali aj na vlastnú svadbu.',
  gallery_intro text default 'Výber z eventov, promo aktivít a realizácií NU-U.',
  contact_text text default 'Odpovedáme do 24 hodín. Bez šablón, bez auto-mailov — odpíše vám konkrétny človek.',
  footer_text text default 'Hostessing, promotion a produkcia eventov. Slovensko & zahraničie.',
  updated_at timestamptz not null default now(),
  check (id = 1)
);
grant select on public.site_settings to anon;
grant select, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "settings public read" on public.site_settings for select to anon using (true);
create policy "settings auth read" on public.site_settings for select to authenticated using (true);
create policy "settings admin update" on public.site_settings for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  icon text not null default 'Sparkles',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon;
grant select, insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "services public read active" on public.services for select to anon using (is_active = true);
create policy "services auth read" on public.services for select to authenticated using (true);
create policy "services admin write" on public.services for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();
insert into public.services (title, description, icon, sort_order) values
  ('Hostessing','Profesionálne hostesky pre konferencie, výstavy, firemné akcie a spoločenské podujatia.','Sparkles',1),
  ('Promotion','Promotéri pre sampling, promo kampane a prezentáciu značiek.','Megaphone',2),
  ('Helperi','Spoľahlivý personál pre montáže, logistiku a realizáciu eventov.','HardHat',3),
  ('Produkcia','Kompletná organizačná podpora a produkcia eventov.','Clapperboard',4),
  ('Prenájom oblečenia','Prenájom profesionálneho oblečenia pre hostesky a event staff.','Shirt',5),
  ('Ostatné','Individuálne personálne riešenia podľa požiadaviek klienta.','Users2',6)
on conflict do nothing;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "messages public insert" on public.contact_messages for insert to anon with check (true);
create policy "messages auth insert" on public.contact_messages for insert to authenticated with check (true);
create policy "messages admin read" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "messages admin update" on public.contact_messages for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "messages admin delete" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  status text not null,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.health_logs to authenticated;
grant all on public.health_logs to service_role;
alter table public.health_logs enable row level security;
create policy "health admin read" on public.health_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "health auth insert" on public.health_logs for insert to authenticated with check (true);

-- Storage policies (bucket created separately via storage tool)
drop policy if exists "gallery public read" on storage.objects;
drop policy if exists "gallery admin insert" on storage.objects;
drop policy if exists "gallery admin update" on storage.objects;
drop policy if exists "gallery admin delete" on storage.objects;
create policy "gallery public read" on storage.objects for select to anon, authenticated using (bucket_id = 'gallery');
create policy "gallery admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));
create policy "gallery admin update" on storage.objects for update to authenticated using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin')) with check (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));
create policy "gallery admin delete" on storage.objects for delete to authenticated using (bucket_id = 'gallery' and public.has_role(auth.uid(), 'admin'));

-- Seed admin user
do $$
declare admin_id uuid;
begin
  select id into admin_id from auth.users where email = 'admin@nu-u.sk';
  if admin_id is null then
    admin_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      admin_id, 'authenticated', 'authenticated',
      'admin@nu-u.sk', crypt('Daninko2012', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"],"must_change_password":true}'::jsonb,
      '{"display_name":"Admin"}'::jsonb,
      false, '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email','admin@nu-u.sk'), 'email', admin_id::text, now(), now(), now());
  end if;
  insert into public.profiles (id, display_name) values (admin_id, 'Admin') on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (admin_id, 'admin') on conflict (user_id, role) do nothing;
end $$;
