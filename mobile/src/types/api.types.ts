/**
 * API Type Definitions
 * Shared types for Transportation Module API calls
 */

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  schoolId: string;
  driver?: Driver;
}

// Driver Types
export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RESIGNED';
}

// Trip Types
export interface Trip {
  id: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  route: Route;
  vehicle: Vehicle;
  students: TripStudent[];
  boardingSummary?: BoardingSummary;
}

export interface TripStudent {
  id: string;
  name: string;
  classId: string;
  sectionId: string;
  className: string;
  sectionName: string;
  pickupStopId: string;
  dropStopId: string;
  boardingStatus: 'PENDING' | 'BOARDED' | 'ALIGHTED';
  boardingTime?: string;
  alightingTime?: string;
  boardingPhoto?: string;
  alightingPhoto?: string;
  absent: boolean;
  absenceReason?: string;
}

export interface BoardingSummary {
  totalStudents: number;
  boarded: number;
  alighted: number;
  pending: number;
  absent: number;
}

// Route Types
export interface Route {
  id: string;
  name: string;
  schoolId: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  estimatedDuration: number;
  stops: RouteStop[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface RouteStop {
  id: string;
  routeId: string;
  stopId: string;
  sequence: number;
  stop: Stop;
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  stopType: 'PICKUP' | 'DROP' | 'BOTH';
}

// Vehicle Types
export interface Vehicle {
  id: string;
  registrationNumber: string;
  schoolId: string;
  type: 'BUS' | 'VAN' | 'CAR' | 'AUTO' | 'TEMPO';
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RETIRED';
  gpsDevice?: string;
  currentLocation?: GPSLocation;
}

export interface GPSLocation {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: string;
}

// Boarding Types
export interface BoardingRequest {
  studentId: string;
  photo?: string;
}

export interface AlightingRequest {
  studentId: string;
  photo?: string;
}

export interface MarkAbsentRequest {
  studentId: string;
  reason?: string;
}

// Location Update Types
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}
