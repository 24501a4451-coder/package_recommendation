import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Check,
  ImageIcon,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Edit3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AIModeBadge } from '../AIModeBadge';
import { AIAnalysisResult, RecommendationRecord } from '../../types';
import { PackageRecommendationResult } from './PackageRecommendationResult';
import { ExistingPackagingEvaluator } from './ExistingPackagingEvaluator';
import { apiFetch } from '../../utils/api';

interface Props {
  onOpenReport: (record: RecommendationRecord) => void;
  onOpenAssistant: (context?: any) => void;
}

type Step = 'CAPTURE' | 'CONFIRMATION' | 'QUESTIONS' | 'ANALYZING' | 'RESULT';
type CameraState = 'IDLE' | 'STARTING' | 'LIVE' | 'ERROR';

export const SmartTakeawayScanner: React.FC<Props> = ({ onOpenReport, onOpenAssistant }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'NEW_PACKAGE' | 'EVALUATE_EXISTING'>('NEW_PACKAGE');
  const [step, setStep] = useState<Step>('CAPTURE');

  // Camera & Image States
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  // Analysis & Recommendation States
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [recommendationRecord, setRecommendationRecord] = useState<RecommendationRecord | null>(null);
  const [userHint, setUserHint] = useState('');

  // -------------------------------------------------------------
  // Authoritative Confirmed Food State
  // -------------------------------------------------------------
  const [foodName, setFoodName] = useState('');
  const [isEditingConfirmation, setIsEditingConfirmation] = useState(false);
  const [components, setComponents] = useState<string[]>([]);
  const [newCompInput, setNewCompInput] = useState('');
  const [possibleIngredients, setPossibleIngredients] = useState<string[]>([]);
  const [cookingMethod, setCookingMethod] = useState<string>('Cooked');
  const [servingTempState, setServingTempState] = useState<string>('Warm (50-70°C)');
  const [physicalTextureState, setPhysicalTextureState] = useState<string>('Moist Grains');

  // -------------------------------------------------------------
  // Dynamic Minimal Questions (Returned by /api/level2/confirm-food)
  // -------------------------------------------------------------
  const [relevantQuestions, setRelevantQuestions] = useState<any[]>([]);
  const [foodCondition, setFoodCondition] = useState<'Very Hot' | 'Hot' | 'Warm' | 'Room Temp' | 'Chilled' | 'Frozen'>('Hot');
  const [freshness, setFreshness] = useState<'Just now' | '<30 min ago' | '30–60 min ago' | '1–2 hrs ago' | 'Reheated'>('Just now');
  const [deliveryTime, setDeliveryTime] = useState<string>('30–60 min');
  const [priorities, setPriorities] = useState<string[]>(['Maintain heat', 'Prevent leakage']);
  const [customRequirement, setCustomRequirement] = useState('');
  const [packedTogether, setPackedTogether] = useState<'Yes' | 'No'>('No');

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customMoisture, setCustomMoisture] = useState<number>(60);
  const [customFat, setCustomFat] = useState<number>(15);
  const [sustainabilityPref, setSustainabilityPref] = useState('Prefer biodegradable/compostable');
  const [budgetPref, setBudgetPref] = useState<'Economy' | 'Balanced' | 'Premium'>('Balanced');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraErrorMessage(null);
    setCameraState('STARTING');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('ERROR');
      setCameraErrorMessage('Camera device is not supported on this browser. You can still upload a photo.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      setCameraState('LIVE');

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Video play warning:', e));
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      stopCamera();
      setCameraState('ERROR');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraErrorMessage('Camera permission was denied. You can still upload a JPG, PNG, or WebP photo.');
      } else {
        setCameraErrorMessage('Could not initialize camera preview. You can still upload a photo.');
      }
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        stopCamera();
        setCameraState('IDLE');
        setCurrentImage(dataUrl);
        handleAnalyzeImage(dataUrl);
      }
    }
  };

  const handleCancelCamera = () => {
    stopCamera();
    setCameraState('IDLE');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        setCameraErrorMessage('Please upload a valid .jpg, .jpeg, .png, or .webp food image.');
        return;
      }
      setCameraErrorMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCurrentImage(dataUrl);
        stopCamera();
        setCameraState('IDLE');
        handleAnalyzeImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Pipeline Step 1: Real AI Vision Perception Scan
  const handleAnalyzeImage = async (base64Img: string) => {
    setStep('ANALYZING');
    setAnalysisProgress('Scanning food image with multimodal AI vision perception...');

    try {
      const res = await apiFetch('/api/level2/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Img, userHint })
      });

      if (res.ok) {
        const data: AIAnalysisResult = await res.json();
        setAnalysisResult(data);
        const primary = data.primaryFoodName || 'Identified Dish';
        setFoodName(primary);
        setComponents(Array.isArray(data.components) && data.components.length > 0 ? data.components : [primary]);
        setPossibleIngredients(Array.isArray(data.possibleIngredients) ? data.possibleIngredients : []);
        setCookingMethod(data.cookingMethod || 'Dum Steamed / Boiled');
        setServingTempState(data.servingTemperature || 'Warm (50-70°C)');
        setPhysicalTextureState(data.physicalTexture || 'Moist Grains');

        // Transition to USER CONFIRMATION step
        setStep('CONFIRMATION');
      } else {
        // Fallback to manual entry confirmation
        setFoodName('');
        setComponents([]);
        setIsEditingConfirmation(true);
        setStep('CONFIRMATION');
      }
    } catch (err) {
      console.warn('Food scan request error:', err);
      setFoodName('');
      setComponents([]);
      setIsEditingConfirmation(true);
      setStep('CONFIRMATION');
    }
  };

  // Pipeline Step 2: User Confirms Detected Food -> Derive Minimal Relevant Questions
  const handleConfirmFood = async () => {
    setStep('ANALYZING');
    setAnalysisProgress('Deriving physical food requirement profile and dynamic questions...');

    try {
      const res = await apiFetch('/api/level2/confirm-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName,
          components,
          possibleIngredients,
          cookingMethod,
          servingTemperature: servingTempState,
          physicalTexture: physicalTextureState,
          freshness
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRelevantQuestions(data.relevantQuestions || []);
        
        // Auto-initialize defaults from dynamic questions
        const prioQ = data.relevantQuestions?.find((q: any) => q.id === 'priorities');
        if (prioQ?.default) setPriorities(prioQ.default);

        const tempQ = data.relevantQuestions?.find((q: any) => q.id === 'foodCondition');
        if (tempQ?.default) setFoodCondition(tempQ.default);

        const delQ = data.relevantQuestions?.find((q: any) => q.id === 'deliveryTime');
        if (delQ?.default) setDeliveryTime(delQ.default);

        setStep('QUESTIONS');
      } else {
        setStep('QUESTIONS');
      }
    } catch {
      setStep('QUESTIONS');
    }
  };

  const handleAddComponent = () => {
    if (newCompInput.trim() && !components.includes(newCompInput.trim())) {
      setComponents([...components, newCompInput.trim()]);
      setNewCompInput('');
    }
  };

  const handleRemoveComponent = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const togglePriority = (p: string) => {
    if (priorities.includes(p)) {
      setPriorities(priorities.filter((item) => item !== p));
    } else {
      setPriorities([...priorities, p]);
    }
  };

  // Pipeline Step 3: Run Scientific Recommendation Engine
  const handleRunRecommendation = async () => {
    const finalFoodName = foodName.trim() || 'Custom Takeaway Meal';
    setStep('ANALYZING');
    setAnalysisProgress('Evaluating packaging candidates against thermodynamic and barrier constraints...');

    const isCrispy =
      priorities.some((p) => p.toLowerCase().includes('crisp')) ||
      cookingMethod.toLowerCase().includes('fried') ||
      finalFoodName.toLowerCase().includes('fried') ||
      finalFoodName.toLowerCase().includes('crisp');

    const isCurry =
      cookingMethod.toLowerCase().includes('curry') ||
      cookingMethod.toLowerCase().includes('simmer') ||
      finalFoodName.toLowerCase().includes('curry') ||
      finalFoodName.toLowerCase().includes('gravy') ||
      finalFoodName.toLowerCase().includes('soup');

    const payload = {
      food: {
        name: finalFoodName,
        moistureContentPercent: isCurry ? 78 : isCrispy ? 22 : customMoisture,
        fatContentPercent: isCrispy ? 22 : customFat,
        crispnessSensitivity: isCrispy ? 'Critical' : 'Medium',
        steamGenerationRisk: foodCondition.includes('Hot') ? 'High' : 'Low'
      },
      transformation: {
        rawIngredients: components,
        cookingMethod,
        servingTemperature:
          foodCondition === 'Very Hot'
            ? 'Very Hot (>75°C)'
            : foodCondition === 'Hot'
            ? 'Warm (50-70°C)'
            : foodCondition === 'Chilled'
            ? 'Chilled (0-8°C)'
            : foodCondition === 'Frozen'
            ? 'Frozen (<-18°C)'
            : 'Room Temp (20-30°C)',
        moistureReleaseState: foodCondition.includes('Hot') ? 'High Active Steam' : 'Moderate Vapor',
        physicalTexture: isCrispy ? 'Crisp Batter Crust' : isCurry ? 'Viscous Liquid Gravy' : 'Moist Grains'
      },
      preferences: {
        priorities,
        deliveryTime,
        foodCondition,
        freshness,
        customRequirement,
        packedTogether,
        budget: budgetPref,
        sustainability: sustainabilityPref
      },
      components: components.length > 0 ? components : [finalFoodName],
      aiMode: analysisResult?.aiMode || 'REAL'
    };

    try {
      const res = await apiFetch('/api/level2/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendationRecord(data.record);
        setStep('RESULT');
      } else {
        const err = await res.json().catch(() => ({}));
        setCameraErrorMessage(err.message || 'Recommendation generation failed.');
        setStep('QUESTIONS');
      }
    } catch {
      setCameraErrorMessage('Failed to connect to recommendation engine.');
      setStep('QUESTIONS');
    }
  };

  // Pipeline Real-time Recalculation Handler (What-If Analysis)
  const handleRecalculateRecommendation = async (newPreferences: any) => {
    if (!recommendationRecord) return;

    try {
      const res = await apiFetch('/api/level2/recommend/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recommendationRecord.id,
          food: recommendationRecord.foodProfile,
          transformation: recommendationRecord.foodProfile?.transformation,
          preferences: newPreferences,
          components: recommendationRecord.components,
          aiMode: recommendationRecord.aiMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendationRecord(data.record);
      }
    } catch (err) {
      console.warn('Failed to recalculate recommendation:', err);
    }
  };

  const handleSavePreset = (name: string, rec: RecommendationRecord) => {
    try {
      const existing = JSON.parse(localStorage.getItem('foodpack_user_presets') || '[]');
      existing.unshift({
        id: `preset_${Date.now()}`,
        name,
        foodName: rec.foodName,
        record: rec,
        savedAt: new Date().toLocaleDateString()
      });
      localStorage.setItem('foodpack_user_presets', JSON.stringify(existing.slice(0, 20)));
    } catch (e) {
      console.warn('Failed to save preset to storage:', e);
    }
  };

  const handleResetFlow = () => {
    stopCamera();
    setStep('CAPTURE');
    setCameraState('IDLE');
    setCurrentImage(null);
    setAnalysisResult(null);
    setRecommendationRecord(null);
    setFoodName('');
    setComponents([]);
    setCustomRequirement('');
    setIsEditingConfirmation(false);
    setCameraErrorMessage(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('NEW_PACKAGE');
              setStep('CAPTURE');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'NEW_PACKAGE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Smart Takeaway Decision Engine
          </button>
          <button
            onClick={() => setActiveTab('EVALUATE_EXISTING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'EVALUATE_EXISTING'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Evaluate Existing Packaging
          </button>
        </div>

        <AIModeBadge mode={analysisResult?.aiMode || 'REAL'} modelArchitecture={analysisResult?.modelArchitecture} />
      </div>

      {activeTab === 'EVALUATE_EXISTING' ? (
        <ExistingPackagingEvaluator />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* STEP 1: CAPTURE PHOTO OR UPLOAD (CLEAN EMPTY STATE) */}
          {/* ========================================================================= */}
          {step === 'CAPTURE' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl text-center sm:text-left">
                <div className="max-w-2xl space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      Level 2 • Real-Time AI Takeaway Intelligence
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Smart Takeaway Packaging Decision Engine
                  </h1>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upload or take a photo of your food dish. The AI vision perception engine detects ingredients, moisture behavior, and thermodynamic properties to compute the exact container, venting, and barrier configuration.
                  </p>
                </div>
              </div>

              {cameraErrorMessage && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-start gap-3 shadow-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Notice</span>
                    <p className="mt-0.5 text-slate-200">{cameraErrorMessage}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                {(cameraState === 'STARTING' || cameraState === 'LIVE') && (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-indigo-500 shadow-2xl flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-red-600/90 text-white font-mono text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>Live Camera View</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        <span>[ Capture Photo ]</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelCamera}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {cameraState === 'IDLE' && (
                  <div className="space-y-6 text-center py-4">
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                        <ImageIcon className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-white">Upload or capture a food image to begin</h3>
                      <p className="text-xs text-slate-400">
                        Take a photo using your device camera or select an image file (.jpg, .jpeg, .png, .webp).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/70 hover:bg-slate-950 transition cursor-pointer group space-y-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500/20 transition group-hover:scale-105">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-white text-sm block">[ Take Photo ]</span>
                        <span className="text-[11px] text-slate-400 block">Use mobile or webcam</span>
                      </button>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/70 hover:bg-slate-950 transition cursor-pointer group space-y-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition group-hover:scale-105">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-white text-sm block">[ Upload Image ]</span>
                        <span className="text-[11px] text-slate-400 block">Select image from device</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: USER CONFIRMATION SCREEN (IS THIS CORRECT? [Confirm] [Edit]) */}
          {/* ========================================================================= */}
          {step === 'CONFIRMATION' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        AI Perception Scan Complete
                      </span>
                      {analysisResult && (
                        <span className="text-xs text-slate-400 font-mono">
                          Confidence: <strong className="text-white">{analysisResult.confidence}</strong>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Confirm Food & Preparation Details
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify the detected food identity and meal components. Your confirmation becomes the authoritative input for thermodynamic barrier calculation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFlow}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change Image</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  {currentImage && (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-800 shadow-md">
                      <img src={currentImage} alt="Scanned Food" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 space-y-4">
                    {/* Food Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Detected Food Name
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsEditingConfirmation(!isEditingConfirmation)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isEditingConfirmation ? 'Lock Name' : 'Edit'}</span>
                        </button>
                      </div>

                      {isEditingConfirmation ? (
                        <input
                          type="text"
                          value={foodName}
                          onChange={(e) => setFoodName(e.target.value)}
                          placeholder="e.g. Crispy Fried Chicken, Vegetable Curry, Pasta"
                          className="w-full bg-slate-950 border border-indigo-500/60 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-hidden"
                        />
                      ) : (
                        <h3 className="text-lg font-bold text-white">
                          {foodName || <span className="text-slate-500 italic">Please enter food dish name</span>}
                        </h3>
                      )}
                    </div>

                    {/* Detected Components */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Detected Meal Components & Sides:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {components.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-xs border border-slate-800"
                          >
                            <span>{c}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(i)}
                              className="text-slate-500 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="+ Add side (e.g. sauce, fries)"
                            value={newCompInput}
                            onChange={(e) => setNewCompInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComponent())}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden w-40"
                          />
                          <button
                            type="button"
                            onClick={handleAddComponent}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detected Cooking & Processing State */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block mb-1">Cooking / Preparation:</span>
                        <select
                          value={cookingMethod}
                          onChange={(e) => setCookingMethod(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="Fried">Fried (e.g. Fries, Chicken, Samosa)</option>
                          <option value="Dum Steamed / Boiled">Dum Steamed / Boiled (Rice, Idli)</option>
                          <option value="Baked">Baked (Pizza, Bread, Cake, Pastry)</option>
                          <option value="Grilled">Grilled / Charred (Kebabs, Paneer)</option>
                          <option value="Cooked">Cooked Curry / Gravy (Dal, Butter Masala)</option>
                          <option value="Fresh / Raw">Fresh / Raw (Salads, Fruits)</option>
                          <option value="Reheated">Reheated</option>
                          <option value="Chilled">Chilled Cold Holding</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 block mb-1">Estimated Serving Temperature:</span>
                        <select
                          value={servingTempState}
                          onChange={(e) => setServingTempState(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                        >
                          <option value="Very Hot (>75°C)">Very Hot (&gt;75°C) — Extreme Steam</option>
                          <option value="Warm (50-70°C)">Warm (50-70°C)</option>
                          <option value="Room Temp (20-30°C)">Room Temp (20-30°C)</option>
                          <option value="Chilled (0-8°C)">Chilled (0-8°C) — Cold Chain</option>
                          <option value="Frozen (<-18°C)">Frozen (&lt;-18°C)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question: Is this correct? [Confirm] [Edit] */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-300 font-semibold">
                    Are these detected food details correct?
                  </span>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditingConfirmation(!isEditingConfirmation)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition border border-slate-700"
                    >
                      {isEditingConfirmation ? 'Lock Changes' : '[ Edit Details ]'}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmFood}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>[ Confirm & Continue ]</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DYNAMIC MINIMAL QUESTIONS */}
          {/* ========================================================================= */}
          {step === 'QUESTIONS' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Practical Delivery & Quality Specifications
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tailored specifically for: <strong className="text-indigo-400">{foodName}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('CONFIRMATION')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Back to details
                  </button>
                </div>

                {/* 1. Food Condition */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Food Condition / Temperature
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['Very Hot', 'Hot', 'Warm', 'Room Temp', 'Chilled', 'Frozen'] as const).map((temp) => (
                      <button
                        type="button"
                        key={temp}
                        onClick={() => setFoodCondition(temp)}
                        className={`py-2 px-2 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
                          foodCondition === temp
                            ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-xs'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {temp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Target Delivery Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Target Delivery Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['<30 min', '30–60 min', '1–2 hrs', '2+ hrs'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setDeliveryTime(t)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center ${
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

                {/* 3. Main Priorities */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Key Quality Priorities (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      'Maintain heat',
                      'Maintain texture',
                      'Maintain crispness',
                      'Prevent leakage',
                      'Maintain freshness',
                      'Presentation',
                      'Low cost',
                      'Sustainability'
                    ].map((p) => {
                      const isSelected = priorities.includes(p);
                      return (
                        <button
                          type="button"
                          key={p}
                          onClick={() => togglePriority(p)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition text-left ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                              isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span>{p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Multi-Component Dynamic Question (Only if components.length > 1) */}
                {components.length > 1 && (
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 block">
                      Smart Question • Component Separation Strategy
                    </span>
                    <p className="text-xs text-white font-medium">
                      Will these items be packed together in one container, or kept in separate vessels?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPackedTogether('No')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition ${
                          packedTogether === 'No'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Separate Vessels (Recommended for quality & texture)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackedTogether('Yes')}
                        className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer transition ${
                          packedTogether === 'Yes'
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Pack Together in One Container
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Custom Requirement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Custom Requirement (Optional)
                  </label>
                  <input
                    type="text"
                    value={customRequirement}
                    onChange={(e) => setCustomRequirement(e.target.value)}
                    placeholder="e.g. 'Keep fried chicken crispy for 45 min', 'Motorbike delivery; must be 100% spill-proof'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* 6. Advanced Options Accordion */}
                <div className="border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Advanced Tuning (Optional)</span>
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                  </button>

                  {showAdvanced && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Circularity Standard</label>
                        <select
                          value={sustainabilityPref}
                          onChange={(e) => setSustainabilityPref(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                        >
                          <option value="Prefer biodegradable/compostable">Prefer Biodegradable / Compostable</option>
                          <option value="Prefer recyclable">Prefer Recyclable (PP 05 / PET 01)</option>
                          <option value="Zero Plastic / EN 13432">Zero Plastic / EN 13432</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Budget Optimization Tier</label>
                        <select
                          value={budgetPref}
                          onChange={(e) => setBudgetPref(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                        >
                          <option value="Balanced">Balanced (Quality + Economy)</option>
                          <option value="Economy">Economy Focused</option>
                          <option value="Premium">Premium Presentation</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleRunRecommendation}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>[ ANALYZE & RECOMMEND PACKAGING ]</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: ANALYZING ANIMATION */}
          {/* ========================================================================= */}
          {step === 'ANALYZING' && (
            <div className="min-h-[400px] flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-5">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Engineering Packaging Decision</h3>
                  <p className="text-xs text-indigo-400 font-mono">{analysisProgress}</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: ACTIONABLE RESULT SCREEN */}
          {/* ========================================================================= */}
          {step === 'RESULT' && recommendationRecord && (
            <PackageRecommendationResult
              record={recommendationRecord}
              onOpenReport={() => onOpenReport(recommendationRecord)}
              onOpenAssistant={() => onOpenAssistant({ recommendation: recommendationRecord })}
              onReset={handleResetFlow}
              onSavePreset={handleSavePreset}
              onRecalculate={handleRecalculateRecommendation}
            />
          )}
        </>
      )}
    </div>
  );
};
