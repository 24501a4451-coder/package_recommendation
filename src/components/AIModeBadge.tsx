import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface Props {
  mode: 'REAL' | 'FALLBACK';
  modelArchitecture?: {
    multimodalReasoning: string;
    classificationBackbone: string;
    segmentationModel: string;
    textOcrEngine: string;
    ontologyMapping: string;
  };
}

export const AIModeBadge: React.FC<Props> = ({ mode, modelArchitecture }) => {
  const [showModal, setShowModal] = useState(false);

  const isReal = mode === 'REAL';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer shadow-xs ${
          isReal
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
        }`}
        title="Click to view AI Model Architecture & Provenance"
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>AI MODE: {isReal ? 'REAL (Gemini 3.8 Flash Vision)' : 'FALLBACK / DEMO'}</span>
        <Info className="w-3 h-3 opacity-70" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-2.5 rounded-xl ${
                  isReal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-300'
                }`}
              >
                {isReal ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isReal ? 'Live AI Vision Engine Active' : 'AI Mode: Fallback / Demo Simulation'}
                </h3>
                <p className="text-xs text-slate-400">SIH26236 Food Perception & Multi-Model Pipeline</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Perception Pipeline
                </span>
                <p className="text-slate-300">
                  {isReal
                    ? 'Server-side Gemini 3.8 Flash Vision is directly parsing pixel features, food segmentation, and thermodynamic state.'
                    : 'External live vision API is operating in fallback/demo mode. Structured scientific food simulation is active according to SIH26236 specifications.'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Specified Model Architecture Components
                </span>
                <ul className="text-xs space-y-1.5 text-slate-300 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <li className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Multimodal Reasoning:</span>
                    <span className="text-emerald-400 font-medium">
                      {modelArchitecture?.multimodalReasoning || (isReal ? 'Gemini 3.8 Flash Vision' : 'Qwen2.5-VL Vision-Language')}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Food Classification:</span>
                    <span className="text-cyan-400">
                      {modelArchitecture?.classificationBackbone || 'ConvNeXt-Food-CLF-75'}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Component Segmentation:</span>
                    <span className="text-indigo-400">
                      {modelArchitecture?.segmentationModel || 'FoodSeg103'}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-800/80 pb-1">
                    <span className="text-slate-400">Label / Text Extraction:</span>
                    <span className="text-amber-400">
                      {modelArchitecture?.textOcrEngine || 'PaddleOCR-v4'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Ontology Mapping:</span>
                    <span className="text-pink-400">
                      {modelArchitecture?.ontologyMapping || 'FoodOn Terminology Standard'}
                    </span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-slate-400 italic">
                * Note: In accordance with Rule 30 of SIH26236, the system never fabricates certainty. All recognized items must be verified in the User Confirmation stage before passing to the scientific rule engine.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
