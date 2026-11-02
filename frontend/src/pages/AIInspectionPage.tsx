import React, { useState } from 'react';
import { api } from '../services/api';
import type { Road } from '../types';
import {
  Upload,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';

interface AIInspectionPageProps {
  roads: Road[];
  selectedRoadId: number;
}

export const AIInspectionPage: React.FC<AIInspectionPageProps> = ({
  roads,
  selectedRoadId
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<string>('/uploads/sample_pothole_nh44.jpg');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<{
    status: string;
    image_url: string;
    annotated_image_url: string;
    detections: any[];
  } | null>(null);

  const sampleImages = [
    { label: 'Sample 1: Large Road Pothole', path: '/uploads/sample_pothole_nh44.jpg', type: 'Pothole' },
    { label: 'Sample 2: Surface Cracks', path: '/uploads/sample_crack_nh44.jpg', type: 'Crack' },
    { label: 'Sample 3: Waterlogging & Ponding', path: '/uploads/sample_waterlogging_nh44.jpg', type: 'Waterlogging' },
    { label: 'Sample 4: Normal Road', path: '/uploads/sample_edge_nh44.jpg', type: 'Normal Road' }
  ];

  const handleStartInspection = async () => {
    try {
      setAnalyzing(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('sample_image_url', selectedSample);
      }
      formData.append('road_id', selectedRoadId.toString());
      formData.append('confidence_threshold', '0.45');

      const res = await api.detectDefects(formData);
      setResult(res);
    } catch (err) {
      alert('Could not inspect the image. Please try again.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI ROAD INSPECTION</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Upload any road photograph to automatically detect potholes, road cracks, and surface damage using AI.
        </p>
      </div>

      {/* Main Two-Step Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Options (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Step 1: Choose a Road Photo</span>
            </h2>

            {/* Benchmark Samples */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Try a Sample Photo:</span>
              <div className="space-y-1">
                {sampleImages.map((s) => (
                  <button
                    key={s.path}
                    type="button"
                    onClick={() => {
                      setSelectedSample(s.path);
                      setSelectedFile(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between cursor-pointer ${
                      selectedSample === s.path && !selectedFile
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Or Upload Your Own Photo:</span>
              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 hover:bg-blue-50/50 transition">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : 'Click to select JPG / PNG photo'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">High-resolution pavement photo</span>
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

            {/* Start Button */}
            <button
              onClick={handleStartInspection}
              disabled={analyzing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Cpu className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing Road Surface...' : 'Start Inspection'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Visual Evidence & Results (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Step 2: Detection Results & Evidence</span>
              </h2>
              {result && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {result.detections.length} Defect(s) Identified
                </span>
              )}
            </div>

            {/* Image Viewer */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[340px]">
              {analyzing ? (
                <div className="text-center p-8 space-y-3">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-bold text-white">Scanning Road Surface...</div>
                  <p className="text-xs text-slate-400">Detecting potholes, edge cracks, and waterlogging.</p>
                </div>
              ) : (
                <img
                  src={result?.annotated_image_url || selectedSample}
                  alt="Road Inspection Result"
                  className="w-full h-auto max-h-[420px] object-cover"
                />
              )}
            </div>

            {/* Detected Defect Breakdown Cards */}
            {result && result.detections && result.detections.length > 0 ? (
              <div className="space-y-3 pt-1">
                <span className="text-xs font-bold text-slate-700 block">Identified Road Damage:</span>
                <div className="space-y-2">
                  {result.detections.map((d: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{d.defect_type}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          d.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.severity} Risk
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px]">AI Accuracy:</span>
                          <b className="text-slate-900">{Math.round(d.confidence * 100)}% Certain</b>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Estimated Area:</span>
                          <b className="text-slate-900">{Math.round((d.area_sq_px || 4000) * 0.0196)} cm²</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !analyzing ? (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-xs font-bold text-slate-700">Ready to Analyze</div>
                <p className="text-[11px] text-slate-400">
                  Select a sample above and click "Start Inspection" to see AI detection boxes.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
