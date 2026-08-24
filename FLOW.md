# GST Client - Complete System & Page Flow Guide

---

## 1. System Entry Point & Application Bootstrap

```mermaid
flowchart TD
    IndexHTML["index.html (#root)"] --> MainTSX["src/main.tsx (createRoot)"]
    MainTSX --> AppTSX["src/App.tsx (Global Providers)"]
    
    subgraph AppProviders ["Global Providers Layer (App.tsx)"]
        direction TB
        Redux["Redux Provider (store)"]
        QueryClient["TanStack QueryClientProvider"]
        ThemeProvider["ThemeProvider (Light/Dark/Accent)"]
        ToasterProvider["ToasterProvider (Alerts/Notifications)"]
        BrowserRouter["BrowserRouter (Routing)"]
        AuthProvider["AuthProvider (Session & Tokens)"]
    end
    
    AppTSX --> AppProviders
    AuthProvider --> AppRouter["src/router/AppRouter.tsx"]
    
    AppRouter -->|Unauthenticated| LoginPage["/login (LoginPage)"]
    AppRouter -->|Authenticated| MainLayout["MainLayout (TopBar + Sidebar + Body)"]
    
    subgraph Pages ["Protected Application Routes"]
        MainLayout --> Dashboard["/ (DashboardPage)"]
        MainLayout --> Invoices["/invoices (InvoicesPage)"]
        MainLayout --> EInvoice["/einvoice-history (EInvoiceHistoryPage)"]
        MainLayout --> EWayBills["/ewaybills (EWayBillsPage)"]
        MainLayout --> GSTR1["/gstr1 (Gstr1ReturnPage)"]
        MainLayout --> GSTR2B["/gstr2b (Gstr2bItcPage)"]
        MainLayout --> GSTR3B["/gstr3b (Gstr3bReturnPage)"]
        MainLayout --> BOE["/bill-of-entry (BillOfEntryPage)"]
        MainLayout --> Recon["/recon (ReconciliationPage)"]
        MainLayout --> Filings["/filings (FilingsRegisterPage)"]
        MainLayout --> Onboarding["/onboarding (ClientOnboardingPage - Admin Only)"]
        MainLayout --> Users["/users (UserManagementPage - Admin Only)"]
        MainLayout --> Settings["/settings (SystemSettingsPage - Admin Only)"]
    end
```

### Bootstrap Sequence Step-by-Step:
1. **`index.html`**: The static HTML page loaded by the browser containing the mount point `<div id="root"></div>`.
2. **`src/main.tsx`**: Renders `<App />` using React 18 `createRoot`.
3. **`src/App.tsx`**: Wraps the whole application with required providers:
   - **`Provider (Redux)`**: Centralized state management for global application states.
   - **`QueryClientProvider`**: React Query client caching API responses, managing background refetching and mutation states.
   - **`ThemeProvider`**: Theme state (light/dark mode and active accent colors).
   - **`ToasterProvider`**: Global toast notification system.
   - **`BrowserRouter`**: HTML5 history API router.
   - **`AuthProvider`**: Manages user authentication state, tokens in `localStorage` (`gstautopilot.user`), and auto-logout on unauthorized events.
4. **`src/router/AppRouter.tsx`**: Determines routing rules:
   - If not authenticated, routes the user directly to `/login`.
   - If authenticated, directs the user inside `MainLayout` with lazy-loaded route components.

---

## 2. Authentication & Authorization Flow

- **Storage**: Auth user metadata & tokens are persisted in `localStorage` (`gstautopilot.user`).
- **Session Check**: On load, `AuthProvider` checks whether the session is valid and not expired.
- **Interceptors**: Axios API client attaches `Authorization: Bearer <token>` to outbound requests. If a `401 Unauthorized` response is returned, the client emits `gstautopilot:unauthorized`, triggering cleanup and routing the user to `/login`.
- **Role-Based Access Control (RBAC)**: `ProtectedRoute` checks the user's role (e.g., `Admin`). Unauthorized roles navigating to admin-only pages get redirected back to `/`.

---

## 3. UI Layout Architecture

All authenticated pages are wrapped inside **`MainLayout`** (`src/components/layout/main-layout/MainLayout.tsx`):
- **TopBar (`src/components/layout/topbar/TopBar.tsx`)**:
  - Global Search bar (invoices, clients, HSN codes).
  - Quick action shortcuts (e.g., New Invoice, Sync).
  - Multi-Company Selector dropdown.
  - Theme toggler (Light / Dark) and accent color picker.
  - User profile menu and Logout trigger.
- **Sidebar (`src/components/layout/sidebar/Sidebar.tsx`)**:
  - Navigation grouped into 4 distinct sections: **Main Menu**, **GST Returns**, **Audit & Reconciliation**, and **Administration**.
  - Collapsible desktop sidebar and responsive mobile slide-out drawer.
- **Content Area**: Dynamic router outlet where page components are rendered.

---

## 4. Complete Page-by-Page Functional Breakdown

### 1. 🔐 Authentication
| Page | Route | Access | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Login** | `/login` | Public | Employee code/username + password credentials authentication, JWT handling, session persistence, and redirection. |

---

### 2. 📊 Main Menu
| Page | Route | Access | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `/` | All Users | • Executive KPI Cards (Total Sales, Purchases, Net Tax Payable, Available ITC).<br>• Real-time chart visualization for Outward Liability vs. Inward ITC.<br>• GST filing deadlines and countdown alerts.<br>• Quick-action shortcut cards for pending tasks (unmatched invoices, pending IRN generation). |
| **Invoices** | `/invoices` | All Users | • Central invoice register for outward (sales) and inward (purchases).<br>• Advanced filtering (by GSTIN, date range, invoice status, invoice type).<br>• Bulk CSV/Excel invoice import & export.<br>• Direct actions: **Generate IRN** (e-Invoice) and **Generate e-Way Bill**.<br>• Automated data validation (GSTIN checksum, HSN code, tax calculation). |
| **e-Invoice History** | `/einvoice-history` | All Users | • Audit register of all e-invoices registered on the IRP / NIC portal.<br>• View IRN, Signed QR codes, and ACK numbers.<br>• Real-time status tracker (Active, Cancelled, Failed).<br>• JSON payload & error response viewer for debugging.<br>• IRN cancellation workflow within allowed 24-hour compliance window. |
| **e-Way Bills** | `/ewaybills` | All Users | • e-Way Bill lifecycle management.<br>• View generated e-Way Bills with Part-A (Consignor/Consignee) and Part-B (Transporter/Vehicle) data.<br>• Update vehicle number, change transporter, and extend validity.<br>• Direct print/export of government-compliant PDF e-Way Bills. |

---

### 3. 📑 GST Returns
| Page | Route | Access | Key Functionality |
| :--- | :--- | :--- | :--- |
| **GSTR-1 Return** | `/gstr1` | All Users | • Preparation, review, and filing of Outward Supplies Return.<br>• Table-wise breakdown: B2B (4A/4B), B2CL (5A), B2CS (7), Credit/Debit Notes (9B), Exports (6A), HSN Summary (12), Document Issue Summary (13).<br>• Error validation report before upload.<br>• Direct JSON generation and GSTN portal sync. |
| **GSTR-2B ITC** | `/gstr2b` | All Users | • Auto-drafted Input Tax Credit (ITC) statement inspection.<br>• Categorization into Eligible ITC vs. Ineligible ITC (Section 16/17(5)).<br>• Vendor-wise breakdown of tax credits uploaded by suppliers.<br>• Auto-refresh from GST portal. |
| **GSTR-3B Return** | `/gstr3b` | All Users | • Monthly consolidated summary return preparation.<br>• Auto-computation of net tax liability (CGST, SGST, IGST, Cess).<br>• Cash ledger vs. Credit ledger balance calculation for tax liability offset.<br>• Preparation of final filing payload. |
| **Bill of Entry** | `/bill-of-entry` | All Users | • Import tracking and customs declarations integration (ICEGATE).<br>• Bill of Entry verification.<br>• IGST paid on imports reconciliation to ensure legitimate ITC claims. |

---

### 4. 🔍 Audit & Reconciliation
| Page | Route | Access | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Reconciliation** | `/recon` | All Users | • Automated 2-way and 3-way matching engine (Purchase Register vs. GSTR-2B / GSTR-2A).<br>• Status matching: **Exact Match**, **Value/Tax Mismatch**, **Missing in Books**, **Missing in Portal**.<br>• Configurable tolerance limits (e.g. ± ₹1.00 rounding).<br>• Bulk accept/reject and automated vendor reminder notifications. |
| **Filings Register** | `/filings` | All Users | • Historical compliance ledger and audit repository.<br>• Tracks ARN (Application Reference Number), filing dates, and periods for GSTR-1, GSTR-3B, and GSTR-9/9C across financial years. |

---

### 5. ⚙️ Administration
| Page | Route | Access | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Client Onboarding** | `/onboarding` | Admin Only | • Multi-entity client and branch registration.<br>• GSTIN configuration, legal trading name, and address setup.<br>• IRP / NIC portal API credentials setup for automated e-invoicing.<br>• ERP connector integration configuration. |
| **User Management** | `/users` | Admin Only | • Role-Based Access Control (RBAC) management.<br>• Manage user accounts and assign roles (`Admin`, `Manager`, `Operator`, `Auditor`).<br>• User activation, password resets, and permission grants. |
| **System Settings** | `/settings` | Admin Only | • System configuration, API URLs, and ERP sync intervals.<br>• Webhook and notification preferences.<br>• System health monitoring and audit logs. |

---

## 5. Summary Flow Chart of Key Business Operations

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Accountant
    participant UI as GST Client UI
    participant API as API Layer / Backend
    participant IRP as IRP / NIC Portal
    participant GSTN as GSTN Portal

    Note over User,GSTN: 1. Sales & e-Invoicing Workflow
    User->>UI: Enter / Upload Invoice
    UI->>API: Validate & Save Invoice
    User->>UI: Click "Generate IRN"
    API->>IRP: Submit e-Invoice Payload
    IRP-->>API: Returns IRN + Signed QR + ACK
    API-->>UI: Update Invoice Status to "IRN Generated"

    Note over User,GSTN: 2. GSTR-1 Return Filing Workflow
    User->>UI: Open GSTR-1 Page (/gstr1)
    UI->>API: Aggregate B2B, B2C, HSN, CDNR Tables
    User->>UI: Review & Click "Upload to GSTN"
    API->>GSTN: Submit GSTR-1 Payload
    GSTN-->>API: Returns Reference Number / ARN

    Note over User,GSTN: 3. ITC Reconciliation Workflow
    User->>UI: Open Reconciliation (/recon)
    UI->>API: Fetch Books Purchase Invoices & GSTR-2B Portal Invoices
    API->>API: Run Matching Algorithm (GSTIN, Invoice #, Date, Tax Values)
    API-->>UI: Display Match Results (Matched, Mismatched, Missing)
    User->>UI: Accept Valid ITC / Flag Ineligible Items
```
