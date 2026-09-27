import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Award, Calendar, FileText, AlertTriangle } from 'lucide-react';

interface Props {
  recommendationId: string;
  onBackToApp: () => void;
}

export const QRVerificationView: React.FC<Props> = ({ recommendationId, onBackToApp }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${recommendationId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('Recommendation ID not found or expired in certified registry.');
        }
      } catch (err) {
        setError('Network error verifying certificate.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [recommendationId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 inline-block mb-2">
            SIH26236 Official Registry Certificate
          </span>
          <h1 className="text-2xl font-black text-white">Food Packaging Verification</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">ID: {recommendationId}</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Verifying tamper-evident cryptographic hash in registry...
          </div>
        ) : error ? (
          <div className="py-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        ) : data && (
          <div className="space-y-6 pt-6">
            
            {/* Status Card */}
            <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/40 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">{data.validationStatus}</span>
                <span className="text-[11px] text-slate-400">{data.engineVersion}</span>
              </div>
            </div>

            {/* Non-sensitive details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Target Food Commodity:</span>
                <span className="font-semibold text-white">{data.foodName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Certified Material Vessel:</span>
                <span className="font-semibold text-white text-right max-w-xs">{data.configuration?.containerName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Barrier & Venting:</span>
                <span className="font-semibold text-emerald-300">{data.configuration?.lidType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Grease Resistance:</span>
                <span className="font-semibold text-amber-300">{data.configuration?.greaseBarrierRating}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Circularity Rating:</span>
                <span className="font-semibold text-emerald-400">{data.sustainabilityScore} / 100</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Certification Timestamp:</span>
                <span className="font-mono text-slate-300">{new Date(data.certifiedDate).toLocaleString()}</span>
              </div>
            </div>

            {/* Traceable Standards */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                Traceable Reference Methods
              </span>
              <ul className="text-slate-300 space-y-1 list-disc pl-4 text-[11px]">
                {data.traceableStandards?.map((std: string, idx: number) => (
                  <li key={idx}>{std}</li>
                ))}
              </ul>
            </div>

            <p className="text-[10px] text-slate-500 text-center">
              Zero PII Policy: No private personal identification data or customer phone records are stored in public verification QR payloads.
            </p>

            <button
              onClick={onBackToApp}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition"
            >
              Return to FOODPACK-AI Application
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
