import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '../components/PageHeader.vue'

describe('PageHeader', () => {
  it('集成标题、搜索和工具栏内容', () => {
    const wrapper = mount(PageHeader, {
      props: { title: '物料管理', description: '维护物料资料', summary: '共 12 条' },
      slots: {
        search: '<input aria-label="物料编码" />',
        toolbar: '<button>新增</button>',
      },
    })

    expect(wrapper.get('h1').text()).toBe('物料管理')
    expect(wrapper.text()).toContain('维护物料资料')
    expect(wrapper.text()).toContain('共 12 条')
    expect(wrapper.get('.list-page-header__search input').attributes('aria-label')).toBe('物料编码')
    expect(wrapper.get('.list-page-header__toolbar').text()).toBe('新增')
  })

  it('不渲染空的控件行', () => {
    const wrapper = mount(PageHeader, { props: { title: '采购入库' } })
    expect(wrapper.find('.list-page-header__controls').exists()).toBe(false)
  })
})
