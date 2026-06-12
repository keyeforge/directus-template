export type CustomerStatus = 'potential' | 'following' | 'deal' | 'lost'

export type CustomerLevel = 'normal' | 'important' | 'vip'

export type CustomerSource =
  | 'website'
  | 'referral'
  | 'exhibition'
  | 'ads'
  | 'telemarketing'
  | 'other'

export type CustomerIndustry =
  | 'it'
  | 'manufacturing'
  | 'finance'
  | 'education'
  | 'retail'
  | 'healthcare'
  | 'other'

export interface Customer {
  id: number
  name: string
  company?: string | null
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  industry?: CustomerIndustry | null
  source?: CustomerSource | null
  level?: CustomerLevel | null
  status?: CustomerStatus | null
  owner_id?: string | null
  owner_name?: string | null
  address?: string | null
  notes?: string | null
  last_contact_at?: string | null
  next_follow_up_at?: string | null
}

export type CustomerInput = Omit<Customer, 'id'>

export type FollowUpType = 'call' | 'visit' | 'email' | 'meeting' | 'other'

export interface CustomerFollowUp {
  id: number
  customer_id: number
  follow_up_type?: FollowUpType | null
  content: string
  follow_up_at?: string | null
  next_action?: string | null
}

export type CustomerFollowUpInput = Omit<CustomerFollowUp, 'id'>
