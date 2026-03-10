"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface ConnectedAccount {
  id: string;
  label: string;
}

export function WiseSetupContent({
  connectedAccounts,
}: {
  connectedAccounts: ConnectedAccount[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [syncAccountId, setSyncAccountId] = useState(
    connectedAccounts[0]?.id ?? "",
  );
  const [freshAccount, setFreshAccount] = useState<ConnectedAccount | null>(
    null,
  );
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Merge server-provided accounts with freshly connected account
  const allConnected = freshAccount &&
    !connectedAccounts.some((a) => a.id === freshAccount.id)
    ? [...connectedAccounts, freshAccount]
    : connectedAccounts;

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/wise/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({
          success: true,
          message: `${t("wiseConnected")}: ${data.profileName} (${data.currency})`,
        });
        setApiToken("");
        setSyncAccountId(data.bankAccountId);
        setFreshAccount({
          id: data.bankAccountId,
          label: `Wise - ${data.profileName}`,
        });
        router.refresh();
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!syncAccountId) return;
    setSyncing(true);
    setSyncResult(null);

    const intervalEnd = new Date();
    const intervalStart = new Date();
    intervalStart.setDate(intervalStart.getDate() - 90);

    try {
      const res = await fetch("/api/wise/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: syncAccountId,
          intervalStart: intervalStart.toISOString(),
          intervalEnd: intervalEnd.toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncResult({ success: false, message: data.error });
      } else if (data.errors?.length > 0) {
        setSyncResult({
          success: false,
          message: `${t("imported")}: ${data.imported}, ${t("errors")}: ${data.errors.join("; ")}`,
        });
      } else {
        setSyncResult({
          success: true,
          message: `${t("imported")} ${data.imported}, ${t("skippedDuplicates")} ${data.skipped}`,
        });
      }
    } catch {
      setSyncResult({ success: false, message: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">
          {t("wiseIntegration")}
        </h1>
        <Link
          href="/bank"
          className="inline-flex items-center border border-black bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-gray-50"
        >
          {t("cancel")}
        </Link>
      </div>

      <p className="mb-6 text-sm text-gray-600">
        {t("wiseSetupDescription")}
      </p>

      {/* Setup form */}
      <div className="mb-8 border border-black bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-black">
          {t("wiseSetup")}
        </h2>

        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label
              htmlFor="apiToken"
              className="mb-1.5 block text-sm font-medium text-black"
            >
              {t("wiseApiToken")}
            </label>
            <input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={t("wiseApiTokenPlaceholder")}
              required
              className="w-full border border-black bg-white px-2 py-1.5 text-sm text-black placeholder:text-gray-500 focus:outline focus:outline-2 focus:outline-[#0000cc]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("wiseConnecting") : t("wiseConnectButton")}
          </button>
        </form>

        {result && (
          <div
            className={`mt-4 border p-3 text-sm ${
              result.success
                ? "border-green-700 bg-white text-green-700"
                : "border-red-700 bg-white text-red-700"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>

      {/* Sync section */}
      {allConnected.length > 0 && (
        <div className="border border-black bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-black">
            {t("wiseSync")}
          </h2>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="syncAccountId"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                {t("bankAccount")}
              </label>
              <select
                id="syncAccountId"
                value={syncAccountId}
                onChange={(e) => setSyncAccountId(e.target.value)}
                className="w-full border border-black bg-white px-2 py-1.5 text-sm text-black focus:outline focus:outline-2 focus:outline-[#0000cc]"
              >
                {allConnected.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !syncAccountId}
              className="border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? t("wiseSyncing") : t("wiseSync")}
            </button>
          </div>

          {syncResult && (
            <div
              className={`mt-4 border p-3 text-sm ${
                syncResult.success
                  ? "border-green-700 bg-white text-green-700"
                  : "border-red-700 bg-white text-red-700"
              }`}
            >
              {syncResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
