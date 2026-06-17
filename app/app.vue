<script setup lang="ts">
const url = useRequestURL()
const route = useRoute()

const description = 'AI自動化精煉新聞內容，過濾情緒偏見與誇飾用語，呈現客觀事實。'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
})

useSeoMeta({
  title: 'The Signal',
  description,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  ogUrl: () => `${url.origin}${route.path}`,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <UApp :toaster="{ expand: false }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
