# Flags — PROJ-85C88A7E

Tracked issues identified during the deployment-agnostic retrofit pass.
Each flag includes severity, document, and recommended resolution.

---

## DIR-R (DevOps Implementation Report)

### FLAG-001
- **Severity:** Medium
- **Location:** Section 9 (CI/CD Pipeline) — GitHub Actions example
- **Issue:** `docker push myregistry.azurecr.io/backend` hardcoded in pipeline snippet
- **Should Be:** `docker push $CONTAINER_REGISTRY/backend:$VERSION`
- **Status:** Open

---

## BIR-R (Backend Implementation Report)

### FLAG-002
- **Severity:** Low (deferred)
- **Location:** Section 1.1 — SQL DDL, `users` table
- **Issue:** `auth0_id VARCHAR(255)` column retained with compatibility comment
- **Should Be:** Renamed to `oidc_sub` via a proper migration when schema is stabilized
- **Status:** Open — deferred until schema freeze

### FLAG-003
- **Severity:** Low (deferred)
- **Location:** Section 1.2 — Prisma schema, `User` model
- **Issue:** `auth0Id String @unique` field retained on User model
- **Should Be:** Renamed to `oidcSub` to match column rename in FLAG-002
- **Status:** Open — blocked by FLAG-002

---

## MTP-R (Master Test Plan) — no flags

---

## TAD-R (Technical Architecture Document)

### FLAG-004
- **Severity:** Low
- **Location:** Section 2 — Architecture Diagram, Kubernetes Cluster box
- **Issue:** Diagram box reads `Kubernetes Cluster (e.g., AKS, EKS, k3s)` — provider names in diagram
- **Should Be:** `Kubernetes Cluster` only; provider names belong in Provider Reference sections
- **Status:** Open

---

## SRR-R (Security Review Report)

### ~~FLAG-005~~ — CLOSED (false positive)
- **Location:** Section 2 — OIDC_ISSUER_URL
- **Disposition:** Keycloak is already listed as a Provider Reference Implementation. No gap.

### ~~FLAG-006~~ — CLOSED (false positive)
- **Location:** Section 3 — SECRETS_BACKEND
- **Disposition:** env-file fallback is already documented. No gap.

### FLAG-007
- **Severity:** Low
- **Location:** Section 6 — Application Security / Dynamic Analysis
- **Issue:** No CI/CD example showing how BASE_URL is injected for OWASP ZAP scan
- **Should Be:** Add `.env.ci` example or Makefile snippet showing `BASE_URL=$(STAGING_URL) make test-security`
- **Status:** Open

### ~~FLAG-008~~ — CLOSED (false positive)
- **Location:** Section 8 — ALERT_WEBHOOK_URL
- **Disposition:** Already a generic configurable env var pointing to any webhook endpoint. No gap.

### FLAG-009
- **Severity:** Low
- **Location:** Section 7 — Vulnerability Management / Scan Execution
- **Issue:** No fallback documented for environments where `make` is unavailable
- **Should Be:** Add Docker-based alternative: `docker run --rm -e BASE_URL=... owasp/zap2docker-stable zap-baseline.py`
- **Status:** Open

---

## Resolution Checklist

- [ ] FLAG-001: Fix hardcoded registry URL in DIR-R CI/CD pipeline snippet
- [ ] FLAG-002: Migrate `auth0_id` → `oidc_sub` in SQL schema (defer to schema freeze)
- [ ] FLAG-003: Rename `auth0Id` → `oidcSub` in Prisma schema + regenerate client (blocked by FLAG-002)
- [ ] FLAG-004: Remove provider names from TAD-R architecture diagram box
- [ ] FLAG-007: Add BASE_URL injection example for CI/CD security scan in SRR-R
- [ ] FLAG-009: Add Docker-based fallback for `make test-security` in SRR-R

---
*Last updated: 2026-02-20*
