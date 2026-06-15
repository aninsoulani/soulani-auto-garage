# Soulani Auto Garage - REST API Specification

**Stack:** NestJS, Prisma, MySQL, JWT, Cloudinary
**Base URL:** `/api/v1`
**Content-Type:** `application/json`
**Default Currency:** IDR (Indonesian Rupiah)

---

## Global Standards

### Authentication & Authorization
- **Authentication:** Bearer JWT in the `Authorization` header (`Authorization: Bearer <token>`).
- **RBAC Roles:** `Super_Admin`, `Sales_Staff`, `Rental_Staff`.
- **RBAC Implementation:**
  - NestJS custom `@Roles()` decorator paired with a global `RolesGuard`.
  - For ownership-sensitive entities (e.g., Leads), an `OwnershipGuard` must ensure that `Sales_Staff` or `Rental_Staff` can only modify resources assigned to them, while `Super_Admin` retains full global read/write access.

### Pagination, Filtering, Sorting, and Search
All `GET` collection endpoints must adhere to the following standard query parameters:
- **Pagination:** `?page=1&limit=20` (Default: `page=1`, `limit=10`)
- **Search:** `?search=alphard` (Performs case-insensitive search `ILIKE` on indexed text columns such as `make`, `model`, `plate_number`)
- **Filtering:** `?status=available&type=sale` (Exact match on specific columns)
- **Sorting:** `?sort=created_at:desc,price:asc` (Format: `field:direction`, comma-separated for multi-field sorting)

### Security & Validation Rules
- **Rate Limiting:**
  - Public Lead Submissions (`POST /leads`): Max 5 requests per IP per hour.
  - Public Booking Submissions (`POST /rental-bookings`): Max 5 requests per IP per hour.
  - Public View Tracking (`POST /analytics/.../track-view`): Max 10 requests per IP per minute.
  - Auth Endpoints (`POST /auth/login`): Max 5 failed attempts per IP per 15 minutes (Brute-force protection).
- **Data Sanitization:** All string inputs must be sanitized using `class-validator` (e.g., `@Trim()`, `@Escape()`) to prevent XSS.
- **Strict Typing:** All DTOs must enforce `whitelist: true` and `forbidNonWhitelisted: true` in NestJS `ValidationPipe` to reject any payloads with unexpected properties.

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
- **400 Bad Request:** Validation errors.
- **401 Unauthorized:** Missing or invalid JWT.
- **403 Forbidden:** Insufficient RBAC permissions.
- **404 Not Found:** Resource does not exist.
- **422 Unprocessable Entity:** Business logic/conflict validation errors (e.g., overlapping blackout dates).
- **500 Internal Server Error:** Unexpected backend failures.

```json
// Example 400 Validation Error Payload
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

```json
// Example 422 Business Logic/Conflict Error Payload
{
  "statusCode": 422,
  "message": "Validation Failed",
  "errors": [
    {
      "field": "start_date",
      "message": "Start date conflicts with an existing blackout date."
    }
  ],
  "timestamp": "2026-06-15T12:00:00Z",
  "path": "/api/v1/rental-bookings"
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
      "role": "Super_Admin",
      "name": "John Owner"
    }
  }
  ```

---

## 2. Vehicles Module

### `GET /vehicles`
- **Access:** Public
- **Query Params:** Standard pagination, search, sort, plus `type` (sale|rental|both), `isFeatured` (boolean).
- **Response (200 OK):** Array of Vehicle objects (omitting sensitive fields like cost price or internal notes).

### `GET /vehicles/:id`
- **Access:** Public
- **Response (200 OK):** Vehicle details including relations (Images, Sales/Rental Listing info).

### `POST /vehicles`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`)
- **Validation:** `make` (string, required), `model` (string, required), `year` (int, 1990-current, required), `color` (string, required), `type` (enum: sale|rental|both, required), `status` (enum: available|sold|rented|maintenance, required). `vin`, `plate_number`, `chassis_number`, `engine_number` are optional strings.
- **Request Payload:**
  ```json
  {
    "make": "Toyota",
    "model": "Alphard",
    "year": 2022,
    "color": "Black",
    "type": "sale",
    "status": "available",
    "plate_number": "B1234XYZ"
  }
  ```
- **Response (201 Created):** Created Vehicle object.

### `PUT /vehicles/:id`
- **Access:** Protected (`Super_Admin`, `Sales_Staff` with OwnershipGuard)
- **Request Payload:** Partial Vehicle object.
- **Response (200 OK):** Updated Vehicle object.

### `POST /vehicles/:id/restore`
- **Access:** Protected (`Super_Admin`)
- **Description:** Restores a soft-deleted vehicle (sets `deleted_at` to null).
- **Response (200 OK):**
  ```json
  { "message": "Vehicle successfully restored", "id": 12 }
  ```

---

## 3. Vehicle Images Module

### `POST /vehicles/:id/images/signature`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`)
- **Description:** Generates a Cloudinary secure upload signature to allow direct frontend uploading.
- **Response (200 OK):**
  ```json
  {
    "signature": "abc123xyz...",
    "timestamp": 1781500000,
    "apiKey": "123456789012345"
  }
  ```

### `POST /vehicles/:id/images`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`)
- **Validation:** `cloudinary_url` (url, required), `cloudinary_public_id` (string, required), `is_primary` (boolean, optional), `sort_order` (int, optional).
- **Request Payload:**
  ```json
  {
    "cloudinary_url": "https://res.cloudinary.com/soulani/image/upload/v123/vehicles/alphard.jpg",
    "cloudinary_public_id": "soulani/vehicles/alphard",
    "is_primary": true
  }
  ```
- **Response (201 Created):** Saved Image entity.

---

## 4. Vehicle Inspections Module

### `POST /vehicles/:id/inspections`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`)
- **Validation:** All component statuses must be Enums: `Pass`, `Fail`, `Needs_Attention`.
- **Request Payload:**
  ```json
  {
    "inspector_name": "Agus Mechanic",
    "engine_status": "Pass",
    "suspension_status": "Needs_Attention",
    "general_notes": "Minor scratch on rear bumper. Front suspension bushing needs replacement soon."
  }
  ```
- **Response (201 Created):** Created Inspection record.

---

## 5. Sales Listings Module

### `POST /sales-listings`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`)
- **Validation:** `vehicle_id` (int, required), `price` (decimal, > 0, required), `previous_owners` (int, >= 0, required).
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicle_id": 12,
    "price": 850000000.00,
    "previous_owners": 1
  }
  ```
- **Response (201 Created):** Created Sales Listing record.

---

## 6. Rental Listings Module

### `POST /rental-listings`
- **Access:** Protected (`Super_Admin`, `Rental_Staff`)
- **Validation:** `vehicle_id` (int, required), `daily_rate` (decimal, > 0, required), `weekly_rate` (decimal, optional), `deposit_amount` (decimal, required), `is_long_term_eligible` (boolean, required).
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicle_id": 15,
    "daily_rate": 1500000.00,
    "weekly_rate": 9000000.00,
    "deposit_amount": 5000000.00,
    "is_long_term_eligible": true
  }
  ```
- **Response (201 Created):** Created Rental Listing record.

---

## 7. Rental Bookings Module

### `POST /rental-bookings`
- **Access:** Public (Guest Checkout) (Rate limited: Max 5 requests per IP per hour)
- **Validation:** `rental_listing_id` (int, required), `customer_name` (string, required), `customer_phone` (string, required, Indonesian format), `customer_email` (string, email, required), `start_date` (ISO string, future, required), `end_date` (ISO string, > start_date, required), `payment_method_id` (int, required), `whatsapp_opt_in` (boolean, optional).
- **Request Payload:**
  ```json
  {
    "rental_listing_id": 3,
    "customer_name": "Budi Santoso",
    "customer_phone": "+628123456789",
    "customer_email": "budi.santoso@gmail.com",
    "start_date": "2026-08-01T10:00:00Z",
    "end_date": "2026-08-05T10:00:00Z",
    "payment_method_id": 2,
    "whatsapp_opt_in": true
  }
  ```
- **Response (201 Created - IDR Currency):**
  ```json
  {
    "booking_id": 105,
    "status": "Pending Payment",
    "total_price": 6000000.00,
    "payment_instructions": "Please transfer the amount of Rp 6.000.000 to BCA Account 1234567890 (a/n Soulani Auto Garage). Include your booking reference in the transfer notes."
  }
  ```

### `PUT /rental-bookings/:id/status`
- **Access:** Protected (`Super_Admin`, `Rental_Staff`)
- **Validation:** `status` (Enum: `Pending Payment`, `Confirmed`, `Active`, `Completed`, `Cancelled`, `Overdue`).
- **Request Payload:**
  ```json
  {
    "status": "Confirmed"
  }
  ```
- **Response (200 OK):** Updated Booking.

---

## 8. Leads Module

### `POST /leads`
- **Access:** Public (Rate limited: Max 5 requests per IP per hour)
- **Validation:** `vehicle_id` (int, required), `type` (Enum: `Sales Inquiry`, `Test Drive Request`, `Make Offer`, `Rental Inquiry`, `Long-Term Quote`, required), `customer_name` (string, required), `customer_phone` (string, required, Indonesian format), `offered_price` (decimal, optional, > 0).
- **Request Payload (IDR Currency):**
  ```json
  {
    "vehicle_id": 12,
    "type": "Make Offer",
    "customer_name": "Eko Wijaya",
    "customer_phone": "+628987654321",
    "offered_price": 820000000.00
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "lead_reference_id": "LD-2026-X9F2A",
    "whatsapp_redirect_url": "https://wa.me/6281122334455?text=Halo%20Admin%20Soulani%20Auto%20Garage,%20saya%20tertarik%20dengan%20mobil%20Toyota%20Alphard%20(ID:%2012)%20dan%20ingin%20mengajukan%20penawaran%20Rp%20820.000.000.%20Ref%20ID:%20LD-2026-X9F2A"
  }
  ```

### `GET /leads`
- **Access:** Protected (`Super_Admin`, `Sales_Staff` with OwnershipGuard)
- **Note:** `Sales_Staff` only retrieves leads assigned to them.
- **Response (200 OK):** Array of Leads.

### `GET /leads/:id`
- **Access:** Protected (`Super_Admin`, `Sales_Staff` with OwnershipGuard)
- **Purpose:** Retrieve full lead details, including follow-up history and vehicle specifics.
- **Response (200 OK):** Detailed Lead object with relations.

### `PUT /leads/:id/assign`
- **Access:** Protected (`Super_Admin`)
- **Request Payload:**
  ```json
  {
    "assigned_to": 4
  }
  ```
- **Response (200 OK):** Updated Lead object.

### `POST /leads/bulk-assign`
- **Access:** Protected (`Super_Admin`)
- **Purpose:** Assign multiple leads to a specific sales staff member at once.
- **Request Payload:**
  ```json
  {
    "leadIds": [101, 102, 103],
    "assignedTo": 4
  }
  ```
- **Validation:** `leadIds` array length must be between 1 and 50. `assignedTo` must be a valid Sales Staff ID.
- **Response (200 OK):**
  ```json
  { "message": "Successfully assigned 3 leads", "assignedTo": 4 }
  ```

### `PATCH /leads/:id/test-drive`
- **Access:** Protected (`Super_Admin`, `Sales_Staff` with OwnershipGuard)
- **Purpose:** Schedule a test drive date for a sales lead.
- **Request Payload:**
  ```json
  {
    "test_drive_date": "2026-08-05T14:00:00Z",
    "notes": "Customer requested afternoon test drive in South Jakarta."
  }
  ```
- **Validation:** Date must be in the future.
- **Response (200 OK):** Updated Lead details with test drive info.

---

## 9. Lead Followups Module

### `POST /leads/:id/followups`
- **Access:** Protected (`Super_Admin`, `Sales_Staff` with OwnershipGuard)
- **Validation:** `note_text` (string, required), `new_status` (string, optional).
- **Request Payload:**
  ```json
  {
    "note_text": "Called customer, confirmed test drive schedule for 5th Aug.",
    "new_status": "Contacted"
  }
  ```
- **Response (201 Created):** Followup record.

---

## 10. Testimonials Module

### `GET /testimonials`
- **Access:** Public (Only returns published testimonials where `is_published` is true)
- **Response (200 OK):** Array of Testimonial objects.

### `POST /testimonials`
- **Access:** Protected (`Super_Admin`)
- **Request Payload:**
  ```json
  {
    "author_name": "Rian Adi",
    "author_title": "Developer",
    "rating": 5,
    "quote_text": "Sangat puas dengan rental Alphard di Soulani Auto Garage. Kondisi mobil prima dan adminnya sangat responsif!",
    "is_published": true
  }
  ```
- **Response (201 Created):** Created Testimonial object.

---

## 11. Homepage CMS Module

### `GET /cms/homepage`
- **Access:** Public
- **Response (200 OK):** JSON containing Hero Banners, Promos, and landing page settings.

### `PUT /cms/homepage`
- **Access:** Protected (`Super_Admin`)
- **Request Payload:** Full JSON structure of homepage content.
- **Response (200 OK):** Updated homepage CMS content.

### `POST /cms/promos`
- **Access:** Protected (`Super_Admin`)
- **Purpose:** Add a new promotional banner/section to the homepage.
- **Request Payload:**
  ```json
  {
    "title": "Promo Merdeka - Rental 3 Hari Gratis 1 Hari",
    "image_url": "https://res.cloudinary.com/soulani/image/upload/v123/promos/merdeka.jpg",
    "target_url": "/rental",
    "is_active": true
  }
  ```
- **Response (201 Created):** Created Promo banner object.

---

## 12. Users Module (Staff Management)

### `GET /users`
- **Access:** Protected (`Super_Admin`)
- **Response (200 OK):** Array of staff members.

### `POST /users`
- **Access:** Protected (`Super_Admin`)
- **Validation:** `email` (email, required), `role` (Enum: `Super_Admin`|`Sales_Staff`|`Rental_Staff`, required), `password` (string, min 8 chars, required).
- **Request Payload:**
  ```json
  {
    "name": "Alice Agent",
    "email": "alice@soulani.com",
    "password": "TempPassword123!",
    "role": "Sales_Staff"
  }
  ```
- **Response (201 Created):** User record (excluding `password_hash`).

---

## 13. Analytics Module

### `GET /analytics/dashboard`
- **Access:** Protected (`Super_Admin`)
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
      {
        "id": 1,
        "make": "Toyota",
        "model": "Alphard",
        "views": 1500
      }
    ]
  }
  ```
- **Validation Rules:** Date range `startDate` must be <= `endDate`.

### `GET /analytics/vehicles/:id`
- **Access:** Protected (`Super_Admin`, `Sales_Staff`, `Rental_Staff`)
- **Purpose:** Detailed metrics for a specific vehicle.
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
- **Purpose:** Increments the `view_count` asynchronously via message queue or background job.
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
- **Access:** Protected (`Super_Admin`, `Rental_Staff`)
- **Purpose:** Block out dates for maintenance or offline usage.
- **Request Payload:**
  ```json
  {
    "start_date": "2026-08-20",
    "end_date": "2026-08-22",
    "reason": "maintenance"
  }
  ```
- **Validation:** Dates must not overlap with `Active` or `Confirmed` rental bookings.
- **Response (201 Created):** Created Blackout Date record.

### `DELETE /blackout-dates/:id`
- **Access:** Protected (`Super_Admin`, `Rental_Staff`)
- **Purpose:** Remove a blackout date.
- **Response (200 OK):**
  ```json
  { "message": "Blackout date removed successfully" }
  ```

---

## 15. Audit Logs Module

### `GET /audit-logs`
- **Access:** Protected (`Super_Admin`)
- **Purpose:** Query system audit logs for compliance and troubleshooting.
- **Query Params:** `?moduleName=vehicles&userId=5&action=UPDATE&startDate=...`
- **Response Payload (IDR Currency):**
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
