<script setup lang="ts">
const { isOpen: isSearchOpen, open: openSearch } = useSearch()
const route = useRoute()

const isHome = computed(() => route.path === '/')
</script>

<template>
  <nav class="flex lg:hidden fixed bottom-0 inset-x-0 h-14 bg-black/80 backdrop-blur-md border-t border-default z-50">
    <div class="flex items-center justify-around w-full max-w-lg mx-auto">
      <UButton
        variant="ghost"
        :color="isSearchOpen ? 'primary' : 'neutral'"
        icon="i-lucide:search"
        aria-label="搜尋"
        class="flex-col h-full min-w-16 rounded-none items-center justify-center"
        @click="openSearch()"
      />
      <UButton
        to="/"
        variant="ghost"
        :color="isHome ? 'primary' : 'neutral'"
        icon="i-lucide:house"
        aria-label="首頁"
        class="flex-col h-full min-w-16 rounded-none items-center justify-center"
      />
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide:settings"
        aria-label="設定"
        disabled
        class="flex-col h-full min-w-16 rounded-none items-center justify-center"
      />
    </div>
  </nav>
</template>
