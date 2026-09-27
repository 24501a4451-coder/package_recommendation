import React from 'react';
import { RecommendationRecord } from '../../types';
import { X, Printer, Download, ShieldCheck, QrCode, Award } from 'lucide-react';

interface Props {
  record: RecommendationRecord;
  onClose: () => void;
}

export const ReportModal: React.FC<Props> = ({ record, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const config = record.configuration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-10 text-slate-200 shadow-2xl my-8 relative">
        
        {/* Top Controls */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Technical Packaging Dossier
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {record.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer text-xs font-semibold flex items-center gap-1.5"
              title="Print Technical Dossier"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 printable-content">
          
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">
                FOODPACK-AI • SIH26236 Certified Engine
              </span>
              <h1 className="text-2xl font-black text-white">{record.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Commodity: <strong className="text-white">{record.foodName}</strong> • Evaluated on: {new Date(record.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized User: {record.userName} ({record.level})
              </p>
            </div>

            {record.qrCodeUrl && (
              <div className="text-center shrink-0">
                <div className="bg-white p-2 rounded-xl inline-block shadow-md">
                  <img src={record.qrCodeUrl} alt="Verification QR" className="w-24 h-24" />
                </div>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">Scan to Verify</span>
              </div>
            )}
          </div>

          {/* Core Configuration Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-bold text-indigo-400 tracking-wider">
              1. Prescribed Packaging Configuration
            </h3>
            <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-slate-950">
                  <td className="py-2.5 px-4 font-semibold text-slate-400 w-1/3">Primary Vessel</td>
                  <td className="py-2.5 px-4 font-bold text-white">{config.containerName}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Material & Structure</td>
                  <td className="py-2.5 px-4 text-slate-200">{config.structure}</td>
                </tr>
                <tr className="bg-slate-950">
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Compartment Architecture</td>
                  <td className="py-2.5 px-4 text-indigo-300">{config.compartments}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Lid & Steam Venting</td>
                  <td className="py-2.5 px-4 text-emerald-300">{config.lidType} • {config.venting}</td>
                </tr>
                <tr className="bg-slate-950">
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Condiment / Sauce Cup</td>
                  <td className="py-2.5 px-4 text-slate-200">{config.sauceContainer}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Grease Resistance</td>
                  <td className="py-2.5 px-4 text-amber-300">{config.greaseResistance}</td>
                </tr>
                <tr className="bg-slate-950">
                  <td className="py-2.5 px-4 font-semibold text-slate-400">Moisture & Steam Control</td>
                  <td className="py-2.5 px-4 text-cyan-300">{config.moistureManagement}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Scientific Rationale */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase font-bold text-emerald-400 tracking-wider">
              2. Scientific Rationale & Thermodynamics
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {record.whyExplanation}
            </p>
          </div>

          {/* Traceable Evidence */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase font-bold text-amber-400 tracking-wider">
              3. Traceable Test Standards & Published Citations
            </h3>
            <div className="space-y-2">
              {record.evidence?.map((ev, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{ev.source}</span>
                    <span className="text-slate-500 font-mono text-[10px]">{ev.sourceType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {ev.testMethod && <span>Standard: {ev.testMethod} • </span>}
                    {ev.dateOrVersion && <span>Version: {ev.dateOrVersion}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Economic & Sustainability Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-1">Economic Baseline</span>
              <span className="text-xl font-bold text-white">₹{record.costEstimate.unitCostINR.toFixed(2)} INR</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{record.costEstimate.basis}</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-1">Circularity Indicator</span>
              <span className="text-xl font-bold text-emerald-400">{record.sustainabilityScore} / 100</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Certified Biodegradable / Zero Persistent Microplastics</span>
            </div>
          </div>

          {/* Limitations and Validation */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <strong className="text-slate-300 font-semibold uppercase font-mono text-[10px] block">
              Validation Protocol Required Prior to Commercial Fill:
            </strong>
            <ul className="list-disc pl-4 space-y-0.5">
              {record.validationRequired?.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};
