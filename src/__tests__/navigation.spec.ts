import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'
const key = 'origin-erp:navigation-history'
const route = (path: string, title = '业务页面', name = 'business') =>
  ({
    fullPath: path,
    path,
    name,
    meta: { title },
    matched: [],
    query: {},
    hash: '',
    params: {},
    redirectedFrom: undefined,
  }) as RouteLocationNormalized
beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})
describe('navigation history', () => {
  it('recovers from corrupted persisted JSON', () => {
    localStorage.setItem(key, '{broken')
    expect(useNavigationStore().history).toEqual([])
  })
  it('rejects malformed persisted rows', () => {
    localStorage.setItem(key, JSON.stringify([null, {}, { path: 1, title: 'x' }, { path: '/stock', title: '库存' }]))
    expect(useNavigationStore().history).toEqual([{ path: '/stock', title: '库存' }])
  })
  it('keeps only six recent routes including after restoration', () => {
    localStorage.setItem(
      key,
      JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ path: `/${i}`, title: `业务${i}` }))),
    )
    expect(useNavigationStore().history.map((item) => item.path)).toEqual(['/4', '/5', '/6', '/7', '/8', '/9'])
  })
  it('moves a revisited route to the end without duplicates', () => {
    const store = useNavigationStore()
    store.recordRoute(route('/a'))
    store.recordRoute(route('/b'))
    store.recordRoute(route('/a', '更新标题'))
    expect(store.history).toEqual([
      { path: '/b', title: '业务页面' },
      { path: '/a', title: '更新标题' },
    ])
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(store.history)
  })
  it('does not record login, layout or untitled routes', () => {
    const store = useNavigationStore()
    store.recordRoute(route('/login', '登录', 'login'))
    store.recordRoute(route('/', '布局', 'BasicLayout'))
    store.recordRoute(route('/unknown', ''))
    expect(store.history).toEqual([])
  })
  it('preserves query parameters as separate navigation contexts', () => {
    const store = useNavigationStore()
    store.recordRoute(route('/stock?warehouse=1'))
    store.recordRoute(route('/stock?warehouse=2'))
    expect(store.history).toHaveLength(2)
  })
})
