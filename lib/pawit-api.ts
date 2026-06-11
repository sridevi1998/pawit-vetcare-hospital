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
export type CancelAppointmentRequest = JsonRequest<"/api/v1/appointments/{id}/cancel", "post">;
export type CancelAppointmentResult = JsonResponse<"/api/v1/appointments/{id}/cancel", "post", 200>;
export type RegisterWalkInRequest = JsonRequest<"/api/v1/queue/walk-ins", "post">;
export type QueueMutationResult = JsonResponse<"/api/v1/queue/walk-ins", "post", 201>;
export type UpdateQueueRequest = components["schemas"]["UpdateQueueRequest"];
export type QueueTransitionResult = JsonResponse<"/api/v1/queue/{id}/call", "post", 200>;
export type CreatePetRequest = JsonRequest<"/api/v1/pets", "post">;
export type PetMutationResult = JsonResponse<"/api/v1/pets", "post", 201>;
export type ArchivePetRequest = JsonRequest<"/api/v1/pets/{id}/archive", "post">;
export type ArchivePetResult = JsonResponse<"/api/v1/pets/{id}/archive", "post", 200>;
export type PetDocument = components["schemas"]["PetDocument"];
export type UploadPetDocumentRequest = JsonRequest<"/api/v1/pets/{id}/documents", "post">;
export type UploadPetDocumentResult = JsonResponse<"/api/v1/pets/{id}/documents", "post", 201>;
export type ArchivePetDocumentRequest = JsonRequest<"/api/v1/pets/{id}/documents/{documentId}/archive", "post">;
export type ArchivePetDocumentResult = JsonResponse<"/api/v1/pets/{id}/documents/{documentId}/archive", "post", 200>;
export type CreatePrescriptionRequest = JsonRequest<"/api/v1/prescriptions", "post">;
export type PrescriptionMutationResult = JsonResponse<"/api/v1/prescriptions", "post", 201>;
export type FinalizePrescriptionRequest = JsonRequest<"/api/v1/prescriptions/{id}/finalize", "post">;
export type FinalizePrescriptionResult = JsonResponse<"/api/v1/prescriptions/{id}/finalize", "post", 200>;
export type CreateLabOrderRequest = JsonRequest<"/api/v1/lab-tests", "post">;
export type LabOrderMutationResult = JsonResponse<"/api/v1/lab-tests", "post", 201>;
export type UpdateLabOrderStatusRequest = JsonRequest<"/api/v1/lab-tests/{id}/status", "post">;
export type UpdateLabOrderStatusResult = JsonResponse<"/api/v1/lab-tests/{id}/status", "post", 200>;
export type UploadLabResultRequest = components["schemas"]["UploadLabResultRequest"];
export type UploadLabResultResult = JsonResponse<"/api/v1/lab-tests/{id}/report", "post", 201>;
export type CreateInvoiceRequest = JsonRequest<"/api/v1/billing/invoices", "post">;
export type InvoiceMutationResult = JsonResponse<"/api/v1/billing/invoices", "post", 201>;
export type VoidInvoiceRequest = JsonRequest<"/api/v1/billing/invoices/{id}/void", "post">;
export type VoidInvoiceResult = JsonResponse<"/api/v1/billing/invoices/{id}/void", "post", 200>;
export type CreateStaffRequest = JsonRequest<"/api/v1/staff", "post">;
export type StaffMutationResult = JsonResponse<"/api/v1/staff", "post", 201>;
export type LoginRequest = { email: string; password: string; tenantId?: string; hospitalId?: string; role?: string };
export type AuthSession = {
  userId: string;
  tenantId: string;
  role: string;
  displayName: string;
  email: string;
  token: string;
  expiresAt: string;
};
export type CurrentUserResponse = {
  user: {
    id: string;
    role: string;
    tenantId: string;
  };
  clinic: {
    name: string;
    type: string;
  };
};

const runtimeConfig = typeof window === "undefined" ? {} : window.__PAWIT_CONFIG__ ?? {};
let serverAuthToken = "";

export function setServerAuthToken(token: string) {
  serverAuthToken = token;
}

const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl || process.env.NEXT_PUBLIC_PAWIT_API_BASE_URL || "http://localhost:8080",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = typeof window === "undefined" ? serverAuthToken : "";
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(body: LoginRequest): Promise<AuthSession> {
  const response = await api.post<AuthSession>("/api/v1/auth/login", body);
  return response.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/v1/auth/logout");
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const response = await api.get<CurrentUserResponse>("/api/v1/me");
  return response.data;
}

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

export async function cancelAppointment(
  appointmentID: string,
  body: CancelAppointmentRequest,
  idempotencyKey: string,
): Promise<CancelAppointmentResult> {
  const response = await api.post<CancelAppointmentResult>(`/api/v1/appointments/${appointmentID}/cancel`, body, {
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

async function transitionQueueEntry(
  queueEntryID: string,
  transition: "call" | "start" | "complete" | "cancel",
  body: UpdateQueueRequest,
  idempotencyKey: string,
): Promise<QueueTransitionResult> {
  const response = await api.post<QueueTransitionResult>(`/api/v1/queue/${queueEntryID}/${transition}`, body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function callQueueEntry(queueEntryID: string, body: UpdateQueueRequest, idempotencyKey: string) {
  return transitionQueueEntry(queueEntryID, "call", body, idempotencyKey);
}

export async function startQueueEntry(queueEntryID: string, body: UpdateQueueRequest, idempotencyKey: string) {
  return transitionQueueEntry(queueEntryID, "start", body, idempotencyKey);
}

export async function completeQueueEntry(queueEntryID: string, body: UpdateQueueRequest, idempotencyKey: string) {
  return transitionQueueEntry(queueEntryID, "complete", body, idempotencyKey);
}

export async function cancelQueueEntry(queueEntryID: string, body: UpdateQueueRequest, idempotencyKey: string) {
  return transitionQueueEntry(queueEntryID, "cancel", body, idempotencyKey);
}

export async function createPet(body: CreatePetRequest, idempotencyKey: string): Promise<PetMutationResult> {
  const response = await api.post<PetMutationResult>("/api/v1/pets", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function archivePet(
  petID: string,
  body: ArchivePetRequest,
  idempotencyKey: string,
): Promise<ArchivePetResult> {
  const response = await api.post<ArchivePetResult>(`/api/v1/pets/${petID}/archive`, body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function getPetDocuments(petID: string) {
  const response = await api.get<{ items: PetDocument[] }>(`/api/v1/pets/${petID}/documents`);
  return response.data;
}

export async function uploadPetDocument(
  petID: string,
  body: UploadPetDocumentRequest,
  idempotencyKey: string,
): Promise<UploadPetDocumentResult> {
  const response = await api.post<UploadPetDocumentResult>(`/api/v1/pets/${petID}/documents`, body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function archivePetDocument(
  petID: string,
  documentID: string,
  body: ArchivePetDocumentRequest,
  idempotencyKey: string,
): Promise<ArchivePetDocumentResult> {
  const response = await api.post<ArchivePetDocumentResult>(
    `/api/v1/pets/${petID}/documents/${documentID}/archive`,
    body,
    {
      headers: { "Idempotency-Key": idempotencyKey },
    },
  );
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

export async function finalizePrescription(
  prescriptionID: string,
  body: FinalizePrescriptionRequest,
  idempotencyKey: string,
): Promise<FinalizePrescriptionResult> {
  const response = await api.post<FinalizePrescriptionResult>(`/api/v1/prescriptions/${prescriptionID}/finalize`, body, {
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

export async function updateLabOrderStatus(
  labOrderID: string,
  body: UpdateLabOrderStatusRequest,
  idempotencyKey: string,
): Promise<UpdateLabOrderStatusResult> {
  const response = await api.post<UpdateLabOrderStatusResult>(`/api/v1/lab-tests/${labOrderID}/status`, body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return response.data;
}

export async function uploadLabResult(
  labOrderID: string,
  body: UploadLabResultRequest,
  idempotencyKey: string,
): Promise<UploadLabResultResult> {
  const response = await api.post<UploadLabResultResult>(`/api/v1/lab-tests/${labOrderID}/report`, body, {
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
