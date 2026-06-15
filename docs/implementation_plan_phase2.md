# Phase 2: Inventory Management — REFINED IMPLEMENTATION PLAN

## 1. Goal
Implement a robust, local-first inventory management system enabling admins to execute full lifecycle CRUD operations on vehicles, including local media upload, inspection reporting, and dual-purpose (Sale & Rental) pricing configurations.

## 2. Scope
- **Backend:** NestJS modules for `Vehicles`, `VehicleImages`, `VehicleInspections`, `SalesListings`, and `RentalListings`. Includes local file system media upload (Multer).
- **Frontend:** Next.js Admin UI (`/admin/inventory/*`) for listing, filtering, pagination, and multi-step creation/editing of vehicle data.
- **Out of Scope:** Public website rendering, booking checkout flows, cloud deployment, and Cloudinary integrations.

## 3. Architecture Decisions (IMPORTANT)
- **Image Upload Strategy:** Strict **Local File Storage (Multer)**. Files are saved into dedicated subdirectories: `apps/api/uploads/vehicles/`, `apps/api/uploads/inspections/`, and `apps/api/uploads/temp/` for future processing workflows. The NestJS `@nestjs/serve-static` module serves them at `http://localhost:3001/uploads/...`.
- **File Deletion Strategy:** Physical file deletion must use asynchronous filesystem operations (`fs.promises.unlink`). It must not block the Node.js event loop. Errors during file cleanup must be logged without crashing the application.
- **Slug Strategy:** Vehicle slugs must be generated automatically during vehicle creation (e.g., `toyota-avanza-2022-abc123`). Slugs are **immutable**; they do not change even if the make/model/year are edited later. This guarantees stable and unique URL identifiers for Phase 3 SEO pages.
- **API Structure:** RESTful pattern. Sub-resources (images, inspections, listings) will be managed via nested routes under `/vehicles/:id/` to guarantee contextual data integrity.
- **Frontend Structure:** Next.js App Router. The Admin UI will use Client Components (`"use client"`) for forms and data tables to handle complex interactive state.
- **State Management:** Local React state (`useState`, `useReducer`) for forms. Data fetching and caching will rely on the existing typed `fetch` client from Phase 1 (`lib/api.ts`).

## 4. Open Questions (ONLY REAL ONES REMAINING)
*(No immediate open questions remain; all architectural ambiguities have been resolved).*

## 5. Missing Improvements (NEW SECTION)
To ensure correctness and scalability based **strictly on the original schema.prisma**, the following improvements have been added over the original plan:
- **Soft Delete Architecture:** Leveraged the existing `deletedAt DateTime?` on `Vehicle`, `VehicleImage`, `VehicleInspection`, `SalesListing`, and `RentalListing`.
- **Listing Preservation Strategy:** When a vehicle changes from `BOTH` to `SALE` or `RENTAL`, existing irrelevant listings are **soft-deleted** (`deletedAt` is populated). No hard deletions occur, preserving historical pricing data, which aligns with the existing `schema.prisma`.
- **Database Constraints:** Enforced explicit unique constraints using existing Prisma fields: `Vehicle.slug @unique`, `SalesListing.vehicleId @unique`, and `RentalListing.vehicleId @unique`.
- **Audit Logging:** Leveraged the existing `AuditLog` table. Mandated service-level audit logging for vehicle CRUD operations, media changes, inspections, and pricing updates. Logs must capture `userId`, `action`, `moduleName`, `recordId`, and `timestamp`.
- **Physical File Cleanup:** Added asynchronous `fs.promises.unlink` interceptors in the backend when media records are soft-deleted or parent records are soft-deleted.
- **Pagination & Filtering:** Added standard pagination (`page`, `limit`) and filtering (`status`, `type`) DTOs to the `GET /vehicles` endpoint to prevent overwhelming the browser.
- **Transaction Safety:** Vehicle creation and its immediate sub-records must use Prisma `$transaction` to prevent orphaned partial records.

*(Note: Inspection Images and `isActive` toggles have been removed from this plan to strictly adhere to the original Phase 1 `schema.prisma` architecture.)*

## 6. Definition of Done
- `GET /vehicles` returns paginated, filterable results, explicitly excluding soft-deleted records.
- Vehicle lifecycle (Create, Update, Delete) is fully functional. Creation generates an immutable, unique slug.
- Pricing changes (e.g., downgrading from `BOTH` to `SALE`) preserve existing records by setting `deletedAt` on the irrelevant `RentalListing`. Public APIs ignore soft-deleted records.
- Audit logs are successfully written for vehicle changes, image operations, inspections, and pricing changes to the existing `AuditLog` table.
- `POST /vehicles/:id/images` successfully writes `.jpg`/`.png` files to disk (max 5MB) into their respective `/vehicles` folders.
- `DELETE` operations execute a soft delete in the database, but trigger asynchronous physical file removal from the host filesystem without blocking the event loop.
- Primary image updates use a transaction ensuring only one image is primary per vehicle.

## 7. Step-by-Step Implementation Plan
1. **Schema Update:** Rename `cloudinaryUrl`/`cloudinaryPublicId` to `fileUrl`/`filePath` in `schema.prisma` and run `npx prisma migrate dev` to sync the database for local file storage.
2. **Backend - Local Media System:** Configure `MulterModule` with routing for `uploads/vehicles`, `uploads/inspections`, and `uploads/temp`.
3. **Backend - Core Modules & Auditing:** Implement `Vehicles` (with immutable slug generation and soft deletes) and integrate service-level Audit Logging to the existing `AuditLog` table.
4. **Backend - Deletion Safety & Transactions:** Implement asynchronous physical file cleanup logic inside media services, and enforce Prisma transactions for setting primary images.
5. **Frontend - Admin Layout:** Scaffold the protected `/admin/inventory` route group.
6. **Frontend - Data Table:** Build the Inventory List view with pagination controls and filters.
7. **Frontend - Multi-tab Form:** Build the Vehicle Add/Edit wizard (Tabs: Core Details, Images, Inspections, Pricing). 
8. **Integration & Smoke Testing:** Perform manual E2E tests validating the slug immutability, soft deletes, and async physical file deletion.

## 8. Backend Module Breakdown
- **Uploads Configuration:** `Multer` configured in `AppModule` with dynamic `DiskStorage` engines directing files to `./uploads/vehicles/`, `./uploads/inspections/`, or `./uploads/temp/`.
- **VehiclesModule:** 
  - `VehiclesController`: Handles base CRUD.
  - `VehiclesService`: Manages DB interactions with Prisma transactions. Generates immutable unique slugs on create. Executes soft deletes. Writes to `AuditLog`. Must trigger media services for physical file cleanup upon soft deletion.
  - `QueryVehicleDto`: For pagination (`limit`, `page`) and filters.
- **VehicleImagesModule:** 
  - `VehicleImagesController`: Receives `multipart/form-data`.
  - `VehicleImagesService`: Creates Prisma record, returns URL. Includes `removeImage(id)` which sets `deletedAt` and triggers async `fs.promises.unlink`. Includes `setPrimary(id)` wrapped in a `$transaction` to unset other primary flags securely. Writes to `AuditLog`.
- **VehicleInspectionsModule:** 
  - Handles CRUD for `VehicleInspection` strictly using text and enum fields (`generalNotes`, `engineStatus`, etc.) as defined in `schema.prisma`.
- **SalesListingsModule & RentalListingsModule:** 
  - Updates perform soft-deletes (`deletedAt`) rather than hard-deleting records to preserve history.
  - Writes to `AuditLog` on pricing changes.

## 9. Frontend Breakdown
- **Routes:**
  - `/admin/inventory`: Main data table.
  - `/admin/inventory/new`: Wrapper for creation.
  - `/admin/inventory/[id]/edit`: Multi-tab interface.
- **Components (`components/admin/vehicles/`):**
  - `InventoryTable.tsx`: Displays rows, handles pagination state.
  - `VehicleCoreForm.tsx`: Form for `make`, `model`, `year`, `type`, etc.
  - `LocalImageGallery.tsx`: Drag-and-drop zone using `FormData` POST.
  - `InspectionReportForm.tsx`: Includes standard status dropdowns based on `InspectionStatus` enum.
  - `PricingConfigForm.tsx`: Dynamically renders Sales/Rental inputs based on `VehicleType`.
- **Data Fetching:** Wrappers around standard `fetch` with `useEffect` or React 19 `use` hook, leveraging auth tokens from `localStorage`/`Zustand`.

## 10. API Contract (Final Endpoints)
- **Vehicles:**
  - `GET /api/v1/vehicles` (Query: `?page=1&limit=10&status=AVAILABLE&type=SALE` - Excludes soft-deleted)
  - `GET /api/v1/vehicles/:id`
  - `POST /api/v1/vehicles` (Body must trigger slug generation internally)
  - `PATCH /api/v1/vehicles/:id`
  - `DELETE /api/v1/vehicles/:id` (Performs Soft Delete + Async FS cleanup)
- **Vehicle Images:**
  - `GET /api/v1/vehicles/:id/images`
  - `POST /api/v1/vehicles/:id/images` (Multipart upload)
  - `PATCH /api/v1/vehicles/:id/images/:imageId/primary`
  - `DELETE /api/v1/vehicles/:id/images/:imageId` (Performs Soft Delete + Async FS cleanup)
- **Inspections:**
  - `GET /api/v1/vehicles/:id/inspections`
  - `POST /api/v1/vehicles/:id/inspections`
  - `PATCH /api/v1/vehicles/:id/inspections/:inspectionId`
- **Listings:**
  - `GET /api/v1/vehicles/:id/sales-listing`
  - `PUT /api/v1/vehicles/:id/sales-listing` (Recreates or removes `deletedAt`)
  - `GET /api/v1/vehicles/:id/rental-listing`
  - `PUT /api/v1/vehicles/:id/rental-listing` (Recreates or removes `deletedAt`)

## 11. Risks & Edge Cases
- **File System Asynchronous Failures:** `fs.promises.unlink` will run in the background. If it fails (e.g., file lock, missing permissions), it will not crash the HTTP response, but it may leave orphaned files. We must ensure thorough error logging (`this.logger.error`) inside the `.catch()` blocks.
- **Slug Collisions:** If two identical vehicles are added simultaneously, slug generation could theoretically collide. The unique constraint in the DB and a strong randomization suffix (e.g., `make-model-year-nanoid`) will mitigate this.
- **Soft Delete Discrepancy:** When a record is soft-deleted, its associated physical files are hard-deleted. If a soft-deleted vehicle or image is ever restored via DB intervention, the physical media files will be missing. This is a known acceptable trade-off for Phase 2 to prevent disk bloating.
- **Primary Image Race Conditions:** Setting a primary image must happen in a Prisma transaction (`$transaction([unsetAllOthers, setPrimary])`) to ensure only one image is marked primary during concurrent requests.
- **Listing State Transitions:** Ensure that soft-deleting a Listing does not cascade and break historical reports linked to that specific Listing ID.

## 12. Commit Plan
1. `feat(api): setup multer directories (vehicles, inspections, temp) and static serving`
2. `feat(api): implement vehicle CRUD, pagination, immutable slug generation, and audit logging`
3. `feat(api): implement image uploads, transaction-safe ordering, and async fs.promises.unlink cleanup`
4. `feat(api): implement listing preservation logic (soft deletes) and nested inspection CRUD`
5. `feat(web): build admin inventory data table`
6. `feat(web): build multi-tab vehicle add/edit forms`
7. `feat(web): integrate local image uploader and pricing logic`
