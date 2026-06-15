# Technical Architecture Document
# Soulani Auto Garage Platform

**Version:** 1.0.0  
**Stack:** Next.js 15 · NestJS · Prisma · MySQL · Cloudinary · Vercel · Railway  
**Market:** Indonesia (Currency: IDR)  
**Status:** Pre-Development — Ready for Engineering Team

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
│                  Next.js 15 + TypeScript + TailwindCSS              │
│                                                                     │
│   /public (SSG)  ──  /admin (CSR/Protected)  ──  /api/route (RSC)  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST (HTTPS / JSON)
┌───────────────────────────────▼─────────────────────────────────────┐
│                     BACKEND LAYER (Railway)                         │
│                   NestJS API  ·  Base URL: /api/v1                  │
│                                                                     │
│  AuthModule · VehiclesModule · LeadsModule · BookingsModule         │
│  InspectionModule · CmsModule · AnalyticsModule · UsersModule       │
└────────────┬─────────────────────────────────┬──────────────────────┘
             │ Prisma ORM (MySQL protocol)      │ Cloudinary SDK
┌────────────▼─────────┐            ┌───────────▼─────────────────────┐
│   DATABASE (Railway)  │            │   CLOUDINARY (External CDN)     │
│   MySQL 8.x          │            │   soulani/vehicles/             │
│   Prisma Migrations  │            │   soulani/licenses/             │
└──────────────────────┘            │   soulani/testimonials/         │
                                    └─────────────────────────────────┘
```

### Data Flow Summary

| Flow | Direction |
|---|---|
| Public page load (SSG) | CDN → Vercel → Next.js static page |
| Vehicle list (RSC) | Browser → Next.js Server Component → NestJS API → MySQL |
| Lead submission | Browser → NestJS API → MySQL → WhatsApp URL response |
| Image upload | Browser → (Signature) → NestJS → Cloudinary (direct) → NestJS (save URL) |
| Admin dashboard | Browser → Next.js Client Component → NestJS API (JWT-protected) |

---

## 2. Frontend Architecture

### Next.js 15 Folder Structure

```
apps/web/
├── app/
│   ├── (public)/                     # Route group: public pages (no auth)
│   │   ├── page.tsx                  # Homepage
│   │   ├── sales/
│   │   │   ├── page.tsx              # Sales Listing
│   │   │   └── [slug]/page.tsx       # Vehicle Detail
│   │   ├── rental/
│   │   │   ├── page.tsx              # Rental Listing
│   │   │   └── [slug]/page.tsx       # Rental Detail
│   │   ├── about/page.tsx
│   │   └── contact/page.tsx
│   ├── (admin)/                      # Route group: protected admin
│   │   ├── layout.tsx                # AdminLayout — enforces auth + RBAC
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── leads/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── rentals/
│   │   │   ├── bookings/page.tsx
│   │   │   └── quotes/page.tsx
│   │   └── settings/
│   │       ├── users/page.tsx
│   │       ├── payment-methods/page.tsx
│   │       └── cms/page.tsx
│   ├── auth/
│   │   └── login/page.tsx
│   ├── layout.tsx                    # Root layout
│   └── not-found.tsx
├── components/
│   ├── ui/                           # Shadcn base components
│   ├── vehicles/                     # VehicleCard, Gallery, InspectionReport
│   ├── leads/                        # InquiryForm, LeadCaptureSidebar
│   ├── rental/                       # BookingWidget, DatePicker, LongTermBanner
│   ├── admin/                        # DataTable, StatsCard, KanbanBoard
│   └── shared/                       # Navbar, Footer, WhatsAppCTA, SkeletonLoader
├── lib/
│   ├── api.ts                        # Typed fetch client (base URL, error handling)
│   ├── auth.ts                       # Token storage, refresh logic
│   ├── cloudinary.ts                 # Upload helper using signed signature
│   ├── whatsapp.ts                   # WhatsApp redirect URL builder
│   └── utils.ts                      # IDR formatter, date helpers
├── hooks/
│   ├── useAuth.ts                    # Auth state (via Context or Zustand)
│   ├── useRBAC.ts                    # Role-checking hook
│   └── useAvailability.ts            # Calendar availability fetcher
├── store/
│   └── auth.store.ts                 # Zustand — accessToken, user, role
├── types/
│   └── api.types.ts                  # Shared TypeScript interfaces
└── public/                           # Static assets (Logo, OG images)
```

### App Router Strategy

| Segment | Strategy | Rationale |
|---|---|---|
| Homepage | SSG with ISR (revalidate: 3600s) | Fast CDN delivery; content refreshes hourly |
| Sales/Rental Listing | SSG + ISR | SEO critical; can tolerate 1hr stale |
| Vehicle Detail (slug) | SSG + ISR (revalidate: 1800s) | Per-vehicle SEO page; fetches via generateStaticParams |
| Admin routes | CSR (Client-Side Rendering) | Fully behind JWT; no SEO requirement |
| Auth callback | Server Action | Handles token exchange server-side |

### Server vs Client Components

```
Server Components (RSC)               Client Components ('use client')
─────────────────────────────────     ──────────────────────────────────
- Listing pages (data fetching)       - InquiryForm (state + submission)
- Vehicle Detail page shell           - BookingWidget (date selection)
- SEO metadata generation             - AdminDataTable (sorting/filtering)
- Homepage hero + static content      - KanbanBoard (drag-drop leads)
                                      - Navbar (auth state display)
                                      - Gallery (image carousel)
```

### State Management Strategy

- **Auth State:** Zustand (`auth.store.ts`). Stores accessToken, refreshToken, user, role.
- **Server State / API Cache:** TanStack Query (React Query). All admin data fetching with automatic background refetch.
- **Form State:** React Hook Form + Zod validation (mirrors DTO validation on the client).
- **UI State:** Local useState / useReducer for modals, drawers.

### Protected Route Strategy

```typescript
// app/(admin)/layout.tsx — Server Component
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const session = await getServerSession();
  if (!session) redirect('/auth/login');
  return <div>{children}</div>;
}
```

---

## 3. Backend Architecture

### NestJS Folder Structure

```
apps/api/
├── src/
│   ├── main.ts                       # Bootstrap: CORS, helmet, ValidationPipe
│   ├── app.module.ts                 # Root module
│   │
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts        # POST /auth/login, /auth/refresh
│   │   ├── auth.service.ts           # signIn, generateTokens, rotateRefreshToken
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh-jwt.strategy.ts
│   │   └── dto/login.dto.ts
│   │
│   ├── vehicles/
│   ├── vehicle-images/
│   ├── vehicle-inspections/
│   ├── sales-listings/
│   ├── rental-listings/
│   ├── rental-bookings/
│   ├── blackout-dates/
│   ├── leads/
│   ├── lead-followups/
│   ├── testimonials/
│   ├── cms/
│   ├── analytics/
│   ├── users/
│   │
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── ownership.guard.ts
│   │   ├── interceptors/
│   │   │   ├── audit.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   │
│   ├── cloudinary/
│   │   ├── cloudinary.module.ts
│   │   └── cloudinary.service.ts
│   │
│   └── prisma/
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/
```

### Global Bootstrap Configuration (main.ts)

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor());
app.use(helmet());
app.enableCors({ origin: process.env.FRONTEND_URL });
app.enableVersioning({ type: VersioningType.URI });
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

### Refresh Token Flow

```
Client                    NestJS API                   MySQL
  │                           │                           │
  │── POST /auth/refresh ─────►                           │
  │   Cookie: refreshToken    │── verify + validate hash──►
  │                           │◄─────────────── match ────┤
  │                           │── sign new accessToken    │
  │                           │── rotate refreshToken ────►
  │◄── 200 { accessToken } ───│                           │
```

### JWT Lifecycle

| Token | Location | TTL | Storage |
|---|---|---|---|
| Access Token | Authorization: Bearer header | 15 minutes | Zustand (memory) |
| Refresh Token | HttpOnly Secure Cookie | 7 days | Hashed in users.refresh_token_hash |

### RBAC Permissions Matrix

| Resource | Super Admin | Sales Staff | Rental Staff | Public |
|---|---|---|---|---|
| Vehicles (Read) | ✅ | ✅ | ✅ | ✅ |
| Vehicles (Write) | ✅ | ✅ | ❌ | ❌ |
| Inspections | ✅ | ✅ | ❌ | ❌ |
| Sales Listings | ✅ | ✅ | ❌ | ✅ (Read) |
| Rental Listings | ✅ | ❌ | ✅ | ✅ (Read) |
| Leads (Own) | ✅ (All) | ✅ (Assigned) | ❌ | ❌ |
| Lead Assignment | ✅ | ❌ | ❌ | ❌ |
| Rental Bookings | ✅ | ❌ | ✅ | ✅ (Create) |
| Blackout Dates | ✅ | ❌ | ✅ | ❌ |
| Users/Staff Mgmt | ✅ | ❌ | ❌ | ❌ |
| Analytics Dashboard | ✅ | ❌ | ❌ | ❌ |
| CMS / Testimonials | ✅ | ❌ | ❌ | ✅ (Read) |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 5. Cloudinary Architecture

### Direct Upload Flow

```
Admin Browser           NestJS API              Cloudinary
    │                       │                       │
    │─ POST /signature ─────►                       │
    │                       │── generateSignature()  │
    │◄── { signature,       │   (HMAC-SHA1 hash)    │
    │     timestamp,        │                       │
    │     api_key }─────────│                       │
    │                       │                       │
    │─── Upload directly ───────────────────────────►
    │    (multipart/form-data + signature)           │
    │◄── { secure_url, public_id }──────────────────┤
    │                       │                       │
    │─ POST /vehicles/:id/images ──►                │
    │   { cloudinary_url, public_id }               │
    │◄── 201 Created ───────│                       │
```

### Cloudinary Folder Conventions

```
soulani/
├── vehicles/       # All vehicle listing images
├── licenses/       # Customer driver's license uploads
└── testimonials/   # Author avatars
```

### Image Optimization (Dynamic URL Transformations)

| Use Case | Transformation |
|---|---|
| Listing card thumbnail | f_auto,q_auto,w_600,h_450,c_fill |
| Vehicle Detail hero | f_auto,q_auto,w_1280,q_85 |
| Admin thumbnail | f_auto,q_auto,w_200 |
| OG / Social share | f_auto,q_auto,w_1200,h_630,c_fill |

---

## 6. Database Architecture

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
| vehicles | (status, type, deleted_at) | Primary listing query filter |
| vehicles | (status, is_featured, deleted_at) | Homepage featured query |
| vehicles | FULLTEXT(make, model) | Full-text search |
| leads | (assigned_to_id, status, deleted_at) | Staff CRM view |
| rental_bookings | (rental_listing_id, status, start_date, end_date) | Availability checking |
| blackout_dates | (start_date, end_date) | Conflict detection |
| audit_logs | (module_name, record_id) | Audit trail lookup |

### Soft Delete Strategy

All operational models include `deleted_at DateTime?`. Convention:
- **Delete:** Set `deletedAt: new Date()`
- **All queries:** Must include `where: { deletedAt: null }` via PrismaClient extension
- **Restore:** Set `deletedAt: null` via `POST /entity/:id/restore`

### Audit Logging Strategy

The `AuditInterceptor` fires on every mutating request (POST/PUT/PATCH/DELETE):

```typescript
await this.prisma.auditLog.create({
  data: {
    userId: request.user?.id,
    action: mapMethodToAction(request.method), // CREATE | UPDATE | DELETE
    moduleName: extractModuleName(request.path),
    recordId: responseData?.id,
    previousValue,  // JSON snapshot before mutation
    newValue: responseData,
    timestamp: new Date(),
  }
});
```

> [!NOTE]
> The audit_logs table has NO foreign key to the users table intentionally — this allows logs to be archived or exported without breaking constraints.

---

## 7. Rental Booking Flow

```
Browser                 NestJS API                  MySQL
  │                         │                          │
  │─ GET /vehicles/:id ─────►                          │
  │  /availability           │── Query blackout_dates──►
  │                          │── Query rental_bookings──►
  │◄── { unavailableDates }──│   (Confirmed + Active)   │
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
> Long-Term Rental (more than 7 days): Instead of POST /rental-bookings, the system directs the customer to POST /leads with type: LONG_TERM_QUOTE. This creates a lead for manual negotiation and redirects to WhatsApp.

---

## 8. Lead & Sales Flow

```
Browser                 NestJS API                  MySQL          WhatsApp
  │                         │                          │                │
  │  [User fills form]      │                          │                │
  │─ POST /leads ───────────►                          │                │
  │  { vehicle_id, type,    │── Rate limit check       │                │
  │    customer_name,       │   (5 req/IP/hour)        │                │
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
  │── [Browser redirects] ──────────────────────────────────────────────►
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

### CRM Follow-Up Lifecycle

```
NEW → CONTACTED → NEGOTIATING → TEST_DRIVE_SCHEDULED → WON / LOST
```

1. Lead created (status: NEW)
2. Super Admin assigns to Sales Staff via `PUT /leads/:id/assign`
3. Staff contacts customer via WhatsApp (Ref ID links conversation)
4. Staff logs follow-ups via `POST /leads/:id/followups` with status update
5. Lead progresses to WON or LOST

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
| Inventory Manager | Super Admin, Sales | Add/Edit/Archive vehicles, toggle Featured/New |
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

                    Cloudinary (External CDN)
                    Image storage and delivery
```

### Environment Variables

**Frontend (apps/web/.env.local)**
```env
NEXT_PUBLIC_API_URL=https://api.soulanigarage.com/api/v1
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=soulani
NEXT_PUBLIC_WHATSAPP_NUMBER=6281122334455
```

**Backend (apps/api/.env)**
```env
DATABASE_URL=mysql://user:pass@host:3306/soulani_db
JWT_SECRET=super_secret_access_key_min_64_chars
JWT_REFRESH_SECRET=super_secret_refresh_key_min_64_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=soulani
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxx_cloudinary_secret_xxxx
FRONTEND_URL=https://soulanigarage.com
PORT=3001
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
- **Frontend:** Sentry (`@sentry/nextjs`) for uncaught client-side exceptions.
- **API Errors:** Global `HttpExceptionFilter` standardizes all error responses; 500-level errors are logged with full stack trace.

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

## 12. Repository Structure (Production-Ready Monorepo)

```
soulani-auto-garage/
│
├── apps/
│   ├── web/                          # Next.js 15 Frontend (Vercel)
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── types/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend (Railway)
│       ├── src/
│       │   ├── auth/
│       │   ├── vehicles/
│       │   ├── vehicle-images/
│       │   ├── vehicle-inspections/
│       │   ├── sales-listings/
│       │   ├── rental-listings/
│       │   ├── rental-bookings/
│       │   ├── blackout-dates/
│       │   ├── leads/
│       │   ├── lead-followups/
│       │   ├── testimonials/
│       │   ├── cms/
│       │   ├── analytics/
│       │   ├── users/
│       │   ├── cloudinary/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── decorators/
│       │   │   └── filters/
│       │   ├── prisma/
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── types/                        # Shared TypeScript interfaces (cross-app)
│   │   ├── src/
│   │   │   ├── vehicle.types.ts
│   │   │   ├── lead.types.ts
│   │   │   ├── booking.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── utils/                        # Shared utility functions
│       ├── src/
│       │   ├── idr-formatter.ts      # formatRupiah(1500000) → "Rp 1.500.000"
│       │   ├── whatsapp.ts           # buildWhatsAppUrl(lead, vehicle)
│       │   └── date-helpers.ts       # calculateRentalDays(start, end)
│       └── package.json
│
├── docs/
│   ├── product_architecture.md
│   ├── api_specification.md
│   ├── schema.prisma
│   ├── brand_direction.md
│   ├── design_system.md
│   ├── wireframes.md
│   └── technical_architecture.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + typecheck + test on PR
│       └── deploy.yml                # Deploy on merge to main
│
├── package.json                      # Root workspaces config
├── turbo.json                        # Turborepo pipeline config
└── .env.example
```

**Monorepo Tool:** Turborepo for parallel builds and task caching.

---

## 13. Development Roadmap

### Phase 1: Foundation
**Goal:** Establish infrastructure and authentication backbone.

| Item | Detail |
|---|---|
| Deliverables | Monorepo setup · Prisma schema migration · MySQL on Railway · JWT Auth module · Users/Staff API · Health check endpoint |
| Dependencies | Railway provisioned · MySQL instance up · Cloudinary account created |
| Complexity | Medium |
| Estimated Duration | 1–2 weeks |

---

### Phase 2: Inventory Management
**Goal:** Full vehicle inventory management for admins.

| Item | Detail |
|---|---|
| Deliverables | Vehicle CRUD API + Admin UI · Cloudinary direct upload flow · Inspection report form + API · Sales Listing pricing · Rental Listing config (rate, deposit, is_long_term_eligible) |
| Dependencies | Phase 1 complete · Cloudinary API credentials |
| Complexity | Medium |
| Estimated Duration | 1–2 weeks |

---

### Phase 3: Public Website & Sales Flow
**Goal:** Customer-facing website with CRM-backed lead capture.

| Item | Detail |
|---|---|
| Deliverables | Homepage (SSG/ISR) · Sales Listing + Vehicle Detail pages (SEO) · Lead Inquiry Form (with Make Offer conditional field) · Lead creation API + WhatsApp redirect · Analytics view tracking |
| Dependencies | Phase 2 complete (inventory must exist) |
| Complexity | Medium-High |
| Estimated Duration | 2 weeks |

---

### Phase 4: Rental Flow
**Goal:** Full rental booking and long-term quote experience.

| Item | Detail |
|---|---|
| Deliverables | Rental Listing page with Long-Term Available badge · Availability Calendar API · Guest Checkout form · >7 Day custom quote via Lead flow · Admin booking status management · Blackout date management · Payment method config (bank transfer instructions) |
| Dependencies | Phase 2 complete |
| Complexity | High |
| Estimated Duration | 2–3 weeks |

---

### Phase 5: CRM & Analytics
**Goal:** Full CRM for staff and analytics dashboard for owner.

| Item | Detail |
|---|---|
| Deliverables | Sales Leads CRM (Kanban, follow-ups, assign, bulk assign) · Long-Term Rental Quote board · Owner Analytics Dashboard (Revenue, Conversion Rate, Top Vehicles) · CMS Manager · Audit Log viewer |
| Dependencies | Phase 3 + Phase 4 complete |
| Complexity | High |
| Estimated Duration | 2–3 weeks |

---

### Phase 6: Production Launch
**Goal:** Harden, optimize, and go live.

| Item | Detail |
|---|---|
| Deliverables | Rate limiting hardening · Full SEO audit (sitemaps, robots.txt, metadata) · Mobile responsiveness QA · Lighthouse scores >= 90 · CI/CD pipeline finalized · SSL + custom domain · DB backup verification · Staff onboarding docs |
| Dependencies | All phases complete |
| Complexity | Medium |
| Estimated Duration | 1 week |

---

> [!TIP]
> **Future Phases (Post-Launch)**
> - Phase 7: Indonesian Payment Gateway (Midtrans/Xendit) — QRIS, Virtual Accounts, E-Wallets
> - Phase 8: Customer Portal — account creation, booking history, saved vehicles
> - Phase 9: 360 degree Vehicle Viewer + IDR Financing Calculator
> - Phase 10: Advanced Analytics, SMS/WhatsApp fleet maintenance alerts
