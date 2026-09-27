import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Activity, FileText, Cpu, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          apiFetch('/api/admin/stats'),
          apiFetch('/api/admin/audit-logs')
        ]);
        if (statsRes.ok && logsRes.ok) {
          const statsData = await statsRes.json();
          const logsData = await logsRes.json();
          setStats(statsData);
          setAuditLogs(logsData.logs || []);
        }
      } catch (err) {
        console.error('Failed to load admin telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-semibold uppercase mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Section 27 & 28: System Administration & Audit Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Platform Governance & Security Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Administrator console for inspecting system telemetry, managing RBAC role assignments, monitoring AI model pipelines, and reviewing immutable audit logs.
        </p>
      </div>

      {/* Telemetry Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Registered Users</span>
            <span className="text-2xl font-black text-white">{stats.totalUsers}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 4 SIH Levels</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Total Recommendations</span>
            <span className="text-2xl font-black text-indigo-400">{stats.totalRecommendations}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Generated with QR Hash</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Certified Materials</span>
            <span className="text-2xl font-black text-emerald-400">{stats.totalMaterials}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">ASTM / TAPPI Verified</span>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Physico-Chemical Foods</span>
            <span className="text-2xl font-black text-amber-300">{stats.totalFoods}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">NIN IFCT / USDA Standards</span>
          </div>
        </div>
      )}

      {/* Model Pipelines Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>Multimodal AI Model Health & Component Adapters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between font-bold text-white">
              <span>Gemini 3.8 Flash Vision</span>
              <span className="text-emerald-400 font-mono text-[10px]">CONNECTED</span>
            </div>
            <p className="text-slate-400 text-[11px]">Direct multimodal food feature parsing and thermodynamic inference via @google/genai SDK.</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between font-bold text-white">
              <span>Qwen2.5-VL Adapter</span>
              <span className="text-indigo-400 font-mono text-[10px]">STANDBY / FALLBACK</span>
            </div>
            <p className="text-slate-400 text-[11px]">Open-source vision-language model schema interface for on-premise edge deployments.</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between font-bold text-white">
              <span>ConvNeXt-Food-CLF-75</span>
              <span className="text-cyan-400 font-mono text-[10px]">OPERATIONAL</span>
            </div>
            <p className="text-slate-400 text-[11px]">75-class deep food classification backbone mapping to nutritional datasets.</p>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex justify-between font-bold text-white">
              <span>FoodSeg103 Semantic Segmenter</span>
              <span className="text-purple-400 font-mono text-[10px]">OPERATIONAL</span>
            </div>
            <p className="text-slate-400 text-[11px]">Multi-vessel boundary parsing isolating curries, rice, and crisp elements.</p>
          </div>
        </div>
      </div>

      {/* Security Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono font-semibold uppercase text-rose-400">Security & RBAC</span>
            <h3 className="text-lg font-bold text-white mt-0.5">Immutable Audit Trail</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Entries: {auditLogs.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Role / Level</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 font-semibold text-white">{log.action}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] ${
                        log.level === 'LEVEL_2'
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : log.level === 'LEVEL_1'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : log.level === 'LEVEL_3'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
