"use client";

import { useState } from "react";

export default function BankImportPage() {
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bankAccountId, setBankAccountId] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!bankAccountId) return;
    formData.set("bankAccountId", bankAccountId);

    setUploading(true);
    setResult(null);

    const res = await fetch("/api/bank/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setUploading(false);
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Bank import</h1>
      <p className="mb-4 text-sm text-gray-500">
        Upload een MT940 (.sta) of CAMT.053 (.xml) bestand van je bank.
        Ondersteund: ING, Rabobank, ABN AMRO.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Bankrekening ID</label>
          <input
            type="text"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            placeholder="UUID van bankrekening"
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Bestand</label>
          <input
            type="file"
            name="file"
            accept=".sta,.mt940,.swi,.xml"
            className="mt-1 w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {uploading ? "Importeren..." : "Importeren"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded border p-4">
          <h2 className="font-medium">Resultaat</h2>
          <p className="text-sm text-green-600">
            Geimporteerd: {result.imported}
          </p>
          <p className="text-sm text-gray-500">
            Overgeslagen (duplicaten): {result.skipped}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-red-600">Fouten:</p>
              <ul className="text-xs text-red-500">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
