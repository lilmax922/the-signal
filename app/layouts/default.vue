<script setup lang="ts">
import { useScrollCollapse } from '~/composables/use-scroll-collapse'

const { isCollapsed: isCategoryFilterCollapsed } = useScrollCollapse({ threshold: 10, minScrollY: 60 })
</script>

<template>
  <div class="min-h-screen bg-black lg:pt-16">
    <AppHeader />
    <div
      class="hidden lg:block sticky top-16 z-40 bg-black/80 backdrop-blur-md overflow-hidden border-b border-default transition-all duration-300 ease-out"
      :class="isCategoryFilterCollapsed ? 'max-h-0' : 'max-h-[60px]'"
    >
      <UContainer class="pt-[22px]">
        <CategoryFilter />
      </UContainer>
    </div>
    <main class="pb-14 lg:pb-0">
      <UContainer>
        <slot />
      </UContainer>
    </main>
    <MobileBottomNavbar />
  </div>
</template>
