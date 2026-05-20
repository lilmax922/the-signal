<script setup lang="ts">
import { useScrollCollapse } from '~/composables/use-scroll-collapse'

const userMenuItems = [
  [{
    label: '收藏',
    icon: 'i-lucide:bookmark',
  }, {
    label: '設定',
    icon: 'i-lucide:settings',
  }, {
    label: '登出',
    icon: 'i-lucide:log-out',
  }],
]

const { isCollapsed: isMobileHeaderCollapsed } = useScrollCollapse({ threshold: 10, minScrollY: 60 })
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md border-b border-default"
  >
    <div class="h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 justify-center lg:justify-normal">
        <span class="text-base lg:text-lg font-semibold text-highlighted">The Signal</span>
      </div>

      <div class="hidden lg:flex flex-1 max-w-xl justify-center">
        <div class="relative w-full max-w-md">
          <UInput
            leading-icon="i-lucide:search"
            placeholder="Search"
            size="lg"
            variant="outline"
            class="w-full"
          />
          <UKbd class="absolute inset-e-2 top-1/2 -translate-y-1/2" size="sm">
            <span class="text-xs">⌘K</span>
          </UKbd>
        </div>
      </div>

      <div class="hidden lg:flex items-center">
        <UDropdownMenu :items="userMenuItems">
          <UButton variant="ghost" color="neutral">
            <UAvatar icon="i-lucide:user" size="sm" />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>

    <div
      class="lg:hidden overflow-hidden border-t border-default transition-all duration-300 ease-out"
      :class="isMobileHeaderCollapsed ? 'max-h-0' : 'max-h-30'"
    >
      <div class="px-4 pt-3">
        <div class="relative">
          <UInput
            leading-icon="i-lucide:search"
            placeholder="Search"
            size="md"
            variant="outline"
            class="w-full"
          />
        </div>
      </div>
      <div class="px-4 pb-3">
        <CategoryFilter />
      </div>
    </div>
  </header>

  <div
    class="lg:hidden transition-[height] duration-300 ease-out"
    :class="isMobileHeaderCollapsed ? 'h-16' : 'h-46'"
  />
</template>
