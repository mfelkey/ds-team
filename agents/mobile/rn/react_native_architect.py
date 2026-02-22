import sys
sys.path.insert(0, "/home/mfelkey/dev-team")

import os
import json
from datetime import datetime
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process, LLM
from agents.orchestrator.orchestrator import log_event, save_context

load_dotenv("config/.env")


def build_rn_architect() -> Agent:
    llm = LLM(
        model=os.getenv("TIER2_MODEL", "ollama/qwen2.5:72b"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        timeout=3600
    )

    return Agent(
        role="React Native Architect",
        goal=(
            "Design a complete, production-ready React Native architecture for "
            "a cross-platform iOS and Android application — producing a React Native "
            "Architecture Document that defines every technical decision, shared "
            "component strategy, platform adaptation pattern, navigation structure, "
            "state management approach, and native module integration, so the "
            "React Native Developer can implement without ambiguity."
        ),
        backstory=(
            "You are a Senior React Native Architect with 10 years of experience "
            "designing cross-platform mobile applications for government, healthcare, "
            "and enterprise clients using React Native and Expo. "
            "You understand the fundamental tension in React Native: the promise of "
            "a single codebase versus the reality that iOS and Android users have "
            "different mental models, navigation patterns, and platform conventions. "
            "You resolve this tension through principled use of Platform.OS, "
            "platform-specific file extensions (.ios.tsx, .android.tsx), and a "
            "shared design token system that adapts to each platform. "
            "You are expert-level in the modern React Native stack: "
            "React Navigation 6 for navigation, Zustand or Redux Toolkit for state, "
            "React Query (TanStack Query) for server state and caching, "
            "React Native MMKV for encrypted local storage, "
            "React Native Keychain for secure credential storage, "
            "React Native Biometrics for biometric authentication, "
            "React Native Reanimated 3 for performant animations, "
            "React Native Gesture Handler for gesture support, "
            "Expo modules for device APIs where available, "
            "and Jest + Detox for testing. "
            "You design for HIPAA compliance from the start — you know which screens "
            "require biometric re-authentication, how to prevent PHI from appearing "
            "in screenshots (expo-screen-capture), and how to implement encrypted "
            "offline caching with TTL enforcement. "
            "You produce a React Native Architecture Document (RNAD) that is the "
            "authoritative technical specification for the React Native track. "
            "The React Native Developer implements from your RNAD. Every decision "
            "you make is justified, every pattern is documented with code examples, "
            "and every platform divergence is explicitly called out."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False
    )


def run_rn_architecture(context: dict, muxd_path: str, prd_path: str) -> tuple:

    with open(muxd_path) as f:
        muxd_content = f.read()[:4000]

    with open(prd_path) as f:
        prd_content = f.read()[:1000]

    architect = build_rn_architect()

    rnad_task = Task(
        description=f"""
You are the React Native Architect. Using the Mobile UX Document and PRD below,
produce a complete React Native Architecture Document (RNAD).

--- Mobile UX Document (excerpt) ---
{muxd_content}

--- Product Requirements Document (excerpt) ---
{prd_content}

Produce a complete RNAD with ALL of the following sections.
Every section requires working TypeScript/React Native code — no placeholders.

1. ARCHITECTURE OVERVIEW
   - Architecture pattern: Feature-based folder structure with shared kernel
   - Complete folder structure:
     src/
       features/ (auth, dashboard, trips, settings)
       shared/ (components, hooks, services, utils, theme)
       navigation/
       store/
       api/
   - Technology decisions table: library, version, justification for each choice
   - Platform adaptation strategy: when to use Platform.OS vs platform files vs
     shared components with platform props
   - Monorepo vs single-package decision and justification

2. NAVIGATION ARCHITECTURE
   - Complete React Navigation 6 setup
   - Root navigator: Stack navigator wrapping auth flow + tab navigator
   - Auth navigator: Stack (Login → BiometricPrompt)
   - Main tab navigator: Bottom tabs (Dashboard, Settings, About)
     * iOS: tabBarStyle matching Apple HIG (opaque, no border)
     * Android: tabBarStyle matching Material 3 (elevated surface)
   - Dashboard stack: Dashboard → TripList → TripDetail
   - Modal screens: FilterModal (presented as modal on both platforms)
   - Deep linking configuration matching MUXD §2.3
   - Complete TypeScript type definitions for all route params
   - Navigation service for imperative navigation outside components
   - Complete NavigationContainer setup with linking config

3. STATE MANAGEMENT
   - Zustand store design:
     * AuthStore: isAuthenticated, user, accessToken, sessionExpiry
     * DashboardStore: kpiData, chartData, filters, lastFetched
     * TripStore: trips, selectedTrip, pagination state
     * UIStore: isLoading, error, toastMessage
   - React Query (TanStack Query) for all API calls:
     * QueryClient configuration (staleTime, cacheTime, retry policy)
     * Custom hooks: useKPISummary, useTrips, useTripDetail
     * Optimistic updates for filter changes
     * Background refetch strategy
   - Separation of concerns: Zustand for UI/auth state, React Query for server state
   - Complete TypeScript interfaces for all store shapes

4. API LAYER
   - Axios instance with:
     * BaseURL from environment (react-native-config or Expo Constants)
     * Request interceptor: inject Bearer token from Keychain
     * Response interceptor: handle 401 → token refresh → retry
     * Error normalization: ApiError class with code, message, statusCode
   - Complete API service functions for all endpoints:
     * authApi: login, refreshToken, logout
     * dashboardApi: getKPISummary(filters)
     * tripsApi: getTrips(page, filters), getTripDetail(id)
   - React Query integration: queryFn wrappers for each endpoint
   - No hardcoded URLs — reads from EXPO_PUBLIC_API_BASE_URL

5. AUTHENTICATION ARCHITECTURE
   - OIDC flow using expo-auth-session or AppAuth
   - JWT storage: react-native-keychain (never AsyncStorage)
   - Token refresh: Axios interceptor with mutex to prevent concurrent refreshes
   - Biometric authentication: react-native-biometrics
     * iOS: Face ID / Touch ID via LAContext bridge
     * Android: BiometricPrompt bridge
     * Fallback: device PIN/password
   - Session timeout: background timer, 10 min foreground / 15 min background
   - Complete AuthService class with all methods
   - AppState listener for background/foreground session management

6. PHI & SECURITY ARCHITECTURE
   - Screenshot prevention:
     * iOS: expo-screen-capture preventScreenCapture() on PHI screens
     * Android: FLAG_SECURE via expo-screen-capture
     * Pattern: useEffect hook activating on mount, deactivating on unmount
   - Encrypted offline cache:
     * react-native-mmkv with encryption key from Keychain
     * CacheService class: set<T>, get<T>, delete, clearAll
     * TTL enforcement: store expiry timestamp with each entry
     * TripDetail: explicitly never cached
   - PHI field masking:
     * PHIMaskedField component: masked by default, reveal button
     * Auto-remask after 10 seconds using useEffect + setTimeout
     * Audit log on reveal: logs fieldName + userSub, never PHI value
   - App backgrounding: blur overlay on both platforms
     * AppState listener: add blur view on background, remove on foreground
     * Platform-specific implementation details

7. SHARED COMPONENT LIBRARY
   - Complete TypeScript interfaces for all components
   - Produce working component code for each:
     * VAButton: primary, secondary, destructive, disabled variants
       — Platform-adapted: iOS uses SF-style rounded rect, Android uses Material ripple
     * VATextInput: default, focused, error, disabled states with accessibilityLabel
     * KPICard: title, value, trend indicator, accessibilityElement(combined)
     * TripRow: date, provider, distance, accessibilityLabel
     * PHIMaskedField: masked display, reveal button, auto-remask timer
     * LoadingSkeleton: animated placeholder for async content
     * EmptyState: illustration, title, subtitle, retry button
     * ErrorBanner: dismissible error display with retry action
     * ToastMessage: auto-dismiss notification (uses UIStore)
     * AppBlurOverlay: covers app content when backgrounded

8. PLATFORM ADAPTATION PATTERNS
   - Document and provide code for each adaptation:
     * Navigation headers: iOS uses large title, Android uses standard toolbar
     * Bottom sheets: iOS uses @gorhom/bottom-sheet, Android same
     * Haptics: expo-haptics, platform-gated
     * Status bar: Platform-specific style (light/dark content)
     * Safe area: react-native-safe-area-context usage patterns
     * Keyboard behavior: KeyboardAvoidingView with platform-specific behavior
     * Font selection: Platform.select for SF Pro vs Roboto
     * Icon sets: @expo/vector-icons with SF Symbols on iOS, Material on Android
   - Complete Platform.select examples for each adaptation
   - When to use .ios.tsx/.android.tsx vs Platform.OS conditional

9. TESTING ARCHITECTURE
   - Jest configuration for React Native + TypeScript
   - Testing utilities: custom render with providers (QueryClient, Navigation, Zustand)
   - Unit test examples:
     * AuthService: login, token refresh, biometric auth
     * CacheService: set/get with TTL, TripDetail exclusion
     * PHIMaskedField: auto-remask after 10s
   - Detox E2E configuration:
     * iOS simulator and Android emulator setup
     * Test scenarios: login flow, dashboard load, PHI reveal/remask
   - Mock strategy: MSW (Mock Service Worker) for API mocking in tests

10. BUILD & ENVIRONMENT CONFIGURATION
    - Expo managed vs bare workflow decision and justification
    - Environment variables: EXPO_PUBLIC_* pattern, app.config.js
    - EAS Build configuration (eas.json):
      * development, preview (internal), production profiles
      * iOS: provisioning via EAS credentials
      * Android: keystore via EAS credentials
    - EAS Submit for App Store and Play Store
    - OTA updates: expo-updates configuration and rollout strategy
    - Complete app.config.js with all required plugins

Output the complete RNAD as well-formatted markdown with working TypeScript code.
All code must be production-ready, properly typed, and follow React Native best practices.
No hardcoded credentials, URLs, or provider-specific assumptions.
Every section must have actual working code — not descriptions of what code should do.
""",
        expected_output="A complete React Native Architecture Document with working TypeScript code.",
        agent=architect
    )

    crew = Crew(
        agents=[architect],
        tasks=[rnad_task],
        process=Process.sequential,
        verbose=True
    )

    print(f"\n⚛️  React Native Architect designing cross-platform architecture...\n")
    result = crew.kickoff()

    os.makedirs("dev/mobile", exist_ok=True)
    rnad_path = f"dev/mobile/{context['project_id']}_RNAD.md"
    with open(rnad_path, "w") as f:
        f.write(str(result))

    print(f"\n💾 React Native Architecture Document saved: {rnad_path}")

    context["artifacts"].append({
        "name": "React Native Architecture Document",
        "type": "RNAD",
        "path": rnad_path,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": "React Native Architect"
    })
    context["status"] = "RNAD_COMPLETE"
    log_event(context, "RNAD_COMPLETE", rnad_path)
    save_context(context)

    return context, rnad_path


if __name__ == "__main__":
    import glob

    logs = sorted(glob.glob("logs/PROJ-*.json"), key=os.path.getmtime, reverse=True)
    if not logs:
        print("No project context found.")
        exit(1)

    with open(logs[0]) as f:
        context = json.load(f)

    muxd_path = prd_path = None
    for artifact in context.get("artifacts", []):
        if artifact.get("type") == "MUXD":
            muxd_path = artifact["path"]
        if artifact.get("type") == "PRD":
            prd_path = artifact["path"]

    if not all([muxd_path, prd_path]):
        print("Missing MUXD or PRD.")
        exit(1)

    print(f"📂 Loaded context: {logs[0]}")
    print(f"📄 Using MUXD: {muxd_path}")
    context, rnad_path = run_rn_architecture(context, muxd_path, prd_path)

    print(f"\n✅ React Native architecture complete.")
    print(f"📄 RNAD: {rnad_path}")
    with open(rnad_path) as f:
        print(f.read(500))
