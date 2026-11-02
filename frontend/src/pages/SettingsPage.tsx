import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle,
  Sliders,
  Scale,
  Shield,
  Camera
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    confidence_threshold: 0.45,
    cluster_radius_meters: 500.0,
    morth_fatal_weight: 5.0,
    morth_severe_weight: 3.0,
    morth_minor_weight: 1.0,
    sor_contingency_pct: 5.0,
    camera_mount_height_m: 1.8,
    camera_fov_degrees: 60.0
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.settings) setSettings(res.settings);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">SYSTEM SETTINGS</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              CALIBRATION & REGULATORY PARAMETERS
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Fine-Tune Computer Vision Confidence, MoRTH Weightings, and Sensor Geometry
          </p>
        </div>

        {saved && (
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Parameters Successfully Applied</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
        {/* Card 1: MoRTH / IRC Protocol Weightings */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-red-600 font-bold border-b border-slate-100 pb-2">
            <Shield className="w-4 h-4" />
            <span>MoRTH / IRC:SP:88-2019 PROTOCOL WEIGHTINGS</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-600 font-semibold">CLUSTER RADIUS BUFFER (METERS)</label>
              <input
                type="number"
                value={settings.cluster_radius_meters}
                onChange={(e) => setSettings({ ...settings, cluster_radius_meters: parseFloat(e.target.value) || 500 })}
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">Statutory cluster window for corridor concentration (Standard: 500m)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-600 font-semibold">FATALITY</label>
                <input
                  type="number"
                  value={settings.morth_fatal_weight}
                  disabled
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">Fixed MoRTH: 5.0</span>
              </div>
              <div>
                <label className="text-slate-600 font-semibold">SEVERE</label>
                <input
                  type="number"
                  value={settings.morth_severe_weight}
                  disabled
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">Fixed MoRTH: 3.0</span>
              </div>
              <div>
                <label className="text-slate-600 font-semibold">MINOR</label>
                <input
                  type="number"
                  value={settings.morth_minor_weight}
                  disabled
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[9px] text-slate-500 font-sans mt-0.5 block">Fixed MoRTH: 1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Computer Vision & Metrology Calibration */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-700 font-bold border-b border-slate-100 pb-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>AI VISION & SENSOR GEOMETRY</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between">
                <label className="text-slate-600 font-semibold">DEFAULT INFERENCE CONFIDENCE CUTOFF</label>
                <span className="text-blue-600 font-bold">{Math.round(settings.confidence_threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.75"
                step="0.05"
                value={settings.confidence_threshold}
                onChange={(e) => setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })}
                className="w-full mt-1 accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-600 font-semibold">CAMERA HEIGHT (METERS)</label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.camera_mount_height_m}
                  onChange={(e) => setSettings({ ...settings, camera_mount_height_m: parseFloat(e.target.value) || 1.8 })}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold">LENS FOV (DEG)</label>
                <input
                  type="number"
                  value={settings.camera_fov_degrees}
                  onChange={(e) => setSettings({ ...settings, camera_fov_degrees: parseFloat(e.target.value) || 60.0 })}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold">MAINTENANCE BUFFER CONTINGENCY (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.sor_contingency_pct}
                onChange={(e) => setSettings({ ...settings, sor_contingency_pct: parseFloat(e.target.value) || 5.0 })}
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-mono font-semibold transition text-xs shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>SAVE PARAMETERS</span>
          </button>
        </div>
      </form>
    </div>
  );
};
