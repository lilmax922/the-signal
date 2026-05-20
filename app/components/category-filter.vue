<script setup lang="ts">
const categories = ['全部', '科技', '股市', '能源']
const selected = ref('全部')
</script>

<template>
  <div class="relative">
    <div class="flex gap-6 overflow-x-auto scrollbar-hide">
      <button
        v-for="category in categories"
        :key="category"
        class="relative shrink-0 text-xs lg:text-sm font-medium transition-colors duration-200 py-2"
        :class="selected === category ? 'text-primary' : 'text-muted hover:text-default'"
        @click="selected = category"
      >
        {{ category }}
        <span
          v-if="selected === category"
          class="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
