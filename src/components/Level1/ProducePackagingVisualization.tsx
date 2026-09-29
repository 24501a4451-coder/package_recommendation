import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Info,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Eye,
  Wind,
  Thermometer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import {
  PackagingAssetRecord,
  PackingConfiguration,
  PackingVisualizationResult,
  PackagingViewType
} from '../../types/packagingAsset';
import { Level1RecommendationResult } from '../../../server/engines/levelEngines';

interface Props {
  cropName: string;
  recommendation?: Level1RecommendationResult | null;
  transportDays?: number;
  refrigeration?: boolean;
  packagingFormatPreference?: string;
  quantity?: string;
  onOpenAssetDetail?: (asset: PackagingAssetRecord) => void;
}

export const ProducePackagingVisualization: React.FC<Props> = ({
  cropName,
  recommendation,
  transportDays = 3,
  refrigeration = false,
  packagingFormatPreference,
  quantity,
  onOpenAssetDetail
}) => {
  const [asset, setAsset] = useState<PackagingAssetRecord | null>(null);
  const [packingConfig, setPackingConfig] = useState<PackingConfiguration | null>(null);
  const [visualization, setVisualization] = useState<PackingVisualizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImageView, setSelectedImageView] = useState<PackagingViewType>('product');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  // Fetch authoritative packaging asset & packing visualization whenever recommendation or crop changes
  useEffect(() => {
    let isCancelled = false;

    const fetchPackagingAndVisuals = async () => {
      if (!cropName || cropName.trim() === '') return;
      setLoading(true);

      try {
        // Step 1: Resolve the exact authoritative packaging asset & packing configuration
        const resolveRes = await apiFetch('/api/packaging/resolve-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: cropName,
            transportDays,
            refrigeration,
            packagingFormat: packagingFormatPreference
          })
        });

        if (!resolveRes.ok) throw new Error('Failed to resolve packaging asset');
        const resolveData = await resolveRes.json();
        if (isCancelled) return;

        setAsset(resolveData.packagingAsset);
        setPackingConfig(resolveData.packingConfiguration);

        // Step 2: Generate / retrieve dynamic crop-inside-package visualization
        const vizRes = await apiFetch('/api/packaging/visualize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: cropName,
            materialId: resolveData.packagingAsset.materialId,
            transportDays,
            refrigeration,
            packagingFormat: packagingFormatPreference
          })
        });

        if (vizRes.ok) {
          const vizData = await vizRes.json();
          if (!isCancelled) {
            setVisualization(vizData.visualization);
          }
        }
      } catch (err) {
        console.error('Packaging visualization loading error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchPackagingAndVisuals();

    return () => {
      isCancelled = true;
    };
  }, [cropName, transportDays, refrigeration, packagingFormatPreference, recommendation]);

  if (!cropName || !asset || !packingConfig) {
    return null;
  }

  // Active packaging image based on selected view (product, inside, side, front)
  const activeImage = (() => {
    if (selectedImageView === 'inside' && asset.insidePackageImage) {
      return asset.insidePackageImage;
    }
    const matched = asset.additionalImages?.find((img) => img.viewType === selectedImageView);
    if (matched) return matched.imageUrl;
    return asset.realProductImage;
  })();

  return (
    <div className="space-y-6 text-slate-200 font-sans">
      
      {/* Visual Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Authoritative Packaging Decision
            </span>
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              ID: {asset.materialId} • {asset.validationStatus}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {asset.packageType}
          </h2>
          <p className="text-xs text-slate-300">
            Validated specifically for <strong className="text-emerald-300">{cropName}</strong> ({transportDays} Days Transit • {refrigeration ? 'Refrigerated Cold Chain' : 'Ambient Aerated Truck'})
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
            {asset.costInformation.unitCostEstimate.split('(')[0]}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE THREE VISUAL SECTIONS (WHAT TO USE, HOW TO PACK, HOW TO HANDLE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION A: WHAT SHOULD I USE? (REAL SELECTED PACKAGING ASSET) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                    Section A
                  </span>
                  <h3 className="text-base font-bold text-white">
                    WHAT SHOULD I USE?
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                {asset.materialId}
              </span>
            </div>

            {/* Real Packaging Image Display */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px] group">
              <img
                src={activeImage}
                alt={asset.materialName}
                referrerPolicy="no-referrer"
                className="w-full h-64 object-contain p-2 transition duration-300 group-hover:scale-105"
              />

              {/* View Angle Switcher Tabs */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSelectedImageView('product')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    selectedImageView === 'product'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Product
                </button>
                {asset.insidePackageImage && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageView('inside')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      selectedImageView === 'inside'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Inside
                  </button>
                )}
                {asset.additionalImages?.some((img) => img.viewType === 'side') && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageView('side')}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      selectedImageView === 'side'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Side Vents
                  </button>
                )}
              </div>

              {/* Zoom Action Button */}
              <button
                type="button"
                onClick={() => setZoomModalImage(activeImage)}
                className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Expand Real Packaging Image"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-800 text-[9px] font-mono text-emerald-400">
                ✓ REAL AUTHORITATIVE ASSET
              </div>
            </div>

            {/* Material & Package Spec Pills */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                  Material Composition
                </span>
                <p className="text-white font-medium">{asset.materialComposition}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">Dimensions</span>
                  <span className="font-mono text-slate-200">{asset.dimensions.description}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">Payload Capacity</span>
                  <span className="font-mono text-slate-200">{asset.capacity.description}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-start gap-2">
                <Wind className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    Ventilation Feature
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {asset.ventilationCharacteristics}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recyclability / Reusability badge */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Eco Profile:</span>
            <span className="text-emerald-400 font-bold">{asset.reusableRecyclableProperties.split('(')[0]}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* SECTION B: HOW SHOULD I PACK IT? (DYNAMIC CROP-INSIDE-PACKAGE VISUALIZATION) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                    Section B
                  </span>
                  <h3 className="text-base font-bold text-white">
                    HOW SHOULD I PACK IT?
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                {packingConfig.layerCount} Layer Arrangement
              </span>
            </div>

            {/* AI Crop-Inside-Package Visualization Display */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px] group">
              {visualization?.visualizationImageUrl ? (
                <img
                  src={visualization.visualizationImageUrl}
                  alt={`How to pack ${cropName} in ${asset.packageType}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-64 object-contain p-2 transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-mono">Generating crop packing visualization...</span>
                </div>
              )}

              {/* Visualization Indicator */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md border border-slate-700 text-[9px] font-mono text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>DYNAMIC CROP PACKING</span>
              </div>

              {/* Zoom Action Button */}
              {visualization?.visualizationImageUrl && (
                <button
                  type="button"
                  onClick={() => setZoomModalImage(visualization.visualizationImageUrl)}
                  className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                  title="Expand Packing Cutaway"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Packing Arrangement Specification */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Recommended Arrangement
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  Max Fill: {packingConfig.maxFillPercentage}%
                </span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {packingConfig.layerArrangement}
              </p>
              <div className="text-[11px] text-amber-300 font-mono pt-1 border-t border-slate-800/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Cushioning: {packingConfig.cushioningAndSeparation}</span>
              </div>
            </div>

            {/* Mandatory AI Visualization Disclaimer (Section 12) */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 text-[10px] text-slate-400 leading-relaxed italic">
              "AI-generated packing visualization. Final packaging dimensions, material specifications and engineering limits should follow the validated FOODPACK recommendation and supplier specifications."
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Package Fill Target:</span>
            <span className="text-cyan-400 font-bold">{packingConfig.quantityPerPackage}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* "WHY?" (SHORT, SIMPLE FARMER-FRIENDLY EXPLANATION) */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2 text-left shadow-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
            WHY SHOULD I USE THIS PACKAGING? (SIMPLE EXPLANATION)
          </h4>
        </div>
        <p className="text-sm text-indigo-100 leading-relaxed font-sans">
          {recommendation?.justNecessaryPackaging.explanation ||
            `Because freshly harvested ${cropName} is living plant tissue that constantly breathes and generates heat. If packed in regular airtight plastic bags, moisture pools rapidly and suffocates the produce, creating sour rot within 48 hours. This ${asset.packageType} provides calibrated air vents that allow respiration gases to escape while preserving moisture and shielding fruits from vehicle vibrations.`}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* PACKING STEPS (1, 2, 3, 4) & SECTION C: HOW TO HANDLE / TRANSPORT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* STEP-BY-STEP PACKING GUIDE */}
        <div className="p-5 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
              Step-by-Step Packing Instructions
            </h4>
          </div>

          <div className="space-y-2.5">
            {packingConfig.stepByStepInstructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-slate-200 leading-relaxed font-sans mt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION C: HOW TO HANDLE / TRANSPORT */}
        <div className="p-5 sm:p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wide font-mono">
              Section C • Handling & Transport Precautions
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            {/* Stacking Rule */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-cyan-500/30 space-y-1">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                Stacking Rule:
              </span>
              <p className="text-white font-medium">{packingConfig.stackingLimit}</p>
            </div>

            {/* Handling Rules */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Field Handling:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {packingConfig.handlingInstructions.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            {/* Transport Precautions */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Vehicle & Route Guidance:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {packingConfig.transportPrecautions.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DETAILED TECHNICAL ANALYSIS (COLLAPSIBLE ACCORDION TO KEEP MAIN SCREEN CLEAN) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold uppercase tracking-wider text-slate-300">
              Detailed Analysis & Scientific Engineering Properties
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <span>{showTechnicalDetails ? 'Collapse' : 'Expand Lab Specs'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTechnicalDetails && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Gas Permeability (OTR)</span>
                <span className="text-emerald-400 font-bold">{asset.scientificProperties.otr || 'Convective Airflow'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Water Vapor Flux (WVTR)</span>
                <span className="text-cyan-400 font-bold">{asset.scientificProperties.wvtr || 'Open Vapor Egress'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Perforation & Venting</span>
                <span className="text-amber-400 font-bold">{asset.scientificProperties.perforationType || 'Die-Cut Chimneys'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Impact Cushioning</span>
                <span className="text-slate-300">{asset.scientificProperties.cushioningGrade || 'Rigid Rim Deflection'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Operating Temp</span>
                <span className="text-slate-300">{asset.scientificProperties.operatingTempRange || '-10°C to +50°C'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Standards & Validation</span>
                <span className="text-teal-400 truncate block">{asset.source}</span>
              </div>
            </div>

            {recommendation && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300 font-sans text-xs">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                  Biological Respiration Kinetics (Q10 Arrhenius):
                </span>
                <p>
                  Respiration Rate: <strong>{recommendation.commodity.respirationRateMgCO2} mg CO₂/kg·hr</strong> • Transpiration VPD: <strong>{recommendation.commodity.transpirationVPDkPa} kPa</strong>
                </p>
                <p className="text-slate-400 text-[11px]">
                  Optimal Gas: {recommendation.commodity.optimalHeadspaceGas} • Calculated Fresh Window: {recommendation.estimatedShelfLifeDays.min} to {recommendation.estimatedShelfLifeDays.max} Days.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomModalImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 space-y-3 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomModalImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold"
            >
              ✕
            </button>
            <h4 className="text-sm font-bold text-white font-mono">
              High-Resolution Packaging Inspection • {asset.materialId}
            </h4>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center p-2">
              <img
                src={zoomModalImage}
                alt="Enlarged Packaging View"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
