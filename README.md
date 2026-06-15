# Soulani Auto Garage 🚗✨

Soulani Auto Garage is a modern, full-stack monorepo application designed to manage a premium automotive business. It handles vehicle inventory, sales, long-term rentals, inspections, and customer CRM all under one beautifully designed platform.

## 🏗️ Architecture

This project is built using [Turborepo](https://turborepo.org/) and is structured into the following applications:

- **`apps/web`**: The frontend Admin Portal built with [Next.js](https://nextjs.org/) (App Router), React Hook Form, Zod, TailwindCSS, and SweetAlert2.
- **`apps/api`**: The backend REST API built with [NestJS](https://nestjs.com/), providing robust endpoints, JWT authentication, and global exception handling.
- **Database Layer**: Managed by [Prisma ORM](https://www.prisma.io/) connecting to a MySQL database, featuring strict uniqueness constraints, soft deletes, and robust relational mapping.

## 🚀 Current Progress: Phase 2 Complete

The application has successfully completed **Phase 1 (Foundation)** and **Phase 2 (Vehicle Inventory & Content Management)**.

### Features Implemented:
- **Authentication & RBAC:** Secure JWT-based login with role-based access control (Super Admin, Sales Staff, Rental Staff). Session expiration is strictly enforced globally.
- **Inventory CRUD:** Comprehensive vehicle management including make, model, year, VIN, and plate number tracking.
- **Image Pipeline:** Full image upload functionality using Multer, supporting primary image selection, dynamic static serving, and CORS handling.
- **Inspections Module:** A dedicated tab for logging detailed vehicle inspection statuses across Engine, Transmission, Suspension, Electrical, A/C, and more.
- **Pricing Configuration:** Granular pricing settings bifurcated by vehicle type (Sale vs. Rental), including daily rates and deposit amounts.
- **Audit Logging:** Automated, background tracking of core events (CREATE, UPDATE, DELETE) across the inventory.
- **Pagination & Filtering:** Efficient server-side pagination with API-level filtering.
- **Error Handling:** Custom Prisma Exception Filters translating database constraint errors (e.g., duplicate plate numbers) into human-readable UI alerts.

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
   
   # Web Example
   NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
   ```

3. Run database migrations:
   ```sh
   cd apps/api
   npx prisma generate
   npx prisma db push
   ```

### Running Locally

To start both the Web App and the API concurrently:

```sh
pnpm dev
```
- The **Frontend** will be available at `http://localhost:3000`
- The **API** will be available at `http://localhost:3001/api/v1`

## 🔮 Upcoming Phases
- **Phase 3:** Lead Management & Sales CRM
- **Phase 4:** Rental Operations & Booking Calendar
- **Phase 5:** Notifications & Follow-ups
- **Phase 6:** Owner Analytics Dashboard & CMS
- **Phase 7:** Production Hardening & Cloud Deployment

---
*Built with ❤️ for Soulani Auto Garage.*
