# UI Context

## Theme

The design language is **"Objective Minimalist"** — a calm, high-precision technical environment designed to minimize cognitive load and emotional distraction. It exclusively features a Dark Theme to create a focused atmosphere, utilizing near-black backgrounds (--bg-base), logically layered surfaces (--bg-surface), and tactical use of OKLCH colors. The visual goal is to feel like a **"Refined Data Terminal"** that presents truth and logic rather than hype or noise.

## Colors

We are using NuxtUI default design system, please following nuxt-ui skill for instruction to config it. 

Here's what you need to follow:

- Always use dark theme.
- Use black color as application background color.
- When adding custom colors, make sure to define all shades from 50 to 950 for each color.
- All colors are defined using the **OKLCH** color space to ensure consistent perceptual lightness and professional aesthetics.
- Always use semantic colors over raw palette colors, never hardcode/inline raw Tailwind palette colors in components, templates or class names.

Use this brand color as primary color:

```css
/* app/assets/css/main.css */
@theme static {
  --color-brand-50: oklch(97% 0.02 205);
  --color-brand-100: oklch(92% 0.04 205);
  --color-brand-200: oklch(87% 0.07 205);
  --color-brand-300: oklch(82% 0.10 205);
  --color-brand-400: oklch(78% 0.13 205);
  --color-brand-500: oklch(75% 0.15 205); // Core brand color
  --color-brand-600: oklch(65% 0.14 205);
  --color-brand-700: oklch(52% 0.12 205);
  --color-brand-800: oklch(40% 0.09 205);
  --color-brand-900: oklch(28% 0.06 205);
  --color-brand-950: oklch(18% 0.03 205);
}
```

## Typography

We use NuxtFonts(https://fonts.nuxt.com/) to optimize fonts.

| Role      | Font         | Variable      |
| --------- | ------------ | ------------- |
| Text      | `Inter` | `--font-sans` |

## Border Radius

Nuxt UI exposes CSS variables you can override in `main.css`:

```css
:root {
  --ui-radius: 0.375rem; // set default radius to 0.375rem
}
```

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-lg`  |
| Cards / panels    | `rounded-xl`  |
| Modals / overlays | `rounded-2xl` |

## Component Library

- NuxtUI: UI component library.
- TailwindCSS: Utilizing modern CSS-first styling and theme variables.
- Lucide Icons: Consistent stroke-based iconography via i-lucide-\*.

## Layout Patterns

- Fact Stream (Mobile)
  - Header: A minimalist sticky header with the title "THE SIGNAL" centered. The right side features a single Intelligence icon (i-lucide-sparkles) that triggers the MarketPulseDashboard. Date and profile avatars are removed to maintain focus.
  - Filter Rail: A horizontal, scrollable rail below the search bar for pre-defined categories (e.g., All, Tech, Macro).
  - Signal Cards: High-density cards featuring structured facts. AI-generated tags (e.g., #TSMC) are rendered inline at the bottom of each card as secondary navigation.
  - Intelligence Drawer: A rounded-3xl bottom-sheet interaction.
    - Triggered by the header icon to show global trends (MarketPulseDashboard).
    - Triggered by tapping a Signal Card to show specific de-noised details (SignalDetailView).
- Fact-Master Detail (Desktop):
  - Navigation Sidebar: Fixed-width (240px) on the left. Contains primary navigation and a "Tracking Tags" section for followed AI entities.
  - Signal Feed: The central fluid-width scrollable stream. Focuses on rapid scanning of objective headlines and data points.
  - Intelligence Reading Pane: A fixed-width (400px) right panel that uses dynamic component switching to preserve context:
    - Initial/Empty State (MarketPulseDashboard): Displays the "AI Morning Briefing" (a de-noised summary of recent events), "Trending Entities" list, and a neutral "Fact Distribution" gauge.
    - Active State (SignalDetailView): Once a card is selected, the panel smoothly transitions to show the de-noised deep dive, raw data restoration (English + Chinese), and the original source link.
- Interaction Principles
  - Context Preservation: On mobile, drawers can be dismissed with a downward swipe to return to the exact scroll position in the feed. On desktop, selecting different cards updates the right pane instantly without page refreshes.
  - Command Palette: A global ⌘+K overlay for semantic search. It prioritizes finding specific factual entities and historical signals over simple keyword matching.
  - Zero-Sentiment Visualization: Red/Green/Yellow indicators are strictly forbidden. All interactive elements and state highlights use `--accent-primary` or -`-accent-ai` to ensure a calm, objective user experience.

## Icons

- Library: Lucide Icons.
- Style: Stroke-based only (2px stroke width).
- Sizing: h-4 w-4 for inline badges/metadata; h-5 w-5 for interactive buttons and nav items.
