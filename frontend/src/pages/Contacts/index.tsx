import { PlusOutlined } from '@ant-design/icons'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components'
import { Button, message, Popconfirm, Tag } from 'antd'
import CanAccess from '@/components/CanAccess'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { genderOptions } from '@/constants/contact'
import { tableSearchConfig } from '@/constants/table'
import {
  createContact,
  listContacts,
  listCustomerOptions,
  removeContact,
  updateContact,
} from '@/services/contacts'
import type { ContactInput, ContactListItem } from '@/types/contact'

export default function ContactsPage() {
  const navigate = useNavigate()
  const actionRef = useRef<ActionType>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactListItem | null>(
    null,
  )
  const [customerOptions, setCustomerOptions] = useState<
    { label: string; value: number }[]
  >([])

  useEffect(() => {
    void listCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => {
        message.error('加载客户选项失败')
      })
  }, [])

  const openCreateModal = () => {
    setEditingContact(null)
    setModalOpen(true)
  }

  const openEditModal = (record: ContactListItem) => {
    setEditingContact(record)
    setModalOpen(true)
  }

  const handleSubmit = async (values: ContactInput & { is_primary?: boolean }) => {
    try {
      const payload: ContactInput = {
        ...values,
        customer_id: Number(values.customer_id),
        is_primary: values.is_primary ? 1 : 0,
      }

      if (editingContact) {
        await updateContact(editingContact.id, payload)
        message.success('联系人更新成功')
      } else {
        await createContact(payload)
        message.success('联系人创建成功')
      }
      setModalOpen(false)
      actionRef.current?.reload()
      return true
    } catch {
      message.error(editingContact ? '联系人更新失败' : '联系人创建失败')
      return false
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await removeContact(id)
      message.success('联系人已删除')
      actionRef.current?.reload()
    } catch {
      message.error('删除失败')
    }
  }

  const columns: ProColumns<ContactListItem>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '所属客户',
      dataIndex: 'customer_id',
      valueType: 'select',
      fieldProps: {
        options: customerOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
      render: (_, record) =>
        record.customer_name ? (
          <a onClick={() => navigate(`/customers/${record.customer_id}`)}>
            {record.customer_name}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: '职位',
      dataIndex: 'title',
      search: false,
      render: (_, record) => record.title || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      search: false,
      render: (_, record) => record.department || '-',
    },
    {
      title: '手机',
      dataIndex: 'mobile',
      render: (_, record) => record.mobile || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      render: (_, record) => record.phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      search: false,
      ellipsis: true,
      render: (_, record) => record.email || '-',
    },
    {
      title: '主联系人',
      dataIndex: 'is_primary',
      search: false,
      render: (_, record) =>
        record.is_primary ? (
          <Tag color="blue">是</Tag>
        ) : (
          <Tag>否</Tag>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        <CanAccess key="edit" collection="contacts" action="update">
          <a onClick={() => openEditModal(record)}>编辑</a>
        </CanAccess>,
        <CanAccess key="delete" collection="contacts" action="delete">
          <Popconfirm
            title="确认删除该联系人？"
            onConfirm={() => handleDelete(record.id)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </CanAccess>,
      ],
    },
  ]

  const editingInitialValues = editingContact
    ? {
        ...editingContact,
        is_primary: Boolean(editingContact.is_primary),
      }
    : {
        is_primary: false,
      }

  return (
    <PageContainer title="联系人管理" subTitle="CRM 客户联系人档案">
      <ProTable<ContactListItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        cardBordered
        search={tableSearchConfig}
        request={async (params) => {
          try {
            const result = await listContacts({
              current: params.current,
              pageSize: params.pageSize,
              name: params.name,
              phone: params.phone,
              mobile: params.mobile,
              customer_id: params.customer_id
                ? Number(params.customer_id)
                : undefined,
            })
            return {
              data: result.data,
              success: true,
              total: result.total,
            }
          } catch {
            message.error('加载联系人列表失败')
            return { data: [], success: false, total: 0 }
          }
        }}
        toolBarRender={() => [
          <CanAccess key="create" collection="contacts" action="create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              新建联系人
            </Button>
          </CanAccess>,
        ]}
      />

      <ModalForm<ContactInput & { is_primary?: boolean }>
        title={editingContact ? '编辑联系人' : '新建联系人'}
        open={modalOpen}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setModalOpen(false),
          width: 640,
        }}
        initialValues={editingInitialValues}
        onFinish={handleSubmit}
      >
        <ProFormSelect
          name="customer_id"
          label="所属客户"
          options={customerOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          rules={[{ required: true, message: '请选择所属客户' }]}
        />
        <ProFormText
          name="name"
          label="姓名"
          placeholder="请输入联系人姓名"
          rules={[{ required: true, message: '请输入联系人姓名' }]}
        />
        <ProFormText name="title" label="职位" placeholder="请输入职位" />
        <ProFormText name="department" label="部门" placeholder="请输入部门" />
        <ProFormText name="mobile" label="手机" placeholder="请输入手机号" />
        <ProFormText name="phone" label="电话" placeholder="请输入联系电话" />
        <ProFormText
          name="email"
          label="邮箱"
          placeholder="请输入邮箱"
          rules={[{ type: 'email', message: '邮箱格式不正确' }]}
        />
        <ProFormSelect name="gender" label="性别" options={genderOptions} />
        <ProFormText name="wechat" label="微信" placeholder="请输入微信号" />
        <ProFormSwitch name="is_primary" label="主联系人" />
        <ProFormTextArea name="notes" label="备注" placeholder="请输入备注" />
      </ModalForm>
    </PageContainer>
  )
}
