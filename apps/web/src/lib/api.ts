const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
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
    if (res.status === 401 && typeof window !== 'undefined') {
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
          allowOutsideClick: false
        }).then(() => {
          window.location.href = '/login';
        });
      });
      throw new Error('Session expired');
    }
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}
