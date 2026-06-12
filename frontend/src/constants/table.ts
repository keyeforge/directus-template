import type { ProTableProps } from '@ant-design/pro-components'

/** 列表页 ProTable 搜索区紧凑布局 */
export const tableSearchConfig: NonNullable<
  ProTableProps<Record<string, unknown>, Record<string, unknown>>['search']
> = {
  labelWidth: 'auto',
  defaultCollapsed: false,
  span: {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 6,
    xl: 6,
    xxl: 4,
  },
}
