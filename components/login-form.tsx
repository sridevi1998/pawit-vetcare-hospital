"use client";

import { AlertCircle, Loader2, LogIn, PawPrint } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { login } from "@/lib/pawit-api";

const roles = [
  { label: "Clinic Admin", value: "ClinicAdmin" },
  { label: "Veterinarian", value: "Veterinarian" },
  { label: "Receptionist", value: "Receptionist" },
  { label: "Vet Technician", value: "VetTechnician" },
  { label: "Lab Technician", value: "LabTechnician" },
  { label: "Pet Parent", value: "PetParent" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pawit.example");
  const [password, setPassword] = useState("pawit-demo");
  const [hospitalId, setHospitalId] = useState("HOSP-001");
  const [role, setRole] = useState("ClinicAdmin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password, hospitalId, role });
      router.replace("/hospital/dashboard");
      router.refresh();
    } catch {
      setError("Email, password, tenant, or role is invalid.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.6fr)]">
      <section className="hidden border-r border-slate-200 bg-white px-10 py-12 lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-lg bg-brand text-white">
            <PawPrint size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold">PawIt VetCare</h1>
            <p className="text-sm text-slate-500">Hospital Portal</p>
          </div>
        </div>
        <div className="mt-auto max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Role based access</p>
          <h2 className="mt-4 text-5xl font-bold leading-tight">Sign in to the clinic workspace.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Staff, clinicians, lab users, and pet parents land in the same operational portal with permissions enforced by
            the API.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
          <div className="lg:hidden">
            <div className="grid size-11 place-items-center rounded-lg bg-brand text-white">
              <PawPrint size={24} />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold">Log in</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email
              <input
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Hospital ID
              <input
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setHospitalId(event.target.value)}
                value={hospitalId}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Role
              <select
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setRole(event.target.value)}
                value={role}
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? (
            <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          ) : null}
          <button
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            type="submit"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
            <span>Sign in</span>
          </button>
        </form>
      </section>
    </main>
  );
}
