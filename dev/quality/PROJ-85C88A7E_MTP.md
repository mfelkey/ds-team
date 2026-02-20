# Master Test Plan (MTP)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** QA Lead – *[Your Name]*  
**Date:** 19 February 2026  

---  

## Table of Contents
1. [Test Strategy Overview](#1-test-strategy-overview)  
2. [Test Environment Requirements](#2-test-environment-requirements)  
3. [Functional Test Cases](#3-functional-test-cases)  
4. [Negative & Edge‑Case Test Cases](#4-negative--edge-case-test-cases)  
5. [Accessibility Test Cases (Section 508 / WCAG 2.1 AA)](#5-accessibility-test-cases-section‑508--wcag‑21‑aa)  
6. [API Test Cases](#6-api-test-cases)  
7. [Database Test Cases](#7-database-test-cases)  
8. [Defect Management Process](#8-defect-management-process)  
9. [Release Criteria](#9-release-criteria)  
10. [Test Metrics & Reporting](#10-test-metrics--reporting)  

---  

## 1. Test Strategy Overview  

| Aspect | Description |
|--------|-------------|
| **Testing Philosophy** | Quality is built‑in, not bolted on. Tests are written **first** (TDD/BDD) where feasible, executed continuously via CI/CD, and reviewed by stakeholders (security, accessibility, compliance). |
| **Test Levels** | 1️⃣ **Unit** – isolated functions/classes (backend services, React components). <br>2️⃣ **Integration** – interaction between backend APIs, DB, and services; also front‑end component composition. <br>3️⃣ **End‑to‑End (E2E)** – user journeys through UI (Cypress). <br>4️⃣ **Performance** – API response time, dashboard load, bulk export (k6). <br>5️⃣ **Security** – OWASP Top 10, authentication/authorization, data‑in‑transit, RLS, PHI masking (ZAP, custom scripts). <br>6️⃣ **Accessibility** – Section 508 / WCAG 2.1 AA (axe‑core, NVDA/JAWS/VoiceOver manual checks). |
| **Tools & Frameworks** | • **Unit** – Jest (frontend), Mocha/Chai (backend), Supertest for service layers. <br>• **Integration** – Jest + Supertest (API), Prisma test client, Docker‑Compose for dependent services. <br>• **E2E** – Cypress (with `cypress-a11y` plugin). <br>• **Performance** – k6 scripts executed against staging. <br>• **Security** – OWASP ZAP baseline scan, npm `npm audit`, custom Python scripts for RLS testing. <br>• **Accessibility** – axe‑core CLI, manual NVDA/JAWS testing, color‑contrast analyzer. |
| **Entry Criteria** | • All requirements (PRD, UXD, BIR, FIR, TIP) are baselined and approved. <br>• Test data generation scripts are reviewed and approved. <br>• CI pipeline is operational and can spin up dev‑, staging‑, and prod‑mirror environments. |
| **Exit Criteria** | • **Unit** – ≥ 90 % statement/branch coverage, no high‑severity failures. <br>• **Integration** – All critical API contracts verified; no blocker defects. <br>• **E2E** – 100 % of defined user‑journey test cases passed on **staging‑mirror**. <br>• **Performance** – 95 th‑percentile response ≤ 2 s for all API calls; export ≤ 5 s for 10 k rows. <br>• **Security** – No critical/high OWASP findings; RLS verified; PHI never exposed in logs or UI. <br>• **Accessibility** – 100 % of required WCAG 2.1 AA success criteria met. |
| **Risk‑Based Testing** | 1️⃣ **PHI Exposure** – Highest risk; test every data path, enforce masking, audit logs. <br>2️⃣ **Classification Accuracy** – Medium risk; verify classifier service returns expected schema, confidence bounds. <br>3️⃣ **Export Functionality** – High risk for data leakage; test masking, size limits, concurrency. <br>4️⃣ **Authorization** – High risk; role‑based UI and API restrictions. <br>5️⃣ **Performance under load** – Medium risk; large datasets (10 k+ rows). Tests are prioritized accordingly. |

---  

## 2. Test Environment Requirements  

| Item | Specification |
|------|----------------|
| **Environments** | • **DEV** – local Docker compose for developer debugging (no PHI). <br>• **STAGING** – Kubernetes namespace mirroring production (Azure AKS) with identical infra (Terraform). <br>• **PROD‑MIRROR** – read‑only clone of production database refreshed nightly with synthetic PHI‑safe data. |
| **Hardware / VM** | • Minimum 4 vCPU, 16 GB RAM per node (frontend + backend). <br>• Load‑testing node: 8 vCPU, 32 GB RAM. |
| **OS / Runtime** | • Ubuntu 22.04 LTS (Docker base). <br>• Node.js 20.x, PostgreSQL 15, Python 3.11 (for scripts). |
| **Test Data** | • Synthetic data generated via `faker` scripts; PHI fields (patient_id, hospital names) are **pseudonymized** but keep realistic formats. <br>• Dataset sizes: 1 k, 5 k, 10 k rows. <br>• Classification confidence values span 0.0‑1.0. |
| **Access Requirements** | • **QA Engineer** – read/write to all dev & staging services; read‑only to prod‑mirror. <br>• **Security Analyst** – read access to logs and IAM policies. <br>• **Accessibility Specialist** – UI access only (no DB). |
| **Setup Procedure** | 1. Pull latest Terraform state. <br>2. Run `terraform apply -var env=staging`. <br>3. Deploy Docker images (`frontend:qa`, `backend:qa`). <br>4. Seed database with synthetic data (`npm run seed:staging`). <br>5. Create test users via API (`/api/users`) for each role (Admin, Analyst, Viewer). |
| **Teardown Procedure** | • After each test run, `kubectl delete namespace qa-run-<timestamp>`. <br>• Clean up synthetic data tables (`TRUNCATE TABLE trips RESTART IDENTITY`). |
| **Dependency Mocking** | • External classifier service is **mocked** in unit & integration tests using a local HTTP server that returns a static JSON payload. <br>• Third‑party services (e.g., Azure AD) are stubbed with `msal-node` mock tokens. |
| **Configuration Management** | All env‑vars are stored in Azure Key Vault; QA has a read‑only secret‑accessor role. CI pipelines fetch secrets at runtime. |

---  

## 3. Functional Test Cases  

> **Notation** – Test IDs are prefixed by the area they belong to.  
> **Priority** – P1 = Critical (must pass for release), P2 = High, P3 = Medium, P4 = Low.  

### 3.1 User Authentication & Authorization  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑001 | Login as **Admin** (full access) | - Staging‑mirror up <br>- Synthetic user `admin_user` exists with role **Admin** | 1. Navigate to `/login`. <br>2. Enter username `admin_user` and password `Password!123`. <br>3. Click **Sign In**. | User is redirected to the Dashboard, Admin navigation items (Export, RLS‑admin panel) are visible. | P1 |
| FT‑002 | Login as **Analyst** (view & export) | Same as FT‑001, user `analyst_user` with role **Analyst** | 1. Open `/login`. <br>2. Input `analyst_user` / `Password!123`. <br>3. Click **Sign In**. | Dashboard loads, **Export** button visible, **User Management** menu hidden. | P1 |
| FT‑003 | Login as **Viewer** (read‑only) | User `viewer_user` with role **Viewer** | 1. Open `/login`. <br>2. Fill credentials, click **Sign In**. | Dashboard loads, **Export** button **disabled**, **KPI cards** visible, no **Edit** or **Delete** actions present. | P1 |
| FT‑004 | Logout flow | User already logged in (any role) | 1. Click user avatar in top‑right corner. <br>2. Choose **Log out** from dropdown. | Session cookie cleared, user redirected to `/login`. Attempting to go back to dashboard shows **login required** message. | P1 |
| FT‑005 | Session timeout | User logged in; idle time set to 15 min (configurable) | 1. Log in. <br>2. Remain idle for 16 minutes (no mouse/keyboard activity). <br>3. Click any UI element (e.g., KPI card). | Application redirects to `/login` with **Session expired** banner; no PHI remains in the page source. | P2 |

### 3.2 Filter Functionality  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑010 | Filter by **date range** (valid range) | Dashboard loaded with at least 5 k rows. | 1. Click **Filter** button. <br>2. Set **Start Date** = `2023‑01‑01`. <br>3. Set **End Date** = `2023‑01‑31`. <br>4. Click **Apply**. | Table displays only trips whose `trip_date` falls inside the selected range. Row count matches API response header `X-Total-Count`. | P1 |
| FT‑011 | Filter by **classification confidence** (>= 0.8) | Synthetic data includes confidence values from 0‑1. | 1. Open Filter panel. <br>2. Set **Confidence** slider to **≥ 0.8** (or enter `0.8` in min field). <br>3. Click **Apply**. | Table shows only rows where `confidence_score >= 0.8`. Confidence column values displayed with two decimals. | P2 |
| FT‑012 | Multi‑filter combination (date + hospital + confidence) | Data includes trips for multiple hospitals. | 1. Open Filter. <br>2. Set **Start Date** = `2023‑02‑01`. <br>3. Set **End Date** = `2023‑02‑28`. <br>4. Choose **Hospital** = `Synthetic Hospital A`. <br>5. Set **Confidence** min = `0.5`. <br>6. Click **Apply**. | Table displays rows that satisfy **all** criteria. The count matches the backend query with `WHERE` clauses combined using `AND`. | P1 |
| FT‑013 | Reset filters | Filters applied (any combination). | 1. Click **Reset** button in filter panel. | All filter fields return to default (empty or “All”). Table shows full dataset (no filtering). | P2 |
| FT‑014 | Save filter state in URL (deep‑link) | Dashboard loaded, filters applied. | 1. Apply a filter set (e.g., Hospital = `Hospital B`, Date range). <br>2. Copy the URL from the address bar. <br>3. Open a new incognito browser tab and paste the URL. | The same filtered view loads automatically; UI reflects selected filters. | P3 |

### 3.3 Trip Classification  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑020 | Display classification result (happy path) | Table row with `classification = "Urgent"` and `confidence = 0.92` exists. | 1. Locate the row in the Data Table. <br>2. Click the **Details** icon (eye). | Modal opens showing **Trip ID**, **Patient ID** (masked), **Classification** = “Urgent”, **Confidence** = `0.92`. No raw PHI displayed. | P1 |
| FT‑021 | Classification service error handling | Backend API `/api/trips/:id/classify` is forced to return **500** (via mock). | 1. Click a row’s **Details** icon. | Modal shows a user‑friendly error banner “Classification unavailable – try again later”. UI remains usable, no stack‑trace leaked. | P2 |
| FT‑022 | Confidence score boundaries (0.0 & 1.0) | Synthetic rows with confidence `0.00` and `1.00` exist. | 1. Filter on **Confidence** ≥ `0.00` (or ≤ `1.00`). <br>2. Verify both rows appear. | Rows are displayed correctly; confidence column shows `0.00` and `1.00` with two‑decimal formatting. | P2 |

### 3.4 Data Table Operations  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑030 | Column sorting (ascending) | Table loaded with at least 20 rows. | 1. Click column header **Trip Date** once. | Rows reorder from earliest to latest; a **↑** indicator appears on the header. |
| FT‑031 | Column sorting (descending) | Same as FT‑030. | 1. Click **Trip Date** header twice. | Rows reorder from latest to earliest; a **↓** indicator appears. |
| FT‑032 | Global search (case‑insensitive) | Table contains a row with Hospital = `Synthetic Hospital X`. | 1. Type `hospital x` into the **Search** box. <br>2. Press **Enter**. | Only rows containing `Synthetic Hospital X` (case‑insensitive) remain; count updates accordingly. |
| FT‑033 | Pagination – next page | Table shows **50** rows per page, total rows = 200. | 1. Click **Next** pagination button. | Page 2 loads, rows 51‑100 displayed, URL query param `page=2` updated. |
| FT‑034 | Pagination – last page handling | Same as FT‑033. | 1. Navigate to page 4 (last page). <br>2. Verify **Next** button is disabled. | Page 4 displays rows 151‑200; **Next** button greyed out, **Previous** remains enabled. |
| FT‑035 | Column hide/show via UI control | Table with column chooser (gear icon) visible. | 1. Click gear icon. <br>2. Uncheck **Patient ID**. <br>3. Click **Apply**. | **Patient ID** column disappears from table; data still present in the backend response. |
| FT‑036 | Row selection (checkbox) | Table loaded. | 1. Click checkbox on first row. <br>2. Verify **Export** button becomes enabled (if role permits). | Row is highlighted; internal state `selectedRows` includes the row ID. |

### 3.5 Export (CSV)  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑040 | Export full dataset (Admin) | User logged in as Admin, total rows = 5 k. | 1. Click **Export** button. <br>2. Choose **CSV** format. <br>3. Confirm download. | Browser prompts to save `trips_export_YYYYMMDD.csv`. File contains **all** rows (including headers). PHI fields are **masked** (e.g., Patient ID = `****1234`). |
| FT‑041 | Export filtered dataset (Analyst) | Filters applied (Hospital = `Hospital B`). | 1. Click **Export**. | CSV contains only rows matching current filter set. |
| FT‑042 | Export button disabled for Viewer | Logged in as Viewer. | 1. Verify **Export** button is disabled (grayed). | Button cannot be clicked; tooltip “Insufficient privileges”. | P1 |
| FT‑043 | Export error (network failure) | Backend `/api/export` forced to return **503** (via mock). | 1. Click **Export**. | UI shows error toast “Export service unavailable – please try again later”. No raw error body shown. | P2 |

### 3.6 KPI Cards  

| Test ID | Description | Preconditions | Steps | Expected Result | Priority |
|--------|-------------|---------------|------|----------------|----------|
| FT‑050 | KPI card displays correct count | Synthetic data includes 123 trips classified as “Urgent”. | 1. Locate **Urgent Trips** KPI card. | Card shows number **123**; clicking the card opens filtered view of those trips. |
| FT‑051 | KPI card hover tooltip | Same as FT‑050. | 1. Hover over **Urgent Trips** card. | Tooltip appears “Trips classified as Urgent in selected date range”. |
| FT‑052 | KPI card click filters table | Same as FT‑050. | 1. Click **Urgent Trips** card. | Dashboard filter panel updates automatically to `Classification = Urgent`; table shows matching rows. | P2 |

---  

## 4. Non‑Functional Test Cases  

### 4.1 Security  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| NT‑001 | Verify **CORS** headers for API | Backend up, request from `http://evil.com`. | 1. Use `curl -H "Origin: http://evil.com" -I https://staging.api.example.com/api/trips`. | Response includes `Access-Control-Allow-Origin: https://app.example.com` (only trusted origin). No wildcard `*`. |
| NT‑002 | Verify **HTTP Security Headers** | Any page served over HTTPS. | 1. Request `/dashboard` with `curl -I`. | Headers include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy` with proper directives. |
| NT‑003 | Ensure **Password Complexity** enforcement | Registration endpoint `/api/register`. | 1. Attempt to register with password `simple`. | API responds **400** with message “Password does not meet complexity requirements”. |
| NT‑004 | Role‑Based Access Control (RLS) enforcement | Viewer attempts to access `/admin/users`. | 1. Log in as Viewer. <br>2. Manually navigate to `/admin/users`. | Application returns **403 Forbidden** page. No data leakage. |

### 4.2 Performance  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| NT‑010 | Dashboard load time < 2 s (first paint) | Fresh browser session, no cache. | 1. Open `/login`. <br>2. Log in as Analyst. <br>3. Measure time from navigation to **first contentful paint** (using Chrome DevTools). | Time ≤ 2000 ms. |
| NT‑011 | Filter query response < 500 ms for 10 k rows | Synthetic dataset 10 k rows. | 1. Apply filter (e.g., Hospital = `Hospital C`). | Backend returns response within 500 ms; network waterfall shows < 500 ms. |
| NT‑012 | Export of 10 k rows completes within 5 s | User Admin logged in; 10 k rows present. | 1. Click **Export**. | CSV download starts; file generated on server within 5 seconds. |

### 4.3 Accessibility  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| AT‑001 | All interactive elements have discernible **labels** (screen‑reader) | Dashboard loaded. | 1. Run axe‑core scan (`npm run a11y:staging`). | No violations for missing label, aria‑label, or role. |
| AT‑002 | Keyboard navigation order | User not using mouse. | 1. Press **Tab** repeatedly from the top of the page. | Focus moves logically: Login fields → Sign‑In button → Dashboard navigation → Filter button → Table cells. No focus trap. |
| AT‑003 | Color contrast ratio | Visual theme applied (default). | 1. Use Chrome DevTools **Contrast Ratio** tool on text in KPI cards. | Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text. |
| AT‑004 | Modal focus trap | Details modal opened. | 1. Press **Tab** repeatedly. | Focus cycles within modal elements (Close button, fields) and does not escape to background page. |
| AT‑005 | Screen‑reader announces error messages | Trigger an error (e.g., classification service down). | 1. Activate error scenario. <br>2. Use NVDA or VoiceOver to navigate to error banner. | Screen‑reader reads “Classification unavailable – try again later”. ARIA `role="alert"` present. |

---  

## 4. Non‑Functional Test Cases (Expanded)

### 4.1 Security  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| NT‑020 | Verify **JWT** token expiration handling | Valid JWT with `exp` set to 5 minutes in the future. | 1. Log in, obtain token. <br>2. Wait 6 minutes. <br>3. Attempt API call `/api/trips`. | Server returns **401 Unauthorized**; client redirects to login page. |
| NT‑021 | Verify **CSRF** protection on state‑changing endpoints | Authenticated session with CSRF token present. | 1. Issue `POST /api/trips` without `X-CSRF-Token` header. | Server responds **403 Forbidden** with message “Missing CSRF token”. |
| NT‑022 | Verify **Rate limiting** on login endpoint | None. | 1. Send 20 rapid login attempts with invalid credentials. | After threshold (e.g., 5 attempts per minute), server returns **429 Too Many Requests** with `Retry-After` header. |
| NT‑023 | Verify **SQL Injection** protection on filter parameters | None. | 1. In **Search** box, input `' OR 1=1--`. <br>2. Click **Apply**. | Backend treats input as literal string; no additional rows returned. No error or data leakage. |

### 4.2 Performance (continued)  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| NT‑030 | Load test – 100 concurrent users on dashboard | Load generator (k6) configured. | 1. Run script that opens `/dashboard` for 100 virtual users simultaneously. | Average response time ≤ 2 s, 95th percentile ≤ 3 s, no HTTP 5xx errors. |
| NT‑031 | Memory usage under load | Same as NT‑030. | 1. Monitor pod memory (`kubectl top pod`). | Memory stays < 500 MiB per replica; no OOM kills. |

### 4.3 Accessibility (continued)  

| Test ID | Description | Preconditions | Steps | Expected Result |
|--------|-------------|---------------|------|----------------|
| AT‑010 | Ensure **focus** returns to triggering element after closing modal | Modal open (from FT‑020). | 1. Click **Close** (X) button on modal. | Focus returns to the **Details** icon that opened the modal. |
| AT‑011 | Verify **skip navigation** link works | Dashboard page loaded. | 1. Press **Tab** until the “Skip to main content” link appears. <br>2. Press **Enter**. | Browser jumps to the main content region (`<main>`), bypassing repetitive navigation links. |

---  

## 5. Execution Summary & Reporting  

- **Automation Tools**:  
  - **Security**: OWASP ZAP, Postman/Newman for API tests, custom scripts for rate‑limit & JWT checks.  
  - **Performance**: k6 or JMeter for load & stress testing, Chrome Lighthouse CI for page‑level metrics.  
  - **Accessibility**: axe‑core integration in CI, pa11y for end‑to‑end a11y testing, manual checks with NVDA/VoiceOver.  

- **CI/CD Integration**:  
  - All test suites executed on every PR merge to `staging` branch.  
  - Security and accessibility failures block deployments.  
  - Performance thresholds enforced via gate in the pipeline; failures raise alerts.  

- **Reporting**:  
  - Consolidated HTML report generated per pipeline run (e.g., `test-report-<timestamp>.html`).  
  - Security findings exported to a dedicated dashboard (e.g., DefectDojo).  
  - Accessibility violations sent to the UX team via Slack webhook.  

---  

### Final Remarks  

The above test plan provides a **comprehensive, layered** approach to validate the new analytics dashboard across functional, security, performance, and accessibility dimensions. By automating the majority of these tests and integrating them into the CI/CD pipeline, we ensure continuous compliance with the organization’s strict security posture while delivering a fast, reliable, and accessible user experience.