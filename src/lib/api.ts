const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://dsw-07gj.onrender.com/api';

// In-flight request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Cache TTL configuration in milliseconds
const CACHE_TTL: Record<string, number> = {
  '/events': 30_000,
  '/leaderboard/students/rankings': 30_000,
  '/leaderboard/staff/rankings': 30_000,
  '/announcements': 30_000,
  '/auth/me': 10_000,
};

const memoryCache = new Map<string, { data: any; expiry: number }>();

export function clearApiCache() {
  memoryCache.clear();
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  isMultipart: boolean = false,
  skipCache: boolean = false
): Promise<T> {
  const token = localStorage.getItem('dsw_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const cacheKey = `${method}:${endpoint}:${token || 'anon'}`;

  // Check cache for GET requests
  if (method === 'GET' && !skipCache) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }

    // Deduplicate concurrent in-flight GET requests
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!;
    }
  }

  // Clear cache on write operations (POST, PUT, PATCH, DELETE)
  if (method !== 'GET') {
    memoryCache.clear();
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
      });

      if (!response.ok) {
        let errorDetail = 'An unexpected error occurred';
        try {
          const text = await response.text();
          try {
            const errJson = JSON.parse(text);
            if (errJson.detail) {
              if (Array.isArray(errJson.detail)) {
                errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
              } else if (typeof errJson.detail === 'string') {
                errorDetail = errJson.detail;
              } else {
                errorDetail = JSON.stringify(errJson.detail);
              }
            } else {
              errorDetail = JSON.stringify(errJson);
            }
          } catch {
            errorDetail = text;
          }
        } catch {
          errorDetail = response.statusText || 'An unexpected error occurred';
        }
        throw new Error(errorDetail);
      }

      // If the response is HTML / streaming text (e.g. PDF/HTML reports)
      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType && contentType.includes('text/html')) {
        data = (await response.text()) as unknown as T;
      } else {
        data = await response.json();
      }

      // Store in memory cache if GET
      if (method === 'GET') {
        const ttl = CACHE_TTL[endpoint] || 15_000;
        memoryCache.set(cacheKey, { data, expiry: Date.now() + ttl });
      }

      return data as T;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  if (method === 'GET') {
    pendingRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

