/**
 * Admin fetch wrapper that handles:
 * - Bearer authorization from localStorage
 * - Cookie inclusion (credentials: 'include')
 * - Automatic redirect to /admin/login on 401 / 403 unauthorized or forbidden
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = new Headers(init?.headers || {});
    if (token && token !== 'null' && token !== 'undefined' && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
    });

    if (res.status === 401 || res.status === 403) {
        if (typeof window !== 'undefined') {
            try {
                // Clear state
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Asynchronously notify server to expire cookie
                fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
            } finally {
                // If we're not already on the login page, redirect
                if (window.location.pathname !== '/admin/login') {
                    window.location.href = '/admin/login';
                }
            }
        }
    }

    return res;
}
