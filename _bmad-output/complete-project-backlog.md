---
title: "School ERP + Mobile Offline App - Complete Project Backlog"
version: "2.0.0"
date: 2025-12-27
status: "PLANNING PHASE - NO DEVELOPMENT"
---

# 📋 COMPLETE PROJECT BACKLOG
## School ERP Platform + Offline-First Mobile App

---

## 🎯 PROJECT OVERVIEW

**Total Scope**: 2 integrated systems
1. **Web Platform** (Existing + Enhanced): School ERP with all academic features
2. **Mobile App** (NEW): Offline-first Android app for tests

**Combined Story Count**: 150+ user stories across 18 epics

---

## 📊 BACKLOG STRUCTURE

### **EXISTING WEB PLATFORM (Epics 1-10)**

| # | Epic | Stories | Status | Effort |
|---|------|---------|--------|--------|
| 1 | Infrastructure & Multi-tenancy | 8 | Partially Done | Medium |
| 2 | Authentication & User Management | 8 | Partially Done | Medium |
| 3 | Academic Structure & Configuration | 6 | To Do | Large |
| 4 | Student Information & Enrollment | 6 | To Do | Large |
| 5 | Attendance Management | 6 | To Do | Medium |
| 6 | Question Bank & AI Document Parser | 6 | Partially Done | Large |
| 7 | Examination & Assessment | 7 | Partially Done | Large |
| 8 | Results, Grades & Report Cards | 6 | Partially Done | Large |
| 9 | Fee Management & Payments | 8 | To Do | Large |
| 10 | Communication & Notifications | 7 | To Do | Large |

**Web Platform Total**: ~68 stories

---

### **NEW MOBILE OFFLINE APP (Epics 11-18)**

| # | Epic | Stories | Priority | Focus |
|---|------|---------|----------|-------|
| 11 | Mobile App Foundation | 7 | P0 | App infrastructure, SQLite, storage |
| 12 | Test Download & Sync | 6 | P0 | Download mechanism, compression, integrity |
| 13 | Offline Test-Taking | 7 | P0 | Test engine, timer, media rendering |
| 14 | Response Sync | 7 | P0 | Background sync, queue, retry logic |
| 15 | Batch Evaluation | 7 | P0 | Answer comparison, scoring, analytics |
| 16 | Backend API Extensions | 5 | P0 | Mobile-specific endpoints |
| 17 | Security & Integrity | 7 | P1 | Device lock, encryption, cheating prevention |
| 18 | Performance & Scaling | 7 | P1 | Connection pooling, Redis, load balancing |

**Mobile App Total**: ~53 stories

---

## 🚀 FEATURE MATRIX

### **Web Platform Features**

```
TIER 1: CORE (MVP)
├─ Authentication (8 features)
│  ├─ Multi-role login
│  ├─ Bulk user import
│  ├─ Parent-student linking
│  ├─ Role-based permissions
│  └─ Password reset
│
├─ Academic Management (10 features)
│  ├─ Academic year setup
│  ├─ Class & section configuration
│  ├─ Subject management
│  ├─ Teacher-subject mapping
│  └─ Academic calendar
│
├─ Student Management (8 features)
│  ├─ Student profiles
│  ├─ Enrollment workflow
│  ├─ Class assignment
│  ├─ Document vault
│  └─ Promotion/demotion
│
├─ Attendance (6 features)
│  ├─ Daily marking
│  ├─ Leave management
│  ├─ Reports & analytics
│  └─ Parent notifications
│
├─ Examination (15 features)
│  ├─ Question bank
│  ├─ AI document parser
│  ├─ Online test builder
│  ├─ Auto-grading
│  ├─ Assignment builder
│  └─ Plagiarism detection
│
├─ Results & Grades (6 features)
│  ├─ Marks entry
│  ├─ Grade calculation
│  ├─ Report cards
│  └─ Performance dashboard
│
├─ Fee Management (8 features)
│  ├─ Fee structure
│  ├─ Online payments (Razorpay/Stripe)
│  ├─ Invoices & receipts
│  ├─ Discounts/scholarships
│  └─ Financial reports
│
└─ Communication (7 features)
   ├─ Announcements
   ├─ Push notifications
   ├─ SMS/Email integration
   ├─ In-app messaging
   └─ Emergency alerts

TIER 2: EXTENDED (Post-MVP)
├─ Staff & HR Management (10 features)
├─ Transport Management (10 features)
├─ Library Management (8 features)
├─ Hostel Management (8 features)
└─ Inventory & Assets (6 features)

TIER 3: ADVANCED (Future)
├─ Document Intelligence (12 features)
├─ Multilingual Engine (10 features)
└─ Advanced Analytics (10 features)
```

### **Mobile App Features**

```
CORE FUNCTIONALITY
├─ Local Data Storage
│  ├─ Encrypted SQLite database
│  ├─ Media file caching
│  └─ Biometric authentication
│
├─ Test Download
│  ├─ Optimized ZIP packages
│  ├─ Resumable downloads
│  ├─ Lazy media loading
│  └─ Integrity verification
│
├─ Offline Test-Taking
│  ├─ Full question navigation
│  ├─ Timer management
│  ├─ Answer saving
│  ├─ Media rendering (images, videos)
│  └─ Flag/review marking
│
├─ Response Sync
│  ├─ Background sync service
│  ├─ Auto-retry with backoff
│  ├─ Conflict resolution
│  ├─ Encryption before send
│  └─ Offline queue management
│
├─ Results Management
│  ├─ Score viewing
│  ├─ Solution review (when published)
│  ├─ Analytics dashboard
│  └─ Performance trends
│
└─ Security
   ├─ Device locking
   ├─ Watermarking
   ├─ Signature verification
   ├─ Foreground detection
   └─ Anomaly detection
```

---

## 💾 DATABASE & API OVERVIEW

### **New Database Tables (Mobile)**

```sql
-- SQLite Local (Mobile Device)
├─ Students
├─ DownloadedTests
├─ TestQuestions
├─ TestPassages
├─ StudentResponses
├─ TestAttempts
├─ MediaCache
├─ SyncQueue
└─ AppMetadata

-- PostgreSQL (Server)
├─ evaluation_queue
├─ TestStatistics
├─ QuestionAnalysis
├─ FraudFlags
├─ DeviceRegistration
└─ SyncLogs
```

### **New API Endpoints**

```
Mobile-Specific Endpoints:
├─ POST /api/v1/mobile/tests/download/{testId}
├─ POST /api/v1/mobile/tests/{testId}/sync
├─ GET /api/v1/mobile/tests/sync-status
├─ GET /api/v1/mobile/tests/{testId}/solutions
└─ GET /api/v1/mobile/health/offline
```

---

## 📈 SCALE IMPROVEMENT COMPARISON

### **Current Architecture**
```
10,000 Concurrent Students Taking Test:
├─ Server Load: CRITICAL ❌
├─ Concurrent Requests: All 10,000 hitting server
├─ Response Time: 2-5 seconds (slow)
├─ Server CPU: 100% (crashed)
├─ Database Connections: Exhausted
├─ Failed Requests: 95%
└─ User Experience: Unacceptable ❌
```

### **With Offline App**
```
10,000 Concurrent Students Taking Test:
├─ Server Load: ZERO ✅
├─ Concurrent Requests: Only sync requests (background)
├─ Response Time: <100ms (instant, local)
├─ Server CPU: 5% (idle)
├─ Database Connections: < 10
├─ Failed Requests: 0% (retries handled gracefully)
└─ User Experience: Excellent ✅

Results Evaluation (1 hour later):
├─ Server Load: Batch processing (controlled)
├─ Concurrent Sync Requests: 100-200 (manageable)
├─ Analytics: Generated via batch jobs
├─ Time to Results: 1-2 hours
└─ Teacher Load: Reduced (no real-time pressure)
```

---

## 🎯 IMPLEMENTATION TIMELINE

### **Phase 0: Current State**
- ✅ Basic web platform structure
- ✅ Study planner (partial)
- ✅ Test taking (web-based)
- ⚠️ Performance issues at 10K concurrent
- ⚠️ Real-time result generation pressure

### **Phase 1: Foundation (Weeks 1-4)**
**Focus**: Build mobile app infrastructure
- Epic 11: Mobile app setup
  - Android project structure
  - SQLite encrypted database
  - Media management
  - Biometric authentication
- Epic 16a: API design
  - Download endpoint
  - Sync endpoint
  - Status endpoints

**Deliverable**: Blank app that can store data locally
**Test**: Can save/load test metadata from SQLite

---

### **Phase 2: Offline Test-Taking (Weeks 5-8)**
**Focus**: Enable full offline test experience
- Epic 12: Download mechanism
  - ZIP package creation
  - Resumable downloads
  - Lazy loading
  - Integrity verification
- Epic 13: Test engine
  - Question loading
  - Navigation
  - Answer saving
  - Timer management

**Deliverable**: App that can take pre-downloaded tests offline
**Test**: Download test, go offline, take test, submit locally

---

### **Phase 3: Synchronization (Weeks 9-12)**
**Focus**: Response sync to server
- Epic 14: Sync mechanism
  - Background sync service
  - Encryption & signing
  - Retry logic
  - Conflict resolution
- Epic 15: Batch evaluation
  - Answer comparison
  - Scoring
  - Analytics calculation
  - Report generation

**Deliverable**: End-to-end offline to results
**Test**: Submit 1000 tests offline, sync, verify results

---

### **Phase 4: Security & Scale (Weeks 13-16)**
**Focus**: Hardening and scaling
- Epic 17: Security
  - Device locking
  - Cheating detection
  - Watermarking
  - Integrity checks
- Epic 18: Performance
  - Connection pooling
  - Redis caching
  - Load balancing
  - Auto-scaling

**Deliverable**: Production-ready system
**Test**: 10,000 concurrent students, successful completion

---

## 💡 KEY ARCHITECTURAL DECISIONS

### **Why Offline-First?**
1. **Eliminates server bottleneck** during exams
2. **Better user experience** (instant responses)
3. **Scales infinitely** (no server load)
4. **Works anywhere** (no internet needed)
5. **Reduces stress** on backend

### **Why Batch Evaluation?**
1. **No real-time pressure** on server
2. **Time for detailed analytics** generation
3. **Better insights** for teachers
4. **Reduced latency** for student results
5. **Can process offline** or during non-peak hours

### **Why Device Locking?**
1. **Prevents test sharing** between devices
2. **Ensures test integrity** per student
3. **Tracks suspicious** activity easily
4. **Simplifies** accountability

### **Why Encryption?**
1. **Protects student data** in transit
2. **Prevents tampering** of responses
3. **Ensures authenticity** via signatures
4. **Complies with** data protection laws

---

## 📊 EFFORT ESTIMATION

### **Story Point Distribution**

```
SMALL (3 points): ~30 stories
├─ Simple CRUD operations
├─ UI components
└─ Configuration

MEDIUM (5 points): ~70 stories
├─ Feature development
├─ Integration work
└─ Testing

LARGE (8 points): ~35 stories
├─ Complex features
├─ Architecture changes
└─ Performance optimization

XLARGE (13 points): ~15 stories
├─ Major systems
├─ Infrastructure
└─ Advanced security

TOTAL STORY POINTS: ~650 points
```

### **Team Velocity & Timeline**

```
Team Size: 8 developers
Velocity: 80 points/2-week sprint

Sprints Needed: 650 / 80 = ~8.1 sprints
Timeline: 16 weeks (4 months)

With 5 developers: 10.4 sprints (5 months)
With 10 developers: 6.5 sprints (3 months)
```

---

## 🎓 TECHNOLOGY STACK SUMMARY

### **Mobile (Android)**
- Language: Kotlin
- Architecture: MVVM + Clean Architecture
- UI: Jetpack Compose
- Database: Room ORM + SQLCipher
- Networking: Retrofit + OkHttp
- Background: WorkManager
- Authentication: BiometricPrompt
- Media: Glide, ExoPlayer
- DI: Hilt

### **Backend (Enhancements)**
- Runtime: Node.js/Express (existing)
- Database: PostgreSQL (existing)
- Caching: Redis (to fix)
- Job Queue: BullMQ (existing)
- API: REST with JSON
- Load Balancer: Nginx/HAProxy (new)
- Scaling: Kubernetes (new)
- Monitoring: Prometheus + Grafana (new)

### **Infrastructure**
- Containerization: Docker
- Orchestration: Kubernetes
- Storage: Cloudflare R2 (S3-compatible)
- CDN: Cloudflare
- Database: PostgreSQL managed
- Caching: Redis managed
- CI/CD: GitHub Actions

---

## ✅ ACCEPTANCE CRITERIA FOR MVP

### **Web Platform MVP**
- [ ] Users can register/login with roles (Admin, Teacher, Student, Parent)
- [ ] Admin can setup academic year and classes
- [ ] Teachers can create and manage tests
- [ ] Students can take tests online
- [ ] Attendance can be marked daily
- [ ] Parents receive notifications
- [ ] Reports are available (basic)

### **Mobile App MVP**
- [ ] Android app can download tests
- [ ] Student can take tests completely offline
- [ ] Responses can be submitted and synced
- [ ] Results show after evaluation
- [ ] Basic security: device lock, encryption
- [ ] 1,000 concurrent students successfully synced
- [ ] No network failures due to overload

### **Integration MVP**
- [ ] Web and mobile platforms communicate via APIs
- [ ] Data consistency maintained
- [ ] Offline and online flows work together
- [ ] Performance targets met (< 500ms API response)

---

## 🚨 CRITICAL RISKS & MITIGATION

| Risk | Severity | Mitigation |
|------|----------|-----------|
| SQLite schema versioning issues | HIGH | Plan migrations upfront, test on old versions |
| Media sync failures | HIGH | Implement retries, local caching, user feedback |
| Device fingerprinting not unique | MEDIUM | Use combination of methods, fallback to user verification |
| Encryption key loss | HIGH | Store encrypted keys in SharedPreferences, backup mechanism |
| Large file downloads on slow networks | MEDIUM | Implement resumable downloads, size warnings |
| Answer tampering detection false positives | MEDIUM | Generous thresholds, manual review for edge cases |
| Database connection pool exhaustion | HIGH | Implement connection pooling, load testing |
| Real-time evaluation bottleneck resurfaces | MEDIUM | Stick to batch processing, monitoring alerts |

---

## 📋 SUCCESS METRICS

```
Performance:
├─ App load time: < 2 seconds
├─ Test navigation: < 100ms per page
├─ Sync time: < 30 seconds for 100 responses
├─ API response time: < 500ms (p95)
└─ Offline functionality: 100% available without internet

Reliability:
├─ Sync success rate: > 99.9%
├─ Response retention: 100% (no data loss)
├─ Test completion rate: > 99%
└─ Uptime: 99.9% (planned downtime excluded)

Scalability:
├─ Handle 10,000+ concurrent test takers
├─ Process 1,000 syncs/minute
├─ Evaluate 10,000 tests in 1 hour
└─ Store 1GB of test data per school

Security:
├─ Zero successful cheating attempts detected
├─ 100% of responses encrypted
├─ Device locking: 100% enforced
└─ Audit trail: 100% logged

User Experience:
├─ Student satisfaction: > 4.5/5 stars
├─ Teacher workload reduction: > 40%
├─ Parent engagement: > 60% active users
└─ Zero lost submissions due to technical issues
```

---

## 📝 NEXT STEPS

1. **Team Review** (1 day)
   - Present epics and stories to team
   - Gather feedback and clarifications
   - Identify blockers

2. **Detailed Planning** (1 week)
   - Break down Phase 1 stories into tasks
   - Create detailed technical designs
   - Estimate story points per team member

3. **Infrastructure Setup** (2 weeks)
   - Set up Android development environment
   - Create CI/CD pipeline
   - Prepare database schema

4. **Sprint 1 Kickoff** (Week 1)
   - Begin Epic 11: Mobile App Foundation
   - Begin Epic 16: Backend API Design
   - Daily standups and progress tracking

---

## 📚 DOCUMENTATION DELIVERABLES

```
_bmad-output/
├─ epics.md                              (Existing - Epics 1-10)
├─ mobile-offline-epics.md              (NEW - Epics 11-18)
├─ complete-project-backlog.md          (THIS FILE)
├─ architecture.md                       (Updated for mobile)
├─ database-schema.md                    (Extended for mobile)
├─ api-endpoints.md                      (NEW - Mobile endpoints)
├─ security-plan.md                      (NEW - Cheating prevention)
├─ implementation-timeline.md            (NEW - 16-week plan)
└─ technical-specifications.md           (Updated)
```

---

**Document Status**: PLANNING PHASE ONLY
**No development has started**
**Last Updated**: 2025-12-27
**Ready for**: Team review and refinement

