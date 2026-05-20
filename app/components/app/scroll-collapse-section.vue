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
    class="overflow-hidden border-b border-default transition-all duration-300 ease-out"
    :class="isCollapsed ? 'max-h-0' : `max-h-[${maxHeight}]`"
  >
    <slot />
  </div>
</template>
