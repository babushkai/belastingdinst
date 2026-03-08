"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function BankImportPage() {
  const { t } = useI18n();
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
      <h1 className="mb-6 text-2xl font-bold text-surface-900">{t("bankImportTitle")}</h1>
      <p className="mb-4 text-sm text-surface-500">
        {t("bankImportDescription")}
      </p>

      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("bankAccountId")}</label>
            <input
              type="text"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              placeholder={t("bankAccountIdPlaceholder")}
              className="w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 shadow-sm transition-colors placeholder:text-surface-400 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">{t("file")}</label>
            <input
              type="file"
              name="file"
              accept=".sta,.mt940,.swi,.xml"
              className="w-full text-sm text-surface-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-lg disabled:opacity-50"
          >
            {uploading ? t("importing") : t("importButton")}
          </button>
        </form>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-surface-900">{t("result")}</h2>
          <p className="mt-2 text-sm text-emerald-600">
            {t("imported")} {result.imported}
          </p>
          <p className="text-sm text-surface-500">
            {t("skippedDuplicates")} {result.skipped}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600">{t("errors")}</p>
              <ul className="mt-1 text-xs text-red-500">
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
