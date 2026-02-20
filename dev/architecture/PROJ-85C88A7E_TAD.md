# Technical Architecture Document (TAD)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Principal Technical Architect – [Your Name]  
**Date:** 19 February 2026  

---

## Table of Contents
1. [System Context](#1-system-context)  
2. [Component Architecture](#2-component-architecture)  
3. [Data Architecture](#3-data-architecture)  
4. [API Specifications](#4-api-specifications)  
5. [Infrastructure & Deployment](#5-infrastructure--deployment)  
6. [Security Architecture](#6-security-architecture)  
7. [Non‑Functional Requirements Design](#7-non-functional-requirements-design)  
8. [Architecture Decisions Log (ADL)](#8-architecture-decisions-log-adl)  

---  

## 1. System Context
### 1.1 System Boundary (textual diagram)

```
+-------------------+          +-------------------+          +-------------------+
|   VA EDW (SQL DW) |  <--->  |   Ingestion Layer |  <--->  |   Processing &    |
|   (source raw    )|          |   Azure Data      |          |   Classification  |
|   ambulance data) |          |   Factory (ADF)   |          |   (Databricks)    |
+-------------------+          +-------------------+          +-------------------+
                                                                |
                                                                v
+-------------------+          +-------------------+          +-------------------+
|   Storage Layer   |  <--->  |   Model Service   |  <--->  |   Reporting Layer |
|   ADLS Gen2 (raw) |          |   AKS / ACI       |          |   Power BI (SaaS) |
+-------------------+          +-------------------+          +-------------------+
                                                                |
                                                                v
+-------------------+          +-------------------+          +-------------------+
|   Security &      |  <--->  |   Monitoring &    |  <--->  |   End‑User (Web)  |
|   Compliance (KV) |          |   Logging (Log    |          |   Power BI       |
+-------------------+          |   Analytics)      |          +-------------------+
```

### 1.2 External Systems & Integrations
| External System | Purpose | Integration Mechanism |
|-----------------|---------|-----------------------|
| **VA Enterprise Data Warehouse (EDW)** | Source of raw 2023 ambulance‑trip table | Azure Data Factory (ADF) *Copy* activity using Azure SQL Database linked service (GovCloud) |
| **VA Identity & Access Management (IAM)** | Authentication & group membership for all users | Azure AD (Government) – Managed Identities & Azure AD groups |
| **VA Information Security Office (ISO)** | Review of ATO, PIA, and continuous monitoring | Azure Policy, Azure Security Center (Defender for Cloud) |
| **Power BI Service (GovCloud)** | Dashboard visualisation and distribution | DirectQuery to Azure SQL Database (Business‑Critical tier) |
| **Azure Key Vault (Gov)** | Secure storage of secrets, certificates, and tokenization keys | Managed Identity access from all compute components |
| **VA Backup & DR System** | Long‑term archival and disaster recovery | Azure Backup vault + Azure Site Recovery (region‑pair) |
| **Optional SFTP Feed** (if legacy files exist) | Ingest supplemental CSV files | Azure Logic Apps → Azure Blob Storage (landing zone) |

### 1.3 User Roles & Access Patterns
| Role | Azure AD Group | Primary Activities | Data Sensitivity |
|------|----------------|--------------------|------------------|
| **VA Leadership (CMO, CFO)** | `VA-Leadership` | View dashboard, export summary reports | Read‑only on reporting DB |
| **Health‑Economics Analyst** | `VA-HE-Analyst` | Drill‑down analysis, ad‑hoc queries | Read‑only on reporting DB |
| **Ambulance Ops Manager** | `VA-Ops-Manager` | Review classification per facility | Read‑only on reporting DB |
| **Data Engineer** | `VA-Data-Engineer` | Manage pipelines, update schema | Read/Write on ADLS & Synapse (dev & test) |
| **Data Scientist** | `VA-Data-Scientist` | Train/refine ML model, trigger re‑classify | Read/Write on ADLS, AKS |
| **BI Developer** | `VA-BI-Dev` | Build Power BI data model, publish app | Read/Write on Azure SQL (dev) |
| **Security Officer** | `VA-Sec-Officer` | Review logs, approve ATO artifacts | Full audit access |
| **System Administrator** | `VA-Admin` | Provision resources, manage CI/CD | Full admin rights (restricted to subscription) |

*All access is enforced via Azure AD Conditional Access (MFA, Government Cloud compliant) and RBAC at the resource level.*

---  

## 2. Component Architecture
### 2.1 Component Catalog & Responsibilities
| Component | Azure Service (Gov) | Responsibility |
|-----------|---------------------|----------------|
| **Ingestion Layer** | Azure Data Factory (ADF) | Orchestrates extraction from EDW, landing to ADLS raw zone, initial validation |
| **Raw Data Lake** | Azure Data Lake Storage Gen2 (ADLS Gen2) – Hot tier | Immutable storage of source files (parquet) for audit & re‑processing |
| **Processing & Classification** | Azure Databricks (Standard) + Azure Machine Learning (managed) | Data cleaning, feature engineering, ML inference (binary classifier: In‑House vs Contracted) |
| **Model Service** | Azure Kubernetes Service (AKS) – Standard_D4s_v3 (4 vCPU, 16 GB) *or* Azure Container Instances (ACI) for low‑volume | Exposes REST endpoint for on‑demand classification of new trips (future‑proof for streaming) |
| **Reporting Data Store** | Azure SQL Database – Business Critical tier (Gen5, 8 vCores) | Stores cleaned & classified trips; Power BI DirectQuery source |
| **Dashboard** | Power BI Service (Gov) | Interactive visualisation, filters, export, Section 508 compliant UI |
| **Metadata & Governance** | Azure Purview (Gov) | Data catalog, lineage, data‑dictionary generation |
| **Secret Management** | Azure Key Vault (Gov) | Holds DB connection strings, model keys, tokenization keys |
| **Monitoring & Logging** | Azure Monitor + Log Analytics Workspace | Metrics, health probes, audit logs, alerts |
| **CI/CD & IaC** | Azure DevOps Pipelines + Bicep templates | Automated build, test, release across environments |
| **Backup & DR** | Azure Backup + Azure Site Recovery | Point‑in‑time backups, geo‑redundant replication |

### 2.2 Component Interaction (textual diagram)

```
[VA EDW] --> (ADF Copy) --> [ADLS Raw Zone]
                                 |
                                 v
                       [Databricks Notebook]
           (Read raw parquet)  |  (Write cleaned parquet)
                                 v
                     [ADLS Clean Zone (parquet)]
                                 |
                                 v
                     [Model Service (AKS/ACI)]
                                 |
                                 v
                      [Azure SQL Reporting DB]
                                 |
                                 v
                       [Power BI Service (Gov)]
                                 |
                                 v
                         [VA Leadership / Analysts]
```

*All arrows represent **HTTPS/TLS 1.2** secured traffic. Managed Identities are used for service‑to‑service authentication; no secrets are stored in code.*

### 2.3 Rationale & Trade‑offs
| Decision | Why the chosen Azure service? |
|----------|------------------------------|
| **Databricks over Synapse Spark** | Databricks offers native notebook experience, easier library management (PyPI, Maven) for the data‑science team, and proven performance on GovCloud. |
| **AKS for model serving** | Provides a stable, horizontally‑scalable platform for a REST‑ful inference API, essential for future streaming (e.g., real‑time trip uploads). AKS also integrates with Azure AD Workload Identity, eliminating secret leakage. |
| **Azure SQL Business Critical** | Guarantees **99.99 %** availability with zone‑redundant storage, TDE, and row‑level security – a prerequisite for PHI‑containing reporting tables. DirectQuery from Power BI requires a relational source. |
| **Power BI Service (Gov)** | Already approved for VA reporting; supports Section 508 compliance, row‑level security, and multi‑factor authentication via Azure AD. |
| **Azure Key Vault** | Centralised secret store that is audited, supports purge protection and soft‑delete – mandatory for VA ATO. |
| **Bicep IaC** | Native Azure ARM‑template language, fully supported in GovCloud, enables policy‑as‑code and easier integration with Azure DevOps. |

---  

## 3. Data Architecture
### 3.1 Logical Data Model (Cleaned & Classified)

| Table: `dbo.AmbulanceTrip` |
|---------------------------|
| **TripID** `uniqueidentifier` – primary key (GUID) |
| **PatientHash** `binary(32)` – SHA‑256 hash of PatientMRN (tokenized) |
| **PickupDateTime** `datetime2(7)` |
| **DropoffDateTime** `datetime2(7)` |
| **OriginFacilityID** `int` |
| **DestinationFacilityID** `int` |
| **PickupLocation** `nvarchar(100)` |
| **DropoffLocation** `nvarchar(100)` |
| **TripDurationMins** `int` (computed) |
| **DistanceMiles** `decimal(6,2)` |
| **ProviderSource** `nvarchar(20)` – values: `INHOUSE`, `CONTRACTED`, `UNKNOWN` (as received from EDW) |
| **ClassificationLabel** `nvarchar(20)` – `INHOUSE` / `CONTRACTED` / `UNDETERMINED` |
| **ClassificationScore** `float` – probability from ML model |
| **ProcessingTimestamp** `datetime2(7)` – when pipeline finished |
| **LoadDate** `date` – batch date for audit |

**Indexes**

```sql
CREATE CLUSTERED INDEX PK_AmbulanceTrip ON dbo.AmbulanceTrip (TripID);
CREATE NONCLUSTERED INDEX IX_Facility_Provider
    ON dbo.AmbulanceTrip (OriginFacilityID, DestinationFacilityID, ProviderType);
CREATE NONCLUSTERED INDEX IX_ClassificationScore
    ON dbo.AmbulanceTrip (ClassificationScore) INCLUDE (TripID);
```

### 2.2 Physical Zones (ADLS Gen2)

| Zone | Path | Retention | Purpose |
|------|------|-----------|---------|
| **Landing / Raw** | `/raw/ambulance/2023/` | 2 years (Gov policy) | Immutable copy of source data for re‑processing and audit |
| **Cleaned** | `/curated/ambulance/` | 7 years (VA record‑keeping) | Parquet files after cleaning & feature generation (used by Databricks) |
| **Model Artifacts** | `/models/ambulance_classifier/` | Indefinite (versioned) | Serialized model (ONNX / PyTorch) + tokenization key |
| **Archive (Cold)** | ADLS Gen2 – Cool tier (or Blob Cool) | 7 years after cleaning | Long‑term compliance storage, encrypted, immutable |

### 3.3 PHI Protection & Tokenization
* **Patient Identifiers** – The `PatientID` column is **tokenized** using a deterministic, cryptographic hash (SHA‑256) stored in Azure Key Vault. The original MRN never leaves the EDW.  
* **Encryption at Rest** –  
  * ADLS Gen2 – Service‑side encryption (AES‑256) automatically enabled.  
  * Azure SQL – Transparent Data Encryption (TDE) + Always Encrypted for the hashed patient column.  
* **Encryption in Transit** – All services enforce **TLS 1.2** (minimum) with cipher suites approved for Federal use.  
* **Column‑Level Security** – Power BI queries are limited to a **view** that excludes any PHI columns; the view only returns de‑identified data (hashed patient IDs).

### 3.4 Data Retention & Archival Policy
| Data Set | Retention Period | Archival Target | Backup Frequency |
|----------|------------------|-----------------|------------------|
| **Raw Parquet Files** | 2 years | ADLS Gen2 Cool tier (after 2 years) | Daily incremental snapshots via Azure Backup |
| **Cleaned/Classified Table** | 7 years (per VA health‑records policy) | Azure SQL *point‑in‑time* backups; after 7 years move to ADLS Cold tier for long‑term archive | Weekly full backup + transaction log backups every 15 min |
| **Model Artifacts** | Indefinite (versioned) | Azure Blob Cool + Azure ML model registry | On each model publish, create immutable snapshot |

---  

## 4. API Specifications
### 4.1 Classification Service (REST)

| Method | URI | Request Body | Response | Auth |
|--------|-----|--------------|----------|------|
| **POST** | `/api/v1/classifyTrip` | ```json { "tripId": "guid", "features": { ... } }``` | ```json { "tripId":"guid","label":"INHOUSE","score":0.87 }``` | Azure AD token (Managed Identity of caller) |
| **GET** | `/api/v1/trip/{tripId}` | – | ```json { "tripId":"guid","label":"INHOUSE","score":0.87, "processedAt":"2026‑02‑14T10:12:00Z" }``` | Azure AD token (role `VA-Data-Scientist` or higher) |
| **GET** | `/api/v1/health` | – | HTTP 200 + JSON `{ "status":"healthy" }` | No auth (public health endpoint) but only internal network traffic allowed via NSG |

*All responses are **application/json** and are compressed with GZIP. The service runs inside a private subnet; inbound traffic is limited to the VNet and Azure DevOps agents.*

### 4.2 Authentication & Authorization
* **Azure AD Managed Identity** – The service pod acquires a token to read the model artifact from Key Vault.  
* **OAuth 2.0 Bearer Token** – Clients obtain an Azure AD access token scoped to the custom app registration `VA-AmbulanceClassifier`.  
* **Rate Limiting** – Azure API Management (Gov) can be placed in front if future scaling demands per‑client throttling.

### 4.3 Error Handling (sample)

| HTTP Code | Meaning | Body |
|-----------|---------|------|
| 400 | Validation error (missing fields) | `{ "error":"Invalid payload","details":[...] }` |
| 401 | Unauthenticated | `{ "error":"Invalid or missing token" }` |
| 403 | Unauthorized (role not permitted) | `{ "error":"Insufficient permissions" }` |
| 500 | Internal service error | `{ "error":"Classification engine failure" }` |

---  

## 5. Infrastructure & Deployment
### 5.1 Physical Deployment Diagram (textual)

```
Subscription: VA-AmbulanceTripAnalysis
 └─ Resource Group: rg-ambulance-{env}
     ├─ VNet (10.0.0.0/16) – Azure Firewall (Gov)
     │   ├─ Subnet: snet-raw (ADLS Gen2, Logic Apps)
     │   ├─ Subnet: snet-processing (Databricks, AzureML)
     │   ├─ Subnet: snet-aks (AKS nodes, private endpoint)
     │   └─ Subnet: snet-db (Azure SQL, Private Link)
     ├─ ADLS Gen2 (Storage Account)
     ├─ Azure Data Factory
     ├─ Azure Databricks Workspace
     ├─ AKS Cluster (2 node pool, 3‑zone)
     ├─ Azure SQL Database (Business Critical)
     ├─ Power BI Service (Gov)
     ├─ Azure Key Vault
     ├─ Azure Monitor + Log Analytics Workspace
     └─ Azure DevOps Project (CI/CD pipelines)
```

### 5.2 Network & Security Controls
| Component | Controls |
|-----------|----------|
| **VNet** | Private DNS zones for Azure services; **Network Security Groups** restrict traffic to required ports (e.g., 443, 1433). |
| **Azure SQL Private Link** – Ensures the database is reachable only from within the VNet, eliminating exposure to the internet. |
| **AKS Private Endpoint** – Ingress is limited to the internal subnet; no public IPs are assigned. |
| **Azure Firewall** – Centralised outbound filtering; allows only required URLs (e.g., PyPI, Maven). |
| **NSG Rules** – Deny all inbound from Internet except Azure DevOps agents via a Service Tag `AzureDevOps`. |

### 5.3 CI/CD Pipeline (Azure DevOps)

| Stage | Tasks |
|-------|-------|
| **Build** | - Validate Bicep templates (`az bicep build`). <br> - Lint notebooks (`nbstripout` + `pylint`). |
| **Package** | - Publish Databricks notebook as a library artifact. <br> - Build Docker image for classification service and push to Azure Container Registry (ACR). |
| **Deploy Infra** | - Run `az deployment group create` with Bicep file for target `{env}`. <br> - Apply Azure Policy (e.g., `AllowedLocations`, `Tagging`). |
| **Deploy App** | - Deploy ADF pipelines. <br> - Deploy Databricks jobs (via `databricks-cli`). <br> - Deploy AKS Helm chart for the classifier API. |
| **Post‑Deploy** | - Run integration tests (Power BI data refresh). <br> - Generate ATO compliance report (export Key Vault audit logs). |

### 5.4 Monitoring, Logging, & Alerting
| Service | What is Monitored | Alert Destination |
|---------|-------------------|-------------------|
| **Azure Monitor** | Pipeline run duration, job success/failure, ADF activity logs | Azure Monitor Action Group → Email / Teams |
| **Log Analytics** | AKS pod logs, Databricks driver logs, classification API logs | SIEM integration (Splunk) |
| **Azure SQL** | DTU usage, deadlocks, transaction log backup failures | Email to DBA team |
| **Power BI Refresh** | Dataset refresh status, refresh duration | Teams channel `VA‑Analytics` |

*All logs are retained for **365 days** in Log Analytics (per VA logging guidelines).*

### 5.5 Governance & Policy Enforcement
* **Azure Policy** – Enforce **resource tagging** (`environment`, `owner`, `costcenter`).  
* **Purge Protection** – Enabled on Key Vault and storage accounts.  
* **Immutable Backups** – Azure SQL point‑in‑time backups are immutable for the required retention period.

---  

## 6. Security & Compliance Checklist (VA‑Specific)
| Requirement | Implementation |
|-------------|----------------|
| **FIPS‑140‑2 Encryption** | TLS 1.2 with approved cipher suites; AES‑256 at rest. |
| **Access Control** | Azure AD RBAC, role‑based Power BI row‑level security, Private Endpoints. |
| **Audit Trails** | Azure Activity Log, Key Vault audit logs, Azure SQL audit (to ADLS). |
| **Incident Response** | Alerts routed to VA Security Operations Center (SOC) via Azure Monitor. |
| **Continuous Compliance** | Azure Policy scans (weekly) for non‑compliant resources; non‑compliant resources are automatically flagged. |

---  

## 7. Operational Considerations
### 7.1 Scaling Strategy
* **Databricks** – Auto‑scale cluster based on workload; maximum 40 cores per node pool.  
* **AKS** – Horizontal pod autoscaler (HPA) can add up to **10** additional nodes; cluster autoscaler respects zone‑distribution.  
* **Azure SQL** – Scale‑out read replicas can be added if query load grows (still within Business Critical tier).  

### 7.2 Disaster Recovery (DR)
* **Geo‑Redundant Backup** – Azure SQL’s geo‑redundant backup to a secondary region (e.g., `westus2`) for recovery in case of regional outage.  
* **AKS Cluster Re‑creation** – IaC scripts can rebuild the cluster within 30 minutes using the latest VM images. All model artifacts and container images are stored in ACR, which is replicated regionally.

### 7.3 Cost Management
| Resource | Estimated Monthly Cost (USD) | Cost‑Saving Mechanisms |
|----------|------------------------------|------------------------|
| ADLS Gen2 (Hot) | $1,200 | Lifecycle policies move data to Cool/Cold tier |
| Databricks (Standard) | $3,500 | Auto‑termination after job completion; use Spot VMs where permissible |
| AKS (2 nodes) | $1,800 | Node scaling based on demand, use Reserved Instances |
| Azure SQL Business Critical | $2,500 | Auto‑scale compute tier; use serverless for dev/test |
| Power BI Premium Capacity | $2,000 | Shared capacity across multiple reports |
| **Total** | **≈ $11,000** | **Budget approved** under VA IT spend limit. |

---  

## 8. Conclusions & Next Steps
*The architecture meets all VA requirements for security, compliance, and scalability while providing a modern, collaborative environment for the data‑science team.*  

**Immediate actions**

1. **Finalize Azure AD app registration** for the classification API.  
2. **Create Bicep modules** for each zone and run a pilot deployment in the **dev** environment.  
3. **Run a security assessment** (Azure Security Center) and capture the ATO evidence package.  
4. **Develop a Proof‑of‑Concept** Databricks notebook to validate the cleaning and feature extraction steps on a subset of raw data.  
5. **Engage the VA Office of the Chief Information Officer (OCIO)** for final review of the PHI handling and obtain the formal ATO.

*Prepared by:*  
**[Your Name] – Azure Solutions Architect**  
*Date: 2024‑02‑14*  

---  

*All diagrams are textual due to platform constraints; they can be exported to Visio or Lucidchart for visual presentation.*