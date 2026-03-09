create table if not exists public.integration_oauth_states (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  state text not null,
  code_verifier text not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint integration_oauth_states_provider_allowed check (provider in ('pipedrive')),
  constraint integration_oauth_states_state_length check (char_length(state) > 0 and char_length(state) <= 200),
  constraint integration_oauth_states_code_verifier_length check (char_length(code_verifier) > 0 and char_length(code_verifier) <= 255)
);

create index if not exists integration_oauth_states_owner_user_id_idx on public.integration_oauth_states (owner_user_id);
create index if not exists integration_oauth_states_provider_idx on public.integration_oauth_states (provider);

create table if not exists public.integration_connections (
  id text primary key,
  owner_user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  account_label text,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_scope text,
  token_type text,
  token_expires_at timestamptz,
  status text not null default 'active',
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint integration_connections_provider_allowed check (provider in ('pipedrive')),
  constraint integration_connections_status_allowed check (status in ('active', 'revoked'))
);

create index if not exists integration_connections_owner_user_id_idx on public.integration_connections (owner_user_id);
create index if not exists integration_connections_provider_idx on public.integration_connections (provider);
