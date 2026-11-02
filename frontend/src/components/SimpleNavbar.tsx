import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Home,
  MapPin,
  Cpu,
  FileText,
  Settings,
  Layers,
  Eye,
  Navigation
} from 'lucide-react';
import type { Road } from '../types';

interface SimpleNavbarProps {
  roads: Road[];
  selectedRoadId: number;
  onSelectRoad: (id: number) => void;
}

export const SimpleNavbar: React.FC<SimpleNavbarProps> = ({
  roads,
  selectedRoadId,
  onSelectRoad
}) => {
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/explore', label: 'Live Route Intelligence', icon: Navigation, badge: 'LIVE' },
    { path: '/live-road-view', label: 'Live Road View', icon: Eye, badge: 'NEW' },
    { path: '/inspect', label: 'AI Inspection', icon: Cpu },
    { path: '/reports', label: 'Road Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">ROADGUARD</span>
              <span className="text-[11px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Turning Accident Data into Safer Roads</p>
          </div>
        </NavLink>

        {/* 5 Main Navigation Items */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-full ml-1">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Highway Corridor Selector & Quick Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedRoadId}
              onChange={(e) => onSelectRoad(Number(e.target.value))}
              aria-label="Select Road Corridor"
              className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer"
            >
              {roads.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name.length > 20 ? r.name.slice(0, 20) + '...' : r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 bg-white px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2 rounded-lg text-[11px] font-semibold transition ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
};
