# Objective

Add dynamic meta tags (title, description, ogTitle, ogImage, ogUrl) based on user navigation state. The homepage shows "The Signal" with a default description. Category pages show "{categoryLabel} - The Signal" with the same default description. Signal detail views (overlay and standalone page) show "{signal.titleZh} - The Signal" with the signal's first summary point as description, the signal's imageUrl as ogImage, and the canonical `/signal/{slug}` URL as ogUrl.

# Implementation

## Step 1 — Create `use-current-category` composable

Extract duplicated category derivation logic into a reusable composable.

- Location: `app/composables/use-current-category.ts`
- Import `categorySchema` from `#shared/validators/signal`
- Export a function `useCurrentCategory()` that:
  - Reads `useRoute()` to access route params
  - Returns a `ComputedRef<Category | undefined>` derived from `route.params.category` or `route.params.slug` (same dual-param derivation as the feed page)
  - Validates the candidate against `categorySchema`

## Step 2 — Create `use-category-meta` composable

Create a composable that sets SEO meta tags based on the current route's category parameter.

- Location: `app/composables/use-category-meta.ts`
- Define a `categoryLabels` record mapping `Category` slugs to Chinese display names (`tech → '科技'`, `finance → '股市'`, `world → '國際'`)
- Define `defaultDescription` constant: `'AI自動化精煉新聞內容，過濾情緒偏見與誇飾用語，呈現客觀事實。'`
- Export a function `useCategoryMeta()` that:
  - Calls `useCurrentCategory()` to get the current category
  - Computes the title: returns `'The Signal'` when no category, otherwise `'{categoryLabel} - The Signal'`
  - Calls `useSeoMeta()` with reactive `title`, `ogTitle`, `description`, and `ogDescription`

## Step 3 — Create `use-signal-meta` composable

Create a composable that sets SEO meta tags from a reactive signal reference.

- Location: `app/composables/use-signal-meta.ts`
- Accept a `ComputedRef<Signal | null>` parameter
- Call `useRequestURL()` to get the origin for canonical URL
- Compute `title` as `'{signal.titleZh} - The Signal'` when signal exists, `undefined` otherwise
- Compute `description` as `signal.summaryZh[0]`
- Compute `ogImage` as `signal.imageUrl`
- Compute `ogUrl` as `'{origin}/signal/{signal.slug}'` (canonical URL, not the current page URL)
- Call `useSeoMeta()` with reactive `title`, `ogTitle`, `description`, `ogDescription`, `ogImage`, and `ogUrl`

## Step 4 — Update `app.vue`

Replace the `titleTemplate` with a static title to avoid double-suffix issues.

- Remove `titleTemplate: title => title ? '%s - The Signal' : 'The Signal'`
- Set `title: 'The Signal'` directly in `useSeoMeta()`
- Keep `description`, `ogDescription`, `ogImage`, `ogUrl`, and `twitterCard` unchanged

## Step 5 — Update `[[category]].vue`

Add the category meta composable to the feed page.

- Import and call `useCategoryMeta()` at the top of `<script setup>`
- Use `useCurrentCategory()` for the feed query (replaces inline category derivation)
- This sets the category-specific title (e.g., "科技 - The Signal") or falls back to "The Signal" for the homepage

## Step 6 — Update `signal/[slug].vue`

Fix the reactivity bug and use the signal meta composable.

- Replace the non-reactive `const title = signal.value?.titleZh` with a computed: `const signalMeta = computed<Signal | null>(() => signal.value ?? null)`
- Call `useSignalMeta(signalMeta)` instead of the manual `useSeoMeta()` call
- This ensures meta tags update when the async data loads

## Step 7 — Update `signal-detail-overlay.vue`

Add signal meta composable to the overlay component.

- After the `useAsyncData` call, create a computed: `const signalMeta = computed<Signal | null>(() => signal.value ?? null)`
- Call `useSignalMeta(signalMeta)` to set meta tags when the overlay displays a signal

## Step 8 — Update `category-filter.vue`

Use the shared composable for category derivation.

- Replace inline category derivation with `useCurrentCategory()`
- Map the result to `string | null` for compatibility with the categories array

# Out of Scope

- Changing the `signal-card.vue` or `signal-feed.vue` components
- Modifying the API endpoints
- Adding structured data (JSON-LD) or other SEO enhancements beyond basic meta tags
- Changing the layout or header components

# Check When Done

- Homepage (`/`) title is "The Signal", ogTitle is "The Signal"
- Category page (`/tech`) title is "科技 - The Signal", ogTitle is "科技 - The Signal"
- Category page (`/finance`) title is "股市 - The Signal", ogTitle is "股市 - The Signal"
- Category page (`/world`) title is "國際 - The Signal", ogTitle is "國際 - The Signal"
- Signal overlay (`/?signal=xxx`) title is "{signal.titleZh} - The Signal" with correct description, ogImage, and ogUrl (`/signal/{slug}`)
- Signal page (`/signal/xxx`) title is "{signal.titleZh} - The Signal" with correct description, ogImage, and ogUrl (`/signal/{slug}`)
- `app/composables/use-current-category.ts` exists and is used in `use-category-meta.ts`, `[[category]].vue`, and `category-filter.vue`
- `app/composables/use-category-meta.ts` exists and is used in `[[category]].vue`
- `app/composables/use-signal-meta.ts` exists and is used in `signal/[slug].vue` and `signal-detail-overlay.vue`
- `pnpm run lint` passes
- `pnpm run typecheck` passes
