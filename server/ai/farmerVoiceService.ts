/**
 * FOODPACK-AI: Farmer Expert Voice Assistant Service
 * 
 * Provides an empathetic, knowledgeable "Farmer Expert Buddy" conversational interface.
 * - Extracts structured agricultural & logistical parameters from natural speech
 * - Handles live corrections gracefully
 * - Answers questions grounded in FOODPACK-AI postharvest science
 * - Directly invokes the scientific Level 1 Recommendation Engine (levelEngines.generateLevel1)
 * - Generates comprehensive evidence-based reports without fabricating scientific data
 */

import { GoogleGenAI } from '@google/genai';
import { levelEngines, Level1Input, Level1RecommendationResult } from '../engines/levelEngines';
import { dataStore } from '../db/dataStore';
import { PiperKokoroTTSProvider, GeminiAudioSTTProvider } from './voiceProviders';

export interface FarmerConversationContext {
  commodity?: string;
  variety?: string;
  freshness?: string;
  processingState?: string;
  storageTemperature?: number;
  transportTemperature?: number;
  humidity?: number;
  transportDurationDays?: number;
  storageDurationDays?: number;
  targetShelfLifeDays?: number;
  refrigeration?: boolean;
  packagingPurpose?: 'Transportation' | 'Storage' | 'Retail Market' | 'Export';
  budget?: 'Economy' | 'Balanced' | 'Premium';
  sustainability?: 'Prefer recyclable' | 'Prefer biodegradable/compostable' | 'Normal';
  quantity?: string;
  existingPackaging?: string;
  userNotes?: string;
}

export interface ConversationTurn {
  role: 'farmer' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FarmerDetailedReport {
  id: string;
  timestamp: string;
  conversationSummary: string;
  commodityProfile: {
    name: string;
    variety: string;
    freshness: string;
    respirationClass: string;
    respirationRateMgCO2: number;
    recommendedTempRange: string;
    optimalHeadspaceGas: string;
    transpirationVPDkPa: number;
    chillingInjurySensitivity: string;
  };
  logisticsConditions: {
    transportDurationDays: number;
    storageDurationDays: number;
    targetShelfLifeDays: number;
    refrigerated: boolean;
    transportTempC: number;
    relativeHumidityPercent: number;
    purpose: string;
  };
  sensitivityAnalysis: {
    identifiedPathways: { name: string; priority: string; criticalLimit: string }[];
    respirationRisk: string;
    moistureVaporDeficitRisk: string;
  };
  packagingRecommendation: {
    recommendedMaterial: string;
    structureDescription: string;
    format: string;
    thicknessMicrons: number;
    mapStrategy: {
      type: string;
      justification: string;
      targetO2Percent: string;
      targetCO2Percent: string;
      microPerforationRequired: boolean;
      targetOtrFlux: string;
    };
    justNecessaryEvaluation: {
      overBarrierAvoided: boolean;
      explanation: string;
    };
    estimatedShelfLifeDays: { min: number; max: number };
    estimatedCostINR: number;
    sustainabilityScore: number;
  };
  alternatives: { name: string; tradeoff: string }[];
  coldChainManagementRules: string[];
  traceableEvidence: { source: string; details: string }[];
  assumptions: string[];
  missingInformation: string[];
  validationRequirements: string[];
  spokenVoiceSummary: string;
}

export interface FarmerConverseResponse {
  reply: string;
  spokenAudioBase64?: string;
  audioMimeType?: string;
  updatedContext: FarmerConversationContext;
  readyForRecommendation: boolean;
  recommendation?: Level1RecommendationResult;
  detailedReport?: FarmerDetailedReport;
  provider: string;
  detectedLanguage?: string;
}

export class FarmerVoiceService {
  private ai: GoogleGenAI | null = null;
  private ttsProvider = new PiperKokoroTTSProvider();
  private sttProvider = new GeminiAudioSTTProvider();

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
      } catch (err) {
        this.ai = null;
      }
    }
  }

  /**
   * Converses naturally with the farmer, updates internal structured context,
   * handles questions/corrections, and invokes the real Level 1 recommendation engine.
   */
  public async converse(
    farmerSpeech: string,
    history: ConversationTurn[] = [],
    currentContext: FarmerConversationContext = {},
    language: string = 'en'
  ): Promise<FarmerConverseResponse> {
    const cleanSpeech = (farmerSpeech || '').trim();

    // 1. If AI key is configured, use Gemini 3.8 Flash for natural empathetic dialogue & extraction
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        return await this.converseWithLLM(cleanSpeech, history, currentContext, language);
      } catch (err) {
        console.warn('[FarmerVoiceService] LLM conversation error, falling back to deterministic expert engine:', err);
      }
    }

    // 2. Deterministic Expert Buddy Rule-Based Engine (Fallback with honest indicator)
    return this.converseWithRuleEngine(cleanSpeech, history, currentContext, language);
  }

  /**
   * LLM-driven conversation logic with structured extraction and direct connection
   * to the real scientific recommendation engine.
   */
  private async converseWithLLM(
    speech: string,
    history: ConversationTurn[],
    context: FarmerConversationContext,
    language: string
  ): Promise<FarmerConverseResponse> {
    const prompt = `You are "Kisan Mitra" (Farmer Packaging Buddy), an empathetic, knowledgeable live voice assistant for agricultural and food postharvest packaging (FOODPACK-AI).
You are having an active live voice call with a farmer or food producer (like Gemini Live or Perplexity voice mode).

PERSONALITY & VOICE CALL RULES:
1. Warm, conversational, respectful, friendly, and practical.
2. SPEAK NATURALLY IN SHORT TURNS: Keep responses to 1 to 3 spoken sentences maximum so the voice conversation flows like a real telephone call.
3. ACTIVELY ASK RELEVANT PACKAGING QUESTIONS:
   - Ask what crop they are packing (e.g. tomatoes, mangoes, strawberries, mushrooms, broccoli, leafy greens, etc.).
   - Ask about journey time/transit duration (e.g. 1-2 days to mandi/market or long-term warehouse storage).
   - Ask about temperature & vehicle conditions (hot ambient truck vs refrigerated cold storage).
   - Ask about container preference (breathable punnets, corrugated crates, or perforated pouches) and budget.
4. NO TECHNICAL JARGON: Do not overwhelm them with "OTR/WVTR in cc/m²·day" or polymer chemical formulas. Speak practically: e.g. "Unvented plastic suffocates vegetables and creates moisture droplets that lead to mold; we need calibrated micro-vents."
5. DYNAMIC LANGUAGE SWITCHING:
   - If the user says "speak in Telugu", "talk in Hindi", "speak in Tamil", "Kannada", "English please", or starts speaking in another language, IMMEDIATELY switch to that requested language!
   - In that case, acknowledge warmly in the new language and continue the packaging conversation.
   - Set "detectedLanguage" to the appropriate code ('en' | 'hi' | 'te' | 'ta' | 'kn').
   - Otherwise, respond in ${language === 'hi' ? 'Hindi' : language === 'te' ? 'Telugu' : language === 'ta' ? 'Tamil' : language === 'kn' ? 'Kannada' : 'English'}.
6. UNDERSTAND CORRECTIONS: If the farmer changes earlier statements (e.g. "Actually it will take 3 days, not 1"), update the context cleanly.

CURRENT INTERNAL CONTEXT:
${JSON.stringify(context, null, 2)}

RECENT CONVERSATION HISTORY:
${history.slice(-8).map((t) => `${t.role}: ${t.content}`).join('\n')}

LATEST FARMER MESSAGE:
"${speech}"

TASK:
1. Extract or update any facts (commodity name, variety, freshness, transit duration, storage duration, temperatures, refrigeration, budget, packaging purpose).
2. Determine if we have SUFFICIENT MINIMAL INFORMATION to produce a sound packaging recommendation:
   - Crop identified
   - Transit or storage duration identified
   - Temperature or refrigeration state identified
3. If ready:
   - Set "readyForRecommendation": true
   - In "reply", say warmly that you have enough details and have worked out their customized packaging solution.
4. If not ready:
   - Set "readyForRecommendation": false
   - In "reply", acknowledge what they shared and ask the next most important missing packaging question.

Return STRICT JSON ONLY:
{
  "reply": "string (spoken message in target language)",
  "detectedLanguage": "en" | "hi" | "te" | "ta" | "kn",
  "updatedContext": {
    "commodity": "string or null",
    "variety": "string or null",
    "freshness": "string or null",
    "storageTemperature": number or null,
    "transportTemperature": number or null,
    "humidity": number or null,
    "transportDurationDays": number or null,
    "storageDurationDays": number or null,
    "targetShelfLifeDays": number or null,
    "refrigeration": boolean or null,
    "packagingPurpose": "Transportation" | "Storage" | "Retail Market" | "Export" | null,
    "budget": "Economy" | "Balanced" | "Premium" | null,
    "sustainability": "Prefer recyclable" | "Prefer biodegradable/compostable" | "Normal" | null
  },
  "readyForRecommendation": boolean,
  "spokenSummary": "string (1-2 clear spoken sentences for voice synthesis)"
}`;

    const response = await this.ai!.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    let parsed: any = {};
    try {
      const text = response.text?.trim() || '{}';
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        reply: "I hear you! How many days will it take for your harvest to reach the market?",
        detectedLanguage: language,
        updatedContext: context,
        readyForRecommendation: false
      };
    }

    const detectedLang = parsed.detectedLanguage || language;

    // Merge extracted context
    const mergedContext: FarmerConversationContext = {
      ...context,
      ...parsed.updatedContext
    };

    // Clean up nulls
    Object.keys(mergedContext).forEach((k) => {
      if ((mergedContext as any)[k] === null || (mergedContext as any)[k] === undefined) {
        delete (mergedContext as any)[k];
      }
    });

    const isReady = Boolean(
      parsed.readyForRecommendation ||
      (mergedContext.commodity &&
        (mergedContext.transportDurationDays || mergedContext.storageDurationDays) &&
        (mergedContext.refrigeration !== undefined || mergedContext.transportTemperature !== undefined || mergedContext.storageTemperature !== undefined))
    );

    let recommendationResult: Level1RecommendationResult | undefined;
    let detailedReport: FarmerDetailedReport | undefined;

    // IF READY: RUN THE REAL FOODPACK LEVEL 1 ENGINE!
    if (isReady && mergedContext.commodity) {
      const engineInput: Level1Input = {
        commodityName: mergedContext.commodity,
        storageTempC: mergedContext.storageTemperature ?? (mergedContext.refrigeration ? 4 : 28),
        relativeHumidity: mergedContext.humidity ?? (mergedContext.refrigeration ? 90 : 75),
        storageType: mergedContext.refrigeration ? 'Cold Storage (Refrigerated)' : 'Ambient Warehouse',
        transportDurationDays: mergedContext.transportDurationDays ?? 2,
        targetShelfLifeDays: mergedContext.targetShelfLifeDays ?? (mergedContext.transportDurationDays ? mergedContext.transportDurationDays + 4 : 7),
        packagingFormat: this.inferPackagingFormat(mergedContext),
        budget: mergedContext.budget || 'Balanced',
        sustainability: mergedContext.sustainability || 'Prefer biodegradable/compostable',
        mapRequirement: 'Automatic DSS Selection'
      };

      // CALL REAL SCIENTIFIC LEVEL 1 DSS ENGINE
      recommendationResult = levelEngines.generateLevel1(engineInput);

      // GENERATE COMPREHENSIVE DETAILED SCIENTIFIC REPORT
      detailedReport = this.generateDetailedFarmerReport(
        mergedContext,
        history,
        speech,
        recommendationResult,
        parsed.reply
      );
    }

    return {
      reply: parsed.reply,
      updatedContext: mergedContext,
      readyForRecommendation: isReady,
      recommendation: recommendationResult,
      detailedReport,
      provider: 'Gemini 3.8 Flash (Conversational Expert) + FOODPACK Level-1 Scientific DSS',
      detectedLanguage: detectedLang
    };
  }

  /**
   * Deterministic Rule-Based Fallback Engine
   */
  private converseWithRuleEngine(
    speech: string,
    history: ConversationTurn[],
    context: FarmerConversationContext,
    language: string
  ): FarmerConverseResponse {
    const textLower = speech.toLowerCase();
    const updated: FarmerConversationContext = { ...context };

    // 0. Language Switch Detection
    let activeLanguage = language;
    if (textLower.includes('telugu') || textLower.includes('తెలుగు')) activeLanguage = 'te';
    else if (textLower.includes('hindi') || textLower.includes('हिंदी')) activeLanguage = 'hi';
    else if (textLower.includes('tamil') || textLower.includes('தமிழ்')) activeLanguage = 'ta';
    else if (textLower.includes('kannada') || textLower.includes('ಕನ್ನಡ')) activeLanguage = 'kn';
    else if (textLower.includes('english')) activeLanguage = 'en';

    // 1. Crop Detection
    if (textLower.includes('tomato')) updated.commodity = 'Fresh Tomatoes';
    else if (textLower.includes('strawberr') || textLower.includes('berr')) updated.commodity = 'Fresh Strawberries';
    else if (textLower.includes('mango')) updated.commodity = 'Ripening Mangoes';
    else if (textLower.includes('mushroom')) updated.commodity = 'Button Mushrooms';
    else if (textLower.includes('broccoli')) updated.commodity = 'Broccoli Florets';
    else if (textLower.includes('onion') || textLower.includes('potato')) updated.commodity = 'Potatoes / Onions';
    else if (textLower.includes('spinach') || textLower.includes('leafy') || textLower.includes('salad')) updated.commodity = 'Fresh Cut Salad Greens';
    else if (textLower.includes('grape')) updated.commodity = 'Table Grapes';

    // 2. Duration Detection
    const dayMatch = textLower.match(/(\d+)\s*(day|days|hrs|hours|week)/);
    if (dayMatch) {
      const num = parseInt(dayMatch[1], 10);
      if (dayMatch[2].startsWith('week')) {
        updated.transportDurationDays = num * 7;
      } else if (dayMatch[2].startsWith('hr')) {
        updated.transportDurationDays = Math.max(1, Math.round(num / 24));
      } else {
        updated.transportDurationDays = num;
      }
    }

    // 3. Refrigeration / Temp
    if (textLower.includes('cold') || textLower.includes('refrigerat') || textLower.includes('chilled') || textLower.includes('ac truck')) {
      updated.refrigeration = true;
      updated.storageTemperature = 4;
    } else if (textLower.includes('no cold') || textLower.includes('ambient') || textLower.includes('normal') || textLower.includes('without refrig') || textLower.includes('hot')) {
      updated.refrigeration = false;
      updated.storageTemperature = 28;
    }

    const tempMatch = textLower.match(/(\d+)\s*(degree|°c|c)/);
    if (tempMatch) {
      updated.transportTemperature = parseInt(tempMatch[1], 10);
      updated.storageTemperature = updated.transportTemperature;
    }

    // 4. Logistics Purpose
    if (textLower.includes('transport') || textLower.includes('market') || textLower.includes('mandi') || textLower.includes('send') || textLower.includes('truck')) {
      updated.packagingPurpose = 'Transportation';
    } else if (textLower.includes('store') || textLower.includes('storage') || textLower.includes('godown')) {
      updated.packagingPurpose = 'Storage';
    }

    // Check if ready
    const hasCrop = Boolean(updated.commodity);
    const hasDays = Boolean(updated.transportDurationDays || updated.storageDurationDays);
    const hasTemp = Boolean(updated.refrigeration !== undefined || updated.storageTemperature !== undefined);

    let reply = '';
    let isReady = false;

    if (!hasCrop) {
      if (activeLanguage === 'te') {
        reply = "నమస్కారం! మీరు ఏ తాజా పంటను ప్యాక్ చేయాలనుకుంటున్నారు? ఉదాహరణకు టమాటాలు, మామిడి, స్ట్రాబెర్రీలు లేదా ఆకుకూరలు?";
      } else if (activeLanguage === 'hi') {
        reply = "नमस्ते! आज आप कौन सी ताज़ा फसल पैक करने जा रहे हैं? जैसे टमाटर, आम, स्ट्रॉबेरी या हरी सब्जियां?";
      } else if (activeLanguage === 'ta') {
        reply = "வணக்கம்! என்ன பயிரை பேக் செய்ய திட்டமிட்டுள்ளீர்கள்? தக்காளி, மாம்பழம், அல்லது கீரைகள்?";
      } else if (activeLanguage === 'kn') {
        reply = "ನಮಸ್ಕಾರ! ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಪ್ಯಾಕ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಟೊಮೆಟೊ, ಮಾವು, ಅಥವಾ ಹಸಿರು ತರಕಾರಿಗಳೇ?";
      } else {
        reply = "Welcome! What crop or fresh harvest are you planning to pack today? For example, tomatoes, mangoes, strawberries, or leafy greens?";
      }
    } else if (!hasDays) {
      if (activeLanguage === 'te') {
        reply = `సరే, ${updated.commodity}! మార్కెట్ లేదా మండీకి చేరడానికి ప్రయాణానికి ఎన్ని రోజులు పడుతుంది?`;
      } else if (activeLanguage === 'hi') {
        reply = `समझ गया, ${updated.commodity}! मंडी तक पहुँचने में कितने दिन का समय लगेगा?`;
      } else if (activeLanguage === 'ta') {
        reply = `சரி, ${updated.commodity}! சந்தையை அடைய எத்தனை நாட்கள் ஆகும்?`;
      } else if (activeLanguage === 'kn') {
        reply = `ಸರಿ, ${updated.commodity}! ಮಾರುಕಟ್ಟೆಗೆ ತಲುಪಲು ಎಷ್ಟು ದಿನ ಬೇಕಾಗುತ್ತದೆ?`;
      } else {
        reply = `Got it, ${updated.commodity}! How many days will the journey or transit take until it reaches the market?`;
      }
    } else if (!hasTemp) {
      if (activeLanguage === 'te') {
        reply = `అర్థమైంది, దాదాపు ${updated.transportDurationDays} రోజులు. రవాణా వాహనంలో ఏసీ/శీతలీకరణ ఉన్నదా, లేదా సాధారణ వేడి ఉష్ణోగ్రతలో తీసుకెళ్తారా?`;
      } else if (activeLanguage === 'hi') {
        reply = `ठीक है, लगभग ${updated.transportDurationDays} दिन। क्या गाड़ी में कोल्ड स्टोरेज है या सामान्य गर्मी वाले तापमान पर ले जाया जाएगा?`;
      } else if (activeLanguage === 'ta') {
        reply = `சுமார் ${updated.transportDurationDays} நாட்கள். வாகனம் குளிரூட்டப்பட்டதா அல்லது சாதாரண வெப்பநிலையா?`;
      } else if (activeLanguage === 'kn') {
        reply = `ಅಂದಾಜು ${updated.transportDurationDays} ದಿನಗಳು. ವಾಹನದಲ್ಲಿ ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಇದೆಯೇ ಅಥವಾ ಸಾಮಾನ್ಯ ತಾಪಮಾನವೇ?`;
      } else {
        reply = `Understood, around ${updated.transportDurationDays} days. Will the transport vehicle be refrigerated, or will they be carried at normal ambient temperature?`;
      }
    } else {
      isReady = true;
      if (activeLanguage === 'te') {
        reply = `ధన్యవాదాలు! మీ ${updated.commodity} కోసం అవసరమైన వివరాలు లభించాయి. తగిన మైక్రో-వెంటిలేషన్ మరియు ప్యాకేజింగ్ లెక్కించాను. స్క్రీన్ పై చూడండి!`;
      } else if (activeLanguage === 'hi') {
        reply = `धन्यवाद! आपकी ${updated.commodity} के लिए सभी जानकारी मिल गई है। मैंने आपकी फसल के लिए वैज्ञानिक पैकेजिंग और वेंटिलेशन तैयार कर दिया है।`;
      } else if (activeLanguage === 'ta') {
        reply = `நன்றி! உங்கள் ${updated.commodity}க்கான சரியான காற்றோட்ட பேக்கேஜிங் பரிந்துரை தயாராக உள்ளது.`;
      } else if (activeLanguage === 'kn') {
        reply = `ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ${updated.commodity}ಗೆ ಸೂಕ್ತ ಪ್ಯಾಕೇಜಿಂಗ್ ಸಿದ್ಧವಾಗಿದೆ.`;
      } else {
        reply = `Thank you! I have all the key harvest details for your ${updated.commodity}. Let me now calculate the optimal scientific packaging and ventilation for your trip.`;
      }
    }

    let recommendationResult: Level1RecommendationResult | undefined;
    let detailedReport: FarmerDetailedReport | undefined;

    if (isReady && updated.commodity) {
      const engineInput: Level1Input = {
        commodityName: updated.commodity,
        storageTempC: updated.storageTemperature ?? 28,
        relativeHumidity: updated.refrigeration ? 90 : 75,
        storageType: updated.refrigeration ? 'Cold Storage (Refrigerated)' : 'Ambient Warehouse',
        transportDurationDays: updated.transportDurationDays ?? 2,
        targetShelfLifeDays: (updated.transportDurationDays ?? 2) + 4,
        packagingFormat: this.inferPackagingFormat(updated),
        budget: updated.budget || 'Balanced',
        sustainability: updated.sustainability || 'Prefer biodegradable/compostable',
        mapRequirement: 'Automatic DSS Selection'
      };

      recommendationResult = levelEngines.generateLevel1(engineInput);
      detailedReport = this.generateDetailedFarmerReport(updated, history, speech, recommendationResult, reply);
    }

    return {
      reply,
      updatedContext: updated,
      readyForRecommendation: isReady,
      recommendation: recommendationResult,
      detailedReport,
      provider: 'Deterministic Kisan Expert Buddy (Rule-Based Fallback) + FOODPACK Level-1 Scientific DSS',
      detectedLanguage: activeLanguage
    };
  }

  private inferPackagingFormat(
    ctx: FarmerConversationContext
  ): 'Micro-Perforated Pouch / Bag' | 'Macro-Vented Corrugated Box' | 'Molded Fiber Clamshell / Punnet' | 'Stretch Wrap Tray' {
    const crop = (ctx.commodity || '').toLowerCase();
    if (crop.includes('tomato') || crop.includes('mango') || crop.includes('potato') || crop.includes('onion')) {
      return 'Macro-Vented Corrugated Box';
    }
    if (crop.includes('strawberr') || crop.includes('mushroom') || crop.includes('grape')) {
      return 'Molded Fiber Clamshell / Punnet';
    }
    return 'Micro-Perforated Pouch / Bag';
  }

  /**
   * Constructs the comprehensive evidence-based Farmer Detailed Report
   */
  public generateDetailedFarmerReport(
    context: FarmerConversationContext,
    history: ConversationTurn[],
    latestSpeech: string,
    rec: Level1RecommendationResult,
    replyMessage: string
  ): FarmerDetailedReport {
    const reportId = `FARMER-REP-${Date.now().toString(36).toUpperCase()}`;
    const commodity = context.commodity || rec.commodity.name;

    const convSummary = history.length > 0
      ? `Farmer dialogue covered ${commodity} intended for ${context.packagingPurpose || 'market transportation'}. Transport timeline established at ${context.transportDurationDays || 2} days under ${context.refrigeration ? 'refrigerated (cold chain)' : 'ambient natural weather'} conditions.`
      : `Farmer inquired about packaging for ${commodity} over a ${context.transportDurationDays || 2}-day transit window.`;

    const spokenSummary = `For your ${commodity}, we recommend ${rec.packagingStructure}. This provides calibrated ventilation so your harvest stays firm and fresh without suffocating.`;

    return {
      id: reportId,
      timestamp: new Date().toISOString(),
      conversationSummary: convSummary,
      commodityProfile: {
        name: commodity,
        variety: context.variety || 'Commercial Grade Produce',
        freshness: context.freshness || 'Freshly Harvested',
        respirationClass: rec.commodity.respirationRateClass,
        respirationRateMgCO2: rec.commodity.respirationRateMgCO2,
        recommendedTempRange: rec.commodity.recommendedTempRange,
        optimalHeadspaceGas: rec.commodity.optimalHeadspaceGas,
        transpirationVPDkPa: rec.commodity.transpirationVPDkPa,
        chillingInjurySensitivity: rec.commodity.chillingInjurySensitivity
      },
      logisticsConditions: {
        transportDurationDays: context.transportDurationDays || 2,
        storageDurationDays: context.storageDurationDays || 0,
        targetShelfLifeDays: context.targetShelfLifeDays || ((context.transportDurationDays || 2) + 4),
        refrigerated: Boolean(context.refrigeration),
        transportTempC: context.storageTemperature || 28,
        relativeHumidityPercent: context.humidity || (context.refrigeration ? 90 : 75),
        purpose: context.packagingPurpose || 'Market Distribution'
      },
      sensitivityAnalysis: {
        identifiedPathways: rec.foodSensitivities.map((s) => ({
          name: s.name,
          priority: s.priority,
          criticalLimit: s.criticalLimitDescription
        })),
        respirationRisk: rec.commodity.respirationRateClass.includes('High')
          ? 'Active respiration requires continuous gas exchange. Hermetic plastic sealing will induce rapid anaerobiosis, off-odors, and rotting.'
          : 'Low to moderate respiration rate. Standard ambient ventilation is sufficient to prevent moisture pooling.',
        moistureVaporDeficitRisk: `VPD is ${rec.commodity.transpirationVPDkPa} kPa. Transpiration water loss must be moderated with high relative humidity to prevent shriveling.`
      },
      packagingRecommendation: {
        recommendedMaterial: rec.recommendedPackaging.name,
        structureDescription: rec.packagingStructure,
        format: context.existingPackaging || 'Calibrated Vented Container',
        thicknessMicrons: rec.recommendedThicknessMicrons,
        mapStrategy: {
          type: rec.mapRecommendation.recommendedType,
          justification: rec.mapRecommendation.justification,
          targetO2Percent: rec.mapRecommendation.targetO2Percent,
          targetCO2Percent: rec.mapRecommendation.targetCO2Percent,
          microPerforationRequired: rec.mapRecommendation.perforationDetails.required,
          targetOtrFlux: rec.mapRecommendation.perforationDetails.targetOtrFlux
        },
        justNecessaryEvaluation: {
          overBarrierAvoided: rec.justNecessaryPackaging.overBarrierAvoided,
          explanation: rec.justNecessaryPackaging.explanation
        },
        estimatedShelfLifeDays: rec.estimatedShelfLifeDays,
        estimatedCostINR: rec.estimatedCostPerUnitINR,
        sustainabilityScore: rec.sustainabilityRating
      },
      alternatives: rec.alternatives,
      coldChainManagementRules: rec.storageAndColdChainRules,
      traceableEvidence: rec.scientificEvidence.map((e) => ({
        source: e.source,
        details: `${e.dateOrVersion} • Reference condition: ${(e as any).conditions || e.notes || 'Standard Postharvest'}`
      })),
      assumptions: [
        `Produce is harvested at sound physiological maturity without mechanical bruising.`,
        `Transit temperature does not exceed ${context.storageTemperature || 28}°C for prolonged spikes.`,
        `Pre-cooling or shade holding was performed prior to bulk loading.`
      ],
      missingInformation: [
        context.variety ? '' : 'Specific horticultural cultivar/variety not specified (assumed standard commercial variety).',
        context.humidity ? '' : 'Transit ambient relative humidity assumed based on regional transit norms.'
      ].filter(Boolean),
      validationRequirements: [
        'ASTM D3985 / ASTM F1249 transmission validation if transitioning to printed flexible lidding.',
        'Trial transit test over a representative 48-hour delivery route to evaluate box stacking compression.'
      ],
      spokenVoiceSummary: spokenSummary
    };
  }
}

export const farmerVoiceService = new FarmerVoiceService();
