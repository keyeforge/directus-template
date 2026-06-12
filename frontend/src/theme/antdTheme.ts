import type { ThemeConfig } from 'antd'

/** antd 6 全局 Design Token（ConfigProvider theme） */
export const antdTheme: ThemeConfig = {
  cssVar: {
    key: 'nodemp',
  },
  token: {
    borderRadius: 6,
    colorPrimary: '#1677ff',
  },
  components: {
    Form: {
      itemMarginBottom: 12,
    },
    Table: {
      cellPaddingBlock: 12,
      cellPaddingInline: 12,
    },
  },
}
