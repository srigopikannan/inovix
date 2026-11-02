import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  MapPin,
  Scan,
  Cpu,
  Activity,
  ShieldAlert,
  Eye,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  ChevronRight,
  Compass,
  Globe2,
  ChevronLeft,
  Menu,
  Zap,
  Radio
} from 'lucide-react';

interface SidebarProps {
  activeCorridorId?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navSections = [
  {
    title: 'Geospatial Hubs',
    items: [
      { path: '/', label: 'Overview & 3D Network', icon: Globe2, tag: '3D' },
      { path: '/live-road-view', label: 'Live Road View', icon: Eye, tag: 'NEW' },
      { path: '/command-center', label: 'Command Center', icon: LayoutDashboard, tag: 'LIVE' },
      { path: '/gis-explorer', label: 'GIS Explorer', icon: MapPin, tag: 'FLAGSHIP' },
    ]
  },
  {
    title: 'AI Vision & Inspection',
    items: [
      { path: '/defect-detection', label: 'AI Defect Detection', icon: Cpu, tag: 'CV' },
      { path: '/road-explorer', label: 'Road Explorer (360°)', icon: Compass, tag: 'PANO' },
      { path: '/road-scanner', label: 'Road Scanner (10km)', icon: Scan, tag: '100m' },
      { path: '/roadguard-vision', label: 'ROADGUARD VISION', icon: Eye, tag: 'SIM' },
    ]
  },
  {
    title: 'MoRTH Accident Analytics',
    items: [
      { path: '/accidents', label: 'Accident Intelligence', icon: AlertTriangle, tag: 'NT15' },
      { path: '/road-health', label: 'Road Health Analytics', icon: Activity },
      { path: '/risk-analysis', label: 'Risk Analysis', icon: ShieldAlert },
    ]
  },
  {
    title: 'Administration & Audits',
    items: [
      { path: '/reports', label: 'Reports & Audits', icon: FileText },
      { path: '/administration', label: 'Administration', icon: Users },
      { path: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse
}) => {
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-[#E2E8F0] select-none shadow-xs transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#172B4D]">ROADGUARD</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-mono px-1.5 py-0.2 rounded border border-blue-200 font-bold">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono font-medium truncate">NT15 BLACK SPOT INTEL</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
              collapsed ? 'hidden' : 'block'
            }`}
            title="Toggle Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Slogan Pill (Expanded only) */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100">
          <p className="text-[11px] text-slate-600 font-medium italic border-l-2 border-blue-500 pl-2 leading-tight">
            "Turning Accident Data into Safer Roads."
          </p>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-blue-50/90 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className={`flex items-center space-x-2.5 truncate ${collapsed ? 'mx-auto' : ''}`}>
                    <Icon className={`w-4 h-4 shrink-0 transition-colors group-hover:text-blue-600 text-slate-400`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.tag && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        item.tag === 'FLAGSHIP'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : item.tag === 'NT15'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Status Pill */}
      <div className="p-3 border-t border-[#E2E8F0] bg-slate-50/80">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MoRTH Ready</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400">v2.4.0</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="MoRTH Ready" />
          </div>
        )}
      </div>
    </aside>
  );
};
