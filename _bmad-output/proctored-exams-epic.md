---
title: "Proctored Exams System - Epic & Stories"
version: "1.0.0"
date: 2025-12-27
status: "PLANNING ONLY - NO DEVELOPMENT"
---

# 🎥 EPIC 19: PROCTORED EXAMS SYSTEM
## Real-time Monitoring & Anti-Cheating

---

## 📋 OVERVIEW

**Goal:** Enable real-time proctoring of exams to prevent cheating and ensure integrity

**User Outcome:** Teachers can monitor students live; students' exams are recorded with integrity verification

**Scope:** Both web and mobile platforms
- **Web**: Teachers monitor test-taking in real-time
- **Mobile**: Students take proctored tests with camera/microphone active

**Complexity**: HIGH (involves audio/video, real-time streaming, AI detection)

---

## 🎯 PROCTORING ARCHITECTURE

### **Proctoring Flow**

```
STUDENT SIDE:
├─ Test starts
├─ Permission requests: Camera, Microphone
├─ Face detection: Verifies student identity
├─ Video capture: Starts recording
├─ Screen monitoring: Tracks device activity
├─ Continuous checks: Face presence, eye movement, etc.
└─ Test ends → Video uploaded

TEACHER SIDE:
├─ Live monitoring dashboard
├─ View student video feeds (grid view)
├─ Watch active/idle students
├─ Receive alerts (suspicious activity)
├─ Record all monitoring for review
└─ Generate proctoring report

SERVER SIDE:
├─ Video streaming (WebRTC/HLS)
├─ Face detection (AI model)
├─ Suspicious activity detection
├─ Video storage (S3/R2)
├─ Activity logging
└─ Alert triggering
```

### **Monitoring Points**

```
VIDEO/AUDIO:
├─ Face visibility (must stay on camera)
├─ Eye contact (looking at screen, not away)
├─ Head position (normal, not tilted)
├─ Multiple faces (prevent proxying)
├─ Background activity (others entering room)

DEVICE:
├─ App in foreground (not switching apps)
├─ Only test window visible
├─ No screen recording/casting (except proctor)
├─ No external displays connected
├─ No other apps running

BEHAVIORAL:
├─ Unusual answer patterns
├─ Too fast completion time
├─ Long pauses (suspicious thinking)
├─ Multiple tabs open (impossible)
├─ Copy-paste attempts

NETWORK:
├─ VPN usage (flag suspicious)
├─ IP changes during exam
├─ Packet inspection (detect remote control)
```

---

## 📝 STORIES

### **EPIC 19: PROCTORED EXAMS SYSTEM**

#### **Story 19.1: Camera and Microphone Activation**
**As a** student
**I want** to enable camera and microphone for proctored test
**So that** the test can be monitored and recorded

**Acceptance Criteria:**
- Given test marked as proctored, When started, Then permission requests shown
- Given camera permission, When granted, Then camera feed displays in corner
- Given microphone permission, When granted, Then audio input confirmed
- Given permission denied, When user denies, Then clear explanation shown
- Given permissions denied, When both rejected, Then test cannot start with warning
- Given camera feed, When displayed, Then 15 FPS minimum quality
- Given microphone, When active, Then audio levels shown as indicator

**Technical Notes:**
- Permissions: CAMERA, RECORD_AUDIO (Android)
- Library: CameraX for camera, MediaRecorder for audio
- Preview: Small corner window (not obstructing test)
- Fallback: If no camera, can use web cam requirement message
- Persistent: Keep recording until test submitted
- Quality: H.264 video codec, AAC audio

---

#### **Story 19.2: Face Detection and Verification**
**As a** security system
**I want** to detect and verify student's face throughout test
**So that** same student remains present during entire exam

**Acceptance Criteria:**
- Given test start, When face detected, Then verified against enrolled face
- Given enrollment photo, When compared, Then similarity score calculated (>90% match required)
- Given multiple faces, When detected, Then immediately flagged for review
- Given no face detected, When absent > 30 seconds, Then warning shown to student
- Given repeated warnings, When ignored, Then test paused and alert sent
- Given face away, When looking away > 15 seconds, Then logged as suspicious
- Given valid detection, When face present and focused, Then continue normally

**Technical Notes:**
- Face detection: ML Kit Face Detection API or similar
- Face enrollment: Store face embedding (not full image for privacy)
- Similarity: Face recognition model (e.g., FaceNet, ArcFace)
- Matching threshold: > 90% for acceptance
- Spoofing prevention: Liveness check (blink detection, smile)
- Processing: Local on device (not sent to server)
- Logging: Track face presence at 5-second intervals

---

#### **Story 19.3: Video Recording and Storage**
**As a** system
**I want** to record video of test-taking session
**So that** evidence is available for review if needed

**Acceptance Criteria:**
- Given test starts, When proctored, Then video recording begins
- Given recording, When ongoing, Then stored locally first (backup)
- Given test ends, When submitted, Then video uploaded to server
- Given upload failure, When network error, Then retry automatically
- Given upload success, When completed, Then stored in secure location
- Given video duration, When test 3 hours, Then stored without compression loss
- Given privacy, When stored, Then encrypted and access-controlled
- Given retention, When result published, Then video kept for 90 days minimum

**Technical Notes:**
- Recording: MediaRecorder or FFmpeg
- Format: MP4 with H.264 video, AAC audio
- Bitrate: 2-3 Mbps (balance quality and size)
- Storage local: Device cache while test in progress
- Upload: Split into 10-minute chunks, resume on failure
- Server storage: Cloudflare R2 encrypted
- Access: Only teacher/admin of that school, encrypted URLs
- Retention: Delete after 90 days (configurable per school policy)
- Size estimate: 3-hour test = 2.5-3.5 GB

---

#### **Story 19.4: Eye Gaze and Attention Monitoring**
**As a** security system
**I want** to monitor where student is looking
**So that** cheating via external materials is detected

**Acceptance Criteria:**
- Given eye position, When detected, Then tracked relative to screen
- Given gaze focus, When on test area, Then recorded as normal
- Given gaze away, When looking away > 10 seconds, Then flagged (soft warning)
- Given repeated gaze away, When > 5 times, Then escalated alert
- Given eye closure, When > 5 seconds, Then flagged as suspicious
- Given gaze pattern, When unusual, Then analyzed for cheating signals
- Given alert threshold, When exceeded, Then teacher notified

**Technical Notes:**
- Eye tracking: ML Kit Eye Detector or GazeML
- Accuracy: Works best with good lighting
- Tracking frequency: Every 500ms
- Thresholds:
  - Gaze away: 10 seconds = soft warning to student
  - Closed eyes: 5 seconds = flag for review
  - Head tilted: > 30 degrees = suspicious
- Fallback: If eye tracking fails, use head position instead
- Privacy: Local processing, no eye data sent to server
- Limitation: May fail with glasses or poor lighting

---

#### **Story 19.5: Head Position and Posture Detection**
**As a** security system
**I want** to monitor student's head position
**So that** unusual movements (passing answer sheet) are detected

**Acceptance Criteria:**
- Given head position, When monitored, Then normal upright position expected
- Given head tilt, When > 30 degrees, Then flagged as suspicious
- Given head down, When for > 5 seconds, Then warning shown
- Given head turned away, When > 20 degrees off screen, Then suspicious
- Given posture changes, When rapid, Then logged for pattern analysis
- Given repetitive head movement, When detected, Then potential signal flagged

**Technical Notes:**
- Detection: Pose estimation ML Kit or MediaPipe
- Keypoints: Detect face landmarks and head orientation
- Thresholds:
  - Tilt angle: > 30 degrees = suspicious
  - Turn angle: > 20 degrees from camera = red flag
  - Down position: > 5 seconds = flag
- Frequency: Check every 500ms
- Pattern analysis: Multiple rapid turns = potential signal communication
- Logging: Store all movements for forensic review

---

#### **Story 19.6: Background and Environment Monitoring**
**As a** security system
**I want** to monitor test environment for suspicious activity
**So that** external assistance is detected

**Acceptance Criteria:**
- Given background, When visible, Then scanned for other people
- Given other face, When detected in background, Then flagged immediately
- Given object appearance, When suspicious item detected, Then flagged
- Given environment change, When lights/background changes, Then logged
- Given room scan, When before test start, Then optional room verification
- Given phone/device visibility, When detected, Then flagged suspicious

**Technical Notes:**
- People detection: Object detection (YOLO or SSD)
- Suspicious objects: Books, papers, phones, laptops in background
- Initial scan: Room scan via 360° camera sweep before test
- Continuous monitoring: Detect any new people entering frame
- Alert threshold: Any person in background = immediate alert
- Exceptions: Family members (configurable per school)
- False positives: Adjust sensitivity for shared spaces (libraries, homes)

---

#### **Story 19.7: Real-time Proctoring Dashboard (Teacher)**
**As a** teacher
**I want** to monitor students taking the test in real-time
**So that** I can observe suspicious behavior and intervene

**Acceptance Criteria:**
- Given test in progress, When opened by teacher, Then student video feeds shown
- Given video grid, When displayed, Then all test-takers visible (10-20 per page)
- Given student click, When selected, Then full-screen view with stats
- Given suspicious alert, When triggered, Then highlighted/flagged in red
- Given alert history, When viewed, Then timeline of all alerts shown
- Given student interaction, When clicked, Then can send text/audio warning
- Given recording, When active, Then status indicator shown to student
- Given exam ended, When all students finish, Then recording stops

**Technical Notes:**
- Dashboard: Real-time video grid view
- Video streaming: WebRTC for low-latency or HLS for fallback
- Grid view: 4x5 (20 students max per view, pagination available)
- Full-screen view: Selected student with:
  - Large video
  - Alert timeline
  - Answer stats
  - Face detection status
  - Eye gaze visualization
  - Posture indicators
- Controls:
  - Send warning message (text appears on student screen)
  - Send audio announcement
  - Flag for review
  - End session (forcefully stop student)
- Connection quality: Show video quality indicator
- Bandwidth: Optimize for 2-4 Mbps per student feed

---

#### **Story 19.8: Student Alerts and Warnings**
**As a** student
**I want** to see alerts if my behavior is suspicious
**So that** I can correct and continue test

**Acceptance Criteria:**
- Given suspicious activity, When detected, Then warning message shown
- Given warning message, When displayed, Then clear and actionable (e.g., "Face not visible - look at camera")
- Given soft warning, When shown, Then doesn't pause test
- Given repeated warnings, When > 3 times, Then test paused with message
- Given hard pause, When teacher manually pauses, Then test stops and message shown
- Given resume option, When teacher allows, Then student can continue
- Given audio announcement, When sent by teacher, Then plays clearly with notification

**Technical Notes:**
- Warning levels:
  - Level 1 (Info): Onscreen message, no pause
  - Level 2 (Caution): Visible warning + audio beep
  - Level 3 (Critical): Test paused, requires teacher to resume
- Messages: Pre-written templates
  - "Face not visible - look at camera"
  - "Multiple faces detected - ensure you're alone"
  - "You looked away - focus on test"
  - "Suspicious activity detected - exam under review"
- Tone: Non-accusatory, helpful, supportive
- Display: 10-second timeout on warnings

---

#### **Story 19.9: Suspicious Activity Detection**
**As a** security system
**I want** to detect and flag unusual patterns
**So that** potential cheating is identified

**Acceptance Criteria:**
- Given answer pattern, When compared to class average, Then outliers detected
- Given timing, When too fast for complexity, Then flagged
- Given gaze pattern, When unusual (looking away frequently), Then flagged
- Given network anomaly, When detected (VPN, proxy), Then flagged
- Given device anomaly, When detected (rooted, emulator), Then flagged
- Given combination factors, When multiple flags, Then escalated to critical
- Given flagged session, When reviewed, Then teacher can see all flags with evidence

**Technical Notes:**
- Detection triggers:
  ```
  Answer too fast:
  ├─ Average time per question < 10 seconds = flag
  ├─ Baseline: Compare to student's previous tests
  └─ All correct + fastest = double flag

  Gaze patterns:
  ├─ Looking away > 50% of time = flag
  ├─ Sudden gaze changes = flag
  └─ Focused on one corner = flag (possible cheat sheet)

  Device:
  ├─ Root detected = block
  ├─ Emulator detected = flag
  ├─ VPN = flag
  └─ USB debugging = flag

  Network:
  ├─ IP change mid-test = flag
  ├─ Packet loss > 10% = suspicious
  └─ Connection unstable = log for review
  ```
- Scoring: 0-100 confidence score per flag
- Aggregation: Total risk score determines action
- Escalation: Risk > 80 = auto-flag for manual review

---

#### **Story 19.10: Proctoring Report and Review**
**As a** admin
**I want** to review proctoring records and generate reports
**So that** I can identify cheating and take action

**Acceptance Criteria:**
- Given flagged exam, When reviewed, Then video and alert timeline visible
- Given video playback, When played, Then shows timeline with flags marked
- Given specific flag, When clicked, Then video seeks to that moment
- Given timestamp, When shown, Then correlates with answer submission time
- Given comparison, When viewed, Then can compare with class/other students
- Given verdict, When made, Then can mark as CLEAN/SUSPICIOUS/INVALID
- Given report, When generated, Then summary with statistics exported
- Given appeal, When student contests, Then evidence easily reviewable

**Technical Notes:**
- Review interface:
  - Left: Video player with timeline and flags
  - Right: Alert list with timestamps
  - Center: Test answers and response times
  - Synchronized playback of all three
- Comparison views:
  - Similar answers from other students
  - Answer patterns over time
  - Gaze patterns vs answer correctness
- Flagging system:
  - CLEAN: No suspicious activity
  - MINOR: 1-2 minor flags, likely false positives
  - SUSPICIOUS: 3+ flags or 1 major flag
  - CONFIRMED: Definitive evidence of cheating
- Report template:
  - Student name, exam, date
  - Alert summary (count by type)
  - Key moments (with video links)
  - Risk assessment
  - Recommendation

---

#### **Story 19.11: Liveness Detection (Anti-Spoofing)**
**As a** security system
**I want** to ensure the face is real (not photo/video)
**So that** student identity is authentic

**Acceptance Criteria:**
- Given face detected, When liveness checked, Then must pass anti-spoofing
- Given photo/screenshot, When used as fake, Then rejected
- Given video replay, When attempted, Then detected and rejected
- Given blink requirement, When needed, Then student must blink
- Given expression, When varied, Then must show natural expressions
- Given depth detection, When available, Then 3D face required (not 2D image)

**Technical Notes:**
- Liveness checks:
  - Blink detection: Require genuine eye closure
  - Head movement: Require head rotation
  - Smile: Require genuine smile
  - Eye tracking: Eyes follow object motion
- Detection method:
  - Texture analysis: Real face has texture, photo is flat
  - Motion analysis: Real movement vs static/replayed
  - Depth sensing: If device has depth camera, use it
  - Frequency analysis: Detect if video pattern (24/30 fps)
- False positive rate: Keep < 5% (genuine users accepted)
- False negative rate: Keep < 1% (block fake attempts)
- Fallback: If liveness fails, require manual review by proctor

---

#### **Story 19.12: Test Environment Verification**
**As a** proctor
**I want** student to verify their test environment
**So that** physical setup is appropriate

**Acceptance Criteria:**
- Given room scan, When requested before test, Then student rotates camera 360°
- Given video capture, When recorded, Then saved with exam for review
- Given prohibited items, When visible, Then alert shown (e.g., "Books detected")
- Given approval, When satisfied, Then teacher can approve or require cleanup
- Given room change, When environment changes mid-exam, Then alert triggered
- Given final scan, When test ending, Then room scan repeated to verify

**Technical Notes:**
- Room scan process:
  1. Student starts test
  2. Shown instructions: "Scan your entire room, show desk, no books/devices visible"
  3. Camera records 20-30 seconds of room panorama
  4. AI scans for suspicious items
  5. Proctor reviews and approves/rejects
- Prohibited items detection:
  - Books: Detect if visible
  - Papers: Multiple sheets flagged
  - Phones: Obvious red flag
  - Laptops: Monitor/keyboard visible = flag
  - Multiple displays: Only one allowed
- Approval workflow:
  - Auto-approve if no items found
  - Proctor reviews if items detected
  - Can ask student to clear workspace and re-scan

---

#### **Story 19.13: WebRTC Streaming for Live Proctoring**
**As a** backend
**I want** low-latency video streaming to proctors
**So that** real-time monitoring is possible

**Acceptance Criteria:**
- Given student camera, When streaming, Then latency < 500ms
- Given teacher dashboard, When opened, Then receives live stream
- Given connection stable, When maintained, Then continuous feed
- Given connection unstable, When lost, Then attempts auto-reconnect
- Given multiple students, When viewed, Then manages multiple streams
- Given bandwidth limited, When detected, Then quality adapts

**Technical Notes:**
- Technology: WebRTC for peer-to-peer low latency
- Server role: Signaling server for initial connection
- Streaming protocol: SRTP (Secure RTP)
- Codec: VP8 or H.264
- Bitrate: 1-2 Mbps per stream (adaptive)
- Video resolution: 480p or 720p depending on bandwidth
- Audio: AAC 64 kbps
- Latency target: < 500ms (real-time acceptable)
- Fallback: HLS for web, lower quality but more compatible
- Server: TURN server for NAT traversal (if P2P fails)

---

#### **Story 19.14: Consent and Legal Compliance**
**As a** system
**I want** student to consent to proctoring
**So that** legal and privacy requirements met

**Acceptance Criteria:**
- Given proctored test, When about to start, Then consent form shown
- Given form content, When displayed, Then clearly explains what is recorded
- Given agreement required, When consent needed, Then cannot proceed without
- Given consent scope, When provided, Then specifies: video, audio, screen
- Given right to decline, When applicable, Then option to take non-proctored version
- Given saved consent, When recorded, Then timestamp and signature stored
- Given GDPR, When applicable, Then right to delete video after grade published
- Given data retention, When specified, Then shown to student upfront

**Technical Notes:**
- Consent form template:
  ```
  EXAM PROCTORING CONSENT

  This exam is proctored. By clicking "I Agree", you consent to:

  ✓ Video recording of your face and upper body
  ✓ Audio recording of sound in your environment
  ✓ Screen/device monitoring for suspicious activity
  ✓ Real-time monitoring by proctors
  ✓ Recording storage for 90 days for review if needed

  Your data will be:
  - Encrypted in transit and at rest
  - Accessible only to teachers/admins of your school
  - Deleted 90 days after exam completion

  You have the right to:
  - Request video deletion after result is final
  - Know if suspicious activity was detected
  - Appeal any cheating findings

  [ I Agree ]  [ Decline & Take Non-Proctored Test ]
  ```
- Storage: Consent record with timestamp and student signature
- GDPR: Keep audio/video only if necessary, delete on request
- Jurisdiction: Adapt to local laws (COPPA for US children, etc.)

---

#### **Story 19.15: Proctoring Analytics and Statistics**
**As a** admin
**I want** analytics on proctoring across school
**So that** I can understand cheating patterns

**Acceptance Criteria:**
- Given all exams, When analyzed, Then statistics calculated
- Given flags per exam, When summed, Then percentage of students with flags shown
- Given common flags, When identified, Then top cheating methods listed
- Given false positive rate, When calculated, Then helps calibrate thresholds
- Given comparative stats, When compared, When help identify problematic exams
- Given trend, When tracked over time, Then shows if cheating increasing/decreasing
- Given export, When requested, Then statistics available as report

**Technical Notes:**
- Metrics:
  ```
  Per exam:
  ├─ Total test-takers
  ├─ Students flagged (count, %)
  ├─ Common flags (face away, suspicious speed, etc.)
  ├─ Average flag count per student
  └─ Confirmed cheating rate (% of flagged with evidence)

  Per student:
  ├─ Exams taken with proctoring
  ├─ Times flagged
  ├─ Conviction rate (% of flags that were actual cheating)
  └─ Pattern (improving vs consistent)

  By flag type:
  ├─ Face not visible: count, %
  ├─ Gaze away: count, %
  ├─ Multiple people: count, %
  ├─ Suspicious speed: count, %
  └─ Pattern unusual: count, %
  ```
- Dashboard: Charts showing trends and breakdowns
- Comparison: Exam to exam, class to class
- Export: CSV/PDF report with all statistics

---

## 🎯 PROCTORING MODES

### **Mode 1: Live Proctoring (Real-time)**
```
Teacher watches student LIVE during test
├─ Best for: High-stakes exams, competitive exams
├─ Cost: Higher (need proctors per exam)
├─ Latency: < 500ms (real-time)
├─ Intervention: Can warn/pause student immediately
├─ Evidence: Video stream recorded
└─ Recommendation: National exams, university entrance
```

### **Mode 2: Recorded Proctoring (Asynchronous)**
```
Student test recorded, teacher reviews if flagged
├─ Best for: School exams, unit tests
├─ Cost: Lower (batch review possible)
├─ Review time: Later, not real-time
├─ Intervention: Via review, not during test
├─ Evidence: Full video recording available
└─ Recommendation: Regular school exams
```

### **Mode 3: AI Proctoring (Automated)**
```
AI detects suspicious activity, alerts teacher
├─ Best for: Online courses, assignments
├─ Cost: Lowest (fully automated)
├─ Detection: Real-time alerts via ML
├─ Intervention: Teacher reviews and decides
├─ Evidence: Automated detection + video
└─ Recommendation: Practice tests, formative assessments
```

---

## 🔒 PRIVACY SAFEGUARDS

```
DATA COLLECTION:
├─ Consent: Explicit consent before recording
├─ Scope: Limited to what's necessary for proctoring
├─ Transparency: Clear about what's recorded and used
└─ Purpose: Only for exam integrity, not other uses

DATA STORAGE:
├─ Encryption: AES-256 at rest, TLS in transit
├─ Access: Only authorized teachers/admins
├─ Segregation: Stored separately from exam answers
├─ Location: Secure cloud (Cloudflare R2)
└─ Retention: Delete after 90 days default

DATA DELETION:
├─ Automatic: Delete 90 days post-exam
├─ On-request: Student can request deletion
├─ Post-result: Can delete when result is final
├─ GDPR-compliant: Right to be forgotten
└─ Audit trail: Log of what was deleted

FAIRNESS:
├─ False positives: Don't base verdict solely on automated flags
├─ Appeal process: Students can appeal cheating findings
├─ Context: Flags show suspicious activity, not proof
├─ Manual review: Human reviews video for context
└─ Leniency: First-time minor violations may not be punished
```

---

## 📊 IMPLEMENTATION CONSIDERATIONS

### **Bandwidth Requirements**
```
Per student:
├─ Video stream: 2-4 Mbps (during test)
├─ Audio stream: 64 kbps
├─ Metadata/logs: 1 kbps
├─ Total: ~2.1-4.1 Mbps per student

For 100 concurrent students:
├─ Total: 210-410 Mbps (incoming to server)
├─ Storage (1 hour): 900 GB - 1.8 TB
├─ 3-hour exam: 2.7-5.4 TB per exam
└─ Monthly (10 exams): 27-54 TB

Cost implications:
├─ Bandwidth: AWS/Azure regional: ~$0.02/GB = $540-1080 per exam
├─ Storage: R2: ~$0.015/GB month = $810-1620 per month
└─ Estimated monthly: $2000-3500 for proctoring infrastructure
```

### **Computational Requirements**
```
ML Models (per student):
├─ Face detection: 5% CPU
├─ Eye tracking: 8% CPU
├─ Pose estimation: 5% CPU
├─ Object detection: 10% CPU
└─ Total per device: ~28% CPU (manageable)

Server-side processing:
├─ Video encoding/transcoding: GPU needed
├─ Face recognition: GPU needed
├─ Alert logic: CPU
└─ Recommendation: GPU instance (AWS g4dn or similar)
```

### **Device Compatibility**
```
REQUIREMENTS:
├─ Camera: Front-facing, minimum 2MP
├─ Microphone: Working audio input
├─ Processor: Qualcomm 660 or better
├─ RAM: 4GB minimum (6GB recommended)
├─ Storage: 1GB free space for video buffer
├─ Network: 5+ Mbps upload (for streaming)
├─ Screen: 5.5"+ recommended for test readability

TESTING NEEDED:
├─ Low-end devices: Snapdragon 665, 4GB RAM
├─ Poor lighting: What is minimum lighting needed?
├─ Weak network: How to degrade gracefully?
├─ Glasses/sunglasses: Fails face detection?
├─ Disabilities: Accessible for all users?
```

---

## 🚀 ROLLOUT STRATEGY

### **Phase 1: Pilot (Week 1-2)**
```
Scope: Limited to specific class/exam
├─ Teachers: 2-3 volunteering teachers
├─ Students: 20-30 students
├─ Mode: Recorded proctoring (less pressure)
├─ Feedback: Gather issues and improve
└─ Success metric: 95% tests completed without technical issues
```

### **Phase 2: Soft Launch (Week 3-4)**
```
Scope: Expand to school level
├─ Teachers: All interested teachers
├─ Students: All class 10+ (can opt-in to live proctoring)
├─ Mode: Recorded + AI alerts
├─ Support: Technical support team on call
└─ Success metric: 99% completion, <5% technical issues
```

### **Phase 3: Full Rollout (Week 5+)**
```
Scope: All exams with optional proctoring
├─ Teachers: All
├─ Students: All
├─ Mode: Choice of: Live, Recorded, or Non-proctored
├─ Policies: Clear school policies on usage
└─ Success metric: Adoption rate >80%, cheating incidents down
```

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Privacy concerns** | HIGH | Clear consent, GDPR compliance, data deletion |
| **Technical failures** (camera crash) | HIGH | Fallback non-proctored option, retry mechanisms |
| **False positive cheating accusations** | HIGH | Manual review, appeal process, evidence required |
| **Bandwidth limitations** | MEDIUM | Adaptive quality, prioritize video over audio |
| **Student anxiety** (watched during test) | MEDIUM | Education, clear guidelines, reassurance |
| **Device incompatibility** | MEDIUM | Minimum device specs, fallback options |
| **Racial bias in face detection** | MEDIUM | Diverse training data, human review for edge cases |
| **Performance on low-end devices** | MEDIUM | Optimize models, off-device processing where possible |

---

## 📋 STORIES SUMMARY

```
Total Proctoring Stories: 15

Core Features (6):
├─ 19.1: Camera & Microphone activation
├─ 19.2: Face detection & verification
├─ 19.3: Video recording & storage
├─ 19.4: Eye gaze monitoring
├─ 19.5: Head position monitoring
└─ 19.6: Background monitoring

Teacher & Admin (4):
├─ 19.7: Proctoring dashboard (teacher)
├─ 19.10: Proctoring report & review (admin)
├─ 19.12: Test environment verification
└─ 19.15: Analytics & statistics

Student & Security (3):
├─ 19.8: Student alerts & warnings
├─ 19.9: Suspicious activity detection
└─ 19.11: Liveness detection

Infrastructure (2):
├─ 19.13: WebRTC streaming
└─ 19.14: Consent & legal compliance
```

---

## 🔄 INTEGRATION WITH EXISTING SYSTEMS

### **Integration with Epic 13 (Offline Test-Taking)**

```
CHALLENGE:
├─ Mobile app is OFFLINE
├─ Proctoring requires REAL-TIME video
└─ Conflict: Can't proctor offline tests

SOLUTION - DUAL MODE:
├─ Offline proctoring: NOT supported
│  └─ Mobile offline = non-proctored tests
├─ Online proctoring: Fully supported
│  └─ Web platform = proctored tests
└─ Policy:
   ├─ High-stakes exams: Proctored (online only)
   ├─ Regular exams: Optional proctoring (online)
   └─ Practice tests: No proctoring (online/offline)

IMPLEMENTATION:
├─ Test setup: Choose proctoring yes/no
├─ Mobile app: Rejects proctored tests in offline mode
├─ Web fallback: Web-based test for proctored exams
└─ Sync: Non-proctored mobile responses sync normally
```

### **Integration with Epic 7 (Exam Management)**

```
TEST SETUP:
├─ Exam creation: New field "Proctoring" (None/Recorded/Live)
├─ Proctoring config:
│  ├─ Live proctor assignments
│  ├─ Alert thresholds
│  └─ Environment requirements
└─ Student instructions: "This exam is proctored"

TEST EXECUTION:
├─ Test start: Show consent if proctored
├─ During test: Activate monitoring systems
├─ Real-time: Send alerts to teacher if live
└─ Submission: Upload video + responses

RESULT REVIEW:
├─ Automated: AI flags suspicious activity
├─ Manual: Teacher reviews flagged exams
├─ Decision: Mark clean or invalid
└─ Appeal: Student can request review
```

---

## 📚 TECHNICAL STACK FOR PROCTORING

```
CLIENT (Mobile):
├─ Camera: CameraX (AndroidX)
├─ Face detection: ML Kit Face Detection
├─ Pose estimation: MediaPipe
├─ Video encoding: MediaRecorder
├─ WebRTC: Peerjs or Android native
└─ Liveness: Local liveness detection SDK

SERVER:
├─ Video streaming: Kurento or Janus (WebRTC server)
├─ Face recognition: FaceNet or ArcFace (TensorFlow)
├─ Object detection: YOLO or SSD
├─ Video storage: Cloudflare R2 + transcoding
├─ Alert system: Real-time notifications
└─ Dashboard: WebRTC client + Socket.io

Infrastructure:
├─ GPU instances: For ML model inference
├─ CDN: For video delivery
├─ Load balancer: Distribute streaming load
├─ Message queue: For async processing
└─ Monitoring: Video quality, latency, errors
```

---

## ✅ ACCEPTANCE CRITERIA FOR MVP

```
CORE PROCTORING MVP:
✓ Students can enable camera/mic with consent
✓ Face detection verifies student identity
✓ Video records during test
✓ Teacher can view live feed (if live mode)
✓ Suspicious activities are flagged
✓ Video is stored securely
✓ Admin can review flagged exams
✓ No false accusations (evidence-based decisions)

QUALITY TARGETS:
✓ Video streaming latency < 500ms
✓ False positive rate < 5%
✓ False negative rate < 1%
✓ Detection accuracy > 90%
✓ 99.9% test completion despite monitoring

COMPLIANCE:
✓ GDPR compliant (consent, deletion)
✓ COPPA compliant (children's privacy)
✓ Video encrypted in transit and storage
✓ Access controlled (only authorized viewers)
✓ Audit trail of all access
```

---

## 📝 NEXT STEPS

1. **Review with school principals** - Is this acceptable at your school?
2. **Design consent forms** - Legal team approval
3. **Set school policies** - When/how to use proctoring
4. **Pilot testing** - Test with small group first
5. **Feedback iteration** - Improve based on experience
6. **Full deployment** - Roll out across school

---

**Status**: PLANNING ONLY - NO DEVELOPMENT
**Last Updated**: 2025-12-27
**Ready for**: Team discussion and school policy review
