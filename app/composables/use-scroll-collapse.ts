import { useWindowScroll } from '@vueuse/core'

export type UseScrollCollapseOptions = {
  threshold?: number
  minScrollY?: number
}

export function useScrollCollapse(options: UseScrollCollapseOptions = {}) {
  const { threshold = 10, minScrollY = 60 } = options

  const { y: scrollY } = useWindowScroll()
  const isCollapsed = ref(false)
  const lastScrollY = ref(0)

  watch(
    () => scrollY.value,
    (newY) => {
      const delta = newY - lastScrollY.value

      if (delta > threshold && newY > minScrollY) {
        isCollapsed.value = true
      }
      else if (delta < -threshold) {
        isCollapsed.value = false
      }

      lastScrollY.value = newY
    },
    { immediate: true },
  )

  return {
    scrollY,
    isCollapsed,
  }
}
