# Brand Direction: Soulani Auto Garage

> [!NOTE]
> This document defines the foundational brand strategy, visual direction, and design philosophy for Soulani Auto Garage. Moving away from an exclusive "private club" feel, this direction is inspired by modern, tech-forward platforms like *Carsome*, *Carro*, *Airbnb*, *Stripe*, and *Linear*. The goal is to be universally accessible while maintaining a high-quality, trustworthy, and modern digital experience.

## 1. Brand Personality
**The Dependable Guide & Automotive Enthusiast.**
Soulani Auto Garage is friendly, highly knowledgeable, transparent, and approachable. We are the trusted friend who knows everything about cars and wants to help you find the perfect one—whether it's an efficient Agya for daily commuting, a reliable Innova for the family, or a premium SUV. We combine the warmth of a great local business with the speed and precision of a top-tier tech startup.

## 2. Brand Positioning
**The Modern, Transparent Automotive Platform for Everyone.**
Soulani is the trusted platform for buying and renting vehicles in Indonesia. We strip away the intimidating atmosphere of luxury dealerships and the sketchiness of cheap marketplaces. Instead, we offer a clean, reliable, and delightful experience. We bring tech-driven transparency to the automotive market, making high-quality cars accessible to first-time buyers, families, professionals, and enthusiasts alike.

## 3. Brand Voice
**Clear. Encouraging. Jargon-Free. Friendly.**
- **Do:** Speak with clarity and enthusiasm. Explain things simply. Be helpful and welcoming. (e.g., "Ready for your next road trip? This meticulously inspected Innova has space for the whole family.")
- **Don't:** Use alienating luxury jargon, "private club" language, or aggressive, sleazy sales pitches. Avoid making the user feel like they need a certain income to be treated well.
- **Tone:** Similar to Stripe or Airbnb. The writing should be brilliantly simple, direct, and universally understood, but injected with a genuine love for driving.
- **Language:** The public website uses Bahasa Indonesia as the primary language for all UI copy, CTAs, and microcopy (e.g., "Mobil Dijual", "Kirim Pertanyaan", "Baru Masuk"). The Admin Dashboard uses English.

## 4. Emotional Experience
**Confidence, Ease, and Joy.**
- **Confidence:** Customers should feel completely secure. Clear inspection reports, upfront pricing, and absolute transparency replace the anxiety of buying/renting.
- **Ease:** The process should be incredibly fast and frictionless. No hoops to jump through.
- **Joy:** Getting a new car (or renting one for a trip) is a happy milestone! The platform should celebrate this excitement.

## 5. Visual Direction
**Modern Startup meets Automotive Precision.**
- **Colors:** Bright, clean, and optimistic. The primary brand color is Action Blue (`#2563EB` / `oklch(0.488 0.243 264.376)`), paired with crisp White (`#FFFFFF`) for cards and modals, Light Gray (`#F9FAFB`) for app backgrounds, and high-contrast dark slates (`#0F172A`) for headings and body text.
- **Typography:** The live implementation uses a three-font system:
  - **Headings:** *Figtree* (mapped to `--font-heading` CSS variable) — geometric, friendly, bold.
  - **Body / UI:** *Instrument Sans* (mapped to `--font-sans`) — clean, modern, legible.
  - **Supplemental / Available:** *Plus Jakarta Sans* (available via `--font-jakarta-sans`) — modern sans-serif for data-dense contexts.
  - **Code / Monospace:** *JetBrains Mono* (`--font-jetbrains-mono`) — for technical data display in admin.
- **Layout:** Highly structured, modular, and data-clear. Think of the beautiful, organized dashboards of Linear or Stripe. Information is easily scannable.

## 6. Photography Style
**Authentic, Bright, and Crystal Clear.**
- **The Vehicles:** Brightly lit, high-resolution, and honest. Whether shot in a clean, brightly lit studio environment (like Carsome) or in relatable, real-world settings (a bright driveway, a modern city street in daylight), the cars should look pristine but real.
- **The Lifestyle:** Warm, diverse, and relatable. A family packing the trunk of a Rush, a professional unlocking a Civic, friends enjoying a weekend trip.
- **Strictly Avoid:** Dark, moody, high-contrast fashion aesthetics. No confusing angles or heavy color grading that obscures the true color of the vehicle.

## 7. Motion & Animation Principles
**Snappy, Delightful, and Responsive.**
- Animations should be fast and fluid (200ms–300ms transitions).
- Interactions should feel instantaneous and bouncy, similar to top-tier mobile apps. When you click a filter, the results should snap into place with satisfying, lightweight motion.
- Incorporate subtle, delightful micro-animations, like a checkmark popping in when a booking is confirmed or a friendly wave icon on the chat button.
- **Implementation:** Powered by `tw-animate-css` (imported in `globals.css`). Duration tokens: `fast: 150ms`, `normal: 300ms`.

## 8. Trust Building Principles
**Absolute Transparency.**
- **Visualized Data:** Don't just say "Inspected." Show a beautiful, easily scannable 150-point inspection checklist. Use progress bars, green checks, and clear diagrams.
- **Upfront Pricing:** Total cost, including taxes or deposits for rentals, is displayed immediately. No hidden fees ever.
- **Clear Histories:** Present the car's history simply and honestly.
- **Status Honesty:** Vehicles that are SOLD or under MAINTENANCE are still shown in the catalog but with a clear status banner and with their inquiry form disabled — users are never misled about availability.

## 9. Indonesian Hospitality & Service Model
**Fast, Friendly, and Tech-Enabled.**
- **Lightning-Fast WhatsApp:** We meet users where they are. Our WhatsApp integration is prominent and handled by real, friendly humans who respond in minutes, not hours. A floating WhatsApp FAB (`WhatsAppFAB` component) is persistent on all public pages.
- **Helpful, Not Pushy:** Customer support acts as a helpful guide to answer questions, explain features, and facilitate flexible negotiations. We combine traditional Indonesian *keramahan* (hospitality) with modern efficiency.

## 10. Design Principles
**Clarity over Decoration.**
- **Accessible Design:** High contrast, large tap targets, and incredibly clear navigation. It must be easy to use for a first-time buyer on a mid-range smartphone.
- **Data as Design:** Use beautiful UI elements to make technical specs (engine size, mileage, transmission) easy and fun to read.
- **Frictionless Flows:** From searching to booking a test drive or rental, the path should require the absolute minimum number of clicks.

---

> [!WARNING]
> ## STRICTLY PROHIBITED (WHAT TO AVOID)
> To ensure the brand remains accessible and modern, avoid the following:
>
> - **Luxury Dealership Tropes:** Do not use dark, moody backgrounds with gold accents, "private collection" rhetoric, or concierge-only barriers.
> - **Intimidating Language:** Avoid making the platform feel like it's only for the rich or automotive experts.
> - **Cheap Marketplace Clutter:** Do not allow messy, unvetted photos, chaotic layouts, or scammy pop-ups.
> - **Hidden Fees:** Never hide the true price. Transparency is non-negotiable.
> - **Slow, Heavy Design:** Avoid slow, dramatic animations or massive background videos that slow down page load times on mobile networks.
> - **Misleading Availability:** Never show an active inquiry form on a SOLD or MAINTENANCE vehicle. The system must always reflect the real status of every unit.
