import { AlertCircle, ArrowRight, CalendarCheck, FileText, HeartPulse, ReceiptText, ShieldCheck, UsersRound } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BillingDashboard } from "@/components/billing-dashboard";
import {
  AppointmentLifecycleActions,
  ClinicalNoteLifecycleActions,
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
  getCurrentUser,
  getDashboardSummary,
  getDoctors,
  getFeedback,
  getLabTests,
  getPets,
  getPrescriptions,
  getQueue,
  getStaff,
  getTenants,
  setServerAuthToken,
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
  type Tenant,
} from "@/lib/pawit-api";
import { canAccessSection, canUseSectionActions, type SectionKey } from "@/lib/role-access";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ section: string }>;
};

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
  tenants: {
    eyebrow: "Admin / Tenants",
    title: "Tenant Management",
    subtitle: "Platform tenant directory, clinic locations, and rollout status.",
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
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("pawit_access")?.value ?? "";
  if (!authCookie) {
    redirect("/login");
  }
  setServerAuthToken(authCookie);

  const { section } = await params;
  if (!isSection(section)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const role = currentUser.user.role;
  const config = sections[section];
  if (!canAccessSection(role, section)) {
    return (
      <PortalShell activePath="" eyebrow="Access Control" title="Access Restricted" subtitle="This workspace is not available for your role." userRole={role}>
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold">Role access required</h3>
              <p className="mt-2 text-sm leading-6">
                Your signed-in role is <span className="font-bold">{role}</span>. Choose an available section from the sidebar or sign in with a different assigned role.
              </p>
            </div>
          </div>
        </section>
      </PortalShell>
    );
  }

  return (
    <PortalShell activePath={`/hospital/${section}`} eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} userRole={role}>
      {canUseSectionActions(role, section) ? <WorkflowActions role={role} section={section} /> : null}
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
    case "tenants":
      return dataPanel(() => getTenants(), (data) => <TenantsView items={data.items} />);
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
  const waitingCount = data.queue.filter((entry) => entry.status !== "completed" && entry.status !== "cancelled").length;
  const labFollowUps = data.labs.filter((lab) => lab.status !== "completed" && lab.status !== "cancelled").length;
  const openInvoiceTotal = data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <>
      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div>
          <p className="text-sm font-bold uppercase text-brand">Today at PawIt</p>
          <h3 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-slate-950">
            Keep the care team aligned from check-in through checkout.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This workspace pulls scheduling, queue pressure, clinical follow-ups, diagnostics, and billing into one
            signed-in view with role-based actions.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <HeroSignal icon={<CalendarCheck size={18} />} label="Visits" value={String(data.appointments.length)} />
            <HeroSignal icon={<UsersRound size={18} />} label="Waiting" value={String(waitingCount)} />
            <HeroSignal icon={<ReceiptText size={18} />} label="Open AR" value={formatCurrency(openInvoiceTotal)} />
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-white text-brand shadow-sm">
              <HeartPulse size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">Care Load</p>
              <p className="text-xs font-medium text-slate-500">Operational priority</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <PriorityLine label="Queue flow" value={`${waitingCount} active`} />
            <PriorityLine label="Lab follow-ups" value={`${labFollowUps} pending`} />
            <PriorityLine label="Billing review" value={`${data.invoices.length} invoices`} />
          </div>
        </div>
      </section>
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

function HeroSignal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className="text-brand">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PriorityLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-blue-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand ring-1 ring-blue-100">{value}</span>
    </div>
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
      headers={["Pet", "Guardian", "Subject", "Status", "Shared", "Updated", "Actions"]}
      rows={items.map((item) => [
        item.petName,
        item.ownerName,
        item.subject,
        <Status key="status" value={item.status} />,
        item.sharedWithPetParent ? "Yes" : "No",
        formatDate(item.updatedAt),
        <ClinicalNoteLifecycleActions key="actions" note={item} />,
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
  const mutationCount = items.length;
  const actorCount = new Set(items.map((item) => item.actorUserId).filter(Boolean)).size;
  const archivedCount = items.filter((item) => item.action.includes("archive") || item.action.includes("void") || item.action.includes("cancel")).length;
  const latest = items[0]?.createdAt ?? "";

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-brand ring-1 ring-blue-100">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-950">Tenant Activity Review</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Trace administrative and clinical mutations by actor, role, resource, and stated reason before records
                leave the operational window.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
          <p className="text-sm font-bold uppercase">Retention Guardrail</p>
          <p className="mt-2 text-sm leading-6">
            Archived, voided, and cancelled records stay visible here for admin review instead of disappearing from
            tenant history.
          </p>
        </div>
      </section>

      <MetricGrid
        items={[
          { label: "Recent Events", value: String(mutationCount), delta: "Tenant-scoped mutation history" },
          { label: "Actors", value: String(actorCount), delta: "Users represented in this window" },
          { label: "Sensitive Actions", value: String(archivedCount), delta: "Archive, void, or cancellation activity" },
          { label: "Latest Event", value: latest ? formatDate(latest) : "None", delta: latest ? formatTime(latest) : "No audit activity" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => <AuditLogCard item={item} key={item.id} />)
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm xl:col-span-2">
            <FileText className="mx-auto mb-3 text-slate-400" size={38} />
            <p className="font-semibold">No audit log entries</p>
          </div>
        )}
      </section>
    </>
  );
}

function TenantsView({ items }: { items: Tenant[] }) {
  const locationCount = items.reduce((count, tenant) => count + tenant.locations.length, 0);
  const activeCount = items.filter((tenant) => tenant.status === "active").length;
  const averageCutoff =
    items.length === 0
      ? 0
      : Math.round(
          items.reduce((total, tenant) => total + (tenant.defaultCancellationCutoffHours ?? 0), 0) / items.length,
        );

  return (
    <>
      <MetricGrid
        items={[
          { label: "Tenants", value: String(items.length), delta: "Platform clinic accounts" },
          { label: "Active Tenants", value: String(activeCount), delta: "Available for clinic operations" },
          { label: "Locations", value: String(locationCount), delta: "Configured hospital sites" },
          { label: "Avg. Cutoff", value: `${averageCutoff}h`, delta: "Cancellation policy baseline" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        {items.length > 0 ? (
          items.map((tenant) => <TenantCard key={tenant.id} tenant={tenant} />)
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm xl:col-span-2">
            <FileText className="mx-auto mb-3 text-slate-400" size={38} />
            <p className="font-semibold">No tenants found</p>
          </div>
        )}
      </section>

      <Table
        empty="No clinic locations"
        headers={["Tenant", "Location", "Timezone", "Contact", "Status"]}
        rows={items.flatMap((tenant) =>
          tenant.locations.map((location) => [
            <Primary key="tenant" label={tenant.name} sublabel={tenant.id} />,
            location.name,
            location.timezone,
            <Primary key="contact" label={location.phone || "No phone"} sublabel={location.email} />,
            <Status key="status" value={location.status} />,
          ]),
        )}
      />
    </>
  );
}

function TenantCard({ tenant }: { tenant: Tenant }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-brand">{tenant.id}</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{tenant.name}</h3>
          {tenant.legalName ? <p className="mt-1 text-sm text-slate-500">{tenant.legalName}</p> : null}
        </div>
        <Status value={tenant.status} />
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <AuditFact label="Locations" value={String(tenant.locations.length)} />
        <AuditFact label="Cancellation Cutoff" value={`${tenant.defaultCancellationCutoffHours ?? 0}h`} />
        <AuditFact label="Created" value={formatDate(tenant.createdAt)} />
      </dl>
    </article>
  );
}

function AuditLogCard({ item }: { item: AuditLogEntry }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-brand">{labelize(item.action)}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{labelize(item.resourceType)}</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">{item.resourceId}</p>
        </div>
        <Status value={item.actorRole ?? "unknown"} />
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <AuditFact label="Actor" value={item.actorUserId ?? "Unknown"} />
        <AuditFact label="Created" value={`${formatDate(item.createdAt)} ${formatTime(item.createdAt)}`} />
        <AuditFact className="sm:col-span-2" label="Reason" value={item.reason || "No reason recorded"} />
      </dl>
    </article>
  );
}

function AuditFact({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={["rounded-lg bg-slate-50 p-3", className].filter(Boolean).join(" ")}>
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd>
    </div>
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

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(cents / 100);
}
