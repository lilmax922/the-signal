import type { Category } from '#shared/validators/signal'
import { categorySchema } from '#shared/validators/signal'

export function useCurrentCategory() {
  const route = useRoute()

  return computed<Category | undefined>(() => {
    const c = route.params.category
    const candidate = typeof c === 'string' && c !== ''
      ? c
      : (typeof route.params.slug === 'string' ? route.params.slug : undefined)

    if (candidate === undefined || candidate === '')
      return undefined

    const parsed = categorySchema.safeParse(candidate)
    return parsed.success ? parsed.data : undefined
  })
}
