import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('渲染当前路由出口', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterView: { template: '<main data-testid="route-outlet" />' },
        },
      },
    })

    expect(wrapper.find('[data-testid="route-outlet"]').exists()).toBe(true)
  })
})
