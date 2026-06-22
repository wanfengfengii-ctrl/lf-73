import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExperimentRecord, ExperimentReview } from '@/types/incense'
import { EXPERIMENT_STORAGE_KEY } from '@/utils/constants'

export const useExperimentStore = defineStore('experiment', () => {
  const experiments = ref<ExperimentRecord[]>([])
  const selectedExperimentId = ref<string | null>(null)

  const selectedExperiment = computed(() => {
    return experiments.value.find((e) => e.id === selectedExperimentId.value) ?? null
  })

  const completedExperiments = computed(() => {
    return experiments.value.filter((e) => e.status !== 'draft')
  })

  const reviewedExperiments = computed(() => {
    return experiments.value.filter((e) => e.status === 'reviewed')
  })

  function loadExperiments() {
    try {
      const stored = localStorage.getItem(EXPERIMENT_STORAGE_KEY)
      if (stored) {
        experiments.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load experiments:', e)
      experiments.value = []
    }
  }

  function saveExperiments() {
    try {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(experiments.value))
    } catch (e) {
      console.error('Failed to save experiments:', e)
    }
  }

  function addExperiment(record: ExperimentRecord) {
    experiments.value.unshift(record)
    saveExperiments()
  }

  function updateExperiment(id: string, partial: Partial<ExperimentRecord>) {
    const index = experiments.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      experiments.value[index] = { ...experiments.value[index], ...partial }
      saveExperiments()
    }
  }

  function deleteExperiment(id: string) {
    experiments.value = experiments.value.filter((e) => e.id !== id)
    if (selectedExperimentId.value === id) {
      selectedExperimentId.value = null
    }
    saveExperiments()
  }

  function getExperiment(id: string): ExperimentRecord | undefined {
    return experiments.value.find((e) => e.id === id)
  }

  function selectExperiment(id: string | null) {
    selectedExperimentId.value = id
  }

  function addReview(experimentId: string, review: ExperimentReview) {
    const experiment = experiments.value.find((e) => e.id === experimentId)
    if (experiment) {
      experiment.review = review
      experiment.status = 'reviewed'
      saveExperiments()
    }
  }

  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  function generateExperimentName(): string {
    const count = experiments.value.length + 1
    return `实验记录 ${count}`
  }

  function handleStorageChange(event: StorageEvent) {
    if (event.key === EXPERIMENT_STORAGE_KEY) {
      loadExperiments()
    }
  }

  function init() {
    loadExperiments()
    window.addEventListener('storage', handleStorageChange)
  }

  function cleanup() {
    window.removeEventListener('storage', handleStorageChange)
  }

  return {
    experiments,
    selectedExperimentId,
    selectedExperiment,
    completedExperiments,
    reviewedExperiments,
    loadExperiments,
    saveExperiments,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    getExperiment,
    selectExperiment,
    addReview,
    generateId,
    generateExperimentName,
    init,
    cleanup,
  }
})
