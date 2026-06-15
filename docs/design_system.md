# Design System: Soulani Auto Garage

> [!NOTE]
> This document defines the revised Design System for Soulani Auto Garage. Aligned with our positioning as a "Modern Automotive Marketplace," this system moves away from ultra-luxury, editorial aesthetics in favor of a bright, accessible, trustworthy, and SaaS-inspired visual language. Influences include *Carsome*, *Carro*, *Airbnb*, and *Stripe*.

---

## 1. Color Palette
The color palette is designed to instill absolute trust, clarity, and friendliness. We use a vibrant primary color alongside a highly structured grayscale.

*   **Primary Brand (Action Blue):** `#2563EB` (Used for primary CTAs, links, and active states. Conveys trust and tech-forward efficiency.)
*   **Secondary/Accent (Amber):** `#F59E0B` (Used sparingly for "Hot Deal" tags or attention-grabbing badges.)
*   **Background (Light):** `Pure White #FFFFFF` (Cards, Modals) / `Light Gray #F9FAFB` (App Background, alternating sections).
*   **Text Primary:** `Slate #0F172A` (For headings and high-contrast readable body text).
*   **Text Secondary:** `Slate #64748B` (For subtitles, meta-data, and input placeholders).
*   **Success:** `Emerald #10B981` (For "Passed Inspection" badges, verified ticks).
*   **Error:** `Rose #F43F5E` (For form validation errors).
*   **Borders & Dividers:** `Slate #E2E8F0`

## 2. Typography
Typography must prioritize absolute legibility, data clarity, and a friendly, modern digital feel. Serifs are removed completely.

*   **Primary Font Family:** `Inter`, `Plus Jakarta Sans`, or `Roboto`.
*   **Headings:** Bold (`700`) or Semi-Bold (`600`). Tight line-height (`1.2`) for strong structural hierarchy.
*   **Body & Data:** Regular (`400`) or Medium (`500`). Open line-height (`1.5`) for readable paragraphs.
*   **Pricing:** Always heavily weighted (`700` or `800`) to stand out instantly.

## 3. Layout System
A highly structured, data-clear grid inspired by modern SaaS platforms. Space is used to organize data, not just for "editorial breathing room."

*   **Grid:** 12-column grid.
*   **Max Width:** `1280px` container for a focused, readable view on large screens.
*   **Spacing Scale:** Standard 8pt scale (`8`, `16`, `24`, `32`, `48`, `64`). Information density is comfortable but compact.
*   **Border Radius:** Friendly and approachable. `8px` (`lg`) for cards, buttons, and inputs. `9999px` (`full`) for badges and avatars.

## 4. Component System
Components are designed for clarity and rapid scanning by users of all age groups.

*   **Badges:** Pill-shaped, clear background colors with bold text. (e.g., Green for "150-Point Inspected", Amber for "Great Price").
*   **Inputs:** Solid light-gray borders (`1px solid #E2E8F0`), rounding of `8px`. Focus states feature a clear 2px `Action Blue` ring to ensure accessibility.
*   **Navigation:** Sticky top nav with a clear logo, a highly visible search bar embedded directly in the nav, and a solid primary CTA for "Log In" or "Contact Us".

## 5. Homepage Structure
The homepage is a conversion engine, prioritizing search and trust immediately.

1.  **Search-First Hero:** A clean, friendly headline with a prominent search bar and quick-filter buttons (e.g., "Under 200 Juta", "Family SUVs") overlaid on a bright, relatable lifestyle image.
2.  **Quick Categories:** Large, friendly icons for fast filtering by body type (Hatchback, MPV, SUV).
3.  **Trust Banner:** A horizontal strip highlighting core guarantees: "150-Point Inspection | 5-Day Money Back | 1-Year Warranty."
4.  **Featured Inventory:** A grid of vehicle cards sorted by algorithm or new arrivals.
5.  **Testimonials:** Clean, verifiable review cards with star ratings (5/5) and customer photos.

## 6. Vehicle Card Design
The Vehicle Card is the most critical component. It must be data-rich but visually clean.

*   **Image:** 4:3 aspect ratio. Clean background or bright environment. "150-Point Inspected" badge floating in the top left corner.
*   **Header:** Make, Model, and Trim (Bold `Slate #0F172A`).
*   **Meta Data Row:** Year • Mileage • Transmission (Small, `Slate #64748B`, separated by subtle bullets).
*   **Pricing:** Prominent total price. Below it, a smaller text line indicating estimated monthly installments (e.g., "Est. Rp 3.5jt/mo").
*   **Container:** `White` background, `1px solid #E2E8F0` border, `8px` border radius. On hover, the card lifts slightly (`-translate-y-1`) and gains a soft shadow (`shadow-md`).

## 7. CTA Design
Buttons must look like buttons—approachable, obvious, and satisfying to click.

*   **Primary CTA:** Solid `Action Blue` background, `White` text. `8px` border radius.
*   **Secondary CTA:** Outline style with `Action Blue` border and text, transparent background.
*   **WhatsApp CTA:** Floating button (bottom right) in WhatsApp Green (`#25D366`) with a clear label on desktop ("Chat with Us") and just the icon on mobile. 
*   **Hover States:** Slight background darken or a `-1px` Y-axis translate with increased shadow. Active states compress slightly (`scale: 0.98`).

## 8. Motion System
Motion is snappy, responsive, and delightful. It provides immediate feedback without wasting the user's time.

*   **Animation Duration:** Fast. `150ms` for hovers and micro-interactions, `300ms` for modals/drawers.
*   **Easing Curves:** `ease-out` (`cubic-bezier(0, 0, 0.2, 1)`) for objects entering the screen (feels fast and natural).
*   **Micro-interactions:** Skeleton loaders sweep quickly. Success states (like booking confirmed) feature a delightful bounce-in checkmark.

## 9. Mobile UX
Mobile is not just an afterthought; it is the primary way everyday users browse.

*   **Thumb-Friendly Navigation:** Bottom sticky navigation bar for core actions (Home, Search, Saved, WhatsApp).
*   **Tap Targets:** Minimum `44x44px` for all clickable elements to accommodate all users comfortably.
*   **VDP (Vehicle Detail Page):** Image carousels are easily swipeable with pagination dots.
*   **Sticky Action Bar:** The bottom of the VDP always has a sticky bar with the Price and a primary "Book Test Drive" or "Chat Now" button.

---

## 10. Design Tokens (Implementation-Ready)

These tokens map directly to modern utility frameworks like Tailwind CSS.

```json
{
  "colors": {
    "primary": {
      "DEFAULT": "#2563EB",
      "hover": "#1D4ED8",
      "light": "#EFF6FF"
    },
    "background": {
      "default": "#F9FAFB",
      "paper": "#FFFFFF"
    },
    "text": {
      "primary": "#0F172A",
      "secondary": "#64748B",
      "tertiary": "#94A3B8"
    },
    "status": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#F43F5E",
      "whatsapp": "#25D366"
    },
    "border": {
      "DEFAULT": "#E2E8F0",
      "focus": "#93C5FD"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "Plus Jakarta Sans", "Roboto", "sans-serif"]
    },
    "fontWeight": {
      "regular": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    }
  },
  "borderRadius": {
    "sm": "4px",
    "md": "6px",
    "lg": "8px",
    "xl": "12px",
    "full": "9999px"
  },
  "boxShadow": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "DEFAULT": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  },
  "transitionDuration": {
    "fast": "150ms",
    "normal": "300ms"
  }
}
```
