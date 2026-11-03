import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTenantConfiguration, resolveOrganization } from '@/api/system/auth'
import type { Organization, TenantConfiguration } from '@/types/system/auth'
const KEY = 'origin-erp:recent-organizations:v1'
const CHOICE = 'origin-erp:organization-choice:v1'
function readRecent(): Organization[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(KEY) || '' || '[]')
    if (!Array.isArray(items)) return []
    return items
      .filter(
        (item): item is Organization =>
          !!item &&
          typeof item.code === 'string' &&
          item.code.length <= 64 &&
          typeof item.name === 'string' &&
          item.name.length <= 128,
      )
      .slice(0, 5)
  } catch {
    return []
  }
}
export const useOrganizationStore = defineStore('organization', () => {
  const recent = ref(readRecent())
  const selectedCode = ref(localStorage.getItem(CHOICE) || '')
  const configuration = ref<TenantConfiguration | null>(null)
  const resolved = ref<Organization | null>(null)
  const loading = ref(false)
  const initializing = ref(false)
  const error = ref('')
  let sequence = 0
  function choose(code: string) {
    sequence += 1
    selectedCode.value = code.trim()
    resolved.value = null
    error.value = ''
    loading.value = false
    localStorage.setItem(CHOICE, selectedCode.value)
  }

  async function verify(code = selectedCode.value) {
    choose(code)
    if (!selectedCode.value || selectedCode.value.length > 64) {
      error.value = '请输入组织编码'
      throw new Error(error.value)
    }
    const ticket = sequence
    loading.value = true
    try {
      const organization = await resolveOrganization(selectedCode.value)
      if (ticket !== sequence) throw new Error('组织选择已改变')
      resolved.value = organization
      selectedCode.value = organization.code
      return organization
    } catch (failure) {
      if (ticket === sequence) error.value = failure instanceof Error ? failure.message : '组织验证失败，请重试'
      throw failure
    } finally {
      if (ticket === sequence) loading.value = false
    }
  }

  async function initialize() {
    initializing.value = true
    error.value = ''
    try {
      const result = await getTenantConfiguration()
      configuration.value = result
      if (result.mode === 'single' && result.organization) {
        choose(result.organization.code)
        resolved.value = result.organization
      } else if (selectedCode.value) {
        await verify()
      }
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : '无法加载组织，请重试'
    } finally {
      initializing.value = false
    }
  }

  function remember(organization: Organization) {
    recent.value = [organization, ...recent.value.filter((item) => item.code !== organization.code)].slice(0, 5)
    localStorage.setItem(KEY, JSON.stringify(recent.value))
  }
  return {
    recent,
    selectedCode,
    configuration,
    resolved,
    loading,
    initializing,
    error,
    choose,
    verify,
    initialize,
    remember,
  }
})
