import React, { useState, useEffect } from 'react';
import { Leaf, Wind, Thermometer, ShieldCheck, Award, ArrowRight, AlertTriangle, Droplets, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Level1Input, Level1RecommendationResult } from '../../../server/engines/levelEngines';
import { FarmerVoiceAssistant } from './FarmerVoiceAssistant';

export const FreshProduceIntelligence: React.FC = () => {
  const [commodityName, setCommodityName] = useState('Fresh Strawberries');
  const [storageTempC, setStorageTempC] = useState(2);
  const [relativeHumidity, setRelativeHumidity] = useState(92);
  const [storageType, setStorageType] = useState<any>('Cold Storage (Refrigerated)');
  const [transportDays, setTransportDays] = useState(3);
  const [targetShelfLifeDays, setTargetShelfLifeDays] = useState(14);
  const [mapReq, setMapReq] = useState<any>('Automatic DSS Selection');
  const [format, setFormat] = useState<any>('Micro-Perforated Pouch / Bag');
  const [budget, setBudget] = useState<any>('Balanced');
  const [sustainability, setSustainability] = useState<any>('Prefer biodegradable/compostable');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Level1RecommendationResult | null>(null);
  const [showInternalSensitivities, setShowInternalSensitivities] = useState(false);

  const calculateRecommendation = async () => {
    setLoading(true);
    try {
      const payload: Level1Input = {
        commodityName,
        storageTempC,
        relativeHumidity,
        storageType,
        transportDurationDays: transportDays,
        targetShelfLifeDays,
        mapRequirement: mapReq,
        packagingFormat: format,
        budget,
        sustainability
      };

      const res = await apiFetch('/api/recommend/level1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Level 1 calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    calculateRecommendation();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRecommendation();
  };

  const handleSyncVoiceParameters = (params: {
    commodityName?: string;
    storageTempC?: number;
    transportDays?: number;
    refrigeration?: boolean;
    packagingFormat?: string;
  }) => {
    if (params.commodityName) setCommodityName(params.commodityName);
    if (params.storageTempC !== undefined) setStorageTempC(params.storageTempC);
    if (params.transportDays !== undefined) setTransportDays(params.transportDays);
    if (params.refrigeration !== undefined) {
      setStorageType(params.refrigeration ? 'Cold Storage (Refrigerated)' : 'Ambient Warehouse');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200 font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-3">
          Level 1 • Agricultural Producer & Fresh Produce Workflow
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Fresh Produce Respiration & EMAP Intelligence
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Fresh produce consists of living biological tissues with active postharvest respiration. Sealed airtight barriers cause rapid oxygen depletion below 1%, creating anaerobic fermentation and rot. This engine evaluates respiration kinetics, Vapor Pressure Deficit (VPD), chilling sensitivity, and recommends the Just-Necessary MAP configuration.
        </p>
      </div>

      {/* FEATURE 1: REAL FARMER EXPERT-BUDDY VOICE CONVERSATION INTERFACE */}
      <FarmerVoiceAssistant onSyncParameters={handleSyncVoiceParameters} />

      {/* Manual Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-semibold uppercase text-emerald-400">Biological & Environmental Inputs</span>
            <h3 className="text-lg font-bold text-white mt-1">Commodity Parameters</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-time DSS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Horticultural Crop</label>
            <select
              value={commodityName}
              onChange={(e) => setCommodityName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="Fresh Strawberries">Fresh Strawberries (Extremely High Respiration)</option>
              <option value="Button Mushrooms">Button Mushrooms (Extremely High Respiration)</option>
              <option value="Broccoli Florets">Broccoli Florets (High Respiration)</option>
              <option value="Ripening Mangoes">Mangoes / Tropical Fruit (Climacteric Ripening)</option>
              <option value="Fresh Cut Salad Greens">Fresh Cut Salad Greens (High Surface Area)</option>
              <option value="Table Grapes">Table Grapes (Moderate Respiration)</option>
              <option value="Potatoes / Onions">Potatoes / Onions (Low Respiration Root Crop)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Storage Temperature (°C)</label>
            <input
              type="number"
              value={storageTempC}
              onChange={(e) => setStorageTempC(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Relative Humidity (% RH)</label>
            <input
              type="number"
              value={relativeHumidity}
              onChange={(e) => setRelativeHumidity(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Shelf Life (Days)</label>
            <input
              type="number"
              value={targetShelfLifeDays}
              onChange={(e) => setTargetShelfLifeDays(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transit Duration (Days)</label>
            <input
              type="number"
              value={transportDays}
              onChange={(e) => setTransportDays(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Packaging Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="Micro-Perforated Pouch / Bag">Micro-Perforated BOPP/PE Pouch</option>
              <option value="Molded Fiber Clamshell / Punnet">Breathable Molded Fiber Punnet</option>
              <option value="Macro-Vented Corrugated Box">Macro-Vented Corrugated Wholesale Box</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {loading ? <span>Evaluating Respiration Kinetics...</span> : (
              <>
                <Leaf className="w-4 h-4" />
                <span>Calculate Produce Packaging Recommendation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-semibold uppercase text-emerald-400">
                Recommended Solution • {result.mapRecommendation?.recommendedType}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {result.packagingStructure}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Achievable Shelf Life</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {result.estimatedShelfLifeDays.min} - {result.estimatedShelfLifeDays.max} Days
              </span>
            </div>
          </div>

          {/* Biological Crop Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Respiration Class</span>
              <span className="font-bold text-amber-300">{result.commodity.respirationRateClass}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {result.commodity.respirationRateMgCO2} mg CO₂/kg·hr @ {storageTempC}°C
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Transpiration VPD</span>
              <span className="font-bold text-cyan-300 font-mono">{result.commodity.transpirationVPDkPa} kPa</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                At {storageTempC}°C and {relativeHumidity}% RH
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">MAP Headspace Target</span>
              <span className="font-bold text-emerald-300">{result.mapRecommendation.targetO2Percent} O₂ / {result.mapRecommendation.targetCO2Percent} CO₂</span>
              <span className="text-[10px] text-slate-400 block mt-1">{result.mapRecommendation.perforationDetails.targetOtrFlux}</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Unit Packaging Cost</span>
              <span className="font-bold text-white text-base">₹{result.estimatedCostPerUnitINR.toFixed(2)}</span>
              <span className="text-[10px] text-emerald-400 block">Circularity: {result.sustainabilityRating}/100</span>
            </div>
          </div>

          {/* MAP Strategy Justification */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-1.5 text-xs">
            <span className="font-mono text-[10px] font-bold uppercase text-emerald-400 block">
              MAP Decision Logic: {result.mapRecommendation.recommendedType}
            </span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {result.mapRecommendation.justification}
            </p>
          </div>

          {/* Just-Necessary Packaging Verdict */}
          {result.justNecessaryPackaging && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase text-indigo-400 block">
                ⚖️ Just-Necessary Packaging Evaluation
              </span>
              <p className="text-slate-300 leading-relaxed">
                {result.justNecessaryPackaging.explanation}
              </p>
            </div>
          )}

          {/* Why This Package? Traceable Chain */}
          {result.explainabilityChain && result.explainabilityChain.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-semibold uppercase text-slate-300 block">
                Traceable Rationale: Food Sensitivity → Requirement → Packaging Feature
              </span>
              <div className="space-y-2">
                {result.explainabilityChain.map((chain, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span className="text-emerald-400">1. {chain.sensitivity}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-cyan-400">2. {chain.requirement}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <strong className="text-slate-300">Feature:</strong> {chain.materialFeature} — {chain.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Internal Sensitivities */}
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
            <button
              type="button"
              onClick={() => setShowInternalSensitivities(!showInternalSensitivities)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer"
            >
              <span>View Internal Food Sensitivities ({result.foodSensitivities?.length || 0} Identified Pathways)</span>
              {showInternalSensitivities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInternalSensitivities && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
                {result.foodSensitivities?.map((sens, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{sens.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                        sens.priority === 'Critical' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {sens.priority} Priority
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{sens.criticalLimitDescription}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cold Chain Management Protocol */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase text-indigo-400 block">
              Cold Chain Management Protocol
            </span>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              {result.storageAndColdChainRules.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Traceable Scientific Evidence */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase text-emerald-400 block">
              Traceable Scientific Citations (UC Davis / FAO Postharvest Data)
            </span>
            <div className="space-y-1.5 text-xs text-slate-300">
              {result.scientificEvidence.map((ev, idx) => (
                <div key={idx} className="flex justify-between border-b border-slate-800 pb-1">
                  <span>{ev.source}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{ev.dateOrVersion}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
