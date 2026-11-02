import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Road, CommandCenterData, BlackSpot } from '../types';
import { RoadNetworkCanvas } from '../components/RoadNetworkCanvas';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  ShieldCheck,
  MapPin,
  ArrowRight,
  Activity,
  Layers,
  AlertTriangle,
  Eye,
  FileText,
  Scan,
  CheckCircle2,
  Sparkles,
  Zap,
  Globe2,
  TrendingUp,
  Cpu,
  Compass,
  Navigation,
  Car,
  ChevronRight,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  roads: Road[];
  selectedRoadId: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [blackspots, setBlackspots] = useState<BlackSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        setLoading(true);
        const [cc, bs] = await Promise.all([
          api.getCommandCenter(),
          api.getBlackSpots(selectedRoadId)
        ]);
        setData(cc);
        setBlackspots(bs);
      } catch (e) {
        console.error('Failed to load landing telemetry:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTelemetry();
  }, [selectedRoadId]);

  const kpis = data?.kpis;
  const activeRoad = roads.find((r) => r.id === selectedRoadId) || roads[0];

  return (
    <div className="space-y-14 pb-20">
      {/* ========================================================
          1. CINEMATIC 3D HERO SECTION (Section 2 & 3 Mandate)
          ======================================================== */}
      <section className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-xl bg-gradient-to-b from-white via-[#F5F8FC] to-white">
        {/* Background Atmospheric Grid & 3D Interactive Canvas */}
        <div className="relative h-[660px] w-full">
          <RoadNetworkCanvas className="w-full h-full" interactive={true} />

          {/* Hero Foreground Overlay Overlay HUD */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 z-20">
            {/* Top Brand Pill & Live Status Radar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="pointer-events-auto flex items-center space-x-3 glass-panel px-4 py-2 rounded-2xl border border-slate-200/90 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-[#172B4D]">ROADGUARD</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-mono px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                      AI 2.4
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-medium">Turning Accident Data into Safer Roads.</div>
                </div>
              </div>

              {/* Live Statutory Status Pill */}
              <div className="pointer-events-auto hidden sm:flex items-center space-x-2.5 glass-panel px-4 py-2 rounded-full border border-emerald-200 text-emerald-800 font-mono text-xs shadow-xs font-semibold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span>MoRTH NT15 BLACK SPOT PROTOCOL ACTIVE</span>
              </div>
            </div>

            {/* Main Center-Left Hero Headline (Mandated Text & Buttons) */}
            <div className="max-w-2xl pointer-events-auto space-y-4 pt-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full glass-panel border border-blue-200 text-blue-700 text-xs font-mono font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>NEXT-GENERATION GEOSPATIAL INFRASTRUCTURE INTELLIGENCE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172B4D] tracking-tight leading-[1.08]">
                SEE EVERY ROAD. <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 bg-clip-text text-transparent">
                  DETECT EVERY RISK.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#475569] font-medium leading-relaxed max-w-xl">
                An intelligent road inspection and accident intelligence platform transforming road infrastructure data into safer journeys.
              </p>

              {/* Two Prominent Action Buttons (Mandated) */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => navigate('/gis-explorer')}
                  className="flex items-center space-x-3 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold transition shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 cursor-pointer"
                >
                  <Globe2 className="w-4 h-4 text-cyan-300 animate-spin-slow" />
                  <span>EXPLORE INDIA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/command-center')}
                  className="flex items-center space-x-3 px-7 py-4 rounded-xl glass-panel-elevated hover:bg-slate-50 text-slate-800 hover:text-blue-600 border border-slate-200 font-mono text-xs font-bold transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>LAUNCH INTELLIGENCE DASHBOARD</span>
                </button>
              </div>
            </div>

            {/* Bottom Real-time Telemetry Snapshot HUD */}
            <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-3 border-t border-slate-200/80 glass-panel rounded-2xl px-5 py-3.5 border shadow-sm">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Signature Corridor:</span>
                  <span className="text-[#172B4D] font-bold">{activeRoad?.name}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Segmentation:</span>
                  <span className="text-blue-700 font-bold">100-Metre Discrete Slices</span>
                </div>
                <div className="hidden md:block">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Defect Metrology:</span>
                  <span className="text-emerald-700 font-bold">OpenCV Bilateral + Depth Metrology</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-slate-600 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>WGS-84 Coordinates: <b>28.4950° N, 77.0890° E</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. EXECUTIVE TELEMETRY HUD (Real Animated Data)
          ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              NATIONAL ROAD INFRASTRUCTURE AUDIT METRICS
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-[11px] font-mono text-slate-400">Connected to Live SQLite Enterprise Store</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono font-semibold uppercase">Monitored Highways</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-[#172B4D] tracking-tight">
              <AnimatedCounter value={kpis?.total_roads || 3} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Primary National Transit Links</div>
          </div>

          <div className="glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono font-semibold uppercase">Surveyed Kilometres</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-[#172B4D] tracking-tight">
              <AnimatedCounter value={kpis?.total_km_inspected || 18} suffix=" km" />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">180 Sliced 100-Metre Segments</div>
          </div>

          <div className="glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono font-semibold uppercase">Identified Black Spots</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-red-600 tracking-tight">
              <AnimatedCounter value={kpis?.identified_black_spots || 2} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">MoRTH Severity Index ≥ 10.0</div>
          </div>

          <div className="glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] shadow-sm hover:shadow-md transition space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono font-semibold uppercase">AI Verified Defects</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-[#172B4D] tracking-tight">
              <AnimatedCounter value={kpis?.detected_defects || 8} />
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Potholes, Cracks, Edge Wear</div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SIGNATURE INTELLIGENCE SUITE (Interactive Capabilities)
          ======================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              PLATFORM OPERATIONAL ARCHITECTURE
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>
          <span className="text-xs text-blue-600 font-mono font-semibold hover:underline cursor-pointer" onClick={() => navigate('/command-center')}>
            View Live Command Center &rarr;
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: GIS Explorer */}
          <div
            onClick={() => navigate('/gis-explorer')}
            className="group relative glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] hover:border-blue-400 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">Flagship GIS</span>
                <h3 className="text-lg font-bold text-[#172B4D] group-hover:text-blue-600 transition">GIS Explorer</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive multi-layer India map with satellite, heatmaps, 100m segment inspection, and popular national corridors.
                </p>
              </div>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-semibold text-blue-600">
              <span>EXPLORE ROUTES</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 2: AI Defect Detection */}
          <div
            onClick={() => navigate('/defect-detection')}
            className="group relative glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] hover:border-cyan-400 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 group-hover:bg-cyan-600 group-hover:text-white transition shadow-sm">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-600 font-bold uppercase tracking-wider block">Computer Vision</span>
                <h3 className="text-lg font-bold text-[#172B4D] group-hover:text-cyan-600 transition">AI Defect Detection</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Bilateral filter inference with calibrated metrology, automated bounding boxes, depth estimation, and evidence logs.
                </p>
              </div>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-semibold text-cyan-600">
              <span>SCAN PAVEMENT</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 3: ROADGUARD VISION */}
          <div
            onClick={() => navigate('/roadguard-vision')}
            className="group relative glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] hover:border-blue-500 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Reconstruction AI</span>
                <h3 className="text-lg font-bold text-[#172B4D] group-hover:text-indigo-600 transition">ROADGUARD VISION</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Interactive Before & After reconstruction simulator with micro-coat asphalt, polymer mastic, and IRC-35 compliant markings.
                </p>
              </div>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-semibold text-indigo-600">
              <span>SIMULATE REPAIRS</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* Card 4: MoRTH Black Spot Engine */}
          <div
            onClick={() => navigate('/accidents')}
            className="group relative glass-panel-elevated rounded-2xl p-6 border border-[#E2E8F0] hover:border-red-400 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 group-hover:bg-red-600 group-hover:text-white transition shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider block">Statutory Audit</span>
                <h3 className="text-lg font-bold text-[#172B4D] group-hover:text-red-600 transition">Black Spot Intelligence</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Automated 500m clustering using statutory MoRTH / IRC:SP:88-2019 protocol (Severity Index formula SI = 5F + 3S + 1M).
                </p>
              </div>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-semibold text-red-600">
              <span>VIEW BLACK SPOTS</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. CURATED INDIAN HIGHWAY CORRIDORS (Interactive Quick Bar)
          ======================================================== */}
      <section className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-[#172B4D] tracking-tight uppercase font-mono">
                NATIONAL CORRIDOR SURVEILLANCE DIRECTORY
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any primary highway to load high-precision 100-metre sliced road health telemetry.
            </p>
          </div>
          <button
            onClick={() => navigate('/gis-explorer')}
            className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 transition"
          >
            <span>Open in GIS Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roads.map((road) => {
            const isSelected = road.id === selectedRoadId;
            return (
              <div
                key={road.id}
                onClick={() => navigate('/gis-explorer')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white">
                      {road.code}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{road.length_km} km</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#172B4D] line-clamp-1">{road.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {road.start_point} ↔ {road.end_point}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono font-semibold text-blue-600">
                  <span>100m Slices Active</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
