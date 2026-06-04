import axios from "axios";
import type { components, paths } from "./pawit-api-types";

type ApiPath = keyof paths;
type JsonRequest<Path extends ApiPath, Method extends keyof paths[Path]> =
  paths[Path][Method] extends {
    requestBody: { content: { "application/json": infer Body } };
  }
    ? Body
    : never;
type JsonResponse<Path extends ApiPath, Method extends keyof paths[Path], Status extends number> =
  paths[Path][Method] extends {
    responses: Record<Status, { content: { "application/json": infer Body } }>;
  }
    ? Body
    : never;

export type BillingResponse = components["schemas"]["BillingResponse"];
export type Invoice = components["schemas"]["Invoice"];
export type CreateInvoiceRequest = JsonRequest<"/api/v1/billing/invoices", "post">;
export type InvoiceMutationResult = JsonResponse<"/api/v1/billing/invoices", "post", 201>;
export type VoidInvoiceRequest = JsonRequest<"/api/v1/billing/invoices/{id}/void", "post">;
export type VoidInvoiceResult = JsonResponse<"/api/v1/billing/invoices/{id}/void", "post", 200>;

const runtimeConfig = typeof window === "undefined" ? {} : window.__PAWIT_CONFIG__ ?? {};

const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl || process.env.NEXT_PUBLIC_PAWIT_API_BASE_URL || "http://localhost:8080",
  headers: {
    "X-PawIt-Tenant-ID": runtimeConfig.tenantId || process.env.NEXT_PUBLIC_PAWIT_TENANT_ID,
    "X-PawIt-User-ID": runtimeConfig.userId || process.env.NEXT_PUBLIC_PAWIT_USER_ID,
    "X-PawIt-Role": runtimeConfig.role || process.env.NEXT_PUBLIC_PAWIT_ROLE,
  },
  withCredentials: true,
});

export async function getBilling(): Promise<BillingResponse> {
  const response = await api.get<BillingResponse>("/api/v1/billing");
  return response.data;
}

export async function createInvoice(
  body: CreateInvoiceRequest,
  idempotencyKey: string,
): Promise<InvoiceMutationResult> {
  const response = await api.post<InvoiceMutationResult>("/api/v1/billing/invoices", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function voidInvoice(
  invoiceID: string,
  body: VoidInvoiceRequest,
  idempotencyKey: string,
): Promise<VoidInvoiceResult> {
  const response = await api.post<VoidInvoiceResult>(`/api/v1/billing/invoices/${invoiceID}/void`, body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}
