# 原点 ERP · ORIGIN 前端

基于 Vue 3、TypeScript、Vite 和 Element Plus 的制造业 ERP Web 前端，与 ORIGIN ERP Spring Boot 后端配套使用。

- 前端仓库：[ORIGIN-ERP--FrontEnd](https://github.com/weigu2700-cell/ORIGIN-ERP--FrontEnd)
- 后端仓库：[ORIGIN-ERP-BackEnd](https://github.com/weigu2700-cell/ORIGIN-ERP-BackEnd)

## 当前功能

### 工作台与框架

- 制造业风格登录页、品牌 Logo 和响应式布局
- 后端菜单驱动的动态路由
- 可展开、收起的多级侧边栏
- 面包屑导航
- 浅色、深色模式和多套品牌配色
- Header 展示当前用户真实姓名
- 右上角菜单模糊搜索，输入后显示权限范围内的页面，点击直接跳转

### 系统管理

- 用户分页查询、新增、修改、状态管理
- 用户真实姓名展示与查询
- 用户分配角色和部门
- 角色管理、权限分配和菜单分配
- 部门、菜单和权限的树形管理页面

### 基础资料

- 客户、供应商
- 工厂、车间、生产线
- 仓库、物料
- 物料供应商关系
- 通用查询、分页、详情、编辑和状态操作

### 销售与库存

- 销售订单及明细维护、确认和取消
- 销售出库单及明细、确认、完成和取消
- 物料库存查询和详情
- 库存流水查询、导入和导出

### BOM 与生产

- BOM 管理
- BOM 树查询：左侧物料结构，右侧子物料明细
- 多级 BOM 展开和物料需求展示
- 生产需求查询与详情
- 生产订单创建、查询、详情及状态流转
- 从销售订单创建生产需求

## 技术栈

| 分类 | 技术 | 版本 |
| --- | --- | --- |
| 核心框架 | Vue | ^3.5 |
| 语言 | TypeScript | ~6.0 |
| 构建 | Vite | ^8.1 |
| 路由 | Vue Router | ^5.2 |
| 状态管理 | Pinia | ^4.0 |
| UI | Element Plus | ^2.14 |
| 请求 | Axios | ^1.19 |
| 工具 | VueUse | ^14.4 |
| 质量检查 | vue-tsc、ESLint、Oxlint、Vitest | - |

Node.js 要求：^22.18.0 或 >=24.12.0。

## 项目结构

~~~text
src
├── api/          # 按业务模块划分的接口封装
├── components/   # ProTable、ProSearch、ProToolbar、ProTree 等通用组件
├── layout/       # Header、Sidebar、面包屑和基础布局
├── refer/        # 业务参照选择组件
├── router/       # 静态路由、动态路由生成和路由守卫
├── stores/       # 用户、权限菜单和界面状态
├── styles/       # 全局主题与布局样式
├── types/        # 请求、响应和业务模型类型
├── utils/        # 请求、Token、存储和图标工具
└── views/
    ├── home/
    ├── system/
    ├── master/
    ├── inventory/
    ├── sales/
    └── product/  # BOM、生产需求和生产订单
~~~

## 快速开始

~~~bash
git clone https://github.com/weigu2700-cell/ORIGIN-ERP--FrontEnd.git
cd ORIGIN-ERP--FrontEnd

npm install
npm run dev
~~~

开发服务器默认使用 Vite 地址，通常为 http://localhost:5173。

启动前请确保后端服务运行在 http://localhost:8080，或修改环境变量指向实际接口地址。

## 环境变量

开发环境示例：

~~~dotenv
VITE_API_URL=http://localhost:8080
~~~

| 变量 | 说明 |
| --- | --- |
| VITE_API_URL | 后端 API 根地址 |

请求由浏览器直接发送到该地址，后端需要允许对应前端域名跨域访问。

## 常用命令

~~~bash
# 开发
npm run dev

# TypeScript 和 Vue 模板检查
npm run type-check

# 完整构建
npm run build

# 仅执行 Vite 构建
npm run build-only

# ESLint 与 Oxlint
npm run lint

# 单元测试
npm run test:unit

# 预览构建结果
npm run preview
~~~

## 核心约定

### 请求封装

页面通过 src/api 下的模块调用接口，不直接使用 Axios。统一请求层位于 src/utils/request.ts，负责：

- 添加 Authorization Bearer Token
- 解包后端统一响应
- 统一处理业务错误和 401 登录失效

### 雪花 ID

后端 Long 主键可能超过 JavaScript 安全整数范围。前端接口类型统一使用字符串保存 ID，禁止使用 Number(id) 转换。

### 动态菜单与路由

登录后通过 GET /system/menu/current 获取当前用户菜单树，并根据菜单的 component 字段匹配 src/views 下的 Vue 页面。

支持以下组件路径形式：

~~~text
master/material
master/material/index
master/productionLine/index
master/production_line/index
~~~

路由生成器会兼容驼峰、下划线和连字符目录名。工作台统一映射到 src/views/home/home.vue。

### 菜单搜索

Header 搜索框通过 input 事件触发，并进行短延时防抖：

~~~http
GET /system/menu/search?keyword=用户
~~~

后端仅返回当前用户有权限访问且可跳转的菜单。搜索结果点击后通过 Vue Router 跳转。

### 通用页面结构

业务列表页优先复用：

- ProSearch：查询条件
- ProToolbar：新增、修改、状态、刷新、导入和导出
- ProTable：列表、选择和分页
- ProTree：左侧树形结构
- BaseSaveDialog：新增、修改弹窗
- refer 目录：部门、物料、BOM、生产需求等参照选择

### 菜单图标

菜单 icon 保存 Element Plus 图标组件名，例如 User、Setting。包含连字符、空格、点或斜线的值按 CSS 类名处理。

## 登录与权限流程

~~~text
登录
  ↓
保存 JWT
  ↓
获取当前用户信息
  ↓
获取当前用户菜单树
  ↓
注册动态路由
  ↓
渲染侧边栏与业务页面
~~~

菜单控制页面入口，后端 Permission 与 Spring Security 负责接口操作权限。

## 开发检查

提交前至少执行：

~~~bash
npm run type-check
npm run build-only
~~~

修改公共组件、路由或类型后，同时执行：

~~~bash
npm run lint
~~~
