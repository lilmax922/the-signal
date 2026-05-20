<script setup lang="ts">
import type { UseScrollCollapseOptions } from '~/composables/use-scroll-collapse'
import { useScrollCollapse } from '~/composables/use-scroll-collapse'

const props = withDefaults(defineProps<{
  options?: UseScrollCollapseOptions
  maxHeight?: string
}>(), {
  maxHeight: '80px',
})

const { isCollapsed } = useScrollCollapse(props.options)
</script>

<template>
  <div
    class="overflow-hidden border-b border-default transition-[max-height] duration-300 ease-out"
    :style="{ maxHeight: isCollapsed ? '0px' : maxHeight }"
  >
    <slot />
  </div>
</template>
