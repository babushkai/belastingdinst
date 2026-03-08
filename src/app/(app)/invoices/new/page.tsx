"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";

interface Line {
  description: string;
  quantity: number;
  unitPriceCents: number;
  btwRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [contactId, setContactId] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<
    { id: string; companyName: string | null }[]
  >([]);
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unitPriceCents: 0, btwRate: 21 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  async function searchContacts(q: string) {
    setContactSearch(q);
    if (q.length < 2) return;
    const res = await fetch(
      `/api/contacts/search?q=${encodeURIComponent(q)}`,
    );
    const data = await res.json();
    setContacts(data);
  }

  function addLine() {
    setLines([
      ...lines,
      { description: "", quantity: 1, unitPriceCents: 0, btwRate: 21 },
    ]);
  }

  function removeLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof Line, value: string | number) {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  }

  function calcLineTotal(line: Line) {
    const base = Math.round(line.quantity * line.unitPriceCents);
    const btw = Math.round(base * (line.btwRate / 100));
    return { base, btw, total: base + btw };
  }

  const totals = lines.reduce(
    (acc, line) => {
      const { base, btw, total } = calcLineTotal(line);
      return {
        subtotal: acc.subtotal + base,
        btw: acc.btw + btw,
        total: acc.total + total,
      };
    },
    { subtotal: 0, btw: 0, total: 0 },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactId) return;
    setSubmitting(true);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        issueDate,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        lines,
      }),
    });

    if (res.ok) {
      router.push("/invoices");
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t("newInvoice")}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("customer")}</label>
          <input
            type="text"
            placeholder={t("searchContactPlaceholder")}
            value={contactSearch}
            onChange={(e) => searchContacts(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
          {contacts.length > 0 && !contactId && (
            <ul className="mt-1 rounded-lg border border-surface-200 bg-white shadow-lg">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3.5 py-2.5 text-left text-sm text-surface-700 transition-colors hover:bg-surface-50"
                    onClick={() => {
                      setContactId(c.id);
                      setContactSearch(c.companyName ?? "");
                      setContacts([]);
                    }}
                  >
                    {c.companyName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("issueDate")}</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("dueDate")}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-surface-800">{t("lines")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="pb-1">{t("description")}</th>
                <th className="pb-1 w-20">{t("quantity")}</th>
                <th className="pb-1 w-28">{t("unitPriceCents")}</th>
                <th className="pb-1 w-20">{t("btwPercent")}</th>
                <th className="pb-1 w-24 text-right">{t("total")}</th>
                <th className="pb-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-1 pr-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(idx, "description", e.target.value)
                      }
                      className="w-full rounded-lg border border-surface-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      required
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-surface-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      min={0.01}
                      step={0.01}
                      required
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      value={line.unitPriceCents}
                      onChange={(e) =>
                        updateLine(
                          idx,
                          "unitPriceCents",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full rounded-lg border border-surface-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                      required
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      value={line.btwRate}
                      onChange={(e) =>
                        updateLine(idx, "btwRate", parseInt(e.target.value))
                      }
                      className="w-full rounded-lg border border-surface-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    >
                      <option value={21}>21%</option>
                      <option value={9}>9%</option>
                      <option value={0}>0%</option>
                    </select>
                  </td>
                  <td className="py-1 text-right font-mono text-surface-700">
                    {(calcLineTotal(line).total / 100).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-red-400 transition-colors hover:text-red-600"
                      >
                        x
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            onClick={addLine}
            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t("addLine")}
          </button>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-5 text-sm shadow-sm">
          <div className="flex justify-between text-surface-600">
            <span>{t("subtotal")}</span>
            <span className="font-mono">
              &euro;{(totals.subtotal / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-surface-600">
            <span>{t("btw")}</span>
            <span className="font-mono">
              &euro;{(totals.btw / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t border-surface-200 pt-2 font-bold text-surface-900">
            <span>{t("total")}</span>
            <span className="font-mono">
              &euro;{(totals.total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg disabled:opacity-50"
          >
            {t("createInvoice")}
          </button>
          <a href="/invoices" className="inline-flex items-center rounded-lg border border-surface-300 bg-white px-5 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50">
            {t("cancel")}
          </a>
        </div>
      </form>
    </div>
  );
}
