import type {
  Vehicle,
  Testimonial,
  PaginatedResponse,
  VehicleQueryParams,
  CreateLeadPayload,
  CreateLeadResponse,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length ? `?${entries.join('&')}` : '';
}

// ─── Public: Vehicles ─────────────────────────────────────────────────────────

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

// ─── Public: Analytics ────────────────────────────────────────────────────────

/** Fire-and-forget view tracking for a vehicle detail page. */
export async function trackVehicleView(vehicleId: number): Promise<void> {
  try {
    await apiFetch(`/analytics/vehicles/${vehicleId}/track-view`, { method: 'POST' });
  } catch {
    // Silently ignore — analytics must never affect user experience
  }
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
