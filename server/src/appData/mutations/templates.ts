import { execute } from "../../db"
import type { Template } from "../types"

// Creates or upserts one template row.
export async function createTemplate(userId: string, template: Template): Promise<void> {
  await execute(
    `
    insert into public.templates (id, user_id, name, sections_json, is_saved, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4::jsonb, $5, $6, $7)
    on conflict (id) do update
      set name = excluded.name,
          sections_json = excluded.sections_json,
          is_saved = excluded.is_saved,
          updated_at_unix_ms = excluded.updated_at_unix_ms
    `,
    [
      template.id,
      userId,
      template.name,
      JSON.stringify({ description: template.description, sections: template.sections }),
      template.isSaved,
      template.createdAtUnixMs,
      template.updatedAtUnixMs,
    ],
  )
}

// Updates one existing template row.
export async function updateTemplate(userId: string, template: Template): Promise<void> {
  await execute(
    `
    update public.templates
    set name = $1,
        sections_json = $2::jsonb,
        is_saved = $3,
        updated_at_unix_ms = $4
    where user_id = $5 and id = $6
    `,
    [template.name, JSON.stringify({ description: template.description, sections: template.sections }), template.isSaved, template.updatedAtUnixMs, userId, template.id],
  )
}

// Permanently deletes one template owned by the user.
export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await execute(`delete from public.templates where user_id = $1 and id = $2`, [userId, id])
}

