# VA Ambulance Trip Analysis – UI Content Guide  

*Version 1.0 – 19 February 2026*  

This guide is the single source of truth for every word the user sees in the **VA Ambulance Trip Analysis** dashboard. All copy follows VA Plain Language guidelines, Section 508 accessibility requirements, and the style rules listed in Section 12.

---  

## 1. FIELD LABELS  

| Field (Data Model) | UI Label Text | Notes |
|--------------------|--------------|-------|
| trip_id | Trip ID | Unique identifier; not PHI. |
| trip_date | Trip Date | Format MM/DD/YYYY. |
| trip_time | Trip Time | 24‑hour format HH:MM. |
| origin_facility | Origin Facility | VA facility name. |
| destination_facility | Destination Facility | VA facility name. |
| provider_name | Provider | Full provider name (non‑PHI). |
| provider_type | Provider Type | Dropdown: **In‑House**, **Contracted**. |
| contract_type | Contract Type | Text, e.g., “Fee‑for‑service”, “Capitated”. |
| trip_cost | Trip Cost | USD, two decimals, $#,###.##. |
| patient_age | Age | Displayed as **Age**; value masked if PHI restrictions apply. |
| patient_gender | Gender | Displayed as **Gender**; value masked if PHI restrictions apply. |
| diagnosis_code | Diagnosis Code | ICD‑10 code; masked for users without PHI clearance. |
| in_house_eligible | In‑House Eligible | Yes / No toggle. |
| distance_miles | Distance (mi) | One decimal place. |
| elapsed_minutes | Elapsed Time (min) | Whole minutes. |
| cost_savings | Estimated Savings | USD, two decimals, shown only for eligible trips. |
| audit_timestamp | Audit Timestamp | MM/DD/YYYY HH:MM UTC. |
| audit_user | Audited By | User ID; displayed only to security‑role users. |

---

## 2. BUTTON & ACTION TEXT  

| Component / Location | Button Text | Tooltip (Hover) | Notes |
|----------------------|------------|-----------------|-------|
| Filter panel – top | **Apply Filters** | Apply the selected filter criteria. | Primary action. |
| Filter panel – top | **Clear Filters** | Remove all filter selections. | Secondary action. |
| Data table – toolbar | **Export CSV** | Download the current view as a CSV file (max 10,000 rows). | Triggers confirmation dialog. |
| Data table – toolbar | **Export PDF** | Download a PDF report of the current view. | Triggers confirmation dialog. |
| Data table – each row | **View Details** | Open the trip‑detail pane for this record. | Inline link style. |
| KPI card – “In‑House Eligible” | **See Trips** | Show all trips marked eligible for in‑house care. | Opens filtered view. |
| Page header – right | **Refresh Data** | Reload the latest data from the Enterprise Data Warehouse. | Shows loading spinner. |
| Settings modal – bottom | **Save Settings** | Save your display preferences. | Primary. |
| Settings modal – bottom | **Cancel** | Discard changes and close this window. | Secondary. |
| Help panel – top | **Close** | Hide the help overlay. | Primary. |
| Session timeout banner | **Extend Session** | Keep working without logging out. | Extends session by 15 min. |
| Session timeout banner | **Log Out** | End this session now. | Returns to sign‑in page. |
| Security notice – PHI mask | **Learn More** | Read why some fields are masked. | Opens tooltip. |
| Navigation – breadcrumb | **Home** | Return to the dashboard landing page. | Link. |
| Navigation – breadcrumb | **Executive Summary** | View high‑level KPIs. | Link. |
| Navigation – breadcrumb | **Detailed View** | Explore trip‑level data. | Link. |
| Sign‑out menu | **Sign Out** | End your VA session. | Prompts timeout confirmation. |

---

## 3. NAVIGATION & PAGE TITLES  

| UI Element | Text | Notes |
|------------|------|-------|
| Browser title (Home) | VA Ambulance Trip Analysis – Executive Summary | Appears in browser tab. |
| Browser title (Detailed) | VA Ambulance Trip Analysis – Detailed Trip View |
| Top navigation bar – logo link | **VA Ambulance Trip Analysis** | Returns to home page. |
| Main tabs | **Executive Summary** | First tab, high‑level KPIs. |
| Main tabs | **Detailed View** | Second tab, table & charts. |
| Main tabs | **Settings** | User preferences & security options. |
| Breadcrumb (Detailed) | Home / Detailed View |
| Section header (Filters) | **Filter Trips** |
| Section header (KPI cards) | **Key Performance Indicators** |
| Section header (Charts) | **Trip Cost & Utilization** |
| Section header (Table) | **Trip List** |
| Footer link | **Help & Documentation** |
| Footer link | **Privacy & Security** |
| Modal title (Export Confirmation) | **Confirm Export** |
| Modal title (Settings) | **User Settings** |
| Banner (Session Timeout) | **Your session will end in 2 minutes** |
| Banner (PHI Mask) | **PHI data is masked for your role** |
| Tooltip trigger (PHI) | **Why is this hidden?** |

---

## 4. TOOLTIPS  

| Element | Trigger | Tooltip Text (≤ 2 sentences) |
|---------|---------|------------------------------|
| Filter – Date Range | Hover or focus | Select a start and end date to limit trips to that period. |
| Filter – Provider Type | Hover or focus | Choose **In‑House** to see VA‑staffed trips or **Contracted** for external providers. |
| KPI Card – Total Trips | Hover or focus | Total number of ambulance trips recorded in the selected date range. |
| KPI Card – In‑House Eligible % | Hover or focus | Percentage of trips that meet criteria for VA‑staffed transport. |
| KPI Card – Estimated Savings | Hover or focus | Projected cost savings if eligible trips were handled in‑house. |
| Table column – Diagnosis Code | Hover or focus | ICD‑10 code for the medical reason of transport. (Masked for non‑PHI users.) |
| Export CSV button | Hover or focus | Generates a comma‑separated file of the current view (max 10 k rows). |
| Export PDF button | Hover or focus | Generates a printable PDF of the current view. |
| Refresh Data button | Hover or focus | Pulls the latest data from the data warehouse; may take a few seconds. |
| PHI mask icon | Hover or focus | This field contains protected health information and is hidden for your role. |
| Session timeout banner – Extend Session | Hover or focus | Click to keep working without logging out. |
| Session timeout banner – Log Out | Hover or focus | End your session now and return to the sign‑in screen. |
| Settings – Theme selector | Hover or focus | Choose Light or Dark mode for the dashboard background. |
| Help panel – “Learn how to filter” | Click | Opens a short video that demonstrates filter usage. |

*All tooltips are announced by screen‑reader software when the element receives keyboard focus.*

---

## 5. ERROR MESSAGES  

| Condition | Message Text | Guidance |
|-----------|--------------|----------|
| Data fetch failure (EDW) | **Unable to retrieve trip data.** Please try again later or contact your data‑warehouse administrator. |
| Export CSV exceeds row limit | **Export limit exceeded.** Reduce the number of rows by narrowing your filters or request a larger export from IT. |
| Export PDF generation error | **PDF report could not be created.** Try again or contact support. |
| Invalid date range (end < start) | **Invalid date range.** The end date must be the same as or later than the start date. |
| No results for filter | **No trips match your filter criteria.** Adjust one or more filters and try again. |
| Network timeout while refreshing | **Data refresh timed out.** Check your connection and try again. |
| Unauthorized access to PHI field | **You do not have permission to view protected health information.** |
| CSV file creation failure (server) | **Export failed.** An internal error prevented the CSV from being created. |
| PDF file creation failure (server) | **Export failed.** An internal error prevented the PDF from being created. |
| Session already expired (user action) | **Your session has ended.** You must sign in again to continue. |
| Saved settings conflict | **Unable to save settings.** Another session updated your preferences; reload and try again. |

*All error messages use sentence case, active voice, and are concise (≤ 15 words).*

---

## 5. EMPTY STATE MESSAGES  

| Context | Message Text | When Shown |
|---------|--------------|------------|
| Detailed view – table has no rows after filter | **No trips match your filter criteria.** Try broadening the date range or clearing a filter. |
| Detailed view – selected period contains no data | **No trip data is available for the selected dates.** Choose a different date range. |
| First‑time user (home page) | **Welcome to the VA Ambulance Trip Analysis dashboard.** Use the filter panel on the left to start exploring trip data. |
| After sign‑in with no data in system | **There are currently no ambulance‑trip records in the system.** Check back later or contact your data‑warehouse lead. |
| Export confirmation – user cancels | **Export cancelled.** No file was created. |
| Session timeout – user does not extend | **Your session has ended.** You will be returned to the sign‑in page. |
| PHI‑masked column when no permission | **Data hidden for privacy.** Contact your security officer for additional access. |

---

## 6. CONFIRMATION DIALOGS  

| Dialog Trigger | Title | Message Body | Primary Button | Secondary Button |
|----------------|-------|--------------|----------------|------------------|
| Export CSV | **Confirm Export** | You are about to export **{rowCount}** rows as a CSV file. The file will contain de‑identified data. Proceed? | **Export** (confirms) | **Cancel** |
| Export PDF | **Confirm Export** | You are about to export a PDF report of the current view. The file will be de‑identified. Proceed? | **Export** | **Cancel** |
| Sign Out (menu) | **Confirm Sign Out** | You are about to end your session. Any unsaved changes will be lost. Continue? | **Log Out** | **Cancel** |
| Reset Settings (Settings modal) | **Reset to Defaults** | All custom settings will be removed and default values restored. Continue? | **Reset** | **Cancel** |
| Session Timeout – Log Out | **End Session** | You are about to log out immediately. Unsaved work will be lost. | **Log Out** | **Cancel** |
| Delete Saved Filter (future feature) | **Delete Saved Filter** | This saved filter will be permanently removed. Continue? | **Delete** | **Cancel** |

*All dialogs are focus‑trapped; the primary button receives initial focus.*

---

## 7. SUCCESS NOTIFICATIONS  

| Action | Notification Text | Placement | Auto‑Dismiss |
|--------|-------------------|-----------|--------------|
| CSV export completed | **Your CSV file is ready to download.** Click the link below to save it. | Top‑right toast | 7 seconds |
| PDF export completed | **Your PDF report is ready to download.** Click the link below to save it. |
| Filters applied | **Filters applied.** Showing results for the selected criteria. |
| Filters cleared | **All filters cleared.** Displaying full data set. |
| Settings saved | **Your preferences have been saved.** |
| Theme changed | **Theme updated to {Light/Dark}.** |
| Session extended | **Your session has been extended by 15 minutes.** |
| Data refreshed | **Dashboard data refreshed.** Latest records are now displayed. |
| Audit log view opened (security role) | **Audit log loaded.** You are viewing changes made by users with PHI access. |
| Help panel opened | **Help overlay opened.** Use the navigation on the left to explore topics. |

*All notifications use sentence case and appear in a toast that is announced by screen readers.*

---

## 8. HELP & ONBOARDING TEXT  

| UI Context | Help Text |
|-----------|-----------|
| Home page – welcome banner | **Welcome to the VA Ambulance Trip Analysis dashboard.** Use the filter panel on the left to narrow results, then explore the KPI cards, charts, and trip list. |
| Filter panel – instruction | **Select any combination of filters to refine the trip list.** All filters are optional; leaving a filter blank includes all values. |
| KPI card – “Estimated Savings” | **Estimated Savings** shows the projected cost reduction if every eligible trip were handled by VA staff. |
| Chart – “Trip Cost Over Time” | **Hover over a data point to see the exact cost for that month.** |
| Table – column sorting | **Click a column header to sort ascending or descending.** |
| Table – pagination | **Use the arrows at the bottom to move through pages of results.** |
| Export buttons – note | **Exports are limited to 10,000 rows and contain de‑identified data.** |
| Settings modal – description | **Customize your dashboard appearance and default filter preferences.** Changes take effect after you click **Save Settings**. |
| PHI mask icon – description | **Protected health information (PHI) is hidden for users without PHI clearance.** Click **Learn More** for details. |
| Session timeout banner – description | **Your session will end automatically after 15 minutes of inactivity.** Extend it now or sign out safely. |
| Help panel – navigation | **Use the left‑hand menu to move between Executive Summary, Detailed View, and Settings.** |
| Help panel – “How to filter” link | **Watch a 2‑minute video that demonstrates how to filter trips by date, provider, and eligibility.** |
| Privacy & Security link | **Read the VA Privacy Act Statement and data‑masking policies.** |

---

## 9. LOADING STATES  

| Component | Loading Text | ARIA Live Region |
|-----------|--------------|------------------|
| Whole dashboard (initial load) | **Loading dashboard…** | `polite` |
| KPI cards (individual) | **Loading KPI…** | `polite` |
| Cost‑trend chart | **Loading cost chart…** | `polite` |
| Utilization chart | **Loading utilization chart…** | `polite` |
| Trip table (page change) | **Loading trips…** | `polite` |
| Export confirmation (after user clicks **Export**) | **Generating file…** | `assertive` (replaced by success/failure message) |
| Refresh Data button | **Refreshing data…** | `polite` |
| Settings modal – saving | **Saving preferences…** | `polite` |

*Each loading element displays a spinner icon and the text above; the spinner receives `role="status"` and `aria-live="polite"`.*

---

## 10. SECURITY & COMPLIANCE NOTICES  

| Location | Notice Text | Interaction |
|----------|-------------|-------------|
| Table header – masked columns (Age, Gender, Diagnosis) | **PHI data is masked for your role.** | Hover/focus reveals tooltip “Why is this hidden?”. |
| Export CSV / PDF buttons | **Export limited to 10,000 rows and de‑identified data only.** | Inline under button (smaller font, gray). |
| Audit Log view (Security role) | **Audit records show who accessed PHI and when.** | Visible only to users with the **Security** role. |
| Session timeout banner | **Your session will end in 2 minutes due to inactivity.** | Buttons **Extend Session** / **Log Out** (see Section 2). |
| PHI mask icon (in table) | **Protected Health Information (PHI) is hidden.** | Click **Learn More** to open a tooltip with a short explanation. |
| Footer – Privacy link | **Your activity is logged in accordance with VA policy.** |
| Export confirmation dialog – warning | **Exports contain de‑identified data; no personal identifiers are included.** |
| Settings – “Show PHI” toggle (available only to Security role) | **Display full PHI** | Enable to view unmasked patient fields; requires additional clearance. |
| Home page – if no data | **Data is sourced from the VA Enterprise Data Warehouse and refreshed nightly.** |

*All security notices are written in plain language and meet the VA’s Accessibility Standards.*

---

## 11. ACCESSIBILITY (WCAG 2.1 AA) IMPLEMENTATION  

| Requirement | Implementation Detail |
|-------------|-----------------------|
| Keyboard navigation | All interactive elements (filters, buttons, table rows, pagination) are reachable via `Tab` and actionable via `Enter`/`Space`. |
| Focus indicator | Visible focus ring (`outline: 2px solid #005ea2`) on all focusable elements. |
| Color contrast | Text and UI elements meet a minimum contrast ratio of **4.5:1** (AA) and **7:1** for large text. |
| ARIA roles & properties | - Buttons have `role="button"`.<br>- Loading spinners use `role="status"`.<br>- Toast notifications use `aria-live="assertive"`.<br>- Dialogs are labelled with `aria-labelledby` and `aria-describedby`. |
| Screen reader support | All messages (errors, empty states, loading, success) are announced via appropriate ARIA live regions. |
| Responsive design | Dashboard adapts to various screen sizes; filter panel collapses into a drawer on small screens with a toggle button labeled **Open Filters**. |
| Skip navigation link | **Skip to main content** link at top of page, visible on focus. |
| Form labels | All filter inputs have associated `<label>` elements. |
| Keyboard shortcuts (future) | **Alt+F** to focus filter panel; **Alt+S** to open settings. (Planned, not yet implemented.) |

---

## 12. STYLE GUIDE (VA BRANDING)  

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Body text | **Source Sans Pro** | 14 px | Regular | #212121 |
| Headings (H1‑H3) | Source Sans Pro | 24 px (H1), 20 px (H2), 18 px (H3) | Bold | #0B0C0C |
| Buttons (primary) | Source Sans Pro | 14 px | Semi‑Bold | White text on #005EA2 background |
| Buttons (secondary) | Source Sans Pro | 14 px | Semi‑Bold | #005EA2 text on #E1E1E1 background |
| Toast notifications | Source Sans Pro | 14 px | Regular | White text on #323232 background |
| Links | Source Sans Pro | 14 px | Regular | #005EA2 (underline on hover) |
| Error text | Source Sans Pro | 14 px | Regular | #D8000C |
| Tooltip text | Source Sans Pro | 13 px | Regular | White on #333333 background |
| Disabled state | **Opacity 0.5**; cursor: not‑allowed. |

*All UI components follow the VA’s Visual Identity System (VIS) guidelines, including the use of the VA seal where appropriate.*

---

## 13. INTERNATIONALIZATION (i18n) CONSIDERATIONS  

- All user‑visible strings are stored in resource files (`.json` or `.resx`) to enable translation.  
- Dates are displayed in **MM/DD/YYYY** format for U.S. users; locale‑specific formats will be applied when the application is deployed internationally.  
- Numbers (e.g., row counts, costs) use the locale’s thousands separator and decimal point.  
- Right‑to‑left language support (Arabic, Hebrew) is planned; UI layout will mirror when `dir="rtl"` is detected.  
- All messages are limited to 140 characters to accommodate translation length variations.  

*The application will use a language selector in the header for future multilingual support.*

---

## 14. PERFORMANCE OPTIMIZATIONS  

| Feature | Technique |
|---------|------------|
| Large data sets (trip list) | Server‑side pagination (20 rows per page) with lazy loading of additional pages. |
| Chart rendering | Use **Chart.js** with data pre‑aggregated on the server to reduce client processing. |
| Export generation | Asynchronous background job; UI shows “Generating file…” and polls for completion. |
| Asset loading | Bundle and minify CSS/JS; use HTTP/2 server push for critical assets. |
| Caching | Browser cache static assets (CSS, images) for 30 days. |
| API calls | Debounce filter input changes (300 ms) before sending request. |
| Accessibility | Pre‑compute ARIA attributes server‑side to avoid extra client processing. |

---

## 15. TESTING & VALIDATION  

| Test Type | Scope |
|-----------|-------|
| Unit tests | UI component rendering, state transitions, and utility functions (e.g., row‑limit calculation). |
| Integration tests | End‑to‑end flow: sign‑in → filter → view KPI → export CSV → sign‑out. |
| Accessibility audit | Use **axe-core** and **NVDA** to verify compliance with WCAG 2.1 AA. |
| Security testing | Role‑based access control verification for PHI fields and audit logs. |
| Performance testing | Load testing with 10,000+ rows to ensure UI remains responsive (< 2 seconds for pagination). |
| Cross‑browser testing | Chrome, Edge, Firefox, Safari (latest two versions). |
| Responsive testing | Desktop, tablet, and mobile viewports. |
| Internationalization testing | Verify language switch and RTL layout. |

---

### End of Document

*All text follows VA’s style, accessibility, and security guidelines, ensuring a consistent and compliant user experience for the VA Ambulance Trip Analysis dashboard.*