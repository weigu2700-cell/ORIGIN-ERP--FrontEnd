import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App', () => {
  it('renders the active route outlet', () => {
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
