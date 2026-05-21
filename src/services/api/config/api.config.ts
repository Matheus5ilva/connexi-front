const DEFAULT_API_TIMEOUT_MS = 15000;
const DEFAULT_HOSTNAME_BASE = "localhost";
const DEFAULT_DEVELOPMENT_API_PORT = "3000";
const TENANT_ID_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_TENANT_IDS = new Set(["api", "www", "admin", "root", "public"]);

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCredentials(value: string | undefined): RequestCredentials {
  if (value === "omit" || value === "include" || value === "same-origin") {
    return value;
  }

  return "same-origin";
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "";
  }

  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.replace(/\/$/, "");
}

function resolveCurrentHostname(): string {
  if (typeof window === "undefined") {
    return "localhost";
  }

  return window.location.hostname.trim().toLowerCase();
}

function detectTenantSubdomain(
  hostname: string,
  hostnameBase: string,
): string | null {
  const host = hostname.trim().toLowerCase();
  const base = hostnameBase.trim().toLowerCase();
  const suffix = `.${base}`;

  if (!host || !base || !host.endsWith(suffix)) {
    return null;
  }

  const label = host.slice(0, host.length - suffix.length);
  if (!label || label.includes(".")) {
    return null;
  }

  if (!TENANT_ID_REGEX.test(label) || RESERVED_TENANT_IDS.has(label)) {
    return null;
  }

  return label;
}

function resolveApiPort(): string {
  const configured = import.meta.env.VITE_API_PORT?.trim();

  if (configured) {
    if (configured.toLowerCase() === "same") {
      return typeof window === "undefined" ? "" : window.location.port;
    }

    return configured;
  }

  if (typeof window === "undefined") {
    return DEFAULT_DEVELOPMENT_API_PORT;
  }

  if (import.meta.env.DEV) {
    return DEFAULT_DEVELOPMENT_API_PORT;
  }

  return window.location.port;
}

function resolveRuntimeBaseUrl(hostname: string): string {
  if (typeof window === "undefined") {
    return "/api";
  }

  const protocol = window.location.protocol || "http:";
  const port = resolveApiPort();
  const path = normalizePath(import.meta.env.VITE_API_BASE_PATH || "");
  const hostWithPort = port ? `${hostname}:${port}` : hostname;

  return `${protocol}//${hostWithPort}${path}`;
}

function replaceTenantPlaceholders(
  template: string,
  tenantSubdomain: string | null,
): string {
  if (typeof window === "undefined") {
    return template;
  }

  return template
    .replaceAll("{origin}", window.location.origin)
    .replaceAll("{hostname}", window.location.hostname)
    .replaceAll("{tenant}", tenantSubdomain ?? "")
    .replaceAll("{subdomain}", tenantSubdomain ?? "");
}

function resolveBaseUrl(
  hostname: string,
  tenantSubdomain: string | null,
): string {
  const configuredBaseUrl =
    import.meta.env.VITE_API_URL?.trim() ||
    import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(
      replaceTenantPlaceholders(configuredBaseUrl, tenantSubdomain),
    );
  }

  return normalizeBaseUrl(resolveRuntimeBaseUrl(hostname));
}

const hostnameBase = (import.meta.env.VITE_APP_HOSTNAME_BASE || DEFAULT_HOSTNAME_BASE)
  .trim()
  .toLowerCase();
const hostname = resolveCurrentHostname();
const tenantSubdomain = detectTenantSubdomain(hostname, hostnameBase);
const baseUrl = resolveBaseUrl(hostname, tenantSubdomain);

export const apiConfig = Object.freeze({
  baseUrl,
  hostname,
  hostnameBase,
  tenantSubdomain,
  timeoutMs: parsePositiveInt(import.meta.env.VITE_API_TIMEOUT_MS, DEFAULT_API_TIMEOUT_MS),
  credentials: parseCredentials(import.meta.env.VITE_API_CREDENTIALS_MODE),
  authTokenStorageKey:
    import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY || "connexi.access-token",
});

export type ApiConfig = typeof apiConfig;
