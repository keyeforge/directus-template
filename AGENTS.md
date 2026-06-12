# AGENTS.md

供 AI/Agent 与后续开发参考的项目约定、技术栈与目录结构说明。

---

## 项目概述

**nodemp** 是一套基于 **Directus 11** 的 CRM 管理后台，前端为独立的 React SPA，通过 Directus REST API 读写数据。业务涵盖产品、客户、联系人、商机、报价，以及部门/角色/策略/账号等权限管理。

```
┌─────────────────┐     /api 代理      ┌──────────────────┐
│  React 前端      │ ─────────────────► │  Directus 11     │
│  localhost:5173 │   @directus/sdk    │  localhost:8055  │
└─────────────────┘                    └────────┬─────────┘
                                                │
                                       ┌────────▼─────────┐
                                       │  SQLite data.db  │
                                       │  + Hook 扩展      │
                                       └──────────────────┘
```

---

## 技术栈

### 后端 / 数据层

| 组件 | 版本/说明 |
|------|-----------|
| **Directus** | 11.17.0（Docker 镜像 `directus/directus:11.17.0`） |
| **数据库** | SQLite3，文件 `database/data.db` |
| **扩展** | Directus Hook：`extensions/data-scope-filter`（API 层数据范围过滤） |
| **数据模型初始化** | `scripts/bootstrap-*.sql`，直接写入 SQLite + Directus 元数据表 |

### 前端

| 组件 | 版本/说明 |
|------|-----------|
| **React** | 19.x |
| **TypeScript** | 6.x |
| **Vite** | 8.x（开发端口 5173，路径别名 `@/` → `src/`） |
| **Ant Design** | 6.x |
| **Ant Design Pro Components** | 3.x（`ProLayout`、`ProTable`、`ModalForm` 等） |
| **React Router** | 7.x |
| **Zustand** | 5.x（认证与权限状态，含 persist） |
| **@directus/sdk** | 18.x（REST + JSON 认证，自动刷新 token） |
| **dayjs** | 日期处理，中文 locale |

### 开发与部署

| 工具 | 说明 |
|------|------|
| **Docker Compose** | 仅运行 Directus 服务 |
| **ESLint** | 前端代码检查（`npm run lint`） |
| **npm** | 前端包管理（`frontend/package.json`） |

---

## 目录结构

```
nodemp/
├── .env.example              # 根目录环境变量模板（SECRET、管理员账号）
├── .env                        # 根目录实际配置（勿提交）
├── docker-compose.yml          # Directus 容器定义
├── AGENTS.md                   # 本文档
│
├── database/
│   └── data.db                 # SQLite 数据库（Directus + 业务表）
│
├── uploads/                    # Directus 文件上传目录
│
├── scripts/                    # 数据模型 bootstrap SQL（幂等，可重复执行）
│   ├── bootstrap-products.sql
│   ├── bootstrap-customers.sql
│   ├── bootstrap-contacts.sql
│   ├── bootstrap-opportunities.sql
│   ├── bootstrap-quotes.sql
│   ├── bootstrap-departments.sql
│   ├── bootstrap-user-org-fields.sql   # 用户 department_id、manager_id
│   ├── bootstrap-org-closure.sql       # department_closure、user_reporting_closure
│   ├── bootstrap-owner-id.sql          # customers/opportunities/quotes 的 owner_id
│   └── bootstrap-policy-data-scopes.sql
│
├── extensions/
│   └── data-scope-filter/      # Directus Hook：按策略强制数据范围
│       ├── index.js
│       └── package.json
│
└── frontend/                   # React 管理后台
    ├── .env.example            # VITE_DIRECTUS_URL、VITE_API_BASE
    ├── .env / .env.development / .env.production
    ├── package.json
    ├── vite.config.ts          # 开发代理 /api → Directus
    ├── tsconfig.app.json       # paths: @/* → src/*
    │
    └── src/
        ├── main.tsx            # 入口：StrictMode + AppProviders + App
        ├── App.tsx             # 路由定义
        ├── index.css
        │
        ├── assets/             # 静态资源
        ├── components/         # 通用组件
        │   ├── AuthGuard.tsx       # 登录态 + app_access 校验
        │   ├── PermissionGuard.tsx # 路由级集合权限 / AdminRoute
        │   └── CanAccess.tsx       # 按钮级权限（useCanAccess hook）
        │
        ├── constants/          # 枚举、菜单、表格配置
        │   ├── menuRoutes.tsx      # 侧边栏菜单与 access 规则
        │   ├── dataScope.ts        # 数据范围选项与受控集合
        │   ├── table.ts            # ProTable 通用 search 配置
        │   ├── customer.ts / contact.ts / opportunity.ts / quote.ts
        │
        ├── layouts/
        │   └── AdminLayout.tsx     # ProLayout 壳层、菜单过滤、退出登录
        │
        ├── pages/              # 页面（按业务模块分目录）
        │   ├── Login/
        │   ├── Dashboard/
        │   ├── Welcome/
        │   ├── Products/
        │   ├── Customers/          # index + Detail
        │   ├── Contacts/
        │   ├── Opportunities/
        │   ├── Quotes/             # index + Detail
        │   ├── Departments/
        │   ├── Accounts/
        │   ├── Roles/
        │   └── Policies/           # index + Permissions（权限矩阵）
        │
        ├── providers/
        │   └── AppProviders.tsx    # Ant Design 中文 + 主题
        │
        ├── services/           # Directus API 封装（每个集合一个文件）
        │   ├── directus.ts         # SDK 客户端单例
        │   ├── auth-storage.ts     # localStorage token 存储
        │   ├── customers.ts / contacts.ts / opportunities.ts / quotes.ts
        │   ├── products.ts / customer-follow-ups.ts
        │   ├── users.ts / departments.ts / roles.ts / policies.ts
        │   ├── permissions.ts / collections.ts / user-options.ts
        │
        ├── stores/
        │   └── auth.ts             # 登录、权限、canAccess、isAdmin
        │
        ├── theme/
        │   ├── antdTheme.ts
        │   └── proTheme.ts
        │
        ├── types/              # TypeScript 类型
        │   ├── directus.ts         # DirectusSchema 汇总
        │   ├── rbac.ts             # 权限、策略、数据范围类型
        │   ├── customer.ts / contact.ts / opportunity.ts / quote.ts
        │   ├── product.ts / user.ts / department.ts
        │
        └── utils/
            ├── directus-error.ts   # API 错误信息提取
            └── owner.ts            # owner_id / owner_name 辅助
```

---

## 业务数据模型

Bootstrap 脚本按依赖顺序执行。各脚本创建 SQLite 表并注册 Directus collection/fields/relations。

| 集合 | Bootstrap 脚本 | 说明 |
|------|----------------|------|
| `customers` | bootstrap-customers.sql | 客户 |
| `customer_follow_ups` | bootstrap-customers.sql | 客户跟进记录 |
| `contacts` | bootstrap-contacts.sql | 联系人（关联 customer） |
| `opportunities` | bootstrap-opportunities.sql | 商机（关联 customer） |
| `quotes` / `quote_items` | bootstrap-quotes.sql | 报价及明细 |
| `products` | bootstrap-products.sql | 产品目录 |
| `departments` | bootstrap-departments.sql | 部门树 |
| `policy_data_scopes` | bootstrap-policy-data-scopes.sql | 策略 → 集合 → 数据范围 |

**组织与负责人字段**（bootstrap-user-org-fields / bootstrap-owner-id）：

- `directus_users.department_id` → 部门
- `directus_users.manager_id` → 上级（汇报线）
- `customers` / `opportunities` / `quotes` 的 `owner_id` → 负责人

**闭包表**（bootstrap-org-closure）：

- `department_closure`：部门祖先-后代
- `user_reporting_closure`：上下级汇报关系

前端类型定义见 `frontend/src/types/directus.ts` 中的 `DirectusSchema`。

---

## 权限与数据范围

### 两层权限模型

1. **Directus 策略权限**（collection × action：create/read/update/delete/share）  
   - 前端：`useAuthStore.canAccess(collection, action)`  
   - 路由：`PermissionGuard`、`AdminRoute`  
   - 按钮：`CanAccess` / `useCanAccess`  
   - 菜单：`constants/menuRoutes.tsx` 的 `access` 字段

2. **数据范围**（self / subordinates / department / all）  
   - 配置：`policy_data_scopes` 表，在策略权限矩阵页维护  
   - 强制执行：`extensions/data-scope-filter` Hook（API 层 filter/create/update/delete）  
   - 受控集合：`customers`、`opportunities`、`quotes`、`contacts`、`customer_follow_ups`、`quote_items`

### 管理员判定

`policyGlobals.admin_access === true` 时绕过数据范围、拥有全部菜单与操作权限。

---

## 前端开发约定

### API 调用

- 统一通过 `frontend/src/services/directus.ts` 创建的 SDK 客户端
- 开发环境 `VITE_API_BASE=/api`，由 Vite 代理到 `VITE_DIRECTUS_URL`（默认 `http://localhost:8055`）
- 每个业务集合在 `services/` 下独立文件，使用 `readItems` / `createItem` / `updateItem` / `deleteItem` 等 SDK 方法

### 页面模式

典型 CRUD 页（如 `pages/Customers/index.tsx`）：

- `PageContainer` + `ProTable` 列表
- `ModalForm` 新建/编辑
- `CanAccess` 包裹操作按钮（create/update/delete）
- 常量枚举放在 `constants/<module>.ts`
- 类型放在 `types/<module>.ts`

### 新增业务模块 checklist

1. 编写 `scripts/bootstrap-<module>.sql` 并执行 + 重启 Directus
2. 添加 `types/<module>.ts`，更新 `types/directus.ts` 的 `DirectusSchema`
3. 添加 `services/<module>.ts`
4. 添加 `constants/<module>.ts`（如有枚举）
5. 添加 `pages/<Module>/index.tsx`（及 Detail 如需要）
6. 在 `App.tsx` 注册路由 + `PermissionGuard`
7. 在 `constants/menuRoutes.tsx` 添加菜单项
8. 若需数据范围，在 Hook 的 `SCOPED_COLLECTIONS` 中注册（`extensions/data-scope-filter/index.js`）

### 路径别名

```typescript
import { directus } from '@/services/directus'
import type { Customer } from '@/types/customer'
```

---

## 环境变量

### 根目录 `.env`

| 变量 | 说明 |
|------|------|
| `SECRET` | Directus 密钥 |
| `ADMIN_EMAIL` | 管理员邮箱 |
| `ADMIN_PASSWORD` | 管理员密码 |

### 前端 `frontend/.env*`

| 变量 | 说明 |
|------|------|
| `VITE_DIRECTUS_URL` | Directus 地址（Vite 代理 target） |
| `VITE_API_BASE` | SDK 请求前缀，开发默认 `/api` |

---

## 启动方式

在项目根目录依次执行：

```bash
docker compose up -d
cd frontend && npm install   # 首次
cd frontend && npm run dev
```

- **Directus 后端**：http://localhost:8055
- **前端管理后台**：http://localhost:5173
- 开发环境通过 Vite 代理 `/api` → Directus（见 `frontend/vite.config.ts`）

首次启动前复制 `.env.example` 为 `.env` 并配置 `SECRET`、`ADMIN_EMAIL`、`ADMIN_PASSWORD`。

### 数据模型 Bootstrap（按依赖顺序，各执行一次）

**产品管理**：

```bash
sqlite3 database/data.db < scripts/bootstrap-products.sql
docker compose restart directus
```

**客户管理**：

```bash
sqlite3 database/data.db < scripts/bootstrap-customers.sql
docker compose restart directus
```

**联系人管理**（依赖客户）：

```bash
sqlite3 database/data.db < scripts/bootstrap-contacts.sql
docker compose restart directus
```

**商机管理**（依赖客户）：

```bash
sqlite3 database/data.db < scripts/bootstrap-opportunities.sql
docker compose restart directus
```

**报价管理**（依赖客户、商机）：

```bash
sqlite3 database/data.db < scripts/bootstrap-quotes.sql
docker compose restart directus
```

**权限与组织模型**（菜单/按钮/数据权限，按顺序）：

```bash
sqlite3 database/data.db < scripts/bootstrap-departments.sql
sqlite3 database/data.db < scripts/bootstrap-user-org-fields.sql
sqlite3 database/data.db < scripts/bootstrap-org-closure.sql
sqlite3 database/data.db < scripts/bootstrap-owner-id.sql
sqlite3 database/data.db < scripts/bootstrap-policy-data-scopes.sql
docker compose restart directus
```

---

## 路由一览

| 路径 | 页面 | 权限 |
|------|------|------|
| `/login` | 登录 | 公开 |
| `/dashboard` | 仪表盘 | 已登录 |
| `/products` | 产品管理 | products:read |
| `/customers` | 客户列表 | customers:read |
| `/customers/:id` | 客户详情 | customers:read |
| `/contacts` | 联系人 | contacts:read |
| `/opportunities` | 商机 | opportunities:read |
| `/quotes` | 报价列表 | quotes:read |
| `/quotes/:id` | 报价详情 | quotes:read |
| `/departments` | 部门管理 | admin |
| `/accounts` | 账号管理 | admin |
| `/roles` | 角色管理 | admin |
| `/policies` | 策略管理 | admin |
| `/policies/:policyId/permissions` | 权限矩阵 | admin |
| `/welcome` | 欢迎页 | 已登录 |

---

## 默认登录

账号与 Directus 管理员一致，见根目录 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD`（示例：`admin@example.com` / `d1r3ctu5`）。

---

## Agent 注意事项

- **不要提交** `.env`、`database/data.db` 等含敏感信息或本地状态的文件
- 修改数据模型后必须 **重启 Directus**（`docker compose restart directus`）
- 数据范围逻辑在 **后端 Hook** 强制执行，仅改前端无法绕过
- 新增 SQL bootstrap 脚本应使用 `INSERT OR IGNORE` / `WHERE NOT EXISTS` 保持幂等
- 前端构建：`cd frontend && npm run build`，产物在 `frontend/dist/`
- Directus 扩展路径为 `extensions/data-scope-filter`，挂载到容器 `/directus/extensions`
