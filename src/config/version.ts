export const APP_NAME = "CONNEXI";

export const APP_DOMAIN = "connexi.com.br";

export const APP_PRODUCTION_SITE_URL = `https://${APP_DOMAIN}`;

function normalizarSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, "");
}

function resolverSiteUrl(): string {
  if (import.meta.env.PROD) {
    return APP_PRODUCTION_SITE_URL;
  }

  const siteUrlConfigurada = import.meta.env.VITE_SITE_URL?.trim();

  if (siteUrlConfigurada) {
    return normalizarSiteUrl(siteUrlConfigurada);
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return normalizarSiteUrl(window.location.origin);
  }

  return APP_PRODUCTION_SITE_URL;
}

export const APP_SITE_URL = resolverSiteUrl();

export const APP_VERSION = "1.0.0";
