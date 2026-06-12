import { PageContainer, ProCard } from '@ant-design/pro-components'
import { Typography } from 'antd'
import { useAuthStore } from '@/stores/auth'

const { Paragraph, Text } = Typography

export default function WelcomePage() {
  const { user } = useAuthStore()

  return (
    <PageContainer
      title="欢迎"
      subTitle="Ant Design Pro + Vite 8 + Zustand"
    >
      <ProCard variant="outlined">
        <Paragraph>
          你好，<Text strong>{user?.email}</Text>！
        </Paragraph>
        <Paragraph>
          这是一个基于 Vite 8、Ant Design、Ant Design Pro Components 和 Zustand 构建的管理后台前端项目。
        </Paragraph>
        <Paragraph>
          你可以在 Directus 后台创建数据模型后，通过 SDK 在此项目中扩展业务页面。
        </Paragraph>
      </ProCard>
    </PageContainer>
  )
}
