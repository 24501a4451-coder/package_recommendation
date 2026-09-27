import React, { useState, useEffect } from 'react';
import { History, FileText, QrCode, ArrowRight, Calendar, Bookmark, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { RecommendationRecord } from '../../types';

interface Props {
  onOpenReport: (record: RecommendationRecord) => void;
}

export const HistoryView: React.FC<Props> = ({ onOpenReport }) => {
  const [records, setRecords] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiFetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setRecords(data.recommendations || []);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-200">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase mb-1">
          <History className="w-4 h-4" />
          <span>Section 24: My Scans & Packaging Dossier History</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Historical Recommendations & Saved Records
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Revisit previous AI food scans, multi-component analyses, generated packaging suites, and tamper-evident QR verification certificates.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading saved dossiers...</div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Saved Records Yet</h3>
          <p className="text-xs text-slate-400">
            Run a scan in Level 2 Smart Takeaway Scanner or Level 1 Fresh Produce to generate and save recommendations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {rec.level}
                  </span>
                  <span className="text-xs font-mono text-slate-500">ID: {rec.id}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white">{rec.title}</h3>
                <p className="text-xs text-slate-400">
                  Container: <strong className="text-slate-200">{rec.configuration?.containerName}</strong>
                </p>

                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300">
                    Unit Cost: ₹{rec.costEstimate?.unitCostINR.toFixed(2)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-emerald-400">
                    Circularity: {rec.sustainabilityScore}/100
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-300">
                    {rec.configuration?.lidType}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => onOpenReport(rec)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 transition w-full sm:w-auto justify-center"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open Dossier Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
