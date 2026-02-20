# Security Review Report (SRR)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Information Security Engineer – *[Your Name]*  
**Date:** 19 February 2026  

---  

## 1. EXECUTIVE SUMMARY  

| Item | Detail |
|------|--------|
| **Overall Security Posture Rating** | **AMBER** – Core security controls are largely in place, but several high‑impact gaps (encryption‑key management, privileged‑access hardening, AI/ML integrity) must be closed before production deployment. |
| **Top 3 Critical Findings (Immediate Action Required)** | 1. **Encryption‑at‑Rest & Key Management** – ADLS Gen2 raw bucket and Databricks DBFS are not enforced with Customer‑Managed Keys (CMK) and lack rotation policies.  <br>2. **Privileged Access & Identity Hardening** – Azure AD service principals used by ADF and AKS lack MFA, Conditional Access, and Just‑In‑Time (JIT) elevation; excessive “Owner” role assignments present elevation‑of‑privilege risk. <br>3. **Model‑Poisoning / Integrity Controls** – No cryptographic signing, provenance tracking, or runtime integrity monitoring for the ML classification model deployed in AKS/ACI; an attacker could replace or subtly alter the model, leading to erroneous cost‑saving decisions. |
| **Recommendation** | **Approved with Conditions** – The ATO may be granted provisionally **if** all Critical findings are remediated, a full risk‑acceptance package is submitted, and a 30‑day verification sprint is completed. |

---  

## 2. THREAT MODEL (STRIDE)

| # | Threat | Description | Affected Component(s) | Likelihood* | Impact* | Risk Rating** |
|---|--------|-------------|-----------------------|------------|--------|---------------|
| 1 | **Spoofing – Identity Forgery** | An attacker obtains a compromised Azure AD credential and impersonates a legitimate service principal (e.g., ADF copy activity) to exfiltrate PHI. | Azure AD, Managed Identities, ADF Linked Services | High (wide attack surface) | High (PHI breach) | **Critical** |
| 2 | **Tampering – Data Corruption** | Malicious insider or external actor modifies raw ambulance‑trip records in ADLS Gen2 before classification, causing false cost‑saving metrics. | ADLS Gen2 (raw), Databricks notebooks | Medium (requires storage write) | High (integrity loss) | **High** |
| 3 | **Repudiation – Lack of Non‑Repudiation** | A user runs a classification job and later denies having executed it; logs are incomplete or lack digital signatures. | Log Analytics, Azure Monitor, Databricks job logs | Medium | Medium (auditability) | **Medium** |
| 4 | **Information Disclosure – Unauthorized Data Access** | Improper ACLs on ADLS Gen2 or Power BI dataset allow a non‑authorized analyst to view veteran PHI. | ADLS Gen2, Power BI (SaaS), Azure SQL DB | High | High (HIPAA breach) | **Critical** |
| 5 | **Denial of Service – Resource Exhaustion** | An attacker floods the AKS inference service with crafted requests, exhausting CPU/GPU, making the dashboard unavailable. | AKS / ACI Model Service, Azure Front Door (if any) | Medium | High (availability impact) | **High** |
| 6 | **Elevation of Privilege – Privileged Role Abuse** | Over‑privileged service principal (Owner) used by ADF is leveraged to create new privileged identities. | Azure AD, RBAC assignments | Medium | High | **High** |
| 7 | **Tampering – Model Poisoning** | An adversary injects malicious samples into the training pipeline (e.g., via compromised raw data) causing the model to mis‑classify trips. | Databricks training notebooks, ADLS Gen2 (training data) | Low (requires pipeline access) | High (decision integrity) | **High** |
| 8 | **Information Disclosure – Logging of PHI** | Log Analytics inadvertently captures raw PHI fields (e.g., patient identifiers) and stores them unencrypted. | Azure Monitor, Log Analytics workspace | Medium | Medium (privacy) | **Medium** |

\*Likelihood/Impact: **Low / Medium / High** (based on threat‑actor capability and existing mitigations).  
\**Risk Rating: **Critical** (needs immediate mitigation), **High**, **Medium**, **Low**.

---  

## 3. VULNERABILITY ASSESSMENT  

| Component | Vulnerability | Severity | Description | Recommended Remediation |
|-----------|--------------|----------|-------------|--------------------------|
| **Azure Data Factory (ADF) – Ingestion Layer** | Lack of **Customer‑Managed Keys (CMK)** for data movement | **HIGH** | ADF copy activity uses platform‑managed keys; keys are not rotated. | Enable CMK on the linked Azure SQL Database and ADLS Gen2; enforce key rotation every 90 days via Azure Key Vault. |
| | **Insufficient RBAC** – Service principal assigned Owner on resource group | **CRITICAL** | Owner role grants full rights across all resources, enabling privilege escalation. | Replace Owner with least‑privilege role (Data Factory Contributor + Storage Blob Data Contributor). Implement Just‑In‑Time (JIT) elevation via Azure PIM. |
| | No **Network Isolation** – ADF integration runtime uses public endpoint | **MEDIUM** | Data could be intercepted in transit if TLS is mis‑configured. | Deploy a Managed Private Endpoint for Azure SQL and ADLS; enforce TLS 1.2+. |
| **Databricks (Processing & Classification)** | **Unrestricted Notebook Access** – All workspace users are “Can Manage” the cluster | **HIGH** | Users can execute arbitrary code, potentially exfiltrating PHI. | Use Unity Catalog for fine‑grained access; enforce “Can Attach To” only for authorized data‑engineers. |
| | **No Model Provenance** – Model artifacts stored without checksum or signature | **CRITICAL** | Model could be swapped without detection. | Store model artifacts in a version‑controlled container (e.g., Azure Container Registry) with SHA‑256 digest and sign using Azure Key Vault keys. |
| | **Lack of Data Validation** – No schema enforcement on incoming raw tables | **MEDIUM** | Corrupt rows could cause mis‑classification or pipeline failures. | Implement Delta Lake schema enforcement and data quality checks (e.g., Deequ). |
| **ADLS Gen2 (Storage Layer)** | **Encryption‑at‑Rest** – Uses Microsoft‑managed keys only | **HIGH** | Does not meet VA policy requiring CMK for PHI. | Enable CMK via Azure Key Vault; configure hierarchical namespace with immutable storage policies. |
| | **ACL Over‑Permission** – “Blob Reader” granted to the entire subscription | **CRITICAL** | Any service in the subscription can read raw PHI. | Scope ACLs to specific service principals; enable Azure AD Domain Services for identity‑based access. |
| | **Retention of Deleted Files** – Soft delete retention set to 30 days (excessive) | **LOW** | Increases attack surface for data recovery. | Reduce soft‑delete retention to 7 days, aligned with VA data‑retention policy. |
| **AKS / ACI (Model Service)** | **Missing Pod Security Standards** – Pods run as privileged, hostNetwork disabled only partially | **CRITICAL** | Allows container breakout or network sniffing. | Apply PSP/Pod Security Standards: runAsNonRoot, drop capabilities, read‑only root filesystem. |
| | **No WAF / API Gateway** – Direct public endpoint for inference | **HIGH** | Enables DoS and injection attacks. | Front the service with Azure API Management + WAF policies; enforce rate limiting and JWT validation. |
| | **Insufficient Logging** – No request‑body logging (PII) | **MEDIUM** | May impede forensic analysis. | Enable Azure Monitor for containers; mask PHI in request payloads before logging. |
| **Power BI (Reporting Layer – SaaS)** | **DirectQuery to Azure SQL (Business‑Critical)** – No row‑level security (RLS) | **CRITICAL** | All dashboard viewers can see full PHI set. | Implement RLS based on Azure AD groups; enforce “Effective user name” mapping. |
| | **Data Export Disabled?** – Not verified | **MEDIUM** | Users may download underlying data. | Turn off “Export data” for all reports containing PHI; enforce DLP policies. |
| **Azure Key Vault** | **Key Rotation Not Configured** – Keys used for CMK are static | **HIGH** | Stale keys increase risk of compromise. | Enable automatic key rotation; use key versioning for each service. |
| | **Network Access** – Vault reachable from public internet | **MEDIUM** | Could be enumerated by attackers. | Restrict access via Private Endpoint; enforce firewall rules. |
| **Azure AD / Identity** | **MFA Not Enforced for Service Principals** | **CRITICAL** | Increases spoofing risk. | Require MFA for all privileged accounts; enable Conditional Access (risk‑based) for all service principals. |
| | **Conditional Access Policies Not Defined** | **HIGH** | Lacks device‑state, location, and sign‑in risk enforcement. | Deploy Conditional Access: Require compliant device, block legacy authentication, enforce MFA for all interactive sign‑ins. |
| **Logging & Monitoring (Azure Monitor / Log Analytics)** | **PHI in Logs** – Query shows patient identifiers stored in clear text | **MEDIUM** | Violates HIPAA minimum‑necessary principle. | Create a Log Analytics **Data Masking** rule; use diagnostic settings to filter out PHI fields. |
| | **Retention Period** – Logs retained 2 years (exceeds required 1 year) | **LOW** | Unnecessary storage of PHI. | Align log retention with VA policy (minimum 1 year, maximum 2 years). |

> **Severity Legend:** CRITICAL > HIGH > MEDIUM > LOW  

---  

## 4. COMPLIANCE GAP ANALYSIS  

### 4.1 HIPAA (45 CFR § 164.312 & § 164.308)

| HIPAA Requirement | Current Status | Gap | Remediation |
|-------------------|----------------|-----|-------------|
| **164.312(a)(2)(i) – Encryption at Rest** | Platform‑managed keys only on ADLS Gen2 and Azure SQL. | **Non‑compliant** – VA requires CMK for PHI. | Enable CMK via Azure Key Vault; rotate keys quarterly. |
| **164.312(e)(1) – Encryption in Transit** | TLS 1.2 enforced on all Azure services. | **Compliant** | – |
| **164.312(b) – Access Controls** | Over‑permissive ACLs on ADLS and Owner RBAC on ADF. | **Non‑compliant** | Apply least‑privilege RBAC; enforce Azure AD Conditional Access. |
| **164.312(c) – Integrity Controls** | No cryptographic signing of model artifacts; no immutable storage. | **Non‑compliant** | Sign model packages; enable immutable storage on ADLS. |
| **164.308(a)(1)(i) – Security Management Process** | No documented risk‑acceptance for AI‑model integrity. | **Non‑compliant** | Develop a Model‑Lifecycle Security Plan (see Section 5). |
| **164.308(a)(3)(ii) – Workforce Security** | Service principals with Owner role, no MFA. | **Non‑compliant** | Reduce privileges; enforce MFA & PIM. |

### 4.2 NIST SP 800‑53 Rev. 5 (selected controls mapped to VA environment)

| Control ID | Control Description | Current Implementation | Gap | Required Action |
|------------|---------------------|------------------------|-----|-----------------|
| **AC‑2 (Account Management)** | Account provisioning & de‑provisioning. | Azure AD accounts created manually; no automated de‑provisioning. | **Medium** | Implement Azure AD Lifecycle Management (SCIM) for automatic removal of stale accounts. |
| **AC‑3 (Access Enforcement)** | Enforce least‑privilege. | Owner role over‑assignment to ADF & AKS. | **Critical** | Replace Owner with Data Factory Contributor / AKS Cluster Admin; use Azure PIM for JIT elevation. |
| **AC‑6 (Least Privilege)** | Enforce least‑privilege for all users and services. | Over‑permissive ACLs on ADLS. | **Critical** | Tighten ACLs to specific service principals; enable Azure RBAC for storage. |
| **AU‑2 (Audit Events)** | Determine auditable events. | PHI fields logged to Log Analytics without masking. | **Medium** | Configure diagnostic settings to exclude PHI; use Azure Monitor Data Collection Rules (DCR) for field masking. |
| **AU‑6 (Audit Review, Analysis, and Reporting)** | Regular review of audit logs. | No scheduled log‑review process defined. | **Medium** | Establish a weekly SOC‑review cadence; integrate with VA’s Security Operations Center (SOC). |
| **SC‑7 (Boundary Protection)** | Protect inbound/outbound network traffic. | Public endpoints for ADF and AKS inference. | **High** | Deploy Private Endpoints for storage and SQL; front AKS with Azure API Management + WAF. |
| **SC‑13 (Cryptographic Protection)** | Encrypt PHI at rest with CMK. | Not implemented for ADLS & Azure SQL. | **Critical** | Enable CMK for all storage accounts and Azure SQL Transparent Data Encryption (TDE) using KV‑managed keys. |
| **SI‑2 (Flaw Remediation)** | Patch management for OS & container images. | AKS node image version not pinned; automatic node upgrades enabled. | **Medium** | Pin node image version; enable Azure Security Center for container image scanning. |
| **SI‑10 (Information Input Validation)** | Validate all inputs to prevent injection. | No input validation on model inference API. | **High** | Enforce JSON schema validation and sanitization in API Management policies. |

### 4.3 VA Handbook 6500 (Information Assurance)

| Handbook Requirement | Current State | Gap | Remedy |
|----------------------|---------------|------|--------|
| **H‑03 – Data Classification & Handling** | PHI stored in ADLS without immutable policy; no CMK. | **Non‑compliant** | Apply Azure Immutable Blob storage with “Legal Hold” and CMK. |
| **H‑04 – Identity & Access Management** | Service principals with Owner role; no MFA for privileged accounts. | **Non‑compliant** | Implement Azure AD Privileged Identity Management (PIM) and MFA for all privileged accounts. |
| **H‑05 – Continuous Monitoring** | Log Analytics captures PHI; lack of automated alerting for anomalous model changes. | **Partial** | Create Sentinel alert rule for model‑artifact hash mismatch; mask PHI in logs. |
| **H‑06 – Contingency Planning** | No documented Disaster Recovery (DR) for inference service. | **Medium** | Deploy AKS with zone‑redundant node pools; document fail‑over to secondary region. |

### 4.4 Section 508 (Accessibility) – Security‑Related Considerations  

| Requirement | Current Status | Gap | Remedy |
|-------------|----------------|-----|--------|
| **508‑3.2.1 – Authentication for Assistive Technologies** | Power BI dashboards can be accessed with screen‑reader tools, but authentication relies only on basic Azure AD sign‑in. | **Medium** – No Conditional Access to enforce MFA for users employing assistive devices. | Apply Conditional Access policy requiring MFA for any sign‑in from a device classified as “Assistive Technology”. |
| **508‑4.2 – Secure Keyboard Input** | Keyboard navigation is enabled, but no protection against key‑logging on shared workstations. | **Low** – Out‑of‑scope for Azure but needs endpoint‑hardening guidance. | Provide endpoint security guidance to VA IT (EDR, OS‑level MFA). |

---  

## 4. PHI & DATA PRIVACY ANALYSIS  

### 4.1 Data Flow Diagram (simplified)

```
[VA SQL (Azure SQL DB, Business‑Critical)] 
   ↓ (TLS 1.2, Platform‑Managed Keys)  
[Azure Data Factory] 
   ↓ (Copy activity, Public endpoint)  
[ADLS Gen2 – raw bucket] 
   ↓ (Delta Lake, schema checks)  
[Databricks] – Training → Model Artifact → Azure Container Registry  
   ↓ (Signed, versioned)  
[AKS / ACI] – Inference API (public)  
   ↓ (JSON payload)  
[Power BI (DirectQuery)] – Dashboard (Veteran users)  
```

*PHI elements*: patient identifiers, encounter dates, procedure codes, location data.  

### 4.2 Tokenization / Masking  

| Data Element | Current Treatment | Gap | Recommended Treatment |
|--------------|-------------------|-----|------------------------|
| **Patient ID / MRN** | Stored in clear text in raw ADLS bucket and passed to Databricks. | **Critical** – violates Minimum Necessary. | Tokenize using Azure Confidential Ledger or deterministic tokenization via Azure Key Vault before storage. |
| **Encounter Date** | Retained in raw bucket, logged to Log Analytics. | **Medium** | Mask or truncate to month granularity for analytics where day‑level precision is not needed. |
| **Geolocation (Facility Code)** | Required for classification; not considered PHI. | – | No change needed, but should be stored in separate column with distinct ACL. |

### 4.3 Data Minimization  

* Only the columns required for cost‑saving classification (trip date, distance, service code, and facility) are retained in the **processed** Delta table.  
* All **personally identifiable** columns (patient name, SSN, DOB) are **removed** during the **Data Quality** stage in Databricks before the data is written to the analytics store.  

**Action**: Formalize a **Data Retention Schedule** that deletes raw data after 30 days (or earlier if not needed) and enforces a 90‑day purge for any residual PHI.

### 4.4 Model‑Lifecycle Security Plan (Section 5)

1. **Model Development** – Secure development environment, code reviews, static analysis.  
2. **Artifact Packaging** – Store model as a Docker image / zip file, sign with a KV‑managed key.  
3. **Deployment** – Deploy only signed artifacts; Azure Policy to block unsigned images.  
4. **Runtime Monitoring** – Sentinel alert on hash change; periodic integrity verification.  

---  

## 5. RECOMMENDATIONS & ACTION PLAN  

| Priority | Action Item | Owner | Target Completion |
|----------|-------------|-------|--------------------|
| **Critical** | Replace Owner RBAC on ADF & AKS with least‑privilege roles; enable Azure AD PIM. | Cloud Architecture Team | 2 weeks |
| **Critical** | Enable Customer‑Managed Keys (CMK) for ADLS, Azure SQL TDE, and Power BI storage. | Security Engineering | 3 weeks |
| **Critical** | Implement deterministic tokenization for patient identifiers before ingestion. | Data Engineering | 4 weeks |
| **High** | Deploy Private Endpoints for ADF, ADLS, and Azure SQL; restrict public internet access. | Network Engineering | 3 weeks |
| **High** | Front AKS inference API with Azure API Management and enforce JSON schema validation. | API Team | 2 weeks |
| **High** | Enforce MFA and Conditional Access for all privileged service principals. | Identity & Access Team | 1 week |
| **Medium** | Configure Log Analytics diagnostic settings to mask PHI fields; set up weekly audit‑log review. | Monitoring Team | 2 weeks |
| **Medium** | Develop Model‑Lifecycle Security Plan (signing, immutable storage, alerting). | AI/ML Governance | 4 weeks |
| **Medium** | Document DR/Fail‑over plan for AKS inference service (zone‑redundant, secondary region). | Continuity Planning | 6 weeks |
| **Low** | Align log retention periods with VA policy (1‑2 years). | Compliance Team | 1 week |

---  

## 5. CONCLUSION  

The **Veteran‑Trip‑Cost‑Saving** solution delivers valuable analytics for transportation management but presently exhibits several **critical compliance gaps**—particularly around **encryption at rest**, **identity & access management**, and **model integrity**. By implementing the remediation steps outlined above—especially **Customer‑Managed Keys**, **least‑privilege RBAC**, **MFA/Conditional Access**, **tokenization of patient identifiers**, and **model signing**—the solution can achieve full **HIPAA** compliance, satisfy **NIST SP 800‑53** requirements, and align with **VA Handbook 6500** standards.

A coordinated effort across Cloud Architecture, Security Engineering, Data Engineering, and VA IT operations is essential to close these gaps within the proposed timelines. Upon completion, the system will be robust, secure, and ready for production deployment within the VA environment.