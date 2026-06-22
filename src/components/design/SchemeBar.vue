<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Save, Trash2, Plus, FileText, History, GitBranch, Clock, Ruler, X } from 'lucide-vue-next'
import { useDesignStore } from '@/stores/designStore'
import { useSchemeStore } from '@/stores/schemeStore'
import type { IncenseScheme } from '@/types/incense'
import { PIXELS_PER_CM } from '@/utils/constants'

const store = useDesignStore()
const schemeStore = useSchemeStore()
const { schemes, addScheme, deleteScheme, generateId, generateSchemeName, loadSchemes, addVersion, loadVersion, deleteVersion, init, cleanup } = schemeStore

const schemeName = ref('')
const versionDescription = ref('')
const showVersionModal = ref(false)
const selectedScheme = ref<IncenseScheme | null>(null)

const canSave = computed(() => {
  return store.analysis.isValid && store.allPoints.length > 1
})

const canSaveVersion = computed(() => {
  return store.analysis.isValid && store.allPoints.length > 1
})

function handleSave() {
  if (!canSave.value) return

  const name = schemeName.value.trim() || generateSchemeName()
  const thumbnail = store.generateThumbnail()

  const firstVersion = store.createVersion('初始版本')

  const scheme: IncenseScheme = {
    id: generateId(),
    name,
    path: JSON.parse(JSON.stringify(store.currentPath)),
    analysis: JSON.parse(JSON.stringify(store.analysis)),
    thumbnail,
    versions: [firstVersion],
    currentVersion: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  addScheme(scheme)
  schemeName.value = ''
}

function handleSaveVersion() {
  if (!canSaveVersion.value || !selectedScheme.value) return

  const newVersion = store.createVersion(versionDescription.value.trim() || undefined)
  addVersion(selectedScheme.value.id, newVersion)
  versionDescription.value = ''
}

function handleLoad(scheme: IncenseScheme) {
  store.loadScheme(scheme)
  selectedScheme.value = scheme
}

function handleLoadVersion(schemeId: string, versionId: string) {
  const version = loadVersion(schemeId, versionId)
  if (version) {
    store.loadVersion(version)
  }
}

function handleDelete(scheme: IncenseScheme, event: Event) {
  event.stopPropagation()
  if (confirm(`确定要删除「${scheme.name}」吗？`)) {
    deleteScheme(scheme.id)
    if (selectedScheme.value?.id === scheme.id) {
      selectedScheme.value = null
      showVersionModal.value = false
    }
  }
}

function handleDeleteVersion(schemeId: string, versionId: string, event: Event) {
  event.stopPropagation()
  if (confirm('确定要删除这个版本吗？')) {
    deleteVersion(schemeId, versionId)
  }
}

function openVersionModal(scheme: IncenseScheme, event: Event) {
  event.stopPropagation()
  selectedScheme.value = scheme
  showVersionModal.value = true
}

function closeVersionModal() {
  showVersionModal.value = false
  selectedScheme.value = null
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '—'
  const minutes = seconds / 60
  if (minutes < 60) {
    return minutes.toFixed(1) + '分'
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return hours + '时' + remainingMinutes + '分'
}

function formatLength(px: number): string {
  const cm = px / PIXELS_PER_CM
  if (cm >= 100) {
    return (cm / 100).toFixed(2) + 'm'
  }
  return cm.toFixed(1) + 'cm'
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (schemeStore.schemes.length === 0) {
    init()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-4 border border-stone-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-stone-800 flex items-center gap-2">
        <span class="w-1 h-4 bg-amber-600 rounded-full"></span>
        我的方案
        <span class="text-xs font-normal text-stone-400">({{ schemes.length }})</span>
      </h3>
      
      <div class="flex items-center gap-2">
        <input
          v-model="schemeName"
          type="text"
          placeholder="方案名称"
          class="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-40"
        />
        <button
          @click="handleSave"
          :disabled="!canSave"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
          :class="{
            'bg-amber-600 text-white hover:bg-amber-700': canSave,
            'bg-stone-200 text-stone-400 cursor-not-allowed': !canSave,
          }"
        >
          <Save class="w-4 h-4" />
          保存方案
        </button>
      </div>
    </div>

    <div class="relative">
      <div
        v-if="schemes.length === 0"
        class="flex flex-col items-center justify-center py-8 text-stone-400"
      >
        <FileText class="w-10 h-10 mb-2 opacity-50" />
        <p class="text-sm">暂无保存的方案</p>
        <p class="text-xs mt-1">设计完成后点击上方按钮保存</p>
      </div>

      <div v-else class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        <div
          v-for="scheme in schemes"
          :key="scheme.id"
          @click="handleLoad(scheme)"
          class="flex-shrink-0 w-52 rounded-xl border-2 bg-stone-50 cursor-pointer transition-all hover:border-amber-400 hover:bg-amber-50 group overflow-hidden"
          :class="{
            'border-amber-500 bg-amber-50': selectedScheme?.id === scheme.id,
            'border-stone-200': selectedScheme?.id !== scheme.id,
          }"
        >
          <div class="relative h-32 bg-stone-100 overflow-hidden">
            <img
              v-if="scheme.thumbnail"
              :src="scheme.thumbnail"
              :alt="scheme.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-stone-300"
            >
              <FileText class="w-12 h-12" />
            </div>
            
            <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openVersionModal(scheme, $event)"
                class="p-1.5 rounded-lg bg-white/90 text-stone-600 hover:bg-white hover:text-amber-600 shadow-sm transition-all"
                title="版本历史"
              >
                <History class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(scheme, $event)"
                class="p-1.5 rounded-lg bg-white/90 text-stone-400 hover:bg-white hover:text-red-500 shadow-sm transition-all"
                title="删除方案"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <div
              v-if="scheme.versions.length > 0"
              class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded-full flex items-center gap-1"
            >
              <GitBranch class="w-3 h-3" />
              v{{ scheme.currentVersion }}
            </div>
          </div>
          
          <div class="p-3">
            <div class="flex items-start justify-between mb-2">
              <h4 class="text-sm font-medium text-stone-800 truncate flex-1">
                {{ scheme.name }}
              </h4>
            </div>
            
            <div class="flex justify-between text-xs text-stone-500 mb-2">
              <span class="flex items-center gap-1">
                <Ruler class="w-3 h-3" />
                {{ formatLength(scheme.analysis.totalLength) }}
              </span>
              <span class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatTime(scheme.analysis.estimatedBurnTime) }}
              </span>
            </div>
            
            <div class="flex items-center gap-1 flex-wrap">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :class="scheme.analysis.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ scheme.analysis.isValid ? '有效' : '无效' }}
              </span>
              <span v-if="scheme.analysis.intersectionCount > 0" class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                {{ scheme.analysis.intersectionCount }} 交叉
              </span>
              <span v-if="scheme.analysis.overlaps.length > 0" class="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {{ scheme.analysis.overlaps.length }} 重叠
              </span>
            </div>

            <p class="text-xs text-stone-400 mt-2">
              更新于 {{ formatDate(scheme.updatedAt) }}
            </p>
          </div>
        </div>

        <div
          class="flex-shrink-0 w-52 p-3 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:border-amber-400 hover:text-amber-500 transition-all"
          @click="store.reset()"
        >
          <Plus class="w-8 h-8 mb-2" />
          <span class="text-sm font-medium">新建方案</span>
          <span class="text-xs mt-1">清空画布重新开始</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showVersionModal && selectedScheme"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="closeVersionModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-stone-100">
            <div>
              <h3 class="text-lg font-semibold text-stone-800 flex items-center gap-2">
                <History class="w-5 h-5 text-amber-600" />
                版本历史
              </h3>
              <p class="text-sm text-stone-500 mt-0.5">{{ selectedScheme.name }}</p>
            </div>
            <button
              @click="closeVersionModal"
              class="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-4 border-b border-stone-100 bg-stone-50">
            <h4 class="text-sm font-medium text-stone-700 mb-3">保存新版本</h4>
            <div class="flex gap-2">
              <input
                v-model="versionDescription"
                type="text"
                placeholder="版本描述（可选）"
                class="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                @click="handleSaveVersion"
                :disabled="!canSaveVersion"
                class="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                :class="{
                  'bg-amber-600 text-white hover:bg-amber-700': canSaveVersion,
                  'bg-stone-200 text-stone-400 cursor-not-allowed': !canSaveVersion,
                }"
              >
                保存版本
              </button>
            </div>
          </div>

          <div class="p-4 overflow-y-auto max-h-96">
            <div v-if="selectedScheme.versions.length === 0" class="text-center py-8 text-stone-400">
              <GitBranch class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p class="text-sm">暂无版本历史</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="version in [...selectedScheme.versions].reverse()"
                :key="version.id"
                class="flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md"
                :class="{
                  'border-amber-200 bg-amber-50': version.version === selectedScheme.currentVersion,
                  'border-stone-100 bg-white': version.version !== selectedScheme.currentVersion,
                }"
              >
                <div class="relative flex-shrink-0">
                  <img
                    v-if="version.thumbnail"
                    :src="version.thumbnail"
                    alt="缩略图"
                    class="w-20 h-20 rounded-lg object-cover border border-stone-200"
                  />
                  <div
                    v-else
                    class="w-20 h-20 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300 border border-stone-200"
                  >
                    <FileText class="w-8 h-8" />
                  </div>
                  <div
                    v-if="version.version === selectedScheme.currentVersion"
                    class="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  >
                    ✓
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-semibold text-stone-800">版本 {{ version.version }}</span>
                    <span
                      v-if="version.version === selectedScheme.currentVersion"
                      class="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full"
                    >
                      当前
                    </span>
                  </div>
                  <p v-if="version.description" class="text-sm text-stone-600 mb-2">
                    {{ version.description }}
                  </p>
                  <div class="flex items-center gap-4 text-xs text-stone-500">
                    <span class="flex items-center gap-1">
                      <Ruler class="w-3 h-3" />
                      {{ formatLength(version.analysis.totalLength) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ formatTime(version.analysis.estimatedBurnTime) }}
                    </span>
                  </div>
                  <p class="text-xs text-stone-400 mt-1">
                    {{ formatDate(version.createdAt) }}
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <button
                    @click="handleLoadVersion(selectedScheme.id, version.id)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                    :disabled="version.version === selectedScheme.currentVersion"
                    :class="{ 'opacity-50 cursor-not-allowed': version.version === selectedScheme.currentVersion }"
                  >
                    加载此版本
                  </button>
                  <button
                    v-if="selectedScheme.versions.length > 1"
                    @click="handleDeleteVersion(selectedScheme.id, version.id, $event)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
