import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CommandCenterData, Road, BlackSpot, Accident, DefectDetection, RoadSegment } from '../types';
import { StatCard } from '../components/StatCard';
import { LeafletMap } from '../components/LeafletMap';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  ShieldAlert,
  MapPin,
  Car,
  AlertTriangle,
  Cpu,
  Activity,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Layers,
  Radio,
  Zap,
  Eye,
  FileText,
  Navigation,
  Clock,
  ExternalLink,
  ChevronRight,
  Crosshair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommandCenterProps {
  roads: Road[];
  selectedRoadId: number;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [roadDetails, setRoadDetails] = useState<(Road & { segments: RoadSegment[] }) | null>(null);
  const [blackspots, setBlackspots] = useState<BlackSpot[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [defects, setDefects] = useState<DefectDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cc, rDetails, bs, accs, defs] = await Promise.all([
        api.getCommandCenter(),
        api.getRoad(selectedRoadId),
        api.getBlackSpots(selectedRoadId),
        api.getAccidents(selectedRoadId),
        api.getDefects(selectedRoadId)
      ]);
      setData(cc);
      setRoadDetails(rDetails);
      setBlackspots(bs);
      setAccidents(accs);
      setDefects(defs);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRoadId]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await api.recalculateBlackSpots();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500 font-bold">Synchronizing Live Geospatial Telemetry...</span>
        </div>
      </div>
    );
  }

  const kpis = data.kpis;
  const activeRoad = roads.find((r) => r.id === selectedRoadId) || roads[0];

  return (
    <div className="space-y-7 pb-16">
      {/* 1. Header Banner with System Status Radar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black tracking-tight text-[#172B4D]">COMMAND CENTER</h1>
            <span className="flex items-center space-x-2 text-[11px] font-mono px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>LIVE GEOSPATIAL TELEMETRY</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Executive Black Spot Identification, Road Network Health & AI-Powered Infrastructure Surveillance
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center space-x-2 px-3.5 py-2 glass-panel-elevated hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs disabled:opacity-50 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-blue-600' : ''}`} />
            <span>{recalculating ? 'Recalculating SI...' : 'Recalculate Clusters'}</span>
          </button>

          <button
            onClick={() => navigate('/roadguard-vision')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm font-bold cursor-pointer"
          >
            <span>Launch VISION Simulator</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Grid (8 Animated Counters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Roads"
          value={kpis.total_roads}
          numericValue={kpis.total_roads}
          subtitle="National Highways Active"
          icon={MapPin}
          badge="3 Corridors"
          badgeColor="blue"
        />
        <StatCard
          title="Kilometres Inspected"
          value={`${kpis.total_km_inspected} km`}
          numericValue={kpis.total_km_inspected}
          suffix=" km"
          subtitle="Discrete 100m Units"
          icon={Activity}
          badge="180 Segments"
          badgeColor="emerald"
        />
        <StatCard
          title="Accident Records"
          value={kpis.total_accidents}
          numericValue={kpis.total_accidents}
          subtitle="Multi-Year Audit Database"
          icon={Car}
          badge="NT15 Audited"
          badgeColor="amber"
        />
        <StatCard
          title="Identified Black Spots"
          value={kpis.identified_black_spots}
          numericValue={kpis.identified_black_spots}
          subtitle="MoRTH SI ≥ 10.0 Zones"
          icon={AlertTriangle}
          badge="Critical"
          badgeColor="red"
        />
        <StatCard
          title="High-Risk Segments"
          value={kpis.high_risk_segments}
          numericValue={kpis.high_risk_segments}
          subtitle="Health Score < 65 / 100"
          icon={ShieldAlert}
          badge="Targeted"
          badgeColor="red"
        />
        <StatCard
          title="Detected Defects"
          value={kpis.detected_defects}
          numericValue={kpis.detected_defects}
          subtitle="Computer Vision Inferences"
          icon={Cpu}
          badge="AI Verified"
          badgeColor="blue"
        />
        <StatCard
          title="Hazard Clusters"
          value={blackspots.length}
          numericValue={blackspots.length}
          subtitle="500m MoRTH Buffers"
          icon={AlertTriangle}
          badge="Statutory"
          badgeColor="red"
        />
        <StatCard
          title="Average Health"
          value={`${Math.round(activeRoad?.average_health_score || 88)}/100`}
          numericValue={Math.round(activeRoad?.average_health_score || 88)}
          suffix=" / 100"
          subtitle="Corridor Structural Health"
          icon={TrendingUp}
          badge="Good Index"
          badgeColor="emerald"
        />
      </div>

      {/* 3. Large Interactive Map & Geospatial Operations Display (Section 5 & 6) */}
      <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-sm font-bold text-[#172B4D] font-mono tracking-tight uppercase">
                GEOSPATIAL ROAD SURVEILLANCE & HAZARD CLUSTERING MAP
              </h2>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                SATELLITE BASEMAP ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Live National Corridors, 500m Statutory Black Spot Clusters, AI Defects & 100m Condition Telemetry
            </p>
          </div>

          <button
            onClick={() => navigate('/gis-explorer')}
            className="text-xs font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1.5 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 transition"
          >
            <span>Open India GIS Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Embedded Interactive Map */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <LeafletMap
            roads={roads}
            selectedRoad={roadDetails || undefined}
            accidents={accidents}
            blackspots={blackspots}
            defects={defects}
            height="480px"
            initialBasemap="satellite"
          />
        </div>

        {/* Map Legend & Telemetry Indicators */}
        <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-2xs" />
              <span>MoRTH Black Spot (SI ≥ 10.0)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Accident Density Pin</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>AI Pothole / Defect</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>100m Inspected Segment</span>
            </div>
          </div>
          <span className="text-slate-500 text-[11px]">
            Active Corridor: <b className="text-slate-900">{activeRoad?.name}</b> ({activeRoad?.length_km} km)
          </span>
        </div>
      </div>

      {/* 4. Visualizations Row: Casualty Breakdown, Road Condition Distribution, Defect Inferences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Casualty Severity Breakdown */}
        <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Casualty Severity Breakdown</h3>
                <p className="text-[11px] font-mono text-slate-500">MoRTH / IRC:SP:88-2019 Empirical Weights</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {data.severity_distribution.map((sev) => {
                const total = kpis.total_accidents || 1;
                const pct = Math.round((sev.count / total) * 100);
                return (
                  <div key={sev.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{sev.name}</span>
                      <span className="font-mono text-slate-500">{sev.count} incidents ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: sev.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
            <span className="text-[#172B4D] font-bold">Severity Formula:</span> SI = (5 × Fatal) + (3 × Severe) + (1 × Minor).
          </div>
        </div>

        {/* Road Health Condition Distribution */}
        <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Pavement Condition Distribution</h3>
                <p className="text-[11px] font-mono text-slate-500">100m Segments Infrastructure Health</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {data.condition_distribution.map((cond) => {
                const total = data.condition_distribution.reduce((acc, c) => acc + c.count, 0) || 1;
                const pct = Math.round((cond.count / total) * 100);
                return (
                  <div key={cond.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cond.name}</span>
                      <span className="font-mono text-slate-500">{cond.count} segments ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: cond.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center justify-between">
            <span>Critical Units: <b className="text-red-600">{kpis.high_risk_segments} Segments</b></span>
            <button
              onClick={() => navigate('/road-scanner')}
              className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
            >
              100m Grid &rarr;
            </button>
          </div>
        </div>

        {/* Infrastructure Defect Surveillance */}
        <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Computer Vision Defect Ledger</h3>
                <p className="text-[11px] font-mono text-slate-500">Optical Detection Pipeline Inferences</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-5 space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-medium">Asphalt Potholes:</span>
                <span className="text-red-600 font-bold">Bilateral Contours</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-medium">Structural Fatigue Cracks:</span>
                <span className="text-amber-700 font-bold">Canny Edge Density</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <span className="text-slate-700 font-medium">Waterlogging & Ponding:</span>
                <span className="text-blue-700 font-bold">Specular Reflection</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-800 flex items-center justify-between font-medium">
            <span>Verified Defects: <b className="text-blue-900">{kpis.detected_defects} items</b></span>
            <button
              onClick={() => navigate('/defect-detection')}
              className="text-white bg-blue-600 px-3.5 py-1.5 rounded-lg text-xs font-mono hover:bg-blue-700 transition shadow-xs font-bold cursor-pointer"
            >
              CV Workspace
            </button>
          </div>
        </div>
      </div>

      {/* 5. Identified Black Spots Table (MoRTH Protocol) */}
      <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Statutory Accident Black Spot Clusters (MoRTH Protocol)</h3>
            <p className="text-[11px] font-mono text-slate-500">500-Metre Corridor Clusters Exceeding Safety Thresholds (SI ≥ 10.0)</p>
          </div>
          <button
            onClick={() => navigate('/accidents')}
            className="text-xs font-mono text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-bold cursor-pointer"
          >
            <span>Full Accident Analysis</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">ZONE CODE</th>
                <th className="py-3 px-3.5">CLUSTER IDENTIFICATION</th>
                <th className="py-3 px-3.5">SEVERITY INDEX</th>
                <th className="py-3 px-3.5">CASUALTIES (F / S / M)</th>
                <th className="py-3 px-3.5">RISK TIER</th>
                <th className="py-3 px-3.5">PRIMARY FACTOR</th>
                <th className="py-3 px-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {blackspots.map((bs) => (
                <tr key={bs.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3.5 font-mono font-bold text-red-600">{bs.code}</td>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-[#172B4D]">{bs.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {bs.latitude.toFixed(4)}°N, {bs.longitude.toFixed(4)}°E (Radius: {bs.radius_meters}m)
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-mono font-bold text-red-600">
                    {bs.severity_index.toFixed(1)}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-slate-700">
                    <span className="text-red-600 font-bold">{bs.fatal_count}F</span> / <span className="text-amber-700 font-semibold">{bs.severe_count}S</span> / <span className="text-slate-500">{bs.minor_count}M</span>
                  </td>
                  <td className="py-3 px-3.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                      {bs.risk_tier}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 max-w-xs truncate font-medium">
                    {bs.classification_reason}
                  </td>
                  <td className="py-3 px-3.5 text-right">
                    <button
                      onClick={() => navigate('/roadguard-vision')}
                      className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 font-mono font-bold transition cursor-pointer"
                    >
                      Simulate Fix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Recent Inspection Activity Feed */}
      <div className="glass-panel-elevated rounded-3xl p-6 border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Recent Road Inspection Operations</h3>
            <p className="text-[11px] font-mono text-slate-500">Mobile Optical Scanner Runs & Telemetry Logs</p>
          </div>
          <button
            onClick={() => navigate('/road-scanner')}
            className="text-xs font-mono text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-bold cursor-pointer"
          >
            <span>All Inspection Sessions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {data.recent_inspections.map((insp) => (
            <div key={insp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-blue-300 transition">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-700">{insp.session_code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  {insp.status}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-800 truncate">{insp.road_name}</div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                <span>Date: {insp.date}</span>
                <span>Defects: <b className="text-red-600">{insp.defects_found} items</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
