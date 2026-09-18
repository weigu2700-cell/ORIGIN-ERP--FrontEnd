import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProPageHeader from '../components/ProPageHeader.vue'

describe('ProPageHeader', () => {
  it('渲染父级内容和可选区域', () => {
    const wrapper = mount(ProPageHeader, {
      props: { title: '采购订单', description: '采购进度', summary: '共 20 条' },
      slots: {
        actions: '<button>新增订单</button>',
        search: '<input aria-label="订单编号" />',
        toolbar: '<button>刷新</button>',
      },
    })
    expect(wrapper.get('h1').text()).toBe('采购订单')
    expect(wrapper.text()).toContain('共 20 条')
    expect(wrapper.get('.header-actions').text()).toBe('新增订单')
    expect(wrapper.get('.search-section input').attributes('aria-label')).toBe('订单编号')
    expect(wrapper.get('.toolbar-section').text()).toBe('刷新')
    expect(wrapper.find('[role="group"]').exists()).toBe(false)
  })

  it('触发受控选中变化并清除已激活筛选', async () => {
    const wrapper = mount(ProPageHeader, {
      props: {
        title: '订单',
        cards: [{ label: '待审核', value: 'PENDING', count: 3, hint: '条' }],
      },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['PENDING']])
    expect(wrapper.emitted('change')).toEqual([['PENDING']])
    await wrapper.setProps({ modelValue: 'PENDING' })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('change')).toEqual([['PENDING'], ['']])
    expect(wrapper.emitted('update:modelValue')).toEqual([['PENDING'], ['']])
    await wrapper.setProps({ modelValue: '' })
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
  })

  it('省略未使用的插槽区域', () => {
    const wrapper = mount(ProPageHeader, { props: { title: '物料' } })
    expect(wrapper.find('.header-actions').exists()).toBe(false)
    expect(wrapper.find('.search-section').exists()).toBe(false)
    expect(wrapper.find('.toolbar-section').exists()).toBe(false)
  })
})
