<script setup lang="ts">
// DEV-AUTH-DISABLED: 登入頁 OAuth 流程已停用。
// 重新啟用:取消下方 /* … */ 區塊的註解,並還原 <template> 的登入表單內容。

definePageMeta({
  layout: false,
})

/*
// DEV-AUTH-DISABLED: see header comment above
const supabase = useSupabaseClient()
const loading = ref(false)
const errorMessage = ref<string | null>(null)

async function signInWithOAuth(provider: 'github' | 'google'): Promise<void> {
  loading.value = true
  errorMessage.value = null

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/confirm`,
    },
  })

  if (error) {
    errorMessage.value = error.message
    loading.value = false
  }
}

const features = [
  {
    icon: 'i-lucide-sparkles',
    title: '情緒過濾',
    description: 'AI 去除情緒化內容與誇大敘述',
  },
  {
    icon: 'i-lucide-layout',
    title: '舒適瀏覽',
    description: '無需跳頁,輕鬆掌握所有資訊',
  },
  {
    icon: 'i-lucide-zap',
    title: '純淨資訊',
    description: '只留事實數據,移除臆測與干擾',
  },
]

const providers = [
  {
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => signInWithOAuth('google'),
  },
  {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => signInWithOAuth('github'),
  },
]
*/
</script>

<template>
  <!-- DEV-AUTH-DISABLED: 登入表單已替換為開發階段提示。 -->
  <div class="min-h-dvh bg-black flex items-center justify-center px-6">
    <div class="max-w-md text-center space-y-6">
      <div class="size-16 rounded-2xl bg-elevated/40 border border-default/50 flex items-center justify-center mx-auto">
        <UIcon name="i-lucide-wrench" class="size-7 text-muted" />
      </div>
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold text-highlighted tracking-tight">
          登入功能已暫時停用
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
