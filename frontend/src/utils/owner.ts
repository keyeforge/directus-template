import type { UserOption } from '@/types/user'

export function getOwnerNameFromOptions(
  ownerId: string | null | undefined,
  userOptions: UserOption[],
): string | null {
  if (!ownerId) return null
  const option = userOptions.find((item) => item.value === ownerId)
  if (!option) return null
  return option.label.replace(/\s*\([^)]*\)$/, '').trim() || null
}

export function withOwnerFields<T extends { owner_id?: string | null }>(
  values: T,
  userOptions: UserOption[],
): T & { owner_name?: string | null } {
  return {
    ...values,
    owner_name: getOwnerNameFromOptions(values.owner_id, userOptions),
  }
}
