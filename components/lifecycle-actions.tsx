"use client";

import AlertCircle from "lucide-react/dist/esm/icons/circle-alert";
import CheckCircle2 from "lucide-react/dist/esm/icons/circle-check-big";
import FileUp from "lucide-react/dist/esm/icons/file-up";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Play from "lucide-react/dist/esm/icons/play";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";
import StopCircle from "lucide-react/dist/esm/icons/stop-circle";
import Upload from "lucide-react/dist/esm/icons/upload";
import XCircle from "lucide-react/dist/esm/icons/x-circle";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import {
  archivePet,
  callQueueEntry,
  cancelAppointment,
  cancelQueueEntry,
  completeQueueEntry,
  finalizeClinicalNote,
  finalizePrescription,
  startQueueEntry,
  updateLabOrderStatus,
  uploadLabResult,
  uploadPetDocument,
  voidInvoice,
  type Appointment,
  type ClinicalNote,
  type LabTest,
  type PetRecord,
  type QueueEntry,
} from "@/lib/pawit-api";

type StatusState = {
  kind: "idle" | "submitting" | "success" | "error";
  message?: string;
};

type MutationAction = () => Promise<void>;

export function AppointmentLifecycleActions({ appointment }: { appointment: Appointment }) {
  const { run, status } = useMutation();
  const closed = ["completed", "cancelled", "no_show", "rejected"].includes(appointment.status);

  if (closed) {
    return <MutedText>Closed</MutedText>;
  }

  return (
    <ReasonAction
      buttonLabel="Cancel"
      defaultReason="Cancelled from hospital portal"
      icon={<XCircle size={14} />}
      onSubmit={(reason) =>
        run(() =>
          cancelAppointment(appointment.id, { reason, staffOverride: true }, idempotencyKey()).then(() => undefined),
        )
      }
      status={status}
    />
  );
}

export function QueueLifecycleActions({ entry }: { entry: QueueEntry }) {
  const { run, status } = useMutation();
  const actions = queueActions(entry.status);

  if (actions.length === 0) {
    return <MutedText>Closed</MutedText>;
  }

  return (
    <ActionStack status={status}>
      {actions.map((action) => (
        <TinyButton
          icon={action.icon}
          key={action.label}
          label={action.label}
          loading={status.kind === "submitting"}
          onClick={() => run(() => action.mutate(entry.id))}
        />
      ))}
    </ActionStack>
  );
}

export function PatientLifecycleActions({ pet }: { pet: PetRecord }) {
  const archiveMutation = useMutation();
  const documentMutation = useMutation();

  function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = textValue(formData, "title", `${pet.petName} record`);
    const documentType = textValue(formData, "documentType", "clinical_record");
    const objectPath = textValue(formData, "objectPath", `tenant_demo_clinic/pets/${pet.id}/${slugify(title)}.pdf`);
    const contentType = textValue(formData, "contentType", "application/pdf");
    const sizeBytes = numberValue(formData, "sizeBytes", 1);

    documentMutation.run(() =>
      uploadPetDocument(
        pet.id,
        {
          contentType,
          documentType,
          objectPath,
          sizeBytes,
          title,
        },
        idempotencyKey(),
      ).then(() => {
        form.reset();
      }),
    );
  }

  return (
    <div className="flex min-w-[18rem] flex-col gap-3">
      <form className="grid gap-2" onSubmit={handleDocumentSubmit}>
        <div className="grid gap-2 sm:grid-cols-2">
          <TinyInput defaultValue="Clinical record" label="Title" name="title" required />
          <TinyInput defaultValue="clinical_record" label="Type" name="documentType" required />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_5.5rem]">
          <TinyInput label="Object path" name="objectPath" placeholder={`tenant_demo_clinic/pets/${pet.id}/record.pdf`} />
          <TinyInput defaultValue="1" label="Bytes" min="1" name="sizeBytes" type="number" />
        </div>
        <input name="contentType" type="hidden" value="application/pdf" />
        <ActionStack status={documentMutation.status}>
          <TinyButton icon={<FileUp size={14} />} label="Document" loading={documentMutation.status.kind === "submitting"} submit />
        </ActionStack>
      </form>
      <ReasonAction
        buttonLabel="Archive"
        defaultReason="Archived from hospital portal"
        icon={<XCircle size={14} />}
        onSubmit={(reason) =>
          archiveMutation.run(() => archivePet(pet.id, { reason }, idempotencyKey()).then(() => undefined))
        }
        status={archiveMutation.status}
      />
    </div>
  );
}

export function PrescriptionLifecycleActions({ prescriptionID, status }: { prescriptionID: string; status: string }) {
  const mutation = useMutation();

  if (status !== "draft") {
    return <MutedText>Finalized</MutedText>;
  }

  return (
    <ActionStack status={mutation.status}>
      <TinyButton
        icon={<CheckCircle2 size={14} />}
        label="Finalize"
        loading={mutation.status.kind === "submitting"}
        onClick={() =>
          mutation.run(() =>
            finalizePrescription(prescriptionID, { shareWithPetParent: true }, idempotencyKey()).then(() => undefined),
          )
        }
      />
    </ActionStack>
  );
}

export function ClinicalNoteLifecycleActions({ note }: { note: ClinicalNote }) {
  const mutation = useMutation();

  if (note.status !== "draft") {
    return <MutedText>Finalized</MutedText>;
  }

  return (
    <ActionStack status={mutation.status}>
      <TinyButton
        icon={<CheckCircle2 size={14} />}
        label="Finalize"
        loading={mutation.status.kind === "submitting"}
        onClick={() =>
          mutation.run(() =>
            finalizeClinicalNote(note.id, { shareWithPetParent: true }, idempotencyKey()).then(() => undefined),
          )
        }
      />
    </ActionStack>
  );
}

export function LabTestLifecycleActions({ labTest }: { labTest: LabTest }) {
  const { run, status } = useMutation();
  const actions = labActions(labTest);

  if (actions.length === 0) {
    return <MutedText>Closed</MutedText>;
  }

  return (
    <ActionStack status={status}>
      {actions.map((action) => (
        <TinyButton
          icon={action.icon}
          key={action.label}
          label={action.label}
          loading={status.kind === "submitting"}
          onClick={() => run(() => action.mutate(labTest.id))}
        />
      ))}
    </ActionStack>
  );
}

export function InvoiceLifecycleActions({ invoiceID, status }: { invoiceID: string; status: string }) {
  const closed = ["void", "refunded", "paid"].includes(status);
  const mutation = useMutation();

  if (closed) {
    return <MutedText>Closed</MutedText>;
  }

  return (
    <ReasonAction
      buttonLabel="Void"
      defaultReason="Voided from hospital portal"
      icon={<StopCircle size={14} />}
      onSubmit={(reason) => mutation.run(() => voidInvoice(invoiceID, { reason }, idempotencyKey()).then(() => undefined))}
      status={mutation.status}
    />
  );
}

function queueActions(status: QueueEntry["status"]) {
  const reason = "Updated from hospital portal";
  const actions = {
    call: {
      icon: <RotateCw size={14} />,
      label: "Call",
      mutate: (id: string) => callQueueEntry(id, { reason }, idempotencyKey()).then(() => undefined),
    },
    start: {
      icon: <Play size={14} />,
      label: "Start",
      mutate: (id: string) => startQueueEntry(id, { reason }, idempotencyKey()).then(() => undefined),
    },
    complete: {
      icon: <CheckCircle2 size={14} />,
      label: "Complete",
      mutate: (id: string) => completeQueueEntry(id, { reason }, idempotencyKey()).then(() => undefined),
    },
    cancel: {
      icon: <XCircle size={14} />,
      label: "Cancel",
      mutate: (id: string) => cancelQueueEntry(id, { reason: "Cancelled from hospital portal" }, idempotencyKey()).then(() => undefined),
    },
  };

  switch (status) {
    case "waiting":
      return [actions.call, actions.start, actions.cancel];
    case "called":
      return [actions.start, actions.complete, actions.cancel];
    case "in_progress":
      return [actions.complete, actions.cancel];
    default:
      return [];
  }
}

function labActions(labTest: LabTest) {
  const reason = "Updated from hospital portal";
  const actions = {
    sample: {
      icon: <RotateCw size={14} />,
      label: "Sample",
      mutate: (id: string) =>
        updateLabOrderStatus(id, { status: "sample_collected", reason }, idempotencyKey()).then(() => undefined),
    },
    start: {
      icon: <Play size={14} />,
      label: "Start",
      mutate: (id: string) => updateLabOrderStatus(id, { status: "in_progress", reason }, idempotencyKey()).then(() => undefined),
    },
    complete: {
      icon: <CheckCircle2 size={14} />,
      label: "Complete",
      mutate: (id: string) => updateLabOrderStatus(id, { status: "completed", reason }, idempotencyKey()).then(() => undefined),
    },
    cancel: {
      icon: <XCircle size={14} />,
      label: "Cancel",
      mutate: (id: string) =>
        updateLabOrderStatus(id, { status: "cancelled", reason: "Cancelled from hospital portal" }, idempotencyKey()).then(
          () => undefined,
        ),
    },
    result: {
      icon: <Upload size={14} />,
      label: "Result",
      mutate: (id: string) =>
        uploadLabResult(
          id,
          {
            markOrderCompleted: true,
            reportObjectPath: `tenant_demo_clinic/lab-results/${id}.pdf`,
            resultNotes: `${labTest.testType} result uploaded from hospital portal.`,
            shareWithPetParent: true,
          },
          idempotencyKey(),
        ).then(() => undefined),
    },
  };

  switch (labTest.status) {
    case "ordered":
      return [actions.sample, actions.start, actions.cancel];
    case "sample_collected":
    case "sent_out":
      return [actions.start, actions.complete, actions.result, actions.cancel];
    case "in_progress":
      return [actions.complete, actions.result, actions.cancel];
    default:
      return [];
  }
}

function ReasonAction({
  buttonLabel,
  defaultReason,
  icon,
  onSubmit,
  status,
}: {
  buttonLabel: string;
  defaultReason: string;
  icon: ReactNode;
  onSubmit: (reason: string) => void;
  status: StatusState;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") || defaultReason).trim() || defaultReason;
    onSubmit(reason);
  }

  return (
    <form className="flex min-w-52 flex-col gap-2" onSubmit={handleSubmit}>
      <input
        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
        defaultValue={defaultReason}
        name="reason"
      />
      <ActionStack status={status}>
        <TinyButton icon={icon} label={buttonLabel} loading={status.kind === "submitting"} submit />
      </ActionStack>
    </form>
  );
}

function ActionStack({ children, status }: { children: ReactNode; status: StatusState }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {children}
      <InlineStatus status={status} />
    </div>
  );
}

function TinyButton({
  icon,
  label,
  loading,
  onClick,
  submit = false,
}: {
  icon: ReactNode;
  label: string;
  loading: boolean;
  onClick?: () => void;
  submit?: boolean;
}) {
  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
      onClick={onClick}
      type={submit ? "submit" : "button"}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
      <span>{loading ? "Saving" : label}</span>
    </button>
  );
}

function TinyInput({
  label,
  name,
  ...props
}: {
  label: string;
  name: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.65rem] font-bold uppercase text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-blue-100"
        name={name}
        {...props}
      />
    </label>
  );
}

function InlineStatus({ status }: { status: StatusState }) {
  if (status.kind === "idle" || status.kind === "submitting") {
    return null;
  }

  const success = status.kind === "success";
  const Icon = success ? CheckCircle2 : AlertCircle;

  return (
    <span className={success ? "inline-flex text-emerald-600" : "inline-flex text-rose-600"} title={status.message}>
      <Icon size={16} />
    </span>
  );
}

function MutedText({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold text-slate-400">{children}</span>;
}

function useMutation() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusState>({ kind: "idle" });

  async function run(action: MutationAction) {
    setStatus({ kind: "submitting" });

    try {
      await action();
      setStatus({ kind: "success", message: "Saved" });
      router.refresh();
    } catch {
      setStatus({ kind: "error", message: "Request failed" });
    }
  }

  return { run, status };
}

function idempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `pawit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textValue(formData: FormData, name: string, fallback: string) {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(formData: FormData, name: string, fallback: number) {
  const value = Number(formData.get(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "record";
}
