import type { ParsedTransaction } from "../types";

/**
 * MT940 parser for Dutch banks (ING, Rabobank, ABN AMRO).
 *
 * MT940 format consists of blocks:
 * :20: Transaction Reference Number
 * :25: Account Identification
 * :28C: Statement Number
 * :60F: Opening Balance
 * :61: Statement Line (transaction)
 * :86: Information to Account Owner
 * :62F: Closing Balance
 */


export function parseMT940(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = content.split(/\r?\n/);

  let currentTransaction: (Partial<ParsedTransaction> & { _ref?: string }) | null = null;
  let infoLines: string[] = [];
  let statementCounter = 0;
  let expectRefLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // :61: Statement Line — transaction entry
    if (line.startsWith(":61:")) {
      // Flush previous transaction
      if (currentTransaction?.externalId) {
        flushTransaction(currentTransaction, infoLines, transactions);
      }

      const data = line.substring(4);
      currentTransaction = parseStatementLine(data, ++statementCounter);
      infoLines = [];
      expectRefLine = true;
    }
    // :61: continuation line (reference like TRANSFER-xxx, CARD-xxx, BALANCE-xxx)
    else if (expectRefLine && currentTransaction && !line.startsWith(":")) {
      currentTransaction._ref = line.trim();
      // Use Wise reference as a more stable externalId
      if (currentTransaction._ref) {
        currentTransaction.externalId = `mt940-${currentTransaction._ref}`;
      }
      expectRefLine = false;
    }
    // :86: Information to Account Owner
    else if (line.startsWith(":86:")) {
      expectRefLine = false;
      infoLines.push(line.substring(4));
    }
    // Continuation of :86: (lines not starting with :XX:)
    else if (
      currentTransaction &&
      infoLines.length > 0 &&
      !line.startsWith(":")
    ) {
      infoLines.push(line);
    }
    // :62F: or :62M: Closing balance — flush last transaction
    else if (line.startsWith(":62F:") || line.startsWith(":62M:")) {
      if (currentTransaction?.externalId) {
        flushTransaction(currentTransaction, infoLines, transactions);
        currentTransaction = null;
        infoLines = [];
      }
      expectRefLine = false;
    } else {
      expectRefLine = false;
    }
  }

  // Flush any remaining transaction
  if (currentTransaction?.externalId) {
    flushTransaction(currentTransaction, infoLines, transactions);
  }

  return transactions;
}

function flushTransaction(
  tx: Partial<ParsedTransaction> & { _ref?: string },
  infoLines: string[],
  out: ParsedTransaction[],
) {
  const info86 = infoLines.join(" ").trim();
  // Build description: combine reference + :86: info
  const parts = [tx._ref, info86].filter(Boolean);
  tx.description = parts.join(" — ") || undefined;
  delete tx._ref;
  out.push(tx as ParsedTransaction);
}

function parseStatementLine(
  data: string,
  seqNum: number,
): Partial<ParsedTransaction> {
  // Format: YYMMDD[MMDD]C/DamountS[reference]//[bank-ref]\n[supplementary]
  // Minimal parsing — date (6 chars), optional value date (4 chars),
  // C/D or RC/RD, amount, reference

  const valueDateStr = data.substring(0, 6);
  const valueDate = parseDate(valueDateStr);

  // Find C or D (credit/debit indicator)
  let offset = 6;
  // Check if there's an entry date (4 chars MMDD)
  if (/^\d{4}/.test(data.substring(offset))) {
    offset += 4;
  }

  let isDebit = false;
  if (data[offset] === "R") {
    offset++;
    isDebit = data[offset] === "D";
    offset++;
  } else {
    isDebit = data[offset] === "D";
    offset++;
  }

  // Extract amount (up to the next letter)
  const amountMatch = data.substring(offset).match(/^[\d,]+/);
  let amountCents = 0;
  if (amountMatch) {
    const amountStr = amountMatch[0].replace(",", ".");
    amountCents = Math.round(parseFloat(amountStr) * 100);
    offset += amountMatch[0].length;
  }

  if (isDebit) amountCents = -amountCents;

  // Extract reference (rest of line) — used in externalId for uniqueness
  const reference = data.substring(offset).trim();
  const externalId = `mt940-${valueDate}-${seqNum}-${Math.abs(amountCents)}-${reference || "noref"}`;

  return {
    externalId,
    valueDate,
    amountCents,
    importSource: "mt940",
    counterpartyName: undefined,
    counterpartyIban: undefined,
  };
}

function parseDate(yymmdd: string): string {
  const year = parseInt(yymmdd.substring(0, 2));
  const month = yymmdd.substring(2, 4);
  const day = yymmdd.substring(4, 6);
  const fullYear = year > 50 ? 1900 + year : 2000 + year;
  return `${fullYear}-${month}-${day}`;
}

/**
 * Extract counterparty info from :86: structured data.
 *
 * Supports:
 * - Dutch bank format: /NAME/ /IBAN/ /REMI/ tags
 * - Wise format: counterparty name as first line, /CHGS/ /EXCH/ tags
 * - Generic: IBAN detection anywhere in text
 */
export function parseInfo86(text: string): {
  counterpartyName?: string;
  counterpartyIban?: string;
  description: string;
} {
  // Dutch bank format: /NAME/ /IBAN/ /REMI/
  const nameMatch = text.match(/\/NAME\/([^/]+)/);
  const ibanMatch = text.match(/\/IBAN\/([A-Z]{2}\d{2}[A-Z0-9]{4,30})/);
  const remiMatch = text.match(/\/REMI\/([^/]+)/);

  if (nameMatch || ibanMatch || remiMatch) {
    return {
      counterpartyName: nameMatch?.[1]?.trim(),
      counterpartyIban: ibanMatch?.[1]?.trim(),
      description: remiMatch?.[1]?.trim() ?? text,
    };
  }

  // Wise / generic format: strip known MT940 tags and extract useful info
  // Remove /CHGS/..., /EXCH/..., /EREF/..., /MARF/... tags
  const cleanedParts: string[] = [];
  let counterpartyName: string | undefined;
  let counterpartyIban: string | undefined;

  const segments = text.split(/\s+/);
  for (const seg of segments) {
    // Skip charge/exchange/reference tags
    if (/^\/(?:CHGS|EXCH|EREF|MARF|PREF|SVWZ|KREF|CREF|IREF)\//.test(seg)) {
      continue;
    }
    // Detect IBAN
    const ibanInSeg = seg.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{4,30})\b/);
    if (ibanInSeg) {
      counterpartyIban = ibanInSeg[1];
      continue;
    }
    cleanedParts.push(seg);
  }

  // First meaningful text segment is likely the counterparty name
  const cleaned = cleanedParts.join(" ").trim();
  if (cleaned.length > 0 && !/^[\d,./]+$/.test(cleaned)) {
    counterpartyName = cleaned;
  }

  return {
    counterpartyName,
    counterpartyIban,
    description: cleaned || text,
  };
}
