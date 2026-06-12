import {
  aggregate,
  createItem,
  deleteItem,
  readItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type {
  Customer,
  CustomerInput,
  CustomerLevel,
  CustomerSource,
  CustomerStatus,
} from '@/types/customer'

export interface CustomerListParams {
  current?: number
  pageSize?: number
  name?: string
  company?: string
  phone?: string
  status?: CustomerStatus
  level?: CustomerLevel
  source?: CustomerSource
}

export interface CustomerListResult {
  data: Customer[]
  total: number
}

function hasFilterValue(value: unknown): value is string {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function buildCustomerFilter(params: CustomerListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  if (hasFilterValue(params.company)) {
    filter.company = { _icontains: String(params.company).trim() }
  }

  if (hasFilterValue(params.phone)) {
    filter.phone = { _icontains: String(params.phone).trim() }
  }

  if (hasFilterValue(params.status)) {
    filter.status = { _eq: params.status }
  }

  if (hasFilterValue(params.level)) {
    filter.level = { _eq: params.level }
  }

  if (hasFilterValue(params.source)) {
    filter.source = { _eq: params.source }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

export async function listCustomers(
  params: CustomerListParams = {},
): Promise<CustomerListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildCustomerFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readItems('customers', listQuery),
  )) as Customer[]

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('customers', {
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

export async function getCustomer(id: number): Promise<Customer> {
  return directus.request(readItem('customers', id)) as Promise<Customer>
}

export async function createCustomer(item: CustomerInput): Promise<Customer> {
  return directus.request(createItem('customers', item)) as Promise<Customer>
}

export async function updateCustomer(
  id: number,
  item: Partial<CustomerInput>,
): Promise<Customer> {
  return directus.request(updateItem('customers', id, item)) as Promise<Customer>
}

export async function removeCustomer(id: number): Promise<void> {
  const followUps = (await directus.request(
    readItems('customer_follow_ups', {
      filter: { customer_id: { _eq: id } },
      fields: ['id'],
      limit: -1,
    }),
  )) as { id: number }[]

  for (const followUp of followUps) {
    await directus.request(deleteItem('customer_follow_ups', followUp.id))
  }

  await directus.request(deleteItem('customers', id))
}
