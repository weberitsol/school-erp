# Mess Management Module Documentation

## Overview

The Mess Management Module handles all operations related to student dining and meal management including menu planning, meal billing, vendor management, dietary preferences, and complaint tracking. This module supports multiple mess facilities with different meal plans and dietary accommodations.

**Current Status**: Not Implemented
**Completion**: 0%
**Priority**: High

---

## Table of Contents

1. [Module Features](#module-features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Pages](#frontend-pages)
6. [Implementation Checklist](#implementation-checklist)
7. [Business Logic](#business-logic)
8. [Error Handling](#error-handling)

---

## Module Features

### Core Features
- Multiple mess management
- Centralized food item and recipe management
- Daily/Weekly menu planning with approval workflow
- Meal plan management (breakfast, lunch, dinner, snacks)
- Meal variant management (vegetarian, non-vegetarian, vegan)
- Student enrollment in meal plans
- Meal attendance tracking with card/biometric support
- Meal billing and payment tracking with pro-rata calculations
- Dietary preference and allergy management with cross-checking
- Nutritional information tracking per food item and meal
- Kitchen hygiene and food safety compliance tracking
- Vendor/Contractor management with performance metrics
- Attendance tracking for meal utilization
- Meal quality feedback with action tracking
- Complaint and suggestion tracking with resolution workflow
- Holiday calendar management with meal arrangements
- Extra meal booking system
- Mess staff management with shift tracking
- Ingredient inventory integration with Store module

### Reporting & Analytics
- Meal consumption reports
- Financial reports (revenue, expenses)
- Dietary preference analytics
- Food waste analysis
- Vendor performance metrics
- Student satisfaction metrics

---

## Database Schema

### Core Models to be Implemented

#### Mess Model
```prisma
model Mess {
  id                  String    @id @default(uuid())

  // Basic Information
  name               String    @unique
  code               String    @unique
  capacity           Int       // Max students that can be catered to

  // Contact & Location
  address            String
  city               String
  state              String
  zipCode            String
  phone              String
  email              String?

  // Management
  managerUserId      String?
  manager            User?     @relation("MessManager", fields: [managerUserId], references: [id])

  // Operational Info
  isActive           Boolean   @default(true)
  cuisineType        String[]  // ["VEGETARIAN", "NON_VEGETARIAN", "VEGAN"]

  // Relationships
  mealPlans          MealPlan[]
  menus              Menu[]
  menuApprovals      MenuApproval[]
  meals              Meal[]
  vendors            Vendor[]
  staff              MessStaff[]
  enrollment         MessEnrollment[]
  billing            MessBill[]
  complaints         MessComplaint[]
  feedback           MealFeedback[]
  hygieneChecklists  KitchenHygieneChecklist[]
  foodItems          FoodItem[]
  holidays           HolidayCalendar[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### MealPlan Model
```prisma
model MealPlan {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id], onDelete: Cascade)

  // Plan Details
  name               String     // "Premium Plan", "Standard Plan", "Economy Plan"
  code               String     @unique
  description        String?

  // Meals Included
  includesBreakfast  Boolean    @default(true)
  includesLunch      Boolean    @default(true)
  includesDinner     Boolean    @default(true)
  includesSnacks     Boolean    @default(false)

  // Pricing
  monthlyPrice       Float
  quarterlyPrice     Float?
  annualPrice        Float?

  // Dietary Options
  vegetarianOption   Boolean    @default(true)
  nonVegOption       Boolean    @default(true)
  veganOption        Boolean    @default(false)

  // Validity
  isActive           Boolean    @default(true)
  startDate          DateTime?
  endDate            DateTime?

  // Relationships
  enrollments        MessEnrollment[]

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([messId, name])
}
```

#### Menu Model
```prisma
model Menu {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id], onDelete: Cascade)

  // Menu Period
  menuDate           DateTime   // Date for which menu is planned
  dayOfWeek          String     // MONDAY, TUESDAY, etc.
  isHoliday          Boolean    @default(false)
  holidayName        String?    // "Diwali", "New Year", etc.

  // Menu Items
  meals              Meal[]

  // Approval (NEW)
  approval           MenuApproval?

  // Planning Info
  plannedBy          String?
  notes              String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([messId, menuDate])
  @@index([messId, menuDate])
}
```

#### FoodItem Model (NEW - CRITICAL)
```prisma
model FoodItem {
  id                  String    @id @default(uuid())

  messId              String?
  mess                Mess?     @relation(fields: [messId], references: [id])

  // Basic Information
  name               String    @unique
  description        String?
  foodCategory       String    // VEGETABLE, MEAT, DAIRY, GRAIN, SPICE, OIL, CONDIMENT, etc.

  // Cost Tracking
  standardCost       Float     // Cost per unit to prepare/purchase
  unit               String    // grams, ml, pieces, kg, liters, etc.

  // Nutritional Info (per 100g)
  caloriesPer100g    Float?
  proteinPer100g     Float?
  carbsPer100g       Float?
  fatPer100g         Float?
  fiberPer100g       Float?

  // Allergen Information
  allergenInfo       String[]  // ["NUTS", "GLUTEN", "DAIRY", "SHELLFISH", "EGGS", "FISH", "SOY", "SESAME"]
  containsAllergens  Boolean   @default(false)

  // Dietary Classification
  isVegetarian       Boolean   @default(false)
  isNonVegetarian    Boolean   @default(false)
  isVegan            Boolean   @default(false)

  // Relationships
  recipes            RecipeIngredient[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@unique([name])
  @@index([foodCategory])
}
```

#### Recipe Model (NEW - CRITICAL)
```prisma
model Recipe {
  id                  String    @id @default(uuid())

  mealId              String
  meal                Meal      @relation(fields: [mealId], references: [id], onDelete: Cascade)

  variantId           String?
  variant             MealVariant? @relation(fields: [variantId], references: [id])

  // Recipe Details
  servingSize         Int       // grams/ml per serving
  servings            Int       @default(1)

  // Ingredients
  ingredients         RecipeIngredient[]

  // Preparation
  instructions        String?   // Step-by-step cooking instructions
  preparationTime     Int?      // minutes
  cookingTime         Int?      // minutes
  totalTime           Int?      // minutes (calculated)

  // Cost Calculation
  totalCost           Float     // Sum of ingredient costs
  costPerServing      Float     // Calculated

  // Nutritional Summary
  totalCalories       Float?
  totalProtein        Float?
  totalCarbs          Float?
  totalFat            Float?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([mealId, variantId])
}
```

#### RecipeIngredient Model (NEW - CRITICAL)
```prisma
model RecipeIngredient {
  id                  String    @id @default(uuid())

  recipeId            String
  recipe              Recipe    @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  foodItemId          String
  foodItem            FoodItem  @relation(fields: [foodItemId], references: [id])

  // Quantity Details
  quantity            Float
  unit                String    // grams, ml, pieces, cups, tablespoons, etc.
  notes               String?   // e.g., "chopped", "diced", "boiled"

  // Cost
  unitCost            Float     // Cost per unit
  totalCost           Float     // Calculated: quantity * unitCost

  // Allergen Tracking
  carriesAllergen     Boolean   @default(false)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([recipeId, foodItemId])
}
```

#### MealVariant Model (NEW - CRITICAL)
```prisma
model MealVariant {
  id                  String    @id @default(uuid())

  mealId              String
  meal                Meal      @relation(fields: [mealId], references: [id], onDelete: Cascade)

  // Variant Details
  variantType         String    // VEGETARIAN, NON_VEGETARIAN, VEGAN
  variantName         String    // "Paneer Tikka (Veg)" vs "Chicken Tikka (Non-Veg)"
  description         String?

  // Recipe for this variant
  recipes             Recipe[]

  // Nutritional Info (specific to variant)
  calories            Float?
  protein             Float?
  carbs               Float?
  fat                 Float?

  // Allergen Info (specific to variant)
  allergenInfo        String[]
  containsAllergens   Boolean   @default(false)

  // Pricing
  baseCost            Float     // Cost to prepare this variant
  additionalCost      Float     @default(0)  // Extra charge if variant costs more
  studentPrice        Float?    // If charged separately

  // Relationships
  choices             StudentMealChoice[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([mealId, variantType])
  @@index([mealId])
}
```

#### StudentMealChoice Model (NEW - CRITICAL)
```prisma
model StudentMealChoice {
  id                  String    @id @default(uuid())

  attendanceId        String
  attendance          MealAttendance @relation(fields: [attendanceId], references: [id], onDelete: Cascade)

  variantId           String
  variant             MealVariant @relation(fields: [variantId], references: [id])

  // Service Details
  chosenDate          DateTime  @default(now())
  servedDate          DateTime?
  servedTime          DateTime?
  servedBy            String?   // Staff member ID who served

  // Verification
  allergyVerified     Boolean   @default(false)  // Was allergy checked before serving?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([attendanceId])
  @@index([variantId])
}
```

#### Allergen Model (NEW - CRITICAL)
```prisma
model Allergen {
  id                  String    @id @default(uuid())

  name               String    @unique  // PEANUT, TREE_NUT, SHELLFISH, FISH, EGGS, MILK, SOY, WHEAT, SESAME
  displayName        String    // "Peanuts", "Tree Nuts", etc.
  severity           String    // MILD, MODERATE, SEVERE, ANAPHYLAXIS
  description        String?   // Description of reactions

  // Relationships
  studentAllergies   StudentAllergy[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### StudentAllergy Model (NEW - CRITICAL)
```prisma
model StudentAllergy {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  allergenId          String
  allergen            Allergen  @relation(fields: [allergenId], references: [id])

  // Severity Assessment
  severity            String    // MILD, MODERATE, SEVERE, ANAPHYLAXIS
  reaction            String?   // Description of reaction: "itching", "swelling", "anaphylaxis", etc.

  // Verification
  doctorVerified      Boolean   @default(false)
  medicalDocument     String?   // URL to doctor's note/certificate

  // Reporting
  reportDate          DateTime  @default(now())
  reportedBy          String?   // User ID who reported

  // Status
  status              String    @default("ACTIVE") // ACTIVE, INACTIVE, MONITORED

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([enrollmentId, allergenId])
  @@index([severity])
}
```

#### Meal Model (UPDATED)
```prisma
model Meal {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id], onDelete: Cascade)

  menuId              String
  menu                Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)

  // Meal Type
  mealType           String     // BREAKFAST, LUNCH, DINNER, SNACK
  mealTime           String?    // HH:MM format, e.g., "08:00"

  // Content (now linked to FoodItems)
  dishName           String
  description        String?

  // Variants for this meal
  variants           MealVariant[]

  // Recipes for this meal
  recipes            Recipe[]

  // Meal Categories
  mealCategory       String[]   // ["VEGETARIAN", "NON_VEGETARIAN", "VEGAN"]

  // Nutritional Info (overall/average)
  calories           Float?
  protein            Float?     // grams
  carbs              Float?     // grams
  fat                Float?     // grams
  fiber              Float?     // grams

  // Allergen Info (aggregated from all variants)
  allergenInfo       String[]   // ["NUTS", "GLUTEN", "DAIRY", "SHELLFISH"]
  containsAllergens  Boolean    @default(false)

  // Cost (average)
  itemCost           Float?     // Average cost to mess

  // Approval
  approvalStatus     String     @default("PENDING") // PENDING, APPROVED, REJECTED
  approvedBy         String?

  // Relationships
  attendance         MealAttendance[]
  feedback           MealFeedback[]
  choices            StudentMealChoice[]

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([menuId])
  @@index([approvalStatus])
}
```

#### MessEnrollment Model (UPDATED)
```prisma
model MessEnrollment {
  id                  String    @id @default(uuid())

  studentId           String
  student             Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id])

  mealPlanId          String
  mealPlan            MealPlan  @relation(fields: [mealPlanId], references: [id])

  // Enrollment Period
  enrollmentDate      DateTime  @default(now())
  startDate           DateTime
  endDate             DateTime?

  // Dietary Preference
  dietaryPreference   String    // VEGETARIAN, NON_VEGETARIAN, VEGAN

  // Allergies & Restrictions (NEW - linked to Allergen master)
  allergies           StudentAllergy[]   // Link to structured allergen database
  dietaryRestrictions String[]  // ["LACTOSE_INTOLERANT", "GLUTEN_FREE"]
  otherRestrictions   String?

  // Status
  status              String    @default("ACTIVE") // ACTIVE, INACTIVE, SUSPENDED

  // Special Requests
  specialRequests     String?

  // Relationships
  attendance          MealAttendance[]
  billing             MessBill[]
  extras              ExtraMealBooking[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([studentId, messId])
  @@index([status])
}
```

#### MealAttendance Model (UPDATED)
```prisma
model MealAttendance {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  mealId              String
  meal                Meal      @relation(fields: [mealId], references: [id], onDelete: Cascade)

  // Attendance
  attendanceDate      DateTime
  attendanceTime      DateTime? // When student took the meal
  attended           Boolean    @default(false) // Whether student took the meal or not

  // Meal Choice (NEW - track which variant student chose)
  mealChoice         StudentMealChoice?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([enrollmentId, mealId, attendanceDate])
  @@index([attendanceDate])
}
```

#### MessBill Model
```prisma
model MessBill {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id])

  // Billing Period
  billingMonth        Int       // 1-12
  billingYear         Int

  // Amount
  baseMealPlanCost    Float     // From meal plan
  additionalCharges   Float     @default(0)     // Extra meals, etc.
  discount            Float     @default(0)     // If any

  totalAmount         Float     // Calculated: baseCost + additional - discount
  paidAmount          Float     @default(0)

  balanceDue          Float     // Calculated: totalAmount - paidAmount

  // Status
  status              String    @default("PENDING") // PENDING, PARTIAL, PAID, OVERDUE

  dueDate             DateTime?
  paidDate            DateTime?

  // Payment Details
  paymentMethod       String?   // CASH, CHEQUE, BANK_TRANSFER, ONLINE
  transactionId       String?

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([enrollmentId, billingMonth, billingYear])
  @@index([status])
}
```

#### ExtraMealBooking Model
```prisma
model ExtraMealBooking {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id])

  mealDate            DateTime
  mealType            String     // BREAKFAST, LUNCH, DINNER, SNACK

  // Cost
  mealCost            Float

  // Status
  status              String    @default("PENDING") // PENDING, CONFIRMED, CANCELLED

  bookedDate          DateTime  @default(now())
  notes               String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([mealDate])
}
```

#### MealFeedback Model
```prisma
model MealFeedback {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id])

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id])

  mealId              String?
  meal                Meal?     @relation(fields: [mealId], references: [id])

  // Feedback Details
  feedbackType        String    // MEAL_QUALITY, TASTE, QUANTITY, CLEANLINESS, SERVICE, OTHER
  rating              Int       // 1-5 scale

  comment             String?
  feedbackDate        DateTime  @default(now())

  // Status
  isAnonymous         Boolean   @default(false)
  reviewed            Boolean   @default(false)
  actionTaken         String?   // Action taken based on feedback

  // Actions (NEW - track specific actions in response to feedback)
  actions             FeedbackAction[]

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([messId])
  @@index([feedbackDate])
}
```

#### MessComplaint Model
```prisma
model MessComplaint {
  id                  String    @id @default(uuid())

  enrollmentId        String
  enrollment          MessEnrollment @relation(fields: [enrollmentId], references: [id])

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id])

  // Complaint Details
  complaintType       String    // FOOD_QUALITY, HYGIENE, STAFF_BEHAVIOR, BILLING, SERVICE, OTHER
  title              String
  description        String
  severity           String    // LOW, MEDIUM, HIGH, CRITICAL

  // Report
  reportedDate       DateTime  @default(now())
  isAnonymous        Boolean   @default(false)

  // Status
  status             String    @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority           String    @default("NORMAL") // LOW, NORMAL, HIGH, URGENT

  // Resolution
  assignedToId       String?
  assignedTo         User?     @relation(fields: [assignedToId], references: [id])

  resolutionNotes    String?
  resolvedDate       DateTime?

  attachmentUrl      String?   // Image of issue

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([status])
  @@index([severity])
}
```

#### Vendor Model
```prisma
model Vendor {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id])

  // Vendor Details
  name               String
  contact            String
  email              String?
  phone              String

  // Business Details
  registrationNo     String?
  gstNumber          String?
  panNumber          String?

  // Address
  address            String
  city               String
  state              String
  zipCode            String

  // Items Supplied
  suppliesBreakfast  Boolean    @default(false)
  suppliesLunch      Boolean    @default(false)
  suppliesDinner     Boolean    @default(false)

  // Contract
  contractStartDate  DateTime?
  contractEndDate    DateTime?
  isActive           Boolean    @default(true)

  // Rating & Performance
  qualityRating      Float?     // 1-5
  deliveryRating     Float?     // 1-5
  priceCompetitiveness Float?   // 1-5

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([messId, name])
}
```

#### HolidayCalendar Model (UPDATED)
```prisma
model HolidayCalendar {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id])

  holidayDate        DateTime
  holidayName        String
  reason             String?

  // Meal Arrangements (UPDATED - more granular)
  breakfastServed    Boolean    @default(false)
  lunchServed        Boolean    @default(false)
  dinnerServed       Boolean    @default(false)

  specialMenuId      String?    // Alternative holiday menu
  specialMenuNotes   String?

  studentNotification Boolean   @default(true)

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@unique([messId, holidayDate])
}
```

#### MenuApproval Model (NEW)
```prisma
model MenuApproval {
  id                  String    @id @default(uuid())

  menuId              String
  menu                Menu      @relation(fields: [menuId], references: [id], onDelete: Cascade)

  // Submission Details
  submittedBy         String    // Chef/Manager User ID
  submissionDate      DateTime  @default(now())

  // Review Details
  reviewedBy          String?   // Dietician/Manager User ID
  approvalStatus      String    @default("PENDING") // PENDING, APPROVED, REJECTED
  reviewDate          DateTime?
  reviewRemarks       String?

  // Nutritional Verification (optional)
  nutritionalCheckDone Boolean  @default(false)
  nutritionalScore    Float?    // 0-100: How balanced is menu

  // Approval Chain
  approvalChain       Json?     // Array of {reviewer, status, date, remarks}

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([menuId])
  @@index([approvalStatus])
}
```

#### KitchenHygieneChecklist Model (NEW - CRITICAL FOR FOOD SAFETY)
```prisma
model KitchenHygieneChecklist {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id], onDelete: Cascade)

  // Inspection Details
  checkDate           DateTime  @default(now())
  checkType           String    // DAILY, WEEKLY, MONTHLY, ANNUAL
  checkTime           String?   // HH:MM format

  // Inspection Items (CRITICAL areas)
  checklist           Json      // {
                                  // "cleanliness": true/false,
                                  // "temperature_maintenance": true/false,
                                  // "equipment_condition": true/false,
                                  // "food_storage": true/false,
                                  // "water_quality": true/false,
                                  // "waste_disposal": true/false,
                                  // "staff_hygiene": true/false
                                  // }

  score               Int       // 0-100

  // Inspector Info
  inspectedBy         String
  inspectedByName     String?

  // Findings
  issues              String?   // Identified issues
  criticalIssues      Boolean   @default(false)

  // Follow-up
  correctionDeadline  DateTime?
  correctionDone      Boolean   @default(false)
  correctionDate      DateTime?
  correctionNotes     String?

  // Photos/Evidence
  attachmentUrls      String[]  // URLs to photos of issues/fixed items

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([messId, checkDate])
  @@index([score])
}
```

#### FeedbackAction Model (NEW)
```prisma
model FeedbackAction {
  id                  String    @id @default(uuid())

  feedbackId          String
  feedback            MealFeedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)

  // Action Details
  actionDescription   String
  actionType          String    // INGREDIENT_CHANGE, PREPARATION_CHANGE, PORTION_ADJUSTMENT, QUALITY_CHECK, STAFF_TRAINING, etc.

  // Responsibility
  assignedTo          String    // User ID or department
  targetDate          DateTime?

  // Execution
  status              String    @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, CLOSED
  startedDate         DateTime?
  completionDate      DateTime?

  // Verification
  verifiedBy          String?
  verificationDate    DateTime?
  verificationNotes   String?
  verificationResult  String?   // SUCCESS, PARTIAL, UNSUCCESSFUL

  // Documentation
  documentationUrl    String?   // Evidence of action taken

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([status])
  @@index([targetDate])
}
```

#### MessStaff Model (NEW)
```prisma
model MessStaff {
  id                  String    @id @default(uuid())

  messId              String
  mess                Mess      @relation(fields: [messId], references: [id], onDelete: Cascade)

  // Staff Information
  name               String
  role               String    // MANAGER, COOK, HELPER, CLEANER, STORE_KEEPER
  designation        String?   // More specific title

  // Contact
  phone              String
  email              String?

  // Employment
  joiningDate        DateTime
  status             String    @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE, TERMINATED

  // Qualifications & Training
  qualifications     String[]  // ["Food Safety Certification", "HACCP Training"]
  certifications     String[]  // Specific certs with expiry tracking (if detailed)
  trainingRecord     Json?     // {training_name, date, valid_until}

  // Performance
  performanceRating  Float?    // 1-5
  lastReviewDate     DateTime?

  // Shift Management (if needed)
  shiftsPerWeek      Int?
  assignedShifts     String[]? // ["BREAKFAST", "LUNCH", "DINNER"]

  // Accountability
  foodSafetyResponsible Boolean @default(false)
  signsHygieneChecklist Boolean @default(false)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@unique([messId, name])
  @@index([role])
  @@index([status])
}
```

---

## API Endpoints

### Mess Management Endpoints
```
GET    /api/v1/mess                      - Get all mess facilities
POST   /api/v1/mess                      - Create new mess
GET    /api/v1/mess/{id}                 - Get mess details
PUT    /api/v1/mess/{id}                 - Update mess information
GET    /api/v1/mess/{id}/statistics      - Get mess statistics (students, revenue, feedback)
```

### Meal Plan Endpoints
```
GET    /api/v1/meal-plans                - Get all meal plans
POST   /api/v1/meal-plans                - Create meal plan
GET    /api/v1/meal-plans/{id}           - Get plan details
PUT    /api/v1/meal-plans/{id}           - Update meal plan
```

### Menu & Meal Endpoints
```
GET    /api/v1/menus                     - Get all menus (with date filters)
POST   /api/v1/menus                     - Create menu for date
GET    /api/v1/menus/{date}              - Get menu for specific date
PUT    /api/v1/menus/{id}                - Update menu

GET    /api/v1/meals                     - Get all meals
POST   /api/v1/meals                     - Add meal to menu
GET    /api/v1/meals/{id}                - Get meal details with nutrition
PUT    /api/v1/meals/{id}                - Update meal
DELETE /api/v1/meals/{id}                - Remove meal
```

### Enrollment Endpoints
```
GET    /api/v1/enrollments               - Get all enrollments (with filters)
POST   /api/v1/enrollments               - Enroll student in meal plan
GET    /api/v1/enrollments/{id}          - Get enrollment details
PUT    /api/v1/enrollments/{id}          - Update enrollment (change plan, preferences)
DELETE /api/v1/enrollments/{id}          - Unenroll student

GET    /api/v1/enrollments/student/{id}  - Get student's enrollment
PUT    /api/v1/enrollments/{id}/preferences - Update dietary preferences
```

### Attendance Endpoints
```
POST   /api/v1/attendance/mark           - Mark meal attendance
GET    /api/v1/attendance                - Get attendance records (with filters)
GET    /api/v1/attendance/student/{id}   - Get student's meal attendance
GET    /api/v1/attendance/month-summary  - Get monthly attendance summary
```

### Billing Endpoints
```
GET    /api/v1/bills                     - Get all bills (with filters)
GET    /api/v1/bills/{id}                - Get bill details
POST   /api/v1/bills/generate            - Generate bills for month
PUT    /api/v1/bills/{id}/payment        - Record payment
GET    /api/v1/bills/student/{id}        - Get student's billing history
GET    /api/v1/bills/outstanding         - Get outstanding bills
```

### Extra Meal Booking Endpoints
```
POST   /api/v1/extra-meals               - Book extra meal
GET    /api/v1/extra-meals               - Get extra meal bookings
GET    /api/v1/extra-meals/pending       - Get pending bookings
PUT    /api/v1/extra-meals/{id}/confirm  - Confirm booking
PUT    /api/v1/extra-meals/{id}/cancel   - Cancel booking
```

### Feedback & Complaint Endpoints
```
POST   /api/v1/feedback                  - Submit meal feedback
GET    /api/v1/feedback                  - Get all feedback (with filters)
PUT    /api/v1/feedback/{id}             - Mark feedback as reviewed

POST   /api/v1/complaints                - Lodge complaint
GET    /api/v1/complaints                - Get all complaints (with filters)
PUT    /api/v1/complaints/{id}           - Update complaint status
GET    /api/v1/complaints/{id}           - Get complaint details
```

### Vendor Endpoints
```
GET    /api/v1/vendors                   - Get all vendors
POST   /api/v1/vendors                   - Register vendor
GET    /api/v1/vendors/{id}              - Get vendor details
PUT    /api/v1/vendors/{id}              - Update vendor information
```

### Holiday Calendar Endpoints
```
GET    /api/v1/holidays                  - Get holiday calendar
POST   /api/v1/holidays                  - Add holiday
DELETE /api/v1/holidays/{id}             - Remove holiday
```

### Food Item Management Endpoints (NEW)
```
GET    /api/v1/food-items                - Get all food items
POST   /api/v1/food-items                - Create food item
GET    /api/v1/food-items/{id}           - Get food item details
PUT    /api/v1/food-items/{id}           - Update food item
DELETE /api/v1/food-items/{id}           - Delete food item

GET    /api/v1/food-items/category       - Get items by category
GET    /api/v1/food-items/allergens      - Get items with allergens
```

### Recipe Management Endpoints (NEW)
```
GET    /api/v1/recipes                   - Get all recipes
POST   /api/v1/recipes                   - Create recipe
GET    /api/v1/recipes/{id}              - Get recipe details
PUT    /api/v1/recipes/{id}              - Update recipe
DELETE /api/v1/recipes/{id}              - Delete recipe

GET    /api/v1/recipes/meal/{mealId}     - Get recipes for a meal
GET    /api/v1/recipes/{id}/cost         - Calculate recipe cost
GET    /api/v1/recipes/{id}/nutrition    - Get nutritional summary
```

### Meal Variant Endpoints (NEW)
```
GET    /api/v1/meal-variants             - Get all variants
POST   /api/v1/meal-variants             - Create variant
GET    /api/v1/meal-variants/{id}        - Get variant details
PUT    /api/v1/meal-variants/{id}        - Update variant
DELETE /api/v1/meal-variants/{id}        - Delete variant

GET    /api/v1/meals/{mealId}/variants   - Get variants for a meal
POST   /api/v1/enrollments/{id}/allergen-check - Check allergies against variant
```

### Allergen Management Endpoints (NEW - CRITICAL)
```
GET    /api/v1/allergens                 - Get all allergens
POST   /api/v1/allergens                 - Create allergen
GET    /api/v1/allergens/{id}            - Get allergen details

GET    /api/v1/enrollments/{id}/allergies - Get student allergies
POST   /api/v1/enrollments/{id}/allergies - Add student allergy
PUT    /api/v1/allergies/{id}            - Update student allergy
DELETE /api/v1/allergies/{id}            - Remove student allergy

GET    /api/v1/meals/{mealId}/allergen-conflicts - Check if meal conflicts with allergies
POST   /api/v1/allergies/check-meal      - Check if meal is safe for student
```

### Menu Approval Endpoints (NEW)
```
GET    /api/v1/menus/{id}/approval       - Get menu approval status
POST   /api/v1/menus/{id}/approve        - Approve menu
PUT    /api/v1/menus/{id}/approval       - Update approval
POST   /api/v1/menus/{id}/reject         - Reject menu

GET    /api/v1/menus/pending-approval    - Get menus awaiting approval
```

### Kitchen Hygiene Endpoints (NEW - CRITICAL)
```
GET    /api/v1/hygiene-checks            - Get all hygiene checks
POST   /api/v1/hygiene-checks            - Create hygiene check record
GET    /api/v1/hygiene-checks/{id}       - Get check details
PUT    /api/v1/hygiene-checks/{id}       - Update check record

GET    /api/v1/mess/{id}/hygiene-report  - Get hygiene report for mess
GET    /api/v1/mess/{id}/last-check      - Get last hygiene check
POST   /api/v1/hygiene-checks/{id}/correction - Mark correction as done
```

### Feedback Actions Endpoints (NEW)
```
GET    /api/v1/feedback/{id}/actions     - Get actions for feedback
POST   /api/v1/feedback/{id}/actions     - Create action
PUT    /api/v1/actions/{id}              - Update action
PUT    /api/v1/actions/{id}/complete     - Mark action as complete

GET    /api/v1/mess/{id}/pending-actions - Get pending actions for mess
```

### Mess Staff Endpoints (NEW)
```
GET    /api/v1/mess-staff                - Get all staff
POST   /api/v1/mess-staff                - Hire staff
GET    /api/v1/mess-staff/{id}           - Get staff details
PUT    /api/v1/mess-staff/{id}           - Update staff info
DELETE /api/v1/mess-staff/{id}           - Remove staff

GET    /api/v1/mess/{id}/staff           - Get staff in mess
PUT    /api/v1/mess-staff/{id}/role      - Update staff role
PUT    /api/v1/mess-staff/{id}/training  - Update training records
```

### Meal Choice Endpoints (NEW)
```
POST   /api/v1/attendance/{id}/choose-variant - Record meal variant choice
GET    /api/v1/student/{id}/meal-choices - Get student's meal choices
```

---

## Backend Implementation

### Directory Structure
```
backend/src/
├── controllers/
│   ├── mess.controller.ts
│   ├── meal-plan.controller.ts
│   ├── menu.controller.ts
│   ├── enrollment.controller.ts
│   ├── meal-attendance.controller.ts
│   ├── mess-bill.controller.ts
│   ├── extra-meal.controller.ts
│   ├── feedback.controller.ts
│   ├── mess-complaint.controller.ts
│   ├── vendor.controller.ts
│   ├── food-item.controller.ts (NEW)
│   ├── recipe.controller.ts (NEW)
│   ├── meal-variant.controller.ts (NEW)
│   ├── allergen.controller.ts (NEW - CRITICAL)
│   ├── menu-approval.controller.ts (NEW)
│   ├── kitchen-hygiene.controller.ts (NEW - CRITICAL)
│   ├── feedback-action.controller.ts (NEW)
│   ├── mess-staff.controller.ts (NEW)
│   └── meal-choice.controller.ts (NEW)
├── services/
│   ├── mess.service.ts
│   ├── meal-plan.service.ts
│   ├── menu.service.ts
│   ├── enrollment.service.ts
│   ├── meal-attendance.service.ts
│   ├── mess-bill.service.ts
│   ├── extra-meal.service.ts
│   ├── feedback.service.ts
│   ├── mess-complaint.service.ts
│   ├── vendor.service.ts
│   ├── food-item.service.ts (NEW)
│   ├── recipe.service.ts (NEW)
│   ├── meal-variant.service.ts (NEW)
│   ├── allergen.service.ts (NEW - CRITICAL)
│   ├── allergen-checker.service.ts (NEW - CRITICAL: checks meal safety for allergies)
│   ├── menu-approval.service.ts (NEW)
│   ├── kitchen-hygiene.service.ts (NEW - CRITICAL)
│   ├── feedback-action.service.ts (NEW)
│   ├── mess-staff.service.ts (NEW)
│   └── meal-choice.service.ts (NEW)
├── routes/
│   ├── mess.routes.ts
│   ├── meal-plans.routes.ts
│   ├── menus.routes.ts
│   ├── enrollments.routes.ts
│   ├── attendance.routes.ts
│   ├── bills.routes.ts
│   ├── extra-meals.routes.ts
│   ├── feedback.routes.ts
│   ├── complaints.routes.ts
│   ├── vendors.routes.ts
│   ├── food-items.routes.ts (NEW)
│   ├── recipes.routes.ts (NEW)
│   ├── meal-variants.routes.ts (NEW)
│   ├── allergens.routes.ts (NEW - CRITICAL)
│   ├── menu-approvals.routes.ts (NEW)
│   ├── kitchen-hygiene.routes.ts (NEW - CRITICAL)
│   ├── feedback-actions.routes.ts (NEW)
│   ├── mess-staff.routes.ts (NEW)
│   └── meal-choices.routes.ts (NEW)
└── utils/
    ├── billing-calculator.ts (Bill amount calculations)
    ├── menu-planner.ts (Menu planning utilities)
    ├── recipe-calculator.ts (NEW: Cost & nutrition calculations)
    ├── allergy-validator.ts (NEW - CRITICAL: Cross-checks ingredients against allergies)
    ├── food-safety-checker.ts (NEW - CRITICAL: Validates meals against hygiene standards)
    └── meal-variant-matcher.ts (NEW: Matches students to appropriate meal variants)
```

---

## Frontend Pages

### Dashboard
```
/dashboard/mess/
├── Mess Overview
│   ├── Key statistics (enrolled students, revenue, ratings)
│   ├── Today's menu
│   └── Recent complaints
```

### Menu & Planning
```
/dashboard/mess/menus
├── Monthly calendar view
├── Daily menu detail page
└── Menu planning form (for staff)
```

### Enrollment & Management
```
/dashboard/mess/enrollments
├── Student enrollments list
├── /dashboard/mess/enrollments/[id]
│   ├── Enrollment details
│   ├── Dietary preferences
│   └── Billing history
└── Create enrollment form
```

### Meal Attendance
```
/dashboard/mess/attendance
├── Attendance marking interface
├── Daily attendance summary
└── Student attendance history
```

### Billing
```
/dashboard/mess/billing
├── Monthly bills list
├── /dashboard/mess/billing/[id]
│   ├── Bill details
│   └── Payment tracking
├── Payment recording form
└── Outstanding bills report
```

### Extra Meals
```
/dashboard/mess/extra-meals
├── Booking form
├── Pending bookings list
└── Confirmation interface
```

### Feedback & Complaints
```
/dashboard/mess/feedback
├── Feedback submission form
├── Feedback analytics/dashboard
└── Feedback history

/dashboard/mess/complaints
├── Complaint list (with status filter)
├── /dashboard/mess/complaints/[id]
│   ├── Complaint details
│   └── Resolution form
└── Lodge complaint form
```

### Food Item & Recipe Management (NEW - CRITICAL)
```
/dashboard/mess/food-items
├── Food item master list
├── Create/edit food item form (name, cost, nutrition, allergens)
├── Food item categorization
└── Allergen tagging interface

/dashboard/mess/recipes
├── Recipe list
├── Create/edit recipe form
├── Ingredient selection and quantity
├── Recipe cost calculator
├── Nutritional summary calculator
└── Recipe variant management
```

### Meal Variant Management (NEW - CRITICAL)
```
/dashboard/mess/meal-variants
├── Variant management for meals
├── Vegetarian/Non-veg/Vegan variant creation
├── Variant cost and pricing
├── Variant allergen info
└── Variant assignment to meals
```

### Allergen Management (NEW - CRITICAL)
```
/dashboard/mess/allergens
├── Allergen master list (system allergens)
├── Add custom allergens
├── Student allergy management
└── Doctor verification documents upload

/dashboard/mess/allergy-checker
├── Pre-meal allergy verification
├── Meal safety confirmation
├── Kitchen staff allergy alerts
└── Safe variant recommendation
```

### Menu Approval Workflow (NEW)
```
/dashboard/mess/menu-approvals
├── Pending menus for approval
├── Menu details with nutritional summary
├── Approval/Rejection interface
├── Approval history
└── Nutritional balance verification checklist
```

### Kitchen Hygiene & Safety (NEW - CRITICAL)
```
/dashboard/mess/hygiene-checklist
├── Daily hygiene check form
├── Checklist items (cleanliness, temperature, etc.)
├── Issue documentation with photos
├── Correction tracking
└── Historical hygiene reports

/dashboard/mess/hygiene-reports
├── Hygiene score dashboard
├── Trends over time
├── Critical issues tracking
└── Corrective action status
```

### Feedback Action Management (NEW)
```
/dashboard/mess/feedback-actions
├── Pending feedback actions list
├── Action details and assignments
├── Status tracking (pending, in-progress, completed)
├── Verification and closure
└── Impact assessment
```

### Mess Staff Management (NEW)
```
/dashboard/mess/staff
├── Staff directory
├── Hire/termination
├── Training records
├── Performance ratings
└── Shift assignment
```

### Student Portal
```
/dashboard/student/mess
├── My meal plan
├── Current menu with variant options
├── Meal attendance
├── Billing and payments
├── My feedback/complaints
├── Dietary preferences and allergies (with doctor verification)
├── Allergen alerts for upcoming meals
└── Meal variant selection interface
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure & Food Management (Week 1-2) - CRITICAL
- [ ] Create all database models (Prisma migrations):
  - [ ] FoodItem, Recipe, RecipeIngredient models
  - [ ] MealVariant, StudentMealChoice models
  - [ ] Allergen, StudentAllergy models (CRITICAL)
  - [ ] Update Meal model with variants and recipes
- [ ] Create seed data (allergen master list, common food items)
- [ ] Implement Mess CRUD operations
- [ ] Implement Meal Plan CRUD
- [ ] Implement Menu & Meal management
- [ ] Implement FoodItem CRUD and categorization
- [ ] Implement Recipe management with cost calculator
- [ ] Create API routes for all above
- [ ] Frontend: Food item and recipe management pages

### Phase 2: Allergen & Food Safety Management (Week 2-3) - CRITICAL
- [ ] Implement Allergen master data CRUD
- [ ] Implement StudentAllergy linking (with doctor verification)
- [ ] Create allergen-checker service (cross-checks ingredients against allergies)
- [ ] Implement MealVariant management
- [ ] Implement StudentMealChoice tracking
- [ ] Create meal safety validation before serving
- [ ] Implement KitchenHygieneChecklist model and tracking
- [ ] Create API routes for allergen management and safety checks
- [ ] Frontend: Allergen management and allergy-checker pages
- [ ] Frontend: Kitchen hygiene tracking interface
- [ ] Create alerts for kitchen staff on allergen-sensitive students

### Phase 3: Menu Planning & Approval (Week 3-4)
- [ ] Implement MenuApproval workflow
- [ ] Create menu approval API endpoints
- [ ] Implement nutritional verification logic
- [ ] Frontend: Menu approval pages
- [ ] Create approval notifications

### Phase 4: Enrollment & Attendance (Week 4-5)
- [ ] Implement MessEnrollment CRUD with allergy linking
- [ ] Implement MealAttendance tracking with variant selection
- [ ] Create enrollment validation (capacity checks, allergy checks)
- [ ] Create attendance marking interface with meal variant selection
- [ ] Create API routes
- [ ] Frontend: Enrollment and attendance pages with allergen alerts
- [ ] Implement allergen cross-checking before meal service

### Phase 5: Billing System (Week 5-6)
- [ ] Implement MessBill model and logic
- [ ] Create billing calculation utilities (pro-rata, attendance-based)
- [ ] Implement bill generation (monthly)
- [ ] Implement payment tracking
- [ ] Create API routes
- [ ] Frontend: Billing management pages
- [ ] Integration with Finance module

### Phase 6: Feedback & Action Tracking (Week 6-7)
- [ ] Implement Feedback system
- [ ] Implement FeedbackAction model and workflow
- [ ] Implement Complaint system
- [ ] Create rating aggregation logic
- [ ] Create action tracking and verification
- [ ] Create API routes
- [ ] Frontend: Feedback, action tracking, and complaint pages

### Phase 7: Staff Management & Advanced Features (Week 7-8)
- [ ] Implement MessStaff management
- [ ] Create staff training and performance tracking
- [ ] Implement Extra Meal Booking
- [ ] Implement Vendor management
- [ ] Implement Holiday Calendar with meal arrangements
- [ ] Create corresponding API routes and pages

### Phase 8: Testing, Integration & Optimization (Week 8)
- [ ] Test all CRUD operations
- [ ] Test allergen safety cross-checks (CRITICAL)
- [ ] Test meal variant selection and service flow
- [ ] Test billing calculations
- [ ] Add validations and error handling
- [ ] Performance optimization for food item searches
- [ ] Integration with Finance module for billing
- [ ] Create reports and analytics
- [ ] Food safety compliance reports

---

## Business Logic

### Food Item & Recipe Management Logic (NEW - CRITICAL)
```
Creating Food Item:
1. Enter food name, category, standard cost
2. Enter nutritional info (calories, protein, carbs, fat, fiber)
3. Tag allergens present in item
4. Mark as vegetarian/non-veg/vegan
5. Save to master database

Creating Recipe:
1. Select meal to create recipe for
2. Add ingredients (select food items)
3. Enter quantity and unit for each ingredient
4. System calculates total cost = SUM(ingredient quantities * food item cost)
5. Enter cooking instructions and time
6. System calculates nutritional summary from ingredients
7. Save recipe for this meal
```

### Allergen Safety Checking Logic (NEW - CRITICAL - HEALTH/SAFETY)
```
When Student Enrolls:
1. Capture allergies with doctor verification
2. Link to Allergen master (structured data)
3. Mark severity (MILD, MODERATE, SEVERE, ANAPHYLAXIS)

When Planning Menu:
1. For each meal variant:
   a. Get all ingredients from recipe
   b. Check each ingredient against student allergies
   c. Flag if ANY ingredient matches student's allergen
   d. Mark meal as "CAUTION: Contains allergen X for student Y"

Before Serving Meal:
1. Kitchen staff checks student's allergy list
2. Verify selected variant is safe for student
3. If contains allergen: REJECT and recommend safe alternative
4. Mark meal as "allergyVerified = true" only if safe
5. Kitchen staff MUST sign off on allergen check

Emergency Protocol:
- If student with ANAPHYLAXIS allergy arrives at mess:
  - Display CRITICAL ALERT on meal serving interface
  - Recommend safe meals only
  - Require manager approval before serving
```

### Meal Variant Management Logic (NEW - CRITICAL)
```
Creating Meal Variants:
1. For each meal, define up to 3 variants (VEG, NON-VEG, VEGAN)
2. For each variant:
   a. Define variant-specific recipe (may be different ingredients)
   b. Calculate variant-specific cost and nutrition
   c. Define variant-specific allergens
   d. Define variant-specific student pricing (if different)

Serving Meal Variant:
1. Check student's dietary preference (VEG/NON-VEG/VEGAN)
2. Check if that variant exists for the meal
3. Check if variant is safe for student's allergies
4. Present safe variants to student
5. Record student's choice (StudentMealChoice)
6. Verify allergen safety before serving
7. Mark as served with timestamp and staff signature
```

### Recipe Cost Calculation Logic (NEW)
```
Calculating Recipe Cost:
1. For each ingredient in recipe:
   cost_for_ingredient = quantity * food_item.standardCost (per unit)
2. total_cost = SUM(cost_for_ingredient for all ingredients)
3. costPerServing = total_cost / servings
4. Store in recipe model

Calculating Meal Cost:
- If meal has multiple variants: average cost across variants
- Use for billing, revenue reporting, vendor negotiations
```

### Kitchen Hygiene Compliance Logic (NEW - CRITICAL)
```
Daily Hygiene Check (Automated at start of operations):
1. Assign inspection to kitchen manager
2. Complete checklist (7-8 critical areas):
   - Cleanliness (floors, walls, surfaces)
   - Temperature maintenance (fridges, freezers)
   - Equipment condition
   - Food storage compliance
   - Water quality
   - Waste disposal
   - Staff hygiene and uniforms
3. Score: 0-100 (average of items)
4. If issues found:
   a. Document issue with photos
   b. Set correction deadline (6 hours for CRITICAL, 24 hours for others)
   c. Track correction with follow-up photos
   d. Verify completion before meal service

Escalation:
- Score < 50: HALT all meal service until corrected
- Score 50-75: Serve with close monitoring
- Score > 75: Normal operations
```

### Meal Attendance Logic (UPDATED)
```
Daily Attendance Marking with Allergy Check:
1. Get enrolled students
2. Get meals for the day (based on meal plan)
3. For each meal:
   a. Get meal's variants
   b. Get student's allergies
   c. Filter to safe variants only
   d. Present variant options to student
   e. Student selects variant (or auto-select if only one safe option)
   f. Kitchen staff verifies allergen safety (allergyVerified flag)
   g. Serve meal and record StudentMealChoice
4. Mark attendance
5. Update meal utilization statistics
6. Record for billing
```

### Billing Logic (UPDATED)
```
Pro-Rata Billing Calculation:
1. Get student enrollment dates (startDate, endDate)
2. Calculate enrollment days in billing month:
   enrolled_days = days between startDate and billing month end (max 30)
3. Base monthly cost = meal plan monthlyPrice
4. Pro-rata cost = (base_cost / 30) * enrolled_days
5. Attendance-based adjustments (if applicable):
   actual_cost = pro_rata_cost * (days_attended / enrolled_days)
6. Add extra meal charges (from ExtraMealBooking)
7. Apply discounts
8. Total = pro_rata_cost + extra_charges - discount
9. If unpaid after due date: add late fee
10. Status = PENDING/PARTIAL/PAID/OVERDUE
```

### Feedback Action Tracking Logic (NEW)
```
When Feedback Received:
1. Categorize feedback (quality, taste, quantity, hygiene, service)
2. If issue identified: Auto-create FeedbackAction
3. Assign to responsible person/department
4. Set target date for resolution

Action Tracking:
1. Track status: PENDING → IN_PROGRESS → COMPLETED → CLOSED
2. Document action taken
3. Verify improvement (get follow-up feedback or inspection)
4. Close action and mark impact
5. Track metrics: % of feedback with actions, average resolution time
```

### Menu Approval Workflow Logic (NEW)
```
Menu Planning Process:
1. Chef submits menu for approval
2. System checks:
   a. All meals have recipes defined
   b. All meals have variants if applicable
   c. All variants have allergen info
3. Approver (Dietician/Manager) reviews menu:
   a. Check nutritional balance (RDA coverage, variety)
   b. Check cost feasibility
   c. Check against dietary restrictions
4. If approved: Mark approvalStatus = APPROVED
5. If rejected: Return with remarks, allow resubmission
6. Only APPROVED menus can be served

Nutritional Verification (Optional):
- Check daily nutrition against student age group RDA
- Check variety (not serving same food twice in week)
- Check allergen alerts for high-risk students
```

---

## Error Handling

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Errors
- **NO_MEAL_CAPACITY**: Mess is at capacity for meal plan
- **ENROLLMENT_CONFLICT**: Student already enrolled in this mess
- **INVALID_PLAN**: Selected meal plan is not active
- **ATTENDANCE_MISMATCH**: Student not enrolled for this meal
- **BILLING_ERROR**: Unable to generate bill
- **PAYMENT_FAILED**: Payment processing failed
- **OUTSTANDING_BILLS**: Student has unpaid bills

### Food Safety & Allergen Errors (CRITICAL)
- **ALLERGEN_DETECTED_CRITICAL**: Meal contains student's severe allergen (BLOCK meal service immediately)
- **ALLERGEN_DETECTED_MILD**: Meal contains student's mild allergen (WARN and allow with confirmation)
- **ALLERGEN_NOT_VERIFIED**: Kitchen staff has not verified allergen safety (BLOCK meal service)
- **ANAPHYLAXIS_ALERT**: Student with ANAPHYLAXIS allergy attempting to receive meal (CRITICAL ALERT - Require manager override)
- **ALLERGY_DOCUMENTATION_MISSING**: Student's allergy lacks doctor verification (WARN before enrollment)
- **MEAL_VARIANT_NOT_AVAILABLE**: Requested meal variant not available for student's diet type
- **HYGIENE_CHECK_FAILED**: Kitchen hygiene score too low (BLOCK meal service)
- **NO_APPROVED_MENU**: Menu not approved (BLOCK meal service)

### Recipe & Food Item Errors
- **INGREDIENT_NOT_FOUND**: Ingredient food item not found in master data
- **RECIPE_COST_CALCULATION_ERROR**: Unable to calculate recipe cost (missing food item costs)
- **NUTRITIONAL_DATA_INCOMPLETE**: Recipe missing nutritional information
- **VARIANT_ALLERGEN_MISMATCH**: Variant allergen info missing or incomplete

---

## Security & Access Control

1. **Role-Based Access - Detailed Permissions**

   **ADMIN**: Full access to all Mess operations
   - Create/edit food items and recipes
   - Manage allergen master data
   - Approve menus
   - Perform hygiene checks
   - View all reports and analytics
   - Manage all staff

   **MESS_MANAGER**: Manage mess operations
   - Create/edit food items and recipes (own mess)
   - Submit menus for approval
   - Perform daily hygiene checks
   - Mark attendance and serve meals
   - Manage staff (hire, assign roles)
   - View financial reports (own mess)
   - Create/resolve complaints
   - Cannot: Approve menus, delete allergies, override allergen checks

   **MESS_STAFF**: Day-to-day operations
   - Mark meal attendance
   - Serve meals (with allergen verification)
   - Record meal choices
   - Submit feedback and complaints
   - Perform hygiene checks (with manager sign-off)
   - Cannot: Create/edit recipes, approve menus, manage staff, modify allergies

   **DIETICIAN/NUTRITIONIST**: Menu planning & approval
   - View food items and recipes
   - Approve menus (with nutritional verification)
   - View nutritional reports
   - Provide dietary guidance
   - Cannot: Modify system allergens, manage staff, collect payments

   **STUDENT**: Personal data and actions
   - View own meal plan and dietary preferences
   - View current menu with variants
   - View own allergies (doctor verified)
   - Mark meal attendance (select variant)
   - Submit feedback/complaints
   - View own billing
   - Cannot: View other students' allergies, modify own allergies, mark others' attendance

   **PARENT**: Limited student view
   - View child's meal plan
   - View child's billing and payments
   - View child's allergies (for reference)
   - Cannot: Modify any data, mark attendance, provide feedback on behalf of student

2. **Data Privacy & Security (CRITICAL for Health/Safety)**

   **Dietary Preferences**: Confidential
   - Only student and mess staff handling meals can view
   - Not visible in reports without anonymization

   **Allergies & Health Data**: CRITICAL SECURITY
   - ONLY accessible to authorized kitchen staff
   - MUST be doctor-verified before activation
   - Cannot be modified without proper authorization
   - All access logged with timestamp and user
   - Every meal service interaction with allergies must be logged
   - Backup copy of allergy data required

   **Billing Data**: Confidential
   - Visible to: Student, parents, MESS_MANAGER, ADMIN
   - Not visible to other mess staff
   - Payment details encrypted

   **Feedback & Complaints**: Conditional visibility
   - Anonymous feedback: Only mess management can see (not attributed to student)
   - Named feedback: Student and mess management only
   - May be shared with relevant staff for improvements (without student ID if possible)

   **Hygiene & Safety Data**: Accessible to managers
   - Kitchen hygiene records: MESS_MANAGER and above
   - Issues with photos: ADMIN only (for privacy of kitchen areas)
   - Reports: ADMIN, MESS_MANAGER, Dietician

   **Food Safety Alerts**:
   - Allergen alerts: All kitchen staff serving food
   - Anaphylaxis alerts: CRITICAL - visible to meal service manager
   - Hygiene failures: ADMIN + MESS_MANAGER (immediate action required)

3. **Audit Trail Requirements (CRITICAL for Compliance)**
   - All allergy updates logged with: user, timestamp, old value, new value, reason
   - All meal services to allergic students logged: user, timestamp, variant selected, allergen verified
   - All hygiene checks logged: inspector, timestamp, score, issues, corrections
   - All feedback actions logged: creator, timestamp, action, responsible person, completion

4. **Data Encryption**
   - Allergy information: Encrypted at rest
   - Student health records: Encrypted end-to-end
   - Medical documents (allergy verification): Encrypted storage

---

## CRITICAL FOOD SAFETY REQUIREMENTS

⚠️ **MANDATORY IMPLEMENTATION**

1. **Allergen Management is LIFE-CRITICAL**
   - System must BLOCK meal service if allergen not verified
   - Kitchen staff signature required for each allergic student meal
   - Any missed allergy check = incident report
   - Doctor verification required before system activates allergy

2. **Hygiene Standards**
   - Daily hygiene check required before any meal service
   - Score < 50 = HALT all meal service
   - Temperature monitoring for cold chain (if applicable)
   - Staff training documentation required

3. **Audit & Compliance**
   - Every food safety decision logged with user, timestamp, reasoning
   - Quarterly compliance reports required
   - Incident tracking for any allergen exposure
   - Regular audits recommended

4. **Documentation Requirements**
   - Recipe with full ingredient list maintained
   - Allergen info updated when ingredients change
   - Hygiene checklists available for inspection
   - Incident reports for any food safety issues

---

## Related Documentation
- [Database Schema](./DATABASE.md)
- [API Standards](./API_STANDARDS.md)
- [Finance Module](./FINANCE_MODULE.md) - For billing integration
- [Food Safety Standards](./FOOD_SAFETY_COMPLIANCE.md) - Regulatory compliance guide
