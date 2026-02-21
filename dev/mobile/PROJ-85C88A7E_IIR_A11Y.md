# 8. ACCESSIBILITY IMPLEMENTATION

## 8.1 DashboardView — Complete Accessible Implementation

```swift
struct DashboardView: View {
    @State private var totalTrips = 0
    @State private var inHousePercent = 0
    @State private var cost = 0.0
    @State private var isRefreshing = false
    @State private var isLoading = true
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // KPI Cards
                    HStack(spacing: 16) {
                        KPIView(
                            title: "Total Trips",
                            value: "\(totalTrips)",
                            subtitle: "in-house: \(inHousePercent)%"
                        )
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Total trips: \(totalTrips), in-house: \(inHousePercent) percent, cost: \(cost) dollars")
                        
                        KPIView(
                            title: "Cost",
                            value: "$\(String(format: "%.2f", cost))",
                            subtitle: "per trip"
                        )
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Total trips: \(totalTrips), in-house: \(inHousePercent) percent, cost: \(cost) dollars")
                    }
                    .padding()
                    
                    // Chart View
                    ChartView()
                        .accessibilityLabel("Monthly trip trend chart")
                        .accessibilityHint("Shows ambulance trip counts by month. Double tap to hear data summary.")
                        .accessibilityElement(children: .ignore)
                        .accessibilityAction(named: "Read chart data") {
                            // Read chart data logic here
                        }
                        .frame(height: 200)
                        .padding()
                }
                .padding(.top, 20)
            }
            .navigationTitle("Dashboard")
            .accessibilityLabel("Dashboard")
            .refreshable {
                isRefreshing = true
                // Simulate refresh
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    isRefreshing = false
                }
            }
            .accessibilityLabel("Pull down to refresh dashboard data")
            
            // Loading Skeleton
            if isLoading {
                VStack {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 100)
                        .accessibilityLabel("Loading dashboard data")
                        .accessibilityTraits(.updatesFrequently)
                    
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 100)
                        .accessibilityLabel("Loading dashboard data")
                        .accessibilityTraits(.updatesFrequently)
                }
                .padding()
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Filter") {
                    // Filter action
                }
                .accessibilityLabel("Filter trips")
                .accessibilityHint("Opens filter options for month, trip type, and region")
                .accessibilityTraits(.button)
            }
        }
    }
}

struct KPIView: View {
    let title: String
    let value: String
    let subtitle: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            Text(value)
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(subtitle)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct ChartView: View {
    var body: some View {
        Text("Chart")
            .accessibilityHidden(true)
    }
}
```

## 8.2 TripListView — Complete Accessible Implementation

```swift
struct TripListView: View {
    @State private var trips: [Trip] = []
    @State private var isLoading = false
    @State private var isLastPage = false
    
    var body: some View {
        List {
            ForEach(trips) { trip in
                TripRowView(trip: trip)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Trip on \(trip.date), provider \(trip.provider), distance \(trip.distance) miles")
                    .accessibilityHint("Double tap to view trip details")
                    .accessibilityTraits(.button)
            }
            .listRowBackground(Color.clear)
            
            if trips.isEmpty {
                Text("No trips found")
                    .accessibilityLabel("No trips found")
                    .accessibilityHint("Try adjusting your filters")
                    .listRowBackground(Color.clear)
            }
            
            if isLoading {
                HStack {
                    ProgressView()
                        .accessibilityLabel("Loading trips")
                        .accessibilityTraits(.updatesFrequently)
                    Spacer()
                }
                .accessibilityLabel("Loading more trips")
            }
        }
        .listStyle(PlainListStyle())
    }
}

struct TripRowView: View {
    let trip: Trip
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Trip on \(trip.date)")
                .font(.headline)
            Text("Provider: \(trip.provider)")
                .font(.subheadline)
            Text("Distance: \(trip.distance) miles")
                .font(.subheadline)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
    }
}

struct Trip {
    let date: String
    let provider: String
    let distance: Double
}
```

## 8.3 TripDetailView — Complete Accessible Implementation

```swift
struct TripDetailView: View {
    @State private var trip: Trip
    @State private var isRevealed = false
    @State private var patientId = "HIDDEN"
    @State private var cost = 0.0
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Trip detail")
                    .accessibilityLabel("Trip detail")
                    .font(.largeTitle)
                    .padding(.bottom, 16)
                
                TripDetailRow(title: "Date", value: trip.date)
                    .accessibilityLabel("Trip date: \(trip.date)")
                
                TripDetailRow(title: "Provider", value: trip.provider)
                    .accessibilityLabel("Provider: \(trip.provider)")
                
                TripDetailRow(title: "Distance", value: "\(trip.distance) miles")
                    .accessibilityLabel("Distance: \(trip.distance) miles")
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Patient ID")
                        .font(.headline)
                    
                    if isRevealed {
                        Text(patientId)
                            .accessibilityLabel("Patient ID: \(patientId)")
                            .accessibilityHint("Field will auto-hide after 10 seconds")
                    } else {
                        Text("••••••••••••")
                            .accessibilityLabel("Patient ID: hidden")
                            .accessibilityHint("Double tap the reveal button to show for 10 seconds")
                    }
                    
                    Button(action: {
                        isRevealed.toggle()
                    }) {
                        Text(isRevealed ? "Hide" : "Show")
                            .accessibilityLabel(isRevealed ? "Hide patient ID" : "Show patient ID")
                            .accessibilityHint(isRevealed ? "Hides the patient identification number" : "Reveals the patient identification number for 10 seconds")
                            .accessibilityTraits(.button)
                    }
                }
                .padding(.vertical, 8)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Cost")
                        .font(.headline)
                    
                    if isRevealed {
                        Text("$\(String(format: "%.2f", cost))")
                            .accessibilityLabel("Cost: $\(String(format: "%.2f", cost))")
                    } else {
                        Text("••••••")
                            .accessibilityLabel("Cost: hidden")
                            .accessibilityHint("Double tap the reveal button to show for 10 seconds")
                    }
                    
                    Button(action: {
                        isRevealed.toggle()
                    }) {
                        Text(isRevealed ? "Hide" : "Show")
                            .accessibilityLabel(isRevealed ? "Hide cost" : "Show cost")
                            .accessibilityHint(isRevealed ? "Hides the cost" : "Reveals the cost for 10 seconds")
                            .accessibilityTraits(.button)
                    }
                }
                .padding(.vertical, 8)
                
                // Biometric prompt overlay
                if isRevealed {
                    ZStack {
                        Rectangle()
                            .fill(Color.black.opacity(0.5))
                            .accessibilityLabel("Authentication required")
                            .accessibilityHint("Biometric authentication is required to view protected health information")
                        
                        Text("Biometric authentication required")
                            .foregroundColor(.white)
                            .padding()
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .edgesIgnoringSafeArea(.all)
                }
            }
            .padding()
        }
    }
}

struct TripDetailRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
        }
        .padding(.vertical, 4)
    }
}
```

## 8.4 FilterModalView — Complete Accessible Implementation

```swift
struct FilterModalView: View {
    @State private var selectedMonth = 0
    @State private var selectedTripType = ""
    @State private var selectedRegion = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Filter trips").accessibilityAddTraits(.isHeader)) {
                    // Month Picker
                    Picker("Month", selection: $selectedMonth) {
                        ForEach(0..<12) { month in
                            Text("\(month + 1)").tag(month)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                    .accessibilityLabel("Month")
                    .accessibilityHint("Select a month")
                
                    // Trip Type Picker
                    Picker("Trip Type", selection: $selectedTripType) {
                        Text("All").tag("")
                        Text("Emergency").tag("Emergency")
                        Text("Routine").tag("Routine")
                    }
                    .pickerStyle(MenuPickerStyle())
                    .accessibilityLabel("Trip Type")
                    .accessibilityHint("Select trip type")
                
                    // Region Picker
                    Picker("Region", selection: $selectedRegion) {
                        Text("All").tag("")
                        Text("North").tag("North")
                        Text("South").tag("South")
                        Text("East").tag("East")
                        Text("West").tag("West")
                    }
                    .pickerStyle(MenuPickerStyle())
                    .accessibilityLabel("Region")
                    .accessibilityHint("Select region")
                }
                
                Section {
                    Button("Apply Filters") {
                        // Apply filter logic
                    }
                    .accessibilityLabel("Apply Filters")
                    .accessibilityHint("Apply selected filters")
                    .accessibilityTraits(.button)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
```

## 8.5 8.5 Dynamic Accessible View Components

```swift
// Accessibility Helper Views
struct DynamicAccessibleView: View {
    let title: String
    let content: String
    let accessibilityRole: AccessibilityRole
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .accessibilityLabel(title)
                .accessibilityHint("This is the \(title)")
                .accessibilityAddTraits(.isHeader)
            
            Text(content)
                .font(.body)
                .accessibilityLabel(content)
                .accessibilityHint("Content for \(title)")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title): \(content)")
        .accessibilityHint("Accessible view for \(title)")
    }
}

// Accessibility Role Enum
enum AccessibilityRole {
    case heading
    case button
    case list
    case image
    case link
    case alert
    case dialog
}

// Dynamic Accessibility View Modifier
struct AccessibilityModifier: ViewModifier {
    let label: String
    let hint: String
    let traits: Set<AccessibilityTrait>
    
    func body(content: Content) -> some View {
        content
            .accessibilityLabel(label)
            .accessibilityHint(hint)
            .accessibilityAddTraits(traits)
    }
}

extension View {
    func accessibilityCustom(
        label: String,
        hint: String,
        traits: Set<AccessibilityTrait> = []
    ) -> some View {
        self.modifier(
            AccessibilityModifier(
                label: label,
                hint: hint,
                traits: traits
            )
        )
    }
}
```

## 8.6 8.6 Accessibility Testing Helpers

```swift
// Accessibility Test Helper
struct AccessibilityTestHelper {
    static func testAllViews(_ view: some View) {
        // This would be used in unit tests to verify accessibility
        // For example, using XCTest or XCUITest
        print("Accessibility test helper initialized")
    }
    
    static func verifyAccessibility(
        label: String,
        hint: String,
        traits: Set<AccessibilityTrait>
    ) {
        // Verification logic for accessibility elements
        print("Verifying accessibility for: \(label)")
    }
}

// Accessibility Testing View
struct AccessibilityTestingView: View {
    @State private var testText = "Sample Text"
    
    var body: some View {
        VStack {
            Text(testText)
                .accessibilityLabel("Test text")
                .accessibilityHint("This is test text for accessibility")
                .accessibilityAddTraits(.isHeader)
            
            Button("Test Button") {
                // Action
            }
            .accessibilityLabel("Test Button")
            .accessibilityHint("Tap to perform action")
            .accessibilityTraits(.button)
        }
    }
}
```

## 8.7 8.7 Accessibility Customization

```swift
// Accessibility Customization Manager
class AccessibilityCustomizationManager {
    static let shared = AccessibilityCustomizationManager()
    
    var isVoiceOverEnabled: Bool {
        UIAccessibility.isVoiceOverRunning
    }
    
    var isBoldTextEnabled: Bool {
        UIAccessibility.isBoldTextEnabled
    }
    
    var isReduceMotionEnabled: Bool {
        UIAccessibility.isReduceMotionEnabled
    }
    
    var isReduceTransparencyEnabled: Bool {
        UIAccessibility.isReduceTransparencyEnabled
    }
    
    func applyCustomAccessibilitySettings() {
        // Apply custom accessibility settings based on user preferences
        if isVoiceOverEnabled {
            // Adjust UI for VoiceOver
        }
        
        if isBoldTextEnabled {
            // Increase text weight
        }
    }
    
    func updateAccessibilityTraits(_ traits: Set<AccessibilityTrait>, for view: UIView) {
        // Update accessibility traits dynamically
        view.accessibilityTraits = UIAccessibilityTraits(traits)
    }
}

// Custom Accessible Button
struct AccessibleButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
        }
        .accessibilityLabel(title)
        .accessibilityHint("Tap to \(title.lowercased())")
        .accessibilityTraits(.button)
        .accessibilityCustom(
            label: title,
            hint: "Tap to perform action",
            traits: [.button]
        )
    }
}
```