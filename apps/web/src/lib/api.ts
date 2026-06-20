import type {
  Vehicle,
  Testimonial,
  PaginatedResponse,
  VehicleQueryParams,
  CreateLeadPayload,
  CreateLeadResponse,
  Lead,
  RentalBooking,
  BlackoutDate,
  PaymentMethod
} from '@/types/api.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// ─── Base Fetch ───────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...fetchOptions,
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/login')) {
      // Lazy load to prevent server-side initialization issues
      import('@/store/auth.store').then(({ useAuthStore }) => {
        useAuthStore.getState().clearAuth();
      });
      import('sweetalert2').then((SwalModule) => {
        const Swal = SwalModule.default;
        Swal.fire({
          title: 'Session Expired',
          text: 'Your session has expired. Please login again.',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false,
        }).then(() => {
          window.location.href = '/login';
        });
      });
      throw new Error('Session expired');
    }
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `API Error ${res.status}`);
  }

  const json = await res.json();
  // NestJS TransformInterceptor wraps responses in { statusCode, message, data }
  return json.data !== undefined && json.statusCode !== undefined ? json.data : json;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length ? `?${entries.join('&')}` : '';
}

// ─── Public: Vehicles ────────────────────────────────────────────────────────

/** Fetch a paginated list of vehicles with optional filters. */
export async function getVehicles(
  params: VehicleQueryParams = {},
): Promise<PaginatedResponse<Vehicle>> {
  const qs = buildQueryString(params as Record<string, unknown>);
  return apiFetch<PaginatedResponse<Vehicle>>(`/vehicles${qs}`, { cache: 'no-store' });
}

/** Fetch a single vehicle by its immutable slug (for the public VDP). */
export async function getVehicleBySlug(slug: string): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/by-slug/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
}

/** Fetch vehicle availability blackout dates and bookings */
export async function getVehicleAvailability(id: number): Promise<{ unavailableIntervals: Array<{ start: string; end: string }> }> {
  return apiFetch<{ unavailableIntervals: Array<{ start: string; end: string }> }>(`/vehicles/${id}/availability`, {
    cache: 'no-store',
  });
}

/** Convenience: fetch featured sale vehicles for the homepage grid. */
export async function getFeaturedVehicles(limit = 8): Promise<Vehicle[]> {
  const result = await getVehicles({ listingType: 'SALE', isFeatured: true, limit, status: 'ACTIVE' } as unknown as VehicleQueryParams);
  return result.data;
}

/** Convenience: fetch new arrivals for the homepage. */
export async function getNewArrivalVehicles(limit = 4): Promise<Vehicle[]> {
  const result = await getVehicles({ listingType: 'SALE', isNewArrival: true, limit, status: 'ACTIVE' } as unknown as VehicleQueryParams);
  return result.data;
}

// ─── Public: Leads ────────────────────────────────────────────────────────────

/**
 * Submit an inquiry lead from the public form.
 * Returns leadReferenceId and whatsappRedirectUrl.
 */
export async function submitLead(payload: CreateLeadPayload): Promise<CreateLeadResponse> {
  return apiFetch<CreateLeadResponse>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Submit a standard rental booking. */
export async function submitRentalBooking(payload: Record<string, unknown>): Promise<{ bookingId: number; bookingCode: string; totalPrice: string; paymentInstructions: string; status: string }> {
  return apiFetch('/rental-bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Fetch public booking details by code */
export async function getPublicBookingByCode(bookingCode: string): Promise<RentalBooking & { vehicle: Vehicle }> {
  return apiFetch(`/rental-bookings/public/${bookingCode}`, {
    cache: 'no-store',
  });
}

// ─── Public: Analytics ────────────────────────────────────────────────────────

/** Fire-and-forget view tracking for a vehicle detail page. */
export async function trackVehicleView(vehicleId: number): Promise<void> {
  try {
    await apiFetch(`/analytics/vehicles/${vehicleId}/track-view`, { method: 'POST' });
  } catch {
    // Silently ignore — analytics must never affect user experience
  }
}

// ─── Public: Payment Methods & Uploads ────────────────────────────────────────

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/payment-methods', { cache: 'no-store' });
}

export async function uploadLicense(file: File): Promise<{ filePath: string; fileUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/uploads/license`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export async function uploadGeneralReceipt(file: File): Promise<{ filePath: string; fileUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/uploads/receipt`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

// ─── Public: Testimonials ────────────────────────────────────────────────────

/** Fetch all published testimonials for the homepage. */
export async function getTestimonials(): Promise<Testimonial[]> {
  // NOTE: Phase 6 will expose this via the testimonials module with CMS control.
  // For now the testimonials are seeded statically.
  try {
    const result = await apiFetch<{ data: Testimonial[] } | Testimonial[]>('/testimonials', {
      cache: 'no-store',
    });
    // Handle both paginated and plain array responses
    return Array.isArray(result) ? result : (result as { data?: Testimonial[] }).data ?? [];
  } catch {
    return [];
  }
}

// ─── Admin API Methods ────────────────────────────────────────────────────────

export async function getAdminLeads(params: Record<string, unknown> = {}, token: string): Promise<PaginatedResponse<Lead>> {
  const qs = buildQueryString(params);
  return apiFetch(`/leads${qs}`, { token });
}

export async function getAdminRentalBookings(params: Record<string, unknown> = {}, token: string): Promise<PaginatedResponse<RentalBooking>> {
  const qs = buildQueryString(params);
  return apiFetch(`/rental-bookings${qs}`, { token });
}

export async function updateRentalBookingStatus(id: number, status: string, token: string): Promise<unknown> {
  return apiFetch(`/rental-bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  });
}

// ─── Admin: Payment Methods ───────────────────────────────────────────────────

export async function getAdminPaymentMethods(token: string): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/payment-methods/admin', { token, cache: 'no-store' });
}

export async function createPaymentMethod(data: Partial<PaymentMethod>, token: string): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function updatePaymentMethod(id: number, data: Partial<PaymentMethod>, token: string): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>(`/payment-methods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export async function deletePaymentMethod(id: number, token: string): Promise<unknown> {
  return apiFetch(`/payment-methods/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function getVehicleBlackoutDates(vehicleId: number, token: string): Promise<BlackoutDate[]> {
  return apiFetch(`/vehicles/${vehicleId}/blackout-dates`, { token });
}

export async function addBlackoutDate(vehicleId: number, payload: Record<string, unknown>, token: string): Promise<unknown> {
  return apiFetch(`/vehicles/${vehicleId}/blackout-dates`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export async function removeBlackoutDate(vehicleId: number, blackoutDateId: number, token: string): Promise<unknown> {
  return apiFetch(`/vehicles/${vehicleId}/blackout-dates/${blackoutDateId}`, {
    method: 'DELETE',
    token,
  });
}

export async function updateBookingPaperwork(id: number, formData: FormData, token: string): Promise<unknown> {
  const res = await fetch(`${API_URL}/rental-bookings/${id}/paperwork`, {
    method: 'PATCH',
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Upload failed with status ${res.status}`);
  }

  const json = await res.json();
  return json.data !== undefined && json.statusCode !== undefined ? json.data : json;
}
