export interface OutputGstSection {
  taxableAmount: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalGST: number;
  invoiceCount: number;
}

export interface ItcFromGstr2BSection {
  totalITC: number;
  matchedITC: number;
  mismatchedITC: number;
  missingITC: number;
  importIgst: number;
  eligibleITC: number;
}

export interface ReconSummary {
  matched: number;
  mismatch: number;
  missing: number;
  notIn2B: number;
  total: number;
}

export interface NetTaxPayableSection {
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface CarryForwardSection {
  igst: number;
  cgst: number;
  sgst: number;
  totalCarryForward: number;
  remarks: string;
}

export interface GstSummaryResponse {
  period: string;
  tenantGSTIN: string;
  outputGST: OutputGstSection;
  itcFromGSTR2B: ItcFromGstr2BSection;
  reconSummary: ReconSummary;
  netTaxPayable: NetTaxPayableSection;
  carryForward: CarryForwardSection;
  aiRemarks: string;
}

export interface InvoiceLineResponse {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export type EInvoiceStatus = 'Done' | 'Required' | 'NA';

export type Gstr1Section = 'B2B' | 'Export' | 'B2CL' | 'B2CS' | 'CDN';

export interface Gstr1HsnRow {
  hsnCode: string;
  description: string;
  uqc: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalValue: number;
}

export interface Gstr1DocRow {
  docType: string;
  count: number;
}

export interface Gstr1TablesResponse {
  hsn: Gstr1HsnRow[];
  docsIssued: Gstr1DocRow[];
}

export interface Gstr1B2csRow {
  splyTy: string;
  pos: string;
  typ: string;
  rt: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface InvoiceResponse {
  id: string;
  billId: number;
  eInvoiceStatus: EInvoiceStatus;
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  partyGSTIN: string;
  placeOfSupply: string;
  section: Gstr1Section;
  gstCategory: string;
  taxableValue: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  roundOffLabel: string;
  totalAmount: number;
  companyId: number | null;
  companyName: string | null;
  lines: InvoiceLineResponse[];
}

export interface CompanySummary {
  coId: number;
  coName: string;
  gstNo: string | null;
  stateId: number | null;
  billCount: number;
}

export interface TenantSummary {
  tenantId: string;
  name: string;
  gstin: string;
  flavor: string;
  isActive: boolean;
}

export interface Gstr1SummaryRow {
  partyName: string;
  partyGSTIN: string;
  section: Gstr1Section;
  invoiceCount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface Gstr3bLine {
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalGst: number;
}

export interface OutwardSuppliesSection {
  invoiceCount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGstCollected: number;
  taxableOutward: Gstr3bLine;
  zeroRated: Gstr3bLine;
  nilRatedExempt: Gstr3bLine;
  reverseChargeInward: Gstr3bLine;
  nonGstOutward: Gstr3bLine;
}

export interface ItcSection {
  purchaseCount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  importIgst: number;
  reverseChargeCGST: number;
  reverseChargeSGST: number;
  reverseChargeIGST: number;
  totalItcAvailable: number;
  note: string;
}

export interface BillOfEntry {
  boEId: number;
  period: string;
  boENumber: string;
  boEDate: string;
  portCode: string | null;
  supplierName: string | null;
  supplierGSTIN: string | null;
  assessableValue: number;
  igstAmount: number;
  cessAmount: number;
  remarks: string | null;
}

export interface SaveBillOfEntryCommand {
  period: string;
  boENumber: string;
  boEDate: string;
  portCode?: string | null;
  supplierName?: string | null;
  supplierGSTIN?: string | null;
  assessableValue: number;
  igstAmount: number;
  cessAmount: number;
  remarks?: string | null;
}

export interface TaxLiabilitySummary {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Gstr3bResponse {
  period: string;
  section3_1_OutwardSupplies: OutwardSuppliesSection;
  table4_Itc: ItcSection;
  netTaxPayable: TaxLiabilitySummary;
  carryForward: CarryForwardSection;
}

export type ReconStatus = 'Matched' | 'Mismatch' | 'Missing' | 'NotIn2B';

export interface ReconRowResponse {
  reconId: string;
  supplierGSTIN: string;
  supplierName: string;
  invoiceNo: string;
  gstR2BAmount: number;
  booksAmount: number;
  difference: number;
  status: ReconStatus;
  section: string;
  aiRemarks: string;
  createdOn: string;
}

export interface ReconReportResponse {
  filingPeriod: string;
  summary: ReconSummary;
  rows: ReconRowResponse[];
}

export interface ReconRunResponse {
  filingPeriod: string;
  rowsProcessed: number;
  summary: ReconSummary;
  ranOn: string;
}

export interface CarolErpPeriod {
  period: string;
  salesCount: number;
  purchaseCount: number;
}

export interface Gstr2bRecord {
  gstR2BId: string;
  supplierGSTIN: string;
  supplierName: string;
  invoiceNo: string;
  invoiceDate: string;
  taxableAmount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  filingPeriod: string;
  recordType: string;
}

export interface Gstr2bResponse {
  filingPeriod: string;
  recordsFetched: number;
  fetchedOn: string;
  source: string;
  records: Gstr2bRecord[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  emplCode: string;
  displayName: string;
  role: string;
  tenantId: string;
}

export interface AuthUser {
  emplCode: string;
  displayName: string;
  role: string;
  tenantId: string;
  expiresAt: string;
}

export type FilingType = 'Gstr1' | 'Gstr3b';

export type FilingStatus = 'Locked' | 'Filed' | 'Submitted' | 'SaveFailed';

export interface GstnSubmitResponse {
  filingId: string;
  status: FilingStatus;
  
  referenceId: string | null;
  
  readyToFile: boolean;
  
  errorReportJson: string | null;
  message: string;
}

export interface Filing {
  filingId: string;
  type: FilingType;
  period: string;
  status: FilingStatus;
  ackNo: string | null;
  filedOn: string | null;
  createdOn: string;
  referenceId: string | null;
  submittedOn: string | null;
  filedBy: string | null;
}

export interface FilingDetail extends Filing {
  payloadJson: string;
  errorReportJson: string | null;
}

export interface MarkFiledCommand {
  ackNo: string;
  filedOn?: string;
}

export interface TenantSettings {
  showBankDetails: boolean;
  showSignature: boolean;
  logoPath: string | null;
  invoiceFooterText: string | null;
  termsAndConditions: string | null;
}

export interface ErpProfile {
  salesHeaderTable: string;
  salesDocId: number | null;
  salesLineTable: string;
}

export interface SpProfile {
  outwardSP: string | null;
  inwardSP: string | null;
}

export type MappingTaxMode = 'IGST' | 'CGSTSGST' | 'AUTO';

export interface DocumentMapping {
  mappingId: number;
  gstCategory: string;
  displayName: string;
  headerTable: string;
  lineTable: string;
  docTypes: string | null;
  subTypes: string | null;
  isOutward: boolean;
  sortOrder: number;
  taxMode: MappingTaxMode;
  isActive: boolean;
}

export interface DiscoveredDocType {
  docType: number;
  subType: number;
  docName: string;
  documentCount: number;
  firstDate: string | null;
  lastDate: string | null;
  
  headerTable: string;

  countsByTable?: Record<string, number> | null;
}

export interface DocTypeDiscoveryResponse {
  
  headerTable: string;
  docTypes: DiscoveredDocType[];
}

export interface KnownTableInfo {
  name: string;
  kind: 'header' | 'line';
  description: string;
  
  exists: boolean;
}

export interface KnownTablesResponse {
  headerTables: KnownTableInfo[];
  lineTables: KnownTableInfo[];
}

export interface EWayBillResponse {
  ewbId: string;
  invoiceId: string;
  ewbNumber: string;

  invoiceNo: string | null;
  generatedDate: string;
  validUntil: string;
  fromGSTIN: string;
  fromAddress: string;
  toGSTIN: string;
  toAddress: string;
  transporterGSTIN: string;
  transporterName: string;
  vehicleNumber: string;
  distance: number;
  mode: string;       
  status: string;     
  cancelledOn: string | null;
  cancelReason: string | null;
  createdOn: string;
  source: string;     
}

export interface GenerateEWayBillRequest {

  vehicleNumber?: string;
  distance?: number;
  mode?: 'Road' | 'Rail' | 'Air' | 'Ship';
  transporterName?: string;
  transporterGSTIN?: string;
  fromAddress?: string;
  toAddress?: string;
}

export interface WhiteBooksStatus {
  enabled: boolean;
  useSandbox: boolean;
  hasCredentials: boolean;
  environment: string;
  clientId: string | null;
  username: string | null;
  hasPassword: boolean;
  gstin: string | null;
}

export interface WhiteBooksConfigCommand {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  useSandbox: boolean;
  gstin?: string;
}

export interface WhiteBooksSandboxInfo {
  username: string;
  clientId: string;     
  gstin: string;
  email: string;
  isConfigured: boolean;
}

export interface WhiteBooksGstStatus {
  enabled: boolean;
  hasCredentials: boolean;
  clientId: string | null;
  baseUrl: string;
  username: string | null;
  hasPassword: boolean;
  gstin: string | null;
}

export interface WhiteBooksGstConfigCommand {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  gstin?: string;
}

export interface SmtpStatus {
  host: string | null;
  port: number;
  username: string | null;
  fromName: string | null;
  fromEmail: string | null;
  enableSsl: boolean;
  hasPassword: boolean;
  isConfigured: boolean;
}

export interface SmtpConfigCommand {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  enableSsl: boolean;
}

export interface CompanyInfo {
  companyName: string;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  bankName: string | null;
  accountNo: string | null;
  ifscCode: string | null;
  branchName: string | null;
  email: string | null;
  pinCode: string | null;
  iECode: string | null;
  bankAccName: string | null;
}

export interface CarolEmployee {
  emplId: number;
  emplCode: string;
  displayName: string;
  isAssigned: boolean;
}

export interface UserRole {
  userRoleId: number;
  emplId: number;
  emplCode: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  createdOn: string;
}

export interface AddUserRoleCommand {
  emplId: number;
  emplCode: string;
  displayName?: string;
  role: string;
}

export type IRNLifecycleStatus = 'Generated' | 'Cancellable' | 'Locked' | 'Cancelled';

export interface IRNResponse {
  irnId: string;
  invoiceId: string;
  billId: number | null;
  invoiceNo: string;
  irnNumber: string;
  qrCode: string;
  acknowledgementNo: string;
  acknowledgementDate: string;
  signedInvoice: string;
  status: string;
  cancelledOn: string | null;
  cancelReason: string | null;
  cancelRemarks: string | null;
  emailSentOn: string | null;
  emailSentTo: string | null;
  jsonDownloadedOn: string | null;
  createdOn: string;
  source: string;
  lifecycleStatus: IRNLifecycleStatus;
  isCancellable: boolean;
  isStub: boolean;
  ageHours: number;
  timeRemaining: string;
}
