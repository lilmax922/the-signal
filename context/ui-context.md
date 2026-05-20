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

The typography system is engineered to support the **"Objective Minimalist"** philosophy and the aesthetics of a **"Refined Data Terminal."** In order to strip away visual hype and cognitive noise, we use a clinical, highly structured type scale and layout conventions.

### Font Stack

We use NuxtFonts to optimize and serve typography across the application, pairing readable sans-serif fonts with a technical monospace stack.

| Role | Font Family | CSS Variable | Purpose |
| :--- | :--- | :--- | :--- |
| **Sans-Serif** | `'Inter'`, `'Noto Sans TC'`, `sans-serif` | `--font-sans` | Core readable text, article body, headings, and system UI. |
| **Monospace** | `'JetBrains Mono'`, `'Fira Code'`, `monospace` | `--font-mono` | Technical numbers, entity tags (`$NVDA`), hashes, timestamps, and data tables. |

### Font Scale

We use a high-density, default Tailwind type scale to maximize raw information presentation while maintaining comfortable legibility.

| Tailwind Class | Size (rem) | Size (px) | Default Line Height | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | `0.75rem` | `12px` | `1rem (16px)` | Fine metadata, inline entity tags, timestamps, secondary labels. |
| `text-sm` | `0.875rem` | `14px` | `1.25rem (20px)` | Standard body copy, secondary text lists, and card descriptions. |
| `text-base` | `1.0rem` | `16px` | `1.5rem (24px)` | Main reading content and primary narrative text blocks. |
| `text-lg` | `1.125rem` | `18px` | `1.75rem (28px)` | Sub-headings, Signal Card titles, and section titles. |
| `text-xl` | `1.25rem` | `20px` | `1.75rem (28px)` | Main component headers and Command Palette query inputs. |
| `text-2xl` | `1.5rem` | `24px` | `2rem (32px)` | Primary page titles and main dashboard metrics. |

### Visual Sentiment Stripping (Font Weight Protocol)

To eliminate any visual bias, emotional hierarchy, or sensationalism:
- **Light (`font-light` / `300`)**: Used for extensive block text, dense data lists, and deep-dive paragraphs to reduce cognitive strain.
- **Regular (`font-normal` / `400`)**: Standard reading weight for general text, body copy, and secondary items.
- **Medium (`font-medium` / `500`)**: Used for section headers, entity tags, navigation items, and UI component actions.
- **Semi-Bold (`font-semibold` / `600`)**: The **absolute maximum** weight allowed. Reserved strictly for page-level headers and active, high-priority headings.
- **Bold/Extra-Bold (`700` and above)**: **Strictly Prohibited**. Over-emphasized text acts as emotional guidance, which violates our unbiased data-terminal invariants.

### Layout & Legibility Rules

1. **Letter-Spacing (Tracking)**:
   - For dense ideograms or long narrative blocks, apply slight tracking (`tracking-wide` or `letter-spacing: 0.03em`) on body text to prevent characters from appearing congested in dense UI cards.
2. **Line Height Adjustments**:
   - Paragraph body text requires a relaxed line height to prevent dense lines from blending. Ensure a minimum of `leading-relaxed` (or `lh-1.5`) is applied to reading layouts.
3. **Tabular Figures**:
   - Every numerical value, percentage, asset quote, and date must use `font-mono` or have `font-feature-settings: "tnum"` (using the `tabular-nums` class) to ensure perfectly uniform, vertically aligned columns in grids.
4. **Entity Tag Monospacing**:
   - AI-generated entity tags (e.g. `$TSLA`, `$NVDA`) must use the monospace stack, set in uppercase without a background color, keeping a clean, low-clutter visual layout.
5. **No Emotional Italics**:
   - *Italicized* text is strictly prohibited in de-noised content, as italics are traditionally used to inject tone, irony, or dramatic emphasis. All facts are presented straight.


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

### Mobile Layout
- Header: A persistent, fixed-top container that houses the application name permanently centered at the very top of the viewport. It responds elegantly to scroll gestures by managing the visibility of secondary controls below the title:
  - Scroll-Down State: Smoothly conceals the search input bar and the category filter rail, maximizing screen estate for content consumption.
  - Scroll-Up State: Re-exposes the structural search input bar, the stroke-based notification icon, and the category filter rail seamlessly.
- Main Content: The vertical scroll layout occupying the entire screen area underneath the header container.
  - Category Filter Rail: Located within the global header container directly above the stream feed, functioning as a high-density horizontal tab rail that supports fluid lateral swiping. It is not statically fixed to the content container itself.
  - Responsive Linear Flow: Positioned immediately below the filter rail within the main container workspace, organizing information into a compact, single-column vertical sequence of cards.
- Persistent Bottom Navigation: A low-profile mobile navigation footer allowing thumb-level switching between application viewpoints.

### Desktop Layout
- Header: A fixed, full-width horizontal top navigation banner. It contains the application title anchored on the far left, a clean centered search input block featuring a passive ⌘+K shortcut indicator, and the user's profile avatar positioned on the far right.
- Main Content: The primary fluid-width workspace area filling the entire layout underneath the desktop global header.
  - Category Filter Rail: Stationed permanently at the absolute top of the content workspace section, remaining consistently aligned above the card data grid.
  - Dynamic Bento Grid: Located immediately beneath the category filter rail. It automatically arranges cards into a multi-column mosaic layout where high-priority signals or comprehensive fact summaries dynamically expand to occupy larger row or column dimensions.

### Interaction Principles
- Desktop View: In-place Bento Expansion
  - Dynamic Grid Reflow: Clicking an info card inside the desktop Bento Grid inflates that specific block directly within the active grid layer, dynamically adjusting its layout parameters to occupy a larger spatial footprint.
  - Context Preservation: Surrounding blocks reflow smoothly around the expanded card using transitions. The expanded element natively unfolds to unlock the detailed, structured Chinese factual breakdown and external source anchors without throwing modal screens over the interface, keeping user focus locked.
- Mobile View: High-Density Bottom Drawer
  - 90% Full-Height Sheet: Tapping a card on a mobile viewport glides a drawer panel upward to occupy exactly 90% of the viewport height.
  - Gestural Dismissal: The sheet presents the deep-dive fact analysis and structured entity metadata cleanly. Users can close the drawer instantly with an intuitive downward slide swipe gesture, returning directly to their exact historical scroll position in the feed.
- Scroll-Driven Header Interactivity
  - Hysteresis Threshold Triggers: The mobile global header will not aggressively toggle visibility at the immediate start of any scroll event. Instead, the interface utilizes a smooth scroll-velocity threshold; the search bar and category filter rail only begin to collapse after a sustained downward scroll, and only re-emerge after a clear, intentional upward scroll gesture, preventing accidental layout shifts.
- Desktop Avatar Dropdown
  - User Utility Access: Clicking the profile avatar in the desktop header displays a standard contextual dropdown overlay menu positioned directly beneath the icon. It contains exactly three operational endpoints: Bookmarks, Settings, and Logout.
- Zero-Sentiment Visualization
  - Objective Visual Language: The interface strictly eliminates emotional color mapping (such as green for asset growth or red for asset decline) to guarantee bias-free data reading. All interactive highlights, selected filters, and focus indicators rely exclusively on the neutral core application accent tokens to ensure a rigorous, data-terminal atmosphere.

## Icons

- Library: Lucide Icons, use NuxtUI `search_icon` MCP to find suitable icons.
- Style: Stroke-based only (2px stroke width).
- Sizing: h-4 w-4 for inline badges/metadata; h-5 w-5 for interactive buttons and nav items.
