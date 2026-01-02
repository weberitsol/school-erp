# School ERP - Database Schema Design

**Version:** 1.0
**Date:** 2025-12-16
**Architect:** Winston (System Architect)
**Database:** PostgreSQL (Primary) + MongoDB (Documents) + Redis (Cache)

---

## 1. Database Strategy

### 1.1 Multi-Database Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │  MongoDB    │  │   Redis     │             │
│  │ (Primary)   │  │ (Documents) │  │  (Cache)    │             │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤             │
│  │ Users       │  │ Parsed Docs │  │ Sessions    │             │
│  │ Students    │  │ Question    │  │ OTP Cache   │             │
│  │ Academics   │  │   Banks     │  │ Rate Limits │             │
│  │ Attendance  │  │ File Meta   │  │ API Cache   │             │
│  │ Finance     │  │ Audit Logs  │  │ Real-time   │             │
│  │ Exams       │  │ Analytics   │  │   Data      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Multi-Tenancy Approach

Using **Schema-based multi-tenancy** for data isolation:
- Each school gets a separate PostgreSQL schema
- Shared `public` schema for common lookups
- Tenant identifier in every query context

---

## 2. Core Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CORE RELATIONSHIPS                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────┐     ┌──────────────┐     ┌─────────────┐                      │
│   │ Tenant  │────<│    Users     │>────│   Roles     │                      │
│   └─────────┘     └──────────────┘     └─────────────┘                      │
│        │                 │                    │                              │
│        │          ┌──────┴──────┐            │                              │
│        │          ▼             ▼            │                              │
│        │    ┌──────────┐  ┌──────────┐       │                              │
│        │    │ Students │  │  Staff   │       │                              │
│        │    └──────────┘  └──────────┘       │                              │
│        │          │             │            │                              │
│        │          ▼             ▼            │                              │
│        │    ┌──────────────────────┐         │                              │
│        └───>│   Academic Year      │<────────┘                              │
│             └──────────────────────┘                                        │
│                      │                                                       │
│         ┌────────────┼────────────┐                                         │
│         ▼            ▼            ▼                                         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │
│   │ Classes  │ │ Subjects │ │  Exams   │                                   │
│   └──────────┘ └──────────┘ └──────────┘                                   │
│         │            │            │                                         │
│         └────────────┼────────────┘                                         │
│                      ▼                                                       │
│             ┌──────────────┐                                                │
│             │  Enrollments │                                                │
│             └──────────────┘                                                │
│                      │                                                       │
│         ┌────────────┼────────────┐                                         │
│         ▼            ▼            ▼                                         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │
│   │Attendance│ │  Marks   │ │   Fees   │                                   │
│   └──────────┘ └──────────┘ └──────────┘                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. PostgreSQL Schema Definitions

### 3.1 Tenant & Identity Management

```sql
-- ============================================
-- SCHEMA: public (shared across all tenants)
-- ============================================

-- Tenant/School Registry
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    domain VARCHAR(255),
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'basic',
    subscription_status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Global User Registry (for cross-tenant auth)
CREATE TABLE public.global_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMPTZ,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Tenant Mapping
CREATE TABLE public.user_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_user_id UUID REFERENCES public.global_users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    tenant_user_id UUID NOT NULL, -- Reference to tenant-specific user
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(global_user_id, tenant_id)
);

-- ============================================
-- SCHEMA: tenant_xxx (per-tenant schema)
-- ============================================

-- Roles & Permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default roles: admin, principal, teacher, student, parent, staff, accountant, librarian

-- Users (Tenant-specific)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_user_id UUID, -- Link to public.global_users
    role_id UUID REFERENCES roles(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    last_active_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
```

### 3.2 Student Information System

```sql
-- Students Master
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(20),

    -- Personal Information
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    blood_group VARCHAR(5),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    caste_category VARCHAR(50),
    mother_tongue VARCHAR(50),

    -- Contact
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),

    -- Medical
    medical_conditions TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),

    -- Academic
    admission_date DATE NOT NULL,
    admission_class_id UUID,
    current_class_id UUID,
    current_section_id UUID,
    academic_status VARCHAR(20) DEFAULT 'active', -- active, graduated, transferred, dropout

    -- Documents
    photo_url TEXT,
    birth_certificate_url TEXT,
    previous_school_tc_url TEXT,

    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_current_class ON students(current_class_id);
CREATE INDEX idx_students_status ON students(academic_status);

-- Parent/Guardian Information
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),

    -- Personal
    relation_type VARCHAR(20) NOT NULL, -- father, mother, guardian
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),

    -- Professional
    occupation VARCHAR(100),
    organization VARCHAR(200),
    designation VARCHAR(100),
    annual_income DECIMAL(15, 2),

    -- Address (if different from student)
    address_same_as_student BOOLEAN DEFAULT TRUE,
    address_line1 TEXT,
    city VARCHAR(100),

    -- Documents
    photo_url TEXT,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    id_proof_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student-Guardian Relationship
CREATE TABLE student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES guardians(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    receives_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, guardian_id)
);

-- Sibling Relationships
CREATE TABLE student_siblings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    sibling_id UUID REFERENCES students(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, sibling_id),
    CHECK (student_id != sibling_id)
);
```

### 3.3 Academic Structure

```sql
-- Academic Years
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- "2024-25"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terms/Semesters within Academic Year
CREATE TABLE academic_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID REFERENCES academic_years(id),
    name VARCHAR(50) NOT NULL, -- "Term 1", "Semester 1"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sequence_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes/Grades
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL, -- "Class 10", "Grade 5"
    code VARCHAR(20) NOT NULL,
    sequence_order INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections within Classes
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    name VARCHAR(20) NOT NULL, -- "A", "B", "Science"
    capacity INT DEFAULT 40,
    class_teacher_id UUID REFERENCES users(id),
    room_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    subject_type VARCHAR(20) DEFAULT 'core', -- core, elective, language, activity
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class-Subject Mapping
CREATE TABLE class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    academic_year_id UUID REFERENCES academic_years(id),
    is_mandatory BOOLEAN DEFAULT TRUE,
    periods_per_week INT DEFAULT 5,
    max_marks DECIMAL(5, 2) DEFAULT 100,
    pass_marks DECIMAL(5, 2) DEFAULT 35,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, subject_id, academic_year_id)
);

-- Teacher-Subject-Section Assignment
CREATE TABLE teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id),
    subject_id UUID REFERENCES subjects(id),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID REFERENCES academic_years(id),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id, section_id, academic_year_id)
);

-- Student Enrollment (Class-Section per Year)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID REFERENCES academic_years(id),
    roll_number VARCHAR(20),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, promoted, detained, transferred
    promoted_from_enrollment_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_enrollments_class_section ON enrollments(class_id, section_id, academic_year_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);

-- Timetable
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID REFERENCES academic_years(id),
    day_of_week INT NOT NULL, -- 1=Monday, 7=Sunday
    slot_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES users(id),
    room_number VARCHAR(20),
    slot_type VARCHAR(20) DEFAULT 'class', -- class, break, assembly, lunch
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section_id, academic_year_id, day_of_week, slot_number)
);
```

### 3.4 Attendance Management

```sql
-- Attendance Records
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    enrollment_id UUID REFERENCES enrollments(id),
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- present, absent, late, half_day, excused

    -- For subject-wise attendance
    subject_id UUID REFERENCES subjects(id),
    timetable_slot_id UUID REFERENCES timetable_slots(id),

    -- Metadata
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    marking_method VARCHAR(20) DEFAULT 'manual', -- manual, biometric, qr, gps
    device_info JSONB,

    -- Late arrival specifics
    arrival_time TIME,
    late_minutes INT,

    -- Leave reference if excused
    leave_request_id UUID,

    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_student_date ON attendance(student_id, attendance_date);
CREATE INDEX idx_attendance_enrollment_date ON attendance(enrollment_id, attendance_date);
CREATE UNIQUE INDEX idx_attendance_unique ON attendance(student_id, attendance_date, COALESCE(subject_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Leave Requests
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    leave_type VARCHAR(50) NOT NULL, -- sick, family, vacation, other
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    supporting_document_url TEXT,

    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Submitted by (could be parent)
    submitted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Examination & Assessment

```sql
-- Exam Types
CREATE TABLE exam_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- "Unit Test", "Mid Term", "Final"
    code VARCHAR(20) NOT NULL,
    weightage DECIMAL(5, 2), -- Contribution to final grade
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    exam_type_id UUID REFERENCES exam_types(id),
    academic_year_id UUID REFERENCES academic_years(id),
    term_id UUID REFERENCES academic_terms(id),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, ongoing, completed, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Schedule (per subject)
CREATE TABLE exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL,
    pass_marks DECIMAL(5, 2) NOT NULL,
    room_number VARCHAR(20),
    invigilator_id UUID REFERENCES users(id),
    syllabus_covered TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Bank (PostgreSQL reference, actual content in MongoDB)
CREATE TABLE question_bank_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mongo_id VARCHAR(50) NOT NULL, -- Reference to MongoDB document
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    chapter VARCHAR(200),
    topic VARCHAR(200),
    question_type VARCHAR(20) NOT NULL, -- mcq, short, long, true_false, fill_blank
    difficulty VARCHAR(20), -- easy, medium, hard
    marks DECIMAL(5, 2),
    tags TEXT[],
    source_document_id UUID, -- Reference to parsed document
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_bank_subject ON question_bank_refs(subject_id, class_id);
CREATE INDEX idx_question_bank_tags ON question_bank_refs USING GIN(tags);

-- Online Tests
CREATE TABLE online_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    test_type VARCHAR(20) DEFAULT 'practice', -- practice, graded, assignment
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id), -- NULL = all sections

    -- Configuration
    total_marks DECIMAL(5, 2) NOT NULL,
    pass_marks DECIMAL(5, 2),
    duration_minutes INT NOT NULL,
    total_questions INT NOT NULL,

    -- Scheduling
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_submission_penalty DECIMAL(5, 2) DEFAULT 0,

    -- Settings
    shuffle_questions BOOLEAN DEFAULT TRUE,
    shuffle_options BOOLEAN DEFAULT TRUE,
    show_results_immediately BOOLEAN DEFAULT FALSE,
    allow_review BOOLEAN DEFAULT TRUE,
    max_attempts INT DEFAULT 1,
    require_webcam BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, active, closed

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Questions (linking tests to question bank)
CREATE TABLE test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES online_tests(id) ON DELETE CASCADE,
    question_ref_id UUID REFERENCES question_bank_refs(id),
    sequence_order INT NOT NULL,
    marks DECIMAL(5, 2) NOT NULL,
    negative_marks DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Test Attempts
CREATE TABLE test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES online_tests(id),
    student_id UUID REFERENCES students(id),
    attempt_number INT DEFAULT 1,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    time_taken_seconds INT,

    -- Scoring
    total_score DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, submitted, graded, abandoned

    -- Proctoring
    proctoring_flags JSONB DEFAULT '[]',
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Question Responses
CREATE TABLE test_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
    test_question_id UUID REFERENCES test_questions(id),

    -- Response
    response_text TEXT,
    selected_options JSONB, -- For MCQ: ["a", "c"]

    -- Grading
    marks_obtained DECIMAL(5, 2),
    is_correct BOOLEAN,
    auto_graded BOOLEAN DEFAULT FALSE,
    graded_by UUID REFERENCES users(id),
    grading_remarks TEXT,

    -- Metadata
    time_spent_seconds INT,
    answered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marks Entry (for offline exams)
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    enrollment_id UUID REFERENCES enrollments(id),
    exam_schedule_id UUID REFERENCES exam_schedules(id),

    marks_obtained DECIMAL(5, 2),
    grade VARCHAR(5),
    grade_points DECIMAL(3, 2),

    is_absent BOOLEAN DEFAULT FALSE,
    is_exempted BOOLEAN DEFAULT FALSE,

    remarks TEXT,
    entered_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(student_id, exam_schedule_id)
);

CREATE INDEX idx_marks_enrollment ON marks(enrollment_id);
CREATE INDEX idx_marks_exam ON marks(exam_schedule_id);

-- Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,

    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    section_id UUID REFERENCES sections(id),

    -- Files
    attachment_urls TEXT[],

    -- Dates
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date TIMESTAMPTZ NOT NULL,
    allow_late_submission BOOLEAN DEFAULT TRUE,
    late_penalty_per_day DECIMAL(5, 2) DEFAULT 0,

    -- Grading
    total_marks DECIMAL(5, 2),
    grading_rubric JSONB,

    status VARCHAR(20) DEFAULT 'draft', -- draft, published, closed

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id),
    student_id UUID REFERENCES students(id),

    submission_text TEXT,
    attachment_urls TEXT[],

    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT FALSE,

    -- Grading
    marks_obtained DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    grade VARCHAR(5),
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMPTZ,

    -- Plagiarism
    plagiarism_score DECIMAL(5, 2),
    plagiarism_report_url TEXT,

    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, returned, resubmit

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(assignment_id, student_id)
);

-- Grading Scales
CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    scale_type VARCHAR(20) NOT NULL, -- percentage, letter, gpa, cgpa
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grade Definitions
CREATE TABLE grade_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grading_scale_id UUID REFERENCES grading_scales(id),
    grade VARCHAR(10) NOT NULL,
    min_percentage DECIMAL(5, 2) NOT NULL,
    max_percentage DECIMAL(5, 2) NOT NULL,
    grade_points DECIMAL(3, 2),
    description VARCHAR(100),
    sequence_order INT NOT NULL
);

-- Report Cards
CREATE TABLE report_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    enrollment_id UUID REFERENCES enrollments(id),
    academic_year_id UUID REFERENCES academic_years(id),
    term_id UUID REFERENCES academic_terms(id),

    -- Calculated Results
    total_marks DECIMAL(8, 2),
    marks_obtained DECIMAL(8, 2),
    percentage DECIMAL(5, 2),
    grade VARCHAR(10),
    gpa DECIMAL(4, 2),
    rank_in_class INT,
    rank_in_section INT,

    -- Attendance Summary
    total_working_days INT,
    days_present INT,
    attendance_percentage DECIMAL(5, 2),

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, generated, published
    published_at TIMESTAMPTZ,

    -- Remarks
    class_teacher_remarks TEXT,
    principal_remarks TEXT,

    -- Generated PDF
    pdf_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 Finance & Fees

```sql
-- Fee Categories
CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- "Tuition", "Transport", "Lab"
    code VARCHAR(20) NOT NULL,
    description TEXT,
    is_refundable BOOLEAN DEFAULT FALSE,
    accounting_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Structures
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id),
    class_id UUID REFERENCES classes(id),
    student_category VARCHAR(50), -- general, sc, st, obc, ews
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fee Structure Items
CREATE TABLE fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    fee_category_id UUID REFERENCES fee_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'annual', -- annual, term, monthly, one_time
    due_day INT, -- Day of month for monthly
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed
    value DECIMAL(12, 2) NOT NULL,
    applies_to VARCHAR(20) DEFAULT 'all', -- all, specific_categories
    applicable_categories UUID[], -- fee_category IDs
    criteria JSONB, -- {"type": "sibling", "min_siblings": 2}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Fee Allocation
CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    enrollment_id UUID REFERENCES enrollments(id),
    fee_structure_id UUID REFERENCES fee_structures(id),
    fee_category_id UUID REFERENCES fee_categories(id),

    -- Amounts
    base_amount DECIMAL(12, 2) NOT NULL,
    discount_id UUID REFERENCES discounts(id),
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL,

    -- Installment
    installment_number INT DEFAULT 1,
    due_date DATE NOT NULL,

    -- Status
    amount_paid DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, overdue, waived

    -- Late fee
    late_fee_applied DECIMAL(12, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);
CREATE INDEX idx_student_fees_due_date ON student_fees(due_date);

-- Fee Payments
CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id),

    -- Payment Details
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL, -- cash, cheque, online, upi, card

    -- Online Payment
    gateway VARCHAR(50), -- razorpay, stripe
    gateway_transaction_id VARCHAR(100),
    gateway_order_id VARCHAR(100),
    gateway_response JSONB,

    -- Cheque Details
    cheque_number VARCHAR(20),
    cheque_date DATE,
    bank_name VARCHAR(100),

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, refunded

    -- Collected By
    collected_by UUID REFERENCES users(id),

    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Allocation to Fees
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES fee_payments(id),
    student_fee_id UUID REFERENCES student_fees(id),
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES fee_payments(id),
    student_id UUID REFERENCES students(id),
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,

    -- Approval
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, processed
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    -- Processing
    refund_mode VARCHAR(20), -- same_as_payment, bank_transfer, cash
    refund_reference VARCHAR(100),
    processed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 Communication

```sql
-- Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    content_html TEXT,
    attachment_urls TEXT[],

    -- Targeting
    target_audience VARCHAR(20) NOT NULL, -- all, class, section, role
    target_class_ids UUID[],
    target_section_ids UUID[],
    target_roles VARCHAR(20)[],

    -- Scheduling
    publish_at TIMESTAMPTZ DEFAULT NOW(),
    expire_at TIMESTAMPTZ,

    -- Priority
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Notifications
    send_push BOOLEAN DEFAULT TRUE,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement Read Status
CREATE TABLE announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES announcements(id),
    user_id UUID REFERENCES users(id),
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Messages (Direct Messaging)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES users(id),

    content TEXT NOT NULL,
    attachment_urls TEXT[],

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) DEFAULT 'direct', -- direct, group
    title VARCHAR(200), -- For group chats

    -- For direct parent-teacher chat
    teacher_id UUID REFERENCES users(id),
    parent_id UUID REFERENCES users(id),
    student_id UUID REFERENCES students(id),

    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- "fee_reminder", "attendance_absent"
    name VARCHAR(100) NOT NULL,

    -- Templates (with placeholders)
    push_title VARCHAR(200),
    push_body TEXT,
    email_subject VARCHAR(200),
    email_body TEXT,
    sms_body VARCHAR(160),

    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    allow_user_disable BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    template_id UUID REFERENCES notification_templates(id),

    -- Content
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',

    -- Delivery Channels
    channels VARCHAR(20)[] NOT NULL, -- ['push', 'email', 'sms']

    -- Status per channel
    push_status VARCHAR(20) DEFAULT 'pending',
    push_sent_at TIMESTAMPTZ,
    email_status VARCHAR(20) DEFAULT 'pending',
    email_sent_at TIMESTAMPTZ,
    sms_status VARCHAR(20) DEFAULT 'pending',
    sms_sent_at TIMESTAMPTZ,

    -- Read Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(push_status, email_status, sms_status);
```

### 3.8 Document Intelligence

```sql
-- Uploaded Documents (for AI processing)
CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- File Info
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- pdf, docx, doc, txt, image
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL, -- S3/Azure path

    -- Classification
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    chapter VARCHAR(200),

    -- Processing Status
    processing_status VARCHAR(20) DEFAULT 'uploaded', -- uploaded, processing, completed, failed
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_error TEXT,

    -- Results
    extracted_text_path TEXT, -- Path to extracted text
    questions_extracted INT DEFAULT 0,
    mongo_result_id VARCHAR(50), -- Reference to MongoDB parsed result

    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploaded_documents_status ON uploaded_documents(processing_status);
CREATE INDEX idx_uploaded_documents_subject ON uploaded_documents(subject_id, class_id);
```

### 3.9 Supporting Tables

```sql
-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
    entity_type VARCHAR(50) NOT NULL, -- student, user, payment, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Settings
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, key)
);

-- File Uploads
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50), -- student, assignment, announcement
    entity_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    cdn_url TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);

-- Translations (i18n)
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locale VARCHAR(10) NOT NULL,
    namespace VARCHAR(50) NOT NULL, -- common, dashboard, fees, etc.
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(locale, namespace, key)
);

CREATE INDEX idx_translations_locale ON translations(locale, namespace);
```

---

## 4. MongoDB Collections

### 4.1 Question Bank Collection

```javascript
// Collection: questions
{
  _id: ObjectId,

  // PostgreSQL Reference
  pg_ref_id: "uuid-string",

  // Question Content
  question_text: "What is the capital of France?",
  question_html: "<p>What is the <strong>capital</strong> of France?</p>",
  question_image_urls: [],

  // Question Type
  type: "mcq", // mcq, true_false, fill_blank, short_answer, long_answer, matching

  // Options (for MCQ)
  options: [
    { id: "a", text: "London", is_correct: false },
    { id: "b", text: "Paris", is_correct: true },
    { id: "c", text: "Berlin", is_correct: false },
    { id: "d", text: "Madrid", is_correct: false }
  ],

  // Answer
  correct_answer: "b",
  answer_explanation: "Paris is the capital and largest city of France.",

  // Metadata
  subject_code: "GEO",
  class_code: "10",
  chapter: "European Geography",
  topic: "Capital Cities",
  difficulty: "easy", // easy, medium, hard
  marks: 1,
  estimated_time_seconds: 30,

  // Tags for search
  tags: ["geography", "europe", "capitals", "france"],

  // Source
  source_document_id: "uuid-string",
  source_page_number: 5,
  auto_generated: true,
  human_verified: false,

  // Audit
  created_by: "uuid-string",
  created_at: ISODate,
  updated_at: ISODate
}
```

### 4.2 Parsed Documents Collection

```javascript
// Collection: parsed_documents
{
  _id: ObjectId,

  // PostgreSQL Reference
  uploaded_document_id: "uuid-string",

  // Parsed Content
  pages: [
    {
      page_number: 1,
      text_content: "Full extracted text...",
      tables: [
        {
          headers: ["Column1", "Column2"],
          rows: [["Value1", "Value2"], ["Value3", "Value4"]]
        }
      ],
      images: [
        {
          image_path: "s3://bucket/path/image1.png",
          ocr_text: "Text from image",
          position: { x: 100, y: 200 }
        }
      ]
    }
  ],

  // Identified Questions
  extracted_questions: [
    {
      text: "Question text",
      type: "mcq",
      options: [...],
      page_number: 3,
      confidence_score: 0.92,
      imported_to_question_bank: true,
      question_bank_id: "uuid-string"
    }
  ],

  // Classification
  detected_subject: "Mathematics",
  detected_topics: ["Algebra", "Quadratic Equations"],
  language: "en",

  // Processing Metadata
  parser_version: "2.1.0",
  processing_time_ms: 5430,
  ocr_used: true,
  ai_model_used: "gpt-4",

  created_at: ISODate
}
```

---

## 5. Redis Key Patterns

```
# Session Management
session:{user_id}:{session_id} -> JWT token data (TTL: 24h)

# OTP Cache
otp:{phone/email}:{type} -> OTP code (TTL: 5min)

# Rate Limiting
rate_limit:{user_id}:{endpoint} -> request count (TTL: 1min)

# API Response Cache
cache:api:{endpoint_hash} -> response JSON (TTL: varies)

# Real-time Data
realtime:attendance:{section_id}:{date} -> live attendance data
realtime:online_test:{test_id}:active_users -> count

# Locks
lock:fee_payment:{student_id} -> processing lock (TTL: 30s)
lock:document_processing:{doc_id} -> processing lock (TTL: 10min)

# Pub/Sub Channels
channel:notifications:{user_id}
channel:attendance:{section_id}
channel:test_updates:{test_id}
```

---

## 6. Indexing Strategy

### Critical Indexes

```sql
-- High-frequency queries
CREATE INDEX CONCURRENTLY idx_students_search
ON students USING GIN (to_tsvector('english', first_name || ' ' || last_name || ' ' || admission_number));

CREATE INDEX CONCURRENTLY idx_attendance_daily_report
ON attendance(attendance_date, enrollment_id)
WHERE status IN ('present', 'absent', 'late');

CREATE INDEX CONCURRENTLY idx_fees_pending
ON student_fees(due_date, status)
WHERE status IN ('pending', 'partial', 'overdue');

-- Composite indexes for common joins
CREATE INDEX CONCURRENTLY idx_enrollments_full
ON enrollments(academic_year_id, class_id, section_id, student_id);
```

---

*Schema designed by Winston (System Architect) - BMAD Agent Team*
