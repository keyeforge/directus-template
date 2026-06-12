import {
  aggregate,
  createItem,
  deleteItem,
  readItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { Contact, ContactInput, ContactListItem } from '@/types/contact'
import type { Customer } from '@/types/customer'

export interface ContactListParams {
  current?: number
  pageSize?: number
  name?: string
  phone?: string
  mobile?: string
  customer_id?: number
}

export interface ContactListResult {
  data: ContactListItem[]
  total: number
}

function hasFilterValue(value: unknown): value is string | number {
  if (value === undefined || value === null) return false
  if (typeof value === 'number') return true
  return String(value).trim() !== ''
}

function buildContactFilter(params: ContactListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  if (hasFilterValue(params.phone)) {
    filter.phone = { _icontains: String(params.phone).trim() }
  }

  if (hasFilterValue(params.mobile)) {
    filter.mobile = { _icontains: String(params.mobile).trim() }
  }

  if (hasFilterValue(params.customer_id)) {
    filter.customer_id = { _eq: Number(params.customer_id) }
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

function enrichContacts(
  contacts: Contact[],
  customerNameMap: Map<number, string>,
): ContactListItem[] {
  return contacts.map((contact) => ({
    ...contact,
    customer_name: customerNameMap.get(contact.customer_id),
  }))
}

export async function listContacts(
  params: ContactListParams = {},
): Promise<ContactListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildContactFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readItems('contacts', listQuery),
  )) as Contact[]

  const customerNameMap = await buildCustomerNameMap(
    data.map((contact) => contact.customer_id),
  )

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('contacts', {
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
    data: enrichContacts(data, customerNameMap),
    total,
  }
}

export async function getContact(id: number): Promise<ContactListItem> {
  const contact = (await directus.request(
    readItem('contacts', id),
  )) as Contact
  const customerNameMap = await buildCustomerNameMap([contact.customer_id])
  return enrichContacts([contact], customerNameMap)[0]
}

export async function createContact(item: ContactInput): Promise<Contact> {
  return directus.request(createItem('contacts', item)) as Promise<Contact>
}

export async function updateContact(
  id: number,
  item: Partial<ContactInput>,
): Promise<Contact> {
  return directus.request(updateItem('contacts', id, item)) as Promise<Contact>
}

export async function removeContact(id: number): Promise<void> {
  await directus.request(deleteItem('contacts', id))
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
