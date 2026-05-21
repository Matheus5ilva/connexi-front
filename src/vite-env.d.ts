/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PORT?: string;
  readonly VITE_API_BASE_PATH?: string;
  readonly VITE_APP_HOSTNAME_BASE?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_API_CREDENTIALS_MODE?: "omit" | "same-origin" | "include";
  readonly VITE_AUTH_TOKEN_STORAGE_KEY?: string;
  readonly VITE_SUPPORT_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
