-- =====================================================================
-- Jubiladores · esquema inicial
-- Ejecutar en Supabase: SQL Editor → pegar → Run
-- =====================================================================
-- Modelo de acceso: lectura PÚBLICA de todo lo publicado,
-- escritura SOLO para usuarios con rol 'admin' (tabla profiles).
-- =====================================================================

-- ---------- Tipos ----------------------------------------------------
create type pick_result as enum ('pendiente', 'ganada', 'perdida', 'anulada');
create type risk_class  as enum ('conservador', 'value', 'sin_valor');
create type match_status as enum ('programado', 'en_juego', 'finalizado', 'suspendido');

-- Veredicto del Cementerio: la primera pregunta SIEMPRE es
-- "¿fue mal proceso o solo varianza?"
create type failure_verdict as enum (
  'varianza',          -- el análisis era correcto; simplemente salió lo improbable
  'error_modelo',      -- la probabilidad estimada estaba mal
  'factor_externo',    -- roja, lesión en partido, arbitraje, clima...
  'mala_informacion'   -- alineación, bajas o datos que no conocíamos / leímos mal
);

-- ---------- Perfiles y roles -----------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique,
  role       text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea el perfil automáticamente al registrarse
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Configuración del bankroll (una sola fila) ---------------
create table bankroll_settings (
  id               int primary key default 1 check (id = 1),
  initial_bankroll numeric(12,2) not null check (initial_bankroll > 0),
  unit_value       numeric(12,2) not null check (unit_value > 0),
  currency         text not null default 'PEN',
  started_at       date not null default current_date
);

-- ---------- Partidos -------------------------------------------------
create table matches (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique,                 -- id en la API de datos (cuando la conectemos)
  competition  text not null,
  home_team    text not null,
  away_team    text not null,
  kickoff_at   timestamptz not null,
  status       match_status not null default 'programado',
  home_score   int check (home_score >= 0),
  away_score   int check (away_score >= 0),
  created_at   timestamptz not null default now()
);
create index matches_kickoff_idx on matches (kickoff_at);

-- ---------- Picks ----------------------------------------------------
-- Umbral de "conservador": probabilidad estimada >= 0.55
-- (se mantiene sincronizado con src/lib/betting.ts → CONSERVATIVE_MIN_PROB)
create table picks (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references matches(id) on delete restrict,
  market          text not null,                      -- ej. "1X2", "Over/Under 2.5", "BTTS"
  selection       text not null,                      -- ej. "Local", "Over 2.5"
  odds            numeric(7,3) not null check (odds > 1),
  stake_units     numeric(6,2) not null check (stake_units > 0),
  estimated_prob  numeric(5,4) not null check (estimated_prob > 0 and estimated_prob < 1),

  -- Calculados por la base de datos: nadie puede "maquillarlos" a mano
  implied_prob    numeric(5,4) generated always as (round(1 / odds, 4)) stored,
  edge            numeric(7,4) generated always as (round(estimated_prob * odds - 1, 4)) stored,
  risk            risk_class   generated always as (
                    case
                      when estimated_prob * odds - 1 <= 0 then 'sin_valor'::risk_class
                      when estimated_prob >= 0.55          then 'conservador'::risk_class
                      else                                      'value'::risk_class
                    end
                  ) stored,

  result          pick_result not null default 'pendiente',
  reasoning       text,                               -- por qué se publicó el pick
  published_at    timestamptz not null default now(),
  settled_at      timestamptz,
  created_by      uuid references profiles(id) default auth.uid(),

  -- Un pick resuelto debe tener fecha de resolución
  constraint settled_has_date check (result = 'pendiente' or settled_at is not null)
);
create index picks_match_idx     on picks (match_id);
create index picks_published_idx on picks (published_at desc);

-- Transparencia: una vez resuelto, la cuota/stake/probabilidad no se pueden editar
create or replace function lock_settled_pick() returns trigger
language plpgsql as $$
begin
  if old.result <> 'pendiente' and (
       new.odds is distinct from old.odds or
       new.stake_units is distinct from old.stake_units or
       new.estimated_prob is distinct from old.estimated_prob or
       new.market is distinct from old.market or
       new.selection is distinct from old.selection
     ) then
    raise exception 'No se puede modificar un pick ya resuelto (transparencia).';
  end if;
  return new;
end;
$$;

create trigger picks_lock_settled
  before update on picks
  for each row execute function lock_settled_pick();

-- Tampoco se pueden borrar picks resueltos
create or replace function prevent_settled_delete() returns trigger
language plpgsql as $$
begin
  if old.result <> 'pendiente' then
    raise exception 'No se puede borrar un pick ya resuelto (transparencia).';
  end if;
  return old;
end;
$$;

create trigger picks_no_delete_settled
  before delete on picks
  for each row execute function prevent_settled_delete();

-- ---------- El Cementerio de los Jubiladores ------------------------
create table graveyard_entries (
  id                uuid primary key default gen_random_uuid(),
  pick_id           uuid not null unique references picks(id) on delete cascade,
  verdict           failure_verdict not null,
  why_failed        text not null,
  red_card          boolean not null default false,
  rotated_lineup    boolean not null default false,   -- ¿presentó suplentes?
  odds_fair         boolean,                          -- ¿la cuota estaba bien valorada? (null = no se sabe)
  closing_odds      numeric(7,3) check (closing_odds > 1), -- cuota de cierre, para medir CLV
  lesson            text not null,                    -- ¿qué aprendemos?
  created_at        timestamptz not null default now()
);

-- Solo se entierran picks perdidos
create or replace function graveyard_only_lost() returns trigger
language plpgsql as $$
begin
  if (select result from picks where id = new.pick_id) <> 'perdida' then
    raise exception 'Solo los picks perdidos entran al Cementerio.';
  end if;
  return new;
end;
$$;

create trigger graveyard_check_lost
  before insert or update on graveyard_entries
  for each row execute function graveyard_only_lost();

-- ---------- Row Level Security ---------------------------------------
alter table profiles          enable row level security;
alter table bankroll_settings enable row level security;
alter table matches           enable row level security;
alter table picks             enable row level security;
alter table graveyard_entries enable row level security;

-- Lectura pública
create policy "lectura pública" on bankroll_settings for select using (true);
create policy "lectura pública" on matches           for select using (true);
create policy "lectura pública" on picks             for select using (true);
create policy "lectura pública" on graveyard_entries for select using (true);
create policy "ver mi perfil"   on profiles          for select using (id = auth.uid());

-- Escritura solo admin
create policy "admin escribe" on bankroll_settings for all using (is_admin()) with check (is_admin());
create policy "admin escribe" on matches           for all using (is_admin()) with check (is_admin());
create policy "admin escribe" on picks             for all using (is_admin()) with check (is_admin());
create policy "admin escribe" on graveyard_entries for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- Después de registrarte en la app, hazte admin con:
--   update profiles set role = 'admin' where id = '<tu-user-id>';
-- Y configura el bankroll:
--   insert into bankroll_settings (initial_bankroll, unit_value, currency)
--   values (1000, 10, 'PEN');
-- =====================================================================
