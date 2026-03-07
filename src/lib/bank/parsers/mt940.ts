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

  let currentTransaction: Partial<ParsedTransaction> | null = null;
  let infoLines: string[] = [];
  let statementCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // :61: Statement Line — transaction entry
    if (line.startsWith(":61:")) {
      // Flush previous transaction
      if (currentTransaction?.externalId) {
        currentTransaction.description = infoLines.join(" ").trim();
        transactions.push(currentTransaction as ParsedTransaction);
      }

      const data = line.substring(4);
      currentTransaction = parseStatementLine(data, ++statementCounter);
      infoLines = [];
    }
    // :86: Information to Account Owner
    else if (line.startsWith(":86:")) {
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
        currentTransaction.description = infoLines.join(" ").trim();
        transactions.push(currentTransaction as ParsedTransaction);
        currentTransaction = null;
        infoLines = [];
      }
    }
  }

  // Flush any remaining transaction
  if (currentTransaction?.externalId) {
    currentTransaction.description = infoLines.join(" ").trim();
    transactions.push(currentTransaction as ParsedTransaction);
  }

  return transactions;
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
 * Dutch banks use /NAME/ /IBAN/ /REMI/ tags in :86: fields.
 */
export function parseInfo86(text: string): {
  counterpartyName?: string;
  counterpartyIban?: string;
  description: string;
} {
  const nameMatch = text.match(/\/NAME\/([^/]+)/);
  const ibanMatch = text.match(/\/IBAN\/([A-Z]{2}\d{2}[A-Z0-9]{4,30})/);
  const remiMatch = text.match(/\/REMI\/([^/]+)/);

  return {
    counterpartyName: nameMatch?.[1]?.trim(),
    counterpartyIban: ibanMatch?.[1]?.trim(),
    description: remiMatch?.[1]?.trim() ?? text,
  };
}
