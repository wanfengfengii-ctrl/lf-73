import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IncenseScheme, SchemeVersion } from '@/types/incense'
import { SCHEME_STORAGE_KEY } from '@/utils/constants'

export const useSchemeStore = defineStore('scheme', () => {
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

  function addVersion(schemeId: string, version: SchemeVersion) {
    const scheme = schemes.value.find((s) => s.id === schemeId)
    if (scheme) {
      const newVersion = {
        ...version,
        version: scheme.versions.length + 1,
      }
      scheme.versions.push(newVersion)
      scheme.currentVersion = newVersion.version
      scheme.updatedAt = Date.now()
      saveSchemes()
    }
  }

  function loadVersion(schemeId: string, versionId: string): SchemeVersion | undefined {
    const scheme = schemes.value.find((s) => s.id === schemeId)
    if (scheme) {
      const version = scheme.versions.find((v) => v.id === versionId)
      if (version) {
        scheme.currentVersion = version.version
        scheme.path = JSON.parse(JSON.stringify(version.path))
        scheme.analysis = JSON.parse(JSON.stringify(version.analysis))
        scheme.thumbnail = version.thumbnail
        scheme.updatedAt = Date.now()
        saveSchemes()
      }
      return version
    }
    return undefined
  }

  function deleteVersion(schemeId: string, versionId: string) {
    const scheme = schemes.value.find((s) => s.id === schemeId)
    if (scheme) {
      scheme.versions = scheme.versions.filter((v) => v.id !== versionId)
      if (scheme.versions.length > 0) {
        scheme.currentVersion = scheme.versions[scheme.versions.length - 1].version
      } else {
        scheme.currentVersion = 0
      }
      scheme.updatedAt = Date.now()
      saveSchemes()
    }
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  function generateSchemeName(): string {
    const count = schemes.value.length + 1
    return `香篆方案 ${count}`
  }

  function handleStorageChange(event: StorageEvent) {
    if (event.key === SCHEME_STORAGE_KEY) {
      loadSchemes()
    }
  }

  function init() {
    loadSchemes()
    window.addEventListener('storage', handleStorageChange)
  }

  function cleanup() {
    window.removeEventListener('storage', handleStorageChange)
  }

  return {
    schemes,
    loadSchemes,
    addScheme,
    updateScheme,
    deleteScheme,
    getScheme,
    addVersion,
    loadVersion,
    deleteVersion,
    generateId,
    generateSchemeName,
    init,
    cleanup,
  }
})
