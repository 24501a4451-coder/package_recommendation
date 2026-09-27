import React, { useState } from 'react';
import { Stethoscope, AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Search } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { FailureDiagnosisResult } from '../../../server/engines/failureDiagnosisEngine';

export const FailureDiagnosisTool: React.FC = () => {
  const [observedProblem, setObservedProblem] = useState<any>('Soggy Food / Loss of Crispness');
  const [foodType, setFoodType] = useState('Crispy Fried Chicken / French Fries');
  const [deliveryDurationMinutes, setDeliveryDurationMinutes] = useState(45);
  const [currentMaterial, setCurrentMaterial] = useState('Thin unvented EPS foam clamshell');
  const [ventingPresent, setVentingPresent] = useState<any>('No');
  
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<FailureDiagnosisResult | null>(null);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/diagnose/failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observedProblem,
          foodType,
          deliveryDurationMinutes,
          currentPackagingMaterial: currentMaterial,
          ventingPresent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDiagnosis(data);
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-semibold uppercase">
          <Stethoscope className="w-4 h-4" />
          <span>Section 20: Root Cause Packaging Failure Diagnostics</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Forensic Root Cause Analysis & Redesign
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select an observed packaging defect. The expert engine isolates thermodynamic, capillary, and mechanical mechanisms, delivering traceable scientific evidence, investigative tests, and packaging redesign pathways.
        </p>
      </div>

      {/* Input Diagnostic Form */}
      <form onSubmit={handleDiagnose} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Observed Defect
            </label>
            <select
              value={observedProblem}
              onChange={(e) => setObservedProblem(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-hidden"
            >
              <option value="Soggy Food / Loss of Crispness">Soggy Food / Loss of Crispness (Crust softened)</option>
              <option value="Internal Condensation / Puddling">Internal Condensation / Water droplets on lid</option>
              <option value="Liquid Leakage / Splashing">Liquid Leakage / Rim seepage in delivery bag</option>
              <option value="Grease Bleed / Bottom Softening">Grease Bleed / Oil soaking through bottom wall</option>
              <option value="Food Arriving Cold (Temperature Loss)">Food Arriving Cold (&lt;50°C after 40 min)</option>
              <option value="Package Crushing / Structural Collapse">Package Crushing / Stacked box collapse</option>
              <option value="Odor Transfer / Taint">Odor Transfer / Polymer off-flavor taint</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Food Item Subject to Failure
            </label>
            <input
              type="text"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Packaging Material
            </label>
            <input
              type="text"
              value={currentMaterial}
              onChange={(e) => setCurrentMaterial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transit Holding Duration (Min)
            </label>
            <input
              type="number"
              value={deliveryDurationMinutes}
              onChange={(e) => setDeliveryDurationMinutes(parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Venting Slots Present on Lid?
            </label>
            <select
              value={ventingPresent}
              onChange={(e) => setVentingPresent(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-rose-500 focus:outline-hidden"
            >
              <option value="No">No — Airtight / Unvented Lid</option>
              <option value="Yes">Yes — Micro-slits or punched holes present</option>
              <option value="Unsure">Unsure</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Diagnosing Physical Root Causes...' : 'Run Forensic Diagnosis'}</span>
          </button>
        </div>
      </form>

      {/* DIAGNOSTIC RESULTS */}
      {diagnosis && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono font-semibold uppercase text-rose-400">
              Diagnostic Findings
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Primary Root Cause: {diagnosis.primaryRootCause}
            </h3>
          </div>

          {/* Contributing Physical Mechanisms */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase font-semibold text-amber-400 block">
              Contributing Physicochemical Mechanisms
            </span>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {diagnosis.contributingMechanisms.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>

          {/* Corrective Redesign */}
          <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/40 text-xs space-y-2">
            <span className="text-emerald-400 font-mono uppercase font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Prescribed Packaging Redesign & Material Solution
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">{diagnosis.correctivePackagingChange}</p>
          </div>

          {/* Scientific Evidence & Investigative Protocols */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300 font-mono uppercase text-[10px] block">
                Scientific Literature Evidence
              </span>
              <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                {diagnosis.scientificEvidence.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300 font-mono uppercase text-[10px] block">
                Recommended Verification Tests
              </span>
              <ul className="text-slate-400 space-y-1 list-disc pl-4 text-[11px]">
                {diagnosis.validationRequired.map((val, i) => (
                  <li key={i}>{val}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic pt-2">
            * {diagnosis.disclaimer}
          </p>
        </div>
      )}

    </div>
  );
};
