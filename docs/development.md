# Web 开发与集成参考

产品定位、能力范围与首次启动入口见 [README](../README.md)。本文面向需要联调、扩展功能和维护部署的开发者，命令均从仓库根目录执行。

## 组织会话契约

| 接口                        | 用途                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `GET /auth/tenant/context`  | 匿名读取 single/multi，single 返回默认组织                 |
| `POST /auth/tenant/resolve` | 匿名核验 `tenantCode`，仅返回组织编码和名称                |
| `POST /auth/login`          | 提交 `tenantCode`、`username`、`password`，返回 Token      |
| `GET /auth/tenant/session`  | JWT 认证，返回当前组织、基础用户身份和 `businessAvailable` |

single 兼容省略组织编码；multi 需要有效编码，当前 `businessAvailable=false`。组织不可用与服务故障应保留可重试说明；当前后端以 401 表达无效登录、403 表达停用/冲突、503 表达目标服务不可用或业务门禁。客户端不提供公开组织目录，也不接收数据库连接参数。

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
读取模式 → 核验组织 → 登录 → 获取组织会话
                               ├── 业务已开放：用户/菜单 → 动态路由 → 业务页面
                               └── 业务未开放：组织主页与状态提示
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
- 在当前会话登录失效时清理会话并返回登录页；
- 切换会话时取消旧请求，拦截晚到的成功响应和 401，防止旧组织覆盖当前数据或退出新会话；
- 匿名登录/组织核验请求不携带旧组织凭据。

退出和切换同时清理用户、权限、动态路由、访问记录与通知状态；AI SSE 流和旧 WebSocket 回调绑定会话。最近组织只保留编码与名称，不能作为授权依据。实现主要位于 `src/stores/organization.ts`、`src/stores/user.ts`、`src/utils/auth.ts` 与 `src/utils/request.ts`。

### 通用业务页面

列表页优先组合通用组件：

```text
ProPageHeader + ProSearch + ProToolbar + ProTable + ReferPicker
```

订单详情统一使用 `BusinessDocumentDialog`，使销售、采购和生产单据拥有一致的信息层级与操作体验。

### 消息通知与 WebSocket

消息通知采用“REST 初始化与操作 + WebSocket 增量推送”的组合方式：

```text
进入业务已开放的 BasicLayout
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
       Header 铃铛角标          合并为一个实时提醒
```

主要实现位置：

| 文件                                                       | 职责                                           |
| ---------------------------------------------------------- | ---------------------------------------------- |
| `src/utils/websocket.ts`                                   | 建立单例连接、附加 JWT、解析推送并在退出时断开 |
| `src/stores/notification.ts`                               | 管理最近通知、未读数、去重、单条已读和全部已读 |
| `src/layout/components/NotificationPopover.vue`            | Header 铃铛、未读角标和最近通知入口            |
| `src/views/eip/notification/notificationList/index.vue`    | 通知中心、已读筛选、分页和批量操作             |
| `src/views/eip/notification/notificationDetail/detail.vue` | 按 ID 查询详情并提供“标记已读”操作             |
| `src/api/eip/notification.ts`                              | 通知 REST API 封装                             |

页面与接口：

| 能力     | 前端地址/调用                        | 说明                                       |
| -------- | ------------------------------------ | ------------------------------------------ |
| 通知中心 | `/notification/list`                 | 全部、未读、已读筛选与分页                 |
| 通知详情 | `/notification/detail/:id`           | 支持浏览器刷新和直接访问                   |
| 未读数量 | `GET /sys/notification/unread/count` | 驱动铃铛右上角数量角标，超过 99 显示 `99+` |
| 单条已读 | `PUT /sys/notification/{id}/readed`  | 成功后同步更新列表及未读数                 |
| 全部已读 | `PUT /sys/notification/all/readed`   | 清空当前用户未读数                         |

WebSocket 只负责实时增量通知，不替代数据库与 REST 接口。连接异常关闭后按 1 秒起、最多 30 秒的退避重连；网络恢复或页面重新可见时重新检查连接并同步 REST 状态。退出/切换会关闭旧连接、取消重连和清理通知，不接受旧 Token 连接的晚到消息。

一次生产下达可能按 BOM 产生多张单据及不同待办，这些业务通知仍逐条保存、按 ID 去重并计入未读数；同一时段的提醒合并显示数量，避免一次操作弹出二十多个提示。合并提示不等于丢弃通知。

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

组织与会话回归还覆盖同用户 ID 的切换、较早的组织核验晚返回、用户信息晚返回、权限/访问状态清理、旧请求 200/401，以及 AI 流的会话边界。布局可在 Web 宽度 960、1024、1280、1440、1920 下，配合长组织名、长用户名和多条访问记录复核。

最近一次验证（2026-11-03）：49 项单元测试及 `build-only` 通过。当前依赖安装下 `type-check` 在未改动的 `RichTextEditor.vue` 报 `@wangeditor/editor-for-vue` 的类型导出解析错误（TS7016）；生产构建通过不替代类型检查，发布前仍需解决并重新运行该检查。

## 开发规范

- 使用 `<script setup lang="ts">` 和 Composition API。
- API、类型和页面按业务域组织，页面不直接调用 Axios。
- 相邻函数之间保留一个空行，简单模板插值保持紧凑。
- 状态操作必须同时校验当前选中记录和允许流转的业务状态。
- 后端 `Long` 主键在前端统一使用字符串，不执行 `Number(id)` 转换。
- 提交前至少执行 `npm run type-check` 和 `npm run build-only`。

## 部署说明

- SPA 服务器需要将未知前端路由回退到 `index.html`，否则直接访问 `/notification/detail/:id` 会返回 404。
- 反向代理需要同时转发 REST 请求与 `/ws/notification`，并启用 WebSocket Upgrade/Connection 请求头。
- 推荐让 REST 与 WebSocket 共用同一 HTTPS 域名；如使用独立地址，通过 `VITE_WS_URL` 指定完整 `wss://` URL。
- `VITE_` 环境变量会写入浏览器构建产物，不得存放数据库密码、JWT 密钥或其他服务端凭据。
- 先部署配套后端与目标数据库迁移，再发布前端；多租户业务的开放以服务端验收和 `businessAvailable` 为准。
