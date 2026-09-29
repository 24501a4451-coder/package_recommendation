import React from 'react';
import {
  Truck,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Thermometer,
  Wind,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Droplets,
  Boxes
} from 'lucide-react';
import { PackagingRecommendationResponse } from '../../../server/services/packagingRecommendationAdapter';
import { StructuredCropProfile } from './useFarmerContext';

interface Props {
  recommendation: PackagingRecommendationResponse | null;
  cropProfile: StructuredCropProfile;
}

export const PackingTransportPlanContainer: React.FC<Props> = ({
  recommendation,
  cropProfile
}) => {
  if (!recommendation) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Container 4 • Packing & Transport Plan</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Operational handling limits, vehicle stacking rules, and DOs/DON'Ts will appear once packaging is recommended.
        </p>
      </div>
    );
  }

  const config = recommendation.packingConfiguration;
  const pkg = recommendation.package;
  const dos = config.dos || [];
  const donts = config.donts || [];

  const transportDays = cropProfile.transportDurationDays || (cropProfile.transport.durationDays ?? 2);
  const isRefrigerated = Boolean(cropProfile.refrigeration ?? cropProfile.storage.refrigerated);

  return (
    <div id="container-4-packing-transport-plan" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
      
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              Container 4 • Operational Field Plan
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Stacking Limit: <strong className="text-white">{config.stackingLimit.split(';')[0]}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-amber-400" />
            <span>PACKING & TRANSPORT PLAN</span>
          </h2>
          <p className="text-xs text-slate-300">
            Logistical handling rules to preserve postharvest quality, avoid vibration bruising, and ensure cold chain integrity.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-bold">
            {transportDays} Days Transit • {isRefrigerated ? 'Cold Chain (4°C)' : 'Ambient Aerated Truck'}
          </span>
        </div>
      </div>

      {/* Two Column Logistical Overview: Packing Plan & Transport Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PACKING SPECIFICATIONS CARD */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-white font-mono text-sm font-bold border-b border-slate-800 pb-3">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>PACKING PROTOCOL</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Quantity per Package:</span>
              <span className="font-bold text-emerald-300 font-mono text-right">{config.quantityPerPackage}</span>
            </div>

            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Target Fill Level:</span>
              <span className="font-bold text-white font-mono">{config.maxFillPercentage}% (Prevents top crush)</span>
            </div>

            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Arrangement & Layers:</span>
              <span className="font-bold text-cyan-300 text-right">{config.layerCount} Tier Nested Placement</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Ventilation Requirements:</span>
              <p className="text-slate-200 text-[11px] leading-relaxed">{config.ventilationRequirement}</p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Cushioning & Separation:</span>
              <p className="text-slate-200 text-[11px] leading-relaxed">{config.cushioningAndSeparation}</p>
            </div>
          </div>
        </div>

        {/* TRANSPORT & LOGISTICS CARD */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-white font-mono text-sm font-bold border-b border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span>TRANSPORT & STACKING GUIDELINES</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Maximum Stacking:</span>
              <span className="font-bold text-amber-300 font-mono">{config.stackingLimit.split(';')[0]}</span>
            </div>

            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Transit Mode:</span>
              <span className="font-bold text-white">{cropProfile.transportMode || 'Ventilated Truck'}</span>
            </div>

            <div className="flex items-start justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 font-mono">Transit Duration:</span>
              <span className="font-bold text-emerald-400 font-mono">{transportDays} Days Maximum</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Field & Vehicle Handling:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-200 text-[11px]">
                {config.handlingInstructions.slice(0, 2).map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Environmental & Route Precautions:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-200 text-[11px]">
                {config.transportPrecautions.slice(0, 2).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* EXPLICIT DO & DON'T SYSTEM (MANDATORY REQUIREMENT) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* DO LIST */}
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-xs uppercase tracking-wider pb-2 border-b border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>✓ WHAT TO DO (BEST PRACTICES)</span>
          </div>

          <div className="space-y-2 text-xs">
            {dos.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-emerald-500/20 text-slate-200">
                <span className="text-emerald-400 font-bold font-mono shrink-0 mt-0.5">✓</span>
                <p className="leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DON'T LIST */}
        <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs uppercase tracking-wider pb-2 border-b border-rose-500/20">
            <XCircle className="w-5 h-5 text-rose-400" />
            <span>✕ WHAT NOT TO DO (CRITICAL HAZARDS)</span>
          </div>

          <div className="space-y-2 text-xs">
            {donts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-rose-500/20 text-slate-200">
                <span className="text-rose-400 font-bold font-mono shrink-0 mt-0.5">✕</span>
                <p className="leading-relaxed font-sans">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
