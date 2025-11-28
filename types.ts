export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  arrivalTime: string;
  distanceFromStart: number; // in km
}

export interface TripSummary {
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
}

export enum ViewMode {
  ORBIT = 'ORBIT',
  COCKPIT = 'COCKPIT',
  MAP = 'MAP'
}
