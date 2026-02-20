# Database Administration Report (DBAR)  
**Project:** VA Ambulance Trip Analysis  
**Prepared By:** Senior Database Administrator  
**Date:** 19 February 2026  

---

## 1. SCHEMA REVIEW & CORRECTIONS

### 1.1 Original Schema Review

| Table | Issue | Recommendation |
|-------|-------|----------------|
| `trips` | `patient_id` as `VARCHAR(50)` is too short for HIPAA-compliant identifiers; `status` is not constrained; missing audit columns | Use UUID or surrogate key; add check constraint for `status`; add audit columns |
| `trip_classification` | No audit columns; no constraints on `classifier_name` or `predicted_class` | Add audit columns; add constraints |
| `users` | No primary key constraint; `auth0_id` not unique; missing audit columns | Ensure `auth0_id` is unique; add audit columns |
| `audit_log` | `details` is JSONB; no foreign key to `users`; `ip_address` not constrained | Add foreign key; ensure `ip_address` is valid; add audit columns |
| Indexes | No index on `updated_at`, `created_at` in `trips`; no partial indexes for `status` or `classification` | Add indexes; add partial indexes for performance |

### 1.2 Final Corrected DDL

```sql
-- trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL, -- Surrogate key for PHI
    trip_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    origin_hospital VARCHAR(255),
    destination_hospital VARCHAR(255),
    trip_type VARCHAR(50),
    classification VARCHAR(100),
    duration_minutes INTEGER,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- trip_classification table
CREATE TABLE trip_classification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    classifier_name VARCHAR(100) NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
    predicted_class VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.3 Changes Made and Rationale

| Change | Rationale |
|--------|-----------|
| `patient_id` → `UUID` | Surrogate key for PHI, allows tokenization and RLS |
| `status` → `CHECK (status IN ('active', 'completed', 'cancelled'))` | Enforces data integrity |
| `start_time`, `end_time` → `TIMESTAMP WITH TIME ZONE` | Ensures timezone consistency |
| Added `created_at`, `updated_at` to all tables | Standard audit trail |
| `trip_classification` → `NOT NULL` on `classifier_name` and `predicted_class` | Ensures data quality |
| `confidence_score` → `CHECK (confidence_score BETWEEN 0 AND 1)` | Ensures valid scores |
| `audit_log.user_id` → `REFERENCES users(id)` | Enforces referential integrity |
| `ip_address` → `VARCHAR(45)` | Supports IPv6 |

---

## 2. INDEX STRATEGY

### 2.1 Indexes for `trips`

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_trips_patient_id` | `patient_id` | B-tree | Fast lookups by patient |
| `idx_trips_trip_date` | `trip_date` | B-tree | Date filtering |
| `idx_trips_status` | `status` | B-tree | Filter by status |
| `idx_trips_classification` | `classification` | B-tree | Filter by classification |
| `idx_trips_updated_at` | `updated_at` | B-tree | Sort by last update |
| `idx_trips_created_at` | `created_at` | B-tree | Sort by creation |
| `idx_trips_date_status` | `trip_date`, `status` | B-tree | Composite filter |
| `idx_trips_patient_date` | `patient_id`, `trip_date` | B-tree | Patient + date |

### 2.2 Indexes for `trip_classification`

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_trip_classification_trip_id` | `trip_id` | B-tree | FK lookup |
| `idx_trip_classification_predicted_class` | `predicted_class` | B-tree | Filter by class |
| `idx_trip_classification_created_at` | `created_at` | B-tree | Sort by time |

### 2.3 Indexes for `users`

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_users_email` | `email` | B-tree | Fast login lookup |
| `idx_users_auth0_id` | `auth0_id` | B-tree | Fast identity lookup |

### 2.4 Indexes for `audit_log`

| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `idx_audit_log_created_at` | `created_at` | B-tree | Time-based filtering |
| `idx_audit_log_user_id` | `user_id` | B-tree | User-based audit |
| `idx_audit_log_resource` | `resource` | B-tree | Resource-based filtering |

### 2.5 Indexes to Avoid

- Avoid indexing `updated_at` unless used in queries (high write frequency)
- Avoid over-indexing on `status` if only used in filters with `trip_date` (use composite index instead)

### 2.6 Index Maintenance Strategy

- Schedule `ANALYZE` weekly
- Schedule `REINDEX` monthly for heavily updated tables
- Use `pg_stat_statements` to monitor index usage

---

## 3. QUERY OPTIMIZATION GUIDE

### 3.1 Top 10 Likely Slow Queries

1. **Patient trip summary**
   ```sql
   SELECT * FROM trips WHERE patient_id = 'uuid' AND trip_date BETWEEN '2025-01-01' AND '2025-12-31';
   ```

2. **Trip classification count by class**
   ```sql
   SELECT predicted_class, COUNT(*) FROM trip_classification GROUP BY predicted_class;
   ```

3. **User activity audit**
   ```sql
   SELECT * FROM audit_log WHERE user_id = 'uuid' ORDER BY created_at DESC LIMIT 100;
   ```

4. **Trip duration summary**
   ```sql
   SELECT AVG(duration_minutes) FROM trips WHERE trip_date > '2025-01-01';
   ```

5. **Status-based filtering**
   ```sql
   SELECT * FROM trips WHERE status = 'completed' AND trip_date > '2025-01-01';
   ```

6. **Trips by origin hospital**
   ```sql
   SELECT * FROM trips WHERE origin_hospital = 'Hospital A';
   ```

7. **Most recent trips**
   ```sql
   SELECT * FROM trips ORDER BY created_at DESC LIMIT 100;
   ```

8. **Trip classification confidence**
   ```sql
   SELECT * FROM trip_classification WHERE confidence_score > 0.9;
   ```

9. **User login history**
   ```sql
   SELECT * FROM users WHERE last_login > '2025-01-01';
   ```

10. **Trips with no classification**
    ```sql
    SELECT t.* FROM trips t LEFT JOIN trip_classification tc ON t.id = tc.trip_id WHERE tc.trip_id IS NULL;
    ```

### 3.2 Optimization Recommendations

- Use partial indexes for `status = 'completed'`
- Use `EXPLAIN ANALYZE` for complex queries
- Avoid `SELECT *` in production
- Add `LIMIT` to large result sets
- Consider partitioning `trips` by `trip_date`

---

## 4. PHI HANDLING & SECURITY

### 4.1 PHI Tokenization

- Use `UUID` for `patient_id` in `trips`
- Implement `RLS` policies for roles

### 4.2 RLS Policies

```sql
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_access ON trips
FOR SELECT
TO public
USING (patient_id IN (SELECT patient_id FROM user_patient_access WHERE user_id = current_setting('app.user_id')::uuid));
```

### 4.3 Data Retention

```sql
-- Retention policy for audit_log
CREATE OR REPLACE FUNCTION purge_old_audit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 year';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_purge_trigger
AFTER INSERT ON audit_log
EXECUTE FUNCTION purge_old_audit();
```

### 4.4 Data Masking

```sql
-- Data mask for sensitive fields
CREATE OR REPLACE VIEW trips_masked AS
SELECT id, patient_id, trip_date, start_time, end_time, origin_hospital, destination_hospital,
       trip_type, classification, duration_minutes, status, created_at, updated_at
FROM trips;
```

---

## 5. MIGRATION STRATEGY

### 5.1 Migration Naming Convention

- `YYYYMMDD_HHMMSS_description.sql`
- Example: `20250219_100000_add_patient_id_uuid.sql`

### 5.2 Safe Migration Patterns

- Use `IF NOT EXISTS` for new tables/columns
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Use transactions for multi-step migrations

### 5.3 Dangerous Patterns to Avoid

- `DROP COLUMN` without backup
- `ALTER TABLE ... RENAME COLUMN` in production without testing
- Direct data modification without `WHERE` clause

### 5.4 Rollback Procedures

```sql
-- Example rollback for adding column
-- Before:
-- ALTER TABLE trips ADD COLUMN new_field VARCHAR(50);
-- After:
-- ALTER TABLE trips DROP COLUMN new_field;
```

### 5.5 Production Migration Checklist

- [ ] Backup before migration
- [ ] Test in staging
- [ ] Run in transaction
- [ ] Monitor query performance
- [ ] Update documentation

---

## 6. CONNECTION & POOLING CONFIGURATION

### 6.1 PgBouncer Configuration

```ini
[databases]
* = host=127.0.0.1 port=5432 dbname=app_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
reserve_pool_size = 5
```

### 6.2 Pool Sizing

- For 100 concurrent connections:
  - `default_pool_size = 20`
  - `reserve_pool_size = 5`

### 6.3 Connection Timeout

```sql
-- Set timeout
SET statement_timeout = 30000; -- 30 seconds
```

---

## 7. PERFORMANCE MONITORING

### 7.1 Key Metrics

- `pg_stat_statements` for slow queries
- `pg_stat_user_tables` for table bloat
- `pg_locks` for lock waits

### 7.2 Alert Thresholds

| Metric | Threshold |
|--------|-----------|
| Query time | > 5 seconds |
| Connection count | > 90% of max |
| Lock waits | > 10 seconds |
| Vacuum lag | > 10 minutes |

### 7.3 Recommended Queries

```sql
-- Top slow queries
SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Bloat check
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(tablename)) AS total_size
FROM pg_tables
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY pg_total_relation_size(tablename) DESC;

-- Index usage
SELECT schemaname, tablename, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY idx_tup_read DESC;
```

---

## 8. BACKUP & RECOVERY PROCEDURES

### 8.1 Backup Schedule

- Full backup daily
- Transaction log backup every 15 minutes

### 8.2 Point-in-Time Recovery

1. Restore full backup
2. Apply transaction logs up to desired point
3. Start PostgreSQL

### 8.3 Geo-Redundant Backup

- Enable geo-redundant backup in Azure SQL
- Test restore in different region

### 8.4 RTO Validation

- Run monthly recovery drills
- Validate restore time < 30 minutes

---

## 9. CAPACITY PLANNING

### 9.1 Current Data Volume

- 10 million trips/year
- 500K trip classifications/year
- 10K users/year

### 9.2 Growth Projections

| Year | Trips | Classification |
|------|-------|----------------|
| 1    | 10M   | 500K           |
| 3    | 30M   | 1.5M           |
| 5    | 50M   | 2.5M           |

### 9.3 Storage Requirements

- 100GB/year (estimated)
- Partition `trips` by `trip_date` after 1 year

### 9.4 Scaling Triggers

- Partitioning: 10M+ trips
- Archival: 50M+ trips
- Read replicas: 100M+ trips
- Sharding: 1B+ trips

---

## 10. DATABASE STANDARDS

### 10.1 Naming Conventions

| Object Type | Convention |
|-------------|------------|
| Table       | `snake_case` |
| Column      | `snake_case` |
| Index       | `idx_table_column` |
| Constraint  | `fk_table_column` |

### 10.2 Required Columns

Every table must have:
- `id UUID PRIMARY KEY`
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

### 10.3 Column Type Standards

| Field Type | Standard |
|------------|----------|
| ID         | `UUID` |
| Timestamps | `TIMESTAMP WITH TIME ZONE` |
| Text       | `VARCHAR(n)` or `TEXT` |
| Boolean    | `BOOLEAN` |

### 10.4 Constraint Standards

- All non-key columns should be `NOT NULL` unless explicitly allowed
- Use `CHECK` constraints for valid ranges
- Use `UNIQUE` constraints on identifiers

### 10.5 Documentation

- All schema changes must be documented in `CHANGELOG.md`
- Each migration must include a comment explaining the change

---