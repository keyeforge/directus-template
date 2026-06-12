# nodemp

基于 **Directus 11** 的 CRM 管理后台：后端为 Directus + SQLite，前端为独立的 React SPA，通过 REST API 读写数据。业务涵盖产品、客户、联系人、商机、报价，以及部门 / 角色 / 策略 / 账号等权限管理。

```
┌─────────────────┐   /api 代理   ┌──────────────────┐
│  React 前端      │ ────────────► │  Directus 11     │
│  localhost:5173 │  @directus/sdk │  localhost:8055  │
└─────────────────┘               └────────┬─────────┘
                                           │
                                  ┌────────▼─────────┐
                                  │ SQLite data.db   │
                                  │ + Hook 扩展      │
                                  └──────────────────┘
```

## 技术栈

| 层级 | 组件 |
|------|------|
| 后端 | Directus 11.17.0、SQLite3 |
| 前端 | React 19、TypeScript、Vite 8、Ant Design 6、Pro Components |
| 权限 | Directus 策略 + `policy_data_scopes` 数据范围（Hook 强制执行） |
| 部署 | Docker Compose（Directus）、前端静态构建 |

更详细的目录约定与开发规范见 [AGENTS.md](./AGENTS.md)。

## 环境要求

- [Docker](https://docs.docker.com/get-docker/) 与 Docker Compose
- [Node.js](https://nodejs.org/) 18+ 与 npm（前端开发）
- [sqlite3](https://sqlite.org/cli.html) 命令行（执行 bootstrap 脚本）

## 快速开始

### 1. 克隆并配置环境变量

```bash
git clone <repository-url>
cd nodemp

cp .env.example .env
# 编辑 .env，设置 SECRET、ADMIN_EMAIL、ADMIN_PASSWORD

cp frontend/.env.example frontend/.env
# 开发环境默认即可：VITE_DIRECTUS_URL=http://localhost:8055，VITE_API_BASE=/api
```

| 变量 | 位置 | 说明 |
|------|------|------|
| `SECRET` | 根目录 `.env` | Directus 密钥，建议使用随机 64 位 hex |
| `ADMIN_EMAIL` | 根目录 `.env` | 管理员邮箱 |
| `ADMIN_PASSWORD` | 根目录 `.env` | 管理员密码 |
| `VITE_DIRECTUS_URL` | `frontend/.env` | Directus 地址（Vite 代理 target） |
| `VITE_API_BASE` | `frontend/.env` | SDK 请求前缀，开发默认 `/api` |

### 2. 启动 Directus

首次启动会在 `database/data.db` 创建 Directus 系统表：

```bash
docker compose up -d
```

- Directus 管理界面：<http://localhost:8055>
- 使用 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 登录

### 3. 初始化业务数据库

业务表通过 `scripts/bootstrap-*.sql` 写入 SQLite，并注册 Directus collection / fields / relations。脚本设计为**幂等**，可重复执行。

**请严格按依赖顺序执行**，每批脚本执行后重启 Directus：

```bash
docker compose restart directus
```

#### 3.1 CRM 业务模块

```bash
# 产品（报价明细 quote_items.product_id 依赖此表）
sqlite3 database/data.db < scripts/bootstrap-products.sql
docker compose restart directus

# 客户（含 customer_follow_ups 跟进记录）
sqlite3 database/data.db < scripts/bootstrap-customers.sql
docker compose restart directus

# 联系人（依赖 customers）
sqlite3 database/data.db < scripts/bootstrap-contacts.sql
docker compose restart directus

# 商机（依赖 customers）
sqlite3 database/data.db < scripts/bootstrap-opportunities.sql
docker compose restart directus

# 报价及明细（依赖 customers、opportunities）
sqlite3 database/data.db < scripts/bootstrap-quotes.sql
docker compose restart directus
```

#### 3.2 组织与权限模型

```bash
sqlite3 database/data.db < scripts/bootstrap-departments.sql
sqlite3 database/data.db < scripts/bootstrap-user-org-fields.sql
sqlite3 database/data.db < scripts/bootstrap-org-closure.sql
sqlite3 database/data.db < scripts/bootstrap-owner-id.sql
sqlite3 database/data.db < scripts/bootstrap-policy-data-scopes.sql
docker compose restart directus
```

各脚本作用简述：

| 脚本 | 说明 |
|------|------|
| `bootstrap-products.sql` | 产品目录 |
| `bootstrap-customers.sql` | 客户表、跟进记录 |
| `bootstrap-contacts.sql` | 联系人（关联客户） |
| `bootstrap-opportunities.sql` | 商机（关联客户） |
| `bootstrap-quotes.sql` | 报价主表与明细 |
| `bootstrap-departments.sql` | 部门树 |
| `bootstrap-user-org-fields.sql` | 用户 `department_id`、`manager_id` |
| `bootstrap-org-closure.sql` | 部门闭包表、汇报线闭包表 |
| `bootstrap-owner-id.sql` | customers / opportunities / quotes 的 `owner_id` |
| `bootstrap-policy-data-scopes.sql` | 策略 → 集合 → 数据范围配置 |

#### 3.3 一键初始化（可选）

若环境已就绪，可合并执行（仍建议在首次部署时分步验证）：

```bash
sqlite3 database/data.db < scripts/bootstrap-products.sql
sqlite3 database/data.db < scripts/bootstrap-customers.sql
sqlite3 database/data.db < scripts/bootstrap-contacts.sql
sqlite3 database/data.db < scripts/bootstrap-opportunities.sql
sqlite3 database/data.db < scripts/bootstrap-quotes.sql
sqlite3 database/data.db < scripts/bootstrap-departments.sql
sqlite3 database/data.db < scripts/bootstrap-user-org-fields.sql
sqlite3 database/data.db < scripts/bootstrap-org-closure.sql
sqlite3 database/data.db < scripts/bootstrap-owner-id.sql
sqlite3 database/data.db < scripts/bootstrap-policy-data-scopes.sql
docker compose restart directus
```

### 4. 启动前端

```bash
cd frontend
npm install   # 首次
npm run dev
```

- 管理后台：<http://localhost:5173>
- 开发环境通过 Vite 将 `/api` 代理到 Directus（见 `frontend/vite.config.ts`）

默认登录账号与根目录 `.env` 中配置一致（示例：`admin@example.com` / 你设置的密码）。

## 常用命令

```bash
# 后端
docker compose up -d              # 启动 Directus
docker compose restart directus   # 修改数据库或扩展后重启
docker compose logs -f directus   # 查看日志

# 前端
cd frontend && npm run dev        # 开发
cd frontend && npm run build      # 构建，产物在 frontend/dist/
cd frontend && npm run lint       # ESLint 检查
```

## 权限与数据范围

系统采用两层权限模型：

1. **Directus 策略权限**（collection × action：create / read / update / delete / share）—— 控制菜单、路由与按钮是否可见。
2. **数据范围**（self / subordinates / department / all）—— 在策略权限矩阵页配置，由 `extensions/data-scope-filter` Hook 在 API 层强制执行。

受数据范围控制的集合：`customers`、`opportunities`、`quotes`、`contacts`、`customer_follow_ups`、`quote_items`。

管理员（`admin_access === true`）绕过数据范围限制。

## 路由一览

| 路径 | 页面 | 权限 |
|------|------|------|
| `/login` | 登录 | 公开 |
| `/dashboard` | 仪表盘 | 已登录 |
| `/products` | 产品管理 | `products:read` |
| `/customers` | 客户列表 | `customers:read` |
| `/customers/:id` | 客户详情 | `customers:read` |
| `/contacts` | 联系人 | `contacts:read` |
| `/opportunities` | 商机 | `opportunities:read` |
| `/quotes` | 报价列表 | `quotes:read` |
| `/quotes/:id` | 报价详情 | `quotes:read` |
| `/departments` | 部门管理 | admin |
| `/accounts` | 账号管理 | admin |
| `/roles` | 角色管理 | admin |
| `/policies` | 策略管理 | admin |
| `/policies/:policyId/permissions` | 权限矩阵 | admin |

## 项目结构

```
nodemp/
├── docker-compose.yml          # Directus 容器
├── .env.example                # 后端环境变量模板
├── database/data.db            # SQLite（本地生成，勿提交）
├── uploads/                    # Directus 文件上传
├── scripts/                    # 业务表 bootstrap SQL
├── extensions/
│   └── data-scope-filter/      # 数据范围 Hook
└── frontend/                   # React 管理后台
    ├── src/
    │   ├── pages/              # 业务页面
    │   ├── services/           # Directus API 封装
    │   ├── stores/             # 认证与权限状态
    │   └── components/         # AuthGuard、PermissionGuard 等
    └── vite.config.ts          # 开发代理 /api → Directus
```

## 注意事项

- **勿提交** `.env`、`database/data.db` 等含敏感信息或本地状态的文件。
- 修改数据模型（执行 bootstrap 或改 Hook）后须 **`docker compose restart directus`**。
- 数据范围仅在 Hook 中强制执行，仅改前端无法绕过。
- 新增 bootstrap 脚本请使用 `INSERT OR IGNORE` / `WHERE NOT EXISTS` 保持幂等。

## 许可证

见仓库 LICENSE 文件（如有）。
