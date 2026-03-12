export interface ParsedTransaction {
  externalId: string;
  valueDate: string; // YYYY-MM-DD
  executionDate?: string;
  amountCents: number; // negative for debits
  counterpartyName?: string;
  counterpartyIban?: string;
  description?: string;
  importSource: "ponto" | "mt940" | "camt053" | "manual" | "wise";
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
