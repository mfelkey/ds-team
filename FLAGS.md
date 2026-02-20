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

## MTP-R (Master Test Plan) — pending retrofit

## TAD-R (Technical Architecture Document) — pending retrofit

## SRR-R (Security Review Report) — pending retrofit

---

## Resolution Checklist

- [ ] FLAG-001: Fix hardcoded registry URL in CI/CD pipeline
- [ ] FLAG-002: Migrate `auth0_id` → `oidc_sub` in SQL schema
- [ ] FLAG-003: Rename `auth0Id` → `oidcSub` in Prisma schema + regenerate client

---
*Last updated: 2026-02-20*
