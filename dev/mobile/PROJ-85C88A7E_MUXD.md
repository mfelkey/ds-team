# Mobile UX Document (MUXD)  
**Project:** VA Ambulance Trip Analysis – Mobile Dashboard  
**Version:** 1.0 – 20 Feb 2026  
**Owner:** Senior Mobile UI/UX Designer  

> This document is the single source of truth for **iOS native**, **Android native**, and **React‑Native** implementations. All designers, developers, QA, and product stakeholders must reference it when building, testing, or maintaining the mobile app.

---

## 1. MOBILE PRODUCT OVERVIEW  

| Item | Detail |
|------|--------|
| **Core Goal** | Provide secure, performant, and accessible self‑service access to the VA Ambulance Trip Analysis dashboard for senior administrators & analysts. |
| **Primary User Journeys** | 1️⃣ **Authentication** – Biometric (Face ID / Touch ID / Android BiometricPrompt) → optional passcode fallback. <br>2️⃣ **Dashboard Overview** – View high‑level KPIs (total trips, in‑house % , cost). <br>3️⃣ **Filter & Drill‑Down** – Choose month, trip type, region; see updated charts. <br>4️⃣ **Trip List** – Paginated list of trips matching filters; pull‑to‑refresh, infinite scroll. <br>5️⃣ **Trip Detail** – View PHI‑sensitive fields (patient ID, provider, cost) with masking & “show” toggle. <br>6️⃣ **Settings** – Change biometric preference, logout, privacy policy. |
| **Target Devices & OS Versions** | |
| **iOS** | • Minimum: **iOS 14.0** (covers iPhone 6S+ & iPad 5th gen). <br>• Target: **iOS 17** (latest at release). <br>• Supported sizes: 5.4” – 6.7” iPhone, 7.9” – 12.9” iPad (all orientations). |
| **Android** | • Minimum API **24** (Android 7.0 Nougat). <br>• Target API **34** (Android 14). <br>• Supported screen sizes: Small (320 dp width) → XXX‑large (960 dp width). <br>• Densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi. |
| **React‑Native** | • iOS ≥ 14, Android ≥ 24 – same as native tracks. <br>• Uses **Expo SDK 51** (or bare RN 0.74) – ensures parity across platforms. |
| **Offline Capability** | • **Read‑only cache** of the most recent filtered view (last successful API response) for up to **24 h**. <br>• No data modification offline – all actions (e.g., re‑run classification) require connectivity. <br>• Cache encrypted with **AES‑256**; cleared on logout or session expiry. |
| **Performance Expectations** | • **Cold launch** ≤ 1.5 s (iOS) / ≤ 2.0 s (Android). <br>• **Warm launch** ≤ 0.8 s. <br>• **Screen transition** ≤ 300 ms (75 % of frames at 60 fps). <br>• **Scroll / list** 60 fps, no jank. <br>• **API latency** ≤ 1.2 s (server‑side < 2 s, client shows skeleton). |

---

## 2. INFORMATION ARCHITECTURE  

### 2.1 Complete Screen Inventory  

| # | Screen (Native Name) | Purpose | PHI? |
|---|----------------------|---------|------|
| 1 | **Launch / Splash** | Brand logo, init loading | No |
| 2 | **Login** | Username + password, biometric enrollment | No |
| 3 | **Biometric Prompt** | Re‑auth for PHI screens | No |
| 4 | **Dashboard** | KPI cards, line/bar charts, filter button | No |
| 5 | **Filter Modal** | Select month, trip type, region | No |
| 6 | **Trip List** | Paginated table of trips (date, provider, distance) | No |
| 7 | **Trip Detail** | Full trip record, cost, patient ID (masked) | **Yes** |
| 8 | **Settings** | Change auth, privacy, logout | No |
| 9 | **Error / Empty State** | Global network error, no data | No |
| 10| **About / Legal** | Version, VA disclaimer | No |

> *All screens are reachable within **≤ 2 taps** from the Dashboard (except Settings → Logout).*

### 2.2 Navigation Hierarchy  

```
App
 ├─ Splash (modal)
 ├─ Auth Flow
 │   ├─ Login
 │   └─ Biometric Prompt (on-demand)
 └─ Main Flow (tab‑based iOS, bottom‑nav Android)
     ├─ Dashboard (default)
     │   ├─ Filter Modal (overlays)
     │   └─ Trip List → Trip Detail (push)
     ├─ Settings
     └─ About
```

*Secondary flows (Error, Empty) appear as full‑screen modals over the current stack.*

### 2.3 Deep Link Structure  

| Scheme | Example | Destination |
|--------|---------|-------------|
| `vaambulance://login` | `vaambulance://login` | Login screen (clears session) |
| `vaambulance://dashboard` | `vaambulance://dashboard?month=2023-05` | Dashboard with pre‑selected month |
| `vaambulance://trip/12345` | `vaambulance://trip/98765` | Trip Detail (triggers biometric if needed) |
| `vaambulance://settings` | `vaambulance://settings` | Settings screen |

*All deep links must validate auth state; unauthenticated users are redirected to Login.*

### 2.4 iOS‑Specific Navigation  

| Component | Details |
|-----------|---------|
| **Tab Bar** | 3 tabs: Dashboard, Settings, About. Uses `UITabBarController`. |
| **Navigation Stack** | `UINavigationController` per tab. Pushes from Dashboard → Trip List → Trip Detail. |
| **Modal Presentation** | Filter uses `UIModalPresentationPageSheet` (iPad) or `UIModalPresentationAutomatic` (iPhone). |
| **Swipe‑Back** | Enabled on all push screens (except root tabs). |

### 2.5 Android‑Specific Navigation  

| Component | Details |
|-----------|---------|
| **Bottom Navigation** | 3 items: Dashboard, Settings, About. Implemented via `BottomNavigationView` with `NavHostFragment`. |
| **Back Stack** | `NavController` handles up/back. System back button pops stack; reaching root Dashboard shows “Press back again to exit” toast. |
| **Modal / Bottom Sheet** | Filter implemented as `ModalBottomSheetDialogFragment`. |
| **Edge‑to‑Edge** | Uses `WindowInsetsController` for system bars. |

### 2.6 React‑Native Shared Navigation  

| Library | Configuration |
|---------|----------------|
| **React Navigation v6** | - `createBottomTabNavigator` for primary tabs (iOS & Android). <br>- Each tab contains a `createNativeStackNavigator`. <br>- `Modal` screens (Filter, Error) are declared with `presentation: 'modal'`. |
| **Deep Linking** | `linking` object maps the same URL scheme as native (see §2.3). |
| **Platform.OS Conditionals** | `if (Platform.OS === 'ios')` → use `headerBackTitleVisible: false` (swipe back). <br>`if (Platform.OS === 'android')` → `headerShown: true` (hamburger not needed). |

---

## 3. DESIGN SYSTEM  

> All tokens are defined in **design‑tokens.json** (iOS `*.xcassets`, Android `colors.xml` / `dimens.xml`, RN `theme.ts`).  

### 3.1 Color Palette  

| Token | iOS (Hex) | Android (Hex) | Description |
|-------|----------|---------------|-------------|
| **Primary** | `#003366` | `#003366` | VA “navy” – used for app bar, tab bar, active icons. |
| **Secondary** | `#0055A4` | `#0055A4` | Accent for CTA buttons, filter chip. |
| **Background** | `#F5F5F5` | `#F5F5F5` | Main surface. |
| **Surface** | `#FFFFFF` | `#FFFFFF` | Card / modal background. |
| **Error** | `#D92B2B` | `#D92B2B` | Network / API errors. |
| **Success** | `#107C10` | `#107C10` | Positive KPI trend. |
| **Disabled** | `#C6C6C6` | `#C6C6C6` | Disabled controls. |
| **High‑Contrast Text** | `#000000` | `#000000` | Ensures AA compliance. |
| **Overlay (Reduced Motion)** | `rgba(0,0,0,0.4)` | `rgba(0,0,0,0.4)` | Dim background for blur. |

### 3.2 Typography  

| Token | iOS Font | Android Font | RN Font Family | Size (sp / pt) | Weight |
|-------|----------|--------------|----------------|----------------|--------|
| **Header‑XL** | `SF Pro Display` | `Roboto` | `System` | 24pt / 24sp | Bold 700 |
| **Header‑L** | `SF Pro Text` | `Roboto` | `System` | 20pt / 20sp | Semi‑Bold 600 |
| **Body‑M** | `SF Pro Text` | `Roboto` | `System` | 16pt / 16sp | Regular 400 |
| **Caption** | `SF Pro Text` | `Roboto` | `System` | 12pt / 12sp | Regular 400 |
| **Button** | `SF Pro Display` | `Roboto` | `System` | 16pt / 16sp | Medium 500 |

*All text respects Dynamic Type (iOS) & Font Scaling (Android) – user can increase up to **200 %**.*

### 3.3 Spacing & Layout  

| Token | Value |
|-------|-------|
| **spacing‑xs** | 4 dp |
| **spacing‑s** | 8 dp |
| **spacing‑m** | 16 dp |
| **spacing‑l** | 24 dp |
| **spacing‑xl** | 32 dp |
| **list‑row‑height** | 56 dp (iOS) / 64 dp (Android) |

### 3.4 Iconography  

| Icon | Meaning | Source |
|------|---------|--------|
| Dashboard | `chart.bar` | SF Symbols / Material Icons |
| Settings | `gearshape` / `settings` | Same |
| About | `info.circle` / `info` | Same |
| Filter | `line.horizontal.3.decrease.circle` / `filter_list` | Same |
| Show/Hide (PHI) | `eye` / `visibility` | Same |
| Logout | `arrow.backward.square` / `logout` | Same |

All icons are **outlined** (iOS) or **filled** (Android) to match platform conventions. In RN they are rendered via `@expo/vector-icons`.

### 3.5 Elevation & Shadows  

| Level | iOS (`shadow*`) | Android (`elevation`) |
|-------|----------------|-----------------------|
| **Surface** | `shadowColor: #000` <br>`shadowOffset: {width:0, height:1}` <br>`shadowOpacity: 0.1` <br>`shadowRadius: 2` | `elevation: 1` |
| **Card / Modal** | `shadowOpacity: 0.2` <br>`shadowRadius: 4` | `elevation: 4` |
| **Reduced Motion** | All shadows remain; only translation/scale animations are removed. |

### 3.6 Motion & Timing  

| Token | iOS (seconds) | Android (seconds) | RN (ms) |
|-------|---------------|-------------------|---------|
| **Screen‑Enter** | 0.25 | 0.30 | 250 |
| **List‑Item‑Appear (Skeleton)** | 0.3 | 0.3 | 300 |
| **Chart‑Update** | 0.35 | 0.35 | 350 |
| **Reduced‑Motion Alternative** | Fade‑in only (0.2 s) | Same | Same |

---

## 4. ACCESSIBILITY DESIGN  

| Requirement | Implementation |
|-------------|----------------|
| **VoiceOver / TalkBack** | All interactive elements have clear `accessibilityLabel` (e.g., “Filter – May 2023”).  |
| **Dynamic Type / Font Scaling** | Text containers use `adjustsFontForContentSizeCategory` (iOS) / `android:autoSizeTextType="uniform"` (Android). Tested at **200 %** scaling. |
| **Contrast Ratio** | Minimum **4.5:1** for normal text, **3:1** for large text. Uses primary (`#003366`) on white surface (4.9:1). |
| **Reduced Motion** | Detect `UIAccessibility.isReduceMotionEnabled` (iOS) / `prefersReducedMotion` (Android) → replace slide animations with fade. RN uses `useReducedMotion` hook. |
| **Screen Reader Order** | Logical order: Header → Content → Action Buttons. `accessibilityTraversalOrder` set where needed. |
| **Touch Target** | Minimum **44 × 44 pt** (iOS) / **48 dp** (Android). All tappable icons respect this. |
| **Testing** | Use **VoiceOver** (iOS) & **TalkBack** (Android) + **axe‑android** / **accessibility‑engine** for RN. |

---

## 5. PHI & SECURITY UX  

### 5.1 Biometric Re‑Authentication  

| Screen | Trigger | UX Flow |
|--------|---------|---------|
| **Trip Detail** | First entry to a PHI‑containing screen after > 5 min of inactivity or after app backgrounded. | Show native biometric prompt. If fails → fallback to password modal. |
| **Settings → Change Biometric** | User taps “Enable/Disable Biometric”. | Prompt for current password before toggling. |
| **App Resume** | App comes to foreground and more than **5 min** passed since last auth. | Show a modal “Re‑authenticate to view protected data” with biometric option. |

### 5.2 Masking & Show/Hide  

*Fields containing PHI (Patient ID, Cost, Provider NPI) are displayed as `••••••••` by default.*  
- A **eye icon** toggles visibility.  
- When toggled **ON**, the field is revealed for **10 seconds** then auto‑re‑masks.  
- The toggle is **accessibility‑labelled** (“Show patient ID”).  

### 5.3 App‑Switcher Blur & Screenshot Prevention  

| Platform | Technique |
|----------|-----------|
| **iOS** | `UIWindow` `isSecureTextEntry = true` on `applicationWillResignActive` → system blurs the snapshot. Also set `UIView.window?.layer.contents` to a blurred image during `applicationDidEnterBackground`. |
| **Android** | `FLAG_SECURE` on the Activity window prevents screenshots and hides app in recent‑apps view. |
| **React‑Native** | Call `ExpoSecureStore.setItemAsync('blur', 'true')` + `expo-screen-capture` to enable `ScreenCapture.preventScreenCapture()` on PHI screens. |

### 5.4 Session Timeout UX  

| Timeout | UX |
|---------|----|
| **Idle > 10 min** (foreground) | Show non‑modal dialog: “Your session will expire in 30 seconds”. Buttons: **Continue** (re‑auth) / **Logout**. |
| **Idle > 15 min** (background) | Auto‑lock: return to Login screen (clears in‑memory data). |
| **Logout** | Clears encrypted cache, revokes biometric token, and navigates to Login. |

### 5.5 Offline Data Sensitivity  

| Data | Cache Allowed? | Storage |
|------|----------------|---------|
| **Dashboard KPI Summary** | ✅ (encrypted) – up to 24 h. | `SecureStore` / `EncryptedSharedPreferences`. |
| **Trip List (filtered)** | ✅ (encrypted) – same TTL. | Same. |
| **Trip Detail** | ❌ – never cached locally. Must request from API each time (after biometric). |
| **User Settings** | ✅ (non‑PHI). | `UserDefaults` / `SharedPreferences`. |

---

## 6. PHI & SECURITY UX  

| Scenario | UX Detail |
|----------|-----------|
| **Biometric‑Protected Screens** | On entry, native biometric UI appears. If device does not support biometrics → password fallback is mandatory. |
| **Failed Biometric (3 attempts)** | After 3 consecutive failures, show password entry modal with “Forgot password?” link (sends reset email). |
| **Visibility Timeout** | After 10 s of showing PHI, auto‑mask and display toast “Field auto‑hidden for security”. |
| **Secure API Calls** | All requests include **OAuth 2.0 Bearer Token** retrieved during login. Token stored securely and refreshed using refresh token flow. |
| **Error Handling** | API errors that could expose PHI (e.g., “Patient not found”) are replaced with generic messages: “Unable to retrieve data, please try again.” |
| **Logging** | No PHI is ever written to logs. Use `os_log` (iOS) and `Timber` (Android) with **private** flag. RN uses `expo-logging` with filtered fields. |

---

## 7. DESIGN & DEVELOPMENT SPECIFICATIONS  

| Artifact | Description |
|----------|-------------|
| **Wireframes** | Figma file `VA‑Health‑Dashboard.fig`. Includes mobile (iPhone 13, Pixel 5) and tablet breakpoints. |
| **Component Library** | iOS: `UIKit` + `SwiftUI` wrappers. Android: Jetpack Compose (recommended). RN: `@rneui/base`. |
| **API Contract** | OpenAPI 3.0 spec `health-dashboard.yaml`. Endpoints: `/kpi`, `/trips`, `/trip/{id}`. All responses are JSON, HTTPS only. |
| **Testing Matrix** | Devices: iPhone 12/13, iPad, Android 9‑13 (Pixel, Samsung). RN: iOS 13+, Android 8+. |
| **Continuous Integration** | Fastlane lanes for iOS & Android builds, Jest + Detox for RN UI tests, SonarCloud for code quality. |
| **Release Checklist** | 1. Verify `FLAG_SECURE` / `isSecure` set. <br>2. Run accessibility audit. <br>3. Confirm no PHI in logs. <br>4. Validate encrypted cache TTL. <br>5. Perform penetration test on API endpoints. |

---

## 7. System Architecture Overview  

```
+-------------------+      HTTPS      +---------------------+
|   iOS / Android   |  <------------> |   Backend API (Node)|
|   (Swift / Kotlin)|                 |   - Auth (OAuth2)   |
|   (React‑Native)  |                 |   - KPI Service    |
+-------------------+                 |   - Trip Service   |
        |                               +---------------------+
        |  Secure Store (Keychain / EncryptedSharedPrefs)
        |
        v
   Encrypted Cache (TTL 24h)
```

*All network traffic uses **TLS 1.3**. Backend validates JWT on each request.*

---

## 8. Testing & Validation  

| Test Type | Tools |
|-----------|-------|
| **Unit Tests** | Xcode XCTest / JUnit / Jest |
| **UI Tests** | XCUITest (iOS) / Espresso (Android) / Detox (RN) |
| **Accessibility** | VoiceOver, TalkBack, axe‑android, axe‑core (Web) |
| **Security** | OWASP ZAP, Burp Suite, Mobile Security Framework (MobSF). |
| **Performance** | Instruments (iOS) / Android Profiler / RN `react-native-performance`. |

All tests must pass with **> 90 %** code coverage.

---

## 9. Documentation & Handoff  

- **Design Tokens**: `design-tokens.json` (generated via **Style Dictionary**).  
- **API Spec**: `health-dashboard.yaml` (hosted on SwaggerHub).  
- **Component Library**: iOS `HealthDashboardKit`, Android `health-dashboard-ui`, RN `@health/dashboard-ui`.  
- **Guidelines**: `ACCESSIBILITY.md`, `SECURITY.md`, `STYLE_GUIDE.md`.  

All assets are version‑controlled in **GitHub** with protected branches and required PR reviews.

---

### End of Document

*Prepared by the cross‑functional team (UX, Security, Mobile Engineering). All stakeholders must review and sign‑off before moving to implementation.*