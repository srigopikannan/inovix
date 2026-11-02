import React, { useState } from 'react';
import { api } from '../services/api';
import type { Road } from '../types';
import {
  FileText,
  FileDown,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Download
} from 'lucide-react';

interface ReportsPageProps {
  roads: Road[];
  selectedRoadId: number;
}

const REPORT_DEFINITIONS = [
  {
    type: 'blackspot',
    title: 'Accident Black Spot Audit Report',
    subtitle: 'MoRTH / IRC:SP:88 Protocol Black Spot Identification & Remedial Plan',
    code: 'RPT-BS-01',
    description: 'Detailed analysis of high-risk accident clusters, weighted severity indices (SI), empirical causality audit, and countermeasure recommendations.',
    formats: ['pdf', 'csv']
  },
  {
    type: 'health',
    title: 'Pavement Health & Asset Condition Report',
    subtitle: 'Segment-Wise Road Condition Assessment & Friction Index',
    code: 'RPT-PCI-02',
    description: '100-meter discretized condition roster, defect deductions, surface roughness (IRI) logs, and corridor health distribution charts.',
    formats: ['pdf', 'csv']
  }
];

export const ReportsPage: React.FC<ReportsPageProps> = ({
  roads,
  selectedRoadId
}) => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<{ [key: string]: string }>({});

  const handleGenerate = async (reportType: string, format: string) => {
    const key = `${reportType}_${format}`;
    try {
      setGenerating(key);
      const res = await api.generateReport({
        report_type: reportType,
        format: format,
        road_id: selectedRoadId
      });
      setDownloadLinks((prev) => ({ ...prev, [key]: res.download_url }));
    } catch (err) {
      alert('Report generation failed.');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  const activeRoad = roads.find((r) => r.id === selectedRoadId) || roads[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">REPORTS & EXPORTS</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              OFFICIAL AUDIT EXPORT SUITE
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Generate Formal PDF Audit Packages and CSV Raw Datasets for Highway Engineers & Authorities
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Statutory Disclaimers Verified</span>
        </div>
      </div>

      {/* Target Corridor Information Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <div className="text-blue-600 font-bold">{activeRoad?.code}</div>
            <div className="text-sm font-bold text-[#172B4D] font-sans mt-0.5">{activeRoad?.name}</div>
            <div className="text-slate-500 mt-1">
              Length: <b className="text-slate-800">{activeRoad?.length_km} km</b> | Segments: <b className="text-slate-800">{activeRoad?.segment_count}</b> | Class: <b className="text-slate-800">{activeRoad?.highway_class}</b>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <div>Auditing Agency: <b className="text-slate-800">State Highway Safety Bureau</b></div>
            <div>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Report Types Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_DEFINITIONS.map((rpt) => (
          <div
            key={rpt.type}
            className="p-5 rounded-xl bg-white border border-[#E2E8F0] space-y-4 font-mono text-xs shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow transition"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span className="font-bold text-blue-600">{rpt.code}</span>
                <span className="px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200 font-semibold text-slate-600">MoRTH Standard</span>
              </div>
              <h3 className="text-sm font-bold text-[#172B4D] font-sans">{rpt.title}</h3>
              <p className="text-[11px] text-[#475569] font-sans leading-relaxed">
                {rpt.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Select Export Format:</div>
              <div className="grid grid-cols-2 gap-2">
                {/* PDF Export Button */}
                {downloadLinks[`${rpt.type}_pdf`] ? (
                  <a
                    href={downloadLinks[`${rpt.type}_pdf`]}
                    download
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleGenerate(rpt.type, 'pdf')}
                    disabled={generating === `${rpt.type}_pdf`}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 shadow-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{generating === `${rpt.type}_pdf` ? 'Compiling...' : 'PDF Report'}</span>
                  </button>
                )}

                {/* CSV Export Button */}
                {downloadLinks[`${rpt.type}_csv`] ? (
                  <a
                    href={downloadLinks[`${rpt.type}_csv`]}
                    download
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleGenerate(rpt.type, 'csv')}
                    disabled={generating === `${rpt.type}_csv`}
                    className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition disabled:opacity-50 shadow-xs font-semibold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>{generating === `${rpt.type}_csv` ? 'Exporting...' : 'CSV Export'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
