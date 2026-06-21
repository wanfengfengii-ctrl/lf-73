<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
  step?: number
  label: string
  unit?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const displayValue = computed(() => {
  const step = props.step || 1
  if (step < 1) {
    return props.modelValue.toFixed(1)
  }
  return Math.round(props.modelValue).toString()
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', parseFloat(target.value))
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-stone-700">{{ label }}</label>
      <span class="text-sm font-semibold text-amber-800">
        {{ displayValue }}<span v-if="unit" class="text-xs text-stone-500 ml-0.5">{{ unit }}</span>
      </span>
    </div>
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step || 1"
      :value="modelValue"
      :disabled="disabled"
      @input="handleInput"
      class="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
    />
    <div class="flex justify-between text-xs text-stone-400">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
  </div>
</template>
