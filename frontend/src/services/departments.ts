import {
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from '@directus/sdk'
import { directus } from '@/services/directus'
import type { Department, DepartmentInput } from '@/types/department'

export async function listDepartments(): Promise<Department[]> {
  return directus.request(
    readItems('departments', {
      fields: ['id', 'name', 'parent_id', 'sort'],
      sort: ['sort', 'name'],
      limit: -1,
    }),
  ) as Promise<Department[]>
}

export async function createDepartment(
  item: DepartmentInput,
): Promise<Department> {
  return directus.request(
    createItem('departments', item),
  ) as Promise<Department>
}

export async function updateDepartment(
  id: number,
  item: Partial<DepartmentInput>,
): Promise<Department> {
  return directus.request(
    updateItem('departments', id, item),
  ) as Promise<Department>
}

export async function removeDepartment(id: number): Promise<void> {
  await directus.request(deleteItem('departments', id))
}

export function buildDepartmentOptions(
  departments: Department[],
  excludeId?: number,
): { label: string; value: number }[] {
  return departments
    .filter((dept) => dept.id !== excludeId)
    .map((dept) => ({
      label: dept.name,
      value: dept.id,
    }))
}
