import { createClient } from '@/lib/supabase/server'

// Audit logging utility
export async function logAudit(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  meta?: Record<string, any>
) {
  const supabase = createClient()
  
  await supabase
    .from('audit_log')
    .insert({
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      meta,
      owner_id: userId,
    })
}

// Helper to get user from request
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Helper to ensure owner_id is set
export function withOwnership<T extends Record<string, any>>(
  data: T,
  ownerId: string
): T & { owner_id: string } {
  return {
    ...data,
    owner_id: ownerId,
  }
}
