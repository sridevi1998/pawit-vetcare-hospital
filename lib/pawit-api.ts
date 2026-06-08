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
export type Metric = components["schemas"]["Metric"];
export type Appointment = components["schemas"]["Appointment"];
export type CalendarResponse = components["schemas"]["CalendarResponse"];
export type QueueEntry = components["schemas"]["QueueEntry"];
export type PetRecord = components["schemas"]["PetRecord"];
export type Prescription = components["schemas"]["Prescription"];
export type ClinicalNote = components["schemas"]["ClinicalNote"];
export type LabTest = components["schemas"]["LabTest"];
export type Analytics = components["schemas"]["Analytics"];
export type FeedbackResponse = components["schemas"]["FeedbackResponse"];
export type Feedback = components["schemas"]["Feedback"];
export type Person = components["schemas"]["Person"];
export type AuditLogEntry = components["schemas"]["AuditLogEntry"];
export type CreateAppointmentRequest = JsonRequest<"/api/v1/appointments", "post">;
export type AppointmentMutationResult = JsonResponse<"/api/v1/appointments", "post", 201>;
export type RegisterWalkInRequest = JsonRequest<"/api/v1/queue/walk-ins", "post">;
export type QueueMutationResult = JsonResponse<"/api/v1/queue/walk-ins", "post", 201>;
export type CreatePetRequest = JsonRequest<"/api/v1/pets", "post">;
export type PetMutationResult = JsonResponse<"/api/v1/pets", "post", 201>;
export type CreatePrescriptionRequest = JsonRequest<"/api/v1/prescriptions", "post">;
export type PrescriptionMutationResult = JsonResponse<"/api/v1/prescriptions", "post", 201>;
export type CreateLabOrderRequest = JsonRequest<"/api/v1/lab-tests", "post">;
export type LabOrderMutationResult = JsonResponse<"/api/v1/lab-tests", "post", 201>;
export type CreateInvoiceRequest = JsonRequest<"/api/v1/billing/invoices", "post">;
export type InvoiceMutationResult = JsonResponse<"/api/v1/billing/invoices", "post", 201>;
export type VoidInvoiceRequest = JsonRequest<"/api/v1/billing/invoices/{id}/void", "post">;
export type VoidInvoiceResult = JsonResponse<"/api/v1/billing/invoices/{id}/void", "post", 200>;
export type CreateStaffRequest = JsonRequest<"/api/v1/staff", "post">;
export type StaffMutationResult = JsonResponse<"/api/v1/staff", "post", 201>;

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

export async function getDashboardSummary() {
  const response = await api.get<{ metrics: Metric[] }>("/api/v1/dashboard/summary");
  return response.data;
}

export async function getAppointments() {
  const response = await api.get<{ items: Appointment[] }>("/api/v1/appointments");
  return response.data;
}

export async function getCalendar() {
  const response = await api.get<CalendarResponse>("/api/v1/calendar");
  return response.data;
}

export async function getQueue() {
  const response = await api.get<{ items: QueueEntry[] }>("/api/v1/queue");
  return response.data;
}

export async function getPets() {
  const response = await api.get<{ items: PetRecord[] }>("/api/v1/pets");
  return response.data;
}

export async function getPrescriptions() {
  const response = await api.get<{ items: Prescription[] }>("/api/v1/prescriptions");
  return response.data;
}

export async function getClinicalNotes() {
  const response = await api.get<{ items: ClinicalNote[] }>("/api/v1/clinical-notes");
  return response.data;
}

export async function getLabTests() {
  const response = await api.get<{ items: LabTest[] }>("/api/v1/lab-tests");
  return response.data;
}

export async function getAnalytics() {
  const response = await api.get<Analytics>("/api/v1/analytics");
  return response.data;
}

export async function getFeedback() {
  const response = await api.get<FeedbackResponse>("/api/v1/feedback");
  return response.data;
}

export async function getDoctors() {
  const response = await api.get<{ items: Person[] }>("/api/v1/doctors");
  return response.data;
}

export async function getStaff() {
  const response = await api.get<{ items: Person[] }>("/api/v1/staff");
  return response.data;
}

export async function getAuditLogs() {
  const response = await api.get<{ items: AuditLogEntry[] }>("/api/v1/audit-logs");
  return response.data;
}

export async function createAppointment(
  body: CreateAppointmentRequest,
  idempotencyKey: string,
): Promise<AppointmentMutationResult> {
  const response = await api.post<AppointmentMutationResult>("/api/v1/appointments", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function registerWalkIn(
  body: RegisterWalkInRequest,
  idempotencyKey: string,
): Promise<QueueMutationResult> {
  const response = await api.post<QueueMutationResult>("/api/v1/queue/walk-ins", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function createPet(body: CreatePetRequest, idempotencyKey: string): Promise<PetMutationResult> {
  const response = await api.post<PetMutationResult>("/api/v1/pets", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function createPrescription(
  body: CreatePrescriptionRequest,
  idempotencyKey: string,
): Promise<PrescriptionMutationResult> {
  const response = await api.post<PrescriptionMutationResult>("/api/v1/prescriptions", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function createLabOrder(
  body: CreateLabOrderRequest,
  idempotencyKey: string,
): Promise<LabOrderMutationResult> {
  const response = await api.post<LabOrderMutationResult>("/api/v1/lab-tests", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
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

export async function createStaff(body: CreateStaffRequest, idempotencyKey: string): Promise<StaffMutationResult> {
  const response = await api.post<StaffMutationResult>("/api/v1/staff", body, {
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
