import {
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { CustomerFollowUp, CustomerFollowUpInput } from '@/types/customer'

export async function listCustomerFollowUps(
  customerId: number,
): Promise<CustomerFollowUp[]> {
  return directus.request(
    readItems('customer_follow_ups', {
      filter: { customer_id: { _eq: customerId } },
      sort: ['-follow_up_at', '-id'],
      limit: -1,
    }),
  ) as Promise<CustomerFollowUp[]>
}

export async function createCustomerFollowUp(
  item: CustomerFollowUpInput,
): Promise<CustomerFollowUp> {
  return directus.request(
    createItem('customer_follow_ups', item),
  ) as Promise<CustomerFollowUp>
}

export async function updateCustomerFollowUp(
  id: number,
  item: Partial<CustomerFollowUpInput>,
): Promise<CustomerFollowUp> {
  return directus.request(
    updateItem('customer_follow_ups', id, item),
  ) as Promise<CustomerFollowUp>
}

export async function removeCustomerFollowUp(id: number): Promise<void> {
  await directus.request(deleteItem('customer_follow_ups', id))
}
