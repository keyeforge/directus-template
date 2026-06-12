import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { tableSearchConfig } from '@/constants/table'
import {
  buildDepartmentOptions,
  createDepartment,
  listDepartments,
  removeDepartment,
  updateDepartment,
} from '@/services/departments'
import type { Department, DepartmentInput } from '@/types/department'

export default function DepartmentsPage() {
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  )
  const [allDepartments, setAllDepartments] = useState<Department[]>([])

  const loadDepartments = async () => {
    const data = await listDepartments()
    setAllDepartments(data)
    return data
  }

  useEffect(() => {
    void loadDepartments().catch(() => {
      message.error('加载部门列表失败')
    })
  }, [])

  const parentOptions = buildDepartmentOptions(
    allDepartments,
    editingDepartment?.id,
  )

  const openCreateModal = () => {
    setEditingDepartment(null)
    setModalOpen(true)
  }

  const openEditModal = (record: Department) => {
    setEditingDepartment(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: DepartmentInput) => {
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, values)
        message.success('部门更新成功')
      } else {
        await createDepartment(values)
        message.success('部门创建成功')
      }
      setModalOpen(false)
      await loadDepartments()
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingDepartment ? '部门更新失败' : '部门创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeDepartment(id)
      message.success('部门已删除')
      await loadDepartments()
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const getParentName = (parentId?: number | null) => {
    if (!parentId) return '-'
    return allDepartments.find((dept) => dept.id === parentId)?.name ?? String(parentId)
  }

  const columns: ProColumns<Department>[] = [
    {
      title: '部门名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '上级部门',
      dataIndex: 'parent_id',
      search: false,
      render: (_, record) => getParentName(record.parent_id),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      search: false,
      width: 80,
      render: (_, record) => record.sort ?? 0,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        <a key="edit" onClick={() => openEditModal(record)}>
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确认删除该部门？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ]

  return (
    <PageContainer title="部门管理" subTitle="维护组织树形部门结构">
      <ProTable<Department>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const data = await loadDepartments()
            const keyword = String(params.name ?? '').trim()
            const filtered = keyword
              ? data.filter((item) => item.name.includes(keyword))
              : data
            return {
              data: filtered,
              success: true,
              total: filtered.length,
            }
          } catch {
            message.error('加载部门列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            新建部门
          </Button>,
        ]}
      />

      <ModalForm<DepartmentInput>
        title={editingDepartment ? '编辑部门' : '新建部门'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
        }}
        initialValues={
          editingDepartment ?? {
            sort: 0,
          }
        }
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="部门名称"
          placeholder="请输入部门名称"
          rules={[{ required: true, message: '请输入部门名称' }]}
        />
        <ProFormSelect
          name="parent_id"
          label="上级部门"
          options={parentOptions}
          placeholder="无上级则留空"
          allowClear
        />
        <ProFormDigit name="sort" label="排序" min={0} fieldProps={{ precision: 0 }} />
      </ModalForm>
    </PageContainer>
  )
}
