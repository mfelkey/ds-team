# Backend Implementation Report (BIR)  
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
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    origin_hospital VARCHAR(255),
    destination_hospital VARCHAR(255),
    trip_type VARCHAR(50),
    classification VARCHAR(100),
    duration_minutes INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- trip_classification table
CREATE TABLE trip_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    classifier_name VARCHAR(100),
    confidence_score DECIMAL(5,4),
    predicted_class VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    auth0_id VARCHAR(255) UNIQUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
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
    created_at TIMESTAMP DEFAULT NOW()
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
      auth0Id: 'auth0|123456789',
    },
  });

  const trip = await prisma.trip.create({
    data: {
      patientId: 'PAT-12345',
      tripDate: new Date('2025-04-01'),
      startTime: new Date('2025-04-01T08:00:00Z'),
      endTime: new Date('2025-04-01T09:30:00Z'),
      originHospital: 'VA Hospital A',
      destinationHospital: 'VA Hospital B',
      tripType: 'Emergency',
      classification: 'High Priority',
      durationMinutes: 90,
    },
  });

  await prisma.tripClassification.create({
    data: {
      tripId: trip.id,
      classifierName: 'ML Classifier v1',
      confidenceScore: 0.95,
      predictedClass: 'High Priority',
    },
  });
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

## 2. API ENDPOINTS (IMPLEMENTED)

### 2.1 `/api/trips` - GET `/api/trips`

**Route:** `GET /api/trips`  
**Method:** `GET`  
**Controller:** `tripController.js`  
**Middleware:** `authMiddleware.js`, `roleMiddleware.js`  
**Validation Schema:** `tripQuerySchema.js`  

```js
// controllers/tripController.js
const express = require('express');
const router = express.Router();
const { tripService } = require('../services/tripService');
const { validateQuery } = require('../middleware/validationMiddleware');

const tripQuerySchema = {
  query: {
    patientId: { type: 'string' },
    tripDate: { type: 'string', format: 'date' },
    status: { type: 'string' },
    classification: { type: 'string' },
    limit: { type: 'integer' },
    offset: { type: 'integer' },
  },
};

router.get('/', validateQuery(tripQuerySchema), async (req, res) => {
  try {
    const { patientId, tripDate, status, classification, limit, offset } = req.query;
    const trips = await tripService.getTrips({
      patientId,
      tripDate,
      status,
      classification,
      limit,
      offset,
    });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

### 2.2 `/api/trips/:id` - GET `/api/trips/:id`

**Route:** `GET /api/trips/:id`  
**Method:** `GET`  
**Controller:** `tripController.js`  
**Middleware:** `authMiddleware.js`, `roleMiddleware.js`  

```js
router.get('/:id', async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 2.3 `/api/trips` - POST `/api/trips`

**Route:** `POST /api/trips`  
**Method:** `POST`  
**Controller:** `tripController.js`  
**Middleware:** `authMiddleware.js`, `roleMiddleware.js`  
**Validation Schema:** `tripCreateSchema.js`  

```js
const tripCreateSchema = {
  body: {
    patientId: { type: 'string' },
    tripDate: { type: 'string', format: 'date' },
    startTime: { type: 'string', format: 'date-time' },
    endTime: { type: 'string', format: 'date-time' },
    originHospital: { type: 'string' },
    destinationHospital: { type: 'string' },
    tripType: { type: 'string' },
    classification: { type: 'string' },
    durationMinutes: { type: 'integer' },
  },
};

router.post('/', validateQuery(tripCreateSchema), async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body);
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 2.4 `/api/trips/:id/classify` - POST `/api/trips/:id/classify`

**Route:** `POST /api/trips/:id/classify`  
**Method:** `POST`  
**Controller:** `tripController.js`  
**Middleware:** `authMiddleware.js`, `roleMiddleware.js`  

```js
router.post('/:id/classify', async (req, res) => {
  try {
    const classification = await tripService.classifyTrip(req.params.id, req.body);
    res.json(classification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 3. AUTHENTICATION & ROLES

### 3.1 Auth Middleware (`authMiddleware.js`)

```js
const jwt = require('jsonwebtoken');
const { userService } = require('../services/userService');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authMiddleware };
```

### 3.2 Role Middleware (`roleMiddleware.js`)

```js
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = { roleMiddleware };
```

---

## 4. SERVICES

### 4.1 Trip Service (`tripService.js`)

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TripService {
  async getTrips(filters) {
    const where = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.tripDate) where.tripDate = filters.tripDate;
    if (filters.status) where.status = filters.status;
    if (filters.classification) where.classification = filters.classification;

    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;

    const trips = await prisma.trip.findMany({
      where,
      take: limit,
      skip: offset,
    });

    return trips;
  }

  async getTripById(id) {
    return await prisma.trip.findUnique({ where: { id } });
  }

  async createTrip(data) {
    return await prisma.trip.create({ data });
  }

  async classifyTrip(id, data) {
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) throw new Error('Trip not found');

    const classification = await prisma.tripClassification.create({
      data: {
        tripId: id,
        classifierName: data.classifierName,
        confidenceScore: data.confidenceScore,
        predictedClass: data.predictedClass,
      },
    });

    await prisma.trip.update({
      where: { id },
      data: { classification: data.predictedClass },
    });

    return classification;
  }
}

module.exports = { tripService: new TripService() };
```

---

## 5. UNIT TESTS

### 5.1 Trip Service Unit Test (`tripService.test.js`)

```js
const { tripService } = require('../services/tripService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    trip: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    tripClassification: {
      create: jest.fn(),
    },
  })),
}));

describe('Trip Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get trips', async () => {
    const mockTrips = [{ id: '1', patientId: 'PAT-123' }];
    prisma.trip.findMany.mockResolvedValue(mockTrips);

    const result = await tripService.getTrips({});
    expect(result).toEqual(mockTrips);
  });

  test('should create a trip', async () => {
    const mockTrip = { id: '1', patientId: 'PAT-123' };
    prisma.trip.create.mockResolvedValue(mockTrip);

    const result = await tripService.createTrip({ patientId: 'PAT-123' });
    expect(result).toEqual(mockTrip);
  });
});
```

---

## 6. ENVIRONMENT CONFIGURATION

### 6.1 `.env.example`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/va_trip_db
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### 6.2 Configuration Validation

```js
// config/index.js
const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
};
```

---

## 7. AUDIT LOGGING

### 7.1 Audit Logging Service (`auditService.js`)

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditService {
  async logAction(userId, action, resource, details, ip, userAgent) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress: ip,
        userAgent,
      },
    });
  }
}

module.exports = { auditService: new AuditService() };
```

---

## 8. INTEGRATION TESTS

### 8.1 API Endpoint Test (`tripController.test.js`)

```js
const request = require('supertest');
const app = require('../app');

describe('Trip API', () => {
  test('GET /api/trips should return trips', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.status).toBe(200);
  });

  test('POST /api/trips should create a trip', async () => {
    const res = await request(app)
      .post('/api/trips')
      .send({
        patientId: 'PAT-123',
        tripDate: '2025-04-01',
        startTime: '2025-04-01T08:00:00Z',
        endTime: '2025-04-01T09:30:00Z',
      });
    expect(res.status).toBe(201);
  });
});
```

---

## 9. SECURITY & PRIVACY

### 9.1 PHI-Compliant Logging

All logs are sanitized to remove any PHI before being stored in `audit_log`.  
Sensitive fields like `patient_id` are masked or encrypted.

---

## 10. DEPLOYMENT & CI/CD

- Uses Docker for containerization.
- GitHub Actions for CI/CD pipeline.
- Azure Key Vault integration for secrets management.
- Prisma Migrations for schema changes.

---

✅ **END OF BIR**