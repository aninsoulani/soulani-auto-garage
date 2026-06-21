// ============================================================
// Shared TypeScript interfaces for Soulani Auto Garage
// Mirrors the Prisma schema enums and models for use in the
// Next.js frontend. Keep in sync with schema.prisma.
// ============================================================

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ListingType = 'SALE' | 'RENTAL' | 'BOTH';
export type VehicleStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'MAINTENANCE';
export type ExtendedVehicleStatus = VehicleStatus | 'RENTED';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC';
export type CarType = 'SUV' | 'MPV' | 'HATCHBACK' | 'SEDAN' | 'COUPE' | 'CONVERTIBLE' | 'WAGON' | 'PICKUP' | 'VAN' | 'CROSSOVER';

export type LeadType =
  | 'SALES_INQUIRY'
  | 'TEST_DRIVE_REQUEST'
  | 'MAKE_OFFER'
  | 'RENTAL_INQUIRY'
  | 'LONG_TERM_QUOTE';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'NEGOTIATING'
  | 'TEST_DRIVE_SCHEDULED'
  | 'WON'
  | 'LOST';

export type LeadSource =
  | 'ORGANIC'
  | 'GOOGLE_ADS'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'DIRECT'
  | 'WHATSAPP'
  | 'REFERRAL';

export type InspectionStatus = 'PASS' | 'FAIL' | 'NEEDS_ATTENTION';
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface LeadFollowup {
  id: number;
  leadId: number;
  userId: number;
  noteText: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user?: User;
}

export interface Lead {
  id: number;
  leadReferenceId?: string;
  vehicleId: number | null;
  type: LeadType;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  offeredPrice?: string | null;
  message: string | null;
  adminNotes?: string | null;
  source?: string | null;
  status: LeadStatus;
  createdAt: string;
  vehicle?: Vehicle;
  followups?: LeadFollowup[];
}

export interface RentalBooking {
  id: number;
  bookingCode?: string;
  referenceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  identityNumber?: string;
  licenseImageUrl?: string;
  proofOfTransferUrl?: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  status: BookingStatus;
  withDriver: boolean;
  createdAt: string;
  rentalListing?: RentalListing & { vehicle?: Vehicle };
}

export interface BlackoutDate {
  id: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface VehicleImage {
  id: number;
  vehicleId: number;
  fileUrl: string;
  filePath: string;
  /** Computed by API: absolute URL for rendering (prepends server base or Cloudinary) */
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface VehicleInspection {
  id: number;
  vehicleId: number;
  inspectionDate: string;
  inspectorName: string;
  engineStatus: InspectionStatus;
  transmissionStatus: InspectionStatus;
  suspensionStatus: InspectionStatus;
  electricalStatus: InspectionStatus;
  acStatus: InspectionStatus;
  tiresStatus: InspectionStatus;
  interiorStatus: InspectionStatus;
  exteriorStatus: InspectionStatus;
  generalNotes: string | null;
}

export interface SalesListing {
  id: number;
  vehicleId: number;
  /** IDR amount as string (Decimal from Prisma serialises as string) */
  price: string;
  previousOwners: number;
}

export interface RentalListing {
  id: number;
  vehicleId: number;
  dailyRate: string;
  weeklyRate?: string;
  depositAmount: string;
  isLongTermEligible: boolean;
  isDriverAvailable: boolean;
  driverFeePerDay?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface VehicleAnalytics {
  id: number;
  vehicleId: number;
  viewCount: number;
  inquiryCount: number;
  offerCount: number;
  rentalRequestCount: number;
  lastUpdated: string;
}

export interface Vehicle {
  id: number;
  slug: string;
  make: string;
  model: string;
  year: number;
  carType: CarType;
  color: string;
  vin: string | null;
  plateNumber: string | null;
  chassisNumber: string | null;
  engineNumber: string | null;
  listingType: ListingType;
  status: ExtendedVehicleStatus;
  isFeatured: boolean;
  isNewArrival: boolean;
  mileage: number | null;
  transmission: TransmissionType | null;
  fuelType: FuelType | null;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations (present when included in the API response)
  images?: VehicleImage[];
  inspections?: VehicleInspection[];
  salesListing?: SalesListing | null;
  rentalListing?: RentalListing | null;
  analytics?: VehicleAnalytics | null;
}

export interface Testimonial {
  id: number;
  authorName: string;
  authorTitle: string | null;
  avatarUrl: string | null;
  rating: number;
  quoteText: string;
  isPublished: boolean;
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  instructions: string;
  isActive: boolean;
}

// ─── Lead / Inquiry Flow ──────────────────────────────────────────────────────

export interface CreateLeadPayload {
  vehicleId: number;
  type: LeadType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  offeredPrice?: number;
  message?: string;
  source?: LeadSource;
}

export interface CreateLeadResponse {
  leadReferenceId: string;
  whatsappRedirectUrl: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiSuccessResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// ─── Vehicle Query Params ─────────────────────────────────────────────────────

export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  status?: ExtendedVehicleStatus;
  listingType?: ListingType;
  search?: string;
  carType?: CarType;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  minPrice?: number;
  maxPrice?: number;
  withDriver?: boolean;
  sort?: 'newest' | 'oldest' | 'price:asc' | 'price:desc' | 'year:asc' | 'year:desc' | 'mileage:asc' | 'mileage:desc';
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────

export interface DashboardMetrics {
  sales: {
    availableCars: number;
    soldCars: number;
    totalRevenue: number;
    newLeads: number;
  };
  rentals: {
    activeRentals: number;
    pendingPayments: number;
    utilizationRate: number;
    revenueTrend: { name: string; revenue: number }[];
  };
  recentActivities: {
    id: string;
    type: 'RENTAL' | 'SALE_LEAD';
    referenceCode: string;
    customerName: string;
    vehicleName: string;
    status: string;
    date: string;
    amount?: number;
  }[];
}

