export type Locale = "nl" | "en";

export const translations = {
  // ── Brand & metadata ──
  brand: { nl: "Belastingdinst", en: "Belastingdinst" },
  metaTitle: {
    nl: "Belastingdinst - Boekhouding",
    en: "Belastingdinst - Accounting",
  },
  metaDescription: {
    nl: "Zelfgehoste boekhouding en BTW-aangifte voor ZZP'ers",
    en: "Self-hosted accounting and VAT returns for freelancers",
  },

  // ── Navigation ──
  navDashboard: { nl: "Dashboard", en: "Dashboard" },
  navContacts: { nl: "Relaties", en: "Contacts" },
  navInvoices: { nl: "Facturen", en: "Invoices" },
  navBank: { nl: "Bank", en: "Bank" },
  navBtw: { nl: "BTW Aangifte", en: "VAT Return" },
  navSettings: { nl: "Instellingen", en: "Settings" },
  signOut: { nl: "Uitloggen", en: "Sign out" },

  // ── Login ──
  loginSubtitle: {
    nl: "Inloggen om verder te gaan",
    en: "Sign in to continue",
  },
  loginEmail: { nl: "Email", en: "Email" },
  loginPassword: { nl: "Wachtwoord", en: "Password" },
  loginButton: { nl: "Inloggen", en: "Sign in" },
  loginRateLimited: {
    nl: "Te veel inlogpogingen. Probeer het later opnieuw.",
    en: "Too many login attempts. Please try again later.",
  },
  loginInvalidCredentials: {
    nl: "Ongeldige inloggegevens.",
    en: "Invalid credentials.",
  },
  loginRegistered: {
    nl: "Account aangemaakt. Je kunt nu inloggen.",
    en: "Account created. You can now sign in.",
  },
  loginNoAccount: { nl: "Nog geen account?", en: "No account yet?" },
  loginSignupLink: { nl: "Registreren", en: "Sign up" },

  // ── Signup ──
  signupSubtitle: {
    nl: "Maak een nieuw account aan",
    en: "Create a new account",
  },
  signupName: { nl: "Naam", en: "Name" },
  signupConfirmPassword: {
    nl: "Wachtwoord bevestigen",
    en: "Confirm password",
  },
  signupButton: { nl: "Registreren", en: "Sign up" },
  signupHasAccount: { nl: "Al een account?", en: "Already have an account?" },
  signupLoginLink: { nl: "Inloggen", en: "Sign in" },
  signupEmailTaken: {
    nl: "Dit emailadres is al in gebruik.",
    en: "This email is already in use.",
  },
  signupPasswordsMismatch: {
    nl: "Wachtwoorden komen niet overeen.",
    en: "Passwords do not match.",
  },
  signupPasswordTooShort: {
    nl: "Wachtwoord moet minimaal 8 tekens zijn.",
    en: "Password must be at least 8 characters.",
  },
  signupMissingFields: {
    nl: "Vul alle verplichte velden in.",
    en: "Please fill in all required fields.",
  },

  // ── Dashboard ──
  dashboard: { nl: "Dashboard", en: "Dashboard" },
  openInvoices: { nl: "Openstaande facturen", en: "Open invoices" },
  btwPeriod: { nl: "BTW periode", en: "VAT period" },
  lastBankSync: { nl: "Laatste bank sync", en: "Last bank sync" },
  none: { nl: "Geen", en: "None" },
  notSyncedYet: {
    nl: "Nog niet gesynchroniseerd",
    en: "Not synced yet",
  },
  newInvoice: { nl: "Nieuwe factuur", en: "New invoice" },
  bankImport: { nl: "Bank import", en: "Bank import" },

  // ── Contacts ──
  contacts: { nl: "Relaties", en: "Contacts" },
  newContact: { nl: "Nieuwe relatie", en: "New contact" },
  editContact: { nl: "Relatie bewerken", en: "Edit contact" },
  companyName: { nl: "Bedrijfsnaam", en: "Company name" },
  contactPerson: { nl: "Contactpersoon", en: "Contact person" },
  email: { nl: "Email", en: "Email" },
  btwNumber: { nl: "BTW-nummer", en: "VAT number" },
  kvkNumber: { nl: "KvK-nummer", en: "CoC number" },
  address: { nl: "Adres", en: "Address" },
  postcode: { nl: "Postcode", en: "Postcode" },
  city: { nl: "Plaats", en: "City" },
  edit: { nl: "Bewerken", en: "Edit" },
  deleteAction: { nl: "Verwijderen", en: "Delete" },
  save: { nl: "Opslaan", en: "Save" },
  cancel: { nl: "Annuleren", en: "Cancel" },
  contactsEmpty: {
    nl: "Nog geen relaties. Maak een nieuwe relatie aan.",
    en: "No contacts yet. Create a new contact.",
  },

  // ── Invoices ──
  invoices: { nl: "Facturen", en: "Invoices" },
  invoiceNumber: { nl: "Nummer", en: "Number" },
  customer: { nl: "Klant", en: "Customer" },
  date: { nl: "Datum", en: "Date" },
  dueDate: { nl: "Vervaldatum", en: "Due date" },
  status: { nl: "Status", en: "Status" },
  view: { nl: "Bekijken", en: "View" },
  invoicesEmpty: { nl: "Nog geen facturen.", en: "No invoices yet." },
  statusDraft: { nl: "Concept", en: "Draft" },
  statusSent: { nl: "Verzonden", en: "Sent" },
  statusPaid: { nl: "Betaald", en: "Paid" },
  statusOverdue: { nl: "Verlopen", en: "Overdue" },
  statusVoid: { nl: "Geannuleerd", en: "Voided" },

  // ── New Invoice ──
  searchContactPlaceholder: {
    nl: "Zoek relatie...",
    en: "Search contact...",
  },
  issueDate: { nl: "Factuurdatum", en: "Issue date" },
  lines: { nl: "Regels", en: "Lines" },
  description: { nl: "Omschrijving", en: "Description" },
  quantity: { nl: "Aantal", en: "Quantity" },
  unitPriceCents: { nl: "Prijs (cent)", en: "Price (cents)" },
  btwPercent: { nl: "BTW %", en: "VAT %" },
  total: { nl: "Totaal", en: "Total" },
  addLine: { nl: "+ Regel toevoegen", en: "+ Add line" },
  subtotal: { nl: "Subtotaal", en: "Subtotal" },
  btw: { nl: "BTW", en: "VAT" },
  notes: { nl: "Opmerkingen", en: "Notes" },
  createInvoice: { nl: "Factuur aanmaken", en: "Create invoice" },

  // ── Bank ──
  bank: { nl: "Bank", en: "Bank" },
  importFile: { nl: "Bestand importeren", en: "Import file" },
  allTransactions: { nl: "Alle transacties", en: "All transactions" },
  bankAccounts: { nl: "Bankrekeningen", en: "Bank accounts" },
  bankAccount: { nl: "Bankrekening", en: "Bank account" },
  bankAccountsEmpty: {
    nl: "Nog geen bankrekeningen. Importeer een MT940/CAMT bestand om te beginnen.",
    en: "No bank accounts yet. Import an MT940/CAMT file to get started.",
  },
  lastSync: { nl: "Laatste sync:", en: "Last sync:" },
  never: { nl: "Nooit", en: "Never" },
  syncLog: { nl: "Sync log", en: "Sync log" },
  source: { nl: "Bron", en: "Source" },
  transactions: { nl: "Transacties", en: "Transactions" },
  noSyncActivity: {
    nl: "Geen sync activiteit.",
    en: "No sync activity.",
  },

  // ── Wise ──
  wiseIntegration: { nl: "Wise koppeling", en: "Wise integration" },
  wiseSetup: { nl: "Wise koppelen", en: "Connect Wise" },
  wiseSync: { nl: "Wise sync", en: "Wise sync" },
  wiseSyncing: { nl: "Synchroniseren...", en: "Syncing..." },
  wiseApiToken: { nl: "Wise API token", en: "Wise API token" },
  wiseApiTokenPlaceholder: {
    nl: "Plak je Wise API token hier",
    en: "Paste your Wise API token here",
  },
  wiseConnected: { nl: "Wise gekoppeld", en: "Wise connected" },
  wiseSetupDescription: {
    nl: "Koppel je Wise Business account om automatisch transacties te importeren. Maak een Read-only API token aan in Wise Business → Instellingen → API tokens.",
    en: "Connect your Wise Business account to automatically import transactions. Create a Read-only API token in Wise Business → Settings → API tokens.",
  },
  wiseSelectAccount: {
    nl: "Selecteer bankrekening",
    en: "Select bank account",
  },
  wiseConnectButton: { nl: "Koppelen", en: "Connect" },
  wiseConnecting: { nl: "Koppelen...", en: "Connecting..." },
  wiseSyncSuccess: {
    nl: "Wise sync voltooid",
    en: "Wise sync completed",
  },
  wiseSyncError: {
    nl: "Wise sync mislukt",
    en: "Wise sync failed",
  },

  // ── Bank Import ──
  bankImportTitle: { nl: "Bank import", en: "Bank import" },
  bankImportDescription: {
    nl: "Upload een MT940 (.sta) of CAMT.053 (.xml) bestand van je bank. Ondersteund: ING, Rabobank, ABN AMRO.",
    en: "Upload an MT940 (.sta) or CAMT.053 (.xml) file from your bank. Supported: ING, Rabobank, ABN AMRO.",
  },
  bankAccountId: { nl: "Bankrekening ID", en: "Bank account ID" },
  bankAccountIdPlaceholder: {
    nl: "UUID van bankrekening",
    en: "Bank account UUID",
  },
  file: { nl: "Bestand", en: "File" },
  importing: { nl: "Importeren...", en: "Importing..." },
  importButton: { nl: "Importeren", en: "Import" },
  result: { nl: "Resultaat", en: "Result" },
  imported: { nl: "Geimporteerd:", en: "Imported:" },
  skippedDuplicates: {
    nl: "Overgeslagen (duplicaten):",
    en: "Skipped (duplicates):",
  },
  errors: { nl: "Fouten:", en: "Errors:" },

  // ── Transactions ──
  transactionsTitle: { nl: "Transacties", en: "Transactions" },
  counterparty: { nl: "Tegenpartij", en: "Counterparty" },
  amount: { nl: "Bedrag", en: "Amount" },
  transactionsEmpty: {
    nl: "Nog geen transacties. Importeer een bankbestand.",
    en: "No transactions yet. Import a bank file.",
  },

  // ── BTW ──
  btwTitle: { nl: "BTW Aangifte", en: "VAT Return" },
  calculateQuarter: { nl: "Bereken", en: "Calculate" },
  period: { nl: "Periode", en: "Period" },
  revenue21: { nl: "Omzet 21%", en: "Revenue 21%" },
  revenue9: { nl: "Omzet 9%", en: "Revenue 9%" },
  btwPayable: { nl: "BTW afdracht", en: "VAT payable" },
  inputVat: { nl: "Voorbelasting", en: "Input VAT" },
  toBePaid: { nl: "Te betalen", en: "To pay" },
  statusOpen: { nl: "Open", en: "Open" },
  statusCalculated: { nl: "Berekend", en: "Calculated" },
  statusFiled: { nl: "Ingediend", en: "Filed" },
  locked: { nl: "(vergrendeld)", en: "(locked)" },
  submit: { nl: "Indienen", en: "Submit" },
  btwEmpty: {
    nl: 'Nog geen BTW-periodes. Klik op "Bereken" om te starten.',
    en: 'No VAT periods yet. Click "Calculate" to start.',
  },
  selectYear: { nl: "Jaar", en: "Year" },
  selectQuarter: { nl: "Kwartaal", en: "Quarter" },
  calculate: { nl: "Bereken", en: "Calculate" },
  futureQuarter: {
    nl: "Kan geen toekomstig kwartaal berekenen",
    en: "Cannot calculate a future quarter",
  },
  manualFiling: { nl: "Handmatig indienen", en: "Manual filing" },
  manualFilingDescription: {
    nl: 'Na het berekenen van de BTW-aangifte kun je de bedragen overnemen in Mijn Belastingdienst Zakelijk. De "Te betalen" bedrag is het nettobedrag dat je moet afdragen.',
    en: 'After calculating the VAT return, you can transfer the amounts to Mijn Belastingdienst Zakelijk. The "To pay" amount is the net amount you need to remit.',
  },

  // ── Settings ──
  settings: { nl: "Instellingen", en: "Settings" },
  iban: { nl: "IBAN", en: "IBAN" },
  invoicePrefix: { nl: "Factuur prefix", en: "Invoice prefix" },
  defaultBtwRate: { nl: "Standaard BTW-tarief", en: "Default VAT rate" },
  korActive: {
    nl: "KOR (Kleineondernemersregeling) actief",
    en: "KOR (Small business scheme) active",
  },

  // ── Language ──
  language: { nl: "Taal", en: "Language" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key][locale];
}
