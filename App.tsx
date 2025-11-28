import React, { useState, useEffect, useCallback } from 'react';
import { generateTrip } from './services/geminiService';
import { TripSummary, TripState } from './types';
import HolographicMap from './components/HolographicMap';
import TripStats from './components/TripStats';
import StationTimeline from './components/StationTimeline';
import { Search, Train, Play, Pause, RefreshCw, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tripState, setTripState] = useState<TripState>({
    data: null,
    loading: false,
    error: null,
    progress: 0,
    isPlaying: false
  });

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setTripState(prev => ({ ...prev, loading: true, error: null, data: null, progress: 0, isPlaying: false }));
    
    try {
      const data = await generateTrip(origin, destination);
      setTripState(prev => ({
        ...prev,
        loading: false,
        data: data,
        isPlaying: true // Auto play on load
      }));
    } catch (err: any) {
      setTripState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  // Animation Loop for progress
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      setTripState(prev => {
        if (!prev.isPlaying || !prev.data) return prev;
        
        // Speed of simulation: 1 full trip in 30 seconds
        const step = 1 / (60 * 30); 
        const newProgress = prev.progress + step;
        
        if (newProgress >= 1) {
          return { ...prev, progress: 1, isPlaying: false };
        }
        
        return { ...prev, progress: newProgress };
      });
      animationFrame = requestAnimationFrame(animate);
    };

    if (tripState.isPlaying) {
      animationFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [tripState.isPlaying, tripState.data]);

  const togglePlay = () => {
    setTripState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const reset = () => {
      setTripState(prev => ({ ...prev, progress: 0, isPlaying: true }));
  };
  
  // Current active station details for the "3D card"
  const getCurrentStation = () => {
      if (!tripState.data) return null;
      const total = tripState.data.stations.length - 1;
      const index = Math.floor(tripState.progress * total);
      // Ensure we don't go out of bounds at 100%
      const safeIndex = Math.min(index, tripState.data.stations.length - 1);
      return tripState.data.stations[safeIndex];
  };

  const currentStation = getCurrentStation();

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 holo-grid pointer-events-none opacity-20 z-0"></div>
      
      {/* 3D Map Layer */}
      <div className="absolute inset-0 z-0">
        <HolographicMap trip={tripState.data} progress={tripState.progress} />
      </div>

      {/* Main Layout Layer */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* Header */}
        <header className="w-full p-6 flex justify-between items-start pointer-events-auto">
             <div className="flex flex-col">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter neon-text flex items-center gap-3">
                    <Train className="text-cyan-400" size={36} />
                    AERORAIL <span className="text-cyan-500 text-lg border border-cyan-500 px-2 rounded font-mono">3D</span>
                </h1>
                <p className="text-cyan-200/60 text-sm font-mono mt-1 tracking-widest">NEXT GEN TRIP PLANNER</p>
             </div>
             
             {/* Planner Form */}
             <form onSubmit={handlePlanTrip} className="glass-panel p-2 rounded-xl flex gap-2 items-center">
                <input 
                    type="text" 
                    placeholder="Origin (e.g. London)" 
                    className="bg-slate-900/50 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                />
                 <span className="text-slate-500">→</span>
                 <input 
                    type="text" 
                    placeholder="Destination (e.g. Paris)" 
                    className="bg-slate-900/50 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                />
                <button 
                    disabled={tripState.loading}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50"
                >
                    {tripState.loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
             </form>
        </header>

        {/* Middle Section: HUDs */}
        <div className="flex-1 flex justify-between items-center px-8 relative">
            
            {/* Left HUD: Trip Stats */}
            <div className="pointer-events-auto perspective-container">
                 <div className="transform rotate-y-12 transition-transform duration-500">
                    <TripStats trip={tripState.data} progress={tripState.progress} />
                 </div>
            </div>
            
            {/* Center: Error/Loading Messages */}
            {tripState.loading && (
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
                    <div className="text-cyan-400 font-display text-2xl animate-pulse">CALCULATING TRAJECTORY...</div>
                    <div className="text-cyan-700 text-sm font-mono mt-2">Accessing Satellite Data</div>
                 </div>
            )}
             {tripState.error && (
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center glass-panel p-6 rounded-xl pointer-events-auto border-red-500/50">
                    <div className="text-red-400 font-display text-2xl">NAVIGATION ERROR</div>
                    <div className="text-red-200 text-sm font-mono mt-2">{tripState.error}</div>
                 </div>
            )}

            {/* Right HUD: Current Station Details (Dynamic 3D Card) */}
            <div className="pointer-events-auto perspective-container flex flex-col items-end gap-4">
                 {currentStation && (
                     <div className="glass-panel p-6 rounded-2xl w-80 transform -rotate-y-12 transition-all duration-500 hover:scale-105 hover:rotate-y-0">
                        <div className="flex items-center justify-between mb-2">
                             <div className="text-xs text-slate-400 font-mono uppercase">Current Waypoint</div>
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                        </div>
                        <h2 className="text-3xl font-display font-bold text-white mb-1">{currentStation.name}</h2>
                        <div className="text-cyan-400 font-mono text-sm mb-4 flex gap-2">
                            <span>LAT: {currentStation.lat.toFixed(2)}</span>
                            <span>LNG: {currentStation.lng.toFixed(2)}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-700 pt-3">
                            {currentStation.description}
                        </p>
                     </div>
                 )}

                 {/* Playback Controls */}
                 {tripState.data && (
                    <div className="glass-panel p-2 rounded-full flex gap-2 pointer-events-auto">
                        <button onClick={togglePlay} className="p-3 rounded-full hover:bg-slate-700 text-cyan-400 transition-colors">
                            {tripState.isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={reset} className="p-3 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
                            <RefreshCw size={20} />
                        </button>
                    </div>
                 )}
            </div>
        </div>

        {/* Bottom Section: Timeline */}
        <div className="w-full h-48 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-auto flex flex-col justify-end pb-6 z-20">
             {tripState.data && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="px-8 text-xs font-mono text-cyan-600 mb-2 flex items-center gap-2">
                         <Zap size={12} />
                         <span>TIMELINE VISUALIZATION</span>
                    </div>
                    <StationTimeline stations={tripState.data.stations} progress={tripState.progress} />
                </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default App;
