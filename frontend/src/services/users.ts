import {
  aggregate,
  createUser,
  deleteUser,
  readRoles,
  readUsers,
  updateUser,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type {
  AccountUser,
  AccountUserInput,
  DirectusRoleOption,
  UserStatus,
} from '@/types/user'

export interface UserListParams {
  current?: number
  pageSize?: number
  email?: string
  status?: UserStatus
}

export interface UserListResult {
  data: AccountUser[]
  total: number
}

function hasFilterValue(value: unknown): value is string {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function buildUserFilter(params: UserListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.email)) {
    filter.email = { _icontains: String(params.email).trim() }
  }

  if (hasFilterValue(params.status)) {
    filter.status = { _eq: params.status }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

export async function listUsers(
  params: UserListParams = {},
): Promise<UserListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildUserFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    fields: [
      'id',
      'email',
      'first_name',
      'last_name',
      'avatar',
      'status',
      'role.id',
      'role.name',
      'department_id',
      'department_id.id',
      'department_id.name',
      'manager_id',
      'manager_id.id',
      'manager_id.first_name',
      'manager_id.last_name',
      'manager_id.email',
      'last_access',
    ],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readUsers(listQuery as never),
  )) as AccountUser[]

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('directus_users', {
        aggregate: { count: '*' },
        ...(queryFilter ? { query: { filter: queryFilter } } : {}),
      }),
    )
    const countValue = Array.isArray(countResult)
      ? countResult[0]?.count
      : (countResult as { count?: string | number | null }).count
    total = Number(countValue ?? data.length)
  } catch {
    total = data.length
  }

  return {
    data,
    total,
  }
}

export async function listRoles(): Promise<DirectusRoleOption[]> {
  const roles = (await directus.request(
    readRoles({
      fields: ['id', 'name'],
      sort: ['name'],
    }),
  )) as DirectusRoleOption[]

  return roles
}

export async function createAccountUser(
  item: AccountUserInput,
): Promise<AccountUser> {
  return directus.request(createUser(item)) as Promise<AccountUser>
}

export async function updateAccountUser(
  id: string,
  item: Partial<AccountUserInput>,
): Promise<AccountUser> {
  const payload = { ...item }
  if (!payload.password) {
    delete payload.password
  }

  return directus.request(updateUser(id, payload)) as Promise<AccountUser>
}

export async function removeAccountUser(id: string): Promise<void> {
  await directus.request(deleteUser(id))
}
