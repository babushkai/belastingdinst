import type { ParsedTransaction } from "../types";

/**
 * Parse Wise Business CSV statement export.
 *
 * Expected columns (order may vary, matched by header name):
 *   TransferWise ID, Date, Amount, Currency, Description,
 *   Payment Reference, Running Balance, Exchange From, Exchange To,
 *   Buy - Loss, Exchange Rate, Payer Name, Payee Name,
 *   Payee Account Number, Merchant, Total fees
 */
export function parseWiseCsv(content: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());

  const col = (name: string) => {
    const idx = headers.indexOf(name.toLowerCase());
    return idx;
  };

  const idxId = col("TransferWise ID");
  const idxDate = col("Date");
  const idxAmount = col("Amount");
  const idxDescription = col("Description");
  const idxPaymentRef = col("Payment Reference");
  const idxPayerName = col("Payer Name");
  const idxPayeeName = col("Payee Name");
  const idxPayeeAccount = col("Payee Account Number");
  const idxMerchant = col("Merchant");

  if (idxDate === -1 || idxAmount === -1) {
    throw new Error(
      "Invalid Wise CSV: missing required columns (Date, Amount)",
    );
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 2) continue;

    const rawAmount = fields[idxAmount]?.trim();
    if (!rawAmount || isNaN(Number(rawAmount))) continue;

    const amountCents = Math.round(Number(rawAmount) * 100);
    const dateStr = fields[idxDate]?.trim() ?? "";
    const valueDate = formatDate(parseWiseDate(dateStr));

    // Determine counterparty: for outgoing use payee/merchant, for incoming use payer
    const payeeName = fields[idxPayeeName]?.trim() ?? "";
    const payerName = fields[idxPayerName]?.trim() ?? "";
    const merchant = idxMerchant !== -1 ? fields[idxMerchant]?.trim() ?? "" : "";
    const counterpartyName =
      amountCents < 0
        ? merchant || payeeName || "Unknown"
        : payerName || "Unknown";
    const counterpartyIban =
      idxPayeeAccount !== -1 ? fields[idxPayeeAccount]?.trim() || undefined : undefined;

    const description =
      idxDescription !== -1 ? fields[idxDescription]?.trim() ?? "" : "";
    const paymentRef =
      idxPaymentRef !== -1 ? fields[idxPaymentRef]?.trim() ?? "" : "";
    const fullDescription = [description, paymentRef]
      .filter(Boolean)
      .join(" — ");

    const externalId =
      idxId !== -1 && fields[idxId]?.trim()
        ? `wise-${fields[idxId].trim()}`
        : `wise-${dateStr}-${i}-${amountCents}`;

    transactions.push({
      externalId,
      valueDate,
      executionDate: valueDate,
      amountCents,
      counterpartyName,
      counterpartyIban,
      description: fullDescription || undefined,
      importSource: "wise",
    });
  }

  return transactions;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse DD-MM-YYYY or YYYY-MM-DD date strings */
function parseWiseDate(dateStr: string): Date {
  // DD-MM-YYYY
  const dmy = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return new Date(`${dmy[3]}-${dmy[2]}-${dmy[1]}`);

  // YYYY-MM-DD
  const ymd = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) return new Date(dateStr);

  // Fallback
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Cannot parse date: ${dateStr}`);
  return d;
}

/** Parse a CSV line handling quoted fields with commas and escaped quotes */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
