# Soulani Auto Garage - Backend API ⚙️

This is the RESTful API backend for the Soulani Auto Garage application, built with **NestJS**, **Prisma ORM**, and **MySQL**.

## 🚀 Technologies Used
- **Framework:** NestJS (Node.js/TypeScript)
- **Database:** MySQL via Prisma ORM
- **Authentication:** Passport-JWT, bcrypt password hashing
- **Security:** `@nestjs/throttler` (Environment-aware Rate Limiting)
- **Uploads:** Multer (Local disk storage)

## 🛠️ Setup & Running Locally

1. **Environment Variables**
   Ensure you have configured `.env` correctly based on the `.env.example` in the root repository.
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/soulani_garage"
   JWT_SECRET="your-super-secret-key"
   ```

2. **Database Initialization**
   Apply migrations and seed the initial data (requires `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` in `.env`).
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

3. **Start the API Server**
   ```bash
   # development mode (restarts on save)
   pnpm run start:dev

   # production mode
   pnpm run start:prod
   ```
   The API will be available at `http://localhost:3001/api/v1`

## 🛡️ Key Features
- **Centralized Throttling:** Dynamic rate limiting based on `NODE_ENV`. Strict limits for `/auth` and `/leads` endpoints.
- **RBAC (Role-Based Access Control):** Granular access management for Super Admins, Sales Staff, and Rental Staff.
- **Automated Audit Logs:** Tracks `CREATE`, `UPDATE`, and `DELETE` actions securely in the background.
