# Technical Architecture Document (TAD-R)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Principal Technical Architect – [Your Name]  
**Date:** 19 February 2026  

---

## Table of Contents
1. [System Overview](#1-system-overview)  
2. [Architecture Diagram](#2-architecture-diagram)  
3. [Component Descriptions](#3-component-descriptions)  
4. [Data Flow](#4-data-flow)  
5. [Security Architecture](#5-security-architecture)  
6. [Deployment Architecture](#6-deployment-architecture)  
7. [Scalability & Reliability](#7-scalability--reliability)  
8. [Technology Decisions](#8-technology-decisions)  

---

## 1. System Overview

### 1.1 Purpose and Scope
The VA Ambulance Trip Analysis system enables users to analyze ambulance trip data for operational, economic, and strategic insights. The system ingests raw trip data, processes it into standardized formats, trains models for classification, and presents visualizations via dashboards.

### 1.2 Key Design Principles
- **Deployment-Agnostic:** All infrastructure components are described generically; provider-specific implementations are controlled by `DEPLOY_TARGET`.
- **12-Factor App:** Application configuration is externalized via environment variables.
- **OIDC-Native Authentication:** All authentication is handled via OIDC-compliant identity providers.

### 1.3 Technology Stack Summary
| Capability | Generic Description |
|-----------|---------------------|
| Container Orchestration | Kubernetes cluster |
| Container Registry | Container registry |
| Database | PostgreSQL |
| Identity Provider | OIDC-compliant identity provider |
| Secrets Management | Secrets management service |
| Monitoring | Prometheus + Grafana |
| Object Storage | S3-compatible object storage |
| API Gateway / Ingress | Ingress controller with TLS termination |
| CI/CD Pipeline | Pipeline (Makefile-based) |
| Logging | Structured logs, log aggregation via Prometheus + Grafana |
| Authentication | OIDC/OAuth2 |
| Authorization | JWT-based RBAC |

### 1.4 Provider Reference Implementations

| Capability | Cloud (Azure) | Cloud (AWS) | On-Premises |
|-----------|----------------|--------------|-------------|
| Kubernetes Cluster | AKS | EKS | kubeadm / RKE2 / k3s |
| Container Registry | ACR | ECR | Local registry (e.g., Harbor) |
| Secrets Management | Azure Key Vault | AWS Secrets Manager | HashiCorp Vault |
| Object Storage | Azure Blob Storage | S3 | MinIO |
| Identity Provider | Azure AD | AWS Cognito | OpenLDAP / Keycloak |
| Monitoring | Azure Monitor | CloudWatch + Grafana | Prometheus + Grafana |
| API Gateway | Azure API Gateway | AWS API Gateway | NGINX Ingress Controller |

---

## 2. Architecture Diagram

```
+------------------+          +-----------------------+          +-------------------------+
|  End-User (Web)  |  <--->   |  Frontend (Next.js)   |  <--->   |  Backend API (Node.js)  |
+------------------+          +-----------------------+          +-------------------------+
                                                                 |
                                                                 v
+------------------+          +------------------------+          +--------------------------+
|  Ingress/TLS     |  <--->   |  Kubernetes Cluster    |  <--->   |  Secrets Management      |
|  (cert-manager)  |          |  (e.g., AKS, EKS, k3s) |          |  (Vault, Key Vault, etc.)|
+------------------+          +------------------------+          +--------------------------+
                                                                 |
                                                                 v
+------------------+          +------------------------+          +--------------------------+
|  PostgreSQL DB   |  <--->   |  Prometheus + Grafana  |  <--->   |  Container Registry      |
+------------------+          +------------------------+          +--------------------------+
                                                                 |
                                                                 v
+------------------+          +------------------------+
|  S3-Compatible     |  <--->   |  Data Pipeline (e.g.,  |
|  Object Storage   |          |  Airflow, Prefect)     |
+------------------+          +------------------------+
```

---

## 3. Component Descriptions

### 3.1 Frontend (Next.js)
- **Purpose:** Hosts the web UI for dashboard and analytics.
- **Interface:** 
  - Exposes `/` and `/dashboard` routes
  - Communicates with backend via `BASE_URL` environment variable
- **Configuration:** 
  - `BASE_URL`: URL of backend API
- **Provider Reference:**
  - **Cloud:** Deployed to AKS or EKS with Ingress controller
  - **On-Prem:** Deployed to k3s or RKE2 with local Ingress

### 3.2 Backend API (Node.js/Express)
- **Purpose:** REST API for data queries, exports, and authentication.
- **Interface:**
  - Exposes `/api/trips`, `/api/export`, `/api/auth`
  - Authenticates via OIDC JWTs
  - Uses Prisma ORM for PostgreSQL
- **Configuration:**
  - `DATABASE_URL`: Connection string for PostgreSQL
  - `OIDC_ISSUER`: OIDC issuer URL
  - `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`: OIDC client credentials
  - `JWT_SECRET`: For signing JWTs (if needed)
- **Provider Reference:**
  - **Cloud:** AKS or EKS with Ingress and TLS
  - **On-Prem:** RKE2 or k3s with local Ingress

### 3.3 PostgreSQL Database
- **Purpose:** Primary data store for all system data.
- **Interface:**
  - Accepts queries from backend API
  - Supports read/write via Prisma ORM
- **Configuration:**
  - `DATABASE_URL`: Connection string to PostgreSQL instance
- **Provider Reference:**
  - **Cloud:** Azure Database for PostgreSQL or RDS
  - **On-Prem:** On-prem PostgreSQL instance or VM-based PostgreSQL

### 3.4 Identity Provider
- **Purpose:** Authenticates users via OIDC/OAuth2.
- **Interface:**
  - Exposes discovery document (`.well-known/openid-configuration`)
  - Provides JWT tokens with user roles
- **Configuration:**
  - `OIDC_ISSUER`: OIDC provider URL
  - `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`: Client credentials
  - `OIDC_ROLES_CLAIM`: Name of claim containing user roles
- **Provider Reference:**
  - **Cloud:** Azure AD, AWS Cognito
  - **On-Prem:** Keycloak, OpenLDAP + OAuth2 proxy

### 3.5 Secrets Management Service
- **Purpose:** Securely stores secrets (tokens, passwords, keys).
- **Interface:**
  - Provides `/secrets/` mount point
  - Supports read/write via environment or API
- **Configuration:**
  - `SECRETS_BACKEND`: Secret store backend (`vault`, `azurekeyvault`, `env`)
- **Provider Reference:**
  - **Cloud:** Azure Key Vault, AWS Secrets Manager
  - **On-Prem:** HashiCorp Vault

### 3.6 Container Registry
- **Purpose:** Stores container images for deployment.
- **Interface:**
  - Supports pull/push via standard Docker registry protocol
- **Configuration:**
  - `CONTAINER_REGISTRY`: URL of registry
- **Provider Reference:**
  - **Cloud:** ACR, ECR
  - **On-Prem:** Harbor, local registry

### 3.7 Kubernetes Cluster
- **Purpose:** Orchestrates containerized applications.
- **Interface:**
  - Hosts pods and services via standard Kubernetes API
- **Configuration:**
  - `DEPLOY_TARGET`: `cloud` or `onprem`
- **Provider Reference:**
  - **Cloud:** AKS, EKS
  - **On-Prem:** kubeadm, k3s, RKE2

### 3.8 Prometheus + Grafana
- **Purpose:** Monitor system health and metrics.
- **Interface:**
  - Prometheus scrapes metrics from pods
  - Grafana visualizes metrics
- **Configuration:**
  - No configuration needed — standard setup
- **Provider Reference:**
  - **Cloud:** Azure Monitor + Grafana, CloudWatch + Grafana
  - **On-Prem:** Prometheus + Grafana stack

### 3.9 S3-Compatible Object Storage
- **Purpose:** Stores raw and processed data.
- **Interface:**
  - Supports standard S3 API for upload/download
- **Configuration:**
  - `STORAGE_ENDPOINT`: S3-compatible endpoint
  - `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`: Credentials
- **Provider Reference:**
  - **Cloud:** Azure Blob Storage, S3
  - **On-Prem:** MinIO

---

## 4. Data Flow

1. **Data Ingestion:** Raw trip data is uploaded to S3-compatible object storage.
2. **Processing Pipeline:** Airflow or Prefect processes data and stores in PostgreSQL.
3. **API Interaction:** Frontend sends requests to backend API.
4. **Authentication:** Backend validates OIDC JWTs against identity provider.
5. **Database Query:** Backend queries PostgreSQL for data.
6. **Dashboard Rendering:** Frontend renders dashboard using fetched data.
7. **Monitoring:** Prometheus scrapes metrics from backend and pods; Grafana visualizes them.

---

## 5. Security Architecture

### 5.1 Authentication
- All authentication is via OIDC-compliant identity provider.
- Tokens are validated using public keys from discovery document.

### 5.2 Authorization
- Role-based access control via JWT claims.
- Roles are mapped to access levels in backend API.

### 5.3 PHI Protection
- Column-level masking in database views.
- Audit logs only store sub claim, not full identity.

### 5.4 Secrets Management
- All secrets are stored in `SECRETS_BACKEND`.
- Secrets are never stored in code or logs.

### 5.5 TLS Termination
- Ingress controller terminates TLS using cert-manager.
- All internal traffic is encrypted.

### 5.6 Provider Reference
| Component | Azure Key Vault | HashiCorp Vault | env-file |
|----------|------------------|------------------|----------|
| Storage | Supported | Supported | Supported |
| Access Control | Role-based | Role-based | File-based |
| Integration | Native | Native | Manual |

---

## 6. Deployment Architecture

### 6.1 DEPLOY_TARGET=cloud
- **Kubernetes:** Managed cluster (AKS, EKS)
- **Registry:** Managed container registry (ACR, ECR)
- **Secrets:** Azure Key Vault or AWS Secrets Manager
- **Storage:** Azure Blob or S3

### 6.2 DEPLOY_TARGET=onprem
- **Kubernetes:** kubeadm, k3s, or RKE2
- **Registry:** Local Harbor or Docker Registry
- **Secrets:** HashiCorp Vault
- **Storage:** MinIO or local NFS

### 6.3 Helm Chart
- Single Helm chart with `values.cloud.yaml` and `values.onprem.yaml`
- Same image is deployed to either target with no code changes

### 6.4 Environment Variables

| Variable | Cloud Example | On-Prem Example |
|----------|----------------|------------------|
| `DEPLOY_TARGET` | `cloud` | `onprem` |
| `CONTAINER_REGISTRY` | `myregistry.azurecr.io` | `localhost:5000` |
| `DATABASE_URL` | `postgresql://user:pass@db:5432/mydb` | `postgresql://user:pass@localhost:5432/mydb` |
| `OIDC_ISSUER` | `https://login.microsoftonline.com/tenantid` | `https://keycloak.example.com/auth/realms/myrealm` |
| `SECRETS_BACKEND` | `azurekeyvault` | `vault` |
| `BASE_URL` | `https://api.example.com` | `http://localhost:3000` |
| `STORAGE_ENDPOINT` | `https://mystorage.blob.core.windows.net` | `http://minio.example.com` |

---

## 7. Scalability & Reliability

### 7.1 Horizontal Pod Autoscaler (HPA)
- Standard Kubernetes HPA scales pods based on CPU/memory usage.

### 7.2 PostgreSQL Connection Pooling
- PgBouncer is used to pool database connections.

### 7.3 Health Checks
- `/health` and `/ready` endpoints are exposed.
- Used by Kubernetes for readiness/liveness probes.

### 7.4 Graceful Shutdown
- Applications handle SIGTERM gracefully.
- Pods drain before termination.

### 7.5 No Cloud-Specific Autoscaling
- Scaling is handled by Kubernetes-native tools, not cloud-specific services.

---

## 8. Technology Decisions

### 8.1 Kubernetes Cluster
- **Why:** Orchestrates containerized apps reliably.
- **Why Deployment-Agnostic:** Standard Kubernetes API works across cloud and on-prem.
- **Provider Reference:** AKS (Azure), EKS (AWS), kubeadm (On-Prem)

### 8.2 PostgreSQL
- **Why:** Reliable, ACID-compliant RDBMS.
- **Why Deployment-Agnostic:** Standard SQL interface works anywhere.
- **Provider Reference:** Azure DB, RDS, On-Prem VM

### 8.3 OIDC Authentication
- **Why:** Standardized, secure, federated.
- **Why Deployment-Agnostic:** OIDC is a standard; all identity providers support it.
- **Provider Reference:** Azure AD, AWS Cognito, Keycloak

### 8.4 Secrets Management
- **Why:** Centralized, secure storage.
- **Why Deployment-Agnostic:** Abstracted via environment variables.
- **Provider Reference:** Azure Key Vault, Vault, env-file

### 8.5 Prometheus + Grafana
- **Why:** Standard monitoring stack.
- **Why Deployment-Agnostic:** No cloud-specific components.
- **Provider Reference:** Azure Monitor (Cloud), Prometheus + Grafana (On-Prem)

### 8.6 S3-Compatible Storage
- **Why:** Standardized, scalable object storage.
- **Why Deployment-Agnostic:** Standard S3 API.
- **Provider Reference:** Azure Blob, S3, MinIO

---