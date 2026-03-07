import { XMLParser } from "fast-xml-parser";
import type { ParsedTransaction } from "../types";

/**
 * CAMT.053 (ISO 20022) parser targeting version camt.053.001.06.
 * Works with ING and Rabobank Dutch exports.
 *
 * Structure: BkToCstmrStmt > Stmt > Ntry (entries)
 */

export function parseCAMT053(xmlContent: string): ParsedTransaction[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (name) => ["Ntry", "TxDtls", "Stmt"].includes(name),
  });

  const doc = parser.parse(xmlContent);
  const transactions: ParsedTransaction[] = [];

  const root = doc.Document ?? doc;
  const stmts = root.BkToCstmrStmt?.Stmt ?? [];

  for (const stmt of Array.isArray(stmts) ? stmts : [stmts]) {
    const entries = stmt.Ntry ?? [];

    for (const entry of Array.isArray(entries) ? entries : [entries]) {
      const tx = parseEntry(entry);
      if (tx) transactions.push(tx);
    }
  }

  return transactions;
}

function parseEntry(entry: Record<string, unknown>): ParsedTransaction | null {
  const amt = entry.Amt as Record<string, unknown> | undefined;
  if (!amt) return null;

  const amountValue =
    typeof amt["#text"] === "string"
      ? parseFloat(amt["#text"])
      : typeof amt === "object" && "value" in (amt as Record<string, unknown>)
        ? parseFloat(String((amt as Record<string, unknown>).value))
        : typeof amt === "number"
          ? amt
          : parseFloat(String(amt));

  let amountCents = Math.round(amountValue * 100);

  // CdtDbtInd: CRDT = credit, DBIT = debit
  const cdtDbtInd = entry.CdtDbtInd as string;
  if (cdtDbtInd === "DBIT") {
    amountCents = -amountCents;
  }

  // Dates
  const bookgDt = entry.BookgDt as Record<string, unknown> | undefined;
  const valDt = entry.ValDt as Record<string, unknown> | undefined;
  const valueDate = extractDate(valDt) || extractDate(bookgDt) || "";

  if (!valueDate) return null;

  // Transaction details
  const ntryDtls = entry.NtryDtls as Record<string, unknown> | undefined;
  const txDtls = ntryDtls?.TxDtls as Record<string, unknown>[] | undefined;
  const firstTx = Array.isArray(txDtls) ? txDtls[0] : txDtls;

  // Counterparty
  const rltdPties = firstTx?.RltdPties as Record<string, unknown> | undefined;
  const counterparty =
    cdtDbtInd === "DBIT"
      ? (rltdPties?.Cdtr as Record<string, unknown>)
      : (rltdPties?.Dbtr as Record<string, unknown>);
  const counterpartyName = counterparty?.Nm as string | undefined;

  const counterpartyAcct =
    cdtDbtInd === "DBIT"
      ? (rltdPties?.CdtrAcct as Record<string, unknown>)
      : (rltdPties?.DbtrAcct as Record<string, unknown>);
  const counterpartyIban = (
    counterpartyAcct?.Id as Record<string, unknown>
  )?.IBAN as string | undefined;

  // Remittance info
  const rmtInf = firstTx?.RmtInf as Record<string, unknown> | undefined;
  const description =
    (rmtInf?.Ustrd as string) ??
    (entry.AddtlNtryInf as string) ??
    "";

  // External ID — use AcctSvcrRef or construct from entry data
  const acctSvcrRef = entry.AcctSvcrRef as string | undefined;
  const externalId =
    acctSvcrRef ?? `camt-${valueDate}-${Math.abs(amountCents)}-${counterpartyName ?? ""}`;

  return {
    externalId,
    valueDate,
    amountCents,
    counterpartyName,
    counterpartyIban,
    description: typeof description === "string" ? description : String(description),
    importSource: "camt053",
  };
}

function extractDate(
  dateObj: Record<string, unknown> | undefined,
): string | null {
  if (!dateObj) return null;
  const dt = dateObj.Dt as string | undefined;
  if (dt) return dt; // Already YYYY-MM-DD
  const dtTm = dateObj.DtTm as string | undefined;
  if (dtTm) return dtTm.split("T")[0];
  return null;
}
