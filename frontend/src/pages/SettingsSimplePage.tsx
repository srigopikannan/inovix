import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sliders,
  Info
} from 'lucide-react';

export const SettingsSimplePage: React.FC = () => {
  const [defaultBasemap, setDefaultBasemap] = useState<'street' | 'satellite'>('street');
  const [sensitivity, setSensitivity] = useState<'STANDARD' | 'HIGH'>('STANDARD');
  const [units, setUnits] = useState<'KM' | 'MILES'>('KM');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SETTINGS</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Customize your map view preferences, inspection alerts, and road safety units.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* 1. Map Preferences */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Map Display Preferences</span>
          </h2>
          <p className="text-xs text-slate-500">Choose your preferred default map style when opening road routes.</p>
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => setDefaultBasemap('street')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                defaultBasemap === 'street'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Normal Street Map
            </button>
            <button
              onClick={() => setDefaultBasemap('satellite')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                defaultBasemap === 'satellite'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Satellite Imagery
            </button>
          </div>
        </div>

        {/* 2. AI Inspection Sensitivity */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>AI Defect Detection Precision</span>
          </h2>
          <p className="text-xs text-slate-500">
            Adjust how strictly the AI model flags subtle pavement cracks and surface wear.
          </p>
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => setSensitivity('STANDARD')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                sensitivity === 'STANDARD'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Standard (Recommended for Potholes)
            </button>
            <button
              onClick={() => setSensitivity('HIGH')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                sensitivity === 'HIGH'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              High Precision (Detect Micro-Cracks)
            </button>
          </div>
        </div>

        {/* 3. Measurement Units */}
        <div className="space-y-3 pb-6 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Distance Units</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setUnits('KM')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                units === 'KM'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Kilometres (km / m)
            </button>
            <button
              onClick={() => setUnits('MILES')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                units === 'MILES'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Miles (mi)
            </button>
          </div>
        </div>

        {/* 4. About & Guidelines */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="flex items-center space-x-2 font-bold text-slate-900">
            <Info className="w-4 h-4 text-blue-600" />
            <span>About ROADGUARD AI</span>
          </div>
          <p>
            ROADGUARD AI is built according to <b>MoRTH / IRC:SP:88-2019</b> statutory guidelines for road safety audits and black spot identification.
          </p>
          <div className="text-[11px] text-slate-400">
            Version 2.4.0 &bull; Built with FastAPI & React
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
