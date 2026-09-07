/**
 * API Routing & Partitioning Utility for Cloudflare Pages <-> Azure VM Backend
 *
 * When deployed to Cloudflare Pages, set `VITE_API_BASE_URL` in Cloudflare Environment Variables:
 * e.g., VITE_API_BASE_URL=https://api.yourdomain.com
 *
 * If VITE_API_BASE_URL is not set (e.g., local development or monolith deployment),
 * calls resolve to standard same-origin relative paths (/api/...).
 */

export const API_BASE_URL: string = (
  (import.meta as any).env?.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");

/**
 * Returns the fully qualified URL for an API endpoint.
 */
export function getApiUrl(endpoint: string): string {
  if (!endpoint) return "";
  // If it's already an absolute URL (http:// or https://), return as-is
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return normalizedPath;
}

/**
 * Enhanced fetch wrapper that automatically targets the Azure VM backend
 * when running on Cloudflare Pages or custom domains.
 */
export async function apiFetch(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  if (typeof input === "string") {
    return fetch(getApiUrl(input), init);
  }
  return fetch(input, init);
}

/**
 * Installs global fetch interceptor so that existing fetch('/api/...') calls
 * automatically route to the Azure VM backend when VITE_API_BASE_URL is configured.
 */
export function initApiRouting(): void {
  if (typeof window === "undefined" || !API_BASE_URL) return;

  const originalFetch = window.fetch;
  window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const fullUrl = `${API_BASE_URL}${input}`;
      return originalFetch.call(this, fullUrl, init);
    }
    return originalFetch.call(this, input, init);
  };

  console.info(
    `[Apex Stratos] API routing initialized: routing /api/* to ${API_BASE_URL}`
  );
}
