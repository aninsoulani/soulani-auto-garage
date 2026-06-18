# Design System & UI Specifications
# Soulani Auto Garage

**Version:** 2.0.0
**Implementation:** Tailwind CSS v4 + Shadcn UI (Style: `base-vega`, Base Color: `stone`)

---

## 1. Design Philosophy

Soulani Auto Garage employs a clean, data-dense, and highly trustworthy UI. It strikes a balance between a modern tech platform (like Stripe or Linear) and an accessible consumer application. We avoid dark, moody "luxury" tropes in favor of bright, honest, and scannable interfaces.

### Core Principles
1. **Absolute Clarity:** Information must be immediately scannable. Use tables, grids, and clear visual hierarchy.
2. **Honesty in Design:** Never hide the true price. Show inspection results clearly, both positive and negative.
3. **Snappy Feedback:** Interactions (filtering, submitting) should feel instantaneous with bouncy, 150-300ms transitions.
4. **Indonesian Context:** The public interface is entirely in Bahasa Indonesia. Design must accommodate longer Indonesian words and specific currency formats (e.g., `Rp 850.000.000`).

---

## 2. Typography System

We use a multi-font system imported via `next/font/google` for optimal performance.

| Variable | Font Family | Usage | Characteristics |
|---|---|---|---|
| `--font-heading` | **Figtree** | Page titles, section headers, hero text | Geometric, friendly, bold, modern. |
| `--font-sans` | **Instrument Sans** | Primary body text, UI labels, form inputs | Clean, highly legible at small sizes. |
| `--font-jakarta-sans` | **Plus Jakarta Sans** | Secondary/Data-dense contexts | Available as an alternative sans-serif. |
| `--font-jetbrains-mono`| **JetBrains Mono** | Code, IDs, technical specs in admin | Clear distinction between similar characters. |

**Scale Configuration (Tailwind Defaults):**
- `text-xs`: 0.75rem (12px) — Badges, microcopy.
- `text-sm`: 0.875rem (14px) — Standard UI labels, secondary text.
- `text-base`: 1rem (16px) — Standard body text.
- `text-lg`: 1.125rem (18px) — Subheadings.
- `text-2xl`: 1.5rem (24px) — Section headers.
- `text-3xl`: 1.875rem (30px) — Major titles.
- `text-5xl`: 3rem (48px) — Hero titles.

---

## 3. Color Palette (OKLCH Space)

Soulani uses modern `oklch()` color definitions mapped to CSS variables for dynamic theming (including a supported `.dark` mode).

### Base Brand Colors
- **Primary (Action Blue):** `oklch(0.488 0.243 264.376)` — Approx `#2563EB`. Used for primary buttons, links, and major active states.
- **Primary Foreground:** `oklch(0.97 0.014 254.604)` — White/Off-white for text on primary backgrounds.
- **WhatsApp Green:** `#25D366` — Used exclusively for WhatsApp CTA buttons.

### Light Theme Tokens (`:root`)
- **Background:** `oklch(1 0 0)` (White) — Used for main app background (`bg-[#F9FAFB]` often used for layout wrapper).
- **Foreground:** `oklch(0.147 0.004 49.25)` (Slate 900) — Primary text color.
- **Card / Popover:** `oklch(1 0 0)` (White)
- **Muted:** `oklch(0.97 0.001 106.424)` — For disabled states and subtle backgrounds.
- **Border / Input:** `oklch(0.923 0.003 48.717)` — Soft slate borders.
- **Destructive:** `oklch(0.577 0.245 27.325)` — Red for errors and delete actions.

### Dark Theme Tokens (`.dark`)
Dark mode is fully supported via the `.dark` class, inverting backgrounds to deep slates and lightening foregrounds, while adjusting the primary blue for better contrast (`oklch(0.424 0.199 265.638)`).

---

## 4. Radii and Elevation

- **Global Radius:** `--radius: 0.45rem;`
  - *Derived scales:* `radius-sm` (0.6x), `radius-md` (0.8x), `radius-lg` (1x), `radius-xl` (1.4x), `radius-2xl` (1.8x), `radius-3xl` (2.2x).
- **Elevation (Shadows):**
  - Use Tailwind's default `shadow-sm` for cards, inputs, and standard panels.
  - Use `shadow-md` for hover states on clickable cards.
  - Use `shadow-lg` for dropdowns, popovers, and sticky bottom bars.

---

## 5. UI Component Library

We utilize **Shadcn UI** installed via the CLI (`components.json`).
- **Style:** `base-vega`
- **Base Color:** `stone`
- **CSS Variable Strategy:** Extensive use of CSS variables defined in `src/app/globals.css`.

### Common Components

#### Buttons
- **Primary:** Action Blue background, white text. Bouncy hover effect. Used for main CTA (e.g., "Kirim Pertanyaan").
- **Outline:** Transparent background, slate border, slate text. Used for secondary actions (e.g., "Filter").
- **Ghost:** No background or border until hover. Used for tertiary actions.
- **WhatsApp:** Specific green (`#25D366`) variant, often paired with the `MessageCircle` icon.

#### Form Elements (Inputs, Selects, Textareas)
- `bg-white`, soft slate border (`border-border`), standard focus ring (`outline-ring/50`).
- Error states explicitly styled with `text-rose-500` labels and borders.

#### Vehicle Badges
Defined centrally in `VehicleBadge.tsx` to maintain consistency:
- **Featured ("Pilihan Terbaik"):** Red background, white text, uppercase, extra small.
- **New Arrival ("Unit Terbaru"):** Sky blue background, white text.
- **Inspected ("150-Titik Inspeksi"):** Emerald green background, white text.
- **Maintenance/Sold:** Contextual banners (amber/gray) rather than inline pills.

---

## 6. Layout & Grid System

- **Max Width:** `max-w-7xl` (1280px) for standard page content.
- **Responsive Breakpoints (Tailwind Defaults):**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px (Desktop threshold)
  - `xl`: 1280px
- **Grid Strategy:**
  - Vehicle Listing: 1 col (mobile) → 2 cols (`sm`) → 3 cols (`md`) → 4 cols (`xl`).
  - VDP Detail Layout: Stacked (mobile) → 5-column CSS grid (`lg:grid-cols-5`) where Gallery takes 3 columns and CTA takes 2 columns.

---

## 7. Motion & Animation

- Powered by `tw-animate-css` imported in `globals.css`.
- **Transitions:** Use `transition-all duration-200` on interactive elements (buttons, cards).
- **Loading States:** Use the `animate-pulse` skeleton loader pattern (e.g., `SkeletonCard.tsx`) to prevent layout shifts.
- **Modals/Sheets:** Must slide in from the bottom (mobile) or fade in (desktop) rapidly.

---

## 8. Specific UI Patterns

### The "WhatsApp FAB" Pattern
A floating action button (FAB) is persistently available on the bottom right of all public pages, allowing instant access to customer support.

### The Sticky CTA Pattern
On mobile Vehicle Detail Pages, the primary action (Price + "Kirim Pertanyaan" + WA icon) is fixed to the bottom of the viewport (`fixed bottom-0 z-40 bg-white shadow-lg`). On desktop, it is a sticky sidebar card (`sticky top-24`).

### Active Filter Chips
When users apply filters on the Sales page, small visual "chips" (e.g., "Otomatis ✕", "Bensin ✕") appear below the search bar, allowing easy removal of individual filters without opening the main filter drawer.

### Formatting Data
- **Currency:** Always format IDR using `Intl.NumberFormat('id-ID')` with the `Rp` prefix implicitly or explicitly handled by the utility function.
- **Mileage:** Format as `XX.XXX km`.
- **Empty States:** Clear, friendly empty states with an illustration or icon, a helpful message, and a CTA to reset filters.
