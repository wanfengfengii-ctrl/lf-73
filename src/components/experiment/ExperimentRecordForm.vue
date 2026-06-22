<script setup lang="ts">
import { ref, computed } from 'vue'
import { ClipboardList, Plus, Camera, Flame, Clock, AlertTriangle, Sparkles, FileText, Trash2, Save } from 'lucide-vue-next'
import { useExperimentStore } from '@/stores/experimentStore'
import { useEnvironmentAdaptationStore } from '@/stores/environmentAdaptationStore'
import { useDesignStore } from '@/stores/designStore'
import type { ExperimentRecord, IgnitionResult, FlameoutRecord, AshLinePhoto } from '@/types/incense'
import { IGNITION_RESULT_LABELS } from '@/types/incense'

const experimentStore = useExperimentStore()
const envStore = useEnvironmentAdaptationStore()
const designStore = useDesignStore()

const ignitionResult = ref<IgnitionResult>('full_success')
const actualBurnTime = ref<number | null>(null)
const flameoutRecords = ref<FlameoutRecord[]>([])
const ashLineQualityScore = ref<number | null>(null)
const notes = ref('')
const ashLinePhotos = ref<AshLinePhoto[]>([])

const ignitionOptions: IgnitionResult[] = ['full_success', 'partial_flameout', 'complete_failure', 'delayed_ignition']

const isRecording = computed(() => {
  const selected = experimentStore.selectedExperiment
  return selected !== null && selected.status === 'recording'
})

const theoreticalAnalysis = computed(() => {
  const adaptation = envStore.adaptationResult
  const estimatedBurnTime = designStore.analysis.estimatedBurnTime
  return {
    estimatedBurnTime,
    combustionStability: adaptation.combustionStability,
    flameoutProbability: adaptation.flameoutProbability,
    ashLineQuality: adaptation.ashLineQuality,
    burnTimeDeviation: adaptation.burnTimeDeviation,
    overallScore: adaptation.overallScore,
  }
})

function createNewExperiment() {
  const record: ExperimentRecord = {
    id: experimentStore.generateId(),
    name: experimentStore.generateExperimentName(),
    status: 'recording',
    createdAt: Date.now(),
    recipe: envStore.ingredients.map((i) => ({ ...i })),
    environment: { ...envStore.environment },
    theoreticalAnalysis: { ...theoreticalAnalysis.value },
    actualResult: {
      ignitionResult: 'full_success',
      actualBurnTime: null,
      flameoutRecords: [],
      ashLinePhotos: [],
      ashLineQualityScore: null,
      notes: '',
    },
  }
  experimentStore.addExperiment(record)
  experimentStore.selectExperiment(record.id)
  ignitionResult.value = 'full_success'
  actualBurnTime.value = null
  flameoutRecords.value = []
  ashLineQualityScore.value = null
  notes.value = ''
  ashLinePhotos.value = []
}

function addFlameoutRecord() {
  flameoutRecords.value.push({
    position: { x: 0, y: 0 },
    pathProgress: 0,
    timestamp: Date.now(),
    reason: '',
  })
}

function removeFlameoutRecord(index: number) {
  flameoutRecords.value.splice(index, 1)
}

function updateFlameoutField(index: number, field: string, value: any) {
  if (index >= 0 && index < flameoutRecords.value.length) {
    const record = flameoutRecords.value[index]
    if (field === 'positionX') {
      record.position = { ...record.position, x: Number(value) || 0 }
    } else if (field === 'positionY') {
      record.position = { ...record.position, y: Number(value) || 0 }
    } else if (field === 'pathProgress') {
      record.pathProgress = Number(value) || 0
    } else if (field === 'reason') {
      record.reason = value
    }
  }
}

function handlePhotoUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const file = target.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    ashLinePhotos.value.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      dataUrl,
      timestamp: Date.now(),
    })
  }
  reader.readAsDataURL(file)
  target.value = ''
}

function removePhoto(index: number) {
  ashLinePhotos.value.splice(index, 1)
}

function saveActualResult() {
  const selected = experimentStore.selectedExperiment
  if (!selected) return
  experimentStore.updateExperiment(selected.id, {
    actualResult: {
      ignitionResult: ignitionResult.value,
      actualBurnTime: actualBurnTime.value,
      flameoutRecords: flameoutRecords.value.map((r) => ({ ...r })),
      ashLinePhotos: ashLinePhotos.value.map((p) => ({ ...p })),
      ashLineQualityScore: ashLineQualityScore.value,
      notes: notes.value,
    },
    completedAt: Date.now(),
    status: 'completed',
  })
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-emerald-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center gap-2">
        <ClipboardList class="w-5 h-5 text-emerald-600" />
        <h3 class="font-semibold text-stone-800">实验记录</h3>
      </div>
    </div>

    <div class="p-4">
      <div v-if="!isRecording" class="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList class="w-12 h-12 text-stone-300 mb-3" />
        <p class="text-sm text-stone-500 mb-4">暂无进行中的实验</p>
        <button
          @click="createNewExperiment"
          class="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-md shadow-sm transition-all"
        >
          <Plus class="w-4 h-4" />
          开始新实验
        </button>
      </div>

      <div v-else class="space-y-4">
        <div class="p-3 rounded-lg bg-stone-50 border border-stone-100">
          <div class="flex items-center gap-1.5 mb-2">
            <Flame class="w-4 h-4 text-orange-500" />
            <span class="text-xs font-semibold text-stone-700">当前配方 & 环境</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-stone-600">
            <div v-for="item in envStore.ingredients" :key="item.name" class="flex items-center gap-1">
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-stone-400">{{ item.ratio }}%</span>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 mt-2 text-xs text-stone-600">
            <div>湿度 {{ envStore.environment.humidity }}%</div>
            <div>温度 {{ envStore.environment.temperature }}°C</div>
            <div>气流 {{ envStore.environment.airflow }}</div>
            <div>灰床 {{ envStore.environment.ashBedThickness }}mm</div>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-stone-50 border border-stone-100">
          <div class="flex items-center gap-1.5 mb-2">
            <FileText class="w-4 h-4 text-emerald-600" />
            <span class="text-xs font-semibold text-stone-700">理论分析</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="p-2 rounded-md bg-white border border-stone-100">
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <Clock class="w-3 h-3" />
                预估燃烧
              </div>
              <div class="text-sm font-bold text-stone-800">{{ theoreticalAnalysis.estimatedBurnTime.toFixed(0) }}秒</div>
            </div>
            <div class="p-2 rounded-md bg-white border border-stone-100">
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <Flame class="w-3 h-3" />
                燃烧稳定性
              </div>
              <div class="text-sm font-bold text-stone-800">{{ theoreticalAnalysis.combustionStability.toFixed(0) }}%</div>
            </div>
            <div class="p-2 rounded-md bg-white border border-stone-100">
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <AlertTriangle class="w-3 h-3" />
                断火概率
              </div>
              <div class="text-sm font-bold text-stone-800">{{ theoreticalAnalysis.flameoutProbability.toFixed(0) }}%</div>
            </div>
            <div class="p-2 rounded-md bg-white border border-stone-100">
              <div class="flex items-center gap-1 text-xs text-stone-500">
                <Sparkles class="w-3 h-3" />
                灰线质量
              </div>
              <div class="text-sm font-bold text-stone-800">{{ theoreticalAnalysis.ashLineQuality.toFixed(0) }}%</div>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <Flame class="w-4 h-4 text-amber-500" />
            <span class="text-xs font-semibold text-stone-700">点燃结果</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="option in ignitionOptions"
              :key="option"
              @click="ignitionResult = option"
              :class="[
                'px-3 py-2 rounded-md text-xs text-center cursor-pointer transition-all border',
                ignitionResult === option
                  ? 'bg-amber-50 border-amber-400 text-amber-800 font-semibold shadow-sm'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
              ]"
            >
              {{ IGNITION_RESULT_LABELS[option] }}
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <Clock class="w-4 h-4 text-blue-500" />
            <span class="text-xs font-semibold text-stone-700">实际燃烧时间</span>
          </div>
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="actualBurnTime"
              @input="(e) => actualBurnTime = Number((e.target as HTMLInputElement).value) || null"
              min="0"
              placeholder="输入实际燃烧时间"
              class="flex-1 px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <span class="text-xs text-stone-500">秒</span>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <AlertTriangle class="w-4 h-4 text-red-500" />
              <span class="text-xs font-semibold text-stone-700">断火记录</span>
            </div>
            <button
              @click="addFlameoutRecord"
              class="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-md shadow-sm transition-all"
            >
              <Plus class="w-3 h-3" />
              添加
            </button>
          </div>
          <div v-if="flameoutRecords.length === 0" class="text-xs text-stone-400 py-2 text-center">
            暂无断火记录
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(record, index) in flameoutRecords"
              :key="index"
              class="p-2.5 rounded-lg bg-stone-50 border border-stone-100"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-stone-500">断火 #{{ index + 1 }}</span>
                <button
                  @click="removeFlameoutRecord(index)"
                  class="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <label class="text-xs text-stone-500">X</label>
                  <input
                    type="number"
                    :value="record.position.x"
                    @input="(e) => updateFlameoutField(index, 'positionX', (e.target as HTMLInputElement).value)"
                    class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="text-xs text-stone-500">Y</label>
                  <input
                    type="number"
                    :value="record.position.y"
                    @input="(e) => updateFlameoutField(index, 'positionY', (e.target as HTMLInputElement).value)"
                    class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label class="text-xs text-stone-500">进度%</label>
                  <input
                    type="number"
                    :value="record.pathProgress"
                    min="0"
                    max="100"
                    @input="(e) => updateFlameoutField(index, 'pathProgress', (e.target as HTMLInputElement).value)"
                    class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                  />
                </div>
              </div>
              <input
                type="text"
                :value="record.reason"
                @input="(e) => updateFlameoutField(index, 'reason', (e.target as HTMLInputElement).value)"
                placeholder="断火原因"
                class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span class="text-xs font-semibold text-stone-700">灰线质量评分</span>
            <span v-if="ashLineQualityScore !== null" class="text-xs font-bold text-amber-700 ml-1">{{ ashLineQualityScore }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="ashLineQualityScore ?? 0"
            @input="(e) => ashLineQualityScore = Number((e.target as HTMLInputElement).value)"
            class="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div class="flex justify-between text-xs text-stone-400 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <Camera class="w-4 h-4 text-stone-500" />
            <span class="text-xs font-semibold text-stone-700">灰线照片</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <label class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 rounded-md cursor-pointer transition-colors">
              <Camera class="w-3.5 h-3.5" />
              上传照片
              <input
                type="file"
                accept="image/*"
                @change="handlePhotoUpload"
                class="hidden"
              />
            </label>
          </div>
          <div v-if="ashLinePhotos.length > 0" class="grid grid-cols-3 gap-2">
            <div
              v-for="(photo, index) in ashLinePhotos"
              :key="photo.id"
              class="relative group rounded-lg overflow-hidden border border-stone-200"
            >
              <img :src="photo.dataUrl" class="w-full h-20 object-cover" />
              <button
                @click="removePhoto(index)"
                class="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-1.5 mb-2">
            <FileText class="w-4 h-4 text-stone-500" />
            <span class="text-xs font-semibold text-stone-700">实验备注</span>
          </div>
          <textarea
            v-model="notes"
            rows="3"
            placeholder="记录实验观察与心得..."
            class="w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
          ></textarea>
        </div>

        <button
          @click="saveActualResult"
          class="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-md shadow-sm transition-all"
        >
          <Save class="w-4 h-4" />
          保存实验结果
        </button>
      </div>
    </div>
  </div>
</template>
