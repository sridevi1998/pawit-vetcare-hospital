"use client";

import { AlertCircle, FileText, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { InvoiceLifecycleActions } from "@/components/lifecycle-actions";
import { getBilling, type BillingResponse, type Invoice } from "@/lib/pawit-api";

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

function cents(value: number) {
  return currency.format(value / 100);
}

function statusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "issued":
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "void":
    case "refunded":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

function invoiceTotal(invoices: Invoice[]) {
  return invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
}

type BillingDashboardProps = {
  initialBilling?: BillingResponse | null;
  initialError?: string | null;
};

export function BillingDashboard({ initialBilling = null, initialError = null }: BillingDashboardProps) {
  const [billing, setBilling] = useState<BillingResponse | null>(initialBilling);
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function loadBilling() {
    setLoading(true);
    setError(null);
    try {
      setBilling(await getBilling());
    } catch {
      setBilling(null);
      setError("Billing data is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialBilling && !initialError) {
      void loadBilling();
    }
  }, [initialBilling, initialError]);

  const total = useMemo(() => invoiceTotal(billing?.invoices ?? []), [billing]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Financial</p>
          <h3 className="text-2xl font-bold">Billing</h3>
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={() => void loadBilling()}
          title="Refresh billing"
          type="button"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
        </button>
      </div>

      {error ? (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {loading && !billing
          ? Array.from({ length: 4 }).map((_, index) => (
              <div className="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-50" key={index} />
            ))
          : billing?.metrics.map((metric) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={metric.label}>
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
                {metric.delta ? <p className="mt-1 text-xs font-medium text-slate-500">{metric.delta}</p> : null}
              </div>
            ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1.2fr] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid">
          <span>Patient</span>
          <span>Guardian</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
          <span>Actions</span>
        </div>

        {loading && !billing ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="h-10 animate-pulse rounded bg-slate-100" key={index} />
            ))}
          </div>
        ) : billing && billing.invoices.length > 0 ? (
          <div>
            {billing.invoices.map((invoice) => (
              <div
                className="grid gap-3 border-b border-slate-100 px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1.2fr] md:items-center md:gap-0"
                key={invoice.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">{invoice.petName}</p>
                  <p className="truncate text-xs text-slate-500">Due {invoice.dueDate}</p>
                </div>
                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase text-slate-400 md:hidden">Guardian</span>
                  <p className="truncate text-slate-600">{invoice.ownerName}</p>
                </div>
                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase text-slate-400 md:hidden">Status</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase text-slate-400 md:hidden">Amount</span>
                  <p className="font-bold text-slate-950 md:text-right">{cents(invoice.amount)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase text-slate-400 md:hidden">Actions</span>
                  <InvoiceLifecycleActions invoiceID={invoice.id} status={invoice.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-44 place-items-center p-6 text-center">
            <div>
              <FileText className="mx-auto text-slate-400" size={42} />
              <p className="mt-3 font-semibold text-slate-700">No invoices</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-500">{billing?.invoices.length ?? 0} invoices</span>
        <span className="font-bold text-slate-950">{cents(total)}</span>
      </div>
    </section>
  );
}
