export interface AuthTokenStore {
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  clearAccessToken(): void;
}

class MemoryTokenStore implements AuthTokenStore {
  private token: string | null = null;

  getAccessToken(): string | null {
    return this.token;
  }

  setAccessToken(token: string): void {
    this.token = token;
  }

  clearAccessToken(): void {
    this.token = null;
  }
}

export class SessionStorageTokenStore implements AuthTokenStore {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const rawToken = window.sessionStorage.getItem(this.storageKey);
      const normalizedToken = rawToken?.trim() || "";
      return normalizedToken.length > 0 ? normalizedToken : null;
    } catch {
      return null;
    }
  }

  setAccessToken(token: string): void {
    if (typeof window === "undefined") {
      return;
    }

    const normalizedToken = token.trim();
    if (!normalizedToken) {
      return;
    }

    try {
      window.sessionStorage.setItem(this.storageKey, normalizedToken);
    } catch {
      // Ignore quota/security restrictions and keep runtime stable.
    }
  }

  clearAccessToken(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.sessionStorage.removeItem(this.storageKey);
    } catch {
      // Ignore quota/security restrictions and keep runtime stable.
    }
  }
}

export function createDefaultTokenStore(storageKey: string): AuthTokenStore {
  if (typeof window === "undefined") {
    return new MemoryTokenStore();
  }

  return new SessionStorageTokenStore(storageKey);
}
