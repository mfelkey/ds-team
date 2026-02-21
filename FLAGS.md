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

## MUXD (Mobile UX Document)

### FLAG-010
- **Severity:** Low
- **Location:** Section 5 / Section 6 — PHI & Security UX
- **Issue:** Section 5 (PHI & Security UX) appears twice — sections 5 and 6 are duplicate headings covering the same topic with different content
- **Should Be:** Merged into a single Section 5 with all PHI/Security UX content consolidated

### FLAG-011
- **Severity:** Low
- **Location:** Sections 7–9 — Design & Development Specifications, System Architecture, Testing, Documentation
- **Issue:** Sections 7–9 drifted from the required spec into a general architecture overview; required sections (Screen Designs iOS/Android/RN, Interaction Design, QA Handoff) are missing or incomplete
- **Should Be:** Full screen designs for all 10 screens across all three platforms, interaction design spec, and QA device/OS matrix as specified in the task prompt

---
*Last updated: 2026-02-20*

## IIR (iOS Implementation Report)

### FLAG-012
- **Severity:** Medium
- **Location:** Sections 8–10
- **Issue:** Accessibility implementation, XCTest/XCUITest suite, and Fastlane build/distribution lanes collapsed into a single bullet-point "Additional Features" section — no working code produced
- **Should Be:** Full VoiceOver modifiers, XCTest unit tests, XCUITest UI tests, and complete Fastlane Matchfile/Fastfile lanes
- **Status:** Open

### FLAG-013
- **Severity:** Medium
- **Location:** Section 7 — PHI & Security Implementation
- **Issue:** PHI auto-mask timer (10s), app switcher blur, and AES-256 encrypted cache not implemented
- **Should Be:** Timer-based auto-remask, applicationWillResignActive blur, and encrypted cache as specified in MUXD
- **Status:** Open

## AIR (Android Implementation Report)

### FLAG-014
- **Severity:** Medium
- **Location:** Section 4 — Screen Implementations
- **Issue:** Only 3 of 10 required screens produced (Splash, Login, Dashboard). FilterBottomSheet, TripDetail, TripList, Settings, Error/Empty, and About screens missing
- **Should Be:** Complete Composable + ViewModel for all 10 screens
- **Status:** Open

### FLAG-015
- **Severity:** Medium
- **Location:** Sections 7–10 — PHI/Security, Accessibility, Testing, Build/Distribution
- **Issue:** FLAG_SECURE not implemented, PHI auto-remask timer absent, SQLCipher not used (unencrypted Room), Fastlane lanes and CI/CD workflow not produced
- **Should Be:** FLAG_SECURE in onCreate, coroutine-based 10s auto-remask, SQLCipher Room setup, complete Fastlane Appfile/Fastfile, GitHub Actions workflow
- **Status:** Open

### FLAG-016
- **Severity:** Low
- **Location:** NetworkModule.kt
- **Issue:** HttpLoggingInterceptor set to Level.BODY unconditionally — logs request/response bodies in all build variants including release
- **Should Be:** Level.BODY in debug only, Level.NONE in staging/release
- **Status:** Open

### FLAG-012 UPDATE
- **Status:** Partially resolved by IIR_PATCH
- **Resolved:** XCTest/XCUITest suite, Fastlane lanes, Privacy Manifest, GitHub Actions workflow — all present in patch
- **Remaining:** Section 8 accessibility still collapsed to single example; per-screen VoiceOver modifiers for all 6 screens not produced
- **New Status:** Open (reduced scope)
