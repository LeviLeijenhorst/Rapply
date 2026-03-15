import { execute } from "../../db"

// Marks a transcription operation as failed and stores the error message.
export async function markOperationFailed(params: { operationId: string; userId: string; errorMessage: string }): Promise<void> {
  await execute(
    `
    insert into public.transcription_operations (operation_id, owner_user_id, status, failed_at, error_message)
    values ($1, $2, 'failed', now(), $3)
    on conflict (operation_id) do update
      set owner_user_id = excluded.owner_user_id,
          status = excluded.status,
          failed_at = now(),
          error_message = excluded.error_message
    `,
    [params.operationId, params.userId, params.errorMessage],
  )
}
