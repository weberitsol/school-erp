---
title: "Phase 1 Detailed Breakdown - Mobile Foundation & Test Download"
date: 2025-12-27
duration: "Weeks 1-4 (4 weeks)"
status: "READY FOR DETAILED PLANNING"
---

# 🚀 PHASE 1: MOBILE FOUNDATION & TEST DOWNLOAD

## Overview

**Goal**: Build the foundation for offline test-taking
**Duration**: 4 weeks (Sprints 1-2)
**Effort**: ~25 story points
**Team Size**: 4-6 developers (2 backend, 2-3 Android, 1 QA)
**Deliverable**: Blank Android app that can download and store tests locally

---

## 📊 PHASE 1 SCOPE

### **Stories to Implement**

| Epic | Story Count | Priority |
|------|-------------|----------|
| Epic 11: Mobile App Foundation | 7 stories | P0 |
| Epic 16a: Backend API (Download) | 2 stories | P0 |
| Infrastructure/Testing | 3 stories | P0 |
| **Total Phase 1** | **12 stories** | |

---

## 🏗️ SPRINT 1: WEEKS 1-2 (Foundation & Infrastructure)

### **Sprint 1 Goals**
- Android project structure ready
- Local database (SQLite) working
- Authentication system in place
- Backend download endpoint designed

---

### **SPRINT 1 STORIES**

#### **Epic 11 - Mobile App Foundation**

##### **Story 11.1: Android Project Setup & Architecture**
**Estimate**: 8 points | **Priority**: P0 | **Owner**: Lead Android Dev

**Description**:
Set up Android project with MVVM + Clean Architecture pattern using Kotlin.

**Acceptance Criteria**:
- [ ] New Android project created (API 24 minimum, target 34)
- [ ] MVVM architecture implemented with folders:
  - `presentation/` (UI, ViewModels)
  - `domain/` (Use cases, repository interfaces)
  - `data/` (Implementation, local/remote data sources)
- [ ] Dependency Injection (Hilt) configured
- [ ] Project builds successfully
- [ ] All unit tests pass (>80% coverage)
- [ ] README with setup instructions

**Technical Details**:
```kotlin
// Hilt Application class
@HiltAndroidApp
class SchoolEpApp : Application()

// Base ViewModel pattern
abstract class BaseViewModel : ViewModel() {
    protected val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
}
```

**Dependencies**:
- Kotlin 1.9+
- Jetpack Compose 1.6+
- Hilt 2.48+
- Room 2.6+

---

##### **Story 11.2: SQLite Database Setup with Encryption**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 1

**Description**:
Create encrypted SQLite database for storing test data locally.

**Acceptance Criteria**:
- [ ] SQLCipher dependency added (latest stable)
- [ ] Database migration system implemented
- [ ] Room ORM configured for SQLCipher
- [ ] Database file encrypted with AES-256
- [ ] Password stored securely in SharedPreferences
- [ ] Can read/write from database successfully
- [ ] Migration from empty to v1.0 schema works
- [ ] Unit tests verify encryption

**Database Schema** (Phase 1 subset):
```sql
-- Core tables for Phase 1
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    schoolId TEXT NOT NULL,
    email TEXT UNIQUE,
    biometricEnabled BOOLEAN DEFAULT 0
);

CREATE TABLE downloaded_tests (
    id TEXT PRIMARY KEY,
    testId TEXT NOT NULL,
    studentId TEXT NOT NULL,
    downloadedAt TIMESTAMP,
    totalSize INTEGER,
    mediaSize INTEGER,
    checksumVerified BOOLEAN DEFAULT 0,
    FOREIGN KEY(studentId) REFERENCES students(id)
);

CREATE TABLE test_metadata (
    id TEXT PRIMARY KEY,
    downloadedTestId TEXT NOT NULL,
    title TEXT,
    duration INTEGER,
    totalMarks INTEGER,
    questionCount INTEGER,
    FOREIGN KEY(downloadedTestId) REFERENCES downloaded_tests(id)
);
```

**Implementation**:
```kotlin
// Database configuration
@Database(
    entities = [Student::class, DownloadedTest::class, TestMetadata::class],
    version = 1
)
abstract class SchoolEpDatabase : RoomDatabase() {
    abstract fun studentDao(): StudentDao
    abstract fun downloadedTestDao(): DownloadedTestDao

    companion object {
        fun create(context: Context): SchoolEpDatabase {
            return Room.databaseBuilder(context, SchoolEpDatabase::class.java, "school_erp.db")
                .openHelperFactory(SupportFactory("password".toByteArray()))
                .build()
        }
    }
}
```

**Dependencies**:
- SQLCipher Android 4.5.4+
- Room 2.6+ with SQLCipher support
- androidx.security:security-crypto 1.1.0+

---

##### **Story 11.3: Biometric Authentication**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 2

**Description**:
Implement biometric (fingerprint/face) authentication for app access.

**Acceptance Criteria**:
- [ ] BiometricPrompt library integrated
- [ ] Fingerprint authentication working
- [ ] Face recognition working (device-dependent)
- [ ] Fallback to PIN code (6 digits) if biometric fails
- [ ] Biometric status stored per user
- [ ] Can enable/disable biometric in settings
- [ ] Device passes CTS (Compatibility Test Suite)
- [ ] Works on API 24+

**UI Flow**:
1. App launch → Check biometric status
2. If enabled → Show BiometricPrompt
3. On success → Unlock app
4. On failure → Show retry (max 3) then PIN
5. No internet → Still works (data in SharedPreferences)

**Implementation**:
```kotlin
class BiometricManager(private val context: Context) {
    fun authenticate(callback: BiometricCallback) {
        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
    }

    interface BiometricCallback : BiometricPrompt.AuthenticationCallback {
        // Implementation in activity
    }
}
```

---

##### **Story 11.4: Media Storage & Cache Management**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 2

**Description**:
Implement local file storage for test media (images, videos, documents).

**Acceptance Criteria**:
- [ ] App-specific directories created (cache vs files)
- [ ] Media organized by test ID
- [ ] Cache management (auto-cleanup when >500MB)
- [ ] Disk quota checking before download
- [ ] Permissions requested (READ/WRITE_EXTERNAL)
- [ ] Works on Android 11+ (scoped storage)
- [ ] Can list all cached media
- [ ] Delete cache functionality working

**Storage Structure**:
```
/data/data/com.schoolerp.app/
├── files/
│   └── tests/
│       └── test-id-123/
│           ├── metadata.json
│           ├── questions.db
│           ├── media/
│           │   ├── img-1.jpg
│           │   ├── img-2.jpg
│           │   └── video-1.mp4
│           └── checksums.json
└── cache/
    └── temp-downloads/
```

**Implementation**:
```kotlin
class StorageManager(private val context: Context) {
    fun getTestMediaDirectory(testId: String): File {
        return File(context.filesDir, "tests/$testId/media").apply {
            mkdirs()
        }
    }

    fun getCacheSize(): Long {
        return context.cacheDir.walkTopDown().sumOf { it.length() }
    }

    fun clearCache(maxSize: Long = 500 * 1024 * 1024) {
        if (getCacheSize() > maxSize) {
            context.cacheDir.deleteRecursively()
        }
    }
}
```

---

##### **Story 11.5: SharedPreferences & Encrypted Storage**
**Estimate**: 3 points | **Priority**: P0 | **Owner**: Android Dev 1

**Description**:
Implement encrypted shared preferences for storing sensitive user data.

**Acceptance Criteria**:
- [ ] EncryptedSharedPreferences configured
- [ ] User tokens stored encrypted
- [ ] Device fingerprint stored encrypted
- [ ] Can read/write without errors
- [ ] Migration from unencrypted doesn't lose data
- [ ] Unit tests verify encryption

**Data to Store**:
```kotlin
// Encrypted preferences
- authToken: String
- refreshToken: String
- studentId: String
- schoolId: String
- deviceFingerprint: String
- biometricPassword: String (hashed)
- lastSyncTime: Long
```

**Implementation**:
```kotlin
class EncryptedPreferences(context: Context) {
    private val encryptedPreferences = EncryptedSharedPreferences.create(
        context,
        "secret_shared_prefs",
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        encryptedPreferences.edit().putString("auth_token", token).apply()
    }
}
```

---

#### **Epic 16a - Backend API Extensions (Download)**

##### **Story 16.1: POST /api/v1/mobile/tests/{testId}/download**
**Estimate**: 8 points | **Priority**: P0 | **Owner**: Backend Lead

**Description**:
Create backend endpoint to download complete test package as ZIP.

**Acceptance Criteria**:
- [ ] Endpoint accepts testId parameter
- [ ] ZIP package contains:
  - Test metadata (JSON)
  - All questions (structured JSON)
  - Question media (images referenced by ID)
  - Solutions (if student has attempted)
- [ ] ZIP file compressed (gzip)
- [ ] File size < 100MB (most exams)
- [ ] Checksum included (SHA256)
- [ ] Returns streaming response (efficient)
- [ ] Authorization: Student can only download assigned tests
- [ ] Endpoint tested with 1000+ concurrent requests

**Request**:
```
POST /api/v1/mobile/tests/{testId}/download
Headers:
  Authorization: Bearer {token}

Response (200):
  - Stream of ZIP file
  - Content-Type: application/zip
  - Content-Length: {bytes}
  - X-Checksum: {sha256}
  - X-Content-Parts: [metadata, questions, media, solutions]
```

**ZIP Contents**:
```
test-123.zip
├── metadata.json
│   {
│     "testId": "123",
│     "title": "Physics Mock Test",
│     "duration": 120,
│     "totalMarks": 100,
│     "questions": 50,
│     "createdAt": "2025-12-27T10:00:00Z"
│   }
├── questions/
│   └── questions.json
│       [
│         {
│           "id": "q-1",
│           "type": "SINGLE_CHOICE",
│           "text": "What is...",
│           "options": [...]
│         }
│       ]
├── media/
│   ├── img-q1-1.jpg
│   ├── img-q2-1.png
│   └── video-q5-1.mp4
└── checksums.json
    {
      "metadata.json": "sha256...",
      "questions.json": "sha256...",
      "media": {...}
    }
```

**Backend Implementation**:
```typescript
// Express endpoint
router.post('/mobile/tests/:testId/download', async (req, res) => {
  const { testId } = req.params;
  const studentId = req.user.id;

  // Verify student can access test
  const testAccess = await TestAccess.findOne({ testId, studentId });
  if (!testAccess) return res.status(403).send('Not authorized');

  // Build ZIP
  const zip = new AdmZip();
  const testData = await getTestData(testId);

  zip.addFile('metadata.json', Buffer.from(JSON.stringify(testData.metadata)));
  zip.addFile('questions/questions.json', Buffer.from(JSON.stringify(testData.questions)));

  // Add media files
  for (const media of testData.media) {
    zip.addFile(`media/${media.filename}`, await fs.readFile(media.path));
  }

  // Add checksums
  const checksums = calculateChecksums(zip);
  zip.addFile('checksums.json', Buffer.from(JSON.stringify(checksums)));

  // Stream response
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('X-Checksum', checksums.zipChecksum);
  res.send(zip.toBuffer());
});
```

**Dependencies**:
- admZip (npm)
- compression (gzip)
- crypto (SHA256)

---

##### **Story 16.2: GET /api/v1/mobile/sync-status**
**Estimate**: 3 points | **Priority**: P0 | **Owner**: Backend Dev

**Description**:
Lightweight endpoint to check if app is in sync with server.

**Acceptance Criteria**:
- [ ] Returns sync status (synced/pending)
- [ ] Response time < 100ms
- [ ] No database-heavy queries
- [ ] Includes:
  - Current server time
  - Pending syncs count
  - Last sync timestamp
- [ ] Works offline (returns cached data if needed)
- [ ] Authenticated endpoint

**Request**:
```
GET /api/v1/mobile/sync-status
Headers:
  Authorization: Bearer {token}

Response (200):
{
  "synced": true,
  "pendingSyncs": 0,
  "lastSyncAt": "2025-12-27T14:30:00Z",
  "serverTime": "2025-12-27T14:35:00Z",
  "queueSize": 0
}
```

---

#### **Infrastructure & Testing**

##### **Story IT.1: Development Environment Setup**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: DevOps/Tech Lead

**Description**:
Set up local development environment for mobile development.

**Acceptance Criteria**:
- [ ] Docker Compose includes:
  - PostgreSQL (test DB)
  - Redis (caching)
  - MinIO (local S3)
- [ ] Backend API runs on localhost:5000
- [ ] Android emulator can reach backend
- [ ] Database seeded with test data (10 students, 5 tests)
- [ ] CI/CD pipeline created (GitHub Actions)
- [ ] All developers can `docker-compose up` and work

---

### **SPRINT 1 SUCCESS CRITERIA**

- [ ] Android project builds successfully
- [ ] SQLite database working with encryption
- [ ] Biometric auth (fallback to PIN) working
- [ ] Media storage and cache management working
- [ ] EncryptedSharedPreferences storing data
- [ ] Backend download endpoint working
- [ ] Backend sync-status endpoint working
- [ ] Development environment ready for all 4-6 developers
- [ ] All code in Git with passing CI/CD
- [ ] Team has zero blockers for Sprint 2

---

## 🏗️ SPRINT 2: WEEKS 3-4 (Test Download & Storage)

### **Sprint 2 Goals**
- Download mechanism fully working
- ZIP file processing on mobile
- Test data storage in SQLite
- Error handling and retry logic

---

### **SPRINT 2 STORIES**

#### **Epic 12 - Test Download & Sync**

##### **Story 12.1: Resumable Download with Progress**
**Estimate**: 8 points | **Priority**: P0 | **Owner**: Android Dev 1

**Description**:
Implement resumable ZIP download with progress tracking.

**Acceptance Criteria**:
- [ ] Download can pause and resume
- [ ] Progress UI shows:
  - Current bytes / total bytes
  - Download speed (MB/s)
  - Time remaining (estimate)
  - Percentage complete
- [ ] Handles network interruptions gracefully
- [ ] Partial files retained for resuming
- [ ] Timeout handling (>5 min inactive = retry)
- [ ] Works on slow networks (tested on 2G simulation)
- [ ] Can download 100MB file on poor connection

**Implementation**:
```kotlin
class DownloadManager(private val context: Context) {
    fun downloadTest(testId: String, onProgress: (progress: Int) -> Unit): Flow<DownloadResult> {
        return flow {
            val downloadUrl = "http://localhost:5000/api/v1/mobile/tests/$testId/download"
            val file = File(context.cacheDir, "$testId.zip")

            val request = Request.Builder()
                .url(downloadUrl)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Range", "bytes=${file.length()}-")
                .build()

            val response = httpClient.newCall(request).execute()

            response.body?.byteStream()?.let { inputStream ->
                file.outputStream().use { fileOut ->
                    val buffer = ByteArray(8192)
                    var read: Int
                    var totalRead = file.length()
                    val totalSize = response.contentLength() + file.length()

                    while (inputStream.read(buffer).also { read = it } != -1) {
                        fileOut.write(buffer, 0, read)
                        totalRead += read
                        onProgress((totalRead * 100 / totalSize).toInt())
                    }
                }
                emit(DownloadResult.Success(file))
            }
        }
    }
}
```

---

##### **Story 12.2: ZIP Extraction & Validation**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 2

**Description**:
Extract and validate downloaded ZIP file.

**Acceptance Criteria**:
- [ ] ZIP extraction working
- [ ] Checksum validation passes
- [ ] Missing files detected
- [ ] Corrupt files detected
- [ ] Media files extracted to correct locations
- [ ] Extraction on background thread (no UI freeze)
- [ ] Can cancel extraction
- [ ] Partial extraction cleanup on failure

**Implementation**:
```kotlin
class ZipExtractor(private val context: Context) {
    suspend fun extractAndValidate(zipFile: File, testId: String): Result<ExtractedTest> {
        return withContext(Dispatchers.IO) {
            try {
                val destDir = File(context.filesDir, "tests/$testId")
                destDir.mkdirs()

                val zipFile = ZipFile(zipFile)
                for (entry in zipFile.entries) {
                    if (!entry.isDirectory) {
                        val outFile = File(destDir, entry.name)
                        outFile.parentFile?.mkdirs()
                        zipFile.getInputStream(entry).use { input ->
                            outFile.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                    }
                }

                // Validate checksums
                val checksums = readChecksums(File(destDir, "checksums.json"))
                validateChecksums(destDir, checksums)

                Result.success(ExtractedTest(testId, destDir))
            } catch (e: Exception) {
                // Cleanup on failure
                File(context.filesDir, "tests/$testId").deleteRecursively()
                Result.failure(e)
            }
        }
    }
}
```

---

##### **Story 12.3: Test Data Import to SQLite**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 1

**Description**:
Parse extracted test data and import into SQLite database.

**Acceptance Criteria**:
- [ ] Read metadata.json and questions.json
- [ ] Insert into Room database
- [ ] Map media files to questions
- [ ] Create indexes for fast queries
- [ ] Handle duplicate imports gracefully
- [ ] Transaction-based (all or nothing)
- [ ] Can import 1000+ question test in < 2 seconds
- [ ] Verify data consistency

**Room DAOs**:
```kotlin
@Dao
interface TestDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTest(test: TestEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestions(questions: List<QuestionEntity>)

    @Transaction
    suspend fun importTest(test: TestEntity, questions: List<QuestionEntity>) {
        insertTest(test)
        insertQuestions(questions)
    }
}
```

---

##### **Story 12.4: Lazy Media Loading**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: Android Dev 2

**Description**:
Load images/videos on-demand instead of pre-loading all.

**Acceptance Criteria**:
- [ ] Images load when question displayed
- [ ] Caching enabled (in-memory + disk)
- [ ] Placeholder shown while loading
- [ ] Error state handled
- [ ] Works offline (from cached storage)
- [ ] Memory efficient (no OOM on 200MB media)
- [ ] Tested with low-end devices (2GB RAM)

**Implementation**:
```kotlin
class MediaLoader(private val context: Context) {
    private val imageCache = LruCache<String, Bitmap>(maxSize = 100)

    fun loadImage(questionId: String, mediaId: String): Flow<ImageState> {
        return flow {
            emit(ImageState.Loading)

            // Check memory cache
            imageCache[mediaId]?.let {
                emit(ImageState.Success(it))
                return@flow
            }

            // Load from disk
            val file = File(context.filesDir, "tests/$questionId/media/$mediaId")
            if (file.exists()) {
                val bitmap = BitmapFactory.decodeFile(file.path)
                imageCache.put(mediaId, bitmap)
                emit(ImageState.Success(bitmap))
            } else {
                emit(ImageState.Error("Media not found"))
            }
        }
    }
}
```

---

#### **Epic 11 Continued**

##### **Story 11.6: Settings & Preferences UI**
**Estimate**: 5 points | **Priority**: P0 | **Owner**: UI Dev

**Description**:
Create settings screen for app configuration.

**Acceptance Criteria**:
- [ ] Settings screen created in Compose
- [ ] Toggle biometric on/off
- [ ] Download quality selection (HD/Standard/Low)
- [ ] Auto-download on WiFi toggle
- [ ] Clear cache button with confirmation
- [ ] Storage usage display
- [ ] App version displayed
- [ ] Settings persisted to EncryptedSharedPreferences

---

##### **Story 11.7: Network Connectivity Monitoring**
**Estimate**: 3 points | **Priority**: P0 | **Owner**: Android Dev 1

**Description**:
Monitor network connectivity and cache connectivity status.

**Acceptance Criteria**:
- [ ] Detect online/offline status
- [ ] Detect WiFi vs mobile data
- [ ] Notify app of status changes
- [ ] Can delay operations based on connection type
- [ ] Works on API 24+

**Implementation**:
```kotlin
class ConnectivityMonitor(context: Context) : ConnectivityManager.NetworkCallback() {
    private val connectivityManager = context.getSystemService(ConnectivityManager::class.java)
    private val _networkStatus = MutableStateFlow<NetworkStatus>(NetworkStatus.Unknown)
    val networkStatus: StateFlow<NetworkStatus> = _networkStatus.asStateFlow()

    fun start() {
        val request = NetworkRequest.Builder()
            .addCapability(NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, this)
    }

    override fun onAvailable(network: Network) {
        _networkStatus.value = NetworkStatus.Online
    }

    override fun onLost(network: Network) {
        _networkStatus.value = NetworkStatus.Offline
    }
}
```

---

### **SPRINT 2 SUCCESS CRITERIA**

- [ ] Can download 50MB+ test files successfully
- [ ] Download resume working (pause/resume 5+ times)
- [ ] Checksums validate successfully
- [ ] ZIP extracts without corruption
- [ ] Test data visible in SQLite
- [ ] Images load with placeholder before full load
- [ ] Settings screen works
- [ ] Network status detected
- [ ] All manual testing passes
- [ ] Performance metrics:
  - Download: 5-10 MB/sec on 4G
  - Extract: < 30 seconds for 50MB
  - Import: < 2 seconds for 1000 questions
  - Load image: < 500ms for first load, <100ms cached

---

## 📋 PHASE 1 SUMMARY

### **Deliverables**
- ✅ Android project with MVVM + Clean Architecture
- ✅ Encrypted SQLite database with Room ORM
- ✅ Biometric + PIN authentication working
- ✅ Local file storage with cache management
- ✅ Backend endpoint for test downloads (ZIP format)
- ✅ Download manager with resumable capability
- ✅ ZIP extraction and validation
- ✅ Test data import to SQLite
- ✅ Lazy image/video loading
- ✅ Settings and preferences UI
- ✅ Network connectivity monitoring

### **Metrics**
- **Total Stories**: 12 stories across Epics 11 & 16
- **Total Effort**: ~60 story points
- **Duration**: 4 weeks (2 sprints of 2 weeks each)
- **Team Size**: 4-6 developers
- **Code Quality**: >80% test coverage, no critical bugs

### **Go/No-Go Criteria**
Before moving to Phase 2, all must be true:
- [ ] Can download test (50-100MB) successfully
- [ ] Download resumes after interruption
- [ ] Checksums validate correctly
- [ ] Data imports to SQLite without errors
- [ ] Media loads from cache
- [ ] Zero crashes on low-end devices
- [ ] All stories passing acceptance criteria
- [ ] CI/CD pipeline green
- [ ] Team morale high (no blockers)

---

## 🔄 TRANSITION TO PHASE 2

**What Comes Next** (Weeks 5-8):
- Epic 13: Offline Test-Taking (UI + engine)
- Epic 14: Response Sync (half)

**Dependencies**:
- Phase 1 stories all complete
- Database schema finalized
- Backend API stable

---

**Document Status**: ✅ READY FOR SPRINT PLANNING
**Date**: 2025-12-27
**Target Kickoff**: Week 1 (4 weeks duration)

---
