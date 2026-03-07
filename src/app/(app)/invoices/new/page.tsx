"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Line {
  description: string;
  quantity: number;
  unitPriceCents: number;
  btwRate: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
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
      <h1 className="mb-6 text-2xl font-bold">Nieuwe factuur</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Klant</label>
          <input
            type="text"
            placeholder="Zoek relatie..."
            value={contactSearch}
            onChange={(e) => searchContacts(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
          />
          {contacts.length > 0 && !contactId && (
            <ul className="mt-1 rounded border bg-white shadow">
              {contacts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-gray-50"
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
            <label className="block text-sm font-medium">Factuurdatum</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Vervaldatum</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-medium">Regels</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-1">Omschrijving</th>
                <th className="pb-1 w-20">Aantal</th>
                <th className="pb-1 w-28">Prijs (cent)</th>
                <th className="pb-1 w-20">BTW %</th>
                <th className="pb-1 w-24 text-right">Totaal</th>
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
                      className="w-full rounded border px-2 py-1"
                      required
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, "quantity", parseFloat(e.target.value))
                      }
                      className="w-full rounded border px-2 py-1"
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
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full rounded border px-2 py-1"
                      required
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      value={line.btwRate}
                      onChange={(e) =>
                        updateLine(idx, "btwRate", parseInt(e.target.value))
                      }
                      className="w-full rounded border px-2 py-1"
                    >
                      <option value={21}>21%</option>
                      <option value={9}>9%</option>
                      <option value={0}>0%</option>
                    </select>
                  </td>
                  <td className="py-1 text-right font-mono">
                    {(calcLineTotal(line).total / 100).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-red-500"
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
            className="mt-2 text-sm text-blue-600"
          >
            + Regel toevoegen
          </button>
        </div>

        <div className="rounded border p-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotaal</span>
            <span className="font-mono">
              &euro;{(totals.subtotal / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>BTW</span>
            <span className="font-mono">
              &euro;{(totals.btw / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold">
            <span>Totaal</span>
            <span className="font-mono">
              &euro;{(totals.total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Opmerkingen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !contactId}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Factuur aanmaken
          </button>
          <a href="/invoices" className="rounded border px-4 py-2 text-sm">
            Annuleren
          </a>
        </div>
      </form>
    </div>
  );
}
