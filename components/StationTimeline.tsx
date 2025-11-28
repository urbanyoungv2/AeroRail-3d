import React, { useRef, useEffect } from 'react';
import { Station } from '../types';
import { motion } from 'framer-motion';

interface StationTimelineProps {
  stations: Station[];
  progress: number;
}

const StationTimeline: React.FC<StationTimelineProps> = ({ stations, progress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to current active station
  useEffect(() => {
    if (containerRef.current) {
        // Calculate which station we are at
        const total = stations.length - 1;
        const index = Math.floor(progress * total);
        const element = document.getElementById(`timeline-station-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [progress, stations]);

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar" ref={containerRef}>
      <div className="flex items-center gap-8 px-8 min-w-max">
        {stations.map((station, index) => {
            const isPassed = progress >= (index / (stations.length - 1));
            const isNext = !isPassed && progress >= ((index - 1) / (stations.length - 1));
            
            return (
                <div key={station.id} id={`timeline-station-${index}`} className={`relative group flex flex-col items-center gap-3 transition-all duration-500 ${isPassed ? 'opacity-100' : 'opacity-50'}`}>
                    {/* Connecting Line */}
                    {index < stations.length - 1 && (
                        <div className="absolute top-[9px] left-[50%] w-[calc(100%+2rem)] h-[2px] bg-slate-800 -z-10">
                             <div 
                                className="h-full bg-orange-500 transition-all duration-300" 
                                style={{ width: isPassed ? '100%' : '0%' }}
                             />
                        </div>
                    )}
                    
                    {/* Node */}
                    <motion.div 
                        initial={false}
                        animate={{ 
                            scale: isNext ? 1.2 : 1,
                            borderColor: isPassed ? '#f97316' : '#334155', // orange-500
                            backgroundColor: isPassed ? '#0f172a' : '#1e293b'
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 shadow-lg ${isPassed ? 'shadow-orange-500/50' : ''}`}
                    >
                        {isPassed && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                    </motion.div>

                    {/* Content */}
                    <div className="flex flex-col items-center min-w-[120px] text-center">
                        <span className={`text-sm font-display font-bold uppercase ${isPassed ? 'text-white' : 'text-slate-500'}`}>
                            {station.code}
                        </span>
                        <span className="text-[10px] font-mono text-orange-500/70">{station.arrivalTime}</span>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default StationTimeline;