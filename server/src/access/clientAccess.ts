import { execute, queryMany, queryOne } from "../db"

export type OrganizationMembership = {
  organizationId: string
  role: "admin" | "regular"
}

type ClientAccessRow = {
  client_id: string
  organization_id: string
  organization_role: "admin" | "regular" | null
  assignment_role: string | null
}

function accessError(status: number, message: string): Error {
  const error: any = new Error(message)
  error.status = status
  return error as Error
}

export async function listUserOrganizationMemberships(userId: string): Promise<OrganizationMembership[]> {
  return queryMany<OrganizationMembership>(
    `
    select organization_id as "organizationId", role
    from public.organization_users
    where user_id = $1
    order by created_at_unix_ms asc
    `,
    [userId],
  )
}

export async function requireUserDefaultOrganizationId(userId: string): Promise<string> {
  const memberships = await listUserOrganizationMemberships(userId)
  if (memberships.length > 0) return memberships[0].organizationId

  const organizationId = `organization-bootstrap-${crypto.randomUUID()}`
  const nowUnixMs = Date.now()
  await execute(
    `
    insert into public.organizations (id, name, created_at_unix_ms, updated_at_unix_ms)
    values ($1, 'Organization', $2, $2)
    on conflict (id) do nothing
    `,
    [organizationId, nowUnixMs],
  )
  await execute(
    `
    insert into public.organization_users (organization_id, user_id, role, created_at_unix_ms)
    values ($1, $2, 'admin', $3)
    on conflict (organization_id, user_id) do nothing
    `,
    [organizationId, userId, nowUnixMs],
  )
  return organizationId
}

export async function isUserOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
  const row = await queryOne<{ role: "admin" | "regular" }>(
    `
    select role
    from public.organization_users
    where organization_id = $1 and user_id = $2
    limit 1
    `,
    [organizationId, userId],
  )
  return row?.role === "admin"
}

export async function readUserClientAccessRow(userId: string, clientId: string): Promise<ClientAccessRow | null> {
  return queryOne<ClientAccessRow>(
    `
    select
      c.id as client_id,
      c.organization_id,
      ou.role as organization_role,
      ca.role as assignment_role
    from public.clients c
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where c.id = $2
    limit 1
    `,
    [userId, clientId],
  )
}

export async function canUserAccessClient(userId: string, clientId: string): Promise<boolean> {
  const accessRow = await readUserClientAccessRow(userId, clientId)
  if (!accessRow?.client_id) return false
  return accessRow.organization_role === "admin" || Boolean(accessRow.assignment_role)
}

export async function assertUserCanAccessClient(userId: string, clientId: string): Promise<void> {
  const allowed = await canUserAccessClient(userId, clientId)
  if (!allowed) {
    throw accessError(403, "Forbidden")
  }
}

export async function assertUserCanManageClientAssignments(userId: string, clientId: string): Promise<void> {
  const accessRow = await readUserClientAccessRow(userId, clientId)
  if (!accessRow?.client_id) {
    throw accessError(404, "Client not found")
  }
  if (accessRow.organization_role === "admin") return
  throw accessError(403, "Only organization admins can manage client assignments")
}

export async function listAccessibleClientIds(userId: string): Promise<string[]> {
  const rows = await queryMany<{ id: string }>(
    `
    select c.id
    from public.clients c
    left join public.organization_users ou
      on ou.organization_id = c.organization_id
     and ou.user_id = $1
    left join public.client_assignments ca
      on ca.client_id = c.id
     and ca.user_id = $1
    where ou.role = 'admin'
       or ca.user_id is not null
    `,
    [userId],
  )
  return rows.map((row) => row.id)
}

export async function ensureClientAccessSchemaCompatibility(): Promise<void> {
  await execute(
    `
    alter table if exists public.clients
      add column if not exists organization_id text references public.organizations (id) on delete cascade,
      add column if not exists created_by_user_id text references public.users (id) on delete set null,
      add column if not exists primary_coach_user_id text references public.users (id) on delete set null,
      add column if not exists trajectory_start_date text,
      add column if not exists trajectory_end_date text;

    alter table if exists public.inputs
      add column if not exists organization_id text references public.organizations (id) on delete cascade,
      add column if not exists created_by_user_id text references public.users (id) on delete set null;

    alter table if exists public.inputs
      alter column client_id drop not null;

    alter table if exists public.notes
      add column if not exists created_by_user_id text references public.users (id) on delete set null;

    alter table if exists public.snippets
      add column if not exists created_by_user_id text references public.users (id) on delete set null;

    alter table if exists public.reports
      add column if not exists created_by_user_id text references public.users (id) on delete set null,
      add column if not exists primary_author_user_id text references public.users (id) on delete set null;

    create table if not exists public.client_assignments (
      client_id text not null references public.clients (id) on delete cascade,
      user_id text not null references public.users (id) on delete cascade,
      role text not null default 'coach',
      created_at_unix_ms bigint not null default (extract(epoch from now())::bigint * 1000),
      primary key (client_id, user_id)
    );

    create table if not exists public.report_coaches (
      report_id text not null references public.reports (id) on delete cascade,
      user_id text not null references public.users (id) on delete cascade,
      created_at_unix_ms bigint not null default (extract(epoch from now())::bigint * 1000),
      primary key (report_id, user_id)
    );

    create table if not exists public.billing_organizations (
      organization_id text primary key references public.organizations (id) on delete cascade,
      purchased_seconds integer not null default 0,
      admin_granted_seconds integer not null default 0,
      non_expiring_used_seconds integer not null default 0,
      cycle_used_seconds_by_key jsonb not null default '{}'::jsonb,
      cycle_granted_seconds_by_key jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    );
    `,
    [],
  )
}
