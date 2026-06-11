-- ============================================================================
-- Plan de Rodajes — Esquema de identidad/membresía (Capa 1)
-- Correr en Supabase → SQL Editor → New query → pegar todo → Run.
-- Es idempotente: se puede correr varias veces sin romper nada.
-- ============================================================================

-- Membresías: qué usuario pertenece a qué productora y con qué rol.
create table if not exists public.memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  productora_id text not null,                       -- el slug actual de la productora
  role          text not null default 'member' check (role in ('owner','member')),
  created_at    timestamptz not null default now(),
  unique (user_id, productora_id)
);

create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_prod_idx on public.memberships(productora_id);

-- Invitaciones pendientes por email (para miembros que todavía no tienen cuenta).
-- Cuando esa persona se loguea con ese email, el backend convierte la invitación
-- en una membresía real.
-- Nota: el email se guarda SIEMPRE en minúsculas desde el backend, así que un
-- UNIQUE simple sobre (productora_id, email) ya es case-insensitive en la práctica.
-- (Postgres no permite expresiones como lower() en una restricción UNIQUE.)
create table if not exists public.invites (
  id            uuid primary key default gen_random_uuid(),
  productora_id text not null,
  email         text not null,
  role          text not null default 'member' check (role in ('owner','member')),
  invited_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique (productora_id, email)
);

create index if not exists invites_email_idx on public.invites(lower(email));

-- ----------------------------------------------------------------------------
-- Row Level Security
-- Las ESCRITURAS van todas por las Netlify Functions con la service key (que
-- saltea RLS), así la autorización la controla el servidor. Acá solo abrimos
-- LECTURA de lo propio para que el cliente pueda mostrar "mis productoras".
-- ----------------------------------------------------------------------------
alter table public.memberships enable row level security;
alter table public.invites     enable row level security;

drop policy if exists "read own memberships" on public.memberships;
create policy "read own memberships"
  on public.memberships for select
  using (auth.uid() = user_id);

drop policy if exists "read own invites" on public.invites;
create policy "read own invites"
  on public.invites for select
  using (lower(email) = lower(auth.jwt() ->> 'email'));
