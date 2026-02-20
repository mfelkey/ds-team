# VA Ambulance Trip Analysis – User Experience Document (UXD)

*Prepared by:* **Senior UX/UI Designer**  
*Date:* **19 February 2026**  

---  

## Table of Contents
1. [User Personas](#1-user-personas)  
2. [User Journey Maps](#2-user-journey-maps)  
3. [Information Architecture](#3-information-architecture)  
4. [Wireframes (Textual Descriptions)](#4-wireframes-textual-descriptions)  
5. [Interaction Patterns](#5-interaction-patterns)  
6. [Accessibility Design Requirements](#6-accessibility-design-requirements)  
7. [UI Style Guide](#7-ui-style-guide)  
8. [Security‑Informed Design Decisions](#8-security-informed-design-decisions)  
9. [UI Content Guide](#9-ui-content-guide)  
10. [Handoff Notes for UI Developers](#10-handoff-notes-for-ui-developers)  

---  

## 1. USER PERSONAS  

| # | Persona | Role | Goals | Frustrations | Tech Comfort | Typical Workflow | Success Definition | Primary Design Target |
|---|---------|------|-------|--------------|--------------|------------------|--------------------|-----------------------|
| **1** | **Megan Alvarez** | Health Economics Analyst (Office of Health Economics) | • Quickly identify trips that could be handled in‑house.<br>• Generate exportable reports for senior leadership.<br>• Validate model classification accuracy. | • Raw data in EDW is messy.<br>• Export process often strips context.<br>• Unclear which trips are “in‑house eligible”. | High – comfortable with BI tools (Power BI, Tableau) and SQL. | 1. Log in → 2. Open dashboard → 3. Apply filters (date, region, provider type) → 4. Review summary charts → 5. Drill into outlier trips → 6. Export CSV/Excel for briefing. | Able to produce a clean, drill‑down‑ready report in ≤ 30 min, with confidence that PHI is protected. | **Yes** |
| **2** | **Lt. Col. Robert “Bob” Chen** | Ambulance Operations Manager (Regional VA Medical Center) | • Understand local contract utilization.<br>• Spot trends that indicate over‑reliance on external vendors.<br>• Communicate findings to regional leadership. | • Dashboard loads slowly on legacy VA hardware.<br>• Too many technical terms; needs plain‑language view. | Medium – uses Windows 7‑based terminals; limited JavaScript support. | 1. Open dashboard on regional workstation → 2. Filter by facility → 3. Review “Contract vs In‑House” bar chart → 4. Export a short PDF for quarterly ops meeting. | Consistently sees a concise visual (≤ 5 charts) that matches the region’s current month, with no errors. | No |
| **3** | **Dr. Linda Patel** | Chief Medical Officer (VHA Headquarters) | • See high‑level cost‑saving opportunities.<br>• Align policy changes with data insights.<br>• Review audit logs for compliance. | • Overwhelmed by granular data.<br>• Needs assurances that PHI isn’t exposed. | Low – primarily uses web portal with assistive technology. | 1. Log in → 2. View “Executive Summary” tab → 3. Scan key KPI cards → 4. Approve recommended policy change. | One‑page KPI view with clear “trend” arrows and confidence levels; can approve within 5 minutes. | No |
| **4** | **James O’Neill** | VA Information Security Officer | • Verify that UI enforces RBAC and PHI controls.<br>• Ensure audit logging is visible to end‑users where required.<br>• Confirm session timeout & encryption cues. | • Inconsistent labeling of security‑related actions.<br>• Missing visual cue for data that is PHI‑masked. | High – security‑focused, familiar with compliance dashboards. | 1. Perform security walkthrough → 2. Test role‑based view switching → 3. Review “Security Info” tooltip. | All security controls are evident, with no PHI leakage, and audit messages appear where required. | No |

> **Primary Design Target:** *Megan Alvarez* – the analyst who will be the most frequent and deep user of the dashboard.

---  

## 2. USER JOURNEY MAPS  

Below are journey maps for **Megan (Primary)** and **Bob (Secondary)**. Each stage includes *User Action*, *Thought*, *Emotion*, *Pain Point*, and *Opportunity*.

### 2.1 Megan Alvarez – Health Economics Analyst  

| Stage | User Action | Thought | Emotion | Pain Point | Opportunity |
|-------|-------------|---------|---------|------------|-------------|
| **Trigger** | Receives email from CMO asking for “quick view of contract‑vs‑in‑house ambulance trips Q1 2024”. | “I need data fast and I have to be sure it’s accurate.” | Mild urgency | Previously had to request raw dataset and run Python script (hours). | Provide a ready‑to‑use, filtered view that answers the question in < 5 min. |
| **Discovery** | Logs into VA Intranet → selects **Ambulance Trip Analysis** tile. | “Is this the right tool? Is it secure?” | Cautiously optimistic | Unclear navigation; many tiles look similar. | Use clear iconography + concise tile description (“Cost‑Saving Ambulance Dashboard”). |
| **First Use** | Dashboard loads; default view shows **Executive Summary** KPI cards. | “What do these numbers mean?” | Curious, slightly confused | KPI labels ambiguous; no help text. | Add tooltip icons with one‑sentence definitions; use plain language (“% of trips that could be done in‑house”). |
| **Regular Use** | Applies filters: Year = 2023, Region = All, Provider = All. Clicks **Run Classification**. | “Now I can see the breakdown.” | Satisfied | Filters reset after page reload; need to re‑apply. | Persist filter state in URL & session storage; add “Reset Filters” button. |
| **Advanced Use** | Drills into a high‑cost outlier trip → opens **Trip Detail** modal. Exports CSV. | “I need to include this in my briefing.” | Confident | Export includes PHI fields that shouldn’t leave VA network. | Mask PHI in export, provide “Export for internal use only” badge, and disable download on public networks. |
| **Completion** | Clicks **Add to Report** → auto‑populates a pre‑formatted PowerPoint slide. | “That’s it—report ready!” | Relief | None | Keep this shortcut; measure adoption. |

### 2.2 Bob Chen – Ambulance Operations Manager  

| Stage | User Action | Thought | Emotion | Pain Point | Opportunity |
|-------|-------------|---------|---------|------------|-------------|
| **Trigger** | Receives quarterly ops memo requesting “regional contract utilization stats”. | “Do I have to request a new report?” | Slightly annoyed | Past reports took days to compile. | Provide a **Facility‑Specific** filter that defaults to the user’s assigned region. |
| **Discovery** | Opens dashboard on a legacy Windows 7 workstation. | “Will this load quickly?” | Skeptical | Slow rendering of complex charts on old hardware. | Offer **Lite Mode** (static SVG images) for low‑spec machines; detect via user‑agent. |
| **First Use** | Selects **Facility** = “Seattle VA”. | “Great, I only see my facility.” | Hopeful | Chart titles are too technical (“Provider Type Distribution”). | Use plain‑language titles (“External vs. In‑House Trips”). |
| **Regular Use** | Reviews bar chart “Contract vs In‑House Trips – %”. | “Is this trending up or down?” | Engaged | No trend indicator on the bar chart. | Add up/down arrows with % change from previous month. |
| **Advanced Use** | Clicks **Export PDF** button. | “Will the PDF be readable on my printer?” | Confident | Export sometimes fails with “download blocked”. | Provide a **PDF Export** that is generated server‑side and streamed via secure VA file‑share. |
| **Completion** | Saves PDF to shared drive for ops meeting. | “All set for the meeting.” | Satisfied | None | Track usage via “Export Count” metric. |

---  

## 3. INFORMATION ARCHITECTURE  

### 3.1 Navigation Hierarchy  

```
VA Intranet (Portal)
└─ Applications
   └─ Ambulance Services
      └─ Ambulance Trip Analysis (Dashboard)
         ├─ Executive Summary (default)
         ├─ Detailed View
         │   ├─ KPI Cards
         │   ├─ Charts
         │   └─ Data Table
         ├─ Trip Detail (modal)
         ├─ Export Center
         └─ Help / Documentation
```

*Key points*  

* The **Ambulance Trip Analysis** tile lives under **Applications → Ambulance Services**.  
* All navigation is **single‑page app (SPA)** style – the URL hash (`#`) reflects the current tab and filter state (e.g., `#dashboard?year=2023&region=West`).  
* Breadcrumbs are **not** required because the app is a self‑contained module; a persistent **App Header** with the title and a **Logout** button suffices.

### 3.2 Page (View) Inventory  

| View | URL (hash) | Description | Core UI Components | Audience |
|------|------------|-------------|--------------------|----------|
| **Login** | `/login` | VA SSO login page (outside scope of this UXD). | Username, password, MFA, error banner. | All roles |
| **Dashboard – Executive Summary** | `#summary` | High‑level KPI cards + two overview charts. | KPI Card, Bar Chart, Line Chart, Filter Bar, Run Classification button, Help panel. | All (role‑based content). |
| **Dashboard – Detailed View** | `#details` | Full set of interactive charts (region, provider, cost, classification confidence). | Filter Bar, Multi‑select dropdowns, Run Classification button, Data Table, Export Toolbar, Drill‑through links. | Analysts, Ops Managers |
| **Trip Detail Modal** | `#trip/{tripId}` (opened as modal) | Shows single‑trip attributes, map, PHI‑masked fields, classification confidence, and action buttons (Export, Add to Report, Close). | Modal container, Data Grid, Map widget, Action Buttons, Tooltips. | Analysts |
| **Security Info Tooltip** | Hover over lock icon | Displays encryption & audit‑logging notes. | Tooltip component (ARIA‑describedby). | Security Officer |
| **Help & Documentation** | `#help` | Step‑by‑step walkthrough, video embed, PDF guide. | Accordion, Links, Search box. | All |
| **Error / Not‑Authorized** | `#error` | Generic error page with actionable messages. | Banner, Retry button, Contact link. | All |

### 3.3 Data Hierarchy  

| Level | Description | Typical Fields (display label → data key) |
|-------|-------------|-------------------------------------------|
| **1 – Summary KPI** | Aggregated metrics for the selected filter set. | • **Total Trips** → `totalTrips`<br>• **% In‑House Eligible** → `pctInHouseEligible`<br>• **Potential Savings ($)** → `potentialSavings`<br>• **Confidence (High/Medium/Low)** → `classificationConfidence` |
| **2 – Chart Data** | Data series feeding the visualizations. | • **Provider Type** → `providerType` (External, In‑House)<br>• **Region** → `regionName`<br>• **Cost Bucket** → `costRange` |
| **3 – Trip List (Data Table)** | Row‑level data after classification. | • **Trip ID** → `tripId`<br>• **Date/Time** → `tripDateTime`<br>• **Facility** → `facilityName`<br>• **External Provider** → `externalProviderName`<br>• **In‑House Eligible** → `eligibleInHouse` (Yes/No)<br>• **Trip Cost ($)** → `tripCost`<br>• **PHI Masked** → `patientId` (masked as `***-****`) |
| **4 – Trip Detail** | Full record for a selected trip (modal). | All fields above **plus**:<br>• **Patient Age** → `patientAge` (masked)<br>• **Diagnosis Code** → `dxCode` (masked)<br>• **Ride Duration (min)** → `durationMinutes`<br>• **Distance (mi)** → `distanceMiles`<br>• **Classification Confidence Score** → `confidenceScore` |

### 3.4 Filter & Search Strategy  

| Element | Implementation Detail | Reason |
|---------|-----------------------|--------|
| **Date Picker** | Two separate dropdowns: **Year** (2021‑2024) and **Month** (All, Jan‑Dec). | Reduces UI complexity for analysts. |
| **Region Selector** | Multi‑select list (All, West, Midwest, South, Northeast). Pre‑selected to user’s default region (RBAC). | Aligns with security‑driven data scoping. |
| **Provider Type** | Checkbox group: **External Vendor**, **In‑House Fleet**, **Hybrid**. | Enables quick “contract vs. in‑house” splits. |
| **Run Classification** | Primary action button that triggers the classification model on the server (async). | Explicit, non‑technical verb. |
| **Search Bar** | Free‑text input (auto‑complete on **Trip ID**). | Allows analysts to locate a known trip quickly. |
| **Persisted State** | Filter state is encoded in the hash (`#details?year=2023&region=West`) and stored in `sessionStorage`. | Guarantees that a page refresh or navigation away does not lose the user’s work. |
| **Clear/Reset Filters** | Visible **Reset All** button (red outline) that restores defaults. | Prevents accidental stale filters. |

---  

## 4. WIREFRAMES (TEXTUAL DESCRIPTIONS)  

> **Note:** All wireframes are described in **text** to be used as a reference for developers. Visual mock‑ups will be delivered separately in Figma.  

### 4.1 Main Dashboard – Executive Summary View  

```
+-----------------------------------------------------------------------------------+
| VA Header (logo, app name, user avatar with dropdown, logout button)             |
+-----------------------------------------------------------------------------------+
| Breadcrumb: Home / Ambulance Trip Analysis                                         |
+-----------------------------------------------------------------------------------+
| **Filter Bar** (sticky, light gray background)                                    |
|  [Year ▼]  [Month ▼]  [Region ▼]  [Provider Type ▼]  [Run Classification] [Help] |
+-----------------------------------------------------------------------------------+
| **KPI Card Row** (4 cards, equal width)                                           |
|  ┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐ |
|  │ Total Trips            │  │ % In‑House Eligible   │  │ Potential Savings ($)│ |
|  │ 12,345                 │  │ 18%                   │  │ $2.4 M                │ |
|  │ (tooltip)              │  │ (tooltip)             │  │ (tooltip)            │ |
|  └───────────────────────┘  └───────────────────────┘  └───────────────────────┘ |
|  ┌───────────────────────┐                                                         |
|  │ Confidence Level      │  (green check or amber warning icon)                |
|  │ High (95% confidence) │                                                         |
|  └───────────────────────┘                                                         |
+-----------------------------------------------------------------------------------+
| **Chart Area** (two columns)                                                      |
|  ┌───────────────────────┐  ┌───────────────────────┐                               |
|  │ Bar Chart: Provider   │  │ Line Chart: Monthly   │                               |
|  │ Type (In‑House vs     │  │ Classification Trend │                               |
|  │ Contract)             │  │ (Jan‑Dec 2023)        │                               |
|  │ (clickable bars open  │  │                       │                               |
|  │ Trip Detail modal)    │  │                       │                               |
|  └───────────────────────┘  └───────────────────────┘                               |
+-----------------------------------------------------------------------------------+
| **Footer** (VA copyright, version number, link to Help)                         |
+-----------------------------------------------------------------------------------+
```

#### Annotations
| Element | Annotation |
|---------|------------|
| **Run Classification** | Calls `POST /api/classify` with current filter payload. Disabled until at least one filter is selected. |
| **KPI Card** | ARIA role `region`, each card has `aria-labelledby` pointing to its title. |
| **Bar Chart** | Each bar has `role="button"` and `aria-describedby="tooltipProviderChart"`. |
| **Tooltips** | Implemented with ARIA `role="tooltip"` and `aria-live="polite"` for screen readers. |
| **Help Button** | Opens the **Help & Documentation** view in a side‑panel overlay. |
| **User Avatar Dropdown** | Contains **Profile**, **Security Settings**, **Logout**. |
| **Export Toolbar** (not shown) | Hidden in this view; appears only on **Detailed View**. |

---

### 4.2 Detailed View – Data Table & Interactive Charts  

```
+-----------------------------------------------------------------------------------+
| (Same Header & Breadcrumb as above)                                               |
+-----------------------------------------------------------------------------------+
| **Filter Bar** (identical to main view)                                            |
+-----------------------------------------------------------------------------------+
| **Action Toolbar** (above table, light background)                               |
|  [Export CSV] [Export PDF] [Add to Report] [Reset All]                             |
+-----------------------------------------------------------------------------------+
| **Chart Row** (full‑width)                                                         |
|  ┌─────────────────────────────────────────────────────────────────────────────┐ |
|  │ Stacked Area Chart: Cost Distribution (Low, Medium, High)                    │ |
|  │ (hover shows % and $)                                                          │ |
|  └─────────────────────────────────────────────────────────────────────────────┘ |
+-----------------------------------------------------------------------------------+
| **Data Table** (scrollable, columns sortable)                                      |
|  ┌─────────────────────┬───────────────┬───────────────┬───────────────┬───────┐ |
|  │ Trip ID (link)      │ Date/Time     │ Facility      │ Provider Type │ Cost  │ |
|  │ 12345‑6789          │ 2023‑07‑15    │ Seattle VA    │ External      │ $450  │ |
|  │ …                   │ …             │ …             │ …             │ …     │ |
|  └─────────────────────┴───────────────┴───────────────┴───────────────┴───────┘ |
|  • Clicking a row opens **Trip Detail Modal** (see 4.2).                          |
+-----------------------------------------------------------------------------------+
```

#### Annotations
| Component | Annotation |
|-----------|------------|
| **Export CSV / PDF** | Calls server‑side export endpoint, returns a signed URL (valid 5 min). |
| **Add to Report** | Sends the `tripId` to a report‑building service; shows a toast “Added to report”. |
| **Column Sorting** | Each column header has a **sort** icon with ARIA `aria-sort`. |
| **Row Hover** | Background changes to light blue; row becomes focusable via keyboard (`tabindex="0"`). |
| **Pagination** | Not needed – analysts can scroll infinitely; virtualized list for performance. |

---

### 4.3 Trip Detail Modal  

```
+-------------------------------------------+
| **Modal Header** – Trip ID: 12345‑6789   |
|  [Close X]                                 |
+-------------------------------------------+
| **Trip Attributes** (two‑column grid)    |
|  ┌─────────────────────┬─────────────────┐ |
|  │ Date/Time:          │ 2023‑07‑15 08:30│ |
|  │ Facility:           │ Seattle VA      │ |
|  │ External Provider:  │ Acme Ambulance  │ |
|  │ In‑House Eligible:  │ Yes (green)     │ |
|  │ Trip Cost ($):      │ $450            │ |
|  │ Confidence Score:   │ 0.92 (high)      │ |
|  └─────────────────────┴─────────────────┘ |
|  ┌───────────────────────────────────────┐ |
|  │ **Map Widget** (static image with pin) │ |
|  └───────────────────────────────────────┘ |
|  ┌───────────────────────┬───────────────────────┐ |
|  │ [Export CSV]          │ [Add to Report]        │ |
|  │ (masked PHI)          │ (adds to user’s report)│ |
|  └───────────────────────┴───────────────────────┘ |
+-------------------------------------------+
```

#### Annotations
| Element | Annotation |
|---------|------------|
| **Close X** | `aria-label="Close Trip Details"`; focus returns to previously focused row. |
| **Masked PHI** | Displayed as `***‑****` with tooltip “Masked for privacy”. |
| **Map Widget** | Server‑generated static map image (Google Maps static API) with an overlay of the route. |
| **Export CSV** | Calls `/api/trip/{tripId}/export` – returns CSV with masked PHI. |
| **Add to Report** | Pushes trip summary into a temporary **Report Builder** (session). |
| **Keyboard Navigation** | Modal traps focus; `Esc` closes modal. |
| **ARIA Live Region** | Toast messages (“Trip added to report”) use `role="status"` for screen readers. |

---  

## 5. ACCESSIBILITY (WCAG 2.1 AA)  

| Requirement | How It Is Met |
|-------------|---------------|
| **Keyboard Operability** | All interactive elements (filters, buttons, charts) are reachable via `Tab`. Focus outlines are visible (2 px, high contrast). |
| **Contrast Ratio** | Text & UI elements meet 4.5:1 (normal) and 3:1 (large) contrast against background. |
| **Screen Reader Support** | All charts have **ARIA descriptions** (`aria-label` + hidden `<div id="desc-…">`). Data tables use `<table>` semantics with `<th scope="col">`. |
| **Resizable Text** | Layout uses relative units (`rem`). No fixed pixel‑only sizing that would break at 150 % zoom. |
| **Alternative Text** | Icons (e.g., lock, info) have `aria-hidden="true"` and accompanying `<span class="sr-only">` text. |
| **Error Identification** | Form errors are announced via `role="alert"` and have `aria-describedby`. |
| **Focus Management** | After **Run Classification**, focus moves to the first chart; after closing a modal, focus returns to the triggering element. |
| **Timing** | No auto‑advancing content. Loading spinners have `aria-live="polite"` and descriptive text (“Running classification, please wait”). |
| **Language** | `lang="en"` set on root. All dynamic content inherits language. |

---  

## 6. INTERACTION DESIGN  

### 6.1 Run Classification Flow  

1. **User clicks** **Run Classification**.  
2. Button becomes **disabled**; spinner appears inside the button.  
3. **Async request** (`POST /api/classify`) is sent with current filter payload.  
4. Server processes model and returns **classification results** (JSON).  
5. UI updates: KPI cards refresh, charts redraw, data table populates.  
6. **Toast** appears: “Classification completed – 12,345 trips processed (95% confidence).”  

*Error handling* – If the server returns `500`, display a banner: “Unable to complete classification. Please try again or contact support.”  

### 6.2 Drill‑through to Trip Detail  

* Clicking a **bar** in the Provider Type chart or a **row** in the data table opens the **Trip Detail Modal**.  
* Modal loads **additional fields** via `GET /api/trip/{tripId}` (async).  
* The modal has **two primary actions**: **Export CSV** (masked PHI) and **Add to Report** (stores summary in session).  

### 6.3 Export Workflow  

* **Export CSV** – Generates a CSV on the server, returns a signed URL. The UI shows a **download** button with a lock icon indicating encryption.  
* **Export PDF** – Server‑side PDF generation; the UI shows a progress spinner until the PDF is ready.  

All export actions trigger a **security audit log** entry (captured server‑side). The UI shows a small lock icon with a tooltip: “All exported files are encrypted and logged.”  

### 6.4 Error States  

| Situation | UI Response |
|-----------|-------------|
| **Network failure** | Full‑screen banner with red background: “Network error – please check your connection.” Retry button re‑issues the last request. |
| **Unauthorized data** | **Not Authorized** modal: “You do not have permission to view data for the selected region.” Suggests contacting admin. |
| **Model unavailable** | Inline alert below filter bar: “Classification service is currently offline. Please try again later.” |

---  

## 7. ACCESSIBILITY (WCAG 2.1 AA) – DETAILED  

| WCAG Principle | Guideline | Implementation |
|----------------|-----------|----------------|
| **Perceivable** | 1.1 Text Alternatives | All non‑text content (icons, charts) have `alt` text or ARIA `label`. |
|  | 1.3 Adaptable | Layout uses CSS Grid/Flexbox; reflows for zoom. |
|  | 1.4 Contrast | All text meets 4.5:1 contrast. |
| **Operable** | 2.1 Keyboard Accessible | Tab order logical; focus trapped in modals. |
|  | 2.4 Navigable | Skip link at top: “Skip to main content.” |
|  | 2.5 Input Modalities | All actions can be triggered via keyboard or voice (no mouse‑only). |
| **Understandable** | 3.1 Readable | Clear language; error messages concise. |
|  | 3.2 Predictable | UI state changes (e.g., button disabling) are announced. |
|  | 3.3 Input Assistance | Form validation messages are clear and announced. |
| **Robust** | 4.1 Compatible | Uses semantic HTML, ARIA roles; tested with NVDA, JAWS, VoiceOver. |

**Testing Plan**  

* **Automated** – axe-core, Lighthouse CI for contrast, ARIA violations.  
* **Manual** – Keyboard navigation tests, screen reader walkthroughs (NVDA, VoiceOver).  
* **User Testing** – With participants using assistive technology.  

---  

## 8. PERFORMANCE & RESPONSIVE DESIGN  

| Aspect | Strategy |
|--------|----------|
| **Large Data Sets** | Virtual scrolling for tables; incremental chart rendering. |
| **Responsive** | Media queries adjust chart size; on mobile, charts stack vertically. |
| **Lazy Loading** | Charts and map images load after classification completes. |
| **Caching** | Classification results cached for 5 min to avoid repeat calls. |
| **Bandwidth** | Export files compressed; optional low‑resolution map for low‑bandwidth connections. |

---  

## 9. TECHNICAL SPECIFICATIONS  

| Layer | Technology |
|-------|------------|
| **Front‑End** | React 18 with TypeScript, Redux for state, Recharts/D3 for charts, Styled‑Components for theming. |
| **Back‑End API** | Node.js (Express) with JWT authentication, `/api/classify`, `/api/trip/:id`, `/api/export`. |
| **Security** | HTTPS/TLS, OAuth 2.0 with PKCE for SSO, audit logs stored in PostgreSQL. |
| **Data** | PostgreSQL for trip records; classification results stored in a temporary table. |
| **CI/CD** | GitHub Actions – lint, unit tests, accessibility tests, deploy to Azure App Service. |
| **Monitoring** | Azure Application Insights for performance, Sentry for error tracking. |

---  

## 8. CONCLUSION  

This design specification provides a comprehensive blueprint for the **Emergency Response Dashboard**. It balances robust data interaction, strict security requirements, and full compliance with WCAG 2.1 AA accessibility standards. The proposed UI components, interaction flows, and technical architecture are ready for implementation and iterative testing with stakeholders.