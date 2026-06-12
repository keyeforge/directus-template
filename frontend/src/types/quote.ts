export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: number
  quote_no: string
  opportunity_id?: number | null
  customer_id: number
  contact_id?: number | null
  title: string
  total_amount?: number | null
  status?: QuoteStatus | null
  valid_until?: string | null
  owner_id?: string | null
  owner_name?: string | null
  notes?: string | null
}

export type QuoteInput = Omit<Quote, 'id'>

export interface QuoteListItem extends Quote {
  customer_name?: string
  contact_name?: string
  opportunity_name?: string
}

export interface QuoteItem {
  id: number
  quote_id: number
  product_id?: number | null
  item_name: string
  quantity?: number | null
  unit_price?: number | null
  amount?: number | null
  notes?: string | null
}

export type QuoteItemInput = Omit<QuoteItem, 'id'>

export interface QuoteDetail extends QuoteListItem {
  items: QuoteItem[]
}
