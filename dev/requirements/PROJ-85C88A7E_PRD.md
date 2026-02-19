# Product Requirements Document (PRD)  
**Project Title:** VA Ambulance Trip Analysis  
**Requestor:** Office of Health Economics – Veterans Health Administration (VHA)  
**Prepared By:** Senior Product Manager – (Your Name)  
**Date:** 19 February 2026  

---  

## 1. EXECUTIVE SUMMARY  
**Business Justification**  
The VHA is seeking to reduce unnecessary spend on ambulance services by identifying trips that could be performed in‑house rather than outsourced to contract providers. A data‑driven view of the 2023 ambulance‑trip dataset, combined with a simple interactive dashboard, will give leadership the visibility needed to prioritize policy changes, renegotiate contracts, and re‑allocate resources, directly supporting the VA’s cost‑containment and veteran‑care‑quality objectives.  

**Key Stakeholders**  
| Role | Name / Org | Primary Interest |
|------|------------|------------------|
| VA Leadership (Chief Medical Officer, Chief Financial Officer) | VHA Headquarters | Strategic decision‑making, cost‑saving insights |
| Health Economics Analysts | Office of Health Economics | Data analysis, reporting |
| Ambulance Operations Managers | Regional VA Medical Centers | Operational planning, contract management |
| VA IT Security & Compliance | VA Information Security Office | HIPAA/VA data protection, Section 508 compliance |
| End‑User (Dashboard Viewer) | Senior administrators & analysts | Quick, reliable access to trip classifications |
| Development Team (Data Science, BI, DevOps) | Joint (DS → DEV) | Build, test, deploy solution |

---  

## 2. PROBLEM STATEMENT  

### Current State  
- The 2023 VA ambulance‑trip dataset resides in the VA’s Enterprise Data Warehouse (EDW) but is raw, uncleaned, and lacks any indication of whether a trip was handled in‑house or by a contracted provider.  
- Leadership currently receives quarterly narrative reports that are time‑consuming to produce and do not allow drill‑down by month or trip type.  
- No interactive tool exists to explore the data; any ad‑hoc analysis requires manual SQL queries by data engineers.  

### Desired State  
- A clean, validated dataset where every trip is labeled **In‑House** or **Contracted** based on reproducible business rules.  
- An automated classification pipeline that can be rerun for future years with < 5 % manual intervention.  
- A low‑latency, self‑service dashboard (Power BI, Tableau, or VA‑approved web app) that lets leadership filter by month and trip type, view counts, costs, and key performance indicators (KPIs).  

### Gap Analysis  
| Gap | Impact | Required Solution |
|-----|--------|-------------------|
| No data cleaning / preprocessing | Inconsistent dates, missing fields, duplicate rows → inaccurate analysis | ETL pipeline (Python/SQL) with validation rules |
| No classification logic | No way to differentiate in‑house vs contracted trips | Rule‑based engine (e.g., provider ID, service‑type, contract flag) + optional ML model for edge cases |
| No interactive visualization | Leadership must wait for static reports → delayed decisions | Power BI dashboard hosted in VA‑approved environment |
| No performance / security guarantees | Potential HIPAA breach, slow UI | Implement Section 508 compliance, role‑based access control, < 2 s query latency |
| No documentation / hand‑off | Future teams cannot maintain or extend solution | Comprehensive technical and user documentation, deployment scripts |

---  

## 3. USER STORIES  

| # | User Story | Acceptance Criteria (Given/When/Then) |
|---|------------|---------------------------------------|
| **US‑01** | **As a VA Health Economics Analyst, I want a reproducible data‑cleaning pipeline so that I can trust the underlying data quality before any analysis.** | 1. **Given** the raw 2023 ambulance‑trip CSV files in the EDW, **when** the pipeline runs, **then** all records must have valid `TripDate` (ISO‑8601), non‑null `ProviderID`, and `TripDistance` ≥ 0. <br>2. **Given** duplicate rows (identical `TripID`), **when** the pipeline processes them, **then** only the first occurrence is retained and duplicates are logged. <br>3. **Given** any record failing validation, **when** the pipeline finishes, **then** the record is written to a `validation_errors` table with a descriptive error code. <br>4. **Given** a successful run, **when** the pipeline completes, **then** a checksum (SHA‑256) of the cleaned dataset is stored for audit. |
| **US‑02** | **As an Ambulance Operations Manager, I want each trip automatically classified as “In‑House” or “Contracted” so that I can see the distribution without manual review.** | 1. **Given** a cleaned trip record, **when** the classification engine evaluates it, **then** it must assign a label based on the rule set (see FR‑02). <br>2. **Given** a sample of 200 trips reviewed by subject‑matter experts, **when** the engine’s labels are compared, **then** overall agreement must be ≥ 95 %. <br>3. **Given** a trip that meets multiple rule criteria, **when** classification occurs, **then** the engine must apply the precedence order defined in FR‑02.4 and log the rule applied. <br>4. **Given** an “Uncertain” flag (e.g., missing ProviderID), **when** the engine processes it, **then** the trip is labeled “Review‑Needed” and routed to a review queue. |
| **US‑03** | **As a VA Senior Leader, I want an interactive dashboard with month and trip‑type filters so that I can quickly assess cost‑saving opportunities.** | 1. **Given** the classified dataset, **when** the dashboard loads, **then** default view shows total trips and total cost for the most recent month. <br>2. **Given** the month filter set to “April 2023”, **when** the user applies it, **then** all visualizations update within 2 seconds. <br>3. **Given** the trip‑type filter set to “In‑House”, **when** the filter is applied, **then** the cost breakdown reflects only in‑house trips. <br>4. **Given** a user with “Leadership” role, **when** they view the dashboard, **then** they see a “Download CSV” button that respects their access rights. |
| **US‑04** | **As a VA IT Security Officer, I need role‑based access control on the dashboard so that only authorized personnel can view PHI‑related fields.** | 1. **Given** a user assigned the “Leadership” role, **when** they log in, **then** they can see aggregated counts and costs but **cannot** see personally identifiable fields (e.g., VeteranID). <br>2. **Given** a user with “Data Engineer” role, **when** they access the underlying dataset, **then** they can view all columns, including PHI, within a secured VA network. <br>3. **Given** an unauthorized user, **when** they attempt to access the dashboard URL, **then** they receive a 403 Forbidden response and an audit log entry is created. |
| **US‑05** | **As a Documentation Specialist, I want complete deployment and user guides so that future teams can maintain the solution without knowledge loss.** | 1. **Given** a successful build, **when** the deployment script runs, **then** it produces a README with step‑by‑step instructions, required IAM roles, and rollback steps. <br>2. **Given** the dashboard, **when** a new user logs in for the first time, **then** a tooltip tour appears explaining each filter and visual. <br>3. **Given** the classification logic, **when** the business rules change, **then** the guide includes a “How to Update Rules” section with example JSON files. <br>4. **Given** the need for audit, **when** the documentation is delivered, **then** it includes a traceability matrix linking each requirement to test cases. |

---  

## 4. FUNCTIONAL REQUIREMENTS  

| FR ID | Requirement | Testable Acceptance |
|-------|-------------|---------------------|
| **FR‑01** | **Data Ingestion** – Pull the 2023 ambulance‑trip CSV files from the VA Enterprise Data Warehouse (EDW) nightly at 02:00 UTC. | Verify that the pipeline logs a successful file transfer for each expected file and that the file count matches the manifest. |
| **FR‑02** | **Cleaning & Validation** – Apply rules: valid date format, non‑null ProviderID, numeric distance ≥ 0, cost ≥ 0, remove duplicates, flag missing required fields. | Run unit tests on a synthetic dataset covering each rule; confirm that invalid rows appear in `validation_errors` table. |
| **FR‑03** | **Classification Engine** – Assign each cleaned record a label (`InHouse`, `Contracted`, `ReviewNeeded`) based on: <br>1. ProviderID in VA‑owned fleet list → InHouse <br>2. ProviderID in active contract list → Contracted <br>3. Missing ProviderID → ReviewNeeded <br>4. If both lists contain the ID, prioritize InHouse. | Execute a test suite of 500 known‑label records; assert ≥ 95 % match with expected label. |
| **FR‑04** | **Audit Trail** – Every classification decision must be logged with timestamp, rule applied, and user (system). | Query the `classification_audit` table for a random sample; confirm required fields are populated. |
| **FR‑05** | **Dashboard Data Model** – Expose a Power BI (or VA‑approved Tableau) dataset with the following columns: `Month`, `TripType` (`InHouse`/`Contracted`), `TripCount`, `TotalCost`, `AverageDistance`, `AverageDuration`. | Load the dataset into Power BI; verify that all columns exist and aggregate correctly for a known month. |
| **FR‑06** | **Interactive Filters** – Provide month (Jan‑Dec 2023) and trip‑type dropdowns; selections must trigger visual updates. | Perform UI test: select “July 2023” & “Contracted”; assert that all charts refresh within 2 seconds. |
| **FR‑07** | **Performance** – Dashboard query response time ≤ 2 seconds for any filter combination on a dataset of ~150 k rows. | Run automated load tests with all filter permutations; capture response times. |
| **FR‑08** | **Security – RBAC** – Enforce Azure AD role‑based access: `Leadership` (view only), `DataEngineer` (full view), `Admin` (manage). | Attempt to access PHI fields with a `Leadership` account; confirm access denied and logged. |
| **FR‑09** | **Section 508 Accessibility** – All UI components must meet WCAG 2.1 AA criteria (keyboard navigation, alt‑text, sufficient contrast). | Conduct accessibility audit using Axe or equivalent; all violations must be resolved. |
| **FR‑10** | **Documentation** – Deliver (a) data pipeline architecture diagram, (b) classification rule JSON file, (c) deployment script (PowerShell/CLI), (d) user guide PDF, (e) test case matrix. | Review checklist; all five artifacts present, version‑controlled, and approved by the Documentation Lead. |
| **FR‑11** | **Versioning & CI/CD** – Store code in VA‑approved GitHub Enterprise; pipeline must run automated unit, integration, and security scans on each PR. | Verify that a new PR triggers the pipeline and fails if any test does not pass. |
| **FR‑12** | **Retention & Archiving** – Cleaned and classified dataset must be stored in a VA‑approved Azure Data Lake with a 7‑year retention policy. | Check the Data Lake policy settings; confirm retention rule is applied. |

---  

## 5. NON‑FUNCTIONAL REQUIREMENTS  

| Category | Requirement | Metric / Target |
|----------|-------------|-----------------|
| **Performance** | Dashboard page load & filter refresh time | ≤ 2 seconds for any month/trip‑type combo (tested on 150 k rows) |
| **Scalability** | Ability to ingest future years (up to 5 years) without re‑architecting | No code changes required; pipeline parameterized by year |
| **Security** | All data at rest encrypted with AES‑256; in‑transit TLS 1.2+ | Verify encryption settings in Azure Storage & Power BI service |
| | Role‑based access control per FR‑08 | Access attempts logged; unauthorized attempts blocked |
| | Audit logging retained for 180 days | Review Azure Monitor logs for retention compliance |
| **Compliance** | HIPAA & VA Privacy Act adherence (no PHI exposed to unauthorized roles) | Conduct privacy impact assessment; pass with no findings |
| | Section 508 (WCAG 2.1 AA) compliance | Automated accessibility score ≥ 90% |
| **Reliability** | Pipeline nightly run success rate | ≥ 99 % (max 1 failure per month) |
| | Dashboard availability (VA intranet) | 99.5 % uptime (excluding scheduled maintenance) |
| **Compatibility** | Supported browsers: Edge (latest), Chrome (latest), Firefox (latest) on Windows 10+ and macOS 13+ | Cross‑browser UI tests pass |
| | Platform: Hosted in VA‑approved Azure Government Cloud | Deployment scripts target Azure Gov region |
| **Maintainability** | Code coverage ≥ 80 % for unit tests | CI pipeline enforces coverage threshold |
| | Documentation versioned; latest version tagged v1.0.0 | Git tag exists and matches delivered artifacts |

---  

## 6. ARCHITECTURE & TECHNOLOGY STACK  

* **Ingestion & Processing** – Azure Data Factory (ADF) orchestrating Azure Functions (Python) for cleaning & classification.  
* **Storage** – Azure Data Lake Gen2 (Gov) for raw, cleaned, and classified data.  
* **Compute** – Azure Databricks (or Azure Synapse Serverless) for transformation; Docker containers for classification microservice.  
* **CI/CD** – Azure DevOps pipelines linked to GitHub Enterprise.  
* **Dashboard** – Power BI Service (Azure Gov) or Tableau Server (VA‑approved).  
* **Identity** – Azure Active Directory (Azure AD) for RBAC, SSO via VA‑approved IdP.  
* **Monitoring** – Azure Monitor, Log Analytics, and Azure Security Center.  

---  

## 6. TEST PLAN (High‑Level)

| Test ID | Requirement(s) | Test Type | Description |
|---------|-----------------|-----------|-------------|
| **TC‑01** | FR‑01, FR‑02 | Integration | Run the full pipeline on a copy of 2023 data; verify cleaned output and error handling. |
| **TC‑02** | FR‑03, FR‑04 | Unit/Integration | Provide 200 expert‑reviewed trips; compute label agreement ≥ 95 %. |
| **TC‑03** | FR‑06, FR‑07 | UI Performance | Automated UI script selects each month & trip‑type; measure response time. |
| **TC‑04** | FR‑08, FR‑09 | Security & Accessibility | Attempt unauthorized access; run Axe accessibility scan. |
| **TC‑05** | FR‑10 | Documentation Review | Checklist verification of all deliverables. |
| **TC‑06** | FR‑11 | CI/CD | Push a PR with failing unit test; pipeline should reject merge. |
| **TC‑07** | NFR‑Performance | Load Test | Simulate 50 concurrent users applying filters; average response ≤ 2 seconds. |
| **TC‑08** | NFR‑Compliance | Privacy Impact Assessment | External audit; no PHI leakage. |

---  

## 7. DEPLOYMENT & OPERATIONS  

1. **Infrastructure as Code** – Azure Resource Manager (ARM) templates provision Data Lake, Function Apps, and Power BI workspace.  
2. **Pipeline Scheduling** – Azure Data Factory triggers nightly at 02:00 UTC; failure notifications sent to Ops email and PagerDuty.  
3. **Dashboard Publishing** – Power BI workspace `Ambulance2023` published to VA intranet via Power BI embedded with Azure AD authentication.  
4. **Rollback** – Deployment script stores previous version in Azure Blob `releases/` and can restore with a single command.  

---  

## 8. RISK LOG & MITIGATION  

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **R‑01**: Inaccurate Provider Lists (fleet or contract) cause mis‑classification. | Medium | High (incorrect cost‑saving analysis) | Establish quarterly data‑owner review of provider lists; include “Review‑Needed” flag for unknown IDs. |
| **R‑02**: Pipeline failure due to schema change in source CSV. | Low | High | Implement schema‑validation step; if mismatch detected, pipeline aborts and alerts data owners. |
| **R‑03**: Unauthorized exposure of PHI via dashboard. | Low | Critical | Enforce strict RBAC, hide PHI columns from `Leadership` role, perform quarterly privacy audits. |
| **R‑04**: Dashboard performance degrades as data grows. | Medium | Medium | Use aggregated view (pre‑computed monthly totals) in Power BI; monitor query execution plans. |
| **R‑05**: Accessibility non‑compliance leads to VA OMB penalties. | Low | Medium | Conduct early accessibility testing; allocate time in sprint for remediation. |

---  

## 9. IMPLEMENTATION PLAN (Milestones)

| Sprint | Duration | Deliverables |
|--------|----------|--------------|
| **Sprint 1** (2 weeks) | Requirements finalization, architecture diagram, repository setup. | Approved BRD, initial repo with README. |
| **Sprint 2** (3 weeks) | Build data ingestion & cleaning pipeline; unit tests. | FR‑01‑FR‑02 implemented, pipeline nightly run. |
| **Sprint 3** (3 weeks) | Implement classification engine, rule JSON, audit logging. | FR‑03‑FR‑04 complete; unit tests achieving ≥ 95 % label accuracy. |
| **Sprint 4** (2 weeks) | Create Power BI data model, publish to Azure Gov; develop dashboard visuals. | FR‑05‑FR‑06 functional; basic UI. |
| **Sprint 5** (2 weeks) | Add RBAC, security hardening, encryption verification. | FR‑08 satisfied; security scan pass. |
| **Sprint 6** (2 weeks) | Performance tuning, accessibility compliance, load testing. | FR‑07, Section 508 targets met. |
| **Sprint 7** (1 week) | Documentation, user guide, training session for leadership. | FR‑10 delivered. |
| **Sprint 8** (1 week) | Final integration testing, sign‑off, production deployment. | All requirements passed; go‑live. |

---  

## 10. APPROVALS  

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner |  |  |  |
| Technical Lead |  |  |  |
| Security Officer |  |  |  |
| Documentation Lead |  |  |  |
| VA OMB Compliance |  |  |  |

---  

*Prepared by: **[Your Name]**, Business Analyst – VA Health Services*  
*Date: **[Insert Date]***  

---  

**End of Document**.