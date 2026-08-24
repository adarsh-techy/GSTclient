# GST AutoPilot - Complete Backend & System Details Flow

> **Comprehensive Technical Architecture, Backend Data Pipelines, Controller Flows, and External Gateways**

---

## 1. System Topology & Backend Architecture

The backend (`E:\Work\GST\server`) is built on **ASP.NET Core Web API**, providing a multi-tenant, micro-service architecture that interfaces between enterprise ERPs (CarolERP / SQL Server), the React Client UI, and Government GSP/IRP portals (WhiteBooks / NIC / GSTN).

```mermaid
flowchart TD
    Client["React 18 TypeScript Frontend (Client UI)"] -- "REST API (Bearer JWT + X-Tenant-Id)" --> API["ASP.NET Core Web API Server (Backend)"]

    subgraph SecurityLayer ["Security & Middleware"]
        AuthMiddleware["JWT Authentication & RBAC Filter"]
        TenantMiddleware["Multi-Tenant Resolver (Header / Claim)"]
        RateLimiter["Rate Limiting & Exception Handler"]
    end

    API --> SecurityLayer

    subgraph CoreServices ["Backend Processing Engine"]
        InvSvc["Invoice & Tax Aggregation Service"]
        IRPSvc["e-Invoice (IRN) & QR Generator"]
        EWBSvc["e-Way Bill Logistics Service"]
        ReconSvc["4-Way Smart Reconciliation Engine"]
        ReturnSvc["GST Returns Engine (GSTR-1, 2B, 3B)"]
        CustomsSvc["ICEGATE Customs BOE Service"]
        MailSvc["SMTP Dispatcher & PDF Generator"]
    end

    SecurityLayer --> CoreServices

    subgraph DataStorage ["Data Layer & Integrations"]
        AppDB[("App Master DB (Tenants, Users, Audit, Logs)")]
        ERPDB[("CarolERP SQL Server (Live Billing & Sales)")]
        WhiteBooks["WhiteBooks GSP / IRP Gateway (NIC & GSTN)"]
        ICEGATE["Customs ICEGATE Portal"]
        SMTP["SMTP Mail Server"]
    end

    CoreServices --> AppDB
    CoreServices --> ERPDB
    CoreServices --> WhiteBooks
    CoreServices --> ICEGATE
    CoreServices --> SMTP
```

---

## 2. End-to-End Data Ingestion & Processing Pipeline

### Step 1: How Outward Sales Invoices Flow (CarolERP -> Backend -> Frontend)
```mermaid
sequenceDiagram
    autonumber
    actor User as User / Accountant
    participant Frontend as React Web App
    participant Backend as ASP.NET Core API
    participant ERP as CarolERP (SQL Server)
    participant IRP as WhiteBooks / IRP (NIC)

    User->>Frontend: Selects Tax Period (e.g. 2026-05)
    Frontend->>Backend: GET /invoice?period=202605
    Backend->>Backend: Read Tenant DB Connection String
    Backend->>ERP: Execute Outward Stored Procedure (`outwardSP`)
    ERP-->>Backend: Return Raw Table Rows (Bills, Lines, HSN, Tax Slabs)
    Backend->>Backend: Transform & Categorize (B2B, B2C, Exports, CDN)
    Backend-->>Frontend: Return Clean JSON (InvoiceResponse[])
    Frontend-->>User: Display Invoices Table with Live Status

    Note over User,IRP: 1-Click e-Invoice (IRN) Generation
    User->>Frontend: Clicks "⚡ Generate IRN"
    Frontend->>Backend: POST /einvoice/generate { billId }
    Backend->>Backend: Build Schema-Compliant JSON Schema (INV-01)
    Backend->>IRP: POST /api/v1/einvoice/generate
    IRP-->>Backend: Returns 64-char IRN, Ack No, Signed QR & Signed JSON
    Backend->>Backend: Save IRN Record in App DB
    Backend-->>Frontend: Returns IRNResponse
    Frontend-->>User: Badge turns Green "Generated", QR & PDF ready
```

---

### Step 2: How Purchase Invoices Flow & Auto-Reconciliation (GSTN -> Backend -> Books)
```mermaid
sequenceDiagram
    autonumber
    actor Accountant as Tax Accountant
    participant Frontend as React Web App
    participant Backend as ASP.NET Core API
    participant GSTN as GSTN Portal (via WhiteBooks)
    participant ERP as CarolERP Purchase Register

    Accountant->>Frontend: Clicks "Sync GSTR-2B" (/gstr2b)
    Frontend->>Backend: POST /gstr2b/sync { period: 202605 }
    Backend->>GSTN: GET /returns/gstr2b (Encrypted OTP Session)
    GSTN-->>Backend: Returns Supplier-Filed Invoices Payload (JSON)
    Backend->>Backend: Parse & Save GSTR-2B Raw Statement to App DB
    Backend-->>Frontend: Sync Complete

    Note over Accountant,ERP: 4-Way Reconciliation
    Accountant->>Frontend: Clicks "Run Reconciliation" (/recon)
    Frontend->>Backend: POST /reconciliation/run { period: 202605, tolerance: 1.00 }
    Backend->>ERP: Fetch Inward Purchase Books (`inwardSP`)
    Backend->>Backend: Fetch Synced GSTR-2B + Import BOE records
    Backend->>Backend: Execute Matching Engine:<br/>1. Exact Match (GSTIN + InvNo + Tax)<br/>2. Fuzzy Match (Invoice numbering prefix variations)<br/>3. Mismatch Detection (Tax/Value differences)<br/>4. Missing in Books / Missing in Portal
    Backend-->>Frontend: Return Reconciliation Summary & Categorized Items
    Frontend-->>Accountant: Interactive 4-Way Donut Chart & Action Tables
```

---

## 3. Detailed Backend Controller & Module Map

| Backend Controller | Endpoint Route | Source / Destination | Function & Working Details |
| :--- | :--- | :--- | :--- |
| **`AuthController`** | `POST /auth/login`<br>`GET /auth/me` | App DB + CarolERP | Authenticates credentials, validates employee active status, issues JWT token with claims (`TenantId`, `Role`, `EmplCode`). |
| **`TenantController`** | `POST /tenant/onboard`<br>`POST /tenant/test-connection`<br>`GET /tenant/list` | App DB + SQL Server | Configures multi-tenant connection strings, runs live TCP/SQL handshake tests, sets active database flavor. |
| **`InvoiceController`** | `GET /invoice`<br>`GET /invoice/gstr1`<br>`GET /invoice/gstr1/tables`<br>`GET /invoice/pdf/{billId}` | CarolERP (SQL Stored Proc) | Executes tenant `outwardSP`, validates GSTIN checksums, groups lines by HSN, generates PDF tax invoice with embedded QR. |
| **`EInvoiceController`** | `POST /einvoice/generate`<br>`POST /einvoice/cancel`<br>`GET /einvoice/history`<br>`GET /einvoice/qr` | WhiteBooks IRP Gateway (NIC) | Formats government schema INV-01, encrypts payload, requests IRN/Signed QR code, and handles statutory 24hr cancellation. |
| **`EWayBillController`** | `POST /ewaybill/generate`<br>`POST /ewaybill/update-vehicle`<br>`POST /ewaybill/cancel` | WhiteBooks e-Way Bill API | Combines Part-A (consignor/consignee) from invoice + Part-B (vehicle/transporter) to generate valid government transit permit. |
| **`Gstr2bController`** | `POST /gstr2b/sync`<br>`GET /gstr2b/summary`<br>`GET /gstr2b/b2b` | GSTN Portal API | Downloads auto-drafted ITC JSON from GSTN portal, breaks down into Section 16 (Eligible) vs Section 17(5) (Ineligible). |
| **`Gstr1Controller`** | `POST /gstr1/save`<br>`POST /gstr1/lock`<br>`POST /gstr1/file` | GSTN Portal API | Aggregates outward sales into Tables 4A (B2B), 5A (B2CL), 7 (B2CS), 9B (CDN), 12 (HSN) and submits to GSTN with OTP signing. |
| **`Gstr3bController`** | `GET /gstr3b/calculate`<br>`POST /gstr3b/file` | GSTN Portal API | Calculates Net Tax Payable = `Output Tax (Sales)` minus `Eligible ITC (GSTR-2B)`. Manages electronic cash ledger set-off. |
| **`BillOfEntryController`** | `POST /bill-of-entry/sync`<br>`GET /bill-of-entry/list` | ICEGATE Customs Gateway | Syncs customs import declarations (IMPG) and verifies IGST paid at sea/air ports to enable valid import tax credit claims. |
| **`ReconciliationController`** | `POST /recon/execute`<br>`GET /recon/results` | In-Memory Matching Engine | Executes high-speed 4-way matching algorithm between CarolERP purchase books, GSTR-2B, and ICEGATE customs data. |
| **`UserController`** | `GET /users`<br>`POST /users/roles`<br>`DELETE /users/roles` | App DB + CarolERP Directory | Syncs authorized employees from ERP directory and enforces RBAC (`Admin`, `Manager`, `Operator`, `Auditor`). |

---

## 4. Multi-Tenant Database Architecture

The backend utilizes a **hybrid multi-tenant database pattern**:

1. **Central Application Database (`GST_AppDB`):**
   - **`Tenants`**: Tenant configurations, company legal names, registered GSTINs, state codes.
   - **`TenantCredentials`**: AES-256 encrypted WhiteBooks IRP & GSTN API client keys and secrets.
   - **`UserRoles` & `AuditLogs`**: User permissions and tamper-proof action logs.
   - **`EInvoiceArchive` & `EWayBillArchive`**: Locally cached IRNs, signed QR codes, ACK numbers, and filing receipts.

2. **Tenant ERP Database (`CarolERP_Client`):**
   - Read-only connection to the client's live SQL Server.
   - Accessed strictly through stored procedures:
     - `sp_GST_Outward_Invoices` (or configured custom SP name)
     - `sp_GST_Inward_Purchases` (or configured custom SP name)
     - `sp_GST_GetEmployees`

---

## 5. Security & Compliance Safeguards

- **End-to-End Encryption:** All external communications with NIC, GSTN, and WhiteBooks utilize TLS 1.3 encryption.
- **Statutory Token Isolation:** Government OTPs and auth tokens are kept in encrypted in-memory caches and expire automatically per government compliance rules.
- **Immutable Audit Trail:** Every action (IRN Generation, Return Filing, Invoice Cancellation, Vehicle Update) is recorded with user identity, timestamp, and IP address.
- **Fail-Safe Pre-Validation:** Invoices are mathematically and structurally validated (GSTIN checksum, HSN length, rate verification) before hitting government portals, preventing API rate-limit bans and compliance rejection.
