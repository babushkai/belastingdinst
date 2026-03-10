"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

interface ImportResult {
  imported?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
}

export function BankImportForm({
  accounts,
}: {
  accounts: { id: string; label: string }[];
}) {
  const { t } = useI18n();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bankAccountId, setBankAccountId] = useState(accounts[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!bankAccountId) return;
    formData.set("bankAccountId", bankAccountId);

    setUploading(true);
    setResult(null);

    try {
      const res = await fetch("/api/bank/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title={t("bankImportTitle")}>
        <LinkButton href="/bank" variant="secondary">
          {t("cancel")}
        </LinkButton>
      </PageHeader>
      <p className="mb-4 text-sm text-gray-600">
        {t("bankImportDescription")}
      </p>

      <div className="border border-black bg-white p-6">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">
              {t("bankAccount")}
            </label>
            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t("bankAccountsEmpty")}
              </p>
            ) : (
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className={inputClass}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-black">
              {t("file")}
            </label>
            <div className="border-2 border-dashed border-black px-6 py-8 text-center">
              <input
                type="file"
                name="file"
                accept=".sta,.mt940,.swi,.xml,.csv"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                style={{ position: "relative" }}
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                required
              />
              <p className="text-sm text-gray-600">
                {fileName ? (
                  <span className="font-medium text-black">{fileName}</span>
                ) : (
                  <>MT940, CAMT.053 (XML), Wise CSV</>
                )}
              </p>
            </div>
          </div>

          <Button type="submit" loading={uploading} disabled={accounts.length === 0}>
            {uploading ? t("importing") : t("importButton")}
          </Button>
        </form>
      </div>

      {result && (
        <div className="mt-6 border border-black bg-white p-5">
          {result.error ? (
            <p className="text-sm font-medium text-red-600">{result.error}</p>
          ) : (
            <>
              <h2 className="font-semibold text-black">{t("result")}</h2>
              <p className="mt-2 text-sm text-green-700">
                {t("imported")} {result.imported ?? 0}
              </p>
              <p className="text-sm text-gray-600">
                {t("skippedDuplicates")} {result.skipped ?? 0}
              </p>
              {(result.errors?.length ?? 0) > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600">
                    {t("errors")}
                  </p>
                  <ul className="mt-1 text-xs text-red-500">
                    {result.errors!.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
