import { beforeEach, describe, expect, it, vi } from 'vitest'
import service from '@/utils/request'
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  getNotificationTemplate,
  getNotificationTemplates,
  getRecipientOptions,
  publishNotification,
  updateNotificationTemplate,
  updateNotificationTemplateStatus,
} from '@/api/eip/notification'
import { extractTemplateVariables } from '@/composables/useTemplateVariables'
import type { NotificationTemplate } from '@/types/eip/notification'

vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn<(...args: unknown[]) => unknown>(),
    post: vi.fn<(...args: unknown[]) => unknown>(),
    put: vi.fn<(...args: unknown[]) => unknown>(),
    del: vi.fn<(...args: unknown[]) => unknown>(),
  },
}))

const template: NotificationTemplate = {
  code: 'purchase.done',
  name: '采购完成',
  titleTemplate: '采购单 {{no}} 已完成',
  contentTemplate: '负责人 {{owner}} 请及时处理 {{no}}',
  notificationType: 0,
  status: 1,
  recipients: [],
}

describe('EIP notification API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('保留收件箱接口并调用发布、收件人和模板接口', async () => {
    await publishNotification({ title: '通知', content: '正文' })
    await getRecipientOptions('USER', '张')
    await getNotificationTemplates('采购')
    await getNotificationTemplate('9007199254740993')
    await createNotificationTemplate(template)
    await updateNotificationTemplate('9007199254740993', template)
    await updateNotificationTemplateStatus('9007199254740993', 'ENABLE')
    await deleteNotificationTemplate('9007199254740993')

    expect(service.post).toHaveBeenCalledWith('/eip/notifications/publish', { title: '通知', content: '正文' })
    expect(service.get).toHaveBeenNthCalledWith(1, '/eip/notification-recipient-options', {
      params: { type: 'USER', keyword: '张' },
    })
    expect(service.put).toHaveBeenLastCalledWith('/eip/notification-templates/9007199254740993/status', undefined, {
      params: { status: 'ENABLE' },
    })
    expect(service.del).toHaveBeenCalledWith('/eip/notification-templates/9007199254740993')
  })
})

describe('notification template variables', () => {
  it('提取变量并去重，保持出现顺序', () => {
    expect(extractTemplateVariables('订单 {{no}}', '负责人 {{owner}}，订单 {{no}}')).toEqual(['no', 'owner'])
  })
})
