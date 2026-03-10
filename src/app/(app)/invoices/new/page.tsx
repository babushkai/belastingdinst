"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { IconTrash } from "@/components/ui/icons";
import { formatCurrency, centsToEuros, eurosToCents } from "@/lib/format";

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
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: 1, unitPriceCents: 0, btwRate: 21 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchContacts = useCallback(async (q: string) => {
    setContactSearch(q);
    setContactId("");
    if (q.length < 2) {
      setContacts([]);
      return;
    }
    const res = await fetch(
      `/api/contacts/search?q=${encodeURIComponent(q)}`,
    );
    const data = await res.json();
    setContacts(data);
    setHighlightIdx(-1);
  }, []);

  function selectContact(c: { id: string; companyName: string | null }) {
    setContactId(c.id);
    setContactSearch(c.companyName ?? "");
    setContacts([]);
  }

  function handleContactKeyDown(e: React.KeyboardEvent) {
    if (!contacts.length || contactId) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, contacts.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      selectContact(contacts[highlightIdx]);
    }
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

    const hasInvalidPrice = lines.some((l) => l.unitPriceCents <= 0);
    if (hasInvalidPrice) {
      setError(t("unitPriceCents") + " > 0");
      return;
    }

    setSubmitting(true);
    setError(null);

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
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Er is een fout opgetreden");
      setSubmitting(false);
    }
  }

  const lineInputClass =
    "w-full border border-black px-2 py-1.5 text-sm focus:outline focus:outline-2 focus:outline-[#0000cc]";

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-black">{t("newInvoice")}</h1>

      {error && (
        <div className="mb-4 border border-red-700 bg-white p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact search */}
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-black">{t("customer")}</label>
          <input
            type="text"
            placeholder={t("searchContactPlaceholder")}
            value={contactSearch}
            onChange={(e) => searchContacts(e.target.value)}
            onKeyDown={handleContactKeyDown}
            className={inputClass}
          />
          {contacts.length > 0 && !contactId && (
            <ul className="absolute z-10 mt-1 w-full border border-black bg-white">
              {contacts.map((c, i) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`w-full px-3.5 py-2.5 text-left text-sm ${
                      i === highlightIdx
                        ? "bg-gray-100 text-black"
                        : "text-black hover:bg-gray-50"
                    }`}
                    onClick={() => selectContact(c)}
                  >
                    {c.companyName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">{t("issueDate")}</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">{t("dueDate")}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Invoice lines */}
        <div className="border border-black bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-black">{t("lines")}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                <th className="pb-2">{t("description")}</th>
                <th className="pb-2 w-20">{t("quantity")}</th>
                <th className="pb-2 w-28">{t("unitPriceCents")}</th>
                <th className="pb-2 w-20">{t("btwPercent")}</th>
                <th className="pb-2 w-24 text-right">{t("total")}</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) =>
                        updateLine(idx, "description", e.target.value)
                      }
                      className={lineInputClass}
                      required
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className={lineInputClass}
                      min={0.01}
                      step={0.01}
                      required
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        &euro;
                      </span>
                      <input
                        type="number"
                        value={centsToEuros(line.unitPriceCents)}
                        onChange={(e) =>
                          updateLine(
                            idx,
                            "unitPriceCents",
                            eurosToCents(e.target.value),
                          )
                        }
                        className={`${lineInputClass} pl-7`}
                        min={0.01}
                        step={0.01}
                        required
                      />
                    </div>
                  </td>
                  <td className="py-1.5 pr-2">
                    <select
                      value={line.btwRate}
                      onChange={(e) =>
                        updateLine(idx, "btwRate", parseInt(e.target.value))
                      }
                      className={lineInputClass}
                    >
                      <option value={21}>21%</option>
                      <option value={9}>9%</option>
                      <option value={0}>0%</option>
                    </select>
                  </td>
                  <td className="py-1.5 text-right font-mono text-black">
                    {formatCurrency(calcLineTotal(line).total)}
                  </td>
                  <td className="py-1.5 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <IconTrash className="h-4 w-4" />
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
            className="mt-3 text-sm font-medium text-[#0000cc] hover:text-[#000099]"
          >
            + {t("addLine")}
          </button>
        </div>

        {/* Totals */}
        <div className="border border-black bg-white p-5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t("subtotal")}</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{t("btw")}</span>
            <span className="font-mono">{formatCurrency(totals.btw)}</span>
          </div>
          <div className="flex justify-between border-t border-black pt-2 font-bold text-black">
            <span>{t("total")}</span>
            <span className="font-mono">{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-black">{t("notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" loading={submitting}>
            {t("createInvoice")}
          </Button>
          <LinkButton href="/invoices" variant="secondary">
            {t("cancel")}
          </LinkButton>
        </div>
      </form>
    </div>
  );
}
