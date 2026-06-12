import {
  aggregate,
  createItem,
  deleteItem,
  readItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import dayjs from 'dayjs'
import { directus } from '@/services/directus'
import {
  createOpportunity,
  updateOpportunity,
} from '@/services/opportunities'
import type { Contact } from '@/types/contact'
import type { Customer } from '@/types/customer'
import type { Opportunity, OpportunityListItem } from '@/types/opportunity'
import type { Product } from '@/types/product'
import type {
  Quote,
  QuoteDetail,
  QuoteInput,
  QuoteItem,
  QuoteItemInput,
  QuoteListItem,
} from '@/types/quote'

export interface QuoteListParams {
  current?: number
  pageSize?: number
  quote_no?: string
  title?: string
  customer_id?: number
  opportunity_id?: number
  status?: string
  owner_name?: string
}

export interface QuoteListResult {
  data: QuoteListItem[]
  total: number
}

function hasFilterValue(value: unknown): value is string | number {
  if (value === undefined || value === null) return false
  if (typeof value === 'number') return true
  return String(value).trim() !== ''
}

function buildQuoteFilter(params: QuoteListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.quote_no)) {
    filter.quote_no = { _icontains: String(params.quote_no).trim() }
  }

  if (hasFilterValue(params.title)) {
    filter.title = { _icontains: String(params.title).trim() }
  }

  if (hasFilterValue(params.customer_id)) {
    filter.customer_id = { _eq: Number(params.customer_id) }
  }

  if (hasFilterValue(params.opportunity_id)) {
    filter.opportunity_id = { _eq: Number(params.opportunity_id) }
  }

  if (hasFilterValue(params.status)) {
    filter.status = { _eq: String(params.status) }
  }

  if (hasFilterValue(params.owner_name)) {
    filter.owner_name = { _icontains: String(params.owner_name).trim() }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

export function generateQuoteNo(): string {
  return `Q${dayjs().format('YYYYMMDD')}${String(Date.now()).slice(-6)}`
}

async function buildCustomerNameMap(
  customerIds: number[],
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(customerIds.filter((id) => id > 0))]
  if (!uniqueIds.length) return new Map()

  try {
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
  } catch {
    return new Map()
  }
}

async function buildContactNameMap(
  contactIds: number[],
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(contactIds.filter((id) => id > 0))]
  if (!uniqueIds.length) return new Map()

  try {
    const contacts = (await directus.request(
      readItems('contacts', {
        filter: { id: { _in: uniqueIds } },
        fields: ['id', 'name'],
        limit: uniqueIds.length,
      }),
    )) as Pick<Contact, 'id' | 'name'>[]

    return new Map(contacts.map((contact) => [contact.id, contact.name]))
  } catch {
    return new Map()
  }
}

async function buildOpportunityNameMap(
  opportunityIds: number[],
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(opportunityIds.filter((id) => id > 0))]
  if (!uniqueIds.length) return new Map()

  try {
    const opportunities = (await directus.request(
      readItems('opportunities', {
        filter: { id: { _in: uniqueIds } },
        fields: ['id', 'name'],
        limit: uniqueIds.length,
      }),
    )) as Pick<Opportunity, 'id' | 'name'>[]

    return new Map(
      opportunities.map((opportunity) => [opportunity.id, opportunity.name]),
    )
  } catch {
    return new Map()
  }
}

function enrichQuotes(
  quotes: Quote[],
  customerNameMap: Map<number, string>,
  contactNameMap: Map<number, string>,
  opportunityNameMap: Map<number, string>,
): QuoteListItem[] {
  return quotes.map((quote) => ({
    ...quote,
    customer_name: customerNameMap.get(quote.customer_id),
    contact_name: quote.contact_id
      ? contactNameMap.get(quote.contact_id)
      : undefined,
    opportunity_name: quote.opportunity_id
      ? opportunityNameMap.get(quote.opportunity_id)
      : undefined,
  }))
}

export async function listQuotes(
  params: QuoteListParams = {},
): Promise<QuoteListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildQuoteFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readItems('quotes', listQuery),
  )) as Quote[]

  const customerNameMap = await buildCustomerNameMap(
    data.map((quote) => quote.customer_id),
  )
  const contactNameMap = await buildContactNameMap(
    data
      .map((quote) => quote.contact_id)
      .filter((id): id is number => typeof id === 'number'),
  )
  const opportunityNameMap = await buildOpportunityNameMap(
    data
      .map((quote) => quote.opportunity_id)
      .filter((id): id is number => typeof id === 'number'),
  )

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('quotes', {
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
    data: enrichQuotes(
      data,
      customerNameMap,
      contactNameMap,
      opportunityNameMap,
    ),
    total,
  }
}

export async function getQuote(id: number): Promise<QuoteDetail> {
  const quote = (await directus.request(readItem('quotes', id))) as Quote
  const items = (await directus.request(
    readItems('quote_items', {
      filter: { quote_id: { _eq: id } },
      sort: ['id'],
      limit: -1,
    }),
  )) as QuoteItem[]

  const customerNameMap = await buildCustomerNameMap([quote.customer_id])
  const contactNameMap = quote.contact_id
    ? await buildContactNameMap([quote.contact_id])
    : new Map<number, string>()
  const opportunityNameMap = quote.opportunity_id
    ? await buildOpportunityNameMap([quote.opportunity_id])
    : new Map<number, string>()

  return {
    ...enrichQuotes(
      [quote],
      customerNameMap,
      contactNameMap,
      opportunityNameMap,
    )[0],
    items,
  }
}

export async function createQuote(item: QuoteInput): Promise<Quote> {
  return directus.request(createItem('quotes', item)) as Promise<Quote>
}

export async function updateQuote(
  id: number,
  item: Partial<QuoteInput>,
): Promise<Quote> {
  return directus.request(updateItem('quotes', id, item)) as Promise<Quote>
}

export async function removeQuote(id: number): Promise<void> {
  const items = (await directus.request(
    readItems('quote_items', {
      filter: { quote_id: { _eq: id } },
      fields: ['id'],
      limit: -1,
    }),
  )) as Pick<QuoteItem, 'id'>[]

  await Promise.all(
    items.map((item) => directus.request(deleteItem('quote_items', item.id))),
  )
  await directus.request(deleteItem('quotes', id))
}

export async function listQuoteItems(quoteId: number): Promise<QuoteItem[]> {
  return directus.request(
    readItems('quote_items', {
      filter: { quote_id: { _eq: quoteId } },
      sort: ['id'],
      limit: -1,
    }),
  ) as Promise<QuoteItem[]>
}

export async function createQuoteItem(
  item: QuoteItemInput,
): Promise<QuoteItem> {
  const created = (await directus.request(
    createItem('quote_items', item),
  )) as QuoteItem
  await syncQuoteTotalAmount(item.quote_id)
  return created
}

export async function updateQuoteItem(
  id: number,
  item: Partial<QuoteItemInput>,
): Promise<QuoteItem> {
  const updated = (await directus.request(
    updateItem('quote_items', id, item),
  )) as QuoteItem
  await syncQuoteTotalAmount(updated.quote_id)
  return updated
}

export async function removeQuoteItem(id: number): Promise<void> {
  const item = (await directus.request(
    readItem('quote_items', id),
  )) as QuoteItem
  await directus.request(deleteItem('quote_items', id))
  await syncQuoteTotalAmount(item.quote_id)
}

export async function syncQuoteTotalAmount(quoteId: number): Promise<void> {
  const items = await listQuoteItems(quoteId)
  const total = items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  await updateQuote(quoteId, { total_amount: total })
}

function deriveOpportunityNameFromQuoteTitle(title: string): string {
  const suffix = ' - 报价单'
  return title.endsWith(suffix) ? title.slice(0, -suffix.length) : title
}

export async function convertQuoteToOpportunity(
  quote: QuoteListItem | QuoteDetail,
): Promise<Opportunity> {
  if (quote.opportunity_id) {
    throw new Error('QUOTE_ALREADY_LINKED')
  }

  const opportunity = await createOpportunity({
    customer_id: quote.customer_id,
    contact_id: quote.contact_id ?? null,
    name: deriveOpportunityNameFromQuoteTitle(quote.title),
    amount: quote.total_amount ?? 0,
    stage: 'proposal',
    probability: 40,
    owner_id: quote.owner_id ?? null,
    owner_name: quote.owner_name ?? null,
    notes: quote.notes ?? '由报价单自动转入',
  })

  await updateQuote(quote.id, { opportunity_id: opportunity.id })

  return opportunity
}

export async function convertOpportunityToQuote(
  opportunity: OpportunityListItem,
): Promise<Quote> {
  const amount = opportunity.amount ?? 0

  const quote = await createQuote({
    quote_no: generateQuoteNo(),
    opportunity_id: opportunity.id,
    customer_id: opportunity.customer_id,
    contact_id: opportunity.contact_id ?? null,
    title: `${opportunity.name} - 报价单`,
    total_amount: amount,
    status: 'draft',
    valid_until: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    owner_id: opportunity.owner_id ?? null,
    owner_name: opportunity.owner_name ?? null,
    notes: opportunity.notes ?? null,
  })

  await createQuoteItem({
    quote_id: quote.id,
    item_name: opportunity.name,
    quantity: 1,
    unit_price: amount,
    amount,
    notes: '由商机自动转入',
  })

  await updateOpportunity(opportunity.id, {
    stage: 'proposal',
    probability: Math.max(opportunity.probability ?? 0, 40),
  })

  return quote
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

export async function listProductOptions(): Promise<
  { label: string; value: number; price?: number | null }[]
> {
  const products = (await directus.request(
    readItems('products', {
      fields: ['id', 'name', 'price'],
      sort: ['name'],
      limit: -1,
    }),
  )) as Pick<Product, 'id' | 'name' | 'price'>[]

  return products.map((product) => ({
    value: product.id,
    label: product.name,
    price: product.price,
  }))
}
