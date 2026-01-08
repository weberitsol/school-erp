# Store/Inventory Management Module Documentation

## Overview

The Store/Inventory Management Module handles all operations related to the school's inventory and supplies including item categorization, stock management, purchase orders, vendor management, stock movements, and inventory analytics. This module tracks all physical items in the school including stationery, equipment, furniture, and maintenance supplies.

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
- Multi-location store management
- Item categorization and cataloging
- Stock level management and tracking
- Purchase order creation and management
- Goods receipt and quality check
- Stock movement tracking (in/out)
- Inventory valuation (FIFO, LIFO, weighted average)
- Reorder point and alert management
- Supplier/Vendor management
- Stock transfer between locations
- Requisition and approval workflow
- Barcode/SKU management
- Expiry date tracking (for consumables)
- Return and damage tracking

### Reporting & Analytics
- Stock level reports
- Stock movement history
- Inventory valuation reports
- Stock aging analysis
- Fast/slow moving items analysis
- Reorder point recommendations
- Vendor performance metrics
- Budget vs Actual reports

---

## Database Schema

### Core Models to be Implemented

#### Store Model
```prisma
model Store {
  id                  String    @id @default(uuid())

  // Store Details
  name               String    @unique
  code               String    @unique
  storeType          String    // CENTRAL_STORE, DEPARTMENTAL_STORE, MAINTENANCE_STORE
  location           String    // Building/Floor location

  // Contact & Details
  address            String?
  phone              String?
  email              String?

  // Management
  storeKeeperUserId  String?
  storeKeeper        User?     @relation("StoreKeeper", fields: [storeKeeperUserId], references: [id])

  // Operational
  isActive           Boolean   @default(true)
  storageCapacity    Float?    // In sq feet

  // Relationships
  items              InventoryItem[]
  stockLevels        StockLevel[]
  movements          StockMovement[]
  requisitions       Requisition[]
  purchaseOrders     PurchaseOrder[]
  stockBatches       StockBatch[] (NEW)
  stockTransfers     StockTransfer[] (NEW)
  goodsReceipts      GoodsReceipt[] (NEW)
  adjustments        StockAdjustment[] (NEW)
  stockAging         StockAging[] (NEW)
  stockValuations    StockValuation[] (NEW)
  cycleCount         InventoryCycleCount[] (NEW)
  glMappings         GLAccountMapping[] (NEW)
  reorderRecommendations ReorderPointRecommendation[] (NEW)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### ItemCategory Model
```prisma
model ItemCategory {
  id                  String    @id @default(uuid())

  name               String    @unique
  code               String    @unique
  description        String?

  // Category Hierarchy
  parentCategoryId   String?
  parentCategory     ItemCategory? @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  subcategories      ItemCategory[] @relation("CategoryHierarchy")

  // Relationships
  items              InventoryItem[]
  glMappings         GLAccountMapping[] (NEW)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### Unit Model
```prisma
model Unit {
  id                  String    @id @default(uuid())

  name               String    @unique
  shortName          String    @unique
  description        String?

  // Relationships
  items              InventoryItem[]

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### InventoryItem Model
```prisma
model InventoryItem {
  id                  String    @id @default(uuid())

  // Item Details
  name               String
  description        String?
  sku                String    @unique     // Stock Keeping Unit
  barcode            String?   @unique
  model              String?    // For equipment/furniture

  // Categorization
  categoryId          String
  category            ItemCategory @relation(fields: [categoryId], references: [id])

  // Unit
  unitId              String
  unit                Unit      @relation(fields: [unitId], references: [id])

  // Reorder Management
  reorderPoint        Int       // When to place new order
  reorderQuantity     Int?      // Quantity to order when reorder point is reached
  minimumStock        Int       @default(0)
  maximumStock        Int?

  // Valuation
  unitCost            Float     // Standard cost per unit
  lastPurchasePrice   Float?    // Last purchased cost
  averagePrice        Float?    // Weighted average cost

  // Tracking
  requiresSerialNo    Boolean   @default(false)
  requiresExpiryDate  Boolean   @default(false)
  requiresBatchNo     Boolean   @default(false)

  // Status
  isActive            Boolean   @default(true)
  isConsumable        Boolean   @default(true)   // Consumable vs Fixed Asset

  // Supplier
  preferredSupplierId String?
  preferredSupplier   Vendor?   @relation("PreferredSupplier", fields: [preferredSupplierId], references: [id])

  // Relationships
  stocks              StockLevel[]
  movements           StockMovement[]
  purchaseOrderItems  PurchaseOrderItem[]
  requisitionItems    RequisitionItem[]
  stockBatches        StockBatch[] (NEW)
  stockValuations     StockValuation[] (NEW)
  stockAging          StockAging[] (NEW)
  cycleCount          InventoryCycleCount[] (NEW)
  glMappings          GLAccountMapping[] (NEW)
  reorderRecommendations ReorderPointRecommendation[] (NEW)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### StockLevel Model
```prisma
model StockLevel {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id], onDelete: Restrict)

  // Current Stock
  currentQuantity     Int       @default(0)
  reservedQuantity    Int       @default(0)    // Reserved for pending requisitions
  availableQuantity   Int       // Calculated: currentQuantity - reservedQuantity

  // Valuation
  totalValue          Float     // Calculated: currentQuantity * avgCost

  // Last Updated
  lastMovementDate    DateTime? // Date of last stock movement
  lastCountDate       DateTime? // Physical verification date

  // Alerts
  isLowStock          Boolean   @default(false)  // Below reorder point
  isOverStock         Boolean   @default(false)  // Above maximum stock

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([storeId, itemId])
  @@index([isLowStock])
}
```

#### StockMovement Model
```prisma
model StockMovement {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Movement Details
  movementType        String    // IN, OUT, TRANSFER, ADJUSTMENT, DAMAGE, RETURN
  quantity            Int
  direction           Int       // 1 for IN, -1 for OUT

  // Tracking
  serialNumbers       String[]? // If serialized items
  batchNo             String?
  expiryDate          DateTime? // If consumable with expiry

  // Reference
  referenceDocNo      String?   // PO No, Requisition No, etc.
  referenceType       String?   // PURCHASE_ORDER, REQUISITION, TRANSFER, PHYSICAL_COUNT
  referenceId         String?   // Link to PO, Requisition, etc.

  // Details
  reason              String?   // Reason for movement
  movementDate        DateTime  @default(now())
  movedBy             String?   // User who recorded the movement

  // For transfers
  fromStore           String?   // If transfer movement
  toStore             String?   // If transfer movement

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([movementDate])
  @@index([movementType])
}
```

#### PurchaseOrder Model
```prisma
model PurchaseOrder {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  // PO Details
  poNumber            String    @unique
  vendorId            String
  vendor              Vendor    @relation(fields: [vendorId], references: [id])

  // Dates
  orderDate           DateTime  @default(now())
  expectedDeliveryDate DateTime
  actualDeliveryDate  DateTime?

  // Items
  items               PurchaseOrderItem[]

  // Goods Receipt (NEW)
  goodsReceipts       GoodsReceipt[] (NEW)

  // Totals
  subtotal            Float     // Sum of all item amounts
  tax                 Float     @default(0)
  shipping            Float     @default(0)
  discount            Float     @default(0)
  totalAmount         Float     // Calculated: subtotal + tax + shipping - discount

  // Payment
  paymentTerms        String?   // Net 30, COD, etc.
  paymentStatus       String    @default("PENDING") // PENDING, PARTIAL, PAID
  paidAmount          Float     @default(0)

  // Receiving
  receivedQuantity    Int       @default(0)  // Count of received items
  totalQuantity       Int       // Total ordered items

  // Status
  status              String    @default("DRAFT") // DRAFT, APPROVED, ORDERED, PARTIAL_RECEIVED, RECEIVED, CANCELLED

  // Approval
  approvedBy          String?
  approvalDate        DateTime?

  // Notes
  notes               String?
  terms               String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([status])
}
```

#### PurchaseOrderItem Model
```prisma
model PurchaseOrderItem {
  id                  String    @id @default(uuid())

  poId                String
  po                  PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Quantities
  orderedQuantity     Int
  receivedQuantity    Int       @default(0)
  rejectedQuantity    Int       @default(0)

  // Pricing
  unitPrice           Float
  amount              Float     // Calculated: orderedQuantity * unitPrice

  // Delivery
  deliverySchedule    String?

  // Relationships (NEW)
  goodsReceiptItems   GoodsReceiptItem[] (NEW)
  stockBatches        StockBatch[] (NEW)
  reorderRecommendations ReorderPointRecommendation[] (NEW)
  invoiceLineItems    InvoiceLineItemMapping[] (NEW)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([poId, itemId])
}
```

#### Vendor Model
```prisma
model Vendor {
  id                  String    @id @default(uuid())

  // Vendor Details
  name               String    @unique
  code               String    @unique
  contact            String
  email              String?
  phone              String

  // Address
  address            String
  city               String
  state              String
  zipCode            String

  // Business Details
  gstNumber          String?
  panNumber          String?
  registrationNo     String?

  // Vendor Type
  vendorType         String    // SUPPLIER, CONTRACTOR, SERVICE_PROVIDER

  // Items Supplied
  suppliesItems      InventoryItem[] @relation("PreferredSupplier")

  // Performance Metrics
  qualityRating      Float?    // 1-5
  deliveryRating     Float?    // 1-5
  priceRating        Float?    // 1-5

  // Contact Details
  paymentTerms       String?
  isActive           Boolean   @default(true)

  // Relationships
  purchaseOrders     PurchaseOrder[]
  performanceMetrics VendorPerformanceMetric[] (NEW)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### Requisition Model
```prisma
model Requisition {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  // Requisition Details
  requisitionNo       String    @unique
  requesterUserId     String
  requester           User      @relation(fields: [requesterUserId], references: [id])

  // Dates
  requisitionDate     DateTime  @default(now())
  requiredByDate      DateTime

  // Items
  items               RequisitionItem[]

  // Approvals
  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED, FULFILLED, CANCELLED
  approvedBy          String?
  approvalDate        DateTime?
  approvalRemarks     String?

  // Fulfillment
  fulfilledDate       DateTime?

  // Notes
  reason              String?   // Purpose of requisition
  priority            String    @default("NORMAL") // LOW, NORMAL, HIGH, URGENT
  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([status])
}
```

#### RequisitionItem Model
```prisma
model RequisitionItem {
  id                  String    @id @default(uuid())

  requisitionId       String
  requisition         Requisition @relation(fields: [requisitionId], references: [id], onDelete: Cascade)

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Quantities
  requestedQuantity   Int
  approvedQuantity    Int?      // What was approved (may be less than requested)
  issuedQuantity      Int       @default(0)

  // Notes
  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([requisitionId, itemId])
}
```

#### StockAdjustment Model
```prisma
model StockAdjustment {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Adjustment Details
  adjustmentType      String    // PHYSICAL_COUNT, DAMAGE, LOSS, THEFT, CORRECTION
  currentQuantity     Int       // Quantity before adjustment
  adjustedQuantity    Int       // Corrected quantity
  difference          Int       // Calculated: adjustedQuantity - currentQuantity

  // Documentation
  reason              String
  remarks             String?
  evidenceUrl         String?   // Photo/document supporting adjustment

  // Approval
  adjustedByUserId    String
  adjustedBy          User      @relation(fields: [adjustedByUserId], references: [id])
  adjustmentDate      DateTime  @default(now())

  approvedByUserId    String?
  approvedBy          User?     @relation("AdjustmentApprovedBy", fields: [approvedByUserId], references: [id])
  approvalDate        DateTime?

  status              String    @default("PENDING") // PENDING, APPROVED, REJECTED

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([adjustmentType])
}
```

#### StockTransfer Model
```prisma
model StockTransfer {
  id                  String    @id @default(uuid())

  // Stores
  fromStoreId         String
  toStoreId           String

  // Items
  items               StockTransferItem[]

  // Transfer Details
  transferDate        DateTime  @default(now())
  expectedDeliveryDate DateTime

  // Status
  status              String    @default("PENDING") // PENDING, IN_TRANSIT, RECEIVED, CANCELLED

  // Documentation
  transferNo          String    @unique
  reason              String?
  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### StockTransferItem Model
```prisma
model StockTransferItem {
  id                  String    @id @default(uuid())

  transferId          String
  transfer            StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)

  itemId              String

  // Quantities
  transferQuantity    Int
  receivedQuantity    Int       @default(0)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### GoodsReceipt Model (NEW - CRITICAL)
```prisma
model GoodsReceipt {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  // Reference to PO
  poId                String
  purchaseOrder       PurchaseOrder @relation(fields: [poId], references: [id])

  // Receipt Details
  receiptNo           String    @unique
  receiptDate         DateTime  @default(now())

  // Items Received
  items               GoodsReceiptItem[]

  // Receipt Process (3-way matching)
  invoiceLineItems    InvoiceLineItemMapping[] // Link to vendor invoice for 3-way matching

  // Inspection & QC
  inspections         ReceiptInspection[]

  // Totals
  totalQuantityReceived Int     @default(0)
  totalItemsReceived    Int     @default(0)

  // Status
  status              String    @default("PENDING") // PENDING, INSPECTING, ACCEPTED, REJECTED, PARTIAL_ACCEPTED
  acceptanceDate      DateTime?

  // Notes
  remarks             String?
  discrepancies       String?   // Any discrepancies from PO

  receivedByUserId    String?
  receivedBy          User?     @relation(fields: [receivedByUserId], references: [id])

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([status])
  @@index([receiptDate])
}
```

#### GoodsReceiptItem Model (NEW - CRITICAL)
```prisma
model GoodsReceiptItem {
  id                  String    @id @default(uuid())

  receiptId           String
  receipt             GoodsReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)

  poItemId            String
  poItem              PurchaseOrderItem @relation(fields: [poItemId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Quantities
  orderedQuantity     Int       // From PO
  receivedQuantity    Int
  acceptedQuantity    Int       @default(0)
  rejectedQuantity    Int       @default(0)

  // Batch & Expiry (NEW - for consumables)
  batchNo             String?
  expiryDate          DateTime?
  manufacturingDate   DateTime?

  // Unit Price (for 3-way matching)
  unitPriceOnPO       Float
  unitPriceOnInvoice  Float?    // May differ from PO price
  priceDifference     Float     // Calculated: unitPriceOnInvoice - unitPriceOnPO

  // QC Notes
  qualityStatus       String    @default("ACCEPTED") // ACCEPTED, PARTIAL_REJECTED, REJECTED
  rejectionReason     String?

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([receiptId, poItemId])
}
```

#### ReceiptInspection Model (NEW)
```prisma
model ReceiptInspection {
  id                  String    @id @default(uuid())

  receiptId           String
  receipt             GoodsReceipt @relation(fields: [receiptId], references: [id], onDelete: Cascade)

  // Inspection Details
  inspectionDate      DateTime  @default(now())
  inspectionType      String    // VISUAL, FUNCTIONAL, DOCUMENT_CHECK, SAMPLE_TEST

  // QC Criteria (1-5 scale)
  packagingCondition  Int       // 1-5: Poor to Excellent
  productQuality      Int       // 1-5
  labelAccuracy       Int       // 1-5
  quantityVerified    Int       // 1-5
  documentationAccuracy Int    // 1-5
  overallScore        Int       // Average score

  // Issues Found
  issuesIdentified    String[]  // Array of issues
  criticalDefects     Boolean   @default(false)

  // Photos
  inspectionPhotos    String[]  // URLs to photos

  // Recommendation
  recommendation      String    // ACCEPT, ACCEPT_WITH_NOTES, PARTIAL_ACCEPT, REJECT

  // Inspector Details
  inspectorUserId     String
  inspector           User      @relation(fields: [inspectorUserId], references: [id])
  inspectionDate      DateTime

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### InvoiceLineItemMapping Model (NEW - 3-WAY MATCHING)
```prisma
model InvoiceLineItemMapping {
  id                  String    @id @default(uuid())

  // Three-way matching
  poItemId            String
  poItem              PurchaseOrderItem @relation(fields: [poItemId], references: [id])

  receiptItemId       String
  receiptItem         GoodsReceiptItem @relation(fields: [receiptItemId], references: [id])

  receiptId           String
  receipt             GoodsReceipt @relation(fields: [receiptId], references: [id])

  // Vendor Invoice Details
  invoiceNo           String
  invoiceDate         DateTime
  invoicedQuantity    Int
  invoicedUnitPrice   Float
  invoicedAmount      Float     // invoicedQuantity * invoicedUnitPrice

  // Matching Status
  matchingStatus      String    @default("PENDING") // MATCHED, QUANTITY_VARIANCE, PRICE_VARIANCE, UNMATCHED
  quantityVariance    Int?      // poQuantity - invoicedQuantity
  priceVariance       Float?    // poPrice - invoicedPrice
  variancePercentage  Float?    // (variance / poPrice) * 100

  // Approval
  matchedByUserId     String?
  matchedBy           User?     @relation(fields: [matchedByUserId], references: [id])
  matchedDate         DateTime?

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([poItemId, receiptItemId])
}
```

#### StockBatch Model (NEW - BATCH TRACKING)
```prisma
model StockBatch {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Batch Identification
  batchNo             String
  supplierBatchNo     String?
  manufacturingDate   DateTime?
  expiryDate          DateTime?

  // Batch Quantity Tracking
  receivedQuantity    Int       // Total received in this batch
  currentQuantity     Int       // Current available in this batch
  consumedQuantity    Int       @default(0) // Already issued out
  damageQuantity      Int       @default(0) // Damaged/rejected

  // Batch Source
  poItemId            String?
  poItem              PurchaseOrderItem? @relation(fields: [poItemId], references: [id])

  receiptItemId       String?
  receiptItem         GoodsReceiptItem? @relation(fields: [receiptItemId], references: [id])

  // Unit Price for this batch
  batchUnitPrice      Float

  // Valuation for this batch
  batchValue          Float     // Calculated: currentQuantity * batchUnitPrice

  // Status
  status              String    @default("ACTIVE") // ACTIVE, FULLY_CONSUMED, EXPIRED, REJECTED
  expiryAlertDate     DateTime? // Alert 30 days before expiry

  // Shelf Location
  shelfLocation       String?   // Location in store

  // Quality Attributes
  qualityGrade        String?   // A, B, C based on inspection
  storageConditions   String?   // Notes on storage

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([storeId, itemId, batchNo])
  @@index([expiryDate])
  @@index([status])
}
```

#### StockValuation Model (NEW - VALUATION METHOD)
```prisma
model StockValuation {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Valuation Method
  valuationMethod     String    // FIFO, LIFO, WEIGHTED_AVERAGE, STANDARD_COST
  effectiveDate       DateTime  @default(now())

  // Current Valuation
  totalQuantity       Int
  totalValue          Float
  averageUnitCost     Float     // Calculated: totalValue / totalQuantity

  // Detailed Calculations
  valuationDetails    StockValuationDetail[]

  // Previous Period Values (for comparison)
  previousPeriodValue Float?
  valuationVariance   Float?    // Difference from previous period

  // Last Calculation
  lastCalculatedDate  DateTime
  calculatedByUserId  String?
  calculatedBy        User?     @relation(fields: [calculatedByUserId], references: [id])

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([storeId, itemId, effectiveDate])
}
```

#### StockValuationDetail Model (NEW - VALUATION DETAILS)
```prisma
model StockValuationDetail {
  id                  String    @id @default(uuid())

  valuationId         String
  valuation           StockValuation @relation(fields: [valuationId], references: [id], onDelete: Cascade)

  // For FIFO: sequence order (oldest batch first)
  sequenceOrder       Int

  // Source Batch
  batchId             String?
  batch               StockBatch? @relation(fields: [batchId], references: [id])

  // Calculation
  quantity            Int
  unitCost            Float
  totalCost           Float     // quantity * unitCost

  // Batch Info (denormalized for historical accuracy)
  batchNo             String?
  receiptDate         DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

#### GLAccountMapping Model (NEW - FINANCE INTEGRATION)
```prisma
model GLAccountMapping {
  id                  String    @id @default(uuid())

  // Item & Category
  itemId              String?
  item                InventoryItem? @relation(fields: [itemId], references: [id])

  categoryId          String?
  category            ItemCategory? @relation(fields: [categoryId], references: [id])

  // GL Account Details (from Finance module)
  glAccountCode       String    // GL account code (e.g., 1310-Stock)
  glAccountName       String
  costCenter          String?   // Cost center code

  // Transaction Types
  movementType        String    // IN, OUT, ADJUSTMENT, TRANSFER

  // GL Mapping
  debitAccount        String?   // GL account to debit
  creditAccount       String?   // GL account to credit

  // Status
  isActive            Boolean   @default(true)

  remarks             String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([itemId, categoryId, movementType])
}
```

#### StockAging Model (NEW - AGING ANALYSIS)
```prisma
model StockAging {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Last Issued/Used Date
  lastIssuedDate      DateTime?
  daysSinceLastIssue  Int       @default(0)  // Calculated

  // Stock Aging Categories
  ageCategory         String    // FRESH (0-90 days), NORMAL (90-180 days), AGING (180-365 days), STAGNANT (>365 days)

  // Quantity in Each Age Range
  quantity0_90Days    Int       @default(0)
  quantity90_180Days  Int       @default(0)
  quantity180_365Days Int       @default(0)
  quantityOver365Days Int       @default(0)

  // Value Impact
  totalAgedValue      Float     @default(0)
  writeoffRisk        Float     @default(0) // % risk of loss

  // Analysis Date
  analysisDate        DateTime  @default(now())

  // Recommendations
  recommendedAction   String?   // SELL_AT_DISCOUNT, DONATE, SCRAP, RETAIN

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([storeId, itemId, analysisDate])
}
```

#### InventoryAdjustmentReason Model (NEW - MASTER DATA)
```prisma
model InventoryAdjustmentReason {
  id                  String    @id @default(uuid())

  code               String    @unique
  name               String    @unique
  description        String?
  adjustmentType     String    // PHYSICAL_COUNT, DAMAGE, LOSS, THEFT, CORRECTION, SHRINKAGE, EXPIRY

  // Approval Required
  requiresApproval   Boolean   @default(true)
  approvalLevel      String?   // MANAGER, DIRECTOR, ADMIN

  isActive           Boolean   @default(true)

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

#### ReorderPointRecommendation Model (NEW - SMART REORDER)
```prisma
model ReorderPointRecommendation {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Analysis Period
  analysisPeriod      Int       // Days (e.g., 90, 180, 365)
  analysisStartDate   DateTime
  analysisEndDate     DateTime

  // Average Consumption
  averageDailyUsage   Float     // Units per day
  averageMonthlyUsage Float     // Units per month

  // Lead Time
  vendorLeadTime      Int       // Days
  safetyStock         Int       // Buffer for variations

  // Recommendation
  recommendedReorderPoint Int
  recommendedReorderQty   Int
  currentReorderPoint     Int   // Current setting
  currentReorderQty       Int   // Current setting

  // Justification
  analysisReason      String?
  variationFactor     Float?    // Demand variability multiplier

  // Approval
  recommendedByUserId String?
  recommendedBy       User?     @relation(fields: [recommendedByUserId], references: [id])

  acceptedByUserId    String?
  acceptedBy          User?     @relation("ReorderAcceptedBy", fields: [acceptedByUserId], references: [id])
  acceptanceDate      DateTime?

  status              String    @default("PENDING") // PENDING, ACCEPTED, REJECTED

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([storeId, itemId, analysisEndDate])
}
```

#### InventoryCycleCount Model (NEW - PHYSICAL VERIFICATION)
```prisma
model InventoryCycleCount {
  id                  String    @id @default(uuid())

  storeId             String
  store               Store     @relation(fields: [storeId], references: [id])

  itemId              String
  item                InventoryItem @relation(fields: [itemId], references: [id])

  // Cycle Count Schedule
  scheduledDate       DateTime
  actualCountDate     DateTime?

  // Count Results
  systemQuantity      Int       // From system records
  physicalQuantity    Int?      // What was actually counted
  variance            Int?      // Calculated: physicalQuantity - systemQuantity
  variancePercentage  Float?    // (variance / systemQuantity) * 100

  // Valuation Impact
  systemValue         Float
  physicalValue       Float?
  valueVariance       Float?    // Impact on inventory value

  // Count Details
  countedByUserId     String?
  countedBy           User?     @relation("CountedBy", fields: [countedByUserId], references: [id])

  verifiedByUserId    String?
  verifiedBy          User?     @relation("VerifiedBy", fields: [verifiedByUserId], references: [id])

  // Reconciliation
  status              String    @default("PENDING") // PENDING, COUNTED, VERIFIED, RECONCILED, ADJUSTED
  reconciliationNotes String?

  adjustmentCreated   Boolean   @default(false)
  adjustmentId        String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([scheduledDate])
  @@index([status])
}
```

#### VendorPerformanceMetric Model (NEW - VENDOR ANALYTICS)
```prisma
model VendorPerformanceMetric {
  id                  String    @id @default(uuid())

  vendorId            String
  vendor              Vendor    @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  // Metric Period
  metricMonth         Int       // 1-12
  metricYear          Int

  // Purchase Metrics
  totalOrders         Int
  totalQuantity       Int
  totalAmount         Float
  averageOrderValue   Float

  // On-Time Delivery
  totalDeliveries     Int
  onTimeDeliveries    Int
  onTimePercentage    Float

  // Quality Metrics
  totalReceived       Int
  itemsRejected       Int
  rejectionRate       Float

  // Price Metrics
  averagePrice        Float
  priceVariance       Float?    // vs market average or historical
  competitiveRating   String?   // COMPETITIVE, ABOVE_AVG, BELOW_AVG

  // Overall Rating (calculated)
  overallScore        Float     // 1-5 scale

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([vendorId, metricMonth, metricYear])
}
```

---

## API Endpoints

### Store Management Endpoints
```
GET    /api/v1/stores                    - Get all stores
POST   /api/v1/stores                    - Create new store
GET    /api/v1/stores/{id}               - Get store details
PUT    /api/v1/stores/{id}               - Update store
GET    /api/v1/stores/{id}/statistics    - Get store statistics (inventory value, items)
```

### Item Management Endpoints
```
GET    /api/v1/items                     - Get all items (with filters)
POST   /api/v1/items                     - Create new item
GET    /api/v1/items/{id}                - Get item details
PUT    /api/v1/items/{id}                - Update item
DELETE /api/v1/items/{id}                - Mark item as inactive
GET    /api/v1/items/category/{id}      - Get items by category
GET    /api/v1/items/sku/{sku}          - Get item by SKU/Barcode
```

### Category & Unit Endpoints
```
GET    /api/v1/categories                - Get all categories (with hierarchy)
POST   /api/v1/categories                - Create category
PUT    /api/v1/categories/{id}           - Update category

GET    /api/v1/units                     - Get all units
POST   /api/v1/units                     - Create unit
PUT    /api/v1/units/{id}                - Update unit
```

### Stock Level Endpoints
```
GET    /api/v1/stock-levels              - Get stock levels (all items in all stores)
GET    /api/v1/stock-levels/store/{id}  - Get stock for specific store
GET    /api/v1/stock-levels/low         - Get low stock items (below reorder point)
GET    /api/v1/stock-levels/overstock   - Get overstock items
PUT    /api/v1/stock-levels/{id}        - Update stock level (admin correction)
```

### Stock Movement Endpoints
```
POST   /api/v1/movements/in              - Record stock in (purchase receipt)
POST   /api/v1/movements/out             - Record stock out (requisition issue)
POST   /api/v1/movements/transfer        - Record stock transfer
POST   /api/v1/movements/adjustment      - Record stock adjustment
GET    /api/v1/movements                 - Get all movements (with filters)
GET    /api/v1/movements/item/{id}      - Get movement history for item
GET    /api/v1/movements/date-range     - Get movements for date range
```

### Purchase Order Endpoints
```
GET    /api/v1/purchase-orders           - Get all POs (with filters)
POST   /api/v1/purchase-orders           - Create PO
GET    /api/v1/purchase-orders/{id}      - Get PO details
PUT    /api/v1/purchase-orders/{id}      - Update PO (before approved)
DELETE /api/v1/purchase-orders/{id}      - Cancel PO
PUT    /api/v1/purchase-orders/{id}/approve - Approve PO
POST   /api/v1/purchase-orders/{id}/receive - Record goods receipt
GET    /api/v1/purchase-orders/pending   - Get pending POs
```

### Requisition Endpoints
```
GET    /api/v1/requisitions              - Get all requisitions (with filters)
POST   /api/v1/requisitions              - Create requisition
GET    /api/v1/requisitions/{id}         - Get requisition details
PUT    /api/v1/requisitions/{id}         - Update requisition (before approved)
PUT    /api/v1/requisitions/{id}/approve - Approve requisition
PUT    /api/v1/requisitions/{id}/reject  - Reject requisition
POST   /api/v1/requisitions/{id}/fulfill - Issue items for requisition
GET    /api/v1/requisitions/pending      - Get pending requisitions
```

### Stock Transfer Endpoints
```
GET    /api/v1/transfers                 - Get all transfers
POST   /api/v1/transfers                 - Create transfer
PUT    /api/v1/transfers/{id}            - Update transfer
PUT    /api/v1/transfers/{id}/receive    - Receive transferred items
```

### Stock Adjustment Endpoints
```
POST   /api/v1/adjustments               - Record stock adjustment
GET    /api/v1/adjustments               - Get all adjustments
PUT    /api/v1/adjustments/{id}/approve  - Approve adjustment
```

### Vendor Endpoints
```
GET    /api/v1/vendors                   - Get all vendors
POST   /api/v1/vendors                   - Register vendor
GET    /api/v1/vendors/{id}              - Get vendor details
PUT    /api/v1/vendors/{id}              - Update vendor
GET    /api/v1/vendors/{id}/orders       - Get vendor's orders
GET    /api/v1/vendors/{id}/performance  - Get vendor performance metrics (NEW)
```

### Goods Receipt Endpoints (NEW)
```
GET    /api/v1/goods-receipts            - Get all receipts (with filters: PO, status, date range)
POST   /api/v1/goods-receipts            - Create receipt for PO (NEW)
GET    /api/v1/goods-receipts/{id}       - Get receipt details with all items
PUT    /api/v1/goods-receipts/{id}       - Update receipt details
GET    /api/v1/goods-receipts/po/{poId}  - Get receipts for specific PO

POST   /api/v1/goods-receipts/{id}/inspect - Record QC inspection (NEW)
GET    /api/v1/goods-receipts/{id}/inspections - Get receipt inspections (NEW)

POST   /api/v1/goods-receipts/{id}/accept  - Accept receipt (mark as ACCEPTED) (NEW)
POST   /api/v1/goods-receipts/{id}/reject  - Reject receipt (NEW)

GET    /api/v1/goods-receipts/pending     - Get pending receipts (awaiting inspection/acceptance)
```

### Stock Batch Endpoints (NEW)
```
GET    /api/v1/batches                    - Get all batches (with filters: item, store, expiry status)
GET    /api/v1/batches/store/{storeId}   - Get batches in specific store
GET    /api/v1/batches/expiring           - Get batches expiring soon (within 30 days)
GET    /api/v1/batches/expired            - Get expired batches
GET    /api/v1/batches/item/{itemId}      - Get all batches of item
GET    /api/v1/batches/{id}               - Get batch details with quantity tracking

PUT    /api/v1/batches/{id}               - Update batch status (mark as consumed, expired, etc.)
PUT    /api/v1/batches/{id}/consume       - Issue stock from batch (FIFO/LIFO)
```

### Inventory Valuation Endpoints (NEW)
```
GET    /api/v1/valuations                 - Get valuations for all items (current period)
GET    /api/v1/valuations/store/{storeId} - Get valuations for store
POST   /api/v1/valuations/calculate       - Calculate/recalculate valuations (method: FIFO, LIFO, WAC)
GET    /api/v1/valuations/{id}            - Get detailed valuation with breakdown
GET    /api/v1/valuations/item/{itemId}   - Get valuation history for item
GET    /api/v1/valuations/report          - Generate valuation report (total inventory value)
```

### 3-Way Matching Endpoints (NEW)
```
GET    /api/v1/matching                   - Get all invoice line mappings (status: MATCHED, VARIANCE, UNMATCHED)
POST   /api/v1/matching                   - Create invoice line mapping (vendor invoice match)
GET    /api/v1/matching/{id}              - Get matching details with variances
PUT    /api/v1/matching/{id}/review       - Review and approve/reject matching
GET    /api/v1/matching/po/{poId}         - Get matching status for PO
GET    /api/v1/matching/variance          - Get items with variances (quantity or price)
GET    /api/v1/matching/report            - Generate 3-way matching variance report
```

### GL Account Mapping Endpoints (NEW)
```
GET    /api/v1/gl-mappings                - Get all GL mappings
POST   /api/v1/gl-mappings                - Create GL account mapping
GET    /api/v1/gl-mappings/{id}           - Get mapping details
PUT    /api/v1/gl-mappings/{id}           - Update GL mapping
DELETE /api/v1/gl-mappings/{id}           - Delete GL mapping

GET    /api/v1/gl-mappings/item/{itemId}  - Get mappings for item
GET    /api/v1/gl-mappings/category/{catId} - Get mappings for category
```

### Stock Aging Endpoints (NEW)
```
GET    /api/v1/aging                      - Get aging analysis (all items)
GET    /api/v1/aging/store/{storeId}      - Get aging analysis for store
POST   /api/v1/aging/analyze              - Generate aging analysis report
GET    /api/v1/aging/item/{itemId}        - Get item aging details
GET    /api/v1/aging/stagnant             - Get stagnant items (>365 days)
GET    /api/v1/aging/report               - Generate aging analysis report with write-off risk
```

### Reorder Point Recommendation Endpoints (NEW)
```
GET    /api/v1/reorder-recommendations    - Get all recommendations (status: PENDING, ACCEPTED, REJECTED)
POST   /api/v1/reorder-recommendations/analyze - Analyze and generate recommendations
GET    /api/v1/reorder-recommendations/{id} - Get recommendation details with analysis
PUT    /api/v1/reorder-recommendations/{id}/accept - Accept recommendation
PUT    /api/v1/reorder-recommendations/{id}/reject - Reject recommendation
GET    /api/v1/reorder-recommendations/item/{itemId} - Get recommendations for item
```

### Inventory Cycle Count Endpoints (NEW)
```
GET    /api/v1/cycle-counts               - Get all cycle counts (filters: status, date range)
POST   /api/v1/cycle-counts               - Schedule cycle count
GET    /api/v1/cycle-counts/{id}          - Get cycle count details
PUT    /api/v1/cycle-counts/{id}/count    - Record physical count
PUT    /api/v1/cycle-counts/{id}/verify   - Verify and reconcile count
POST   /api/v1/cycle-counts/{id}/adjust   - Create adjustment for variance
GET    /api/v1/cycle-counts/pending       - Get pending cycle counts
GET    /api/v1/cycle-counts/report        - Generate cycle count report (variances, discrepancies)
```

### Reports Endpoints
```
GET    /api/v1/reports/inventory-valuation - Inventory valuation report
GET    /api/v1/reports/stock-movement     - Stock movement report
GET    /api/v1/reports/low-stock          - Low stock items report
GET    /api/v1/reports/slow-moving        - Slow-moving items report
GET    /api/v1/reports/vendor-performance - Vendor performance report
GET    /api/v1/reports/budget-vs-actual   - Budget vs actual report
```

---

## Backend Implementation

### Directory Structure
```
backend/src/
├── controllers/
│   ├── store.controller.ts
│   ├── item.controller.ts
│   ├── category.controller.ts
│   ├── stock-level.controller.ts
│   ├── stock-movement.controller.ts
│   ├── purchase-order.controller.ts
│   ├── requisition.controller.ts
│   ├── stock-transfer.controller.ts
│   ├── stock-adjustment.controller.ts
│   ├── vendor.controller.ts
│   ├── goods-receipt.controller.ts (NEW)
│   ├── stock-batch.controller.ts (NEW)
│   ├── stock-valuation.controller.ts (NEW)
│   ├── invoice-matching.controller.ts (NEW)
│   ├── gl-mapping.controller.ts (NEW)
│   ├── stock-aging.controller.ts (NEW)
│   ├── reorder-recommendation.controller.ts (NEW)
│   ├── cycle-count.controller.ts (NEW)
│   └── inventory-report.controller.ts
├── services/
│   ├── store.service.ts
│   ├── item.service.ts
│   ├── category.service.ts
│   ├── stock-level.service.ts
│   ├── stock-movement.service.ts
│   ├── purchase-order.service.ts
│   ├── requisition.service.ts
│   ├── stock-transfer.service.ts
│   ├── stock-adjustment.service.ts
│   ├── vendor.service.ts
│   ├── goods-receipt.service.ts (NEW)
│   ├── stock-batch.service.ts (NEW)
│   ├── stock-valuation.service.ts (NEW)
│   ├── invoice-matching.service.ts (NEW)
│   ├── gl-mapping.service.ts (NEW)
│   ├── stock-aging.service.ts (NEW)
│   ├── reorder-recommendation.service.ts (NEW)
│   ├── cycle-count.service.ts (NEW)
│   └── inventory-report.service.ts
├── routes/
│   ├── store.routes.ts
│   ├── items.routes.ts
│   ├── stock.routes.ts
│   ├── movements.routes.ts
│   ├── purchase-orders.routes.ts
│   ├── requisitions.routes.ts
│   ├── transfers.routes.ts
│   ├── adjustments.routes.ts
│   ├── vendors.routes.ts
│   ├── goods-receipts.routes.ts (NEW)
│   ├── batches.routes.ts (NEW)
│   ├── valuations.routes.ts (NEW)
│   ├── matching.routes.ts (NEW)
│   ├── gl-mappings.routes.ts (NEW)
│   ├── aging.routes.ts (NEW)
│   ├── reorder.routes.ts (NEW)
│   ├── cycle-counts.routes.ts (NEW)
│   └── reports.routes.ts
└── utils/
    ├── stock-calculator.ts (Stock level calculations)
    ├── inventory-valuation.ts (FIFO/LIFO/WAC calculations - ENHANCED)
    ├── valuation-fifo.ts (NEW - FIFO algorithm with batch tracking)
    ├── valuation-lifo.ts (NEW - LIFO algorithm with batch tracking)
    ├── valuation-wac.ts (NEW - Weighted average cost calculation)
    ├── alert-system.ts (Generate stock alerts)
    ├── barcode-generator.ts (Generate/print barcodes)
    ├── batch-tracking.ts (NEW - Batch consumption FIFO/LIFO)
    ├── goods-receipt-3way-matching.ts (NEW - 3-way matching logic)
    ├── stock-aging-calculator.ts (NEW - Calculate aging categories)
    ├── reorder-analyzer.ts (NEW - Analyze usage patterns, recommend reorder points)
    └── cycle-count-reconciliation.ts (NEW - Reconcile physical counts with system)
```

---

## Frontend Pages

### Dashboard
```
/dashboard/inventory/
├── Inventory Overview
│   ├── Key metrics (total items, inventory value, low stock alerts)
│   ├── Recent movements
│   └── Quick actions
```

### Item Management
```
/dashboard/inventory/items
├── Item list (searchable, filterable by category)
├── /dashboard/inventory/items/[id]
│   ├── Item details
│   ├── Stock levels by store
│   ├── Movement history
│   └── Purchase history
└── Create/Edit item form
```

### Store Management
```
/dashboard/inventory/stores
├── Store list
├── /dashboard/inventory/stores/[id]
│   ├── Store details
│   ├── Current stock levels
│   ├── Recent movements
│   └── Store statistics
└── Create store form
```

### Stock Levels
```
/dashboard/inventory/stock
├── Stock levels for all items/stores (spreadsheet view)
├── Low stock alerts
├── Overstock items
└── Stock level adjustment form
```

### Stock Movements
```
/dashboard/inventory/movements
├── Movement history (filterable)
├── Stock in form (receiving goods)
├── Stock out form (issuing items)
└── Transfer between stores form
```

### Purchase Orders
```
/dashboard/inventory/purchase-orders
├── PO list (with status filter)
├── /dashboard/inventory/purchase-orders/[id]
│   ├── PO details
│   ├── Receipt tracking
│   └── Payment status
├── Create PO form
└── Goods receipt form
```

### Requisitions
```
/dashboard/inventory/requisitions
├── Requisition list (with status filter)
├── /dashboard/inventory/requisitions/[id]
│   ├── Requisition details
│   └── Issue items interface
├── Create requisition form
└── Approval interface
```

### Vendors
```
/dashboard/inventory/vendors
├── Vendor list
├── /dashboard/inventory/vendors/[id]
│   ├── Vendor details
│   ├── Order history
│   └── Performance metrics
└── Create/Edit vendor form
```

### Goods Receipt (NEW)
```
/dashboard/inventory/goods-receipts
├── Receipt list (with status filter: PENDING, INSPECTING, ACCEPTED, REJECTED)
├── /dashboard/inventory/goods-receipts/[id]
│   ├── Receipt details with all items
│   ├── QC inspection interface (NEW)
│   ├── 3-way matching details (NEW)
│   ├── Accept/Reject receipt workflow
│   └── Receipt history
└── Create receipt form (from PO)
```

### Stock Batch Management (NEW)
```
/dashboard/inventory/batches
├── Batch list (with filters: item, store, expiry status)
├── /dashboard/inventory/batches/[id]
│   ├── Batch details with quantity tracking
│   ├── Batch consumption history (FIFO/LIFO)
│   ├── Shelf location tracking (NEW)
│   └── Quality grade & storage conditions
├── Expiring batches alert (NEW - batches expiring within 30 days)
├── Expired batches list (NEW)
└── Batch edit form
```

### Inventory Valuation Reports (NEW)
```
/dashboard/inventory/valuations
├── Current valuation summary (total inventory value)
├── Valuation by store
├── Valuation by item category
├── /dashboard/inventory/valuations/[id]
│   ├── Detailed valuation with breakdown
│   ├── FIFO/LIFO/WAC calculation details (NEW)
│   ├── Batch composition for valuation
│   └── Historical comparison (period-over-period)
├── Valuation calculation interface (NEW - select method: FIFO, LIFO, WAC)
└── Valuation variance report (NEW - vs previous period)
```

### 3-Way Matching Interface (NEW)
```
/dashboard/inventory/matching
├── Invoice line mapping list (filters: status, PO, variance type)
├── /dashboard/inventory/matching/[id]
│   ├── PO line details
│   ├── Receipt line details
│   ├── Vendor invoice line details
│   ├── Variance analysis (quantity %, price %)
│   └── Approval workflow
├── Items with variances (highlight discrepancies)
└── Matching variance report
```

### GL Account Mapping (NEW)
```
/dashboard/inventory/gl-mappings
├── GL mapping list (by item/category)
├── /dashboard/inventory/gl-mappings/[id]
│   ├── Mapping details
│   ├── GL account selection
│   └── Debit/credit account assignment
└── Create/Edit GL mapping form
```

### Stock Aging Analysis (NEW)
```
/dashboard/inventory/aging
├── Aging summary (items by age category)
├── Stock aging breakdown (0-90, 90-180, 180-365, >365 days)
├── Stagnant items list (>365 days idle)
├── Write-off risk analysis (NEW)
├── /dashboard/inventory/aging/[id]
│   ├── Item aging details
│   ├── Last issue date & usage pattern
│   └── Recommended action (sell, donate, scrap)
└── Aging analysis report with recommendations
```

### Reorder Point Recommendations (NEW)
```
/dashboard/inventory/reorder-recommendations
├── Recommendations list (filters: status, item)
├── /dashboard/inventory/reorder-recommendations/[id]
│   ├── Analysis details
│   ├── Consumption analysis (daily, monthly average)
│   ├── Lead time & safety stock calculation
│   ├── Current vs recommended reorder point
│   └── Acceptance workflow
├── Analysis generator interface (NEW - analyze usage patterns)
└── Recommendations report
```

### Inventory Cycle Count (NEW)
```
/dashboard/inventory/cycle-counts
├── Cycle count schedule (list with status)
├── /dashboard/inventory/cycle-counts/[id]
│   ├── Count details (scheduled vs actual)
│   ├── Physical counting interface (NEW)
│   ├── Variance analysis (system vs physical)
│   ├── Reconciliation & approval
│   └── Auto-create adjustment for variance
├── Pending cycle counts list
└── Cycle count variance report (NEW)
```

### Reports
```
/dashboard/inventory/reports
├── Inventory Valuation Report (ENHANCED - with method comparison)
├── Stock Movement Report
├── Low Stock Report
├── Slow Moving Items Report
├── Vendor Performance Report (ENHANCED - with detailed metrics)
├── Budget vs Actual Report
├── 3-Way Matching Variance Report (NEW)
├── Stock Aging Report (NEW)
├── Batch Expiry Report (NEW)
└── Cycle Count Variance Report (NEW)
```

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create all database models (Prisma migrations)
- [ ] Create seed data (items, categories, stores, vendors)
- [ ] Implement Store CRUD
- [ ] Implement Item & Category CRUD
- [ ] Implement Stock Level model and logic
- [ ] Create API routes
- [ ] Frontend: Store and item management pages

### Phase 2: Stock Movements (Week 3)
- [ ] Implement Stock In/Out functionality
- [ ] Update stock levels automatically with movements
- [ ] Generate stock alerts (low/overstock)
- [ ] Implement movement history
- [ ] Create API routes
- [ ] Frontend: Stock movement pages

### Phase 3: Purchase Orders (Week 4)
- [ ] Implement PO creation and approval workflow
- [ ] Implement goods receipt process
- [ ] Update stock levels on receipt
- [ ] Track payment status
- [ ] Create API routes
- [ ] Frontend: PO management pages

### Phase 4: Requisitions & Transfers (Week 5)
- [ ] Implement requisition system
- [ ] Implement approval workflow
- [ ] Implement requisition fulfillment (issue items)
- [ ] Implement stock transfers between stores
- [ ] Create API routes
- [ ] Frontend: Requisition and transfer pages

### Phase 5: Advanced Features (Week 6)
- [ ] Implement stock adjustments
- [ ] Implement vendor management
- [ ] Implement inventory valuation (FIFO/LIFO/WAC)
- [ ] Barcode generation (optional)
- [ ] Create API routes

### Phase 6: Goods Receipt & 3-Way Matching (NEW - Week 7)
- [ ] Implement GoodsReceipt and GoodsReceiptItem models
- [ ] Implement ReceiptInspection with QC scoring
- [ ] Implement InvoiceLineItemMapping (3-way matching)
- [ ] Create 3-way matching logic (PO → Receipt → Invoice)
- [ ] Implement variance detection & reporting
- [ ] Create API routes and frontend pages
- [ ] Goods receipt workflow (PENDING → INSPECTING → ACCEPTED)

### Phase 7: Batch & Expiry Management (NEW - Week 8)
- [ ] Implement StockBatch model with quantity tracking
- [ ] Implement batch consumption (FIFO/LIFO)
- [ ] Create batch expiry tracking and alerts
- [ ] Implement shelf location tracking
- [ ] Create batch quality grading
- [ ] Create API routes and frontend pages
- [ ] Batch movement integration with stock levels

### Phase 8: Inventory Valuation Methods (NEW - Week 9)
- [ ] Implement StockValuation model
- [ ] Implement StockValuationDetail for detailed calculations
- [ ] Create FIFO algorithm with batch tracking
- [ ] Create LIFO algorithm with batch tracking
- [ ] Create Weighted Average Cost (WAC) calculation
- [ ] Create valuation comparison reports
- [ ] Create API routes and valuation interface

### Phase 9: Advanced Analytics & Recommendations (NEW - Week 10)
- [ ] Implement StockAging model with aging categories
- [ ] Implement stock aging calculator & recommendations
- [ ] Implement ReorderPointRecommendation model
- [ ] Create reorder point analyzer (consumption patterns)
- [ ] Implement VendorPerformanceMetric tracking
- [ ] Create vendor performance reporting
- [ ] Create API routes and analytics pages

### Phase 10: Inventory Control & Verification (NEW - Week 11)
- [ ] Implement InventoryCycleCount model
- [ ] Create cycle count scheduling
- [ ] Implement variance reconciliation
- [ ] Implement auto-adjustment creation for variances
- [ ] Create cycle count reporting
- [ ] Implement InventoryAdjustmentReason master data
- [ ] Create API routes and cycle count interface

### Phase 11: Finance Integration (NEW - Week 12)
- [ ] Implement GLAccountMapping model
- [ ] Create GL account mapping configuration
- [ ] Integrate with Finance module for GL postings
- [ ] Map stock movements to GL accounts
- [ ] Create GL account assignment by item/category/movement type
- [ ] Create API routes and mapping interface

### Phase 12: Reports & Analytics (ENHANCED - Week 13)
- [ ] Create inventory valuation report (FIFO/LIFO/WAC comparison)
- [ ] Create 3-way matching variance report
- [ ] Create stock aging & write-off risk report
- [ ] Create batch expiry report
- [ ] Create cycle count variance report
- [ ] Create vendor performance analytics
- [ ] Create reorder point effectiveness report
- [ ] Frontend: Enhanced reports dashboard

### Phase 13: Testing & Optimization (Week 14)
- [ ] Test all new models and relationships
- [ ] Test complex calculations (valuations, aging, variances)
- [ ] Test 3-way matching workflow
- [ ] Test batch tracking & consumption
- [ ] Test cycle count reconciliation
- [ ] Performance optimization for large datasets
- [ ] Add comprehensive validations
- [ ] Documentation updates

---

## Business Logic

### Stock Movement Logic
```
Stock In (Purchase Receipt):
1. Get PO and item details
2. Record stock movement (IN)
3. Update stock level: currentQuantity += receivedQuantity
4. Update stock valuation
5. Check if stock is above maximum
6. Mark PO item as received

Stock Out (Requisition Issue):
1. Get requisition and item details
2. Check available quantity >= requested
3. Record stock movement (OUT)
4. Update stock level: currentQuantity -= issuedQuantity
5. Check if stock is below reorder point
6. Mark requisition as fulfilled

Stock Transfer:
1. Check available quantity in source store
2. Record movement OUT in source store
3. Record movement IN in destination store
4. Update stock levels in both stores
```

### Stock Alert Logic
```
Low Stock Alert:
IF currentQuantity <= reorderPoint:
  - Generate alert
  - Show in dashboard
  - Suggest auto-create PO

Overstock Alert:
IF currentQuantity > maximumStock:
  - Generate alert
  - Flag for review
```

### Inventory Valuation - FIFO Method (NEW)
```
FIFO (First-In, First-Out) Valuation:

Algorithm:
1. Get all batches for item sorted by receipt date (oldest first)
2. For remaining quantity in stock:
   - Take oldest batch first
   - Calculate value: min(remainingQty, batchQty) * batchPrice
   - Add to total value
   - Subtract from remainingQty
3. Return total value

Example:
Batch 1: 100 units @ $10 = $1,000 (oldest)
Batch 2: 50 units @ $12 = $600
Batch 3: 30 units @ $15 = $450

Current stock: 120 units
FIFO Valuation:
- 100 units from Batch 1 @ $10 = $1,000
- 20 units from Batch 2 @ $12 = $240
- Total FIFO value = $1,240
```

### Inventory Valuation - LIFO Method (NEW)
```
LIFO (Last-In, First-Out) Valuation:

Algorithm:
1. Get all batches for item sorted by receipt date (newest first)
2. For remaining quantity in stock:
   - Take newest batch first
   - Calculate value: min(remainingQty, batchQty) * batchPrice
   - Add to total value
   - Subtract from remainingQty
3. Return total value

Example (Same batches as FIFO):
Current stock: 120 units
LIFO Valuation:
- 30 units from Batch 3 @ $15 = $450
- 50 units from Batch 2 @ $12 = $600
- 40 units from Batch 1 @ $10 = $400
- Total LIFO value = $1,450
```

### Inventory Valuation - Weighted Average Cost (NEW)
```
WAC (Weighted Average Cost) Valuation:

Algorithm:
1. Get all batches for item
2. Calculate: Total Value = Sum(batchQty * batchPrice)
3. Calculate: Total Quantity = Sum(batchQty)
4. Calculate: Average Unit Cost = Total Value / Total Quantity
5. Inventory Value = Current Quantity * Average Unit Cost

Example (Same batches):
Total Value = (100*$10) + (50*$12) + (30*$15) = $1,000 + $600 + $450 = $2,050
Total Quantity = 100 + 50 + 30 = 180 units
Average Unit Cost = $2,050 / 180 = $11.39 per unit
Current stock: 120 units
WAC Value = 120 * $11.39 = $1,367
```

### Goods Receipt & 3-Way Matching Logic (NEW - CRITICAL)
```
Three-Way Matching Process:
1. PO Line (Purchase Order Item)
   - Quantity ordered: 100 units @ $10/unit

2. Receipt Line (Goods Receipt Item)
   - Quantity received: 100 units
   - Unit price on receipt: $10/unit

3. Vendor Invoice Line (InvoiceLineItemMapping)
   - Quantity invoiced: 98 units
   - Unit price on invoice: $10.50/unit

Matching Status:
- Quantity Variance: PO (100) vs Invoice (98) = -2 units
- Price Variance: PO ($10) vs Invoice ($10.50) = +$0.50 per unit

Variance Detection:
IF quantity variance > threshold (e.g., 2% or 5 units):
  Status = QUANTITY_VARIANCE
IF price variance > threshold (e.g., 5% or $1):
  Status = PRICE_VARIANCE
IF both match:
  Status = MATCHED

Action Required:
- Contact vendor for discrepancies
- Decide: Accept, request credit note, reject invoice
- Create stock adjustment if quantity differs
```

### Batch Tracking & Consumption (NEW)
```
Batch Consumption Logic (FIFO):

When issuing stock:
1. Get all active batches for item sorted by receipt date
2. For requested quantity:
   - Issue from oldest batch first
   - Update batch.currentQuantity
   - Mark batch as FULLY_CONSUMED if currentQuantity = 0
   - Move to next batch if needed
3. Update stock levels

Batch Expiry Tracking:
- Check batch.expiryDate >= today
- If expiryDate <= today + 30 days: Alert
- If expiryDate < today: Mark as EXPIRED
- Cannot issue expired batches

Quality Grade Tracking:
- A: Excellent (issue first)
- B: Good (issue second)
- C: Fair (issue with caution)
- Storage conditions tracked for compliance
```

### Stock Aging Analysis (NEW)
```
Stock Aging Categories:
- FRESH: 0-90 days since last issue (ACTIVE usage)
- NORMAL: 90-180 days (Regular usage)
- AGING: 180-365 days (Slow moving)
- STAGNANT: >365 days (Not used, write-off risk)

Aging Calculation:
For each item:
  daysSinceLastIssue = today - lastIssuedDate
  IF daysSinceLastIssue <= 90:
    ageCategory = FRESH
  ELSE IF daysSinceLastIssue <= 180:
    ageCategory = NORMAL
  ...
  writeoffRisk = (daysSinceLastIssue / 365) * 100

Recommendations:
- FRESH: Retain, normal usage
- NORMAL: Monitor, good stock rotation
- AGING: Consider discounted sales, reviews
- STAGNANT: Donate, scrap, or deep discount

Write-off Risk % = (daysSinceLastIssue / 365) * 100
Example: Item unused for 400 days = (400/365)*100 = 110% risk = High
```

### Reorder Point Analysis (NEW)
```
Smart Reorder Point Calculation:

Formula:
ReorderPoint = (AverageDailyUsage * VendorLeadTime) + SafetyStock

Where:
- AverageDailyUsage = Total usage in period / Days in period
- VendorLeadTime = Days to receive from vendor
- SafetyStock = Buffer for demand variability
  SafetyStock = AverageDailyUsage * LeadTime * VariationFactor

Example:
- Average daily usage: 10 units/day
- Vendor lead time: 7 days
- Variation factor: 1.5 (50% variability buffer)
- SafetyStock = 10 * 7 * 1.5 = 105 units
- ReorderPoint = (10 * 7) + 105 = 175 units

Recommendation:
- Current setting: 150 units
- Recommended: 175 units
- Justification: Demand variance requires safety buffer
```

### Cycle Count Reconciliation (NEW)
```
Inventory Cycle Count Process:

1. Schedule Count
   - Select items to count (by category, store, etc.)
   - Set scheduled date

2. Physical Count
   - Actual count recorded in field
   - Compare: systemQuantity vs physicalQuantity
   - Variance = physicalQuantity - systemQuantity

3. Variance Analysis
   - variancePercentage = (variance / systemQuantity) * 100
   - Flag if > threshold (e.g., 5%)
   - valueVariance = variance * unitCost

4. Reconciliation
   - If variance acceptable: Mark as RECONCILED
   - If variance > threshold: Create adjustment
   - Root cause analysis: THEFT, DAMAGE, SHRINKAGE, ERROR

5. Adjustment
   - Auto-create StockAdjustment
   - Status: PENDING → APPROVED
   - Update stock levels

Example:
System: 100 units, Physical: 96 units
Variance: -4 units (-4%)
Value Impact: -4 * $10 = -$40
Action: Create adjustment for -4 units, reason: SHRINKAGE
```

---

## Error Handling

```json
{
  "success": false,
  "error": "Error message",
  "details": {}
}
```

### Core Errors
- **INSUFFICIENT_STOCK**: Requested quantity exceeds available quantity
- **INVALID_STORE**: Store ID doesn't exist or is inactive
- **INVALID_ITEM**: Item ID doesn't exist or is inactive
- **DUPLICATE_SKU**: SKU already exists in system
- **INVALID_MOVEMENT**: Movement type not supported

### Purchase Order & Receipt Errors (NEW)
- **PO_NOT_APPROVED**: Cannot receive goods for unapproved PO
- **PO_NOT_FOUND**: Purchase order not found
- **RECEIPT_NOT_FOUND**: Goods receipt not found
- **QUANTITY_MISMATCH**: Received quantity differs from PO quantity
- **PO_ALREADY_RECEIVED**: PO already fully received (cannot receive more)
- **INVALID_RECEIPT_STATUS**: Cannot perform action on this receipt status
- **INSPECTION_FAILED**: Goods receipt failed QC inspection (cannot accept)

### 3-Way Matching Errors (NEW)
- **MATCHING_NOT_FOUND**: Invoice line mapping not found
- **QUANTITY_VARIANCE_EXCEEDED**: Quantity variance exceeds threshold
- **PRICE_VARIANCE_EXCEEDED**: Price variance exceeds threshold
- **UNMATCHED_LINES**: Some PO lines don't have corresponding receipts/invoices
- **MATCHING_ALREADY_APPROVED**: Cannot modify approved matching

### Batch & Expiry Errors (NEW)
- **BATCH_NOT_FOUND**: Batch not found
- **BATCH_EXPIRED**: Cannot issue from expired batch
- **BATCH_FULLY_CONSUMED**: Batch has no remaining quantity
- **DUPLICATE_BATCH**: Batch already exists for this item
- **INVALID_BATCH_NO**: Invalid batch number format
- **EXPIRY_DATE_INVALID**: Expiry date is in the past

### Valuation Errors (NEW)
- **VALUATION_NOT_FOUND**: Valuation record not found
- **INVALID_VALUATION_METHOD**: Invalid valuation method (must be FIFO, LIFO, WAC, or STANDARD_COST)
- **NO_BATCHES_FOR_VALUATION**: Cannot calculate valuation without batch data
- **VALUATION_CALCULATION_FAILED**: Error during valuation calculation

### Cycle Count Errors (NEW)
- **CYCLE_COUNT_NOT_FOUND**: Cycle count record not found
- **COUNT_ALREADY_DONE**: Cannot recount item that's already counted
- **VARIANCE_EXCEEDS_TOLERANCE**: Variance exceeds acceptable threshold
- **INVALID_COUNT_QUANTITY**: Physical count quantity is invalid
- **SCHEDULE_NOT_FOUND**: Cycle count schedule not found

### GL Account Mapping Errors (NEW)
- **GL_MAPPING_NOT_FOUND**: GL account mapping not found
- **DUPLICATE_GL_MAPPING**: Mapping already exists for this item/category/movement type
- **INVALID_GL_ACCOUNT**: GL account doesn't exist in Finance module
- **GL_MAPPING_INACTIVE**: GL mapping is inactive (cannot use)

### Reorder Recommendation Errors (NEW)
- **RECOMMENDATION_NOT_FOUND**: Reorder recommendation not found
- **INSUFFICIENT_DATA_FOR_ANALYSIS**: Not enough usage data to generate recommendation
- **INVALID_LEAD_TIME**: Vendor lead time must be > 0
- **RECOMMENDATION_ALREADY_ACCEPTED**: Cannot change accepted recommendation

### Stock Aging Errors (NEW)
- **AGING_RECORD_NOT_FOUND**: Stock aging record not found
- **NO_USAGE_HISTORY**: Cannot calculate aging without usage history
- **ANALYSIS_DATE_IN_FUTURE**: Analysis date cannot be in the future

---

## Security & Access Control

### Role-Based Access Control (RBAC)

**ADMIN Role**
- Full access to all store operations
- Can create/edit/delete stores, items, categories
- Can approve all transactions (PO, receipts, requisitions)
- Can generate all reports
- Can configure GL mappings
- Can modify valuation methods

**INVENTORY_MANAGER Role**
- Can manage inventory operations (items, stock levels)
- Can create and approve requisitions
- Can view and analyze stock movements
- Can generate inventory reports
- Can manage batches and aging analysis
- Can review and recommend reorder points
- **CANNOT**: Approve high-value POs, modify GL mappings, change valuation methods

**STOREKEEPER Role**
- Can record stock movements (in/out/transfers)
- Can receive goods and conduct QC inspections
- Can participate in cycle counts (physical counting)
- Can view current stock levels
- **CANNOT**: Approve transactions, modify prices, delete records

**PURCHASE_OFFICER Role**
- Can create and manage purchase orders
- Can view receipts and matching status
- Can approve 3-way matching discrepancies
- **CANNOT**: Receive goods, modify stock levels directly

**QUALITY_CONTROL Role**
- Can conduct receipt inspections and QC
- Can approve/reject goods receipts
- Can flag items with quality issues
- **CANNOT**: Modify PO or requisitions

**REQUESTOR Role**
- Can create requisitions
- Can view status of own requisitions
- **CANNOT**: Approve requisitions, receive goods

**STUDENT/TEACHER Role**
- View limited items (for requisitions)
- Cannot access stock levels or movement details

### CRITICAL - Data Integrity & Approval Chain

**Purchase Order Workflow**
- DRAFT (Creator) → PENDING (APPROVER review) → APPROVED (for receiving)
- Only APPROVER and ADMIN can approve POs
- Cannot modify approved POs

**Goods Receipt Workflow** (NEW)
- PENDING → INSPECTING (QC inspection) → ACCEPTED or REJECTED
- QUALITY_CONTROL must inspect and approve
- Cannot accept without passing inspection

**3-Way Matching** (NEW - CRITICAL FOR PAYMENTS)
- PENDING → REVIEWED → MATCHED or VARIANCE_FLAGGED
- Variances > threshold require INVENTORY_MANAGER review
- Cannot process payment without matching approval

**Batch Tracking** (NEW)
- All batches must have batch number and receipt date
- Expiry date mandatory for consumables
- Cannot issue from expired batches (system blocks)
- Quality grade assignment mandatory

**Valuation Method** (NEW - CRITICAL FOR FINANCIAL REPORTING)
- Only ADMIN can change valuation method
- Method change requires Finance module notification
- All valuations use selected method
- Method changes create audit trail with impact analysis

**GL Account Mapping** (NEW - CRITICAL FOR FINANCE INTEGRATION)
- Only ADMIN can create/modify GL mappings
- Mapping required before stock movements affect GL
- All movements must have valid GL mapping
- Finance module reconciliation automatic

**Cycle Count** (NEW)
- ADMIN schedules counts
- STOREKEEPER performs physical count
- INVENTORY_MANAGER reconciles and approves variances
- Variance > threshold requires ADMIN approval
- Auto-creates adjustments with approval chain

### Data Protection & Audit Trail

**All Transactions Logged**
- Stock movements: Who, when, what, quantity, reason
- Approvals: Who approved, when, any changes
- Valuations: Which method, when calculated, by whom
- GL mappings: Creation, changes, deletions
- Batch tracking: Creation, consumption, expiry alerts
- Cycle counts: Physical count, discrepancies, reconciliation

**Price Protection**
- Only ADMIN can view/edit unit costs
- Cost changes logged with reason
- Valuation impact calculated automatically

**Batch Expiry Protection** (CRITICAL)
- System prevents issuing from expired batches
- Expiry alerts generated 30 days before
- Expired batches marked (cannot be used)
- Historical record kept for compliance

**Physical Security**
- Barcode-based tracking (if implemented)
- Serial number tracking (for high-value items)
- Periodic physical verification (cycle counts)
- Discrepancies flagged and investigated
- Write-off risk automatically calculated for aging stock

### Finance Integration Security (NEW - CRITICAL)

**GL Account Integration**
- Only backend services post to Finance GL
- Frontend cannot directly create GL entries
- All stock movements must map to GL accounts
- GL mapping validation before movement recording

**Valuation Reporting**
- Finance reports use approved valuation method
- Valuation changes trigger Finance notification
- Inventory value reconciles to GL accounts

**Payment Matching**
- 3-way matching must be complete before payment
- Variances flagged to Finance for resolution
- Cannot make payment without matching approval

---

## Related Documentation
- [Database Schema](./DATABASE.md)
- [API Standards](./API_STANDARDS.md)
- [Finance Module](./FINANCE_MODULE.md) - For purchase order integration
- [Report Standards](./REPORTING.md)
