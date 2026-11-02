import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Road } from '../types';
import {
  ShieldAlert,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Eye,
  Sliders,
  Moon,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RiskAnalysisPageProps {
  roads: Road[];
  selectedRoadId: number;
}

export const RiskAnalysisPage: React.FC<RiskAnalysisPageProps> = ({
  roads,
  selectedRoadId
}) => {
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<any>(null);
  const [lightingData, setLightingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RISK' | 'LIGHTING'>('RISK');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [risk, light] = await Promise.all([
          api.getRiskAnalysis(selectedRoadId),
          api.getLightingAnalysis(selectedRoadId)
        ]);
        setRiskData(risk);
        setLightingData(light);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedRoadId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ACCIDENT RISK & INFRASTRUCTURE ANALYSIS</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-semibold">
              HYBRID RISK ASSESSMENT
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Empirical Black Spots vs Predictive Structural Risk & Night-Time Lighting Safety
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 p-1 rounded-lg text-xs font-mono shadow-xs">
          <button
            onClick={() => setActiveTab('RISK')}
            className={`px-3 py-1.5 rounded-md transition font-medium ${
              activeTab === 'RISK' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hybrid Risk Model
          </button>
          <button
            onClick={() => setActiveTab('LIGHTING')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition font-medium ${
              activeTab === 'LIGHTING' ? 'bg-white text-amber-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-600" />
            <span>Night & Lighting Safety</span>
          </button>
        </div>
      </div>

      {/* Statutory Scientific Disclaimer */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs font-mono">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-blue-900">
              METHODOLOGICAL DISTINCTION: EMPIRICAL BLACK SPOTS VS PREDICTED RISK AREAS
            </span>
            <p className="text-slate-600 font-sans leading-relaxed">
              Historical accident black spots represent verified retrospective crash records (MoRTH Protocol).
              Composite risk scores synthesize empirical incident frequency (60%) with localized structural defect density (40%).
              <b> RoadGuard AI never presents predictive risk scores as guaranteed crash forecasts.</b>
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'RISK' ? (
        <div className="space-y-6">
          {/* Risk Evaluated Segments Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] font-mono">CORRIDOR RISK PROFILE EVALUATION</h3>
                <p className="text-[10px] font-mono text-slate-500">100m Segments Ranked by Composite Hazard Index</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Corridor: <b className="text-slate-800">{riskData?.road_name}</b> ({riskData?.corridor_length_km} km)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">CHAINAGE</th>
                    <th className="py-2.5 px-3">COMPOSITE RISK</th>
                    <th className="py-2.5 px-3">CATEGORY</th>
                    <th className="py-2.5 px-3">EMPIRICAL BLACK SPOT?</th>
                    <th className="py-2.5 px-3">ACCIDENTS / DEFECTS</th>
                    <th className="py-2.5 px-3">CAUSAL EXPLANATION</th>
                    <th className="py-2.5 px-3">ENGINEERING COUNTERMEASURE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {riskData?.segments?.slice(20, 35).map((seg: any) => (
                    <tr key={seg.segment_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#172B4D]">{seg.chainage}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={seg.composite_risk_score > 60 ? 'text-red-600' : seg.composite_risk_score > 40 ? 'text-amber-700' : 'text-slate-700'}>
                          {seg.composite_risk_score} / 100
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          seg.risk_category === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' :
                          seg.risk_category === 'HIGH' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          seg.risk_category === 'MEDIUM' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {seg.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {seg.is_historical_blackspot ? (
                          <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px]">
                            VERIFIED CLUSTER
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No Cluster</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {seg.accidents_recorded} acc / {seg.defects_detected} def
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs text-xs">
                        {seg.risk_explanation}
                      </td>
                      <td className="py-2.5 px-3 text-blue-700 font-medium text-xs">
                        {seg.suggested_intervention}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Streetlight & Night-Time Lighting Safety Tab */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 font-mono text-xs space-y-1 shadow-sm">
              <span className="text-slate-500 uppercase text-[10px] font-semibold">Monitored Segments</span>
              <div className="text-2xl font-bold text-[#172B4D]">{lightingData?.total_segments_monitored}</div>
              <div className="text-[11px] text-slate-500">100m Photometric Survey</div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 font-mono text-xs space-y-1 shadow-xs">
              <span className="text-red-700 uppercase text-[10px] font-semibold">Unlit Segments</span>
              <div className="text-2xl font-bold text-red-700">{lightingData?.unlit_segments_count}</div>
              <div className="text-[11px] text-red-600 font-sans">Luminaires Absent / Inoperative</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 font-mono text-xs space-y-1 shadow-xs">
              <span className="text-amber-800 uppercase text-[10px] font-semibold">Night-Time Accidents</span>
              <div className="text-2xl font-bold text-amber-800">{lightingData?.night_accident_records}</div>
              <div className="text-[11px] text-amber-700 font-sans">Under Dark / Unlit Conditions</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 font-mono text-xs space-y-1 shadow-xs">
              <span className="text-emerald-800 uppercase text-[10px] font-semibold">Compliance Rate</span>
              <div className="text-2xl font-bold text-emerald-800">{lightingData?.compliance_rate_pct}%</div>
              <div className="text-[11px] text-emerald-700 font-sans">IRC-66 Lighting Standard</div>
            </div>
          </div>

          {/* Lighting Deficiencies Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] font-mono">POORLY ILLUMINATED ROAD SEGMENTS</h3>
                <p className="text-[10px] font-mono text-slate-500">Evidence-Based Lighting Asset Discrepancies</p>
              </div>
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">SEGMENT ID</th>
                    <th className="py-2.5 px-3">CHAINAGE</th>
                    <th className="py-2.5 px-3">COORDINATES</th>
                    <th className="py-2.5 px-3">DEFICIENCY STATUS</th>
                    <th className="py-2.5 px-3">NIGHT ACCIDENTS</th>
                    <th className="py-2.5 px-3">RECOMMENDED MAINTENANCE ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {lightingData?.deficiencies?.map((item: any) => (
                    <tr key={item.segment_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#172B4D]">#{item.segment_id}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{item.chainage}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-50 text-red-700 border border-red-200">
                          {item.lighting_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-red-600 font-bold">{item.night_accidents_nearby} incidents</td>
                      <td className="py-2.5 px-3 text-slate-700 text-xs font-medium">{item.recommended_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-600">
              <b>Statutory Engineering Standard:</b> {lightingData?.methodology_disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
