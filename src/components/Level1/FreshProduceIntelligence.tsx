import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Wind,
  Thermometer,
  ShieldCheck,
  Award,
  ArrowRight,
  AlertTriangle,
  Droplets,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Radio,
  Mic,
  Volume2,
  Cpu,
  Globe,
  Sparkles,
  Truck,
  RotateCcw,
  Activity,
  Layers,
  Check,
  Package
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Level1Input, Level1RecommendationResult } from '../../../server/engines/levelEngines';
import { FarmerVoiceAssistant, GeminiLiveVisualStatus } from './FarmerVoiceAssistant';
import { useFarmerContext } from './useFarmerContext';
import { ProducePackagingVisualization } from './ProducePackagingVisualization';
import { PackagingImageLibraryModal } from '../Admin/PackagingImageLibraryModal';

export const FreshProduceIntelligence: React.FC = () => {
  // Structured Farmer Crop Context hook (persists across language switches)
  const {
    cropProfile,
    updateFromExtractedData,
    resetCropProfile,
    isProfilePopulated,
    completenessPercentage
  } = useFarmerContext();

  // Gemini Live HUD states
  const [liveStatus, setLiveStatus] = useState<GeminiLiveVisualStatus>('idle');
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'hi' | 'te' | 'ta' | 'kn'>('en');

  // Manual DSS parameters
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
  const [showManualLabControls, setShowManualLabControls] = useState(false);
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);

  // Sync cropProfile with manual DSS parameters when crop is extracted
  useEffect(() => {
    if (cropProfile.commodity || cropProfile.crop) {
      setCommodityName(cropProfile.commodity || cropProfile.crop);
    }
    if (cropProfile.storageTemperature != null) {
      setStorageTempC(cropProfile.storageTemperature);
    }
    if (cropProfile.transportDurationDays != null) {
      setTransportDays(cropProfile.transportDurationDays);
    }
    if (cropProfile.refrigeration != null) {
      setStorageType(cropProfile.refrigeration ? 'Cold Storage (Refrigerated)' : 'Ambient Warehouse');
    }
  }, [cropProfile.commodity, cropProfile.crop, cropProfile.storageTemperature, cropProfile.transportDurationDays, cropProfile.refrigeration]);

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

  const languageMetadata: Record<string, { name: string; native: string; code: string; color: string; bg: string; border: string }> = {
    en: { name: 'English', native: 'English', code: 'EN', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    te: { name: 'Telugu', native: 'తెలుగు', code: 'TE', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
    hi: { name: 'Hindi', native: 'हिन्दी', code: 'HI', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    ta: { name: 'Tamil', native: 'தமிழ்', code: 'TA', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    kn: { name: 'Kannada', native: 'ಕನ್ನಡ', code: 'KN', codeColor: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' } as any
  };

  const currentLang = languageMetadata[activeLanguage] || languageMetadata.en;

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200 font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
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

        <button
          type="button"
          onClick={() => setShowImageLibraryModal(true)}
          className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-2.5 transition shrink-0 cursor-pointer shadow-lg shadow-slate-950/40"
          title="Browse Certified Packaging Records, Real Images & Views"
        >
          <Package className="w-4 h-4 text-emerald-400" />
          <span>Packaging Asset Library</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* GEMINI LIVE VISUAL HUD (Heads-Up Display) */}
      {/* Displays: Status (Listening, Processing, Speaking), Detected Language & Persistent Crop Profile */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all">
        {/* Ambient background glow according to live state */}
        <div
          className={`absolute -top-12 -right-12 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            liveStatus === 'listening'
              ? 'bg-emerald-500/20'
              : liveStatus === 'processing'
              ? 'bg-amber-500/20'
              : liveStatus === 'speaking'
              ? 'bg-cyan-500/20'
              : 'bg-slate-700/10'
          }`}
        />

        <div className="relative z-10 space-y-5">
          {/* Top Row: System Title & Dual Status Indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            {/* Title / Architecture Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Radio className={`w-5 h-5 ${liveStatus !== 'idle' ? 'animate-pulse text-emerald-300' : 'text-emerald-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Gemini Live Real-Time Audio HUD
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold uppercase">
                    Level 1 Voice Core
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  Continuous Speech Input • Context Memory • Voice Output Layer
                </p>
              </div>
            </div>

            {/* Live Indicators (Status & Detected Language) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              
              {/* INDICATOR 1: CURRENT GEMINI LIVE STATUS (Listening, Processing, Speaking, Standby) */}
              <div className="flex items-center">
                {liveStatus === 'listening' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-pulse">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <Mic className="w-4 h-4 text-emerald-300" />
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">Listening</span>
                    {/* Visual soundwave bars */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                {liveStatus === 'processing' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                    <Cpu className="w-4 h-4 text-amber-300 animate-spin" />
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">Processing</span>
                    <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">• Understanding Context</span>
                  </div>
                )}

                {liveStatus === 'speaking' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                    <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                    <span className="text-xs font-bold font-mono tracking-wider uppercase">Speaking</span>
                    {/* Audio wave pulse */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
                      <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse" />
                      <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
                    </div>
                  </div>
                )}

                {liveStatus === 'idle' && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
                    <span className="text-xs font-bold font-mono tracking-wider uppercase text-slate-300">Standby</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">• Ready</span>
                  </div>
                )}
              </div>

              {/* INDICATOR 2: ACTIVE LANGUAGE DETECTED */}
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl ${currentLang.bg} ${currentLang.border} border shadow-sm`}>
                <Globe className={`w-3.5 h-3.5 ${currentLang.color}`} />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">
                    {currentLang.native}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-900/80 border border-slate-700 font-bold ${currentLang.color}`}>
                    {currentLang.code}
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 hidden md:inline ml-0.5 font-medium">
                  Detected
                </span>
              </div>

            </div>
          </div>

          {/* Bottom Row: Structured Crop Profile Managed by useFarmerContext */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Crop / Commodity */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Crop Commodity</span>
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-bold text-sm text-white truncate">
                {cropProfile.crop || cropProfile.commodity || (
                  <span className="text-slate-500 font-normal italic text-xs">Awaiting voice...</span>
                )}
              </div>
              <div className="text-[10px] text-emerald-400/90 font-mono mt-1 truncate">
                {cropProfile.variety ? `Var: ${cropProfile.variety}` : 'Profile Sync Active'}
              </div>
            </div>

            {/* 2. Quantity Harvested */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Quantity</span>
                <Layers className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="font-bold text-sm text-white truncate">
                {cropProfile.quantity || (
                  <span className="text-slate-500 font-normal italic text-xs">Not specified</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                {cropProfile.harvestStage || 'Dynamic Extracted'}
              </div>
            </div>

            {/* 3. Transport & Transit */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Transit Time</span>
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="font-bold text-sm text-white truncate">
                {cropProfile.transportDurationDays != null
                  ? `${cropProfile.transportDurationDays} Day${cropProfile.transportDurationDays > 1 ? 's' : ''}`
                  : cropProfile.transportDistance
                  ? `${cropProfile.transportDistance}`
                  : (
                    <span className="text-slate-500 font-normal italic text-xs">Determining...</span>
                  )}
              </div>
              <div className="text-[10px] text-cyan-400/90 font-mono mt-1 truncate">
                {cropProfile.transportMode || cropProfile.destination || 'Road Transit'}
              </div>
            </div>

            {/* 4. Storage & Temperature */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Storage & Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="font-bold text-sm text-white truncate">
                {cropProfile.storageTemperature != null
                  ? `${cropProfile.storageTemperature}°C`
                  : cropProfile.refrigeration === true
                  ? 'Cold Storage'
                  : cropProfile.refrigeration === false
                  ? 'Ambient Warehouse'
                  : (
                    <span className="text-slate-500 font-normal italic text-xs">Auto Selection</span>
                  )}
              </div>
              <div className="text-[10px] text-amber-400/90 font-mono mt-1 truncate">
                {cropProfile.storageType || (cropProfile.refrigeration ? 'Refrigerated' : 'Ambient')}
              </div>
            </div>
          </div>

          {/* Completeness & Persistence Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-slate-300">Context Completeness:</span>
                <span className="font-mono font-bold text-emerald-400">{completenessPercentage}%</span>
              </div>
              <div className="w-28 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completenessPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Persists across language switches
              </span>
              {isProfilePopulated && (
                <button
                  type="button"
                  onClick={resetCropProfile}
                  className="text-[10px] font-mono text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 px-2 py-1 rounded-xl border border-slate-700 hover:border-rose-500/30 transition flex items-center gap-1"
                  title="Clear crop context for a new harvesting batch"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURE 1: REAL FARMER EXPERT-BUDDY VOICE CONVERSATION INTERFACE */}
      <FarmerVoiceAssistant
        onSyncParameters={handleSyncVoiceParameters}
        onLiveStatusChange={setLiveStatus}
        onLanguageChange={setActiveLanguage}
        onExtractedContext={updateFromExtractedData}
        externalContext={cropProfile.rawContext}
      />

      {/* FEATURE 2: REAL PACKAGING ASSET & DYNAMIC "HOW TO PACK" VISUALIZATION */}
      <ProducePackagingVisualization
        cropName={cropProfile.crop || cropProfile.commodity || commodityName}
        recommendation={result}
        transportDays={cropProfile.transportDurationDays || transportDays}
        refrigeration={
          cropProfile.refrigeration !== null && cropProfile.refrigeration !== undefined
            ? cropProfile.refrigeration
            : String(storageType).includes('Refrigerated')
        }
        packagingFormatPreference={cropProfile.packagingFormatPreference || format}
        quantity={cropProfile.quantity}
      />

      {/* Advanced Food Technologist & Manual DSS Parameters (Collapsible Accordion) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden transition shadow-lg">
        <button
          type="button"
          onClick={() => setShowManualLabControls(!showManualLabControls)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Thermometer className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                Food Technologist & Laboratory Mode
              </span>
              <h3 className="text-base font-bold text-white">
                🔬 Advanced Technologist & Manual DSS Parameters
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{showManualLabControls ? 'Hide Manual Controls' : 'Open Manual Controls'}</span>
            {showManualLabControls ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />}
          </div>
        </button>

        {showManualLabControls && (
          <div className="p-6 sm:p-8 pt-2 border-t border-slate-800/80 space-y-6">
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

          {/* ========================================================================= */}
          {/* AUTHORITATIVE REAL PACKAGING ASSET & DYNAMIC "HOW TO PACK" VISUALIZATION */}
          {/* Sections A (What to Use), B (How to Pack), C (How to Handle / Transport) */}
          {/* ========================================================================= */}
          <ProducePackagingVisualization
            cropName={result.commodity.name || commodityName}
            recommendation={result}
            transportDays={transportDays}
            refrigeration={storageType.includes('Cold') || storageType.includes('Refrigerated')}
            packagingFormatPreference={format}
            quantity={cropProfile.quantity || undefined}
            onOpenAssetDetail={() => setShowImageLibraryModal(true)}
          />

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
        )}
      </div>

      {/* Packaging Asset Library & Image Management Modal */}
      {showImageLibraryModal && (
        <PackagingImageLibraryModal
          isOpen={showImageLibraryModal}
          onClose={() => setShowImageLibraryModal(false)}
        />
      )}

    </div>
  );
};
