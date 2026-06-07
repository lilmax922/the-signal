<script setup lang="ts">
// DEV-AUTH-DISABLED: OAuth callback 已停用,Supabase 不再觀察登入狀態。
// 重新啟用:取消下方 /* … */ 區塊的註解,並還原 <template> 的 char-bounce 動畫。

definePageMeta({
  layout: false,
})

/*
// DEV-AUTH-DISABLED: see header comment above
const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/')
  }
}, { immediate: true })

const text = 'The Signal...'
const characters = text.split('')
*/
</script>

<template>
  <!-- DEV-AUTH-DISABLED: OAuth callback 動畫已替換為開發階段提示。 -->
  <div class="min-h-dvh bg-black flex items-center justify-center px-6">
    <div class="max-w-md text-center space-y-6">
      <div class="size-16 rounded-2xl bg-elevated/40 border border-default/50 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-wrench" class="size-7 text-muted" />
      </div>
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold text-highlighted tracking-tight">
          OAuth callback 已暫時停用
        </h1>
        <p class="text-sm text-muted leading-relaxed">
          目前處於開發階段,身份驗證流程已關閉以方便除錯。<br>
          重新啟用前請參考 <code class="font-mono text-xs text-default">context/progress-tracker.md</code> 的 re-enable checklist。
        </p>
      </div>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-elevated/40 border border-default/50 text-sm text-highlighted hover:bg-elevated/60 transition-colors"
      >
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        返回首頁
      </NuxtLink>
    </div>
  </div>
</template>
