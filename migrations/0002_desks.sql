-- OpenCTO desks: one row per business headquarters, owned by a signed-in user.
-- Snapshot JSON is the full engine state so the local WASM planner can resume.

create table if not exists desks (
  id text not null primary key,
  user_id text not null,
  name text not null default '',
  snapshot jsonb not null,
  step integer not null default 0,
  section text not null default 'lead',
  created_at timestamptz not null default CURRENT_TIMESTAMP,
  updated_at timestamptz not null default CURRENT_TIMESTAMP
);

create index if not exists desks_user_id_idx on desks (user_id);
create index if not exists desks_user_updated_idx on desks (user_id, updated_at desc);
