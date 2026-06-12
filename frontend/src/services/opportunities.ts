import {
  aggregate,
  createItem,
  deleteItem,
  readItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { Contact } from '@/types/contact'
import type { Customer } from '@/types/customer'
import type {
  Opportunity,
  OpportunityInput,
  OpportunityListItem,
} from '@/types/opportunity'

export interface OpportunityListParams {
  current?: number
  pageSize?: number
  name?: string
  customer_id?: number
  stage?: string
  owner_name?: string
}

export interface OpportunityListResult {
  data: OpportunityListItem[]
  total: number
}

function hasFilterValue(value: unknown): value is string | number {
  if (value === undefined || value === null) return false
  if (typeof value === 'number') return true
  return String(value).trim() !== ''
}

function buildOpportunityFilter(params: OpportunityListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  if (hasFilterValue(params.customer_id)) {
    filter.customer_id = { _eq: Number(params.customer_id) }
  }

  if (hasFilterValue(params.stage)) {
    filter.stage = { _eq: String(params.stage) }
  }

  if (hasFilterValue(params.owner_name)) {
    filter.owner_name = { _icontains: String(params.owner_name).trim() }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

async function buildCustomerNameMap(
  customerIds: number[],
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(customerIds.filter((id) => id > 0))]
  if (!uniqueIds.length) return new Map()

  const customers = (await directus.request(
    readItems('customers', {
      filter: { id: { _in: uniqueIds } },
      fields: ['id', 'name', 'company'],
      limit: uniqueIds.length,
    }),
  )) as Pick<Customer, 'id' | 'name' | 'company'>[]

  return new Map(
    customers.map((customer) => [
      customer.id,
      customer.company
        ? `${customer.name}（${customer.company}）`
        : customer.name,
    ]),
  )
}

async function buildContactNameMap(
  contactIds: number[],
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(contactIds.filter((id) => id > 0))]
  if (!uniqueIds.length) return new Map()

  const contacts = (await directus.request(
    readItems('contacts', {
      filter: { id: { _in: uniqueIds } },
      fields: ['id', 'name'],
      limit: uniqueIds.length,
    }),
  )) as Pick<Contact, 'id' | 'name'>[]

  return new Map(contacts.map((contact) => [contact.id, contact.name]))
}

function enrichOpportunities(
  opportunities: Opportunity[],
  customerNameMap: Map<number, string>,
  contactNameMap: Map<number, string>,
): OpportunityListItem[] {
  return opportunities.map((opportunity) => ({
    ...opportunity,
    customer_name: customerNameMap.get(opportunity.customer_id),
    contact_name: opportunity.contact_id
      ? contactNameMap.get(opportunity.contact_id)
      : undefined,
  }))
}

export async function listOpportunities(
  params: OpportunityListParams = {},
): Promise<OpportunityListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildOpportunityFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readItems('opportunities', listQuery),
  )) as Opportunity[]

  const customerNameMap = await buildCustomerNameMap(
    data.map((opportunity) => opportunity.customer_id),
  )
  const contactNameMap = await buildContactNameMap(
    data
      .map((opportunity) => opportunity.contact_id)
      .filter((id): id is number => typeof id === 'number'),
  )

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('opportunities', {
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
    data: enrichOpportunities(data, customerNameMap, contactNameMap),
    total,
  }
}

export async function createOpportunity(
  item: OpportunityInput,
): Promise<Opportunity> {
  return directus.request(
    createItem('opportunities', item),
  ) as Promise<Opportunity>
}

export async function updateOpportunity(
  id: number,
  item: Partial<OpportunityInput>,
): Promise<Opportunity> {
  return directus.request(
    updateItem('opportunities', id, item),
  ) as Promise<Opportunity>
}

export async function removeOpportunity(id: number): Promise<void> {
  await directus.request(deleteItem('opportunities', id))
}

export async function getOpportunity(
  id: number,
): Promise<OpportunityListItem> {
  const opportunity = (await directus.request(
    readItem('opportunities', id),
  )) as Opportunity
  const customerNameMap = await buildCustomerNameMap([opportunity.customer_id])
  const contactNameMap = opportunity.contact_id
    ? await buildContactNameMap([opportunity.contact_id])
    : new Map<number, string>()
  return enrichOpportunities([opportunity], customerNameMap, contactNameMap)[0]
}

export async function listCustomerOptions(): Promise<
  { label: string; value: number }[]
> {
  const customers = (await directus.request(
    readItems('customers', {
      fields: ['id', 'name', 'company'],
      sort: ['name'],
      limit: -1,
    }),
  )) as Pick<Customer, 'id' | 'name' | 'company'>[]

  return customers.map((customer) => ({
    value: customer.id,
    label: customer.company
      ? `${customer.name}（${customer.company}）`
      : customer.name,
  }))
}

export async function listContactOptions(
  customerId?: number,
): Promise<{ label: string; value: number }[]> {
  const contacts = (await directus.request(
    readItems('contacts', {
      fields: ['id', 'name', 'customer_id'],
      sort: ['name'],
      limit: -1,
      ...(customerId
        ? { filter: { customer_id: { _eq: customerId } } }
        : {}),
    }),
  )) as Pick<Contact, 'id' | 'name' | 'customer_id'>[]

  return contacts.map((contact) => ({
    value: contact.id,
    label: contact.name,
  }))
}
