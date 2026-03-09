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

  const rawAmt = amt["#text"] ?? amt;
  const amountValue =
    typeof rawAmt === "number"
      ? rawAmt
      : parseFloat(String(rawAmt));

  if (Number.isNaN(amountValue)) return null;
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
  const executionDate = extractDate(bookgDt) || undefined;

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
  const addtlNtryInf = entry.AddtlNtryInf as string | undefined;
  const description =
    (rmtInf?.Ustrd as string) ?? addtlNtryInf ?? "";

  // Extract counterparty from AddtlNtryInf if not found in RltdPties
  // Wise format: "Card transaction of X.XX EUR issued by <merchant>"
  //              "Received money from <name> with reference ..."
  //              "Sent money to <name> with reference ..."
  let resolvedName = counterpartyName;
  if (!resolvedName && addtlNtryInf) {
    const issuedBy = addtlNtryInf.match(/issued by\s+(.+)/i);
    const receivedFrom = addtlNtryInf.match(/(?:Received|Got) money from\s+(.+?)(?:\s+with reference|$)/i);
    const sentTo = addtlNtryInf.match(/Sent money to\s+(.+?)(?:\s+with reference|$)/i);
    resolvedName = issuedBy?.[1]?.trim() ?? receivedFrom?.[1]?.trim() ?? sentTo?.[1]?.trim();
  }

  // External ID — use AcctSvcrRef, BkTxCd reference, or construct from entry data
  const acctSvcrRef = entry.AcctSvcrRef as string | undefined;
  const bkTxCd = entry.BkTxCd as Record<string, unknown> | undefined;
  const prtryRef = (bkTxCd?.Prtry as Record<string, unknown>)?.Cd as string | undefined;
  const externalId =
    acctSvcrRef ?? (prtryRef ? `camt-${prtryRef}` : `camt-${valueDate}-${Math.abs(amountCents)}-${resolvedName ?? ""}`);

  return {
    externalId,
    valueDate,
    executionDate,
    amountCents,
    counterpartyName: resolvedName,
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
