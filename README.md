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
- **自动质量门禁**：ESLint、Oxlint、Prettier、Husky 和 lint-staged 在提交前自动检查并修复代码。
- **一致的视觉系统**：支持深浅主题、品牌配色、响应式布局和制造业工作台。

## 功能模块

| 模块     | 主要能力                                                 |
| -------- | -------------------------------------------------------- |
| 工作台   | 业务概览、用户信息、主题切换、菜单搜索                   |
| 系统管理 | 用户、角色、部门、菜单、权限及关联分配                   |
| 基础资料 | 客户、供应商、物料、仓库、工厂、车间、生产线、物料供应商 |
| 销售管理 | 销售订单、订单明细、确认/取消、销售出库及状态流转        |
| 库存管理 | 物料库存、库存明细、库存流水、导入导出                   |
| BOM 管理 | BOM 新增、详情、启用/停用、多级结构与需求展开            |
| 生产管理 | 生产需求、生产订单、下达/开工/完工/取消、生产领料        |
| 采购管理 | 采购需求、采购订单、采购入库审核与上架                   |

## 技术栈

| 分类       | 技术                                      |
| ---------- | ----------------------------------------- |
| 核心框架   | Vue 3.5、Composition API                  |
| 开发语言   | TypeScript 6                              |
| 构建工具   | Vite 8                                    |
| UI 组件    | Element Plus 2.14                         |
| 路由与状态 | Vue Router 5、Pinia 4                     |
| 网络请求   | Axios                                     |
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
```

生产部署时在 `.env.production` 或部署平台中设置真实接口地址：

```dotenv
VITE_API_URL=https://api.example.com
```

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
├── stores/       # 用户、权限与应用状态
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
    └── product/   # BOM 与生产管理
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

## 开发规范

- 使用 `<script setup lang="ts">` 和 Composition API。
- API、类型和页面按业务域组织，页面不直接调用 Axios。
- 相邻函数之间保留一个空行，简单模板插值保持紧凑。
- 状态操作必须同时校验当前选中记录和允许流转的业务状态。
- 后端 `Long` 主键在前端统一使用字符串，不执行 `Number(id)` 转换。
- 提交前至少执行 `npm run type-check` 和 `npm run build-only`。

## 参与贡献

1. Fork 仓库并创建功能分支：`git checkout -b feature/your-feature`
2. 完成功能并执行类型检查、Lint 和构建
3. 使用清晰的提交信息，例如：`feat: add production picking workflow`
4. 推送分支并创建 Pull Request，说明改动目的、影响范围和验证方式

问题与建议请提交到 [GitHub Issues](https://github.com/weigu2700-cell/ORIGIN-ERP--FrontEnd/issues)。
