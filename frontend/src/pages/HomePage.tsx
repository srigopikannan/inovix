import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Road, CommandCenterData, BlackSpot, Accident, DefectDetection } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import {
  Search,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  Car,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface HomePageProps {
  roads: Road[];
  selectedRoadId: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [blackspots, setBlackspots] = useState<BlackSpot[]>([]);
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [defects, setDefects] = useState<DefectDetection[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state - Default: Tiruppur to Pollachi (Tamil Nadu)
  const [startLocation, setStartLocation] = useState('Tiruppur (Old Bus Stand / Kumaran Road)');
  const [destination, setDestination] = useState('Pollachi (Central Bus Stand / Coimbatore Road)');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [cc, bs, accs, defs] = await Promise.all([
          api.getCommandCenter(),
          api.getBlackSpots(selectedRoadId),
          api.getAccidents(selectedRoadId),
          api.getDefects(selectedRoadId)
        ]);
        setData(cc);
        setBlackspots(bs);
        setAccidents(accs);
        setDefects(defs);
      } catch (err) {
        console.error('Failed to load homepage telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [selectedRoadId]);

  const kpis = data?.kpis;

  const handleInspectRoad = () => {
    navigate(`/explore?start=${encodeURIComponent(startLocation)}&dest=${encodeURIComponent(destination)}`);
  };

  const handleQuickRoute = (from: string, to: string) => {
    setStartLocation(from);
    setDestination(to);
    navigate(`/explore?start=${encodeURIComponent(from)}&dest=${encodeURIComponent(to)}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Welcoming Header & Search Bar */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>AI-Powered Road Safety & Pothole Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Check road conditions before you travel.
          </h1>
          <p className="text-base text-slate-600">
            Search any Indian highway to see verified road quality, detected potholes, and accident safety warnings.
          </p>
        </div>

        {/* Route Search Box */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Start Location Input */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Starting Location
                </label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="e.g. Cyber City, Gurugram"
                  className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Destination Input */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center space-x-3">
              <Navigation className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Connaught Place, New Delhi"
                  className="w-full text-sm font-semibold text-slate-800 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Quick Route Suggestions & Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="font-semibold text-slate-400 whitespace-nowrap">Tamil Nadu Corridors:</span>
              <button
                type="button"
                onClick={() => handleQuickRoute('Tiruppur (Old Bus Stand / Kumaran Road)', 'Pollachi (Central Bus Stand / Coimbatore Road)')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap text-xs font-medium cursor-pointer transition"
              >
                Tiruppur ↔ Pollachi
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Coimbatore (Gandhipuram / Cross Cut Road)', 'Chennai Central (Puratchi Thalaivar Dr. MGR Central)')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap text-xs font-medium cursor-pointer transition"
              >
                Coimbatore ↔ Chennai
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Erode (Central Bus Stand / Brough Road)', 'Salem (New Bus Stand / Four Roads)')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap text-xs font-medium cursor-pointer transition"
              >
                Erode ↔ Salem
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Madurai (Meenakshi Amman Temple / Goripalayam)', 'Dindigul (Rock Fort / Central Bus Stand)')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap text-xs font-medium cursor-pointer transition"
              >
                Madurai ↔ Dindigul
              </button>
              <button
                type="button"
                onClick={() => handleQuickRoute('Ooty / Udhagamandalam (Charing Cross)', 'Coonoor (Sim\'s Park / Mount Road)')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 whitespace-nowrap text-xs font-medium cursor-pointer transition"
              >
                Ooty ↔ Coonoor
              </button>
            </div>

            <button
              onClick={handleInspectRoad}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Inspect Road</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Simple Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Inspected Roads */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Inspected Roads</span>
              <Car className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {kpis?.total_roads || 3} <span className="text-base font-semibold text-slate-500">Highways</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {kpis?.total_km_inspected || 18} kilometres surveyed with AI optical sensors
            </div>
          </div>

          {/* Card 2: Detected Potholes */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Detected Potholes</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">
              {kpis?.detected_defects || 8} <span className="text-base font-semibold text-slate-500">Potholes & Cracks</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Identified with OpenCV computer vision & GPS coordinates
            </div>
          </div>

          {/* Card 3: Critical Sections */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Critical Road Sections</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-black text-red-600 tracking-tight">
              {kpis?.identified_black_spots || 2} <span className="text-base font-semibold text-slate-500">High-Risk Zones</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Accident black spots with MoRTH Severity Score ≥ 10.0
            </div>
          </div>
        </div>

        {/* Live Road View Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900">ROADGUARD LIVE ROAD VIEW</span>
                <span className="text-[10px] bg-blue-600 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  New Feature
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Explore any destination in India via high-res satellite imagery and inspect optical road-level evidence for defects.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/live-road-view')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
          >
            <span>Launch Live Road View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2. Large Interactive India Map */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Interactive Road Intelligence Map
            </h2>
            <p className="text-xs text-slate-500">
              Explore inspected corridors, zoom into hazardous sections, and tap on markers for details.
            </p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Open Fullscreen Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <LeafletMap
            roads={roads}
            accidents={accidents}
            blackspots={blackspots}
            defects={defects}
            height="500px"
            initialBasemap="street"
          />
        </div>

        {/* Simple Color Legend */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Good Road</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Moderate Wear</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span>Pothole / High Risk</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span>Not Yet Inspected</span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px]">
            Data updated from live optical survey runs
          </span>
        </div>
      </section>
    </div>
  );
};
