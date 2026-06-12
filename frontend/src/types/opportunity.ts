import type { CustomerSource } from '@/types/customer'

export type OpportunityStage =
  | 'initial'
  | 'requirement'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export interface Opportunity {
  id: number
  customer_id: number
  contact_id?: number | null
  name: string
  amount?: number | null
  stage?: OpportunityStage | null
  probability?: number | null
  owner_id?: string | null
  owner_name?: string | null
  expected_close_date?: string | null
  source?: CustomerSource | null
  notes?: string | null
}

export type OpportunityInput = Omit<Opportunity, 'id'>

export interface OpportunityListItem extends Opportunity {
  customer_name?: string
  contact_name?: string
}
