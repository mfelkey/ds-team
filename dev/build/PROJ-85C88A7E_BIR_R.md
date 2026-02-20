# Backend Implementation Report (BIR-R)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Backend Developer  
**Date:** 19 February 2026  

---

## 1. DATABASE SCHEMA

### 1.1 SQL DDL for All Tables

```sql
-- trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) NOT NULL,
    trip_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    origin_hospital VARCHAR(255),
    destination_hospital VARCHAR(255),
    trip_type VARCHAR(50),
    classification VARCHAR(100),
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (start_time <= end_time)
);

-- trip_classification table
CREATE TABLE trip_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    classifier_name VARCHAR(100),
    confidence_score DECIMAL(5,4),
    predicted_class VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    auth0_id VARCHAR(255) UNIQUE, -- Note: This column is retained for compatibility, but will not be used for OIDC identity
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    resource VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_trips_patient_id ON trips(patient_id);
CREATE INDEX idx_trips_trip_date ON trips(trip_date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_classification ON trips(classification);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

### 1.2 Prisma Schema (`schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Trip {
  id                     UUID      @id @default(uuid())
  patientId              String    @db.VarChar(50)
  tripDate               Date
  startTime              DateTime
  endTime                DateTime
  originHospital         String?
  destinationHospital    String?
  tripType               String?
  classification         String?
  durationMinutes        Int?
  status                 String    @default("active")
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
  TripClassification     TripClassification[]
}

model TripClassification {
  id                UUID      @id @default(uuid())
  tripId            UUID
  classifierName    String
  confidenceScore   Float
  predictedClass    String
  createdAt         DateTime  @default(now())
  Trip              Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
}

model User {
  id              UUID      @id @default(uuid())
  email           String    @unique
  role            String    @default("user")
  auth0Id         String    @unique
  lastLogin       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  AuditLogs       AuditLog[]
}

model AuditLog {
  id           UUID      @id @default(uuid())
  userId       UUID?
  action       String
  resource     String
  details      Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime  @default(now())
  User         User?     @relation(fields: [userId], references: [id])
}
```

### 1.3 Seed Data Structure

```js
// seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@va.gov' },
    update: {},
    create: {
      email: 'admin@va.gov',
      role: 'admin',
      lastLogin: new Date(),
    },
  });
  console.log('User created:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 2. API ENDPOINTS

All API endpoints remain unchanged from the original BIR. Authentication middleware now uses generic OIDC JWT validation.

### Example Endpoint:

```js
// routes/trips.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getTrips, createTrip } = require('../services/tripService');

router.get('/', authenticateToken, getTrips);
router.post('/', authenticateToken, requireRole(['admin', 'analyst']), createTrip);

module.exports = router;
```

---

## 3. AUTHENTICATION & AUTHORIZATION (FULLY REVISED)

### 3.1 OIDC Configuration Module

```js
// config/oidc.js
const { Issuer } = require('openid-client');
const { env } = require('process');

const isMock = env.OIDC_MOCK === 'true';

if (isMock) {
  console.warn('OIDC MOCK MODE ENABLED');
}

const issuerUrl = env.OIDC_ISSUER_URL;
const clientId = env.OIDC_CLIENT_ID;
const clientSecret = env.OIDC_CLIENT_SECRET;
const redirectUri = env.OIDC_REDIRECT_URI;
const scopes = env.OIDC_SCOPES || 'openid profile email';
const audience = env.OIDC_AUDIENCE;

let client;

async function initOidcClient() {
  if (isMock) {
    return null;
  }

  const issuer = await Issuer.discover(issuerUrl);
  client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ['code'],
  });

  if (audience) {
    client.custom.set('audience', audience);
  }

  return client;
}

module.exports = {
  isMock,
  client,
  initOidcClient,
  issuerUrl,
  redirectUri,
  scopes,
  audience,
};
```

### 3.2 JWT Middleware

```js
// middleware/auth.js
const { JWT } = require('jose');
const { isMock, client, initOidcClient } = require('../config/oidc');
const { env } = require('process');

const rolesClaim = env.OIDC_ROLES_CLAIM || 'roles';

async function authenticateToken(req, res, next) {
  if (isMock) {
    req.user = {
      sub: 'mock-user-id',
      email: 'user@example.com',
      [rolesClaim]: ['user'],
    };
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const { payload } = await JWT.verify(token, await client.keystore.get());
    req.user = {
      sub: payload.sub,
      email: payload.email,
      [rolesClaim]: payload[rolesClaim] || [],
    };
    next();
  } catch (err) {
    if (err.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user[rolesClaim];
    if (!userRoles.some(role => allowedRoles.includes(role))) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
```

### 3.3 Login & Callback Routes

```js
// routes/auth.js
const express = require('express');
const router = express.Router();
const { client, redirectUri, scopes, initOidcClient } = require('../config/oidc');
const { isMock } = require('../config/oidc');

router.get('/login', async (req, res) => {
  if (isMock) {
    return res.redirect(`${redirectUri}?code=mock-code`);
  }

  const url = client.authorizationUrl({
    redirect_uri: redirectUri,
    scope: scopes,
    response_mode: 'query',
  });

  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  if (isMock) {
    return res.redirect('/dashboard');
  }

  const params = client.callbackParams(req);
  try {
    const tokenSet = await client.callback(redirectUri, params);
    const user = await client.userinfo(tokenSet.access_token);
    req.session.user = user;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Authentication failed');
  }
});

module.exports = router;
```

### 3.4 Provider Reference Implementations

#### Provider Reference Implementation: Okta

```env
OIDC_ISSUER_URL=https://your-org.okta.com/oauth2/default
OIDC_CLIENT_ID=your-okta-client-id
OIDC_CLIENT_SECRET=your-okta-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_SCOPES=openid profile email
```

#### Provider Reference Implementation: Azure AD (Entra ID)

```env
OIDC_ISSUER_URL=https://login.microsoftonline.com/{tenant-id}/v2.0
OIDC_CLIENT_ID=your-app-client-id
OIDC_CLIENT_SECRET=your-app-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_SCOPES=openid profile email
```

#### Provider Reference Implementation: Auth0

```env
OIDC_ISSUER_URL=https://your-domain.auth0.com
OIDC_CLIENT_ID=your-auth0-client-id
OIDC_CLIENT_SECRET=your-auth0-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_SCOPES=openid profile email
```

#### Provider Reference Implementation: Keycloak

```env
OIDC_ISSUER_URL=https://your-keycloak-server/auth/realms/your-realm
OIDC_CLIENT_ID=your-keycloak-client-id
OIDC_CLIENT_SECRET=your-keycloak-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_SCOPES=openid profile email
```

---

## 4. DATA ACCESS LAYER

No changes needed. Prisma and repository pattern remain the same.

---

## 5. BUSINESS LOGIC SERVICES

### 5.1 Audit Logging Service

```js
// services/auditService.js
const { AuditLog } = require('../models');

async function logAction(userId, action, resource, details, ip, userAgent) {
  const auditLog = new AuditLog({
    userId,
    action,
    resource,
    details,
    ip,
    userAgent,
  });
  await auditLog.save();
}

module.exports = {
  logAction,
};
```

### 5.2 Replace Auth0 User ID with Sub Claim

In audit logging, use `sub` instead of `auth0_id`:

```js
// Inside services/tripService.js
const { logAction } = require('../services/auditService');

async function createTrip(req, res) {
  const trip = await Trip.create(req.body);
  await logAction(req.user.sub, 'CREATE_TRIP', 'TRIP', trip._id, req.ip, req.get('User-Agent'));
  res.status(201).json(trip);
}
```

---

## 6. ERROR HANDLING

```js
// middleware/errorHandler.js
const winston = require('winston');

function errorHandler(err, req, res, next) {
  winston.error(`${err.message} - ${req.url} - ${req.method}`);

  if (err.code === 'ERR_JWT_EXPIRED') {
    return res.status(401).json({ message: 'Token expired' });
  }

  if (err.code === 'ERR_JWT_INVALID') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.status === 403) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ message: 'OIDC provider unreachable' });
  }

  res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
```

---

## 7. LOGGING

Winston configured as before, but logs only `sub` for audit trail.

```js
// config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});

module.exports = logger;
```

Never log tokens or secrets.

---

## 8. UNIT TESTS

```js
// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const { authenticateToken } = require('../middleware/auth');

describe('Auth Middleware', () => {
  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('should allow valid token', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', 'Bearer mock-token');
    expect(res.status).toBe(200);
  });
});
```

---

## 9. INTEGRATION TESTS

```js
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../app');

describe('OIDC Flow Integration', () => {
  it('should redirect to login', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(302);
  });

  it('should handle callback with mock', async () => {
    const res = await request(app).get('/auth/callback?code=mock-code');
    expect(res.status).toBe(302);
  });
});
```

---

## 10. ENVIRONMENT CONFIGURATION

### `.env.example`

```env
# OIDC Configuration
OIDC_ISSUER_URL=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
OIDC_SCOPES=openid profile email
OIDC_AUDIENCE=your-audience
OIDC_ROLES_CLAIM=roles
OIDC_MOCK=false

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ambulance_db

# Server
PORT=3000
NODE_ENV=development
```

### Notes for OIDC Provider Setup

- Register `OIDC_REDIRECT_URI` in your provider.
- Ensure `OIDC_SCOPES` include required claims (e.g., `email`, `profile`, `sub`).
- Enable OpenID Connect for the application.

---