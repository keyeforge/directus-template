import type { QuoteStatus } from '@/types/quote'

export const quoteStatusMap: Record<
  QuoteStatus,
  { text: string; color: string }
> = {
  draft: { text: '草稿', color: 'default' },
  sent: { text: '已发送', color: 'processing' },
  accepted: { text: '已接受', color: 'success' },
  rejected: { text: '已拒绝', color: 'error' },
  expired: { text: '已过期', color: 'warning' },
}

export const quoteStatusOptions = Object.entries(quoteStatusMap).map(
  ([value, item]) => ({
    label: item.text,
    value,
  }),
)
