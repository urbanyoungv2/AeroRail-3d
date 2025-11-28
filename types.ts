export interface Station {
  id: string;
  code: string; // e.g., NDLS, BCT
  name: string;
  lat: number;
  lng: number;
  description: string;
  arrivalTime: string; // e.g., "14:30"
  haltTime: string; // e.g., "5m"
  platform: string;
  distanceFromStart: number; // in km
  services: string[];
  operatingHours: string;
  pointsOfInterest: string[];
}

export interface TripSummary {
  trainName: string; // e.g., "Mumbai Rajdhani Express"
  trainNumber: string; // e.g., "12951"
  origin: string;
  destination: string;
  totalDistanceKm: number;
  estimatedDuration: string;
  stations: Station[];
}

export interface TripState {
  data: TripSummary | null;
  loading: boolean;
  error: string | null;
  progress: number; // 0 to 1 (completion percentage)
  isPlaying: boolean;
  currentSpeed: number; // km/h
  currentDelay: number; // minutes
}

export enum ViewMode {
  ORBIT = 'ORBIT',
  COCKPIT = 'COCKPIT',
  MAP = 'MAP'
}