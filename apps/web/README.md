# Soulani Auto Garage - Frontend Web 🌐

This is the frontend application for Soulani Auto Garage, serving both the **Public Landing/Sales Page** and the **Secure Admin Dashboard**. Built with **Next.js (App Router)**.

## 🚀 Technologies Used
- **Framework:** Next.js (App Router, Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI components
- **Forms & Validation:** React Hook Form + Zod
- **State/Notifications:** Zustand, SweetAlert2, Sonner

## 🛠️ Setup & Running Locally

1. **Environment Variables**
   Ensure you have configured `.env.local` correctly based on the `.env.example` in the root repository.
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
   ```

2. **Start the Frontend Server**
   ```bash
   # development mode
   pnpm run dev

   # build for production
   pnpm run build
   pnpm run start
   ```

3. **Accessing the App**
   - **Public Website:** `http://localhost:3000`
   - **Admin Dashboard:** `http://localhost:3000/login`

## 🎨 Key Features
- **Dual-Mode App:** Seamlessly integrates a SEO-friendly public catalog with a deeply nested, protected Admin CRM dashboard.
- **Strict Validation:** Form inputs (like Profile updates and Lead Inquiries) are rigorously validated using Zod to ensure type safety before hitting the API.
- **Modern UI/UX:** Utilizes glassmorphism, micro-animations, and conditional rendering (e.g., Striking through "Pemilik Sebelumnya" for first-hand cars).
