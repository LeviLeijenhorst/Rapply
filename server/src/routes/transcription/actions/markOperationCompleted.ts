import { execute } from "../../../db"

export async function markOperationCompleted(params: { operationId: string; userId: string }): Promise<void> {
  await execute(
    `
    update public.transcription_operations
    set status = 'completed',
        completed_at = now()
    where operation_id = $1
      and user_id = $2
    `,
    [params.operationId, params.userId],
  )
}
