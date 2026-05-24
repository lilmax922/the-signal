# UI Context

## Theme

The design language is **"Objective Minimalist"** — a calm, high-precision technical environment designed to minimize cognitive load and emotional distraction. It exclusively features a Dark Theme, utilizing near-black backgrounds and logically layered surfaces with tactical use of OKLCH colors. The visual goal is to feel like a **"Refined Data Terminal"** — precise and information-rich, but never claustrophobic. Content breathes. Every element has room to exist without crowding its neighbours.

---

## Colors

We are using NuxtUI default design system, please follow the nuxt-ui skill for instruction to configure it.

- Always use dark theme.
- Use black as the application background color.
- When adding custom colors, define all shades from 50 to 950.
- All colors use the **OKLCH** color space for consistent perceptual lightness.
- Always use semantic colors over raw palette colors — never hardcode oklch/hex values or raw Tailwind color classes in components or templates.

```css
/* app/assets/css/main.css */
@theme static {
  --color-brand-50: oklch(97% 0.02 205);
  --color-brand-100: oklch(92% 0.04 205);
  --color-brand-200: oklch(87% 0.07 205);
  --color-brand-300: oklch(82% 0.10 205);
  --color-brand-400: oklch(78% 0.13 205);
  --color-brand-500: oklch(75% 0.15 205); /* Core brand color */
  --color-brand-600: oklch(65% 0.14 205);
  --color-brand-700: oklch(52% 0.12 205);
  --color-brand-800: oklch(40% 0.09 205);
  --color-brand-900: oklch(28% 0.06 205);
  --color-brand-950: oklch(18% 0.03 205);
}
```

---

## Typography

Text must feel effortless to read — never dense, never strained. Spacing, weight, and scale are calibrated so a user can scan a card or read a paragraph without fatigue.

### Font Stack

| Role | Font Family | CSS Variable | Purpose |
| :--- | :--- | :--- | :--- |
| **Sans-Serif** | Inter, Noto Sans TC, sans-serif | `--font-sans` | Core readable text, article body, headings, system UI. |
| **Monospace** | JetBrains Mono, Fira Code, monospace | `--font-mono` | Numbers, entity tags (`$NVDA`), timestamps, data values. |


### Font Scale

| Tailwind Class | Size | Primary Usage |
| :--- | :--- | :--- |
| `text-xs` | `12px` | Fine metadata, timestamps, secondary labels. |
| `text-sm` | `14px` | Secondary text, card captions. |
| `text-base` | `16px` | Main reading content, narrative text blocks. |
| `text-lg` | `18px` | Sub-headings, section titles. |
| `text-xl` | `20px` | Signal Card titles, Command Palette input. |
| `text-2xl` | `24px` | Primary page titles. |

### Font Weight Protocol

- **Light (`300`)**: Long body text and deep-dive paragraphs.
- **Regular (`400`)**: Standard body copy and secondary items.
- **Medium (`500`)**: Section headers, entity tags, nav items, UI actions.
- **Semi-Bold (`600`)**: **Maximum allowed.** Page-level headers only.
- **Bold and above (`700+`)**: **Strictly Prohibited.**

### Legibility Rules

1. **Line Height**: Body and paragraph text must use at minimum `leading-relaxed` (1.625).
2. **Letter Spacing**: Apply `tracking-wide` to Traditional Chinese body text to prevent ideogram congestion.
3. **Tabular Figures**: All numbers, percentages, and timestamps use `font-mono` or `tabular-nums`.
4. **Entity Tags**: Uppercase, monospace stack, no background fill.
5. **No Emotional Italics**: Italics are prohibited in de-noised content.

---

## Spacing & Breathing Room

A data terminal must never feel cramped. Generous spacing is a non-negotiable requirement.

### Principles

- **Content first, density second.** If a layout forces the user to squint or hunt, it is wrong.
- **Generous internal padding.** Cards, panels, and list items must have sufficient padding so content does not feel trapped against edges.
- **Vertical rhythm.** Sections and grouped elements must have clear breathing gaps so the eye can parse structure effortlessly.

### Spacing Scale

| Context | Padding / Gap | Tailwind |
| --- | --- | --- |
| Card internal padding | `24px` horizontal / `20px` vertical | `px-6 py-5` |
| Section vertical gap | `32px–48px` | `gap-8` to `gap-12` |
| Inline metadata row gap | `8px–12px` | `gap-2` to `gap-3` |
| Page horizontal margin (mobile) | `16px` | `px-4` |
| Page horizontal margin (desktop) | `32px–48px` | `px-8` to `px-12` |
| Feed card vertical spacing | `16px` | `space-y-4` |
| Right-Side Pane internal padding | `32px` | `p-8` |
| Bottom Drawer internal padding | `24px` horizontal / `32px` vertical | `px-6 py-8` |

---

## Border Radius

```css
:root {
  --ui-radius: 0.375rem;
}
```

| Context | Class |
| --- | --- |
| Inline / small UI (tags, badges) | `rounded-xl` |
| Cards / panels | `rounded-2xl` |
| Modals / overlays / drawers | `rounded-3xl` |

---

## Component Library

- **NuxtUI**: Primary UI component library.
- **TailwindCSS**: Utility-first styling and theme variables.
- **Lucide Icons**: Stroke-based iconography via `i-lucide-*`.

---

## Layout Patterns

### Signal Feed: Two-Column Card Stream

The primary feed layout is a **two-column card grid on desktop, single column on mobile**. This provides a stable, predictable visual rhythm — the eye moves in a straight vertical path without needing to re-orient for differently-sized blocks.

```
Desktop (≥ 768px)               Mobile (< 768px)
┌────────────┐ ┌────────────┐   ┌──────────────────┐
│  [Image]   │ │  [Image]   │   │     [Image]       │
│  Title     │ │  Title     │   │  Title            │
│  Summary   │ │  Summary   │   │  Summary          │
│  Tags Time │ │  Tags Time │   │  Tags        Time │
└────────────┘ └────────────┘   └──────────────────┘
```

**Card anatomy (top to bottom):**
1. Image — `aspect-video`, full card width, `rounded-t-2xl`, no cropping distortion.
2. Category badge + timestamp — `text-xs font-mono`, `gap-2`.
3. Title — `text-xl font-medium`, `leading-relaxed`.
4. 3-point summary list — `text-sm font-light leading-relaxed`, `space-y-2` between bullets.
5. Entity tag chips — monospace, uppercase, `text-xs`, separated by `mt-4`.

Cards use `rounded-2xl` with a subtle variant.

### Mobile Layout

- **Header**: Fixed top container with the application name permanently centered.
  - **Scroll-Down**: Conceals the search input and Category Filter Rail to maximise reading space.
  - **Scroll-Up**: Reveals the search input, notification icon, and Category Filter Rail.
  - Hysteresis threshold: controls only toggle after sustained scroll direction.
- **Category Filter Rail**: Horizontal scroll tab rail inside the header. Tabs: All / Tech / World / Science.
- **Feed**: Single-column card list with `space-y-4` between cards and `px-4` page margin.
- **Bottom Navigation**: Low-profile persistent footer for switching between primary views.

### Desktop Layout

- **Header**: Fixed full-width top bar. Application title anchored left, centered search input with `⌘K` hint, user avatar anchored right.
- **Category Filter Rail**: Pinned to the top of the content workspace, always visible above the feed.
- **Two-Column Feed**: `grid grid-cols-2 gap-6` with `max-w-7xl mx-auto` and `px-8`–`px-12` page margin.
- **Intelligence Pane**: Right-side panel that opens when a card is selected. The feed narrows to a single column to accommodate it. Has `p-8` internal padding and a subtle left border. Closing the pane restores the two-column grid.

---

## Interaction Principles

### Opening Signal Detail

- Clicking a card triggers `router.push('/signal/[slug]')`. This updates the URL without a full page reload.
- The appropriate detail component opens based on current viewport:
  - **Mobile** (`< 768px`): Bottom Drawer slides up to 90% viewport height.
  - **Desktop** (`≥ 768px`): Intelligence Pane opens on the right, feed narrows to single column.

### Direct Navigation & Shared Links

- Navigating directly to `/signal/[slug]` (e.g. from a shared URL) renders the feed page in the background and immediately opens the signal detail using the same viewport-aware logic.
- This is handled by `app/pages/signal/[slug].vue`, which on mount fetches the signal by slug via `GET /api/signals/[slug]` and opens the correct detail component.
- If the slug does not exist, the page renders a 404 state without breaking the feed layout.

### Closing Signal Detail

- Closing the drawer or pane triggers `router.push('/')`.
- The feed restores scroll position to where it was before the detail was opened.

### Desktop: Right-Side Pane
- Clicking elsewhere in the feed or pressing `Esc` closes the pane.
- The expanded state is reflected in the URL (`/signal/[slug]`); closing returns to `/`.

### Mobile: Bottom Drawer
- Drawer content has `px-6 py-8` internal padding.
- Dismissed via downward swipe or a close button; returns to exact feed scroll position.

### Command Palette
- Triggered by the search input or `⌘K`.
- Searches signal titles, content, and entity tag names.
- Results render as a compact list of Signal Card previews within the palette overlay.
- Selecting a result navigates to `/signal/[slug]`.

### Avatar Dropdown (Desktop)
- Clicking the avatar shows a dropdown with two items: **Settings** and **Logout**.

### Zero-Sentiment Visualisation
- No green/red colour mapping for any data value.
- All interactive highlights and focus indicators use brand accent tokens exclusively.

---

## Icons

- **Library**: Lucide Icons, uses NuxtUI MCP to search for icons.
- **Style**: Stroke-based only, `stroke-width: 2`.
- **Sizes**: `h-4 w-4` for inline metadata; `h-5 w-5` for interactive controls and navigation.