import React from 'react';
import { TripSummary } from '../types';
import { Activity, Clock, MapPin, Navigation, Train, AlertTriangle } from 'lucide-react';

interface TripStatsProps {
  trip: TripSummary | null;
  progress: number;
  currentSpeed: number;
  currentDelay: number;
}

const TripStats: React.FC<TripStatsProps> = ({ trip, progress, currentSpeed, currentDelay }) => {
  if (!trip) return null;

  const traveledDistance = (trip.totalDistanceKm * progress).toFixed(1);
  const remainingDistance = (trip.totalDistanceKm * (1 - progress)).toFixed(1);
  const percent = Math.round(progress * 100);

  return (
    <div className="glass-panel p-6 rounded-2xl w-full max-w-sm transform transition-all duration-500 hover:scale-105 border-orange-500/20">
      <div className="flex items-center justify-between mb-4 border-b border-orange-500/30 pb-2">
        <h2 className="text-xl font-display font-bold text-orange-500 uppercase tracking-widest">Live Status</h2>
        <span className="text-xs text-orange-300 animate-pulse bg-orange-900/30 px-2 py-0.5 rounded border border-orange-500/30">GPS ACTIVE</span>
      </div>

      {/* Train Info Header */}
      <div className="mb-4 bg-slate-800/50 p-2 rounded border border-slate-700 flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded text-white">
              <Train size={20} />
          </div>
          <div>
              <div className="text-xs text-slate-400 font-bold">TRAIN NUMBER</div>
              <div className="text-lg font-mono text-white leading-none">{trip.trainNumber}</div>
          </div>
          <div className="flex-1 text-right">
             <div className="text-xs text-slate-400 font-bold">NAME</div>
             <div className="text-xs font-mono text-orange-300 truncate max-w-[100px] ml-auto">{trip.trainName}</div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Telemetry */}
        <div className="flex flex-col gap-1 p-2 bg-slate-800/30 rounded">
          <div className="text-orange-500 text-xs uppercase flex items-center gap-1">
            <Activity size={12} /> Current Speed
          </div>
          <div className="text-2xl font-mono text-white">{currentSpeed} <span className="text-sm text-gray-500">km/h</span></div>
        </div>
        
        <div className="flex flex-col gap-1 p-2 bg-slate-800/30 rounded">
            <div className="text-orange-500 text-xs uppercase flex items-center gap-1">
              <AlertTriangle size={12} /> Delay
            </div>
            <div className={`text-2xl font-mono ${currentDelay > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {currentDelay} <span className="text-sm text-gray-500">min</span>
            </div>
        </div>

        <div className="flex flex-col gap-1">
            <div className="text-slate-500 text-xs uppercase flex items-center gap-1">
              <Navigation size={12} /> Traveled
            </div>
            <div className="text-lg font-mono text-white">{traveledDistance} <span className="text-xs">km</span></div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-slate-500 text-xs uppercase flex items-center gap-1">
            <MapPin size={12} /> Remaining
          </div>
          <div className="text-lg font-mono text-white">{remainingDistance} <span className="text-xs">km</span></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-orange-400 mb-1">
            <span>Route Completion</span>
            <span>{percent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
                className="h-full bg-gradient-to-r from-orange-600 to-yellow-400 shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
            />
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded border border-slate-800">
        <span>UPDATED: {new Date().toLocaleTimeString()}</span>
        <span className="text-emerald-500 font-bold">SIGNAL: STRONG</span>
      </div>
    </div>
  );
};

export default TripStats;