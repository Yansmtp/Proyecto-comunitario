-- ============================================================
-- supabase.sql
-- Ejecuta este script en SUPABASE: menú "SQL Editor" -> New query -> Run
-- Crea las tablas y políticas de seguridad del proyecto.
-- ============================================================

-- 1) Testimonios (Historias que transforman)
create table if not exists public.testimonios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  autor text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Entradas del diario / blog
create table if not exists public.entradas (
  id uuid primary key default gen_random_uuid(),
  fecha text not null,
  titulo text not null,
  resumen text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- 3) Estadísticas de impacto
create table if not exists public.estadisticas (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  etiqueta text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- 4) Multimedia / galería
create table if not exists public.multimedia (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'galeria',
  url text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
--  SEGURIDAD (RLS)
--  - Público (anon): solo puede LEER.
--  - El panel admin puede escribir. Para producción se
--    recomienda activar Supabase Auth + políticas por rol.
-- ============================================================
alter table public.testimonios enable row level security;
alter table public.entradas   enable row level security;
alter table public.estadisticas enable row level security;
alter table public.multimedia  enable row level security;

-- Lectura pública de todo el contenido activo/no:
create policy "lectura publica testimonios" on public.testimonios
  for select using (true);
create policy "escritura_admin testimonios" on public.testimonios
  for all using (true) with check (true);

create policy "lectura publica entradas" on public.entradas
  for select using (true);
create policy "escritura_admin entradas" on public.entradas
  for all using (true) with check (true);

create policy "lectura publica estadisticas" on public.estadisticas
  for select using (true);
create policy "escritura_admin estadisticas" on public.estadisticas
  for all using (true) with check (true);

create policy "lectura publica multimedia" on public.multimedia
  for select using (true);
create policy "escritura_admin multimedia" on public.multimedia
  for all using (true) with check (true);

-- ============================================================
--  PERMISOS (imprescindible: por SQL hay que conceder acceso al
--  rol "anon" y "authenticated"; si no, la API devuelve 404).
-- ============================================================
grant usage on schema public to anon, authenticated;

grant all on public.testimonios  to anon, authenticated;
grant all on public.entradas     to anon, authenticated;
grant all on public.estadisticas to anon, authenticated;
grant all on public.multimedia   to anon, authenticated;

-- ============================================================
-- NOTA DE SEGURIDAD:
-- Las políticas "escritura_admin" permiten escribir con la anon key
-- (útil para el panel). En producción SIEMPRE activa Supabase Auth
-- (Email) y cambia estas políticas por:
--   for all using (auth.role() = 'authenticated')
--     with check (auth.role() = 'authenticated');
-- Así solo usuarios logueados podrán escribir.
-- ============================================================