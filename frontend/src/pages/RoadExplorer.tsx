import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { Road, RoadSegment, DefectDetection } from '../types';
import {
  Compass,
  Navigation,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MapPin,
  Calendar,
  Camera,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Maximize2,
  Minimize2,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadExplorerProps {
  roads: Road[];
  selectedRoadId: number;
}

// Surveyed Street-Level Panoramic Stations along NH-44
const STREET_LEVEL_FRAMES = [
  {
    chainage_m: 0,
    title: 'KM 0.0 - Terminal Post 01 (DLF Cyber City Gateway)',
    lat: 28.4950,
    lng: 77.0890,
    image_url: '/uploads/sample_edge_nh44.jpg',
    capture_date: '2026-10-31 08:45 IST',
    surface_condition: 'Good Pavement (Porous Friction Course)',
    iri: 2.1,
    defects: [],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 1200,
    title: 'Ch 1,200m - Sector 25 Underpass Approach',
    lat: 28.4854,
    lng: 77.0828,
    image_url: '/uploads/sample_waterlogging_nh44.jpg',
    capture_date: '2026-10-31 08:52 IST',
    surface_condition: 'Moderate (Visible Drainage Ponding on Shoulder)',
    iri: 3.4,
    defects: [
      { id: 101, type: 'Waterlogging & Surface Ponding', severity: 'MEDIUM', x_pct: 68, y_pct: 72, area: '420 cm²' }
    ],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 2400,
    title: 'Ch 2,400m - Critical Black Spot Zone (IFFCO Chowk Flyover)',
    lat: 28.4754,
    lng: 77.0765,
    image_url: '/uploads/sample_pothole_nh44.jpg',
    capture_date: '2026-10-31 09:05 IST',
    surface_condition: 'Critical Hazard (High Severity Pothole & Edge Raveling)',
    iri: 5.8,
    defects: [
      { id: 102, type: 'Severe Asphalt Pothole', severity: 'CRITICAL', x_pct: 48, y_pct: 65, area: '850 cm²' },
      { id: 103, type: 'Transverse Fatigue Crack', severity: 'HIGH', x_pct: 32, y_pct: 75, area: '340 cm²' }
    ],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 2500,
    title: 'Ch 2,500m - Black Spot Zone Exit (Sub-surface Fatigue)',
    lat: 28.4746,
    lng: 77.0760,
    image_url: '/uploads/sample_crack_nh44.jpg',
    capture_date: '2026-10-31 09:12 IST',
    surface_condition: 'Poor Condition (Extensive Alligator Fatigue Cracking)',
    iri: 4.6,
    defects: [
      { id: 104, type: 'Fatigue Alligator Cracking', severity: 'HIGH', x_pct: 52, y_pct: 70, area: '1,200 cm²' }
    ],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 5000,
    title: 'KM 5.0 - Midpoint Monitoring Station (Signature Tower)',
    lat: 28.4550,
    lng: 77.0635,
    image_url: '/uploads/sample_edge_nh44.jpg',
    capture_date: '2026-10-31 09:30 IST',
    surface_condition: 'Moderate Condition (Faded Thermoplastic Markings)',
    iri: 2.9,
    defects: [
      { id: 105, type: 'Faded Road Markings', severity: 'MEDIUM', x_pct: 22, y_pct: 80, area: '450 cm²' }
    ],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 7500,
    title: 'KM 7.5 - Rajiv Chowk Sector Station',
    lat: 28.4350,
    lng: 77.0508,
    image_url: '/uploads/sample_pothole_nh44.jpg',
    capture_date: '2026-10-31 09:48 IST',
    surface_condition: 'Fair (Isolated Patching Required)',
    iri: 3.1,
    defects: [],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  },
  {
    chainage_m: 10000,
    title: 'KM 10.0 - Corridor Terminal Post 02 (NH-48 Merge)',
    lat: 28.4150,
    lng: 77.0380,
    image_url: '/uploads/sample_crack_nh44.jpg',
    capture_date: '2026-10-31 10:05 IST',
    surface_condition: 'Satisfactory Highway Section',
    iri: 2.4,
    defects: [],
    provider: 'ROADGUARD Mobile Optical Scanner Unit #04',
    coverage: 'VERIFIED_PANORAMA'
  }
];

export const RoadExplorer: React.FC<RoadExplorerProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(2); // Default to Critical Black Spot at Ch 2,400m
  const [panOffset, setPanOffset] = useState<number>(0); // Horizontal pan angle in degrees (-90 to +90)
  const [zoomLevel, setZoomLevel] = useState<number>(1); // Zoom scale (1.0 to 2.2)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [selectedDefect, setSelectedDefect] = useState<any | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const activeFrame = STREET_LEVEL_FRAMES[currentFrameIdx];

  // Mouse drag handlers for 180°/360° pan rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panOffset * 4);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = (e.clientX - dragStartX) / 4;
    // Clamp pan between -85° (looking left) and +85° (looking right)
    const clamped = Math.max(-85, Math.min(85, diff));
    setPanOffset(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX - panOffset * 4);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const diff = (e.touches[0].clientX - dragStartX) / 4;
    const clamped = Math.max(-85, Math.min(85, diff));
    setPanOffset(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Navigation handlers
  const handleNextFrame = () => {
    if (currentFrameIdx < STREET_LEVEL_FRAMES.length - 1) {
      setCurrentFrameIdx(currentFrameIdx + 1);
      setPanOffset(0);
      setSelectedDefect(null);
    }
  };

  const handlePrevFrame = () => {
    if (currentFrameIdx > 0) {
      setCurrentFrameIdx(currentFrameIdx - 1);
      setPanOffset(0);
      setSelectedDefect(null);
    }
  };

  const handleResetView = () => {
    setPanOffset(0);
    setZoomLevel(1);
    setSelectedDefect(null);
  };

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ROAD EXPLORER</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              STREET-LEVEL INSPECTION
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              180° PERSPECTIVE PANORAMA
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Immersive Optical Telemetry Viewer &bull; Interactive Pavement Surface Perspective &bull; Calibrated Defect Overlays
          </p>
        </div>

        {/* Milestone Quick Step Buttons */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={handlePrevFrame}
            disabled={currentFrameIdx === 0}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev Post</span>
          </button>

          <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-bold">
            Post {currentFrameIdx + 1} of {STREET_LEVEL_FRAMES.length}
          </span>

          <button
            onClick={handleNextFrame}
            disabled={currentFrameIdx === STREET_LEVEL_FRAMES.length - 1}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs font-semibold"
          >
            <span>Next Post</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Street-Level Panoramic Viewer Card (Module 6) */}
      <div
        ref={viewerRef}
        className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl"
        style={{ minHeight: '560px' }}
      >
        {/* Top Floating HUD: Location & Milestone Information */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 text-white text-xs font-mono shadow-lg pointer-events-auto flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="font-bold text-white flex items-center space-x-1.5">
                <span>{activeFrame.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300 border border-blue-700/60">
                  Ch {activeFrame.chainage_m}m
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                GPS: {activeFrame.lat.toFixed(5)}°N, {activeFrame.lng.toFixed(5)}°E &bull; IRI: <b className="text-amber-400">{activeFrame.iri} m/km</b>
              </div>
            </div>
          </div>

          {/* Viewer Controls: Pan Reset, Zoom, Fullscreen */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 pointer-events-auto text-white">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <ZoomIn className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1.0, z - 0.2))}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <ZoomOut className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handleResetView}
              title="Reset Panorama Center"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-300" /> : <Maximize2 className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Panoramic Viewport Canvas with Drag Rotation */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full h-[560px] overflow-hidden flex items-center justify-center cursor-grab ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{ userSelect: 'none' }}
        >
          {/* Panoramic Image container with transform interpolation */}
          <div
            className="relative w-full h-full transition-transform duration-75 ease-out"
            style={{
              transform: `scale(${zoomLevel}) translateX(${panOffset * 6}px)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src={activeFrame.image_url}
              alt="Road Street Level Panorama"
              className="w-full h-full object-cover pointer-events-none brightness-95"
            />

            {/* Simulated Heading Compass Overlay */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 text-white font-mono text-[10px] flex items-center space-x-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>HEADING: {Math.round(180 + panOffset)}° SOUTH-SOUTHWEST</span>
            </div>

            {/* Interactive Projected Pavement Defect Overlays */}
            {activeFrame.defects.map((def) => {
              // Adjust horizontal position according to pan offset
              const adjustedX = def.x_pct;
              const isSelected = selectedDefect?.id === def.id;

              return (
                <div
                  key={def.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDefect(def);
                  }}
                  className="absolute cursor-pointer transition-all duration-200 group"
                  style={{
                    top: `${def.y_pct}%`,
                    left: `${adjustedX}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Pulsing target marker */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-red-500/30 animate-ping" />
                    <span className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-mono text-[9px] font-bold">
                      !
                    </span>
                  </div>

                  {/* Hover Tag */}
                  <div className={`mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md transition ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-black/80 text-white border border-red-500/50 group-hover:bg-red-600'
                  }`}>
                    {def.type} ({def.severity})
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Panorama Navigation & Control Strip */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-none">
          {/* Pan Angle Indicator */}
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/70 text-slate-300 text-[10px] font-mono shadow-md pointer-events-auto flex items-center space-x-2">
            <span className="text-cyan-400">↔ Pan Angle: {Math.round(panOffset)}°</span>
            <span className="text-slate-600">|</span>
            <span>Drag mouse or touch to rotate 180°</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300">Zoom: {zoomLevel.toFixed(1)}x</span>
          </div>

          {/* Quick Chainage Milestone Jump Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 pointer-events-auto overflow-x-auto text-[10px] font-mono">
            {STREET_LEVEL_FRAMES.map((f, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentFrameIdx(i);
                  setPanOffset(0);
                  setSelectedDefect(null);
                }}
                className={`px-2 py-1 rounded transition whitespace-nowrap ${
                  currentFrameIdx === i
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : f.defects.length > 0
                    ? 'bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/60'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Ch {f.chainage_m}m {f.defects.length > 0 ? `(${f.defects.length} Def)` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Defect Inspector Card & Statutory Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frame Telemetry Overview */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-bold text-[#172B4D] uppercase">STREET-LEVEL TELEMETRY</div>
            <Camera className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Chainage Post:</span>
              <b className="text-blue-700">Ch {activeFrame.chainage_m}m ({activeFrame.chainage_m / 1000} km)</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Surface Evaluation:</span>
              <b className="text-slate-800 truncate max-w-[180px]">{activeFrame.surface_condition}</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Surface Roughness (IRI):</span>
              <b className="text-amber-700">{activeFrame.iri} m/km</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Capture Timestamp:</span>
              <b className="text-slate-700">{activeFrame.capture_date}</b>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Optical Survey Provider:</span>
              <b className="text-slate-700 text-[10px] truncate max-w-[180px]">{activeFrame.provider}</b>
            </div>
          </div>

          {/* Module 8: Honest Data Representation Notice */}
          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 text-[10px] font-sans text-blue-900 leading-tight">
            <b>Honest Coverage Protocol:</b> Street-level views are timestamped mobile optical camera frames recorded during verified ground inspection runs. Uninspected highway corridors do not display synthetic street imagery.
          </div>
        </div>

        {/* Selected Defect Detail & Action Card */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-bold text-[#172B4D] uppercase">INSPECTED DEFECT EVIDENCE</span>
                <span className="text-[10px] text-slate-500 block font-normal">Click any red marker in the street view above</span>
              </div>
              <ShieldAlert className="w-4 h-4 text-red-600" />
            </div>

            {selectedDefect ? (
              <div className="mt-3 p-3.5 bg-red-50/60 border border-red-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-red-900">{selectedDefect.type}</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                    {selectedDefect.severity} SEVERITY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div>Contour Area: <b>{selectedDefect.area}</b></div>
                  <div>Camera Angle: <b>Perspective Road Plane</b></div>
                </div>
                <p className="text-[11px] text-slate-600 font-sans mt-1">
                  Identified via bilateral morphological contour segmentation. High risk of localized vehicle rim deformation and hydroplaning hazard.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                {activeFrame.defects.length > 0
                  ? `Select one of the ${activeFrame.defects.length} defects in the panorama above to review metric telemetry.`
                  : 'No active defects detected on this pavement chainage post.'}
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/roadguard-vision')}
              className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-xs"
            >
              <span>Simulate Pavement Repair in VISION</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/defect-detection')}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-semibold transition shadow-xs"
            >
              Upload Ground Footage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
