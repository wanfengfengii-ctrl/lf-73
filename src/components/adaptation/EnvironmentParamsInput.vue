<script setup lang="ts">
import { computed } from 'vue'
import { ThermometerSun, Droplets, Wind, Layers, RotateCcw, MapPin } from 'lucide-vue-next'
import { useEnvironmentAdaptation } from '@/composables/useEnvironmentAdaptation'
import SliderInput from '@/components/ui/SliderInput.vue'

const adaptation = useEnvironmentAdaptation()
const {
  environment,
  updateEnvironment,
  resetToDefault,
  getScenarioPresets,
  setEnvironment,
  MIN_HUMIDITY,
  MAX_HUMIDITY,
  MIN_TEMPERATURE,
  MAX_TEMPERATURE,
  MIN_AIRFLOW,
  MAX_AIRFLOW,
  MIN_ASH_BED_THICKNESS,
  MAX_ASH_BED_THICKNESS,
  OPTIMAL_HUMIDITY_MIN,
  OPTIMAL_HUMIDITY_MAX,
  OPTIMAL_TEMPERATURE_MIN,
  OPTIMAL_TEMPERATURE_MAX,
  OPTIMAL_AIRFLOW_MAX,
  OPTIMAL_ASH_BED_MIN,
  OPTIMAL_ASH_BED_MAX,
} = adaptation

const presets = computed(() => getScenarioPresets())

const isHumidityOptimal = computed(
  () =>
    environment.value.humidity >= OPTIMAL_HUMIDITY_MIN &&
    environment.value.humidity <= OPTIMAL_HUMIDITY_MAX
)
const isTemperatureOptimal = computed(
  () =>
    environment.value.temperature >= OPTIMAL_TEMPERATURE_MIN &&
    environment.value.temperature <= OPTIMAL_TEMPERATURE_MAX
)
const isAirflowOptimal = computed(() => environment.value.airflow <= OPTIMAL_AIRFLOW_MAX)
const isAshBedOptimal = computed(
  () =>
    environment.value.ashBedThickness >= OPTIMAL_ASH_BED_MIN &&
    environment.value.ashBedThickness <= OPTIMAL_ASH_BED_MAX
)

const airflowLabels = ['无风', '微风', '轻风', '中风', '强风', '疾风']
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
    <div class="px-4 py-3 bg-gradient-to-r from-sky-50 to-stone-50 border-b border-stone-100">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ThermometerSun class="w-5 h-5 text-sky-600" />
          <h3 class="font-semibold text-stone-800">环境参数</h3>
        </div>
        <button
          @click="resetToDefault()"
          class="flex items-center gap-1 px-2 py-1 text-xs text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          重置
        </button>
      </div>
    </div>

    <div class="p-4 space-y-4">
      <div class="p-3 rounded-lg border" :class="isHumidityOptimal ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'">
        <SliderInput
          :model-value="environment.humidity"
          @update:model-value="(v) => updateEnvironment({ humidity: v })"
          :min="MIN_HUMIDITY"
          :max="MAX_HUMIDITY"
          label="室内湿度"
          unit="%"
        />
        <div class="mt-1 text-xs text-stone-500">
          最佳范围: {{ OPTIMAL_HUMIDITY_MIN }}-{{ OPTIMAL_HUMIDITY_MAX }}%
        </div>
      </div>

      <div class="p-3 rounded-lg border" :class="isTemperatureOptimal ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'">
        <SliderInput
          :model-value="environment.temperature"
          @update:model-value="(v) => updateEnvironment({ temperature: v })"
          :min="MIN_TEMPERATURE"
          :max="MAX_TEMPERATURE"
          label="室内温度"
          unit="°C"
        />
        <div class="mt-1 text-xs text-stone-500">
          最佳范围: {{ OPTIMAL_TEMPERATURE_MIN }}-{{ OPTIMAL_TEMPERATURE_MAX }}°C
        </div>
      </div>

      <div class="p-3 rounded-lg border" :class="isAirflowOptimal ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'">
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-stone-700">空气流动</label>
            <span class="text-sm font-semibold text-amber-800">
              {{ airflowLabels[environment.airflow] }}
            </span>
          </div>
          <input
            type="range"
            :min="MIN_AIRFLOW"
            :max="MAX_AIRFLOW"
            :value="environment.airflow"
            @input="(e) => updateEnvironment({ airflow: parseFloat((e.target as HTMLInputElement).value) })"
            class="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
          />
          <div class="grid grid-cols-6 gap-1 text-xs text-stone-400">
            <span v-for="(label, i) in airflowLabels" :key="i" class="text-center">
              {{ label }}
            </span>
          </div>
        </div>
        <div class="mt-1 text-xs text-stone-500">
          最佳: ≤{{ OPTIMAL_AIRFLOW_MAX }} 级
        </div>
      </div>

      <div class="p-3 rounded-lg border" :class="isAshBedOptimal ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'">
        <SliderInput
          :model-value="environment.ashBedThickness"
          @update:model-value="(v) => updateEnvironment({ ashBedThickness: v })"
          :min="MIN_ASH_BED_THICKNESS"
          :max="MAX_ASH_BED_THICKNESS"
          label="灰床厚度"
          unit="mm"
        />
        <div class="mt-1 text-xs text-stone-500">
          最佳范围: {{ OPTIMAL_ASH_BED_MIN }}-{{ OPTIMAL_ASH_BED_MAX }}mm
        </div>
      </div>
    </div>

    <div class="px-4 py-3 bg-stone-50 border-t border-stone-100">
      <div class="flex items-center gap-1.5 mb-2 text-xs font-medium text-stone-600">
        <MapPin class="w-3.5 h-3.5" />
        快速场景
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="preset in presets"
          :key="preset.name"
          @click="setEnvironment(preset.params)"
          class="px-2 py-1.5 text-xs text-stone-600 bg-white hover:bg-amber-50 hover:text-amber-700 border border-stone-200 hover:border-amber-300 rounded-md transition-colors truncate"
          :title="preset.description"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>
  </div>
</template>
