export interface Department {
  id: number
  name: string
  parent_id?: number | null
  sort?: number | null
}

export type DepartmentInput = Omit<Department, 'id'>

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[]
}
