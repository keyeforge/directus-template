import type { OpportunityStage } from '@/types/opportunity'

export const stageMap: Record<
  OpportunityStage,
  { text: string; color: string }
> = {
  initial: { text: '初步接洽', color: 'default' },
  requirement: { text: '需求确认', color: 'processing' },
  proposal: { text: '方案报价', color: 'blue' },
  negotiation: { text: '商务谈判', color: 'warning' },
  won: { text: '已赢单', color: 'success' },
  lost: { text: '已输单', color: 'error' },
}

export const stageOptions = Object.entries(stageMap).map(([value, item]) => ({
  label: item.text,
  value,
}))
