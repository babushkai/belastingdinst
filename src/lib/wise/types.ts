/** Wise Balance Statement API response types */

export interface WiseProfile {
  id: number;
  type: "PERSONAL" | "BUSINESS";
  fullName: string;
}

export interface WiseBalance {
  id: number;
  currency: string;
  amount: { value: number; currency: string };
  type: "STANDARD" | "SAVINGS";
}

export interface WiseStatementResponse {
  accountHolder: { type: string; firstName?: string; lastName?: string };
  issuer: { name: string; firstLine: string; city: string; postCode: string };
  transactions: WiseTransaction[];
  startOfStatementBalance: { value: number; currency: string };
  endOfStatementBalance: { value: number; currency: string };
  query: {
    intervalStart: string;
    intervalEnd: string;
    currency: string;
    accountId: number;
  };
}

export interface WiseTransaction {
  type: "CREDIT" | "DEBIT";
  date: string; // ISO 8601
  amount: { value: number; currency: string };
  totalFees: { value: number; currency: string };
  details: {
    type: string;
    description: string;
    senderName?: string;
    senderAccount?: string;
    recipientName?: string;
    recipientAccount?: string;
    paymentReference?: string;
  };
  exchangeDetails: {
    forAmount?: { value: number; currency: string };
    rate?: number;
  } | null;
  runningBalance: { value: number; currency: string };
  referenceNumber: string;
}
