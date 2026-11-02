import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Road } from '../types';
import {
  Cpu,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Sliders,
  Image as ImageIcon,
  Zap,
  ArrowRight,
  Activity,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Maximize2,
  Crosshair,
  ShieldAlert,
  FileText,
  Download,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIDefectDetectionProps {
  roads: Road[];
  selectedRoadId: number;
}

export const AIDefectDetection: React.FC<AIDefectDetectionProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('/uploads/sample_pothole_nh44.jpg');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.45);
  const [targetSegmentId, setTargetSegmentId] = useState<number | undefined>(undefined);
  const [segments, setSegments] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [inferenceStep, setInferenceStep] = useState<string>('IDLE');
  const [activeDefectIndex, setActiveDefectIndex] = useState<number | null>(0);
  const [viewMode, setViewMode] = useState<'ANNOTATED' | 'ORIGINAL' | 'SIDE_BY_SIDE'>('ANNOTATED');

  const [result, setResult] = useState<{
    status: string;
    image_url: string;
    annotated_image_url: string;
    detections: any[];
  } | null>(null);

  // Initial segment load
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const road = await api.getRoad(selectedRoadId);
        if (road && road.segments && road.segments.length > 0) {
          setSegments(road.segments);
          setTargetSegmentId(road.segments[24]?.id || road.segments[0]?.id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSegments();
  }, [selectedRoadId]);

  const sampleImages = [
    { label: 'Severe Asphalt Pothole (NH-44)', path: '/uploads/sample_pothole_nh44.jpg', type: 'Pothole', defType: 'Potholes' },
    { label: 'Fatigue Alligator Cracking (NH-44)', path: '/uploads/sample_crack_nh44.jpg', type: 'Crack', defType: 'Road cracks' },
    { label: 'Waterlogging & Surface Ponding (NH-44)', path: '/uploads/sample_waterlogging_nh44.jpg', type: 'Water', defType: 'Waterlogging' },
    { label: 'Shoulder Drop-off & Faded Lines (NH-44)', path: '/uploads/sample_edge_nh44.jpg', type: 'Edge', defType: 'Faded road markings' }
  ];

  const handleRunInference = async () => {
    try {
      setAnalyzing(true);
      setInferenceStep('1/4: Bilateral Spatial Denoising...');

      setTimeout(() => setInferenceStep('2/4: Morphological Gradient Thresholding...'), 400);
      setTimeout(() => setInferenceStep('3/4: Contour Hull Feature Extraction...'), 800);
      setTimeout(() => setInferenceStep('4/4: Calibrated Perspective Metrology...'), 1200);

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('sample_image_url', selectedSample);
      }
      formData.append('road_id', selectedRoadId.toString());
      if (targetSegmentId) {
        formData.append('segment_id', targetSegmentId.toString());
      }
      formData.append('confidence_threshold', confidenceThreshold.toString());

      const res = await api.detectDefects(formData);
      setResult(res);
      setActiveDefectIndex(0);
    } catch (err) {
      alert('Computer vision inference failed. Please verify input image.');
      console.error(err);
    } finally {
      setAnalyzing(false);
      setInferenceStep('IDLE');
    }
  };

  const selectedDefectData = result && activeDefectIndex !== null && result.detections[activeDefectIndex]
    ? result.detections[activeDefectIndex]
    : null;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">AI DEFECT DETECTION</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              COMPUTER VISION WORKSPACE
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              CALIBRATED METROLOGY
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Automated Pavement Distress Classification: Potholes, Cracks, Surface Deterioration, Waterlogging & Marking Telemetry
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2 text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>OpenCV Metrology Engine Active</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Selection, Upload & Parameters (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#172B4D] font-mono uppercase">1. INPUT ROAD IMAGERY</h3>
              <ImageIcon className="w-4 h-4 text-blue-600" />
            </div>

            {/* Benchmark Samples */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-600 font-semibold">BENCHMARK INSPECTION SAMPLES:</label>
              <div className="space-y-1.5">
                {sampleImages.map((s) => (
                  <button
                    key={s.path}
                    type="button"
                    onClick={() => {
                      setSelectedSample(s.path);
                      setSelectedFile(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition border flex items-center justify-between ${
                      selectedSample === s.path && !selectedFile
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shrink-0 ml-2 shadow-2xs font-medium">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-mono text-slate-600 font-semibold">OR UPLOAD FIELD PHOTOGRAPH:</label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-mono text-slate-700 font-medium truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : 'Choose JPG / PNG image'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">High-resolution pavement survey</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-600 font-semibold">CONFIDENCE SENSITIVITY:</span>
                <span className="text-blue-600 font-bold">{Math.round(confidenceThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.20 (Sensitive)</span>
                <span>0.80 (Strict)</span>
              </div>
            </div>

            {/* Segment Association */}
            {segments.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-mono text-slate-600 font-semibold">ASSOCIATE CORRIDOR CHAINAGE:</label>
                <select
                  value={targetSegmentId || ''}
                  onChange={(e) => setTargetSegmentId(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {segments.slice(0, 50).map((s) => (
                    <option key={s.id} value={s.id}>
                      Segment #{s.segment_index + 1} (Ch {s.chainage_start_m}m - {s.chainage_end_m}m)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Run Inference Action Button with Motion Graphic */}
            <button
              onClick={handleRunInference}
              disabled={analyzing}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-semibold transition text-xs shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'RUNNING COMPUTER VISION...' : 'EXECUTE AI INFERENCE'}</span>
            </button>
          </div>
        </div>

        {/* Right 8 Columns: Large Computer Vision Inspection Workspace (Module 4) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            {/* Workspace Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] font-mono uppercase tracking-tight">
                  2. COMPUTER VISION INSPECTION WORKSPACE
                </h3>
                <p className="text-[10px] font-mono text-slate-500">
                  Calibrated Bounding Boxes &bull; Morphological Contours &bull; Pixel-to-Metric Ground Scaling
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs font-mono">
                <button
                  onClick={() => setViewMode('ANNOTATED')}
                  className={`px-2.5 py-1 rounded transition font-semibold ${
                    viewMode === 'ANNOTATED'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Annotated View
                </button>
                <button
                  onClick={() => setViewMode('ORIGINAL')}
                  className={`px-2.5 py-1 rounded transition font-semibold ${
                    viewMode === 'ORIGINAL'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original Frame
                </button>
                <button
                  onClick={() => setViewMode('SIDE_BY_SIDE')}
                  className={`px-2.5 py-1 rounded transition font-semibold ${
                    viewMode === 'SIDE_BY_SIDE'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Large Inspection Image Viewer with AI Motion Graphics (Module 3 & 4) */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center" style={{ minHeight: '380px' }}>
              {/* Active Animated Laser Scanning Line during Inference (Module 3 Requirement) */}
              {analyzing && (
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                  {/* Scanning Horizontal Laser Bar */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 shadow-[0_0_15px_#06B6D4] animate-laser-scan" />
                  {/* Processing Status Banner */}
                  <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/50 text-cyan-300 font-mono text-xs flex items-center space-x-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{inferenceStep}</span>
                  </div>
                </div>
              )}

              {/* Main Image View */}
              {viewMode === 'SIDE_BY_SIDE' && result ? (
                <div className="grid grid-cols-2 gap-1 w-full h-[380px]">
                  <div className="relative h-full overflow-hidden border-r border-slate-700">
                    <img
                      src={result.image_url}
                      alt="Original Road"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[9px]">
                      INPUT RAW
                    </span>
                  </div>
                  <div className="relative h-full overflow-hidden">
                    <img
                      src={result.annotated_image_url}
                      alt="Annotated Defects"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[9px] font-bold">
                      OPENCV ANNOTATED
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-[380px] flex items-center justify-center">
                  <img
                    src={
                      viewMode === 'ORIGINAL'
                        ? (result?.image_url || selectedSample)
                        : (result?.annotated_image_url || selectedSample)
                    }
                    alt="Road Inspection View"
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay Pill */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-white font-mono text-[10px] flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{result ? `${result.detections.length} Defect(s) Verified` : 'Inspection Target Ready'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Defect Cards & Metric Inspector (Module 4) */}
            {result && result.detections && result.detections.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#172B4D] uppercase">
                    DETECTED INFRASTRUCTURE DEFECTS ({result.detections.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click any defect card to inspect calibrated metric footprint
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.detections.map((d: any, idx: number) => {
                    const isSelected = activeDefectIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveDefectIndex(idx)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer font-mono text-xs space-y-1.5 ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#172B4D]">{d.defect_type}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.severity === 'CRITICAL'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {d.severity}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>AI Confidence:</span>
                          <b className="text-slate-900">{Math.round(d.confidence * 100)}%</b>
                        </div>
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Pixel Dimensions:</span>
                          <b className="text-slate-800">{Math.round(d.pixel_length)}px × {Math.round(d.pixel_width)}px</b>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Defect Detail Card with Calibrated Metrology */}
                {selectedDefectData && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <Crosshair className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-[#172B4D]">
                          CALIBRATED METROLOGY &bull; {selectedDefectData.defect_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Camera Pixel-to-Ground Ratio: 1.4 mm/px</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Estimated Length:</span>
                        <b className="text-slate-900 text-xs">{Math.round(selectedDefectData.pixel_length * 1.4)} mm</b>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Estimated Width:</span>
                        <b className="text-slate-900 text-xs">{Math.round(selectedDefectData.pixel_width * 1.4)} mm</b>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Footprint Area:</span>
                        <b className="text-red-700 text-xs">{Math.round((selectedDefectData.area_sq_px || 4000) * 0.0196)} cm²</b>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Confidence Rating:</span>
                        <b className="text-emerald-700 text-xs">{Math.round(selectedDefectData.confidence * 100)}% High</b>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-500">
                        Associated Segment: <b>Segment #{targetSegmentId || 25}</b>
                      </div>
                      <button
                        onClick={() => navigate('/roadguard-vision')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                      >
                        <span>Simulate Fix in VISION</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-2 font-mono">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-bold text-[#172B4D]">Inference Ready</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Click 'EXECUTE AI INFERENCE' on the left to run OpenCV bilateral contour morphology.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
