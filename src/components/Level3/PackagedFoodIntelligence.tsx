import React, { useState, useEffect } from 'react';
import { Package, ShieldCheck, Layers, Award, ArrowRight, AlertTriangle, Flame, Clock, Sliders, CheckCircle2, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Level3Input, Level3RecommendationResult } from '../../../server/engines/levelEngines';

export const PackagedFoodIntelligence: React.FC = () => {
  const [productName, setProductName] = useState('Artisan Roasted Spiced Cashews / Namkeen');
  const [productCategory, setProductCategory] = useState<any>('Dry Snacks & Chips');
  const [waterActivity, setWaterActivity] = useState(0.28);
  const [pH, setPH] = useState(6.2);
  const [fatContent, setFatContent] = useState(38.0);
  const [targetShelfLifeMonths, setTargetShelfLifeMonths] = useState(9);
  const [storageCondition, setStorageCondition] = useState<any>('Ambient Retail (25°C-35°C)');
  const [packageSizeGrams, setPackageSizeGrams] = useState(150);
  const [thermalProcess, setThermalProcess] = useState<any>('None');
  const [multiComponentFormat, setMultiComponentFormat] = useState<any>('Single Pouch');
  const [requiresN2, setRequiresN2] = useState(true);
  const [budget, setBudget] = useState<any>('Balanced');
  const [sustainabilityPreference, setSustainabilityPreference] = useState('Normal');

  // Custom sensitivity priorities
  const [oxidationPriority, setOxidationPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Critical');
  const [moisturePriority, setMoisturePriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Critical');
  const [showPriorityTuning, setShowPriorityTuning] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Level3RecommendationResult | null>(null);

  const calculateRecommendation = async () => {
    setLoading(true);
    try {
      const payload: Level3Input = {
        productName,
        productCategory,
        waterActivity,
        pH,
        fatContentPercent: fatContent,
        targetShelfLifeMonths,
        storageCondition,
        packageSizeGrams,
        thermalProcess,
        multiComponentFormat,
        requiresNitrogenFlushing: requiresN2,
        sensitivityPriorities: {
          oxidation: oxidationPriority,
          crispness_loss: moisturePriority,
          water_loss: moisturePriority
        },
        budget,
        sustainabilityPreference
      };

      const res = await apiFetch('/api/recommend/level3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Level 3 calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRecommendation();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateRecommendation();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200 font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-950 border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 inline-block mb-3">
          Level 3 • Packaged Food Startup & FMCG Manufacturer
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Barrier Film Formulation & Shelf Life Engineering
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Research-paper requirement-driven DSS layer for retail food products. Formulates barrier laminates, tray+lid sealing, and thermal process compatibility based on target shelf life, water activity sorption isotherms, and lipid oxidation kinetics.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-semibold uppercase text-blue-400">Physicochemical & Distribution Inputs</span>
            <h3 className="text-lg font-bold text-white mt-1">Product Formulation</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">DSS Specification Engine</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Product Category</label>
            <select
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Dry Snacks & Chips">Dry Snacks & Chips (Potato, Namkeen, Extruded)</option>
              <option value="Ready-to-Eat Gravy (Retort)">Ready-to-Eat Gravy (Retort Pouch)</option>
              <option value="Spice & Seasoning">Whole & Ground Spices (Volatile Essential Oils)</option>
              <option value="Cookies & Confectionery">Cookies & Bakery Confectionery</option>
              <option value="Dehydrated Fruits / Nuts">Dehydrated Fruits & Roasted Tree Nuts</option>
              <option value="Beverages & Liquid Sauces">Beverages & Liquid Sauces</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Water Activity (Aw)</label>
            <input
              type="number"
              step="0.01"
              value={waterActivity}
              onChange={(e) => setWaterActivity(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lipid Content (% Fat)</label>
            <input
              type="number"
              value={fatContent}
              onChange={(e) => setFatContent(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Shelf Life (Months)</label>
            <input
              type="number"
              value={targetShelfLifeMonths}
              onChange={(e) => setTargetShelfLifeMonths(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Storage Condition</label>
            <select
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Ambient Retail (25°C-35°C)">Ambient Retail (25°C-35°C)</option>
              <option value="Refrigerated (4°C-8°C)">Refrigerated (4°C-8°C)</option>
            </select>
          </div>
        </div>

        {/* Thermal Process & Multi-Component Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Thermal Process Compatibility</label>
            <select
              value={thermalProcess}
              onChange={(e) => setThermalProcess(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="None">None (Ambient Pack)</option>
              <option value="Hot Filling">Hot Filling (85°C - 95°C)</option>
              <option value="Pasteurization">Pasteurization (95°C - 100°C)</option>
              <option value="Retort Sterilization">Retort Sterilization (121°C / 15-30 psi)</option>
              <option value="Microwave">Microwave Reheating</option>
              <option value="Oven">Dual-Ovenable (up to 220°C)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Multi-Component Packaging Format</label>
            <select
              value={multiComponentFormat}
              onChange={(e) => setMultiComponentFormat(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Single Pouch">Single Pouch / Pillow Bag</option>
              <option value="Tray + Lidding Film">Rigid Tray + Lidding Film</option>
              <option value="Rigid Container + Film">Rigid Container + Inner Barrier Film</option>
              <option value="Multi-Chamber Pouch">Multi-Chamber Pouch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Circularity / Sustainability</label>
            <select
              value={sustainabilityPreference}
              onChange={(e) => setSustainabilityPreference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="Normal">Normal (High Barrier Priority)</option>
              <option value="Prefer recyclable">Prefer Recyclable Mono-Material (PE 04 / PP 05)</option>
              <option value="Prefer biodegradable/compostable">Prefer Biodegradable / EN 13432</option>
            </select>
          </div>
        </div>

        {/* Collapsible Sensitivity Priorities */}
        <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60">
          <button
            type="button"
            onClick={() => setShowPriorityTuning(!showPriorityTuning)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer"
          >
            <span>Tweak Sensitivity Priorities (Used in Candidate Scoring)</span>
            {showPriorityTuning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showPriorityTuning && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Lipid Oxidation Sensitivity Priority</label>
                <select
                  value={oxidationPriority}
                  onChange={(e) => setOxidationPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="Critical">Critical (Dominant Shelf Life Killer)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Moisture / Crispness Sensitivity Priority</label>
                <select
                  value={moisturePriority}
                  onChange={(e) => setMoisturePriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="Critical">Critical (Aw must stay below 0.35)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            {loading ? <span>Evaluating Barrier & Sorption Isotherms...</span> : (
              <>
                <Layers className="w-4 h-4" />
                <span>Formulate Barrier Film & Run DSS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* RESULTS DISPLAY */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          {/* Compliant Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            result.compliantStatus === 'Fully Compliant'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {result.compliantStatus === 'Fully Compliant' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-sm">{result.compliantStatus}</span>
            </div>
            {result.unmetRequirements && result.unmetRequirements.length > 0 && (
              <span className="text-[11px] text-amber-200">
                Unmet Constraint: {result.unmetRequirements[0]}
              </span>
            )}
          </div>

          {/* Title Header */}
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-semibold uppercase text-blue-400">
                Recommended Structure Specification
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {result.recommendedStructure?.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Validated Shelf Life</span>
              <span className="text-lg font-bold text-blue-400 font-mono">
                {result.estimatedShelfLifeRange?.minMonths} - {result.estimatedShelfLifeRange?.maxMonths} Months
              </span>
            </div>
          </div>

          {/* Barrier Profile Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Required Max OTR</span>
              <span className="font-bold text-cyan-300 font-mono">{result.barrierProfile.requiredMaxOTR} cc/(m²·day·atm)</span>
              <span className="text-[10px] text-slate-400 block mt-1">ASTM D3985 Coulometric</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Required Max WVTR</span>
              <span className="font-bold text-indigo-300 font-mono">{result.barrierProfile.requiredMaxWVTR} g/(m²·day)</span>
              <span className="text-[10px] text-slate-400 block mt-1">ASTM F1249 Infrared Sensor</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Laminate Thickness</span>
              <span className="font-bold text-white font-mono">{result.recommendedStructure?.totalThicknessMicrons} µm</span>
              <span className="text-[10px] text-slate-400 block mt-1">{result.recommendedStructure?.layerStack.length} Layers</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Estimated Unit Cost</span>
              <span className="font-bold text-white text-base">₹{result.costAndScaling.estimatedUnitCostINR.toFixed(2)}</span>
              <span className="text-[10px] text-emerald-400 block">Circularity: {result.justNecessaryEvaluation.sustainabilityScore}/100</span>
            </div>
          </div>

          {/* Layer Stack Visualization */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-semibold uppercase text-blue-400 block">
              Multi-Layer Engineered Cross-Section (Outer to Food Contact)
            </span>
            <div className="space-y-1.5">
              {result.recommendedStructure?.layerStack.map((layer, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800/80 text-xs">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    L{idx + 1}
                  </div>
                  <span className="font-medium text-slate-200">{layer}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Packaging Specification Generator Table (Only Validated Data) */}
          {result.packagingSpecifications && result.packagingSpecifications.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-semibold uppercase text-slate-300 block">
                Packaging Specification Generator (Validated Scientific Targets)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[11px]">
                      <th className="pb-2 font-semibold">Parameter</th>
                      <th className="pb-2 font-semibold">Target Value</th>
                      <th className="pb-2 font-semibold">Priority</th>
                      <th className="pb-2 font-semibold">Test Standard / Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.packagingSpecifications.map((spec, idx) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-2 font-mono text-white">{spec.propertyKey}</td>
                        <td className="py-2 font-bold font-mono text-cyan-300">{spec.targetValue} {spec.unit}</td>
                        <td className="py-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                            spec.importance === 'Critical' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {spec.importance}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400 text-[11px]">{spec.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Multi-Component Packaging Evaluation (Tray + Lid) */}
          {result.multiComponentEvaluation && (
            <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2 text-xs">
              <span className="font-mono text-[10px] font-bold uppercase text-purple-400 block">
                Multi-Component Packaging Evaluation: {result.multiComponentEvaluation.format}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Tray Material</span>
                  <span className="font-bold text-white">{result.multiComponentEvaluation.trayMaterial?.name}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Lidding Film</span>
                  <span className="font-bold text-white">{result.multiComponentEvaluation.lidMaterial?.name}</span>
                </div>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mt-1">
                <strong>Sealing Assessment:</strong> {result.multiComponentEvaluation.notes}
              </p>
            </div>
          )}

          {/* Thermal Process & Just-Necessary Packaging */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="font-mono text-[10px] font-bold uppercase text-amber-400 block">
                Thermal Process Compatibility
              </span>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Process Condition:</span>
                <span className="font-bold text-white">{result.thermalProcessCompatibility.process}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Supported:</span>
                <span className={result.thermalProcessCompatibility.supported ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {result.thermalProcessCompatibility.supported ? 'Yes (Validated)' : 'No (Thermal Limit Exceeded)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Max operating tolerance: {result.thermalProcessCompatibility.maxOperatingTempC}°C.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <span className="font-mono text-[10px] font-bold uppercase text-indigo-400 block">
                Just-Necessary Packaging
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {result.justNecessaryEvaluation.explanation}
              </p>
            </div>
          </div>

          {/* Near-Optimal Alternatives when non-compliant */}
          {result.alternatives && result.alternatives.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-slate-300">
                  {result.compliantStatus === 'Fully Compliant' ? 'Secondary Alternative Laminates' : 'Near-Optimal Candidates & Gap Analysis'}
                </span>
                <span className="text-[11px] text-slate-500">Ranked by requirement distance</span>
              </div>

              <div className="space-y-2">
                {result.alternatives.map((alt, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Option {idx + 2}: {alt.name}</span>
                      {alt.isNearOptimal && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300">
                          Near-Optimal
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{alt.tradeoff}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
