<script setup lang="ts">
defineProps<{
  label: string
  value: string
  subtext?: string
  highlight?: boolean
  warning?: boolean
  danger?: boolean
}>()
</script>

<template>
  <div
    class="p-4 rounded-xl bg-white shadow-sm border border-stone-100 transition-all hover:shadow-md"
    :class="{
      'border-amber-200 bg-amber-50': highlight,
      'border-yellow-200 bg-yellow-50': warning,
      'border-red-200 bg-red-50': danger,
    }"
  >
    <div class="text-xs text-stone-500 mb-1">{{ label }}</div>
    <div
      class="text-xl font-bold"
      :class="{
        'text-amber-800': highlight,
        'text-yellow-700': warning,
        'text-red-700': danger,
        'text-stone-800': !highlight && !warning && !danger,
      }"
    >
      {{ value }}
    </div>
    <div v-if="subtext" class="text-xs text-stone-400 mt-1">{{ subtext }}</div>
  </div>
</template>
