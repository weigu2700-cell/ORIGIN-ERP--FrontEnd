import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem } from '@/types/system/menu.ts'

const module = import.meta.glob('../views/**/*.vue')

// 菜单配置的 component 与 views 下页面路径不匹配时，渲染提示页而非空白，便于定位问题
const MissingComponent = defineComponent({
  props: { componentPath: { type: String, default: '' } },
  setup(props) {
    return () =>
      h(
        'div',
        {
          style: 'padding: 60px 20px; text-align: center; color: #909399; font-size: 14px; line-height: 2;',
        },
        [
          h('div', { style: 'font-size: 16px; color: #f56c6c; margin-bottom: 8px;' }, '页面组件未找到'),
          h('div', `请检查「系统管理-菜单管理」中该菜单的「组件路径」配置：${props.componentPath || '(空)'}`),
          h(
            'div',
            { style: 'color: #c0c4cc; font-size: 12px;' },
            '组件路径示例：master/material/index（对应 src/views/master/material/index.vue）',
          ),
        ],
      )
  },
})

// 父级菜单（有子路由但自身无组件）仅渲染子路由，避免子树空白
const ParentContainer = defineComponent({
  setup() {
    return () => h(RouterView)
  },
})

// 将驼峰或帕斯卡命名转换为下划线命名（如 productionLine、ProductionLine -> production_line）
function camelToSnake(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

// 将路径中的每个段都转换为下划线格式（如 master/productionLine/index -> master/production_line/index）
function convertPathToSnake(str: string): string {
  return str.split('/').map(camelToSnake).join('/')
}

function normalizeRoutePath(path: string, parentPath = ''): string {
  const rawPath = path.trim()
  if (!parentPath) return rawPath

  const normalizedPath = rawPath.replace(/^\/+/, '')
  const normalizedParent = parentPath.replace(/^\/+/, '').replace(/\/+$/, '')
  if (normalizedPath === normalizedParent) return ''
  if (normalizedPath.startsWith(`${normalizedParent}/`)) {
    return normalizedPath.slice(normalizedParent.length + 1)
  }
  // 以 / 开头但不包含父路径时，按绝对路径保留，兼容后端的独立路由配置。
  return rawPath.startsWith('/') ? rawPath : normalizedPath
}

function isWorkbenchMenu(menu: MenuItem): boolean {
  const normalizedPath = normalizeRoutePath(menu.path).replace(/^\/+/, '')
  const componentPath = String(menu.component ?? '').toLowerCase()
  return (
    menu.name === 'home' ||
    normalizedPath === 'home' ||
    menu.title === '工作台' ||
    menu.title === '首页' ||
    /(?:^|\/)(home|dashboard)(?:\/|\.vue|$)/.test(componentPath)
  )
}

function resolveViewComponent(rawPath?: string) {
  if (!rawPath) return undefined

  const componentPath = rawPath
    .trim()
    .replace(/^\/+/, '')
    .replace(/^views\//, '')
    .replace(/\.vue$/, '')
  const normalizedComponentPath = componentPath.toLowerCase()
  const snakePath = convertPathToSnake(componentPath)
  const kebabPath = snakePath.replace(/_/g, '-')
  // 兼容历史菜单数据中的 BomTreeQuary 拼写，实际目录已规范为 bom_tree_query。
  const legacyCompatiblePath = snakePath.replace(/quary/g, 'query')
  const candidates = [
    `../views/${componentPath}.vue`,
    `../views/${componentPath}/index.vue`,
    `../views/${snakePath}.vue`,
    `../views/${snakePath}/index.vue`,
    `../views/${kebabPath}.vue`,
    `../views/${kebabPath}/index.vue`,
    `../views/${legacyCompatiblePath}.vue`,
    `../views/${legacyCompatiblePath}/index.vue`,
  ]

  // 工作台实际文件为 views/home/home.vue，兼容菜单配置中的 home / dashboard 写法。
  if (
    normalizedComponentPath === 'home' ||
    normalizedComponentPath === 'home/index' ||
    normalizedComponentPath === 'dashboard' ||
    normalizedComponentPath.endsWith('/home') ||
    normalizedComponentPath.endsWith('/dashboard')
  ) {
    candidates.unshift('../views/home/home.vue')
  }

  for (const candidate of [...new Set(candidates)]) {
    const component = module[candidate]
    if (component) return component
  }
  return undefined
}

export function generateRoutes(menus: MenuItem[], parentPath = ''): RouteRecordRaw[] {
  return menus.map((menu) => {
    const hasChildren = !!(menu.children && menu.children.length > 0)
    const routePath = normalizeRoutePath(menu.path, parentPath)
    const routePathWithoutSlash = routePath.replace(/^\/+/, '').replace(/\/+$/, '')
    const nextParentPath = routePathWithoutSlash
      ? parentPath
        ? `${parentPath}/${routePathWithoutSlash}`
        : routePathWithoutSlash
      : parentPath

    const componentPath = menu.component
    const component = isWorkbenchMenu(menu) ? module['../views/home/home.vue'] : resolveViewComponent(componentPath)

    // 调试日志：输出未匹配到的组件路径
    if (componentPath && !component && !hasChildren) {
      console.warn(`[路由匹配失败] 菜单: ${menu.title}, 路径: ${menu.path}, 组件路径: ${componentPath}`)
      console.warn(`[期望路径] ../views/${componentPath}.vue 或 ../views/${componentPath}/index.vue`)
      console.warn(`[正确格式示例] master/production_line/index → ../views/master/production_line/index.vue`)
    }

    const route: RouteRecordRaw = {
      path: routePath,
      name: menu.name,
      meta: { title: menu.title },
      children: hasChildren ? generateRoutes(menu.children ?? [], nextParentPath) : [],
    }
    if (component) {
      route.component = component
    } else if (hasChildren) {
      // 父级菜单：无组件则渲染子路由
      route.component = ParentContainer
    } else {
      // 叶子菜单组件缺失：渲染提示页，避免空白
      route.component = MissingComponent
      route.props = { componentPath: menu.component ?? '' }
    }
    return route
  })
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/login.vue'),
  },
  {
    path: '/',
    name: 'BasicLayout',
    component: () => import('@/layout/BasicLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home/home.vue'),
        meta: { title: '首页' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/404.vue'),
  },
]

export default routes
