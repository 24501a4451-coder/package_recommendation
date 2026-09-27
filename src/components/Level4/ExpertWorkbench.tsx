import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Layers,
  Database,
  Download,
  Award,
  Sliders,
  Stethoscope,
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Info,
  Check,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { PackagingMaterial } from '../../types';
import { WhatIfSimulator } from './WhatIfSimulator';
import { FailureDiagnosisTool } from './FailureDiagnosisTool';

export const ExpertWorkbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REVERSE_SEARCH' | 'NEW_MATERIAL' | 'TRAY_LID' | 'WHAT_IF' | 'DIAGNOSIS'>('REVERSE_SEARCH');
  
  // 1. Reverse Search State
  const [maxOTR, setMaxOTR] = useState<number>(100);
  const [maxWVTR, setMaxWVTR] = useState<number>(20);
  const [maxTemp, setMaxTemp] = useState<number>(100);
  const [compostableOnly, setCompostableOnly] = useState<boolean>(false);
  const [minGreaseKit, setMinGreaseKit] = useState<number>(8);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedReverseMat, setSelectedReverseMat] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // 2. New Material Submission State
  const [matName, setMatName] = useState('Recycled EVOH Barrier Nano-Laminate');
  const [matCategory, setMatCategory] = useState<any>('Engineered Barrier');
  const [matStructure, setMatStructure] = useState<any>('Co-extruded');
  const [subOTR, setSubOTR] = useState(1.2);
  const [subWVTR, setSubWVTR] = useState(0.9);
  const [subKit, setSubKit] = useState(10);
  const [subMaxTemp, setSubMaxTemp] = useState(125);
  const [subMinTemp, setSubMinTemp] = useState(-20);
  const [subThickness, setSubThickness] = useState(70);
  const [docName, setDocName] = useState('BASF-Technical-Data-Sheet-EVOH2026.pdf');
  const [subStatus, setSubStatus] = useState<'Extracted' | 'Pending validation' | 'Approved'>('Pending validation');
  const [subMessage, setSubMessage] = useState<string | null>(null);

  // 3. Tray + Lid Compatibility State
  const [trayId, setTrayId] = useState('mat_cpet_dual_ovenable');
  const [lidId, setLidId] = useState('mat_emap_microperf_pp');
  const [sealTemp, setSealTemp] = useState(165);
  const [trayLidResult, setTrayLidResult] = useState<any | null>(null);

  const runReverseSearch = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/recommend/level4/reverse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxOTR,
          maxWVTR,
          maxTemp,
          mustBeCompostable: compostableOnly,
          minGreaseKit
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.materials || []);
        if (data.materials && data.materials.length > 0) {
          setSelectedReverseMat(data.materials[0]);
        }
      }
    } catch (err) {
      console.error('Reverse search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubMessage(null);
    try {
      const res = await apiFetch('/api/recommend/level4/evaluate-new-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: matName,
          category: matCategory,
          structureType: matStructure,
          otrValue: subOTR,
          wvtrValue: subWVTR,
          greaseKit: subKit,
          maxOperatingTempC: subMaxTemp,
          minOperatingTempC: subMinTemp,
          thicknessMicrons: subThickness,
          sourceDocName: docName,
          validationStatus: subStatus
        })
      });
      if (res.ok) {
        setSubMessage(`Material "${matName}" registered with status: ${subStatus}. Added to database for food-matching evaluation.`);
        runReverseSearch();
      }
    } catch {
      setSubMessage('Failed to register new material.');
    }
  };

  const handleCheckTrayLid = async () => {
    try {
      const res = await apiFetch('/api/recommend/level4/tray-lid-compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trayMaterialId: trayId,
          lidMaterialId: lidId,
          sealingTempC: sealTemp
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrayLidResult(data);
      }
    } catch (err) {
      console.error('Tray lid compatibility error:', err);
    }
  };

  useEffect(() => {
    runReverseSearch();
    handleCheckTrayLid();
  }, []);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(searchResults, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FOODPACK-AI-Expert-Materials-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto text-slate-200 font-sans">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block mb-3">
          Level 4 • Technologist, Industrial R&D & Packaging Engineering
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Expert Packaging Research & Engineering Workbench
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Scientific laboratory interface for food packaging engineers, barrier technologists, and academic researchers. Perform reverse material search (Material → Food Application Matrix), evaluate new materials with validation status, check tray + lid sealing compatibility, and run kinetic headspace simulations.
        </p>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('REVERSE_SEARCH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'REVERSE_SEARCH'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Reverse Search & Food Matching</span>
          </button>

          <button
            onClick={() => setActiveTab('NEW_MATERIAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'NEW_MATERIAL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Material Evaluation</span>
          </button>

          <button
            onClick={() => setActiveTab('TRAY_LID')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRAY_LID'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tray + Lid Sealing Evaluator</span>
          </button>

          <button
            onClick={() => setActiveTab('WHAT_IF')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'WHAT_IF'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If Kinetic Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSIS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DIAGNOSIS'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Forensic Failure Diagnosis</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REVERSE MATERIAL SEARCH & FOOD APPLICATION MATCHING */}
      {activeTab === 'REVERSE_SEARCH' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-semibold uppercase text-purple-400 block">
                  Parametric Inverse Search
                </span>
                <h3 className="text-lg font-bold text-white">
                  "What foods could this packaging material potentially support?"
                </h3>
              </div>
              <button
                onClick={handleExportJSON}
                className="text-xs text-purple-300 hover:text-white bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-900/60 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dataset</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max OTR (cc/m²·day·atm)</label>
                <input
                  type="number"
                  value={maxOTR}
                  onChange={(e) => setMaxOTR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max WVTR (g/m²·day)</label>
                <input
                  type="number"
                  value={maxWVTR}
                  onChange={(e) => setMaxWVTR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Temperature (°C)</label>
                <input
                  type="number"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={runReverseSearch}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Execute Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results: Material -> Food Application Matching Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Material List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
              <span className="text-xs font-mono font-semibold uppercase text-purple-400 block border-b border-slate-800 pb-2">
                Matched Materials ({searchResults.length})
              </span>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {searchResults.map((item, idx) => {
                  const m = item.material;
                  const isSelected = selectedReverseMat?.material.id === m.id;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedReverseMat(item)}
                      className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-purple-500 bg-purple-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold block">{m.name}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{m.category}</span>
                      <div className="flex gap-2 mt-2 font-mono text-[10px] text-cyan-400">
                        <span>OTR: {m.otr.value}</span>
                        <span>WVTR: {m.wvtr.value}</span>
                        <span>Max: {m.maxOperatingTempC}°C</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Food Applications Matching Matrix */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              {selectedReverseMat ? (
                <>
                  <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-semibold uppercase text-purple-400 block">
                        Food Application Coverage Matrix
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        {selectedReverseMat.material.name}
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Validation: {selectedReverseMat.material.validationStatus || 'Validated'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evaluated against all food commodity categories in the database based on oxygen, moisture, grease, and thermal limits:
                  </p>

                  <div className="space-y-3">
                    {selectedReverseMat.compatibleFoodApplications?.map((app: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-sm">{app.foodName}</span>
                            <span className="text-slate-500 text-[11px] block">{app.category}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                              app.suitabilityScore >= 80
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : app.suitabilityScore >= 50
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {app.suitabilityScore}% Coverage
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">{app.shelfLifeEstimate}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="space-y-0.5">
                            <span className="text-emerald-400 font-semibold block">Sensitivities Covered:</span>
                            {app.sensitivitiesCovered.length > 0 ? (
                              <ul className="list-disc pl-4 text-slate-300 space-y-0.5">
                                {app.sensitivitiesCovered.map((c: string, i: number) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-500 italic">None</span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-amber-400 font-semibold block">Limitations / Unmet:</span>
                            {app.sensitivitiesUnmet.length > 0 ? (
                              <ul className="list-disc pl-4 text-slate-400 space-y-0.5">
                                {app.sensitivitiesUnmet.map((u: string, i: number) => (
                                  <li key={i}>{u}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-500 italic">Zero known limitations</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Select a material from the left panel to examine food application compatibility.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEW MATERIAL EVALUATION & VALIDATION STATUS */}
      {activeTab === 'NEW_MATERIAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-semibold uppercase text-purple-400">
              Expert Specification Ingestion
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              New Material Evaluation & Extraction
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter or extract physical properties from a technical data sheet (TDS). Mark validation status (Extracted, Pending validation, or Approved).
            </p>
          </div>

          {subMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{subMessage}</span>
            </div>
          )}

          <form onSubmit={handleEvaluateNewMaterial} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Material Name</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={matCategory}
                  onChange={(e) => setMatCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden"
                >
                  <option value="Engineered Barrier">Engineered Barrier</option>
                  <option value="Bioplastics">Bioplastics</option>
                  <option value="Cellulose / Paper">Cellulose / Paper</option>
                  <option value="Commodity Polymers">Commodity Polymers</option>
                  <option value="Molded Fiber">Molded Fiber</option>
                  <option value="Metal / Foil">Metal / Foil</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Validation Status</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden font-bold"
                >
                  <option value="Extracted">Extracted (Unverified OCR / Spec Sheet)</option>
                  <option value="Pending validation">Pending validation (Awaiting Third-Party Lab)</option>
                  <option value="Approved">Approved (Certified ASTM Laboratory Test)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">OTR (cc/m²·day·atm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={subOTR}
                  onChange={(e) => setSubOTR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">WVTR (g/m²·day)</label>
                <input
                  type="number"
                  step="0.1"
                  value={subWVTR}
                  onChange={(e) => setSubWVTR(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Grease Kit Rating (1-12)</label>
                <input
                  type="number"
                  value={subKit}
                  onChange={(e) => setSubKit(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Temp (°C)</label>
                <input
                  type="number"
                  value={subMaxTemp}
                  onChange={(e) => setSubMaxTemp(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Source Document / Provenance Citation</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Evaluate & Register Material into DSS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: TRAY + LID SEALING COMPATIBILITY EVALUATOR */}
      {activeTab === 'TRAY_LID' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-semibold uppercase text-purple-400">
              Bi-Component Packaging Mechanics
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Tray + Lidding Film Sealing Compatibility Evaluator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluates sealing temperature window, flange contact ratio, and composite barrier transmission for rigid tray + top web film.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tray Material</label>
              <select
                value={trayId}
                onChange={(e) => setTrayId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden"
              >
                <option value="mat_cpet_dual_ovenable">CPET Dual-Ovenable Tray (220°C)</option>
                <option value="mat_bagasse_clamshell">Sugarcane Bagasse Molded Pulp Bowl</option>
                <option value="mat_pp_hermetic_compartment">Polypropylene (PP 05) Tray (120°C)</option>
                <option value="mat_aluminum_foil_container">Rigid Aluminium Foil Pan (280°C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lidding Film Material</label>
              <select
                value={lidId}
                onChange={(e) => setLidId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-purple-500 focus:outline-hidden"
              >
                <option value="mat_emap_microperf_pp">Peelable BOPP Anti-Fog Lidding Film</option>
                <option value="mat_metallized_pet_foil_pouch">High-Barrier Retort Metallized Foil Lid</option>
                <option value="mat_kraft_pla_vented">Compostable PLA Clear Bio-Lid</option>
                <option value="mat_rpet_transparent_tamper_evident">Clear rPET Snap-Lock Dome Lid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Heat Sealing Temperature (°C)</label>
              <input
                type="number"
                value={sealTemp}
                onChange={(e) => setSealTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckTrayLid}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Evaluate Sealing Compatibility</span>
            </button>
          </div>

          {trayLidResult && (
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {trayLidResult.isThermallySafe ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="font-bold text-white text-sm">{trayLidResult.sealIntegrity}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">{trayLidResult.surfaceAreaRatio}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Composite OTR</span>
                  <span className="font-bold text-cyan-300 font-mono">{trayLidResult.compositeOTR} cc/(m²·day·atm)</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Composite WVTR</span>
                  <span className="font-bold text-indigo-300 font-mono">{trayLidResult.compositeWVTR} g/(m²·day)</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Sealing Setpoint</span>
                  <span className="font-bold text-white font-mono">{trayLidResult.sealingTemperatureC}°C</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                <strong>Technologist Recommendation:</strong> {trayLidResult.recommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WHAT IF KINETIC SIMULATOR */}
      {activeTab === 'WHAT_IF' && <WhatIfSimulator />}

      {/* TAB 5: FORENSIC FAILURE DIAGNOSIS */}
      {activeTab === 'DIAGNOSIS' && <FailureDiagnosisTool />}

    </div>
  );
};
