/**
 * Resolve the app's absolute base URL for building metadata/image links.
 * Prefers NEXT_PUBLIC_APP_URL, then falls back to the incoming request origin.
 */
export function getBaseUrl(request?: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  if (request) {
    try {
      return new URL(request.url).origin;
    } catch {
      // fall through
    }
  }

  return "http://localhost:3000";
}
