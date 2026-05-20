<script setup lang="ts">
const navItems = [
  { icon: 'i-lucide:heart', label: 'Favorites' },
  { icon: 'i-lucide:house', label: 'Home' },
  { icon: 'i-lucide:settings', label: 'Settings' },
]

const activeIndex = ref(0)
</script>

<template>
  <nav class="flex lg:hidden fixed bottom-0 inset-x-0 h-14 bg-black border-t border-default z-50">
    <div class="flex items-center justify-around w-full max-w-lg mx-auto">
      <UButton
        v-for="(item, index) in navItems"
        :key="index"
        variant="ghost"
        :color="activeIndex === index ? 'primary' : 'neutral'"
        :icon="item.icon"
        :aria-label="item.label"
        class="flex-col h-full min-w-16 rounded-none items-center justify-center"
        @click="activeIndex = index"
      />
    </div>
  </nav>
</template>
