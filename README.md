# Soulani Auto Garage 🚗✨

Soulani Auto Garage is a modern, full-stack monorepo application designed to manage a premium automotive business. It handles vehicle inventory, sales, long-term rentals, inspections, and customer CRM all under one beautifully designed platform.

## 🏗️ Architecture

This project is built using [Turborepo](https://turborepo.org/) and is structured into the following applications:

- **`apps/web`**: The frontend Admin Portal built with [Next.js](https://nextjs.org/) (App Router), React Hook Form, Zod, TailwindCSS, and SweetAlert2.
- **`apps/api`**: The backend REST API built with [NestJS](https://nestjs.com/), providing robust endpoints, JWT authentication, and global exception handling.
- **Database Layer**: Managed by [Prisma ORM](https://www.prisma.io/) connecting to a MySQL database, featuring strict uniqueness constraints, soft deletes, and robust relational mapping.

## 🚀 Current Progress: Phase 3 Complete

The application has successfully completed **Phase 1 (Foundation)**, **Phase 2 (Vehicle Inventory)**, and **Phase 3 (Data & API Foundations)**.

### Features Implemented:
- **Public & Admin UI:** Beautiful, dynamic Next.js App Router public landing page, sales listing, and vehicle detail pages (`/sales/[slug]`). Admin dashboard for complete vehicle lifecycle management.
- **Authentication & RBAC:** Secure JWT-based login with role-based access control (Super Admin, Sales Staff, Rental Staff). Session expiration is strictly enforced globally.
- **Inventory CRUD:** Comprehensive vehicle management including specific listings (Sale/Rental/Both), deep `CarType` categorization, and specs tracking.
- **Image Pipeline:** Full image upload functionality using Multer (supporting JPG, PNG, WebP, JFIF), supporting drag-and-drop ordering (`sortOrder`) and Primary image handling.
- **Inspections Module:** A dedicated tab for logging detailed vehicle inspection statuses across Engine, Transmission, Suspension, Electrical, A/C, and more.
- **Leads Module:** Robust API for tracking customer inquiries and auto-generating Reference IDs (e.g. `LD-2026-XYZ12`), with WhatsApp redirect URL builder.
- **Analytics & Dashboard:** Global Admin Dashboard providing live metrics mapping and inventory distributions. Tracks simple view metrics.
- **Admin Profile Management:** Integrated user profile editing (name and secure password changes) featuring real-time UI synchronization and strict Zod frontend validation.
- **DevSecOps Rate Limiting:** Centralized, environment-aware `@nestjs/throttler` architecture featuring strict limiters for authentication (`auth`) and data mutations (`mutate`) to prevent brute-force attacks, scaling dynamically during local development.
- **Audit & Security:** Automated background tracking of core events. Global exception filters that cleanly catch API errors (including `429 Too Many Requests`) and bubble them seamlessly to the UI.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (recommended)
- MySQL Database

### Installation

1. Install dependencies across the monorepo:
   ```sh
   pnpm install
   ```

2. Configure environment variables. Ensure both `apps/api/.env` and `apps/web/.env.local` are set up.
   ```env
   # API Example
   DATABASE_URL="mysql://user:password@localhost:3306/soulani_garage"
   JWT_SECRET="your-super-secret-key"
   WHATSAPP_NUMBER="6281210663530"
   
   # Setup your Admin Credentials before running db seed!
   DEFAULT_ADMIN_EMAIL="admin@yourdomain.com"
   DEFAULT_ADMIN_PASSWORD="StrongPassword123"
   
   # Web Example
   NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
   ```

3. Run database migrations and seeds:
   ```sh
   cd apps/api
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

### Running Locally

To start both the Web App and the API concurrently:

```sh
pnpm dev
```
- The **Public UI** will be available at `http://localhost:3000`
- The **Admin Portal** will be available at `http://localhost:3000/admin`
- The **API** will be available at `http://localhost:3001/api/v1`

## 🔮 Upcoming Phases
- **Phase 4:** CMS & Homepage Customization
- **Phase 5:** Rental Operations & Booking Calendar
- **Phase 6:** Advanced CRM, Notifications & Follow-ups
- **Phase 7:** Production Hardening & Cloud Deployment

---
*Built with ❤️ for Soulani Auto Garage.*
