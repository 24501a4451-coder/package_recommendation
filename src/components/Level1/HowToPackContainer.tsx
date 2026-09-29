import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Volume2,
  Play,
  Pause,
  Square,
  FileText,
  Globe,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { PackagingRecommendationResponse } from '../../../server/services/packagingRecommendationAdapter';
import { PackingVisualizationResult } from '../../types/packagingAsset';

interface Props {
  recommendation: PackagingRecommendationResponse | null;
  cropName: string;
  activeLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}

export const HowToPackContainer: React.FC<Props> = ({
  recommendation,
  cropName,
  activeLanguage = 'en',
  onLanguageChange
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(activeLanguage);
  const [visualization, setVisualization] = useState<PackingVisualizationResult | null>(null);
  const [vizLoading, setVizLoading] = useState(false);
  const [zoomCutawayImage, setZoomCutawayImage] = useState<string | null>(null);

  // Audio Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Step Explanation Modal / Dialog State
  const [explainingStep, setExplainingStep] = useState<{ stepNumber: number; text: string } | null>(null);
  const [explanationData, setExplanationData] = useState<{ explanation: string; spokenText: string } | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  useEffect(() => {
    if (activeLanguage) {
      setSelectedLang(activeLanguage);
    }
  }, [activeLanguage]);

  // Fetch AI packing cutaway visualization whenever crop or recommendation changes
  useEffect(() => {
    let cancelled = false;

    const fetchCutaway = async () => {
      if (!cropName || !recommendation) return;
      setVizLoading(true);

      try {
        const res = await apiFetch('/api/packaging/visualize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crop: cropName,
            materialId: recommendation.package.materialId,
            transportDays: recommendation.scientificResult?.commodity ? 3 : 2
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setVisualization(data.visualization);
          }
        }
      } catch (err) {
        console.error('Failed to load cutaway visualization:', err);
      } finally {
        if (!cancelled) {
          setVizLoading(false);
        }
      }
    };

    fetchCutaway();

    return () => {
      cancelled = true;
    };
  }, [cropName, recommendation]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!recommendation) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Container 3 • How to Pack</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Post-harvest packing instructions and cutaway layer guidance will automatically generate here when the recommendation is established.
        </p>
      </div>
    );
  }

  const config = recommendation.packingConfiguration;
  const steps = config.stepByStepInstructions || [];

  // Generate full text transcript for TTS
  const fullTranscript = steps
    .map((s, i) => `Step ${i + 1}: ${s}`)
    .join('. ');

  const handleReadAloud = async () => {
    if (isPlaying && isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }

    setAudioLoading(true);
    try {
      const res = await apiFetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullTranscript,
          language: selectedLang
        })
      });

      if (!res.ok) throw new Error('Audio synthesis failed');
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsPaused(false);
        setActiveStepIndex(0);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveStepIndex(null);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      await audio.play();
    } catch (err) {
      console.warn('TTS playback notice:', err);
    } finally {
      setAudioLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveStepIndex(null);
  };

  const handleExplainStep = async (stepNumber: number, stepText: string) => {
    setExplainingStep({ stepNumber, text: stepText });
    setExplanationData(null);
    setExplanationLoading(true);

    try {
      const res = await apiFetch('/api/level1/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop: cropName,
          packageType: recommendation.package.packageType,
          stepNumber,
          stepText,
          language: selectedLang
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExplanationData({
          explanation: data.explanation,
          spokenText: data.spokenText
        });

        // Speak the explanation aloud in selected language
        try {
          const ttsRes = await apiFetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: data.spokenText,
              language: selectedLang
            })
          });
          if (ttsRes.ok) {
            const blob = await ttsRes.blob();
            const expAudio = new Audio(URL.createObjectURL(blob));
            expAudio.play();
          }
        } catch (ttsErr) {
          console.warn('Explanation speech error:', ttsErr);
        }
      }
    } catch (err) {
      console.error('Failed to explain step:', err);
    } finally {
      setExplanationLoading(false);
    }
  };

  return (
    <div id="container-3-how-to-pack" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
      
      {/* Container Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              Container 3 • Execution Protocol
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Arrangement: <strong className="text-white">{config.layerCount} Layer Nesting</strong> • Max Fill: <strong className="text-cyan-300">{config.maxFillPercentage}%</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-cyan-400" />
            <span>HOW TO PACK ({cropName})</span>
          </h2>
          <p className="text-xs text-slate-300">
            Step-by-step instructions derived dynamically from the recommendation and biological respiration limits.
          </p>
        </div>

        {/* Audio Toolbar & Language Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedLang}
              onChange={(e) => {
                setSelectedLang(e.target.value);
                onLanguageChange?.(e.target.value);
              }}
              className="bg-transparent text-white focus:outline-hidden text-xs cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="te" className="bg-slate-900 text-white">తెలుగు (Telugu)</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
              <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Read All Steps Aloud Button */}
          <button
            type="button"
            onClick={handleReadAloud}
            disabled={audioLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-md transition cursor-pointer ${
              isPlaying
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
            }`}
          >
            {audioLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isPlaying ? (
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span>{isPlaying ? 'READING...' : '🔊 READ ALL STEPS ALOUD'}</span>
          </button>

          {/* Audio Controls */}
          {isPlaying && (
            <button
              type="button"
              onClick={handlePause}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={handleReadAloud}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 cursor-pointer"
              title="Resume Play"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 cursor-pointer"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Transcript Toggle */}
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className={`px-3 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
              showTranscript
                ? 'bg-slate-800 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            <span>TRANSCRIPT</span>
          </button>

        </div>
      </div>

      {/* Main Grid: Left = Dynamic AI Packaging Cutaway, Right = Step-by-Step Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: AI Cutaway Visualization showing crop inside package */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Dynamic Crop-Inside-Package Cutaway
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Payload: {config.quantityPerPackage}
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center min-h-[260px] group">
            {visualization?.visualizationImageUrl ? (
              <img
                src={visualization.visualizationImageUrl}
                alt={`How to pack ${cropName} inside ${recommendation.package.packageType}`}
                referrerPolicy="no-referrer"
                className="w-full h-64 object-contain p-2 transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Generating crop packing visualization...</span>
              </div>
            )}

            {visualization?.visualizationImageUrl && (
              <button
                type="button"
                onClick={() => setZoomCutawayImage(visualization.visualizationImageUrl)}
                className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shadow-md"
                title="Expand Packing Cutaway"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded-md border border-cyan-500/30 text-[9px] font-mono text-cyan-300">
              {config.layerCount} LAYER NESTING
            </div>
          </div>

          {/* Cushioning & Layer Details */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
              Arrangement & Cushioning Spec:
            </span>
            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {config.layerArrangement}
            </p>
            <div className="text-[11px] text-amber-300 font-mono pt-1 border-t border-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Cushioning: {config.cushioningAndSeparation}</span>
            </div>
          </div>

          {/* Mandatory AI Visualization Disclaimer (Rule 12) */}
          <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-[10px] text-slate-400 leading-relaxed italic">
            "AI-generated packing visualization. Final packaging dimensions, material specifications and engineering limits should follow the validated FOODPACK recommendation and supplier specifications."
          </div>
        </div>

        {/* Right Column: Step-by-Step Instructions & Explain Step Trigger */}
        <div className="space-y-3">
          
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-mono font-bold uppercase text-slate-300">
              Step-by-Step Packing Instructions:
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Tap "Explain" on any step for biological reasoning
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isStepActive = activeStepIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition duration-200 ${
                    isStepActive
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                          STEP {idx + 1}
                        </span>
                        <p className="text-xs text-slate-100 font-sans leading-relaxed">
                          {step}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExplainStep(idx + 1, step)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300 hover:text-white shrink-0 flex items-center gap-1 transition cursor-pointer"
                      title="Explain why this step is biologically necessary"
                    >
                      <HelpCircle className="w-3 h-3 text-cyan-400" />
                      <span>Why?</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transcript Panel (when toggled) */}
          {showTranscript && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase text-cyan-400">
                  Spoken Audio Transcript ({selectedLang.toUpperCase()})
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                "{fullTranscript}"
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Step Explanation Dialog Modal */}
      {explainingStep && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setExplainingStep(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 text-cyan-400 font-mono text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>AI Specialist Explanation • Step {explainingStep.stepNumber}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Instruction:</span>
              <p className="text-slate-200 mt-0.5">"{explainingStep.text}"</p>
            </div>

            {explanationLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs font-mono">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Formulating biological postharvest explanation...</span>
              </div>
            ) : explanationData ? (
              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold font-mono">
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                  <span>Why this step is critical:</span>
                </div>
                <p className="text-slate-100 font-sans leading-relaxed text-sm">
                  {explanationData.explanation}
                </p>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setExplainingStep(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Cutaway Zoom Modal */}
      {zoomCutawayImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-4 space-y-3 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomCutawayImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
            >
              ✕
            </button>
            <h4 className="text-sm font-bold text-white font-mono">
              High-Resolution Packing Arrangement Cutaway • {cropName}
            </h4>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center p-2">
              <img
                src={zoomCutawayImage}
                alt="Enlarged Cutaway View"
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
