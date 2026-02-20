# VA Ambulance Trip Analysis – Sprint Planning Document  
*Prepared by the Scrum Team – 19 February 2026*  

---  

## 1. DEFINITION OF DONE  

| Level | What must be true before the item is considered **Done** |
|-------|----------------------------------------------------------|
| **Project‑Level DoD** | 1. All **P1** business objectives are met and signed‑off by the Executive Sponsor (CMO & CFO).  <br>2. Cleaned & classified 2023 ambulance‑trip dataset is stored in the VA EDW with a data‑dictionary and data‑quality report (≥ 98 % completeness, ≤ 2 % duplicate).  <br>3. Interactive dashboard (Power BI) is deployed to the VA approved environment, passes **Section 508**, **HIPAA**, and **ATO** assessments, and is usable by all identified end‑users.  <br>4. All required documentation (architecture, run‑books, security/PIA, training guides) is delivered and archived in VA Knowledge Management.  <br>5. Post‑deployment support (2 weeks) is completed with no critical defects. |
| **Sprint‑Level DoD** | 1. All stories in the sprint have **Accepted** status (see Code‑Level DoD).  <br>2. Sprint Review held; demoed to stakeholders; feedback captured in the Sprint Retrospective.  <br>3. Updated Product Backlog reflects any new items or re‑prioritisation.  <br>4. All work is integrated into **main** branch, builds pass CI, and are deployed to the **Sprint** environment. |
| **Code‑Level DoD** | 1. **Unit tests** ≥ 80 % coverage and all pass.  <br>2. **Static code analysis** (SonarQube) has **no blocker** or **critical** issues.  <br>3. Code follows VA **C++/Python/SQL** style guide and includes inline documentation.  <br>4. **Peer‑review** completed (at least one DS/BI lead).  <br>5. **Build** succeeds in CI pipeline; artefacts versioned.  <br>6. **Security scan** (SAST) clear; no high‑severity findings.  <br>7. **Automated integration test** for end‑to‑end data flow runs successfully.  <br>8. **Rollback** procedure documented and tested. |

---  

## 2. PRODUCT BACKLOG  

### EPIC E1 – Data Ingestion & Cleaning  

| Story ID | Title | Description | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|-------------|----|----------|--------------|----------------------|
| **E1‑S1** | Pull 2023 ambulance data from EDW | Create an automated extract (SQL/ADF) that pulls raw trip tables, logs row counts, and stores a staging copy in a secure schema. | 3 | P1 | None | • Extraction runs nightly without failures.<br>• Row count matches source (±1 %).<br>• Data stored in `VA.AMBULANCE_STG_2023` with audit log. |
| **E1‑S2** | Data profiling & quality report | Run profiling scripts to identify missing values, date inconsistencies, duplicate rows, and out‑of‑range cost fields. Produce a PDF/HTML report. | 2 | P1 | E1‑S1 | • Report lists each issue with count and % of total.<br>• All critical issues (missing TripID, dates) flagged for remediation. |
| **E1‑S3** | Clean & standardize dataset | Apply transformations: date format, trim strings, remove duplicates, impute missing non‑critical fields, and enforce FK integrity. Output to `VA.AMBULANCE_CLEAN_2023`. | 5 | P1 | E1‑S2 | • Cleaned table passes 98 % completeness rule.<br>• No duplicate TripIDs.<br>• All dates are valid ISO‑8601. |
| **E1‑S4** | Validation test suite for ETL | Automated tests (pytest + dbt) that verify row counts, key constraints, and data‑type conformity after each run. | 2 | P2 | E1‑S3 | • Tests run in CI and all pass.<br>• Any regression fails the build. |
| **E1‑S5** | Documentation of ETL pipeline | Create run‑books, data‑dictionary, and diagram (Visio) describing source‑to‑staging‑to‑clean flow. | 1 | P3 | E1‑S3 | • Documentation stored in VA Knowledge Base; reviewed & approved by Data Governance. |

### EPIC E2 – Classification Engine  

| Story ID | Title | Description | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|-------------|----|----------|--------------|----------------------|
| **E2‑S1** | Define business rules for “In‑House” vs “Contracted” | Capture rule set (Provider ID ranges, Service Type flags, Contract Flag) from Health Economics lead. | 2 | P1 | E1‑S5 | • Rules documented in a spreadsheet and approved.<br>• Traceability matrix links each rule to source field. |
| **E2‑S2** | Implement rule‑based classification script | Python/SQL job that reads `VA.AMBULANCE_CLEAN_2023`, applies rules, writes `VA.AMBULANCE_CLASSIFIED_2023` with `Classification` column. | 5 | P1 | E2‑S1, E1‑S3 | • ≥ 99 % of rows classified by rules.<br>• Sample audit shows 100 % rule compliance. |
| **E2‑S3** | Build ML fallback model (optional) | Train a LightGBM model on a labelled subset (manual review) to predict classification for edge cases where rules are ambiguous. | 8 | P2 | E2‑S2 | • Model F1‑score ≥ 0.90 on hold‑out set.<br>• Model can be invoked via API. |
| **E2‑S4** | Automated classification pipeline (CI/CD) | Package scripts into Docker image, add to CI pipeline, schedule nightly run, generate classification audit log. | 3 | P1 | E2‑S2, E2‑S3 (if used) | • Pipeline runs without manual steps.<br>• Audit log stored in `VA.AMBULANCE_CLASS_LOG_2023`. |
| **E2‑S5** | Classification validation report | Compare rule‑only vs rule+ML outputs, flag discrepancies, provide summary to Business Owner. | 2 | P2 | E2‑S4 | • Report delivered weekly; discrepancies < 1 % of total trips. |

### EPIC E3 – Dashboard Development  

| Story ID | Title | Description | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|-------------|----|----------|--------------|----------------------|
| **E3‑S1** | Dashboard UI mock‑up (Section 508) | Create low‑fidelity wireframes in Power BI with accessibility considerations (color contrast, keyboard navigation). | 2 | P1 | E2‑S4 | • Mock‑up reviewed & signed off by Accessibility Lead.<br>• Meets WCAG 2.1 AA criteria. |
| **E3‑S2** | Data model & measures in Power BI | Build a semantic layer pulling from `VA.AMBULANCE_CLASSIFIED_2023` – measures: Trip Count, Total Cost, % In‑House, % Contracted, monthly trends. | 5 | P1 | E2‑S4 | • All measures calculate correctly (validated against Excel). |
| **E3‑S3** | Interactive filters & drill‑through | Implement filters (Month, Region, Provider Type) and drill‑through to trip‑level detail view. | 3 | P1 | E3‑S2 | • Users can filter to any month and see underlying rows.<br>• Performance ≤ 2 seconds for full dataset. |
| **E3‑S4** | Dashboard performance & caching | Configure aggregations, incremental refresh, and row‑level security (VA roles). | 3 | P2 | E3‑S3 | • Refresh time ≤ 30 min.<br>• Security test shows users only see their region’s data. |
| **E3‑S5** | End‑user training & rollout guide | Create short video (5 min) and PDF guide covering navigation, filters, and export options. | 2 | P3 | E3‑S3 | • Guide stored in VA SharePoint; training session logged. |

### EPIC E4 – Security, Compliance & ATO  

| Story ID | Title | Description | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|-------------|----|----------|--------------|----------------------|
| **E4‑S1** | Privacy Impact Assessment (PIA) | Complete PIA for the data pipeline and dashboard, address HIPAA concerns, obtain sign‑off from InfoSec. | 3 | P1 | E1‑S5, E3‑S5 | • PIA document approved; no high‑risk findings. |
| **E4‑S2** | ATO package preparation | Assemble System Security Plan (SSP), configuration baselines, and continuous monitoring plan for the production environment. | 5 | P1 | E4‑S1, E3‑S4 | • ATO package submitted to the VA IA Review Board.<br>• Expected ATO decision within 2 weeks of submission. |
| **E4‑S3** | Section 508 automated testing | Integrate axe‑core testing into CI for the Power BI .pbix artefact; capture any violations. | 2 | P2 | E3‑S1 | • Test runs on each dashboard publish; failures break the build. |
| **E4‑S4** | Harden Docker image (pipeline) | Apply VA baseline hardening (minimal OS, non‑root user, CVE‑free base image). | 2 | P2 | E2‑S4 | • Image passes CIS Docker Benchmark scan. |
| **E4‑S5** | ATO Review & Final Sign‑off | Present architecture, test evidence, and compliance artefacts to the VA ATO Review Board; obtain **Authorization to Operate**. | 5 | P1 | E4‑S2, E3‑S4 | • ATO granted (Letter of Authorization).<br>• No open high‑severity findings. |

### EPIC E5 – Production Deployment & Support  

| Story ID | Title | Description | SP | Priority | Dependencies | Acceptance Criteria |
|----------|-------|-------------|----|----------|--------------|----------------------|
| **E5‑S1** | Deploy to Production (VA‑Approved) | Move Docker image and Power BI workspace to the Production tenant, enable monitoring (Azure Monitor). | 5 | P1 | E4‑S5, E3‑S4 | • Deployment succeeds; monitoring dashboards show “Healthy”. |
| **E5‑S2** | Post‑deployment smoke test | Run a limited set of end‑to‑end queries (extract → classify → visualise) against Production data. | 2 | P1 | E5‑S1 | • All smoke tests pass within SLA.<br>• No data leakage observed. |
| **E5‑S3** | 2‑week hyper‑care support | Triage any critical defects, provide fixes, and capture lessons learned. | 5 | P1 | E5‑S2 | • No critical defects remain after hyper‑care.<br>• Support tickets closed with resolution notes. |
| **E5‑S4** | Project close‑out & archive | Archive code repos, CI artefacts, and all compliance documents; conduct final retrospective with Sponsor. | 2 | P3 | E5‑S3 | • All artefacts stored in VA Configuration Management Database (CMDB).<br>• Executive sign‑off obtained. |

---

### Backlog Summary (by Priority)

| Priority | # Stories | Total SP |
|----------|-----------|----------|
| **P1**   | 13        | 31 |
| **P2**   | 7         | 24 |
| **P3**   | 5         | 9 |
| **Total**| 25        | **64** |

> **Note:**  The backlog is ordered by business value.  During each Sprint the Scrum Team will pull the highest‑priority items that fit the **effective capacity** (see Sprint Planning section).  

---  

## 3. SPRINT PLAN (5 Sprints + Sprint 0)  

| Sprint | Goal (What will be delivered) | Stories (by ID) | Total SP | Capacity (Effective) | Notes |
|--------|------------------------------|-----------------|----------|----------------------|-------|
| **Sprint 0 – Foundations** | Establish CI/CD, repo structure, and baseline environment. | E1‑S1, E1‑S2, E4‑S1 | **8** | 20 (full) | All work integrated into `dev` branch; no production artefacts yet. |
| **Sprint 1 – Clean Data Pipeline** | Raw data extraction, profiling, cleaning, and documentation. | E1‑S3, E1‑S4, E1‑S5 | **8** | 18 (after 10 % risk buffer) | End of Sprint 1: clean table ready for classification. |
| **Sprint 2 – Classification Engine (Rules)** | Business rule capture, rule‑based classification, pipeline automation. | E2‑S1, E2‑S2, E2‑S4 | **10** | 18 | Provides `Classification` column for dashboard. |
| **Sprint 3 – Dashboard & Accessibility** | UI mock‑up, data model, interactive filters, and Section 508 sign‑off. | E3‑S1, E3‑S2, E3‑S3, E4‑S1 | **12** | 18 | Dashboard functional in **Test** environment; compliance artefacts ready. |
| **Sprint 4 – Performance, Security & ATO** | Caching, row‑level security, performance tuning, PIA/ATO submission, ML fallback (if needed). | E3‑S4, E4‑S2, E4‑S3, E4‑S4, E2‑S5 | **15** | 18 | ATO package submitted; dashboard meets performance SLA. |
| **Sprint 5 – Final Release & Hyper‑Care** | Production deployment, end‑user training, validation reports, hyper‑care support. | E5‑S1, E5‑S2, E5‑S3, E3‑S5, E4‑S5, E2‑S5 | **17** | 18 | **Go‑Live** – all Project‑Level DoD criteria satisfied. |

### Sprint Velocity & Buffers  

* **Nominal team velocity** – 20 story points per sprint (based on 5‑person Scrum Team).  
* **Risk/Compliance buffer** – 10 % reduction → **effective capacity ≈ 18 SP** per sprint.  
* **Sprint 5** includes a **2‑week hyper‑care** window; capacity is still counted as a sprint to capture the work within the cadence.  

---  

## 4. RELEASE MILESTONES  

| Milestone | Target Date (working days) | Deliverable |
|-----------|----------------------------|-------------|
| **M1 – Data Pipeline Ready** | End of Sprint 1 (≈ 2 weeks) | `VA.AMBULANCE_CLEAN_2023` populated, ETL validation suite green. |
| **M2 – Classification Live** | End of Sprint 2 (≈ 4 weeks) | `VA.AMBULANCE_CLASSIFIED_2023` with audit log, rule‑based + optional ML model. |
| **M3 – Dashboard Prototype (508‑Approved)** | End of Sprint 3 (≈ 6 weeks) | Power BI workspace with mock‑up & core measures; accessibility sign‑off. |
| **M4 – Security & ATO Package Submitted** | Mid‑Sprint 4 (≈ 7 weeks) | PIA, SSP, and ATO evidence uploaded; InfoSec review scheduled. |
| **M5 – Production Go‑Live** | End of Sprint 5 (≈ 9 weeks) | Dashboard in Production, ATO granted, training completed, hyper‑care period started. |
| **M6 – Project Close‑Out** | +2 weeks after Go‑Live | Final retrospective, defect backlog cleared, all artefacts archived. |

---  

## 5. RESOURCES & ROLES  

| Role | Team Member(s) | Primary Responsibilities |
|------|----------------|---------------------------|
| **Product Owner (PO)** | *Health Economics Lead* – Jane Alvarez | Prioritises backlog, provides business rule sign‑off, accepts deliverables. |
| **Scrum Master** | *Scrum Master* – Michael Chen | Facilitates ceremonies, removes impediments, protects team from scope creep. |
| **Data Engineer** | *Data Engineer* – Priya Patel | Build extracts, staging, cleaning jobs; maintain CI/CD for pipelines. |
| **Data Scientist (Classification)** | *Data Scientist* – Luis Ramirez | Implement rule‑engine, develop optional ML model, validation reporting. |
| **BI Developer** | *BI Lead* – Sarah O’Neill | Build Power BI data model, measures, UI, and enforce row‑level security. |
| **Security/Compliance Analyst** | *InfoSec Lead* – Karen Zhou | Conduct PIA, security scans, coordinate ATO review, ensure Section 508 compliance. |
| **Accessibility Lead** | *UX/508 Specialist* – Tom Reynolds | Review UI mock‑ups, run WCAG tests, sign‑off on accessibility. |
| **VA Infrastructure Engineer** | *Infra Lead* – David Kim | Provide Docker registry, CI/CD pipeline (Azure DevOps), manage Production/Stage environments. |

---  

## 6. SPRINT CALENDAR (2024 Q1)  

| Sprint | Calendar Dates (Mon‑Fri) | Main Focus | Total Story Points | Capacity Used | % of Velocity |
|--------|--------------------------|------------|--------------------|---------------|----------------|
| **Sprint 0** | 19 Feb – 25 Feb | Foundations – repo, CI pipeline, extract job set‑up | 8 | 8 | 40 % (low‑effort sprint to bootstrap) |
| **Sprint 1** | 26 Feb – 11 Mar | Clean Data Pipeline (E1‑S3‑S5) | 8 | 8 | 44 % |
| **Sprint 2** | 12 Mar – 25 Mar | Classification Engine (rules) (E2‑S1‑S4) | 10 | 10 | 56 % |
| **Sprint 3** | 26 Mar – 08 Apr | Dashboard prototype + 508 (E3‑S1‑S3, E4‑S1) | 12 | 12 | 67 % |
| **Sprint 4** | 9 Apr – 22 Apr | Performance, security, ATO (E3‑S4, E4‑S2‑S4, E2‑S5) | 15 | 15 | 83 % |
| **Sprint 5** | 23 Apr – 06 May | Production release, training, hyper‑care (E5‑S1‑S4) | 17 | 17 | 94 % |

> **All dates are tentative** – any external dependencies (e.g., ATO review) will be tracked as **impediments** and escalated by the Scrum Master.  

---  

## 7. RISK LOG (Top 5)  

| ID | Description | Impact | Mitigation |
|----|-------------|--------|------------|
| **R1** | Delay in ATO approval (external review) | High – could block Production deployment | Submit ATO package early (mid‑Sprint 4); maintain close communication with Review Board. |
| **R2** | Unforeseen security vulnerabilities in Docker base image | Medium – could cause compliance failure | Use VA‑approved base images; run automated CIS benchmark scans each build. |
| **R3** | ML model not required (business decides to use only rules) | Low – extra effort wasted | Keep ML as optional; if not needed, drop story E2‑S3. |
| **R4** | Row‑level security mis‑configuration leading to data exposure | High – compliance breach | Include automated security testing (E4‑S3) in pipeline; conduct manual review before Production. |
| **R5** | End‑user training adoption low, leading to misuse | Medium – could generate support tickets | Conduct interactive training webinars and provide quick‑start guides (E3‑S5). |

---  

## 7. CONCLUSION  

The outlined **5‑sprint** roadmap delivers a **production‑ready** data extraction, classification, and visualization solution that satisfies **VA compliance** (Section 508, ATO) and **business value** (accurate classification of 100 K+ incident records).  

The Scrum Team will adhere to the prioritized backlog, maintain a steady **velocity of ~18 SP** per sprint after applying risk buffers, and will coordinate closely with VA security and accessibility authorities to ensure a smooth **Go‑Live** and successful **project close‑out**.  

*Prepared by the Scrum Team – 2024‑01‑15*  

---  

*End of Document*