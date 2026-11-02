import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../services/api';
import type {
  Road,
  RoadSegment,
  Accident,
  BlackSpot,
  DefectDetection,
  LocationSuggestion,
  RouteSegment100m,
  RouteInspectionSummary
} from '../types';
import { LeafletMap } from '../components/LeafletMap';
import {
  MapPin,
  Layers,
  Activity,
  AlertTriangle,
  Cpu,
  Info,
  Maximize2,
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  Eye,
  Search,
  Navigation,
  FileText,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Route,
  ArrowUpDown,
  Car,
  Clock,
  Gauge,
  HelpCircle,
  ExternalLink,
  X,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GISExplorerProps {
  roads: Road[];
  selectedRoadId: number;
}

// Curated Tamil Nadu Demonstration Corridors
const POPULAR_TAMIL_NADU_ROUTES = [
  {
    name: 'Tiruppur ↔ Pollachi (Surveyed Corridor)',
    source: { name: 'Tiruppur (Old Bus Stand / Kumaran Road)', lat: 11.1085, lng: 77.3411 },
    destination: { name: 'Pollachi (Central Bus Stand / Coimbatore Road)', lat: 10.6609, lng: 77.0048 },
    roadName: 'SH-174 / NH-83 Tiruppur - Palladam - Pollachi Corridor'
  },
  {
    name: 'Coimbatore ↔ Chennai (Express Corridor)',
    source: { name: 'Coimbatore (Gandhipuram / Cross Cut Road)', lat: 11.0168, lng: 76.9558 },
    destination: { name: 'Chennai Central (Puratchi Thalaivar Dr. MGR Central)', lat: 13.0827, lng: 80.2707 },
    roadName: 'NH-544 / NH-48 Coimbatore - Chennai Corridor'
  },
  {
    name: 'Erode ↔ Salem',
    source: { name: 'Erode (Central Bus Stand / Brough Road)', lat: 11.3410, lng: 77.7172 },
    destination: { name: 'Salem (New Bus Stand / Four Roads)', lat: 11.6643, lng: 78.1460 },
    roadName: 'NH-544 Erode - Salem Corridor'
  },
  {
    name: 'Madurai ↔ Dindigul',
    source: { name: 'Madurai (Meenakshi Amman Temple / Goripalayam)', lat: 9.9252, lng: 78.1198 },
    destination: { name: 'Dindigul (Rock Fort / Central Bus Stand)', lat: 10.3673, lng: 77.9803 },
    roadName: 'NH-44 Madurai - Dindigul Corridor'
  },
  {
    name: 'Ooty ↔ Coonoor (Nilgiris Mountain)',
    source: { name: 'Ooty / Udhagamandalam (Charing Cross)', lat: 11.4102, lng: 76.6932 },
    destination: { name: 'Coonoor (Sim\'s Park / Mount Road)', lat: 11.3530, lng: 76.7959 },
    roadName: 'NH-181 Nilgiris Mountain Corridor'
  }
];

export const GISExplorer: React.FC<GISExplorerProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();

  // Mode Selection: Route Inspector vs NH-44 Black Spot Corridor Audit
  const [activeTab, setActiveTab] = useState<'ROUTE_INSPECTOR' | 'CORRIDOR_AUDIT'>('ROUTE_INSPECTOR');

  // Standard Corridor Data
  const [roadDetails, setRoadDetails] = useState<(Road & { segments: RoadSegment[] }) | null>(null);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [blackspots, setBlackspots] = useState<BlackSpot[]>([]);
  const [defects, setDefects] = useState<DefectDetection[]>([]);
  const [selectedCorridorSegment, setSelectedCorridorSegment] = useState<RoadSegment | null>(null);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [loadingCorridor, setLoadingCorridor] = useState(false);

  // Tamil Nadu & India-Wide Routing State - Default: Tiruppur to Pollachi
  const [sourceSearch, setSourceSearch] = useState('Tiruppur (Old Bus Stand / Kumaran Road)');
  const [destSearch, setDestSearch] = useState('Pollachi (Central Bus Stand / Coimbatore Road)');
  const [sourcePoint, setSourcePoint] = useState<{ lat: number; lng: number; name: string } | null>({
    name: 'Tiruppur (Old Bus Stand / Kumaran Road)',
    lat: 11.1085,
    lng: 77.3411
  });
  const [destPoint, setDestPoint] = useState<{ lat: number; lng: number; name: string } | null>({
    name: 'Pollachi (Central Bus Stand / Coimbatore Road)',
    lat: 10.6609,
    lng: 77.0048
  });

  // Alternative Routes State
  const [availableAlternatives, setAvailableAlternatives] = useState<Array<{
    route_index: number;
    title: string;
    distance_km: number;
    duration_min: number;
    duration_hours: number;
    primary_road_name: string;
  }>>([]);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number>(0);

  // Autocomplete Suggestions
  const [sourceSuggestions, setSourceSuggestions] = useState<LocationSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingSource, setIsSearchingSource] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // Global India Location Search Box (Module 1)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSuggestions, setGlobalSuggestions] = useState<LocationSuggestion[]>([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // Map Click / Pick on Map Mode
  const [pickMode, setPickMode] = useState<'source' | 'destination' | null>(null);

  // Calculated Route & 100m Segment Telemetry
  const [routeSegments, setRouteSegments] = useState<RouteSegment100m[]>([]);
  const [selectedRouteSegment, setSelectedRouteSegment] = useState<RouteSegment100m | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteInspectionSummary | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [filterCondition, setFilterCondition] = useState<
    'ALL' | 'INSPECTED' | 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD' | 'NOT_INSPECTED'
  >('ALL');

  // Report Export State
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [modalImageEvidence, setModalImageEvidence] = useState<{ url: string; title: string } | null>(null);

  // 1. Load Corridor Data (NH-44)
  useEffect(() => {
    const loadGISData = async () => {
      try {
        setLoadingCorridor(true);
        const [roadData, accs, bs, defs] = await Promise.all([
          api.getRoad(selectedRoadId),
          api.getAccidents(selectedRoadId),
          api.getBlackSpots(selectedRoadId),
          api.getDefects(selectedRoadId)
        ]);
        setRoadDetails(roadData);
        setAccidents(accs);
        setBlackspots(bs);
        setDefects(defs);
        if (roadData.segments && roadData.segments.length > 0) {
          setSelectedCorridorSegment(roadData.segments[24] || roadData.segments[0]);
        }
      } catch (err) {
        console.error('Error loading corridor data:', err);
      } finally {
        setLoadingCorridor(false);
      }
    };
    loadGISData();
  }, [selectedRoadId]);

  // 2. Initial Route Calculation (Default Delhi/Gurugram NH-44 Route)
  useEffect(() => {
    if (sourcePoint && destPoint && routeSegments.length === 0) {
      handleCalculateRoute();
    }
  }, []);

  // 3. Search Autocomplete Debouncers
  useEffect(() => {
    if (!sourceSearch || sourceSearch.length < 2) {
      setSourceSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingSource(true);
        const results = await api.searchLocations(sourceSearch, 6);
        setSourceSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingSource(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [sourceSearch]);

  useEffect(() => {
    if (!destSearch || destSearch.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearchingDest(true);
        const results = await api.searchLocations(destSearch, 6);
        setDestSuggestions(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingDest(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destSearch]);

  // Global India Search debouncer
  useEffect(() => {
    if (!globalSearchQuery || globalSearchQuery.length < 2) {
      setGlobalSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchLocations(globalSearchQuery, 6);
        setGlobalSuggestions(results);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearchQuery]);

  // 4. Calculate Driving Route & 100m Road Inspection
  const handleCalculateRoute = async (routeIdx: number = 0) => {
    if (!sourcePoint || !destPoint) return;
    try {
      setIsRoutingLoading(true);
      const res = await api.calculateRouteAndInspect(sourcePoint, destPoint, undefined, routeIdx);
      setRouteSegments(res.segments);
      setRouteSummary(res.summary);
      setAvailableAlternatives(res.alternatives || []);
      setSelectedAlternativeIndex(routeIdx);
      if (res.segments.length > 0) {
        // Select first inspected segment or first critical/moderate or segment 0
        const firstInteresting =
          res.segments.find((s) => s.inspection_status === 'INSPECTED') || res.segments[0];
        setSelectedRouteSegment(firstInteresting);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // 5. Swap Origin and Destination
  const handleSwapRoute = () => {
    const tempPoint = sourcePoint;
    const tempText = sourceSearch;
    setSourcePoint(destPoint);
    setSourceSearch(destSearch);
    setDestPoint(tempPoint);
    setDestSearch(tempText);
  };

  // 6. Handle Preset Selection
  const handleSelectPreset = (preset: typeof POPULAR_TAMIL_NADU_ROUTES[0]) => {
    setSourcePoint(preset.source);
    setSourceSearch(preset.source.name);
    setDestPoint(preset.destination);
    setDestSearch(preset.destination.name);
    setShowSourceDropdown(false);
    setShowDestDropdown(false);

    // Trigger route computation immediately
    setIsRoutingLoading(true);
    api.calculateRouteAndInspect(preset.source, preset.destination, preset.roadName, 0)
      .then((res) => {
        setRouteSegments(res.segments);
        setRouteSummary(res.summary);
        setAvailableAlternatives(res.alternatives || []);
        setSelectedAlternativeIndex(0);
        if (res.segments.length > 0) {
          const inspected = res.segments.find((s) => s.inspection_status === 'INSPECTED') || res.segments[0];
          setSelectedRouteSegment(inspected);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsRoutingLoading(false));
  };

  // 7. Handle Map Click (Pick on Map)
  const handleMapClick = async (lat: number, lng: number) => {
    if (!pickMode) return;
    try {
      const geo = await api.reverseGeocode(lat, lng);
      if (pickMode === 'source') {
        setSourcePoint({ lat, lng, name: geo.display_name });
        setSourceSearch(geo.name);
      } else if (pickMode === 'destination') {
        setDestPoint({ lat, lng, name: geo.display_name });
        setDestSearch(geo.name);
      }
    } catch (e) {
      const coordName = `Point [${lat.toFixed(5)}, ${lng.toFixed(5)}]`;
      if (pickMode === 'source') {
        setSourcePoint({ lat, lng, name: coordName });
        setSourceSearch(coordName);
      } else {
        setDestPoint({ lat, lng, name: coordName });
        setDestSearch(coordName);
      }
    } finally {
      setPickMode(null);
    }
  };

  // 8. Generate Reports (PDF & CSV)
  const handleExportReport = async (format: 'pdf' | 'csv') => {
    if (!sourcePoint || !destPoint || !routeSummary || routeSegments.length === 0) return;
    try {
      if (format === 'pdf') setIsExportingPdf(true);
      else setIsExportingCsv(true);

      const res = await api.generateRouteReport({
        source_name: sourcePoint.name,
        destination_name: destPoint.name,
        format,
        route_meta: {
          distance_km: routeSummary.total_distance_km,
          duration_min: routeSummary.total_duration_min,
          primary_road_name: 'National Highway Corridor',
          provider: 'OSRM / ROADGUARD AI'
        },
        segments: routeSegments,
        summary_stats: routeSummary
      });

      // Trigger download
      window.open(res.download_url, '_blank');
    } catch (e) {
      console.error('Failed to export report:', e);
    } finally {
      if (format === 'pdf') setIsExportingPdf(false);
      else setIsExportingCsv(false);
    }
  };

  // Filtered Segments for the navigator list
  const filteredRouteSegments = useMemo(() => {
    if (filterCondition === 'ALL') return routeSegments;
    if (filterCondition === 'INSPECTED') return routeSegments.filter((s) => s.inspection_status === 'INSPECTED');
    if (filterCondition === 'NOT_INSPECTED') return routeSegments.filter((s) => s.inspection_status === 'NOT_INSPECTED');
    return routeSegments.filter((s) => s.road_condition === filterCondition);
  }, [routeSegments, filterCondition]);

  return (
    <div className="space-y-5">
      {/* 1. Global Page Header & India Search Box */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">
              INDIA ROAD INTELLIGENCE & ROUTE INSPECTOR
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              NATIONAL GIS 2.4
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              WGS-84 &bull; OSRM ENGINE
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Explore India-wide road networks, plan routes, inspect 100m pavement segments & review verified AI defect telemetry.
          </p>
        </div>

        {/* Global India Location Search Box (Module 1: States, Districts, Cities, PIN Codes, Coordinates) */}
        <div className="flex items-center space-x-3">
          <div className="relative w-72 sm:w-80">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search state, city, PIN code or lat,lng..."
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  setShowGlobalDropdown(true);
                }}
                onFocus={() => setShowGlobalDropdown(true)}
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-sans"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setShowGlobalDropdown(false);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Global Search Suggestions Dropdown */}
            {showGlobalDropdown && globalSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] max-h-60 overflow-y-auto">
                {globalSuggestions.map((loc, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFlyToTarget({ lat: loc.lat, lng: loc.lng, zoom: 13 });
                      setGlobalSearchQuery(loc.name);
                      setShowGlobalDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-start space-x-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">{loc.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{loc.display_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono">
            <button
              onClick={() => setActiveTab('ROUTE_INSPECTOR')}
              className={`px-3 py-1 rounded font-semibold transition ${
                activeTab === 'ROUTE_INSPECTOR'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Route Inspector
            </button>
            <button
              onClick={() => setActiveTab('CORRIDOR_AUDIT')}
              className={`px-3 py-1 rounded font-semibold transition ${
                activeTab === 'CORRIDOR_AUDIT'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NH-44 Black Spot
            </button>
          </div>
        </div>
      </div>

      {/* 2. Destination Route Selection Panel (Module 2) */}
      {activeTab === 'ROUTE_INSPECTOR' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Origin & Destination Inputs */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              {/* Origin Input */}
              <div className="relative">
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  Origin / Starting Location (A)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={sourceSearch}
                    onChange={(e) => {
                      setSourceSearch(e.target.value);
                      setShowSourceDropdown(true);
                    }}
                    onFocus={() => setShowSourceDropdown(true)}
                    placeholder="Search origin in Tamil Nadu or India..."
                    className="w-full text-xs bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {sourceSearch && (
                    <button
                      onClick={() => {
                        setSourceSearch('');
                        setSourcePoint(null);
                      }}
                      title="Clear origin"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPickMode(pickMode === 'source' ? null : 'source')}
                    title="Click map to pick origin"
                    className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                      pickMode === 'source'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Pick
                  </button>
                </div>

                {/* Origin Autocomplete Dropdown */}
                {showSourceDropdown && sourceSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] max-h-52 overflow-y-auto">
                    {sourceSuggestions.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSourcePoint({ lat: loc.lat, lng: loc.lng, name: loc.display_name });
                          setSourceSearch(loc.name);
                          setShowSourceDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{loc.name}</span>
                          {loc.district && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                              {loc.district}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{loc.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="relative">
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-500 mb-1">
                  Destination Location (B)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={destSearch}
                    onChange={(e) => {
                      setDestSearch(e.target.value);
                      setShowDestDropdown(true);
                    }}
                    onFocus={() => setShowDestDropdown(true)}
                    placeholder="Search destination in Tamil Nadu or India..."
                    className="w-full text-xs bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {destSearch && (
                    <button
                      onClick={() => {
                        setDestSearch('');
                        setDestPoint(null);
                      }}
                      title="Clear destination"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPickMode(pickMode === 'destination' ? null : 'destination')}
                    title="Click map to pick destination"
                    className={`ml-1 px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                      pickMode === 'destination'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Pick
                  </button>
                </div>

                {/* Destination Autocomplete Dropdown */}
                {showDestDropdown && destSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-[1000] max-h-52 overflow-y-auto">
                    {destSuggestions.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDestPoint({ lat: loc.lat, lng: loc.lng, name: loc.display_name });
                          setDestSearch(loc.name);
                          setShowDestDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{loc.name}</span>
                          {loc.district && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                              {loc.district}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{loc.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Swap & Calculate */}
            <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-4">
              <button
                onClick={handleSwapRoute}
                title="Swap Origin and Destination"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleCalculateRoute(0)}
                disabled={isRoutingLoading || !sourcePoint || !destPoint}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono text-xs font-semibold shadow-xs disabled:opacity-50 transition"
              >
                <Route className="w-4 h-4" />
                <span>{isRoutingLoading ? 'Routing & Inspecting...' : 'Inspect Route'}</span>
              </button>
            </div>
          </div>

          {/* Selectable Alternative Routes Strip */}
          {availableAlternatives.length > 1 && (
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-blue-600 shrink-0">Alternative Routes:</span>
              {availableAlternatives.map((alt) => (
                <button
                  key={alt.route_index}
                  onClick={() => handleCalculateRoute(alt.route_index)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition flex items-center space-x-1.5 ${
                    selectedAlternativeIndex === alt.route_index
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <span>{alt.title}</span>
                  <span className="opacity-80">({alt.distance_km} km &bull; {alt.duration_min} min)</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Route Presets Strip */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Tamil Nadu Corridors:</span>
            {POPULAR_TAMIL_NADU_ROUTES.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="px-2.5 py-1 rounded bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-[11px] whitespace-nowrap transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Destination Inspection Summary Card & Export Bar (Module 6) */}
      {activeTab === 'ROUTE_INSPECTOR' && routeSummary && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#172B4D] font-mono uppercase tracking-wide">
                  DESTINATION AUDIT SUMMARY
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  routeSummary.overall_condition === 'CRITICAL_HAZARD'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : routeSummary.overall_condition === 'POOR'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : routeSummary.overall_condition === 'GOOD'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {routeSummary.overall_condition}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {routeSummary.confidence_description}
              </p>
            </div>

            {/* Download PDF & CSV Reports Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExportReport('pdf')}
                disabled={isExportingPdf}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-mono font-semibold transition shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF Audit'}</span>
              </button>

              <button
                onClick={() => handleExportReport('csv')}
                disabled={isExportingCsv}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-mono font-semibold transition shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isExportingCsv ? 'Exporting...' : 'CSV Ledger'}</span>
              </button>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Route Distance</div>
              <div className="text-sm font-bold text-[#172B4D] mt-0.5">{routeSummary.total_distance_km} km</div>
              <div className="text-[10px] text-slate-400">Est. {routeSummary.total_duration_min} min</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">100m Segments</div>
              <div className="text-sm font-bold text-[#172B4D] mt-0.5">{routeSummary.total_segments}</div>
              <div className="text-[10px] text-slate-400">Sequential Units</div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
              <div className="text-[10px] text-blue-600 uppercase font-semibold">Inspection Coverage</div>
              <div className="text-sm font-bold text-blue-950 mt-0.5">{routeSummary.coverage_pct}%</div>
              <div className="text-[10px] text-blue-700 font-medium">{routeSummary.inspected_segments} of {routeSummary.total_segments} surveyed</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Potholes Detected</div>
              <div className={`text-sm font-bold mt-0.5 ${routeSummary.pothole_count > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {routeSummary.pothole_count}
              </div>
              <div className="text-[10px] text-slate-400">Optical CV Identified</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Surface Cracks</div>
              <div className={`text-sm font-bold mt-0.5 ${routeSummary.crack_count > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                {routeSummary.crack_count}
              </div>
              <div className="text-[10px] text-slate-400">Structural & Alligator</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Critical Hazard Units</div>
              <div className={`text-sm font-bold mt-0.5 ${routeSummary.critical_segments_count > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {routeSummary.critical_segments_count}
              </div>
              <div className="text-[10px] text-slate-400">Immediate Remediation</div>
            </div>
          </div>

          {/* Module 8: Honest Data Representation Alert Banner */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] font-sans flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-amber-900 leading-snug">
              <b>Honest Data Protocol:</b> Satellite and aerial basemaps do not measure surface micro-roughness or pavement depth.
              Only segments verified by optical ground scanner runs show defect telemetry. Uninspected segments on this route are transparently marked <b>Not Inspected (Grey)</b> pending physical survey.
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Bar & Condition Heatmap Legend (Module 5) */}
      {activeTab === 'ROUTE_INSPECTOR' && routeSegments.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          {/* Condition Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-slate-500 uppercase font-bold text-[10px] shrink-0">Filter Condition:</span>
            {[
              { id: 'ALL', label: 'All Segments' },
              { id: 'INSPECTED', label: 'Inspected Only' },
              { id: 'CRITICAL', label: 'Critical (Red)' },
              { id: 'POOR', label: 'Poor (Orange)' },
              { id: 'MODERATE', label: 'Moderate (Yellow)' },
              { id: 'GOOD', label: 'Good (Green)' },
              { id: 'NOT_INSPECTED', label: 'Not Inspected (Grey)' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCondition(f.id as any)}
                className={`px-2.5 py-1 rounded border text-[11px] whitespace-nowrap transition ${
                  filterCondition === f.id
                    ? 'bg-blue-600 text-white border-blue-600 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Dynamic Condition Overlay Legend (Module 5) */}
          <div className="flex items-center space-x-3 text-[11px] shrink-0">
            <span className="text-slate-400 uppercase font-semibold text-[10px]">Legend:</span>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Poor</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span>Critical</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Not Inspected</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Map & Interactive Telemetry Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Column (3 spans) */}
        <div className="lg:col-span-3 space-y-3">
          <LeafletMap
            roads={roads}
            selectedRoad={activeTab === 'CORRIDOR_AUDIT' ? (roadDetails || undefined) : undefined}
            accidents={accidents}
            blackspots={blackspots}
            defects={defects}
            selectedSegment={activeTab === 'CORRIDOR_AUDIT' ? selectedCorridorSegment : null}
            onSelectSegment={(seg) => setSelectedCorridorSegment(seg)}
            focusCorridorTrigger={focusTrigger}
            height="620px"
            initialBasemap="satellite"
            // Route Inspection Props
            routeSegments={activeTab === 'ROUTE_INSPECTOR' ? routeSegments : []}
            selectedRouteSegment={activeTab === 'ROUTE_INSPECTOR' ? selectedRouteSegment : null}
            onSelectRouteSegment={(seg) => setSelectedRouteSegment(seg)}
            sourcePoint={sourcePoint}
            destinationPoint={destPoint}
            pickMode={pickMode}
            onMapClick={handleMapClick}
            flyToLocation={flyToTarget}
            filterCondition={filterCondition}
          />

          <div className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs font-mono text-slate-600 shadow-xs">
            <div className="flex items-center space-x-2">
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {activeTab === 'ROUTE_INSPECTOR'
                  ? 'Click any 100m segment along the route to inspect pavement condition, IRI, and AI defect evidence.'
                  : 'Click any 100m segment on NH-44 corridor to inspect chainage and statutory black-spot hazard buffers.'}
              </span>
            </div>
            <span className="font-semibold text-slate-800">
              {activeTab === 'ROUTE_INSPECTOR'
                ? `Route Segments: ${routeSegments.length}`
                : `Corridor Segments: ${roadDetails?.segments.length || 0}`}
            </span>
          </div>
        </div>

        {/* 6. Interactive Road Segment Intelligence Panel (Module 3, 4, 5) */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] font-mono tracking-tight">
                  {activeTab === 'ROUTE_INSPECTOR' ? 'ROUTE SEGMENT AUDIT' : 'CORRIDOR TELEMETRY'}
                </h3>
                <p className="text-[10px] font-mono text-slate-500">100-Metre Granular Infrastructure Record</p>
              </div>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>

            {/* Content for Route Segment */}
            {activeTab === 'ROUTE_INSPECTOR' && selectedRouteSegment ? (
              <div className="mt-4 space-y-3.5 text-xs font-mono">
                {/* 1. Road Name & Segment ID */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Segment ID</div>
                      <div className="text-sm font-bold text-[#172B4D]">{selectedRouteSegment.segment_id}</div>
                    </div>
                    {/* Status Pill */}
                    <div className="text-right">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        selectedRouteSegment.inspection_status === 'INSPECTED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {selectedRouteSegment.inspection_status}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-1">
                    Road: <b>{selectedRouteSegment.road_name}</b>
                  </div>
                </div>

                {/* 2. Chainage & Coordinates */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Chainage Window:</span>
                    <span className="font-bold text-blue-900">
                      Ch {selectedRouteSegment.chainage_start_m}m &ndash; {selectedRouteSegment.chainage_end_m}m
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <div><b>Start:</b> {selectedRouteSegment.start_lat.toFixed(5)}°N, {selectedRouteSegment.start_lng.toFixed(5)}°E</div>
                    <div><b>End:</b> &nbsp;{selectedRouteSegment.end_lat.toFixed(5)}°N, {selectedRouteSegment.end_lng.toFixed(5)}°E</div>
                  </div>
                </div>

                {/* 3. Road Condition & Health Index */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Pavement Condition:</span>
                    <span className={`text-xs font-bold ${
                      selectedRouteSegment.road_condition === 'CRITICAL'
                        ? 'text-red-600'
                        : selectedRouteSegment.road_condition === 'POOR'
                        ? 'text-orange-600'
                        : selectedRouteSegment.road_condition === 'MODERATE'
                        ? 'text-yellow-600'
                        : selectedRouteSegment.road_condition === 'GOOD'
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}>
                      {selectedRouteSegment.road_condition}
                    </span>
                  </div>

                  {selectedRouteSegment.health_score !== null ? (
                    <>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            selectedRouteSegment.health_score < 50
                              ? 'bg-red-500'
                              : selectedRouteSegment.health_score < 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${selectedRouteSegment.health_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                        <span>Health: <b>{selectedRouteSegment.health_score}/100</b></span>
                        <span>IRI Roughness: <b>{selectedRouteSegment.surface_roughness_iri} m/km</b></span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-slate-500 mt-1 italic">
                      Pending physical scanner survey &bull; Health score unmeasured
                    </div>
                  )}
                </div>

                {/* 4. AI Defect Evidence (Module 4) */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">AI Defect Detections:</span>
                    <span className={`text-xs font-bold ${selectedRouteSegment.defect_count > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                      {selectedRouteSegment.defect_count} Verified
                    </span>
                  </div>

                  {selectedRouteSegment.defects && selectedRouteSegment.defects.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {selectedRouteSegment.defects.map((def, i) => (
                        <div key={i} className="p-2 bg-white rounded border border-slate-200 text-[10px] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-blue-900">{def.defect_type}</div>
                            <div className="text-slate-500">
                              Severity: <b className="text-red-600">{def.severity}</b> &bull; Conf: <b>{Math.round(def.confidence * 100)}%</b>
                            </div>
                          </div>
                          {def.image_url && (
                            <button
                              onClick={() => setModalImageEvidence({
                                url: def.annotated_image_url || def.image_url,
                                title: `${def.defect_type} (${def.severity}) Evidence`
                              })}
                              className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-semibold"
                            >
                              Photo
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 italic">
                      {selectedRouteSegment.inspection_status === 'INSPECTED'
                        ? 'No active potholes or structural defects detected.'
                        : 'No inspection imagery available on record for this road segment.'}
                    </div>
                  )}
                </div>

                {/* 5. Last Inspection & Verification Source */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
                  <div className="text-slate-500 uppercase font-bold">Verification Source</div>
                  <div className="text-slate-800 font-medium mt-0.5">{selectedRouteSegment.verification_source}</div>
                  <div className="text-slate-500 mt-1">
                    Last Survey: <b>{selectedRouteSegment.last_inspected || 'Pending Inspection'}</b>
                  </div>
                </div>

                {/* Action CTA: Simulate Fix in VISION */}
                <button
                  onClick={() => navigate('/roadguard-vision')}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-semibold transition shadow-xs text-xs"
                >
                  <span>Simulate Reconstruction in VISION</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : activeTab === 'CORRIDOR_AUDIT' && selectedCorridorSegment ? (
              /* Corridor View for NH-44 */
              <div className="mt-4 space-y-3.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <div className="text-[10px] text-blue-600 uppercase font-bold">Corridor</div>
                  <div className="text-xs font-bold text-blue-950 mt-0.5">
                    {roadDetails?.name || 'NH-44 National Highway'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#172B4D]">
                      Ch {selectedCorridorSegment.chainage_start_m}m &ndash; {selectedCorridorSegment.chainage_end_m}m
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      selectedCorridorSegment.risk_level === 'CRITICAL'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {selectedCorridorSegment.risk_level}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Segment #{selectedCorridorSegment.segment_index + 1} (DB ID #{selectedCorridorSegment.id})
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Health Index:</span>
                    <b className="text-[#172B4D]">{selectedCorridorSegment.health_score} / 100</b>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Roughness (IRI):</span>
                    <b className="text-amber-700">{selectedCorridorSegment.surface_roughness_iri} m/km</b>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-500">Active Defects:</span>
                    <b className="text-red-600">{selectedCorridorSegment.defect_count} Detected</b>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                Select a road segment on the map to inspect telemetry.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center justify-between">
            <span>CRS: <b>EPSG:4326 (WGS 84)</b></span>
            <span>Scale: <b>100m Units</b></span>
          </div>
        </div>
      </div>

      {/* 7. Image Evidence Modal */}
      {modalImageEvidence && (
        <div className="fixed inset-0 z-[2000] bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-2xl w-full border border-slate-200 shadow-2xl">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-mono text-xs font-bold">{modalImageEvidence.title}</span>
              <button
                onClick={() => setModalImageEvidence(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={modalImageEvidence.url}
                alt="Defect Evidence"
                className="max-h-[70vh] rounded-lg shadow-md object-contain"
              />
            </div>
            <div className="p-3 bg-white text-right border-t border-slate-200">
              <button
                onClick={() => setModalImageEvidence(null)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-mono font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
