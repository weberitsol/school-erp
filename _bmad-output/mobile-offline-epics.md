---
title: "Mobile Offline-First Architecture - Epics & Stories"
version: "1.0.0"
date: 2025-12-27
author: "Design Discussion with Jejeram"
status: "PLANNING ONLY - NO DEVELOPMENT"
---

# MOBILE OFFLINE-FIRST ARCHITECTURE
## Complete Epic & Story Breakdown

---

## 📋 OVERVIEW

This document defines epics and stories for implementing an **offline-first Android mobile application** that enables students to:
1. Download tests once (with internet)
2. Take tests completely offline (no internet required)
3. Submit responses when internet returns
4. Sync results and view analytics later

**Key Benefits:**
- ✅ Eliminates server load during peak exam hours
- ✅ Scales to 10,000+ concurrent students
- ✅ Zero internet required during test taking
- ✅ Better user experience (instant responses)
- ✅ Batch analytics generation reduces latency

---

## 🎯 NEW EPICS FOR MOBILE OFFLINE ARCHITECTURE

### **Epic 11: Mobile App Foundation & Local Storage**
**Goal:** Build the foundational mobile app infrastructure with offline capabilities

**User Outcome:** Students can install the app and prepare for offline test-taking

**Requirements:**
- Android app development (Kotlin)
- SQLite encrypted local database
- Local file system for media caching
- App lifecycle management
- Permission handling

---

### **Epic 12: Test Download & Synchronization**
**Goal:** Enable secure download of complete test packages for offline access

**User Outcome:** Students can download tests once and take them offline anytime

**Requirements:**
- API endpoints for test package download
- Bandwidth-optimized download mechanism
- File integrity verification (checksums)
- Media caching and lazy loading
- Download progress tracking

---

### **Epic 13: Offline Test-Taking Engine**
**Goal:** Enable complete test-taking experience without internet

**User Outcome:** Students can take tests offline with timer, navigation, and scoring

**Requirements:**
- Local test loading from SQLite
- Question navigation and answer saving
- Timer management
- Media rendering (images, videos)
- Test submission and local storage

---

### **Epic 14: Response Sync & Result Management**
**Goal:** Synchronize student responses to server when internet available

**User Outcome:** Students can submit tests offline and sync when convenient

**Requirements:**
- Background sync mechanism
- Automatic retry with exponential backoff
- Sync queue management
- Conflict resolution
- Data encryption for responses

---

### **Epic 15: Batch Test Evaluation & Analytics**
**Goal:** Server-side batch processing of test responses and analytics generation

**User Outcome:** Teachers get complete analytics without real-time processing pressure

**Requirements:**
- Evaluation queue management
- Batch evaluation jobs
- Answer comparison and scoring
- Analytics calculation
- Report generation

---

### **Epic 16: Backend API Extensions for Mobile**
**Goal:** Create mobile-specific API endpoints

**User Outcome:** Mobile app has efficient APIs for download, upload, and sync

**Requirements:**
- `/api/v1/mobile/tests/download/{testId}`
- `/api/v1/mobile/tests/{testId}/sync`
- Compression and optimization
- Versioning and compatibility

---

### **Epic 17: Security, Integrity & Cheating Prevention**
**Goal:** Secure offline test-taking with fraud detection

**User Outcome:** Platform ensures test integrity while supporting offline mode

**Requirements:**
- Encryption at rest and in transit
- Device locking to test
- Signature verification
- Watermarking
- Anomaly detection

---

### **Epic 18: Performance & Infrastructure Scaling**
**Goal:** Scale backend to support 10,000+ concurrent test submissions

**User Outcome:** Server can handle mass sync without bottlenecks

**Requirements:**
- Connection pooling
- Redis caching
- Load balancing
- Batch job processing
- Database optimization

---

---

## 📝 DETAILED STORIES

### **EPIC 11: Mobile App Foundation & Local Storage**

#### **Story 11.1: Android App Project Setup**
**As a** developer
**I want** a properly structured Kotlin Android project
**So that** development can proceed with clean architecture

**Acceptance Criteria:**
- Given Android project created, When opened in Android Studio, Then builds successfully
- Given dependencies added, When gradle syncs, Then all dependencies resolve
- Given app runs, When launched on emulator, Then no crashes on startup
- Given package structure, When organized, Then follows MVVM architecture
- Given configuration, When environment changes, Then app switches between dev/staging/prod

**Technical Notes:**
- Language: Kotlin (modern, safe)
- Architecture: MVVM with repositories
- DI: Hilt for dependency injection
- Build tool: Gradle with proper versioning
- Min SDK: Android 11 (API 30)
- Target SDK: Latest (Android 14+)

**Dependencies:**
- AndroidX: AppCompat, Lifecycle, Navigation
- Jetpack Compose: UI framework
- Retrofit + OkHttp: Networking
- Room: Local database
- WorkManager: Background jobs
- DataStore: Preferences
- Hilt: Dependency injection

---

#### **Story 11.2: SQLite Database with Encryption**
**As a** developer
**I want** encrypted SQLite database for offline storage
**So that** questions and responses are stored securely locally

**Acceptance Criteria:**
- Given database creation, When app first runs, Then encrypted database created
- Given password/key, When generated per device, Then unique per installation
- Given data write, When stored, Then encrypted on disk
- Given data read, When loaded, Then decrypted transparently
- Given database migration, When schema changes, Then migration runs automatically
- Given database backup, When attempted, Then encrypted backup created

**Technical Notes:**
- SQLite library: Android Room ORM
- Encryption: SQLCipher for encrypted SQLite
- Database name: exam_cache.db
- Master key: Device-specific + biometric
- Schema version: Start with v1, plan for migrations
- Backup location: Encrypted shared preferences

**Database Schema Tables:**
```
├─ Students
├─ DownloadedTests
├─ TestQuestions
├─ TestPassages
├─ StudentResponses
├─ TestAttempts
├─ MediaCache
├─ SyncQueue
└─ AppMetadata
```

---

#### **Story 11.3: Media File Management**
**As a** developer
**I want** efficient local file storage for media
**So that** images and videos are available offline

**Acceptance Criteria:**
- Given media download, When part of test package, Then stored locally
- Given storage path, When organized, Then follows structure: /media/{testId}/{type}/{filename}
- Given file size, When exceeds threshold, Then warning shown to user
- Given file integrity, When checked, Then checksum verified against manifest
- Given file cleanup, When old tests deleted, Then media files also deleted
- Given low storage, When below threshold, Then user warned and cleanup offered

**Technical Notes:**
- Storage location: App's cache directory (automatic cleanup)
- Optional: External storage with permissions
- File types: JPG, PNG, MP4, WebP (optimized formats)
- Max file size per media: 10MB
- Cleanup: Auto-delete old test media after 30 days post-result

---

#### **Story 11.4: App Permissions Management**
**As a** developer
**I want** proper permission handling
**So that** app requests only necessary permissions

**Acceptance Criteria:**
- Given permissions required, When app runs first time, Then permission requests shown
- Given permission denied, When user denies, Then graceful fallback provided
- Given permissions, When needed at runtime, Then requested at appropriate time
- Given permission rationale, When showing request, Then explanation provided
- Given settings app, When user goes to settings, Then permissions explained

**Required Permissions:**
- `INTERNET` - Download tests and sync
- `WRITE_EXTERNAL_STORAGE` - If saving documents (optional)
- `READ_EXTERNAL_STORAGE` - If uploading files (optional)
- `RECORD_AUDIO` - For future voice/video answers (optional)
- `CAMERA` - For proctoring (optional, P3)

---

#### **Story 11.5: App Lifecycle and State Management**
**As a** developer
**I want** proper lifecycle management
**So that** app state is preserved across pauses and rotations

**Acceptance Criteria:**
- Given app paused, When resumed, Then state restored exactly
- Given test in progress, When device rotated, Then test state preserved
- Given app backgrounded, When timer running, Then timer continues accurately
- Given process killed, When app relaunched, Then last test state recovered
- Given response saved locally, When power cuts off, Then response not lost

**Technical Notes:**
- ViewModel for state management
- SavedStateHandle for persistence
- DataStore for preferences
- Room for database state
- WorkManager for background tasks

---

#### **Story 11.6: Biometric Authentication Setup**
**As a** developer
**I want** biometric login support
**So that** app access is secure and convenient

**Acceptance Criteria:**
- Given biometric available, When app first run, Then biometric enrollment offered
- Given biometric enrolled, When launching test, Then biometric required before access
- Given biometric failed, When retries exhausted, Then password fallback shown
- Given fingerprint/face, When enrolled, Then either can be used
- Given biometric disabled, When setting changed, Then password required

**Technical Notes:**
- BiometricPrompt API (AndroidX)
- Support: Fingerprint, Face recognition
- Fallback: Password authentication
- Security: Require authentication before accessing test

---

#### **Story 11.7: Offline Mode Indicators**
**As a** user
**I want** clear indicators of app connectivity status
**So that** I know whether sync is possible

**Acceptance Criteria:**
- Given offline, When no internet, Then "Offline" badge shown prominently
- Given online, When internet available, Then "Online" badge shown
- Given connectivity change, When network toggles, Then status updated instantly
- Given sync pending, When unsynced responses exist, Then indicator shown
- Given sync in progress, When syncing, Then progress indicator with percentage

**Technical Notes:**
- ConnectivityManager for network status
- Real-time monitoring via NetworkCallback
- UI indicator: color-coded (green=online, red=offline)
- Persistent status bar or floating badge

---

### **EPIC 12: Test Download & Synchronization**

#### **Story 12.1: Test Assignment Feed**
**As a** student
**I want** to see tests available for download
**So that** I know which tests I need to prepare for

**Acceptance Criteria:**
- Given login, When authenticated, Then assigned tests fetched
- Given test list, When displayed, Then shows: testName, dueDate, status
- Given status, When shown, Then displays: AVAILABLE, DOWNLOADED, COMPLETED, SYNCED
- Given test filtering, When status selected, Then filtered list shown
- Given refresh, When pulled, Then new assignments fetched from server
- Given offline, When no internet, Then cached test list shown

**Technical Notes:**
- API: `GET /api/v1/mobile/tests/assigned`
- Cache locally with timestamp
- Sync status from previous attempts
- Show: test title, class/section, due date, download size estimate
- Auto-refresh every 1 hour or on manual refresh

---

#### **Story 12.2: Test Package Download**
**As a** student
**I want** to download complete test packages
**So that** I can take them offline

**Acceptance Criteria:**
- Given test selected, When download clicked, Then download starts
- Given download progress, When ongoing, Then percentage shown
- Given large file, When downloading on cellular, Then warning shown
- Given download pause, When paused, Then can resume from checkpoint
- Given download failure, When network error, Then retry offered
- Given download complete, When finished, Then "Ready to take" shown
- Given available storage, When checked, Then warning if insufficient space
- Given checksum, When verified, Then integrity confirmed before using

**Technical Notes:**
- API: `POST /api/v1/mobile/tests/download/{testId}`
- Response: ZIP file with structure:
  ```
  test-123-bundle/
  ├─ metadata.json (test info)
  ├─ questions.db (SQLite)
  ├─ solutions.db (encrypted)
  ├─ media/
  │  ├─ images/
  │  ├─ videos/
  │  └─ audio/
  ├─ manifest.json (file checksums)
  └─ schema.sql
  ```
- Download via OkHttp with progress listener
- Store in app cache directory
- Extract ZIP and verify all files
- Size estimate: 45-100 MB per test (compressed)

---

#### **Story 12.3: Incremental Download Support**
**As a** developer
**I want** to support resumable downloads
**So that** network interruptions don't restart the download

**Acceptance Criteria:**
- Given download started, When interrupted, Then progress saved
- Given resume, When clicked, Then continues from last byte
- Given server support, When Range header sent, Then partial content returned
- Given retry logic, When network error, Then exponential backoff used
- Given timeout, When connection hangs, Then timeout after 30 seconds

**Technical Notes:**
- HTTP Range requests: `Range: bytes=1000-2000`
- OkHttp interceptor for retry logic
- Store download state in database: testId, bytesDownloaded, totalBytes
- Retry strategy: immediate, then 5s, 15s, 1min, 5min, 30min
- Max retries: 5 times

---

#### **Story 12.4: Lazy Media Loading**
**As a** developer
**I want** lazy loading of media files
**So that** download size is minimized initially

**Acceptance Criteria:**
- Given test download, When started, Then questions downloaded first
- Given media, When accessed in test, Then downloaded on-demand
- Given offline, When media not downloaded, Then placeholder shown
- Given preview, When question viewed, Then "Download image?" prompt shown
- Given low storage, When available space low, Then media not auto-downloaded

**Technical Notes:**
- Download questions.db immediately
- Media downloaded only if explicitly accessed
- Placeholder: gray box with "Download" button
- Check storage before each media download
- Cache downloaded media for next time

---

#### **Story 12.5: Download Management Interface**
**As a** student
**I want** to manage downloaded tests
**So that** I can delete old tests and free space

**Acceptance Criteria:**
- Given test list, When long-pressed, Then options menu shown
- Given delete option, When selected, Then confirmation shown
- Given confirm delete, When confirmed, Then test deleted locally
- Given storage status, When viewed, Then total/used/free space shown
- Given test size, When shown, Then breakdown: questions/media/solutions
- Given download date, When shown, Then helps track freshness

**Technical Notes:**
- Settings page: "Downloaded Tests"
- List all downloaded tests with: name, download date, size, status
- Delete button: removes test folder completely
- Storage info: Use StorageManager for space info
- Optional: Auto-cleanup old tests after 30 days post-result

---

#### **Story 12.6: Test Package Integrity Verification**
**As a** developer
**I want** to verify download integrity
**So that** corrupted downloads are detected

**Acceptance Criteria:**
- Given download complete, When manifest checked, Then all files verified
- Given checksum, When calculated, Then matches manifest value
- Given mismatch, When found, Then file re-downloaded or error shown
- Given partial file, When detected, Then cleanup attempted or warning shown
- Given verification log, When saved, Then stored for troubleshooting

**Technical Notes:**
- manifest.json includes: filename, fileSize, SHA256 checksum
- Verify after extraction before allowing test access
- Re-download individual files if mismatch detected
- Log verification results: success/failure per file
- If critical file missing: show "Download corrupted, please re-download"

---

### **EPIC 13: Offline Test-Taking Engine**

#### **Story 13.1: Test Launch and Loading**
**As a** student
**I want** to open a test and start taking it
**So that** I can complete my assessment

**Acceptance Criteria:**
- Given downloaded test, When clicked, Then test loads instantly from local DB
- Given test info, When displayed, Then title, duration, total marks shown
- Given instructions, When shown, Then full instructions readable before starting
- Given start button, When clicked, Then timer starts and first question shown
- Given loading time, When measured, Then < 1 second from click to test view

**Technical Notes:**
- Load test metadata from questions.db
- Display: instructions, duration, marks, question count
- Show warning if any questions failed to load
- Pre-load first 5 questions into memory
- Cache question data as user navigates

---

#### **Story 13.2: Question Navigation and Display**
**As a** student
**I want** to navigate between questions easily
**So that** I can review and answer all questions

**Acceptance Criteria:**
- Given question view, When displayed, Then full question with options shown
- Given navigation, When previous/next clicked, Then previous answer saved
- Given question list, When sidebar opened, Then all questions shown with status icons
- Given goto question, When number clicked, Then jumps to that question
- Given question status, When marked, Then shows: answered, marked for review, unanswered
- Given progress, When viewed, Then shows X of N questions answered

**Technical Notes:**
- Question details: text, image, options with images
- Status indicators: ✓ answered, ? flagged, ✗ unanswered
- Navigation: Previous/Next buttons, Question grid sidebar
- Auto-save current response every 10 seconds
- Highlight current question in grid
- Smooth transitions between questions

---

#### **Story 13.3: Answer Selection and Response Saving**
**As a** student
**I want** to select answers and have them saved locally
**So that** my work is preserved even without internet

**Acceptance Criteria:**
- Given MCQ, When option clicked, Then selected and saved
- Given Multiple correct, When options clicked, Then all selections saved
- Given numeric input, When entered, Then value saved
- Given fill-in-blank, When text entered, Then text saved
- Given auto-save, When happens, Then no user action needed
- Given response saved indicator, When shown, Then confirms response saved
- Given auto-save failure, When happens, Then error shown and retry attempted

**Technical Notes:**
- Response stored immediately in StudentResponses table
- Auto-save every 10 seconds to database
- Show "✓ Saved" indicator briefly after each save
- Handle offline write errors gracefully
- Track time spent per question

---

#### **Story 13.4: Timer Management**
**As a** student
**I want** accurate timer counting down the remaining time
**So that** I know when to submit before time expires

**Acceptance Criteria:**
- Given timer start, When test begins, Then countdown starts
- Given timer display, When shown, Then updates every second
- Given remaining time, When < 5 minutes, Then color changes to orange/red
- Given remaining time, When < 1 minute, Then warning sound or visual pulse
- Given time expired, When reaches zero, Then test auto-submitted
- Given timer accuracy, When tested, Then accurate within 1 second
- Given app pause, When backgrounded, Then timer continues accurately

**Technical Notes:**
- Use System.currentTimeMillis() for accuracy
- Update UI every second with remaining time
- Warning at 5 minutes: color change to orange
- Warning at 1 minute: red color + pulse animation
- Sound alert at 1 minute (configurable)
- Auto-submit when time reaches zero
- Keep CountDownTimer running even if app paused

---

#### **Story 13.5: Marking Questions for Review**
**As a** student
**I want** to mark questions to review later
**So that** I can prioritize questions I'm unsure about

**Acceptance Criteria:**
- Given flag button, When clicked on question, Then question marked for review
- Given flagged indicator, When shown, Then star or similar icon visible
- Given review list, When filter selected, Then shows only flagged questions
- Given flag removal, When unflagged, Then indicator removed
- Given navigate flagged, When using sidebar, Then quick jump to flagged questions
- Given submitted test, When includes flags, Then flags visible in results review

**Technical Notes:**
- StudentResponse.isFlagged boolean field
- Flag stored in database immediately
- Sidebar indicator: different color/icon for flagged
- Filter in question grid: show/hide flagged only
- Quick nav buttons: "Next flagged" / "Previous flagged"

---

#### **Story 13.6: Image and Video Rendering**
**As a** student
**I want** to see images and videos in questions
**So that** I can answer questions with visual content

**Acceptance Criteria:**
- Given question with image, When loaded, Then image displayed clearly
- Given image quality, When shown, Then optimized for screen size
- Given video in question, When present, Then play button shown
- Given video play, When clicked, Then video player opened
- Given video offline, When playing, Then plays from local storage
- Given image size, When large, Then pinch-to-zoom available
- Given missing media, When file not found, Then placeholder shown with retry

**Technical Notes:**
- Image loading: Glide library with local caching
- Image optimization: Max 1080p, JPG/WebP format
- Video player: ExoPlayer with offline support
- Media source: file:// URLs to local cache
- Caching: LRU cache with size limit
- Zoom: PhotoView library for pinch-zoom
- Error handling: Graceful fallback to placeholder

---

#### **Story 13.7: Offline Indication and Connection Status**
**As a** student
**I want** clear indication that I'm offline and test is secure
**So that** I know the app is working correctly

**Acceptance Criteria:**
- Given offline state, When no internet, Then "Offline" badge shown
- Given online state, When internet available, Then "Online" badge shown
- Given disconnection, When happens mid-test, Then test continues unaffected
- Given reconnection, When happens, Then auto-sync triggered if allowed
- Given sync status, When pending, Then indicator shown (may not show during test)
- Given test completion, When timer expires, Then stored locally for sync

**Technical Notes:**
- Status indicator: persistent top or floating badge
- Colors: Green (online), Red (offline)
- Network monitoring: ConnectivityManager or NetworkCallback
- Show in test view but don't interrupt
- Auto-attempt sync when connection restored
- Never block test submission due to connectivity

---

### **EPIC 14: Response Sync & Result Management**

#### **Story 14.1: Test Submission Flow**
**As a** student
**I want** to submit my test with confirmation
**So that** I know my answers are saved

**Acceptance Criteria:**
- Given submit button, When test timer expired or clicked, Then confirmation dialog shown
- Given confirmation, When shown, Then displays: answered count, unanswered count
- Given final chance, When dialog shown, Then option to go back and continue
- Given confirm submit, When confirmed, Then test marked as submitted
- Given submission timestamp, When recorded, Then stored locally
- Given success, When submitted, Then "✓ Submitted successfully" shown
- Given submission saved, When offline, Then stored for later sync

**Technical Notes:**
- TestAttempt.status: IN_PROGRESS → SUBMITTED
- TestAttempt.submittedAt: timestamp recorded
- Confirmation dialog: shows stats and warning
- Store all responses with submission timestamp
- Create sync queue entry for later transmission
- Show success message with next steps

---

#### **Story 14.2: Sync Queue Management**
**As a** developer
**I want** manage pending syncs in a queue
**So that** responses sync reliably when internet available

**Acceptance Criteria:**
- Given submitted test, When stored locally, Then added to sync queue
- Given queue status, When checked, Then shows pending, completed, failed
- Given sync pending, When user views, Then clear indicator shown
- Given automatic retry, When enabled, Then retries at intervals
- Given max retries, When exceeded, Then moved to failed queue with reason
- Given retry history, When viewed, Then shows attempt count and error details

**Technical Notes:**
- SyncQueue table: queueId, testId, attemptId, action, status, retryCount, lastError
- Status: PENDING, SYNCING, COMPLETED, FAILED
- Auto-retry: Check every 1 minute if connectivity available
- Retry strategy:
  - Attempt 1: Immediate (if online)
  - Attempt 2: After 1 minute
  - Attempt 3: After 5 minutes
  - Attempt 4: After 30 minutes
  - Attempt 5: After 2 hours
  - Max retries: 5 (then manual retry only)
- User can manually trigger retry anytime

---

#### **Story 14.3: Background Sync Service**
**As a** developer
**I want** automatic background sync when internet available
**So that** syncing happens without user action

**Acceptance Criteria:**
- Given internet connection established, When available, Then sync check triggered
- Given sync pending, When detected, Then sync job queued
- Given sync running, When in progress, Then app continues normally
- Given sync timeout, When takes > 60 seconds, Then retry scheduled
- Given low battery, When detected, Then sync postponed until charging
- Given power saving mode, When enabled, Then sync uses less aggressive intervals
- Given sync complete, When successful, Then status updated to SYNCED

**Technical Notes:**
- WorkManager: BackgroundSync job
- Triggers:
  - Periodic: Check every 15 minutes (configurable)
  - On connectivity change: Check when online
  - On app resume: Check immediately
- Constraints:
  - Requires INTERNET capability
  - Optional: requires charging or battery > 20%
  - Backoff: exponential backoff on failure
- Notification: Silent sync, show result only if error

---

#### **Story 14.4: Encryption of Responses Before Sync**
**As a** developer
**I want** to encrypt responses before transmission
**So that** sensitive test data is protected

**Acceptance Criteria:**
- Given response, When prepared for sync, Then encrypted with AES-256
- Given encryption key, When generated, Then stored securely on device
- Given server-side verification, When sync received, Then signature checked
- Given key rotation, When needed, Then old keys archived
- Given decryption failure, When detected, Then error logged and user notified

**Technical Notes:**
- Encryption: AES-256 in CBC mode
- Key generation: Device-specific, not transmitted
- Signature: HMAC-SHA256 of encrypted payload
- Library: Tink by Google (modern crypto library)
- Salt/IV: Generated randomly for each encryption
- Storage: Encrypted in database

---

#### **Story 14.5: Automatic Sync Conflict Resolution**
**As a** developer
**I want** to handle sync conflicts gracefully
**So that** duplicate submissions don't occur

**Acceptance Criteria:**
- Given duplicate attempt, When received by server, Then idempotency key checked
- Given idempotent request, When retried, Then server returns same response
- Given conflict, When detected, Then local copy marked as synced
- Given stale data, When detected, Then newer version preferred
- Given both versions different, When conflict, Then user notified to re-submit

**Technical Notes:**
- Idempotency key: attemptId (must be unique)
- Server checks: if attemptId exists, return cached response
- LastModified timestamp on local response
- Conflict detection: compare timestamps
- Notification: "Already synced" message
- Manual action: Only needed if true conflict (rare)

---

#### **Story 14.6: Sync Failure Handling and User Notification**
**As a** student
**I want** to know when sync fails and how to fix it
**So that** I can take corrective action

**Acceptance Criteria:**
- Given sync failure, When occurs, Then appropriate error message shown
- Given network error, When cause, Then "Check your internet connection" shown
- Given server error, When cause, Then "Server error, will retry" shown
- Given validation error, When cause, Then specific field error shown
- Given persistent failure, When after retries, Then manual action options shown
- Given manual retry, When user clicks, Then sync attempted again
- Given help option, When clicked, Then contact support information shown

**Technical Notes:**
- Error messages clear and actionable
- Error categories:
  - Network: No internet, timeout
  - Server: 500, 503, database error
  - Client: Validation, checksum mismatch
  - Auth: 401, token expired
- Retry button visible in settings or notification
- Contact support: Deep link to support email/chat
- Error log: Saved for debugging

---

#### **Story 14.7: Manual Sync Trigger**
**As a** student
**I want** to manually sync my responses anytime
**So that** I have control over when sync happens

**Acceptance Criteria:**
- Given settings, When opened, Then "Sync Now" button visible
- Given sync pending, When status shown, Then count of pending syncs displayed
- Given sync now clicked, When triggered, Then sync starts immediately
- Given sync progress, When in progress, Then loading indicator shown
- Given sync complete, When finished, Then success/error message shown
- Given cellular warning, When on cellular and large data, Then warning shown

**Technical Notes:**
- Location: Settings page → Sync section
- Button state: Enabled if pending syncs exist or online
- Connectivity check: Warn if on cellular
- Progress: Show count/total items synced
- Success: "✓ All synced!" with timestamp
- Error: Show error and offer retry/support

---

### **EPIC 15: Batch Test Evaluation & Analytics**

#### **Story 15.1: Test Evaluation Job Queue**
**As a** backend system
**I want** to queue all test responses for batch evaluation
**So that** evaluations happen efficiently in batches

**Acceptance Criteria:**
- Given test submission sync, When received, Then added to evaluation_queue
- Given queue status, When checked, Then shows: pending, processing, completed
- Given evaluation processor, When triggered, Then processes all pending items
- Given job configuration, When set, Then timing and concurrency defined
- Given job monitoring, When observed, Then progress tracked and logged

**Technical Notes:**
- Queue table: evaluation_queue
  - testId, attemptId, studentId, submittedAt, status, processedAt
- Status: PENDING, PROCESSING, COMPLETED, FAILED
- Trigger: Manual run or scheduled (e.g., 1 hour after exam ends)
- Processor: BullMQ job with configurable concurrency
- Logging: Track start, end, duration, success/failure

---

#### **Story 15.2: Answer Comparison and Auto-Grading**
**As a** backend system
**I want** to compare student answers with correct answers
**So that** scores are calculated automatically

**Acceptance Criteria:**
- Given student response, When compared to correct answer, Then match determined
- Given MCQ, When single correct, Then exact match required
- Given Multiple correct, When multiple options, Then all must match (or partial matching if enabled)
- Given numeric, When integer type, Then value compared
- Given fill-in-blank, When text field, Then exact or fuzzy match available
- Given marks allocation, When correct, Then full marks awarded
- Given incorrect, When answer wrong, Then marks zero (or negative if configured)
- Given partial marking, When enabled, Then reduced marks for MCQ multiple correct

**Technical Notes:**
- Answer comparison logic per question type:
  - SINGLE_CORRECT: studentAnswer == correctAnswer
  - MULTIPLE_CORRECT: Set(studentAnswers) == Set(correctAnswers) or partial
  - INTEGER: parseInt(studentAnswer) == correctAnswer
  - FILL_IN_BLANK: fuzzy string match or exact
- Partial marking: 0.5 marks per correct option (for MULTIPLE_CORRECT)
- Negative marking: marksAwarded = marks - (negativeMarks if wrong)
- Store: TestResponse.marksAwarded (per response)

---

#### **Story 15.3: Score Calculation and Grade Assignment**
**As a** backend system
**I want** to calculate total scores and assign grades
**So that** results are complete with all scoring information

**Acceptance Criteria:**
- Given all responses graded, When scores calculated, Then total computed
- Given marks, When summed, Then total marks for test
- Given percentage, When calculated, Then percentage = (total / maxMarks) * 100
- Given pass/fail, When determined, Then based on passing marks threshold
- Given grade scale, When applied, Then grade assigned (A, B, C, D, F, etc.)
- Given GPA, When configured, Then GPA calculated from grade

**Technical Notes:**
- Calculation:
  ```
  totalScore = SUM(marksAwarded for all responses)
  percentage = (totalScore / test.maxMarks) * 100
  pass = percentage >= test.passingMarks
  grade = lookup grade from GradeScale using percentage
  gpa = grade.gpa value
  ```
- Store in TestAttempt:
  - totalScore (Decimal)
  - percentage (Decimal)
  - isPassed (Boolean)
  - gradeAwarded (String - A/B/C/D/F)
  - gpa (Decimal, if applicable)

---

#### **Story 15.4: Question-wise Analysis**
**As a** backend system
**I want** to analyze performance per question
**So that** teachers understand which questions were difficult

**Acceptance Criteria:**
- Given all responses, When analyzed, Then per-question stats calculated
- Given each question, When analyzed, Then: solved count, percentage, difficulty
- Given difficulty calculation, When done, Then based on % of students correct
- Given question feedback, When low scores, Then flagged for review
- Given analysis, When stored, Then accessible for reports

**Technical Notes:**
- Per-question stats calculation:
  ```
  FOR each question:
    solvedCount = COUNT(responses where marksAwarded > 0)
    solvedPercentage = (solvedCount / totalAttempts) * 100
    averageTimeSeconds = AVG(timeSpentSeconds)
    averageMarks = AVG(marksAwarded)
    difficulty = CASE
                   WHEN solvedPercentage > 80 THEN 'EASY'
                   WHEN solvedPercentage > 50 THEN 'MEDIUM'
                   ELSE 'HARD'
                 END
  ```
- Store in TestQuestionAnalysis table
- Use for curriculum feedback

---

#### **Story 15.5: Class and Student Performance Analytics**
**As a** backend system
**I want** to generate analytics across class and students
**So that** teachers have insight into overall performance

**Acceptance Criteria:**
- Given all results, When analyzed, Then class statistics calculated
- Given class stats, When computed, Then: average, highest, lowest, pass count
- Given student rank, When enabled, Then ranking within class calculated
- Given topper/bottom performers, When identified, Then flagged
- Given analytics, When stored, Then queryable for reports

**Technical Notes:**
- Class statistics:
  ```
  FOR each test:
    classAverage = AVG(percentage)
    classHighest = MAX(percentage)
    classLowest = MIN(percentage)
    classPassCount = COUNT(isPassed = true)
    classPassPercentage = (passCount / totalStudents) * 100

  FOR each student:
    studentRank = ROW_NUMBER() OVER (ORDER BY percentage DESC)
    percentileRank = PERCENT_RANK() OVER (ORDER BY percentage)
  ```
- Store in TestStatistics table
- Respect school policy for showing ranks

---

#### **Story 15.6: Batch Evaluation Job Execution**
**As a** backend system
**I want** to execute batch evaluation jobs reliably
**So that** all pending tests are evaluated without errors

**Acceptance Criteria:**
- Given evaluation trigger, When scheduled or manual, Then job starts
- Given job progress, When tracked, Then status visible (X% complete)
- Given job failure, When occurs, Then retry mechanism activated
- Given partial failure, When some items fail, Then others continue
- Given job completion, When done, Then completion timestamp recorded
- Given long-running job, When still processing, Then timeout not enforced

**Technical Notes:**
- Job execution via BullMQ:
  ```javascript
  const evaluationQueue = new Queue('test-evaluation', {
    connection: redis
  });

  evaluationQueue.process(async (job) => {
    // Process evaluation_queue entries
    // For each pending test:
    //   - Compare answers
    //   - Calculate score
    //   - Generate analytics
    //   - Update TestAttempt
    //   - Move to COMPLETED status
    // Update job.progress()
  });
  ```
- Concurrency: 5 jobs parallel (configurable)
- Timeout: 10 minutes per job
- Retry: 3 times with exponential backoff
- Logging: Info, warn, error levels

---

#### **Story 15.7: Results Publishing**
**As a** backend system
**I want** to mark results as ready for viewing
**So that** students can access their scores

**Acceptance Criteria:**
- Given evaluation complete, When all students graded, Then results marked PUBLISHED
- Given publish time, When recorded, Then timestamp stored
- Given student notification, When results published, Then push notification sent
- Given results access, When published, Then students can view scores
- Given solutions release, When enabled, Then solutions visible post-publish

**Technical Notes:**
- TestAttempt.status: EVALUATED → PUBLISHED
- TestAttempt.publishedAt: timestamp
- Push notification: Via Firebase FCM
- Notification content: "Your test results are ready!"
- Solution visibility: Controlled by test.showCorrectAnswers and test.showSolutions
- Optional delay: Can delay solution visibility (e.g., 24 hours)

---

### **EPIC 16: Backend API Extensions for Mobile**

#### **Story 16.1: Mobile Test Download API**
**As a** mobile app
**I want** efficient endpoint to download test packages
**So that** I can get all test data offline

**Acceptance Criteria:**
- Given authenticated request, When to download endpoint, Then auth verified
- Given test access, When checked, Then student has permission to download
- Given response, When returned, Then includes metadata and download URL
- Given file integrity, When provided, Then checksum included
- Given response time, When measured, Then < 2 seconds for metadata

**Endpoint Specification:**
```
POST /api/v1/mobile/tests/download/{testId}

REQUEST:
{
  "deviceId": "device-uuid",
  "appVersion": "1.0.0"
}

RESPONSE:
{
  "success": true,
  "data": {
    "testId": "test-123",
    "title": "Physics Final Exam",
    "totalQuestions": 150,
    "totalMarks": 100,
    "duration": 180,
    "startTime": "2025-03-15T09:00:00Z",
    "endTime": "2025-03-15T12:00:00Z",
    "downloadUrl": "https://cdn.example.com/tests/test-123-bundle.zip",
    "fileSize": 47382528,
    "checksum": "sha256:abc123...",
    "metadata": {
      "questions": 150,
      "mediaCount": 45,
      "mediaSize": 35000000,
      "solutionsIncluded": true
    }
  },
  "error": null
}
```

**Technical Notes:**
- Authentication: JWT bearer token required
- Access control: Check student enrollment or test assignment
- Rate limiting: 10 downloads/hour per student
- Response time target: < 2 seconds
- Compression: ZIP file, pre-compressed
- Signing: Generate signed URL with 24-hour expiry
- CDN: Serve from Cloudflare R2 via CDN

---

#### **Story 16.2: Mobile Test Sync API**
**As a** mobile app
**I want** endpoint to submit test responses
**So that** my answers are saved on server

**Acceptance Criteria:**
- Given encrypted responses, When sent, Then received and stored
- Given signature verification, When checked, Then authenticity confirmed
- Given idempotency, When attempted twice, Then same response returned
- Given server validation, When responses checked, Then integrity verified
- Given acknowledgment, When sent, Then client confirms receipt

**Endpoint Specification:**
```
POST /api/v1/mobile/tests/{testId}/sync

REQUEST:
{
  "deviceId": "device-uuid",
  "studentId": "student-id",
  "attemptId": "attempt-uuid",
  "submittedAt": "2025-03-15T12:05:00Z",
  "timeTakenSeconds": 1800,
  "responses": [
    {
      "questionId": "q1",
      "selectedOptions": ["a"],
      "responseText": null,
      "timeSpentSeconds": 45,
      "isFlagged": false
    }
    // ... 150 responses
  ],
  "clientChecksum": "sha256:xyz789...",
  "signature": "hmac-sha256-signature"
}

RESPONSE:
{
  "success": true,
  "data": {
    "attemptId": "attempt-uuid",
    "syncedAt": "2025-03-15T12:06:00Z",
    "acknowledgment": {
      "responsesReceived": 150,
      "checksum": "sha256:server-hash",
      "verified": true
    },
    "status": "QUEUED_FOR_EVALUATION"
  },
  "error": null
}
```

**Technical Notes:**
- Authentication: JWT required
- Payload size: Max 5MB (compressed)
- Encryption: Responses encrypted in transit (HTTPS)
- Signature: HMAC-SHA256 of payload for integrity
- Idempotency: Using attemptId as key
- Rate limiting: 5 syncs/minute per student
- Response time: < 3 seconds
- Storage: Save to test_responses table immediately
- Queuing: Add to evaluation_queue table

---

#### **Story 16.3: Test Status and Sync History API**
**As a** mobile app
**I want** to check test sync status and history
**So that** I know which tests are synced and pending

**Acceptance Criteria:**
- Given query, When status checked, Then returns all test sync statuses
- Given synced tests, When listed, Then shows completed and evaluated
- Given pending tests, When listed, Then shows awaiting sync
- Given sync history, When requested, Then shows attempt details and timestamps

**Endpoint Specification:**
```
GET /api/v1/mobile/tests/sync-status

RESPONSE:
{
  "success": true,
  "data": {
    "tests": [
      {
        "testId": "test-123",
        "title": "Physics Exam",
        "attemptId": "attempt-123",
        "status": "SYNCED",
        "submittedAt": "2025-03-15T12:00:00Z",
        "syncedAt": "2025-03-15T12:05:00Z",
        "score": 85.5,
        "percentage": 85.5,
        "grade": "A"
      },
      {
        "testId": "test-124",
        "title": "Chemistry Quiz",
        "attemptId": "attempt-124",
        "status": "PENDING_SYNC",
        "submittedAt": "2025-03-16T10:00:00Z",
        "syncedAt": null,
        "lastSyncAttempt": "2025-03-16T10:05:00Z",
        "lastSyncError": "Network timeout"
      }
    ]
  }
}
```

**Technical Notes:**
- Authentication: JWT required
- Data: Pull from TestAttempt with join to TestStatistics
- Status values: PENDING_SYNC, SYNCING, SYNCED, FAILED
- Return only tests belonging to authenticated student
- Include sync error details for pending tests

---

#### **Story 16.4: Solutions Download API**
**As a** mobile app
**I want** to download solutions after results published
**So that** I can review correct answers offline

**Acceptance Criteria:**
- Given test with published results, When solutions requested, Then downloadable
- Given solution access, When checked, Then allowed if: published + solutions enabled
- Given download, When triggered, Then encrypted solution file returned
- Given solutions, When loaded, Then searchable and reviewable

**Endpoint Specification:**
```
GET /api/v1/mobile/tests/{testId}/solutions

RESPONSE:
{
  "success": true,
  "data": {
    "testId": "test-123",
    "downloadUrl": "https://cdn.example.com/tests/test-123-solutions.zip",
    "fileSize": 5242880,
    "checksum": "sha256:..."
  }
}
```

**Technical Notes:**
- Authentication: JWT required
- Access control: Only if test results published and student took test
- Encryption: Solutions encrypted in transit and at rest
- File: Contains HTML with explanations and images
- Caching: OK to cache locally with version check

---

#### **Story 16.5: Compression and Optimization for Mobile**
**As a** backend
**I want** to optimize API responses for mobile
**So that** bandwidth usage is minimized

**Acceptance Criteria:**
- Given API response, When returned, Then gzipped by default
- Given file download, When package created, Then compressed (ZIP)
- Given images, When included in questions, Then optimized (max 2MP)
- Given videos, When in download, Then transcoded to mobile-friendly (480p)
- Given response size, When measured, Then < 500KB for metadata, < 100MB for full test

**Technical Notes:**
- HTTP compression: gzip/brotli enabled
- Resource optimization:
  - Images: JPEG 75% quality, max 1080x1080 pixels
  - Videos: H.264 codec, 480p, 1000 kbps bitrate
  - PDF: Embed subset fonts, remove unnecessary objects
- Lazy loading: Download media only when accessed
- File format: ZIP for bundling (35-50MB typical)

---

### **EPIC 17: Security, Integrity & Cheating Prevention**

#### **Story 17.1: Device Locking and Registration**
**As a** security system
**I want** to lock tests to specific devices
**So that** test can't be shared across devices

**Acceptance Criteria:**
- Given device first download, When test downloaded, Then device registered
- Given second device, When test accessed, Then prevented unless authorized
- Given device check, When test launched, Then deviceId verified
- Given device mismatch, When detected, Then test access denied
- Given device replacement, When allowed by admin, Then device can be changed

**Technical Notes:**
- DeviceId: Fingerprint of device (MAC, hardware IDs, etc.)
- Generate once and stored in encrypted SharedPreferences
- Test locked to original download device
- Can't transfer to another device
- Optional admin override for legitimate cases (lost device)
- Log all device access attempts

---

#### **Story 17.2: Watermarking and Metadata**
**As a** security system
**I want** to embed student identity in downloadable content
**So that** test materials can be traced

**Acceptance Criteria:**
- Given question download, When embedded in app, Then student ID watermarked
- Given media files, When included, Then metadata with studentId added
- Given download timestamp, When recorded, Then included in metadata
- Given tamper detection, When attempted, Then watermark verification fails

**Technical Notes:**
- Watermark embedded in: question text (footer), image metadata (EXIF), video (burnt-in overlay)
- Metadata: studentId, classId, testId, downloadedAt
- Hash-based verification: Can't modify without breaking
- Display: Subtle footer on each question: "Test for [StudentName] - [Date]"
- Purpose: Deter sharing; helps identify source if leaked

---

#### **Story 17.3: Response Encryption and Signing**
**As a** security system
**I want** to encrypt and sign test responses
**So that** tampering is detected and data protected

**Acceptance Criteria:**
- Given response, When prepared, Then encrypted with student's device key
- Given signature, When generated, Then HMAC of encrypted payload
- Given server-side verification, When checked, Then signature matches
- Given tampering attempt, When signature fails, Then response rejected
- Given decryption, When server receives, Then response successfully decrypted

**Technical Notes:**
- Encryption: AES-256-GCM per response
- Key: Device-specific, not transmitted
- Signature: HMAC-SHA256 of (encrypted_data + timestamp)
- GCM mode: Provides both encryption and authentication
- Server: Verifies signature before decryption
- Rejection: Log attempt and notify security team

---

#### **Story 17.4: App Foreground Detection**
**As a** security system
**I want** to detect if student switches apps during test
**So that** suspicious activity is logged

**Acceptance Criteria:**
- Given app backgrounded, When timer should pause, Then flag recorded
- Given detection, When switch detected, Then logged with timestamp
- Given frequent switches, When pattern detected, Then flagged for review
- Given result display, When switches visible, Then teachers informed

**Technical Notes:**
- Lifecycle detection: onPause/onResume
- Log each backgrounding event with timestamp
- Track: number of switches, duration away, app switched to
- Flagging: > 5 switches = suspicious (admin configurable)
- Display: In test review for teacher: "Student switched apps 7 times"
- Warning message: "Test is paused, return to complete"
- Timestamp: All logged for audit trail

---

#### **Story 17.5: Integrity Verification**
**As a** security system
**I want** to verify test integrity throughout
**So that** corrupted or tampered test is detected

**Acceptance Criteria:**
- Given test download, When complete, Then all files verified
- Given app launch, When test loaded, Then database integrity checked
- Given suspicious pattern, When detected, Then exam invalidated
- Given checksum mismatch, When found, Then error reported
- Given database tampering, When detected, Then attempt logged and blocked

**Technical Notes:**
- Download verification: SHA256 checksums per file
- Database verification: CRC or SQLCipher integrity check
- Question tampering: Hash of original questions stored, compared on load
- Timeline verification: Submit time must match attempt timing (can't answer all instantly)
- Flagging: If < 10 seconds per question average = suspicious
- Error handling: Show "Test integrity error" and disable submission

---

#### **Story 17.6: Server-Side Validation**
**As a** security system
**I want** to validate all responses on server
**So that** even locally manipulated responses are caught

**Acceptance Criteria:**
- Given response received, When saved, Then original questions compared
- Given answer validity, When checked, Then compared against valid options
- Given option mismatch, When detected, Then response invalidated
- Given timing anomaly, When detected, Then flagged for review
- Given impossible sequence, When detected, Then logged and reviewed

**Technical Notes:**
- Validation checks:
  ```
  1. Student has permission to take test
  2. Test is open (within start/end time)
  3. Question options match original
  4. Answers are from valid options (not injected)
  5. Total time reasonable (not too fast for all questions)
  6. Device lock verified
  7. Signature is valid
  ```
- Flagging criteria:
  - Average < 5 sec/question = suspicious
  - Time submitted = time in response = device clock (check for fakery)
  - Answers match exactly to leaked key = suspicious
- Action: Mark for manual review, don't fail student but flag

---

#### **Story 17.7: Anomaly Detection**
**As a** security system
**I want** to detect unusual patterns in test submissions
**So that** potential cheating is identified

**Acceptance Criteria:**
- Given test results, When analyzed, Then compared to student's baseline
- Given performance jump, When detected, Then flagged (e.g., 30→95%)
- Given answer pattern, When analyzed, Then compared to class
- Given identical answers, When found between students, Then flagged
- Given flagged submission, When reviewed, Then teachers notified

**Technical Notes:**
- Baseline: Average of student's previous test scores
- Detection thresholds:
  - Score jump: > 40% improvement = review
  - Class pattern: Same answers as other student > 60% = review
  - Speed anomaly: 50% faster than usual = review
  - Time shift: Submitted at different time than typical = review
- Flagging: Stored in FraudFlag table for admin review
- Action: Don't fail student, but mark for manual review
- Privacy: Don't show flags to students

---

### **EPIC 18: Performance & Infrastructure Scaling**

#### **Story 18.1: Database Connection Pooling**
**As a** platform operator
**I want** proper connection pooling configured
**So that** database connections are reused efficiently

**Acceptance Criteria:**
- Given app startup, When connections pooled, Then pool created
- Given request, When database access needed, Then connection from pool used
- Given idle connection, When not needed, Then released to pool
- Given concurrent load, When high, Then pool scales gracefully
- Given pool limit, When reached, Then new requests queued (not failed)

**Technical Notes:**
- Current issue: Prisma default = 10 connections
- Required: Increase to 100-150 connections
- Configuration: `connection_limit` parameter in DATABASE_URL
- Example: `postgresql://user:pass@host/db?schema=public&connection_limit=150`
- Monitoring: Track pool utilization via Prisma metrics
- Max wait: 30 seconds for connection (then timeout)

---

#### **Story 18.2: Redis Cluster Setup**
**As a** platform operator
**I want** Redis properly configured for production
**So that** caching is reliable and performant

**Acceptance Criteria:**
- Given Redis connection, When established, Then connection pooling enabled
- Given write operation, When key set, Then cached with TTL
- Given read operation, When key requested, Then returned from cache
- Given cache miss, When key not found, Then falls back to database
- Given connection failure, When redis down, Then graceful degradation

**Technical Notes:**
- Current issue: Redis degraded (not working)
- Fix needed:
  ```javascript
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    lazyConnect: false,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  ```
- Caching strategy:
  - Test data: 1 hour cache
  - Student data: 30 minute cache
  - Question bank: 24 hour cache
  - Session data: Variable TTL

---

#### **Story 18.3: Query Optimization**
**As a** backend developer
**I want** database queries optimized
**So that** response times are fast

**Acceptance Criteria:**
- Given N+1 query pattern, When identified, Then refactored to single query
- Given query load, When tested, Then < 500ms for typical operations
- Given result set, When large, Then paginated (max 100 items)
- Given index, When missing, Then added for common filters
- Given join, When complex, Then analyzed for optimization

**Technical Notes:**
- Current issue: Multiple sequential queries for test loading
- Optimization example:
  ```prisma
  // BEFORE (N+1):
  const test = await prisma.onlineTest.findUnique({ where: { id: testId } });
  const questions = await prisma.testQuestion.findMany({ where: { testId } });
  for (const tq of questions) {
    const q = await prisma.question.findUnique({ where: { id: tq.questionId } });
  }

  // AFTER (Single query):
  const test = await prisma.onlineTest.findUnique({
    where: { id: testId },
    include: {
      testQuestions: {
        include: {
          question: {
            include: {
              options: true,
            }
          }
        }
      }
    }
  });
  ```
- Database indexes: Add on testId, studentId, attemptId columns

---

#### **Story 18.4: API Response Caching**
**As a** backend developer
**I want** API responses cached
**So that** repeated requests don't hit database

**Acceptance Criteria:**
- Given cacheable endpoint, When called, Then response cached
- Given subsequent calls, When made within TTL, Then cached response returned
- Given cache invalidation, When data changes, Then cache purged
- Given cache hit rate, When measured, Then > 70% for read endpoints
- Given stale data, When TTL expired, Then fresh data fetched

**Technical Notes:**
- Cacheable endpoints:
  - `GET /api/v1/tests/{id}` - 1 hour cache
  - `GET /api/v1/questions?filters=...` - 30 min cache
  - `GET /api/v1/students/{id}` - 15 min cache
- Cache key: `{endpoint}:{params}:{schoolId}`
- Invalidation:
  - On test edit: Purge all test related keys
  - On question update: Purge question bank cache
  - On schedule: Full cache refresh every 6 hours
- Library: Redis with node-cache or redis-cache-manager

---

#### **Story 18.5: Load Balancing Setup**
**As a** platform operator
**I want** load balancer distributing requests
**So that** no single server is overwhelmed

**Acceptance Criteria:**
- Given multiple backend instances, When deployed, Then load balanced
- Given request distribution, When load balanced, Then even across instances
- Given instance failure, When detected, Then requests routed away
- Given session persistence, When required, Then sticky sessions enabled
- Given health checks, When failing, Then instance removed from pool

**Technical Notes:**
- Load balancer: Nginx or HAProxy (open source) or AWS ALB/NLB
- Setup:
  ```nginx
  upstream backend {
    least_conn;  # Least connections algorithm
    server backend-1:5000;
    server backend-2:5000;
    server backend-3:5000;
    server backend-4:5000;
    server backend-5:5000;
  }
  ```
- Health check: `/health/ready` endpoint (50s interval, 2 failures → remove)
- Sticky sessions: Via cookie or IP hash
- Scaling: Add/remove instances dynamically

---

#### **Story 18.6: Kubernetes Auto-Scaling**
**As a** platform operator
**I want** Kubernetes auto-scaling configured
**So that** app scales with demand

**Acceptance Criteria:**
- Given high CPU usage, When threshold exceeded, Then pods added
- Given high memory usage, When threshold exceeded, Then pods added
- Given low load, When sustained, Then extra pods removed
- Given scaling delay, When configured, Then respects cooldown period
- Given scale limits, When set, Then min/max respected

**Technical Notes:**
- Metrics for scaling:
  - CPU: Scale when > 70% for 2 minutes
  - Memory: Scale when > 80% for 2 minutes
  - Custom: Sync queue length > 100
- Configuration:
  ```yaml
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: backend-hpa
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: backend
    minReplicas: 3
    maxReplicas: 10
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  ```
- Scaledown: 3-5 minute cooldown

---

#### **Story 18.7: Monitoring and Alerting**
**As a** platform operator
**I want** comprehensive monitoring and alerting
**So that** issues are detected and resolved quickly

**Acceptance Criteria:**
- Given metrics collected, When time-series stored, Then queryable
- Given alert threshold, When breached, Then alert sent
- Given alert, When critical, Then page on-call engineer
- Given dashboard, When accessed, Then real-time metrics shown
- Given logs, When aggregated, Then searchable and filterable

**Technical Notes:**
- Metrics to monitor:
  - Request latency (p50, p95, p99)
  - Request volume (requests/sec)
  - Error rate (%)
  - Database pool utilization
  - Redis connection health
  - Sync queue length
  - CPU/Memory/Disk usage
- Tools:
  - Prometheus: Metrics collection
  - Grafana: Dashboards
  - AlertManager: Alert routing
  - ELK/Datadog: Log aggregation
- Alerts:
  - Latency > 2s (warning), > 5s (critical)
  - Error rate > 1% (warning), > 5% (critical)
  - Queue length > 1000 (warning)
  - Sync failures > 10% (warning)

---

## 📊 EPIC SUMMARY TABLE

| # | Epic | Focus Area | Priority | Dependencies |
|---|------|-----------|----------|--------------|
| 11 | Mobile App Foundation | App infrastructure | P0 | - |
| 12 | Test Download & Sync | Download mechanism | P0 | Epic 11 |
| 13 | Offline Test-Taking | Test execution | P0 | Epic 12 |
| 14 | Response Sync | Data synchronization | P0 | Epic 13 |
| 15 | Batch Evaluation | Results processing | P0 | Epic 14 |
| 16 | Backend API Extensions | Mobile APIs | P0 | Epic 6, 7, 8 |
| 17 | Security & Integrity | Fraud prevention | P1 | Epic 11-14 |
| 18 | Performance & Scaling | Infrastructure | P1 | Epic 15, 16 |

---

## 🎯 IMPLEMENTATION SEQUENCE

### **Phase 1: Foundation (Weeks 1-4)**
- Epic 11: Mobile app foundation
- Epic 16: Backend API endpoints

### **Phase 2: Offline Test-Taking (Weeks 5-8)**
- Epic 12: Test download mechanism
- Epic 13: Offline test engine

### **Phase 3: Sync & Evaluation (Weeks 9-12)**
- Epic 14: Response sync
- Epic 15: Batch evaluation

### **Phase 4: Security & Scale (Weeks 13-16)**
- Epic 17: Security features
- Epic 18: Performance & scaling

---

## 📋 STORIES COUNT SUMMARY

```
Epic 11: Mobile App Foundation        → 7 stories
Epic 12: Test Download & Sync         → 6 stories
Epic 13: Offline Test-Taking          → 7 stories
Epic 14: Response Sync                → 7 stories
Epic 15: Batch Evaluation             → 7 stories
Epic 16: Backend API Extensions       → 5 stories
Epic 17: Security & Integrity         → 7 stories
Epic 18: Performance & Scaling        → 7 stories
─────────────────────────────────────────────────
TOTAL NEW STORIES:                    53 stories

COMBINED WITH EXISTING EPICS 1-10:   100+ stories total
```

---

## 🔍 KEY DESIGN DECISIONS

1. **Offline-First Priority**: All test data downloaded before test
2. **No Internet During Test**: Test proceeds completely offline
3. **Async Sync**: Responses sync when internet available
4. **Batch Processing**: Evaluation happens in batches, not real-time
5. **Device Locking**: Test locked to original download device
6. **Encryption**: All responses encrypted before sync
7. **Fault Tolerance**: Automatic retry with exponential backoff
8. **Horizontal Scaling**: Stateless design allows load balancing

---

**Status**: PLANNING ONLY - NO DEVELOPMENT STARTED
**Last Updated**: 2025-12-27
**Next Step**: Review epics with team, clarify requirements, estimate effort
