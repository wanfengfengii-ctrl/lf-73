import { ref, onMounted, onUnmounted } from 'vue'
import type { IncenseScheme } from '@/types/incense'
import { SCHEME_STORAGE_KEY } from '@/utils/constants'

export function useSchemeStorage() {
  const schemes = ref<IncenseScheme[]>([])

  function loadSchemes() {
    try {
      const stored = localStorage.getItem(SCHEME_STORAGE_KEY)
      if (stored) {
        schemes.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load schemes:', e)
      schemes.value = []
    }
  }

  function saveSchemes() {
    try {
      localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(schemes.value))
    } catch (e) {
      console.error('Failed to save schemes:', e)
    }
  }

  function addScheme(scheme: IncenseScheme) {
    schemes.value.unshift(scheme)
    saveSchemes()
  }

  function updateScheme(id: string, scheme: Partial<IncenseScheme>) {
    const index = schemes.value.findIndex((s) => s.id === id)
    if (index !== -1) {
      schemes.value[index] = { ...schemes.value[index], ...scheme, updatedAt: Date.now() }
      saveSchemes()
    }
  }

  function deleteScheme(id: string) {
    schemes.value = schemes.value.filter((s) => s.id !== id)
    saveSchemes()
  }

  function getScheme(id: string): IncenseScheme | undefined {
    return schemes.value.find((s) => s.id === id)
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  function generateSchemeName(): string {
    const count = schemes.value.length + 1
    return `香篆方案 ${count}`
  }

  onMounted(() => {
    loadSchemes()
  })

  return {
    schemes,
    loadSchemes,
    addScheme,
    updateScheme,
    deleteScheme,
    getScheme,
    generateId,
    generateSchemeName,
  }
}
