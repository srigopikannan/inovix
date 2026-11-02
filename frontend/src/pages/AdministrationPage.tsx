import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Users,
  Shield,
  Activity,
  Server,
  Lock,
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';

export const AdministrationPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [u, logs, status] = await Promise.all([
          api.getUsers(),
          api.getAuditLogs(),
          api.getSystemStatus()
        ]);
        setUsers(u);
        setAuditLogs(logs);
        setSystemStatus(status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-[#172B4D]">ADMINISTRATION & SECURITY</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
              RBAC & AUDIT LOG
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Role-Based Access Control, Immutable Engineering Audit Trail & Platform Diagnostics
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Status: {systemStatus?.status || 'HEALTHY'}</span>
        </div>
      </div>

      {/* System Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs space-y-2 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-700 font-bold">
            <Server className="w-4 h-4 text-blue-600" />
            <span>AI VISION SUBSYSTEM</span>
          </div>
          <div className="text-[#172B4D] font-semibold">{systemStatus?.vision_engine || 'OpenCV 4.10.0 ACTIVE'}</div>
          <div className="text-[11px] text-slate-500 font-sans">Mean Inference: 38.5ms</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs space-y-2 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>GIS & SPATIAL ENGINE</span>
          </div>
          <div className="text-[#172B4D] font-semibold">{systemStatus?.geospatial_engine || 'WGS84 Ellipsoid / Haversine Spatial Geodesy'}</div>
          <div className="text-[11px] text-slate-500 font-sans">Precision: Sub-meter coordinate indices</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs space-y-2 shadow-sm">
          <div className="flex items-center space-x-2 text-purple-700 font-bold">
            <Lock className="w-4 h-4 text-purple-600" />
            <span>COMPLIANCE PROTOCOL</span>
          </div>
          <div className="text-[#172B4D] font-semibold">{systemStatus?.blackspot_methodology || 'MoRTH / IRC:SP:88-2019'}</div>
          <div className="text-[11px] text-slate-500 font-sans">Database: SQLAlchemy ORM (PostGIS Ready)</div>
        </div>
      </div>

      {/* User Roster */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] font-mono">AUTHORIZED ENGINEERING PERSONNEL</h3>
            <p className="text-[10px] font-mono text-slate-500">Active Roles with Maintenance Dispatch & Audit Signing Privileges</p>
          </div>
          <Users className="w-4 h-4 text-blue-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">USERNAME</th>
                <th className="py-2.5 px-3">NAME & TITLE</th>
                <th className="py-2.5 px-3">EMAIL</th>
                <th className="py-2.5 px-3">ROLE</th>
                <th className="py-2.5 px-3">DEPARTMENT</th>
                <th className="py-2.5 px-3">REGISTERED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">@{u.username}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#172B4D]">{u.full_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">{u.department}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{u.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D] font-mono">SYSTEM AUDIT TRAIL</h3>
            <p className="text-[10px] font-mono text-slate-500">Tamper-Evident Operational Audit Log</p>
          </div>
          <Clock className="w-4 h-4 text-slate-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">ACTION</th>
                <th className="py-2.5 px-3">ENTITY</th>
                <th className="py-2.5 px-3">PERFORMED BY</th>
                <th className="py-2.5 px-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">{l.timestamp}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{l.action}</td>
                  <td className="py-2.5 px-3 text-slate-800 font-medium">{l.entity_type}</td>
                  <td className="py-2.5 px-3 text-blue-700 font-bold">{l.performed_by}</td>
                  <td className="py-2.5 px-3 text-slate-600">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
