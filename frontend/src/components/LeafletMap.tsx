import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Road, RoadSegment, Accident, BlackSpot, DefectDetection, RouteSegment100m } from '../types';
import {
  Layers,
  Eye,
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Info,
  Satellite,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  Crosshair,
  CheckCircle2,
  Wrench,
  X,
  Radio,
  Mountain,
  Navigation,
  MapPin,
  Flag,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LeafletMapProps {
  roads: Road[];
  selectedRoad?: Road & { segments: RoadSegment[] };
  accidents: Accident[];
  blackspots: BlackSpot[];
  defects: DefectDetection[];
  onSelectSegment?: (segment: RoadSegment) => void;
  selectedSegment?: RoadSegment | null;
  height?: string;
  initialBasemap?: 'satellite' | 'street' | 'terrain';
  focusCorridorTrigger?: number;

  // India-Wide & Route Inspection Extensions
  routeSegments?: RouteSegment100m[];
  selectedRouteSegment?: RouteSegment100m | null;
  onSelectRouteSegment?: (segment: RouteSegment100m) => void;
  sourcePoint?: { lat: number; lng: number; name: string } | null;
  destinationPoint?: { lat: number; lng: number; name: string } | null;
  pickMode?: 'source' | 'destination' | null;
  onMapClick?: (lat: number, lng: number) => void;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  filterCondition?: 'ALL' | 'INSPECTED' | 'CRITICAL' | 'POOR' | 'MODERATE' | 'GOOD' | 'NOT_INSPECTED';
  onSelectDefect?: (defect: any) => void;
  selectedDefect?: any | null;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  roads,
  selectedRoad,
  accidents,
  blackspots,
  defects,
  onSelectSegment,
  selectedSegment,
  height = '620px',
  initialBasemap = 'satellite',
  focusCorridorTrigger = 0,
  routeSegments = [],
  selectedRouteSegment,
  onSelectRouteSegment,
  sourcePoint,
  destinationPoint,
  pickMode = null,
  onMapClick,
  flyToLocation,
  filterCondition = 'ALL',
  onSelectDefect,
  selectedDefect
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const scaleControlRef = useRef<L.Control.Scale | null>(null);

  const layersGroupRef = useRef<{
    boundaryLayer: L.LayerGroup;
    roadsLayer: L.LayerGroup;
    segmentsLayer: L.LayerGroup;
    highlightLayer: L.LayerGroup;
    blackspotsLayer: L.LayerGroup;
    accidentsLayer: L.LayerGroup;
    defectsLayer: L.LayerGroup;
    stationsLayer: L.LayerGroup;
    riskHeatmapLayer: L.LayerGroup;
    // Route Inspection Layers
    routeFoundationLayer: L.LayerGroup;
    routeSegmentsLayer: L.LayerGroup;
    routeMarkersLayer: L.LayerGroup;
    routeHighlightLayer: L.LayerGroup;
    routeArrowsLayer: L.LayerGroup;
    routeDefectsLayer: L.LayerGroup;
  } | null>(null);

  // Basemap & Configuration State
  const [basemap, setBasemap] = useState<'satellite' | 'street' | 'terrain'>(initialBasemap);

  // Sync initialBasemap when prop changes from parent
  useEffect(() => {
    if (initialBasemap) {
      setBasemap(initialBasemap);
    }
  }, [initialBasemap]);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tileLoading, setTileLoading] = useState<boolean>(false);
  const [isFallbackActive, setIsFallbackActive] = useState<boolean>(false);
  const [showConfigNotice, setShowConfigNotice] = useState<boolean>(false);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);

  // Layer Visibility Toggles
  const [showSegments, setShowSegments] = useState<boolean>(true);
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [showBlackSpots, setShowBlackSpots] = useState<boolean>(true);
  const [showBuffers, setShowBuffers] = useState<boolean>(true);
  const [showAccidents, setShowAccidents] = useState<boolean>(true);
  const [showDefects, setShowDefects] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showRiskHeatmap, setShowRiskHeatmap] = useState<boolean>(false);
  const [showRouteOverlay, setShowRouteOverlay] = useState<boolean>(true);

  // Read MapTiler API Key from Vite environment variable
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
  const hasMaptilerKey = Boolean(maptilerApiKey && maptilerApiKey !== 'your_maptiler_api_key_here');

  // Active satellite provider metadata
  const satelliteProviderName = hasMaptilerKey
    ? 'MapTiler Satellite HD (Official API)'
    : 'ESRI World Imagery (Resilient Ortho Fallback)';

  // Helper: Maintenance recommendation
  const getSegmentMaintenance = (risk: string, health: number) => {
    if (risk === 'CRITICAL' || health < 40) {
      return 'Emergency Polymer Mastic Patch & IRC-35 Thermoplastic Restriping';
    } else if (risk === 'HIGH' || health < 55) {
      return 'Hot-Pour Rubberized Bitumen Crack Sealing & Drainage Realignment';
    } else if (risk === 'MEDIUM' || health < 75) {
      return 'Preventive Stone Matrix Asphalt (SMA) Micro-Surfacing Overlay';
    }
    return 'Routine Structural Patrol & Photometric Lux Monitoring';
  };

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedRoad ? selectedRoad.start_lat : 22.5000;
    const initialLng = selectedRoad ? selectedRoad.start_lng : 78.9000;
    const initialZoomLevel = selectedRoad ? 13 : 5; // India-wide zoom if no corridor selected

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoomLevel,
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

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Metric Scale Control bottom-left (Module 1 requirement)
    scaleControlRef.current = L.control.scale({
      position: 'bottomleft',
      imperial: false,
      metric: true
    }).addTo(map);

    // Update zoom counter state
    map.on('zoomend', () => setCurrentZoom(map.getZoom()));

    // Map Click Listener (for Pick on Map functionality)
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    });

    // Initialize Layer Groups
    const boundaryLayer = L.layerGroup().addTo(map);
    const roadsLayer = L.layerGroup().addTo(map);
    const segmentsLayer = L.layerGroup().addTo(map);
    const highlightLayer = L.layerGroup().addTo(map);
    const blackspotsLayer = L.layerGroup().addTo(map);
    const accidentsLayer = L.layerGroup().addTo(map);
    const defectsLayer = L.layerGroup().addTo(map);
    const stationsLayer = L.layerGroup().addTo(map);
    const riskHeatmapLayer = L.layerGroup().addTo(map);

    // Route Inspection Layer Groups
    const routeFoundationLayer = L.layerGroup().addTo(map);
    const routeSegmentsLayer = L.layerGroup().addTo(map);
    const routeArrowsLayer = L.layerGroup().addTo(map);
    const routeDefectsLayer = L.layerGroup().addTo(map);
    const routeMarkersLayer = L.layerGroup().addTo(map);
    const routeHighlightLayer = L.layerGroup().addTo(map);

    layersGroupRef.current = {
      boundaryLayer,
      roadsLayer,
      segmentsLayer,
      highlightLayer,
      blackspotsLayer,
      accidentsLayer,
      defectsLayer,
      stationsLayer,
      riskHeatmapLayer,
      routeFoundationLayer,
      routeSegmentsLayer,
      routeMarkersLayer,
      routeHighlightLayer,
      routeArrowsLayer,
      routeDefectsLayer
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Basemap Layer Management (Satellite, Street, Terrain)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = '';
    let attributionText = '';
    let maxZoom = 19;

    if (basemap === 'satellite') {
      if (hasMaptilerKey && !isFallbackActive) {
        tileUrl = `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${maptilerApiKey}`;
        attributionText = '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; OpenStreetMap contributors';
        maxZoom = 19;
      } else {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attributionText = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        maxZoom = 19;
      }
    } else if (basemap === 'terrain') {
      // Topographic Terrain Layer
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      attributionText = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community';
      maxZoom = 18;
    } else {
      // Clean Enterprise Street Map (CartoDB Voyager)
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      attributionText = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
      maxZoom = 19;
      setIsFallbackActive(false);
    }

    const newTileLayer = L.tileLayer(tileUrl, {
      attribution: attributionText,
      maxZoom,
      subdomains: 'abcd'
    });

    newTileLayer.on('loading', () => setTileLoading(true));
    newTileLayer.on('load', () => setTileLoading(false));
    newTileLayer.on('tileerror', () => {
      setTileLoading(false);
      // Auto-fallback to ESRI if MapTiler fails
      if (basemap === 'satellite' && !isFallbackActive) {
        setIsFallbackActive(true);
        if (tileLayerRef.current && mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(tileLayerRef.current);
          const fallbackLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Fallback Orthoimagery',
            maxZoom: 19
          }).addTo(mapInstanceRef.current);
          tileLayerRef.current = fallbackLayer;
        }
      }
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [basemap, hasMaptilerKey, maptilerApiKey]);

  // 3. Center or zoom when selectedRoad changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRoad) return;
    const centerLat = (selectedRoad.start_lat + selectedRoad.end_lat) / 2;
    const centerLng = (selectedRoad.start_lng + selectedRoad.end_lng) / 2;
    mapInstanceRef.current.setView([centerLat, centerLng], 13);
  }, [selectedRoad?.id]);

  // 4. Focus 10 KM Corridor action (fits exact stored route coordinates)
  const focus10KmCorridor = () => {
    if (!mapInstanceRef.current || !selectedRoad) return;
    const map = mapInstanceRef.current;

    if (selectedRoad.segments && selectedRoad.segments.length > 0) {
      const bounds = L.latLngBounds(
        selectedRoad.segments.map((s) => [s.start_lat, s.start_lng] as [number, number])
          .concat(selectedRoad.segments.map((s) => [s.end_lat, s.end_lng] as [number, number]))
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      const bounds = L.latLngBounds([
        [selectedRoad.start_lat, selectedRoad.start_lng],
        [selectedRoad.end_lat, selectedRoad.end_lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // 4b. Listen for external focusCorridorTrigger
  useEffect(() => {
    if (focusCorridorTrigger && focusCorridorTrigger > 0) {
      focus10KmCorridor();
    }
  }, [focusCorridorTrigger]);

  // 4c. Fly to location when requested
  useEffect(() => {
    if (!mapInstanceRef.current || !flyToLocation) return;
    mapInstanceRef.current.flyTo(
      [flyToLocation.lat, flyToLocation.lng],
      flyToLocation.zoom || 14,
      { duration: 1.5 }
    );
  }, [flyToLocation]);

  // 4d. Pan India View (Module 1)
  const panIndiaView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([22.5000, 78.9000], 5, { animate: true });
  };

  // 4d-2. Directional Pan Navigation Handlers (Smooth Up, Down, Left, Right)
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

  // 4d-3. Keyboard Arrow Navigation (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
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

  // 4e. Smoothly pan to selectedSegment when selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedSegment) return;
    const midLat = (selectedSegment.start_lat + selectedSegment.end_lat) / 2;
    const midLng = (selectedSegment.start_lng + selectedSegment.end_lng) / 2;
    mapInstanceRef.current.panTo([midLat, midLng], { animate: true });
  }, [selectedSegment?.id]);

  // 4f. Smoothly pan to selectedRouteSegment when selected
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRouteSegment) return;
    const midLat = (selectedRouteSegment.start_lat + selectedRouteSegment.end_lat) / 2;
    const midLng = (selectedRouteSegment.start_lng + selectedRouteSegment.end_lng) / 2;
    mapInstanceRef.current.panTo([midLat, midLng], { animate: true });
  }, [selectedRouteSegment?.segment_id]);

  // 5. Render Standard Highway Overlays (NH-44 Corridor & Black Spots)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const {
      boundaryLayer,
      roadsLayer,
      segmentsLayer,
      highlightLayer,
      blackspotsLayer,
      accidentsLayer,
      defectsLayer,
      stationsLayer,
      riskHeatmapLayer
    } = layersGroupRef.current;

    // Clear previous standard layers
    boundaryLayer.clearLayers();
    roadsLayer.clearLayers();
    segmentsLayer.clearLayers();
    highlightLayer.clearLayers();
    blackspotsLayer.clearLayers();
    accidentsLayer.clearLayers();
    defectsLayer.clearLayers();
    stationsLayer.clearLayers();
    riskHeatmapLayer.clearLayers();

    const isSat = basemap === 'satellite';

    // A. 10 km Corridor Boundary Right-of-Way Swath
    if (showBoundary && selectedRoad?.segments && selectedRoad.segments.length > 0) {
      const segs = selectedRoad.segments;
      const leftCoords: [number, number][] = [];
      const rightCoords: [number, number][] = [];
      const offset = 0.0018;

      segs.forEach((s) => {
        const dLat = s.end_lat - s.start_lat;
        const dLng = s.end_lng - s.start_lng;
        const len = Math.hypot(dLat, dLng) || 0.0001;
        const pLat = (-dLng / len) * offset;
        const pLng = (dLat / len) * offset;
        leftCoords.push([s.start_lat + pLat, s.start_lng + pLng]);
        rightCoords.unshift([s.start_lat - pLat, s.start_lng - pLng]);
      });

      const corridorPolygon = L.polygon([...leftCoords, ...rightCoords], {
        color: '#0284C7',
        fillColor: '#0EA5E9',
        fillOpacity: isSat ? 0.16 : 0.08,
        weight: 1.5,
        dashArray: '5, 5',
        interactive: false
      }).bindTooltip(
        `<b>${selectedRoad.name}</b><br/>10 KM Designated Corridor Boundary (Right-of-Way Swath)`,
        { sticky: true }
      );
      boundaryLayer.addLayer(corridorPolygon);
    }

    // B. Main Road Axis Line
    if (selectedRoad) {
      const casing = L.polyline(
        [[selectedRoad.start_lat, selectedRoad.start_lng], [selectedRoad.end_lat, selectedRoad.end_lng]],
        {
          color: isSat ? '#000000' : '#1E293B',
          weight: 9,
          opacity: 0.85
        }
      );
      const inner = L.polyline(
        [[selectedRoad.start_lat, selectedRoad.start_lng], [selectedRoad.end_lat, selectedRoad.end_lng]],
        {
          color: '#2563EB',
          weight: 5,
          opacity: 0.95
        }
      );
      roadsLayer.addLayer(casing);
      roadsLayer.addLayer(inner);
    }

    // C. 100 Individual 100-Metre Segments
    if (showSegments && selectedRoad?.segments) {
      selectedRoad.segments.forEach((seg) => {
        const segAccidents = accidents.filter((a) => a.segment_id === seg.id);

        let strokeColor = '#10B981'; // LOW = Green
        if (seg.risk_level === 'CRITICAL') strokeColor = '#DC2626'; // Red
        else if (seg.risk_level === 'HIGH') strokeColor = '#EA580C'; // Orange
        else if (seg.risk_level === 'MEDIUM') strokeColor = '#F59E0B'; // Amber

        const underlay = L.polyline(
          [[seg.start_lat, seg.start_lng], [seg.end_lat, seg.end_lng]],
          {
            color: isSat ? '#000000' : '#FFFFFF',
            weight: 7,
            opacity: 0.9
          }
        );
        segmentsLayer.addLayer(underlay);

        const segLine = L.polyline(
          [[seg.start_lat, seg.start_lng], [seg.end_lat, seg.end_lng]],
          {
            color: strokeColor,
            weight: 4.5,
            opacity: 0.95
          }
        );

        segLine.on('click', () => {
          if (onSelectSegment) onSelectSegment(seg);
        });

        const maintenanceText = getSegmentMaintenance(seg.risk_level, seg.health_score);

        segLine.bindPopup(`
          <div class="text-xs p-1 font-sans min-w-[240px]">
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span class="font-bold text-[#172B4D] font-mono">1. Road: ${selectedRoad?.name || 'NH-44'}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                seg.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
              }">${seg.risk_level}</span>
            </div>
            <div class="mt-2 space-y-1 text-[11px] font-mono">
              <div class="flex justify-between text-slate-600">
                <span>2. Segment ID:</span>
                <b class="text-slate-900">#${seg.segment_index + 1} (DB: ${seg.id})</b>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>3. Chainage Window:</span>
                <b class="text-blue-700">Ch ${seg.chainage_start_m}m - ${seg.chainage_end_m}m</b>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>4. Health Index:</span>
                <b class="text-emerald-700">${seg.health_score} / 100</b>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>5. Recorded Crashes:</span>
                <b class="${segAccidents.length > 0 ? 'text-red-600 font-bold' : 'text-slate-800'}">${segAccidents.length} incidents</b>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>6. AI Defect Count:</span>
                <b class="${seg.defect_count > 0 ? 'text-red-600 font-bold' : 'text-slate-800'}">${seg.defect_count} detected</b>
              </div>
            </div>
            <div class="mt-2.5 pt-2 border-t border-slate-200">
              <span class="text-[10px] text-slate-500 font-bold uppercase font-mono">Recommended Maintenance:</span>
              <p class="text-[11px] text-[#172B4D] font-medium mt-0.5 leading-snug">${maintenanceText}</p>
            </div>
          </div>
        `);
        segmentsLayer.addLayer(segLine);
      });
    }

    // D. Active Selected Segment Outline
    if (selectedSegment) {
      const halo = L.polyline(
        [[selectedSegment.start_lat, selectedSegment.start_lng], [selectedSegment.end_lat, selectedSegment.end_lng]],
        {
          color: '#00F0FF',
          weight: 12,
          opacity: 0.95
        }
      );
      const innerWhite = L.polyline(
        [[selectedSegment.start_lat, selectedSegment.start_lng], [selectedSegment.end_lat, selectedSegment.end_lng]],
        {
          color: '#FFFFFF',
          weight: 4,
          opacity: 1
        }
      );
      highlightLayer.addLayer(halo);
      highlightLayer.addLayer(innerWhite);
    }

    // E. Black Spots & 500-Meter Hazardous Clusters (MoRTH Protocol)
    if (showBlackSpots) {
      blackspots.forEach((bs) => {
        if (showBuffers) {
          const bufferCircle = L.circle([bs.latitude, bs.longitude], {
            radius: bs.radius_meters || 500,
            color: bs.risk_tier === 'CRITICAL_BLACK_SPOT' ? '#DC2626' : '#EA580C',
            fillColor: bs.risk_tier === 'CRITICAL_BLACK_SPOT' ? '#DC2626' : '#F97316',
            fillOpacity: isSat ? 0.22 : 0.14,
            weight: 2,
            dashArray: '6, 6',
            interactive: false
          }).bindTooltip(
            `<b>${bs.code} Hazard Buffer</b><br/>500m Statutory Cluster Envelope (SI: ${bs.severity_index.toFixed(1)})`,
            { sticky: true }
          );
          blackspotsLayer.addLayer(bufferCircle);
        }

        const bsIcon = L.divIcon({
          className: 'custom-blackspot-marker',
          html: `
            <div style="background-color: ${bs.risk_tier === 'CRITICAL_BLACK_SPOT' ? '#DC2626' : '#EA580C'}; border: 2.5px solid #FFFFFF; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(220,38,38,0.8);">
              <span style="color: white; font-size: 11px; font-weight: bold; font-family: monospace;">!</span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const bsMarker = L.marker([bs.latitude, bs.longitude], { icon: bsIcon }).bindPopup(`
          <div class="text-xs p-1 font-sans">
            <div class="font-bold text-red-600 font-mono text-sm">${bs.code} &bull; ${bs.name}</div>
            <div class="text-slate-600 mt-1">Severity Index (SI): <b class="text-red-700">${bs.severity_index.toFixed(1)}</b></div>
            <div class="text-slate-600">Total Crashes: <b>${bs.total_accidents}</b> (${bs.fatal_count} Fatal, ${bs.severe_count} Severe)</div>
            <div class="text-slate-500 text-[10px] mt-1 italic">${bs.classification_reason}</div>
          </div>
        `);
        blackspotsLayer.addLayer(bsMarker);
      });
    }

    // F. Accident Pins
    if (showAccidents) {
      accidents.forEach((acc) => {
        const markerColor = acc.severity === 'Fatal' ? '#991B1B' : acc.severity === 'Severe Injury' ? '#C2410C' : '#D97706';
        const accMarker = L.circleMarker([acc.latitude, acc.longitude], {
          radius: 5,
          color: '#FFFFFF',
          fillColor: markerColor,
          fillOpacity: 0.95,
          weight: 1.5
        }).bindPopup(`
          <div class="text-xs p-1 font-sans">
            <div class="font-bold text-[#172B4D] font-mono">${acc.case_number}</div>
            <div class="text-slate-600">Severity: <b class="text-red-600">${acc.severity}</b></div>
            <div class="text-slate-600">Casualties: <b>${acc.casualties_fatal} Fatal, ${acc.casualties_severe} Severe</b></div>
            <div class="text-slate-500 text-[10px] mt-0.5">${acc.primary_factor || 'Road Infrastructure Contributing Factor'}</div>
          </div>
        `);
        accidentsLayer.addLayer(accMarker);
      });
    }

    // G. Defects Pins
    if (showDefects) {
      defects.forEach((d) => {
        const dMarker = L.circleMarker([28.4750, 77.0760], {
          radius: 4,
          color: '#FFFFFF',
          fillColor: d.severity === 'CRITICAL' ? '#DC2626' : '#F59E0B',
          weight: 1.5,
          fillOpacity: 0.95
        }).bindPopup(`
          <div class="text-xs p-1 font-sans">
            <div class="font-bold text-blue-600 font-mono">${d.defect_type} (${d.severity})</div>
            <div class="text-slate-600">AI Confidence: <b class="text-slate-900">${Math.round(d.confidence * 100)}%</b></div>
            <div class="text-slate-600">Footprint: <b class="text-slate-900">${d.estimated_area_cm2} cm²</b></div>
          </div>
        `);
        defectsLayer.addLayer(dMarker);
      });
    }

    // H. Inspection Milestone Stations
    if (showStations && selectedRoad?.segments && selectedRoad.segments.length > 0) {
      const milestones = [
        { idx: 0, label: 'KM 0.0 (Terminal Post 01)' },
        { idx: 24, label: 'KM 2.5 (Survey Station Alpha)' },
        { idx: 49, label: 'KM 5.0 (Corridor Midpoint Station)' },
        { idx: 74, label: 'KM 7.5 (Sector Station Bravo)' },
        { idx: 99, label: 'KM 10.0 (Corridor Terminal Post 02)' }
      ];

      milestones.forEach((m) => {
        const targetSeg = selectedRoad.segments[m.idx];
        if (!targetSeg) return;

        const stationIcon = L.divIcon({
          className: 'station-milestone-icon',
          html: `
            <div style="background-color: #1E293B; border: 2px solid #38BDF8; color: #38BDF8; border-radius: 4px; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
              📌 ${targetSeg.chainage_start_m}m
            </div>
          `,
          iconSize: [60, 20],
          iconAnchor: [30, 10]
        });

        const stationMarker = L.marker([targetSeg.start_lat, targetSeg.start_lng], { icon: stationIcon })
          .bindTooltip(`<b>${m.label}</b><br/>Chainage: Ch ${targetSeg.chainage_start_m}m`, { sticky: true });
        stationsLayer.addLayer(stationMarker);
      });
    }
  }, [
    roads,
    selectedRoad,
    selectedSegment,
    accidents,
    blackspots,
    defects,
    basemap,
    showBoundary,
    showSegments,
    showBlackSpots,
    showBuffers,
    showAccidents,
    showDefects,
    showStations,
    showRiskHeatmap
  ]);

  // 6. Render India-Wide Destination Route & 100m Condition Segments (Modules 2, 3, 4, 5)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;
    const {
      routeFoundationLayer,
      routeSegmentsLayer,
      routeMarkersLayer,
      routeHighlightLayer,
      routeArrowsLayer,
      routeDefectsLayer
    } = layersGroupRef.current;

    routeFoundationLayer.clearLayers();
    routeSegmentsLayer.clearLayers();
    routeMarkersLayer.clearLayers();
    routeHighlightLayer.clearLayers();
    if (routeArrowsLayer) routeArrowsLayer.clearLayers();
    if (routeDefectsLayer) routeDefectsLayer.clearLayers();

    if (!showRouteOverlay || routeSegments.length === 0) return;

    const isSat = basemap === 'satellite';

    // A. Source Marker (Green Pin "A")
    if (sourcePoint) {
      const srcIcon = L.divIcon({
        className: 'route-source-marker',
        html: `
          <div style="background-color: #16A34A; border: 2.5px solid #FFFFFF; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">
            <span style="color: white; font-size: 13px; font-weight: 900; font-family: sans-serif;">A</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const srcMarker = L.marker([sourcePoint.lat, sourcePoint.lng], { icon: srcIcon })
        .bindTooltip(`<b>Origin (A):</b> ${sourcePoint.name}`, { permanent: false, sticky: true });
      routeMarkersLayer.addLayer(srcMarker);
    }

    // B. Destination Marker (Red Flag "B")
    if (destinationPoint) {
      const dstIcon = L.divIcon({
        className: 'route-destination-marker',
        html: `
          <div style="background-color: #DC2626; border: 2.5px solid #FFFFFF; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">
            <span style="color: white; font-size: 13px; font-weight: 900; font-family: sans-serif;">B</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const dstMarker = L.marker([destinationPoint.lat, destinationPoint.lng], { icon: dstIcon })
        .bindTooltip(`<b>Destination (B):</b> ${destinationPoint.name}`, { permanent: false, sticky: true });
      routeMarkersLayer.addLayer(dstMarker);
    }

    // C. Render Sequential 100-Metre Segments Colored by Condition
    routeSegments.forEach((seg) => {
      // Condition Filter check
      if (filterCondition === 'INSPECTED' && seg.inspection_status !== 'INSPECTED') return;
      if (filterCondition === 'CRITICAL' && seg.road_condition !== 'CRITICAL') return;
      if (filterCondition === 'POOR' && seg.road_condition !== 'POOR') return;
      if (filterCondition === 'MODERATE' && seg.road_condition !== 'MODERATE') return;
      if (filterCondition === 'GOOD' && seg.road_condition !== 'GOOD') return;
      if (filterCondition === 'NOT_INSPECTED' && seg.inspection_status !== 'NOT_INSPECTED') return;

      // Color mapping: Green, Yellow, Orange, Red, Grey (Module 5)
      let segColor = '#64748B'; // Grey (Not Inspected)
      let isDashed = true;
      let opacity = 0.85;

      if (seg.inspection_status === 'INSPECTED') {
        isDashed = false;
        opacity = 0.95;
        if (seg.road_condition === 'GOOD') segColor = '#16A34A'; // Green
        else if (seg.road_condition === 'MODERATE') segColor = '#EAB308'; // Yellow
        else if (seg.road_condition === 'POOR') segColor = '#EA580C'; // Orange
        else if (seg.road_condition === 'CRITICAL') segColor = '#DC2626'; // Red
      }

      // High-contrast underlay casing
      const underlayLine = L.polyline(
        [[seg.start_lat, seg.start_lng], [seg.end_lat, seg.end_lng]],
        {
          color: isSat ? '#000000' : '#FFFFFF',
          weight: 7,
          opacity: 0.9
        }
      );
      routeFoundationLayer.addLayer(underlayLine);

      const segmentPoly = L.polyline(
        [[seg.start_lat, seg.start_lng], [seg.end_lat, seg.end_lng]],
        {
          color: segColor,
          weight: 4.5,
          opacity,
          dashArray: isDashed ? '4, 4' : undefined
        }
      );

      segmentPoly.on('click', () => {
        if (onSelectRouteSegment) onSelectRouteSegment(seg);
      });

      segmentPoly.bindTooltip(
        `<b>${seg.segment_id}</b> &bull; Ch ${seg.chainage_start_m}m - ${seg.chainage_end_m}m<br/>` +
        `Status: <b>${seg.inspection_status}</b> &bull; Condition: <b>${seg.road_condition}</b>` +
        (seg.health_score !== null ? `<br/>Health Score: <b>${seg.health_score}/100</b>` : '') +
        (seg.defect_count > 0 ? `<br/>Defects: <b style="color: #DC2626">${seg.defect_count} detected</b>` : ''),
        { sticky: true }
      );

      routeSegmentsLayer.addLayer(segmentPoly);
    });

    // D. Direction Arrows Along the Route
    if (routeArrowsLayer && routeSegments.length > 0) {
      const totalSegs = routeSegments.length;
      const arrowStep = Math.max(1, Math.floor(totalSegs / 14));
      for (let i = Math.floor(arrowStep / 2); i < totalSegs; i += arrowStep) {
        const seg = routeSegments[i];
        const dLat = seg.end_lat - seg.start_lat;
        const dLng = seg.end_lng - seg.start_lng;
        if (Math.abs(dLat) < 0.000001 && Math.abs(dLng) < 0.000001) continue;
        const angleRad = Math.atan2(dLng, dLat);
        const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
        const midLat = (seg.start_lat + seg.end_lat) / 2;
        const midLng = (seg.start_lng + seg.end_lng) / 2;

        const arrowIcon = L.divIcon({
          className: 'route-chevron-direction-arrow',
          html: `
            <div style="transform: rotate(${angleDeg}deg); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
                <path d="M12 2L20 18L12 14L4 18L12 2Z" fill="#00D2FF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const arrowMarker = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false });
        routeArrowsLayer.addLayer(arrowMarker);
      }
    }

    // E. Overlay Verified AI Road Defect Markers Directly on Route
    if (routeDefectsLayer && routeSegments.length > 0) {
      routeSegments.forEach((seg) => {
        if (!seg.defects || seg.defects.length === 0) return;
        seg.defects.forEach((d) => {
          const defLat = d.latitude ?? ((seg.start_lat + seg.end_lat) / 2);
          const defLng = d.longitude ?? ((seg.start_lng + seg.end_lng) / 2);

          const sevUpper = (d.severity || '').toUpperCase();
          let markerColor = '#DC2626'; // Default Critical (Red)
          let sevBadgeBg = '#DC2626';
          let labelText = 'CRITICAL';
          if (sevUpper === 'CRITICAL') {
            markerColor = '#DC2626'; // Red: Critical
            sevBadgeBg = '#DC2626';
            labelText = 'Critical';
          } else if (sevUpper === 'HIGH' || sevUpper === 'POOR') {
            markerColor = '#EA580C'; // Orange: High
            sevBadgeBg = '#EA580C';
            labelText = 'High';
          } else if (sevUpper === 'MODERATE' || sevUpper === 'MEDIUM') {
            markerColor = '#EAB308'; // Yellow: Moderate
            sevBadgeBg = '#EAB308';
            labelText = 'Moderate';
          } else if (sevUpper === 'GOOD' || sevUpper === 'LOW') {
            markerColor = '#16A34A'; // Green: Good / Inspected
            sevBadgeBg = '#16A34A';
            labelText = 'Good';
          } else {
            markerColor = '#64748B'; // Grey: Not Inspected
            sevBadgeBg = '#64748B';
            labelText = 'Not Inspected';
          }

          const dType = d.defect_type || 'Defect';
          const confPct = Math.round((d.confidence ?? 0.9) * 100);
          const formattedDate = d.detected_at
            ? new Date(d.detected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            : '2026-10-31 15:00 IST';

          const defectIcon = L.divIcon({
            className: 'route-defect-icon-pin',
            html: `
              <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${markerColor}; opacity: 0.35; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
                <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${markerColor}; border: 2.5px solid #FFFFFF; box-shadow: 0 3px 8px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const defectMarker = L.marker([defLat, defLng], { icon: defectIcon });

          defectMarker.bindPopup(`
            <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; color: #1e293b; max-width: 250px; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 13px; color: #0f172a;">${dType}</span>
                <span style="background: ${sevBadgeBg}; color: white; padding: 2px 7px; border-radius: 9999px; font-weight: 700; font-size: 9px; text-transform: uppercase;">
                  ${labelText}
                </span>
              </div>
              ${d.image_url ? `
                <div style="margin-bottom: 8px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; background: #000;">
                  <img src="${d.image_url}" alt="${dType}" style="width: 100%; height: 115px; object-fit: cover; display: block;" />
                </div>
              ` : ''}
              <div style="display: grid; grid-template-columns: 1fr; gap: 3px; font-size: 11px; color: #475569; background: #f8fafc; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div><b>AI Confidence:</b> <span style="color: #2563eb; font-weight: 700;">${confPct}%</span></div>
                <div><b>Corridor / Road:</b> ${d.road_name || seg.road_name}</div>
                <div><b>Segment:</b> ${seg.segment_id} (Ch ${seg.chainage_start_m}m - ${seg.chainage_end_m}m)</div>
                <div><b>GPS Coordinates:</b> <span style="font-family: monospace; font-size: 10px; color: #0f172a;">${defLat.toFixed(5)}, ${defLng.toFixed(5)}</span></div>
                <div><b>Inspection Time:</b> ${formattedDate}</div>
              </div>
            </div>
          `, { maxWidth: 280 });

          defectMarker.on('click', () => {
            if (onSelectDefect) {
              onSelectDefect({
                ...d,
                latitude: defLat,
                longitude: defLng,
                road_name: d.road_name || seg.road_name,
                segment_id: seg.segment_id,
                chainage_start_m: seg.chainage_start_m,
                chainage_end_m: seg.chainage_end_m
              });
            }
            if (onSelectRouteSegment) onSelectRouteSegment(seg);
          });

          routeDefectsLayer.addLayer(defectMarker);
        });
      });
    }

    // F. Selected Route Segment High-Visibility Halo
    if (selectedRouteSegment) {
      const halo = L.polyline(
        [[selectedRouteSegment.start_lat, selectedRouteSegment.start_lng], [selectedRouteSegment.end_lat, selectedRouteSegment.end_lng]],
        {
          color: '#00F0FF',
          weight: 12,
          opacity: 0.95
        }
      );
      const innerWhite = L.polyline(
        [[selectedRouteSegment.start_lat, selectedRouteSegment.start_lng], [selectedRouteSegment.end_lat, selectedRouteSegment.end_lng]],
        {
          color: '#FFFFFF',
          weight: 4,
          opacity: 1
        }
      );
      routeHighlightLayer.addLayer(halo);
      routeHighlightLayer.addLayer(innerWhite);
    }

    // Auto-fit bounds if route was just loaded
    if (routeSegments.length > 0 && mapInstanceRef.current) {
      const latLngs: [number, number][] = routeSegments.map((s) => [s.start_lat, s.start_lng]);
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [
    routeSegments,
    selectedRouteSegment,
    sourcePoint,
    destinationPoint,
    basemap,
    showRouteOverlay,
    filterCondition,
    onSelectDefect,
    onSelectRouteSegment
  ]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={mapWrapperRef}
      className="relative rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-slate-900"
      style={{ height }}
    >
      {/* Pick on Map Banner when active */}
      {pickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-xs flex items-center space-x-2 animate-bounce">
          <MapPin className="w-4 h-4 text-amber-300" />
          <span>Click anywhere on the map to set <b>{pickMode === 'source' ? 'Origin (A)' : 'Destination (B)'}</b></span>
        </div>
      )}

      {/* Main Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        tabIndex={0}
        role="region"
        aria-label="Interactive Map Navigation"
        onMouseEnter={() => mapContainerRef.current?.focus({ preventScroll: true })}
        onMouseDown={() => mapContainerRef.current?.focus({ preventScroll: true })}
        className="w-full h-full focus:outline-none"
      />

      {/* Directional Navigation Pad (Requirement 4: Up, Down, Left, Right Arrow Buttons) */}
      <div className="absolute top-20 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200 shadow-md flex flex-col items-center">
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
            onClick={panIndiaView}
            title="Center Map View (All India)"
            aria-label="Center Map View"
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

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2">
        {/* Basemap Toggle Group (Satellite / Street / Terrain) */}
        <div className="flex items-center bg-white/95 backdrop-blur-md rounded-lg p-1 border border-slate-200 shadow-sm text-xs font-mono">
          <button
            onClick={() => setBasemap('satellite')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition ${
              basemap === 'satellite'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>
          <button
            onClick={() => setBasemap('street')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition ${
              basemap === 'street'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>
          <button
            onClick={() => setBasemap('terrain')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition ${
              basemap === 'terrain'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Terrain</span>
          </button>
        </div>

        {/* Pan India View (Module 1) */}
        <button
          onClick={panIndiaView}
          title="Zoom to Entire India Map"
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-white/95 text-slate-800 hover:bg-slate-100 border border-slate-200 shadow-sm transition"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>India View</span>
        </button>

        {/* Focus 10 KM Corridor button */}
        {selectedRoad && (
          <button
            onClick={focus10KmCorridor}
            title="Focus 10 KM Highway Corridor"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-lg bg-white/95 text-blue-700 hover:bg-blue-50 border border-slate-200 shadow-sm transition"
          >
            <Crosshair className="w-3.5 h-3.5 text-blue-600" />
            <span>NH-44 Focus</span>
          </button>
        )}

        {/* Toggle Layer Control Drawer */}
        <button
          onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-mono rounded-lg border shadow-sm transition ${
            isLayerPanelOpen
              ? 'bg-blue-600 text-white border-blue-600 font-bold'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border-slate-200 font-medium'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        {/* Reset Camera View */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              if (routeSegments.length > 0) {
                const bounds = L.latLngBounds(routeSegments.map((s) => [s.start_lat, s.start_lng]));
                mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
              } else if (selectedRoad) {
                mapInstanceRef.current.setView(
                  [(selectedRoad.start_lat + selectedRoad.end_lat) / 2, (selectedRoad.start_lng + selectedRoad.end_lng) / 2],
                  13
                );
              } else {
                panIndiaView();
              }
            }
          }}
          title="Reset Camera View"
          className="p-1.5 bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="p-1.5 bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm transition"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable GIS Layer Control Panel */}
      {isLayerPanelOpen && (
        <div className="absolute top-14 left-3 z-[400] w-64 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-md font-mono text-xs space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="font-bold text-[#172B4D]">GIS MAP LAYERS</span>
            <button
              onClick={() => setIsLayerPanelOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-700">
            {routeSegments.length > 0 && (
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-blue-700 pb-1 border-b border-slate-100">
                <input
                  type="checkbox"
                  checked={showRouteOverlay}
                  onChange={(e) => setShowRouteOverlay(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Route & 100m Segments</span>
              </label>
            )}

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBlackSpots}
                onChange={(e) => setShowBlackSpots(e.target.checked)}
                className="rounded text-red-600 focus:ring-0"
              />
              <span>Black Spots (MoRTH SI ≥ 10)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer pl-4 text-slate-500">
              <input
                type="checkbox"
                checked={showBuffers}
                onChange={(e) => setShowBuffers(e.target.checked)}
                disabled={!showBlackSpots}
                className="rounded text-red-600 focus:ring-0"
              />
              <span>500m Hazard Buffers</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAccidents}
                onChange={(e) => setShowAccidents(e.target.checked)}
                className="rounded text-amber-600 focus:ring-0"
              />
              <span>Crash Concentration Pins</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDefects}
                onChange={(e) => setShowDefects(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Optical Defect Detections</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSegments}
                onChange={(e) => setShowSegments(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-0"
              />
              <span>100m Corridor Segments</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={(e) => setShowBoundary(e.target.checked)}
                className="rounded text-sky-600 focus:ring-0"
              />
              <span>10 km Boundary Swath</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showStations}
                onChange={(e) => setShowStations(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0"
              />
              <span>Landmark Survey Stations</span>
            </label>
          </div>
        </div>
      )}

      {/* Bottom Information & Satellite Imagery Metadata Strip */}
      <div className="absolute bottom-2 right-3 z-[400] flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[10px] font-mono text-slate-300 flex items-center space-x-3 shadow-md">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-semibold">
              {basemap === 'satellite' ? satelliteProviderName : basemap === 'terrain' ? 'ESRI World Topographic' : 'OpenStreetMap / CARTO'}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Zoom: {currentZoom} / 19</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300 font-medium">Static survey orthoimagery &bull; not live video</span>
        </div>
      </div>
    </div>
  );
};
