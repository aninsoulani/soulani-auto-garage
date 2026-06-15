# Phase 3: Public Website & Sales Flow
## Soulani Auto Garage

**Status:** Pre-Development — Awaiting Approval  
**Target:** Customer-facing website with full CRM-backed lead capture  
**Depends on:** Phase 2 complete (Inventory, Listings, Images, Inspections, Audit)

---

## Pre-Phase Gap Analysis

Before writing a single line of Phase 3 code, the following gaps were identified between the Phase 2 implementation and what Phase 3 requires.

### ✅ What Phase 2 Delivered (Confirmed in Code)
- `VehiclesModule` — CRUD with soft delete, slug generation, audit logging (`vehicles.service.ts`)
- `VehicleImagesModule` — Upload via Multer, primary image, sort order
- `VehicleInspectionsModule` — Full 8-point inspection record
- `ListingsModule` — Upsert for `SalesListing` and `RentalListing` (combined controller at `vehicles/:vehicleId`)
- `AuthModule` — JWT access + refresh token, RBAC guards
- `UsersModule` — Staff management
- Admin UI — Dashboard, Inventory list, VehicleForm (with InspectionTab, ImageUploaderTab, PricingTab)
- Prisma Schema — All models defined including `Lead`, `VehicleAnalytics`, `Testimonial`, `HomepageContent`
- `apiFetch` client — Base fetch util with 401 session handling

### ❌ Gap 1: Missing Backend Modules (Not Yet Wired into `app.module.ts`)
The `app.module.ts` currently only registers 6 modules. The following NestJS modules exist as folder stubs but have **no service/controller code** and are **not imported** into `app.module.ts`:
- `leads/` — only has a `dto/` folder, no service or controller
- `analytics/` — stub only
- `testimonials/` — stub only
- `cms/` — stub only
- `rental-bookings/` — stub only
- `rental-listings/` — stub only (separate from `listings/`)
- `blackout-dates/` — stub only
- `lead-followups/` — stub only

**Phase 3 requires:** `LeadsModule` and `AnalyticsModule` fully implemented.

### ❌ Gap 2: Vehicle `findOne` Does Not Return Slug-Based Lookup
The `GET /vehicles/:id` currently queries by numeric `id`. The public Vehicle Detail page will use `slug` as the URL parameter (e.g., `/sales/toyota-alphard-2022-abc123`). A new `findBySlug(slug: string)` method is required.

### ❌ Gap 3: Vehicle `findAll` Lacks Full-Text Search & Featured/NewArrival Filters
The public listing page requires:
- Search by `make` + `model` (fulltext index already in schema)
- Filter by `isFeatured`, `isNewArrival`
- Filter by `transmission`, `fuelType`, price range
- Sort by `price:asc`, `price:desc`, `createdAt:desc`
The current `QueryVehicleDto` only handles `page`, `limit`, `status`, `type`.

### ❌ Gap 4: No Public Vehicle List with Joined Listing Data
When listing vehicles publicly, the response must include `salesListing.price` and `rentalListing.dailyRate` alongside vehicle data. Currently `findAll` only joins `images`.

### ❌ Gap 5: Vehicle Analytics Not Tracking View Counts
`VehicleAnalytics` table exists in schema but `AnalyticsModule` is empty. The public VDP must fire `POST /analytics/vehicles/:id/track-view` on page load.

### ❌ Gap 6: No WhatsApp Utility in Backend
The Lead creation flow must build a WhatsApp redirect URL. There is no `whatsapp.ts` utility in the API, and no `LeadsService` at all.

### ❌ Gap 7: Public Pages Are Empty Stubs
- `apps/web/src/app/(public)/page.tsx` is a placeholder ("Coming Soon")
- `components/vehicles/`, `components/shared/`, `components/leads/` are all empty directories
- `apps/web/src/types/` is empty — no TypeScript interfaces exist yet

### ❌ Gap 8: No `lib/whatsapp.ts` or `lib/utils.ts` in Web App
The frontend needs IDR formatting utilities and WhatsApp URL builders. Neither file exists yet.

### ⚠️ Gap 9: `GET /vehicles/:slug` vs `GET /vehicles/:id` Routing Conflict
The admin currently uses `GET /vehicles/:id` (numeric). Adding `GET /vehicles/:slug` (string) to the same controller requires careful route ordering or a separate slug endpoint (e.g., `GET /vehicles/by-slug/:slug`).

### ⚠️ Gap 10: Rate Limiting Not Configured on Public Endpoints
`POST /leads` spec requires rate limiting (5 req/IP/hour). `@nestjs/throttler` must be configured globally and a custom decorator applied to the public leads endpoint.

---

## User Review Required

> [!IMPORTANT]
> **Decision 1: Slug vs ID for Vehicle Detail URL**
> The architecture document specifies `/sales/[slug]/page.tsx`. The current admin fetches vehicles by **numeric ID**. Two options exist:
> - **Option A (Recommended):** Add `GET /vehicles/by-slug/:slug` as a new public endpoint. The admin continues to use `GET /vehicles/:id`. Clean separation.
> - **Option B:** Make the existing `GET /vehicles/:id` also accept a slug string (check if string → slug lookup, if number → ID lookup). Slightly messy.
>
> **This plan proceeds with Option A.**

> [!IMPORTANT]
> **Decision 2: Source Tracking for Leads**
> The `Lead` schema has a `source` field (`LeadSource` enum: ORGANIC, GOOGLE_ADS, FACEBOOK, INSTAGRAM, DIRECT, WHATSAPP, REFERRAL). For Phase 3, all leads from the public website will default to `ORGANIC`. Should we add UTM parameter tracking (read `?utm_source` from the URL and map it to `LeadSource`)? This adds small complexity but is valuable for future analytics.
>
> **This plan includes basic UTM → LeadSource mapping (optional, can be skipped).**

> [!WARNING]
> **Decision 3: ISR Revalidation Strategy (Local Dev)**
> The architecture specifies SSG + ISR. In local development (`next dev`), ISR behaves differently — pages are always fresh. This means the ISR strategy is a production concern only. For Phase 3 local development, all public pages will use standard `fetch` with `cache: 'no-store'` in dev mode, and `revalidate` values only applied in the `next.config.ts` for production builds. **Confirm this is acceptable.**

> [!CAUTION]
> **Decision 4: `@nestjs/throttler` Installation**
> Rate limiting requires installing `@nestjs/throttler`. This is a new package not currently in `apps/api/package.json`. The plan includes this installation step.

---

## Open Questions

1. **Image serving URL in production preview:** The `cloudinaryUrl` field currently stores local paths like `/uploads/vehicles/filename.jpg`. For Phase 3, the public frontend needs to prepend the API base URL (e.g., `http://localhost:3001`) to render images. Should this be a transform in the API response or on the frontend?
   - **Recommended:** Transform in the API (add a computed `imageUrl` field in the response) so the frontend stays clean.

2. **WhatsApp Business Number:** The `.env.example` has `NEXT_PUBLIC_WHATSAPP_NUMBER=6281122334455`. Is this the correct number to use, or a placeholder?

3. **Homepage CMS Content:** The `HomepageContent` table uses a key-value JSON approach. For Phase 3, should the homepage content be seeded with default values (static copy for now), or fetched from the API and editable via CMS?
   - **Recommended:** Seed with static defaults via a Prisma seed script. CMS editing is Phase 6.

4. **Testimonial Photos:** The schema has `Testimonial` without an `avatarUrl` field. The design system shows customer avatar photos. Should we add an `avatarUrl` field to the schema, or use initials-based avatars for now?
   - **Recommended:** Use initials-based avatars for Phase 3. Adding a photo upload to testimonials is Phase 6.

5. **"About Us" & "Contact Us" pages:** The sitemap includes these pages. Should they be fully built in Phase 3 (with real content and a contact form), or just placeholder pages with static content?
   - **Recommended:** Static content pages only in Phase 3. No contact form (use the WhatsApp CTA instead).

---

## Proposed Changes

### Execution Order

The work is divided into 5 sequential streams:

```
Stream 1: Backend API     → All NestJS changes first
Stream 2: Shared Types    → TypeScript interfaces
Stream 3: Utilities       → Frontend lib helpers
Stream 4: Components      → Reusable UI components
Stream 5: Pages           → Assembled routes
```

---

### Stream 1: Backend API (NestJS — `apps/api/`)

---

#### [MODIFY] [vehicles.service.ts](file:///d:/Mini-project/soulani-auto-garage/apps/api/src/vehicles/vehicles.service.ts)

Add the following methods and extend `findAll`:

- **`findBySlug(slug: string)`** — Public query by slug. Joins `images`, `salesListing`, `rentalListing`, `inspections`, `analytics`.
- **`findAll` extension** — Add to `QueryVehicleDto`: `search`, `isFeatured`, `isNewArrival`, `transmission`, `fuelType`, `minPrice`, `maxPrice`, `sort`. Joins `salesListing` + `rentalListing` in response.
- **`trackView(id: number)`** — Upserts `VehicleAnalytics.viewCount++`. Called from AnalyticsModule.

#### [MODIFY] [vehicles.controller.ts](file:///d:/Mini-project/soulani-auto-garage/apps/api/src/vehicles/vehicles.controller.ts)

Add:
- `@Public() @Get('by-slug/:slug')` — calls `findBySlug(slug)`.

#### [MODIFY] [dto/query-vehicle.dto.ts](file:///d:/Mini-project/soulani-auto-garage/apps/api/src/vehicles/dto) — [NEW file in dto/]

```typescript
// query-vehicle.dto.ts (extended)
export class QueryVehicleDto {
  page?: number;
  limit?: number;
  status?: VehicleStatus;
  type?: VehicleType;
  search?: string;         // NEW: fulltext on make+model
  isFeatured?: boolean;    // NEW
  isNewArrival?: boolean;  // NEW
  transmission?: TransmissionType; // NEW
  fuelType?: FuelType;     // NEW
  minPrice?: number;       // NEW: filter by salesListing.price
  maxPrice?: number;       // NEW
  sort?: string;           // NEW: 'price:asc' | 'price:desc' | 'newest'
}
```

---

#### [NEW] `apps/api/src/leads/leads.module.ts`
#### [NEW] `apps/api/src/leads/leads.controller.ts`
#### [NEW] `apps/api/src/leads/leads.service.ts`
#### [MODIFY] `apps/api/src/leads/dto/` — add `create-lead.dto.ts`

**`LeadsService` responsibilities:**
1. **`create(dto, ipAddress)`:**
   - Validate `vehicleId` exists and is not deleted.
   - Validate `offeredPrice` is provided when `type === MAKE_OFFER`.
   - Generate `leadReferenceId` using format `LD-{YEAR}-{RANDOM_5_ALPHANUM}`.
   - `prisma.lead.create(...)` with `status: NEW`.
   - Async: `prisma.vehicleAnalytics.upsert({ increment: inquiryCount/offerCount })`.
   - Build and return WhatsApp redirect URL.
   - Audit log the new lead (no user ID — public action, `userId: null`).

2. **`buildWhatsAppUrl(lead, vehicle)`** — Private helper building the Indonesian WhatsApp pre-filled message:
   ```
   Halo Admin Soulani Auto Garage.
   Nama saya: {customerName}.
   No. HP: {customerPhone}.
   Saya tertarik dengan: {make} {model} ({year}).
   Jenis Pertanyaan: {inquiryType}.
   [IF MAKE_OFFER]: Penawaran saya: Rp {offeredPrice}.
   [IF message]: Pesan: {message}.
   Ref ID: {leadReferenceId}.
   ```

**`LeadsController`:**
- `@Public() @Post()` — Rate limited via `@Throttle()`. Returns `{ leadReferenceId, whatsappRedirectUrl }`.
- `@Get()`, `@Get(':id')`, `@Put(':id/assign')`, `@Post('bulk-assign')` — Protected, for Phase 5 CRM.

**`CreateLeadDto` validation:**
```typescript
vehicleId: number (required)
type: LeadType (required)
customerName: string (required, min 2, max 100, trim)
customerPhone: string (required, matches Indonesian phone regex)
customerEmail?: string (optional, email format)
offeredPrice?: Decimal (conditional: required if type === MAKE_OFFER, must be > 0)
message?: string (optional, max 500 chars)
source?: LeadSource (optional, defaults to ORGANIC)
```

---

#### [NEW] `apps/api/src/analytics/analytics.module.ts`
#### [NEW] `apps/api/src/analytics/analytics.controller.ts`
#### [NEW] `apps/api/src/analytics/analytics.service.ts`

**Phase 3 scope (limited):**
- `@Public() @Post('vehicles/:id/track-view')` — Rate limited (10/IP/min). Upserts `VehicleAnalytics`, increments `viewCount`. Returns `{ success: true }`.
- Other analytics endpoints (dashboard, per-vehicle breakdown) → Phase 6.

---

#### [MODIFY] `apps/api/src/app.module.ts`

Register new modules:
```typescript
imports: [
  // ...existing
  ThrottlerModule.forRoot([{ ttl: 3600000, limit: 5 }]), // Global: 5/hour default
  LeadsModule,
  AnalyticsModule,
]
```

> [!NOTE]
> `ThrottlerModule` from `@nestjs/throttler` must be installed: `pnpm add @nestjs/throttler`

---

### Stream 2: Shared TypeScript Types (`apps/web/src/types/`)

---

#### [NEW] `apps/web/src/types/api.types.ts`

Define all interfaces used across public and admin pages:

```typescript
// Enums (mirror Prisma enums)
export type VehicleType = 'SALE' | 'RENTAL' | 'BOTH';
export type VehicleStatus = 'AVAILABLE' | 'SOLD' | 'RENTED' | 'MAINTENANCE';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'CVT';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type LeadType = 'SALES_INQUIRY' | 'TEST_DRIVE_REQUEST' | 'MAKE_OFFER' | 'RENTAL_INQUIRY' | 'LONG_TERM_QUOTE';
export type LeadSource = 'ORGANIC' | 'GOOGLE_ADS' | 'FACEBOOK' | 'INSTAGRAM' | 'DIRECT' | 'WHATSAPP' | 'REFERRAL';
export type InspectionStatus = 'PASS' | 'FAIL' | 'NEEDS_ATTENTION';

// Core Entities
export interface VehicleImage { id, vehicleId, cloudinaryUrl, isPrimary, sortOrder }
export interface VehicleInspection { id, vehicleId, inspectionDate, inspectorName, engineStatus, transmissionStatus, suspensionStatus, electricalStatus, acStatus, tiresStatus, interiorStatus, exteriorStatus, generalNotes }
export interface SalesListing { id, vehicleId, price, previousOwners }
export interface RentalListing { id, vehicleId, dailyRate, weeklyRate, depositAmount, isLongTermEligible }
export interface Vehicle { id, slug, make, model, year, color, type, status, isFeatured, isNewArrival, mileage, transmission, fuelType, description, metaTitle, metaDescription, images, salesListing, rentalListing, inspections }
export interface Testimonial { id, authorName, authorTitle, rating, quoteText }

// Lead Flow
export interface CreateLeadPayload { vehicleId, type, customerName, customerPhone, customerEmail?, offeredPrice?, message?, source? }
export interface CreateLeadResponse { leadReferenceId: string, whatsappRedirectUrl: string }

// Pagination
export interface PaginatedResponse<T> { data: T[], meta: { total, page, limit, totalPages } }
```

---

### Stream 3: Frontend Utilities (`apps/web/src/lib/`)

---

#### [NEW] `apps/web/src/lib/utils.ts`

```typescript
// IDR currency formatter
export function formatIDR(amount: number | string): string
  // → "Rp 850.000.000" (Indonesian locale, no decimals for whole numbers)

// Abbreviate large IDR amounts for cards
export function formatIDRShort(amount: number): string
  // → "Rp 850 Juta" | "Rp 1,2 M"

// Mileage formatter
export function formatMileage(km: number): string
  // → "12.500 km"

// Transmission display name
export function getTransmissionLabel(t: TransmissionType): string
  // → "Otomatis" | "Manual" | "CVT"

// Fuel type display name
export function getFuelLabel(f: FuelType): string
  // → "Bensin" | "Diesel" | "Hybrid" | "Listrik"

// Inspection status color/label
export function getInspectionStatusLabel(s: InspectionStatus): { label: string, color: string }
```

#### [NEW] `apps/web/src/lib/whatsapp.ts`

```typescript
export function buildWhatsAppUrl(phoneNumber: string, message: string): string
  // Encodes message, returns wa.me URL

export function buildContactUrl(phoneNumber: string, vehicleName?: string): string
  // Generic "Chat with us about {vehicleName}" URL
```

#### [NEW] `apps/web/src/lib/images.ts`

```typescript
// Prepend API base URL to local image paths
export function resolveImageUrl(cloudinaryUrl: string): string
  // /uploads/vehicles/abc.jpg → http://localhost:3001/uploads/vehicles/abc.jpg
  // In production, this will handle Cloudinary URLs directly (no-op)
```

#### [MODIFY] `apps/web/src/lib/api.ts`

Add typed helper functions for public endpoints:

```typescript
// Vehicle queries
export async function getVehicles(params: VehicleQueryParams): Promise<PaginatedResponse<Vehicle>>
export async function getVehicleBySlug(slug: string): Promise<Vehicle>
export async function getFeaturedVehicles(limit?: number): Promise<Vehicle[]>

// Lead submission
export async function submitLead(payload: CreateLeadPayload): Promise<CreateLeadResponse>

// Analytics
export async function trackVehicleView(vehicleId: number): Promise<void>

// CMS / Testimonials
export async function getTestimonials(): Promise<Testimonial[]>
```

---

### Stream 4: UI Components

---

#### Shared / Layout Components (`apps/web/src/components/shared/`)

| File | Description |
|---|---|
| `Navbar.tsx` | Sticky top nav: Logo, "Beli Mobil" link, "Sewa Mobil" link, "Tentang Kami" link, WhatsApp button. Mobile: hamburger menu. |
| `Footer.tsx` | Logo, tagline, nav links, social icons, copyright. |
| `WhatsAppFAB.tsx` | Floating WhatsApp button (bottom-right). Green bg, "Chat Sekarang" label on desktop, icon-only on mobile. Pulse animation. |
| `SkeletonCard.tsx` | Skeleton loader for VehicleCard (shimmer animation). |
| `Breadcrumb.tsx` | Breadcrumb trail: Home > Beli Mobil > Toyota Alphard. |
| `SectionHeader.tsx` | Reusable section title + subtitle + optional "View All" link. |
| `EmptyState.tsx` | Illustrated empty state for search results with 0 hits. |
| `ErrorBoundary.tsx` | Client-side error boundary with retry button. |

**Navbar details:**
- Desktop: Logo left, nav center, WhatsApp CTA right.
- Mobile: Logo + hamburger. Slide-in drawer menu.
- Active link highlight uses `usePathname()`.
- No auth state shown on public navbar (admin login is a separate route).

---

#### Vehicle Components (`apps/web/src/components/vehicles/`)

| File | Description |
|---|---|
| `VehicleCard.tsx` | The core listing card. Props: vehicle, type ('sale'/'rental'). Shows: primary image, make+model+year, mileage, transmission, price (IDR), badges (Featured, New Arrival, Long-Term Available). Hover: -translate-y-1 + shadow. |
| `VehicleGrid.tsx` | Responsive grid wrapper (1 col mobile, 2 col tablet, 3 col desktop). Accepts `vehicles[]` and `loading` prop. Shows SkeletonCard when loading. |
| `VehicleFilters.tsx` | Left sidebar filter panel. Desktop: always visible. Mobile: slide-in bottom sheet triggered by "Filter" button. Controls: make/model search, price range slider, body type checkboxes, transmission, fuel type, sort selector. |
| `VehicleGallery.tsx` | Full-width image carousel for VDP. Swipeable on mobile. Thumbnail strip below. Lightbox on click. Counter badge ("3 / 12"). |
| `VehicleSpecGrid.tsx` | Specs table: Year, Mileage, Transmission, Fuel, Color, Previous Owners. Icon + label + value pairs. |
| `InspectionReportCard.tsx` | 8-point inspection summary. Each item shows name + status badge (Pass=green, Fail=red, Needs Attention=amber). "Inspected on {date} by {inspector}" footer. Accordion-style: collapsed by default, expand to see full report. |
| `VehicleBadge.tsx` | Pill-shaped badges: "Featured", "New Arrival", "Long-Term Available", "150-Point Inspected". Each with distinct color. |
| `PriceDisplay.tsx` | Shows formatted IDR price prominently. For sales: "Rp 850.000.000". For rental: "Rp 1.200.000 / hari". |

---

#### Lead Components (`apps/web/src/components/leads/`)

| File | Description |
|---|---|
| `InquiryForm.tsx` | The critical CRM lead capture form. Fields: Name*, Phone*, Email (optional), Inquiry Type dropdown*, Offered Price (conditional, only shown if type = MAKE_OFFER), Message (optional textarea). Submit calls `POST /leads`, receives WhatsApp URL, redirects browser. Shows loading state during submission. Shows success state briefly before redirect. |
| `InquirySheet.tsx` | Mobile wrapper: renders InquiryForm inside a bottom drawer (slide-up sheet). Triggered by "Kirim Pertanyaan" sticky bar. |
| `InquiryModal.tsx` | Desktop wrapper: renders InquiryForm inside a centered modal dialog. |
| `LeadSuccessState.tsx` | Post-submission success animation. "Pertanyaan Anda Diterima! Ref: LD-2026-XXXXX. Mengalihkan ke WhatsApp..." with a checkmark bounce animation (300ms). Auto-redirects after 1.5s. |

**InquiryForm UX Logic:**
1. User fills form. React Hook Form + Zod validation.
2. On submit → `POST /leads` API call.
3. On success: display `LeadSuccessState` with ref ID for 1.5 seconds.
4. After 1.5s: `window.open(whatsappRedirectUrl, '_blank')` to open WhatsApp.
5. On error: display SweetAlert with error message (network error, rate limited, etc.).
6. The `offeredPrice` field appears/disappears with a smooth `framer-motion` or CSS transition when `type` changes to/from `MAKE_OFFER`.

---

### Stream 5: Pages (`apps/web/src/app/(public)/`)

---

#### [MODIFY] `apps/web/src/app/(public)/layout.tsx`

```tsx
// Wraps all public pages with Navbar + Footer + WhatsAppFAB
// Minimal: no auth required, no Zustand usage
export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFAB />
    </>
  );
}
```

---

#### [NEW] `apps/web/src/app/(public)/page.tsx` — Homepage

**Rendering Strategy:** SSG + ISR (`revalidate: 3600`)

**Homepage Sections (top to bottom):**

1. **Hero Section**
   - Headline: "Temukan Mobil Impian Anda"
   - Sub-headline: "Beli atau sewa mobil dengan jaminan inspeksi 150 titik"
   - Search bar: `make/model` text input + "Semua Harga" dropdown + "CARI" button
   - Quick-filter pills: "SUV", "MPV", "Hatchback", "Sedan", "Di bawah 200 Juta"
   - Background: brand blue gradient or lifestyle image (generate with image tool if no real photo)

2. **Trust Badges Strip**
   - ✓ Inspeksi 150 Titik
   - ✓ 5 Hari Uang Kembali  
   - ✓ Garansi 1 Tahun
   Rendered as 3-column horizontal strip with icons.

3. **Browse by Body Type**
   - SVG icons for: SUV, MPV, Hatchback, Sedan, Premium
   - Click → navigate to `/sales?bodyType=SUV`

4. **Featured Inventory Grid**
   - Section title: "Pilihan Terbaik Kami"
   - `GET /vehicles?isFeatured=true&type=sale&limit=8`
   - `<VehicleGrid>` with `<VehicleCard>` components
   - "Lihat Semua Mobil →" link to `/sales`

5. **New Arrivals Grid**
   - Section title: "Baru Masuk"
   - `GET /vehicles?isNewArrival=true&type=sale&limit=4`

6. **Testimonials Strip**
   - `GET /testimonials` (published only)
   - Horizontal scrollable card row on mobile, 3-column grid on desktop
   - Each card: avatar (initials), name, title, star rating, quote text

7. **WhatsApp CTA Banner**
   - Dark blue/brand section. Headline: "Ada pertanyaan? Chat langsung dengan kami."
   - Large WhatsApp button.

**SEO Metadata (via `generateMetadata`):**
```typescript
export const metadata = {
  title: 'Soulani Auto Garage — Beli & Sewa Mobil Terpercaya',
  description: 'Platform jual beli dan sewa mobil terpercaya di Indonesia. Setiap mobil diinspeksi 150 titik. Proses cepat & transparan.',
  openGraph: { title, description, images: ['/og-homepage.jpg'] }
}
```

---

#### [NEW] `apps/web/src/app/(public)/sales/page.tsx` — Sales Listing

**Rendering Strategy:** SSG + ISR (`revalidate: 1800`)

**Layout:** 2-column split: left filters sidebar (desktop), vehicle grid (right).

**Data fetching:**
- Read URL search params (`?search=`, `?type=`, `?transmission=`, `?sort=`, `?page=`)
- Fetch `GET /vehicles?type=SALE&...params`

**Filter Sidebar (`VehicleFilters` component):**
- Make/Model text search
- Price range: Rp 0 — Rp 2.000.000.000 (slider or dual input)
- Transmission: Otomatis, Manual, CVT (checkbox)
- Fuel type: Bensin, Diesel, Hybrid, Listrik (checkbox)
- Sort: "Terbaru", "Harga Terendah", "Harga Tertinggi"

**Active filter chips:** Show as dismissable pills above grid ("Hatchback ×", "Otomatis ×").

**Pagination:** Page number buttons + "Prev / Next" at bottom of grid.

**URL sync:** All filters write to `?search=...&transmission=...` via `useRouter().replace()`. On filter change, grid re-fetches (client-side via SWR or React Query).

**SEO Metadata:**
```typescript
title: 'Mobil Bekas Dijual — Soulani Auto Garage',
description: 'Temukan ratusan mobil bekas berkualitas dengan inspeksi 150 titik.'
```

---

#### [NEW] `apps/web/src/app/(public)/sales/[slug]/page.tsx` — Vehicle Detail (Sales)

**Rendering Strategy:** SSG with `generateStaticParams` + ISR (`revalidate: 1800`)

```typescript
export async function generateStaticParams() {
  const { data: vehicles } = await getVehicles({ type: 'SALE', limit: 100 });
  return vehicles.map(v => ({ slug: v.slug }));
}
```

**Page Structure (Desktop: 2-column, Mobile: stacked):**

**Left column (60%):**
- `<VehicleGallery>` — full image carousel
- `<VehicleSpecGrid>` — year, mileage, transmission, fuel, color
- `<InspectionReportCard>` — 8-point inspection (if inspection data exists)
- Vehicle description text (markdown-ready with `white-space: pre-wrap`)
- "Bagikan Mobil Ini" share buttons (WhatsApp share, copy link)

**Right column (40%) — Sticky on desktop:**
- `<PriceDisplay>` — price in IDR, bold
- `<VehicleBadge>` chips (Featured, New Arrival, 150-Point Inspected)
- `<InquiryForm>` (desktop: inline) / Sticky bottom bar → `<InquirySheet>` (mobile)
- Previous owners info
- "Chat Langsung" WhatsApp button (green, secondary CTA)

**Mobile Sticky Bottom Bar:**
```
[Rp 850.000.000]    [KIRIM PERTANYAAN (Blue)]
```
Tapping "KIRIM PERTANYAAN" opens the `<InquirySheet>` bottom drawer.

**View Tracking:**
```typescript
// Client component that fires on mount
useEffect(() => {
  trackVehicleView(vehicle.id); // fire and forget
}, [vehicle.id]);
```

**SEO Metadata (dynamic):**
```typescript
export async function generateMetadata({ params }) {
  const vehicle = await getVehicleBySlug(params.slug);
  return {
    title: `${vehicle.make} ${vehicle.model} ${vehicle.year} — Soulani Auto Garage`,
    description: vehicle.metaDescription || `Beli ${vehicle.make} ${vehicle.model} ${vehicle.year} dengan inspeksi 150 titik. Harga: ${formatIDR(vehicle.salesListing.price)}`,
    openGraph: {
      images: [vehicle.images.find(i => i.isPrimary)?.cloudinaryUrl]
    }
  }
}
```

**404 Handling:** If `getVehicleBySlug` returns 404, call `notFound()` from Next.js.

---

#### [NEW] `apps/web/src/app/(public)/tentang-kami/page.tsx` — About Us (Static)

Simple static page. No API calls.

**Sections:**
- Hero: "Tentang Soulani Auto Garage" + brand story paragraph
- Mission statement cards (3 pillars: Transparency, Quality, Speed)
- Showroom info (address, hours)
- WhatsApp CTA

**SEO Metadata:**
```typescript
title: 'Tentang Kami — Soulani Auto Garage'
description: 'Kenali Soulani Auto Garage, platform jual beli dan sewa mobil terpercaya di Indonesia.'
```

---

#### [NEW] `apps/web/src/app/(public)/kontak/page.tsx` — Contact (Static)

Static page. No form submission in Phase 3 (just display contact info).

**Content:**
- Address, phone, email
- Business hours
- Embedded Google Maps iframe (static URL, no API key needed)
- WhatsApp button (primary CTA)

---

### SEO Architecture

| Page | Strategy | Revalidate | Key Tags |
|---|---|---|---|
| Homepage | SSG + ISR | 3600s | title, og:image, structured data (LocalBusiness) |
| Sales Listing | Client-side | — | title (dynamic based on filters), noindex for filter pages |
| Vehicle Detail | SSG + ISR | 1800s | title, description, og:image, og:type:product, JSON-LD |
| About Us | SSG | Static | title, description |
| Contact | SSG | Static | title, description, LocalBusiness JSON-LD |

**JSON-LD Schema for Vehicle Detail:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Toyota Alphard 2022",
  "description": "...",
  "image": ["..."],
  "offers": {
    "@type": "Offer",
    "price": "850000000",
    "priceCurrency": "IDR",
    "availability": "https://schema.org/InStock"
  }
}
```

---

### WhatsApp Redirect Logic (Detailed)

**Trigger points:**
1. After `POST /leads` → `whatsappRedirectUrl` from API response
2. "Chat Langsung" button on VDP → generic vehicle inquiry URL (no lead created)
3. `WhatsAppFAB` → generic "Halo, saya ingin bertanya tentang mobil" URL
4. Homepage CTA banner → generic URL

**URL construction (frontend `lib/whatsapp.ts`):**
```typescript
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // e.g., "6281122334455"

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildVehicleWhatsAppUrl(vehicle: Vehicle): string {
  const msg = `Halo Admin Soulani Auto Garage, saya ingin bertanya tentang ${vehicle.make} ${vehicle.model} ${vehicle.year}.`;
  return buildWhatsAppUrl(msg);
}
```

**URL construction (backend `leads.service.ts`):**
The backend builds the full pre-filled message with Ref ID included (as documented in API spec). Frontend only uses the URL returned from `POST /leads` response.

---

### Database Impact

No new migrations required for Phase 3. All tables (`leads`, `vehicle_analytics`) already exist in `schema.prisma`. Only data is being written for the first time.

**Seed data needed (for testing):**
- At least 3 published `Testimonial` records
- `HomepageContent` with key `featured_hero` for the homepage hero section
- `VehicleAnalytics` rows will be created on first view (upsert pattern)

---

### Rate Limiting Configuration

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  { name: 'short', ttl: 60000, limit: 10 },  // 10/min (for track-view)
  { name: 'medium', ttl: 3600000, limit: 5 }, // 5/hour (for leads, bookings)
])

// leads.controller.ts
@Throttle({ medium: { ttl: 3600000, limit: 10 } })
@Public()
@Post()
create(@Body() dto: CreateLeadDto, @Ip() ip: string) { ... }

// analytics.controller.ts
@Throttle({ short: { ttl: 60000, limit: 10 } })
@Public()
@Post('vehicles/:id/track-view')
trackView(@Param('id') id: string) { ... }
```

---

## Verification Plan

### Backend API Tests

| Endpoint | Test Case |
|---|---|
| `GET /vehicles?type=SALE&isFeatured=true` | Returns only featured sale vehicles with images + salesListing |
| `GET /vehicles/by-slug/:slug` | Returns full vehicle with all relations; 404 for invalid slug |
| `POST /leads` (MAKE_OFFER) | Creates lead, returns reference ID + WhatsApp URL |
| `POST /leads` (MAKE_OFFER, no offeredPrice) | Returns 400 validation error |
| `POST /leads` (invalid vehicleId) | Returns 404 |
| `POST /leads` (6th request same IP) | Returns 429 Too Many Requests |
| `POST /analytics/vehicles/:id/track-view` | Increments viewCount in VehicleAnalytics |

### Frontend Smoke Tests

| Page | Verify |
|---|---|
| Homepage (`/`) | Loads without error, featured vehicles appear, testimonials appear |
| Sales listing (`/sales`) | Grid renders, filters update URL params, search works |
| Vehicle detail (`/sales/[slug]`) | Gallery loads, inquiry form submits, WhatsApp redirect opens |
| Mobile VDP | Sticky bottom bar visible, inquiry sheet opens on tap |
| Lead submission | Form validates client-side before submission |
| 404 page | Navigate to `/sales/non-existent-slug` → shows not-found page |

### SEO Validation

- Run `next build` and verify all public pages have correct `<title>` and `<meta description>` tags
- Verify JSON-LD schema is present on vehicle detail pages
- Use browser DevTools → "Inspect" to verify OG tags for social sharing

### Manual QA Checklist

- [ ] Homepage hero search navigates to `/sales?search=Toyota`
- [ ] Body type filter pills navigate correctly
- [ ] Sales listing filters are reflected in URL
- [ ] VehicleCard hover state works (shadow + lift)
- [ ] InquiryForm shows/hides `offeredPrice` field based on type selection
- [ ] After submitting inquiry: success message with Ref ID appears
- [ ] After 1.5s: WhatsApp opens in new tab with pre-filled message
- [ ] WhatsApp FAB is visible on all public pages
- [ ] Mobile: sticky bottom bar on VDP works
- [ ] Mobile: inquiry sheet slides up smoothly
- [ ] Breadcrumb is correct on all pages
- [ ] 404 page shown for invalid vehicle slug

---

## File Creation Summary

### New Backend Files (9 files)
- `apps/api/src/leads/leads.module.ts`
- `apps/api/src/leads/leads.controller.ts`
- `apps/api/src/leads/leads.service.ts`
- `apps/api/src/leads/dto/create-lead.dto.ts`
- `apps/api/src/analytics/analytics.module.ts`
- `apps/api/src/analytics/analytics.controller.ts`
- `apps/api/src/analytics/analytics.service.ts`

### Modified Backend Files (3 files)
- `apps/api/src/vehicles/vehicles.service.ts` (extend findAll, add findBySlug, trackView)
- `apps/api/src/vehicles/vehicles.controller.ts` (add by-slug endpoint)
- `apps/api/src/vehicles/dto/query-vehicle.dto.ts` (extend with new filters)
- `apps/api/src/app.module.ts` (register LeadsModule, AnalyticsModule, ThrottlerModule)

### New Frontend Files (32 files)
**Types:**
- `apps/web/src/types/api.types.ts`

**Lib:**
- `apps/web/src/lib/utils.ts`
- `apps/web/src/lib/whatsapp.ts`
- `apps/web/src/lib/images.ts`

**Shared Components (8):**
- `apps/web/src/components/shared/Navbar.tsx`
- `apps/web/src/components/shared/Footer.tsx`
- `apps/web/src/components/shared/WhatsAppFAB.tsx`
- `apps/web/src/components/shared/SkeletonCard.tsx`
- `apps/web/src/components/shared/Breadcrumb.tsx`
- `apps/web/src/components/shared/SectionHeader.tsx`
- `apps/web/src/components/shared/EmptyState.tsx`
- `apps/web/src/components/shared/ErrorBoundary.tsx`

**Vehicle Components (8):**
- `apps/web/src/components/vehicles/VehicleCard.tsx`
- `apps/web/src/components/vehicles/VehicleGrid.tsx`
- `apps/web/src/components/vehicles/VehicleFilters.tsx`
- `apps/web/src/components/vehicles/VehicleGallery.tsx`
- `apps/web/src/components/vehicles/VehicleSpecGrid.tsx`
- `apps/web/src/components/vehicles/InspectionReportCard.tsx`
- `apps/web/src/components/vehicles/VehicleBadge.tsx`
- `apps/web/src/components/vehicles/PriceDisplay.tsx`

**Lead Components (4):**
- `apps/web/src/components/leads/InquiryForm.tsx`
- `apps/web/src/components/leads/InquirySheet.tsx`
- `apps/web/src/components/leads/InquiryModal.tsx`
- `apps/web/src/components/leads/LeadSuccessState.tsx`

**Pages (6):**
- `apps/web/src/app/(public)/layout.tsx`
- `apps/web/src/app/(public)/page.tsx` (Homepage)
- `apps/web/src/app/(public)/sales/page.tsx` (Sales Listing)
- `apps/web/src/app/(public)/sales/[slug]/page.tsx` (Vehicle Detail)
- `apps/web/src/app/(public)/tentang-kami/page.tsx` (About)
- `apps/web/src/app/(public)/kontak/page.tsx` (Contact)

---

## Dependencies to Install

```bash
# Backend
pnpm add @nestjs/throttler --filter=api

# Frontend (check if already installed)
pnpm add react-hook-form zod @hookform/resolvers --filter=web
pnpm add lucide-react --filter=web  # likely already installed via admin
```

> [!TIP]
> `react-hook-form`, `zod`, and `lucide-react` may already be installed from admin UI work in Phase 2. Verify before adding.
