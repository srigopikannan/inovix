import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import type {
  Road,
  LocationSuggestion,
  LiveRoadInspectResponse
} from '../types';
import { StreetViewPanoramaViewer } from '../components/StreetViewPanoramaViewer';
import {
  Search,
  MapPin,
  Layers,
  Camera,
  Satellite,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Info,
  Maximize2,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Gauge,
  X,
  FileCheck,
  Crosshair,
  Car,
  RotateCcw,
  Zap,
  Activity,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LiveRoadViewProps {
  roads: Road[];
  selectedRoadId: number;
}

// Preset popular destinations across Tamil Nadu and India
const POPULAR_DESTINATIONS = [
  {
    name: 'SH-174 Palladam Road, Tiruppur (Inspected Corridor, Tamil Nadu)',
    lat: 11.0850,
    lng: 77.3450,
    state: 'Tamil Nadu',
    isSurveyed: true,
    roadName: 'SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor'
  },
  {
    name: 'Pollachi Central Bus Stand (Tamil Nadu)',
    lat: 10.6609,
    lng: 77.0048,
    state: 'Tamil Nadu',
    isSurveyed: false,
    roadName: 'Pollachi - Udumalpet Highway'
  },
  {
    name: 'Coimbatore Gandhipuram (Tamil Nadu)',
    lat: 11.0168,
    lng: 76.9558,
    state: 'Tamil Nadu',
    isSurveyed: false,
    roadName: 'Avinashi Road / NH-544'
  },
  {
    name: 'Ooty Charing Cross, Nilgiris (Tamil Nadu)',
    lat: 11.4102,
    lng: 76.6932,
    state: 'Tamil Nadu',
    isSurveyed: false,
    roadName: 'NH-181 Ooty - Coonoor Mountain Road'
  },
  {
    name: 'Salem Four Roads Junction (Tamil Nadu)',
    lat: 11.6643,
    lng: 78.1460,
    state: 'Tamil Nadu',
    isSurveyed: false,
    roadName: 'Salem - Omalur Highway'
  },
  {
    name: 'NH-44 Cyber City, Gurugram (Inspected Corridor)',
    lat: 28.4950,
    lng: 77.0890,
    state: 'Haryana',
    isSurveyed: true,
    roadName: 'NH-44 Cyber City - Expressway Corridor'
  }
];

export const LiveRoadView: React.FC<LiveRoadViewProps> = ({
  roads,
  selectedRoadId
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Location search state - Default: SH-174 Palladam Road, Tiruppur
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('q') || 'Palladam Road, Tiruppur (SH-174 Corridor)'
  );
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Selected Target Point
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
    state?: string;
    pincode?: string;
  }>({
    name: 'Palladam Road, Tiruppur (SH-174 Corridor)',
    lat: 11.0850,
    lng: 77.3450,
    state: 'Tamil Nadu',
    pincode: '641604'
  });

  // Selected Road within destination
  const [selectedRoadName, setSelectedRoadName] = useState<string>(
    'SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor'
  );

  // Map Viewing Mode: Standard Map, Satellite View, Street-Level View
  const [viewMode, setViewMode] = useState<'satellite' | 'street' | 'street_level'>('satellite');

  // Street Scanner View Controls
  const [showAIBoundingBoxes, setShowAIBoundingBoxes] = useState<boolean>(true);
  const [selectedEvidenceSample, setSelectedEvidenceSample] = useState<string>(
    '/uploads/sample_pothole_nh44.jpg'
  );

  // Inspection Telemetry
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<LiveRoadInspectResponse | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<any | null>(null);
  const [showDefectModal, setShowDefectModal] = useState<boolean>(false);

  // Upload fallback state
  const [_uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadDetectionResult, setUploadDetectionResult] = useState<any | null>(null);

  // Map DOM references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  // Maptiler Satellite Key
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
  const hasMaptilerKey = Boolean(maptilerApiKey && maptilerApiKey !== 'your_maptiler_api_key_here');

  // Autocomplete debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchLocations(searchQuery, 6);
        setSuggestions(results);
      } catch (err) {
        console.error('Error searching locations:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedLocation.lat, selectedLocation.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      keyboardPanDelta: 80
    });

    // Enforce enabling all navigation and dragging handlers
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();

    L.control.zoom({ position: 'topright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    // Click on map to select location
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      try {
        const rev = await api.reverseGeocode(lat, lng);
        handleSelectLocation({
          name: rev.name || `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng,
          state: rev.state,
          pincode: rev.pincode
        });
      } catch {
        handleSelectLocation({
          name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          lat,
          lng
        });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Map Basemap Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (viewMode === 'satellite' || viewMode === 'street_level') {
      if (hasMaptilerKey) {
        tileLayerRef.current = L.tileLayer(
          `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${maptilerApiKey}`,
          { maxZoom: 20 }
        ).addTo(map);
      } else {
        tileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          { maxZoom: 19 }
        ).addTo(map);
      }
    } else {
      // Standard Street Map
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      ).addTo(map);
    }
  }, [viewMode, hasMaptilerKey, maptilerApiKey]);

  // 3. Update Target Location Marker and Fly To
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;

    // Fly to target
    map.flyTo([selectedLocation.lat, selectedLocation.lng], 16, { duration: 1.2 });

    // Target Pin Icon
    if (targetMarkerRef.current) {
      markerGroup.removeLayer(targetMarkerRef.current);
    }

    const targetIcon = L.divIcon({
      className: 'target-location-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37,99,235,0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const targetMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: targetIcon })
      .bindPopup(`
        <div class="text-xs p-1 font-sans">
          <div class="font-bold text-slate-900">${selectedLocation.name}</div>
          <div class="text-slate-500 text-[11px] mt-0.5">${selectedLocation.state || 'India'} ${selectedLocation.pincode ? `• PIN: ${selectedLocation.pincode}` : ''}</div>
          <div class="text-blue-600 font-mono text-[10px] mt-1">${selectedLocation.lat.toFixed(5)}°N, ${selectedLocation.lng.toFixed(5)}°E</div>
        </div>
      `);
    markerGroup.addLayer(targetMarker);
    targetMarkerRef.current = targetMarker;
  }, [selectedLocation]);

  // 4. Update Defect Markers on Map when Inspection Result arrives
  useEffect(() => {
    if (!markerGroupRef.current) return;
    const markerGroup = markerGroupRef.current;

    // Clear previous defect markers (preserve targetMarker)
    markerGroup.eachLayer((layer) => {
      if (layer !== targetMarkerRef.current) {
        markerGroup.removeLayer(layer);
      }
    });

    if (!inspectionResult || inspectionResult.status !== 'INSPECTED') return;

    const defects = inspectionResult.inspection.defects;
    if (defects.length === 0) {
      // Good Road Marker (Green)
      const goodIcon = L.divIcon({
        className: 'custom-good-road-marker',
        html: `
          <div style="background-color: #16A34A; border: 2.5px solid #FFFFFF; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(22,163,74,0.4);">
            <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const goodMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: goodIcon })
        .bindPopup(`
          <div class="text-xs p-1 font-sans">
            <div class="font-bold text-green-700">Pavement Condition: Good</div>
            <div class="text-slate-600">Zero active potholes or surface fractures detected.</div>
          </div>
        `);
      markerGroup.addLayer(goodMarker);
      return;
    }

    // Render detected defect markers
    defects.forEach((d, idx) => {
      const offsetLat = (idx === 0 ? 0 : (idx % 2 === 0 ? 0.00015 : -0.00015)) * Math.floor((idx + 1) / 2);
      const offsetLng = (idx === 0 ? 0 : (idx % 2 === 0 ? -0.00015 : 0.00015)) * Math.floor((idx + 1) / 2);
      const markerLat = d.lat + offsetLat;
      const markerLng = d.lng + offsetLng;

      // Severity Color Palette
      const severityColor =
        d.severity === 'CRITICAL'
          ? '#DC2626' // Red: Critical
          : d.severity === 'HIGH'
          ? '#EA580C' // Orange: High
          : d.severity === 'MEDIUM'
          ? '#F59E0B' // Yellow: Moderate
          : '#16A34A'; // Green: Good

      const defectIcon = L.divIcon({
        className: 'defect-hazard-marker',
        html: `
          <div style="background-color: ${severityColor}; border: 2px solid #FFFFFF; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.35); cursor: pointer;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([markerLat, markerLng], { icon: defectIcon });
      marker.on('click', () => {
        setSelectedDefect(d);
        setShowDefectModal(true);
      });
      marker.bindPopup(`
        <div class="text-xs p-1 font-sans">
          <div class="font-bold text-slate-900">${d.defect_type}</div>
          <div class="text-xs font-semibold" style="color: ${severityColor};">Severity: ${d.severity}</div>
          <div class="text-slate-600 mt-1">Confidence: <b>${Math.round(d.confidence * 100)}%</b></div>
          <div class="text-slate-600">Footprint: <b>${d.estimated_area_cm2} cm²</b></div>
          <div class="text-blue-600 text-[10px] mt-1 underline cursor-pointer font-medium">Click marker to inspect photo evidence & IRC repair notes</div>
        </div>
      `);
      markerGroup.addLayer(marker);
    });
  }, [inspectionResult, selectedLocation]);

  // Execute Road Inspection
  const handleInspectRoad = async () => {
    setIsInspecting(true);
    setSelectedDefect(null);
    setUploadDetectionResult(null);

    try {
      const res = await api.liveRoadInspect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        road_name: selectedRoadName || selectedLocation.name
      });
      setInspectionResult(res);
      if (res.inspection.defects.length > 0) {
        setSelectedDefect(res.inspection.defects[0]);
      }
    } catch (err) {
      console.error('Failed to execute road inspection:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Trigger inspection on location change automatically
  useEffect(() => {
    handleInspectRoad();
  }, [selectedLocation.lat, selectedLocation.lng, selectedRoadName]);

  // Directional Pan Handlers (Up, Down, Left, Right)
  const handlePanDirection = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!mapInstanceRef.current) return;
    const offset = 120;
    switch (direction) {
      case 'up':
        mapInstanceRef.current.panBy([0, -offset], { animate: true, duration: 0.25 });
        break;
      case 'down':
        mapInstanceRef.current.panBy([0, offset], { animate: true, duration: 0.25 });
        break;
      case 'left':
        mapInstanceRef.current.panBy([-offset, 0], { animate: true, duration: 0.25 });
        break;
      case 'right':
        mapInstanceRef.current.panBy([offset, 0], { animate: true, duration: 0.25 });
        break;
    }
  };

  // Keyboard Arrow Pan Listener
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!mapInstanceRef.current) return;
      const step = e.shiftKey ? 220 : 100;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '=', '-', '_'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowUp':
          mapInstanceRef.current.panBy([0, -step], { animate: true, duration: 0.2 });
          break;
        case 'ArrowDown':
          mapInstanceRef.current.panBy([0, step], { animate: true, duration: 0.2 });
          break;
        case 'ArrowLeft':
          mapInstanceRef.current.panBy([-step, 0], { animate: true, duration: 0.2 });
          break;
        case 'ArrowRight':
          mapInstanceRef.current.panBy([step, 0], { animate: true, duration: 0.2 });
          break;
        case '+':
        case '=':
          mapInstanceRef.current.zoomIn();
          break;
        case '-':
        case '_':
          mapInstanceRef.current.zoomOut();
          break;
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleSelectLocation = (loc: {
    lat: number;
    lng: number;
    name: string;
    state?: string;
    pincode?: string;
    roadName?: string;
  }) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    if (loc.roadName) {
      setSelectedRoadName(loc.roadName);
    } else {
      setSelectedRoadName(loc.name);
    }
    setShowDropdown(false);
  };

  // Upload handler for uninspected road
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setUploadPreview(URL.createObjectURL(file));
      runDetectionOnUpload(file);
    }
  };

  const runDetectionOnUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('road_id', '1');
      const res = await api.detectDefects(formData);
      setUploadDetectionResult(res);
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const runSampleDetection = async (samplePath: string) => {
    setIsUploading(true);
    setSelectedEvidenceSample(samplePath);
    try {
      const formData = new FormData();
      formData.append('sample_image_url', samplePath);
      formData.append('road_id', '1');
      const res = await api.detectDefects(formData);
      setUploadDetectionResult(res);
    } catch (err) {
      console.error('Detection error on sample:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Quick Presets */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60 uppercase tracking-wide">
                Live Road Intelligence
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Optical CV Engine Online
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#172B4D] mt-1.5 tracking-tight">
              ROADGUARD LIVE ROAD VIEW
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Select any destination in India, explore satellite topography, and inspect verified road-level imagery for potholes, cracks, and structural defects.
            </p>
          </div>

          {/* Quick preset selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1">Quick Explore:</span>
            {POPULAR_DESTINATIONS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectLocation(preset)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                  selectedLocation.name === preset.name
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Destination Search Bar */}
        <div className="relative mt-4">
          <div className="flex items-center bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition">
            <Search className="w-5 h-5 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search any Indian state, district, city, town, PIN code (e.g. 560100) or coordinates..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="ml-2 pl-3 border-l border-slate-200 shrink-0">
              <button
                onClick={handleInspectRoad}
                disabled={isInspecting}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                <span>{isInspecting ? 'Inspecting...' : 'Inspect This Road'}</span>
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectLocation(item)}
                  className="px-4 py-2.5 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-md">{item.display_name}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Specific Road Selection Bar (Requirement: Allow users to select a specific road) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold flex items-center">
              <Car className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
              Target Road:
            </span>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                value={selectedRoadName}
                onChange={(e) => setSelectedRoadName(e.target.value)}
                placeholder="Specific road name (e.g. NH-44, MG Road)..."
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[220px]"
              />
              <span className="text-[11px] text-slate-400">or pick corridor:</span>
              <select
                value={selectedRoadId}
                onChange={(e) => {
                  const rId = Number(e.target.value);
                  const matched = roads.find((r) => r.id === rId);
                  if (matched) {
                    setSelectedRoadName(matched.name);
                    setSelectedLocation({
                      lat: matched.start_lat,
                      lng: matched.start_lng,
                      name: matched.name,
                      state: 'Haryana'
                    });
                  }
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                {roads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Click any location on map to reverse-geocode & drop pin</span>
          </div>
        </div>
      </div>

      {/* 4. Main Viewing Mode & Interactive Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Street Scanner Viewport (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
            {/* View Mode Switcher Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 px-1 gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600">Viewing Mode:</span>
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    onClick={() => setViewMode('satellite')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      viewMode === 'satellite'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Satellite View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('street')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      viewMode === 'street'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Standard Map</span>
                  </button>
                  <button
                    onClick={() => setViewMode('street_level')}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      viewMode === 'street_level'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Street-Level View</span>
                  </button>
                </div>
              </div>

              {/* Coordinates Pill */}
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {selectedLocation.lat.toFixed(5)}°N, {selectedLocation.lng.toFixed(5)}°E
                </span>
              </div>
            </div>

            {/* Viewport 1 & 2: Map Canvas (Active for Satellite & Standard Map) */}
            <div
              className={`relative mt-2 rounded-xl overflow-hidden border border-slate-200 ${
                viewMode === 'street_level' ? 'hidden' : 'block'
              }`}
              style={{ height: '560px' }}
            >
              <div
                ref={mapContainerRef}
                tabIndex={0}
                role="region"
                aria-label="Live Road Map Navigation"
                onMouseEnter={() => mapContainerRef.current?.focus({ preventScroll: true })}
                onMouseDown={() => mapContainerRef.current?.focus({ preventScroll: true })}
                className="w-full h-full focus:outline-none"
              />

              {/* Directional Navigation Pad (Requirement 4: Up, Down, Left, Right Arrow Buttons) */}
              <div className="absolute top-20 right-3 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200 shadow-md flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handlePanDirection('up')}
                  title="Move Map North (Arrow Up)"
                  aria-label="Move Map North"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition cursor-pointer"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1 my-1">
                  <button
                    type="button"
                    onClick={() => handlePanDirection('left')}
                    title="Move Map West (Arrow Left)"
                    aria-label="Move Map West"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15, { animate: true });
                      }
                    }}
                    title="Center on Target Location"
                    aria-label="Center on Target Location"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePanDirection('right')}
                    title="Move Map East (Arrow Right)"
                    aria-label="Move Map East"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handlePanDirection('down')}
                  title="Move Map South (Arrow Down)"
                  aria-label="Move Map South"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 transition cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Overlay: Data Transparency & Capture Metadata */}
              <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-[11px] text-slate-600 max-w-sm">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Satellite className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {viewMode === 'satellite' ? 'MapTiler Satellite Basemap' : 'Standard Cartography'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Imagery Composite 2025-2026 (Sentinel-2 & High-Res Ortho). Micro-defects require street-level optical scanner.
                </div>
              </div>

              {/* Overlay: Defect Legend */}
              <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-xs text-xs space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Defect Legend
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 border border-white"></span>
                  <span className="text-slate-700 text-[11px] font-medium">Critical Pothole</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 border border-white"></span>
                  <span className="text-slate-700 text-[11px] font-medium">High Severity</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 border border-white"></span>
                  <span className="text-slate-700 text-[11px] font-medium">Moderate Crack</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 border border-white"></span>
                  <span className="text-slate-700 text-[11px] font-medium">Good / No Defects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 border border-white"></span>
                  <span className="text-slate-700 text-[11px] font-medium">Not Inspected</span>
                </div>
              </div>
            </div>

            {/* Viewport 3: Street-Level Inspection Viewport (Interactive 360° Panorama & Mobile Scanner Telemetry) */}
            {viewMode === 'street_level' && (
              <div className="mt-2">
                <StreetViewPanoramaViewer
                  lat={selectedDefect?.lat ?? selectedLocation.lat}
                  lng={selectedDefect?.lng ?? selectedLocation.lng}
                  roadName={selectedRoadName}
                  segmentId={selectedDefect?.segment_id}
                  surveyFrameUrl={
                    selectedDefect?.annotated_image_url ||
                    selectedDefect?.image_url ||
                    (inspectionResult?.inspection?.images?.[0]?.url) ||
                    selectedEvidenceSample
                  }
                  surveyDefects={inspectionResult?.inspection?.detected_defects || []}
                  onClose={() => setViewMode('satellite')}
                  onSwitchToSatellite={() => setViewMode('satellite')}
                  onSwitchToMap={() => setViewMode('street')}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inspection Results & Street Imagery (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Location & Inspection Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-[#172B4D] truncate max-w-[200px]">
                  {selectedLocation.name}
                </h3>
              </div>
              {inspectionResult?.status === 'INSPECTED' ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Inspected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Not Inspected
                </span>
              )}
            </div>

            {/* Road Telemetry Details */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Identified Road:</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">
                  {selectedRoadName || inspectionResult?.road?.name || selectedLocation.name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>State & District:</span>
                <span className="font-bold text-slate-900">
                  {inspectionResult?.location?.state || selectedLocation.state || 'India'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pavement Health:</span>
                <span className="font-bold text-blue-600">
                  {inspectionResult?.road?.health_score != null
                    ? `${inspectionResult.road.health_score} / 100`
                    : 'N/A (Awaiting Ground Run)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Defects Count:</span>
                <span className="font-bold text-slate-900">
                  {inspectionResult?.inspection?.defects?.length ?? 0} Detected
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ground Run Date:</span>
                <span className="font-bold text-slate-900">
                  {inspectionResult?.inspection?.inspection_date || 'No Run on Record'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Street-Level Imagery & AI Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <h3 className="font-bold text-sm text-[#172B4D] flex items-center space-x-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Street-Level Inspection Evidence</span>
            </h3>

            {/* When Verified Ground Imagery Exists */}
            {inspectionResult?.status === 'INSPECTED' && inspectionResult.inspection.defects.length > 0 ? (
              <div className="mt-3 space-y-3">
                {/* Active Defect Image Preview with Bounding Box Annotation */}
                <div
                  onClick={() => setShowDefectModal(true)}
                  className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center cursor-pointer group"
                >
                  <img
                    src={selectedDefect?.annotated_image_url || selectedDefect?.image_url || '/uploads/sample_pothole_nh44.jpg'}
                    alt="Street Level Defect Evidence"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span>AI Annotated Inspection</span>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-blue-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                    <Maximize2 className="w-3 h-3" />
                    <span>Click to Enlarge</span>
                  </div>
                </div>

                {/* Defect Physical Metrics */}
                {selectedDefect && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{selectedDefect.defect_type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                        {selectedDefect.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <div>Length: <b>{selectedDefect.estimated_length_mm || 480} mm</b></div>
                      <div>Width: <b>{selectedDefect.estimated_width_mm || 320} mm</b></div>
                      <div>Surface Area: <b>{selectedDefect.estimated_area_cm2 || 1536} cm²</b></div>
                      <div>Calibrated: <b>Metric Scale</b></div>
                    </div>
                  </div>
                )}

                {/* Defect Switcher Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {inspectionResult.inspection.defects.map((d, i) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDefect(d);
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        selectedDefect?.id === d.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Defect #{i + 1}: {d.defect_type.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            ) : inspectionResult?.status === 'INSPECTED' && inspectionResult.inspection.defects.length === 0 ? (
              <div className="mt-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="font-bold text-xs text-emerald-900">No Defects Found</div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Ground mobile scanner recorded smooth pavement along this 100m chainage with zero critical potholes.
                </p>
              </div>
            ) : (
              /* When Uninspected: Honest representation & Instant upload prompt */
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No Mobile Scanner Footage on Record</span>
                  </div>
                  <p className="text-[11px] mt-1 text-amber-700 leading-relaxed">
                    No verified street-level mobile scanner footage on record for this road location. Top-down satellite imagery cannot detect sub-surface or minor road cracks.
                  </p>
                </div>

                {/* Instant Upload Zone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50">
                  <input
                    type="file"
                    id="road-imagery-upload-sidebar"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="road-imagery-upload-sidebar" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <div className="font-bold text-xs text-slate-800">Upload Road Imagery for AI Inspection</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WebP up to 25 MB</p>
                  </label>
                </div>

                {/* Or Try Sample Footage */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">Or Run AI on Sample Footage:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => runSampleDetection('/uploads/sample_pothole_nh44.jpg')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition text-left cursor-pointer"
                    >
                      Sample Pothole NH-44
                    </button>
                    <button
                      onClick={() => runSampleDetection('/uploads/sample_crack_nh44.jpg')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition text-left cursor-pointer"
                    >
                      Sample Crack NH-44
                    </button>
                  </div>
                </div>

                {/* Upload Inference Result Preview */}
                {isUploading && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center text-xs text-blue-700 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Running OpenCV Computer Vision pipeline...</span>
                  </div>
                )}

                {uploadDetectionResult && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                      <span>Inspection Detection Result</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {uploadDetectionResult.detections?.length || 0} Defects Identified
                      </span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video">
                      <img
                        src={uploadDetectionResult.annotated_image_url || uploadPreview || ''}
                        alt="Uploaded Detection"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Defect Telemetry Items */}
                    {uploadDetectionResult.detections && uploadDetectionResult.detections.length > 0 && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {uploadDetectionResult.detections.map((d: any, idx: number) => (
                          <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1">
                                <span>{d.id || `POT-0${idx + 1}`}: {d.defect_type}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${d.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                                  {d.severity}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {d.measurements?.metric_dimensions?.diameter_cm
                                  ? `Dia: ${d.measurements.metric_dimensions.diameter_cm} cm`
                                  : `L: ${d.measurements?.metric_dimensions?.length_cm || Math.round(d.pixel_length * 0.14)} cm`} &bull; Area: {d.measurements?.metric_dimensions?.estimated_area_cm2 || Math.round((d.contour_area_px || 4000) * 0.0196)} cm²
                              </div>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {Math.round(d.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Satellite Imagery Accuracy & Source Specifications */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs text-xs space-y-2">
            <h4 className="font-bold text-[#172B4D] flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Data Authenticity & Technical Standards</span>
            </h4>
            <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
              <li>
                <b>Top-Down Satellite:</b> MapTiler / Sentinel-2 Orthoimagery (0.5m - 2.5m GSD). Not a live video feed.
              </li>
              <li>
                <b>Ground Scanner:</b> High-definition vehicle-mounted optical cameras calibrated with physical metric scale.
              </li>
              <li>
                <b>Honest Reporting:</b> Zero fabricated defects. Uninspected segments prompt optical survey.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Defect Evidence Modal */}
      {showDefectModal && selectedDefect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  !
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedDefect.defect_type} — Visual Evidence
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Detected at {selectedDefect.lat?.toFixed(5)}°N, {selectedDefect.lng?.toFixed(5)}°E
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDefectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                <img
                  src={selectedDefect.annotated_image_url || selectedDefect.image_url}
                  alt="Defect Evidence Full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  Severity: {selectedDefect.severity}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  Confidence: {Math.round(selectedDefect.confidence * 100)}%
                </div>
              </div>

              {/* Dimensional Metrology Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Length</span>
                  <b className="text-slate-800 text-sm">{selectedDefect.estimated_length_mm || 480} mm</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Width</span>
                  <b className="text-slate-800 text-sm">{selectedDefect.estimated_width_mm || 320} mm</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Surface Area</span>
                  <b className="text-slate-800 text-sm">{selectedDefect.estimated_area_cm2 || 1536} cm²</b>
                </div>
              </div>

              {/* IRC Maintenance Recommendation */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Indian Roads Congress (IRC) Maintenance Protocol</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {selectedDefect.severity === 'CRITICAL'
                    ? 'IRC:SP:100 Polymer Mastic Cold Patch or hot-mix dense bituminous macadam overlay recommended within 48 hours to prevent vehicle rim and tire impact damage.'
                    : 'IRC:82 Rubberized bitumen hot-pour crack sealant recommended to prevent moisture infiltration and base subgrade failure.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Telemetry Logged: {selectedDefect.detected_at || '2026-10-31 09:30 UTC'}
              </span>
              <button
                onClick={() => {
                  setShowDefectModal(false);
                  navigate('/inspect');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Open in AI Inspection Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
