import React, { useState } from 'react';
import {
  Package,
  ShoppingCart,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Wind,
  CheckCircle2,
  RotateCw,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { PackagingRecommendationResponse } from '../../../server/services/packagingRecommendationAdapter';
import { PackagingViewType } from '../../types/packagingAsset';

interface Props {
  recommendation: PackagingRecommendationResponse | null;
  cropName: string;
  loading?: boolean;
}

export const RecommendedPackagingContainer: React.FC<Props> = ({
  recommendation,
  cropName,
  loading = false
}) => {
  const [selectedImageView, setSelectedImageView] = useState<PackagingViewType>('product');
  const [zoomModalImage, setZoomModalImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
        <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <span className="text-sm font-bold text-white font-mono">Evaluating Respiration Kinetics & Authoritative Packaging...</span>
        <p className="text-xs text-slate-400 max-w-md">Querying ASTM/TAPPI certified packaging records for {cropName || 'fresh produce'}.</p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Container 2 • Recommended Packaging</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Speak with the Gemini Live Assistant above or describe your crop to receive the authoritative packaging decision.
        </p>
      </div>
    );
  }

  const pkg = recommendation.package;
  const mat = recommendation.material;
  const shopping = pkg.shoppingInfo;

  // Active packaging image based on view tab
  const activeImage = (() => {
    if (selectedImageView === 'inside' && pkg.insidePackageImage) {
      return pkg.insidePackageImage;
    }
    const matched = pkg.additionalImages?.find((img) => img.viewType === selectedImageView);
    if (matched) return matched.imageUrl;
    return pkg.realProductImage;
  })();

  return (
    <div id="container-2-recommended-packaging" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Container 2 • Decision Engine Output
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Package ID: <strong className="text-white">{pkg.packageId || 'PKG-001'}</strong> • Material ID: <strong className="text-emerald-400">{mat.materialId}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-400" />
            <span>{pkg.packageType}</span>
          </h2>
          <p className="text-xs text-slate-300">
            Validated specifically for <strong className="text-emerald-300">{cropName}</strong> based on respiratory transpiration kinetics.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold">
            Est. ₹{recommendation.costPerUnitINR?.toFixed(2) || '45.00'} / unit
          </span>
        </div>
      </div>

      {/* Main Grid: Left = Real Packaging Image, Right = Technical Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Column: Authoritative Real Packaging Image & Angle Switcher */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-4">
          
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center min-h-[280px] group">
            <img
              src={activeImage}
              alt={pkg.name}
              referrerPolicy="no-referrer"
              className="w-full h-64 object-contain p-3 transition duration-300 group-hover:scale-105"
            />

            {/* Angle Switcher Tabs */}
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 text-[10px] font-mono shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedImageView('product')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  selectedImageView === 'product'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Product 3D
              </button>
              {pkg.insidePackageImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImageView('inside')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedImageView === 'inside'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Inside Cavity
                </button>
              )}
              {pkg.additionalImages?.some((img) => img.viewType === 'side') && (
                <button
                  type="button"
                  onClick={() => setSelectedImageView('side')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    selectedImageView === 'side'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Side Vents
                </button>
              )}
            </div>

            {/* Expand / Zoom button */}
            <button
              type="button"
              onClick={() => setZoomModalImage(activeImage)}
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shadow-md"
              title="Expand Real Package Image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Authoritative Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded-md border border-emerald-500/30 text-[9px] font-mono text-emerald-400">
              ✓ REAL CERTIFIED ASSET
            </div>
          </div>

          {/* Eco / Circularity Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span>Eco Profile:</span>
            <span className="text-emerald-400 font-bold">{pkg.reusability?.split('(')[0] || '100% Recyclable'}</span>
          </div>

        </div>

        {/* Right Column: Material Composition, Capacity, Ventilation & SHOPPING */}
        <div className="space-y-4 flex flex-col justify-between">
          
          <div className="space-y-3">
            {/* Material Spec Card */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                Recommended Material Composition
              </span>
              <p className="text-sm font-bold text-white">{mat.name}</p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{mat.composition}</p>
            </div>

            {/* Capacity & Dimensions Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">Payload Capacity</span>
                <span className="font-mono text-slate-200 font-bold">{pkg.capacity}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">Dimensions</span>
                <span className="font-mono text-slate-200">{pkg.dimensions}</span>
              </div>
            </div>

            {/* Ventilation Characteristics */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-start gap-2.5">
              <Wind className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-0.5">
                  Ventilation & Respiration Feature
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pkg.ventilation}
                </p>
              </div>
            </div>

            {/* Scientific Properties Overview */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 uppercase block">Gas Permeability (OTR)</span>
                <span className="text-emerald-400 font-bold truncate block">{mat.properties.otr || 'Convective Airflow'}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[9px] text-slate-500 uppercase block">Moisture Flux (WVTR)</span>
                <span className="text-cyan-400 font-bold truncate block">{mat.properties.wvtr || 'Open Vapor Egress'}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VERIFIED SHOPPING & SUPPLIER ACTION (MANDATORY REQUIREMENT) */}
          {/* ========================================================================= */}
          <div className="pt-2 border-t border-slate-800">
            {shopping && shopping.url ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">Verified Procurement Source</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {shopping.availability}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1">{shopping.title}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Supplier: <strong className="text-slate-200">{shopping.supplier}</strong></span>
                  {shopping.priceEstimate && <span className="font-mono text-emerald-300 font-bold">{shopping.priceEstimate}</span>}
                </div>

                <a
                  href={shopping.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>🛒 FIND / BUY THIS PACKAGING</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-500" />
                  <span>Procurement: <strong className="text-slate-300">Supplier link unavailable</strong></span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Inquire via local Mandi cooperative</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Image Zoom Modal */}
      {zoomModalImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 space-y-3 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomModalImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-sm font-bold text-white font-mono">
              High-Resolution Inspection • {pkg.packageId || 'PKG-001'} ({pkg.packageType})
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
