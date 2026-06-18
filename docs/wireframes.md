# Wireframes: Soulani Auto Garage

> [!NOTE]
> These wireframes outline the structural layout for Desktop and Mobile interfaces based on the "Modern Automotive Marketplace" design system and the finalized Product Architecture. They incorporate the mandatory Lead Capture flow for sales and the flexible >7 Days negotiation flow for rentals.

---

## 1. Homepage

### Desktop (1440px+)
```text
+-----------------------------------------------------------------------------+
| [Logo]          Beli Mobil   |   Sewa Mobil   |   Tentang Kami    [ Log In ]|
+-----------------------------------------------------------------------------+
|                                                                             |
|                         FIND YOUR PERFECT DRIVE                             |
|                                                                             |
|      [ Search Make, Model, or Type... ] [ All Prices v ]  [ SEARCH ]        |
|                                                                             |
|   [✓ 150-Point Inspected]    [✓ 5-Day Money Back]    [✓ 1-Year Warranty]    |
|                                                                             |
+-----------------------------------------------------------------------------+
| Browse by Type:                                                             |
| ( SUV )  ( MPV )  ( Hatchback )  ( Sedan )  ( Premium )                     |
+-----------------------------------------------------------------------------+
| Just Added / Featured Deals                           [ View All Cars > ]   |
|                                                                             |
| +-------------+  +-------------+  +-------------+  +-------------+          |
| | [Image]     |  | [Image]     |  | [Image]     |  | [Image]     |          |
| | Innova 2.4  |  | Brio RS 1.2 |  | Civic 1.5T  |  | Fortuner    |          |
| | 2021 | Auto |  | 2023 | Auto |  | 2020 | Auto |  | 2022 | Auto |          |
| | Rp 380 Juta |  | Rp 195 Juta |  | Rp 420 Juta |  | Rp 510 Juta |          |
| +-------------+  +-------------+  +-------------+  +-------------+          |
+-----------------------------------------------------------------------------+
| [ Footer: Links, Contact, Social, App Download ]                            |
+-----------------------------------------------------------------------------+
```

### Mobile (375px)
```text
+-------------------------+
| [=] (Menu)       [Logo] |
+-------------------------+
| FIND YOUR PERFECT DRIVE |
| [ Search...           ] |
| [ SEARCH CARS ] (Blue)  |
|                         |
| ✓ 150-Point Inspected   |
+-------------------------+
| Type: (SUV) (MPV) (Hat) | <-- Swipeable
+-------------------------+
| Featured Deals          |
| +---------------------+ |
| | [Image]             | |
| | Toyota Innova 2.4   | |
| | Rp 380 Juta         | |
| +---------------------+ |
| +---------------------+ |
| | [Image]             | |
| | Honda Brio RS       | |
| | Rp 195 Juta         | |
| +---------------------+ |
+-------------------------+
| [Sticky Bottom Nav]     |
| Home | Search | Chat    |
+-------------------------+
```

---

## 2. Sales Listing (`/sales`)

*Features URL-synchronized filter state (e.g., `?carType=SUV&transmission=AUTOMATIC`). Active filter chips allow quick removal. The layout is divided into ACTIVE ("Unit Tersedia") and ARCHIVED ("Baru Saja Terjual / Dalam Perawatan") sections.*

### Desktop
```text
+-----------------------------------------------------------------------------+
| [Logo]          Beli Mobil   |   Sewa Mobil   |   Tentang Kami    [ Log In ]|
+-----------------------------------------------------------------------------+
| Home > Used Cars                                                            |
+-----------------------------------------------------------------------------+
| FILTERS                |  Showing 142 Cars             Sort by: [ Lowest ]v |
|                        |                                                    |
| Make/Model             |  +-------------+  +-------------+  +-------------+ |
| [ Search... ]          |  | [Image] [v] |  | [Image]     |  | [Image]     | |
|                        |  | Brio RS 1.2 |  | Agya 1.2 G  |  | Raize 1.0T  | |
| Price Range            |  | 2023 | 12k  |  | 2022 | 20k  |  | 2022 | 15k  | |
| O-------O Rp 500jt     |  | Rp 195 Juta |  | Rp 160 Juta |  | Rp 220 Juta | |
|                        |  +-------------+  +-------------+  +-------------+ |
| Body Type              |                                                    |
| [x] Hatchback          |  +-------------+  +-------------+  +-------------+ |
| [ ] SUV                |  | [Image]     |  | [Image]     |  | [Image]     | |
| [ ] MPV                |  | Yaris 1.5 G |  | HR-V 1.5 E  |  | Creta Style | |
|                        |  | ...         |  | ...         |  | ...         | |
+-----------------------------------------------------------------------------+
```

### Mobile
```text
+-------------------------+
| [<] Used Cars      [ Q ]|
+-------------------------+
| [ Filter (3) ] [ Sort ] | <-- Sticky Action Bar
+-------------------------+
| +---------------------+ |
| | [Image]    [Badge]  | |
| | Honda Brio RS       | |
| | 2023 • Auto • 12k   | |
| | Rp 195.000.000      | |
| | Est. Rp 3.5jt/mo    | |
| +---------------------+ |
| +---------------------+ |
| | [Image]             | |
| | Toyota Agya 1.2 G   | |
| | 2022 • Auto • 20k   | |
| | Rp 160.000.000      | |
| +---------------------+ |
+-------------------------+
```

---

## 3. Vehicle Detail (Sales) - VDP (`/sales/[slug]`)

*Per Product Architecture, all sales inquiries MUST be logged into the CRM before redirecting to WhatsApp. For vehicles with status `SOLD` or `MAINTENANCE`, the inquiry form is replaced with a "Pendaftaran Ditutup" panel.*

### Desktop (ACTIVE Status)
```text
+-----------------------------------------------------------------------------+
| [Logo]                                                            [ Log In ]|
+-----------------------------------------------------------------------------+
| Home > Used Cars > Honda > Brio RS 2023                                     |
+-----------------------------------------------------------------------------+
| [     MAIN IMAGE (4:3)      ] |  Honda Brio 1.2 RS CVT (2023)               |
|                               |  [✓ 150-Point Inspected]                    |
| [img1] [img2] [img3] [+12]    |  Rp 195.000.000                             |
|-------------------------------|  +---------------------------------------+  |
| Vehicle Overview              |  | SEND INQUIRY                          |  |
| Mileage: 12,500 km            |  | Name: [_______________________]       |  |
| Transmission: Auto (CVT)      |  | Phone: [______________________]       |  |
| Fuel: Gasoline                |  | Email (opt): [________________]       |  |
|                               |  | Inquiry Type: [ Make an Offer v ]     |  |
|-------------------------------|  | Offered Price: [Rp ___________]       |  |
| Inspection Report [View Full] |  |                                       |  |
| ✓ Engine (Pass)               |  | [ SUBMIT & CHAT ON WHATSAPP ] (Blue)  |  |
| ✓ Exterior (Pass)             |  +---------------------------------------+  |
+-----------------------------------------------------------------------------+
```

### Mobile
*The Lead Capture form opens as a bottom sheet when "SEND INQUIRY" is tapped.*
```text
+-------------------------+
| [ Lead Inquiry ]    [X] |
+-------------------------+
| Name                    |
| [_________________]     |
| Phone                   |
| [_________________]     |
| Email (Optional)        |
| [_________________]     |
| Inquiry Type            |
| [ Make an Offer v ]     |
| Offered Price           |
| [Rp ______________]     |
|                         |
| [ SUBMIT & CHAT (WA) ]  |
+-------------------------+

### Inquiry Closed State (SOLD / MAINTENANCE)
*When the vehicle is not ACTIVE, the CTA area is replaced with an informational panel.*
```text
+---------------------------------------+
| Pendaftaran Ditutup                   |
| Unit kendaraan ini sudah tidak        |
| tersedia untuk penawaran harga atau   |
| sesi tanya jawab.                     |
+---------------------------------------+
```
```

---

## 4. Rental Listing

*Features the new `Long-Term Available` badge for eligible inventory.*

### Desktop
```text
+-----------------------------------------------------------------------------+
| RENTALS: [ Jakarta v ]  [ 12 Oct - 15 Oct ]                    [ MODIFY ]   |
+-----------------------------------------------------------------------------+
| FILTERS                |  Available Cars for your dates                     |
|                        |                                                    |
| Vehicle Type           |  +-------------------------+                       |
| [x] SUV                |  | [Image]   Toyota Fortuner 2.4 VRZ               |
| [ ] MPV                |  |           Auto | 7 Seats | Diesel               |
|                        |  |           [✓ Long-Term Available]               |
| Transmission           |  |           Rp 1.200.000 / day    [ SELECT ]      |
| [x] Automatic          |  +-------------------------+                       |
| [ ] Manual             |  +-------------------------+                       |
|                        |  | [Image]   Honda HR-V 1.5 E                      |
| With Driver?           |  |           Auto | 5 Seats | Bensin               |
| (o) Self Drive         |  |                                                 |
| ( ) With Driver        |  |           Rp 700.000 / day      [ SELECT ]      |
|                        |  +-------------------------+                       |
+-----------------------------------------------------------------------------+
```

### Mobile
```text
+-------------------------+
| [<] Rentals             |
| JKT • 12 Oct-15 Oct [v] |
+-------------------------+
| [ Filter (2) ] [ Sort ] |
+-------------------------+
| +---------------------+ |
| | [Image]             | |
| | Toyota Fortuner VRZ | |
| | [✓ Long-Term Avail] | |
| |                     | |
| | Rp 1.200.000 / day  | |
| | [ SELECT ]          | |
| +---------------------+ |
| +---------------------+ |
| | [Image]             | |
| | Honda HR-V 1.5 E    | |
| | Rp 700.000 / day    | |
| | [ SELECT ]          | |
| +---------------------+ |
+-------------------------+
```

---

## 5. Rental Detail

*If the selected duration is >7 days, the system prompts for a custom quote while retaining the standard booking option.*

### Desktop (>7 Days View)
```text
+-----------------------------------------------------------------------------+
| Home > Rentals > Toyota Fortuner VRZ                                        |
+-----------------------------------------------------------------------------+
| [     MAIN IMAGE (4:3)      ] |  Toyota Fortuner 2.4 VRZ (2022)             |
| [img1] [img2] [img3] [+5]     |                                             |
|-------------------------------|  +---------------------------------------+  |
| Specifications                |  | Booking Details                       |  |
| Seats: 7    | Fuel: Diesel    |  | Dates: 12 Oct - 22 Oct (10 Days)      |  |
|                               |  | Rate: Rp 1.200.000 / day              |  |
|-------------------------------|  | Subtotal: Rp 12.000.000               |  |
| Terms & Conditions            |  |---------------------------------------|  |
| - Deposit Rp 1.000.000 req.   |  | * Need it for more than 7 days? *     |  |
| - Driver license (SIM A) req. |  | Speak with our team for custom pricing|  |
|                               |  | and special long-term packages!       |  |
|                               |  | [ REQUEST CUSTOM QUOTE via WA ] (Grn) |  |
|                               |  |---------------------------------------|  |
|                               |  | Or proceed with standard rate:        |  |
|                               |  | [ CONTINUE STANDARD BOOKING ] (Outln) |  |
|                               |  +---------------------------------------+  |
+-----------------------------------------------------------------------------+
```

### Mobile (>7 Days View)
```text
+-------------------------+
| [<] Toyota Fortuner     |
+-------------------------+
| [     IMAGE SWIPE     ] |
+-------------------------+
| Toyota Fortuner VRZ     |
| 7 Seats • Auto • Diesel |
|                         |
| Rp 1.200.000 / day      |
|                         |
| DATES                   |
| [ 12 Oct ] to [ 22 Oct ]|
| (10 Days)               |
|                         |
| TERMS                   |
| Deposit Rp 1jt required |
+-------------------------+
| [Sticky Bottom Bar]     |
| Rp 12.000.000           |
|                         |
| >7 Days? Get a deal!    |
| [ GET CUSTOM QUOTE ]    |
| [ Standard Booking ]    |
+-------------------------+
```

---

## 6. Admin Dashboard (`/(admin)/admin/dashboard`)

*Updated to reflect the Product Architecture's requirement for tracking Lead Types, Offers, and Long-Term Rental quotes within the CRM. Admin pages are contained within the `/(admin)/admin/` route group.*

### Desktop
```text
+-----------------------------------------------------------------------------+
| [Soulani Admin] | [Search everything...]                [Bell] [Admin Name] |
+-----------------+-----------------------------------------------------------+
| Dashboard       | SALES LEADS CRM                                           |
| Inventory       | Ref ID | Name | Vehicle   | Type        | Offer  | Status |
| Sales Leads     | -------|------|-----------|-------------|--------|--------|
| Rental Quotes   | L-102  | Budi | Brio 2023 | Make Offer  | 190jt  | [NEW]  |
| Rental Bookings | L-101  | Andi | HRV 2021  | Test Drive  | -      | [CONT] |
| Customers       |                                                           |
| Settings        | LONG-TERM RENTAL QUOTES                                   |
|                 | Ref ID | Name | Vehicle   | Dates (Days)| Status          |
|                 | -------|------|-----------|-------------|-----------------|
|                 | Q-505  | Rina | Fortuner  | 12-22 Oct(10) | [NEGOTIATING] |
|                 | Q-504  | Joko | Innova    | 01-15 Nov(14) | [WON]         |
|                 |                                                           |
|                 | ACTIVE RENTAL BOOKINGS (Standard)                         |
|                 | ID   | Car          | Dates           | Status            |
|                 | -----|--------------|-----------------|-------------------|
|                 | R-01 | Innova       | 12 Oct - 14 Oct | [CONFIRMED]       |
+-----------------------------------------------------------------------------+
```

### Mobile
```text
+-------------------------+
| [=] Dashboard    [Bell] |
+-------------------------+
| OVERVIEW                |
| +---------------------+ |
| | Total Cars: 142     | |
| +---------------------+ |
| | Active Leads: 28    | |
| +---------------------+ |
|                         |
| RECENT SALES LEADS      |
| +---------------------+ |
| | [L-102] Budi        | |
| | Make Offer: Rp 190jt| |
| | Status: [NEW]       | |
| | [ Contact on WA ]   | |
| +---------------------+ |
|                         |
| LONG-TERM QUOTES        |
| +---------------------+ |
| | [Q-505] Rina        | |
| | Fortuner (10 Days)  | |
| | [NEGOTIATING]       | |
| | [ Contact on WA ]   | |
| +---------------------+ |
|                         |
| ACTIVE RENTALS        > |
+-------------------------+
```

---

## 7. UX Rationale (Business Alignment)

- **CRM-First Sales Lead Capture:** By gating the WhatsApp redirect behind a simple lead form, we strictly adhere to the Product Architecture requirement that *every interaction is logged into the CRM before the user leaves the platform*. This provides the sales team with immediate context (Inquiry Type, Offered Price, Vehicle Ref ID).
- **Rental Flexibility (>7 Days):** Hard-blocking users from standard booking for >7 days can cause friction. Highlighting a "Custom Quote" option encourages high-value users to negotiate (aligning with Indonesian *kekeluargaan* business practices), while leaving the "Standard Booking" available ensures users who prefer online checkout can still convert immediately at the rack rate.
- **Long-Term Eligibility Badges:** Displaying the badge on the listing view sets expectations early, encouraging users planning long trips to click through and explore long-term discounts.
- **Admin Visibility:** The refined CRM views ensure staff can differentiate between a standard inquiry, a test drive request, and an aggressive low-ball offer, allowing them to prioritize responses appropriately and manage long-term quotes efficiently.
