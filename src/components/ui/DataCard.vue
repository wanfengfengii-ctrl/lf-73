<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  subtext?: string
  highlight?: boolean
  warning?: boolean
  danger?: boolean
  icon?: Component
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
    <div class="flex items-center justify-between mb-1">
      <div class="text-xs text-stone-500">{{ label }}</div>
      <component
        v-if="icon"
        :is="icon"
        class="w-4 h-4"
        :class="{
          'text-amber-500': highlight,
          'text-yellow-500': warning,
          'text-red-500': danger,
          'text-stone-400': !highlight && !warning && !danger,
        }"
      />
    </div>
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
