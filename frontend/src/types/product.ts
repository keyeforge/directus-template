export type ProductStatus = 'draft' | 'published' | 'archived'

export interface Product {
  id: number
  name: string
  sku?: string | null
  price?: number | null
  description?: string | null
  status?: ProductStatus | null
}

export type ProductInput = Omit<Product, 'id'>
