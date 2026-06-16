# Comprehensive Consistency Audit Report

**Role:** Principal Architect
**Project:** Soulani Auto Garage
**Date:** 2026-06-16

This document outlines a thorough architectural and consistency audit across the Business Requirements (BRD), Product Architecture, Technical Architecture, Wireframes, Database Schema, and API Specifications.

## 1. Business Requirement Gaps
**Missing Lead-to-Booking Conversion Flow**
*   **Severity:** High
*   **Explanation:** The BRD allows customers to negotiate "Long-Term Quotes" via WhatsApp. However, once a quote is accepted, there is no automated mechanism to convert that `Lead` into a confirmed `RentalBooking` with the custom price.
*   **Recommendation:** Add a feature/endpoint to "Convert Lead to Booking," which generates a private checkout link or directly creates a `RentalBooking` with a custom `totalPrice`.
*   **Impact if ignored:** Staff will have to manually insert bookings into the database or use dummy listings to block out the calendar, risking double-bookings and reporting inaccuracies.

## 2. Missing User Journeys
**Rental Return & Damage Inspection Journey**
*   **Severity:** High
*   **Explanation:** The journey ends when the customer picks up the car. There is no defined process for when the car is returned, how damages are recorded, and how the deposit is handled.
*   **Recommendation:** Define a "Return Flow" where Admin completes a `VehicleInspection` tied specifically to a `RentalBooking`, followed by a deposit refund status update.
*   **Impact if ignored:** Operational chaos during vehicle returns and disputes over deposit refunds.

## 3. Missing Database Entities
**Proof of Transfer (Receipts) & Deposit Tracking**
*   **Severity:** Critical
*   **Explanation:** The platform relies on manual offline payments (Bank Transfer). The `RentalBooking` entity has no field for the customer to upload their payment receipt (`proof_of_transfer_url`).
*   **Recommendation:** Add `proofOfTransferUrl` to `RentalBooking` and `depositStatus` (Pending, Held, Refunded, Forfeited).
*   **Impact if ignored:** Admins will have to blindly check the bank account and guess which transfer belongs to which booking, leading to severe operational bottlenecks.

## 4. Missing API Endpoints
**Admin Collection Endpoints**
*   **Severity:** High
*   **Explanation:** The API spec outlines `POST /rental-bookings` and `PUT /rental-bookings/:id/status`, but is entirely missing `GET /rental-bookings` for the Admin Dashboard to actually list and view the bookings. Similarly, `DELETE /vehicles/:id` is missing.
*   **Recommendation:** Add `GET /rental-bookings` with filters (status, date range) and `DELETE /vehicles/:id` to the API Specification.
*   **Impact if ignored:** Front-end developers will be blocked from building the Rental Admin Dashboard.

## 5. Security Concerns
**Token Invalidation & Local File Execution**
*   **Severity:** Critical
*   **Explanation:** 
    1. There is no `POST /auth/logout` endpoint or token blacklisting mechanism, meaning JWTs live until expiration even if a user logs out.
    2. Local file uploads via Multer pose a severe risk if the `/uploads` directory is served without execution prevention (e.g., someone uploads a `.php` or `.sh` file instead of an image).
*   **Recommendation:** Implement token blacklisting in Redis or MySQL. Ensure the `/uploads` directory is served strictly as static assets with forced MIME-type checking and execution disabled.
*   **Impact if ignored:** Account hijacking and severe Remote Code Execution (RCE) vulnerabilities.

## 6. Scalability Concerns
**Synchronous View Count Tracking**
*   **Severity:** Medium
*   **Explanation:** `POST /analytics/vehicles/:id/track-view` increments a row in `VehicleAnalytics` synchronously on every page load. This will cause database row-level locking and severe performance degradation under high traffic.
*   **Recommendation:** Decouple view tracking using Redis (increment in memory) and run a background cron job to sync the counts to MySQL every 15 minutes.
*   **Impact if ignored:** Database connections will exhaust and the site will crash during high-traffic marketing campaigns.

## 7. UX Inconsistencies
**Filter Disconnect between Wireframes and API**
*   **Severity:** Low
*   **Explanation:** The `wireframes.md` show a "Price Range" slider (e.g., Rp 0 to 500jt), but the `api_specification.md` for `GET /vehicles` does not specify `minPrice` or `maxPrice` query parameters.
*   **Recommendation:** Update the `GET /vehicles` API spec to include `minPrice` and `maxPrice` filters.
*   **Impact if ignored:** Front-end will have to fetch all cars and filter on the client side, causing slow UI performance and excessive payload sizes.

## 8. SEO Issues
**ISR Stale Data on Vehicle Detail Pages (VDP)**
*   **Severity:** Medium
*   **Explanation:** Next.js ISR is set to revalidate every 1800s (30 minutes). If a car is sold, it will continue to show as "Available" on Google and to public users for up to 30 minutes.
*   **Recommendation:** Implement Next.js On-Demand Revalidation. When a vehicle's status is updated to `SOLD` via the API, the backend should trigger a webhook to Vercel to immediately purge the cache for that specific slug.
*   **Impact if ignored:** Customer frustration and high bounce rates from inquiring about cars that are already sold.

## 9. Performance Risks
**Full Table Scans on Search**
*   **Severity:** Medium
*   **Explanation:** The API spec mentions using `ILIKE` for searches on `make`, `model`, and `plate_number`. However, `schema.prisma` only has `@@fulltext([make, model])`. Searching `plate_number` via `LIKE %...%` will cause a full table scan.
*   **Recommendation:** Add `plate_number` to the Prisma `@@fulltext` index, and ensure the API uses Prisma's `search` feature rather than `contains` (LIKE).
*   **Impact if ignored:** Slow search query response times as the inventory grows.

## 10. Overengineered Components
**Mini-CRM inside the Application**
*   **Severity:** Low
*   **Explanation:** Building a custom Kanban board, lead assignment, and follow-up tracking system (`LeadFollowup`) is complex for an MVP.
*   **Recommendation:** While kept in scope per requirements, consider if a lightweight integration (e.g., via Zapier to HubSpot or Trello) would achieve the same result with 80% less engineering effort.
*   **Impact if ignored:** Increased MVP development time and testing overhead.

## 11. Underdesigned Components
**Payment Verification Workflow**
*   **Severity:** High
*   **Explanation:** Covered in Entity Gaps. The lack of a "Proof of Transfer" upload mechanism leaves the payment workflow entirely broken and ambiguous for both the user and the admin.
*   **Recommendation:** Design a "Upload Receipt" screen in the UI and wire it to a new API endpoint `POST /rental-bookings/:id/receipt`.
*   **Impact if ignored:** Admins cannot efficiently verify payments.

## 12. MVP Scope Violations
**Advanced Analytics Dashboard**
*   **Severity:** Medium
*   **Explanation:** `api_specification.md` includes a `GET /analytics/dashboard` endpoint with complex aggregations (Lead Conversion Rate, Revenue, etc.). `product_architecture.md` lists Advanced Analytics under Phase 3, yet the Super Admin dashboard requires it in Phase 1.
*   **Recommendation:** Simplify the Phase 1 dashboard to only show basic counts (Total Cars, Active Rentals, New Leads). Defer complex conversion and revenue calculations to Phase 2/3 to protect the MVP timeline.
*   **Impact if ignored:** Risk of missing MVP launch deadline due to complex SQL view creation and optimization.

---

## Prioritized Action Plan

| Priority | Issue / Task | Effort | Business Value |
| :--- | :--- | :--- | :--- |
| **P0** | **Add Payment Receipt Upload Flow:** Add `proofOfTransferUrl` to Schema, update Booking API, and add UI upload step. | Medium | Critical |
| **P0** | **Add Missing API Endpoints:** Add `GET /rental-bookings` and `DELETE /vehicles/:id` to API Spec. | Low | Critical |
| **P1** | **Implement On-Demand ISR Revalidation:** Ensure VDPs update immediately when a vehicle is sold. | Low | High |
| **P1** | **Define Rental Return & Inspection Flow:** Create standard operating procedure and link `VehicleInspection` to `RentalBooking`. | Medium | High |
| **P1** | **Add Pricing Filters:** Add `minPrice` and `maxPrice` to `GET /vehicles` API to support UI. | Low | High |
| **P2** | **Secure Local Uploads & JWT:** Add execution-prevention on `/uploads` and implement JWT logout endpoint. | Medium | High |
| **P2** | **Convert Lead to Booking API:** Create endpoint to transition "Won" Long-Term Quotes into active Rental Bookings. | High | Medium |
| **P3** | **Decouple View Tracking (Redis):** Move `track-view` endpoint logic to Redis to prevent DB locks. | Medium | Low (for MVP) |
| **P3** | **Simplify MVP Analytics:** Strip complex aggregations from the Phase 1 Owner Dashboard. | Low | Medium (Saves time) |
