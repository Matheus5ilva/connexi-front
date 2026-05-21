import { apiConfig } from "../config/api.config";
import {
  ApiError,
  createHttpApiError,
  isApiError,
  normalizeApiError,
} from "../errors/api-error";
import {
  createDefaultTokenStore,
  type AuthTokenStore,
} from "../auth/token-store";
import type { ApiErrorResponse, QueryParams } from "../types/common";
import { frontendLogger } from "../../logger/frontend-logger";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ResponseType = "json" | "text" | "blob" | "void";

export interface RequestOptions<TBody = unknown> {
  path: string;
  method?: HttpMethod;
  query?: QueryParams;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  auth?: boolean;
  responseType?: ResponseType;
  timeoutMs?: number;
  aplicarInterceptorsErro?: boolean;
}

interface InternalRequestOptions<TBody = unknown>
  extends Omit<RequestOptions<TBody>, "method" | "auth" | "responseType"> {
  method: HttpMethod;
  auth: boolean;
  responseType: ResponseType;
}

type RequestInterceptor = (
  request: InternalRequestOptions,
) => Promise<InternalRequestOptions> | InternalRequestOptions;

type ResponseInterceptor = (
  responseData: unknown,
  response: Response,
) => Promise<unknown> | unknown;

type ErrorInterceptor = (error: ApiError) => Promise<never | ApiError> | never | ApiError;

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  credentials: RequestCredentials;
  defaultHeaders?: HeadersInit;
  tokenStore: AuthTokenStore;
}

function buildQueryParams(query?: QueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (!query) {
    return searchParams;
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .forEach((item) => {
          searchParams.append(key, String(item));
        });
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams;
}

function isJsonContent(headers: Headers): boolean {
  return (headers.get("content-type") || "").includes("application/json");
}

async function parseResponseBody(
  response: Response,
  responseType: ResponseType,
): Promise<unknown> {
  if (responseType === "void" || response.status === 204) {
    return undefined;
  }

  if (responseType === "text") {
    return response.text();
  }

  if (responseType === "blob") {
    return response.blob();
  }

  if (isJsonContent(response.headers)) {
    const text = await response.text();
    if (!text) {
      return undefined;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  const fallbackText = await response.text();
  return fallbackText || undefined;
}

function createRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    typeof body === "string"
  ) {
    return body;
  }

  return JSON.stringify(body);
}

export class HttpClient {
  private readonly options: HttpClientOptions;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  setAuthToken(token: string): void {
    this.options.tokenStore.setAccessToken(token);
  }

  clearAuthToken(): void {
    this.options.tokenStore.clearAccessToken();
  }

  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  useErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  async request<TResponse, TBody = unknown>(
    request: RequestOptions<TBody>,
  ): Promise<TResponse> {
    let requestConfig: InternalRequestOptions = {
      ...request,
      method: request.method || "GET",
      auth: request.auth ?? true,
      responseType: request.responseType ?? "json",
    };

    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    const timeoutMs = requestConfig.timeoutMs ?? this.options.timeoutMs;
    const normalizedPath = requestConfig.path.startsWith("/")
      ? requestConfig.path
      : `/${requestConfig.path}`;
    const basePath = requestConfig.path.startsWith("http")
      ? requestConfig.path
      : `${this.options.baseUrl}${normalizedPath}`;

    const baseOrigin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(basePath, baseOrigin);
    const queryParams = buildQueryParams(requestConfig.query);
    queryParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    const headers = new Headers(this.options.defaultHeaders);
    if (requestConfig.headers) {
      new Headers(requestConfig.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const requestBody = createRequestBody(requestConfig.body);
    if (
      requestBody !== undefined &&
      !headers.has("Content-Type") &&
      !(requestConfig.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (requestConfig.auth) {
      const token = this.options.tokenStore.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const abortController = new AbortController();
    let didTimeout = false;

    if (requestConfig.signal) {
      if (requestConfig.signal.aborted) {
        abortController.abort();
      } else {
        requestConfig.signal.addEventListener(
          "abort",
          () => abortController.abort(),
          { once: true },
        );
      }
    }

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      abortController.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: requestConfig.method,
        headers,
        body: requestBody,
        signal: abortController.signal,
        credentials: this.options.credentials,
      });

      const responseData = await parseResponseBody(
        response,
        requestConfig.responseType,
      );

      if (!response.ok) {
        throw createHttpApiError({
          status: response.status,
          payload: responseData as ApiErrorResponse,
          url: url.toString(),
          method: requestConfig.method,
        });
      }

      let parsedResponse = responseData;
      for (const interceptor of this.responseInterceptors) {
        parsedResponse = await interceptor(parsedResponse, response);
      }

      return parsedResponse as TResponse;
    } catch (error) {
      let normalizedError: ApiError;

      if (didTimeout) {
        normalizedError = new ApiError({
          kind: "timeout",
          message: "Tempo limite da requisicao excedido.",
          url: url.toString(),
          method: requestConfig.method,
          cause: error,
        });
      } else {
        normalizedError = normalizeApiError(error);
      }

      if (requestConfig.aplicarInterceptorsErro !== false) {
        for (const interceptor of this.errorInterceptors) {
          const interceptorResult = await interceptor(normalizedError);
          if (isApiError(interceptorResult)) {
            normalizedError = interceptorResult;
          }
        }
      }

      if (normalizedError.kind === "aborted") {
        frontendLogger.debug("HttpClient", "Requisição cancelada", {
          metodo: requestConfig.method,
          url: url.toString(),
        });
      } else if (
        normalizedError.kind === "network" ||
        normalizedError.kind === "timeout" ||
        (normalizedError.status !== undefined && normalizedError.status >= 500)
      ) {
        frontendLogger.error("HttpClient", "Falha em requisição de API", {
          metodo: requestConfig.method,
          url: url.toString(),
          status: normalizedError.status,
          tipo: normalizedError.kind,
          codigo: normalizedError.code,
          erro: normalizedError,
        });
      } else {
        frontendLogger.warn("HttpClient", "Requisição de API rejeitada", {
          metodo: requestConfig.method,
          url: url.toString(),
          status: normalizedError.status,
          tipo: normalizedError.kind,
          codigo: normalizedError.code,
          erro: normalizedError,
        });
      }

      throw normalizedError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<TResponse>(
    path: string,
    options?: Omit<RequestOptions<never>, "path" | "method" | "body">,
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...options,
      path,
      method: "GET",
    });
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, "path" | "method" | "body">,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>({
      ...options,
      path,
      body,
      method: "POST",
    });
  }

  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, "path" | "method" | "body">,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>({
      ...options,
      path,
      body,
      method: "PUT",
    });
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody>, "path" | "method" | "body">,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>({
      ...options,
      path,
      body,
      method: "PATCH",
    });
  }

  delete<TResponse>(
    path: string,
    options?: Omit<RequestOptions<never>, "path" | "method" | "body">,
  ): Promise<TResponse> {
    return this.request<TResponse>({
      ...options,
      path,
      method: "DELETE",
    });
  }
}

const tokenStore = createDefaultTokenStore(apiConfig.authTokenStorageKey);

export const httpClient = new HttpClient({
  baseUrl: apiConfig.baseUrl,
  timeoutMs: apiConfig.timeoutMs,
  credentials: apiConfig.credentials,
  defaultHeaders: {
    Accept: "application/json",
  },
  tokenStore,
});
