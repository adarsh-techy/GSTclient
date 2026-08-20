# GSTAutoPilot — Enterprise GST Compliance, E-Invoicing & Filing Automation Platform
**Comprehensive Client & Technical Reference Manual**

---

## 1. Executive Summary & Project Mission

### What is GSTAutoPilot?
**GSTAutoPilot** is an enterprise-grade, all-in-one GST compliance and automation platform built to bridge enterprise ERPs (such as CarolERP / SQL Server enterprise systems) with the **Government of India GSTN Portal** and the **Invoice Registration Portal (IRP)**.

### Why was this project created? (The Business Problem)
Enterprise organizations and multi-company groups face critical operational bottlenecks:
1. **Manual Invoicing & Portal Re-entry:** Staff spend hours manually copying invoice data into govt portals to generate e-Invoices (IRN) and e-Way Bills.
2. **ITC (Input Tax Credit) Leakage:** Thousands to crores of rupees are lost every month because vendors fail to file their GSTR-1, or make data errors. Without automated GSTR-2B vs ERP book matching, companies either overpay tax or face GST department notices with heavy penalties and interest.
3. **Filing Delays & Complexity:** Monthly returns (GSTR-1 and GSTR-3B) require painful aggregation, HSN summarization, B2B/B2C categorization, and tax set-off calculations.
4. **Disjointed Systems:** Import of Goods (Bill of Entry / ICEGATE) and transport logistics (e-Way Bills) are usually handled across disparate disconnected spreadsheets.

### How GSTAutoPilot Solves This (The Solution)
GSTAutoPilot **automates the entire GST lifecycle in 1-Click**:
- **Automated e-Invoicing (IRN):** Generates 64-character IRN, signed QR code, and digitally signed JSON in sub-seconds directly from ERP sales transactions.
- **Integrated e-Way Bills:** Generates Part-A & Part-B e-Way Bills, updates vehicle numbers in transit, and monitors validity.
- **Smart 4-Way Reconciliation Engine:** Automatically matches ERP purchase books with live GSTR-2B data from the GST portal + Customs Bill of Entry (IMPG), flagging exact mismatches and ITC risks with AI explanations.
- **Direct 1-Click Return Filing:** Saves, locks, and files GSTR-1 and GSTR-3B directly to the GSTN portal via WhiteBooks GSP APIs using secure OTP verification.
- **AI GST Statutory Advisor:** An embedded AI assistant that analyzes live company books and statutory returns, answers compliance questions, and checks filing readiness.

---

## 2. Core Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────────┐
   │                     GSTAutoPilot Web UI                    │
   │      (React 18 + TypeScript + Vite + TailwindCSS +         │
   │          Lucide Icons + Recharts + React Query)            │
   └─────────────────────────────┬──────────────────────────────┘
                                 │ REST API (JWT + Tenant Headers)
   ┌─────────────────────────────▼──────────────────────────────┐
   │                  GSTAutoPilot Backend API                  │
   │               (.NET / ASP.NET Core Web API)                │
   └───────┬─────────────────────┬───────────────────────┬──────┘
           │                     │                       │
 ┌─────────▼─────────┐ ┌─────────▼───────────┐ ┌─────────▼────────────┐
 │  CarolERP / DB    │ │ WhiteBooks IRP/GSP  │ │  SMTP Email Relay    │
 │ (Stored Procs /   │ │ (e-Invoice, GSTR-2B,│ │ (Customer Invoices   │
 │ Table Mapping)    │ │ GSTR-1/3B Filing)   │ │  & JSON Dispatch)    │
 └───────────────────┘ └─────────────────────┘ └──────────────────────┘
```

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Query (@tanstack/react-query), Recharts (data visualization), React Router DOM, Custom Context (Auth, Theme, Multi-Company).
- **Backend:** ASP.NET Core Web API, multi-tenant architecture, Stored Procedure execution engine (`outwardSP`, `inwardSP`), dynamic table mapping fallback, AES-256 encrypted credential vault.
- **GSP/IRP Partner:** **WhiteBooks API** (GST Suvidha Provider & IRP gateway) with dual Production and Sandbox environments.

---

## 3. Detailed Page-by-Page & Functionality Guide

---

### Page 1: Dashboard (`/`)
*The Executive GST Command Center giving a real-time overview of monthly statutory liability, ITC position, filing readiness, and reconciliation health.*

#### Header & Global Controls:
- **Financial Period Selector:** Dropdown to switch between financial months (e.g. `2026-05`, `2026-06`) populated dynamically from CarolERP transactional data.
- **Company Branch Filter:** Switch between specific company entities or view consolidated group totals.
- **IRN Deadline Banner:** Real-time top alert monitoring any un-generated e-invoices or pending statutory deadlines.

#### KPI Cards:
1. **Net Tax Payable:** Displays exact net cash liability after adjusting output tax against eligible Input Tax Credit (ITC). Shows a green badge (`✓ Ready to file`) or warning badge with unresolved issue count.
2. **Output GST:** Total GST collected on sales, total invoice count, and total taxable turnover.
3. **Eligible ITC (GSTR-2B):** Verified ITC claimable from government portal, including import IGST breakdown.
4. **Recon Health:** Real-time summary showing `All Clear` (100% matched) or number of discrepancies.
5. **Carry-Forward Credit:** Excess Input Tax Credit carried forward to the next tax period.

#### Interactive Charts & Visualizations:
- **Tax Position Overview (Bar Chart):** Visual comparison of Output GST vs. Eligible ITC vs. Net Payable.
- **GSTR-2B Reconciliation Breakdown (Donut Chart):** Interactive breakdown of Matched (Green), Mismatched (Amber), Missing in Books (Red), and Not in 2B (Purple).
- **12-Month Sales vs. Purchases Trend:** Monthly volume trend comparison.
- **Top 6 Customers by Taxable Turnover:** High-value B2B client ranking.

#### Statutory Return Filing Status Strip:
- Real-time status cards for **GSTR-1** and **GSTR-3B** (Draft / Saved / Locked / Filed) with 1-click action buttons to jump directly to filing.

---

### Page 2: Invoices (`/invoices`)
*The central Sales & E-Invoicing management console for generating IRNs, printing official tax invoices, and issuing e-Way bills.*

#### Filters & Search Controls:
- **Period Selector:** Filter invoices by billing month.
- **Search Bar:** Real-time instant search by Invoice Number, Buyer Party Name, or Buyer GSTIN.
- **Section Filter:** Dropdown to filter by `All`, `B2B`, `Export`, `B2CL` (B2C Large), `B2CS` (B2C Small), `CDN` (Credit/Debit Notes).
- **e-Invoice Status Filter:** Filter by `All`, `Generated` (IRN Active), `Required/Pending`, `NA`.
- **Company Filter:** Multi-company branch selector.

#### Action Buttons & Toolbar:
- **Bulk Actions Bar:**
  - Select all eligible B2B invoices in 1 click.
  - **Bulk Generate IRN:** Generates government e-Invoices in batches with rate-limiting protection.
  - **Bulk Email JSON:** Sends signed e-Invoice JSON and invoice PDFs to buyers in bulk.
- **Export to Excel (`.xlsx`):** Downloads complete invoice register with full line-item tax details.

#### Table Columns & Per-Row Functions:
1. **Selection Checkbox:** For batch/bulk operations.
2. **Company:** Company branch name and ID.
3. **Bill ID / Invoice No:** Clickable link opening line-item invoice drawer with full HSN, rates, quantity, and tax splits.
4. **Invoice Date & Buyer Details:** Party Name, State, and GSTIN (with color-coded state tags).
5. **Section & GST Category:** Statutory categorization (B2B, Export, LocalSales, InterStateSales).
6. **Financials:** Taxable Value, CGST, SGST, IGST, Round-Off adjustment, Total Amount.
7. **e-Invoice Status:** Status badge (Active IRN, Pending, Exempt).
8. **e-Way Bill Status:** Status of linked transit permit.
9. **Row Actions (Icon Toolbar):**
   - ⚡ **Generate IRN:** 1-Click call to WhiteBooks IRP to register the invoice and receive the 64-char IRN & signed QR code.
   - 🖨️ **Print Tax Invoice PDF:** Generates a professional, print-ready PDF in a new tab complete with official company logo, IRN hash, QR code, bank details, and digital signature block.
   - 📥 **Download Signed JSON:** Downloads official govt-signed IRP JSON file.
   - 🖼️ **Download QR Code:** Downloads high-res QR code PNG image.
   - ✉️ **Email e-Invoice:** Modal to email PDF + JSON directly to client with custom remarks.
   - 🚫 **Cancel IRN:** Opens cancellation modal (Reason: Duplicate / Data Entry Error / Order Cancelled) within the statutory 24-hour window.
   - 🚚 **Generate e-Way Bill:** Opens transit modal to enter Vehicle No, Transporter ID, Mode (Road/Rail/Air/Ship), and Distance to generate EWB instantly.
   - 🔄 **Update EWB Vehicle:** Updates vehicle number for goods in transit.

---

### Page 3: e-Invoice History (`/einvoice-history`)
*The statutory e-invoicing audit log and 24-hour cancellation deadline monitor.*

#### Features & Functions:
- **IRN Lifecycle Status:** Tracks each e-invoice through `Generated` -> `Cancellable` (active countdown) -> `Locked` (past 24 hrs) -> `Cancelled`.
- **24-Hour Countdown Timer:** Displays remaining hours/minutes during which an IRN can be cancelled on the government portal.
- **Full 64-Character IRN Copy Tool:** 1-Click copy to clipboard with toast notification.
- **Ack Number & Timestamp:** Official government acknowledgement number and IRP generation timestamp.
- **Dispatch Audit:** Visual indicators showing if the invoice has been emailed to the customer and if the signed JSON has been archived.
- **Filters:** Filter by status (All, Cancellable, Locked, Cancelled), search by Invoice # or IRN hash.

---

### Page 4: e-Way Bills (`/ewaybills`)
*The transport logistics and goods movement tracking register.*

#### Features & Functions:
- **KPI Summary:** Active e-Way Bills, Expired EWBs, Cancelled EWBs, Total Transits.
- **Table Columns:** EWB Number, Associated Invoice #, Generated Date, Validity Expiry Date, From GSTIN/Address, To GSTIN/Address, Transporter Name & ID, Vehicle Number, Distance (KM), Transport Mode.
- **Real-Time Expiry Status:** Visual badge showing whether the transit permit is Active, Expired, or Cancelled.
- **Update Vehicle Number in Transit:** Modal to update vehicle registration when transshipment occurs or breakdowns happen.
- **Cancel e-Way Bill:** Cancel transit permits before validity starts.

---

### Page 5: GSTR-1 (`/gstr1`)
*The comprehensive Outward Supplies Return preparation, audit, and direct filing hub.*

#### Tabbed Sections:
1. **Summary Tab:** Aggregate turnover, tax liability (CGST/SGST/IGST), and invoice count grouped by customer.
2. **B2B Invoices Tab:** All registered sales with GSTIN validation.
3. **Export Invoices Tab:** Direct exports, SEZ supplies with/without payment of tax, port codes, and shipping bill details.
4. **B2C Large (B2CL) Tab:** Inter-state unregistered sales exceeding ₹2.5 Lakhs.
5. **B2C Small (B2CS) Tab:** Consolidated intra-state and inter-state retail sales summarized by Place of Supply and GST rate (5%, 12%, 18%, 28%).
6. **Credit / Debit Notes (CDN) Tab:** Registered and unregistered credit notes and adjustments.
7. **HSN / Docs Summary Tab:**
   - **Table 12 (HSN Summary):** HSN Code, Description, UQC (Unit Quantity Code), Total Quantity, Taxable Value, and Rate-wise Tax split.
   - **Table 13 (Documents Issued):** Serial number range of invoices, credit notes, and cancellation count.

#### Direct GSTN Portal Filing Controls:
- **Save to GST Portal (`retsave`):** Transmits compiled GSTR-1 JSON directly into the GSTN portal draft.
- **Submit / Lock Return:** Locks the return on the portal to prevent tampering.
- **File with OTP (EVC):** Prompts for GST portal OTP and files the official return, receiving an instant government ARN (Acknowledgement Reference Number).
- **Download GSTN JSON:** Downloads the official GSTN-compliant JSON file for manual offline portal utility upload if desired.
- **Export to Excel (`.xlsx`):** Complete multi-tab GSTR-1 spreadsheet export.

---

### Page 6: GSTR-2B (`/gstr2b`)
*The Inward Supplies & Auto-Drafted ITC statement directly synced from the GST Portal.*

#### Features & Functions:
- **Live "Fetch from GSTN" Button:** Connects to the GST portal via WhiteBooks GSP, requests an OTP if session expired, and downloads the official auto-drafted GSTR-2B statement.
- **Tabbed Record Views:**
  1. `All Records`: Consolidated inward supplies.
  2. `B2B Invoices`: Standard vendor purchase invoices.
  3. `Credit / Debit Notes (CDNR)`: Supplier credit/debit adjustments reducing or increasing ITC.
  4. `Import of Goods (IMPG)`: ICEGATE customs port imports.
  5. `ISD Credit`: Input Service Distributor credit allocations.
- **KPI Metrics:** Total ITC Available, B2B ITC, CDNR Net Adjustments, IMPG Customs ITC.
- **Search & Filters:** Real-time search by supplier name, supplier GSTIN, or invoice number.

---

### Page 7: Reconciliation (`/recon`)
*The 4-Way Automated Reconciliation Engine matching ERP Purchase Books vs. GSTR-2B vs. Customs Bill of Entry.*

#### How the Matching Engine Works:
The algorithm compares every purchase entry in CarolERP books against GSTR-2B government data across 4 criteria:
1. **Supplier GSTIN**
2. **Invoice / Document Number** (with fuzzy matching for prefix/suffix formatting)
3. **Invoice Date & Tax Period**
4. **Taxable Value & GST Tax Amounts** (CGST, SGST, IGST)

#### Reconciliation Status Categories:
- 🟢 **Matched:** Exact match between ERP purchase register and GSTR-2B. ITC is 100% safe to claim.
- 🟡 **Mismatch:** Invoice found in both, but tax amount or taxable value differs (e.g. vendor filed ₹1,800 IGST instead of ₹18,000).
- 🔴 **Missing in Books:** Vendor filed on GSTN portal, but company accountant hasn't entered the purchase bill in ERP books (unclaimed credit!).
- 🟣 **Not in GSTR-2B:** Company booked the purchase and paid the vendor, but the vendor has **NOT filed their GSTR-1** (High Risk: ITC will be blocked by GST department).

#### AI Remarks & Actions:
- **AI Automated Explanations:** Explains the exact discrepancy for each line (e.g., *"Vendor filed under CGST/SGST instead of IGST"*, *"Rounding error of ₹0.50"*).
- **"Run Reconciliation" Button:** Re-runs the full matching algorithm on demand.
- **Export Recon Report (`.xlsx`):** Complete audit spreadsheet to send to defaulting vendors demanding they file their pending returns.

---

### Page 8: GSTR-3B (`/gstr3b`)
*The Monthly Summary Return, Tax Liability, and ITC Auto-Settlement Engine.*

#### Statutory Return Structure:
- **Table 3.1 — Outward Supplies & Reverse Charge:**
  - (a) Outward Taxable Supplies (other than zero-rated, nil, and exempt).
  - (b) Outward Taxable Supplies (Zero-rated / Exports).
  - (c) Other Outward Supplies (Nil-rated, Exempted).
  - (d) Inward Supplies liable to Reverse Charge (RCM).
  - (e) Non-GST Outward Supplies.
- **Table 4 — Eligible Input Tax Credit (ITC):**
  - Import of Goods (auto-populated from Bill of Entry & ICEGATE).
  - Import of Services.
  - Inward supplies liable to Reverse Charge.
  - Inward supplies from ISD.
  - All Other ITC (auto-populated from reconciled GSTR-2B).
  - Ineligible ITC under section 17(5) (blocked credits).
- **Table 5.1 & Table 6 — Net Tax Payable & Tax Set-Off:**
  - Automated statutory set-off hierarchy: IGST credit used against IGST -> CGST -> SGST, followed by CGST and SGST credits.
  - Calculates final **Net Cash Tax Payable** (Challan amount) or **Carry-Forward ITC**.

#### Actions:
- Direct Save to Portal, Lock, and OTP Filing.
- Download GSTR-3B GSTN JSON and Excel report.

---

### Page 9: Bill of Entry (`/bill-of-entry`)
*Customs Imports & Overseas Duty Management for Import of Goods (IMPG).*

#### Features & Functions:
- Capture and manage customs documents: **BOE Number, BOE Date, Port Code, Overseas Supplier, Assessable Value, IGST Paid at Customs, and Cess**.
- Directly feeds into **GSTR-3B Table 4(A)(1)** and reconciles with GSTR-2B ICEGATE entries.
- Add, edit, delete, and filter customs import records.

---

### Page 10: Filings Audit Register (`/filings`)
*The Central Statutory Filing History, ARN Archive, and Return Filing Wizard.*

#### Features & Functions:
- **"File All Returns Wizard":** A guided 3-step wizard that walks the tax officer through GSTR-1 review -> GSTR-2B Recon check -> GSTR-3B filing in one seamless sequence.
- **Statutory Audit Log:** Permanent record of all return submissions, status (`Filed`, `Submitted`, `Locked`, `SaveFailed`), Acknowledgement Reference Numbers (ARN), filing timestamps, and filed-by usernames.
- **Manual Mark as Filed:** Option to record offline filings with external ARN.

---

### Page 11: User Management (`/users`)
*Role-Based Access Control (RBAC) integrated with CarolERP employee masters.*

#### Role Hierarchy:
1. **Admin:** Full permissions — generate/cancel IRNs, generate/cancel EWBs, file returns to GST portal, manage database mappings and API credentials.
2. **User:** Operational permissions — generate IRNs, print PDFs, view reports, execute reconciliation.
3. **ReadOnly:** Auditor / Viewer permissions — inspect dashboards and export spreadsheets without modification rights.
- Seamlessly maps CarolERP employee codes (`Empl` table) into GSTAutoPilot users.

---

### Page 12: Settings & Configuration (`/settings`)
*The Administrative Control Center for Company Masters, Print Customization, APIs, Email, and Database Mappings.*

#### 5 Configuration Tabs:
1. **Company Profile & Logo:**
   - Displays read-only registered details from CarolERP master (Company Name, GSTIN, PAN, Bank Details, IFSC, Address).
   - **Upload / Delete Official Tenant Logo:** High-res logo uploaded here appears automatically on all generated Tax Invoice PDFs.
2. **Invoice Print Defaults:**
   - Toggle Show Bank Details on invoice PDF.
   - Toggle Show Authorized Signature block.
   - Set custom Invoice Footer text and Terms & Conditions.
3. **WhiteBooks & GST APIs:**
   - **WhiteBooks e-Invoicing API (IRP):** Client ID, Client Secret, Username, Password, Target GSTIN.
   - **Environment Switch:** 1-Click toggle between **Production** and **Shared Sandbox** (BVMGSP Sandbox) with live "Test Sandbox Connection" ping.
   - **WhiteBooks GST Portal API (GSP):** Client credentials for direct GSTN return filing and GSTR-2B fetching.
4. **Email (SMTP) Service:**
   - Configure SMTP Host, Port (587 / 465), Username, Password, Sender Name, Sender Email, and SSL toggle.
   - "Send Test Email" diagnostic tool.
5. **Database SPs & Document Mapping Engine:**
   - **Stored Procedure Profiles:** Set custom stored procedures (`outwardSP`, `inwardSP`) to query high-speed ERP views directly.
   - **Live SP Diagnostic Tool:** Evaluates SP execution, counts 24 months of sales/purchases, checks latency, and reports health (`Green`, `Amber`, `Red`).
   - **Document Mapping Engine:** Map ERP transaction doctypes to GST categories (`LocalSales`, `InterStateSales`, `ExportSales`, `CreditNote`, etc.) with customizable tax modes (`IGST`, `CGSTSGST`, `AUTO`).
   - **Dynamic DocType Discovery:** Auto-scans ERP header tables to identify unmapped transaction codes.

---

### Page 13: Client Onboarding Wizard (`/onboarding`)
*Multi-Tenant Provisioning Wizard for adding new companies or subsidiaries in under 2 minutes.*

- **Step 1: Client Details:** Tenant Name, 15-digit GSTIN, and Schema Flavor profile (e.g. KSCC vs Default).
- **Step 2: Connections & Testing:** Input Application DB connection string and CarolERP database connection string, with live "Test Connection" verification before saving.
- **Step 3: Review & Create:** Summary audit of schema tables, stored procedures, and credentials.
- **Step 4: Activation:** Instant provisioning and activation of the new tenant.

---

## 4. WhiteBooks Sync & Integration Details

### What is WhiteBooks?
WhiteBooks is an authorized **GST Suvidha Provider (GSP)** and **Invoice Registration Portal (IRP)** gateway licensed by the Government of India (GSTN / NIC).

### How GSTAutoPilot Integrates with WhiteBooks:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GSTAutoPilot Platform                          │
└──────────────┬─────────────────────────────┬────────────────────────────┘
               │                             │
    [e-Invoice IRP Gateway]       [GSTN Portal GSP Gateway]
               │                             │
  POST /einvoice/generate        POST /filings/retsave (GSTR-1/3B)
  POST /einvoice/cancel          POST /filings/retfile (OTP EVC)
  GET  /einvoice/status          GET  /gstr2b/fetch (Live 2B)
               │                             │
┌──────────────▼─────────────────────────────▼────────────────────────────┐
│                             WhiteBooks API                              │
│                    (Production & BVMGSP Sandbox)                        │
└──────────────┬─────────────────────────────┬────────────────────────────┘
               │                             │
┌──────────────▼────────┐     ┌──────────────▼────────────────────────────┐
│   NIC / IRP Portal    │     │             GSTN Portal                   │
│ (IRN, QR Code, Hash)  │     │   (Returns, 2B Inward Data, ARNs)         │
└───────────────────────┘     └───────────────────────────────────────────┘
```

#### 1. Real-Time e-Invoicing (IRP API):
- **Instant IRN Generation:** Sends invoice payload compliant with the standard GST e-Invoice Schema (INV-01) to WhiteBooks.
- **Cryptographic Verification:** Receives signed 64-character hash, digitally signed QR code containing key invoice fields, and digital signature.
- **24-Hour Cancellation:** Communicates cancellations back to NIC with mandatory audit reasons.

#### 2. Live GSTR-2B Statement Sync (GSP API):
- GSTAutoPilot requests the auto-drafted ITC statement for the selected period.
- If the 6-hour GSTN auth token has expired, an interactive **OTP Dialog** appears for the user to input the SMS OTP sent to the registered GSTIN mobile/email.
- Stores and caches inward supply records locally for instant reconciliation.

#### 3. 1-Click Return Saving & Filing (GSP API):
- **Draft Save (`retsave`):** Validates and uploads B2B, B2C, HSN, and Docs tables to GST portal drafts.
- **Error Diagnostics:** If GSTN rejects any row (e.g. invalid recipient GSTIN), WhiteBooks returns the raw JSON error report which GSTAutoPilot parses into user-friendly error banners.
- **OTP Return Filing (`retfile`):** Files the locked return using Electronic Verification Code (EVC) and immediately captures the permanent ARN.

#### 4. Dual Environment & Sandbox Testing:
- Full support for **BVMGSP Sandbox** testing. Companies can test their entire e-invoicing and filing workflow with mock invoices without affecting live government portal data.

---

## 5. Other Key Features & Recent Enhancements

1. **AI GST Statutory Advisor (`/advisor/chat`):**
   - Floating AI co-pilot capable of inspecting current period data, checking filing readiness, explaining ITC mismatches, and answering complex GST queries.
2. **Multi-Company Group Support:**
   - Header-level multi-company filtering (`X-Company-Id`) allowing holding groups to manage multiple branches under one tenant.
3. **Automated Notification & Deadline Center:**
   - Top-bar bell icon with priority notifications for upcoming return due dates (11th for GSTR-1, 20th for GSTR-3B) and expiring IRN cancellation windows.
4. **Complete Theme Customizer:**
   - Light Mode, Dark Mode, System Sync, and custom accent color palettes.
5. **Print-Ready PDF Engine:**
   - Generates pixel-perfect Tax Invoices with embedded B2B QR codes, company logos, bank details, and terms.
6. **Robust Error Handling & Resilience:**
   - Contextual error banners with troubleshooting hints, retry triggers, and offline mock fallbacks for high availability.

---

## 6. How to Pitch and Convince Your Client

| Client Pain Point | How GSTAutoPilot Solves It | Client Benefit / ROI |
| :--- | :--- | :--- |
| **Manual Data Entry on Portals** | 1-Click automatic IRN and e-Way Bill generation directly from ERP data. | Saves 80+ hours of manual labor per month; eliminates data entry errors. |
| **Loss of ITC due to Unfiled Vendor Invoices** | Automated 4-Way Reconciliation identifies non-filing vendors and mismatches instantly. | Recovers lakhs/crores in lost Input Tax Credit and eliminates GST notices. |
| **Filing Rush & Portal Crashes** | Direct 1-Click return saving and OTP filing via dedicated WhiteBooks GSP pipes. | No last-minute filing panics or portal timeouts; zero late-fee penalties. |
| **Audit & Compliance Fear** | Complete digital audit log with ARNs, IRN history, and reconciled Excel exports. | 100% audit-proof compliance with official government verification. |
| **Multiple Branch Chaos** | Multi-company consolidation and multi-tenant onboarding wizard. | Single unified platform for all sister companies and branch offices. |
