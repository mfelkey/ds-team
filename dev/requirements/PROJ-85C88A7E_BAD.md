# Business Analysis Document (BAD)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Business Analyst – (Your Name)  
**Date:** 19 February 2026  

---  

## 1. Stakeholder Analysis  

| # | Stakeholder (Name / Org) | Role / Title | Interest Level | Influence Level | Engagement Strategy |
|---|--------------------------|--------------|----------------|-----------------|----------------------|
| 1 | **Chief Medical Officer (CMO)** – VHA Headquarters | Executive Sponsor | HIGH | HIGH | Executive briefing deck + quarterly steering meeting; email summary of KPI trends; invite to demo sessions |
| 2 | **Chief Financial Officer (CFO)** – VHA Headquarters | Executive Sponsor | HIGH | HIGH | Same as CMO + cost‑saving impact analysis; quarterly ROI report |
| 3 | **Director, Office of Health Economics** – VHA | Business Owner | HIGH | MED | Bi‑weekly requirement refinement calls; access to raw and cleaned datasets for ad‑hoc analysis |
| 4 | **Regional Ambulance Operations Manager** – each VA Medical Center (VAMC) | Operational Lead | HIGH | MED | Monthly ops‑review webinars; walkthrough of classification results for contract negotiation |
| 5 | **VA Information Security Officer** – VA InfoSec | Compliance & Security | MED | HIGH | Security‑review checklist; pre‑deployment security assessment; continuous monitoring plan |
| 6 | **VA Accessibility Lead** – VA OIT | Section 508 Compliance | MED | MED | Early UI mock‑up reviews; accessibility testing sign‑off |
| 7 | **Data Science Lead** – VA Data Science Team | Technical Lead (DS) | HIGH | MED | Sprint planning; code review; data‑quality sign‑off |
| 8 | **BI Development Lead** – VA Business Intelligence | Technical Lead (BI) | HIGH | MED | Dashboard prototype demos; performance testing |
| 9 | **DevOps / Platform Engineer** – VA OIT | Deployment & Ops | MED | MED | CI/CD pipeline walkthrough; environment provisioning |
| 10| **End‑User (Dashboard Viewer)** – Senior Administrators/Analysts (multiple sites) | Consumer | MED | LOW | Training webinars; user guide; support ticket channel |
| 11| **Veterans (indirect)** | Data subjects | LOW | LOW | Privacy notice; assurance of PHI protection |

### High‑Influence Stakeholder Concerns & Mitigation  

| Stakeholder | Likely Concern | Mitigation / Response |
|-------------|----------------|-----------------------|
| **CMO** | *Will the classification accurately reflect clinical appropriateness?* | Provide transparent rule documentation, include clinical reviewer in rule‑definition workshops, and pilot‑test against a clinician‑validated sample set (≥95 % agreement). |
| **CFO** | *Will the solution deliver measurable cost savings and ROI?* | Deliver a cost‑benefit model (baseline spend vs. projected reduction) in the first quarterly report; embed cost‑per‑trip KPI in the dashboard. |
| **VA Information Security Officer** | *Data security, HIPAA compliance, and role‑based access.* | Conduct a Privacy Impact Assessment (PIA), implement VA‑approved encryption at rest & in transit, enforce least‑privilege RBAC, and obtain Security Review Board sign‑off before go‑live. |
| **VA Accessibility Lead** | *Dashboard must meet Section 508.* | Use VA‑approved Power BI template with built‑in accessibility features, perform WCAG‑2.1 AA testing, and provide an accessibility statement. |
| **Regional Operations Managers** | *Will the classification affect existing contracts or staffing plans?* | Deliver a “Contract Impact Report” that maps classified trips to each provider contract; provide a change‑management workshop before policy changes. |

### Communication Plan  

| Audience | Communication Type | Frequency | Channel | Owner |
|----------|--------------------|-----------|---------|-------|
| Executive Sponsors (CMO, CFO) | KPI & ROI Executive Summary | Monthly | PowerPoint deck via encrypted email + secure SharePoint site | BA Lead |
| Health Economics Team | Raw & Cleaned Data extracts, Rule change notices | Bi‑weekly | Secure FTP / VA‑approved Data Lake | Data Science Lead |
| Ops Managers (Regional) | Classification results, Contract Impact Report | Monthly | PDF report via VA intranet portal | BI Lead |
| InfoSec & Compliance | Security testing results, PIA updates | As‑needed (pre‑release, post‑release) | Secure ticketing system (ServiceNow) | DevOps Lead |
| Accessibility Lead | UI mock‑ups, accessibility test results | At each UI milestone | Email + Teams meeting | BI Lead |
| End‑User (Dashboard Viewer) | Dashboard training, release notes | Quarterly (or with each release) | Webinar + recorded video + PDF guide | BA Lead |
| Development Team (DS, BI, DevOps) | Sprint demo, issue backlog, technical decisions | Weekly (Scrum) | Azure DevOps Boards | Scrum Master |
| Veterans (indirect) | Privacy notice, data‑use statement | One‑time (launch) | VA public website | InfoSec Lead |

---  

## 2. Current State Process Flow  

Below is a **linear narrative** of how an ambulance trip is currently handled at the VA, followed by a **process diagram** (textual representation).  

### 2.1 Narrative Steps  

| Step | Activity | System(s) Involved | Data Created / Modified | PHI Involved? | Primary Owner |
|------|----------|--------------------|------------------------|--------------|---------------|
| 1 | **Veteran initiates transport request** (via VA patient portal, primary care call center, or external provider referral). | VistA/CPRS, VA Patient Portal | `RequestID`, `VeteranID`, `RequestedDateTime`, `RequestedServiceType` | Yes (VeteranID, DOB) | VA Clinic Scheduler |
| 2 | **Authorization decision** – Clinical staff verifies medical necessity per VA policy. | VistA/CPRS | `AuthorizationFlag` (Y/N), `AuthorizedProviderID` (if pre‑selected), `AuthDateTime` | Yes | Clinical Provider |
| 3 | **Dispatch** – Authorized request entered into the VA Ambulance Management System (AMS). | AMS (custom VA app) | `DispatchID`, `DispatchTime`, `ProviderID` (selected), `VehicleID` | Yes (VeteranID, location) | Dispatch Coordinator |
| 4 | **Provider performs transport** – Either an **in‑house VA ambulance unit** or a **contracted third‑party**. Provider logs trip details in its own system (e.g., VA Fleet Management or vendor EHR). | Provider‑side system (VA Fleet, Vendor TMS) | `TripStartTime`, `TripEndTime`, `TripDistance`, `MileageOdometer`, `PatientOutcome` | Yes (VeteranID, health status) | Provider |
| 5 | **Trip data transmission** – Provider uploads a CSV/flat file nightly to VA’s Secure File Transfer (SFTP). | SFTP Gateway | Raw `TripFile` (CSV) containing all fields above + cost fields | Yes | Vendor IT / VA Fleet IT |
| 6 | **Ingestion to Enterprise Data Warehouse (EDW)** – VA’s nightly ETL pulls files, loads into staging tables (`STG_AMBULANCE_TRIPS`). | EDW (Oracle/SQL Server) | Staging rows; minimal validation (PK, datatype) | Yes | VA Data Warehouse Team |
| 7 | **Reporting & analytics** – Quarterly “Narrative Report” manually generated by data engineers using ad‑hoc SQL, then sent to leadership as PDF. | SQL Server Management Studio, Excel | Aggregated counts & cost totals; no classification column. | Yes (aggregate PHI may be present) | Data Engineer |
| 8 | **Billing** – Finance team manually reconciles invoices from contracted providers and internal cost codes. | VA Financial System (VAFS) | `InvoiceID`, `TripID`, `ChargeAmount`, `PaymentStatus` | Yes (VeteranID for cost allocation) | Finance Analyst |

### 2.2 Process Diagram (Textual)  

```
Veteran Request → Authorization (VistA/CPRS) → Dispatch (AMS) → Provider Executes Trip
      │                       │                         │                     │
      ▼                       ▼                         ▼                     ▼
   RequestID               AuthFlag                DispatchID           TripLog (Provider)
      │                       │                         │                     │
      └─────► SFTP (CSV) ◄─────┘                         └─────► Nightly ETL ◄───┘
                               │                                      │
                               ▼                                      ▼
                         Staging Table (EDW)                     EDW Fact Table
                               │                                      │
                               └─────► Quarterly Narrative Report ◀───┘
```

### 2.3 Pain Points & Bottlenecks  

| Pain Point | Description | Impact | Root Cause |
|------------|-------------|--------|------------|
| **Unclean raw data** | Inconsistent date formats, missing `ProviderID`, duplicate rows. | Inaccurate reporting, extra manual QA. | No standardized ingestion validation. |
| **No classification** | No column indicating “In‑House vs Contracted”. | Leadership cannot see cost‑saving opportunities. | Business rule not codified; reliance on manual review. |
| **Manual quarterly reporting** | Analysts write ad‑hoc SQL, format PDFs. | Delayed insight, high labor cost, error‑prone. | No self‑service visualization. |
| **Data latency** | Nightly batch → data up to 24 h old. | Decision‑makers lack near‑real‑time view. | No streaming or incremental load. |
| **PHI exposure risk** | Raw CSV files contain Veteran identifiers; stored on SFTP without encryption at rest. | Potential HIPAA violation. | Legacy file‑transfer process. |
| **Limited access control** | Anyone with read access to EDW schema can view PHI. | Non‑compliant with least‑privilege principle. | Broad role assignments. |
| **Contract reconciliation** | Finance matches invoices to trips manually. | Time‑consuming, error‑prone. | Lack of trip‑to‑invoice linkage. |

---  

## 3. Future State Process Flow (Target)  

The **Future State** introduces **automated data‑quality, classification, and visualization** while tightening security and compliance.  

### 3.1 Narrative Steps  

| Step | Activity | System(s) Involved | Data Created / Modified | PHI Involved? | Primary Owner |
|------|----------|--------------------|------------------------|--------------|---------------|
| 1 | Same as Current Step 1 (Veteran request). | VistA/CPRS, VA Portal | `RequestID`, `VeteranID`, … | Yes | Scheduler |
| 2 | Same as Current Step 2 (Authorization). | VistA/CPRS | `AuthorizationFlag`, `AuthorizedProviderID` | Yes | Clinical Provider |
| 3 | Same as Current Step 3 (Dispatch). | AMS | `DispatchID`, `ProviderID` (selected) | Yes | Dispatcher |
| 4 | Provider executes trip; logs into **Standardized Trip Capture API** (VA‑approved). | Provider‑side API (REST over TLS) | `TripStartTime`, `TripEndTime`, `Distance`, `Cost`, `VeteranID` | Yes | Provider |
| 5 | **Real‑time streaming** – API pushes JSON payload to VA **Event Hub** (Azure Event Hubs). | Event Hub | Individual trip event | Yes | Provider |
| 6 | **Incremental ETL** – Azure Data Factory (ADF) consumes events, applies **data‑quality rules** (format, PK, duplicates) and writes to **Clean Staging** (`STG_AMBULANCE_TRIPS_CLEAN`). | ADF, Azure SQL DW | Clean rows, de‑duplicated, normalized dates. | Yes (masked VeteranID) | Data Engineering |
| 7 | **Classification Engine** – Azure Databricks job runs classification logic (lookup of `ProviderID` in `VA_PROVIDER_CONTRACTS` table) and adds `ServiceModel` = {‘IN_HOUSE’, ‘CONTRACTED’}. | Databricks (Python/SQL) | `ServiceModel` column added to fact rows. | No (derived, not PHI) | Data Science Lead |
| 8 | **Enriched Fact Table** – `FACT_AMBULANCE_TRIPS` contains `ServiceModel`, cost, clinical timestamps, and a **PHI‑masked surrogate key** (`Veteran_SK`). | EDW (Azure Synapse) | Fully‑validated, classified rows. | No direct PHI (only surrogate). | Data Warehouse Team |
| 9 | **Self‑service Dashboard** – Power BI (VA‑approved) reads from `FACT_AMBULANCE_TRIPS`. Includes filters for **In‑House vs Contracted**, **Cost per Provider**, **Utilization Trends**. | Power BI Service (VA OIT) | No new data created; visual aggregates. | No (aggregated). | BI Lead |
| 10 | **Automated Billing Reconciliation** – Finance workflow consumes `ServiceModel` to route internal vs external invoices automatically. | VAFS, Billing Automation Service | `InvoiceID`, `TripID`, `ChargeAmount`, `PaymentStatus` | Yes (VeteranID masked) | Finance Analyst |
| 11 | **Security & Monitoring** – Continuous audit logs, DLP alerts on PHI movement. | Azure Sentinel, ServiceNow | Log records | No (metadata only) | InfoSec |

### 2.4 Process Diagram (Textual)  

```
Veteran Request → Authorization → Dispatch → Provider Executes Trip
      │                       │                         │
      ▼                       ▼                         ▼
   RequestID               AuthFlag                DispatchID
      │                       │                         │
      └─────► API (JSON) ◄─────┘                         └─────► Event Hub ◄───┘
                               │                                      │
                               ▼                                      ▼
                         Real‑time Stream → Azure Data Factory → Clean Staging
                               │                                      │
                               ▼                                      ▼
                     Classification Engine (Databricks)          Fact Table
                               │                                      │
                               └─────► Power BI Dashboard (Self‑service) ◀─┘
```

### 2.5 Expected Improvements  

| Improvement | Metric (Baseline → Target) |
|-------------|---------------------------|
| **Data Quality** | Duplicate rows ≤0.1 %; 100 % of dates normalized to `YYYY‑MM‑DD HH:MM:SS`. |
| **Classification Availability** | New column `ServiceModel` present on **first** data load. |
| **Reporting Latency** | From nightly → **near‑real‑time** (≤5 min) after trip completion. |
| **Cost Insight** | Ability to slice spend by `ServiceModel` and provider contract. |
| **PHI Protection** | Encrypted SFTP, masked VeteranID in analytical tables; compliance with PIA. |
| **Access Control** | RBAC enforced at dashboard level; only authorized roles see PHI‑masked view. |
| **User Adoption** | ≥80 % of identified end‑users complete training and access dashboard within 2 weeks of release. |

---  

## 3. Future State Process Flow  

### 3.1 Narrative Steps  

| Step | Activity | System(s) Involved | Data Created / Modified | PHI Involved? | Primary Owner |
|------|----------|--------------------|------------------------|--------------|---------------|
| 1 | Veteran request (unchanged). | VistA/CPRS, Patient Portal | `RequestID`, `VeteranID`, `RequestedServiceType` | Yes | Scheduler |
| 2 | Authorization (unchanged). | VistA/CPRS | `AuthorizationFlag`, `AuthorizedProviderID` | Yes | Provider |
| 3 | Dispatch (AMS) – **Provider selection stored in a master reference table** (`REF_PROVIDER`). | AMS | `DispatchID`, `ProviderID`, `DispatchTime` | Yes | Dispatcher |
| 4 | Provider executes trip and logs into **Standardized Trip Capture API** (REST, JSON). | Provider API (VA‑approved) | `TripID`, `VeteranID`, `StartTime`, `EndTime`, `Distance`, `Cost`, `ProviderID` | Yes | Provider |
| 5 | **Real‑time streaming** – API pushes each trip event to **Azure Event Hub** (TLS‑encrypted). | Event Hub | One event per trip (no file). | Yes | Provider |
| 6 | **Incremental ETL** – Azure Data Factory (ADF) reads events, applies **schema validation**, **deduplication**, **date normalization**, and writes to **Clean Staging** (`STG_AMBULANCE_TRIPS_CLEAN`). | ADF | Clean rows; `ProviderID` validated against `REF_PROVIDER`. | Yes (masked VeteranID) | Data Warehouse Team |
| 7 | **Classification Engine** – Databricks job runs **Rule‑Based Classification** (lookup against `REF_PROVIDER_CONTRACTS`). Adds `ServiceModel` column (`IN_HOUSE`, `CONTRACTED`). | Databricks | Enriched fact rows. | No (derived column) | Data Science Lead |
| 8 | **Enriched Fact Table** – `FACT_AMBULANCE_TRIPS` stores the clean, classified data. | Synapse DW | `TripID`, `Veteran_SK`, `ProviderID`, `ServiceModel`, `Cost`, timestamps, etc. | No direct PHI (Veteran_SK is surrogate). | Data Warehouse Team |
| 9 | **Power BI Dashboard** – Consumes `FACT_AMBULANCE_TRIPS` via **role‑based views**. Provides filters: `ServiceModel`, `Provider`, `Date Range`, `Medical Necessity Flag`. | Power BI Service (VA‑approved) | Visual KPIs: *Total Trips*, *Cost per Service Model*, *% In‑House*, *Monthly Trend*, *Contract Impact*. | No (aggregated). | BI Lead |
| 10 | **Automated Billing Reconciliation** – Finance bot reads `ServiceModel` to apply correct cost center (internal vs external). | VA Financial System (VAFS) | `InvoiceID`, `TripID`, `ChargeAmount`, `AllocationCode`. | No (no VeteranID needed for allocation) | Finance Automation Engineer |
| 11 | **Monitoring & Auditing** – Azure Sentinel captures any PHI movement, alerts on anomalous SFTP usage (should be none). | Sentinel, ServiceNow | Audit logs | Yes (metadata) | InfoSec |

### 3.2 Process Diagram (Textual)  

```
Veteran Request → Authorization → Dispatch → Provider Executes Trip
      │                       │                         │                     │
      ▼                       ▼                         ▼                     ▼
   RequestID               AuthFlag                DispatchID           TripEvent (API)
      │                       │                         │                     │
      └─────► Azure Event Hub (JSON) ◄─────┘                         └─────► ADF Incremental Load ◄───┘
                               │                                      │
                               ▼                                      ▼
                         Clean Staging Table                     Fact Table (with ServiceModel)
                               │                                      │
                               └─────► Classification Engine ◀─────────┘
                               │
                               ▼
                         Power BI Dashboard (Self‑service)
```

### 3.3 Anticipated Benefits  

| Benefit | Metric / KPI |
|---------|--------------|
| **Data Quality** | Duplicate detection <0.01 %; 100 % schema compliance. |
| **Classification Coverage** | `ServiceModel` present on **all** trips after first run. |
| **Reporting Speed** | Dashboard reflects data ≤5 min after trip completion. |
| **Cost Transparency** | Ability to report **Cost per Service Model** monthly. |
| **Reduced Manual Effort** | Billing reconciliation automated → **80 % reduction** in manual steps. |
| **Security** | No PHI stored in analytical tables; compliance with PIA. |
| **User Adoption** | ≥80 % of target users active on dashboard within 2 weeks. |

---  

## 4. Data Model Overview  

### 4.1 Core Tables (Future State)

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `REF_PROVIDER` | Master list of all providers (internal & external). | `ProviderID` (PK), `ProviderName`, `ContractType` (`IN_HOUSE` / `CONTRACTED`) |
| `REF_PROVIDER_CONTRACTS` | Contract details per provider (billing codes, cost centers). | `ProviderID` (FK), `ContractStartDate`, `ContractEndDate`, `BillingCode` |
| `STG_AMBULANCE_TRIPS_CLEAN` | Cleaned staging area before classification. | `TripID`, `Veteran_SK` (surrogate), `ProviderID`, `StartTime`, `EndTime`, `Distance`, `Cost` |
| `FACT_AMBULANCE_TRIPS` | Final fact table consumed by dashboard. | `TripID` (PK), `Veteran_SK`, `ProviderID`, `ServiceModel`, `Cost`, `TripDate`, `MedicalNecessityFlag` |
| `DIM_DATE` | Date dimension for time‑based analysis. | `DateKey`, `Date`, `Month`, `Quarter`, `Year` |
| `DIM_PROVIDER` | Provider dimension (includes contract status). | `ProviderID`, `ProviderName`, `ServiceModel` |
| `DIM_VETERAN` | Veteran surrogate dimension (masked). | `Veteran_SK`, `VeteranID_Masked` (hashed) |

### 4.2 Classification Logic (Pseudo‑code)

```sql
-- Databricks / Spark SQL
WITH ProviderInfo AS (
    SELECT ProviderID,
           CASE WHEN ContractType = 'IN_HOUSE' THEN 'IN_HOUSE'
                ELSE 'CONTRACTED' END AS ServiceModel
    FROM REF_PROVIDER_CONTRACTS
)
SELECT s.*, p.ServiceModel
FROM STG_AMBULANCE_TRIPS_CLEAN s
LEFT JOIN ProviderInfo p
  ON s.ProviderID = p.ProviderID;
```

### 4.3 Security Controls  

| Control | Implementation |
|---------|----------------|
| **Encryption at Rest** | Azure Storage Service Encryption (SSE) for all tables. |
| **Encryption in Transit** | TLS 1.2 for API calls; Event Hub uses HTTPS. |
| **PHI Masking** | VeteranID replaced by surrogate key (`Veteran_SK`) before loading into fact. |
| **RBAC** | Power BI workspace permissions limited to roles: `Analyst_InHouse`, `Analyst_Contracted`, `Finance`. |
| **Audit Logging** | Azure Monitor logs every read/write operation on `FACT_AMBULANCE_TRIPS`. |
| **DLP** | Azure DLP policies to detect any PHI export attempts. |
| **Compliance** | Periodic review against PIA; automated alerts on policy violations. |

---  

## 4. Implementation Plan (High‑Level Timeline)

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| **Phase 1 – Discovery & Design** | 2 weeks | Detailed requirements gathering, data‑quality rule definition, contract reference data mapping. |
| **Phase 2 – Infrastructure Setup** | 3 weeks | Provision Event Hub, ADF pipelines, Databricks workspace, Synapse DW; configure RBAC and encryption. |
| **Phase 3 – Data‑Quality & Classification Development** | 4 weeks | Implement ADF data‑quality transformations; develop classification Databricks notebooks; unit testing with sample data. |
| **Phase 4 – Dashboard Development** | 3 weeks | Build Power BI reports, apply role‑based views, perform accessibility testing. |
| **Phase 5 – Security & Monitoring** | 2 weeks | Deploy Sentinel alerts, configure DLP, run PIA validation, conduct security testing. |
| **Phase 6 – User Acceptance Testing (UAT)** | 2 weeks | Conduct UAT with clinical, finance, and analyst users; gather feedback; refine dashboards and classification rules. |
| **Phase 7 – Training & Roll‑out** | 1 week | Conduct training sessions, distribute documentation, enable dashboard access. |
| **Phase 8 – Go‑Live & Support** | Ongoing | Monitor system health, address post‑launch issues, continuous improvement. |

### Total Estimated Timeline: **~17 weeks (≈4 months)**

---  

## 5. Conclusion  

By transitioning from a **batch‑file, manual classification** approach to a **real‑time, automated classification** pipeline, the organization will achieve:

* **Immediate visibility** into the split between in‑house and contracted ambulance services.  
* **Accurate, up‑to‑date cost tracking** by service model and provider contract.  
* **Reduced manual effort** in data cleaning, classification, and billing reconciliation.  
* **Enhanced security and compliance** through encryption, PHI masking, and RBAC.  
* **Improved decision‑making** for resource allocation, contract negotiations, and operational efficiency.

The outlined future state leverages Azure services (Event Hub, Data Factory, Databricks, Synapse) and Power BI, all of which are compatible with VA security standards, ensuring a scalable, maintainable solution for ongoing ambulance service analytics.