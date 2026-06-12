export type ContactGender = 'male' | 'female' | 'other'

export interface Contact {
  id: number
  customer_id: number
  name: string
  title?: string | null
  department?: string | null
  phone?: string | null
  mobile?: string | null
  email?: string | null
  gender?: ContactGender | null
  wechat?: string | null
  is_primary?: boolean | number | null
  notes?: string | null
}

export type ContactInput = Omit<Contact, 'id'>

export interface ContactListItem extends Contact {
  customer_name?: string
}
