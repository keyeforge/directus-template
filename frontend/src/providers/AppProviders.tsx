import { ProConfigProvider } from '@ant-design/pro-components'
import { App, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { ReactNode } from 'react'
import { antdTheme } from '@/theme/antdTheme'
import { proThemeToken } from '@/theme/proTheme'

dayjs.locale('zh-cn')

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <ProConfigProvider token={proThemeToken}>
        <App>{children}</App>
      </ProConfigProvider>
    </ConfigProvider>
  )
}
