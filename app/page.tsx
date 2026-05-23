import { CalendarDays, ClipboardList, FlaskConical, PawPrint, Users } from "lucide-react";

const modules = [
  { label: "Appointments", value: "5", icon: CalendarDays },
  { label: "Pet Records", value: "19", icon: PawPrint },
  { label: "Queue", value: "1", icon: Users },
  { label: "Lab Tests", value: "0", icon: FlaskConical },
];

export default function Page() {
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
        <nav className="mt-10 space-y-2 text-sm font-semibold text-slate-600">
          {["Appointments", "Calendar", "Patient Queue", "Pet Records", "Prescriptions", "Clinical Notes", "Lab & Diagnostics", "Billing", "Analytics", "Feedback", "Staff Management", "Veterinarian Management"].map((item) => (
            <a className="block rounded-lg px-4 py-3 hover:bg-blue-50 hover:text-brand" href="#" key={item}>{item}</a>
          ))}
        </nav>
      </aside>
      <section className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-8 py-6">
          <p className="text-sm font-medium text-slate-500">Dashboard / Appointments</p>
          <h2 className="mt-1 text-3xl font-bold">Appointments</h2>
          <p className="text-slate-500">Welcome back, PawIt team</p>
        </header>
        <div className="space-y-8 p-8">
          <div className="grid gap-5 md:grid-cols-4">
            {modules.map(({ label, value, icon: Icon }) => (
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" key={label}>
                <Icon className="text-brand" />
                <p className="mt-4 text-sm text-slate-500">{label}</p>
                <p className="text-4xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">All Appointments</h3>
                <p className="text-slate-500">Veterinary scheduling, check-in, and queue flow.</p>
              </div>
              <button className="rounded-lg bg-brand px-5 py-3 font-semibold text-white">Add Appointment</button>
            </div>
            <div className="mt-8 grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 text-center">
              <div>
                <ClipboardList className="mx-auto text-slate-400" size={56} />
                <p className="mt-4 text-lg font-semibold">No appointments found</p>
                <p className="text-slate-500">Connect the Go API to populate live clinic data.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
