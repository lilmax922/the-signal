import type { Signal } from '#shared/validators/signal'

export function useSignalMeta(signal: ComputedRef<Signal | null>) {
  const url = useRequestURL()

  const title = computed(() => signal.value ? `${signal.value.titleZh} - The Signal` : undefined)
  const description = computed(() => signal.value?.summaryZh[0])
  const ogImage = computed(() => signal.value?.imageUrl)
  const ogUrl = computed(() => signal.value ? `${url.origin}/signal/${signal.value.slug}` : undefined)

  useSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage,
    ogUrl,
  })
}
