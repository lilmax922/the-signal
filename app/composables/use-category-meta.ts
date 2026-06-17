import type { Category } from '#shared/validators/signal'

const categoryLabels: Record<Category, string> = {
  tech: '科技',
  finance: '股市',
  world: '國際',
}

const defaultDescription = 'AI自動化精煉新聞內容，過濾情緒偏見與誇飾用語，呈現客觀事實。'

export function useCategoryMeta() {
  const currentCategory = useCurrentCategory()

  const title = computed(() => {
    if (!currentCategory.value)
      return 'The Signal'

    return `${categoryLabels[currentCategory.value]} - The Signal`
  })

  useSeoMeta({
    title,
    ogTitle: title,
    description: () => defaultDescription,
    ogDescription: () => defaultDescription,
  })
}
