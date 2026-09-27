import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AIModeBadge } from '../AIModeBadge';
import { apiFetch } from '../../utils/api';

export const ExistingPackagingEvaluator: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [containerType, setContainerType] = useState('Standard Unvented Plastic Clamshell');
  const [observedProblem, setObservedProblem] = useState('Food arriving soggy / soggy bottom');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/evaluate-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview || '',
          specs: { containerType, observedIssue: observedProblem }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Failed to evaluate packaging:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-slate-200">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-semibold uppercase px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Forensic Failure Analysis
          </span>
          <AIModeBadge mode={result?.aiMode || 'REAL'} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Evaluate My Existing Packaging
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Upload a photograph or enter the specifications of your current takeaway container. The forensic engine evaluates visible failure mechanisms including steam condensation puddling, grease soak-through, and thermal loss.
        </p>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-amber-300 block">
            Scientific Boundary Notice (SIH26236 Section 13 Standard):
          </strong>
          <p className="text-slate-300 leading-relaxed">
            An optical image alone <strong>cannot</strong> determine exact polymer chemical composition, exact OTR, exact WVTR, exact micron wall thickness, mechanical modulus, or food-contact migration compliance (such as FDA 21 CFR or EU 10/2011). Laboratory instrumentation (Mocon OTR/WVTR sensors) is legally required for definitive certification.
          </p>
        </div>
      </div>

      {/* Input Form & Image Upload */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Container Photograph (Optional but recommended)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/60 flex flex-col items-center justify-center min-h-[200px]"
            >
              {imagePreview ? (
                <div className="relative w-full h-44">
                  <img
                    src={imagePreview}
                    alt="Packaging preview"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <span className="text-xs font-semibold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg">
                      Click to Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-white block">
                    Upload Container Photo
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Supports JPG, PNG (Max 25MB)
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Container Specifications */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Current Container Style
              </label>
              <select
                value={containerType}
                onChange={(e) => setContainerType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Standard Unvented Plastic Clamshell">Standard Unvented Plastic Clamshell (EPS Foam / PP)</option>
                <option value="Plain Thin Paperboard Box (Unlined)">Plain Thin Paperboard Box (Unlined Kraft)</option>
                <option value="Foil Container with Cardboard Lid">Aluminium Foil Container with Cardboard Lid</option>
                <option value="Round Plastic Curry Container with Snap Lid">Round Plastic Container with Friction Snap Lid</option>
                <option value="Standard Pizza Box without Vents">Standard Flat Corrugated Pizza Box without Vents</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observed Customer Problem / Defect
              </label>
              <select
                value={observedProblem}
                onChange={(e) => setObservedProblem(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Food arriving soggy / soggy bottom">Food arriving soggy / soggy bottom (Crust loss)</option>
                <option value="Grease bleed / oil soaking through bottom">Grease bleed / oil soaking through bottom</option>
                <option value="Liquid leaking from rim seam in delivery bag">Liquid leaking from rim seam in delivery bag</option>
                <option value="Container collapsing when stacked by courier">Container collapsing when stacked by courier</option>
                <option value="Food arriving cold (<50°C) after 40 minutes">Food arriving cold (&lt;50°C) after 40 minutes</option>
              </select>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition mt-4 disabled:opacity-50"
            >
              {loading ? (
                <span>Analyzing Forensic Failure Mechanisms...</span>
              ) : (
                <>
                  <span>Run Forensic Packaging Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* EVALUATION RESULTS */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
              Analysis Complete
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Forensic Evaluation: {result.observedContainerType}
            </h3>
            <p className="text-xs text-slate-400">
              Estimated Material Class: <span className="text-slate-200 font-medium">{result.materialClass}</span>
            </p>
          </div>

          {/* Identified Failure Mechanisms */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase font-semibold text-red-400 block">
              Identified Failure Mechanisms
            </span>
            <div className="grid grid-cols-1 gap-3">
              {result.failureMechanisms?.map((fm: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{fm.mechanism}</span>
                    <span
                      className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        fm.riskLevel === 'Critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      Risk: {fm.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{fm.scientificCause}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Recommendation */}
          <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/40 text-xs space-y-2">
            <span className="text-emerald-400 font-mono uppercase font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Recommended Corrective Upgrade Pathway
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">{result.upgradeRecommendation}</p>
          </div>

          {/* Stated Scientific Limitations */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-500 space-y-1">
            <span className="font-semibold text-slate-400 block uppercase font-mono text-[10px]">
              Forensic Limitations Acknowledgment
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              {result.scientificLimitations?.map((lim: string, idx: number) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};
