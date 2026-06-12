import type { ContactGender } from '@/types/contact'

export const genderMap: Record<ContactGender, string> = {
  male: '男',
  female: '女',
  other: '其他',
}

export const genderOptions = Object.entries(genderMap).map(([value, label]) => ({
  label,
  value,
}))
