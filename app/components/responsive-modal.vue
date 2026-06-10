<script setup lang="ts">
import { createReusableTemplate, useMediaQuery } from '@vueuse/core'

const props = defineProps<{
  modalUi?: Record<string, any>
  drawerUi?: Record<string, any>
}>()

const [DefineContentTemplate, ReuseContentTemplate] = createReusableTemplate()

const isOpen = defineModel<boolean>('open', { default: false })

const isDesktop = useMediaQuery('(min-width: 768px)')
</script>

<template>
  <ClientOnly>
    <DefineContentTemplate>
      <slot />
    </DefineContentTemplate>

    <UModal
      v-if="isDesktop"
      v-model:open="isOpen"
      :ui="props.modalUi"
    >
      <template #content>
        <ReuseContentTemplate />
      </template>
    </UModal>

    <UDrawer
      v-else
      v-model:open="isOpen"
      :ui="props.drawerUi"
    >
      <template #content>
        <ReuseContentTemplate />
      </template>
    </UDrawer>
  </ClientOnly>
</template>
