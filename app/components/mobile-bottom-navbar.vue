<script setup lang="ts">
const navItems = [
  { icon: 'i-lucide:heart' },
  { icon: 'i-lucide:house' },
  { icon: 'i-lucide:settings' },
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
        class="flex-col h-full min-w-[64px] rounded-none items-center justify-center"
        @click="activeIndex = index"
      />
    </div>
  </nav>
</template>
