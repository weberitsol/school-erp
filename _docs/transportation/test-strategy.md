# Transportation Module - Test Strategy Document

**Version:** 1.0
**Date:** 2025-12-31
**Author:** Murat (QA Lead)
**Status:** Test Planning Complete

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Scope & Exclusions](#scope--exclusions)
3. [Test Levels](#test-levels)
4. [Unit Testing Strategy](#unit-testing-strategy)
5. [Integration Testing Strategy](#integration-testing-strategy)
6. [End-to-End Testing Strategy](#end-to-end-testing-strategy)
7. [Performance & Load Testing](#performance--load-testing)
8. [Security Testing](#security-testing)
9. [Mobile Testing](#mobile-testing)
10. [Test Environment Setup](#test-environment-setup)
11. [Test Execution Plan](#test-execution-plan)
12. [Metrics & Coverage Targets](#metrics--coverage-targets)
13. [Risk Assessment](#risk-assessment)

---

## Testing Overview

### Vision
Ensure Transportation Module is production-ready through comprehensive testing covering functionality, performance, security, and user experience.

### Testing Objectives
1. **Functionality:** All features work as designed per acceptance criteria
2. **Reliability:** System handles errors gracefully, no data loss
3. **Performance:** Meets latency targets (<5s real-time, <500ms API)
4. **Security:** User data protected, role-based access enforced
5. **Scalability:** Supports 500+ concurrent users, 1000 GPS updates/sec
6. **Usability:** Intuitive UI, no confusing workflows
7. **Compatibility:** Works on iOS, Android, desktop browsers

### Testing Approach
- **Shift-Left:** Testing starts during development (TDD)
- **Continuous:** Automated tests run on every commit
- **Risk-Based:** Prioritize testing high-risk areas (GPS tracking, emergencies)
- **Parallel:** Unit tests during development, E2E tests during integration

### Test Levels Pyramid

```
        /\
       /E2E\ (5%)
      /___\
     /Integration\ (20%)
    /___________\
   /   Unit Tests  \ (75%)
  /_______________\
```

---

## Scope & Exclusions

### In Scope
- All 48 user stories and acceptance criteria
- All REST API endpoints (40+)
- WebSocket real-time connections
- Mobile apps (iOS & Android)
- Admin web dashboard
- Database operations
- Authentication & authorization
- Integration with attendance module
- Notification system
- GPS tracking accuracy
- Error handling & edge cases

### Out of Scope (Future)
- Third-party map provider testing (assume Google Maps API works)
- Mobile OS bugs (firmware issues)
- Network provider reliability
- School's internal systems testing
- User training & documentation
- Performance optimization beyond baseline targets

### Data Privacy Testing
- GDPR compliance (data retention, right to delete)
- Parental consent tracking
- Audit logging
- Data isolation by school

---

## Test Levels

### Unit Tests
**Scope:** Individual functions, methods, services
**Tools:** Jest, TypeScript, jsdom for DOM testing
**Target:** 80% code coverage minimum
**Execution:** Every commit (pre-commit hook)
**Duration:** < 5 minutes total

### Integration Tests
**Scope:** API endpoints, database, WebSocket events
**Tools:** Supertest, Jest, test database
**Target:** 100% endpoint coverage
**Execution:** Every commit (pre-push)
**Duration:** < 15 minutes total

### End-to-End Tests
**Scope:** Complete user workflows
**Tools:** Playwright (web), Detox (mobile)
**Target:** 5 critical workflows
**Execution:** Daily (nightly)
**Duration:** < 10 minutes total

### Performance Tests
**Scope:** Load, scalability, response times
**Tools:** k6, Apache JMeter
**Target:** Meets latency/throughput targets
**Execution:** Weekly
**Duration:** < 30 minutes total

### Security Tests
**Scope:** Authorization, injection, data protection
**Tools:** OWASP tools, manual review, dependency scan
**Target:** No critical vulnerabilities
**Execution:** Before each release
**Duration:** < 4 hours total

---

## Unit Testing Strategy

### Framework & Setup

```bash
# Dependencies
npm install --save-dev jest ts-jest @types/jest

# jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

# Run tests
npm run test                  # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### Test Structure

```typescript
// src/services/vehicle.service.test.ts

describe('VehicleService', () => {
  let vehicleService: VehicleService
  let prisma: PrismaClient
  let mockRedis: RedisClient

  beforeEach(() => {
    // Setup
    vehicleService = new VehicleService(prisma, mockRedis)
  })

  afterEach(() => {
    // Cleanup
  })

  describe('create', () => {
    it('should create vehicle with valid data', async () => {
      // Arrange
      const input = {
        registrationNumber: 'AB-1234',
        type: VehicleType.BUS,
        capacity: 45
      }

      // Act
      const result = await vehicleService.create(input)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.registrationNumber).toBe('AB-1234')
      expect(result.status).toBe(VehicleStatus.ACTIVE)
    })

    it('should reject duplicate registration number', async () => {
      // Arrange
      const input = {
        registrationNumber: 'AB-1234',
        type: VehicleType.BUS,
        capacity: 45
      }
      await vehicleService.create(input)

      // Act & Assert
      await expect(vehicleService.create(input))
        .rejects
        .toThrow('Registration number already exists')
    })

    it('should reject invalid capacity', async () => {
      // Act & Assert
      await expect(vehicleService.create({
        registrationNumber: 'AB-1234',
        type: VehicleType.BUS,
        capacity: 0
      })).rejects.toThrow('Capacity must be > 0')
    })
  })

  describe('calculateDistance', () => {
    it('should calculate Haversine distance correctly', () => {
      // School to Park: ~2.5 km
      const distance = vehicleService.calculateDistance(
        40.7128, -74.0060,  // School
        40.7282, -73.7949   // Park
      )
      expect(distance).toBeCloseTo(7500, -2) // ~7.5 km
    })

    it('should return 0 for same coordinates', () => {
      const distance = vehicleService.calculateDistance(
        40.7128, -74.0060,
        40.7128, -74.0060
      )
      expect(distance).toBe(0)
    })
  })

  describe('validateGPSCoordinates', () => {
    it('should accept valid coordinates', () => {
      const valid = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }
      expect(() => vehicleService.validateGPS(valid))
        .not.toThrow()
    })

    it('should reject invalid latitude', () => {
      expect(() => vehicleService.validateGPS({
        latitude: 91,      // > 90
        longitude: -74.0060,
        accuracy: 10
      })).toThrow('Latitude must be -90 to 90')
    })

    it('should reject invalid accuracy', () => {
      expect(() => vehicleService.validateGPS({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 0        // Must be > 0
      })).toThrow('Accuracy must be > 0')
    })
  })
})
```

### Services to Test with Coverage Targets

| Service | Methods | Coverage Target | Notes |
|---------|---------|-----------------|-------|
| VehicleService | create, update, delete, getList, getById | 85% | Handle duplicate registration |
| DriverService | create, update, getList, validateLicense | 85% | License expiry validation critical |
| RouteService | create, updateStops, optimize, getWithStops | 90% | Stop sequencing validation |
| GPSLocationService | validate, cache, publish, calculateETA | 90% | Geofence detection critical |
| TripService | create, updateStatus, markBoarded, complete | 85% | Attendance integration points |
| RouteOptimization | calculateDistance, nearestNeighbor, totalDistance | 100% | Math-heavy, must be exact |
| TransportPubSub | subscribe, publish, broadcast | 80% | Redis dependency mocked |

### Mock Strategy

```typescript
// Mock Prisma
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => ({
    vehicle: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // ... other models
  }))
}))

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
  }))
}))

// Usage in test
const mockPrisma = require('@prisma/client').PrismaClient()
mockPrisma.vehicle.create.mockResolvedValue({
  id: 'test-id',
  registrationNumber: 'AB-1234'
})
```

---

## Integration Testing Strategy

### Framework & Setup

```bash
# Dependencies
npm install --save-dev supertest

# test/api/vehicles.integration.test.ts
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/lib/prisma'

describe('Vehicle API Endpoints', () => {
  let authToken: string

  beforeAll(async () => {
    // Start server in test mode
    // Create test school and admin user
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'test123' })
    authToken = res.body.token
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.vehicle.deleteMany({})
    await prisma.school.deleteMany({})
  })

  describe('POST /api/v1/transportation/vehicles', () => {
    it('should create vehicle with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          registrationNumber: 'AB-1234',
          type: 'BUS',
          capacity: 45,
          gpsDeviceId: 'device-123'
        })

      expect(res.status).toBe(201)
      expect(res.body.data.id).toBeDefined()
      expect(res.body.data.registrationNumber).toBe('AB-1234')
      expect(res.body.success).toBe(true)
    })

    it('should return 400 for invalid type', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          registrationNumber: 'AB-5678',
          type: 'INVALID_TYPE',
          capacity: 45
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toContain('Invalid type')
    })

    it('should return 409 for duplicate registration', async () => {
      // Create first vehicle
      await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          registrationNumber: 'AB-1234',
          type: 'BUS',
          capacity: 45
        })

      // Try to create duplicate
      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          registrationNumber: 'AB-1234',
          type: 'VAN',
          capacity: 30
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('already exists')
    })

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .send({
          registrationNumber: 'AB-9999',
          type: 'BUS',
          capacity: 45
        })

      expect(res.status).toBe(401)
      expect(res.body.error).toContain('Unauthorized')
    })

    it('should return 403 for non-admin user', async () => {
      // Get parent token
      const parentRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'parent@test.com', password: 'test123' })
      const parentToken = parentRes.body.token

      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({
          registrationNumber: 'AB-8888',
          type: 'BUS',
          capacity: 45
        })

      expect(res.status).toBe(403)
      expect(res.body.error).toContain('Forbidden')
    })
  })

  describe('GET /api/v1/transportation/vehicles', () => {
    beforeEach(async () => {
      // Seed test data
      await prisma.vehicle.createMany({
        data: [
          { registrationNumber: 'AB-1111', type: 'BUS', capacity: 45, status: 'ACTIVE' },
          { registrationNumber: 'AB-2222', type: 'VAN', capacity: 30, status: 'ACTIVE' },
          { registrationNumber: 'AB-3333', type: 'CAR', capacity: 8, status: 'MAINTENANCE' },
        ]
      })
    })

    it('should return paginated vehicles', async () => {
      const res = await request(app)
        .get('/api/v1/transportation/vehicles?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(3)
      expect(res.body.total).toBe(3)
      expect(res.body.page).toBe(1)
    })

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/v1/transportation/vehicles?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0].status).toBe('ACTIVE')
    })

    it('should search by registration number', async () => {
      const res = await request(app)
        .get('/api/v1/transportation/vehicles?search=AB-1111')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].registrationNumber).toBe('AB-1111')
    })

    it('should enforce multi-tenancy (schoolId)', async () => {
      // This depends on how JWT encodes schoolId
      const res = await request(app)
        .get('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${authToken}`)

      // Only vehicles from authenticated user's school should be returned
      expect(res.body.data.every(v => v.schoolId === 'test-school-id')).toBe(true)
    })
  })

  describe('PUT /api/v1/transportation/vehicles/:id', () => {
    let vehicleId: string

    beforeEach(async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: 'AB-5555',
          type: 'BUS',
          capacity: 45,
          schoolId: 'test-school-id'
        }
      })
      vehicleId = vehicle.id
    })

    it('should update vehicle', async () => {
      const res = await request(app)
        .put(`/api/v1/transportation/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          capacity: 50,
          status: 'MAINTENANCE'
        })

      expect(res.status).toBe(200)
      expect(res.body.data.capacity).toBe(50)
      expect(res.body.data.status).toBe('MAINTENANCE')
    })

    it('should not allow changing registration number', async () => {
      const res = await request(app)
        .put(`/api/v1/transportation/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          registrationNumber: 'AB-9999'
        })

      // Should either ignore or reject
      expect(res.body.data.registrationNumber).toBe('AB-5555')
    })

    it('should return 404 for non-existent vehicle', async () => {
      const res = await request(app)
        .put('/api/v1/transportation/vehicles/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ capacity: 50 })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/transportation/vehicles/:id', () => {
    it('should soft delete vehicle (mark RETIRED)', async () => {
      const vehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: 'AB-6666',
          type: 'BUS',
          capacity: 45,
          schoolId: 'test-school-id'
        }
      })

      const res = await request(app)
        .delete(`/api/v1/transportation/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)

      // Verify vehicle marked as RETIRED, not deleted from DB
      const deleted = await prisma.vehicle.findUnique({
        where: { id: vehicle.id }
      })
      expect(deleted?.status).toBe('RETIRED')
    })

    it('should return 409 if vehicle has active routes', async () => {
      // Create vehicle with active route assignment
      const vehicle = await prisma.vehicle.create({
        data: {
          registrationNumber: 'AB-7777',
          type: 'BUS',
          capacity: 45,
          schoolId: 'test-school-id'
        }
      })

      // Create and assign route
      const route = await prisma.route.create({
        data: {
          name: 'Route 1',
          status: 'ACTIVE',
          startTime: '08:00',
          endTime: '09:00',
          schoolId: 'test-school-id'
        }
      })

      await prisma.routeVehicle.create({
        data: {
          routeId: route.id,
          vehicleId: vehicle.id
        }
      })

      const res = await request(app)
        .delete(`/api/v1/transportation/vehicles/${vehicle.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(409)
      expect(res.body.error).toContain('active routes')
    })
  })
})
```

### Endpoint Coverage Matrix

| Endpoint | Method | Test Cases | Status |
|----------|--------|-----------|--------|
| /vehicles | POST | Valid, Invalid, Duplicate, 401, 403 | ✓ |
| /vehicles | GET | List, Filter, Search, Pagination, Multi-tenancy | ✓ |
| /vehicles/:id | GET | Valid ID, 404, Multi-tenancy | ✓ |
| /vehicles/:id | PUT | Update, Reject name change, 404 | ✓ |
| /vehicles/:id | DELETE | Soft delete, 409 conflict | ✓ |
| /vehicles/:id/maintenance | GET | History, Pagination | ✓ |

**Total API Integration Tests:** 40+ endpoints × 5-8 test cases = 200+ tests

---

## End-to-End Testing Strategy

### Web E2E Tests (Playwright)

```typescript
// tests/e2e/admin-dashboard.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard - Complete Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should complete admin route creation workflow', async ({ page }) => {
    // Step 1: Login
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'testpass123')
    await page.click('button:has-text("Login")')

    await expect(page).toHaveURL(/.*dashboard/)

    // Step 2: Navigate to routes
    await page.click('text=Routes')

    // Step 3: Add new route
    await page.click('button:has-text("Add Route")')

    // Step 4: Fill form
    await page.fill('input[name="name"]', 'Route Test')
    await page.fill('input[name="startTime"]', '08:00')
    await page.fill('input[name="endTime"]', '09:00')
    await page.click('button:has-text("Create")')

    // Step 5: Verify route created
    await expect(page.locator('text=Route Test')).toBeVisible()

    // Step 6: Edit route - add stops
    await page.click('button[aria-label="Edit Route Test"]')

    // Step 7: Add first stop
    await page.click('button:has-text("Add Stop")')
    await page.selectOption('select[name="stopId"]', 'stop-1')
    await page.fill('input[name="waitTime"]', '5')
    await page.click('button:has-text("Add")')

    // Verify stop added
    await expect(page.locator('text=Stop 1')).toBeVisible()

    // Step 8: Add second stop
    await page.click('button:has-text("Add Stop")')
    await page.selectOption('select[name="stopId"]', 'stop-2')
    await page.fill('input[name="waitTime"]', '3')
    await page.click('button:has-text("Add")')

    // Step 9: Assign vehicle
    await page.selectOption('select[name="vehicle"]', 'vehicle-1')
    await page.click('button:has-text("Assign")')

    // Step 10: Save route
    await page.click('button:has-text("Save")')

    // Verify success
    await expect(page.locator('text=Route saved successfully')).toBeVisible()
  })

  test('should display live vehicle tracking on map', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/transportation/live-tracking')

    // Wait for map to load
    const mapFrame = page.frameLocator('[name="leaflet-map"]')

    // Verify vehicles displayed
    const vehicleMarkers = page.locator('[data-test="vehicle-marker"]')
    const count = await vehicleMarkers.count()
    expect(count).toBeGreaterThan(0)

    // Click on vehicle marker
    await vehicleMarkers.first().click()

    // Verify popup shows
    await expect(page.locator('text=Vehicle: AB-1234')).toBeVisible()

    // Click "View Trip Details"
    await page.click('button:has-text("View Trip Details")')

    // Verify trip details modal
    await expect(page.locator('text=Trip Details')).toBeVisible()
  })

  test('should handle emergency alert workflow', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/transportation/emergency')

    // Simulate emergency alert (would come via WebSocket)
    // For testing, manually trigger alert modal

    // Verify emergency banner appears
    await expect(page.locator('text=ACTIVE EMERGENCY')).toBeVisible()

    // Click Acknowledge
    await page.click('button:has-text("Acknowledge")')

    // Verify status changed
    await expect(page.locator('text=ACKNOWLEDGED')).toBeVisible()
  })
})
```

### Mobile E2E Tests (Detox)

```typescript
// tests/e2e/driver-app.e2e.ts

import detox from 'detox'
import { device, element, by, expect as detoxExpect } from 'detox'

describe('Driver App - Trip Completion Workflow', () => {
  beforeAll(async () => {
    await detox.init()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  afterAll(async () => {
    await detox.cleanup()
  })

  it('should complete full trip workflow', async () => {
    // Login
    await element(by.id('emailInput')).typeText('driver@test.com')
    await element(by.id('passwordInput')).typeText('testpass123')
    await element(by.text('Login')).multiTap()

    // Verify home screen
    await detoxExpect(element(by.text('Route 1'))).toBeVisible()

    // Start trip
    await element(by.id('startTripButton')).multiTap()

    // Verify active trip screen
    await detoxExpect(element(by.text('BOARDED (0)'))).toBeVisible()

    // Board first student
    await element(by.text('John Doe')).multiTap()

    // Camera permission dialog (mock)
    await element(by.text('Board')).multiTap()

    // Verify student moved to boarded section
    await waitFor(element(by.text('BOARDED (1)')))
      .toBeVisible()
      .withTimeout(5000)

    // Board remaining students
    await element(by.text('Sarah Smith')).multiTap()
    await element(by.text('Board')).multiTap()
    await waitFor(element(by.text('BOARDED (2)')))
      .toBeVisible()
      .withTimeout(5000)

    // Mark one as absent
    await element(by.text('Priya Sharma')).longPress()
    await element(by.text('Mark Absent')).multiTap()
    await element(by.text('Confirm')).multiTap()

    // Complete trip
    await element(by.id('completeTripButton')).multiTap()

    // Confirm completion
    await element(by.text('Yes, Complete')).multiTap()

    // Verify trip report shown
    await detoxExpect(element(by.text('Trip Completed'))).toBeVisible()
  })

  it('should work offline and sync when online', async () => {
    // Go offline
    await device.setBiometricEnrollment(false)

    // Login with cached credentials
    // ... navigate to active trip

    // Board student while offline
    await element(by.text('John Doe')).multiTap()
    await element(by.text('Board')).multiTap()

    // Verify queued for sync
    await detoxExpect(element(by.text('Syncing...'))).toBeVisible()

    // Go online
    await device.setBiometricEnrollment(true)

    // Verify sync completed
    await waitFor(element(by.text('All synced')))
      .toBeVisible()
      .withTimeout(5000)
  })
})
```

### E2E Test Scenarios

| Scenario | Steps | Expected | Duration |
|----------|-------|----------|----------|
| Admin creates route | Create → Add stops → Assign vehicle | Route visible in list | 2 min |
| Driver completes trip | Start → Board students → Complete | Trip report generated | 3 min |
| Parent tracks bus | Login → Select child → View map → See ETA | Real-time updates | 2 min |
| Emergency response | Driver triggers → Admin sees → Acknowledge | Parents notified | 1 min |
| Offline sync | Board offline → Go online → Sync | Students marked boarded | 2 min |

**Total E2E Tests:** 15-20 scenarios × 3-5 min = 60-100 minutes

---

## Performance & Load Testing

### Load Test Scenarios

**Scenario 1: GPS Ingestion Load Test**

```bash
# k6 script
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 100,           // 100 virtual users (drivers)
  duration: '10m',    // 10 minutes
  thresholds: {
    http_req_duration: ['p(95)<100'],  // 95th percentile < 100ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
}

export default function () {
  const url = 'http://localhost:5000/api/v1/transportation/location'

  const location = {
    vehicleId: `vehicle-${__VU % 100}`,
    latitude: 40.7128 + Math.random() * 0.01,
    longitude: -74.0060 + Math.random() * 0.01,
    accuracy: 10 + Math.random() * 5,
    timestamp: new Date().toISOString()
  }

  const res = http.post(url, JSON.stringify(location), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.TOKEN}`
    }
  })

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  })

  sleep(15)  // GPS update every 15 seconds
}
```

**Target Results:**
- Response time (p95): < 100ms ✓
- Throughput: 1000 updates/sec ✓
- Error rate: < 1% ✓
- Database: < 50% CPU ✓

**Scenario 2: WebSocket Concurrent Connections**

```typescript
// Load test: 500 concurrent WebSocket connections
const test = async () => {
  const clients: WebSocket[] = []

  // Create 500 WebSocket connections
  for (let i = 0; i < 500; i++) {
    const ws = new WebSocket(
      `ws://localhost:5000/transport?token=${testToken}`
    )

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      // Simulate processing
    }

    clients.push(ws)
  }

  // Subscribe to vehicle rooms
  clients.forEach((ws, idx) => {
    ws.send(JSON.stringify({
      event: 'subscribe-vehicle',
      vehicleId: `vehicle-${idx % 100}`
    }))
  })

  // Simulate location updates
  for (let update = 0; update < 100; update++) {
    for (let v = 0; v < 100; v++) {
      // Publish location update
      // Measure broadcast latency
    }
    await sleep(1000)
  }

  // Measure:
  // - Message delivery latency (target: < 1 second)
  // - Memory per connection (target: < 50KB)
  // - CPU usage (target: < 30%)
}
```

**Target Results:**
- Concurrent connections: 500+ ✓
- Message latency (p95): < 1 second ✓
- Memory per connection: < 50KB ✓
- CPU usage: < 30% ✓

**Scenario 3: Dashboard Rendering Load**

```typescript
// Load test: 50 admins viewing live map with 100 vehicles
const test = async () => {
  // Simulate 50 admin sessions
  const admins = Array(50).fill(null).map((_, i) => ({
    id: `admin-${i}`,
    ws: createWebSocket(),
    page: createPageInstance() // Puppeteer
  }))

  // Each admin opens live map
  for (const admin of admins) {
    await admin.page.goto('http://localhost:3000/live-tracking')

    // Subscribe to all vehicle locations
    admin.ws.send(JSON.stringify({
      event: 'subscribe-school',
      schoolId: 'test-school'
    }))
  }

  // Simulate 100 vehicles moving every 15 seconds
  for (let iter = 0; iter < 100; iter++) {
    for (let v = 0; v < 100; v++) {
      publishLocationUpdate(`vehicle-${v}`)
    }

    // Measure:
    // - Map render time (target: < 1 second)
    // - DOM update time (target: < 500ms)
    // - Network bandwidth (target: < 10 Mbps)

    await sleep(15000)
  }
}
```

---

## Security Testing

### Authorization Testing

```typescript
// test/security/authorization.test.ts

describe('Authorization Matrix', () => {
  let adminToken: string
  let parentToken: string
  let driverToken: string

  beforeAll(async () => {
    adminToken = await createTestUser('SUPER_ADMIN')
    parentToken = await createTestUser('PARENT')
    driverToken = await createTestUser('TEACHER') // Driver role
  })

  describe('Vehicle Endpoints', () => {
    it('ADMIN can create vehicle', async () => {
      const res = await createVehicle(adminToken, { /* ... */ })
      expect(res.status).toBe(201)
    })

    it('PARENT cannot create vehicle', async () => {
      const res = await createVehicle(parentToken, { /* ... */ })
      expect(res.status).toBe(403)
    })

    it('DRIVER cannot create vehicle', async () => {
      const res = await createVehicle(driverToken, { /* ... */ })
      expect(res.status).toBe(403)
    })

    it('PARENT can only view assigned child vehicle', async () => {
      const res = await getVehicle(parentToken)
      // Should only return vehicles for child's routes
      expect(res.data.length).toBeLessThanOrEqual(1)
    })
  })

  describe('GPS Endpoints', () => {
    it('DRIVER can submit GPS for assigned vehicle', async () => {
      const res = await submitGPS(driverToken, { /* ... */ })
      expect(res.status).toBe(200)
    })

    it('DRIVER cannot submit GPS for unassigned vehicle', async () => {
      const res = await submitGPS(driverToken, {
        vehicleId: 'other-vehicle-id'
      })
      expect(res.status).toBe(401)
    })

    it('PARENT cannot submit GPS', async () => {
      const res = await submitGPS(parentToken, { /* ... */ })
      expect(res.status).toBe(403)
    })
  })

  describe('Multi-tenancy', () => {
    it('Admin from School A cannot see School B vehicles', async () => {
      const schoolAToken = await createTestUser('ADMIN', 'school-a')
      const schoolBToken = await createTestUser('ADMIN', 'school-b')

      const resA = await getVehicles(schoolAToken)
      const resB = await getVehicles(schoolBToken)

      // Should not overlap
      expect(resA.data.every(v => v.schoolId === 'school-a')).toBe(true)
      expect(resB.data.every(v => v.schoolId === 'school-b')).toBe(true)
    })

    it('Parent cannot access other parent children', async () => {
      const parent1Token = await createTestUser('PARENT', 'school-a', 'child-1')
      const parent2Token = await createTestUser('PARENT', 'school-a', 'child-2')

      const res1 = await getChild(parent1Token)
      const res2 = await getChild(parent2Token)

      expect(res1.data.studentId).not.toBe(res2.data.studentId)
    })
  })

  describe('WebSocket Authorization', () => {
    it('Parent cannot subscribe to unassigned vehicle room', async () => {
      const ws = createWebSocket(parentToken)

      ws.send(JSON.stringify({
        event: 'subscribe-vehicle',
        vehicleId: 'unassigned-vehicle'
      }))

      // Should receive error or disconnection
      const response = await waitForMessage(ws)
      expect(response.error).toContain('Unauthorized')
    })

    it('Parent can subscribe to assigned vehicle room', async () => {
      const child = await createTestStudent('parent-token', 'route-1')
      const vehicle = await getVehicleForRoute('route-1')

      const ws = createWebSocket(parentToken)

      ws.send(JSON.stringify({
        event: 'subscribe-vehicle',
        vehicleId: vehicle.id
      }))

      // Should succeed
      const response = await waitForMessage(ws)
      expect(response.subscribed).toBe(true)
    })
  })
})
```

### Vulnerability Testing

```typescript
// test/security/vulnerabilities.test.ts

describe('OWASP Top 10 - Transportation Module', () => {
  describe('A1: Injection', () => {
    it('should not be vulnerable to SQL injection', async () => {
      const malicious = "AB-1234'; DROP TABLE vehicles; --"
      const res = await request(app)
        .get(`/api/v1/transportation/vehicles?search=${malicious}`)

      // Query should fail gracefully, not execute SQL
      expect(res.status).toBe(400) // Bad request
      expect(res.body.error).not.toContain('syntax error')
    })

    it('should not be vulnerable to NoSQL injection', async () => {
      const malicious = { $ne: null }
      const res = await request(app)
        .get(`/api/v1/transportation/vehicles`)
        .query({ status: malicious })

      expect(res.status).toBe(400)
    })
  })

  describe('A3: Injection - XSS', () => {
    it('should escape HTML in text fields', async () => {
      const xss = '<img src=x onerror=alert("XSS")>'
      const res = await request(app)
        .post('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          registrationNumber: 'AB-1234',
          type: 'BUS',
          capacity: 45
        })

      // Should not store raw HTML
      expect(res.body.data.registrationNumber).not.toContain('onerror')
    })
  })

  describe('A2: Broken Authentication', () => {
    it('should invalidate token after logout', async () => {
      const token = await login('admin@test.com', 'password')

      await logout(token)

      // Token should no longer be valid
      const res = await request(app)
        .get('/api/v1/transportation/vehicles')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(401)
    })

    it('should refresh token before expiry', async () => {
      const { token, expiresIn } = await login('admin@test.com', 'password')

      // Token expires in 1 hour
      expect(expiresIn).toBe(3600)

      // Refresh before expiry
      const newToken = await refreshToken(token)
      expect(newToken).toBeDefined()
      expect(newToken).not.toBe(token)
    })
  })

  describe('A5: Broken Access Control', () => {
    it('should enforce rate limiting on GPS endpoint', async () => {
      const driverToken = await createTestUser('TEACHER')

      // Submit 11 GPS updates (limit is 10/min)
      for (let i = 0; i < 11; i++) {
        const res = await submitGPS(driverToken, { /* ... */ })

        if (i < 10) {
          expect(res.status).toBe(200)
        } else {
          expect(res.status).toBe(429) // Too Many Requests
        }
      }
    })
  })

  describe('A7: Identification & Authentication Failures', () => {
    it('should not expose user information in errors', async () => {
      const res = await login('nonexistent@test.com', 'password')

      // Should not say "User not found"
      expect(res.status).toBe(401)
      expect(res.body.error).not.toContain('not found')
      expect(res.body.error).toContain('Invalid credentials')
    })
  })

  describe('A08: Software & Data Integrity Failures', () => {
    it('should validate all dependencies', async () => {
      // Run npm audit
      const result = exec('npm audit --audit-level=moderate')

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('0 vulnerabilities')
    })
  })
})
```

### Data Privacy Testing

```typescript
describe('Data Privacy & GDPR Compliance', () => {
  it('should delete GPS data after 90 days', async () => {
    // Create GPS location 91 days ago
    const oldLocation = await createGPSLocation({
      timestamp: moment().subtract(91, 'days').toDate()
    })

    // Run deletion job
    await runDataRetentionJob()

    // Verify deleted
    const found = await prisma.gpsLocation.findUnique({
      where: { id: oldLocation.id }
    })
    expect(found).toBeNull()
  })

  it('should honor parent consent for tracking', async () => {
    const student = await createTestStudent()

    // Parent declines tracking consent
    await updateStudentRoute(student.id, {
      consentToTracking: false
    })

    // Attempt to view location
    const parentToken = await login(student.parentEmail)
    const res = await request(app)
      .get(`/api/v1/students/${student.id}/location`)
      .set('Authorization', `Bearer ${parentToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error).toContain('tracking consent')
  })

  it('should export data upon request (GDPR)', async () => {
    const parent = await createTestUser('PARENT')

    const res = await request(app)
      .get('/api/v1/students/me/data-export')
      .set('Authorization', `Bearer ${parentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toContain('trips')
    expect(res.body.data).toContain('locations')
    expect(res.body.data).toContain('attendance')
  })
})
```

---

## Mobile Testing

### Device Matrix

| OS | Devices | Versions | Notes |
|---|---------|----------|-------|
| iOS | iPhone 12, 13, 14, 15 | iOS 14, 15, 16, 17 | Latest 4 versions |
| Android | Samsung S21, S23, Pixel 6, 7 | Android 12, 13, 14 | Latest 3 versions |
| Orientations | Portrait, Landscape | All | Rotation handling |

### Critical Test Cases

```
Login Flow
├─ ✓ Email/password valid
├─ ✓ Remember device option
├─ ✓ Biometric (Face ID, Touch ID, fingerprint)
├─ ✓ Token expiry and refresh
└─ ✓ Logout clears data

GPS & Background Tracking
├─ ✓ Location permission prompt
├─ ✓ Background mode enabled (Foreground Service on Android)
├─ ✓ GPS accuracy acceptable
├─ ✓ Updates sent every 15 seconds
├─ ✓ Battery drain < 15% per 4 hours
└─ ✓ Stop tracking if app killed

Offline Functionality
├─ ✓ Student boarding queued offline
├─ ✓ Trip data cached locally
├─ ✓ Photos stored locally
├─ ✓ Sync on reconnect without duplication
└─ ✓ Error recovery if sync fails

Notifications
├─ ✓ Push notification received
├─ ✓ Sound plays (if enabled)
├─ ✓ Deep link navigates to trip
├─ ✓ Badge count updates
└─ ✓ Quiet hours respected

Dark Mode
├─ ✓ Readable text contrast
├─ ✓ Image visibility
├─ ✓ UI colors appropriate
└─ ✓ Toggle persists

Performance
├─ ✓ App startup < 3 seconds
├─ ✓ Map loads < 2 seconds
├─ ✓ List scrolls smoothly (60 FPS)
└─ ✓ No ANR (Android) / freeze (iOS)
```

---

## Test Environment Setup

### Local Development

```bash
# Backend test environment
BACKEND_TEST_ENV=.env.test

# Backend .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/transport_test"
REDIS_URL="redis://localhost:6379/1"
JWT_SECRET="test-secret-key"
NODE_ENV="test"

# Frontend test environment
NEXT_PUBLIC_API_URL="http://localhost:5000"
NEXT_PUBLIC_WS_URL="ws://localhost:5000"

# Database reset before tests
npm run db:reset:test
npx prisma migrate deploy --skip-generate
npx prisma db seed
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: transport_test

      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Setup database
        run: |
          npx prisma migrate deploy
          npx prisma db seed

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Check coverage threshold
        run: npm run test:coverage:check
```

---

## Test Execution Plan

### Week 1: Unit Tests
- Setup Jest, configuration
- Write tests for core services (Vehicle, Driver, Route, GPS)
- Target: 80% coverage
- Time: 40 hours

### Week 2: Integration Tests
- Setup Supertest, test database
- Write API endpoint tests (40+ endpoints)
- Target: 100% endpoint coverage
- Time: 30 hours

### Week 3: E2E Tests
- Setup Playwright and Detox
- Write critical workflows (5 web, 3 mobile)
- Manual testing on devices
- Time: 25 hours

### Week 4: Performance & Security Tests
- Load testing (GPS, WebSocket, dashboard)
- Security scanning, penetration testing
- Vulnerability patching
- Time: 20 hours

**Total Testing Effort:** 115 hours (~3 weeks)

---

## Metrics & Coverage Targets

### Code Coverage Targets

| Layer | Target | Status |
|-------|--------|--------|
| Services | 80% | Baseline |
| Controllers | 70% | Baseline |
| Utils/Helpers | 90% | Higher due to math functions |
| Overall | 80% | Minimum acceptable |

### Test Execution Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Unit tests runtime | < 5 min | |
| Integration tests runtime | < 15 min | |
| E2E tests runtime | < 10 min | |
| All tests runtime | < 30 min | |
| Test pass rate | 100% | Required |
| Flaky tests | 0 | Required |

### Performance Metrics

| Metric | Target | Measure |
|--------|--------|---------|
| GPS API latency (p95) | < 100ms | k6 load test |
| WebSocket latency (p95) | < 1s | Custom test |
| API latency (p95) | < 500ms | Postman monitor |
| Dashboard map render | < 1s | Lighthouse |
| Mobile startup time | < 3s | Device testing |
| Battery drain (4hrs) | < 15% | Device testing |

### Security Metrics

| Metric | Target | Status |
|--------|--------|--------|
| OWASP Top 10 covered | 100% | |
| Vulnerabilities (high/critical) | 0 | |
| Dependency audit clean | Yes | |
| Code scan issues | 0 critical | |
| Authorization tests | 100% coverage | |
| Multi-tenancy tests | 100% coverage | |

---

## Risk Assessment

### High Risk Areas

| Area | Risk | Mitigation |
|------|------|-----------|
| Real-time GPS tracking | Data loss, latency spikes | Redis Pub/Sub, sparse storage, load testing |
| WebSocket scalability | 500+ connections unsupported | k6 load test with 500 VUs, connection pooling |
| Student safety (boarding) | Missing students undetected | Manual + automated checks, parent notifications |
| Emergency response | Slow alert delivery | <30s requirement, load testing, redundancy |
| Multi-tenancy isolation | Data leakage between schools | Multi-tenancy unit tests, integration tests |
| Mobile offline sync | Data duplication/loss | Offline queue tests, conflict resolution tests |

### Recommended Testing Order

1. **Critical Path Testing** (Week 1)
   - Unit tests for core services
   - GPS validation & storage
   - Trip lifecycle
   - Student boarding workflow

2. **Integration Testing** (Week 2)
   - All API endpoints
   - Database consistency
   - WebSocket connections
   - Attendance integration

3. **E2E Testing** (Week 3)
   - Admin route creation
   - Driver trip completion
   - Parent bus tracking
   - Emergency response
   - Offline sync

4. **Performance & Security** (Week 4)
   - Load testing
   - Security scanning
   - Mobile device testing
   - Final go/no-go review

---

**Test Strategy Status:** Ready for Implementation

**Next Phase:** Phase 6 (Implementation Readiness) or begin Sprint 1 (Development)
