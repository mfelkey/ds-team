# Security Review Report (SRR-R)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Information Security Engineer – *[Your Name]*  
**Date:** 19 February 2026  

---

## 1. SECURITY OVERVIEW

### Scope and Objectives
This report outlines the security posture of the VA Ambulance Trip Analysis system, covering cloud and on-premises deployment environments. The system processes PHI and supports decision-making for cost-saving initiatives using ML models. This SRR-R provides a deployment-agnostic security framework that ensures compliance with HIPAA, FedRAMP Moderate, and FISMA.

### Security Design Principles
- **Defense in Depth:** Multiple overlapping controls at network, application, and data layers.
- **Least Privilege:** Access and permissions are restricted to the minimum required.
- **Zero Trust:** All access is verified and authenticated, regardless of location or device.

### Compliance Requirements
- **HIPAA:** Requires administrative, physical, and technical safeguards for PHI.
- **FedRAMP Moderate:** Mandates controls such as access control, audit logging, and data encryption.
- **FISMA:** Requires risk-based, security-informed system development with continuous monitoring.

### PHI Handling Summary
The system processes PHI, including veteran patient identifiers, in data pipelines and ML models. All PHI is handled in accordance with HIPAA requirements, including encryption, access controls, and audit logging.

---

## 2. IDENTITY & ACCESS MANAGEMENT

### Authentication
- **OIDC Discovery + JWT Validation:** Applications authenticate using OpenID Connect (OIDC) discovery and validate JWT tokens via JWKS endpoint.
- **Configuration:** `OIDC_ISSUER_URL` specifies the identity provider (e.g., Keycloak, Azure AD, Okta).
- **Mock Mode:** `OIDC_MOCK=false` required in all non-dev environments.

### Authorization
- **RBAC via JWT Roles:** Authorization is based on a configurable `OIDC_ROLES_CLAIM` in the JWT payload.
- **Role Mapping:** Roles are mapped to access control policies via application-level logic.

### Session Management
- **Short-Lived JWTs:** Access tokens are short-lived (e.g., 1 hour) with refresh token rotation.
- **No Session Persistence:** Sessions are stateless and managed via tokens.

### MFA
- **MFA Requirement:** MFA must be enforced by the OIDC provider, not application-level logic.
- **Provider Agnostic:** Configuration is managed via OIDC provider settings.

### Provider Reference Implementation
- **Azure AD / Entra ID:** Configured with OIDC discovery and JWKS endpoint.
- **Keycloak:** Supports OIDC with JWKS and MFA.
- **Okta:** Supports OIDC, JWKS, and MFA via SSO configuration.

---

## 3. SECRETS MANAGEMENT

### Generic Interface
- **Mount Path:** Secrets are accessed via `/secrets/` mount path.
- **Environment Variable:** `SECRETS_BACKEND` specifies the backend provider (e.g., vault, aws-secrets-manager, env-file).

### Secrets Backends
- **Vault:** HashiCorp Vault (on-prem or cloud).
- **AWS Secrets Manager:** For AWS deployments.
- **Azure Key Vault:** For Azure deployments.
- **Env-file:** For development only.

### Rotation
- **Provider-Agnostic:** Rotation is handled by the backend provider, with no application-level logic.
- **Automation:** Rotation is integrated into CI/CD pipelines or manual processes.

### Security
- **Never Log Secrets:** Secrets are never logged or exposed in application output.
- **Version Control:** Secrets are never committed to version control systems.

### Provider Reference Implementation
- **HashiCorp Vault:** On-prem or cloud-managed.
- **Azure Key Vault:** Azure cloud deployment.
- **Env-file:** Development only, not for production.

---

## 4. NETWORK SECURITY

### TLS Everywhere
- **cert-manager:** Issues and manages TLS certificates for any Kubernetes cluster.
- **Ingress:** Ingress controllers (NGINX, Traefik) enforce TLS 1.2+.

### K8s NetworkPolicy
- **Pod-to-Pod Communication:** Network policies restrict pod-to-pod communication.
- **Default Deny:** All traffic is denied by default unless explicitly allowed.

### Ingress
- **Ingress Controller:** NGINX or Traefik used for ingress.
- **No Direct DB Exposure:** Databases are not exposed directly outside the cluster.

### Provider Reference Implementation
- **Cloud Managed TLS:** Azure Front Door, AWS CloudFront.
- **cert-manager on Prem:** Self-managed TLS in on-prem environments.

---

## 5. DATA SECURITY

### PHI Masking
- **Column-Level Masking:** Database views implement column-level masking for PHI fields.
- **Access Control:** Masked views are restricted to authorized roles.

### Audit Logging
- **Audit Logs:** Records `sub`, `action`, `resource`, `IP`, `user agent`.
- **No Sensitive Data:** Tokens, secrets, or full JWT payloads are never logged.

### Data in Transit
- **TLS 1.2+ Required:** All communication is encrypted using TLS 1.2 or higher.
- **Ingress Enforcement:** TLS enforced at ingress layer.

### Data at Rest
- **Encryption:** Database encryption is configurable (e.g., LUKS, filesystem encryption, or cloud-managed encryption).
- **Provider-Agnostic:** Encryption method is selected based on deployment environment.

### Provider Reference Implementation
- **Cloud Managed Encryption:** Azure Storage encryption, AWS S3 encryption.
- **On-Prem Encryption:** LUKS, filesystem-level encryption.

---

## 6. APPLICATION SECURITY

### Static Analysis
- **Semgrep:** Runs in CI pipeline for rule-based code scanning.
- **No Cloud Dependency:** Open-source tool, not cloud-native.

### Dependency Scanning
- **npm audit:** Runs in CI to detect vulnerable dependencies.
- **No Cloud Dependency:** Open-source tool.

### Dynamic Analysis
- **OWASP ZAP:** Scans `BASE_URL` for vulnerabilities.
- **Deployment-Agnostic:** Runs against any deployment.

### Container Scanning
- **Trivy:** Scans container images in CI.
- **No Cloud Dependency:** Open-source tool.

### OWASP Top 10 Controls
- Mapped to implementation via:
  - Input validation (e.g., parameterized queries)
  - Session management (JWTs)
  - Access control (RBAC)
  - Cryptography (TLS, encryption)
  - Security logging (audit logs)
  - Secure configuration (env vars, secrets)

### Provider Reference Implementation
- **Cloud Native Application Security Services:** Defender for DevOps, Inspector (optional).

---

## 7. VULNERABILITY MANAGEMENT

### Scanning Tools
- **Semgrep:** Static analysis.
- **npm audit:** Dependency scanning.
- **OWASP ZAP:** Dynamic analysis.
- **Trivy:** Container scanning.

### Scan Execution
- **Makefile Target:** `make test-security` runs all scans.
- **CI/CD Agnostic:** Execution environment is not tied to cloud.

### Severity Triage
- **Critical/High Vulnerabilities:** Must be resolved before release.
- **Low/Medium:** Tracked for remediation.

### Provider Reference Implementation
- **Cloud-Native Scanners:** Azure Defender for DevOps, AWS Inspector.

---

## 8. INCIDENT RESPONSE

### Detection
- **AlertManager:** Fires alerts based on Prometheus thresholds.
- **Prometheus Metrics:** Monitored for anomalies.

### Notification
- **ALERT_WEBHOOK_URL:** Configurable to send alerts to Slack, Teams, or PagerDuty.

### Audit Trail
- **application audit_log table:** Maintains structured logs.
- **Structured Logs:** Logs are collected and analyzed via application or external tools.

### Forensics
- **kubectl logs:** For container-level logs.
- **Prometheus Metrics:** For system-level data.
- **Grafana Dashboards:** For visualization.

### Provider Reference Implementation
- **Splunk:** On-prem or cloud.
- **Azure Sentinel:** Azure-native SIEM.
- **AWS Security Hub:** AWS-native SIEM.

---

## 9. COMPLIANCE MAPPING

### HIPAA Controls
- **Access Control:** RBAC via JWT roles.
- **Audit Logging:** Structured audit logs.
- **Data Encryption:** TLS 1.2+ and at-rest encryption.
- **Provider Reference Implementation:** Cloud-native encryption, LUKS.

### FedRAMP Moderate Controls
- **Access Control:** RBAC, least privilege.
- **Audit Logging:** Application and system logs.
- **Data Encryption:** TLS, at-rest encryption.
- **Provider Reference Implementation:** Azure Storage, AWS S3.

### FISMA Controls
- **Risk Assessment:** Continuous risk monitoring.
- **Security Controls:** Implementation of access, encryption, logging.
- **Provider Reference Implementation:** On-prem or cloud-native risk management tools.

---

## 10. RISK REGISTER

| Risk ID | Description | Likelihood | Impact | Mitigation | Residual Risk |
|--------|-------------|------------|--------|------------|----------------|
| R001 | Unauthorized access to PHI | Medium | High | RBAC, JWT, MFA | Low |
| R002 | Data in transit not encrypted | Low | High | TLS 1.2+ enforced | Low |
| R003 | Secrets exposed in logs | Low | High | No logging of secrets | Low |
| R004 | Vulnerable dependencies | Medium | Medium | npm audit, CI scanning | Medium |
| R005 | No SIEM in on-prem | Low | Medium | Manual log review or Splunk | Medium |

---

