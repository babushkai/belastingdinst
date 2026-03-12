const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

export interface GcTokenResponse {
  access: string;
  access_expires: number; // seconds
  refresh: string;
  refresh_expires: number; // seconds
}

export interface GcRefreshResponse {
  access: string;
  access_expires: number;
}

export interface GcInstitution {
  id: string;
  name: string;
  bic: string;
  logo: string;
  countries: string[];
}

export interface GcRequisition {
  id: string;
  link: string;
  status: string;
  accounts: string[];
}

export interface GcAccountDetails {
  iban: string;
  name?: string;
  currency: string;
  ownerName?: string;
}

export interface GcTransaction {
  transactionId?: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: { amount: string; currency: string };
  creditorName?: string;
  creditorAccount?: { iban?: string };
  debtorName?: string;
  debtorAccount?: { iban?: string };
  remittanceInformationUnstructured?: string;
  remittanceInformationUnstructuredArray?: string[];
}

async function gcFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GoCardless API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getAccessToken(
  secretId: string,
  secretKey: string,
): Promise<GcTokenResponse> {
  return gcFetch<GcTokenResponse>("/token/new/", {
    method: "POST",
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<GcRefreshResponse> {
  return gcFetch<GcRefreshResponse>("/token/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  });
}

export async function listInstitutions(
  country: string,
  accessToken: string,
): Promise<GcInstitution[]> {
  return gcFetch<GcInstitution[]>(
    `/institutions/?country=${encodeURIComponent(country)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export async function createRequisition(
  institutionId: string,
  redirectUrl: string,
  accessToken: string,
): Promise<GcRequisition> {
  return gcFetch<GcRequisition>("/requisitions/", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      institution_id: institutionId,
      redirect: redirectUrl,
    }),
  });
}

export async function getRequisition(
  requisitionId: string,
  accessToken: string,
): Promise<GcRequisition> {
  return gcFetch<GcRequisition>(`/requisitions/${requisitionId}/`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function getAccountDetails(
  accountId: string,
  accessToken: string,
): Promise<GcAccountDetails> {
  const res = await gcFetch<{ account: GcAccountDetails }>(
    `/accounts/${accountId}/details/`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return res.account;
}

export async function getTransactions(
  accountId: string,
  dateFrom: string,
  accessToken: string,
): Promise<{ booked: GcTransaction[]; pending: GcTransaction[] }> {
  const res = await gcFetch<{
    transactions: { booked: GcTransaction[]; pending: GcTransaction[] };
  }>(`/accounts/${accountId}/transactions/?date_from=${dateFrom}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.transactions;
}

export async function deleteRequisition(
  requisitionId: string,
  accessToken: string,
): Promise<void> {
  await gcFetch(`/requisitions/${requisitionId}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
