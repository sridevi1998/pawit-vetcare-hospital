import {
  BarChart3,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Clipboard,
  Clock,
  DollarSign,
  FileText,
  FlaskConical,
  MessageSquare,
  PawPrint,
  ShieldCheck,
  Star,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

type NavItem = {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/hospital/dashboard", icon: LayoutDashboard },
  { label: "Appointments", path: "/hospital/appointments", icon: CalendarDays },
  { label: "Calendar", path: "/hospital/calendar", icon: Calendar },
  { label: "Patient Queue", path: "/hospital/queue", icon: Users },
  { label: "Pet Records", path: "/hospital/patients", icon: FileText },
  { label: "Prescriptions", path: "/hospital/prescriptions", icon: Clipboard },
  { label: "Clinical Notes", path: "/hospital/clinical-notes", icon: MessageSquare },
  { label: "Lab & Diagnostics", path: "/hospital/lab-tests", icon: FlaskConical },
  { label: "Billing", path: "/hospital/billing", icon: DollarSign },
  { label: "Analytics", path: "/hospital/analytics", icon: BarChart3 },
  { label: "Feedback", path: "/hospital/feedback", icon: Star },
  { label: "Staff Management", path: "/hospital/staff", icon: UserCog },
  { label: "Veterinarian Management", path: "/hospital/doctors", icon: Clock },
  { label: "Audit Logs", path: "/hospital/audit-logs", icon: ShieldCheck },
];

type PortalShellProps = {
  activePath: string;
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function PortalShell({ activePath, children, eyebrow, title, subtitle }: PortalShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-brand text-white">
            <PawPrint size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold">PawIt VetCare</h1>
            <p className="text-sm text-slate-500">Hospital Portal</p>
          </div>
        </div>
        <nav className="mt-10 space-y-1 text-sm font-semibold text-slate-600">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path === activePath;
            return (
              <Link
                className={[
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 transition",
                  active ? "bg-blue-50 text-brand" : "hover:bg-blue-50 hover:text-brand",
                ].join(" ")}
                href={item.path}
                key={item.path}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <section className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-3xl font-bold">{title}</h2>
          <p className="mt-1 text-slate-500">{subtitle}</p>
        </header>
        <div className="space-y-6 p-6 sm:p-8">{children}</div>
      </section>
    </main>
  );
}
