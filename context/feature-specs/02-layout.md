# Objective

We need to add base reusable components to build default responsive layout that handles both mobile and desktop views.

## Implementation Details

- Create `app/layouts/default.vue` as root layout.

### App Header

Create `app/components/app/header.vue`.

Desktop View Requirements:

- Fixed at the top of the viewport with `h-16` as the fixed-height.
- App name text "The Signal" on the left.
- Search bar in the center, with magnify glass icon and "Search" placeholder text, keyboard shortcut indicator text `⌘+K` on the right side of the search bar.
- User avatar dropdown-menu on the right with items: "收藏", "設定", "登出", use `i-lucide:user` for now.
- `category-filter` component is not included in `header` desktop view, it will be rendered on the top of the main content area.
- `category-filter` should follow the scroll collapse/expand behavior:
  - When scrolling down, it should collapse upwards and be hidden.
  - When scrolling up, it should expand downwards and be displayed.

Mobile View Requirements:

- Vertical stack layout
  - app name title: "The Signal" centered on the top
  - search bar with `i-lucide:search` icon and "Search" placeholder text on the middle
  - `category-filter` on the bottom
- The top section should fixed at the top of the viewport.
- The middle and bottom sections should follow the scroll-collapse/expand behavior:
  - When scrolling down, it should collapse upwards and be hidden.
  - When scrolling up, it should expand downwards and be displayed.

### Category Filter

Create `app/components/category-filter.vue`.

Requirements:

- Categories items: "全部", "科技", "股市", "能源", default is "全部".
- High-density horizontal filter rail with text-only tabs (no button styling).
- Inactive state: `text-muted` color for muted/dimmed appearance.
- Active state: `text-primary` color with bottom border indicator (high-contrast).
- Items should be horizontally scrollable with hidden scrollbar.
- Compact spacing for dense content navigation.

### Mobile Bottom Navbar

Create `app/components/mobile-bottom-navbar.vue`.

Requirements:

- Only show on mobile view.
- Items: `Home`, `Favorites`, `Settings`, and use icons from lucide icons for each.
  - `Home`: `i-lucide:house`
  - `Favorites`: `i-lucide:heart`
  - `Settings`: `i-lucide:settings`
- Fixed at the bottom of the viewport with `h-14` as the fixed-height.

## Instructions

- Follow `nuxt`, `vue`, `vue-best-practices` skills best practices.
- Use `NuxtUI MCP` to get component usage and APIs.

## Limitations

- No emojis.
- No gradient colors on UI components, text, etc.
- No emotional market color mapping (e.g., Red for up, Green for down).
- Only focus on building layout and UI, do not implement any features.

## Check when done

- Layout hierarchy matches the specification on both mobile and desktop views.
- Mobile view header scroll interactions properly collapse and re-expand the header elements using smooth threshold-based behavior.
- Desktop avatar dropdown contains exactly: "收藏", "設定", "登出".
- Category filter uses text-only tabs with muted inactive state and primary color active state with bottom border indicator.
- Mobile bottom navbar shows only icons (no labels), order is: Favorites, Home, Settings, and only displays on mobile view.