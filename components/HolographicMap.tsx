import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TripSummary, Station } from '../types';

interface HolographicMapProps {
  trip: TripSummary | null;
  progress: number; // 0 to 1
  onStationSelect: (station: Station) => void;
}

const HolographicMap: React.FC<HolographicMapProps> = ({ trip, progress, onStationSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{x: number, y: number} | null>(null);
  const clickRef = useRef<{x: number, y: number, processed: boolean} | null>(null);
  const [cursorStyle, setCursorStyle] = useState('default');

  // Handle Mouse Events
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
     if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    clickRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      processed: false
    };
  };

  // Main Render Loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Responsive Canvas
    const updateSize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.scale(dpr, dpr);
        return { width, height };
    };

    let { width, height } = updateSize();
    
    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
        const dims = updateSize();
        if (dims) { width = dims.width; height = dims.height; }
    });
    resizeObserver.observe(containerRef.current);

    let animationId: number;
    let geoDataCache: any = null;

    const renderMap = (geoJsonFeatures: any) => {
        if (!context) return;

        const projection = d3.geoOrthographic()
          .fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" })
          .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection, context);

        // Auto-rotate or Trip focus
        let center: [number, number] = [0, 0];
        let scale = Math.min(width, height) / 2;

        if (trip && trip.stations.length > 0) {
           const lons = trip.stations.map(s => s.lng);
           const lats = trip.stations.map(s => s.lat);
           const minLon = Math.min(...lons);
           const maxLon = Math.max(...lons);
           const minLat = Math.min(...lats);
           const maxLat = Math.max(...lats);
           
           center = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
           
           const span = Math.max(maxLon - minLon, maxLat - minLat);
           if (span > 0) {
               scale = (Math.min(width, height) / span) * 40; 
               scale = Math.min(scale, 4000); 
               scale = Math.max(scale, 300); 
           }
        } else {
             const t = Date.now() / 100;
             center = [t % 360, 0]; 
             scale = Math.min(width, height) / 2.5;
        }

        projection.rotate([-center[0], -center[1]]).scale(scale);

        // Clear
        context.clearRect(0, 0, width, height);
        
        // Ocean
        context.beginPath();
        path({ type: "Sphere" });
        context.fillStyle = "#020617"; // slate-950
        context.fill();
        context.strokeStyle = "#1e293b"; 
        context.lineWidth = 1;
        context.stroke();

        // Graticule
        const graticule = d3.geoGraticule10();
        context.beginPath();
        path(graticule);
        context.strokeStyle = "rgba(56, 189, 248, 0.05)"; 
        context.lineWidth = 0.5;
        context.stroke();

        // Land
        context.beginPath();
        path(geoJsonFeatures);
        context.fillStyle = "#0f172a"; // slate-900
        context.fill();
        context.strokeStyle = "#334155"; 
        context.lineWidth = 0.5;
        context.stroke();

        let isHoveringStation = false;

        // Trip Visualization
        if (trip && trip.stations.length > 1) {
            const coords = trip.stations.map(s => [s.lng, s.lat] as [number, number]);
            
            // Route Line
            context.beginPath();
            path({ type: "LineString", coordinates: coords });
            context.strokeStyle = "#0ea5e9"; 
            context.lineWidth = 2;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.setLineDash([4, 4]);
            context.stroke();
            context.setLineDash([]);

            // Stations & Hit Testing
            trip.stations.forEach((station) => {
                const centerPos = projection.invert ? projection.invert([width/2, height/2]) : [0,0];
                const dist = d3.geoDistance(centerPos, [station.lng, station.lat]);
                
                // Only draw if on visible hemisphere (roughly)
                if (dist < 1.57) { 
                    const [x, y] = projection([station.lng, station.lat]) || [-999, -999];
                    
                    // Hit Test Logic
                    let isHovered = false;
                    if (mouseRef.current) {
                        const dx = mouseRef.current.x - x;
                        const dy = mouseRef.current.y - y;
                        if (Math.sqrt(dx*dx + dy*dy) < 15) {
                            isHovered = true;
                            isHoveringStation = true;
                        }
                    }

                    // Click Logic
                    if (clickRef.current && !clickRef.current.processed) {
                         const dx = clickRef.current.x - x;
                         const dy = clickRef.current.y - y;
                         if (Math.sqrt(dx*dx + dy*dy) < 15) {
                             onStationSelect(station);
                             clickRef.current.processed = true;
                         }
                    }

                    // Draw Station
                    context.beginPath();
                    context.arc(x, y, isHovered ? 8 : 4, 0, 2 * Math.PI);
                    context.fillStyle = isHovered ? "#22d3ee" : "#e0f2fe"; 
                    context.fill();
                    
                    // Glow
                    context.beginPath();
                    context.arc(x, y, isHovered ? 12 : 8, 0, 2 * Math.PI);
                    context.fillStyle = isHovered ? "rgba(34, 211, 238, 0.4)" : "rgba(14, 165, 233, 0.2)";
                    context.fill();

                    if (isHovered) {
                        context.font = "12px Orbitron";
                        context.fillStyle = "#fff";
                        context.fillText(station.name, x + 15, y + 4);
                    }
                }
            });

            // Clean up click ref if no hit
            if (clickRef.current && !clickRef.current.processed) {
                 clickRef.current.processed = true; // consumed click on void
            }

            // Train Marker
            if (progress > 0 && progress < 1) {
                const totalStations = trip.stations.length - 1;
                const currentStationIndex = Math.min(Math.floor(progress * totalStations), totalStations - 1);
                const nextStationIndex = currentStationIndex + 1;
                const segmentProgress = (progress * totalStations) - currentStationIndex;

                const p1 = trip.stations[currentStationIndex];
                const p2 = trip.stations[nextStationIndex];

                if (p1 && p2) {
                    const interpolate = d3.geoInterpolate([p1.lng, p1.lat], [p2.lng, p2.lat]);
                    const pos = interpolate(segmentProgress);
                    const trainDist = d3.geoDistance(projection.invert([width/2, height/2]), pos);
                    
                    if (trainDist < 1.57) {
                        const [tx, ty] = projection(pos) || [-999, -999];
                        
                        context.beginPath();
                        context.arc(tx, ty, 6, 0, 2 * Math.PI);
                        context.fillStyle = "#f43f5e";
                        context.shadowColor = "#f43f5e";
                        context.shadowBlur = 10;
                        context.fill();
                        context.shadowBlur = 0;
                        
                        const pulse = (Date.now() % 1000) / 1000;
                        context.beginPath();
                        context.arc(tx, ty, 6 + (pulse * 10), 0, 2 * Math.PI);
                        context.strokeStyle = `rgba(244, 63, 94, ${1 - pulse})`;
                        context.stroke();
                    }
                }
            }
        }

        // Update Cursor
        setCursorStyle(isHoveringStation ? 'pointer' : 'default');
    };

    const loop = async () => {
        if (!geoDataCache) {
             try {
                const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
                geoDataCache = await res.json();
             } catch (e) { console.error(e); }
        }
        if (geoDataCache) renderMap(geoDataCache);
        animationId = requestAnimationFrame(loop);
    }
    
    loop();

    return () => {
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
    }
  }, [trip, progress, onStationSelect]); 

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden" style={{ cursor: cursorStyle }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-[#050505] to-black opacity-90 z-0 pointer-events-none"></div>
        <canvas 
            ref={canvasRef} 
            className="block relative z-10"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        />
    </div>
  );
};

export default HolographicMap;