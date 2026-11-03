import type { ImApi } from '@/types/im'
import { httpImApi } from './http'
import { createMockImApi, MOCK_ME } from './mock'

/** VITE_IM_MOCK=1 时使用内存 Mock，用于后端聊天接口上线前的界面联调。 */
export const imMockEnabled = import.meta.env.VITE_IM_MOCK === '1'
export const mockUserId = MOCK_ME
export const imApi: ImApi = imMockEnabled ? createMockImApi() : httpImApi
