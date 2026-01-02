# School ERP Transportation Module - Architecture Design Document

**Version:** 1.0
**Date:** 2025-12-31
**Author:** Winston (System Architect)
**Status:** Design Phase Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Database Schema Design](#database-schema-design)
4. [API Architecture](#api-architecture)
5. [Real-Time Architecture](#real-time-architecture)
6. [Mobile App Architecture](#mobile-app-architecture)
7. [Frontend Architecture](#frontend-architecture)
8. [Security & Authorization](#security--authorization)
9. [Performance & Scalability](#performance--scalability)
10. [Integration with Existing Modules](#integration-with-existing-modules)
11. [Data Retention & Privacy](#data-retention--privacy)
12. [Error Handling & Resilience](#error-handling--resilience)
13. [Technology Stack Summary](#technology-stack-summary)
14. [Migration & Deployment Strategy](#migration--deployment-strategy)
15. [Open Architecture Decisions](#open-architecture-decisions)

---

## Executive Summary

The Transportation Module is a comprehensive fleet management system designed to handle real-time vehicle tracking, driver management, route planning, and student assignments across multi-tenant school infrastructure. This architecture supports 100+ vehicles, 500+ concurrent WebSocket connections, and sub-5-second real-time tracking updates.

**Key Capabilities:**
- Real-time GPS tracking of school vehicles
- Intelligent route management and optimization
- Student-to-route assignments with pickup/drop location tracking
- Integration with attendance and notification systems
- Offline-first mobile app for drivers with background GPS tracking
- Live tracking dashboard for parents and administrators
- Emergency alert system with escalation
- Comprehensive maintenance and compliance tracking

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRANSPORTATION MODULE                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND LAYER                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐    ┌────────────────────────────────┐      │
│  │  ADMIN DASHBOARD       │    │  PARENT MOBILE APP             │      │
│  │  (Next.js 14)          │    │  (React Native + Expo)         │      │
│  │                        │    │                                │      │
│  │ - Live Tracking Map    │    │ - Real-time Bus Location       │      │
│  │ - Fleet Management     │    │ - ETA Calculation             │      │
│  │ - Route Editor         │    │ - Trip Notifications          │      │
│  │ - Student Assignment   │    │ - Trip History                │      │
│  │ - Emergency Console    │    └────────────────────────────────┘      │
│  │ - Reports & Analytics  │                                            │
│  └────────────────────────┘    ┌────────────────────────────────┐      │
│                                │  DRIVER MOBILE APP             │      │
│                                │  (React Native + Expo)         │      │
│                                │                                │      │
│                                │ - Trip Management             │      │
│                                │ - Background GPS Tracking      │      │
│                                │ - Student Boarding/Alighting  │      │
│                                │ - Emergency Alerts            │      │
│                                │ - Offline Sync                │      │
│                                └────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
┌───────────────────▼──┐   ┌──────────▼──────────┐   ┌─▼────────────────┐
│   REST API Server    │   │  WebSocket Server   │   │ Static Content   │
│   (Express.js)       │   │  (Socket.IO)        │   │ (React Query,    │
│                      │   │                     │   │  Map Tiles)      │
│ - Vehicle CRUD       │   │ - Real-time Updates │   │                  │
│ - Driver Management  │   │ - Room-based Subs   │   └──────────────────┘
│ - Route Management   │   │ - Location Streams  │
│ - GPS Ingestion      │   │ - Emergency Alerts  │
│ - Reports/Analytics  │   │ - Auth Handshake    │
│                      │   │                     │
│ Rate Limited:        │   │ Rate Limited:       │
│ Standard Limits      │   │ 100 msg/min         │
└──────────┬───────────┘   └──────────┬──────────┘
           │                         │
           └────────────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────────┐   ┌────▼──────────┐   ┌────▼─────────────┐
   │  PostgreSQL  │   │  Redis Pub/Sub│   │ Redis Cache      │
   │  (Persistent)│   │  (Multi-node) │   │ (60s TTL)        │
   │              │   │               │   │                  │
   │ - Core Data  │   │ - Live Streams│   │ - Current Locs   │
   │ - 30-day GPS │   │ - Broadcasts  │   │ - Session Data   │
   │   History    │   │ - Horizontal  │   │ - User Prefs     │
   │ - Audit Trail│   │   Scaling     │   │                  │
   └──────────────┘   └───────────────┘   └──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│ - Student Module (ClassEnrollment, StudentParent)                  │
│ - Attendance Module (StudentAttendance)                            │
│ - Notification Module (Push/SMS for alerts & ETAs)                │
│ - User Authentication (JWT + OAuth)                               │
│ - Maps API (Google Maps/Leaflet)                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
DRIVER APP (expo-location)
      │
      │ POST /api/v1/transportation/location
      │ (every 15 seconds, ~10 locations/min)
      │
      └──────────────┬─────────────────┐
                     │                 │
              ┌──────▼─────┐      ┌───▼─────────┐
              │  Express   │      │ Rate Limit  │
              │  Validate  │      │ Check       │
              └──────┬─────┘      │ (10/min)    │
                     │           └─────────────┘
                     │
          ┌──────────▼────────────┐
          │ Redis Cache Update    │
          │ (60s TTL)             │
          │ transport:location:   │
          │ {vehicleId}           │
          └──────────┬────────────┘
                     │
          ┌──────────▼─────────────────┐
          │ Redis Pub/Sub Broadcast    │
          │ Channel:                   │
          │ transport:location:{vid}   │
          └──────┬────────────┬────────┘
                 │            │
        ┌────────▼──┐    ┌────▼─────────┐
        │ Socket.IO  │    │ PostgreSQL   │
        │ Broadcast  │    │ Sparse Store │
        │ to Rooms   │    │ (every 5min) │
        └────┬───────┘    └──────────────┘
             │
    ┌────────┴──────────┐
    │                   │
    ▼                   ▼
Admin Dashboard    Parent App
Live Updates       Real-time Track
(React Query)      (WebSocket)
```

---

## Database Schema Design

### Complete Prisma Models

See comprehensive schema in the detailed documentation. Key models include:

**Core Transportation Models:**
- `Vehicle` - Vehicle registration, GPS device, capacity
- `Driver` - Driver profile, license, employment
- `Route` - Route definition with timing
- `Stop` - Bus stop GPS locations
- `RouteStop` - Route-to-stop sequencing
- `Trip` - Daily trip execution records
- `StudentRoute` - Student-to-route assignments
- `VehicleMaintenanceLog` - Maintenance history
- `GPSLocation` - Real-time GPS data (sparse storage)

**Key Enums (8 total):**
- VehicleType, VehicleStatus, DriverStatus, RouteStatus, StopType
- MaintenanceType, MaintenanceStatus, GPSStatus

---

## API Architecture

### Core REST Endpoints

**Vehicle Management:**
- `GET/POST /api/v1/transportation/vehicles`
- `GET/PUT/DELETE /api/v1/transportation/vehicles/:id`
- `GET /api/v1/transportation/vehicles/:id/maintenance-history`

**Driver Management:**
- `GET/POST /api/v1/transportation/drivers`
- `GET/PUT /api/v1/transportation/drivers/:id`
- `POST /api/v1/transportation/drivers/:id/assign-vehicle`

**Route Management:**
- `GET/POST /api/v1/transportation/routes`
- `GET/PUT /api/v1/transportation/routes/:id`
- `POST /api/v1/transportation/routes/:id/add-stop`

**GPS Tracking:**
- `POST /api/v1/transportation/location` (GPS ingestion, rate limited)
- `GET /api/v1/transportation/vehicles/:id/location` (current)
- `GET /api/v1/transportation/vehicles/:id/location-history` (historical)

**Reports:**
- `GET /api/v1/transportation/reports/fleet-status`
- `GET /api/v1/transportation/reports/route-efficiency`
- `GET /api/v1/transportation/reports/driver-performance`

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (SUPER_ADMIN, ADMIN, TEACHER/DRIVER, PARENT, STUDENT)
- School-based multi-tenancy isolation
- Parent can only view assigned children's transportation
- Rate limiting: 10 GPS updates per minute per driver

---

## Real-Time Architecture

### Socket.IO WebSocket Server

**Namespace:** `/transport`

**Authentication:** JWT token on handshake

**Rooms:**
- `vehicle:{vehicleId}` - Live location updates
- `route:{routeId}` - Route-level updates
- `school:{schoolId}` - School-level emergencies
- `trip:{tripId}` - Trip status updates

**Client Events:**
- `subscribe-vehicle` - Subscribe to vehicle tracking
- `unsubscribe-vehicle` - Unsubscribe

**Server Events:**
- `location-update` - Vehicle location change
- `trip-status-update` - Trip status change
- `eta-update` - ETA recalculation
- `emergency-alert` - Emergency event
- `driver-status-change` - Driver availability

### Redis Pub/Sub

**Channels:**
- `transport:location:{vehicleId}` - Location updates (all servers)
- `transport:emergency:{vehicleId}` - Emergency broadcasts

**Strategy:**
- Redis Pub/Sub ensures all server instances receive updates
- Enables horizontal scaling without sticky sessions
- Location data persisted to PostgreSQL every 5 minutes (sparse storage)

---

## Real-Time Performance

- **End-to-end latency:** < 5 seconds (GPS capture to client display)
- **WebSocket delivery:** < 1 second
- **Concurrent connections:** 500+
- **Location update throughput:** 10/min/driver, 1000 total updates/sec max
- **Database sparse storage:** Every 5 minutes (95% reduction from raw 15s updates)

---

## Mobile App Architecture

### Driver App Features
- Background GPS tracking (expo-location + TaskManager)
- Foreground service with notifications (Android)
- Trip checklist with student photos
- Student boarding/alighting confirmation
- Emergency alert button
- Offline location queue with sync on reconnect

### Parent App Features
- Real-time vehicle location on map
- ETA calculation and countdown
- Trip notifications (arrival alerts)
- Trip history and attendance correlation
- Student status indicators

### Offline Support
- SQLite for local data persistence
- AsyncStorage for preferences
- Offline queue for failed API requests
- Conflict resolution on sync

---

## Frontend Architecture

### Admin Dashboard (Next.js 14)

**Key Pages:**
- Live Tracking Map (Leaflet with real-time markers)
- Fleet Management (vehicle CRUD)
- Route Editor (drag-drop stop sequencing)
- Driver Management (assignments, credentials)
- Student Assignments (bulk upload, UI editor)
- Reports & Analytics (fleet efficiency, driver performance)
- Emergency Management Console

**State Management:**
- React Query for server state
- Zustand for client state
- WebSocket for real-time updates

---

## Security & Authorization

### Authorization Matrix

```
SUPER_ADMIN: Full access to all resources
ADMIN: CRUD vehicles, drivers, routes; manage assignments
TEACHER: View assigned vehicles/routes; submit GPS (as driver)
PARENT: View child's route/vehicle; track live
STUDENT: View own route/vehicle; track live
```

### Security Measures
- JWT authentication on all endpoints
- WebSocket handshake authentication
- Rate limiting (10 GPS updates/min per driver)
- Data isolation by schoolId
- Parent access scoped to their children
- End-to-end encryption for sensitive fields
- Audit logging for critical operations

---

## Performance Targets

- GPS ingestion latency: < 100ms
- Real-time broadcast latency: < 5 seconds end-to-end
- Dashboard map rendering (100 vehicles): < 1 second
- API endpoints (P95): < 500ms
- System availability: 99.9%

---

## Integration Points

### With Existing Modules

**Student Module:**
- StudentRoute links to Student model
- Fetch student's assigned route and vehicle

**Attendance Module:**
- Auto-mark present when student boards bus
- Alighting time recorded for attendance
- Trip-based attendance reports

**Notification Module:**
- Send SMS/push when bus 5 min away
- Send delay alerts to parents
- Emergency alert escalation

**Authentication Module:**
- Extend UserRole enum with DRIVER
- Create User → Driver relationship
- Reuse JWT authentication

---

## Data Retention

- **GPS Data:** 30 days in hot storage (PostgreSQL)
- **Historical Data:** 90 days in archive
- **Hard Delete:** After 90 days (GDPR compliance)
- **Parent Consent:** Required for GPS tracking
- **Data Export:** GDPR right to access via API

---

## Technology Stack

**Backend:** Express.js, Socket.IO, Redis, PostgreSQL, Prisma

**Frontend:** Next.js 14, React, Leaflet, Zustand, React Query, Tailwind CSS

**Mobile:** React Native, Expo, expo-location, react-native-maps, SQLite

**Infrastructure:** Docker, Kubernetes, HAProxy/Nginx, Prometheus, ELK Stack

---

## Deployment Strategy

### Blue-Green Deployment
- Deploy new version (Blue)
- Gradual traffic shift: 5% → 25% → 50% → 100%
- Old version (Green) ready for rollback
- Mobile apps: Gradual rollout via app stores

### Feature Flags
- Enable/disable per school
- Backward compatibility for 2 weeks
- Support both old/new API versions

---

## Critical Implementation Files

1. **backend/prisma/schema.prisma** - All Prisma models
2. **backend/src/routes/transportation.routes.ts** - API routes
3. **backend/src/services/transport-location.service.ts** - GPS logic
4. **backend/src/config/socket.ts** - WebSocket server
5. **frontend/src/components/transport/VehicleTracker.tsx** - Map component

---

**Document Status:** Ready for Epic Breakdown and Story Creation in Phase 3

