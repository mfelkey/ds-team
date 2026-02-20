# Technical Implementation Plan (TIP)  
**Project Title:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Developer  
**Date:** 19 February 2026  

---

## 1. PROJECT STRUCTURE

### Directory/File Tree

```
va-ambulance-trip-analysis/
├── backend/
│   ├── api/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── models/
│   ├── services/
│   ├── database/
│   ├── config/
│   └── app.js
├── frontend/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── filters/
│   │   ├── charts/
│   │   └── shared/
│   ├── pages/
│   ├── styles/
│   ├── utils/
│   └── next.config.js
├── data/
│   ├── ingestion/
│   ├── processing/
│   └── models/
├── infra/
│   ├── terraform/
│   ├── kubernetes/
│   └── azure/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api.md
│   └── architecture.md
├── .github/
│   └── workflows/
├── .gitignore
├── package.json
├── README.md
└── Dockerfile
```

### Purpose of Each Directory

- `backend/`: Core server logic using Node.js/Express.
- `frontend/`: Next.js React app with SSR support.
- `data/`: ETL and ML pipelines for data processing and model inference.
- `infra/`: Infrastructure-as-Code (Terraform, Kubernetes, Azure ARM templates).
- `tests/`: Unit, integration, and E2E tests.
- `docs/`: API and architecture documentation.
- `.github/workflows/`: CI/CD pipeline definitions.
- `Dockerfile`: Container image definition for deployment.

### Naming Conventions

- Files: `snake_case`
- Modules: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Variables: `camelCase`
- Functions: `camelCase`
- Classes: `PascalCase`
- Directories: `kebab-case`

---

## 2. TECHNOLOGY STACK CONFIRMATION

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Frontend | Next.js | 14.2.13 | App Router, SSR |
| Frontend | React | 18.2.0 | For component structure |
| Backend | Node.js | 20.11.1 | LTS version |
| Backend | Express | 4.18.2 | Minimalist web framework |
| Backend | PostgreSQL | 15 | For relational data |
| Backend | Prisma ORM | 5.10.2 | ORM for database access |
| Data Layer | Databricks | 14.0 LTS | For ML and analytics |
| Data Layer | Python | 3.11 | For data processing scripts |
| Infrastructure | Terraform | 1.7.0 | Infrastructure provisioning |
| Infrastructure | Kubernetes | v1.28 | Container orchestration |
| Infrastructure | Azure | Azure CLI 2.54.0 | Cloud provider |
| Monitoring | Prometheus + Grafana | v2.40.5 | Metrics and dashboards |
| Security | Auth0 | v2.40 | OAuth2/OIDC authentication |
| CI/CD | GitHub Actions | v4 | Workflow automation |
| Testing | Jest | 29.7.0 | Unit and integration testing |
| Testing | Playwright | 1.40.1 | E2E testing |
| Logging | Winston | 3.10.0 | Structured logging |
| DevOps | Docker | 24.0.7 | Containerization |
| DevOps | Helm | 3.14.0 | Kubernetes packaging |

### Justification for Deviations

- **Frontend Framework:** Chose Next.js over React to leverage SSR, SSG, and App Router for performance and SEO.
- **Database ORM:** Prisma chosen over Sequelize for better TypeScript support and query builder.
- **CI/CD:** GitHub Actions over Jenkins due to simplicity and native GitHub integration.
- **Monitoring Stack:** Prometheus + Grafana over ELK stack for lightweight, scalable metrics.

---

## 3. CODING STANDARDS

### Language-Specific Style Guides

- **JavaScript/TypeScript**: Airbnb ESLint + Prettier
- **Python**: PEP 8 + Black formatting
- **SQL**: Google SQL Style Guide
- **Markdown**: GitHub Flavored Markdown

### Linting and Formatting Tools

- **ESLint**: `eslint-config-airbnb`
- **Prettier**: `prettier`
- **Python Black**: `black`
- **SQLFluff**: For SQL linting

### Import Organization Rules

1. Standard library imports (e.g., `path`, `fs`)
2. Third-party libraries (e.g., `express`, `axios`)
3. Internal modules (e.g., `utils`, `models`)

### Documentation Requirements

- All functions must have JSDoc-style comments.
- Classes must have class-level docstrings.
- API endpoints must include response schema documentation.
- Variables with non-obvious purpose must be commented.

### Naming Conventions

- Functions: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Classes: `PascalCase`
- Files: `snake_case`
- Modules: `PascalCase`

---

## 4. MODULE BOUNDARIES & INTERFACES

### Module Breakdown

| Module | Ownership | Interface |
|--------|-----------|-----------|
| `auth` | Auth service | JWT middleware, user roles |
| `dashboard` | Frontend & API | RESTful endpoints for trip data |
| `data-ingestion` | Data pipeline | Databricks job triggers |
| `model-service` | ML pipeline | RESTful inference API |
| `user-management` | Backend | CRUD for users, permissions |
| `reports` | Backend | Export logic (CSV, PDF) |
| `logging` | Backend | Winston logger integration |

### Communication Patterns

- Modules communicate via:
  - REST APIs (for cross-service communication)
  - Function calls (within monorepo)
  - Events via message queues (e.g., Kafka, RabbitMQ)

### Dependency Rules

- `auth` module can only import from `config`, `middleware`, `models`.
- `dashboard` module can import from `models`, `services`, `auth`.
- `model-service` can import from `data-processing`, `models`, `utils`.
- `data-ingestion` can import from `config`, `utils`, `models`.

---

## 5. DATA ACCESS LAYER

### ORM or Query Strategy

- **ORM**: Prisma ORM for PostgreSQL
- **Raw SQL**: For performance-critical queries or complex aggregations

### Connection Management

- Use Prisma Client with connection pooling.
- Environment variables for DB connection strings.

### Transaction Handling

- Use Prisma `transaction()` for multi-statement consistency.
- Wrap DB operations in try/catch blocks.

### Error Handling

- Wrap DB errors in custom exceptions.
- Log errors with stack trace and request context.

### Migration Strategy

- Use Prisma Migrate for schema changes.
- Version-controlled migrations in `prisma/migrations/`.

---

## 6. API IMPLEMENTATION GUIDE

### Route Structure and Naming

```
GET /api/trips
GET /api/trips/:id
POST /api/trips
PUT /api/trips/:id
DELETE /api/trips/:id
GET /api/reports/export
GET /api/auth/callback
```

### Request Validation Approach

- Use Zod for schema validation.
- Middleware to validate request body/query/params.

### Response Envelope Format

```json
{
  "status": "success",
  "data": { ... },
  "message": "Trip retrieved successfully"
}
```

### Error Response Format

```json
{
  "status": "error",
  "code": 404,
  "message": "Trip not found"
}
```

### Authentication Middleware

- JWT-based authentication with Auth0.
- Middleware checks `Authorization: Bearer <token>` header.

### Logging Requirements

- Log each request with method, path, user ID, timestamp.
- Log errors with full stack trace.

---

## 7. IMPLEMENTATION SEQUENCE

### Order of Implementation

1. **Backend Setup**:
   - Prisma ORM
   - Auth middleware
   - DB connection and migration setup
   - Initial routes (e.g., `/health`, `/auth`)

2. **Frontend Setup**:
   - Next.js app structure
   - Auth context setup
   - Basic layout and routing

3. **Data Pipeline**:
   - Databricks jobs
   - Data ingestion scripts
   - Model training and inference API

4. **Dashboard Pages**:
   - Trip listing page
   - Filters UI
   - Chart components

5. **Reports & Export**:
   - CSV/PDF export logic
   - API endpoints for reports

6. **DevOps & CI/CD**:
   - Dockerfile
   - Terraform setup
   - GitHub Actions workflows

### Dependencies

- Backend must be ready before Frontend starts.
- Auth module must be done before any protected routes.
- Databricks pipeline must be set up before data service is used.
- DevOps pipeline must be defined before deployment.

---

## 8. CODE REVIEW STANDARDS

### What the Senior Developer Checks

- Code correctness and performance
- Security (input validation, auth checks)
- Test coverage (unit + integration)
- Documentation completeness
- Naming consistency and clarity

### Automatic Blockers

- Any untested code
- Code with security vulnerabilities (e.g., SQL injection)
- PRs larger than 500 lines without justification
- Missing commit messages or breaking changes without migration notes

### PR Size Guidelines

- Max 500 lines per PR
- Large features broken into smaller PRs

### Branch Naming Convention

- `feature/feature-name`
- `fix/issue-number`
- `hotfix/issue-name`

### Commit Message Format

```
feat: add new trip filter UI
fix: resolve auth token expiry issue
docs: update API documentation
```

---

## 9. SECURITY IMPLEMENTATION REQUIREMENTS

### Authentication Implementation

- JWT-based tokens from Auth0.
- Middleware checks token validity and user roles.

### Authorization Enforcement

- Role-based access control (RBAC).
- Middleware to check user permissions before route execution.

### Input Validation

- All inputs validated with Zod.
- Sanitize inputs to prevent XSS/SQL injection.

### Secrets Management

- Secrets stored in Azure Key Vault.
- Environment variables in `.env` files (not committed).

### Logging Requirements

- Log all authentication attempts.
- Log all API requests and responses (excluding sensitive fields).
- Never log passwords, tokens, or PII.

---