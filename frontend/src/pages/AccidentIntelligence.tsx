import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Accident, BlackSpot, Road } from '../types';
import { LeafletMap } from '../components/LeafletMap';
import {
  AlertTriangle,
  Plus,
  Filter,
  Calendar,
  ShieldAlert,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

interface AccidentIntelligenceProps {
  roads: Road[];
  selectedRoadId: number;
}

export const AccidentIntelligence: React.FC<AccidentIntelligenceProps> = ({
  roads,
  selectedRoadId
}) => {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [blackspots, setBlackspots] = useState<BlackSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // New accident form state
  const [formData, setFormData] = useState({
    case_number: `ACC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
    road_id: selectedRoadId,
    severity: 'Severe Injury',
    accident_type: 'Skid / Loss of Control',
    latitude: 28.4680,
    longitude: 77.0680,
    weather: 'Rain',
    surface_condition: 'Wet / Pothole Impact',
    lighting_condition: 'Dark - Unlighted',
    vehicles_involved: 2,
    casualties_fatal: 0,
    casualties_severe: 1,
    casualties_minor: 1,
    primary_factor: 'Hydroplaning and Surface Pothole Impact',
    description: 'Vehicle struck waterlogged pavement depression causing sudden directional loss.'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [accs, bs] = await Promise.all([
        api.getAccidents(selectedRoadId),
        api.getBlackSpots(selectedRoadId)
      ]);
      setAccidents(accs);
      setBlackspots(bs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setFormData((prev) => ({ ...prev, road_id: selectedRoadId }));
  }, [selectedRoadId]);

  const handleAddAccident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAccident(formData);
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      alert('Failed to register accident. Please check inputs.');
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await api.recalculateBlackSpots();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const filteredAccidents = accidents.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ACCIDENT INTELLIGENCE</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-semibold">
              NT15 BLACK SPOT IDENTIFICATION
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Empirical Crash Geo-Clustering, Casualty Severity Indexing & IRC:SP:88 Regulatory Compliance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-mono bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Accident Record</span>
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-mono bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition shadow-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Clusters</span>
          </button>
        </div>
      </div>

      {/* Methodology Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs">
        <div className="flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-blue-900 font-mono">
              STANDARDIZED MoRTH / IRC:SP:88-2019 BLACK SPOT PROTOCOL
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              Black Spots are classified where multiple serious crashes concentrate within a 500-meter corridor window over 3 continuous years.
              The <b>Weighted Severity Index (SI)</b> is calculated transparently as:
              <span className="ml-2 font-mono text-blue-950 font-bold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-xs">
                SI = (5 × Fatal) + (3 × Severe Injury) + (1 × Minor Injury)
              </span>.
              Locations with <b>SI ≥ 10.0</b> or <b>≥ 3 accidents</b> with verified road defect linkages are designated as statutory hazard clusters.
            </p>
          </div>
        </div>
      </div>

      {/* Map & Black Spot Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-500">GEOSPATIAL CRASH CONCENTRATION MAP</span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 text-[11px] font-mono font-semibold">FILTER SEVERITY:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-xs"
              >
                <option value="ALL">All Severities</option>
                <option value="Fatal">Fatal Only</option>
                <option value="Severe Injury">Severe Injury Only</option>
                <option value="Minor Injury">Minor Injury Only</option>
              </select>
            </div>
          </div>

          <LeafletMap
            roads={roads}
            selectedRoad={roads.find((r) => r.id === selectedRoadId) as any}
            accidents={filteredAccidents}
            blackspots={blackspots}
            defects={[]}
            height="460px"
          />
        </div>

        {/* Identified Black Spots Column */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col h-[500px] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-[#172B4D]">Identified Black Spots</h2>
              <p className="text-[11px] font-mono text-slate-500">{blackspots.length} Clusters Verified</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
            {blackspots.map((bs) => (
              <div
                key={bs.id}
                className="p-3 bg-slate-50/80 border border-red-200 rounded-lg text-xs space-y-2 hover:border-red-400 hover:bg-white transition shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-600">{bs.code}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                    SI: {bs.severity_index.toFixed(1)}
                  </span>
                </div>
                <div className="font-semibold text-[#172B4D]">{bs.name}</div>
                <div className="text-[11px] text-slate-600 flex justify-between font-mono">
                  <span>Accidents: <b className="text-slate-900">{bs.total_accidents}</b></span>
                  <span>Fatal: <b className="text-red-600">{bs.fatal_count}</b></span>
                  <span>Severe: <b className="text-amber-700">{bs.severe_count}</b></span>
                </div>
                <div className="text-[11px] text-slate-600 border-t border-slate-200 pt-1.5">
                  <span className="text-slate-900 font-semibold">Causal Audit:</span> {bs.classification_reason}
                </div>
                <div className="text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-md border border-blue-200">
                  <span className="font-semibold text-blue-950">Remedial Action:</span> {bs.recommended_countermeasure}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Accident Records Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">Empirical Accident Master Database</h2>
            <p className="text-[11px] font-mono text-slate-500">Audited Police & Highway Patrol FIR Case Filings</p>
          </div>
          <span className="font-mono text-xs text-slate-500">
            Showing {filteredAccidents.length} of {accidents.length} records
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">CASE NO.</th>
                <th className="py-2.5 px-3">DATE</th>
                <th className="py-2.5 px-3">SEVERITY</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">CASUALTIES</th>
                <th className="py-2.5 px-3">WEATHER / SURFACE</th>
                <th className="py-2.5 px-3">LIGHTING</th>
                <th className="py-2.5 px-3">PRIMARY FACTOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredAccidents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#172B4D]">{a.case_number}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{a.accident_date.slice(0, 10)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      a.severity === 'Fatal'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : a.severity === 'Severe Injury'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{a.accident_type}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    {a.casualties_fatal > 0 && <span className="text-red-600 font-bold">{a.casualties_fatal} Fatal </span>}
                    {a.casualties_severe > 0 && <span className="text-amber-700 font-semibold">{a.casualties_severe} Severe </span>}
                    {a.casualties_minor > 0 && <span className="text-slate-500">{a.casualties_minor} Minor</span>}
                    {a.casualties_fatal === 0 && a.casualties_severe === 0 && a.casualties_minor === 0 && <span className="text-slate-400">None</span>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{a.weather} / {a.surface_condition}</td>
                  <td className="py-2.5 px-3 text-slate-600">{a.lighting_condition}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{a.primary_factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Accident Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-[#172B4D] font-mono">REGISTER ACCIDENT RECORD (FIR)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccident} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold">CASE NUMBER</label>
                  <input
                    type="text"
                    required
                    value={formData.case_number}
                    onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">ROAD CORRIDOR</label>
                  <select
                    value={formData.road_id}
                    onChange={(e) => setFormData({ ...formData, road_id: Number(e.target.value) })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {roads.map((r) => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold">SEVERITY CLASSIFICATION</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Fatal">Fatal</option>
                    <option value="Severe Injury">Severe Injury</option>
                    <option value="Minor Injury">Minor Injury</option>
                    <option value="Property Damage">Property Damage</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">ACCIDENT TYPE</label>
                  <input
                    type="text"
                    value={formData.accident_type}
                    onChange={(e) => setFormData({ ...formData, accident_type: e.target.value })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold">LATITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">LONGITUDE</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 font-semibold">FATALITIES</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.casualties_fatal}
                    onChange={(e) => setFormData({ ...formData, casualties_fatal: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">SEVERE INJURIES</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.casualties_severe}
                    onChange={(e) => setFormData({ ...formData, casualties_severe: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">MINOR INJURIES</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.casualties_minor}
                    onChange={(e) => setFormData({ ...formData, casualties_minor: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold">PRIMARY ROAD / ENVIRONMENTAL FACTOR</label>
                <input
                  type="text"
                  value={formData.primary_factor}
                  onChange={(e) => setFormData({ ...formData, primary_factor: e.target.value })}
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-xs"
                >
                  Save & Update Clusters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
