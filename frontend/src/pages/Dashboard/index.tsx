import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components'
import { Col, Row } from 'antd'
import { useAuthStore } from '@/stores/auth'

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <PageContainer
      title="仪表盘"
      subTitle="Directus 后台数据概览"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            statistic={{
              title: '当前用户',
              value: user?.email ?? '-',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            statistic={{
              title: '后端地址',
              value: import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatisticCard
            statistic={{
              title: 'API 代理',
              value: import.meta.env.VITE_API_BASE || '/api',
            }}
          />
        </Col>
      </Row>

      <ProCard
        title="对接说明"
        style={{ marginTop: 16 }}
        variant="outlined"
      >
        <p>前端通过 @directus/sdk 对接 Directus REST API。</p>
        <p>开发环境使用 Vite 代理 /api 转发到 Directus，避免跨域问题。</p>
        <p>登录状态由 Zustand 管理，Token 由 SDK 自动维护。</p>
      </ProCard>
    </PageContainer>
  )
}
