import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import type { Road, RoadSegment, DefectDetection, ReconstructionProposal } from '../types';
import {
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Wrench,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  FileDown,
  RotateCcw,
  Maximize2,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoadguardVisionPageProps {
  roads: Road[];
  selectedRoadId: number;
}

const REPAIR_ACTIONS = [
  { id: 'Pothole patching', label: 'Pothole Patching', desc: 'Polymer-modified asphalt mastic filling and edge compaction' },
  { id: 'Crack sealing', label: 'Crack Sealing', desc: 'Hot-pour rubberized bitumen band seal across longitudinal fissures' },
  { id: 'Road resurfacing', label: 'Road Resurfacing', desc: 'Stone Matrix Asphalt (SMA) micro-surfacing overlay 40mm' },
  { id: 'Road marking restoration', label: 'Road Marking Restoration', desc: 'IRC-35 retroreflective thermoplastic paint with glass beads' },
  { id: 'Streetlight installation or maintenance', label: 'Streetlight Installation', desc: '120W High-mast solar LED luminaire array and night photometric lux upgrade' },
  { id: 'Drainage improvement', label: 'Drainage Improvement', desc: 'Curb inlet desilting and side channel gradient realignment' },
  { id: 'Road sign replacement', label: 'Road Sign Replacement', desc: 'Class B microprismatic retroreflective hazard & chevron boards' }
];

export const RoadguardVisionPage: React.FC<RoadguardVisionPageProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [road, setRoad] = useState<(Road & { segments: RoadSegment[] }) | null>(null);
  const [defects, setDefects] = useState<DefectDetection[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number>(25);
  const [selectedActions, setSelectedActions] = useState<string[]>([
    'Pothole patching',
    'Road resurfacing',
    'Road marking restoration'
  ]);

  // Simulation Results
  const [simulation, setSimulation] = useState<{
    original_image_url: string;
    reconstructed_image_url: string;
    selected_actions: string[];
    disclaimer_label: string;
    cost_estimate: any;
  } | null>(null);

  // Slider State (0 to 100 percentage)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Proposals History
  const [proposals, setProposals] = useState<ReconstructionProposal[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Load Road, Defects, and Prior Proposals
  useEffect(() => {
    const initData = async () => {
      try {
        const [rData, defs, props] = await Promise.all([
          api.getRoad(selectedRoadId),
          api.getDefects(selectedRoadId),
          api.getProposals(selectedRoadId)
        ]);
        setRoad(rData);
        setDefects(defs);
        setProposals(props);

        // Pre-run simulation for segment 24/25
        runSimulation(24, ['Pothole patching', 'Road resurfacing', 'Road marking restoration']);
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, [selectedRoadId]);

  const runSimulation = async (segmentId?: number, actions?: string[]) => {
    try {
      setSimulating(true);
      setSavedSuccess(false);
      const targetSegId = segmentId || selectedSegmentId;
      const acts = actions || selectedActions;
      const segDefect = defects.find((d) => d.segment_id === targetSegId);
      const targetImg = segDefect?.image_url || '/uploads/sample_pothole_nh44.jpg';

      const res = await api.simulateReconstruction({
        road_id: selectedRoadId,
        segment_id: targetSegId,
        image_url: targetImg,
        selected_actions: acts
      });
      setSimulation(res);
    } catch (err) {
      console.error(err);
      alert('Reconstruction simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleActionToggle = (actionId: string) => {
    let updated: string[];
    if (selectedActions.includes(actionId)) {
      updated = selectedActions.filter((a) => a !== actionId);
    } else {
      updated = [...selectedActions, actionId];
    }
    setSelectedActions(updated);
  };

  const handleSaveProposal = async () => {
    if (!simulation) return;
    try {
      await api.saveProposal({
        road_id: selectedRoadId,
        segment_id: selectedSegmentId,
        title: `Carriageway Rehabilitation: Ch ${(selectedSegmentId - 1) * 100}m - ${selectedSegmentId * 100}m`,
        original_image_url: simulation.original_image_url,
        reconstructed_image_url: simulation.reconstructed_image_url,
        selected_actions: simulation.selected_actions,
        estimated_total_cost: 0.0,
        engineering_rationale: 'Rehabilitation proposal eliminates verified pothole void and restructures thermoplastic retroreflectivity.',
        created_by: 'Dr. Sarah Jenkins, P.E.'
      });
      setSavedSuccess(true);
      const props = await api.getProposals(selectedRoadId);
      setProposals(props);
    } catch (err) {
      alert('Failed to save proposal.');
    }
  };

  // Slider Mouse/Touch Handlers
  const handleMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6 select-none" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D] flex items-center space-x-2">
              <span>ROADGUARD VISION</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              FLAGSHIP BEFORE/AFTER RECONSTRUCTION SIMULATOR
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Segment-Level Pavement Rehabilitation Simulator with Interactive Spatial Reveal & Engineering Proposal Synthesis
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition shadow-xs font-medium"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Proposal PDF</span>
          </button>
        </div>
      </div>

      {/* 10-Step Workflow Breadcrumb Indicator */}
      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-mono text-slate-600 flex items-center justify-between overflow-x-auto gap-4 shadow-xs">
        <span className="flex items-center space-x-1.5 text-blue-700 font-bold shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Step 1-4: Route & 100m Segment Selected</span>
        </span>
        <span className="text-slate-300">→</span>
        <span className="flex items-center space-x-1.5 text-slate-800 font-semibold shrink-0">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Step 5: Proposed Repairs Selected ({selectedActions.length})</span>
        </span>
        <span className="text-slate-300">→</span>
        <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold shrink-0">
          <Eye className="w-4 h-4 text-emerald-600" />
          <span>Step 6-8: Interactive Slider Active</span>
        </span>
        <span className="text-slate-300">→</span>
        <span className="flex items-center space-x-1.5 text-purple-700 font-semibold shrink-0">
          <FileCheck className="w-4 h-4 text-purple-600" />
          <span>Step 9-10: Statutory Proposal Ledger</span>
        </span>
      </div>

      {/* Main Flagship Interactive Simulator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Segment Selector & Repair Action Checkboxes */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D] font-mono">1. SELECT SEGMENT & REPAIRS</h3>
              <p className="text-[10px] font-mono text-slate-500">Target Discretized 100m Corridor Chainage</p>
            </div>
            <Sliders className="w-4 h-4 text-blue-600" />
          </div>

          {/* Segment Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-600 font-semibold">TARGET 100M ROAD SEGMENT:</label>
            <select
              value={selectedSegmentId}
              onChange={(e) => {
                const sid = Number(e.target.value);
                setSelectedSegmentId(sid);
                runSimulation(sid);
              }}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {road?.segments?.slice(20, 32).map((s) => (
                <option key={s.id} value={s.id}>
                  Segment #{s.segment_index} (Ch {s.chainage_start_m}m - {s.chainage_end_m}m) | Health: {s.health_score} [{s.risk_level}]
                </option>
              ))}
            </select>
          </div>

          {/* Action Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-700 font-semibold">PROPOSED ENGINEERING ACTIONS:</span>
              <span className="text-[10px] text-blue-600 font-bold">{selectedActions.length} selected</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {REPAIR_ACTIONS.map((action) => {
                const isChecked = selectedActions.includes(action.id);
                return (
                  <label
                    key={action.id}
                    className={`block p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition ${
                      isChecked
                        ? 'bg-blue-50 border-blue-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleActionToggle(action.id)}
                        className="mt-0.5 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#172B4D]">{action.label}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
                          {action.desc}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => runSimulation()}
            disabled={simulating}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-semibold transition text-xs shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'GENERATING RECONSTRUCTION...' : 'RE-SIMULATE ROAD RECONSTRUCTION'}</span>
          </button>
        </div>

        {/* Center/Right Column (8 cols): Interactive Before-and-After Slider Canvas */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl p-5 flex flex-col justify-between shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D] font-mono">2. INTERACTIVE BEFORE-AND-AFTER COMPARISON</h3>
              <p className="text-[10px] font-mono text-slate-500">Drag Slider to Reveal Proposed Engineering Reconstruction</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-600">
              <span>Slider Position: <b className="text-blue-700">{Math.round(sliderPos)}%</b></span>
            </div>
          </div>

          {/* Interactive Split-View Comparison Slider Container */}
          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            className="relative w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 cursor-ew-resize select-none bg-slate-100 shadow-md"
          >
            {simulation ? (
              <>
                {/* Proposed Reconstructed Image (Background layer) */}
                <img
                  src={simulation.reconstructed_image_url}
                  alt="Proposed Reconstructed Road"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Original Damaged Image (Foreground clipped layer) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={simulation.original_image_url}
                    alt="Original Damaged Road"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}
                  />
                  {/* Left Label */}
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur text-red-700 border border-red-200 font-mono text-xs font-bold shadow-xs">
                    ORIGINAL DEFECT STATE
                  </span>
                </div>

                {/* Right Label */}
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur text-blue-700 border border-blue-200 font-mono text-xs font-bold shadow-xs">
                  PROPOSED RECONSTRUCTION
                </span>

                {/* Slider Dividing Bar */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg font-bold font-mono text-xs border-2 border-blue-600">
                    ↔
                  </div>
                </div>

                {/* MANDATORY STATUTORY DISCLAIMER BANNER (PER REQUIREMENT) */}
                <div className="absolute bottom-0 inset-x-0 bg-red-50/95 border-t border-red-200 px-4 py-2 z-30 text-center">
                  <div className="text-[11px] font-mono font-bold text-red-700 tracking-wider uppercase flex items-center justify-center space-x-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>AI-GENERATED PROPOSED RECONSTRUCTION - NOT AN ACTUAL COMPLETED ROAD.</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
                Generating visualization...
              </div>
            )}
          </div>

          {/* Interventions & Proposal Action Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-slate-500 font-semibold">PROPOSED REHABILITATION MEASURES:</div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {selectedActions.length} Synthesis Actions Configured
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Covers selected engineering treatments on Segment #{selectedSegmentId}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSaveProposal}
                disabled={savedSuccess}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white rounded-lg font-mono font-semibold text-xs shadow-xs transition flex items-center space-x-2"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Proposal Saved!</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Save Reconstruction Proposal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisation History & Saved Proposals */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] font-mono">RECONSTRUCTION PROPOSALS REPOSITORY</h3>
            <p className="text-[10px] font-mono text-slate-500">Formal Engineering Proposals Logged with Verified Statutory Disclaimers</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{proposals.length} Proposals Registered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs hover:border-slate-300 transition shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-700">{prop.proposal_code}</span>
                <span className="text-[10px] text-slate-500">{prop.created_at}</span>
              </div>
              <div className="font-semibold text-[#172B4D] font-sans text-xs">{prop.title}</div>
              <div className="relative rounded-lg overflow-hidden border border-slate-200 h-28">
                <img
                  src={prop.reconstructed_image_url}
                  alt="Reconstructed Proposal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-200">
                <span className="text-slate-500">Interventions:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {prop.selected_actions?.length || 3} Actions Applied
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
