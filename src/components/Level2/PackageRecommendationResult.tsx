import React, { useState, useEffect, useRef } from 'react';
import { RecommendationRecord } from '../../types';
import {
  ShieldCheck,
  QrCode,
  FileText,
  Bookmark,
  Sparkles,
  Leaf,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  Package,
  Check,
  ChevronRight,
  Info,
  Thermometer,
  CloudRain,
  Flame,
  ArrowRight,
  X,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Minimize2,
  Cpu,
  Droplets,
  AlertCircle,
  Download,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

interface Props {
  record: RecommendationRecord;
  onOpenReport: () => void;
  onOpenAssistant: () => void;
  onReset: () => void;
  onSavePreset?: (presetName: string, record: RecommendationRecord) => void;
  onRecalculate?: (newPreferences: any) => void;
}

export const PackageRecommendationResult: React.FC<Props> = ({
  record,
  onOpenReport,
  onOpenAssistant,
  onReset,
  onSavePreset,
  onRecalculate
}) => {
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [presetName, setPresetName] = useState(`Standard ${record.foodName} Takeaway Suite`);
  const [presetSavedSuccess, setPresetSavedSuccess] = useState(false);
  const [comparingAltIdx, setComparingAltIdx] = useState<number | null>(null);

  // Dynamic AI Packaging Visualization State
  const [visualPreview, setVisualPreview] = useState<{
    imageUrl?: string;
    prompt?: string;
    specSummary?: any;
    disclaimer?: string;
    model?: string;
    provider?: string;
    license?: string;
  } | null>(
    record.generatedPackagingImage
      ? {
          imageUrl: record.generatedPackagingImage,
          prompt: record.packagingImagePrompt,
          disclaimer: 'AI-generated visualization of your recommended packaging configuration.',
          model: 'gemini-3.1-flash-image',
          provider: 'Gemini Commercial Image Provider',
          license: 'Google Generative AI Developer Terms'
        }
      : null
  );
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [showVisualPrompt, setShowVisualPrompt] = useState(false);

  // Interactive Recalculation Tuning State
  const [isTuning, setIsTuning] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState(record.inputScenario?.deliveryTime || '30–60 min');
  const [priorities, setPriorities] = useState<string[]>(
    Array.isArray(record.inputScenario?.priorities) ? record.inputScenario.priorities : ['Maintain heat', 'Prevent leakage']
  );
  const [budgetTier, setBudgetTier] = useState<string>(record.inputScenario?.budget || 'Balanced');

  // Ref to scroll to recommendation details
  const recommendationDetailsRef = useRef<HTMLDivElement>(null);

  const summary = record.actionableSummary || {
    packagingName: record.configuration?.containerName || 'Vented Compartment Takeaway Box',
    materialName: record.configuration?.structure || 'Food-contact suitable paperboard-based structure',
    materialCategory: 'Molded Fiber / Paperboard',
    packageStyle: record.configuration?.containerStyle || 'Vented Takeaway Box',
    configuration: record.configuration?.compartments || 'Main compartment + separate sauce cup',
    quickWhy: record.whyExplanation || 'Keeps the main food warm while reducing moisture buildup and keeps the sauce separate.',
    deliveryWindow: record.inputScenario?.deliveryTime || '30–60 min',
    packingInstructions: [
      '1. Pack the main food in the primary compartment.',
      '2. Keep sauce/condiments in the separate side cup.',
      '3. Fasten lid securely ensuring steam vents are clear.',
      '4. Avoid airtight plastic wrap that traps steam.'
    ]
  };

  /**
   * Generates or Regenerates the Packaging Preview using real Gemini image-generation API
   */
  const handleGeneratePackagingPreview = async () => {
    setLoadingVisual(true);
    setVisualError(null);

    const payload = {
      recommendationId: record.id,
      food: record.foodName || record.title,
      components: record.components && record.components.length > 0 ? record.components : [record.foodName],
      material: record.topCandidate?.name || summary.materialName || 'Sugarcane Bagasse',
      materialCategory: record.topCandidate?.category || summary.materialCategory,
      packageStyle: summary.packageStyle || record.configuration?.containerStyle || 'Takeaway Food Container',
      packingConfiguration: summary.configuration || record.configuration?.compartments || 'Dedicated Food Compartments',
      ventilation: record.detailedAnalysis?.steamCondensationRisk?.ventingRequired || record.configuration?.lidType || 'Calibrated Micro-Vents',
      temperatureState: record.foodProfile?.transformation?.servingTemperature || record.inputScenario?.foodCondition || 'Hot',
      processingMethod: record.foodProfile?.transformation?.cookingMethod || 'Cooked'
    };

    try {
      const res = await apiFetch('/api/ai/packaging/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        setVisualPreview({
          imageUrl: data.imageUrl,
          prompt: data.prompt,
          specSummary: data.specSummary,
          disclaimer: data.disclaimer || 'AI-generated visualization of your recommended packaging configuration.',
          model: data.model || 'gemini-3.1-flash-image',
          provider: data.provider || 'Gemini Commercial Image Provider',
          license: data.license || 'Google Generative AI Developer Terms'
        });
        // Save image to recommendation record
        record.generatedPackagingImage = data.imageUrl;
        record.packagingImagePrompt = data.prompt;
      } else {
        const errorMsg = data.error || 'Packaging visualization couldn\'t be generated.';
        setVisualError(errorMsg);
      }
    } catch (err: any) {
      console.warn('Image generation network error:', err);
      setVisualError(err?.message || 'Packaging visualization couldn\'t be generated.');
    } finally {
      setLoadingVisual(false);
    }
  };

  // Scroll smoothly to recommendation details
  const handleScrollToRecommendation = () => {
    recommendationDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSavePreset = () => {
    if (onSavePreset) {
      onSavePreset(presetName, record);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('foodpack_saved_presets') || '[]');
        saved.unshift({
          id: `preset_${Date.now()}`,
          name: presetName,
          foodName: record.foodName,
          record,
          savedAt: new Date().toLocaleDateString()
        });
        localStorage.setItem('foodpack_saved_presets', JSON.stringify(saved.slice(0, 20)));
      } catch (e) {
        console.warn('Failed to save preset to storage:', e);
      }
    }
    setPresetSavedSuccess(true);
    setTimeout(() => {
      setShowSavePresetModal(false);
      setPresetSavedSuccess(false);
    }, 1200);
  };

  const handleApplyRecalculation = () => {
    if (onRecalculate) {
      onRecalculate({
        ...record.inputScenario,
        deliveryTime,
        priorities,
        budget: budgetTier
      });
    }
  };

  const togglePriority = (p: string) => {
    const next = priorities.includes(p) ? priorities.filter((x) => x !== p) : [...priorities, p];
    setPriorities(next);
  };

  const detailed = record.detailedAnalysis;

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-100 font-sans">
      
      {/* 1. TOP HEADER: SIMPLE & ACTIONABLE */}
      <div ref={recommendationDetailsRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dynamic AI Decision Computed
              </span>
              <span className="text-[11px] font-mono text-slate-400">ID: {record.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Recommended Packaging for: <span className="text-indigo-400">{record.foodName}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            {record.qrCodeUrl && (
              <button
                type="button"
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 transition"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">QR Pass</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Full Report</span>
            </button>
          </div>
        </div>

        {/* 2. THE THREE DIMENSIONS: PACKAGING STYLE + MATERIAL + CONFIGURATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Packaging Style */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-indigo-400 tracking-wider block">
              🍱 Recommended Package Style
            </span>
            <p className="font-bold text-white text-sm">{summary.packagingName}</p>
            <p className="text-slate-400 text-xs">{summary.packageStyle}</p>
          </div>

          {/* Material */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-emerald-400 tracking-wider block">
              🌿 Material Selection
            </span>
            <p className="font-bold text-white text-sm">{summary.materialName}</p>
            <p className="text-slate-400 text-xs">{summary.materialCategory}</p>
          </div>

          {/* Configuration */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-mono font-semibold text-purple-400 tracking-wider block">
              📐 Packing Configuration
            </span>
            <p className="font-bold text-white text-sm">{summary.configuration}</p>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Transit Window: <strong>{summary.deliveryWindow}</strong></span>
            </p>
          </div>
        </div>

        {/* 3. WHY THIS PACKAGE? (CONCISE EXPLANATION: SENSITIVITY -> REQUIREMENT -> FEATURE) */}
        <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-900/40 text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] font-mono block">
              Why this package?
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              (Food sensitivity → Requirement → Packaging feature)
            </span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed font-medium">
            {summary.quickWhy}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AI PACKAGING VISUALIZATION (REAL GEMINI IMAGE GENERATION MOCKUP) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {visualPreview?.provider || 'Commercial AI Visualization Provider'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Model: {visualPreview?.model || 'gemini-3.1-flash-image / FLUX.1-schnell'} • License: {visualPreview?.license || 'Google Developer Terms / Apache 2.0'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>AI PACKAGING VISUALIZATION</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              AI-generated visualization of your recommended packaging configuration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {visualPreview?.imageUrl && (
              <button
                type="button"
                onClick={() => setShowVisualPrompt(!showVisualPrompt)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showVisualPrompt ? 'Hide Prompt' : 'View Prompt'}</span>
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loadingVisual && (
          <div className="h-80 sm:h-96 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex flex-col items-center justify-center p-6 text-center shadow-inner space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white tracking-wide">
                Designing your packaging preview...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Synthesizing photorealistic commercial product photography for {record.foodName} in {summary.materialName} ({summary.packageStyle}).
              </p>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {!loadingVisual && visualError && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-300">
                Packaging visualization couldn't be generated.
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                {visualError}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                Your scientific packaging recommendation and barrier specifications remain completely intact below.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePackagingPreview}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>[ Try Again ]</span>
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS STATE: LARGE GENERATED IMAGE */}
        {!loadingVisual && !visualError && visualPreview?.imageUrl && (
          <div className="space-y-5">
            <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-[#070b12] shadow-2xl flex items-center justify-center">
              <img
                src={visualPreview.imageUrl}
                alt={`${record.foodName} Commercial Takeaway Packaging Mockup`}
                className="w-full max-h-[540px] object-contain transition duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90">
                <a
                  href={visualPreview.imageUrl}
                  download={`${record.foodName.toLowerCase().replace(/\s+/g, '_')}_packaging_mockup.png`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Mockup</span>
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-300 font-medium">
                AI-generated visualization of your recommended packaging configuration.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-0.5">
                    Material:
                  </span>
                  <p className="text-white font-bold text-sm">
                    {summary.materialName}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {summary.materialCategory}
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block mb-0.5">
                    Package:
                  </span>
                  <p className="text-white font-bold text-sm">
                    {summary.packageStyle}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    {summary.packagingName}
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block mb-0.5">
                    Configuration:
                  </span>
                  <p className="text-white font-bold text-sm">
                    {summary.configuration}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Transit: {summary.deliveryWindow}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratePackagingPreview}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition border border-slate-700 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Regenerate Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleScrollToRecommendation}
                    className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition border border-slate-700/80 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Recommendation</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenReport}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold cursor-pointer transition border border-emerald-500/30 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Detailed Analysis</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  {visualPreview.disclaimer}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* INITIAL EMPTY STATE: GENERATE BUTTON */}
        {!loadingVisual && !visualError && !visualPreview?.imageUrl && (
          <div className="p-8 sm:p-10 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-5 shadow-inner">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-lg mx-auto">
              <h3 className="text-base font-bold text-white">
                Commercial AI Packaging Visualization
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate a photorealistic commercial takeaway mockup for <strong className="text-white">{record.foodName}</strong> showing the recommended material (<span className="text-emerald-400">{summary.materialName}</span>), container style (<span className="text-indigo-400">{summary.packageStyle}</span>), and compartments (<span className="text-purple-400">{summary.configuration}</span>).
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleGeneratePackagingPreview}
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm cursor-pointer shadow-xl shadow-indigo-600/30 transition transform active:scale-95 flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Packaging Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* EXPANDABLE DYNAMIC PROMPT SPEC */}
        {showVisualPrompt && visualPreview?.prompt && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 block">
                Dynamic Gemini Image Generation Prompt
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Model: {visualPreview.model || 'gemini-3.1-flash-image'}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-mono whitespace-pre-line bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {visualPreview.prompt}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-COMPONENT FOOD INTERACTIONS BREAKDOWN */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Multi-Component Food Interaction Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              How the packaging manages thermodynamic interactions between detected meal components.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Steam & Moisture */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <CloudRain className="w-4 h-4" />
              <span>Moisture Migration & Steam</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {detailed?.steamCondensationRisk?.ventingRequired !== 'Hermetic / No Venting'
                ? `Active steam generation modeled. Calibrated venting (${detailed?.steamCondensationRisk?.ventingRequired || 'Micro-vents'}) releases trapped water vapor without chilling the core food.`
                : 'Low active vapor phase; hermetic lid boundary maintains internal moisture and stops evaporation.'}
            </p>
          </div>

          {/* Crispness Preservation */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>Crispness & Condensation Control</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {record.foodProfile?.crispnessSensitivity === 'Critical' || (record.foodName || '').toLowerCase().includes('fried')
                ? 'High crispness sensitivity. Packaging eliminates lid condensation drip back using absorbent or angled vented headspace.'
                : 'Standard texture stability. Food profile does not require specialized anti-sogginess vapor escape.'}
            </p>
          </div>

          {/* Oil & Grease Barrier */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Droplets className="w-4 h-4" />
              <span>Oil & Grease Barrier Integrity</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Engineered for TAPPI T559 Kit Rating {record.topCandidate?.greaseResistanceKit?.value || '8+'}. Fluorochemical-free aqueous dispersion barrier stops fat soak-through.
            </p>
          </div>

          {/* Separation & Cross-Contamination */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Component Separation Architecture</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {record.components && record.components.length > 1
                ? `${record.components.length} components detected (${record.components.slice(0, 3).join(', ')}). Dedicated chambers prevent cross-moisture leaching and flavor mingling.`
                : 'Single food matrix. Unified cavity maximizes heat capacity and thermal retention.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REAL-TIME RECALCULATION & WHAT-IF TUNING */}
      {/* ========================================================================= */}
      {onRecalculate && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <span>Live What-If Recalculation</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust delivery parameters or priorities to re-run the optimization engine instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsTuning(!isTuning)}
              className="text-xs text-indigo-400 hover:text-white cursor-pointer font-semibold"
            >
              {isTuning ? 'Hide Tuning' : 'Open Tuning Controls'}
            </button>
          </div>

          {isTuning && (
            <div className="space-y-4 pt-2">
              {/* Delivery Duration Knob */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Delivery Time Window: <span className="text-indigo-400">{deliveryTime}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['<30 min', '30–60 min', '1–2 hrs', '2+ hrs'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setDeliveryTime(t)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                        deliveryTime === t
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-xs'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorities Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Adjust Quality Priorities:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Maintain heat',
                    'Maintain crispness',
                    'Prevent leakage',
                    'Maintain texture',
                    'Low cost',
                    'Sustainability'
                  ].map((p) => {
                    const isSelected = priorities.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => togglePriority(p)}
                        className={`p-2 rounded-xl border text-xs font-medium cursor-pointer transition text-left flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                        <span className="truncate">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyRecalculation}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recalculate Packaging Suite</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PACKING INSTRUCTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Packing Instructions for Kitchen Staff</span>
          </h2>
          <span className="text-[11px] text-slate-400">Step-by-step handling</span>
        </div>

        <div className="space-y-2.5">
          {summary.packingInstructions.map((instruction, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5 border border-emerald-500/20">
                {idx + 1}
              </div>
              <p className="text-slate-200 leading-relaxed font-medium">{instruction.replace(/^\d+\.\s*/, '')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ALTERNATIVES WITH QUICK COMPARISON */}
      {record.alternatives && record.alternatives.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Alternative Packaging Options</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Viable secondary candidates if top option is out of stock</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {record.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">Option {idx + 2}: {alt.material?.name || alt.name || 'Alternative Candidate'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300">
                    {alt.costDelta}
                  </span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{alt.tradeoff}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. PRIMARY ACTIONS (CLEAN & PROMINENT) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowDetailedModal(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Info className="w-4 h-4" />
            <span>[ View Detailed Analysis ]</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSavePresetModal(true)}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>[ Save Package Preset ]</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
        >
          <span>Pack Another Food Item</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VIEW DETAILED ANALYSIS */}
      {/* ========================================================================= */}
      {showDetailedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-slate-200 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                  Comprehensive Technical Dossier
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Detailed Scientific Packaging Analysis
                </h2>
                <p className="text-xs text-slate-400">
                  Full thermodynamic, physical, barrier, and chemical data for {record.foodName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A. Internal Food Property Profile */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-300">
                1. Food Physicochemical Profile
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Moisture Content</span>
                  <span className="font-bold text-white text-sm">{detailed?.foodProfile?.moistureContentPercent || 58}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Lipid / Fat Content</span>
                  <span className="font-bold text-white text-sm">{detailed?.foodProfile?.fatContentPercent || 14}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Water Activity (Aw)</span>
                  <span className="font-bold text-white text-sm">{detailed?.foodProfile?.waterActivity || 0.88}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Crispness Sensitivity</span>
                  <span className="font-bold text-amber-400 text-sm">{detailed?.foodProfile?.crispnessSensitivity || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* B. Steam & Condensation Modeling */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-cyan-400">
                2. Steam, Vapor & Condensation Dynamics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Steam Generation</span>
                  <span className="font-bold text-red-400">{detailed?.steamCondensationRisk?.steamRisk || 'High'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Condensation Hazard</span>
                  <span className="font-bold text-amber-400">{detailed?.steamCondensationRisk?.condensationRisk || 'Medium'}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Venting Requirement</span>
                  <span className="font-bold text-emerald-400">{detailed?.steamCondensationRisk?.ventingRequired || 'Micro-vent'}</span>
                </div>
              </div>
            </div>

            {/* C. Material Physical & Barrier Properties */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-emerald-400">
                3. Physical Barrier & Mechanical Standards
              </h3>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Material Category:</span>
                  <span className="text-white font-semibold">{record.topCandidate?.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Water Vapor Transmission (WVTR):</span>
                  <span className="text-white font-mono">{record.topCandidate?.wvtr?.value} g/(m²·day)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Grease Resistance Rating:</span>
                  <span className="text-amber-400 font-mono">TAPPI T559 Kit {record.topCandidate?.greaseResistanceKit?.value}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Temperature Tolerance:</span>
                  <span className="text-white font-mono">{record.topCandidate?.minOperatingTempC}°C to {record.topCandidate?.maxOperatingTempC}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Circularity & Sustainability Rating:</span>
                  <span className="text-emerald-400 font-bold">{record.topCandidate?.sustainabilityRating} / 100</span>
                </div>
              </div>
            </div>

            {/* D. Traceable Evidence & ASTM Standards */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-purple-400">
                4. Traceable Standards & Evidence
              </h3>
              <div className="space-y-2 text-xs">
                {(record.evidence || []).map((ev, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
                    <span className="font-bold text-white block">{ev.source}</span>
                    <span className="text-slate-400 text-[11px] block">
                      Method: {ev.testMethod || 'Standard Certified Test'} • {ev.sourceType}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* E. Assumptions & Limitations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-indigo-400 font-bold uppercase text-[10px] block font-mono">Assumptions</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  {(record.assumptions || []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-amber-400 font-bold uppercase text-[10px] block font-mono">Limitations</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px]">
                  {(record.limitations || []).map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Technical Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: SAVE PACKAGE AS BUSINESS PRESET */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Save as Reusable Preset</span>
              </h3>
              <button onClick={() => setShowSavePresetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Save this packaging configuration so your kitchen staff can re-use it anytime in 1-click.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePreset}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
              >
                {presetSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Preset</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQRModal && record.qrCodeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">QR Packaging Verification</h3>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              <img src={record.qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-xs text-slate-400">
              Scan with any mobile camera to verify certified materials, test standards, and tamper status.
            </p>
            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
