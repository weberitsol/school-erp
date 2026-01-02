/**
 * ETA Utility - Calculate estimated arrival times and distances
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ETAResult {
  distance: number; // kilometers
  eta: number; // minutes
  arrivalTime: Date; // estimated arrival time
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate ETA to destination
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param destLat Destination latitude
 * @param destLon Destination longitude
 * @param averageSpeed Average speed in km/h (default: 40)
 * @returns ETAResult with distance, ETA in minutes, and arrival time
 */
export function calculateETA(
  currentLat: number,
  currentLon: number,
  destLat: number,
  destLon: number,
  averageSpeed: number = 40
): ETAResult {
  const distance = calculateHaversineDistance(currentLat, currentLon, destLat, destLon);

  // Calculate ETA in minutes
  // time = distance / speed * 60 (convert hours to minutes)
  const eta = (distance / averageSpeed) * 60;

  // Calculate arrival time
  const arrivalTime = new Date();
  arrivalTime.setMinutes(arrivalTime.getMinutes() + Math.round(eta));

  return {
    distance,
    eta: Math.round(eta),
    arrivalTime,
  };
}

/**
 * Format ETA for display
 * Returns string like "15 mins" or "1 hr 30 mins"
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) {
    return 'Arriving now';
  }

  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
}

/**
 * Format arrival time for display
 * Returns string like "2:30 PM"
 */
export function formatArrivalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    meridiem: 'short',
  });
}

/**
 * Format distance for display
 * Returns string like "2.5 km" or "500 m"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km.toFixed(1)} km`;
}

/**
 * Check if bus is approaching a stop (within specified radius)
 * @param currentLat Current latitude
 * @param currentLon Current longitude
 * @param stopLat Stop latitude
 * @param stopLon Stop longitude
 * @param radiusKm Approach radius in kilometers (default: 2)
 */
export function isApproachingStop(
  currentLat: number,
  currentLon: number,
  stopLat: number,
  stopLon: number,
  radiusKm: number = 2
): boolean {
  const distance = calculateHaversineDistance(currentLat, currentLon, stopLat, stopLon);
  return distance <= radiusKm;
}

/**
 * Calculate average speed from multiple location updates
 * Useful for adjusting ETA based on actual traffic conditions
 */
export function calculateAverageSpeed(
  previousLocation: Location & { timestamp: Date },
  currentLocation: Location & { timestamp: Date }
): number {
  const distance = calculateHaversineDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  const timeDiff = (currentLocation.timestamp.getTime() - previousLocation.timestamp.getTime()) / 1000 / 3600; // hours

  if (timeDiff === 0) {
    return 0;
  }

  return Math.abs(distance / timeDiff);
}

/**
 * Get bearing/heading from one point to another
 * Returns bearing in degrees (0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = lon2 - lon1;
  const y = Math.sin(toRad(dLon)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(dLon));

  const bearing = Math.atan2(y, x);
  const bearingDegrees = (toDeg(bearing) + 360) % 360;

  return bearingDegrees;
}

/**
 * Convert radians to degrees
 */
function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
