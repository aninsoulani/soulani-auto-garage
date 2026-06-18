# Executive Summary
Soulani Auto Garage is transforming the Indonesian automotive market by providing a modern, transparent, and user-friendly platform for buying and renting vehicles. Moving away from intimidating luxury dealerships and sketchy marketplaces, Soulani offers a high-quality, tech-enabled experience. The MVP will deliver a public-facing website, a robust RBAC Admin Dashboard, a CRM for lead capture, and a rental engine with manual payment verification.

# Business Objectives
- Establish a trustworthy and transparent automotive marketplace in Indonesia.
- Streamline the lead capture process by mandating CRM logging before WhatsApp engagement.
- Simplify short-term vehicle rentals through direct booking and facilitate long-term rentals via custom quotes.
- Provide business intelligence to the Owner through an analytics dashboard.
- Deliver a fast, mobile-friendly, and accessible user experience that appeals to a wide demographic.

# Stakeholders
- **Owner/Founders:** Require high-level analytics, revenue tracking, and complete system control.
- **Sales Staff:** Need efficient lead management, inspection logging, and CRM tools to close deals.
- **Rental Staff:** Require fleet management, booking calendars, and blackout date controls.
- **Engineering/Product Team:** Responsible for system development, deployment, and maintenance.

# User Groups
- **Used Car Buyers:** Individuals or families looking to purchase inspected, high-quality used cars.
- **Short-Term Renters:** Customers needing a vehicle for 1-7 days with direct booking capabilities.
- **Long-Term Renters:** Customers requiring a vehicle for >7 days, seeking custom quotes and negotiations.
- **Super Admin:** The business owner with full access to analytics, staff management, and system settings.
- **Sales Staff:** Employees handling sales inquiries, test drives, and price negotiations.
- **Rental Staff:** Employees managing the rental fleet, booking approvals, and customer payments.

# Business Problems
- **Lack of Trust:** Customers face anxiety due to hidden pricing and unclear vehicle histories in traditional marketplaces.
- **Intimidating Experiences:** High-end dealerships alienate average buyers, while cheap marketplaces lack professional standards.
- **Disjointed Lead Management:** Leads are lost or poorly tracked when moved directly to WhatsApp without CRM logging.
- **Rental Friction:** Booking a car, especially for extended periods, is often a manual, cumbersome process.

# Scope
This BRD covers the MVP development, encompassing the public website, inventory management, CRM lead capture, rental booking engine, and RBAC admin dashboard. Phases 1–3 are now complete. Phases 4–7 are planned.

# Functional Requirements
1. **Public Website:**
   - Display dynamic homepage with search-first hero, quick categories, and featured inventory.
   - Provide listing pages with filters for Sales, synchronized to URL query parameters.
   - Show Vehicle Detail Pages (VDP) with 150-point inspection reports, images, and specifications.
   - Conditionally hide the inquiry form and display an informational banner for vehicles with status `SOLD` or `MAINTENANCE`.
2. **Sales Flow:**
   - Capture leads (Sales Inquiry, Test Drive, Make Offer) via a form on the VDP.
   - Generate a unique Lead ID (`LD-YYYY-XXXXX`) and save to CRM before redirecting the customer to WhatsApp.
   - Only display the inquiry form for vehicles with status `ACTIVE`. Vehicles in `SOLD` or `MAINTENANCE` status show a closed-inquiry panel.
3. **Rental Flow:**
   - Allow date-based search and availability checking.
   - Enable direct booking with guest checkout for Short-Term (1-7 days) rentals.
   - Trigger a custom quote request for Long-Term (>7 days) rentals, while still allowing standard booking.
   - Display offline manual payment instructions to customers upon booking.
4. **Admin Dashboard (RBAC):**
   - Provide module access based on roles: Super Admin, Sales Staff, Rental Staff.
   - Enable CRUD operations for Vehicles (with mandatory image upload and inspection data), Sales Listings, Rental Listings, and Testimonials.
   - Display an Analytics Overview for the Super Admin.
   - Vehicles start in `DRAFT` status and must be explicitly published to `ACTIVE` to appear publicly.
5. **CRM & Booking Management:**
   - Provide a Kanban board for Sales Staff to track and update lead statuses.
   - Allow Rental Staff to manage booking statuses and vehicle blackout dates.
   - Support lead assignment by Super Admin to specific Sales Staff.

# Non-Functional Requirements
1. **Performance:** App must use SSG + ISR for public pages for fast load times; CSR for admin dashboard. Animations must be snappy (150-300ms).
2. **Security:** Implement JWT authentication, RBAC, Helmet, strict CORS, and data sanitization.
3. **Rate Limiting:** Public lead/booking endpoints must be limited to 10 requests per IP per hour (leads) and 5 requests per IP per hour (bookings).
4. **Data Integrity:** Implement soft deletes (`deleted_at`) for all operational models. Capture every write operation via an Audit Logging Interceptor.
5. **Storage:** Use local file storage (Multer) for images as an MVP step before migrating to Cloudinary.
6. **Currency & Localization:** All transactions, prices, and metrics must be in Indonesian Rupiah (IDR). Target market is strictly Indonesia.

# Business Rules
- **Lead Capture Rule:** All sales inquiries MUST be logged into the CRM before redirecting the user to WhatsApp.
- **Draft/Publish Rule:** Vehicles created by admin staff enter a `DRAFT` state and must be explicitly published (`PATCH /vehicles/:id/publish`) to become `ACTIVE` and visible on the public website.
- **Inquiry Availability Rule:** Inquiry forms are only accessible for vehicles with status `ACTIVE`. Vehicles with status `SOLD` or `MAINTENANCE` display a closed-inquiry informational panel instead.
- **Rental Duration Rule:** Rentals over 7 days must prompt the user for a custom quote, though standard rack-rate booking remains an option.
- **Data Access Rule:** Sales staff can only view and manage leads explicitly assigned to them.
- **Currency Rule:** All monetary values must be represented and transacted in IDR.
- **Deletion Rule:** Records must not be permanently deleted (hard delete); soft deletes are mandatory to preserve audit trails.

# Assumptions
- Customers are comfortable completing transactions via manual offline bank transfers and verifying via WhatsApp.
- Staff will consistently log their WhatsApp follow-up interactions back into the CRM.
- The business has a dedicated and active WhatsApp Business number for handling communications.
- Development will strictly follow a local-first strategy, ensuring features work locally before cloud deployment.

# Constraints
- **Payment Processing:** Automated payment gateways are deferred; MVP relies entirely on manual verification.
- **Customer Accounts:** Customer portal (login/signup) is out of scope for MVP and deferred to Phase 1.5.
- **File Storage:** Cloudinary integration is deferred to Phase 7; MVP must handle file storage locally via Multer.

# KPIs
- Total Available Cars
- Cars Sold This Month
- Active Rentals & Upcoming Rental Returns
- Rental Revenue
- Sales Leads vs Rental Leads
- Lead Conversion Rate
- Most Viewed Vehicles

# Risks
- **Data Fragmentation:** Relying on WhatsApp for conversations risks losing data if staff fail to log notes in the CRM.
- **Payment Bottlenecks:** Manual payment verification for rentals could lead to slow confirmations and customer dissatisfaction.
- **Scalability:** Local file storage might face constraints if inventory scales rapidly before Phase 7.

# Dependencies
- Third-party hosting platforms (Vercel and Railway).
- Availability and stability of the WhatsApp Business API/Platform.
- Local infrastructure (MySQL via Laragon, Node.js) for the local-first development strategy.

# MVP Scope
- Public Website & CMS (SEO-optimized listings, homepage). ✅ Phases 1–3 Complete.
- Advanced Inventory Manager & Inspection Module. ✅ Complete.
- Rental Engine (Calendar, guest checkout, manual payments, long-term quote flow). ⚪ Phase 4.
- Lead CRM (Lead capture, assignment, tracking). ⚪ Phase 5.
- Local File Storage implementation. ✅ Complete.
- RBAC Admin Dashboard (Super Admin, Sales, Rental). ⚪ In Progress.

# Future Scope
- **Phase 1.5:** Customer Portal (Account creation, booking history, saved vehicles).
- **Phase 2:** Automated Payment Gateway (Midtrans/Xendit), 360° Interactive Vehicle Viewer, Financing Calculator.
- **Phase 3:** Advanced Admin Analytics, SMS/WhatsApp maintenance alerts, external accounting software integration.
- **Phase 7:** Migration of local file storage to Cloudinary.

# Open Questions
1. **Data Privacy:** What are the specific compliance requirements regarding Indonesia's Personal Data Protection (PDP) Law for customer data stored in the CRM?
2. **SLA for Responses:** What is the exact expected Service Level Agreement (SLA) for staff responding to WhatsApp leads (e.g., within 15 minutes, 1 hour)?
3. **Payment Verification:** What is the exact internal workflow for verifying manual bank transfers, and who is accountable for updating the booking status to "Confirmed"?
4. **Maintenance Blackouts:** Is there an automated buffer time required between rentals for vehicle cleaning/maintenance, or is this managed entirely manually via blackout dates?

# Appendix
- `wireframes.md`: Structural layout for Desktop and Mobile interfaces.
- `product_architecture.md`: Sitemap, user journeys, ERD, and feature lists.
- `technical_architecture.md`: System, frontend, backend, and database architecture.
- `api_specification.md`: REST API endpoints and security rules.
- `design_system.md`: Typography, color palette, components, and responsive design guidelines.
- `brand_direction.md`: Brand personality, voice, positioning, and visual direction.
- `schema.prisma`: Prisma ORM schema for the database (located at `apps/api/prisma/schema.prisma`).
