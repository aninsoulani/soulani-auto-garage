# Technical Architecture Document
# Soulani Auto Garage Platform

**Version:** 2.0.0
**Stack:** Next.js 15 · NestJS · Prisma · MySQL · Local File Storage (Multer) · Vercel · Railway
**Market:** Indonesia (Currency: IDR)
**Status:** Phase 3 Complete — Phase 4 (Rental Flow) In Development

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL CLIENTS                            │
│         Browser (Desktop) ◄──────────────► Browser (Mobile)        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────┐
│                     FRONTEND LAYER (Vercel)                         │
│              Next.js 15 + TypeScript + Tailwind v4 + Shadcn UI     │
│                                                                     │
│   /public (SSG)  ──  /admin (CSR/Protected)  ──  /api/route (RSC)  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST (HTTPS / JSON)
┌───────────────────────────────▼─────────────────────────────────────┐
│                     BACKEND LAYER (Railway)                         │
│                   NestJS API  ·  Base URL: /api/v1                  │
│                                                                     │
│  AuthModule · VehiclesModule · ListingsModule · LeadsModule         │
│  BookingsModule · InspectionModule · CmsModule                      │
│  AnalyticsModule · UsersModule · TestimonialsModule                 │
└────────────┬─────────────────────────────────┬──────────────────────┘
             │ Prisma ORM (MySQL protocol)      │ Local Disk FS
┌────────────▼─────────┐            ┌───────────▼─────────────────────┐
│   DATABASE (Railway)  │            │   LOCAL FILE STORAGE (Disk)     │
│   MySQL 8.x          │            │   apps/api/uploads/vehicles/    │
│   Prisma Migrations  │            │   apps/api/uploads/licenses/    │
└──────────────────────┘            │   apps/api/uploads/testimonials/│
                                    └─────────────────────────────────┘
```

### Data Flow Summary

| Flow | Direction |
|---|---|
| Public page load (SSG) | CDN → Vercel → Next.js static page |
| Vehicle list (RSC) | Browser → Next.js Server Component → NestJS API → MySQL |
| Lead submission | Browser → NestJS API → MySQL → WhatsApp URL response |
| Image upload | Browser → NestJS (Multer saves to disk) → NestJS (saves relative path) |
| Admin dashboard | Browser → Next.js Client Component → NestJS API (JWT-protected) |

---

## 2. Frontend Architecture

### Next.js 15 Folder Structure (As Implemented)

```
apps/web/
└── src/
    ├── app/
    │   ├── (public)/                     # Route group: public pages (no auth required)
    │   │   ├── page.tsx                  # Homepage (SSG + ISR, revalidate: 3600s)
    │   │   ├── layout.tsx                # Public layout: Navbar + Footer + WhatsAppFAB
    │   │   ├── _components/              # Page-local components (e.g., HeroSearchBar)
    │   │   ├── sales/
    │   │   │   ├── page.tsx              # Sales Listing ('use client', URL-sync filters)
    │   │   │   └── [slug]/
    │   │   │       ├── page.tsx          # Vehicle Detail (SSG + ISR, revalidate: 1800s)
    │   │   │       └── _components/      # ViewTracker (client), VehicleCTA (client)
    │   │   ├── tentang-kami/page.tsx     # About Us (static, CMS-ready Phase 6)
    │   │   └── kontak/page.tsx           # Contact (static, CMS-ready Phase 6)
    │   ├── (admin)/                      # Route group: protected admin
    │   │   └── admin/
    │   │       ├── layout.tsx            # AdminLayout — enforces JWT + role check
    │   │       ├── dashboard/page.tsx    # Analytics overview
    │   │       └── inventory/            # Vehicle list, add, edit pages
    │   ├── login/page.tsx                # Auth page (outside both route groups)
    │   ├── layout.tsx                    # Root layout (font variables, globals.css import)
    │   └── globals.css                   # Tailwind v4 + Shadcn tokens (oklch color space)
    ├── components/
    │   ├── ui/                           # Shadcn base components (base-vega style, stone base)
    │   ├── vehicles/                     # VehicleCard, VehicleGallery, VehicleBadge,
    │   │                                 # InspectionReportCard, VehicleFilters, VehicleGrid,
    │   │                                 # VehicleSpecGrid, PriceDisplay
    │   ├── leads/                        # InquiryForm, InquirySheet, InquiryModal, LeadSuccessState
    │   ├── rental/                       # BookingWidget, DatePicker, LongTermBanner (Phase 4)
    │   ├── admin/                        # DataTable, StatsCard, KanbanBoard
    │   └── shared/                       # Navbar, Footer, WhatsAppFAB, SkeletonCard,
    │                                     # Breadcrumb, EmptyState, SectionHeader
    ├── lib/
    │   ├── api.ts                        # Typed fetch client (base URL, 401 session expiry handler, SweetAlert2)
    │   ├── whatsapp.ts                   # buildVehicleWhatsAppUrl(), buildGenericWhatsAppUrl()
    │   ├── images.ts                     # Image URL helper utilities
    │   └── utils.ts                      # formatIDR, vehicleDisplayName, LEAD_TYPE_LABELS,
    │                                     # getInitials, getAvatarColor, cn (tailwind-merge)
    ├── hooks/
    ├── store/
    │   └── auth.store.ts                 # Zustand — accessToken, user, role
    └── types/
        └── api.types.ts                  # TypeScript interfaces (mirrors schema.prisma)
```

### App Router Strategy

| Segment | Strategy | Rationale |
|---|---|---|
| Homepage | SSG with ISR (revalidate: 3600s) | Fast CDN delivery; content refreshes hourly |
| Sales Listing | CSR (`'use client'`) | Requires dynamic URL-synchronized filter state |
| Vehicle Detail (slug) | SSG + ISR (revalidate: 1800s) | Per-vehicle SEO page; fetches via `generateStaticParams` |
| Admin routes | CSR (Client-Side Rendering) | Fully behind JWT; no SEO requirement |
| Auth page | CSR | Login form with client state |

> [!NOTE]
> In local development, Next.js does not execute ISR revalidation. All API fetches use `cache: 'no-store'` in development to ensure fresh data. The `revalidate` values only apply to production builds on Vercel.

### Server vs Client Components

```
Server Components (RSC)               Client Components ('use client')
─────────────────────────────────     ──────────────────────────────────
- Homepage (parallel data fetching)   - Sales Listing page (filter state + URL sync)
- Vehicle Detail page shell           - InquiryForm (state + Zod validation + submission)
- SEO metadata generation             - InquirySheet (mobile bottom sheet)
- About / Contact pages               - AdminDataTable (sorting/filtering)
                                      - VehicleCTA (desktop inline + mobile sticky bar)
                                      - VehicleGallery (image carousel, client interactions)
                                      - ViewTracker (fires analytics on mount)
                                      - Navbar (auth state display)
                                      - HeroSearchBar (search input state)
```

### State Management Strategy

- **Auth State:** Zustand (`auth.store.ts`). Stores `accessToken`, `refreshToken`, `user`, `role`. On `401`, triggers SweetAlert2 dialog then redirects to `/login`.
- **Filter State (Sales Page):** Local `useState` synchronized bidirectionally with URL query parameters via `useSearchParams` and `router.replace`. Params: `search`, `carType`, `transmission`, `fuelType`, `minPrice`, `maxPrice`, `sort`, `isFeatured`, `isNewArrival`.
- **Form State:** React Hook Form + Zod validation (mirrors DTO validation on the client).
- **UI State:** Local `useState` / `useReducer` for modals, drawers, sheets.

### Font System

```typescript
// apps/web/src/app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono, Instrument_Sans, Figtree } from 'next/font/google';

const figtreeHeading = Figtree({ subsets: ['latin'], variable: '--font-heading' });
const instrumentSans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jakartaSans = Plus_Jakarta_Sans({ variable: '--font-jakarta-sans', subsets: ['latin'], weight: ['300','400','500','600','700','800'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-jetbrains-mono', subsets: ['latin'] });
```

| Variable | Font | Use |
|---|---|---|
| `--font-heading` | Figtree | Section headings, hero titles |
| `--font-sans` | Instrument Sans | Body text, UI labels, form inputs |
| `--font-jakarta-sans` | Plus Jakarta Sans | Available for data-dense admin contexts |
| `--font-jetbrains-mono` | JetBrains Mono | Code/monospace display |

### Protected Route Strategy

```typescript
// apps/web/src/app/(admin)/admin/layout.tsx — Client Component
// Reads auth state from Zustand; redirects to /login if no valid session.
// Role-based tab/section rendering enforced client-side via useRBAC hook.
```

---

## 3. Backend Architecture

### NestJS Folder Structure (As Implemented)

```
apps/api/
├── src/
│   ├── main.ts                       # Bootstrap: helmet (crossOriginResourcePolicy), CORS, ValidationPipe, URI versioning
│   ├── app.module.ts                 # Root module (ThrottlerModule global)
│   │
│   ├── auth/                         # POST /auth/login, POST /auth/refresh
│   ├── vehicles/                     # POST /vehicles (multipart), GET, PATCH, DELETE, PATCH /publish
│   ├── vehicle-images/
│   ├── vehicle-inspections/
│   ├── sales-listings/
│   ├── rental-listings/
│   ├── listings/                     # Combined public listing queries
│   ├── rental-bookings/
│   ├── blackout-dates/
│   ├── leads/                        # POST (public, rate-limited), GET, GET/:id (protected)
│   ├── lead-followups/
│   ├── testimonials/
│   ├── cms/
│   ├── analytics/
│   ├── users/
│   ├── cloudinary/                   # Reserved stub for Phase 7 migration
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ownership.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts
│   │   │   └── transform.interceptor.ts  # Wraps all responses in { statusCode, message, data }
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts       # @Public() — bypasses JwtAuthGuard
│   │   └── filters/
│   │       ├── http-exception.filter.ts
│   │       └── prisma-exception.filter.ts # Maps Prisma errors (P2002 unique, P2025 not found) to HTTP codes
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/
│   ├── vehicles/
│   ├── licenses/
│   └── testimonials/
└── test/
```

### Global Bootstrap Configuration (main.ts)

```typescript
const app = await NestFactory.create(AppModule);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }  // Allows Next.js to serve local uploads
}));
app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' });
app.setGlobalPrefix('api');
app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor());
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

await app.listen(process.env.PORT || 3001);
```

---

## 4. Authentication & Authorization

### Login Flow

```
Client                    NestJS API                   MySQL
  │                           │                           │
  │──POST /auth/login─────────►                           │
  │   { email, password }     │                           │
  │                           │──SELECT user WHERE email──►
  │                           │◄─────────────── user row─┤
  │                           │── bcrypt.compare()        │
  │                           │── sign accessToken (15m)  │
  │                           │── sign refreshToken (7d)  │
  │                           │── store refreshToken hash─►
  │◄── 200 { accessToken,     │                           │
  │    refreshToken, user }───│                           │
```

### JWT Lifecycle

| Token | Location | TTL | Storage |
|---|---|---|---|
| Access Token | Authorization: Bearer header | 15 minutes | Zustand (memory) |
| Refresh Token | HttpOnly Secure Cookie | 7 days | Hashed in `users.refresh_token_hash` |

### RBAC Permissions Matrix

| Resource | Super Admin | Sales Staff | Rental Staff | Public |
|---|---|---|---|---|
| Vehicles (Read, Active) | ✅ | ✅ | ✅ | ✅ |
| Vehicles (Read, Draft) | ✅ | ✅ | ❌ | ❌ |
| Vehicles (Write/Create) | ✅ | ✅ | ❌ | ❌ |
| Vehicles (Publish) | ✅ | ✅ | ❌ | ❌ |
| Inspections | ✅ | ✅ | ❌ | ❌ |
| Sales Listings | ✅ | ✅ | ❌ | ✅ (Read) |
| Rental Listings | ✅ | ❌ | ✅ | ✅ (Read) |
| Leads (Own) | ✅ (All) | ✅ (Assigned) | ❌ | ❌ |
| Lead Assignment | ✅ | ❌ | ❌ | ❌ |
| Lead Submission | ❌ | ❌ | ❌ | ✅ (Create) |
| Rental Bookings | ✅ | ❌ | ✅ | ✅ (Create) |
| Blackout Dates | ✅ | ❌ | ✅ | ❌ |
| Users/Staff Mgmt | ✅ | ❌ | ❌ | ❌ |
| Analytics Dashboard | ✅ | ❌ | ❌ | ❌ |
| CMS / Testimonials | ✅ | ❌ | ❌ | ✅ (Read) |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 5. Local File Storage Architecture

### File Upload Flow (Vehicle Creation)

```
Admin Browser           NestJS API (VehiclesController)     Local Disk
    │                           │                               │
    │─ POST /vehicles ──────────►                               │
    │  multipart/form-data      │                               │
    │  { data: JSON string,     │── FilesInterceptor (Multer)──►│
    │    files: [img1, img2] }  │   validates: ext + size       │
    │                           │   saves: uploads/vehicles/    │
    │                           │   filename: 32-hex-char.ext   │
    │                           │◄── file paths ────────────────┤
    │                           │── Prisma.vehicle.create()     │
    │                           │── Prisma.vehicleImage.create()│
    │◄── 201 Vehicle JSON ──────│   (for each file)             │
```

### Image Serving

- NestJS serves the `uploads/` directory as static files.
- `helmet` is configured with `crossOriginResourcePolicy: { policy: 'cross-origin' }` to allow the Next.js frontend to load images from the NestJS origin.
- The API response includes a computed `imageUrl` field (absolute URL) for each `VehicleImage`, constructed by prepending the server base URL to the stored `file_path`.

### Allowed File Types & Limits

| Rule | Value |
|---|---|
| Allowed Extensions | `.jpg`, `.jpeg`, `.png`, `.webp`, `.jfif` |
| Max File Size | 5MB per file |
| Max Files per Upload | 10 per vehicle creation request |

---

## 6. Database Architecture

### VehicleStatus State Machine

```
DRAFT ──(publish)──► ACTIVE ──(sell)──► SOLD
                       │
                       └──(maintenance)──► MAINTENANCE ──(restore)──► ACTIVE
                       │
                       └──(rent out)──► RENTED ──(return)──► ACTIVE
```

> [!IMPORTANT]
> Vehicles in `DRAFT` status are **not visible** on the public website. The public `GET /vehicles` endpoint filters out `DRAFT` records. Only `ACTIVE`, `SOLD`, and `MAINTENANCE` vehicles appear publicly (with SOLD/MAINTENANCE shown in a separate "archived" section on the listing page).

### Key Relationship Map

```
users
  ├── assigned_leads → leads (one-to-many)
  └── lead_followups → lead_followups (one-to-many)

vehicles
  ├── vehicle_images (cascade delete)
  ├── vehicle_inspections (cascade delete)
  ├── sales_listings (one-to-one, cascade delete)
  ├── rental_listings → rental_bookings (cascade)
  ├── blackout_dates (cascade delete)
  ├── leads (one-to-many)
  └── vehicle_analytics (one-to-one, cascade delete)

leads → lead_followups (cascade delete)
payment_methods → rental_bookings (one-to-many)
```

### Critical Index Strategy

| Table | Index | Purpose |
|---|---|---|
| vehicles | `(status, listing_type, deleted_at)` | Primary listing query filter |
| vehicles | `(status, is_featured, deleted_at)` | Homepage featured query |
| vehicles | `(mileage)`, `(transmission)`, `(fuel_type)` | Filter queries |
| vehicles | `FULLTEXT(make, model)` | Full-text search |
| leads | `(assigned_to_id, status, deleted_at)` | Staff CRM view |
| rental_bookings | `(rental_listing_id, status, start_date, end_date)` | Availability checking |
| blackout_dates | `(start_date, end_date)` | Conflict detection |
| audit_logs | `(module_name, record_id)` | Audit trail lookup |

### Soft Delete Strategy

All operational models include `deletedAt DateTime?`. Convention:
- **Delete:** Set `deletedAt: new Date()`
- **All queries:** Must include `where: { deletedAt: null }` via PrismaClient extension
- **Restore:** Set `deletedAt: null` via `PATCH /entity/:id/restore`

### Audit Logging Strategy

The `AuditInterceptor` fires on every mutating request (POST/PATCH/DELETE):

```typescript
await this.prisma.auditLog.create({
  data: {
    userId: request.user?.id,
    action: mapMethodToAction(request.method), // CREATE | UPDATE | DELETE | RESTORE
    moduleName: extractModuleName(request.path),
    recordId: responseData?.id,
    previousValue,  // JSON snapshot before mutation
    newValue: responseData,
    timestamp: new Date(),
  }
});
```

> [!NOTE]
> The `audit_logs` table has NO foreign key to the `users` table intentionally — this allows logs to be archived or exported without breaking constraints.

### Error Handling

The `PrismaExceptionFilter` maps Prisma client errors to appropriate HTTP responses:
- `P2002` (Unique constraint violation) → `409 Conflict`
- `P2025` (Record not found) → `404 Not Found`
- Other Prisma errors → `500 Internal Server Error`

---

## 7. Rental Booking Flow

```
Browser                 NestJS API                  MySQL
  │                         │                          │
  │─ GET /vehicles/:id ─────►                          │
  │  /availability           │── Query blackout_dates──►
  │                          │── Query rental_bookings──►
  │◄── { unavailableDates }──│   (CONFIRMED + ACTIVE)   │
  │                          │                          │
  │─ POST /rental-bookings ──►                          │
  │  { start, end, listing } │                          │
  │                          │── AVAILABILITY CHECK:    │
  │                          │   rental_listing_id = ?  │
  │                          │   AND status IN          │
  │                          │   (CONFIRMED, ACTIVE)    │
  │                          │   AND date overlaps? ────►
  │                          │── BLACKOUT CHECK ─────── ►
  │                          │   [If conflict → 422]    │
  │                          │── Calculate totalPrice   │
  │                          │   (days x daily_rate)    │
  │                          │── Prisma.create()         │
  │                          │   status: PENDING_PAYMENT►
  │◄── 201 {                 │                          │
  │    booking_id,           │                          │
  │    total_price (IDR),    │                          │
  │    payment_instructions }│                          │
```

### Booking Status State Machine

```
PENDING_PAYMENT → CONFIRMED → ACTIVE → COMPLETED
       │               │
       └──── CANCELLED ┘
                        ACTIVE → OVERDUE (via scheduled cron job)
```

> [!IMPORTANT]
> Long-Term Rental (more than 7 days): Instead of `POST /rental-bookings`, the system directs the customer to `POST /leads` with `type: LONG_TERM_QUOTE`. This creates a lead for manual negotiation and redirects to WhatsApp.

---

## 8. Lead & Sales Flow

```
Browser                 NestJS API                  MySQL          WhatsApp
  │                         │                          │                │
  │  [User fills form]      │                          │                │
  │─ POST /leads ───────────►                          │                │
  │  { vehicle_id, type,    │── Rate limit check       │                │
  │    customer_name,       │   (10 req/IP/hour)       │                │
  │    customer_phone,      │                          │                │
  │    offered_price? }     │── Generate Reference ID  │                │
  │                         │   "LD-2026-XXXXX"        │                │
  │                         │── Prisma.lead.create()───►                │
  │                         │   status: NEW            │                │
  │                         │── Increment inquiry_count►                │
  │                         │   (async)                │                │
  │                         │── Build WhatsApp URL     │                │
  │◄── 201 {                │   with Ref ID, Vehicle,  │                │
  │    lead_reference_id,   │   Name, Inquiry Type     │                │
  │    whatsapp_redirect_url│                          │                │
  │    }                    │                          │                │
  │                         │                          │                │
  │ [Frontend shows success state with Ref ID + WA button]             │
  │── [User clicks WA button] ─────────────────────────────────────────►
```

### WhatsApp URL Template

```
https://wa.me/{WA_BUSINESS_NUMBER}?text=
  Halo Admin Soulani Auto Garage.
  Nama saya: {customerName}.
  Saya tertarik dengan: {vehicleMake} {vehicleModel} ({vehicleYear}).
  Jenis Pertanyaan: {inquiryType}.
  [If MAKE_OFFER]: Penawaran saya: Rp {offeredPrice}.
  Ref ID: {leadReferenceId}.
```

> [!NOTE]
> The WhatsApp business number (`6281210663530`) is currently hardcoded in `NEXT_PUBLIC_WHATSAPP_NUMBER` env var. Phase 6 will migrate this to a CMS-managed key in the `homepage_content` table (`key: 'whatsapp_number'`), eliminating the need for redeployment when the number changes.

### CRM Follow-Up Lifecycle

```
NEW → CONTACTED → NEGOTIATING → TEST_DRIVE_SCHEDULED → WON / LOST
```

1. Lead created (status: `NEW`)
2. Super Admin assigns to Sales Staff via `PUT /leads/:id/assign`
3. Staff contacts customer via WhatsApp (Ref ID links conversation)
4. Staff logs follow-ups via `POST /leads/:id/followups` with status update
5. Lead progresses to `WON` or `LOST`

### Status-Conditional Inquiry Logic (VDP)

```typescript
// apps/web/src/app/(public)/sales/[slug]/page.tsx
{vehicle.status === 'ACTIVE' ? (
  <VehicleCTA vehicleId={vehicle.id} ... />
) : (
  <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
    <h3>Pendaftaran Ditutup</h3>
    <p>Unit kendaraan ini sudah tidak tersedia untuk penawaran harga atau sesi tanya jawab.</p>
  </div>
)}
```

---

## 9. Admin Dashboard Architecture

### Navigation Structure by Role

```
SUPER ADMIN                    SALES STAFF               RENTAL STAFF
─────────────────────          ─────────────────          ─────────────────────
Analytics Overview             Inventory                  Rental Fleet
Inventory Management           Sales Leads (own)          Rental Bookings
Sales Leads (all)              Inspections                Blackout Dates
Rental Bookings                                           Long-Term Quotes
Blackout Dates
Long-Term Quotes
Staff Management
Payment Methods
CMS / Homepage
Audit Logs
```

### Dashboard Module Definitions

| Module | Accessible By | Core Functions |
|---|---|---|
| Analytics Overview | Super Admin | Revenue KPIs, Leads, Conversions, Top Vehicles |
| Inventory Manager | Super Admin, Sales | Add/Edit/Archive vehicles, upload images, toggle Featured/New, publish |
| Inspection Manager | Super Admin, Sales | Log inspection reports per vehicle |
| Sales Leads CRM | Super Admin, Sales | Kanban board, assign leads, log follow-ups, bulk assign |
| Rental Bookings | Super Admin, Rental | View/Update booking status |
| Blackout Dates | Super Admin, Rental | Block calendar dates per vehicle |
| Long-Term Quotes | Super Admin, Rental | Custom quote negotiation tracking |
| CMS Manager | Super Admin | Edit hero banners, promos, testimonials |
| Staff Management | Super Admin | Create/Deactivate staff, assign roles |
| Payment Methods | Super Admin | Configure bank transfer details |
| Audit Logs | Super Admin | Query system audit trail |

---

## 10. Deployment Architecture

### Infrastructure Overview

```
Vercel (Frontend)                    Railway (Backend + Database)
─────────────────────────────────    ──────────────────────────────────
Next.js 15 App                       NestJS API Container
CDN: Global Edge                     MySQL 8.x Database
Preview Deployments                  Automatic Failover
Environment Variables                Persistent Volume (MySQL data)

                    Local File Storage (Disk on Railway)
                    Serving files via NestJS static middleware
```

### Environment Variables

**Frontend (`apps/web/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WHATSAPP_NUMBER=6281210663530
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# NOTE: NEXT_PUBLIC_WHATSAPP_NUMBER will be migrated to CMS-managed
# HomepageContent table key in Phase 6, eliminating env var dependency.
```

**Backend (`apps/api/.env`)**
```env
DATABASE_URL=mysql://user:pass@host:3306/soulani_db
JWT_SECRET=super_secret_access_key_min_64_chars
JWT_REFRESH_SECRET=super_secret_refresh_key_min_64_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:3000
PORT=3001
# Cloudinary credentials deferred to Phase 7 Production Launch:
# CLOUDINARY_CLOUD_NAME=soulani
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
```

### CI/CD Workflow

```
Developer pushes to Git
        │
        ▼
GitHub Actions
  1. Lint (ESLint)
  2. TypeScript check
  3. Unit tests
        │
   ┌────┴──────┐
   │           │
   ▼           ▼
Vercel       Railway
(Frontend)   (Backend)
Auto-deploy  Auto-deploy
on push to   on push to
main branch  main branch
             │
             ▼
        prisma migrate deploy
        (runs before app start)
```

---

## 11. Monitoring & Logging

### Error Logging

- **Backend:** NestJS Logger piped to Railway's built-in log viewer.
- **Frontend:** Sentry (`@sentry/nextjs`) for uncaught client-side exceptions (planned for Phase 7).
- **API Errors:** Global `HttpExceptionFilter` standardizes all error responses; 500-level errors are logged with full stack trace.
- **Prisma Errors:** `PrismaExceptionFilter` maps Prisma client exceptions to HTTP status codes (`P2002 → 409`, `P2025 → 404`).

### Audit Logging

- Implemented via `AuditInterceptor` on all mutating endpoints.
- Written to `audit_logs` MySQL table.
- Queryable by Super Admin via `GET /audit-logs` with filters: `moduleName`, `userId`, `action`, `date range`.

### API Monitoring

- **Railway Metrics:** CPU, Memory, request latency in Railway dashboard.
- **Rate Limiting:** `@nestjs/throttler` protects public endpoints; rejected requests are logged.

### Database Backup Strategy

| Strategy | Implementation |
|---|---|
| Automated daily backup | Railway built-in MySQL backup (daily, 7-day retention) |
| Pre-migration backup | `mysqldump` in CI/CD before `prisma migrate deploy` |
| Soft deletes | No permanent data loss from application-level deletions |
| Audit logs | Complete change history retained in `audit_logs` indefinitely |

---

## 12. Development Roadmap

### Phase Status Tracker

| Phase | Description | Status |
|---|---|---|
| Phase 1: Foundation | Monorepo, DB, JWT Auth | ✅ Completed |
| Phase 2: Inventory Management | Vehicle CRUD, Images, Inspections | ✅ Completed |
| Phase 3: Public Website & Sales Flow | Homepage, Sales Listing, VDP, Lead CRM | ✅ Completed |
| Phase 4: Rental Flow | Rental listing, booking, availability | ⚪ Planned |
| Phase 5: CRM & Operations | Kanban CRM, lead assignment, followups | ⚪ Planned |
| Phase 6: Analytics & CMS | Owner dashboard, CMS content management | ⚪ Planned |
| Phase 7: Production Launch | CI/CD, Vercel/Railway deploy, Cloudinary | ⚪ Planned |

### Definition of Done

A feature or phase is considered complete only when:
* All planned deliverables have been implemented
* API functionality has been tested
* UI functionality has been tested (if applicable)
* Validation and error handling have been implemented
* Database reads/writes have been verified
* Documentation has been updated
* No known critical defects remain

---

### Phase 1: Foundation — ✅ Completed
**Goal:** Establish local infrastructure and authentication backbone.

| Item | Detail |
|---|---|
| Deliverables | Turborepo monorepo setup · Prisma schema migration · Local MySQL via Laragon · JWT Auth module · Users/Staff API · Next.js and NestJS scaffolded and running concurrently |
| Dependencies | Node.js, pnpm, Local MySQL |
| Status | Completed |

---

### Phase 2: Inventory Management — ✅ Completed
**Goal:** Full vehicle inventory management for admins.

| Item | Detail |
|---|---|
| Deliverables | Vehicle CRUD API + Admin UI · Multipart image upload (Multer, FilesInterceptor) · Inspection report form + API · Sales Listing pricing · Rental Listing config (rate, deposit, long-term eligible) · DRAFT/ACTIVE/PUBLISH status workflow |
| Dependencies | Phase 1 complete |
| Status | Completed |

---

### Phase 3: Public Website & Sales Flow — ✅ Completed
**Goal:** Customer-facing website with CRM-backed lead capture.

| Item | Detail |
|---|---|
| Deliverables | Homepage (SSG + ISR, parallel data fetching) · Sales Listing page (URL-synced filters, dual ACTIVE/archived sections) · Vehicle Detail page (SSG + ISR, SEO metadata, JSON-LD) · Status-conditional CTA: ACTIVE → InquiryForm; SOLD/MAINTENANCE → closed panel · Lead Inquiry Form (MAKE_OFFER conditional field, Zod validation) · `POST /leads` API with WhatsApp redirect · `GET /vehicles/by-slug/:slug` public endpoint · View analytics tracking · Rate limiting (10/IP/hour on leads) · Prisma seed for Testimonials + HomepageContent |
| Dependencies | Phase 2 complete |
| Status | Completed |

**Phase 3 Architecture Decisions (Approved):**

| Decision | Choice |
|---|---|
| Slug routing | `GET /vehicles/by-slug/:slug` (must be declared before `GET /:id` in NestJS controller) |
| Image URL transform | API response includes computed `imageUrl` field (prepends server base URL to `file_path`) |
| WhatsApp number | `6281210663530` (temporary placeholder; migrated to CMS-managed setting in Phase 6) |
| Homepage content | Seeded with static defaults via Prisma seed; `HomepageContent` table kept for Phase 6 CMS |
| Testimonial avatars | Initials-based avatars via `getInitials()` + `getAvatarColor()` (no photo upload until Phase 6) |
| About / Contact content | Static dummy content hardcoded for Phase 3; migrated to CMS in Phase 6 |
| Sales listing page rendering | `'use client'` with `useSearchParams` for URL-synchronized filter state |
| Vehicle publish flow | `PATCH /vehicles/:id/publish` sets status `DRAFT → ACTIVE` |

---

### Phase 4: Rental Flow — ⚪ Planned
**Goal:** Full rental booking and long-term quote experience.

| Item | Detail |
|---|---|
| Deliverables | Rental Listing page with Long-Term Available badge · Availability & Blackout Dates API · Rental Booking flow & Guest Checkout form · >7 Day custom quote via Lead flow · Admin booking status management |
| Dependencies | Phase 2 complete |
| Complexity | High |
| Estimated Duration | 2–3 weeks |

---

### Phase 5: CRM & Operations — ⚪ Planned
**Goal:** CRM for staff to track leads and assignments.

| Item | Detail |
|---|---|
| Deliverables | Sales Leads CRM Board (Kanban, status tracking) · Lead Assignment to Staff · Lead Followups API & UI · Long-Term Rental Quote management · Audit logs viewer |
| Dependencies | Phase 3 + Phase 4 complete |
| Complexity | Medium-High |
| Estimated Duration | 2 weeks |

---

### Phase 6: Analytics & CMS — ⚪ Planned
**Goal:** Analytics dashboard for the owner and content management.

| Item | Detail |
|---|---|
| Deliverables | Owner Analytics Dashboard (Revenue, Conversion Rate, Top Vehicles) · CMS API & Admin UI for Homepage content · Admin-managed WhatsApp number (migrating from env var to `HomepageContent` table) · Testimonial photo upload support · FAQ management |
| Dependencies | Phase 5 complete |
| Complexity | Medium |
| Estimated Duration | 1-2 weeks |

**Phase 6 CMS Scope Notes:**
- `HomepageContent` key `whatsapp_number` replaces `NEXT_PUBLIC_WHATSAPP_NUMBER` env var
- `HomepageContent` keys `about_hero`, `about_story`, `contact_address`, `contact_hours` replace static content on About/Contact pages
- Testimonial records gain optional `avatarUrl` field (Multer upload via admin dashboard)
- All Phase 3 static-content pages should already be reading from the API; Phase 6 simply adds the admin UI to edit those values

---

### Phase 7: Production Launch — ⚪ Planned
**Goal:** Harden, optimize, and deploy to the cloud.

| Item | Detail |
|---|---|
| Deliverables | CI/CD pipeline setup (Vercel/Railway) · Vercel & Railway MySQL provisioning · Cloudinary migration (replace local Multer uploads) · Rate limiting hardening · Mobile responsiveness QA · Lighthouse scores >= 90 · SSL + custom domain mapping |
| Dependencies | All local phases complete |
| Complexity | Medium |
| Estimated Duration | 1 week |

---

> [!TIP]
> **Future Phases (Post-Launch)**
> - Phase 8: Indonesian Payment Gateway (Midtrans/Xendit) — QRIS, Virtual Accounts, E-Wallets
> - Phase 9: Customer Portal — account creation, booking history, saved vehicles
> - Phase 10: 360° Vehicle Viewer + IDR Financing Calculator
> - Phase 11: Advanced Analytics, SMS/WhatsApp fleet maintenance alerts
