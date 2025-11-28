import React from 'react';
import { TripSummary } from '../types';
import { Activity, Clock, MapPin, Navigation } from 'lucide-react';

interface TripStatsProps {
  trip: TripSummary | null;
  progress: number;
}

const TripStats: React.FC<TripStatsProps> = ({ trip, progress }) => {
  if (!trip) return null;

  const traveledDistance = (trip.totalDistanceKm * progress).toFixed(1);
  const remainingDistance = (trip.totalDistanceKm * (1 - progress)).toFixed(1);
  const percent = Math.round(progress * 100);

  return (
    <div className="glass-panel p-6 rounded-2xl w-full max-w-sm transform transition-all duration-500 hover:scale-105">
      <div className="flex items-center justify-between mb-4 border-b border-sky-500/30 pb-2">
        <h2 className="text-xl font-display font-bold text-sky-400 uppercase tracking-widest">Journey Status</h2>
        <span className="text-xs text-sky-300 animate-pulse">LIVE LINK ACTIVE</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-sky-500 text-xs uppercase flex items-center gap-1">
            <Navigation size={12} /> Traveled
          </div>
          <div className="text-2xl font-mono text-white">{traveledDistance} <span className="text-sm text-gray-500">km</span></div>
        </div>
        
        <div className="flex flex-col gap-1">
            <div className="text-sky-500 text-xs uppercase flex items-center gap-1">
              <MapPin size={12} /> Remaining
            </div>
            <div className="text-2xl font-mono text-white">{remainingDistance} <span className="text-sm text-gray-500">km</span></div>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <div className="text-sky-500 text-xs uppercase flex items-center gap-1">
            <Clock size={12} /> Est. Duration
          </div>
          <div className="text-lg font-mono text-white">{trip.estimatedDuration}</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs text-sky-400 mb-1">
            <span>Progress</span>
            <span>{percent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
            />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800">
        <Activity size={14} className="text-emerald-500" />
        <span>Systems Nominal. Magnetic Levitation Active.</span>
      </div>
    </div>
  );
};

export default TripStats;
