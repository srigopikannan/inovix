import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Shield,
  FileDown,
  Navigation,
  Activity,
  Layers,
  Menu,
  Globe2,
  Cpu,
  MapPin,
  ExternalLink
} from 'lucide-react';
import type { Road } from '../types';

interface TopNavProps {
  roads: Road[];
  selectedRoadId: number;
  onSelectRoad: (id: number) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  roads,
  selectedRoadId,
  onSelectRoad,
  collapsed = false,
  onToggleCollapse
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumb = (path: string) => {
    switch (path) {
      case '/': return { section: 'National Overview', title: '3D Road Network & Intelligence' };
      case '/overview': return { section: 'National Overview', title: '3D Road Network & Intelligence' };
      case '/command-center': return { section: 'Command Center', title: 'Safety Operations Center' };
      case '/accidents': return { section: 'Accident Intelligence', title: 'MoRTH Black Spot Identification (NT15)' };
      case '/gis-explorer': return { section: 'GIS Explorer', title: 'Interactive India Road Intelligence' };
      case '/road-explorer': return { section: 'Road Explorer', title: 'Street-Level 360° Panoramic Inspection' };
      case '/road-scanner': return { section: 'Road Scanner', title: '10-Kilometre Signature Inspection Ribbon' };
      case '/defect-detection': return { section: 'Computer Vision', title: 'AI Defect Metrology & Classification' };
      case '/road-health': return { section: 'Road Health Analytics', title: 'Pavement Condition Index (PCI) Degradation' };
      case '/risk-analysis': return { section: 'Accident Risk Analysis', title: 'Empirical vs Machine Learning Models' };
      case '/roadguard-vision': return { section: 'ROADGUARD VISION', title: 'Before-After Reconstruction Simulator' };
      case '/reports': return { section: 'Reports & Audits', title: 'Executive Statutory Audit Reports' };
      case '/administration': return { section: 'Administration', title: 'Roles, Operators & Audit Trail' };
      case '/settings': return { section: 'Settings', title: 'System Calibration & IRC Threshold Standards' };
      default: return { section: 'ROADGUARD AI', title: 'Geospatial Intelligence' };
    }
  };

  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <header
      className={`h-14 bg-white/95 backdrop-blur border-b border-[#E2E8F0] fixed top-0 right-0 z-30 flex items-center justify-between px-5 select-none shadow-2xs transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left Breadcrumb & Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400 font-medium">{breadcrumb.section}</span>
          <span className="text-slate-300">/</span>
          <span className="text-[#172B4D] font-bold tracking-tight">{breadcrumb.title}</span>
        </div>
      </div>

      {/* Right Controls: Corridor Selector, Statutory Pill, Quick Links */}
      <div className="flex items-center space-x-3.5">
        {/* Active Corridor Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-400 font-mono text-[10px] font-bold">CORRIDOR:</span>
          <select
            value={selectedRoadId}
            onChange={(e) => onSelectRoad(Number(e.target.value))}
            className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
          >
            {roads.map((r) => (
              <option key={r.id} value={r.id} className="bg-white text-slate-800 font-sans">
                {r.code === 'NH-44' ? '★ NH-44 Cyber City (10km Route)' : `${r.code} - ${r.name.length > 22 ? r.name.slice(0, 22) + '...' : r.name} (${r.length_km}km)`}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Launch Shortcuts */}
        <div className="hidden md:flex items-center space-x-1.5">
          <button
            onClick={() => navigate('/gis-explorer')}
            className={`p-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center space-x-1 ${
              location.pathname === '/gis-explorer'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Open GIS Explorer"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline text-[11px]">GIS Map</span>
          </button>

          <button
            onClick={() => navigate('/defect-detection')}
            className={`p-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center space-x-1 ${
              location.pathname === '/defect-detection'
                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Open Defect Detection"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden xl:inline text-[11px]">Defect CV</span>
          </button>
        </div>

        {/* Live Statutory Status Pill */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>MoRTH NT15</span>
        </div>
      </div>
    </header>
  );
};
