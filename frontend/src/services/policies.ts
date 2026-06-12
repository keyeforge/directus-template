import {
  aggregate,
  createPolicy,
  deletePolicy,
  readPolicies,
  readPolicy,
  updatePolicy,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { PolicyInput, PolicyRecord } from '@/types/rbac'

export interface PolicyListParams {
  current?: number
  pageSize?: number
  name?: string
}

export interface PolicyListResult {
  data: PolicyRecord[]
  total: number
}

function hasFilterValue(value: unknown): value is string {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function buildPolicyFilter(params: PolicyListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

export async function listPolicies(
  params: PolicyListParams = {},
): Promise<PolicyListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildPolicyFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['name' as const],
    fields: [
      'id',
      'name',
      'icon',
      'description',
      'ip_access',
      'enforce_tfa',
      'admin_access',
      'app_access',
    ] as const,
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readPolicies(listQuery),
  )) as PolicyRecord[]

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('directus_policies', {
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

export async function listAllPolicies(): Promise<PolicyRecord[]> {
  return directus.request(
    readPolicies({
      fields: ['id', 'name', 'admin_access', 'app_access'],
      sort: ['name'],
      limit: -1,
    }),
  ) as Promise<PolicyRecord[]>
}

export async function getPolicy(id: string): Promise<PolicyRecord> {
  return directus.request(
    readPolicy(id, {
      fields: [
        'id',
        'name',
        'icon',
        'description',
        'ip_access',
        'enforce_tfa',
        'admin_access',
        'app_access',
      ],
    }),
  ) as Promise<PolicyRecord>
}

function sanitizePolicyInput(item: Partial<PolicyInput>) {
  const payload: Record<string, unknown> = { ...item }
  if (payload.icon === null) delete payload.icon
  return payload
}

export async function createPolicyRecord(
  item: PolicyInput,
): Promise<PolicyRecord> {
  return directus.request(
    createPolicy(sanitizePolicyInput(item) as never),
  ) as Promise<PolicyRecord>
}

export async function updatePolicyRecord(
  id: string,
  item: Partial<PolicyInput>,
): Promise<PolicyRecord> {
  return directus.request(
    updatePolicy(id, sanitizePolicyInput(item) as never),
  ) as Promise<PolicyRecord>
}

export async function removePolicy(id: string): Promise<void> {
  await directus.request(deletePolicy(id))
}
