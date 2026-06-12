import { ArrowLeftOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  Checkbox,
  message,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DATA_SCOPE_OPTIONS, supportsDataScope } from '@/constants/dataScope'
import {
  buildPermissionMatrix,
  grantFullCollectionAccess,
  revokeCollectionAccess,
  savePermissionMatrix,
} from '@/services/permissions'
import { getPolicy } from '@/services/policies'
import { useAuthStore } from '@/stores/auth'
import type {
  DataScope,
  PermissionAction,
  PermissionMatrixRow,
  PolicyRecord,
} from '@/types/rbac'

const ACTION_LABELS: Record<PermissionAction, string> = {
  create: '创建',
  read: '读取',
  update: '更新',
  delete: '删除',
  share: '分享',
}

const MANAGED_ACTIONS: PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
]

export default function PolicyPermissionsPage() {
  const navigate = useNavigate()
  const fetchAccess = useAuthStore((state) => state.fetchAccess)
  const { policyId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [policy, setPolicy] = useState<PolicyRecord | null>(null)
  const [rows, setRows] = useState<PermissionMatrixRow[]>([])

  const loadData = useCallback(async () => {
    if (!policyId) return

    setLoading(true)
    try {
      const [policyRecord, matrix] = await Promise.all([
        getPolicy(policyId),
        buildPermissionMatrix(policyId),
      ])
      setPolicy(policyRecord)
      setRows(matrix)
    } catch {
      message.error('加载权限配置失败')
    } finally {
      setLoading(false)
    }
  }, [policyId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const toggleAction = (
    collection: string,
    action: PermissionAction,
    checked: boolean,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.collection !== collection) return row
        const nextActions = {
          ...row.actions,
          [action]: checked,
        }
        return {
          ...row,
          actions: nextActions,
          dataScope: nextActions.read ? row.dataScope ?? 'self' : row.dataScope,
        }
      }),
    )
  }

  const toggleRow = (collection: string, checked: boolean) => {
    setRows((current) =>
      current.map((row) => {
        if (row.collection !== collection) return row
        const actions = MANAGED_ACTIONS.reduce<Partial<Record<PermissionAction, boolean>>>(
          (acc, action) => {
            acc[action] = checked
            return acc
          },
          {},
        )
        return { ...row, actions }
      }),
    )
  }

  const setDataScope = (collection: string, scope: DataScope) => {
    setRows((current) =>
      current.map((row) =>
        row.collection === collection ? { ...row, dataScope: scope } : row,
      ),
    )
  }

  const handleSave = async () => {
    if (!policyId) return

    setSaving(true)
    try {
      await savePermissionMatrix(policyId, rows)
      await fetchAccess()
      message.success('权限配置已保存')
      await loadData()
    } catch {
      message.error('保存权限配置失败')
    } finally {
      setSaving(false)
    }
  }

  const handleGrantAll = async (collection: string) => {
    if (!policyId) return

    try {
      await grantFullCollectionAccess(policyId, collection)
      message.success('已授予该集合全部权限')
      await loadData()
    } catch {
      message.error('授权失败')
    }
  }

  const handleRevokeAll = async (collection: string) => {
    if (!policyId) return

    try {
      await revokeCollectionAccess(policyId, collection)
      message.success('已撤销该集合全部权限')
      await loadData()
    } catch {
      message.error('撤销失败')
    }
  }

  const columns: ColumnsType<PermissionMatrixRow> = useMemo(
    () => [
      {
        title: '集合',
        dataIndex: 'collection',
        fixed: 'left',
        width: 220,
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <strong>{record.collection}</strong>
            {record.collectionLabel !== record.collection ? (
              <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                {record.collectionLabel}
              </span>
            ) : null}
          </Space>
        ),
      },
      ...MANAGED_ACTIONS.map((action) => ({
        title: ACTION_LABELS[action],
        dataIndex: action,
        width: 90,
        align: 'center' as const,
        render: (_: unknown, record: PermissionMatrixRow) => (
          <Checkbox
            checked={record.actions[action] === true}
            onChange={(event) =>
              toggleAction(record.collection, action, event.target.checked)
            }
          />
        ),
      })),
      {
        title: '数据范围',
        width: 180,
        render: (_, record) => {
          if (!supportsDataScope(record.collection)) {
            return <Tag>全部</Tag>
          }
          if (!record.actions.read) {
            return <span style={{ color: '#bfbfbf' }}>-</span>
          }
          return (
            <Select
              size="small"
              style={{ width: 150 }}
              value={record.dataScope ?? 'self'}
              options={DATA_SCOPE_OPTIONS}
              onChange={(value) => setDataScope(record.collection, value)}
            />
          )
        },
      },
      {
        title: '快捷操作',
        width: 180,
        render: (_, record) => {
          const enabledCount = MANAGED_ACTIONS.filter(
            (action) => record.actions[action],
          ).length

          return (
            <Space>
              <Tag color={enabledCount ? 'blue' : 'default'}>
                {enabledCount}/{MANAGED_ACTIONS.length}
              </Tag>
              <a onClick={() => handleGrantAll(record.collection)}>全选</a>
              <a onClick={() => handleRevokeAll(record.collection)}>清空</a>
              <Checkbox
                checked={enabledCount === MANAGED_ACTIONS.length}
                indeterminate={
                  enabledCount > 0 && enabledCount < MANAGED_ACTIONS.length
                }
                onChange={(event) => toggleRow(record.collection, event.target.checked)}
              >
                行
              </Checkbox>
            </Space>
          )
        },
      },
    ],
    [rows],
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <PageContainer
      title={`权限配置：${policy?.name ?? ''}`}
      subTitle="为策略配置各集合的 CRUD 权限与数据范围（多策略取最宽松范围）"
      extra={[
        <Button
          key="back"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/policies')}
        >
          返回策略列表
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={() => void handleSave()}>
          保存配置
        </Button>,
      ]}
    >
      {policy?.admin_access ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="该策略已开启管理员权限（admin_access），将自动拥有全部权限，下方矩阵仅供查看参考。"
        />
      ) : null}

      <Table<PermissionMatrixRow>
        rowKey="collection"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        size="middle"
      />
    </PageContainer>
  )
}
