import {
  aggregate,
  createRole,
  deleteRole,
  readRole,
  readRoles,
  updateRole,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { RoleInput, RolePolicyLink, RoleRecord } from '@/types/rbac'

interface RoleAccessLink {
  id: string
  policy: string | { id: string }
}

export interface RoleListParams {
  current?: number
  pageSize?: number
  name?: string
}

export interface RoleListResult {
  data: RoleRecord[]
  total: number
}

const roleFields = [
  'id',
  'name',
  'icon',
  'description',
  'parent',
  {
    policies: ['id', { policy: ['id', 'name'] }],
  },
  { users: ['id'] },
] as const

function hasFilterValue(value: unknown): value is string {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function buildRoleFilter(params: RoleListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

function extractPolicyIds(policies: RolePolicyLink[] | null | undefined): string[] {
  if (!policies?.length) return []

  return policies
    .map((entry) => {
      const policy = entry.policy
      if (!policy) return null
      return typeof policy === 'string' ? policy : policy.id
    })
    .filter((id): id is string => Boolean(id))
}

export async function listRolesDetailed(
  params: RoleListParams = {},
): Promise<RoleListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildRoleFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['name' as const],
    fields: roleFields,
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readRoles(listQuery as never),
  )) as RoleRecord[]

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('directus_roles', {
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

  return { data, total }
}

export async function listAllRoles(): Promise<RoleRecord[]> {
  return directus.request(
    readRoles({
      fields: ['id', 'name'],
      sort: ['name'],
      limit: -1,
    }),
  ) as Promise<RoleRecord[]>
}

function sanitizeRoleInput(item: Partial<RoleInput>) {
  const payload: Record<string, unknown> = { ...item }
  delete payload.policyIds
  if (payload.icon === null) delete payload.icon
  return payload
}

export async function createRoleRecord(item: RoleInput): Promise<RoleRecord> {
  const { policyIds, ...roleData } = item
  const role = (await directus.request(
    createRole(sanitizeRoleInput(roleData) as never),
  )) as RoleRecord

  if (policyIds?.length) {
    await syncRolePolicies(role.id, policyIds)
  }

  return role
}

export async function updateRoleRecord(
  id: string,
  item: Partial<RoleInput>,
): Promise<RoleRecord> {
  const { policyIds, ...roleData } = item
  const role = (await directus.request(
    updateRole(id, sanitizeRoleInput(roleData) as never),
  )) as RoleRecord

  if (policyIds !== undefined) {
    await syncRolePolicies(id, policyIds)
  }

  return role
}

export async function removeRole(id: string): Promise<void> {
  await directus.request(deleteRole(id))
}

function extractPolicyId(policy: RoleAccessLink['policy']): string | null {
  if (!policy) return null
  return typeof policy === 'string' ? policy : policy.id
}

async function loadRoleAccessLinks(roleId: string): Promise<RoleAccessLink[]> {
  const role = (await directus.request(
    readRole(roleId, {
      fields: [
        {
          policies: ['id', 'policy'],
        },
      ],
    } as never),
  )) as { policies?: RoleAccessLink[] | null }

  return role.policies ?? []
}

function buildPolicyRelationDelta(
  existing: RoleAccessLink[],
  policyIds: string[],
) {
  const existingByPolicyId = new Map<string, RoleAccessLink>()

  for (const link of existing) {
    const policyId = extractPolicyId(link.policy)
    if (policyId) {
      existingByPolicyId.set(policyId, link)
    }
  }

  const targetPolicyIds = new Set(policyIds)
  const create = policyIds
    .filter((policyId) => !existingByPolicyId.has(policyId))
    .map((policyId) => ({ policy: policyId }))
  const deleteIds = [...existingByPolicyId.entries()]
    .filter(([policyId]) => !targetPolicyIds.has(policyId))
    .map(([, link]) => link.id)

  return { create, delete: deleteIds }
}

async function syncRolePolicies(
  roleId: string,
  policyIds: string[],
): Promise<void> {
  const existing = await loadRoleAccessLinks(roleId)
  const delta = buildPolicyRelationDelta(existing, policyIds)

  if (!delta.create.length && !delta.delete.length) return

  await directus.request(
    updateRole(roleId, {
      policies: {
        create: delta.create,
        delete: delta.delete,
        update: [],
      },
    } as never),
  )
}

export function getRolePolicyIds(role: RoleRecord): string[] {
  return extractPolicyIds(role.policies ?? undefined)
}
