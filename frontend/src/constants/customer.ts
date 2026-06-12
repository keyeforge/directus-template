import type {
  CustomerIndustry,
  CustomerLevel,
  CustomerSource,
  CustomerStatus,
  FollowUpType,
} from '@/types/customer'

export const statusMap: Record<
  CustomerStatus,
  { text: string; color: string }
> = {
  potential: { text: '潜在', color: 'default' },
  following: { text: '跟进中', color: 'processing' },
  deal: { text: '已成交', color: 'success' },
  lost: { text: '已流失', color: 'error' },
}

export const levelMap: Record<CustomerLevel, { text: string; color: string }> = {
  normal: { text: '普通', color: 'default' },
  important: { text: '重要', color: 'warning' },
  vip: { text: 'VIP', color: 'gold' },
}

export const sourceMap: Record<CustomerSource, string> = {
  website: '官网',
  referral: '转介绍',
  exhibition: '展会',
  ads: '广告',
  telemarketing: '电话营销',
  other: '其他',
}

export const industryMap: Record<CustomerIndustry, string> = {
  it: 'IT/互联网',
  manufacturing: '制造业',
  finance: '金融',
  education: '教育',
  retail: '零售',
  healthcare: '医疗',
  other: '其他',
}

export const followUpTypeMap: Record<FollowUpType, string> = {
  call: '电话',
  visit: '拜访',
  email: '邮件',
  meeting: '会议',
  other: '其他',
}

export const statusOptions = Object.entries(statusMap).map(([value, item]) => ({
  label: item.text,
  value,
}))

export const levelOptions = Object.entries(levelMap).map(([value, item]) => ({
  label: item.text,
  value,
}))

export const sourceOptions = Object.entries(sourceMap).map(([value, label]) => ({
  label,
  value,
}))

export const industryOptions = Object.entries(industryMap).map(
  ([value, label]) => ({
    label,
    value,
  }),
)

export const followUpTypeOptions = Object.entries(followUpTypeMap).map(
  ([value, label]) => ({
    label,
    value,
  }),
)
