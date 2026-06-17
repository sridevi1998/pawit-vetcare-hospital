"use client";

import AlertCircle from "lucide-react/dist/esm/icons/circle-alert";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import CalendarPlus from "lucide-react/dist/esm/icons/calendar-plus";
import CheckCircle2 from "lucide-react/dist/esm/icons/circle-check-big";
import FilePlus2 from "lucide-react/dist/esm/icons/file-plus-2";
import FlaskConical from "lucide-react/dist/esm/icons/flask-conical";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import PawPrint from "lucide-react/dist/esm/icons/paw-print";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import Stethoscope from "lucide-react/dist/esm/icons/stethoscope";
import UserPlus from "lucide-react/dist/esm/icons/user-plus";
import { useRouter } from "next/navigation";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { useState } from "react";

import {
  createAppointment,
  createClinicalNote,
  createInvoice,
  createLabOrder,
  createPet,
  createPrescription,
  createStaff,
  createTenant,
  createTenantLocation,
  registerWalkIn,
  type CreateClinicLocationRequest,
  type CreateAppointmentRequest,
  type CreateClinicalNoteRequest,
  type CreateInvoiceRequest,
  type CreateLabOrderRequest,
  type CreatePetRequest,
  type CreatePrescriptionRequest,
  type CreateStaffRequest,
  type CreateTenantRequest,
  type RegisterWalkInRequest,
} from "@/lib/pawit-api";

type WorkflowActionsProps = {
  role: string;
  section: string;
};

type SubmitStatus = {
  kind: "idle" | "submitting" | "success" | "error";
  message?: string;
};

type ActionFrameProps = {
  children: ReactNode;
  icon: ComponentType<{ className?: string; size?: number }>;
  status: SubmitStatus;
  title: string;
};

const locationDefault = "loc_001";
const petDefault = "pet_001";
const tenantDefault = "tenant_demo_clinic";

export function WorkflowActions({ role, section }: WorkflowActionsProps) {
  switch (section) {
    case "appointments":
    case "calendar":
      return role === "PetParent" ? <AppointmentAction requestedByPetParent /> : <AppointmentAction />;
    case "queue":
      return <WalkInAction />;
    case "patients":
      return <PetAction />;
    case "prescriptions":
      return role === "PetParent" ? null : <PrescriptionAction />;
    case "clinical-notes":
      return role === "PetParent" ? null : <ClinicalNoteAction />;
    case "lab-tests":
      return role === "LabTechnician" || role === "PetParent" ? null : <LabOrderAction />;
    case "billing":
      return role === "PetParent" ? null : <InvoiceAction />;
    case "staff":
      return <StaffAction />;
    case "tenants":
      return role === "SuperAdmin" ? <TenantActions /> : null;
    default:
      return null;
  }
}

function TenantActions() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <CreateTenantAction />
      <CreateTenantLocationAction />
    </div>
  );
}

function CreateTenantAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateTenantRequest = {
      name: textValue(formData, "name", "New PawIt Clinic"),
      legalName: textValue(formData, "legalName", ""),
      defaultCancellationCutoffHours: numberValue(formData, "defaultCancellationCutoffHours", 24),
      firstLocation: {
        name: textValue(formData, "locationName", "Main Clinic"),
        timezone: textValue(formData, "timezone", "America/Chicago"),
        phone: textValue(formData, "phone", ""),
        email: textValue(formData, "locationEmail", ""),
      },
      firstAdmin: {
        name: textValue(formData, "adminName", "Clinic Admin"),
        email: textValue(formData, "adminEmail", "admin@example.com"),
      },
    };

    await createTenant(request, idempotencyKey());
    return "Tenant bootstrapped.";
  });

  return (
    <ActionFrame icon={Building2} status={status} title="Bootstrap tenant">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Tenant name" name="name" required />
        <Field label="Legal name" name="legalName" />
        <Field defaultValue="24" label="Cancel cutoff hours" min="0" name="defaultCancellationCutoffHours" type="number" />
        <Field defaultValue="Main Clinic" label="First location" name="locationName" required />
        <Field defaultValue="America/Chicago" label="Timezone" name="timezone" required />
        <Field label="Location phone" name="phone" />
        <Field label="Location email" name="locationEmail" type="email" />
        <Field label="Admin name" name="adminName" required />
        <Field className="md:col-span-2" label="Admin email" name="adminEmail" required type="email" />
        <SubmitButton label="Bootstrap" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function CreateTenantLocationAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateClinicLocationRequest = {
      name: textValue(formData, "name", "New Location"),
      timezone: textValue(formData, "timezone", "America/Chicago"),
      phone: textValue(formData, "phone", ""),
      email: textValue(formData, "email", ""),
      cancellationCutoffHours: numberValue(formData, "cancellationCutoffHours", 24),
    };

    await createTenantLocation(textValue(formData, "tenantId", tenantDefault), request, idempotencyKey());
    return "Location added.";
  });

  return (
    <ActionFrame icon={Building2} status={status} title="Add tenant location">
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field defaultValue={tenantDefault} label="Tenant ID" name="tenantId" required />
        <Field label="Location name" name="name" required />
        <Field defaultValue="America/Chicago" label="Timezone" name="timezone" required />
        <Field defaultValue="24" label="Cancel cutoff hours" min="0" name="cancellationCutoffHours" type="number" />
        <Field label="Phone" name="phone" />
        <Field label="Email" name="email" type="email" />
        <SubmitButton label="Add location" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function AppointmentAction({ requestedByPetParent = false }: { requestedByPetParent?: boolean }) {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const startsAt = optionalDateTime(formData, "startsAt");
    const endsAt = optionalDateTime(formData, "endsAt");
    const request: CreateAppointmentRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      type: textValue(formData, "type", "in_clinic") as CreateAppointmentRequest["type"],
      reason: textValue(formData, "reason", "Routine consultation"),
      requestedByPetParent,
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    };

    await createAppointment(request, idempotencyKey());
    return requestedByPetParent ? "Appointment request submitted." : "Appointment created.";
  });

  return (
    <ActionFrame icon={CalendarPlus} status={status} title={requestedByPetParent ? "Request appointment" : "New appointment"}>
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" required />
        <SelectField
          label="Type"
          name="type"
          options={[
            ["in_clinic", "In clinic"],
            ["telemedicine", "Telemedicine"],
            ["follow_up", "Follow up"],
            ["vaccination", "Vaccination"],
          ]}
        />
        <Field label="Start" name="startsAt" type="datetime-local" />
        <Field className="md:col-span-3" defaultValue="Routine consultation" label="Reason" name="reason" required />
        <SubmitButton label="Create" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function WalkInAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: RegisterWalkInRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      priority: textValue(formData, "priority", "normal"),
      reason: textValue(formData, "reason", "Walk-in consultation"),
    };

    await registerWalkIn(request, idempotencyKey());
    return "Walk-in registered.";
  });

  return (
    <ActionFrame icon={Stethoscope} status={status} title="Register walk-in">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" required />
        <SelectField
          label="Priority"
          name="priority"
          options={[
            ["normal", "Normal"],
            ["urgent", "Urgent"],
            ["emergency", "Emergency"],
          ]}
        />
        <Field defaultValue="Walk-in consultation" label="Reason" name="reason" required />
        <SubmitButton label="Register" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function PetAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreatePetRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      name: textValue(formData, "name", "New patient"),
      species: textValue(formData, "species", "dog") as CreatePetRequest["species"],
      breed: textValue(formData, "breed", "Mixed"),
      sex: textValue(formData, "sex", "unknown"),
      estimatedAge: textValue(formData, "estimatedAge", "2 years"),
      guardianName: textValue(formData, "guardianName", "Pet Parent"),
      guardianEmail: textValue(formData, "guardianEmail", "guardian@example.com"),
      relationship: "owner",
      primaryGuardian: true,
    };

    await createPet(request, idempotencyKey());
    return "Pet record created.";
  });

  return (
    <ActionFrame icon={PawPrint} status={status} title="Register pet">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field label="Pet name" name="name" required />
        <SelectField
          label="Species"
          name="species"
          options={[
            ["dog", "Dog"],
            ["cat", "Cat"],
          ]}
        />
        <Field defaultValue="Mixed" label="Breed" name="breed" />
        <Field defaultValue="unknown" label="Sex" name="sex" />
        <Field defaultValue="2 years" label="Age" name="estimatedAge" />
        <Field label="Guardian" name="guardianName" required />
        <Field label="Guardian email" name="guardianEmail" type="email" />
        <SubmitButton label="Register" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function PrescriptionAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreatePrescriptionRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      instructions: textValue(formData, "instructions", "Administer as directed."),
      sharedWithPetParent: false,
      medications: [
        {
          medicationName: textValue(formData, "medicationName", "Medication"),
          strength: textValue(formData, "strength", "10 mg"),
          dosage: textValue(formData, "dosage", "1 tablet"),
          frequency: textValue(formData, "frequency", "Once daily"),
          duration: textValue(formData, "duration", "7 days"),
          instructions: textValue(formData, "instructions", "Administer as directed."),
        },
      ],
    };

    await createPrescription(request, idempotencyKey());
    return "Prescription draft created.";
  });

  return (
    <ActionFrame icon={FilePlus2} status={status} title="Draft prescription">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" required />
        <Field label="Medication" name="medicationName" required />
        <Field defaultValue="10 mg" label="Strength" name="strength" />
        <Field defaultValue="1 tablet" label="Dosage" name="dosage" />
        <Field defaultValue="Once daily" label="Frequency" name="frequency" />
        <Field defaultValue="7 days" label="Duration" name="duration" />
        <Field defaultValue="Administer as directed." label="Instructions" name="instructions" />
        <SubmitButton label="Draft" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function ClinicalNoteAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateClinicalNoteRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      reasonForVisit: textValue(formData, "reasonForVisit", "Follow-up consultation"),
      subjective: textValue(formData, "subjective", ""),
      objective: textValue(formData, "objective", ""),
      assessment: textValue(formData, "assessment", "Clinically stable"),
      plan: textValue(formData, "plan", "Continue monitoring and recheck as needed."),
      sharedWithPetParent: false,
    };

    await createClinicalNote(request, idempotencyKey());
    return "Clinical note draft created.";
  });

  return (
    <ActionFrame icon={FilePlus2} status={status} title="Draft clinical note">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" required />
        <Field className="md:col-span-2" defaultValue="Follow-up consultation" label="Reason" name="reasonForVisit" required />
        <Field className="md:col-span-2" label="Subjective" name="subjective" />
        <Field className="md:col-span-2" label="Objective" name="objective" />
        <Field defaultValue="Clinically stable" label="Assessment" name="assessment" />
        <Field defaultValue="Continue monitoring and recheck as needed." label="Plan" name="plan" />
        <SubmitButton label="Draft" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function LabOrderAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateLabOrderRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      testType: textValue(formData, "testType", "Complete blood count"),
      sampleType: textValue(formData, "sampleType", "Blood"),
      priority: textValue(formData, "priority", "normal"),
    };

    await createLabOrder(request, idempotencyKey());
    return "Lab order created.";
  });

  return (
    <ActionFrame icon={FlaskConical} status={status} title="Order lab test">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" required />
        <Field defaultValue="Complete blood count" label="Test" name="testType" required />
        <Field defaultValue="Blood" label="Sample" name="sampleType" />
        <SelectField
          label="Priority"
          name="priority"
          options={[
            ["normal", "Normal"],
            ["urgent", "Urgent"],
            ["stat", "STAT"],
          ]}
        />
        <SubmitButton label="Order" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function InvoiceAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateInvoiceRequest = {
      locationId: textValue(formData, "locationId", locationDefault),
      petId: textValue(formData, "petId", petDefault),
      status: textValue(formData, "status", "issued") as CreateInvoiceRequest["status"],
      taxCents: numberValue(formData, "taxCents", 0),
      discountCents: numberValue(formData, "discountCents", 0),
      lineItems: [
        {
          description: textValue(formData, "description", "Consultation"),
          quantity: numberValue(formData, "quantity", 1),
          unitAmountCents: numberValue(formData, "unitAmountCents", 7500),
        },
      ],
    };

    await createInvoice(request, idempotencyKey());
    return "Invoice created.";
  });

  return (
    <ActionFrame icon={Receipt} status={status} title="Create invoice">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field defaultValue={locationDefault} label="Location ID" name="locationId" required />
        <Field defaultValue={petDefault} label="Pet ID" name="petId" />
        <SelectField
          label="Status"
          name="status"
          options={[
            ["issued", "Issued"],
            ["draft", "Draft"],
          ]}
        />
        <Field defaultValue="Consultation" label="Line item" name="description" required />
        <Field defaultValue="1" label="Quantity" min="1" name="quantity" required type="number" />
        <Field defaultValue="7500" label="Unit cents" min="0" name="unitAmountCents" required type="number" />
        <Field defaultValue="0" label="Tax cents" min="0" name="taxCents" type="number" />
        <Field defaultValue="0" label="Discount cents" min="0" name="discountCents" type="number" />
        <SubmitButton label="Create" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function StaffAction() {
  const { handleSubmit, status } = useMutationForm(async (formData) => {
    const request: CreateStaffRequest = {
      name: textValue(formData, "name", "Team Member"),
      email: textValue(formData, "email", "team.member@example.com"),
      role: textValue(formData, "role", "Receptionist") as CreateStaffRequest["role"],
      defaultLocationId: textValue(formData, "defaultLocationId", locationDefault),
    };

    await createStaff(request, idempotencyKey());
    return "Staff invite created.";
  });

  return (
    <ActionFrame icon={UserPlus} status={status} title="Invite staff">
      <form className="grid gap-4 md:grid-cols-4" onSubmit={handleSubmit}>
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" required type="email" />
        <SelectField
          label="Role"
          name="role"
          options={[
            ["Receptionist", "Receptionist"],
            ["VetTechnician", "Vet technician"],
            ["LabTechnician", "Lab technician"],
            ["Veterinarian", "Veterinarian"],
            ["ClinicAdmin", "Clinic admin"],
          ]}
        />
        <Field defaultValue={locationDefault} label="Default location" name="defaultLocationId" />
        <SubmitButton label="Invite" loading={status.kind === "submitting"} />
      </form>
    </ActionFrame>
  );
}

function useMutationForm(action: (formData: FormData) => Promise<string>) {
  const router = useRouter();
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ kind: "submitting" });

    try {
      const message = await action(new FormData(form));
      form.reset();
      setStatus({ kind: "success", message });
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Request failed.",
      });
    }
  }

  return { handleSubmit, status };
}

function ActionFrame({ children, icon: Icon, status, title }: ActionFrameProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-brand">
            <Icon size={18} />
          </div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        </div>
        <StatusMessage status={status} />
      </div>
      {children}
    </section>
  );
}

function StatusMessage({ status }: { status: SubmitStatus }) {
  if (status.kind === "idle" || status.kind === "submitting") {
    return null;
  }

  const success = status.kind === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ring-1",
        success ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200",
      ].join(" ")}
    >
      <Icon size={16} />
      <span>{status.message}</span>
    </div>
  );
}

function Field({
  className = "",
  label,
  name,
  ...props
}: {
  className?: string;
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={["block min-w-0", className].join(" ")}>
      <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-blue-100"
        name={name}
        {...props}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
        name={name}
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ label, loading }: { label: string; loading: boolean }) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center gap-2 self-end rounded-lg bg-brand px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
      disabled={loading}
      type="submit"
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
      <span>{loading ? "Saving" : label}</span>
    </button>
  );
}

function textValue(formData: FormData, name: string, fallback: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(formData: FormData, name: string, fallback: number) {
  const value = Number(formData.get(name));
  return Number.isFinite(value) ? value : fallback;
}

function optionalDateTime(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pawit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
