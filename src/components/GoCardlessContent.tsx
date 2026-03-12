"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import {
  listDutchInstitutions,
  initiateGcRequisition,
  triggerGcSync,
  disconnectGcAccount,
} from "@/lib/bank/gocardless/actions";
import type { GcInstitution } from "@/lib/bank/gocardless/client";

interface ConnectedAccount {
  id: string;
  iban: string;
  bankName: string | null;
  displayName: string | null;
  lastSyncedAt: string | null;
  gcRefreshTokenExpiresAt: string | null;
}

export function GoCardlessContent({
  accounts,
}: {
  accounts: ConnectedAccount[];
}) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const error = searchParams.get("error");

  const [institutions, setInstitutions] = useState<GcInstitution[] | null>(
    null,
  );
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  function handleLoadBanks() {
    setLoadingAction("loadBanks");
    startTransition(async () => {
      try {
        const result = await listDutchInstitutions();
        setInstitutions(result);
      } catch (err) {
        setSyncResult(
          err instanceof Error ? err.message : "Failed to load banks",
        );
      } finally {
        setLoadingAction(null);
      }
    });
  }

  function handleConnect() {
    if (!selectedInstitution) return;
    setLoadingAction("connect");
    startTransition(async () => {
      try {
        const { link } = await initiateGcRequisition(selectedInstitution);
        window.location.href = link;
      } catch (err) {
        setSyncResult(
          err instanceof Error ? err.message : "Failed to create connection",
        );
        setLoadingAction(null);
      }
    });
  }

  function handleSync(accountId: string) {
    setLoadingAction(`sync-${accountId}`);
    setSyncResult(null);
    startTransition(async () => {
      try {
        const result = await triggerGcSync(accountId);
        setSyncResult(
          `${t("gcSyncSuccess")}: ${result.imported} ${t("imported")} ${result.skipped} ${t("skippedDuplicates")}`,
        );
      } catch (err) {
        setSyncResult(
          err instanceof Error ? err.message : t("gcSyncError"),
        );
      } finally {
        setLoadingAction(null);
      }
    });
  }

  function handleDisconnect(accountId: string) {
    if (!confirm(t("gcDisconnectConfirm"))) return;
    setLoadingAction(`disconnect-${accountId}`);
    startTransition(async () => {
      try {
        await disconnectGcAccount(accountId);
      } catch (err) {
        setSyncResult(
          err instanceof Error ? err.message : "Failed to disconnect",
        );
      } finally {
        setLoadingAction(null);
      }
    });
  }

  const isTokenExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return new Date(expiresAt).getTime() - Date.now() < sevenDays;
  };

  return (
    <div>
      <PageHeader title={t("gcSetup")}>
        <LinkButton href="/bank" variant="secondary">
          {t("bank")}
        </LinkButton>
      </PageHeader>

      <p className="mb-6 text-sm text-gray-600">{t("gcSetupDescription")}</p>

      {connected && (
        <div className="mb-4 border border-green-600 bg-green-50 p-3 text-sm text-green-800">
          {t("gcCallbackSuccess")}
        </div>
      )}

      {error && (
        <div className="mb-4 border border-red-600 bg-red-50 p-3 text-sm text-red-800">
          {t("gcCallbackError")}: {error}
        </div>
      )}

      {syncResult && (
        <div className="mb-4 border border-blue-600 bg-blue-50 p-3 text-sm text-blue-800">
          {syncResult}
        </div>
      )}

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-black">
            {t("gcConnected")}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="border border-black bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-black">
                      {acc.displayName ?? acc.bankName ?? acc.iban}
                    </p>
                    <p className="font-mono text-sm text-gray-600">
                      {acc.iban}
                    </p>
                  </div>
                  <Badge variant="success">GoCardless</Badge>
                </div>
                {acc.lastSyncedAt && (
                  <p className="mt-2 text-xs text-gray-500">
                    {t("lastSync")} {formatDate(acc.lastSyncedAt)}
                  </p>
                )}
                {isTokenExpiringSoon(acc.gcRefreshTokenExpiresAt) && (
                  <p className="mt-1 text-xs text-amber-600">
                    {t("gcReauthNeeded")}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleSync(acc.id)}
                    disabled={isPending}
                    className="border border-black bg-black px-3 py-1 text-xs text-white hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    {loadingAction === `sync-${acc.id}`
                      ? t("gcSyncing")
                      : t("gcSync")}
                  </button>
                  <button
                    onClick={() => handleDisconnect(acc.id)}
                    disabled={isPending}
                    className="border border-red-600 px-3 py-1 text-xs text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                  >
                    {t("gcDisconnect")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add bank */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-black">
          {t("gcConnect")}
        </h2>

        {!institutions ? (
          <button
            onClick={handleLoadBanks}
            disabled={isPending}
            className="border border-black bg-black px-4 py-2 text-sm text-white hover:bg-white hover:text-black disabled:opacity-50"
          >
            {loadingAction === "loadBanks"
              ? t("gcLoadingBanks")
              : t("gcLoadBanks")}
          </button>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full max-w-md border border-black bg-white px-3 py-2 text-sm text-black"
            >
              <option value="">{t("gcSelectBank")}</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <div>
              <button
                onClick={handleConnect}
                disabled={!selectedInstitution || isPending}
                className="border border-black bg-black px-4 py-2 text-sm text-white hover:bg-white hover:text-black disabled:opacity-50"
              >
                {loadingAction === "connect"
                  ? t("gcConnecting")
                  : t("gcConnectButton")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
