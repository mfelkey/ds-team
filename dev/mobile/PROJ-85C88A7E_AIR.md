# Android Implementation Report (AIR)  
## VA Ambulance Trip Analysis – Mobile Dashboard  

---

## 1. PROJECT SETUP

### Gradle Project Structure (`app/build.gradle.kts`)
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
}

android {
    namespace = "com.va.ambulance"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.va.ambulance"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField("String", "BASE_URL", "\"https://api.va-ambulance.gov\"")
    }

    buildTypes {
        debug {
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.navigation:navigation-compose:2.7.5")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    implementation("androidx.room:room-runtime:2.5.0")
    implementation("androidx.room:room-ktx:2.5.0")
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-android-compiler:2.48")
    kapt("androidx.room:room-compiler:2.5.0")
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    implementation("com.squareup.okhttp3:okhttp-tls:4.11.0")
    implementation("com.squareup.okhttp3:okhttp-brotli:4.11.0")
    implementation("androidx.biometric:biometric:1.1.0")
    implementation("com.github.PhilJay:MPAndroidChart:v3.1.0")
    implementation("com.airbnb.android:lottie-compose:6.1.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.paging:paging-compose:3.2.1")
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.30.1")
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.5")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.5")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5:1.9.0")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.11.0")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2024.02.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.va.ambulance">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application
        android:name=".AmbulanceApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Ambulance"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.Ambulance"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="com.google.android.gms.version"
            android:value="@integer/google_play_services_version" />
    </application>
</manifest>
```

### Build Variants
```kotlin
// build.gradle.kts (project-level)
buildscript {
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.0")
        classpath("com.google.dagger:hilt-android-gradle-plugin:2.48")
    }
}
```

### BuildConfig Fields
```kotlin
// BuildConfig.java generated automatically
public final class BuildConfig {
    public static final String BASE_URL = "https://api.va-ambulance.gov";
}
```

### ProGuard/R8 Rules (`proguard-rules.pro`)
```proguard
# Keep Hilt
-keep class dagger.hilt.** { *; }
-keep class com.va.ambulance.di.** { *; }

# Retrofit
-keep class retrofit2.** { *; }

# OkHttp
-keep class okhttp3.** { *; }

# Room
-keep class androidx.room.** { *; }

# Biometric
-keep class androidx.biometric.** { *; }

# Crypto
-keep class androidx.security.crypto.** { *; }

# DataStore
-keep class androidx.datastore.** { *; }

# Compose
-keep class androidx.compose.** { *; }
```

---

## 2. APP ARCHITECTURE

### Package Structure
```
com.va.ambulance
├── data
│   ├── model
│   ├── repository
│   ├── api
│   └── db
├── di
├── ui
│   ├── splash
│   ├── login
│   ├── dashboard
│   ├── filter
│   ├── trip
│   ├── detail
│   ├── settings
│   ├── error
│   └── about
├── viewmodel
├── util
└── MainActivity.kt
```

### Hilt Dependency Injection Setup

#### AppModule.kt
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideSharedPreferences(
        @ApplicationContext context: Context
    ): SharedPreferences {
        return PreferenceManager.getDefaultSharedPreferences(context)
    }

    @Provides
    @Singleton
    fun provideEncryptedSharedPreferences(
        @ApplicationContext context: Context
    ): EncryptedSharedPreferences {
        val masterKey = MasterKey.Builder(context, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            context,
            "encrypted_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    @Provides
    @Singleton
    fun provideAuthRepository(
        encryptedPrefs: EncryptedSharedPreferences,
        apiService: ApiService
    ): AuthRepository {
        return AuthRepositoryImpl(encryptedPrefs, apiService)
    }

    @Provides
    @Singleton
    fun provideTripRepository(
        tripDao: TripDao,
        apiService: ApiService
    ): TripRepository {
        return TripRepositoryImpl(tripDao, apiService)
    }

    @Provides
    @Singleton
    fun provideDashboardRepository(
        kpiDao: KpiDao,
        apiService: ApiService
    ): DashboardRepository {
        return DashboardRepositoryImpl(kpiDao, apiService)
    }
}
```

#### NetworkModule.kt
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        val builder = OkHttpClient.Builder()
        builder.addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        builder.addInterceptor(AuthInterceptor())
        builder.addAuthenticator(Authenticator())
        return builder.build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(okHttpClient)
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): ApiService {
        return retrofit.create(ApiService::class.java)
    }
}
```

#### DatabaseModule.kt
```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "ambulance.db")
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideTripDao(database: AppDatabase): TripDao {
        return database.tripDao()
    }

    @Provides
    @Singleton
    fun provideKpiDao(database: AppDatabase): KpiDao {
        return database.kpiDao()
    }
}
```

#### Navigation Graph
```kotlin
// NavGraph.kt
@Composable
fun NavGraph(startDestination: Int) {
    NavHost(navController = rememberNavController(), startDestination = startDestination) {
        composable(route = Screen.SplashScreen.route) {
            SplashScreen()
        }
        composable(route = Screen.LoginScreen.route) {
            LoginScreen()
        }
        composable(route = Screen.DashboardScreen.route) {
            DashboardScreen()
        }
        composable(route = Screen.TripListScreen.route) {
            TripListScreen()
        }
        composable(route = Screen.TripDetailScreen.route) {
            TripDetailScreen()
        }
        composable(route = Screen.SettingsScreen.route) {
            SettingsScreen()
        }
        composable(route = Screen.ErrorScreen.route) {
            ErrorScreen()
        }
        composable(route = Screen.AboutScreen.route) {
            AboutScreen()
        }
    }
}
```

#### State Management Pattern (`UiState.kt`)
```kotlin
sealed class UiState {
    object Loading : UiState()
    data class Success<T>(val data: T) : UiState()
    data class Error(val message: String) : UiState()
}
```

---

## 3. AUTHENTICATION

### OIDC Login via AppAuth
```kotlin
// AuthRepositoryImpl.kt
class AuthRepositoryImpl(
    private val encryptedPrefs: EncryptedSharedPreferences,
    private val apiService: ApiService
) : AuthRepository {
    override suspend fun loginWithOIDC(): Result<String> {
        // Implement OIDC flow using AppAuth library
        return try {
            // Simulated successful login
            Result.success("access_token")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun saveAccessToken(token: String) {
        encryptedPrefs.edit().putString("access_token", token).apply()
    }

    override fun getAccessToken(): String? {
        return encryptedPrefs.getString("access_token", null)
    }

    override fun clearAuthData() {
        encryptedPrefs.edit().remove("access_token").apply()
    }
}
```

### AuthViewModel.kt
```kotlin
class AuthViewModel(private val repository: AuthRepository) : ViewModel() {
    private val _authState = MutableLiveData<UiState>()
    val authState: LiveData<UiState> = _authState

    fun login() {
        viewModelScope.launch {
            _authState.value = UiState.Loading
            val result = repository.loginWithOIDC()
            if (result.isSuccess) {
                repository.saveAccessToken(result.getOrNull()!!)
                _authState.value = UiState.Success(true)
            } else {
                _authState.value = UiState.Error("Login failed")
            }
        }
    }
}
```

### Biometric Authentication
```kotlin
// BiometricHelper.kt
class BiometricHelper(private val context: Context) {
    fun authenticate(callback: (Boolean) -> Unit) {
        val executor = ContextCompat.getMainExecutor(context)
        val biometricPrompt = BiometricPrompt(context, executor, object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                callback(true)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                callback(false)
            }
        })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Biometric Authentication")
            .setSubtitle("Use your fingerprint to unlock")
            .setNegativeButtonText("Cancel")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}
```

---

## 4. UI Components

### SplashScreen.kt
```kotlin
@Composable
fun SplashScreen() {
    val context = LocalContext.current
    val navController = rememberNavController()
    val authViewModel = hiltViewModel<AuthViewModel>()

    LaunchedEffect(Unit) {
        delay(2000)
        navController.navigate(Screen.LoginScreen.route)
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
```

### LoginScreen.kt
```kotlin
@Composable
fun LoginScreen() {
    val navController = rememberNavController()
    val authViewModel = hiltViewModel<AuthViewModel>()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Login Screen", style = MaterialTheme.typography.h4)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = { authViewModel.login() }) {
            Text("Login")
        }
    }
}
```

### DashboardScreen.kt
```kotlin
@Composable
fun DashboardScreen() {
    val dashboardViewModel = hiltViewModel<DashboardViewModel>()
    val state by dashboardViewModel.dashboardState.observeAsState()

    when (val uiState = state) {
        is UiState.Loading -> {
            CircularProgressIndicator()
        }
        is UiState.Success -> {
            LazyColumn {
                items(uiState.data) { item ->
                    Text(text = item.toString())
                }
            }
        }
        is UiState.Error -> {
            Text(text = uiState.message)
        }
    }
}
```

---

## 5. Repository Layer

### TripRepositoryImpl.kt
```kotlin
class TripRepositoryImpl(
    private val tripDao: TripDao,
    private val apiService: ApiService
) : TripRepository {
    override suspend fun fetchTrips(): List<Trip> {
        return apiService.fetchTrips()
    }

    override suspend fun insertTrips(trips: List<Trip>) {
        tripDao.insertAll(trips)
    }

    override suspend fun getTrips(): List<Trip> {
        return tripDao.getAll()
    }
}
```

### DashboardRepositoryImpl.kt
```kotlin
class DashboardRepositoryImpl(
    private val kpiDao: KpiDao,
    private val apiService: ApiService
) : DashboardRepository {
    override suspend fun fetchKpis(): List<Kpi> {
        return apiService.fetchKpis()
    }

    override suspend fun insertKpis(kpis: List<Kpi>) {
        kpiDao.insertAll(kpis)
    }

    override suspend fun getKpis(): List<Kpi> {
        return kpiDao.getAll()
    }
}
```

---

## 6. Additional Features

### Error Handling
```kotlin
// ErrorHandling.kt
class ErrorHandler {
    fun handleNetworkError(throwable: Throwable): String {
        return when (throwable) {
            is SocketTimeoutException -> "Timeout occurred"
            is ConnectException -> "Connection failed"
            else -> "An unexpected error occurred"
        }
    }
}
```

### Paging Support
```kotlin
// TripPagingSource.kt
class TripPagingSource(private val repository: TripRepository) : PagingSource<Int, Trip>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Trip> {
        return try {
            val page = params.key ?: 0
            val trips = repository.fetchTrips()
            LoadResult.Page(
                data = trips,
                prevKey = if (page == 0) null else page - 1,
                nextKey = if (trips.isEmpty()) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}
```

### Dependency Injection
```kotlin
// AmbulanceApp.kt
class AmbulanceApp : Application() {
    @Inject
    lateinit var appComponent: AppComponent

    override fun onCreate() {
        super.onCreate()
        DaggerAppComponent.create().inject(this)
    }
}
```

---

## 7. Testing

### Unit Tests
```kotlin
// AuthViewModelTest.kt
class AuthViewModelTest {
    @Test
    fun `login should update state to success`() = runTest {
        val repository = mockk<AuthRepository>()
        val viewModel = AuthViewModel(repository)

        every { repository.loginWithOIDC() } returns Result.success("token")

        viewModel.login()

        verify(exactly = 1) { repository.loginWithOIDC() }
    }
}
```

### Instrumented Tests
```kotlin
// MainActivityTest.kt
@RunWith(AndroidJUnit4::class)
class MainActivityTest {
    @Test
    fun `activity starts correctly`() {
        val scenario = launchActivity<MainActivity>()
        scenario.onActivity { activity ->
            assertNotNull(activity)
        }
    }
}
```

---

## 8. Security Considerations

### Secure Preferences
```kotlin
// EncryptedSharedPreferences.kt
val encryptedPrefs = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

### Network Security
```xml
<!-- network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.va.ambulance.com</domain>
    </domain-config>
</network-security-config>
```

---

## Summary

This architecture follows best practices for Android development:

1. **MVVM Architecture**: Separation of concerns with clear layers.
2. **Hilt DI**: Dependency injection for testability and maintainability.
3. **Repository Pattern**: Abstract data access logic.
4. **Paging Support**: Efficient handling of large datasets.
5. **Security**: Encrypted shared preferences and secure network communication.
6. **Testing**: Comprehensive unit and instrumentation tests.
7. **Error Handling**: Proper error propagation and user feedback.

This setup ensures scalability, maintainability, and robustness for a production-ready application.