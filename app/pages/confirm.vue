<script setup lang="ts">
definePageMeta({
  layout: false,
})

const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/')
  }
}, { immediate: true })

const text = 'The Signal...'
const characters = text.split('')
</script>

<template>
  <div class="min-h-dvh bg-black flex items-center justify-center">
    <div class="flex" aria-label="Loading confirmation">
      <span
        v-for="(char, i) in characters"
        :key="i"
        class="confirm-char text-2xl font-medium text-highlighted"
        :class="char === ' ' ? 'w-2' : ''"
        :style="{ animationDelay: `${i * 0.08}s` }"
      >
        {{ char === ' ' ? '\u00A0' : char }}
      </span>
    </div>
  </div>
</template>

<style scoped>
@keyframes char-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.confirm-char {
  display: inline-block;
  animation: char-bounce 1.2s ease-in-out infinite;
}
</style>
