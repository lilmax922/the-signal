# Objective

Users can search articles by keyword (title, summary) or tag name via a `Cmd+K` command palette. The same article must never appear twice even if multiple fields match.

## Step 1 — Search Schema

**File**: `shared/validators/signal.ts`

Add `signalSearchSchema` with `q` (string, 1–200 chars) and `limit` (int, 1–20, default 15).

## Step 2 — Responsive Modal

**File**: `app/components/responsive-modal.vue` (new)

Generic wrapper that renders `UModal` on desktop (≥768px) and `UDrawer` on mobile. Accepts `v-model:open` to control visibility and a default slot for content.

Reference: https://ui.nuxt.com/docs/components/drawer#responsive-drawer

## Step 3 — Command Palette Component

**File**: `app/components/search-command-palette.vue` (new)

- Contains only `UCommandPalette` (no modal/drawer wrapper)
- `v-model:searchTerm` controls input; debounced watch to fetch call but use mock data as the source until the API is implemented.
- Separate group by category,
- Each item: `label` = titleZh with truncate + custom tags badge.
- `onSelect` navigates via `router.push({ query: { ...route.query, signal: item.slug } })` — same pattern as `signal-card.vue`
- `loading` prop bound to fetch pending state

Use mock data validated with `signalSearchSchema` to simulate the search results.

## Step 4 — Header Integration

**File**: `app/components/app/header.vue` (modify)

- Replace non-functional `UInput` search boxes with clickable `UButton` (search icon + "Search" + `<UKbd>⌘K</UKbd>`)
- Desktop + mobile buttons both set `isSearchOpen = true`
- Render `<ResponsiveModal v-model:open="isSearchOpen">` containing `<SearchCommandPalette />`
- Register `Cmd+K` shortcut via `defineShortcuts({ meta_k: () => { isSearchOpen.value = true } })`

# Out of Scope

- Search functionality
- Search API
- DB query/migration

# Check When Done

- `Cmd+K` opens palette and `esc` closes palette.
- Clicking a result opens signal detail overlay.
- Keyboard navigation works normally within the palette.