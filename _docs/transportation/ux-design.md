# Transportation Module - UX/UI Design Document

**Version:** 1.0
**Date:** 2025-12-31
**Author:** Sally (UX/UI Designer)
**Status:** Design Phase Complete

---

## Table of Contents

1. [Design System Overview](#design-system-overview)
2. [User Personas](#user-personas)
3. [User Flows](#user-flows)
4. [Web Admin Dashboard](#web-admin-dashboard)
5. [Driver Mobile App](#driver-mobile-app)
6. [Parent Mobile App](#parent-mobile-app)
7. [Component Library](#component-library)
8. [Responsive Design](#responsive-design)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Design Tokens & Theming](#design-tokens--theming)

---

## Design System Overview

### Design Principles
1. **Real-time Clarity** - Show live data clearly without clutter
2. **Safety First** - Emergency features prominent and accessible
3. **Simplicity** - Minimize clicks for critical actions
4. **Consistency** - Same patterns across web and mobile
5. **Accessibility** - WCAG 2.1 AA compliance minimum

### Color Palette

**Primary Colors:**
- Primary Blue: #2563eb (Primary actions, links)
- Success Green: #10b981 (Completed, boarded, online status)
- Warning Orange: #f59e0b (Delays, pending, caution)
- Danger Red: #ef4444 (Errors, emergencies, critical)
- Dark Gray: #374151 (Text, backgrounds)

**Semantic Colors:**
- Boarded: #10b981 (Green)
- Pending: #9ca3af (Gray)
- Alighted: #3b82f6 (Blue)
- Absent: #ef4444 (Red)
- Delayed: #f59e0b (Orange)

**Neutral Colors:**
- White: #ffffff
- Light Gray: #f3f4f6
- Border Gray: #e5e7eb
- Dark Gray: #1f2937

### Typography

**Font Family:** Inter, -apple-system, BlinkMacSystemFont, sans-serif

**Scales:**
- H1: 32px, 700 weight, 40px line-height
- H2: 24px, 700 weight, 32px line-height
- H3: 20px, 600 weight, 28px line-height
- Body Large: 16px, 400 weight, 24px line-height
- Body Regular: 14px, 400 weight, 20px line-height
- Body Small: 12px, 400 weight, 16px line-height
- Label: 12px, 600 weight, 16px line-height

### Spacing System

8px grid system:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Border Radius

- sm: 4px (input fields, small buttons)
- md: 8px (cards, modals)
- lg: 12px (large buttons, containers)
- full: 9999px (rounded buttons, avatars)

### Shadows

- sm: `0 1px 2px rgba(0,0,0,0.05)`
- md: `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)`
- lg: `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`
- xl: `0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.05)`

---

## User Personas

### Persona 1: Admin (Fleet Manager)
**Name:** Rajesh Kumar
**Role:** Transportation Coordinator
**Goals:**
- Monitor all vehicles and routes in real-time
- Respond to incidents quickly
- Manage fleet efficiency
- Ensure safety compliance
**Pain Points:**
- Need visibility across entire fleet
- Must respond to emergencies immediately
- Requires reporting for audits
**Device:** Desktop (primarily), occasional tablet

---

### Persona 2: Driver
**Name:** Arjun Singh
**Role:** School Bus Driver
**Goals:**
- Efficiently complete daily route
- Confirm student boarding/alighting
- Track location for parents
- Communicate emergencies
**Pain Points:**
- Works in vehicle with limited screen time
- Needs one-hand operation
- Must work without network in some areas
**Device:** Android phone, sometimes iPhone

---

### Persona 3: Parent
**Name:** Priya Sharma
**Role:** Working Parent
**Goals:**
- Track child's bus location
- Know ETA to pickup point
- Receive notifications
- Verify daily attendance
**Pain Points:**
- Limited time to check app
- Needs quick information
- Anxious about safety
**Device:** iPhone or Android, while commuting

---

### Persona 4: Student
**Name:** Akshara Patel
**Role:** School Student
**Goals:**
- Know bus location
- See when it's arriving
- Share location with parents
**Pain Points:**
- Limited data/battery
- May not always have phone
**Device:** Sharing parent's phone or school app

---

## User Flows

### Flow 1: Admin - Respond to Emergency

```
Dashboard Home
    ↓
🚨 Emergency Alert Banner (Top of page)
    ↓
Click "View Emergency" or alert bar
    ↓
Emergency Console Modal
    ├─ Map centered on vehicle
    ├─ Trip details panel
    ├─ Student list
    ├─ Action buttons:
    │   ├─ Acknowledge
    │   ├─ Call 911
    │   └─ Cancel Emergency
    ↓
Admin clicks "Acknowledge"
    ↓
Alert saved, banner color changes
    ↓
System notifies parents: "Emergency acknowledged"
```

### Flow 2: Driver - Complete Trip

```
Driver App Home
    ↓
Sees "Route 1" button with TODAY
    ↓
Taps Route 1
    ↓
Start Trip Screen
    ├─ Route details
    ├─ Expected timing
    ├─ Map
    ├─ "Start Trip" button (red)
    ↓
Taps "Start Trip"
    ↓
Active Trip Screen
    ├─ Top: Route name, timing
    ├─ Middle: Real-time map
    ├─ Bottom: Student checklist
    ↓
Student arrives at pickup stop
    ↓
Driver taps student name
    ↓
Boarding Options Modal
    ├─ Camera icon (optional photo)
    ├─ "Board" button (confirms)
    ↓
Student moved to BOARDED section (green)
    ↓
Repeat for all students
    ↓
At final stop, driver taps "Complete Trip"
    ↓
Confirmation: "This will mark remaining students as absent"
    ↓
Trip marked COMPLETED, report generated
```

### Flow 3: Parent - Track Child

```
Parent App Home
    ↓
"Active Trip" tab shows child's route
    ↓
Map loads with live bus location
    ↓
Real-time updates: Vehicle moves on map
    ↓
ETA countdown: "Arriving in 12 minutes"
    ↓
Parent receives notification: "Bus 1.5 km away"
    ↓
ETA updates: "Arriving in 5 minutes"
    ↓
Parent receives notification: "John has boarded"
    ↓
Parent receives notification: "Bus arriving in 2 minutes"
    ↓
Parent goes to pickup point
    ↓
Bus arrives, John alights
    ↓
Parent receives notification: "John safely alighted"
    ↓
Trip marked COMPLETED
```

---

## Web Admin Dashboard

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│  🏫 School Name          ↓ Settings    👤 User    Logout  │
└────────────────────────────────────────────────────────────┘
┌──────────┐ ┌──────────────────────────────────────────────┐
│          │ │ TRANSPORTATION DASHBOARD                     │
│ Dashboard│ ├──────────────────────────────────────────────┤
│ Live Map │ │                                              │
│ Vehicles │ │  KPI Cards Row:                              │
│ Drivers  │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ Routes   │ │  │ Vehicles │ │ On-Time  │ │ Students │    │
│ Trips    │ │  │    12    │ │  18/20   │ │ On-board │    │
│ Reports  │ │  │ ACTIVE   │ │   90%    │ │ 185/245  │    │
│Emergency │ │  └──────────┘ └──────────┘ └──────────┘    │
│Settings  │ │                                              │
│          │ │  Charts:                                     │
│          │ │  ┌─────────────┐      ┌──────────────┐    │
│          │ │  │ Fleet Usage │      │ On-Time Trend│    │
│          │ │  │  [Pie]      │      │   [Line]     │    │
│          │ │  └─────────────┘      └──────────────┘    │
│          │ │                                              │
│          │ │  Recent Alerts:                              │
│          │ │  🔴 [14:32] Emergency on Route 1            │
│          │ │  🟡 [14:15] Route 2 running 10 min late    │
│          │ │  🟢 [14:00] Trip completed on Route 3      │
│          │ │                                              │
└──────────┘ └──────────────────────────────────────────────┘
```

### Live Tracking Map Page

```
┌────────────────────────────────────────────────────────────┐
│  Live Fleet Tracking                    🔄 Refresh        │
├────────────────────────────────────────────────────────────┤
│ Filter: [Type ▼] [Route ▼] [Status ▼] Search: [___]      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   LEAFLET MAP                        │  │
│  │                                                      │  │
│  │        🟦 Vehicle Markers (Live)                    │  │
│  │        🟦 AB-1234  Route 1                          │  │
│  │        🟦 AB-5678  Route 2                          │  │
│  │        🟡 AB-9012  Route 3 (Delayed)               │  │
│  │        🟢 AB-3456  Route 4 (Completed)             │  │
│  │                                                      │  │
│  │   Routes:  ▬▬▬▬ Route 1  ▬▬▬▬ Route 2               │  │
│  │   Stops:   ● Stop A    ● Stop B    ● Stop C        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Vehicle Popup (on marker click):                           │
│  ┌─────────────────────────────────┐                      │
│  │ Vehicle: AB-1234                 │                      │
│  │ Route: Route 1                   │                      │
│  │ Driver: John Smith               │                      │
│  │ Students On-board: 15/25         │                      │
│  │ Location: 40.7128, -74.0060      │                      │
│  │ [View Trip Details] [Emergency]  │                      │
│  └─────────────────────────────────┘                      │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Vehicle Management Page

```
Vehicle Management
┌─────────────────────────────────────────────────────────┐
│ [+ Add Vehicle]  Filter: [Status ▼] Search: [____]    │
├─────────────────────────────────────────────────────────┤
│ # │ Registration │ Type  │ Capacity │ Status │ Driver  │
├───┼──────────────┼───────┼──────────┼────────┼─────────┤
│   │ AB-1234      │ BUS   │ 45       │ ACTIVE │ John ✎ 🗑 │
│   │ AB-5678      │ VAN   │ 30       │ ACTIVE │ Sarah ✎ 🗑 │
│   │ AB-9012      │ BUS   │ 45       │ MAINT  │ -     ✎ 🗑 │
│   │ AB-3456      │ CAR   │ 8        │ RETIRED│ -     ✎ 🗑 │
├───┴──────────────┴───────┴──────────┴────────┴─────────┤
│ Showing 4 of 12  [< Previous] 1 [Next >]               │
└─────────────────────────────────────────────────────────┘

Add Vehicle Modal:
┌──────────────────────────────────┐
│ Add New Vehicle              [✕]  │
├──────────────────────────────────┤
│                                  │
│ Registration #: [_____________]  │
│ Type: [BUS ▼]                   │
│ Capacity: [45]                  │
│ GPS Device ID: [_____________]  │
│ Purchase Date: [2024-01-15]     │
│                                  │
│ Validation Error:                │
│ ❌ Registration AB-1234 already  │
│    exists. Use unique number.    │
│                                  │
│ [Cancel]  [Save]               │
└──────────────────────────────────┘
```

### Route Editor Page

```
┌──────────────────────────────────────────────────────────┐
│ Route: Route 1 (Edit)                       [Save] [Cancel]│
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Name: [Route 1____________]  Start: [08:00]  End: [09:00]
│  Description: [__________________________]                │
│                                                            │
│  Vehicle: [Select Vehicle ▼]   Driver: [Select Driver ▼]  │
│  [Optimize Route] [Assign Students]                       │
│                                                            │
├──────────────────────────────────────────────────────────┤
│                          │                                │
│  LEFT PANEL:             │   RIGHT PANEL:                 │
│  LEAFLET MAP             │   STOPS LIST                   │
│  ┌────────────────────┐  │  ┌────────────────────┐       │
│  │                    │  │  │ 1 School (START)   │       │
│  │  ① School          │  │  │    Wait: 5 min     │       │
│  │   ②  Park A       │  │  │ = = = = = = = = = │       │
│  │   ③  Market       │  │  │ 2 Park A           │       │
│  │   ④  Station      │  │  │    Wait: 3 min     │       │
│  │   ⑤  Home (END)   │  │  │ = = = = = = = = = │       │
│  │                    │  │  │ 3 Market           │       │
│  │ Route (polyline)   │  │  │    Wait: 2 min     │       │
│  │ Stops (markers)    │  │  │ = = = = = = = = = │       │
│  │                    │  │  │ 4 Station          │       │
│  │ [Zoom to Route]    │  │  │    Wait: 5 min     │       │
│  │                    │  │  │ = = = = = = = = = │       │
│  │ Click marker to    │  │  │ 5 Home (END)       │       │
│  │ edit stop          │  │  │    [+ Add Stop]    │       │
│  │                    │  │  │ [✎ Edit] [🗑 Delete]      │
│  └────────────────────┘  │  └────────────────────┘       │
│                          │                                │
│  Legend:                 │  Distance: 15.5 km             │
│  ③ Route sequence        │  Optimization: -2.8 km (15%)   │
│                          │                                │
└──────────────────────────────────────────────────────────┘
```

### Emergency Console Page

```
┌──────────────────────────────────────────────────────────┐
│ Emergency Console                                         │
├──────────────────────────────────────────────────────────┤
│                                                            │
│ 🚨 ACTIVE EMERGENCY ────────────────────────────────────│
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Vehicle: AB-1234 (Bus)                              │  │
│ │ Route: Route 1                                       │  │
│ │ Driver: John Smith                                   │  │
│ │ Alert Time: 14:32:15                                 │  │
│ │ Location: 40.7128, -74.0060                         │  │
│ │ Status: ACTIVE                                       │  │
│ │                                                      │  │
│ │ Students On-board: 15                               │  │
│ │                                                      │  │
│ │ [Acknowledge] [Call 911] [Cancel Emergency]          │  │
│ │                                                      │  │
│ │ Map: [Vehicle location centered]                    │  │
│ │                                                      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ Historical Alerts:                                         │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Time   │ Vehicle │ Route     │ Status       │ Actions │  │
│ ├────────┼─────────┼───────────┼──────────────┼─────────┤  │
│ │ 14:32  │ AB-1234 │ Route 1   │ ACTIVE   🔴  │ View    │  │
│ │ 12:15  │ AB-5678 │ Route 2   │ ACKNOWLEDGED │ View    │  │
│ │ 09:45  │ AB-9012 │ Route 3   │ RESOLVED   ✓ │ View    │  │
│ │ 08:20  │ AB-3456 │ Route 4   │ CANCELLED    │ View    │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Driver Mobile App

### App Navigation Structure

```
BottomTabNavigator:
┌─────────────────────┐
│ Home │ Trip │ History │ Profile │
└─────────────────────┘
```

### Home Screen

```
╔════════════════════════════════╗
║ Transportation                  ║ (Header)
║ 👤 Driver Name                 ║
╠════════════════════════════════╣
║                                ║
║ Status: 🟢 ONLINE              ║
║ GPS: ON                        ║
║ Battery: 85%                   ║
║                                ║
║ ┌──────────────────────────────┐║
║ │ TODAY'S ROUTE                │║
║ │ Route 1                      │║
║ │ 08:00 AM - 09:00 AM          │║
║ │ School → Home (15 stops)     │║
║ │ [START TRIP] (Blue button)   │║
║ └──────────────────────────────┘║
║                                ║
║ ┌──────────────────────────────┐║
║ │ Route 2                      │║
║ │ 03:00 PM - 04:15 PM          │║
║ │ Home → School (12 stops)     │║
║ │ [START TRIP]                 │║
║ └──────────────────────────────┘║
║                                ║
║ ⚠️ Note: No route scheduled    ║
║ for tomorrow. Check tomorrow.  ║
║                                ║
╚════════════════════════════════╝
```

### Active Trip Screen

```
╔════════════════════════════════╗
║ Route 1 | 08:15 - 09:00        ║ (Header)
║ School to Home                 ║
╠════════════════════════════════╣
║ GPS: 🟢 ON   |   Students: 15/25║
║                                ║
║ ┌──────────────────────────────┐║
║ │    REAL-TIME MAP             │║
║ │  (Leaflet Map View 40% height)
║ │  🔵 Current Location         │║
║ │  ▬▬ Route                    │║
║ │  ● Next Stop                 │║
║ │                              │║
║ │  [Center on Vehicle]         │║
║ └──────────────────────────────┘║
║                                ║
║ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ║
║                                ║
║ BOARDED (15):                  ║
║ ┌──────────────────────────────┐║
║ │ ✓ John Doe          📷       │║
║ │ ✓ Sarah Smith       📷       │║
║ │ ✓ Alex Kumar        📷       │║
║ └──────────────────────────────┘║
║                                ║
║ PENDING (10):                  ║
║ ┌──────────────────────────────┐║
║ │ ⭕ Priya Sharma  [Board] [X]  │║
║ │ ⭕ Raj Patel     [Board] [X]  │║
║ │ ⭕ Maya Singh    [Board] [X]  │║
║ │ ⭕ [+7 more]                 │║
║ └──────────────────────────────┘║
║                                ║
║ ALIGHTED (0):                  ║
║ ┌──────────────────────────────┐║
║ │ (None yet)                   │║
║ └──────────────────────────────┘║
║                                ║
║ Buttons:                       ║
║ [Complete Trip] [Emergency] 🚨 ║
╚════════════════════════════════╝
```

### Student Boarding Modal

```
╔════════════════════════════════╗
║ BOARD STUDENT                   ║
╠════════════════════════════════╣
║                                ║
║ 📷 [Priya Sharma]              ║
║                                ║
║ Expected Stop:                 ║
║ Park A (8:25 AM)               ║
║                                ║
║ Current Location:              ║
║ Within geofence ✓              ║
║                                ║
║ ┌──────────────────────────────┐║
║ │ [📷 Take Photo] (Optional)   │║
║ └──────────────────────────────┘║
║                                ║
║ [Cancel] [BOARD] (Green)       ║
╚════════════════════════════════╝
```

---

## Parent Mobile App

### Home Screen - Active Trip

```
╔════════════════════════════════╗
║ Route 1                         ║ (Header)
║ School to Home                 ║
╠════════════════════════════════╣
║                                ║
║ ARRIVING IN 12 MINUTES         ║
║                                ║
║ 📍 4.5 km away                 ║
║ 🚌 School Gate (Next Stop)     ║
║                                ║
║ ┌──────────────────────────────┐║
║ │    LIVE MAP VIEW             │║
║ │  (React Native Maps)         │║
║ │  🟦 Your Location            │║
║ │  🚌 Bus Location             │║
║ │  ● Pickup Stop (Your place)  │║
║ │  ● Other Stops               │║
║ │  ▬▬ Route                    │║
║ │                              │║
║ │ [Pan/Zoom Controls]          │║
║ └──────────────────────────────┘║
║                                ║
║ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ║
║                                ║
║ Trip Details:                  ║
║ ┌──────────────────────────────┐║
║ │ Driver: John Smith           │║
║ │ Vehicle: AB-1234 (45 seater) │║
║ │ Expected Arrival: 2:42 PM    │║
║ │ Last Update: Just now        │║
║ └──────────────────────────────┘║
║                                ║
║ Status: John is on the bus ✓   ║
║ Notification: Boarded at 2:25pm║
║                                ║
╚════════════════════════════════╝
```

### Trip History Screen

```
╔════════════════════════════════╗
║ Trip History                    ║
║ [Filter ▼] [Search: ____]      ║
╠════════════════════════════════╣
║                                ║
║ ┌──────────────────────────────┐║
║ │ Today, Jan 15                │║
║ │ Route 1                      │║
║ │ ⏰ 08:15 AM - 08:45 AM       │║
║ │ ✅ COMPLETED                 │║
║ │ [View Details]               │║
║ └──────────────────────────────┘║
║                                ║
║ ┌──────────────────────────────┐║
║ │ Monday, Jan 14               │║
║ │ Route 1                      │║
║ │ ⏰ 08:12 AM - 08:48 AM       │║
║ │ ✅ COMPLETED                 │║
║ │ [View Details]               │║
║ └──────────────────────────────┘║
║                                ║
║ ┌──────────────────────────────┐║
║ │ Friday, Jan 11               │║
║ │ Route 1                      │║
║ │ ⏰ 08:10 AM - 08:50 AM       │║
║ │ ✅ COMPLETED                 │║
║ │ [View Details]               │║
║ └──────────────────────────────┘║
║                                ║
║ [Load More...]                 ║
╚════════════════════════════════╝
```

### Settings Screen

```
╔════════════════════════════════╗
║ Settings                        ║
╠════════════════════════════════╣
║                                ║
║ NOTIFICATIONS                  ║
║ ┌──────────────────────────────┐║
║ │ Bus Departure        🟢 ON   │║
║ │ Child Boarded        🟢 ON   │║
║ │ Arriving Soon        🟢 ON   │║
║ │ Emergency Alert      🟢 ON   │║
║ │ SMS Notifications    ⚪ OFF  │║
║ └──────────────────────────────┘║
║                                ║
║ QUIET HOURS                    ║
║ ┌──────────────────────────────┐║
║ │ Enable: [Toggle ⚪→🔵]       │║
║ │ From: [10:00 PM]             │║
║ │ To:   [06:00 AM]             │║
║ └──────────────────────────────┘║
║                                ║
║ PRIVACY                        ║
║ ┌──────────────────────────────┐║
║ │ Location Tracking   🟢 ON    │║
║ │ Share with School   🟢 ON    │║
║ │ Data Export         [Get]    │║
║ └──────────────────────────────┘║
║                                ║
║ ACCOUNT                        ║
║ ┌──────────────────────────────┐║
║ │ Priya Sharma                 │║
║ │ priya@example.com            │║
║ │ [Edit Profile]               │║
║ │ [Change Password]            │║
║ │ [Logout]                     │║
║ └──────────────────────────────┘║
║                                ║
║ ABOUT                          ║
║ ┌──────────────────────────────┐║
║ │ App Version: 1.0.0           │║
║ │ [Check for Updates]          │║
║ │ [Terms of Service]           │║
║ │ [Privacy Policy]             │║
║ └──────────────────────────────┘║
║                                ║
╚════════════════════════════════╝
```

---

## Component Library

### Button Variants

**Primary Button (Blue)**
```
┌────────────────────┐
│    BOARD STUDENT   │ (Full width, 48px height, white text)
└────────────────────┘
```

**Secondary Button (Outlined)**
```
┌────────────────────┐
│  ▢ CANCEL          │ (Light background, 36px height)
└────────────────────┘
```

**Danger Button (Red)**
```
┌────────────────────┐
│   🚨 EMERGENCY     │ (Red background, white text)
└────────────────────┘
```

**Icon Button**
```
┌──┐
│ 📷 │ (Camera, circular, 44px size)
└──┘
```

### Input Fields

**Text Input**
```
Label: [Registration Number         ]
       ├─ Hint: "e.g., AB-1234"
       └─ Helper: "Must be unique"
```

**Select Dropdown**
```
Vehicle Type:  ┌─ BUS ────────────────┐
               │ VAN                  │
               │ CAR                  │
               │ AUTO                 │
               │ TEMPO                │
               └──────────────────────┘
```

**Date/Time Picker**
```
Start Time: [08:00 ▼] (Tap to open time picker)
```

**Toggle Switch**
```
GPS Tracking:  ⚪→🔵 (OFF/ON)
```

### Status Badges

```
ACTIVE      → Green background, white text
PENDING     → Gray background, dark text
DELAYED     → Orange background, dark text
ABSENT      → Red background, white text
BOARDED     → Green, checkmark ✓
ALIGHTED    → Blue, checkmark ✓
COMPLETED   → Green, checkmark ✓
CANCELLED   → Gray with strikethrough
```

### Card Component

```
┌─────────────────────────────────┐
│ Card Title                   [✎] │ (Header with optional edit)
├─────────────────────────────────┤
│ Key: Value                      │
│ Key: Value                      │
│ Key: Value                      │
├─────────────────────────────────┤
│ [Action Button 1]  [Action 2]   │ (Footer with actions)
└─────────────────────────────────┘
```

### List Item Component

```
┌─────────────────────────────────────┐
│ Avatar   Name           Status [>] │ (Tap to expand)
│           Subtitle or status detail  │
└─────────────────────────────────────┘
```

### Modal/Dialog

```
┌─────────────────────────────────┐
│ Modal Title              [✕]    │
├─────────────────────────────────┤
│                                 │
│ Modal content here              │
│                                 │
├─────────────────────────────────┤
│ [Cancel]          [Confirm]     │ (Action buttons)
└─────────────────────────────────┘
```

### Toast/Notification

```
Inline at bottom:  "✓ Student boarded successfully"

Duration: 3-4 seconds auto-dismiss
Color: Green for success, Red for error
```

### Alert Banner

```
Top of page:

🔔 "Bus is running 10 minutes late"  [Dismiss ✕]

Color: Orange for warning, Red for error
```

---

## Responsive Design

### Breakpoints

- **Mobile:** 320px - 640px (Phone)
- **Tablet:** 641px - 1024px (iPad)
- **Desktop:** 1025px+ (Web)

### Desktop Layout (Admin Dashboard)

```
SIDEBAR (Fixed, 240px):
- Navigation menu
- Collapsible to hamburger on <1280px
- Sticky header with school selector

MAIN CONTENT (Flexible):
- Full width minus sidebar
- Grid layouts for cards
- Charts take full width
```

### Tablet Layout

```
SIDEBAR (Collapsible):
- Hamburger menu icon
- Drawer slides from left on open
- Back to top when opening drawer

MAIN CONTENT:
- Single column for card stack
- Charts smaller
- Tables scrollable horizontally if needed
```

### Mobile Layout

```
FULL SCREEN:
- No sidebar (hamburger only)
- Content stacks vertically
- Full width usage
- Bottom navigation for primary actions
```

### Map Responsiveness

```
Desktop: Side-by-side (50% left, 50% right)
Tablet: Stacked (70% map, 30% info)
Mobile: Full-screen map with sheet below (swipe to expand)
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: 4.5:1 minimum
- UI components: 3:1 minimum
- Example: Dark text (#374151) on white (#ffffff) = 10.2:1 ✓

**Keyboard Navigation:**
- Tab order logical (left to right, top to bottom)
- All buttons and links focusable
- Escape to close modals
- Enter/Space to activate buttons

**Screen Readers:**
- All buttons have descriptive labels
- Form inputs have associated labels
- Images have alt text (icons use aria-label)
- Example: `<button aria-label="Start trip">Start</button>`
- Announce dynamic updates (e.g., "Student boarded")

**Text Sizing:**
- Minimum font size: 14px for body text
- Support 200% zoom without content loss
- Responsive text scaling on mobile

**Focus Indicators:**
- Visible focus ring (2px outline, 2px offset)
- High contrast focus state
- Color not sole indicator of state

**Motion & Animation:**
- Respect prefers-reduced-motion
- Animations < 3 seconds
- No auto-playing video/audio
- Test with VoiceOver (iOS) and TalkBack (Android)

**Error Messages:**
- Clear, specific error descriptions
- Prevent loss of data on error
- Inline validation feedback
- Example: "Registration AB-1234 already exists. Use unique number."

**Mobile Accessibility:**
- Touch targets: Minimum 44x44px
- Spacing between targets: At least 8px
- Works with one hand
- Supports dynamic text sizing (iOS) and font scaling (Android)

---

## Design Tokens & Theming

### Light Theme (Default)

```
Primary:      #2563eb (Blue)
Success:      #10b981 (Green)
Warning:      #f59e0b (Orange)
Danger:       #ef4444 (Red)
Background:   #ffffff (White)
Surface:      #f3f4f6 (Light Gray)
Text Primary: #1f2937 (Dark)
Text Secondary: #6b7280 (Medium Gray)
Border:       #e5e7eb (Light Gray)
```

### Dark Theme (Future)

```
Primary:      #60a5fa (Light Blue)
Success:      #34d399 (Light Green)
Warning:      #fbbf24 (Light Orange)
Danger:       #f87171 (Light Red)
Background:   #1f2937 (Dark Gray)
Surface:      #111827 (Very Dark)
Text Primary: #f3f4f6 (Light)
Text Secondary: #d1d5db (Light Gray)
Border:       #374151 (Medium Gray)
```

### Theme Implementation

```javascript
// Token usage in component
const Button = ({ variant = 'primary' }) => {
  const colors = {
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-600 text-white'
  }
  return <button className={colors[variant]}>Action</button>
}
```

---

## Micro-interactions

### Real-time Location Update

```
Vehicle marker on map twitches and updates position
- Duration: 300ms transition
- Only animate if already visible
- Smooth curve motion to new location
```

### Student Status Change

```
1. Student name tapped → Boarding modal opens (200ms slide-up)
2. Board button tapped → Modal closes, student list updates
3. Student moves to BOARDED section with animation (300ms)
4. Color changes from gray (PENDING) to green (BOARDED)
5. Success toast appears at bottom (auto-dismiss 3s)
6. WebSocket event triggers parent notification
```

### Emergency Alert

```
1. Alert received → Red banner slides down from top (200ms)
2. Sound plays (configurable)
3. Pulse animation on banner (repeat 3x)
4. Tap banner → Emergency console modal opens
5. Admin clicks Acknowledge → Banner becomes yellow
6. Success feedback (haptic + tone)
```

### Network Status Indicator

```
Online:  🟢 Green dot (no animation)
Offline: 🔴 Red dot (pulse animation every 2s)
Reconnecting: 🟡 Orange dot (rotate animation)
```

---

## Design Handoff to Development

### Frontend Framework Recommendations

**Web Admin Dashboard:**
- Framework: Next.js 14 + React
- State Management: React Query (server) + Zustand (client)
- Map Library: Leaflet.js with react-leaflet
- UI Components: Shadcn/ui (Tailwind-based)
- Forms: React Hook Form + Zod validation
- Charts: Recharts or Chart.js

**Mobile Apps:**
- Framework: React Native with Expo
- Navigation: React Navigation
- State Management: Redux or MobX (or Zustand)
- Maps: react-native-maps
- UI Components: React Native Paper
- Forms: React Hook Form or Formik
- Charts: react-native-chart-kit

### Component Specification Template

```
Component Name: VehicleMarker

Props:
- vehicleId (string): Unique vehicle ID
- position ({lat, lng}): Current GPS coordinates
- status (enum): ACTIVE | DELAYED | COMPLETED
- onMarkerClick (function): Callback on tap
- onCenter (function): Center map on vehicle

Behavior:
- Shows bus icon with registration number label
- Color changes based on status
- Click shows popup with vehicle details
- Updates position in real-time via WebSocket

Responsive:
- Mobile: Smaller icon (24x24px)
- Desktop: Larger icon (32x32px)

Accessibility:
- aria-label="Bus AB-1234, Route 1, 2.5 km away"
- Keyboard accessible (Tab + Enter)

Animation:
- Smooth 300ms transition to new position
- Pulse on emergency
```

---

## Design QA Checklist

- [ ] All colors meet WCAG AA contrast requirements
- [ ] Touch targets are 44x44px minimum (mobile)
- [ ] Loading states shown for all async actions
- [ ] Error messages clear and actionable
- [ ] Empty states designed and handled
- [ ] Focus indicators visible on all interactive elements
- [ ] Icons have fallback text/labels
- [ ] Responsive design tested at all breakpoints
- [ ] Modal dialogs have proper z-index
- [ ] Navigation back button works consistently
- [ ] Animations respect prefers-reduced-motion
- [ ] All data fetches show skeleton loader or spinner
- [ ] Offline state handled gracefully
- [ ] Network error messages show retry option
- [ ] Buttons have loading state (spinner + disabled)
- [ ] Forms clear after successful submission
- [ ] Modals close on Escape key
- [ ] Timestamp shows relative time (e.g., "2 minutes ago")
- [ ] Real-time updates don't break scroll position
- [ ] Maps render without jumping/flashing

---

**Design Status:** Ready for Development

**Next Steps:** Developers implement components in codebase following this design system
