# Soulani Auto Garage 🚗✨

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)

Soulani Auto Garage is a modern, full-stack monorepo application designed to manage a premium automotive business. It handles vehicle inventory, sales, long-term rentals, inspections, and customer CRM all under one beautifully designed platform.

## 🏗️ Architecture

This project is built using [Turborepo](https://turborepo.org/) and is structured into the following applications:

- **`apps/web`**: The frontend Admin Portal built with [Next.js](https://nextjs.org/) (App Router), React Hook Form, Zod, TailwindCSS, and SweetAlert2.
- **`apps/api`**: The backend REST API built with [NestJS](https://nestjs.com/), providing robust endpoints, JWT authentication, and global exception handling.
- **Database Layer**: Managed by [Prisma ORM](https://www.prisma.io/) connecting to a MySQL database, featuring strict uniqueness constraints, soft deletes, and robust relational mapping.

## 🚀 Current Progress: Phase 5 & 6 Complete

The application has successfully completed **Phase 1 (Foundation)**, **Phase 2 (Vehicle Inventory)**, **Phase 3 (Data & API Foundations)**, **Phase 4 (Rental Operations, CMS & CRM Sync)**, **Phase 5 (CMS & Homepage Customization)**, and **Phase 6 (Staff Management & Advanced CRM)**.

### Features Implemented:
- **Public & Admin UI:** Beautiful, dynamic Next.js App Router public landing page, sales listing, and vehicle detail pages (`/sales/[slug]`). Admin dashboard for complete vehicle lifecycle management.
- **Authentication & RBAC:** Secure JWT-based login with role-based access control (Super Admin, Sales Staff, Rental Staff). Session expiration is strictly enforced globally.
- **Inventory CRUD:** Comprehensive vehicle management including specific listings (Sale/Rental/Both), deep `CarType` categorization, and specs tracking.
- **Image Pipeline:** Full image upload functionality using Multer (supporting JPG, PNG, WebP, JFIF), supporting drag-and-drop ordering (`sortOrder`) and Primary image handling.
- **Inspections Module:** A dedicated tab for logging detailed vehicle inspection statuses across Engine, Transmission, Suspension, Electrical, A/C, and more.
- **Leads Module & Sales Capture Flow:** Robust API for tracking customer inquiries and auto-generating Reference IDs (e.g. `LD-2026-XYZ12`). Leads from `/sales/[slug]` are fully captured in the database before redirecting to WhatsApp.
- **Dynamic Inquiry Form:** Strict lead type filters for sales (`SALES_INQUIRY`, `TEST_DRIVE_REQUEST`, `MAKE_OFFER`) with a conditional "Offered Price" input field for user offers.
- **CMS-driven Settings & Dynamic UI:** Removed hardcoded configuration and environment variables. The global WhatsApp number, Homepage Hero texts, Trust Badges (Inspection Points, Return Days, Warranty Months), and About Us stories are managed dynamically in the CMS database via a unified `homepage_settings` JSON structure and fetched client-side/server-side to preserve Next.js 15 ISR (Instant Static Regeneration). The Admin portal features a comprehensive settings UI (`/admin/settings/cms`) to edit these values in real time.
- **Staff Management (RBAC & Sidebar Sync):** A dedicated User/Staff management portal (`/admin/settings/staff`) for Super Admins to create and manage staff accounts. The admin sidebar dynamically updates navigation links based on user roles (Super Admin, Sales Staff, Rental Staff).
- **Analytics & Dashboard:** Global Admin Dashboard providing live metrics mapping and inventory distributions. Tracks simple view metrics.
- **Admin Profile Management:** Integrated user profile editing (name and secure password changes) featuring real-time UI synchronization and strict Zod frontend validation.
- **DevSecOps Rate Limiting:** Centralized, environment-aware `@nestjs/throttler` architecture featuring strict limiters for authentication (`auth`) and data mutations (`mutate`) to prevent brute-force attacks, scaling dynamically during local development.
- **Audit & Security:** Automated background tracking of core events. Global exception filters that cleanly catch API errors (including `429 Too Many Requests`) and bubble them seamlessly to the UI.
- **Rental Operations & Booking Calendar:** Completed long-term rentals, blackout dates management, active booking tables, and dynamic date ranges check-out.
- **Automated Booking Scheduler**: Automated background scheduler (cron service) that runs periodically to transition booking states (e.g. `CONFIRMED` -> `ACTIVE` when the vehicle is picked up).
- **Payment Settings & CRM UI Alignment**: Aligned and synchronised the payment methods UI with the main rentals portal aesthetics, incorporating shared filters, responsive tables, and custom action modals.
- **Strict TypeScript Refactoring**: Clean TypeScript verification (`tsc --noEmit`) throughout frontend and backend services, securing schema bindings and reliable payload handling in generic HTTP utilities.

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

2. Configure environment variables. Ensure both `apps/api/.env` and `apps/web/.env.local` are set up. Note that global configurations (like the WhatsApp contact number) are managed dynamically in the database via the CMS settings.
   ```env
   # API Example
   DATABASE_URL="mysql://user:password@localhost:3306/soulani_garage"
   JWT_SECRET="your-super-secret-key"
   
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
- **Phase 7:** Production Hardening & Cloud Deployment

---

## 📚 Documentation Updates
- Updated `technical_architecture.md`, `business_requirements.md`, and `product_architecture.md` to reflect Phase 5 & 6 outcomes, including unified CRM Leads workspace, column‑level infinite scroll, drag‑and‑drop rollback, strict TypeScript hardening, and RBAC/localization matrix.
---
*Built with ❤️ for Soulani Auto Garage.*
