# Test Automation Report (TAR)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Test Automation Engineer  
**Date:** 19 February 2026  

---

## 1. TEST SUITE STRUCTURE

### Directory Tree

```
va-ambulance-trip-analysis/
├── tests/
│   ├── e2e/
│   │   ├── playwright.config.ts
│   │   ├── fixtures/
│   │   │   ├── auth.fixtures.ts
│   │   │   └── page.fixtures.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.ts
│   │   │   ├── DashboardPage.ts
│   │   │   ├── FilterBar.ts
│   │   │   ├── TripDetailModal.ts
│   │   │   └── BasePage.ts
│   │   ├── tests/
│   │   │   ├── login.spec.ts
│   │   │   ├── filter.spec.ts
│   │   │   ├── trip-detail.spec.ts
│   │   │   ├── export.spec.ts
│   │   │   ├── session-timeout.spec.ts
│   │   │   ├── keyboard-nav.spec.ts
│   │   │   └── accessibility.spec.ts
│   │   └── utils/
│   │       ├── accessibility.ts
│   │       └── tags.ts
│   ├── api/
│   │   ├── api.test.ts
│   │   ├── utils/
│   │   │   └── test-db.ts
│   │   └── setup/
│   │       └── setup.ts
│   ├── unit/
│   │   ├── components/
│   │   │   ├── KPICard.test.tsx
│   │   │   ├── FilterBar.test.tsx
│   │   │   ├── DataTable.test.tsx
│   │   │   ├── Modal.test.tsx
│   │   │   ├── Toast.test.tsx
│   │   │   ├── ErrorBanner.test.tsx
│   │   │   └── useTrips.test.ts
│   │   └── mocks/
│   │       └── mockServices.ts
│   └── perf/
│       ├── dashboard-load.js
│       ├── filter-query.js
│       └── export-csv.js
├── scripts/
│   ├── seed-db.ts
│   └── generate-synthetic-data.ts
├── .env.test.example
├── package.json
├── jest.config.js
├── playwright.config.ts
├── Makefile
└── README.md
```

### File Naming Conventions

- `*.spec.ts` — E2E test files
- `*.test.ts` — API and unit tests
- `*.fixtures.ts` — Playwright fixtures
- `*.page.ts` — Page Object Model classes
- `*.utils.ts` — Shared utilities
- `*.js` — k6 performance scripts

### Organization Strategy

- **By Layer**: Unit, API, E2E, Performance
- **By Feature**: Each test suite has a feature folder (e.g., `/tests/e2e/tests/login.spec.ts`)
- **By Tag**: Tests are tagged with `@smoke`, `@regression`, `@cloud-only`, `@onprem-only`
- **Shared Fixtures**: Authenticated pages, base page classes, accessibility utilities

---

## 2. ENVIRONMENT CONFIGURATION

### `.env.test.example`

```env
# Base URL for application (deployment-agnostic)
BASE_URL=http://localhost:3000

# Auth0 configuration
AUTH0_DOMAIN=test.auth0.com
AUTH0_CLIENT_ID=client_id_here
AUTH0_CLIENT_SECRET=secret_here

# Database connection string
DATABASE_URL=postgresql://user:pass@localhost:5432/va_ambulance_db

# DEPLOY_TARGET: cloud | onprem
DEPLOY_TARGET=cloud

# Test user credentials (for login)
ADMIN_USER_EMAIL=admin@example.com
ADMIN_USER_PASSWORD=admin123
ANALYST_USER_EMAIL=analyst@example.com
ANALYST_USER_PASSWORD=analyst123
VIEWER_USER_EMAIL=viewer@example.com
VIEWER_USER_PASSWORD=viewer123

# Export feature flag (enable/disable)
EXPORT_ENABLED=true

# Test data volumes
DATA_VOLUME=1000
```

### Variable Documentation

| Variable            | Description                                 | Valid Values         |
|---------------------|---------------------------------------------|----------------------|
| `BASE_URL`          | Application base URL                        | Any valid HTTP URL   |
| `AUTH0_DOMAIN`      | Auth0 domain                                | Any valid domain     |
| `AUTH0_CLIENT_ID`   | Auth0 client ID                             | String               |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret                        | String               |
| `DATABASE_URL`      | PostgreSQL connection string                | Valid PostgreSQL URL |
| `DEPLOY_TARGET`     | Target deployment environment               | `cloud` or `onprem`  |
| `ADMIN_USER_EMAIL`  | Admin test user email                       | Email string         |
| `ADMIN_USER_PASSWORD` | Admin test user password                  | String               |
| `EXPORT_ENABLED`    | Enable export functionality in tests        | `true` or `false`    |
| `DATA_VOLUME`       | Synthetic data volume (1k, 5k, 10k rows)     | `1000`, `5000`, `10000` |

### DEPLOY_TARGET Behavior

- If `DEPLOY_TARGET=cloud`, tests tagged `@onprem-only` are skipped.
- If `DEPLOY_TARGET=onprem`, tests tagged `@cloud-only` are skipped.
- This is handled via custom `playwright.config.ts` and Jest setup.

---

## 3. PLAYWRIGHT E2E TESTS

### `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';
import { DEPLOY_TARGET } from './tests/e2e/utils/tags';

export default defineConfig({
  testDir: './tests/e2e/tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/report.json' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/',
  globalSetup: require.resolve('./tests/e2e/setup/global.setup.ts'),
  testMatch: /.*\.spec\.ts/,
  testIgnore: /node_modules/,
  expect: {
    timeout: 5000,
  },
  grep: DEPLOY_TARGET === 'cloud' ? /@cloud-only/ : DEPLOY_TARGET === 'onprem' ? /@onprem-only/ : undefined,
});
```

### Fixtures

#### `auth.fixtures.ts`

```ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend({
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.ADMIN_USER_EMAIL!, process.env.ADMIN_USER_PASSWORD!);
    await use(page);
  },
  analystPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.ANALYST_USER_EMAIL!, process.env.ANALYST_USER_PASSWORD!);
    await use(page);
  },
  viewerPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.VIEWER_USER_EMAIL!, process.env.VIEWER_USER_PASSWORD!);
    await use(page);
  },
});
```

### Page Object Models

#### `DashboardPage.ts`

```ts
import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async isLoaded() {
    await expect(this.page.locator('h1')).toHaveText('Dashboard');
  }
}
```

#### `TripDetailModal.ts`

```ts
import { Page } from '@playwright/test';

export class TripDetailModal {
  constructor(private page: Page) {}

  async openTripDetail(id: string) {
    await this.page.click(`[data-testid="trip-${id}"]`);
  }

  async close() {
    await this.page.click('[data-testid="modal-close"]');
  }

  async isVisible() {
    await expect(this.page.locator('[data-testid="modal"]')).toBeVisible();
  }
}
```

### Accessibility Integration

#### `accessibility.ts`

```ts
import { Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

export async function checkAccessibility(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
}
```

### Sample Test

#### `login.spec.ts`

```ts
import { test, expect } from '../fixtures/auth.fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login', () => {
  test('should allow admin to login', async ({ adminPage }) => {
    const loginPage = new LoginPage(adminPage);
    await loginPage.goto();
    await loginPage.login(process.env.ADMIN_USER_EMAIL!, process.env.ADMIN_USER_PASSWORD!);
    await expect(adminPage).toHaveURL('/');
  });
});
```

### Tagging Strategy

- `@smoke`: Critical path tests
- `@regression`: All regression tests
- `@cloud-only`: Cloud-specific tests (e.g., Auth0 integration)
- `@onprem-only`: On-prem tests (e.g., local DB connection)

---

## 4. JEST + SUPERTEST API TESTS

### `jest.config.js`

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'tests/api/**/*.ts',
    '!tests/api/setup/**',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/api/setup/setup.ts'],
};
```

### Example Test: `GET /api/trips`

```ts
import request from 'supertest';
import app from '../api/server';
import { connectDB, disconnectDB } from '../api/utils/test-db';

describe('GET /api/trips', () => {
  beforeAll(async () => await connectDB());
  afterAll(async () => await disconnectDB());

  it('should return trips with pagination', async () => {
    const res = await request(app).get('/api/trips?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('trips');
  });
});
```

### Test Setup

```ts
// tests/api/setup/setup.ts
import { connectDB, disconnectDB } from '../utils/test-db';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});
```

---

## 5. JEST + REACT TESTING LIBRARY UNIT TESTS

### Component Test: `KPICard.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/KPICard';

describe('KPICard', () => {
  it('renders value and tooltip', () => {
    render(<KPICard title="Total Trips" value={100} tooltip="Total trips this month" />);
    expect(screen.getByText('Total Trips')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

### Hook Test: `useTrips.test.ts`

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTrips } from '../hooks/useTrips';

describe('useTrips', () => {
  it('fetches trips successfully', async () => {
    const { result } = renderHook(() => useTrips());
    await waitFor(() => expect(result.current.data).not.toBe(null));
  });
});
```

---

## 6. K6 PERFORMANCE SCRIPTS

### `dashboard-load.js`

```js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const base = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const res = http.get(base + '/');
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
```

### `filter-query.js`

```js
import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get(base + '/api/trips?status=completed');
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 7. TEST RUNNER CONFIGURATION

### `package.json`

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=unit",
    "test:api": "jest --testPathPattern=api",
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --grep @smoke",
    "test:a11y": "playwright test --grep @a11y",
    "test:perf": "k6 run tests/perf/dashboard-load.js",
    "test:all": "npm run test:unit && npm run test:api && npm run test:e2e",
    "test:cloud": "DEPLOY_TARGET=cloud playwright test",
    "test:onprem": "DEPLOY_TARGET=onprem playwright test"
  }
}
```

### Makefile

```makefile
.PHONY: test-unit test-api test-e2e test-all test-cloud test-onprem

test-unit:
	npm run test:unit

test-api:
	npm run test:api

test-e2e:
	npm run test:e2e

test-all:
	npm run test:all

test-cloud:
	npm run test:cloud

test-onprem:
	npm run test:onprem
```

---

## 8. CI/CD Integration

In `.github/workflows/test.yml`:

```yaml
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test:all
```

---

Let me know if you'd like a downloadable version or Docker setup!