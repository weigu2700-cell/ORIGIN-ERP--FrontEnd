<div align="center">
  <img src="./public/origin-manufacturing-logo.svg" alt="ORIGIN ERP" width="360" />

  <h1>ORIGIN ERP Web</h1>

  <p>面向制造企业的现代化 ERP 管理端，以订单为核心串联销售、采购、库存、BOM 与生产执行。</p>

  <p>
    <img src="https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3.5" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178c6?logo=typescript&logoColor=white" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" alt="Vite 8" />
    <img src="https://img.shields.io/badge/Element_Plus-2.14-409eff?logo=elementplus&logoColor=white" alt="Element Plus" />
  </p>
</div>

## 项目简介

ORIGIN ERP Web 是原点 ERP 的桌面管理端。项目采用 Vue 3、TypeScript、Vite 和 Element Plus 构建，通过后端菜单与权限动态生成业务导航，并提供统一的查询、表格、参照选择、单据详情和状态流转体验。

配套项目：

- [ORIGIN ERP 后端](https://github.com/weigu2700-cell/ORIGIN-ERP-BackEnd)
- [ORIGIN ERP 移动端](https://github.com/weigu2700-cell/ORIGIN-ERP-Moblie)

## 项目亮点

- **制造业务闭环**：销售订单、生产需求、BOM、生产订单、领料、采购和库存围绕同一业务链路协同。
- **权限驱动路由**：登录后根据当前用户菜单生成路由和侧边栏，并兼容驼峰、帕斯卡、下划线及历史菜单路径。
- **订单化交互**：销售、采购、生产相关详情采用统一单据结构，突出单号、状态、业务摘要、明细和金额。
- **状态流转可视化**：订单确认、审核、下达、开工、完工、取消、上架等操作随当前状态动态显示。
- **高复用业务组件**：沉淀 `ProTable`、`ProSearch`、`ProToolbar`、`ProTree`、`ReferPicker` 和单据详情容器。
- **类型安全**：接口、查询条件和业务实体集中建模；雪花 ID 全程按字符串处理，避免 JavaScript 精度损失。
- **实时消息通知**：登录后建立 WebSocket 连接，Pinia 统一维护最近消息与未读数量，支持铃铛提醒、通知中心、独立详情页和已读操作。
- **自动质量门禁**：ESLint、Oxlint、Prettier、Husky 和 lint-staged 在提交前自动检查并修复代码。
- **一致的视觉系统**：支持深浅主题、品牌配色、响应式布局和制造业工作台。

## 功能模块

| 模块     | 主要能力                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| 工作台   | 业务概览看板、用户信息展示、深浅主题切换、全局菜单搜索                       |
| 系统管理 | 用户管理、角色管理、部门管理、菜单配置、权限定义与角色授权                   |
| 基础资料 | 客户、供应商、物料、仓库、工厂、车间、生产线、物料供应商的增删改查与关联维护 |
| 销售管理 | 销售订单新增/编辑/确认/取消、销售出库及全流程状态流转                        |
| 库存管理 | 物料库存查询、库存明细、库存流水追踪、成品入库与数据导入导出                 |
| BOM 管理 | BOM 新增与编辑、多级树形结构展示、启用/停用、物料需求展开                    |
| 生产管理 | 生产需求生成、生产订单下达/开工/完工/取消、生产领料、生产报工                |
| 采购管理 | 采购需求、采购订单新增/编辑、采购入库审核与上架、状态流转                    |
| 消息通知 | WebSocket 实时推送、未读角标提醒、通知中心、通知详情、单条/全部已读          |

## 项目截图

> 将截图保存至 `screenshots/` 目录后替换下方图片路径。

<div align="center">
  <img src="./screenshots/device-management.png" alt="设备管理" width="90%" />
  <p><em>设备管理 — 设备列表、状态筛选、批量操作与分页</em></p>

  <img src="./screenshots/device-detail.png" alt="设备详情" width="90%" />
  <p><em>设备详情 — 设备信息、扩展信息、产品信息与标签管理</em></p>

  <img src="./screenshots/device-attributes.png" alt="设备属性" width="90%" />
  <p><em>设备属性 — 实时温湿度数据展示与地理位置信息</em></p>

  <img src="./screenshots/product-model.png" alt="物模型" width="90%" />
  <p><em>物模型 — 功能点定义、数据类型、取值范围与读写权限配置</em></p>
</div>

## 技术栈

| 分类       | 技术                                      |
| ---------- | ----------------------------------------- |
| 核心框架   | Vue 3.5、Composition API                  |
| 开发语言   | TypeScript 6                              |
| 构建工具   | Vite 8                                    |
| UI 组件    | Element Plus 2.14                         |
| 路由与状态 | Vue Router 5、Pinia 4                     |
| 网络请求   | Axios                                     |
| 实时通信   | 浏览器原生 WebSocket                      |
| 数据可视化 | ECharts                                   |
| 工程质量   | ESLint、Oxlint、Prettier、vue-tsc、Vitest |
| Git 工作流 | Husky、lint-staged                        |

## 快速开始

### 环境要求

- Node.js `^22.18.0` 或 `>=24.12.0`
- npm 10+
- 已启动的 [ORIGIN ERP 后端](https://github.com/weigu2700-cell/ORIGIN-ERP-BackEnd)

### 安装与启动

```bash
git clone https://github.com/weigu2700-cell/ORIGIN-ERP--FrontEnd.git
cd ORIGIN-ERP--FrontEnd

npm install
npm run dev
```

开发地址以终端输出为准，通常为 <http://localhost:5173>。

### 环境变量

开发环境默认读取 `.env.development`：

```dotenv
VITE_API_URL=http://localhost:8080
# 可选。未配置时会基于 VITE_API_URL 自动生成 ws://localhost:8080/ws/notification
VITE_WS_URL=ws://localhost:8080/ws/notification
```

生产部署时在 `.env.production` 或部署平台中设置真实接口地址：

```dotenv
VITE_API_URL=https://api.example.com
# 前后端不在同一网关或 WebSocket 使用独立域名时配置
VITE_WS_URL=wss://api.example.com/ws/notification
```

`VITE_WS_URL` 是可选项。未配置时，客户端使用 `VITE_API_URL` 拼接 `/ws/notification`，并自动将 `http/https` 转换为 `ws/wss`。生产环境必须通过 HTTPS 页面连接 WSS，避免浏览器阻止混合内容。

> `VITE_` 前缀变量会进入浏览器产物，请勿在其中保存密码、Token 或其他密钥。

## 常用命令

| 命令                 | 说明                            |
| -------------------- | ------------------------------- |
| `npm run dev`        | 启动开发服务器                  |
| `npm run type-check` | 检查 TypeScript 与 Vue 模板类型 |
| `npm run lint`       | 执行 Oxlint 与 ESLint 自动修复  |
| `npm run format`     | 使用 Prettier 格式化项目        |
| `npm run test:unit`  | 运行 Vitest 单元测试            |
| `npm run build`      | 并行执行类型检查与生产构建      |
| `npm run build-only` | 仅执行 Vite 生产构建            |
| `npm run preview`    | 本地预览生产产物                |

安装依赖后 Husky 会自动启用。提交时 lint-staged 只检查暂存的前端文件，并自动执行 ESLint 与 Prettier。

## 项目结构

```text
src/
├── api/          # 按业务域划分的接口封装
├── components/   # 通用页面、表格、工具栏和单据组件
├── composables/  # 可复用组合式逻辑
├── layout/       # 顶栏、侧边栏、面包屑和基础布局
├── refer/        # 客户、物料、仓库、订单等参照选择器
├── router/       # 静态路由、动态路由解析和守卫
├── stores/       # 用户、权限、应用状态和通知状态
├── styles/       # 全局样式和主题变量
├── types/        # 接口 DTO、VO 与业务类型
├── utils/        # 请求、认证、存储和图标工具
└── views/
    ├── home/      # 工作台
    ├── system/    # 系统管理
    ├── master/    # 基础资料
    ├── inventory/ # 库存管理
    ├── sales/     # 销售管理
    ├── purchase/  # 采购管理
    ├── eip/       # 消息通知中心、通知详情、自定义表单
    ├── product/   # BOM 与生产管理
    └── profile/   # 个人中心
```

## 核心设计

### 动态菜单与权限

```text
登录 → 获取用户信息 → 获取菜单树 → 注册动态路由 → 渲染侧边栏 → 进入业务页面
```

菜单决定页面入口，后端 Permission 与 Spring Security 决定接口操作权限。菜单组件路径支持以下写法：

```text
master/material
master/material/index
product/Bom/BomManagement/index
product/bom/bom_management/index
```

### 统一请求层

页面只调用 `src/api` 中的业务接口。`src/utils/request.ts` 负责：

- 自动添加 Bearer Token；
- 解包后端统一响应；
- 统一处理业务异常和网络异常；
- 在登录失效时清理会话并返回登录页。

### 通用业务页面

列表页优先组合通用组件：

```text
ProPageHeader + ProSearch + ProToolbar + ProTable + ReferPicker
```

订单详情统一使用 `BusinessDocumentDialog`，使销售、采购和生产单据拥有一致的信息层级与操作体验。

### 消息通知与 WebSocket

消息通知采用“REST 初始化与操作 + WebSocket 增量推送”的组合方式：

```text
进入 BasicLayout
   ├── REST：并行加载未读数量与最近 6 条通知
   └── WebSocket：连接 /ws/notification?token=<JWT>
                         │
                         ▼
                  收到 NotificationItem
                         │
                         ▼
              Pinia 去重、插入列表、累加未读数
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       Header 铃铛角标          Element Plus 桌面提醒
```

主要实现位置：

| 文件                                            | 职责                                           |
| ----------------------------------------------- | ---------------------------------------------- |
| `src/utils/websocket.ts`                        | 建立单例连接、附加 JWT、解析推送并在退出时断开 |
| `src/stores/notification.ts`                    | 管理最近通知、未读数、去重、单条已读和全部已读 |
| `src/layout/components/NotificationPopover.vue` | Header 铃铛、未读角标和最近通知入口            |
| `src/views/eip/notification/index.vue`          | 通知中心、已读筛选、分页和批量操作             |
| `src/views/eip/notification/detail.vue`         | 按 ID 查询独立详情并提供“标记已读”操作         |
| `src/api/eip/notification.ts`                   | 通知 REST API 封装                             |

页面与接口：

| 能力     | 前端地址/调用                        | 说明                                       |
| -------- | ------------------------------------ | ------------------------------------------ |
| 通知中心 | `/notifications`                     | 全部、未读、已读筛选与分页                 |
| 通知详情 | `/notifications/:id`                 | 支持浏览器刷新和直接访问                   |
| 未读数量 | `GET /sys/notification/unread/count` | 驱动铃铛右上角数量角标，超过 99 显示 `99+` |
| 单条已读 | `PUT /sys/notification/{id}/readed`  | 成功后同步更新列表及未读数                 |
| 全部已读 | `PUT /sys/notification/all/readed`   | 清空当前用户未读数                         |

WebSocket 只负责实时增量通知，不替代数据库与 REST 接口。页面刷新后由 REST 恢复完整状态；退出登录时会关闭连接并清空用户通知状态。当前客户端未做自动重连，网络恢复后需重新进入登录态或刷新页面建立连接。

### 消息通知测试

通知模块包含页面、详情和 Pinia 状态测试，主要覆盖：

- 全部、未读、已读筛选和分页参数；
- 单条与全部已读后的状态同步；
- WebSocket 消息去重、最近 6 条截断及未读数累加；
- 雪花 ID 字符串透传；
- 独立详情加载和详情页标记已读。

可单独运行全部单元测试：

```bash
npm run test:unit -- --run
```

## 开发规范

- 使用 `<script setup lang="ts">` 和 Composition API。
- API、类型和页面按业务域组织，页面不直接调用 Axios。
- 相邻函数之间保留一个空行，简单模板插值保持紧凑。
- 状态操作必须同时校验当前选中记录和允许流转的业务状态。
- 后端 `Long` 主键在前端统一使用字符串，不执行 `Number(id)` 转换。
- 提交前至少执行 `npm run type-check` 和 `npm run build-only`。

## 部署说明

- SPA 服务器需要将未知前端路由回退到 `index.html`，否则直接访问 `/notifications/:id` 会返回 404。
- 反向代理需要同时转发 REST 请求与 `/ws/notification`，并启用 WebSocket Upgrade/Connection 请求头。
- 推荐让 REST 与 WebSocket 共用同一 HTTPS 域名；如使用独立地址，通过 `VITE_WS_URL` 指定完整 `wss://` URL。
- `VITE_` 环境变量会写入浏览器构建产物，不得存放数据库密码、JWT 密钥或其他服务端凭据。

## 未来期望

- **零代码表单建设**：提供可视化拖拽表单设计器，支持自定义字段、校验规则与业务流程编排，零代码快速搭建业务表单与审批单据。
- **AI 助手**：集成智能问答与数据分析能力，支持自然语言查询业务数据、生成报表摘要和运营建议，辅助制造决策。

## 参与贡献

1. Fork 仓库并创建功能分支：`git checkout -b feature/your-feature`
2. 完成功能并执行类型检查、Lint 和构建
3. 使用清晰的提交信息，例如：`feat: add production picking workflow`
4. 推送分支并创建 Pull Request，说明改动目的、影响范围和验证方式

问题与建议请提交到 [GitHub Issues](https://github.com/weigu2700-cell/ORIGIN-ERP--FrontEnd/issues)。
