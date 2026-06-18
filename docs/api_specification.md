# Soulani Auto Garage - REST API Specification

**Stack:** NestJS, Prisma, MySQL, JWT, Local File Storage (Multer)
**Base URL:** `/api/v1`
**Content-Type:** `application/json` (unless noted as `multipart/form-data`)
**Default Currency:** IDR (Indonesian Rupiah)

> [!NOTE]
> Cloudinary integration is deferred to Phase 7. All image references in this document use the local file storage convention: `file_path` (stored in DB, relative) and `imageUrl` (computed in API response, absolute URL).

---

## Global Standards

### Authentication & Authorization
- **Authentication:** Bearer JWT in the `Authorization` header (`Authorization: Bearer <token>`).
- **RBAC Roles:** `SUPER_ADMIN`, `SALES_STAFF`, `RENTAL_STAFF` (matching `UserRole` enum in schema).
- **RBAC Implementation:**
  - NestJS custom `@Roles()` decorator paired with a global `RolesGuard`.
  - Routes decorated with `@Public()` bypass `JwtAuthGuard` entirely (e.g., `GET /vehicles`, `GET /vehicles/by-slug/:slug`, `POST /leads`).
  - For ownership-sensitive entities (e.g., Leads), an `OwnershipGuard` ensures that `SALES_STAFF` can only modify resources assigned to them, while `SUPER_ADMIN` retains full global read/write access.

### Pagination, Filtering, Sorting, and Search
All `GET` collection endpoints adhere to the following standard query parameters:
- **Pagination:** `?page=1&limit=20` (Default: `page=1`, `limit=10`)
- **Search:** `?search=alphard` (Performs full-text search on `make`, `model` columns)
- **Filtering:** `?status=ACTIVE&listingType=SALE&carType=SUV&transmission=AUTOMATIC&fuelType=GASOLINE`
- **Sorting:** `?sort=newest` (Values: `newest`, `oldest`, `price:asc`, `price:desc`, `year:asc`, `year:desc`, `mileage:asc`, `mileage:desc`)
- **Boolean Flags:** `?isFeatured=true&isNewArrival=true`

### Security & Validation Rules
- **Rate Limiting (via `@nestjs/throttler`):**
  - Public Lead Submissions (`POST /leads`): Max **10** requests per IP per hour.
  - Public Booking Submissions (`POST /rental-bookings`): Max **5** requests per IP per hour.
  - Public View Tracking (`POST /analytics/.../track-view`): Max **10** requests per IP per minute.
  - Auth Endpoints (`POST /auth/login`): Max **5** failed attempts per IP per 15 minutes (brute-force protection).
  - General public read endpoints (`GET /vehicles`, `GET /vehicles/by-slug/:slug`, etc.): Max 1000 per minute / 10000 per hour (generous limit to allow SSG/ISR fetching).
  - Admin endpoints: `@SkipThrottle()` — no rate limiting applied.
- **Data Sanitization:** All string inputs must be sanitized using `class-validator` (e.g., `@IsString()`, `@MaxLength()`) to prevent XSS.
- **Strict Typing:** All DTOs enforce `whitelist: true` and `forbidNonWhitelisted: true` in NestJS `ValidationPipe` to reject any payloads with unexpected properties.

### Standard Response Formats

**Success Collection Response (Paginated):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Standard Error Responses:**
- **400 Bad Request:** DTO validation errors.
- **401 Unauthorized:** Missing or invalid JWT.
- **403 Forbidden:** Insufficient RBAC permissions.
- **404 Not Found:** Resource does not exist (or soft-deleted).
- **409 Conflict:** Unique constraint violation (e.g., duplicate `plate_number`, `slug`). Mapped by `PrismaExceptionFilter` from Prisma error `P2002`.
- **422 Unprocessable Entity:** Business logic/conflict validation errors (e.g., overlapping blackout dates, vehicle not available).
- **429 Too Many Requests:** Rate limit exceeded.
- **500 Internal Server Error:** Unexpected backend failures.

```json
// Example 400 Validation Error Payload
{
  "statusCode": 400,
  "message": ["make must be a string", "year must not be less than 1990"],
  "error": "Bad Request"
}
```

```json
// Example 409 Conflict Error (PrismaExceptionFilter: P2002)
{
  "statusCode": 409,
  "message": "A record with this value already exists.",
  "error": "Conflict"
}
```

---

## 1. Auth Module

### `POST /auth/login`
- **Access:** Public (Rate limited: Max 5 failed attempts per IP per 15 minutes)
- **Validation:** `email` (string, required, email format), `password` (string, required)
- **Request Payload:**
  ```json
  { "email": "admin@soulani.com", "password": "securepassword123" }
  ```
- **Response (200 OK):**
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "def456...",
    "user": {
      "id": 1,
      "role": "SUPER_ADMIN",
      "name": "Owner Soulani"
    }
  }
  ```

---

## 2. Vehicles Module

### `GET /vehicles`
- **Access:** Public (`@Public()`)
- **Query Params:** `page`, `limit`, `search`, `sort`, `listingType` (SALE|RENTAL|BOTH), `status` (ACTIVE|SOLD|RENTED|MAINTENANCE — excludes DRAFT from public view), `carType` (SUV|MPV|HATCHBACK|SEDAN|COUPE|CONVERTIBLE|WAGON|PICKUP|VAN|CROSSOVER), `transmission` (MANUAL|AUTOMATIC|CVT), `fuelType` (GASOLINE|DIESEL|HYBRID|ELECTRIC), `isFeatured` (boolean), `isNewArrival` (boolean), `minPrice` (number), `maxPrice` (number).
- **Response (200 OK):** Paginated array of Vehicle objects (including computed `imageUrl` on each image).

> [!NOTE]
> `DRAFT` vehicles are excluded from all public `GET /vehicles` responses. They are only accessible via the admin-only `GET /vehicles/admin/list` endpoint.

### `GET /vehicles/admin/list`
- **Access:** Protected (Admin, `@SkipThrottle()`)
- **Query Params:** Same as `GET /vehicles`, but also returns `DRAFT` vehicles.
- **Response (200 OK):** Paginated Vehicle objects including draft records.

### `GET /vehicles/by-slug/:slug`
- **Access:** Public (`@Public()`)
- **Description:** Look up a vehicle by its immutable URL slug. This route **must be declared before** `GET /vehicles/:id` in the NestJS controller to prevent `"by-slug"` from being parsed as a numeric ID.
- **Response (200 OK):** Full Vehicle object with relations (Images with computed `imageUrl`, SalesListing, RentalListing, Inspections, Analytics).

### `GET /vehicles/:id`
- **Access:** Public (`@Public()`)
- **Response (200 OK):** Vehicle details by numeric ID (used by admin dashboard).

### `POST /vehicles`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`, `@SkipThrottle()`)
- **Content-Type:** `multipart/form-data`
- **Request Body:**
  - `data` (string, required): JSON-stringified vehicle DTO including inspection fields.
  - `files` (array, required): At least 1 image file. Max 10 files. Allowed types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.jfif`. Max 5MB each.
- **Validation (within `data` JSON):**
  - `make` (string, required), `model` (string, required), `year` (int, 1990–current, required), `color` (string, required), `listingType` (Enum: SALE|RENTAL|BOTH, required), `carType` (Enum, required), `transmission` (Enum, optional), `fuelType` (Enum, optional), `mileage` (int ≥ 0, optional), `vin`, `plateNumber`, `chassisNumber`, `engineNumber` (optional unique strings).
  - `inspectionDate` (ISO date, required), `inspectorName` (string, required), all inspection status fields (PASS|FAIL|NEEDS_ATTENTION, required).
  - `price` (decimal, required if `listingType` is SALE or BOTH), `previousOwners` (int ≥ 0, optional).
  - `dailyRate`, `depositAmount` (decimal, required if `listingType` is RENTAL or BOTH), `isLongTermEligible` (boolean).
- **Behavior:** Vehicle is created with `status: DRAFT`. Must be published separately.
- **Response (201 Created):** Full created Vehicle object.

### `PATCH /vehicles/:id`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Content-Type:** `application/json`
- **Request Payload:** Partial Vehicle object (fields to update).
- **Response (200 OK):** Updated Vehicle object.

### `PATCH /vehicles/:id/publish`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Description:** Transitions a vehicle from `DRAFT` → `ACTIVE`, making it visible on the public website.
- **Response (200 OK):** Updated Vehicle object with `status: ACTIVE`.

### `DELETE /vehicles/:id`
- **Access:** Protected (`SUPER_ADMIN`)
- **Description:** Soft-deletes a vehicle (sets `deleted_at` timestamp).
- **Response (200 OK):** `{ "message": "Vehicle successfully archived", "id": 12 }`

### `POST /vehicles/:id/restore` *(planned)*
- **Access:** Protected (`SUPER_ADMIN`)
- **Description:** Restores a soft-deleted vehicle (sets `deleted_at` to null).
- **Response (200 OK):** `{ "message": "Vehicle successfully restored", "id": 12 }`

---

## 3. Vehicle Images Module

> [!NOTE]
> Vehicle images are **not** uploaded via this module directly. Images are uploaded as part of `POST /vehicles` (multipart). This module handles post-creation image management (reordering, deletion, updating primary flag).

### `GET /vehicles/:id/images`
- **Access:** Protected
- **Response (200 OK):** Array of `VehicleImage` objects with computed `imageUrl`.

### `DELETE /vehicle-images/:imageId`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Description:** Deletes a single vehicle image (removes file from disk and DB record).
- **Response (200 OK):** `{ "message": "Image deleted successfully" }`

---

## 4. Vehicle Inspections Module

### `POST /vehicles/:id/inspections`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Validation:** All 8 component statuses must be Enums: `PASS`, `FAIL`, `NEEDS_ATTENTION`.
- **Request Payload:**
  ```json
  {
    "inspectorName": "Agus Mechanic",
    "inspectionDate": "2026-06-01T09:00:00Z",
    "engineStatus": "PASS",
    "transmissionStatus": "PASS",
    "suspensionStatus": "NEEDS_ATTENTION",
    "electricalStatus": "PASS",
    "acStatus": "PASS",
    "tiresStatus": "PASS",
    "interiorStatus": "PASS",
    "exteriorStatus": "PASS",
    "generalNotes": "Minor scratch on rear bumper. Front suspension bushing needs replacement soon."
  }
  ```
- **Response (201 Created):** Created Inspection record.

### `GET /vehicles/:id/inspections`
- **Access:** Public
- **Response (200 OK):** Array of inspection records for the vehicle.

---

## 5. Sales Listings Module

### `POST /sales-listings`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Validation:** `vehicleId` (int, required), `price` (decimal, > 0, required), `previousOwners` (int, >= 0, required).
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicleId": 12,
    "price": 850000000.00,
    "previousOwners": 1
  }
  ```
- **Response (201 Created):** Created Sales Listing record.

### `PATCH /sales-listings/:id`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`)
- **Request Payload:** Partial Sales Listing object.
- **Response (200 OK):** Updated Sales Listing.

---

## 6. Rental Listings Module

### `POST /rental-listings`
- **Access:** Protected (`SUPER_ADMIN`, `RENTAL_STAFF`)
- **Validation:** `vehicleId` (int, required), `dailyRate` (decimal, > 0, required), `weeklyRate` (decimal, optional), `depositAmount` (decimal, required), `isLongTermEligible` (boolean, required).
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicleId": 15,
    "dailyRate": 1500000.00,
    "weeklyRate": 9000000.00,
    "depositAmount": 5000000.00,
    "isLongTermEligible": true
  }
  ```
- **Response (201 Created):** Created Rental Listing record.

---

## 7. Rental Bookings Module

### `POST /rental-bookings`
- **Access:** Public (Guest Checkout) (Rate limited: Max 5 requests per IP per hour)
- **Validation:** `rentalListingId` (int, required), `customerName` (string, required), `customerPhone` (string, required, Indonesian format regex), `customerEmail` (string, email, required), `startDate` (ISO string, future, required), `endDate` (ISO string, > startDate, required), `paymentMethodId` (int, required), `identityNumber` (string, optional), `whatsappOptIn` (boolean, optional).
- **Request Payload:**
  ```json
  {
    "rentalListingId": 3,
    "customerName": "Budi Santoso",
    "customerPhone": "+628123456789",
    "customerEmail": "budi.santoso@gmail.com",
    "startDate": "2026-08-01T10:00:00Z",
    "endDate": "2026-08-05T10:00:00Z",
    "paymentMethodId": 2,
    "whatsappOptIn": true
  }
  ```
- **Response (201 Created — IDR Currency):**
  ```json
  {
    "bookingId": 105,
    "status": "PENDING_PAYMENT",
    "totalPrice": 6000000.00,
    "paymentInstructions": "Please transfer the amount of Rp 6.000.000 to BCA Account 1234567890 (a/n Soulani Auto Garage). Include your booking reference in the transfer notes."
  }
  ```

### `PUT /rental-bookings/:id/status`
- **Access:** Protected (`SUPER_ADMIN`, `RENTAL_STAFF`)
- **Validation:** `status` (Enum: `PENDING_PAYMENT` | `CONFIRMED` | `ACTIVE` | `COMPLETED` | `CANCELLED` | `OVERDUE`).
- **Request Payload:**
  ```json
  { "status": "CONFIRMED" }
  ```
- **Response (200 OK):** Updated Booking.

---

## 8. Leads Module

### `POST /leads`
- **Access:** Public (`@Public()`) (Rate limited: Max **10** requests per IP per hour)
- **Validation:**
  - `vehicleId` (int, required)
  - `type` (Enum: `SALES_INQUIRY` | `TEST_DRIVE_REQUEST` | `MAKE_OFFER` | `RENTAL_INQUIRY` | `LONG_TERM_QUOTE`, required)
  - `customerName` (string, required, min 2 chars)
  - `customerPhone` (string, required, Indonesian phone regex: `^(\+62|62|0)8[1-9][0-9]{6,10}$`)
  - `customerEmail` (string, email format, optional)
  - `offeredPrice` (decimal, > 0, optional — only meaningful when `type = MAKE_OFFER`)
  - `message` (string, max 500 chars, optional)
  - `source` (Enum: `ORGANIC` | `GOOGLE_ADS` | `FACEBOOK` | `INSTAGRAM` | `DIRECT` | `WHATSAPP` | `REFERRAL`, optional)
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicleId": 12,
    "type": "MAKE_OFFER",
    "customerName": "Eko Wijaya",
    "customerPhone": "+628987654321",
    "customerEmail": "eko@gmail.com",
    "offeredPrice": 820000000.00,
    "message": "Saya ingin negosiasi harga.",
    "source": "ORGANIC"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "leadReferenceId": "LD-2026-X9F2A",
    "whatsappRedirectUrl": "https://wa.me/6281210663530?text=Halo%20Admin%20Soulani..."
  }
  ```

### `GET /leads`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF` with OwnershipGuard)
- **Query Params:** `page`, `limit`, `status` (LeadStatus enum value).
- **Note:** `SALES_STAFF` only retrieves leads assigned to them.
- **Response (200 OK):** Paginated array of Leads.

### `GET /leads/:id`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF` with OwnershipGuard)
- **Response (200 OK):** Detailed Lead object with relations.

### `PUT /leads/:id/assign`
- **Access:** Protected (`SUPER_ADMIN`)
- **Request Payload:**
  ```json
  { "assignedTo": 4 }
  ```
- **Response (200 OK):** Updated Lead object.

### `POST /leads/bulk-assign`
- **Access:** Protected (`SUPER_ADMIN`)
- **Purpose:** Assign multiple leads to a specific sales staff member at once.
- **Request Payload:**
  ```json
  {
    "leadIds": [101, 102, 103],
    "assignedTo": 4
  }
  ```
- **Validation:** `leadIds` array length must be between 1 and 50. `assignedTo` must be a valid `SALES_STAFF` user ID.
- **Response (200 OK):**
  ```json
  { "message": "Successfully assigned 3 leads", "assignedTo": 4 }
  ```

### `PATCH /leads/:id/test-drive`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF` with OwnershipGuard)
- **Purpose:** Schedule a test drive date for a sales lead.
- **Request Payload:**
  ```json
  {
    "testDriveDate": "2026-08-05T14:00:00Z",
    "notes": "Customer requested afternoon test drive in South Jakarta."
  }
  ```
- **Validation:** Date must be in the future.
- **Response (200 OK):** Updated Lead details with test drive info.

---

## 9. Lead Followups Module

### `POST /leads/:id/followups`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF` with OwnershipGuard)
- **Validation:** `noteText` (string, required), `newStatus` (LeadStatus enum, optional).
- **Request Payload:**
  ```json
  {
    "noteText": "Called customer, confirmed test drive schedule for 5th Aug.",
    "newStatus": "CONTACTED"
  }
  ```
- **Response (201 Created):** Followup record.

---

## 10. Testimonials Module

### `GET /testimonials`
- **Access:** Public (Only returns records where `is_published = true`)
- **Response (200 OK):** Array of Testimonial objects.

### `POST /testimonials`
- **Access:** Protected (`SUPER_ADMIN`)
- **Request Payload:**
  ```json
  {
    "authorName": "Rian Adi",
    "authorTitle": "Developer",
    "rating": 5,
    "quoteText": "Sangat puas dengan rental Alphard di Soulani Auto Garage. Kondisi mobil prima dan adminnya sangat responsif!",
    "isPublished": true
  }
  ```
- **Response (201 Created):** Created Testimonial object.

---

## 11. Homepage CMS Module

### `GET /cms/homepage`
- **Access:** Public
- **Response (200 OK):** JSON containing all active `HomepageContent` key-value entries (Hero Banners, Promos, landing page settings).

### `PUT /cms/homepage`
- **Access:** Protected (`SUPER_ADMIN`)
- **Request Payload:** Full or partial JSON structure of homepage content keys to update.
- **Response (200 OK):** Updated homepage CMS content.

### `POST /cms/promos`
- **Access:** Protected (`SUPER_ADMIN`)
- **Purpose:** Add a new promotional banner/section to the homepage.
- **Request Payload:**
  ```json
  {
    "title": "Promo Merdeka - Rental 3 Hari Gratis 1 Hari",
    "imageUrl": "/uploads/promos/merdeka.jpg",
    "targetUrl": "/rental",
    "isActive": true
  }
  ```
- **Response (201 Created):** Created Promo banner object.

---

## 12. Users Module (Staff Management)

### `GET /users`
- **Access:** Protected (`SUPER_ADMIN`)
- **Response (200 OK):** Array of staff members (excluding `passwordHash`).

### `POST /users`
- **Access:** Protected (`SUPER_ADMIN`)
- **Validation:** `email` (email, required), `role` (Enum: `SUPER_ADMIN` | `SALES_STAFF` | `RENTAL_STAFF`, required), `password` (string, min 8 chars, required).
- **Request Payload:**
  ```json
  {
    "name": "Alice Agent",
    "email": "alice@soulani.com",
    "password": "TempPassword123!",
    "role": "SALES_STAFF"
  }
  ```
- **Response (201 Created):** User record (excluding `passwordHash`).

---

## 13. Analytics Module

### `GET /analytics/dashboard`
- **Access:** Protected (`SUPER_ADMIN`)
- **Purpose:** Fetches aggregated Super Admin (Owner) dashboard metrics.
- **Query Params:** Optional date ranges `?startDate=...&endDate=...`
- **Response Payload (IDR Currency):**
  ```json
  {
    "totalAvailableCars": 45,
    "carsSoldThisMonth": 12,
    "activeRentals": 8,
    "rentalRevenue": 150000000.00,
    "salesLeads": 120,
    "rentalLeads": 85,
    "leadConversionRate": 10.5,
    "upcomingRentalReturns": 3,
    "mostViewedVehicles": [
      { "id": 1, "make": "Toyota", "model": "Alphard", "views": 1500 }
    ]
  }
  ```

### `GET /analytics/vehicles/:id`
- **Access:** Protected (`SUPER_ADMIN`, `SALES_STAFF`, `RENTAL_STAFF`)
- **Response Payload:**
  ```json
  {
    "viewCount": 500,
    "inquiryCount": 15,
    "offerCount": 3,
    "rentalRequestCount": 0
  }
  ```

### `POST /analytics/vehicles/:id/track-view`
- **Access:** Public (Rate limited: Max 10 requests per IP per minute)
- **Purpose:** Increments the `view_count` for a vehicle. Fire-and-forget from client; errors are silently ignored.
- **Response (200 OK):**
  ```json
  { "success": true }
  ```

---

## 14. Blackout Dates Module

### `GET /vehicles/:id/availability`
- **Access:** Public
- **Purpose:** Returns all booked dates and blackout dates for a vehicle to render the frontend calendar.
- **Response Payload:**
  ```json
  {
    "unavailableDates": [
      { "start": "2026-08-10", "end": "2026-08-15", "reason": "Booked" },
      { "start": "2026-08-20", "end": "2026-08-22", "reason": "Maintenance" }
    ]
  }
  ```

### `POST /vehicles/:id/blackout-dates`
- **Access:** Protected (`SUPER_ADMIN`, `RENTAL_STAFF`)
- **Purpose:** Block out dates for maintenance or offline usage.
- **Request Payload:**
  ```json
  {
    "startDate": "2026-08-20",
    "endDate": "2026-08-22",
    "reason": "MAINTENANCE"
  }
  ```
- **Validation:** Dates must not overlap with `ACTIVE` or `CONFIRMED` rental bookings. `reason` must be Enum: `MAINTENANCE` | `ADMIN_BLOCK`.
- **Response (201 Created):** Created Blackout Date record.

### `DELETE /blackout-dates/:id`
- **Access:** Protected (`SUPER_ADMIN`, `RENTAL_STAFF`)
- **Response (200 OK):** `{ "message": "Blackout date removed successfully" }`

---

## 15. Audit Logs Module

### `GET /audit-logs`
- **Access:** Protected (`SUPER_ADMIN`)
- **Purpose:** Query system audit logs for compliance and troubleshooting.
- **Query Params:** `?moduleName=vehicles&userId=5&action=UPDATE&startDate=...&endDate=...`
- **Response Payload:**
  ```json
  {
    "data": [
      {
        "id": 1024,
        "userId": 5,
        "action": "UPDATE",
        "moduleName": "vehicles",
        "recordId": 12,
        "previousValue": { "price": 500000000.00 },
        "newValue": { "price": 480000000.00 },
        "timestamp": "2026-06-15T10:00:00Z"
      }
    ]
  }
  ```
