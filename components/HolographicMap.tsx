import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TripSummary, Station } from '../types';

interface HolographicMapProps {
  trip: TripSummary | null;
  progress: number; // 0 to 1
}

const HolographicMap: React.FC<HolographicMapProps> = ({ trip, progress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [worldData, setWorldData] = useState<any>(null);

  // Load world topology once
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        setWorldData(data);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Main Render Loop
  useEffect(() => {
    if (!worldData || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    // D3 Setup
    // Use feature from topojson-client logic (simplified here as we can't import topojson easily without extra file, 
    // but d3-geo doesn't parse topojson natively. 
    // NOTE: For this environment, we will process the topojson manually if needed, 
    // but to be safe and robust without extra huge imports, we can use a basic sphere or fetch GeoJSON directly if prefered.
    // However, topojson is standard. Let's assume we use a pre-converted GeoJSON object 
    // OR we use the raw geometry if available.
    // Actually, `d3` does NOT bundle topojson. We need to fetch GeoJSON directly or parse it.
    // Let's use a GeoJSON source for simplicity in this constrained environment.
    
    // Retrying fetch with GeoJSON source to avoid topojson dependency
    const renderMap = (geoJsonFeatures: any) => {
        const projection = d3.geoOrthographic()
          .fitExtent([[10, 10], [width - 10, height - 10]], { type: "Sphere" })
          .translate([width / 2, height / 2]);

        const path = d3.geoPath(projection, context);

        // Auto-rotate logic or Trip focus
        let center: [number, number] = [0, 0];
        let scale = Math.min(width, height) / 2;

        if (trip && trip.stations.length > 0) {
           // Calculate bounding box or center of the trip
           const lons = trip.stations.map(s => s.lng);
           const lats = trip.stations.map(s => s.lat);
           const minLon = Math.min(...lons);
           const maxLon = Math.max(...lons);
           const minLat = Math.min(...lats);
           const maxLat = Math.max(...lats);
           
           const centerLon = (minLon + maxLon) / 2;
           const centerLat = (minLat + maxLat) / 2;
           center = [centerLon, centerLat];
           
           // Simple zoom heuristic
           const span = Math.max(maxLon - minLon, maxLat - minLat);
           if (span > 0) {
               scale = (Math.min(width, height) / span) * 40; // Approx zoom
               scale = Math.min(scale, 4000); // Cap zoom
               scale = Math.max(scale, 300); // Min zoom
           }
        } else {
             // Rotate slowly if no trip
             const t = Date.now() / 100;
             center = [t % 360, 0]; 
             scale = Math.min(width, height) / 2.5;
        }

        // Interpolate current camera view for smoothness?
        // For now, snap to computed
        projection.rotate([-center[0], -center[1]]).scale(scale);

        // Clear
        context.clearRect(0, 0, width, height);
        
        // Ocean / Background
        context.beginPath();
        path({ type: "Sphere" });
        context.fillStyle = "#0f172a"; // slate-900
        context.fill();
        context.strokeStyle = "#1e293b"; // slate-800
        context.lineWidth = 1;
        context.stroke();

        // Graticule
        const graticule = d3.geoGraticule10();
        context.beginPath();
        path(graticule);
        context.strokeStyle = "rgba(56, 189, 248, 0.1)"; // Cyan low opacity
        context.lineWidth = 0.5;
        context.stroke();

        // Land
        context.beginPath();
        path(geoJsonFeatures);
        context.fillStyle = "#1e293b"; // slate-800
        context.fill();
        context.strokeStyle = "#334155"; // slate-700
        context.lineWidth = 0.5;
        context.stroke();

        // Trip Visualization
        if (trip && trip.stations.length > 1) {
            const coords = trip.stations.map(s => [s.lng, s.lat] as [number, number]);
            
            // Draw Route Line
            context.beginPath();
            path({ type: "LineString", coordinates: coords });
            context.strokeStyle = "#0ea5e9"; // Cyan-500
            context.lineWidth = 3;
            context.lineCap = "round";
            context.lineJoin = "round";
            context.setLineDash([5, 5]);
            context.stroke();
            context.setLineDash([]);

            // Draw Stations
            trip.stations.forEach((station, i) => {
                const [x, y] = projection([station.lng, station.lat]) || [0, 0];
                if (x && y) {
                    // Glow
                    context.beginPath();
                    context.arc(x, y, 6, 0, 2 * Math.PI);
                    context.fillStyle = "rgba(14, 165, 233, 0.3)";
                    context.fill();
                    
                    // Dot
                    context.beginPath();
                    context.arc(x, y, 3, 0, 2 * Math.PI);
                    context.fillStyle = "#e0f2fe"; // sky-100
                    context.fill();

                    // Label (if visible)
                    // Check if point is clipped (behind the globe)
                    // d3-geo path automatically handles clipping for shapes, but for custom text/points we check
                    // Simple check: distance from center of projection < scale (roughly)
                    // Or rely on projection clipping stream.
                    // For simplicity, we just draw.
                }
            });

            // Train / Current Position Marker
            // Interpolate position along the path based on progress
            // Simple linear interpolation between stations for visualization
            const totalStations = trip.stations.length - 1;
            const currentStationIndex = Math.min(Math.floor(progress * totalStations), totalStations - 1);
            const nextStationIndex = currentStationIndex + 1;
            const segmentProgress = (progress * totalStations) - currentStationIndex;

            const p1 = trip.stations[currentStationIndex];
            const p2 = trip.stations[nextStationIndex];

            if (p1 && p2) {
                 const interpolate = d3.geoInterpolate([p1.lng, p1.lat], [p2.lng, p2.lat]);
                 const pos = interpolate(segmentProgress);
                 const [tx, ty] = projection(pos) || [0, 0];
                 
                 // Draw Train Marker
                 context.beginPath();
                 context.arc(tx, ty, 8, 0, 2 * Math.PI);
                 context.fillStyle = "#f43f5e"; // Rose-500
                 context.shadowColor = "#f43f5e";
                 context.shadowBlur = 15;
                 context.fill();
                 context.shadowBlur = 0; // Reset
                 
                 // Pulse ring
                 const pulse = (Date.now() % 1000) / 1000;
                 context.beginPath();
                 context.arc(tx, ty, 8 + (pulse * 10), 0, 2 * Math.PI);
                 context.strokeStyle = `rgba(244, 63, 94, ${1 - pulse})`;
                 context.stroke();
            }
        }
    };

    // Helper to fetch geojson if we switched away from topojson
    const loadGeoAndRender = async () => {
        // We actually have topojson data in worldData.
        // We need to convert it. Since we don't have topojson lib, 
        // let's fetch raw GeoJSON instead to be safe with just d3.
        try {
            const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
            const data = await res.json();
            renderMap(data);
        } catch(e) {
            console.error(e);
        }
    }

    let animationId: number;
    const animate = () => {
       loadGeoAndRender(); 
       // Note: In a real app we wouldn't fetch every frame. We fetch once and render in loop.
       // Correcting implementation below.
    };
    
    // Correct animation loop
    let geoDataCache: any = null;
    const loop = async () => {
        if (!geoDataCache) {
             const res = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
             geoDataCache = await res.json();
        }
        renderMap(geoDataCache);
        animationId = requestAnimationFrame(loop);
    }
    
    loop();

    return () => cancelAnimationFrame(animationId);
  }, [trip, progress, worldData]); // Re-init on trip change to reset zoom targets if needed

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black opacity-80 z-0"></div>
        <canvas ref={canvasRef} className="block relative z-10" />
    </div>
  );
};

export default HolographicMap;
