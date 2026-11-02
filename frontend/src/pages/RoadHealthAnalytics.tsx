import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Road, RoadSegment } from '../types';
import {
  Activity,
  Layers,
  HelpCircle,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadHealthAnalyticsProps {
  roads: Road[];
  selectedRoadId: number;
}

export const RoadHealthAnalytics: React.FC<RoadHealthAnalyticsProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [road, setRoad] = useState<(Road & { segments: RoadSegment[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const data = await api.getRoad(selectedRoadId);
        setRoad(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [selectedRoadId]);

  const segments = road?.segments || [];
  const avgHealth = segments.length > 0
    ? segments.reduce((acc, s) => acc + s.health_score, 0) / segments.length
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ROAD HEALTH ANALYTICS</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              PAVEMENT CONDITION INDEX (PCI)
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Segment-Wise Structural Integrity Deductions, Roughness (IRI) Index & Corridor Health Scoring
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 shadow-xs">
            Average Health Index: <b className="text-emerald-700 font-bold">{avgHealth.toFixed(1)} / 100</b>
          </div>
        </div>
      </div>

      {/* Transparent Formula Inspector Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-blue-700 font-bold">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>TRANSPARENT SCIENTIFIC SCORING FORMULA</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-sans">
          The <b>Road Health Index (RHI)</b> is evaluated deterministically for every 100-meter segment without black-box bias.
          Deductions are calculated from verified defect detections and infrastructure conditions:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-red-600 font-bold text-sm">-18 pts</div>
            <div className="text-slate-600 text-[11px] font-sans mt-0.5">Critical Defect (Pothole void, severe alligator crack)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-amber-700 font-bold text-sm">-10 pts</div>
            <div className="text-slate-600 text-[11px] font-sans mt-0.5">High Severity Defect (Edge drop-off, ponding)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-blue-700 font-bold text-sm">-12 pts</div>
            <div className="text-slate-600 text-[11px] font-sans mt-0.5">Severely Blocked Drainage Channel</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <div className="text-slate-700 font-bold text-sm">-8 pts</div>
            <div className="text-slate-600 text-[11px] font-sans mt-0.5">Inoperative / Missing Streetlight Luminaire</div>
          </div>
        </div>
      </div>

      {/* Corridor Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roads.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl border text-xs font-mono transition shadow-xs ${
              r.id === selectedRoadId
                ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>{r.code}</span>
              <span className="text-slate-700 font-medium">{r.highway_class}</span>
            </div>
            <div className="text-sm font-bold text-[#172B4D] mt-1 truncate">{r.name}</div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-slate-500">Health Index:</span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {r.average_health_score} / 100
              </span>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>{r.length_km} km inspected</span>
              <span className="font-semibold text-slate-700">{r.blackspot_count} Black Spots</span>
            </div>
          </div>
        ))}
      </div>

      {/* Segment Health Roster Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] font-mono">SEGMENT-LEVEL CONDITION ROSTER</h3>
            <p className="text-[10px] font-mono text-slate-500">100-Meter Discretized Health & Roughness Parameters</p>
          </div>
          <button
            onClick={() => navigate('/road-scanner')}
            className="text-xs font-mono text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-semibold"
          >
            <span>Scan 100-Segment Route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">SEGMENT</th>
                <th className="py-2.5 px-3">CHAINAGE</th>
                <th className="py-2.5 px-3">HEALTH SCORE</th>
                <th className="py-2.5 px-3">CONDITION</th>
                <th className="py-2.5 px-3">ROUGHNESS (IRI)</th>
                <th className="py-2.5 px-3">ACTIVE DEFECTS</th>
                <th className="py-2.5 px-3">DRAINAGE</th>
                <th className="py-2.5 px-3">LIGHTING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {segments.slice(20, 35).map((seg) => (
                <tr key={seg.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#172B4D]">#{seg.segment_index}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Ch {seg.chainage_start_m}m - {seg.chainage_end_m}m</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={seg.health_score < 50 ? 'text-red-600' : seg.health_score < 75 ? 'text-amber-700' : 'text-emerald-700'}>
                      {seg.health_score} / 100
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      seg.risk_level === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                      seg.risk_level === 'HIGH' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      seg.risk_level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {seg.risk_level}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{seg.surface_roughness_iri} m/km</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {seg.defect_count > 0 ? <b className="text-red-600">{seg.defect_count} detected</b> : <span className="text-slate-400">None</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{seg.drainage_condition}</td>
                  <td className="py-2.5 px-3 font-mono text-xs">
                    {seg.streetlight_present ? <span className="text-emerald-700 font-semibold">Lighted</span> : <span className="text-red-600 font-semibold">Unlighted</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
