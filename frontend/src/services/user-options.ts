import { readUsers } from '@directus/sdk'
import { directus } from '@/services/directus'
import type { UserOption } from '@/types/user'

function formatUserLabel(user: {
  first_name?: string | null
  last_name?: string | null
  email: string
}): string {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return fullName ? `${fullName} (${user.email})` : user.email
}

export async function listUserOptions(
  excludeId?: string,
): Promise<UserOption[]> {
  const users = (await directus.request(
    readUsers({
      fields: ['id', 'email', 'first_name', 'last_name'],
      filter: { status: { _eq: 'active' } },
      sort: ['email'],
      limit: -1,
    }),
  )) as Array<{
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
  }>

  return users
    .filter((user) => user.id !== excludeId)
    .map((user) => ({
      label: formatUserLabel(user),
      value: user.id,
    }))
}
