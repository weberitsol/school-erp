---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/school-erp-prd.md"
  - "_bmad-output/architecture.md"
  - "_bmad-output/mobile-app-wireframes.md"
---

# school-erp - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for school-erp, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**TIER 1: CORE MODULES (MVP Priority)**

**IAM - Identity & Access Management (10 Features)**
- FR-IAM-001: Multi-role Authentication - Support for Admin, Teacher, Student, Parent, Staff roles [P0]
- FR-IAM-002: SSO Integration - Google, Microsoft, Apple sign-in [P1]
- FR-IAM-003: Role-based Permissions - Granular permission templates per role [P0]
- FR-IAM-004: Bulk User Import - CSV/Excel import for mass user creation [P0]
- FR-IAM-005: Parent-Student Linking - Multiple parents per student, multiple children per parent [P0]
- FR-IAM-006: Password Policies - Complexity rules, expiry, reset workflows [P1]
- FR-IAM-007: Session Management - Concurrent session control, force logout [P1]
- FR-IAM-008: Audit Logging - Track all authentication events [P0]
- FR-IAM-009: Two-Factor Authentication - OTP via SMS/Email, Authenticator app [P2]
- FR-IAM-010: Biometric Login (Mobile) - Fingerprint, Face ID support [P1]

**SIS - Student Information System (10 Features)**
- FR-SIS-001: Student Profile - Demographics, photo, contact, medical info [P0]
- FR-SIS-002: Enrollment Management - Application, admission, registration workflow [P0]
- FR-SIS-003: Class/Section Assignment - Bulk and individual student placement [P0]
- FR-SIS-004: Promotion/Demotion - Year-end processing with rules engine [P1]
- FR-SIS-005: Transfer Management - TC generation, inter-school transfers [P1]
- FR-SIS-006: Document Vault - Store ID proofs, certificates, medical records [P0]
- FR-SIS-007: Sibling Linking - Auto-detect and link siblings [P2]
- FR-SIS-008: Student Timeline - Complete history from admission to graduation [P2]
- FR-SIS-009: Custom Fields - School-defined additional attributes [P1]
- FR-SIS-010: GDPR Compliance - Data export, deletion requests, consent tracking [P1]

**ACD - Academic Management (10 Features)**
- FR-ACD-001: Academic Year Setup - Multiple years, terms, semesters [P0]
- FR-ACD-002: Class Configuration - Grades, sections, streams, batches [P0]
- FR-ACD-003: Subject Management - Core, elective, language subjects [P0]
- FR-ACD-004: Curriculum Builder - Syllabus, chapters, topics hierarchy [P1]
- FR-ACD-005: Timetable Generator - Auto-scheduling with constraints [P1]
- FR-ACD-006: Teacher-Subject Mapping - Assign teachers to subjects/classes [P0]
- FR-ACD-007: Lesson Planning - Weekly/daily lesson plans [P2]
- FR-ACD-008: Syllabus Tracking - Progress tracking against curriculum [P2]
- FR-ACD-009: Academic Calendar - Holidays, events, exam schedules [P0]
- FR-ACD-010: Multi-board Support - CBSE, ICSE, State boards, IB, Cambridge [P1]

**ATT - Attendance Management (10 Features)**
- FR-ATT-001: Daily Attendance - Class-wise, subject-wise attendance [P0]
- FR-ATT-002: QR Code Attendance - Student scans QR to mark presence [P2]
- FR-ATT-003: Biometric Integration - Fingerprint/face recognition devices [P2]
- FR-ATT-004: GPS Attendance (Mobile) - Location-verified mobile attendance [P3]
- FR-ATT-005: Bulk Attendance - Mark entire class present/absent [P0]
- FR-ATT-006: Leave Management - Student leave requests, approval workflow [P1]
- FR-ATT-007: Late Arrival Tracking - Track and report late comers [P1]
- FR-ATT-008: Attendance Reports - Daily, weekly, monthly, term-wise reports [P0]
- FR-ATT-009: Parent Notifications - Auto-alert on absence [P0]
- FR-ATT-010: Attendance Analytics - Trends, patterns, predictions [P2]

**EXM - Examination & Assessment (15 Features)**
- FR-EXM-001: Exam Setup - Exam types, schedules, seating plans [P0]
- FR-EXM-002: Online Test Builder - MCQ, subjective, mixed question types [P0]
- FR-EXM-003: Question Bank - Categorized, tagged, difficulty-rated questions [P0]
- FR-EXM-004: AI Document Parser - Upload PDF/Word → Extract questions automatically [P0]
- FR-EXM-005: Auto Question Generator - AI generates questions from parsed content [P1]
- FR-EXM-006: Assignment Builder - Create, distribute, collect assignments [P0]
- FR-EXM-007: Online Submission - Student uploads assignments digitally [P0]
- FR-EXM-008: Auto-grading - MCQ auto-evaluation with instant results [P1]
- FR-EXM-009: Rubric-based Grading - Structured grading criteria [P1]
- FR-EXM-010: Marks Entry - Subject-wise, exam-wise marks input [P0]
- FR-EXM-011: Grade Calculation - Configurable grading scales (A-F, GPA, %) [P0]
- FR-EXM-012: Report Card Generation - Customizable report card templates [P0]
- FR-EXM-013: Progress Tracking - Performance trends over time [P1]
- FR-EXM-014: Plagiarism Detection - Check assignment originality [P2]
- FR-EXM-015: Proctored Exams - Webcam monitoring for online exams [P3]

**FIN - Finance & Fees (15 Features)**
- FR-FIN-001: Fee Structure Builder - Class-wise, category-wise fee definition [P0]
- FR-FIN-002: Fee Categories - Tuition, transport, hostel, activities, etc. [P0]
- FR-FIN-003: Installment Plans - Flexible payment schedules [P1]
- FR-FIN-004: Discount/Scholarship - Sibling discount, merit scholarship, need-based [P1]
- FR-FIN-005: Online Payment - Razorpay, Stripe, PayPal integration [P0]
- FR-FIN-006: Invoice Generation - Auto-generate fee invoices [P0]
- FR-FIN-007: Receipt Management - Digital receipts, print support [P0]
- FR-FIN-008: Payment Reminders - Auto SMS/Email for due payments [P0]
- FR-FIN-009: Late Fee Calculation - Auto-apply late payment penalties [P1]
- FR-FIN-010: Refund Processing - Fee refund workflow [P2]
- FR-FIN-011: Expense Tracking - School expense management [P2]
- FR-FIN-012: Budget Management - Annual budget planning [P3]
- FR-FIN-013: Financial Reports - Collection, outstanding, projections [P0]
- FR-FIN-014: Tax Compliance - GST/Tax invoice generation [P1]
- FR-FIN-015: Audit Trail - Complete transaction history [P0]

**COM - Communication Hub (10 Features)**
- FR-COM-001: Announcements - School-wide, class-wise, role-based broadcasts [P0]
- FR-COM-002: Push Notifications - Real-time mobile alerts [P0]
- FR-COM-003: SMS Integration - Bulk SMS, transactional SMS [P0]
- FR-COM-004: Email Integration - Templated emails, bulk mailing [P0]
- FR-COM-005: In-app Messaging - Teacher-parent, teacher-student chat [P1]
- FR-COM-006: Notice Board - Digital notice board [P1]
- FR-COM-007: Circular Distribution - PDF circulars with read receipts [P1]
- FR-COM-008: Event Management - Create, invite, RSVP tracking [P2]
- FR-COM-009: Emergency Alerts - Priority notifications [P1]
- FR-COM-010: Communication History - Full audit trail of all communications [P1]

**TIER 2: EXTENDED MODULES**

**HR - Staff & HR Management (10 Features)**
- FR-HR-001: Staff Profiles - Personal, professional, qualification details [P1]
- FR-HR-002: Recruitment - Job posting, application tracking [P3]
- FR-HR-003: Onboarding - New employee setup workflow [P2]
- FR-HR-004: Staff Attendance - Biometric, manual attendance [P1]
- FR-HR-005: Leave Management - Leave types, balance, approval workflow [P1]
- FR-HR-006: Payroll Integration - Salary processing hooks [P2]
- FR-HR-007: Performance Reviews - Annual appraisal management [P3]
- FR-HR-008: Document Management - Contracts, certificates storage [P2]
- FR-HR-009: Training Records - Professional development tracking [P3]
- FR-HR-010: Exit Management - Resignation, clearance workflow [P3]

**TRN - Transport Management (10 Features)**
- FR-TRN-001: Vehicle Registry - Bus details, capacity, maintenance [P2]
- FR-TRN-002: Route Management - Define routes, stops, timings [P2]
- FR-TRN-003: Student-Route Mapping - Assign students to routes/stops [P2]
- FR-TRN-004: Driver Management - Driver profiles, license tracking [P2]
- FR-TRN-005: GPS Tracking - Real-time bus location [P2]
- FR-TRN-006: Parent Tracking App - Parents see live bus location [P2]
- FR-TRN-007: Pickup/Drop Alerts - Notify parents on arrival [P2]
- FR-TRN-008: Transport Fees - Separate transport fee management [P2]
- FR-TRN-009: Route Optimization - AI-suggested optimal routes [P3]
- FR-TRN-010: Incident Reporting - Log transport issues [P3]

**LIB - Library Management (8 Features)**
- FR-LIB-001: Book Catalog - ISBN, categories, metadata [P2]
- FR-LIB-002: Issue/Return - Track book lending [P2]
- FR-LIB-003: Fine Management - Overdue fine calculation [P2]
- FR-LIB-004: Reservation - Book reservation system [P3]
- FR-LIB-005: E-library - Digital books, PDFs [P2]
- FR-LIB-006: Barcode/RFID - Scan-based operations [P3]
- FR-LIB-007: Reading Lists - Teacher-curated book lists [P3]
- FR-LIB-008: Usage Analytics - Most borrowed, trending [P3]

**HST - Hostel Management (8 Features)**
- FR-HST-001: Room Allocation - Building, floor, room, bed mapping [P2]
- FR-HST-002: Student Assignment - Allocate students to rooms [P2]
- FR-HST-003: Mess Management - Meal planning, menu [P3]
- FR-HST-004: Visitor Management - Log visitor entries [P3]
- FR-HST-005: Leave/Outing - Permission for leaving hostel [P2]
- FR-HST-006: Hostel Attendance - Night attendance [P2]
- FR-HST-007: Hostel Fees - Separate hostel billing [P2]
- FR-HST-008: Complaint Management - Maintenance requests [P3]

**INV - Inventory & Assets (6 Features)**
- FR-INV-001: Asset Registry - All school assets tracking [P2]
- FR-INV-002: Stock Management - Consumables inventory [P3]
- FR-INV-003: Purchase Orders - Procurement workflow [P3]
- FR-INV-004: Vendor Management - Supplier database [P3]
- FR-INV-005: Maintenance Schedule - Asset maintenance tracking [P3]
- FR-INV-006: Depreciation - Asset value tracking [P3]

**TIER 3: AI & SMART MODULES**

**DOC - Document Intelligence (12 Features)**
- FR-DOC-001: PDF Parser - Extract text, tables from PDFs [P0]
- FR-DOC-002: Word Parser - Process .doc, .docx files [P0]
- FR-DOC-003: Image OCR - Extract text from images [P1]
- FR-DOC-004: Table Extraction - Identify and parse tables [P1]
- FR-DOC-005: Question Detection - Identify Q&A patterns in documents [P0]
- FR-DOC-006: Topic Classification - Auto-categorize by subject/chapter [P1]
- FR-DOC-007: Difficulty Scoring - AI-rate question difficulty [P2]
- FR-DOC-008: Answer Extraction - Extract answers if present [P1]
- FR-DOC-009: Multilingual OCR - Support for non-English documents [P1]
- FR-DOC-010: Batch Processing - Process multiple files at once [P1]
- FR-DOC-011: Manual Correction UI - Teacher can fix parsing errors [P0]
- FR-DOC-012: Learning Feedback Loop - Improve accuracy from corrections [P2]

**I18N - Multilingual Engine (10 Features)**
- FR-I18N-001: Language Selector - User-level language preference [P0]
- FR-I18N-002: RTL Support - Arabic, Hebrew, Urdu layout [P1]
- FR-I18N-003: Translation Management - Admin can edit translations [P1]
- FR-I18N-004: Dynamic Labels - All UI text from translation files [P0]
- FR-I18N-005: Offline Language Packs - Mobile app language downloads [P1]
- FR-I18N-006: Multi-script Support - Devanagari, Arabic, Chinese, etc. [P1]
- FR-I18N-007: Date/Time Localization - Regional formats [P1]
- FR-I18N-008: Currency Localization - Multi-currency support [P2]
- FR-I18N-009: Content Translation - AI-assisted content translation [P2]
- FR-I18N-010: Language Analytics - Usage by language [P3]

**RPT - Analytics & Reporting (10 Features)**
- FR-RPT-001: Dashboard Builder - Role-specific dashboards [P1]
- FR-RPT-002: Standard Reports - Pre-built common reports [P0]
- FR-RPT-003: Custom Report Builder - Drag-drop report creation [P2]
- FR-RPT-004: Export Formats - PDF, Excel, CSV exports [P0]
- FR-RPT-005: Scheduled Reports - Auto-generate and email [P2]
- FR-RPT-006: Performance Analytics - Student performance trends [P1]
- FR-RPT-007: Attendance Analytics - Patterns, predictions [P2]
- FR-RPT-008: Financial Analytics - Collection trends, projections [P1]
- FR-RPT-009: Comparative Analysis - Class vs class, year vs year [P2]
- FR-RPT-010: Predictive Insights - AI-powered predictions [P3]

**Total Functional Requirements: 134**

### Non-Functional Requirements

**NFR-PERF: Performance Requirements**
- NFR-PERF-001: Page Load Time < 2 seconds
- NFR-PERF-002: API Response Time < 500ms (95th percentile)
- NFR-PERF-003: Support 10,000+ concurrent users
- NFR-PERF-004: Document Parse Time < 30 seconds for 50-page PDF
- NFR-PERF-005: Mobile App Launch < 3 seconds

**NFR-SEC: Security Requirements**
- NFR-SEC-001: Data Encryption - AES-256 at rest, TLS 1.3 in transit
- NFR-SEC-002: Authentication - JWT + Refresh tokens
- NFR-SEC-003: Password Storage - bcrypt with salt
- NFR-SEC-004: SQL Injection Prevention - Parameterized queries, ORM
- NFR-SEC-005: XSS Prevention - Input sanitization, CSP headers
- NFR-SEC-006: CSRF Protection - Token-based validation
- NFR-SEC-007: Rate Limiting - API throttling per user/IP
- NFR-SEC-008: Audit Logging - All sensitive operations logged

**NFR-SCALE: Scalability Requirements**
- NFR-SCALE-001: Horizontal Scaling - Kubernetes auto-scaling
- NFR-SCALE-002: Database - Read replicas, sharding ready
- NFR-SCALE-003: File Storage - CDN-backed object storage
- NFR-SCALE-004: Caching - Redis cluster
- NFR-SCALE-005: Queue Processing - BullMQ for async jobs

**NFR-AVAIL: Availability Requirements**
- NFR-AVAIL-001: Uptime SLA - 99.9%
- NFR-AVAIL-002: RTO (Recovery Time) - < 1 hour
- NFR-AVAIL-003: RPO (Data Loss) - < 5 minutes
- NFR-AVAIL-004: Backup Frequency - Daily full, hourly incremental

**NFR-COMP: Compliance Requirements**
- NFR-COMP-001: GDPR (EU data protection)
- NFR-COMP-002: COPPA (Children's data - US)
- NFR-COMP-003: FERPA (Education records - US)
- NFR-COMP-004: India IT Act / DPDP Act
- NFR-COMP-005: SOC 2 Type II (target)

**Total Non-Functional Requirements: 23**

### Additional Requirements

**From Architecture Document:**

- ARCH-001: Multi-tenancy - Row-level isolation with schoolId on all tenant-scoped tables
- ARCH-002: Redis Integration - Required for caching, sessions, real-time pub/sub, rate limiting
- ARCH-003: Socket.io Setup - WebSocket with Redis adapter for real-time features
- ARCH-004: BullMQ Integration - Background job processing for PDF parsing, email, SMS, reports
- ARCH-005: Cloudflare R2 Storage - S3-compatible file storage with CDN delivery
- ARCH-006: Meilisearch Integration - Full-text search for question bank (100K+ questions)
- ARCH-007: Expo Push Notifications - Mobile push notification backend
- ARCH-008: API Response Format - Standardized { success, data, error, pagination } format
- ARCH-009: Class-based Controllers/Services - Singleton pattern for all backend modules
- ARCH-010: Prisma Middleware - Automatic schoolId filtering for multi-tenancy

**From UX/Wireframes Document:**

- UX-001: RTL Layout Support - Full right-to-left layout for Arabic, Urdu, Hebrew
- UX-002: Offline Mode Indicators - Visual feedback for offline state
- UX-003: Gesture Support - Swipe gestures for attendance marking
- UX-004: High Contrast Mode - Accessibility mode for visually impaired
- UX-005: Animation Specifications - Micro-interactions as per wireframe specs
- UX-006: Minimum Touch Target - 48dp minimum for all interactive elements
- UX-007: Screen Reader Support - Proper ARIA labels and semantic markup
- UX-008: Bottom Navigation - Tab-based navigation for mobile apps
- UX-009: Role-specific Color Accents - Visual differentiation by user role

**From Integration Requirements:**

- INT-001: Razorpay Payment Gateway - India market
- INT-002: Stripe Payment Gateway - Global market
- INT-003: Twilio/MSG91 SMS - SMS notifications
- INT-004: SendGrid/AWS SES Email - Email notifications
- INT-005: Firebase FCM - Push notifications
- INT-006: WhatsApp Business API - WhatsApp messaging
- INT-007: Biometric Device API - Hardware integration

**Total Additional Requirements: 26**

### FR Coverage Map

| Requirement | Epic | Description |
|-------------|------|-------------|
| ARCH-001, ARCH-002, ARCH-004, ARCH-010, NFR-SCALE-* | Epic 1 | Infrastructure & Multi-tenancy |
| FR-IAM-001 to FR-IAM-010, NFR-SEC-* | Epic 2 | Authentication & User Management |
| FR-ACD-001 to FR-ACD-010, FR-HR-001 | Epic 3 | Academic Structure & Configuration |
| FR-SIS-001 to FR-SIS-010, UX-001 to UX-009 | Epic 4 | Student Information & Enrollment |
| FR-ATT-001 to FR-ATT-010 | Epic 5 | Attendance Management |
| FR-DOC-001 to FR-DOC-012, FR-EXM-003 to FR-EXM-005, ARCH-006 | Epic 6 | Question Bank & AI Document Parser |
| FR-EXM-001, FR-EXM-002, FR-EXM-006 to FR-EXM-009, FR-EXM-014, FR-EXM-015 | Epic 7 | Examination & Assessment |
| FR-EXM-010 to FR-EXM-013, FR-RPT-001, FR-RPT-002, FR-RPT-004, FR-RPT-006 | Epic 8 | Results, Grades & Report Cards |
| FR-FIN-001 to FR-FIN-015, INT-001, INT-002 | Epic 9 | Fee Management & Payments |
| FR-COM-001 to FR-COM-010, ARCH-003, ARCH-007, INT-003 to INT-006 | Epic 10 | Communication & Notifications |

## Epic List

### Epic 1: Infrastructure & Multi-tenancy Foundation
**Goal:** Set up the infrastructure foundation (Redis, BullMQ, multi-tenancy middleware) that enables all subsequent features to work correctly in a multi-tenant environment.

**User Outcome:** Platform is ready for multi-school deployment with proper data isolation.

**Requirements Covered:**
- ARCH-001: Multi-tenancy (Row-level isolation)
- ARCH-002: Redis Integration
- ARCH-004: BullMQ Integration
- ARCH-010: Prisma Middleware
- NFR-SCALE-001 to NFR-SCALE-005

---

### Epic 2: Authentication & User Management
**Goal:** Complete authentication system with role-based access, bulk user import, and parent-student linking.

**User Outcome:** All users (Admin, Teacher, Student, Parent) can securely access the platform with role-appropriate permissions.

**Requirements Covered:**
- FR-IAM-001: Multi-role Authentication [P0]
- FR-IAM-002: SSO Integration [P1]
- FR-IAM-003: Role-based Permissions [P0]
- FR-IAM-004: Bulk User Import [P0]
- FR-IAM-005: Parent-Student Linking [P0]
- FR-IAM-006: Password Policies [P1]
- FR-IAM-007: Session Management [P1]
- FR-IAM-008: Audit Logging [P0]
- FR-IAM-009: Two-Factor Authentication [P2]
- FR-IAM-010: Biometric Login [P1]
- NFR-SEC-001 to NFR-SEC-008

---

### Epic 3: Academic Structure & Configuration
**Goal:** Complete academic setup including academic years, class/section configuration, subjects, teacher assignments, and academic calendar.

**User Outcome:** Admins can fully configure the school's academic structure.

**Requirements Covered:**
- FR-ACD-001: Academic Year Setup [P0]
- FR-ACD-002: Class Configuration [P0]
- FR-ACD-003: Subject Management [P0]
- FR-ACD-004: Curriculum Builder [P1]
- FR-ACD-005: Timetable Generator [P1]
- FR-ACD-006: Teacher-Subject Mapping [P0]
- FR-ACD-007: Lesson Planning [P2]
- FR-ACD-008: Syllabus Tracking [P2]
- FR-ACD-009: Academic Calendar [P0]
- FR-ACD-010: Multi-board Support [P1]
- FR-HR-001: Staff Profiles [P1]

---

### Epic 4: Student Information & Enrollment
**Goal:** Comprehensive student management including profiles, enrollment, class assignment, document vault, and GDPR compliance.

**User Outcome:** Admins can manage complete student lifecycle from enrollment to graduation.

**Requirements Covered:**
- FR-SIS-001: Student Profile [P0]
- FR-SIS-002: Enrollment Management [P0]
- FR-SIS-003: Class/Section Assignment [P0]
- FR-SIS-004: Promotion/Demotion [P1]
- FR-SIS-005: Transfer Management [P1]
- FR-SIS-006: Document Vault [P0]
- FR-SIS-007: Sibling Linking [P2]
- FR-SIS-008: Student Timeline [P2]
- FR-SIS-009: Custom Fields [P1]
- FR-SIS-010: GDPR Compliance [P1]
- UX-001 to UX-009

---

### Epic 5: Attendance Management
**Goal:** Daily attendance marking with multiple methods, leave management, and comprehensive reporting.

**User Outcome:** Teachers can efficiently track attendance; parents receive real-time absence notifications.

**Requirements Covered:**
- FR-ATT-001: Daily Attendance [P0]
- FR-ATT-002: QR Code Attendance [P2]
- FR-ATT-003: Biometric Integration [P2]
- FR-ATT-004: GPS Attendance [P3]
- FR-ATT-005: Bulk Attendance [P0]
- FR-ATT-006: Leave Management [P1]
- FR-ATT-007: Late Arrival Tracking [P1]
- FR-ATT-008: Attendance Reports [P0]
- FR-ATT-009: Parent Notifications [P0]
- FR-ATT-010: Attendance Analytics [P2]

---

### Epic 6: Question Bank & AI Document Parser
**Goal:** AI-powered document parsing, question extraction, question bank management, and manual correction capabilities.

**User Outcome:** Teachers can upload documents and automatically extract questions to build a comprehensive question bank.

**Requirements Covered:**
- FR-DOC-001: PDF Parser [P0]
- FR-DOC-002: Word Parser [P0]
- FR-DOC-003: Image OCR [P1]
- FR-DOC-004: Table Extraction [P1]
- FR-DOC-005: Question Detection [P0]
- FR-DOC-006: Topic Classification [P1]
- FR-DOC-007: Difficulty Scoring [P2]
- FR-DOC-008: Answer Extraction [P1]
- FR-DOC-009: Multilingual OCR [P1]
- FR-DOC-010: Batch Processing [P1]
- FR-DOC-011: Manual Correction UI [P0]
- FR-DOC-012: Learning Feedback Loop [P2]
- FR-EXM-003: Question Bank [P0]
- FR-EXM-004: AI Document Parser [P0]
- FR-EXM-005: Auto Question Generator [P1]
- ARCH-006: Meilisearch Integration

---

### Epic 7: Examination & Assessment
**Goal:** Complete examination lifecycle including test creation, online tests, assignments, and auto-grading.

**User Outcome:** Teachers can create and conduct exams; students can take online tests.

**Requirements Covered:**
- FR-EXM-001: Exam Setup [P0]
- FR-EXM-002: Online Test Builder [P0]
- FR-EXM-006: Assignment Builder [P0]
- FR-EXM-007: Online Submission [P0]
- FR-EXM-008: Auto-grading [P1]
- FR-EXM-009: Rubric-based Grading [P1]
- FR-EXM-014: Plagiarism Detection [P2]
- FR-EXM-015: Proctored Exams [P3]

---

### Epic 8: Results, Grades & Report Cards
**Goal:** Grade calculation, report card generation, progress tracking, and performance analytics.

**User Outcome:** Students and parents can view grades, progress trends, and download report cards.

**Requirements Covered:**
- FR-EXM-010: Marks Entry [P0]
- FR-EXM-011: Grade Calculation [P0]
- FR-EXM-012: Report Card Generation [P0]
- FR-EXM-013: Progress Tracking [P1]
- FR-RPT-001: Dashboard Builder [P1]
- FR-RPT-002: Standard Reports [P0]
- FR-RPT-004: Export Formats [P0]
- FR-RPT-006: Performance Analytics [P1]

---

### Epic 9: Fee Management & Payments
**Goal:** Complete financial management including fee structure, online payments, invoices, receipts, and financial reports.

**User Outcome:** Parents can view fees, pay online, and receive receipts; admins can track collections.

**Requirements Covered:**
- FR-FIN-001: Fee Structure Builder [P0]
- FR-FIN-002: Fee Categories [P0]
- FR-FIN-003: Installment Plans [P1]
- FR-FIN-004: Discount/Scholarship [P1]
- FR-FIN-005: Online Payment [P0]
- FR-FIN-006: Invoice Generation [P0]
- FR-FIN-007: Receipt Management [P0]
- FR-FIN-008: Payment Reminders [P0]
- FR-FIN-009: Late Fee Calculation [P1]
- FR-FIN-010: Refund Processing [P2]
- FR-FIN-011: Expense Tracking [P2]
- FR-FIN-012: Budget Management [P3]
- FR-FIN-013: Financial Reports [P0]
- FR-FIN-014: Tax Compliance [P1]
- FR-FIN-015: Audit Trail [P0]
- INT-001: Razorpay
- INT-002: Stripe

---

### Epic 10: Communication & Notifications
**Goal:** Announcements, push notifications, SMS/email integration, and in-app messaging.

**User Outcome:** All stakeholders receive timely notifications and can communicate through the platform.

**Requirements Covered:**
- FR-COM-001: Announcements [P0]
- FR-COM-002: Push Notifications [P0]
- FR-COM-003: SMS Integration [P0]
- FR-COM-004: Email Integration [P0]
- FR-COM-005: In-app Messaging [P1]
- FR-COM-006: Notice Board [P1]
- FR-COM-007: Circular Distribution [P1]
- FR-COM-008: Event Management [P2]
- FR-COM-009: Emergency Alerts [P1]
- FR-COM-010: Communication History [P1]
- ARCH-003: Socket.io
- ARCH-007: Expo Push Notifications
- INT-003 to INT-006

---

## Future Epics (Post-MVP)

### Epic 11: Staff & HR Management
FR-HR-002 to FR-HR-010

### Epic 12: Transport Management
FR-TRN-001 to FR-TRN-010

### Epic 13: Library Management
FR-LIB-001 to FR-LIB-008

### Epic 14: Hostel Management
FR-HST-001 to FR-HST-008

### Epic 15: Inventory & Assets
FR-INV-001 to FR-INV-006

### Epic 16: Multilingual & i18n
FR-I18N-001 to FR-I18N-010

### Epic 17: Advanced Analytics
FR-RPT-003, FR-RPT-005, FR-RPT-007 to FR-RPT-010

---

## Stories

### Epic 1: Infrastructure & Multi-tenancy Foundation

#### Story 1.1: Redis Connection and Configuration
**As a** platform operator
**I want** Redis properly configured and connected
**So that** caching, sessions, and real-time features have a reliable data store

**Acceptance Criteria:**
- Given the backend starts, When Redis is configured, Then connection is established and health check passes
- Given Redis connection fails, When backend attempts to start, Then graceful degradation with clear error logging
- Given production environment, When Redis is used, Then TLS/SSL encryption is enabled
- Given a cache key is set, When retrieved within TTL, Then correct value is returned
- Given configuration, When environment changes, Then Redis can switch between local/cloud instances

**Technical Notes:**
- Configure ioredis client with connection pooling
- Environment variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS
- Add Redis health endpoint at /health/redis

---

#### Story 1.2: BullMQ Job Queue Setup
**As a** platform operator
**I want** BullMQ configured for background job processing
**So that** long-running tasks (PDF parsing, emails, reports) don't block API responses

**Acceptance Criteria:**
- Given BullMQ is configured, When a job is added, Then it appears in the queue
- Given a job processor is registered, When job is picked up, Then it executes the handler function
- Given a job fails, When retry limit not reached, Then job is retried with exponential backoff
- Given a job fails permanently, When retry limit exceeded, Then job moves to failed queue with error details
- Given Bull Board UI is enabled, When admin accesses /admin/queues, Then queue dashboard is visible

**Technical Notes:**
- Create queues: email-queue, sms-queue, pdf-parse-queue, report-queue
- Configure concurrency per queue type
- Integrate Bull Board for monitoring

---

#### Story 1.3: Multi-tenancy Prisma Middleware
**As a** developer
**I want** automatic schoolId filtering on all tenant-scoped queries
**So that** data isolation is enforced at the ORM level without manual filtering

**Acceptance Criteria:**
- Given a user with schoolId, When querying tenant-scoped tables, Then schoolId filter is auto-applied
- Given a query without schoolId in context, When executed against tenant table, Then error is thrown
- Given a super-admin user, When querying, Then cross-tenant access is permitted
- Given create/update operations, When on tenant-scoped tables, Then schoolId is auto-injected
- Given non-tenant tables (e.g., SystemConfig), When queried, Then no schoolId filter is applied

**Technical Notes:**
- Use Prisma middleware extension
- Tenant-scoped tables list in configuration
- Context passed via AsyncLocalStorage

---

#### Story 1.4: Request Context and Tenant Resolution
**As a** developer
**I want** request context properly propagated through the application
**So that** every service layer has access to current user and tenant information

**Acceptance Criteria:**
- Given authenticated request, When middleware runs, Then context contains userId, schoolId, role
- Given context is set, When service methods execute, Then context is accessible via AsyncLocalStorage
- Given background job, When processing, Then context is restored from job metadata
- Given nested service calls, When executing, Then context remains consistent
- Given request ends, When cleanup runs, Then context is properly cleared

**Technical Notes:**
- Implement RequestContext class with AsyncLocalStorage
- Middleware sets context after auth validation
- Export getContext() helper function

---

#### Story 1.5: Rate Limiting with Redis
**As a** platform operator
**I want** API rate limiting implemented using Redis
**So that** the platform is protected from abuse and DoS attacks

**Acceptance Criteria:**
- Given rate limit configuration, When requests exceed limit, Then 429 response is returned
- Given different endpoints, When limits are defined, Then each endpoint respects its own limit
- Given authenticated users, When rate limiting, Then per-user limits are enforced
- Given rate limit headers, When any request is made, Then X-RateLimit-* headers are included
- Given distributed deployment, When multiple instances run, Then limits are shared via Redis

**Technical Notes:**
- Use express-rate-limit with Redis store
- Default: 100 requests/minute for authenticated, 20/minute for unauthenticated
- Higher limits for specific endpoints (e.g., file uploads)

---

#### Story 1.6: Centralized Error Handling
**As a** developer
**I want** consistent error handling across all API endpoints
**So that** errors are properly logged and clients receive standardized error responses

**Acceptance Criteria:**
- Given any unhandled error, When caught by middleware, Then { success: false, error: { code, message } } is returned
- Given validation error, When thrown, Then 400 status with field-level errors is returned
- Given authentication error, When thrown, Then 401 status with appropriate message
- Given authorization error, When thrown, Then 403 status with appropriate message
- Given internal error, When in production, Then sensitive details are hidden from response

**Technical Notes:**
- Create custom error classes: ValidationError, AuthError, NotFoundError, TenantError
- Global error middleware logs to structured logging
- Error codes enum for client handling

---

#### Story 1.7: Structured Logging with Context
**As a** platform operator
**I want** structured JSON logging with request context
**So that** logs are searchable and traceable across distributed systems

**Acceptance Criteria:**
- Given a log statement, When emitted, Then JSON format includes timestamp, level, message, context
- Given request context, When logging, Then requestId, userId, schoolId are auto-included
- Given different environments, When logging, Then log level respects NODE_ENV setting
- Given sensitive data, When logging, Then PII is masked/redacted
- Given log rotation, When logs reach size limit, Then rotation occurs automatically

**Technical Notes:**
- Use pino for high-performance JSON logging
- Request ID generated via uuid and propagated
- Log levels: error, warn, info, debug, trace

---

#### Story 1.8: Health Check Endpoints
**As a** platform operator
**I want** comprehensive health check endpoints
**So that** load balancers and monitoring systems can verify service health

**Acceptance Criteria:**
- Given /health endpoint, When called, Then returns { status: 'ok', version, uptime }
- Given /health/ready endpoint, When all dependencies ready, Then returns 200
- Given /health/ready endpoint, When any dependency fails, Then returns 503 with details
- Given database check, When connection healthy, Then database: 'ok' in response
- Given Redis check, When connection healthy, Then redis: 'ok' in response

**Technical Notes:**
- Separate liveness (/health) from readiness (/health/ready)
- Include dependency checks: database, redis, external services
- Cache health results for 5 seconds to prevent overload

---

### Epic 2: Authentication & User Management

#### Story 2.1: JWT Authentication with Refresh Tokens
**As a** user
**I want** secure JWT-based authentication with refresh tokens
**So that** I can stay logged in securely without frequent re-authentication

**Acceptance Criteria:**
- Given valid credentials, When login requested, Then access token (15min) and refresh token (7 days) returned
- Given valid access token, When API called, Then request is authenticated
- Given expired access token, When refresh token is valid, Then new access token is issued
- Given expired refresh token, When refresh attempted, Then 401 returned requiring re-login
- Given logout, When called, Then refresh token is invalidated in database

**Technical Notes:**
- Access token: JWT with userId, role, schoolId, exp
- Refresh token: stored in database with device info
- Rotate refresh tokens on use (single-use)

---

#### Story 2.2: Role-Based Access Control (RBAC)
**As an** admin
**I want** role-based permissions enforced on all endpoints
**So that** users can only access features appropriate to their role

**Acceptance Criteria:**
- Given role definition, When user has role, Then permitted actions are allowed
- Given endpoint with @Roles decorator, When accessed, Then user role is checked
- Given permission denied, When user lacks role, Then 403 Forbidden returned
- Given super-admin role, When accessing any endpoint, Then access is granted
- Given role hierarchy, When parent role granted, Then child permissions inherited

**Technical Notes:**
- Roles: SUPER_ADMIN, ADMIN, TEACHER, STUDENT, PARENT, STAFF
- Permission decorator middleware
- Role-permission mapping configuration

---

#### Story 2.3: User Registration and Profile Management
**As a** user
**I want** to register and manage my profile
**So that** I can access the system with my personal information

**Acceptance Criteria:**
- Given registration form, When submitted with valid data, Then user account is created
- Given email uniqueness, When duplicate email used, Then validation error returned
- Given profile update, When user changes details, Then profile is updated
- Given password change, When current password correct, Then password is updated
- Given profile fetch, When authenticated, Then user profile with role details returned

**Technical Notes:**
- Password hashing with bcrypt (salt rounds: 12)
- Email verification optional per school configuration
- Profile includes: name, email, phone, avatar, role-specific fields

---

#### Story 2.4: Bulk User Import via CSV/Excel
**As an** admin
**I want** to import users from CSV/Excel files
**So that** I can quickly onboard large numbers of users

**Acceptance Criteria:**
- Given CSV file with user data, When uploaded, Then users are created in batch
- Given Excel file with user data, When uploaded, Then users are created in batch
- Given validation errors in file, When processed, Then error report with row numbers returned
- Given duplicate emails in file, When processed, Then duplicates are flagged
- Given import progress, When large file processing, Then progress can be queried

**Technical Notes:**
- Use BullMQ for async processing of large files
- Template download endpoint for correct format
- Support for role-specific columns (student: class, parent: child_email)

---

#### Story 2.5: Parent-Student Linking
**As a** parent
**I want** to be linked to my children's accounts
**So that** I can view their academic information

**Acceptance Criteria:**
- Given parent account, When child added via student ID, Then link is created
- Given student account, When parent linked, Then parent can view student data
- Given multiple children, When parent queries, Then all linked students are returned
- Given multiple parents, When linked to same student, Then both can access
- Given link removal, When admin removes link, Then parent loses access

**Technical Notes:**
- ParentStudent junction table
- Link verification via OTP or admin approval
- Bulk linking during CSV import

---

#### Story 2.6: Password Policies and Reset
**As a** user
**I want** password reset functionality with security policies
**So that** I can recover my account if I forget my password

**Acceptance Criteria:**
- Given forgot password request, When valid email, Then reset link sent
- Given reset link, When clicked within 1 hour, Then password reset form shown
- Given new password, When submitted, Then password updated and token invalidated
- Given password policy, When new password set, Then policy is enforced (min 8 chars, complexity)
- Given password expiry setting, When enabled, Then users prompted to change after N days

**Technical Notes:**
- Reset token: crypto random, stored hashed, 1-hour expiry
- Password policy configurable per school
- Lock account after N failed attempts

---

#### Story 2.7: Session Management
**As a** user
**I want** to see and manage my active sessions
**So that** I can detect unauthorized access and logout other devices

**Acceptance Criteria:**
- Given active sessions, When queried, Then list with device/browser info returned
- Given session revocation, When user logs out specific session, Then that session is invalidated
- Given logout all, When requested, Then all sessions except current are invalidated
- Given concurrent session limit, When exceeded, Then oldest session is terminated
- Given session info, When logged in, Then device, IP, location, last active shown

**Technical Notes:**
- Store sessions in database with metadata
- Use User-Agent parsing for device info
- GeoIP lookup for location (optional)

---

#### Story 2.8: Audit Logging for Authentication Events
**As an** admin
**I want** all authentication events logged
**So that** I can audit security and investigate incidents

**Acceptance Criteria:**
- Given login attempt, When successful or failed, Then event is logged
- Given password change, When completed, Then event is logged
- Given role change, When admin updates, Then event is logged with before/after
- Given audit query, When admin searches, Then events are filterable by user/type/date
- Given log retention, When logs age out, Then they are archived/deleted per policy

**Technical Notes:**
- AuditLog table: userId, action, details (JSON), ipAddress, userAgent, timestamp
- Async logging via queue to not block requests
- Retention: 1 year default, configurable

---

### Epic 3: Academic Structure & Configuration

#### Story 3.1: Academic Year Management
**As an** admin
**I want** to create and manage academic years
**So that** all academic activities are organized by year

**Acceptance Criteria:**
- Given academic year creation, When dates provided, Then year is created with start/end dates
- Given multiple years, When queried, Then list sorted by date with current year flagged
- Given year activation, When set as current, Then previous year is deactivated
- Given year with data, When deletion attempted, Then prevented with warning
- Given year transition, When new year starts, Then rollover process can be initiated

**Technical Notes:**
- Fields: name, startDate, endDate, isCurrent, status (ACTIVE, COMPLETED, ARCHIVED)
- Only one current year per school
- Cascade handling for related data

---

#### Story 3.2: Class and Section Configuration
**As an** admin
**I want** to configure classes and sections
**So that** students can be organized into class groups

**Acceptance Criteria:**
- Given class creation, When name and grade level provided, Then class is created
- Given section creation, When assigned to class, Then section is linked to class
- Given class list, When queried, Then classes with section counts returned
- Given class with students, When deletion attempted, Then prevented with count
- Given class ordering, When set, Then classes display in specified order

**Technical Notes:**
- Class: name, gradeLevel, displayOrder, academicYearId
- Section: name, classId, capacity, teacherId (class teacher)
- Support streams (Science, Commerce, Arts)

---

#### Story 3.3: Subject Management
**As an** admin
**I want** to manage subjects and their properties
**So that** curriculum and assessments can be organized by subject

**Acceptance Criteria:**
- Given subject creation, When name and type provided, Then subject is created
- Given subject types, When queried, Then core/elective/language options available
- Given subject deactivation, When toggled, Then subject hidden from new assignments
- Given subject credits, When defined, Then used in grade calculations
- Given subject-class mapping, When set, Then subject available for that class

**Technical Notes:**
- Subject: name, code, type (CORE, ELECTIVE, LANGUAGE), credits, isActive
- SubjectClass: subjectId, classId, hoursPerWeek
- Support for subject groups/streams

---

#### Story 3.4: Teacher-Subject-Class Assignment
**As an** admin
**I want** to assign teachers to subjects and classes
**So that** teachers know their teaching responsibilities

**Acceptance Criteria:**
- Given teacher assignment, When subject and class specified, Then assignment created
- Given teacher workload, When queried, Then total hours and classes shown
- Given class subjects, When queried, Then assigned teachers listed
- Given assignment removal, When deleted, Then teacher unlinked from class/subject
- Given bulk assignment, When multiple teachers/subjects selected, Then batch created

**Technical Notes:**
- TeacherAssignment: teacherId, subjectId, classId, sectionId, academicYearId
- Calculate weekly hours from SubjectClass.hoursPerWeek
- Conflict detection for overlapping assignments

---

#### Story 3.5: Academic Calendar Management
**As an** admin
**I want** to manage the academic calendar
**So that** holidays and events are visible to all users

**Acceptance Criteria:**
- Given event creation, When date and type provided, Then event added to calendar
- Given holiday creation, When marked as holiday, Then date blocked for attendance
- Given calendar view, When month queried, Then all events for month returned
- Given event types, When filtered, Then only matching events shown
- Given recurring events, When pattern set, Then events auto-generated

**Technical Notes:**
- CalendarEvent: title, date, endDate, type (HOLIDAY, EVENT, EXAM), isRecurring, pattern
- Types: HOLIDAY, EXAM, PTM, CULTURAL, SPORTS, OTHER
- iCal export support

---

#### Story 3.6: Staff Profile Management
**As an** admin
**I want** to manage staff profiles
**So that** teacher and staff information is centrally maintained

**Acceptance Criteria:**
- Given staff creation, When details provided, Then profile created with user account
- Given staff profile, When queried, Then personal, professional, qualification details returned
- Given staff update, When admin edits, Then profile is updated
- Given document upload, When certificates uploaded, Then attached to profile
- Given staff directory, When queried, Then searchable list with filters returned

**Technical Notes:**
- Staff extends User with: department, designation, qualifications, dateOfJoining
- Document attachments: StaffDocument table
- Integration with User role assignment

---

### Epic 4: Student Information & Enrollment

#### Story 4.1: Student Profile Management
**As an** admin
**I want** comprehensive student profiles
**So that** all student information is centrally accessible

**Acceptance Criteria:**
- Given student creation, When required fields provided, Then student profile created
- Given profile details, When queried, Then demographics, contact, medical info returned
- Given photo upload, When image provided, Then stored and linked to profile
- Given profile update, When edited, Then changes saved with audit trail
- Given custom fields, When school defines them, Then they appear on profile

**Technical Notes:**
- Student: admissionNo, firstName, lastName, dob, gender, bloodGroup, photo, medicalInfo
- Address: residential, permanent (linked to Student)
- Parent/Guardian contacts: linked via ParentStudent

---

#### Story 4.2: Student Enrollment Workflow
**As an** admin
**I want** a structured enrollment process
**So that** new students are properly registered with all required information

**Acceptance Criteria:**
- Given enrollment form, When submitted, Then application record created
- Given application review, When approved, Then student record created with admissionNo
- Given document requirements, When defined, Then checklist shown during enrollment
- Given enrollment status, When queried, Then status (PENDING, APPROVED, REJECTED) shown
- Given fee assignment, When enrolled, Then default fees for class auto-assigned

**Technical Notes:**
- Enrollment: applicationNo, status, submittedAt, reviewedBy, reviewedAt
- Auto-generate admissionNo with configurable format
- Workflow: SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED

---

#### Story 4.3: Class/Section Assignment
**As an** admin
**I want** to assign students to classes and sections
**So that** students are organized for academic activities

**Acceptance Criteria:**
- Given student, When assigned to class/section, Then enrollment record created
- Given bulk assignment, When multiple students selected, Then batch assigned
- Given section capacity, When exceeded, Then warning shown
- Given class change, When student moved, Then previous enrollment ended, new created
- Given enrollment history, When queried, Then all past enrollments shown

**Technical Notes:**
- StudentEnrollment: studentId, classId, sectionId, academicYearId, rollNo, status
- RollNo: auto-assign or manual with uniqueness per section
- Status: ACTIVE, TRANSFERRED, PROMOTED, LEFT

---

#### Story 4.4: Document Vault
**As an** admin
**I want** to store student documents securely
**So that** important certificates and records are accessible

**Acceptance Criteria:**
- Given document upload, When file provided with type, Then stored in cloud storage
- Given document types, When queried, Then predefined types (ID proof, certificate, medical) available
- Given document retrieval, When requested, Then signed URL returned for download
- Given document deletion, When admin deletes, Then file removed with audit log
- Given document list, When queried, Then all student documents with metadata shown

**Technical Notes:**
- StudentDocument: studentId, type, fileName, fileUrl, uploadedBy, uploadedAt
- Store in Cloudflare R2 with presigned URLs
- Types: BIRTH_CERT, ID_PROOF, TRANSFER_CERT, MEDICAL, PHOTO, OTHER

---

#### Story 4.5: Promotion and Demotion
**As an** admin
**I want** to promote students to the next class
**So that** year-end processing is streamlined

**Acceptance Criteria:**
- Given promotion criteria, When defined, Then rules saved for class
- Given promotion run, When executed, Then eligible students promoted
- Given failed students, When marked, Then retained in same class
- Given promotion preview, When run in preview mode, Then results shown without committing
- Given promotion history, When queried, Then complete history with reasons shown

**Technical Notes:**
- PromotionRule: fromClassId, toClassId, criteria (JSON: minAttendance, minGrade)
- PromotionHistory: studentId, fromClass, toClass, promotedAt, promotedBy
- Support bulk promotion with exceptions

---

#### Story 4.6: Transfer Certificate Generation
**As an** admin
**I want** to generate transfer certificates
**So that** students leaving can get official documentation

**Acceptance Criteria:**
- Given TC request, When initiated, Then clearance workflow starts
- Given clearances complete, When all departments approve, Then TC generated
- Given TC template, When school customizes, Then custom template used
- Given TC download, When requested, Then PDF generated with school letterhead
- Given TC record, When issued, Then student marked as TRANSFERRED

**Technical Notes:**
- TransferCertificate: studentId, tcNo, issueDate, reason, clearances (JSON)
- PDF generation with school-specific template
- Clearance departments: Library, Finance, Admin

---

### Epic 5: Attendance Management

#### Story 5.1: Daily Attendance Marking
**As a** teacher
**I want** to mark daily attendance for my class
**So that** student presence is recorded accurately

**Acceptance Criteria:**
- Given class attendance view, When opened, Then student list with attendance status shown
- Given attendance marking, When status selected, Then attendance recorded with timestamp
- Given status options, When marking, Then PRESENT, ABSENT, LATE, HALF_DAY available
- Given attendance submission, When saved, Then record locked with teacher signature
- Given today's attendance, When already marked, Then edit mode with change reason

**Technical Notes:**
- Attendance: studentId, date, status, markedBy, markedAt, remarks
- Locking: prevent changes after school policy hours
- Status enum: PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE

---

#### Story 5.2: Bulk Attendance Operations
**As a** teacher
**I want** to mark entire class as present/absent
**So that** I can quickly record attendance for the whole class

**Acceptance Criteria:**
- Given bulk present, When clicked, Then all students marked PRESENT
- Given bulk absent, When clicked, Then all students marked ABSENT
- Given exceptions, When individual status changed after bulk, Then individual record updated
- Given undo, When triggered within 5 minutes, Then bulk operation reverted
- Given holiday, When date is holiday, Then attendance marking blocked with message

**Technical Notes:**
- Bulk operation creates individual records for each student
- Maintain operation history for undo
- Check against academic calendar for holidays

---

#### Story 5.3: Subject-wise Attendance
**As a** teacher
**I want** to mark attendance per subject period
**So that** attendance is tracked by class period for secondary students

**Acceptance Criteria:**
- Given subject attendance, When enabled for class, Then period-wise marking available
- Given period selection, When chosen, Then attendance marked for that period
- Given multiple periods, When same day, Then each period tracked separately
- Given period summary, When queried, Then attendance across all periods shown
- Given timetable integration, When period selected, Then subject auto-detected

**Technical Notes:**
- PeriodAttendance: studentId, date, periodNumber, subjectId, status
- Link to timetable for auto-subject detection
- Aggregate daily attendance from periods if needed

---

#### Story 5.4: Leave Management for Students
**As a** parent
**I want** to apply for leave on behalf of my child
**So that** planned absences are recorded with approval

**Acceptance Criteria:**
- Given leave application, When submitted with dates and reason, Then application created
- Given leave approval, When teacher approves, Then status updated to APPROVED
- Given leave rejection, When rejected, Then status updated with reason
- Given leave calendar, When viewed, Then approved leaves shown on calendar
- Given attendance override, When leave approved, Then attendance marked as ON_LEAVE

**Technical Notes:**
- Leave: studentId, fromDate, toDate, reason, type, status, appliedBy, approvedBy
- Types: SICK, FAMILY, VACATION, OTHER
- Status: PENDING, APPROVED, REJECTED

---

#### Story 5.5: Attendance Reports and Analytics
**As an** admin
**I want** attendance reports and analytics
**So that** I can monitor attendance patterns across the school

**Acceptance Criteria:**
- Given daily report, When queried, Then class-wise attendance summary returned
- Given student report, When queried, Then individual attendance percentage returned
- Given date range, When specified, Then attendance within range calculated
- Given low attendance alert, When threshold breached, Then flagged in report
- Given export, When requested, Then CSV/PDF report generated

**Technical Notes:**
- Pre-calculate daily aggregates for performance
- Threshold configuration per school (e.g., 75% minimum)
- Charts: daily trend, class comparison, individual trend

---

#### Story 5.6: Parent Absence Notifications
**As a** parent
**I want** to be notified when my child is absent
**So that** I am immediately aware of unexpected absences

**Acceptance Criteria:**
- Given absence marked, When no prior leave approved, Then notification triggered
- Given notification, When sent, Then parent receives via configured channel (SMS/push/email)
- Given notification preference, When set by parent, Then channel preference respected
- Given multiple children, When absent, Then separate notifications per child
- Given notification log, When queried, Then delivery status shown

**Technical Notes:**
- Trigger via BullMQ job on attendance save
- Check for approved leave before sending
- Rate limit: one notification per child per day

---

### Epic 6: Question Bank & AI Document Parser

#### Story 6.1: PDF Document Parsing
**As a** teacher
**I want** to upload PDF documents for question extraction
**So that** I can build my question bank from existing materials

**Acceptance Criteria:**
- Given PDF upload, When file submitted, Then parsing job queued
- Given parsing progress, When checked, Then status and percentage shown
- Given text extraction, When completed, Then extracted text stored
- Given multi-page PDF, When parsed, Then all pages processed
- Given parsing failure, When PDF corrupted, Then error message with details shown

**Technical Notes:**
- Use pdf-parse or pdfjs-dist for extraction
- Store original file in R2, extracted text in database
- BullMQ job with progress tracking

---

#### Story 6.2: Question Detection and Extraction
**As a** teacher
**I want** questions automatically detected from parsed documents
**So that** I don't have to manually copy each question

**Acceptance Criteria:**
- Given extracted text, When AI processing runs, Then questions are identified
- Given question types, When detected, Then type (MCQ, SHORT, LONG) is classified
- Given MCQ, When detected, Then options are extracted as structured data
- Given question numbering, When present, Then number preserved in metadata
- Given confidence score, When low, Then question flagged for review

**Technical Notes:**
- AI model: Claude API for question detection
- Output format: { questionText, type, options[], answer, confidence }
- Flag questions with confidence < 0.8

---

#### Story 6.3: Question Bank CRUD Operations
**As a** teacher
**I want** to manage questions in the question bank
**So that** I can organize and maintain my question repository

**Acceptance Criteria:**
- Given question creation, When details provided, Then question saved with metadata
- Given question edit, When modified, Then changes saved with version history
- Given question deletion, When not used in tests, Then soft deleted
- Given question search, When keywords entered, Then matching questions returned
- Given question filters, When applied, Then filtered by subject/chapter/difficulty/type

**Technical Notes:**
- Question: text, type, options (JSON), answer, explanation, difficulty, subjectId, chapterId
- Meilisearch index for full-text search
- Version history for audit

---

#### Story 6.4: Topic and Difficulty Classification
**As a** teacher
**I want** questions automatically classified by topic and difficulty
**So that** I can easily find questions for specific needs

**Acceptance Criteria:**
- Given question, When AI analyzes, Then topic/chapter suggested
- Given difficulty, When AI scores, Then EASY/MEDIUM/HARD assigned
- Given classification, When teacher disagrees, Then manual override allowed
- Given bulk classification, When triggered, Then multiple questions processed
- Given classification accuracy, When feedback given, Then model improves

**Technical Notes:**
- Use chapter/topic list for classification context
- Difficulty based on Bloom's taxonomy analysis
- Store both AI suggestion and teacher override

---

#### Story 6.5: Manual Correction Interface
**As a** teacher
**I want** to correct parsing errors in extracted questions
**So that** the question bank maintains high quality

**Acceptance Criteria:**
- Given parsed question, When reviewed, Then edit interface shown
- Given text correction, When edited, Then corrected text saved
- Given option reordering, When dragged, Then order updated
- Given answer correction, When changed, Then correct answer updated
- Given approval, When teacher approves, Then question moves to approved status

**Technical Notes:**
- Side-by-side view: original scan/text vs extracted question
- Track corrections for feedback loop
- Status: PENDING_REVIEW, APPROVED, REJECTED

---

#### Story 6.6: Meilisearch Integration for Question Search
**As a** teacher
**I want** fast full-text search across all questions
**So that** I can quickly find relevant questions

**Acceptance Criteria:**
- Given search query, When entered, Then results returned in < 200ms
- Given typo tolerance, When misspelled, Then fuzzy matching finds results
- Given faceted search, When filters selected, Then combined search works
- Given synonyms, When configured, Then synonym matches included
- Given index sync, When question updated, Then search index updated

**Technical Notes:**
- Index fields: questionText, options, tags, chapterName, subjectName
- Facets: subjectId, chapterId, difficulty, type
- Real-time sync via Prisma middleware or BullMQ

---

### Epic 7: Examination & Assessment

#### Story 7.1: Exam Schedule Setup
**As an** admin
**I want** to create exam schedules
**So that** exams are properly organized with dates and times

**Acceptance Criteria:**
- Given exam creation, When details provided, Then exam schedule created
- Given exam types, When selected, Then UNIT_TEST/MIDTERM/FINAL/QUIZ available
- Given date-time, When set, Then schedule with duration saved
- Given class assignment, When selected, Then exam linked to classes
- Given schedule conflict, When detected, Then warning shown

**Technical Notes:**
- Exam: name, type, startDate, endDate, classId, subjectId, duration, maxMarks
- Support multi-subject exams (exam schedules)
- Conflict check against other exams and holidays

---

#### Story 7.2: Online Test Builder
**As a** teacher
**I want** to create online tests from question bank
**So that** students can take tests digitally

**Acceptance Criteria:**
- Given test creation, When started, Then test details form shown
- Given question selection, When from bank, Then questions added to test
- Given question order, When set, Then questions arranged in order
- Given marks allocation, When per question set, Then total auto-calculated
- Given test preview, When generated, Then student view shown to teacher

**Technical Notes:**
- Test: title, description, duration, totalMarks, shuffleQuestions, showResults
- TestQuestion: testId, questionId, order, marks
- Support manual question entry or bank selection

---

#### Story 7.3: Assignment Builder and Distribution
**As a** teacher
**I want** to create and distribute assignments
**So that** students receive homework digitally

**Acceptance Criteria:**
- Given assignment creation, When details entered, Then assignment saved
- Given file attachment, When uploaded, Then attached to assignment
- Given class distribution, When selected, Then assignment visible to class
- Given due date, When set, Then deadline enforced
- Given instructions, When provided, Then shown to students

**Technical Notes:**
- Assignment: title, description, dueDate, classId, subjectId, maxMarks, attachments
- AssignmentDistribution: assignmentId, sectionId, distributedAt
- Notification triggered on distribution

---

#### Story 7.4: Online Test Taking
**As a** student
**I want** to take online tests
**So that** I can complete assessments digitally

**Acceptance Criteria:**
- Given test start, When clicked, Then timer starts and questions shown
- Given MCQ question, When answered, Then response saved
- Given navigation, When moving between questions, Then previous answers preserved
- Given timer expiry, When time runs out, Then test auto-submitted
- Given manual submit, When clicked, Then confirmation shown and test submitted

**Technical Notes:**
- TestAttempt: testId, studentId, startedAt, submittedAt, status
- TestResponse: attemptId, questionId, response, marksAwarded
- Auto-save responses every 30 seconds

---

#### Story 7.5: Assignment Submission
**As a** student
**I want** to submit assignments online
**So that** I can turn in my work digitally

**Acceptance Criteria:**
- Given assignment view, When opened, Then details and attachments shown
- Given file upload, When submitted, Then submission recorded
- Given late submission, When after due date, Then flagged as late
- Given resubmission, When allowed, Then previous submission replaced
- Given submission confirmation, When complete, Then confirmation shown

**Technical Notes:**
- AssignmentSubmission: assignmentId, studentId, submittedAt, files (JSON), isLate
- File storage in R2 with submission folder structure
- Configurable late submission policy

---

#### Story 7.6: Auto-grading for MCQ Tests
**As a** teacher
**I want** MCQ tests to be auto-graded
**So that** I get instant results without manual checking

**Acceptance Criteria:**
- Given test submission, When all MCQ, Then auto-graded immediately
- Given correct answer, When matched, Then full marks awarded
- Given wrong answer, When negative marking on, Then deduction applied
- Given results, When calculated, Then score and percentage computed
- Given answer key, When viewed, Then correct/incorrect comparison shown

**Technical Notes:**
- Compare TestResponse.response with Question.answer
- Negative marking: configurable per test
- Store marksAwarded per response

---

#### Story 7.7: Rubric-based Grading for Subjective
**As a** teacher
**I want** to grade subjective answers with rubrics
**So that** grading is consistent and transparent

**Acceptance Criteria:**
- Given rubric creation, When criteria defined, Then rubric saved
- Given grading interface, When opened, Then student answer and rubric shown
- Given criterion selection, When level picked, Then points auto-calculated
- Given comments, When added, Then feedback saved with grade
- Given grade submission, When completed, Then marks recorded

**Technical Notes:**
- Rubric: name, criteria (JSON: { criterion, levels: [{ label, points }] })
- GradingRecord: submissionId, rubricId, scores (JSON), comments, gradedBy
- Total from sum of criterion scores

---

### Epic 8: Results, Grades & Report Cards

#### Story 8.1: Marks Entry Interface
**As a** teacher
**I want** to enter marks for exams
**So that** student scores are recorded in the system

**Acceptance Criteria:**
- Given marks entry, When exam selected, Then student list with input fields shown
- Given mark input, When entered, Then validated against max marks
- Given bulk entry, When pasted from spreadsheet, Then values populated
- Given save, When clicked, Then all marks saved
- Given incomplete entry, When not all entered, Then progress saved as draft

**Technical Notes:**
- Result: examId, studentId, marksObtained, remarks, enteredBy, enteredAt
- Validation: 0 <= marks <= maxMarks
- Support absent (AB) and not applicable (NA) markers

---

#### Story 8.2: Grade Calculation Engine
**As an** admin
**I want** automatic grade calculation from marks
**So that** grades are consistently calculated based on school policy

**Acceptance Criteria:**
- Given grade scale, When configured, Then used for all calculations
- Given marks, When calculated, Then appropriate grade assigned
- Given GPA mode, When enabled, Then GPA calculated from grades
- Given percentage mode, When enabled, Then percentage shown
- Given custom scales, When school defines, Then custom scale used

**Technical Notes:**
- GradeScale: name, isDefault, grades (JSON: [{ grade, minPercent, maxPercent, gpa }])
- Calculate: marks → percentage → grade lookup
- Support multiple scales (CBSE, ICSE, custom)

---

#### Story 8.3: Report Card Template Builder
**As an** admin
**I want** to customize report card templates
**So that** report cards match school branding and requirements

**Acceptance Criteria:**
- Given template editor, When opened, Then drag-drop interface shown
- Given school logo, When uploaded, Then included in header
- Given fields, When added, Then student/exam data placeholders available
- Given layout, When saved, Then template stored for generation
- Given preview, When clicked, Then sample report card shown

**Technical Notes:**
- ReportCardTemplate: name, layout (JSON), headerImage, footerText
- Fields: studentName, className, subjects[], marks[], grades[], attendance
- PDF generation with template

---

#### Story 8.4: Report Card Generation
**As a** teacher
**I want** to generate report cards for students
**So that** parents receive official grade documentation

**Acceptance Criteria:**
- Given class selection, When chosen, Then students for that class shown
- Given bulk generation, When triggered, Then report cards generated for all
- Given individual generation, When student selected, Then single report generated
- Given download, When requested, Then PDF downloaded
- Given batch download, When selected, Then ZIP of all PDFs created

**Technical Notes:**
- BullMQ job for batch generation
- Store generated PDFs in R2 with expiry
- Include all exam results for the term

---

#### Story 8.5: Performance Dashboard
**As a** student/parent
**I want** to view performance trends
**So that** I can track academic progress over time

**Acceptance Criteria:**
- Given dashboard, When opened, Then current term summary shown
- Given subject performance, When viewed, Then marks trend chart displayed
- Given class rank, When enabled by school, Then rank position shown
- Given term comparison, When previous terms exist, Then comparison available
- Given areas to improve, When low scores detected, Then highlighted

**Technical Notes:**
- Pre-calculate aggregates for dashboard performance
- Charts: line chart for trends, bar chart for subject comparison
- Respect privacy settings for rank visibility

---

#### Story 8.6: Standard Academic Reports
**As an** admin
**I want** standard academic reports
**So that** I can analyze school-wide academic performance

**Acceptance Criteria:**
- Given class summary report, When generated, Then pass/fail statistics shown
- Given subject analysis, When viewed, Then average, highest, lowest per subject
- Given teacher performance, When queried, Then class results by teacher shown
- Given export, When requested, Then Excel/PDF format available
- Given date range, When specified, Then results within range included

**Technical Notes:**
- Pre-built report templates
- Data aggregation queries with caching
- PDF/Excel export via dedicated service

---

### Epic 9: Fee Management & Payments

#### Story 9.1: Fee Structure Configuration
**As an** admin
**I want** to configure fee structures
**So that** fees are properly defined for each class

**Acceptance Criteria:**
- Given fee structure, When created, Then linked to class and academic year
- Given fee heads, When added, Then tuition, transport, etc. configured
- Given amounts, When set, Then amounts saved per fee head
- Given frequency, When defined, Then ANNUAL/TERM/MONTHLY set
- Given activation, When enabled, Then structure applied to students

**Technical Notes:**
- FeeStructure: name, classId, academicYearId, isActive
- FeeHead: name, amount, frequency, isOptional
- FeeStructureHead: feeStructureId, feeHeadId, amount

---

#### Story 9.2: Student Fee Assignment
**As an** admin
**I want** to assign fees to students
**So that** each student has their applicable fees defined

**Acceptance Criteria:**
- Given class enrollment, When complete, Then default fees auto-assigned
- Given individual adjustment, When needed, Then student-specific fee set
- Given fee waiver, When approved, Then amount reduced
- Given fee report, When generated, Then total payable per student shown
- Given fee freeze, When activated, Then no further changes allowed

**Technical Notes:**
- StudentFee: studentId, feeStructureId, adjustments (JSON), totalAmount
- Support partial fee assignment (e.g., no transport)
- Fee freeze for audit compliance

---

#### Story 9.3: Invoice Generation
**As an** admin
**I want** to generate fee invoices
**So that** parents receive official payment requests

**Acceptance Criteria:**
- Given invoice generation, When triggered, Then invoice created with breakdown
- Given invoice number, When generated, Then unique sequential number assigned
- Given due date, When set, Then shown on invoice
- Given invoice PDF, When downloaded, Then formatted with school details
- Given bulk invoices, When generated, Then batch process for all students

**Technical Notes:**
- Invoice: invoiceNo, studentId, amount, dueDate, status, items (JSON)
- PDF generation with school letterhead
- Status: DRAFT, SENT, PAID, OVERDUE, CANCELLED

---

#### Story 9.4: Online Payment Integration (Razorpay/Stripe)
**As a** parent
**I want** to pay fees online
**So that** I can make payments conveniently

**Acceptance Criteria:**
- Given payment initiation, When clicked, Then payment gateway opened
- Given Razorpay, When selected, Then Razorpay checkout shown
- Given Stripe, When selected, Then Stripe checkout shown
- Given payment success, When confirmed, Then invoice marked as paid
- Given payment failure, When occurs, Then appropriate error shown

**Technical Notes:**
- Payment: invoiceId, amount, gateway, gatewayTransactionId, status
- Webhook handlers for payment confirmation
- Support partial payments

---

#### Story 9.5: Receipt Generation and Management
**As a** parent
**I want** to receive payment receipts
**So that** I have proof of payment

**Acceptance Criteria:**
- Given payment success, When confirmed, Then receipt auto-generated
- Given receipt number, When generated, Then unique sequential number assigned
- Given receipt PDF, When downloaded, Then formatted with payment details
- Given receipt history, When queried, Then all receipts for student shown
- Given duplicate receipt, When requested, Then marked as duplicate copy

**Technical Notes:**
- Receipt: receiptNo, paymentId, amount, paidAt, generatedBy
- PDF with payment breakdown and gateway reference
- Email receipt automatically after payment

---

#### Story 9.6: Payment Reminders
**As an** admin
**I want** automated payment reminders
**So that** parents are notified about due and overdue fees

**Acceptance Criteria:**
- Given reminder schedule, When configured, Then reminders sent at intervals
- Given due soon, When 7 days before due, Then reminder sent
- Given overdue, When past due date, Then overdue notification sent
- Given reminder channels, When set, Then SMS/email/push used per preference
- Given reminder log, When queried, Then all sent reminders shown

**Technical Notes:**
- BullMQ scheduled job for daily reminder check
- Template-based messages with personalization
- Respect parent communication preferences

---

#### Story 9.7: Discount and Scholarship Management
**As an** admin
**I want** to manage discounts and scholarships
**So that** eligible students receive fee reductions

**Acceptance Criteria:**
- Given discount creation, When defined, Then discount type saved
- Given sibling discount, When second child, Then automatic discount applied
- Given merit scholarship, When awarded, Then percentage reduction applied
- Given need-based aid, When approved, Then custom amount set
- Given discount history, When queried, Then all awarded discounts shown

**Technical Notes:**
- Discount: name, type (SIBLING, MERIT, NEED, CUSTOM), value, isPercentage
- StudentDiscount: studentId, discountId, amount, validFrom, validTo
- Apply to invoice generation

---

#### Story 9.8: Financial Reports
**As an** admin
**I want** financial reports
**So that** I can track fee collection and outstanding amounts

**Acceptance Criteria:**
- Given collection report, When generated, Then total collected by period shown
- Given outstanding report, When generated, Then pending amounts per student shown
- Given class-wise report, When filtered, Then breakdown by class shown
- Given payment mode report, When viewed, Then online vs offline split shown
- Given export, When requested, Then Excel/PDF available

**Technical Notes:**
- Pre-aggregate financial data for performance
- Date range, class, payment mode filters
- Charts: collection trend, outstanding pie chart

---

### Epic 10: Communication & Notifications

#### Story 10.1: Announcement System
**As an** admin
**I want** to create and publish announcements
**So that** important information reaches all stakeholders

**Acceptance Criteria:**
- Given announcement creation, When content entered, Then announcement saved
- Given audience selection, When chosen, Then targeted to roles/classes
- Given publish, When triggered, Then announcement visible to audience
- Given schedule, When future date set, Then auto-publish at scheduled time
- Given attachment, When uploaded, Then attached to announcement

**Technical Notes:**
- Announcement: title, content, audience (JSON), publishedAt, attachments
- Audience: { roles: [], classIds: [], allSchool: boolean }
- Push notification on publish

---

#### Story 10.2: Push Notification Service
**As a** mobile user
**I want** to receive push notifications
**So that** I'm alerted to important updates immediately

**Acceptance Criteria:**
- Given device registration, When app installed, Then push token stored
- Given notification trigger, When event occurs, Then push notification sent
- Given notification tap, When clicked, Then opens relevant app screen
- Given notification preferences, When set, Then respected for sending
- Given delivery status, When sent, Then delivery confirmation tracked

**Technical Notes:**
- Use Expo Push API for delivery
- DevicePushToken: userId, token, platform, createdAt
- Notification types: ANNOUNCEMENT, ATTENDANCE, FEE, RESULT, CHAT

---

#### Story 10.3: SMS Integration
**As an** admin
**I want** SMS notifications sent
**So that** users without smartphones receive important alerts

**Acceptance Criteria:**
- Given SMS trigger, When event configured, Then SMS sent
- Given bulk SMS, When campaign created, Then batch processed
- Given SMS template, When used, Then personalized message sent
- Given SMS delivery, When sent, Then delivery status tracked
- Given SMS credits, When low, Then admin alerted

**Technical Notes:**
- Integration: Twilio or MSG91
- SMSLog: recipient, message, status, sentAt, gatewayMessageId
- BullMQ for bulk SMS processing

---

#### Story 10.4: Email Integration
**As an** admin
**I want** email notifications sent
**So that** users receive detailed communications via email

**Acceptance Criteria:**
- Given email trigger, When event occurs, Then email sent
- Given email template, When used, Then branded email generated
- Given attachments, When included, Then sent with email
- Given bulk email, When campaign run, Then batch processed
- Given email tracking, When opened, Then open tracked

**Technical Notes:**
- Integration: SendGrid or AWS SES
- EmailTemplate: name, subject, body (HTML), variables
- BullMQ for bulk email processing

---

#### Story 10.5: Real-time Notifications with Socket.io
**As a** user
**I want** real-time in-app notifications
**So that** I see updates without refreshing the page

**Acceptance Criteria:**
- Given socket connection, When authenticated, Then connection established
- Given notification event, When triggered, Then received in real-time
- Given notification badge, When unread exists, Then count shown
- Given notification list, When opened, Then recent notifications displayed
- Given mark read, When clicked, Then notification marked as read

**Technical Notes:**
- Socket.io with Redis adapter for horizontal scaling
- Notification: userId, type, title, body, data (JSON), readAt
- Room-based broadcasting per user

---

#### Story 10.6: In-app Messaging (Teacher-Parent)
**As a** teacher
**I want** to message parents directly
**So that** I can communicate about student matters

**Acceptance Criteria:**
- Given conversation start, When parent selected, Then chat opened
- Given message send, When sent, Then delivered in real-time
- Given message history, When scrolled, Then previous messages loaded
- Given unread indicator, When new message, Then badge shown
- Given attachment, When sent, Then file delivered

**Technical Notes:**
- Conversation: participants (JSON), lastMessageAt
- Message: conversationId, senderId, content, attachments, sentAt
- Real-time via Socket.io

---

#### Story 10.7: Emergency Alert System
**As an** admin
**I want** to send emergency alerts
**So that** critical information reaches everyone immediately

**Acceptance Criteria:**
- Given emergency creation, When high priority set, Then marked as emergency
- Given distribution, When sent, Then all channels (push, SMS, email) used
- Given confirmation, When required, Then acknowledgment tracked
- Given alert sound, When received on mobile, Then distinct sound played
- Given override, When sent, Then bypasses do-not-disturb settings

**Technical Notes:**
- EmergencyAlert: title, message, sentAt, acknowledgedBy (JSON)
- Multi-channel delivery: push, SMS, email simultaneously
- High priority push notification settings

