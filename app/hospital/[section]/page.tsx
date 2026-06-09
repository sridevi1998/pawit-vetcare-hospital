import { AlertCircle, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { BillingDashboard } from "@/components/billing-dashboard";
import {
  AppointmentLifecycleActions,
  LabTestLifecycleActions,
  PatientLifecycleActions,
  PrescriptionLifecycleActions,
  QueueLifecycleActions,
} from "@/components/lifecycle-actions";
import { PortalShell } from "@/components/portal-shell";
import { WorkflowActions } from "@/components/workflow-actions";
import {
  getAnalytics,
  getAppointments,
  getAuditLogs,
  getBilling,
  getCalendar,
  getClinicalNotes,
  getDashboardSummary,
  getDoctors,
  getFeedback,
  getLabTests,
  getPets,
  getPrescriptions,
  getQueue,
  getStaff,
  type AuditLogEntry,
  type Analytics,
  type Appointment,
  type CalendarResponse,
  type ClinicalNote,
  type FeedbackResponse,
  type Invoice,
  type LabTest,
  type Metric,
  type Person,
  type PetRecord,
  type Prescription,
  type QueueEntry,
} from "@/lib/pawit-api";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ section: string }>;
};

type SectionKey =
  | "dashboard"
  | "appointments"
  | "calendar"
  | "queue"
  | "patients"
  | "prescriptions"
  | "clinical-notes"
  | "lab-tests"
  | "billing"
  | "analytics"
  | "feedback"
  | "doctors"
  | "staff"
  | "audit-logs";

type SectionConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

const sections: Record<SectionKey, SectionConfig> = {
  dashboard: {
    eyebrow: "Dashboard / Overview",
    title: "Hospital Dashboard",
    subtitle: "A live command center for clinic activity, care load, and revenue signals.",
  },
  appointments: {
    eyebrow: "Dashboard / Appointments",
    title: "Appointments",
    subtitle: "Scheduling, visit types, assigned veterinarians, and appointment status.",
  },
  calendar: {
    eyebrow: "Patient Management / Calendar",
    title: "Calendar",
    subtitle: "Daily appointment load and visit status mix.",
  },
  queue: {
    eyebrow: "Patient Management / Queue",
    title: "Patient Queue",
    subtitle: "Walk-ins, check-ins, and consultation flow.",
  },
  patients: {
    eyebrow: "Patient Management / Pet Records",
    title: "Pet Records",
    subtitle: "Dog and cat records, guardians, vaccines, plans, and documents.",
  },
  prescriptions: {
    eyebrow: "Clinical / Prescriptions",
    title: "Prescriptions",
    subtitle: "Draft and finalized veterinary prescriptions with sharing status.",
  },
  "clinical-notes": {
    eyebrow: "Clinical / Notes",
    title: "Clinical Notes",
    subtitle: "SOAP notes and consultation records shared across the care team.",
  },
  "lab-tests": {
    eyebrow: "Clinical / Lab & Diagnostics",
    title: "Lab & Diagnostics",
    subtitle: "Internal and external diagnostic orders with result sharing status.",
  },
  billing: {
    eyebrow: "Financial / Billing",
    title: "Billing",
    subtitle: "Invoices, totals, and payment workflow status.",
  },
  analytics: {
    eyebrow: "Reports / Analytics",
    title: "Analytics",
    subtitle: "Clinic operations, demographics, revenue, and diagnosis trends.",
  },
  feedback: {
    eyebrow: "Reports / Feedback",
    title: "Feedback",
    subtitle: "Pet parent ratings, comments, and satisfaction signals.",
  },
  doctors: {
    eyebrow: "Staff / Veterinarians",
    title: "Veterinarian Management",
    subtitle: "Veterinarian roster, specialties, and account status.",
  },
  staff: {
    eyebrow: "Staff / Team",
    title: "Staff Management",
    subtitle: "Clinic staff roster and operational roles.",
  },
  "audit-logs": {
    eyebrow: "Admin / Audit Logs",
    title: "Audit Logs",
    subtitle: "Recent tenant-scoped mutation history for authorized admins.",
  },
};

function isSection(value: string): value is SectionKey {
  return value in sections;
}

export default async function HospitalSectionPage({ params }: PageProps) {
  const { section } = await params;
  if (!isSection(section)) {
    notFound();
  }

  const config = sections[section];

  return (
    <PortalShell activePath={`/hospital/${section}`} eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle}>
      <WorkflowActions section={section} />
      {await sectionContent(section)}
    </PortalShell>
  );
}

async function sectionContent(section: SectionKey) {
  switch (section) {
    case "dashboard":
      return dataPanel(() => getDashboardData(), (data) => <DashboardView data={data} />);
    case "appointments":
      return dataPanel(() => getAppointments(), (data) => <AppointmentsView items={data.items} />);
    case "calendar":
      return dataPanel(() => getCalendar(), (data) => <CalendarView data={data} />);
    case "queue":
      return dataPanel(() => getQueue(), (data) => <QueueView items={data.items} />);
    case "patients":
      return dataPanel(() => getPets(), (data) => <PatientsView items={data.items} />);
    case "prescriptions":
      return dataPanel(() => getPrescriptions(), (data) => <PrescriptionsView items={data.items} />);
    case "clinical-notes":
      return dataPanel(() => getClinicalNotes(), (data) => <ClinicalNotesView items={data.items} />);
    case "lab-tests":
      return dataPanel(() => getLabTests(), (data) => <LabTestsView items={data.items} />);
    case "billing":
      return dataPanel(() => getBilling(), (data) => <BillingDashboard initialBilling={data} />, {
        fallback: <BillingDashboard initialBilling={null} initialError="Billing data is unavailable." />,
      });
    case "analytics":
      return dataPanel(() => getAnalytics(), (data) => <AnalyticsView data={data} />);
    case "feedback":
      return dataPanel(() => getFeedback(), (data) => <FeedbackView data={data} />);
    case "doctors":
      return dataPanel(() => getDoctors(), (data) => <PeopleView items={data.items} specialty />);
    case "staff":
      return dataPanel(() => getStaff(), (data) => <PeopleView items={data.items} />);
    case "audit-logs":
      return dataPanel(() => getAuditLogs(), (data) => <AuditLogsView items={data.items} />);
  }
}

async function getDashboardData() {
  const [summary, appointments, queue, billing, labs] = await Promise.all([
    getDashboardSummary(),
    getAppointments(),
    getQueue(),
    getBilling(),
    getLabTests(),
  ]);

  return {
    metrics: summary.metrics,
    appointments: appointments.items.slice(0, 5),
    queue: queue.items.slice(0, 5),
    invoices: billing.invoices.slice(0, 5),
    labs: labs.items.slice(0, 5),
  };
}

function DashboardView({
  data,
}: {
  data: {
    metrics: Metric[];
    appointments: Appointment[];
    queue: QueueEntry[];
    invoices: Invoice[];
    labs: LabTest[];
  };
}) {
  return (
    <>
      <MetricGrid items={data.metrics} />
      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          actionHref="/hospital/appointments"
          actionLabel="Appointments"
          empty="No appointments on the schedule"
          title="Today's Visits"
        >
          {data.appointments.map((appointment) => (
            <DashboardRow
              badge={labelize(appointment.status)}
              detail={`${appointment.time} / ${labelize(appointment.type)}`}
              href="/hospital/appointments"
              key={appointment.id}
              label={appointment.petName}
              sublabel={appointment.reason}
            />
          ))}
        </DashboardPanel>

        <DashboardPanel actionHref="/hospital/queue" actionLabel="Queue" empty="No pets waiting" title="Queue Watch">
          {data.queue.map((entry) => (
            <DashboardRow
              badge={`${entry.waitMins} min`}
              detail={`${labelize(entry.priority)} / ${labelize(entry.status)}`}
              href="/hospital/queue"
              key={entry.id}
              label={entry.petName}
              sublabel={entry.ownerName}
            />
          ))}
        </DashboardPanel>

        <DashboardPanel actionHref="/hospital/lab-tests" actionLabel="Labs" empty="No active lab orders" title="Lab Follow-Ups">
          {data.labs.map((lab) => (
            <DashboardRow
              badge={labelize(lab.status)}
              detail={lab.labCenter}
              href="/hospital/lab-tests"
              key={lab.id}
              label={lab.testType}
              sublabel={lab.petName}
            />
          ))}
        </DashboardPanel>

        <DashboardPanel actionHref="/hospital/billing" actionLabel="Billing" empty="No invoices found" title="Billing Attention">
          {data.invoices.map((invoice) => (
            <DashboardRow
              badge={labelize(invoice.status)}
              detail={invoice.dueDate}
              href="/hospital/billing"
              key={invoice.id}
              label={invoice.petName}
              sublabel={`${invoice.ownerName} / ${formatCurrency(invoice.amount)}`}
            />
          ))}
        </DashboardPanel>
      </div>
    </>
  );
}

function DashboardPanel({
  actionHref,
  actionLabel,
  children,
  empty,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  children: ReactNode;
  empty: string;
  title: string;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-blue-700" href={actionHref}>
          <span>{actionLabel}</span>
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {hasRows ? (
          children
        ) : (
          <div className="grid min-h-36 place-items-center px-5 py-8 text-center text-sm font-semibold text-slate-500">
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardRow({
  badge,
  detail,
  href,
  label,
  sublabel,
}: {
  badge: string;
  detail: string;
  href: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Link className="grid gap-3 px-5 py-4 transition hover:bg-blue-50/60 sm:grid-cols-[1fr_auto] sm:items-center" href={href}>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{label}</p>
        <p className="mt-1 truncate text-sm text-slate-500">{sublabel}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">{badge}</span>
        <p className="mt-0 text-xs font-medium text-slate-500 sm:mt-2">{detail}</p>
      </div>
    </Link>
  );
}

async function dataPanel<T>(
  loader: () => Promise<T>,
  render: (data: T) => ReactNode,
  options: { fallback?: ReactNode } = {},
) {
  try {
    return render(await loader());
  } catch {
    return (
      options.fallback ?? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <AlertCircle size={18} />
            <span>Data is unavailable.</span>
          </div>
        </section>
      )
    );
  }
}

function AppointmentsView({ items }: { items: Appointment[] }) {
  return (
    <Table
      empty="No appointments found"
      headers={["Pet", "Guardian", "Veterinarian", "Type", "Status", "Time", "Actions"]}
      rows={items.map((item) => [
        <Primary key="pet" label={item.petName} sublabel={item.reason} />,
        item.ownerName,
        <Primary key="vet" label={item.primaryVeterinarian || "Unassigned"} sublabel={item.additionalVeterinarians.join(", ")} />,
        labelize(item.type),
        <Status key="status" value={item.status} />,
        item.time,
        <AppointmentLifecycleActions appointment={item} key="actions" />,
      ])}
    />
  );
}

function CalendarView({ data }: { data: CalendarResponse }) {
  return (
    <>
      <MetricGrid items={Object.entries(data.statusCounts).map(([label, value]) => ({ label: labelize(label), value: String(value) }))} />
      <AppointmentsView items={data.items} />
    </>
  );
}

function QueueView({ items }: { items: QueueEntry[] }) {
  return (
    <Table
      empty="No queue entries"
      headers={["Pet", "Guardian", "Species", "Priority", "Status", "Wait", "Actions"]}
      rows={items.map((item) => [
        item.petName,
        item.ownerName,
        labelize(item.species),
        labelize(item.priority),
        <Status key="status" value={item.status} />,
        `${item.waitMins} min`,
        <QueueLifecycleActions entry={item} key="actions" />,
      ])}
    />
  );
}

function PatientsView({ items }: { items: PetRecord[] }) {
  return (
    <Table
      empty="No pet records"
      headers={["Pet", "Guardian", "Species", "Breed", "Care", "Documents", "Actions"]}
      rows={items.map((item) => [
        <Primary key="pet" label={item.petName} sublabel={`${item.age} ${item.sex}`.trim()} />,
        <Primary key="guardian" label={item.ownerName} sublabel={item.phone} />,
        labelize(item.species),
        item.breed,
        `${item.vaccinesDue} vaccines due, ${item.openPlans} plans`,
        `${item.documentsCount} files`,
        <PatientLifecycleActions key="actions" pet={item} />,
      ])}
    />
  );
}

function ClinicalNotesView({ items }: { items: ClinicalNote[] }) {
  return (
    <Table
      empty="No clinical notes"
      headers={["Pet", "Guardian", "Subject", "Status", "Shared", "Updated"]}
      rows={items.map((item) => [
        item.petName,
        item.ownerName,
        item.subject,
        <Status key="status" value={item.status} />,
        item.sharedWithPetParent ? "Yes" : "No",
        formatDate(item.updatedAt),
      ])}
    />
  );
}

function PrescriptionsView({ items }: { items: Prescription[] }) {
  return (
    <Table
      empty="No prescriptions"
      headers={["Pet", "Guardian", "Status", "Medications", "Shared", "Updated", "Actions"]}
      rows={items.map((item) => [
        item.petName,
        item.ownerName,
        <Status key="status" value={item.status} />,
        item.medicationNames.join(", "),
        item.sharedWithPetParent ? "Yes" : "No",
        formatDate(item.updatedAt),
        <PrescriptionLifecycleActions key="actions" prescriptionID={item.id} status={item.status} />,
      ])}
    />
  );
}

function LabTestsView({ items }: { items: LabTest[] }) {
  return (
    <Table
      empty="No lab tests"
      headers={["Pet", "Guardian", "Test", "Lab", "Status", "Shared", "Actions"]}
      rows={items.map((item) => [
        item.petName,
        item.ownerName,
        item.testType,
        <Primary key="lab" label={item.labCenter} sublabel={labelize(item.labType)} />,
        <Status key="status" value={item.status} />,
        item.sharedWithPetParent ? "Yes" : "No",
        <LabTestLifecycleActions key="actions" labTest={item} />,
      ])}
    />
  );
}

function AnalyticsView({ data }: { data: Analytics }) {
  return (
    <>
      <MetricGrid items={data.metrics} />
      <div className="grid gap-5 xl:grid-cols-3">
        <KeyValuePanel title="Species Distribution" values={data.speciesDistribution} />
        <KeyValuePanel title="Appointment Status" values={data.appointmentStatus} />
        <KeyValuePanel title="Revenue Trend" values={data.revenueTrend} />
      </div>
      <MetricGrid items={data.commonDiagnoses} title="Common Diagnoses" />
    </>
  );
}

function FeedbackView({ data }: { data: FeedbackResponse }) {
  return (
    <>
      <MetricGrid items={data.metrics} />
      <KeyValuePanel title="Rating Distribution" values={data.distribution} />
      <Table
        empty="No feedback yet"
        headers={["Pet", "Guardian", "Rating", "Comment", "Created"]}
        rows={data.items.map((item) => [item.petName, item.ownerName, `${item.rating}/5`, item.comment, item.createdAt])}
      />
    </>
  );
}

function AuditLogsView({ items }: { items: AuditLogEntry[] }) {
  return (
    <Table
      empty="No audit log entries"
      headers={["Action", "Resource", "Actor", "Role", "Reason", "Created"]}
      rows={items.map((item) => [
        labelize(item.action),
        <Primary key="resource" label={labelize(item.resourceType)} sublabel={item.resourceId} />,
        item.actorUserId ?? "",
        item.actorRole ?? "",
        item.reason ?? "",
        formatDate(item.createdAt),
      ])}
    />
  );
}

function PeopleView({ items, specialty = false }: { items: Person[]; specialty?: boolean }) {
  return (
    <Table
      empty="No team members"
      headers={specialty ? ["Name", "Role", "Specialty", "Email", "Status"] : ["Name", "Role", "Email", "Status"]}
      rows={items.map((item) =>
        specialty
          ? [item.name, item.role, item.specialty ?? "", item.email, <Status key="status" value={item.status} />]
          : [item.name, item.role, item.email, <Status key="status" value={item.status} />],
      )}
    />
  );
}

function MetricGrid({ items, title }: { items: { label: string; value: string; delta?: string }[]; title?: string }) {
  return (
    <section>
      {title ? <h3 className="mb-3 text-lg font-bold">{title}</h3> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
            {item.delta ? <p className="mt-1 text-xs font-medium text-slate-500">{item.delta}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function KeyValuePanel({ title, values }: { title: string; values: Record<string, number | string> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-4 space-y-3">
        {Object.entries(values).map(([key, value]) => (
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0" key={key}>
            <span className="text-sm font-medium text-slate-500">{labelize(key)}</span>
            <span className="font-bold text-slate-950">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Table({ empty, headers, rows }: { empty: string; headers: string[]; rows: ReactNode[][] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              {headers.map((header) => (
                <th className="px-4 py-3" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr className="align-top" key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td className="px-4 py-4 text-slate-700" key={cellIndex}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-slate-500" colSpan={headers.length}>
                  <FileText className="mx-auto mb-3 text-slate-400" size={38} />
                  <span className="font-semibold">{empty}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Primary({ label, sublabel }: { label: string; sublabel?: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{label}</p>
      {sublabel ? <p className="mt-0.5 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  );
}

function Status({ value }: { value: string }) {
  return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">{labelize(value)}</span>;
}

function labelize(value: string) {
  return value.replace(/[_.]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(cents / 100);
}
