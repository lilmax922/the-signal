# UI Context

## Theme

The design language is **"Objective Minimalist"** — a calm, high-precision technical environment designed to minimize cognitive load and emotional distraction. It exclusively features a Dark Theme to create a focused atmosphere, utilizing near-black backgrounds (--bg-base), logically layered surfaces (--bg-surface), and tactical use of OKLCH colors. The visual goal is to feel like a **"Refined Data Terminal"** that presents truth and logic rather than hype or noise.

## Colors

All colors are defined using the **OKLCH** color space to ensure consistent perceptual lightness and professional aesthetics.

| Role             | CSS Variable       | Value                 | Description                                      |
| ---------------- | ------------------ | --------------------- | ------------------------------------------------ |
| Page background  | `--bg-base`        | `oklch(14% 0.01 258)` | Main application background (Deep Charcoal).     |
| Surface          | `--bg-surface`     | `oklch(18% 0.01 258)` | Navigation bars, sidebars, and inactive panels.  |
| Elevated surface | `--bg-elevated`    | `oklch(22% 0.01 258)` | Signal cards and active workspace containers.    |
| Subtle surface   | `--bg-subtle`      | `oklch(26% 0.02 258)` | Input fields and hover states.                   |
| Default border   | `--border-default` | `oklch(32% 0.01 258)` | Primary card borders and structural dividers.    |
| Subtle border    | `--border-subtle`  | `oklch(24% 0.01 258)` | Secondary decorations and tab indicators.        |
| Primary text     | `--text-primary`   | `oklch(95% 0.01 258)` | Essential facts, headlines, and core signals.    |
| Secondary Text   | `--text-secondary` | `oklch(80% 0.01 258)` | AI-summarized insights and factual descriptions. |
| Muted Text       | `--text-muted`     | `oklch(60% 0.01 258)` | Timestamps, source metadata, and tags.           |
| Faint text       | `--text-faint`     | `oklch(45% 0.01 258)` | Footnotes and inactive UI elements.              |
| Brand Accent     | `--accent-primary` | `oklch(75% 0.15 205)` | Primary actions and focused states.              |
| AI Accent        | `--accent-ai`      | `oklch(60% 0.18 275)` | AI-processed logic and intelligence areas.       |
| Neutral Status   | `--state-info`     | `oklch(70% 0.05 258)` | Informational data highlights.                   |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-primary`, etc.

## Typography

We use NuxtFonts(https://fonts.nuxt.com/) to optimize fonts.

| Role      | Font         | Variable      |
| --------- | ------------ | ------------- |
| UI text   | `Geist Sans` | `--font-sans` |
| Code/mono | `Geist Mono` | `--font-mono` |

## Border Radius

| Context           | Class         |
| ----------------- | ------------- |
| Inline / small UI | `rounded-xl`  |
| Cards / panels    | `rounded-2xl` |
| Modals / overlays | `rounded-3xl` |

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
