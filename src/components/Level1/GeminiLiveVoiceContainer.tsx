import React from 'react';
import {
  Mic,
  Volume2,
  Cpu,
  Globe,
  Radio,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Phone
} from 'lucide-react';
import { FarmerVoiceAssistant, GeminiLiveVisualStatus } from './FarmerVoiceAssistant';
import { FarmerConversationContext } from '../../../server/ai/farmerVoiceService';
import { Level1RecommendationResult } from '../../../server/engines/levelEngines';
import { StructuredCropProfile } from './useFarmerContext';

interface Props {
  liveStatus: GeminiLiveVisualStatus;
  activeLanguage: 'en' | 'hi' | 'te' | 'ta' | 'kn';
  cropProfile: StructuredCropProfile;
  completenessPercentage: number;
  onLiveStatusChange: (status: GeminiLiveVisualStatus) => void;
  onLanguageChange: (lang: 'en' | 'hi' | 'te' | 'ta' | 'kn') => void;
  onExtractedContext: (ctx: Partial<FarmerConversationContext>) => void;
  onSyncParameters: (params: {
    commodityName?: string;
    storageTempC?: number;
    transportDays?: number;
    refrigeration?: boolean;
    packagingFormat?: string;
  }) => void;
  onRecommendationReady: (rec: Level1RecommendationResult, adaptedRec?: any, detailedReport?: any) => void;
}

export const GeminiLiveVoiceContainer: React.FC<Props> = ({
  liveStatus,
  activeLanguage,
  cropProfile,
  completenessPercentage,
  onLiveStatusChange,
  onLanguageChange,
  onExtractedContext,
  onSyncParameters,
  onRecommendationReady
}) => {
  return (
    <div id="container-1-gemini-live-voice" className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient status glow */}
      <div
        className={`absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          liveStatus === 'listening'
            ? 'bg-emerald-500/20'
            : liveStatus === 'processing'
            ? 'bg-amber-500/20'
            : liveStatus === 'speaking'
            ? 'bg-cyan-500/20'
            : 'bg-slate-700/10'
        }`}
      />

      {/* Top Header & Visual Status HUD */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Container 1 • Natural Voice Core
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Multilingual Speech Recognition & Extraction
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Radio className={`w-6 h-6 ${liveStatus !== 'idle' ? 'animate-pulse text-emerald-400' : 'text-emerald-500'}`} />
            <span>GEMINI LIVE FARMER VOICE</span>
          </h2>
          <p className="text-xs text-slate-300">
            Speak naturally in Telugu or English. The assistant extracts harvest facts, asks missing questions, and computes packaging.
          </p>
        </div>

        {/* Live HUD Indicators (Status + Language) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Indicator */}
          {liveStatus === 'listening' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-pulse">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <Mic className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-bold font-mono uppercase">Listening</span>
            </div>
          )}

          {liveStatus === 'processing' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
              <Cpu className="w-4 h-4 text-amber-300 animate-spin" />
              <span className="text-xs font-bold font-mono uppercase">Processing</span>
            </div>
          )}

          {liveStatus === 'speaking' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-xs font-bold font-mono uppercase">Speaking</span>
            </div>
          )}

          {liveStatus === 'idle' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <Mic className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono uppercase font-bold">Ready</span>
            </div>
          )}

          {/* Active Language Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-white uppercase">{activeLanguage}</span>
            <span className="text-[10px] text-slate-500">
              {activeLanguage === 'te' ? 'తెలుగు' : activeLanguage === 'hi' ? 'हिन्दी' : 'English'}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Farmer Context Live Chips */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Confirmed Harvest Facts ({cropProfile.confirmedFields?.length || 0} extracted)
          </span>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-slate-400">Context Completeness:</span>
            <span className="font-bold text-emerald-300">{completenessPercentage}%</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase block">Crop</span>
            <strong className={cropProfile.crop ? 'text-white' : 'text-slate-600'}>
              {cropProfile.crop || 'Pending...'}
            </strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase block">Quantity</span>
            <strong className={cropProfile.quantity ? 'text-emerald-300' : 'text-slate-600'}>
              {cropProfile.quantity || 'Pending...'}
            </strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase block">Transit</span>
            <strong className={cropProfile.transportDurationDays ? 'text-cyan-300' : 'text-slate-600'}>
              {cropProfile.transportDurationDays ? `${cropProfile.transportDurationDays} Days` : 'Pending...'}
            </strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase block">Cold Chain</span>
            <strong className={cropProfile.refrigeration != null ? 'text-amber-300' : 'text-slate-600'}>
              {cropProfile.refrigeration != null ? (cropProfile.refrigeration ? 'Cold Chain (4°C)' : 'Ambient Aerated') : 'Pending...'}
            </strong>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase block">Buyer</span>
            <strong className={cropProfile.targetBuyer ? 'text-purple-300' : 'text-slate-600'}>
              {cropProfile.targetBuyer || 'Pending...'}
            </strong>
          </div>
        </div>
      </div>

      {/* Voice Assistant Core Component */}
      <FarmerVoiceAssistant
        onLiveStatusChange={onLiveStatusChange}
        onLanguageChange={onLanguageChange}
        onExtractedContext={onExtractedContext}
        onSyncParameters={onSyncParameters}
        onRecommendationReady={onRecommendationReady}
        externalContext={cropProfile.rawContext}
      />

    </div>
  );
};
