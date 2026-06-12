import {
  aggregate,
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { Product, ProductInput, ProductStatus } from '@/types/product'

export interface ProductListParams {
  current?: number
  pageSize?: number
  name?: string
  status?: ProductStatus
}

export interface ProductListResult {
  data: Product[]
  total: number
}

function hasFilterValue(value: unknown): value is string {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function buildProductFilter(params: ProductListParams) {
  const filter: Record<string, unknown> = {}

  if (hasFilterValue(params.name)) {
    filter.name = { _icontains: String(params.name).trim() }
  }

  if (hasFilterValue(params.status)) {
    filter.status = { _eq: params.status }
  }

  return Object.keys(filter).length > 0 ? filter : undefined
}

export async function listProducts(
  params: ProductListParams = {},
): Promise<ProductListResult> {
  const current = params.current ?? 1
  const pageSize = params.pageSize ?? 10
  const queryFilter = buildProductFilter(params)

  const listQuery = {
    limit: pageSize,
    offset: (current - 1) * pageSize,
    sort: ['-id' as const],
    ...(queryFilter ? { filter: queryFilter } : {}),
  }

  const data = (await directus.request(
    readItems('products', listQuery),
  )) as Product[]

  let total = data.length
  try {
    const countResult = await directus.request(
      aggregate('products', {
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

export async function createProduct(item: ProductInput): Promise<Product> {
  return directus.request(createItem('products', item)) as Promise<Product>
}

export async function updateProduct(
  id: number,
  item: Partial<ProductInput>,
): Promise<Product> {
  return directus.request(updateItem('products', id, item)) as Promise<Product>
}

export async function removeProduct(id: number): Promise<void> {
  await directus.request(deleteItem('products', id))
}
