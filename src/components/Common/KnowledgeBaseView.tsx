import React, { useState, useEffect } from 'react';
import { Database, BookOpen, Layers, Award, Search, Info } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { PackagingMaterial, FoodCommodity } from '../../types';

export const KnowledgeBaseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATERIALS' | 'FOODS'>('MATERIALS');
  const [materials, setMaterials] = useState<PackagingMaterial[]>([]);
  const [foods, setFoods] = useState<FoodCommodity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, foodRes] = await Promise.all([
          apiFetch('/api/knowledge/materials'),
          apiFetch('/api/knowledge/foods')
        ]);
        if (matRes.ok && foodRes.ok) {
          const matData = await matRes.json();
          const foodData = await foodRes.json();
          setMaterials(matData.materials || []);
          setFoods(foodData.foods || []);
        }
      } catch (err) {
        console.error('Failed to load knowledge base:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFoods = foods.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-200">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase mb-1">
          <Database className="w-4 h-4" />
          <span>Section 14 & 15: Traceable Scientific Knowledge Base</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Certified Packaging Materials & Food Physico-Chemicals
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Every barrier metric in FOODPACK-AI contains complete scientific data provenance: test method (ASTM D3985, ASTM F1249, TAPPI T559), test temperature, relative humidity, material thickness, date, and source classification.
        </p>

        {/* Tab Switcher & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('MATERIALS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'MATERIALS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Packaging Materials Database ({materials.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('FOODS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'FOODS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Food Physico-Chemical Database ({foods.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, standard, or polymer code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* MATERIALS TAB */}
      {activeTab === 'MATERIALS' && (
        <div className="space-y-4">
          {filteredMaterials.map((mat) => (
            <div key={mat.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base">{mat.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{mat.code}</span>
                    <span>•</span>
                    <span className="text-indigo-400">{mat.category}</span>
                    <span>•</span>
                    <span>Recyclability: {mat.recyclabilityCode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Circularity</span>
                    <span className="text-sm font-bold text-emerald-400">{mat.sustainabilityRating}/100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">Base Unit Cost</span>
                    <span className="text-sm font-bold text-white font-mono">₹{mat.estimatedCostPerUnitINR.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{mat.description}</p>

              {/* Provenance Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 uppercase font-mono text-[10px] block">OTR (Oxygen Transmission)</span>
                  <span className="text-base font-bold text-amber-300 font-mono">
                    {mat.otr.value} {mat.otr.provenance.unit}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Method: {mat.otr.provenance.testMethod || 'ASTM D3985'} @ {mat.otr.provenance.testTemperatureC}°C
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    Source: {mat.otr.provenance.source} ({mat.otr.provenance.sourceType})
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 uppercase font-mono text-[10px] block">WVTR (Water Vapor Transmission)</span>
                  <span className="text-base font-bold text-cyan-300 font-mono">
                    {mat.wvtr.value} {mat.wvtr.provenance.unit}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Method: {mat.wvtr.provenance.testMethod || 'ASTM F1249'} @ {mat.wvtr.provenance.testTemperatureC}°C / {mat.wvtr.provenance.testRelativeHumidity}% RH
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    Source: {mat.wvtr.provenance.source} ({mat.wvtr.provenance.sourceType})
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 uppercase font-mono text-[10px] block">Grease Barrier (Hot Oil)</span>
                  <span className="text-base font-bold text-emerald-300 font-mono">
                    TAPPI T559 Kit {mat.greaseResistanceKit.value} / 12
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Thermal Range: {mat.minOperatingTempC}°C to {mat.maxOperatingTempC}°C
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">
                    Source: {mat.greaseResistanceKit.provenance.source}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOODS TAB */}
      {activeTab === 'FOODS' && (
        <div className="space-y-4">
          {filteredFoods.map((food) => (
            <div key={food.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-white text-base">{food.name}</h3>
                  <span className="text-xs text-indigo-400 font-mono">{food.category} • State: {food.defaultState}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Source: <strong className="text-slate-200">{food.provenance?.source}</strong> ({food.provenance?.sourceType})
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Moisture Content</span>
                  <span className="text-white font-bold">{food.moistureContentPercent}%</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Water Activity (Aw)</span>
                  <span className="text-cyan-300 font-bold">{food.waterActivity}</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">pH / Acidity</span>
                  <span className="text-amber-300 font-bold">{food.pH}</span>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Fat Content</span>
                  <span className="text-rose-300 font-bold">{food.fatContentPercent}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                  Steam Risk: <strong className="text-white">{food.steamGenerationRisk}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                  Crispness Sensitivity: <strong className="text-white">{food.crispnessSensitivity}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                  Grease Migration: <strong className="text-white">{food.greaseMigrationTendency}</strong>
                </span>
                {food.respirationRateClass && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono">
                    Respiration Class: {food.respirationRateClass} ({food.respirationRateMgCO2PerKgHr} mg CO₂/kg·hr)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
