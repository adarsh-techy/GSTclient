# GST AutoPilot & Compliance Portal
## Complete Non-Technical Client Presentation & Flow Guide

---

## 1. Executive Summary: What is this Platform?

**GST AutoPilot** is an all-in-one, intelligent GST Compliance & Invoicing Management System. It seamlessly bridges your **existing ERP/Billing system** directly with the **Government GST Portal and e-Invoicing (IRN) / e-Way Bill networks**.

### Core Problems Solved for Your Business:
- **No Manual Data Entry:** Automatically pulls sales invoices and purchase bills from your ERP database.
- **Instant e-Invoicing & e-Way Bills:** Generates government-approved IRN, QR codes, and e-Way bills in 1 click.
- **Maximum Tax Savings (ITC):** Fetches supplier filings directly from the GST Portal (GSTR-2B) and automatically reconciles them with your books to ensure zero missed Input Tax Credit.
- **Error-Free Return Filing:** Automatically prepares ready-to-file GSTR-1 and GSTR-3B summaries adhering to government tax rules.
- **Audit-Proof History:** Keeps an indelible audit trail of all filed returns, e-invoices, cancellations, and tax payments.

---

## 2. Where the Journey Starts: End-to-End Business Flow

```
+----------------------------------------------------------------------------------------------------+
|                                    1. DAILY BILLING & SALES                                         |
|  Sales team creates bills in ERP -> Automatically shows on "Invoices" Page                         |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    2. 1-CLICK E-INVOICE & E-WAY BILL                               |
|  Click "Generate IRN" -> Govt IRN & QR Code embedded on Invoice PDF.                                |
|  If transport exceeds threshold -> Click "Generate e-Way Bill" & update vehicle number.            |
|  Click "Send Email" to automatically deliver PDF + XML/JSON to buyer.                              |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    3. MONTH-END PURCHASE MATCHING                                  |
|  Click "Sync from Portal" on GSTR-2B -> Pulls vendor invoices reported to Govt.                    |
|  Click "Run Reconciliation" -> Automatically compares your Purchase Register against GSTR-2B.      |
|  Highlights: Matched, Mismatched amounts, Missing in Books, or Unfiled by Vendor.                   |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    4. GST RETURN FILING (GSTR-1 & 3B)                              |
|  GSTR-1: Review Sales categorization (B2B, B2C, Exports, HSN, Credit Notes) -> Download JSON.     |
|  GSTR-3B: Auto-calculates Net Tax Payable = (Output GST on Sales) minus (Eligible ITC on Purchases)|
|  File returns directly or upload JSON to government portal.                                        |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                    5. COMPLIANCE VAULT & AUDIT TRAIL                               |
|  Archived in "Filings Register" with Government Ack Numbers (ARN) and permanent timestamp logs.    |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Global Navigation & Top Bar Controls

At the top and side of every page, the user has global controls:

1. **Company Switcher (Header & Sidebar):**
   - *Purpose:* Allows multi-branch or group companies to switch between different GSTIN accounts with 1 click.
2. **Tax Period Selector (`Month - Year` dropdown):**
   - *Purpose:* Selects the active filing month (e.g., `Apr 2026`, `May 2026`). All figures, tables, and analytics automatically update for that chosen period.
3. **Theme Toggle (Light / Dark Mode):**
   - *Purpose:* Switches between clean daylight view and eye-friendly dark mode for late-night accounting.
4. **User Profile & Logout:**
   - *Purpose:* Shows logged-in user details, assigned role (*Admin*, *User*, or *ReadOnly*), and secure logout button.

---

## 4. Detailed Page-by-Page Breakdown

---

### Page 1: Login & Access Security (`/login`)
- **Purpose:** Secure entry point to the system. Protects confidential tax numbers and financial data.
- **Who uses it:** All employees, accountants, and administrators.
- **Key Elements:**
  - **Username & Password input fields:** Verifies identity against corporate employee records.
  - **Remember Me / Session Persistence:** Keeps active sessions securely logged in during work hours.
  - **Login Button:** Authenticates and routes the user directly to the Executive Dashboard.

---

### Page 2: Executive Dashboard (`/`)
- **Purpose:** Gives company executives, CFOs, and tax managers an instant birds-eye view of their tax health, sales performance, and upcoming government filing deadlines.

#### A. Top KPI Cards:
- **Total Output GST:** Total sales tax liability collected on goods & services.
- **Eligible ITC (Input Tax Credit):** Total tax refund credit available from purchase bills to offset liability.
- **Net Tax Payable:** Exact final cash amount required to pay the government (`Output Tax` minus `Eligible ITC`).
- **Reconciliation Health Score:** Percentage of purchase bills safely matched with government records.
- **Active e-Invoices:** Total IRNs generated in the selected period.

#### B. Charts & Visuals:
- **Sales vs Purchase Trend (Bar Chart):** 12-month historical comparison of billing volume.
- **Top 6 Customers by Revenue (Bar/List):** Identifies highest revenue clients.
- **ITC Matching Breakdown (Pie Chart):** Visual breakdown of Matched vs Mismatched purchase bills.
- **Tax Position Gauge:** Visual comparison of Sales GST vs Claimable ITC.

#### C. Banners & Deadlines:
- **e-Invoice 24-Hour Cancellation Warning Banner:** Highlights recently generated e-invoices approaching the 24-hour government cancellation window.
- **Filing Readiness Indicator:** Shows green "Ready to File" badge or alerts you if mismatch discrepancies need review.

---

### Page 3: Sales Invoices & E-Invoicing Hub (`/invoices`)
- **Purpose:** The main daily working screen for the billing and accounting team. Displays all sales bills created in the ERP and provides 1-click government integrations.

#### A. Status Tabs & Filters:
- **All:** Full list of all sales invoices.
- **IRN Generated:** Invoices that already possess a government-registered IRN & QR code.
- **IRN Pending:** Invoices waiting for e-invoice generation.
- **Cancelled:** Invoices whose IRNs have been cancelled within 24 hours.
- **e-Way Bill Generated:** Consignments with active transport movement passes.
- **Search Bar:** Quickly search by Invoice Number, Customer Name, or Buyer GSTIN.

#### B. Summary Statistics Cards:
- Displays **Invoice Count**, **Total Taxable Value**, **Total GST**, and **IRN Progress Bar**.

#### C. The Invoices Table:
- **Bill Number & Date:** ERP invoice reference and issuance date.
- **Party Name & GSTIN:** Customer trade name with state code validation badge.
- **Supply Type:** Categorized as B2B (Business), B2C (Consumer), or Export.
- **Taxable Value & Tax Breakdown:** CGST, SGST, IGST split-up and total gross bill amount.
- **IRN Status Badge:**
  - `Generated (Green)`: Valid Government IRN active.
  - `Pending (Amber)`: Needs generation.
  - `Cancelled (Red)`: Cancelled on government portal.
- **e-Way Bill Status Badge:** Shows EWB Number and active transit validity.

#### D. Table Action Buttons (Per Row):
| Button / Icon | Action Name | What It Does (Client Explanation) |
| :--- | :--- | :--- |
| **Lightning Bolt ⚡** | *Generate IRN* | Sends bill payload to the Govt IRP portal in real-time, receives 64-character IRN, QR Code, and digital signature. |
| **PDF Icon 📄** | *Download / View PDF* | Opens a tax-compliant Invoice PDF containing the official Govt QR Code, your company logo, and bank details. |
| **Code Icon `{}`** | *Download Signed JSON* | Downloads the raw digitally signed JSON certificate received from the government. |
| **QR Icon 📱** | *Download QR Code* | Downloads high-resolution QR code image for packaging or physical printing. |
| **Truck Icon 🚚** | *Generate e-Way Bill* | Opens modal to input transport details (Transporter ID, Vehicle Number, Distance) to create an official transit pass. |
| **Edit Vehicle 🔄** | *Update Vehicle (Part-B)* | Updates the truck/lorry number on an existing e-Way bill if the vehicle changed during transit. |
| **Email Icon ✉️** | *Email Invoice* | Sends the final invoice PDF and signed e-invoice directly to the customer's billing email. |
| **Trash / Cross ❌** | *Cancel IRN* | Opens cancellation modal (Reason: Wrong Data / Order Cancelled / Duplicate) within the allowed 24-hour window. |

#### E. Bulk Operations Bar:
- **Checkbox Selection:** Select all or multiple pending invoices.
- **"Generate Selected IRNs" Button:** Generates e-invoices for hundreds of bills in bulk without repetitive clicking.
- **"Export to Excel / CSV" Button:** Downloads formatted spreadsheet for reporting and auditing.

---

### Page 4: e-Invoice History & Audit Trail (`/einvoice-history`)
- **Purpose:** A dedicated audit register that tracks the lifecycle, timing, and cancellation validity of all generated e-invoices.
- **Key Features:**
  - **Live 24-Hour Countdown Clock:** Displays exactly how many hours and minutes remain before an IRN becomes permanently locked against cancellation.
  - **Status Badges:**
    - `Cancellable (Flashing Amber)`: Can still be cancelled if a mistake occurred.
    - `Locked (Slate)`: Passed 24-hour mark; permanently archived in government records.
    - `Cancelled (Red)`: Officially cancelled with cancellation reason and timestamp.
  - **Table Columns:** Ack No, Ack Date, Invoice No, Customer GSTIN, 64-char IRN hash, QR Code preview, and quick download actions.

---

### Page 5: e-Way Bills Transit Hub (`/ewaybills`)
- **Purpose:** Manages road transport passes required for moving goods valued above statutory limits.
- **Key Features:**
  - **Status Tabs:** *All*, *Active* (currently in transit), *Expired* (delivery window closed), and *Cancelled*.
  - **Vehicle Monitoring:** Displays current vehicle registration number (Part-B) and transport mode (Road / Rail / Air / Ship).
  - **Distance & Validity Tracker:** Shows total kilometers and remaining validity hours for transit.
  - **Action Buttons:**
    - `Update Vehicle`: Allows updating vehicle registration number if a breakdown or transshipment occurs.
    - `Cancel e-Way Bill`: Cancels transit pass if goods movement is called off.
    - `Print EWB slip`: Generates print-ready driver slip with barcode.

---

### Page 6: GSTR-1 Monthly Outward Returns (`/gstr1`)
- **Purpose:** Compiles all outgoing sales data into official Government GSTR-1 filing tables. Ensures every single rupee of sales tax is accurately mapped.

#### A. Section Tabs (Official Govt Tax Categorization):
1. **Summary:** Consolidated turnover, total taxable amount, and taxes across all categories.
2. **B2B Invoices (Table 4A, 4B, 4C, 6B, 6C):** Regular registered business-to-business sales with buyer GSTIN.
3. **Export Invoices (Table 6A):** Direct foreign exports and SEZ supplies (With Tax / Without Tax Payment).
4. **B2C Large (Table 5A, 5B):** High-value inter-state sales to unregistered retail customers (> ₹2.5 Lakhs).
5. **B2C Small (Table 7):** State-wise summary of intra-state and standard consumer retail sales.
6. **Credit / Debit Notes (Table 9B):** Sales returns, post-sale discounts, or rate adjustments.
7. **HSN / Docs Summary (Table 12 & 13):** Mandatory 6/8-digit HSN code summary and sequence range of serial numbers issued.

#### B. Page Action Buttons:
- **"Generate GSTN JSON" Button:** Creates the official, validated `.json` payload ready to be uploaded directly into `gst.gov.in`.
- **"Export to Excel" Button:** Downloads pre-formatted multi-sheet Excel matching the government offline utility template.
- **"File / Lock Status" Control:** Tracks return status through `Draft` -> `Verified` -> `Filed`.

---

### Page 7: GSTR-2B Input Tax Credit (ITC) Portal Sync (`/gstr2b`)
- **Purpose:** Automatically pulls inward purchase bills uploaded by your suppliers to the government portal. This is the **foundation for claiming tax deductions (ITC)**.

#### A. Live Government Portal Sync:
- **"Sync from GST Portal" Button:** Connects to GSTN via secure OTP authentication and fetches real-time monthly GSTR-2B statements.

#### B. Inward Record Categories:
- **B2B Invoices:** Regular supplier purchases.
- **CDNR (Credit/Debit Notes):** Reductions or adjustments from vendors.
- **IMPG (Import of Goods):** ICEGATE customs port clearance bills.
- **ISD (Input Service Distributor):** Head-office distributed tax credits.

#### C. Summary & Action Badges:
- **Eligible ITC:** Green badge indicating tax amounts you can legally deduct against sales liability.
- **Ineligible ITC (Section 17(5)):** Blocked credits (e.g., food, club memberships, personal vehicles) automatically flagged to prevent tax penalties.

---

### Page 8: GSTR-3B Monthly Return Summary (`/gstr3b`)
- **Purpose:** The final monthly tax computation sheet. It combines Output Tax (from GSTR-1) and Input Credit (from GSTR-2B) to tell you **the exact net tax payable in cash**.

#### A. Key Computation Cards:
- **Total Tax on Outward Supplies (Liability):** CGST + SGST + IGST on sales.
- **Total Eligible ITC Claimed (Credit):** Total tax refund deduction from purchase invoices.
- **Inward Reverse Charge (RCM):** Purchases where buyer is liable to pay tax directly.
- **Net Cash Tax Payable:** The final remaining balance to be paid via bank challan.

#### B. Official Tables Displayed:
- **Table 3.1:** Details of Outward Supplies and inward supplies liable to reverse charge.
- **Table 3.2:** Inter-state supplies made to unregistered persons and composition dealers.
- **Table 4:** Eligible Input Tax Credit (ITC Available, Reversed, and Ineligible).
- **Table 5:** Values of exempt, nil-rated, and non-GST inward supplies.

#### C. Action Buttons:
- **"Export GSTR-3B JSON":** Generates filing file for government portal.
- **"Export Summary PDF/Excel":** For internal management sign-off and auditor review.

---

### Page 9: Bill of Entry (Imports Customs ITC) (`/bill-of-entry`)
- **Purpose:** Manages import shipments cleared through sea/air ports. Allows businesses to record and claim customs IGST and compensation cess.
- **Key Elements:**
  - **"Add Bill of Entry" Button:** Opens entry form for Port Code (e.g., INCOK1, INMAA1), Bill of Entry Number, Date, Assessable Value, Customs IGST, and Cess.
  - **Table Columns:** BOE Number, Port, Overseas Supplier Name, Assessable Value, IGST Paid, Status.
  - **Edit & Delete Action Buttons:** Allows modifying customs entries before finalizing monthly returns.

---

### Page 10: 3-Way Auto Reconciliation (`/recon`)
- **Purpose:** **The most valuable feature of the system.** Automatically cross-references your internal ERP Purchase Register with the Government GSTR-2B portal statement.

#### A. The 4 Reconciliation Buckets:
1. **Matched (Green):** Invoice number, date, vendor GSTIN, and tax amounts match perfectly. Ready for 100% safe ITC claim.
2. **Mismatch (Amber):** Invoice exists on both sides, but tax amounts or invoice numbers have slight discrepancies (e.g., vendor entered ₹10,500 instead of ₹10,050).
3. **Missing in Books (Red):** Vendor filed the invoice on the portal, but your accounts team hasn't entered the purchase bill in your ERP yet.
4. **Not in 2B (Purple):** You have paid the vendor and entered the bill, but the **vendor failed to file their GSTR-1**. Alerts you to hold vendor payment until they file.

#### B. Page Action Buttons:
- **"Run Reconciliation" Button:** 1-click execution that recalculates all matches in seconds.
- **"Export Reconciliation Report" Button:** Downloads detailed Excel file containing vendor-wise mismatch sheets to email directly to defaulter suppliers.

---

### Page 11: Filings Register & Compliance Vault (`/filings`)
- **Purpose:** The permanent compliance vault and historical filing archive.
- **Key Features:**
  - **Financial Year Filter:** Select any past year (e.g., `2024-25`, `2025-26`) to view historical compliance records.
  - **Filing History Table:** Displays Return Type (GSTR-1 / GSTR-3B), Period, Date of Filing, Acknowledgement Reference Number (ARN), and Status.
  - **"File All Returns Wizard" Button:** Step-by-step guided workflow to review GSTR-1, lock GSTR-2B, preview GSTR-3B, and mark returns as filed.

---

### Page 12: Client Onboarding (`/onboarding`) *(Admin Only)*
- **Purpose:** Allows administrators to onboard new client companies, branches, or sister concerns into the portal in minutes.
- **4-Step Wizard:**
  1. **Step 1: Client Details:** Company Name, 15-digit GSTIN, State selection, and schema flavor.
  2. **Step 2: Database Connectors:** Connection strings for your ERP database and application database.
  3. **Step 3: Stored Procedure & Schema Profile:** Selects custom SQL procedures (e.g., KSCC profile) for custom ERPs.
  4. **Step 4: Activation:** Tests database connectivity and activates tenant access.

---

### Page 13: User Management & Roles (`/users`) *(Admin Only)*
- **Purpose:** Controls who can access the portal and what actions they are permitted to perform.
- **Role Permissions:**
  - **Admin:** Full access to all invoicing, return filing, onboarding, and system settings.
  - **User (Standard):** Can create e-invoices, generate e-way bills, view returns, and run reconciliations.
  - **ReadOnly (Auditor):** Can inspect data, view dashboards, and export reports, but cannot generate IRNs, cancel bills, or change settings.
- **Key Features:**
  - **Employee Directory Sync:** Direct integration with ERP employee accounts.
  - **Role Assignment & Revocation:** 1-click upgrade, downgrade, or removal of user access.

---

### Page 14: System Settings & Integrations (`/settings`) *(Admin Only)*
- **Purpose:** Configures company branding, print layouts, government API keys, and email services.

#### A. Settings Tabs:
1. **Company Profile & Logo:** Upload high-resolution corporate logo for invoices; configure trade name and registered address.
2. **Invoice Print Defaults:** Configure default bank account details, authorized signatory name, custom terms & conditions, and footer notes.
3. **WhiteBooks & GST APIs:** Secure sandbox and production API credentials for instant government portal connectivity.
4. **Email (SMTP) Service:** Configure corporate email server (Host, Port, SSL, Sender Email) and send test emails for invoice dispatching.
5. **Database SPs & Sources:** Real-time database diagnostics verifying that all ERP stored procedures and data tables are healthy.

---

## 5. Summary Table: User Roles & Access Matrix

| Feature / Page | Administrator | Standard User | Read-Only Auditor |
| :--- | :---: | :---: | :---: |
| **Executive Dashboard** | Full Access | Full Access | View Only |
| **Generate e-Invoices (IRN)** | Yes | Yes | No |
| **Cancel e-Invoices (24h)** | Yes | Yes | No |
| **Generate & Update e-Way Bills**| Yes | Yes | No |
| **Run ITC Reconciliation** | Yes | Yes | View / Export Only |
| **Download Filing JSONs** | Yes | Yes | Yes |
| **Client Onboarding** | Yes | No | No |
| **Manage Users & Roles** | Yes | No | No |
| **API & Database Settings** | Yes | No | No |

---

## 6. Key Value Propositions to Present to Your Client

1. **Zero Human Error:** Direct ERP-to-Portal synchronization eliminates manual copy-pasting and typo risks.
2. **Time Savings:** Bulk e-invoicing and 1-click reconciliation cut monthly accounting workloads from days to minutes.
3. **Avoid Financial Losses:** Detects supplier non-filing immediately so you never lose claimable Input Tax Credit (ITC).
4. **Guaranteed Compliance:** Automatic 24-hour countdowns, e-way bill validity checks, and strict government format adherence prevent costly fines and notices.
5. **Executive Transparency:** Real-time dashboards provide business owners with complete clarity over exact tax liabilities anytime, anywhere.
