import React, { useState } from 'react';
import { Sliders, Play, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Level4SimulationParams, Level4SimulationResult } from '../../../server/engines/levelEngines';

export const WhatIfSimulator: React.FC = () => {
  const [ambientTempC, setAmbientTempC] = useState(30);
  const [ambientRH, setAmbientRH] = useState(75);
  const [storageDays, setStorageDays] = useState(14);
  const [customOTR, setCustomOTR] = useState(45);
  const [customWVTR, setCustomWVTR] = useState(4.5);
  const [respRate, setRespRate] = useState(25);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<Level4SimulationResult | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const params: Level4SimulationParams = {
        ambientTempC,
        ambientRelativeHumidity: ambientRH,
        storageDays,
        customOTR,
        customWVTR,
        foodRespirationMgPerHr: respRate
      };

      const res = await apiFetch('/api/recommend/level4/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase">
          <Sliders className="w-4 h-4" />
          <span>Section 19: Dynamic What-If Kinetic Simulator</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Simulate Environmental & Barrier Permeation Dynamics
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Adjust temperature, humidity, storage time, and packaging transmission rates. The simulation applies Arrhenius temperature kinetics (Q10 ~ 2.0) and Fickian permeation flux to project headspace O₂/CO₂ concentration and quality degradation over time.
        </p>
      </div>

      {/* Control Sliders Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Ambient Temperature</span>
              <span className="font-mono text-indigo-400 font-bold">{ambientTempC}°C</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(parseInt(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Cold storage (2°C) to Peak Summer (45°C)</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Ambient Relative Humidity</span>
              <span className="font-mono text-cyan-400 font-bold">{ambientRH}% RH</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={ambientRH}
              onChange={(e) => setAmbientRH(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Monsoon humid (90%) vs Dry warehouse (30%)</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Storage / Transit Period</span>
              <span className="font-mono text-emerald-400 font-bold">{storageDays} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              value={storageDays}
              onChange={(e) => setStorageDays(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Simulated observation timeline</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Film OTR Barrier</span>
              <span className="font-mono text-amber-300 font-bold">{customOTR} cc/m²·day</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={customOTR}
              onChange={(e) => setCustomOTR(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Film WVTR Moisture Barrier</span>
              <span className="font-mono text-cyan-300 font-bold">{customWVTR} g/m²·day</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={customWVTR}
              onChange={(e) => setCustomWVTR(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Respiration Rate</span>
              <span className="font-mono text-purple-300 font-bold">{respRate} mg CO₂/kg·hr</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              value={respRate}
              onChange={(e) => setRespRate(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={runSimulation}
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{loading ? 'Simulating Fickian Flux...' : 'Run Dynamic What-If Simulation'}</span>
          </button>
        </div>
      </div>

      {/* SIMULATION RESULTS */}
      {simulationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-semibold uppercase text-indigo-400">Simulation Output</span>
              <h3 className="text-xl font-bold text-white mt-1">Headspace Gas & Quality Evolution</h3>
            </div>
            {simulationResult.criticalLimitReachedDay ? (
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded-full flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Critical Failure Boundary on Day {simulationResult.criticalLimitReachedDay}
              </span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Stable Equilibrium Maintained
              </span>
            )}
          </div>

          {simulationResult.failureMode && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              <strong>Primary Failure Trigger:</strong> {simulationResult.failureMode}
            </div>
          )}

          {/* Day-by-Day Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timeline</th>
                  <th className="py-2.5 px-3">Headspace O₂ (%)</th>
                  <th className="py-2.5 px-3">Headspace CO₂ (%)</th>
                  <th className="py-2.5 px-3">Moisture Gain (%)</th>
                  <th className="py-2.5 px-3">Quality Retention (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {simulationResult.dayByDayProjection.map((row) => (
                  <tr
                    key={row.day}
                    className={`hover:bg-slate-800/40 ${
                      row.day === simulationResult.criticalLimitReachedDay ? 'bg-red-500/10 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-300">Day {row.day}</td>
                    <td className={`py-2 px-3 ${row.headspaceO2Percent < 2.0 ? 'text-red-400' : 'text-slate-200'}`}>
                      {row.headspaceO2Percent}%
                    </td>
                    <td className="py-2 px-3 text-slate-200">{row.headspaceCO2Percent}%</td>
                    <td className="py-2 px-3 text-cyan-300">{row.productMoisturePercent}%</td>
                    <td className="py-2 px-3">
                      <span
                        className={`${
                          row.qualityIndexPercent > 80
                            ? 'text-emerald-400'
                            : row.qualityIndexPercent > 60
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {row.qualityIndexPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-semibold uppercase text-slate-300 block text-[10px] font-mono">
              Scientific Kinetic Assumptions
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {simulationResult.scientificNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};
