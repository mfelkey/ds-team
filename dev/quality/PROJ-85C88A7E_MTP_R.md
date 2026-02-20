# Master Test Plan (MTP-R)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** QA Lead – *[Your Name]*  
**Date:** 19 February 2026  

---

## 1. TEST OBJECTIVES & SCOPE

- Ensure software quality through a comprehensive test strategy aligned with project goals.
- Validate functionality, performance, security, and accessibility of the VA Ambulance Trip Analysis application.
- Support continuous integration and delivery via automated test execution.
- Ensure all tests are **deployment-agnostic** by design.
- Use `DEPLOY_TARGET` environment variable to activate cloud-only or on-prem-only test tags:
  - `DEPLOY_TARGET=cloud` — activates `@cloud-only` tests, skips `@onprem-only`
  - `DEPLOY_TARGET=onprem` — activates `@onprem-only` tests, skips `@cloud-only`

---

## 2. TEST ENVIRONMENTS

| Item | Specification |
|------|---------------|
| **Local Development** | Docker Compose stack for local debugging and development (no PHI). |
| **Staging** | Generic Kubernetes cluster (2 nodes, 2 vCPU / 4GB RAM each). <br> *Cloud Reference:* Managed K8s service (AKS, EKS, GKE) <br> *On-Prem Reference:* Bare Kubernetes (kubeadm, k3s, RKE2) |
| **Production** | Generic Kubernetes cluster (3+ nodes, 4 vCPU / 8GB RAM each). <br> *Cloud Reference:* Managed K8s service (AKS, EKS, GKE) <br> *On-Prem Reference:* Bare Kubernetes (kubeadm, k3s, RKE2) |
| **Environment Variables** | Each environment uses `.env.staging`, `.env.production` files. <br> All environment-specific configuration is abstracted via env vars. |

---

## 3. TEST TYPES & COVERAGE

| Test Type | Tools | Notes |
|-----------|-------|-------|
| **Unit Tests** | Jest | No environment dependency. |
| **API/Integration Tests** | Supertest | No environment dependency. |
| **E2E Tests** | Playwright | Reads `BASE_URL` from environment. |
| **Performance Tests** | k6 | Reads `BASE_URL` and thresholds from environment. |
| **Security Tests** | OWASP ZAP, Semgrep | No environment dependency. |
| **Accessibility Tests** | axe-core CLI | No environment dependency. |

---

## 4. TEST EXECUTION

All test commands are executed via **Makefile targets**:

```makefile
make test-unit
make test-api
make test-e2e
make test-smoke
make test-regression
make test-perf
make test-security
make test-all
```

### Environment Control

- `DEPLOY_TARGET=cloud` activates `@cloud-only` tests.
- `DEPLOY_TARGET=onprem` activates `@onprem-only` tests.
- CI/CD pipeline calls `make test-all` — no cloud CLI commands used.

---

## 5. PERFORMANCE TEST PLAN

### Baselines (Application-Level Metrics)

| Metric | Threshold |
|--------|-----------|
| API response time (p95) — dashboard load | < 500ms |
| API response time (p95) — filtered queries | < 1000ms |
| Error rate under 100 concurrent users | < 1% |
| CSV export (10k rows) | < 30s |

### Monitoring During Performance Tests

- Use **Prometheus queries** to validate metrics:
  - `rate(http_requests_total[5m])` — request rate
  - `histogram_quantile(0.95, http_request_duration_seconds_bucket)` — p95 response time
  - `pg_stat_activity` — DB connection pool usage

### Cloud Reference

- Same Prometheus queries work on AKS, EKS, and GKE with `kube-prometheus-stack`.

### On-Prem Reference

- Same Prometheus queries work on bare Kubernetes clusters with `kube-prometheus-stack`.

> **Note:** No `kubectl top pod`, `Azure Monitor`, or cloud-specific performance tools are used.

---

## 6. SECURITY TEST PLAN

| Test Type | Description |
|-----------|-------------|
| **OWASP ZAP Scan** | Dynamic scan against `BASE_URL` (deployment-agnostic). |
| **Semgrep Static Analysis** | Codebase scan for security vulnerabilities. |
| **RBAC Tests** | Verify role-based access enforcement via API calls. |
| **OIDC Auth Tests** | Token validation with `OIDC_MOCK=false` for security tests. |

> **No cloud-specific security tools required.**

---

## 7. MONITORING VALIDATION TESTS

| Test | Description |
|------|-------------|
| **Prometheus Scraping** | Verify that Prometheus is scraping application metrics. |
| **Grafana Dashboards** | Ensure dashboards load and display data correctly. |
| **AlertManager** | Verify that AlertManager fires on threshold breaches. |
| **Alert Webhook** | Confirm that `ALERT_WEBHOOK_URL` receives notifications. |

### Execution Commands

- Use `kubectl` and Prometheus HTTP API for validation.
- No Azure Monitor or cloud-specific dashboards.

### Cloud Reference

- Same tests work on AKS with `kube-prometheus-stack`.

### On-Prem Reference

- Same tests work on bare Kubernetes with `kube-prometheus-stack`.

---

## 8. TEST DATA MANAGEMENT

| Item | Description |
|------|-------------|
| **Synthetic Data** | Generated using `faker` seed scripts — no real PHI. |
| **Seed Datasets** | 1k, 5k, 10k rows |
| **Seed Command** | `make seed DATA_VOLUME=5000` |
| **Data Cleanup** | `make seed-clean` |
| **Data Storage** | No cloud storage dependency — data is generated and managed locally. |

---

## 9. DEFECT MANAGEMENT

| Severity | Criteria |
|----------|----------|
| **Critical** | Blocks functionality, data leakage, or security breach |
| **High** | Major impact on usability or performance |
| **Medium** | Minor issues affecting user experience |
| **Low** | Cosmetic or non-critical issues |

### Tracking

- Defects tracked via **GitHub Issues**
- No deployment-specific tooling required

---

## 10. EXIT CRITERIA

All of the following must be satisfied before test completion:

- Unit test coverage >= 90%
- All `@smoke` tests pass in both `DEPLOY_TARGET=cloud` and `DEPLOY_TARGET=onprem`
- No **Critical** or **High** severity defects open
- Performance baselines met
- Zero accessibility violations (via axe-core)
- Security scan: no **High** or **Critical** findings

---