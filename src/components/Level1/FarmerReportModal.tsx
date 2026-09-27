import React from 'react';
import {
  X,
  FileText,
  Download,
  ShieldCheck,
  Leaf,
  Wind,
  Thermometer,
  AlertTriangle,
  Award,
  Layers,
  Clock,
  CheckCircle2,
  HelpCircle,
  Truck
} from 'lucide-react';
import { FarmerDetailedReport } from '../../../server/ai/farmerVoiceService';

interface Props {
  report: FarmerDetailedReport;
  onClose: () => void;
}

export const FarmerReportModal: React.FC<Props> = ({ report, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col font-sans text-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AUDITED REPORT • {report.id}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(report.timestamp).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span>Farmer Produce Packaging Decision Report</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evidence-based postharvest respiration and Equilibrium MAP (EMAP) engineering validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
              title="Print Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* SECTION A: Conversation Summary */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block">
              Section A • Farmer Conversation & Requirement Capture
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">
              {report.conversationSummary}
            </p>
          </div>

          {/* SECTION B & C: Commodity Profile & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Commodity Biological Profile */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-[10px] uppercase font-bold text-indigo-400">
                  Section B • Commodity Profile
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {report.commodityProfile.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Respiration Class</span>
                  <span className="font-bold text-amber-300">{report.commodityProfile.respirationClass}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Respiration Rate</span>
                  <span className="font-bold text-white font-mono">{report.commodityProfile.respirationRateMgCO2} mg CO₂/kg·hr</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Optimal Gas Headspace</span>
                  <span className="font-bold text-cyan-300">{report.commodityProfile.optimalHeadspaceGas}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Transpiration VPD</span>
                  <span className="font-bold text-emerald-400 font-mono">{report.commodityProfile.transpirationVPDkPa} kPa</span>
                </div>
              </div>

              <div className="pt-1 text-[11px]">
                <span className="text-slate-500 block">Chilling Injury Risk</span>
                <p className="text-slate-300 text-[10px] mt-0.5">{report.commodityProfile.chillingInjurySensitivity}</p>
              </div>
            </div>

            {/* Logistics & Transit Conditions */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-[10px] uppercase font-bold text-cyan-400">
                  Section C • Transit & Storage Conditions
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {report.logisticsConditions.purpose}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Transit Duration</span>
                  <span className="font-bold text-white font-mono">{report.logisticsConditions.transportDurationDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Target Shelf Life</span>
                  <span className="font-bold text-emerald-400 font-mono">{report.logisticsConditions.targetShelfLifeDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Temperature Chain</span>
                  <span className="font-bold text-amber-300">
                    {report.logisticsConditions.refrigerated ? 'Refrigerated Cold Chain' : 'Ambient Temperature'} ({report.logisticsConditions.transportTempC}°C)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Relative Humidity</span>
                  <span className="font-bold text-cyan-300 font-mono">{report.logisticsConditions.relativeHumidityPercent}% RH</span>
                </div>
              </div>

              <div className="pt-1 text-[11px]">
                <span className="text-slate-500 block">Logistical Recommendation</span>
                <p className="text-slate-300 text-[10px] mt-0.5">
                  Keep protected from direct solar thermal radiant loading during loading/unloading.
                </p>
              </div>
            </div>

          </div>

          {/* SECTION D: Sensitivity & Respiration Risk */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-mono text-[10px] uppercase font-bold text-amber-400 block">
              Section D • Postharvest Sensitivity Analysis
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Respiration & Gas Exchange Risk</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {report.sensitivityAnalysis.respirationRisk}
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>Moisture Deficit & Transpiration</span>
                </span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {report.sensitivityAnalysis.moistureVaporDeficitRisk}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION E: Primary Recommendation */}
          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 rounded-2xl border border-emerald-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block">
                  Section E • Recommended Packaging Suite
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {report.packagingRecommendation.structureDescription}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Achievable Shelf Life</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {report.packagingRecommendation.estimatedShelfLifeDays.min} - {report.packagingRecommendation.estimatedShelfLifeDays.max} Days
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Material</span>
                <span className="font-bold text-white">{report.packagingRecommendation.recommendedMaterial}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">MAP Gas Equilibrium</span>
                <span className="font-bold text-emerald-300">
                  {report.packagingRecommendation.mapStrategy.targetO2Percent} O₂ / {report.packagingRecommendation.mapStrategy.targetCO2Percent} CO₂
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Micro-Perforations</span>
                <span className="font-bold text-cyan-300 font-mono">
                  {report.packagingRecommendation.mapStrategy.microPerforationRequired ? 'Calibrated Laser Vents' : 'Macro-Vent Slots'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Unit Packaging Cost</span>
                <span className="font-bold text-white text-sm">₹{report.packagingRecommendation.estimatedCostINR.toFixed(2)}</span>
                <span className="text-[9px] text-emerald-400 block">Circularity: {report.packagingRecommendation.sustainabilityScore}/100</span>
              </div>
            </div>

            {/* Just-Necessary Packaging Verdict */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 block">
                ⚖️ Just-Necessary Packaging Evaluation
              </span>
              <p className="text-slate-300 leading-relaxed">
                {report.packagingRecommendation.justNecessaryEvaluation.explanation}
              </p>
            </div>
          </div>

          {/* SECTION F: Alternatives & Cold Chain Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Alternatives */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">
                Section F • Practical Alternatives & Trade-Offs
              </span>
              <div className="space-y-2">
                {report.alternatives.map((alt, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
                    <span className="font-bold text-white block">{alt.name}</span>
                    <span className="text-slate-400 text-[10px]">{alt.tradeoff}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold Chain Management */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 block">
                Cold Chain & Pre-Cooling Rules
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4">
                {report.coldChainManagementRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* SECTION G: Scientific Citations, Assumptions & Validation */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block">
              Section G • Traceable Scientific Citations & Assumptions
            </span>

            <div className="space-y-1.5 text-[11px]">
              <span className="text-slate-400 font-bold block">Scientific Citations:</span>
              {report.traceableEvidence.map((ev, idx) => (
                <div key={idx} className="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                  <span>{ev.source}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{ev.details}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[10px] text-slate-400">
              <div>
                <span className="font-bold text-slate-300 block mb-1">Assumptions & Baseline:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {report.assumptions.map((assump, idx) => (
                    <li key={idx}>{assump}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-bold text-slate-300 block mb-1">Validation Requirements:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {report.validationRequirements.map((v, idx) => (
                    <li key={idx}>{v}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>FOODPACK-AI • SIH26236 Certified Postharvest Decision Core</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
