import React from 'react';
import { Station } from '../types';
import { X, Clock, Info, Coffee, MapPin, Ticket, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StationDetailPanelProps {
  station: Station | null;
  onClose: () => void;
}

const StationDetailPanel: React.FC<StationDetailPanelProps> = ({ station, onClose }) => {
  return (
    <AnimatePresence>
      {station && (
        <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-24 bottom-24 w-96 mr-6 glass-panel border-l border-orange-500/30 bg-slate-900/90 backdrop-blur-xl z-50 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700/50 flex justify-between items-start bg-slate-800/30">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-orange-400 uppercase tracking-widest">{station.code}</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white leading-tight">{station.name}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded">
                <X size={20} />
            </button>
          </div>

          {/* Content Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Platform Info - Prominent */}
            <div className="flex gap-4">
                <div className="flex-1 bg-orange-500/10 border border-orange-500/30 p-3 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs text-orange-400 uppercase font-bold mb-1">Platform</span>
                    <span className="text-2xl font-display text-white">{station.platform}</span>
                </div>
                <div className="flex-1 bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-400 uppercase font-bold mb-1">Halt</span>
                    <span className="text-xl font-mono text-white">{station.haltTime}</span>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <p className="text-slate-300 text-sm leading-relaxed font-light border-l-2 border-orange-500/50 pl-3">
                    {station.description}
                </p>
            </div>

            {/* Operating Hours */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <Clock size={16} />
                    <span className="text-sm font-bold uppercase tracking-wider">Operations</span>
                </div>
                <div className="text-white font-mono text-lg">{station.operatingHours}</div>
            </div>

            {/* Services */}
            <div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 text-xs uppercase tracking-widest font-bold">
                    <Ticket size={14} /> Available Services
                </div>
                <div className="flex flex-wrap gap-2">
                    {station.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs flex items-center gap-1 hover:border-orange-500/50 transition-colors">
                            <span className="w-1 h-1 rounded-full bg-orange-400"></span>
                            {service}
                        </span>
                    ))}
                </div>
            </div>

            {/* Points of Interest */}
            <div>
                <div className="flex items-center gap-2 text-slate-400 mb-3 text-xs uppercase tracking-widest font-bold">
                    <MapPin size={14} /> Nearby Points of Interest
                </div>
                <div className="space-y-2">
                    {station.pointsOfInterest.map((poi, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-orange-500/30 transition-colors">
                            <div className="mt-1 bg-slate-700 p-1 rounded">
                                <Info size={12} className="text-white" />
                            </div>
                            <span className="text-sm text-slate-200">{poi}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                    <div className="text-[10px] uppercase text-slate-500">Scheduled Arrival</div>
                    <div className="font-mono text-orange-400">{station.arrivalTime}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase text-slate-500">Dist. from Origin</div>
                    <div className="font-mono text-orange-400">{station.distanceFromStart} km</div>
                </div>
            </div>

          </div>
          
          {/* Footer Decoration */}
          <div className="h-2 bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600"></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StationDetailPanel;