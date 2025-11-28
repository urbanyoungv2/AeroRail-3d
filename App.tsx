import React, { useState, useEffect } from 'react';
import { searchTrains } from './services/geminiService';
import { TripSummary, TripState, Station } from './types';
import HolographicMap from './components/HolographicMap';
import TripStats from './components/TripStats';
import StationTimeline from './components/StationTimeline';
import StationDetailPanel from './components/StationDetailPanel';
import { Search, Train, Play, RefreshCw, Zap, ArrowRight, XCircle, Radio } from 'lucide-react';

const App: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'ROUTE' | 'NUMBER'>('ROUTE');
  const [inputA, setInputA] = useState(''); // Origin or Train No
  const [inputB, setInputB] = useState(''); // Destination (only for route)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  
  const [tripState, setTripState] = useState<TripState>({
    data: null,
    loading: false,
    error: null,
    progress: 0,
    isPlaying: false,
    currentSpeed: 0,
    currentDelay: 0
  });

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const query = searchMode === 'ROUTE' ? `${inputA} to ${inputB}` : inputA;
    if (!query) return;

    setTripState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null, 
        data: null, 
        progress: 0, 
        isPlaying: false,
        currentSpeed: 0,
        currentDelay: 0
    }));
    setSelectedStation(null);
    
    try {
      const data = await searchTrains(query, searchMode);
      setTripState(prev => ({
        ...prev,
        loading: false,
        data: data,
        isPlaying: false
      }));
    } catch (err: any) {
      setTripState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const startJourney = () => {
    setTripState(prev => ({ ...prev, isPlaying: true }));
    setSelectedStation(null);
  };

  // Live Tracking Simulation Loop
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      setTripState(prev => {
        if (!prev.isPlaying || !prev.data) return prev;
        
        // Simulation Speed: 15 seconds for full trip
        const duration = 15000; 
        const step = delta / duration;
        const newProgress = prev.progress + step;
        
        if (newProgress >= 1) {
          return { ...prev, progress: 1, isPlaying: false, currentSpeed: 0 };
        }
        
        // Simulate Speed fluctuations based on progress (slow at stations)
        // Simple logic: If progress is near a station stop (every 1/totalStations), slow down
        const totalStations = prev.data.stations.length;
        const stationInterval = 1 / (totalStations - 1);
        const distToStation = newProgress % stationInterval;
        const isNearStation = distToStation < 0.02 || distToStation > (stationInterval - 0.02);
        
        // Target speed: 130km/h max, 20km/h near station
        const targetSpeed = isNearStation ? 30 : 130;
        const speedNoise = Math.random() * 5;
        
        // Simulate minor delay accumulation
        const addedDelay = Math.random() > 0.98 ? 1 : 0;

        return { 
            ...prev, 
            progress: newProgress,
            currentSpeed: Math.floor(targetSpeed + speedNoise),
            currentDelay: Math.min(prev.currentDelay + addedDelay, 45) // Cap simulated delay
        };
      });
      animationFrame = requestAnimationFrame(animate);
    };

    if (tripState.isPlaying) {
      lastTime = Date.now();
      animationFrame = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [tripState.isPlaying]);

  const reset = () => {
      setTripState(prev => ({ ...prev, progress: 0, isPlaying: false, currentSpeed: 0, currentDelay: 0 }));
      setSelectedStation(null);
  };

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-orange-500/30">
      
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 holo-grid pointer-events-none opacity-20 z-0"></div>
      
      {/* 3D Map Layer */}
      <div className="absolute inset-0 z-0">
        <HolographicMap 
            trip={tripState.data} 
            progress={tripState.progress} 
            onStationSelect={setSelectedStation}
        />
      </div>

      {/* Main Layout Layer */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* Header */}
        <header className="w-full p-6 flex justify-between items-start pointer-events-auto z-50">
             <div className="flex flex-col backdrop-blur-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-2xl">
                <h1 className="text-4xl font-display font-bold text-white tracking-tighter neon-text flex items-center gap-3">
                    <Train className="text-orange-500" size={36} />
                    INDIAN RAIL <span className="text-orange-500 text-lg border border-orange-500 px-2 rounded font-mono">LIVE</span>
                </h1>
                <p className="text-orange-200/60 text-sm font-mono mt-1 tracking-widest pl-1">REAL-TIME TRAIN TRACKING SYSTEM</p>
             </div>
             
             {/* Planner Form */}
             <div className="flex flex-col items-end gap-3">
                 <div className="glass-panel p-1 rounded-full flex gap-1 bg-slate-900/80">
                    <button 
                        onClick={() => setSearchMode('ROUTE')}
                        className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${searchMode === 'ROUTE' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        BY STATIONS
                    </button>
                    <button 
                        onClick={() => setSearchMode('NUMBER')}
                        className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${searchMode === 'NUMBER' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        BY TRAIN NO.
                    </button>
                 </div>

                 <form onSubmit={handlePlanTrip} className="glass-panel p-3 rounded-xl flex gap-2 items-center shadow-2xl bg-slate-900/90 border-orange-500/20">
                    {searchMode === 'ROUTE' ? (
                        <>
                            <input 
                                type="text" 
                                placeholder="From Station" 
                                className="bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono w-32 transition-all focus:w-48"
                                value={inputA}
                                onChange={e => setInputA(e.target.value)}
                            />
                            <span className="text-slate-500"><ArrowRight size={16}/></span>
                            <input 
                                type="text" 
                                placeholder="To Station" 
                                className="bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono w-32 transition-all focus:w-48"
                                value={inputB}
                                onChange={e => setInputB(e.target.value)}
                            />
                        </>
                    ) : (
                        <input 
                            type="text" 
                            placeholder="Ex: 12951 or Rajdhani" 
                            className="bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono w-64"
                            value={inputA}
                            onChange={e => setInputA(e.target.value)}
                        />
                    )}
                    
                    <button 
                        disabled={tripState.loading}
                        className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                    >
                        {tripState.loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    </button>
                 </form>

                 {/* Start Journey CTA */}
                 {tripState.data && !tripState.isPlaying && tripState.progress === 0 && (
                     <button 
                        onClick={startJourney}
                        className="glass-panel px-6 py-2 rounded-lg text-emerald-400 font-bold tracking-widest hover:bg-emerald-500/10 hover:border-emerald-500 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-top-4"
                     >
                        <Play size={16} fill="currentColor" /> ENABLE LIVE TRACKING
                     </button>
                 )}
                 
                 {/* Reset CTA */}
                 {tripState.data && (tripState.progress > 0) && (
                     <button 
                        onClick={reset}
                        className="glass-panel px-4 py-2 rounded-lg text-slate-400 text-xs font-mono hover:text-white transition-all flex items-center gap-2"
                     >
                        <RefreshCw size={12} /> NEW SEARCH
                     </button>
                 )}
             </div>
        </header>

        {/* Middle Section: HUDs */}
        <div className="flex-1 flex justify-between items-center px-8 relative">
            
            {/* Left HUD: Trip Stats */}
            <div className="pointer-events-auto perspective-container">
                 {tripState.data && (
                    <div className="transform rotate-y-6 transition-transform duration-500 hover:rotate-y-0">
                        <TripStats 
                            trip={tripState.data} 
                            progress={tripState.progress} 
                            currentSpeed={tripState.currentSpeed}
                            currentDelay={tripState.currentDelay}
                        />
                    </div>
                 )}
            </div>
            
            {/* Center: Messages */}
            {tripState.loading && (
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
                    <div className="text-orange-500 font-display text-3xl animate-pulse tracking-widest">FETCHING RAILWAY DATA</div>
                    <div className="text-orange-800 text-sm font-mono mt-2">Accessing CRIS Servers...</div>
                 </div>
            )}
             {tripState.error && (
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center glass-panel p-8 rounded-xl pointer-events-auto border-red-500/50 bg-red-950/20">
                    <div className="flex items-center justify-center mb-4 text-red-500"><XCircle size={48} /></div>
                    <div className="text-red-400 font-display text-2xl">NETWORK ERROR</div>
                    <div className="text-red-200 text-sm font-mono mt-2">{tripState.error}</div>
                 </div>
            )}

            {/* Right: Station Detail Panel */}
            <div className="pointer-events-auto perspective-container h-full flex items-center">
                 <StationDetailPanel 
                    station={selectedStation} 
                    onClose={() => setSelectedStation(null)} 
                 />
            </div>
        </div>

        {/* Bottom Section: Timeline */}
        <div className="w-full h-auto pointer-events-auto flex flex-col justify-end pb-8 z-20">
             {tripState.data && (
                <div className="w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 bg-gradient-to-t from-slate-950 via-slate-900/90 to-transparent pt-12">
                    <div className="px-8 text-xs font-mono text-orange-500 mb-2 flex items-center gap-2">
                         <Zap size={12} />
                         <span>ROUTE VISUALIZATION // {tripState.data.trainName.toUpperCase()}</span>
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