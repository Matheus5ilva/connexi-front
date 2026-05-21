export type Primitive = string | number | boolean | null | undefined;

export type QueryParams = Record<string, Primitive | Primitive[]>;

export interface ApiEnvelope<TData> {
  data: TData;
  message?: string;
}

export interface ApiListResponse<TItem> {
  items: TItem[];
  total: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  pageSize: number;
  total: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  meta: PaginatedMeta;
}

export type FieldErrors = Record<string, string[]>;

export interface ApiErrorResponse {
  status?: number;
  statusCode?: number;
  code?: string;
  error?: string;
  message?: string | string[];
  details?: unknown;
  errors?: FieldErrors;
  path?: string;
  timestamp?: string;
}

export interface PaginationRequest extends QueryParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
}

export type RequisicaoPaginada = PaginationRequest;
