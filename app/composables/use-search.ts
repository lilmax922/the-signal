import type { SignalFeed } from '#shared/validators/signal'
import { createGlobalState, refDebounced } from '@vueuse/core'

export const useSearch = createGlobalState(() => {
  const router = useRouter()
  const route = useRoute()

  const isOpen = ref(false)
  function open() {
    isOpen.value = true
  }
  function close() {
    isOpen.value = false
  }
  function toggle() {
    isOpen.value = !isOpen.value
  }

  const searchTerm = ref('')
  const debouncedSearchTerm = refDebounced(searchTerm, 300)

  const hasSearched = ref(false)

  const { data, status, execute } = useLazyFetch('/api/signals/search', {
    query: { q: debouncedSearchTerm, limit: 15 },
    immediate: false,
    watch: false,
  })

  const isLoading = computed(() => status.value === 'pending')
  const isError = computed(() => status.value === 'error')
  const hasFetched = computed(() => status.value === 'success' || status.value === 'error')

  watch(debouncedSearchTerm, (val) => {
    if (val?.trim()) {
      hasSearched.value = true
      execute()
    }
    else {
      data.value = undefined
      hasSearched.value = false
    }
  })

  const searchResults = computed<SignalFeed[]>(() =>
    Array.isArray(data.value) ? data.value : [],
  )

  const hasResults = computed(() => searchResults.value.length > 0)

  const groups = computed(() => {
    const byCategory = new Map<string, SignalFeed[]>()
    for (const s of searchResults.value) {
      const list = byCategory.get(s.category) ?? []
      list.push(s)
      byCategory.set(s.category, list)
    }
    return [...byCategory.entries()].map(([cat, signals]) => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      ignoreFilter: true,
      items: signals.map(s => ({
        ...s,
        label: s.titleZh,
        onSelect: () => selectResult(s),
      })),
    }))
  })

  function selectResult(signal: SignalFeed) {
    router.push({ query: { ...route.query, signal: signal.slug } })
    close()
  }

  function reset() {
    searchTerm.value = ''
    data.value = undefined
    hasSearched.value = false
  }

  return {
    isOpen,
    open,
    close,
    toggle,

    searchTerm,

    isLoading: readonly(isLoading),
    isError: readonly(isError),
    hasFetched: readonly(hasFetched),
    hasSearched: readonly(hasSearched),
    hasResults: readonly(hasResults),
    searchResults: readonly(searchResults),
    groups,

    selectResult,
    reset,
  }
})
