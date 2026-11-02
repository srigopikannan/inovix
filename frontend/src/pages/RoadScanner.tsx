import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Road, RoadSegment, DefectDetection } from '../types';
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  Filter,
  Camera,
  Layers,
  FileCheck,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadScannerProps {
  roads: Road[];
  selectedRoadId: number;
}

export const RoadScanner: React.FC<RoadScannerProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [road, setRoad] = useState<(Road & { segments: RoadSegment[] }) | null>(null);
  const [defects, setDefects] = useState<DefectDetection[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'DEFECTS' | 'CRITICAL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const [rData, defs] = await Promise.all([
          api.getRoad(selectedRoadId),
          api.getDefects(selectedRoadId)
        ]);
        setRoad(rData);
        setDefects(defs);
        if (rData.segments.length > 0) {
          setSelectedSegment(rData.segments[24] || rData.segments[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [selectedRoadId]);

  const activeDefectsForSegment = defects.filter(
    (d) => selectedSegment && d.segment_id === selectedSegment.id
  );

  const segments = road?.segments || [];
  const filteredSegments = segments.filter((s) => {
    if (filterMode === 'DEFECTS') return s.defect_count > 0;
    if (filterMode === 'CRITICAL') return s.risk_level === 'CRITICAL' || s.health_score < 50;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ROAD SCANNER</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              SIGNATURE 10-KM INSPECTION WORKFLOW
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Standard 100-Metre Discretized Chainage Grid (100 Segments per 10km Route) with Optical Evidence Traces
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => navigate('/defect-detection')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs font-semibold"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Inspection Photos</span>
          </button>
        </div>
      </div>

      {/* Corridor Route Header Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-blue-600 font-bold">{road?.code}</div>
            <h2 className="text-base font-bold text-[#172B4D] mt-0.5">{road?.name}</h2>
            <div className="flex items-center space-x-4 text-xs font-mono text-slate-500 mt-2">
              <span>Total Length: <b className="text-slate-800">{road?.length_km} km</b></span>
              <span>•</span>
              <span>Total Segments: <b className="text-slate-800">{segments.length} (100m ea)</b></span>
              <span>•</span>
              <span>Carriageway: <b className="text-slate-800">{road?.lane_count} Lanes</b></span>
              <span>•</span>
              <span>Class: <b className="text-slate-800">{road?.highway_class}</b></span>
            </div>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs font-mono shadow-xs">
            <div>
              <div className="text-slate-500 text-[10px] font-semibold">INSPECTION STATUS</div>
              <div className="text-emerald-700 font-bold flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% SURVEYED</span>
              </div>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <div className="text-slate-500 text-[10px] font-semibold">DEFECTS DETECTED</div>
              <div className="text-red-600 font-bold mt-0.5">{defects.length} ACTIVE DEFECTS</div>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Kilometre Grid Matrix (100 segments) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Segments Matrix View (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D] font-mono">100-METRE SEGMENT DISCRETIZATION MATRIX</h3>
              <p className="text-[10px] font-mono text-slate-500">10-Kilometre Corridor Broken Into 100 Consecutive 100m Segments</p>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterMode === 'ALL' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All (100)
              </button>
              <button
                onClick={() => setFilterMode('DEFECTS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterMode === 'DEFECTS' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Defects Only
              </button>
              <button
                onClick={() => setFilterMode('CRITICAL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${filterMode === 'CRITICAL' ? 'bg-red-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Critical
              </button>
            </div>
          </div>

          {/* 100 Segments Visual Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-[440px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
            {filteredSegments.map((seg) => {
              const isSelected = selectedSegment?.id === seg.id;
              let bg = 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
              if (seg.health_score < 40) bg = 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
              else if (seg.health_score < 55) bg = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
              else if (seg.health_score < 75) bg = 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100';

              return (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg)}
                  className={`p-2 rounded-lg text-center border font-mono transition text-[10px] flex flex-col items-center justify-center shadow-2xs ${bg} ${
                    isSelected ? 'ring-2 ring-blue-600 shadow-md scale-105 z-10' : ''
                  }`}
                  title={`Segment ${seg.segment_index}: Ch ${seg.chainage_start_m}m-${seg.chainage_end_m}m | Health: ${seg.health_score}`}
                >
                  <span className="font-bold">#{seg.segment_index}</span>
                  <span className="text-[9px] opacity-80">{seg.health_score}</span>
                  {seg.defect_count > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5 animate-ping"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
            <span>Color Legend: <span className="text-emerald-700 font-bold">Green (Good)</span> | <span className="text-amber-700 font-bold">Amber (Fair)</span> | <span className="text-red-600 font-bold">Red (Critical Defect)</span></span>
            <span className="font-semibold text-slate-700">Selected: Ch {selectedSegment?.chainage_start_m}m - {selectedSegment?.chainage_end_m}m</span>
          </div>
        </div>

        {/* Selected Segment Inspection Evidence Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] font-mono">INSPECTION EVIDENCE</h3>
                <p className="text-[10px] font-mono text-slate-500">Segment Photographic Log</p>
              </div>
              <Camera className="w-4 h-4 text-blue-600" />
            </div>

            {selectedSegment ? (
              <div className="mt-4 space-y-4 text-xs font-mono">
                {/* Segment Header */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#172B4D]">Ch {selectedSegment.chainage_start_m}m - {selectedSegment.chainage_end_m}m</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      Segment #{selectedSegment.segment_index}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1.5">
                    Health Rating: <b className="text-slate-900">{selectedSegment.health_score}/100</b> | Risk: <b className="text-red-600">{selectedSegment.risk_level}</b>
                  </div>
                </div>

                {/* Evidence Image / Defects */}
                {activeDefectsForSegment.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-slate-800 font-semibold text-[11px]">SURFACE DEFECT EVIDENCE:</div>
                    {activeDefectsForSegment.map((d) => (
                      <div key={d.id} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                        <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={d.annotated_image_url || d.image_url}
                            alt="Defect Evidence"
                            className="w-full h-36 object-cover"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold shadow-xs">
                            {d.defect_type.toUpperCase()} ({d.severity})
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                          <span>AI Confidence: <b className="text-slate-900">{Math.round(d.confidence * 100)}%</b></span>
                          <span>Est. Area: <b className="text-slate-900">{d.estimated_area_cm2} cm²</b></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-90" />
                    <div className="font-medium text-slate-700">No major surface defects detected on this 100m segment.</div>
                    <div className="text-[10px] mt-1 text-slate-400">Pavement within standard IRI tolerance bounds.</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              Segment Action Pathways:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => navigate('/road-explorer')}
                className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-mono font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs col-span-2"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Explore Street-Level 180° / 360° Panorama</span>
              </button>
              <button
                onClick={() => navigate('/defect-detection')}
                className="py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-mono font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Run AI Defect Scan</span>
              </button>
              <button
                onClick={() => navigate('/roadguard-vision')}
                className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-mono font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate in VISION</span>
              </button>
              <button
                onClick={() => navigate('/road-health')}
                className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-mono font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Health Index</span>
              </button>
              <button
                onClick={() => navigate('/risk-analysis')}
                className="py-2 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-mono font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Risk Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
