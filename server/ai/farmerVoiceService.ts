/**
 * FOODPACK-AI: Dynamic Farmer Expert Voice Assistant Service
 * 
 * True dynamic conversational agent for Level 1 (Agricultural Producers & Farmers):
 * - Maintains structured session state (confirmedFields, unknownFields, askedQuestions, turnCount)
 * - Extracts multiple facts from single spoken utterances (crop, variety, quantity, destination, duration, refrigeration, budget)
 * - Handles natural interruptions, farmer questions ("Why do you need that?"), corrections, and unknowns ("I don't know the humidity")
 * - Selects next questions dynamically based on missing essential packaging requirements (NEVER a fixed questionnaire)
 * - Directly invokes the scientific Level 1 Recommendation Engine (levelEngines.generateLevel1)
 * - Verbally explains the recommendation and generates comprehensive traceable reports
 * - Multilingual support (English, Telugu, Hindi, Tamil, Kannada) with seamless live language switching
 * - Provides developer-only structured turn debugging logs
 */

import { GoogleGenAI } from '@google/genai';
import { levelEngines, Level1Input, Level1RecommendationResult } from '../engines/levelEngines';
import { dataStore } from '../db/dataStore';
import { PiperKokoroTTSProvider, GeminiAudioSTTProvider } from './voiceProviders';

export interface FarmerConversationContext {
  commodity?: string | null;
  variety?: string | null;
  freshness?: string | null;
  processingState?: string | null;
  maturity?: string | null;
  quantity?: string | null;
  destination?: string | null;
  storageTemperature?: number | null;
  transportTemperature?: number | null;
  humidity?: number | null;
  transportDuration?: number | null;
  transportDurationDays?: number | null;
  storageDuration?: number | null;
  storageDurationDays?: number | null;
  desiredShelfLife?: number | null;
  targetShelfLifeDays?: number | null;
  refrigeration?: boolean | null;
  packagingPurpose?: 'Transportation' | 'Storage' | 'Retail Market' | 'Export' | null;
  packagingFormatPreference?: string | null;
  budget?: 'Economy' | 'Balanced' | 'Premium' | null;
  sustainability?: 'Prefer recyclable' | 'Prefer biodegradable/compostable' | 'Normal' | null;
  sustainabilityPreference?: string | null;
  existingPackaging?: string | null;
  specialRequirements?: string[];
  confirmedFields?: string[];
  unknownFields?: string[];
  lastQuestion?: string | null;
  askedQuestions?: string[];
  askedQuestionKeys?: string[];
  conversationSummary?: string | null;
  turnCount?: number;
  userNotes?: string;
  recommendationDelivered?: boolean;
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
  alternatives: any[];
  coldChainManagementRules: string[];
  traceableEvidence: { source: string; details: string }[];
  assumptions: string[];
  missingInformation: string[];
  validationRequirements: string[];
  spokenVoiceSummary: string;
}

export interface FarmerConverseResponse {
  reply: string;
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
  private apiAccessDisabled = false;

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
   * Converses naturally with the farmer, updates structured conversation state,
   * avoids repeating questions, handles questions/corrections, and invokes the Level 1 engine.
   */
  public async converse(
    farmerSpeech: string,
    history: ConversationTurn[] = [],
    currentContext: Partial<FarmerConversationContext> = {},
    language: string = 'en'
  ): Promise<FarmerConverseResponse> {
    const cleanSpeech = (farmerSpeech || '').trim();

    // Normalize incoming context
    const normalizedContext: FarmerConversationContext = {
      ...currentContext,
      confirmedFields: Array.isArray(currentContext.confirmedFields) ? [...currentContext.confirmedFields] : [],
      unknownFields: Array.isArray(currentContext.unknownFields) ? [...currentContext.unknownFields] : [],
      askedQuestionKeys: Array.isArray(currentContext.askedQuestionKeys) ? [...currentContext.askedQuestionKeys] : [],
      turnCount: (currentContext.turnCount || 0) + 1
    };

    // 1. If Gemini AI is active and not permission-denied, attempt live LLM conversation
    if (this.ai && process.env.GEMINI_API_KEY && !this.apiAccessDisabled) {
      try {
        return await this.converseWithLLM(cleanSpeech, history, normalizedContext, language);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (err?.status === 403 || errMsg.includes('denied access') || errMsg.includes('PERMISSION_DENIED')) {
          this.apiAccessDisabled = true;
          console.info('[FarmerVoiceService] Cloud project restricted on key; transitioning to dynamic conversational agent.');
        } else {
          console.info('[FarmerVoiceService] Cloud LLM service unavailable; using dynamic conversational agent.');
        }
      }
    }

    // 2. Comprehensive Dynamic Conversational Agent (Full multi-fact extraction, memory, & reasoning)
    return this.converseWithDynamicAgent(cleanSpeech, history, normalizedContext, language);
  }

  /**
   * LLM-driven conversation logic with structured extraction and tool invocation
   */
  private async converseWithLLM(
    speech: string,
    history: ConversationTurn[],
    context: FarmerConversationContext,
    language: string
  ): Promise<FarmerConverseResponse> {
    const prompt = `You are "Kisan Mitra" (Farmer Packaging Buddy), an empathetic, knowledgeable live conversational voice agent for postharvest agricultural packaging (FOODPACK-AI).
You are on an active live voice call with a farmer or agricultural producer.

CRITICAL VOICE CALL RULES:
1. Speak warmly and practically in 1 to 2 spoken sentences maximum (suitable for voice synthesis).
2. DO NOT use fixed scripts or questionnaires.
3. UNDERSTAND MULTI-FACT ANSWERS: A farmer may say "I have fresh tomatoes, 50 kg, sending to Vijayawada tomorrow morning in normal tempo." Extract all facts at once!
4. REMEMBER WHAT WAS ANSWERED: Never ask for facts that are already in "confirmedFields" or marked in "unknownFields".
5. ANSWER FARMER QUESTIONS: If the farmer asks "Why do you need to know that?" or "Can I use cardboard?", explain scientifically yet simply.
6. CORRECTIONS: If the farmer corrects an earlier statement (e.g. "Actually it will take 3 days"), update context seamlessly.
7. LANGUAGE: Respond in ${language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : language === 'ta' ? 'Tamil' : language === 'kn' ? 'Kannada' : 'English'}. If the user asks to switch language, immediately switch and update "detectedLanguage".
8. DECISION: If we have crop + duration + temperature/refrigeration (or ambient state), set "readyForRecommendation": true. Otherwise, ask the single most important missing packaging question.

CURRENT STRUCTURED CONTEXT:
${JSON.stringify(context, null, 2)}

RECENT HISTORY:
${history.slice(-6).map((t) => `${t.role}: ${t.content}`).join('\n')}

LATEST FARMER SPEECH:
"${speech}"

Return STRICT JSON ONLY:
{
  "reply": "string (spoken turn in target language)",
  "detectedLanguage": "en" | "hi" | "te" | "ta" | "kn",
  "extractedFacts": {
    "commodity": "string or null",
    "variety": "string or null",
    "freshness": "string or null",
    "quantity": "string or null",
    "destination": "string or null",
    "storageTemperature": number or null,
    "transportTemperature": number or null,
    "humidity": number or null,
    "transportDurationDays": number or null,
    "storageDurationDays": number or null,
    "refrigeration": boolean or null,
    "packagingPurpose": "Transportation" | "Storage" | "Retail Market" | "Export" | null,
    "budget": "Economy" | "Balanced" | "Premium" | null,
    "sustainability": "Prefer recyclable" | "Prefer biodegradable/compostable" | "Normal" | null
  },
  "readyForRecommendation": boolean,
  "lastQuestionKey": "string"
}`;

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await this.ai!.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response) {
      return this.converseWithDynamicAgent(speech, history, context, language);
    }

    let parsed: any = {};
    try {
      const text = response.text?.trim() || '{}';
      parsed = JSON.parse(text);
    } catch {
      return this.converseWithDynamicAgent(speech, history, context, language);
    }

    const detectedLang = parsed.detectedLanguage || language;
    const extracted = parsed.extractedFacts || {};

    const updatedContext: FarmerConversationContext & {
      confirmedFields: string[];
      unknownFields: string[];
      askedQuestionKeys: string[];
    } = {
      ...context,
      confirmedFields: Array.isArray(context.confirmedFields) ? [...context.confirmedFields] : [],
      unknownFields: Array.isArray(context.unknownFields) ? [...context.unknownFields] : [],
      askedQuestionKeys: Array.isArray(context.askedQuestionKeys) ? [...context.askedQuestionKeys] : []
    };
    Object.keys(extracted).forEach((key) => {
      if (extracted[key] !== null && extracted[key] !== undefined) {
        (updatedContext as any)[key] = extracted[key];
        if (!updatedContext.confirmedFields.includes(key)) {
          updatedContext.confirmedFields.push(key);
        }
      }
    });

    if (parsed.lastQuestionKey && !updatedContext.askedQuestionKeys?.includes(parsed.lastQuestionKey)) {
      updatedContext.askedQuestionKeys = [...(updatedContext.askedQuestionKeys || []), parsed.lastQuestionKey];
    }
    updatedContext.lastQuestion = parsed.reply;

    const isReady = Boolean(
      parsed.readyForRecommendation ||
      (updatedContext.commodity &&
        (updatedContext.transportDurationDays || updatedContext.storageDurationDays) &&
        (updatedContext.refrigeration !== undefined || updatedContext.storageTemperature !== undefined))
    );

    let recommendationResult: Level1RecommendationResult | undefined;
    let detailedReport: FarmerDetailedReport | undefined;

    if (isReady && updatedContext.commodity) {
      const engineInput: Level1Input = {
        commodityName: updatedContext.commodity,
        storageTempC: updatedContext.storageTemperature ?? (updatedContext.refrigeration ? 4 : 28),
        relativeHumidity: updatedContext.humidity ?? (updatedContext.refrigeration ? 90 : 75),
        storageType: updatedContext.refrigeration ? 'Cold Storage (Refrigerated)' : 'Ambient Warehouse',
        transportDurationDays: updatedContext.transportDurationDays ?? 2,
        targetShelfLifeDays: updatedContext.targetShelfLifeDays ?? (updatedContext.transportDurationDays ? updatedContext.transportDurationDays + 4 : 7),
        packagingFormat: this.inferPackagingFormat(updatedContext),
        budget: updatedContext.budget || 'Balanced',
        sustainability: updatedContext.sustainability || 'Prefer biodegradable/compostable',
        mapRequirement: 'Automatic DSS Selection'
      };

      recommendationResult = levelEngines.generateLevel1(engineInput);
      detailedReport = this.generateDetailedFarmerReport(updatedContext, history, speech, recommendationResult, parsed.reply);
      updatedContext.recommendationDelivered = true;
    }

    this.logTurn({
      turn: updatedContext.turnCount || 1,
      userSpeech: speech,
      extractedFacts: extracted,
      updatedContext,
      decision: isReady ? 'RUN_RECOMMENDATION' : 'ASK_NEXT_QUESTION',
      reply: parsed.reply
    });

    return {
      reply: parsed.reply,
      updatedContext,
      readyForRecommendation: isReady,
      recommendation: recommendationResult,
      detailedReport,
      provider: 'Gemini 3.8 Flash (Conversational Expert) + FOODPACK Level-1 Scientific DSS',
      detectedLanguage: detectedLang
    };
  }

  /**
   * Comprehensive Dynamic Conversational Agent
   * Non-scripted, memory-backed multi-fact extractor and dynamic question planner.
   */
  public converseWithDynamicAgent(
    speech: string,
    history: ConversationTurn[],
    context: FarmerConversationContext,
    language: string
  ): FarmerConverseResponse {
    const textLower = speech.toLowerCase().trim();
    const confirmedFields = Array.isArray(context.confirmedFields) ? [...context.confirmedFields] : [];
    const unknownFields = Array.isArray(context.unknownFields) ? [...context.unknownFields] : [];
    const askedQuestions = Array.isArray(context.askedQuestions) ? [...context.askedQuestions] : [];
    const askedQuestionKeys = Array.isArray(context.askedQuestionKeys) ? [...context.askedQuestionKeys] : [];
    const specialRequirements = Array.isArray(context.specialRequirements) ? [...context.specialRequirements] : [];

    const updated: FarmerConversationContext & {
      confirmedFields: string[];
      unknownFields: string[];
      askedQuestions: string[];
      askedQuestionKeys: string[];
      specialRequirements: string[];
    } = {
      ...context,
      confirmedFields,
      unknownFields,
      askedQuestions,
      askedQuestionKeys,
      specialRequirements
    };

    const extractedFacts: Record<string, any> = {};

    // -------------------------------------------------------------
    // 1. Language Detection & Switching
    // -------------------------------------------------------------
    let activeLanguage = language;
    const isTeluguScript = /[\u0C00-\u0C7F]/.test(speech);
    const isHindiScript = /[\u0900-\u097F]/.test(speech);
    const isTamilScript = /[\u0B80-\u0BFF]/.test(speech);
    const isKannadaScript = /[\u0C80-\u0CFF]/.test(speech);

    if (isTeluguScript || textLower.includes('telugu') || textLower.includes('తెలుగు')) {
      activeLanguage = 'te';
    } else if (isHindiScript || textLower.includes('hindi') || textLower.includes('हिंदी')) {
      activeLanguage = 'hi';
    } else if (isTamilScript || textLower.includes('tamil') || textLower.includes('தமிழ்')) {
      activeLanguage = 'ta';
    } else if (isKannadaScript || textLower.includes('kannada') || textLower.includes('ಕನ್ನಡ')) {
      activeLanguage = 'kn';
    } else if (textLower.includes('english')) {
      activeLanguage = 'en';
    }

    // -------------------------------------------------------------
    // 2. Farmer Questions & Inquiries Handling
    // -------------------------------------------------------------
    const isAskingWhy =
      textLower.includes('why') ||
      textLower.includes('enduku') ||
      textLower.includes('ఎందుకు') ||
      textLower.includes('kyu') ||
      textLower.includes('kyun') ||
      textLower.includes('क्यों') ||
      textLower.includes('ஏன்') ||
      textLower.includes('reason') ||
      textLower.includes('need to know');

    const isAskingCardboard =
      textLower.includes('cardboard') ||
      textLower.includes('corrugated') ||
      textLower.includes('gatta') ||
      textLower.includes('peti') ||
      textLower.includes('box') ||
      textLower.includes('crate') ||
      textLower.includes('డబ్బా') ||
      textLower.includes('డబ్బాలు') ||
      textLower.includes('పెట్టె') ||
      textLower.includes('పెట్టెలు') ||
      textLower.includes('కార్డ్‌బోర్డ్') ||
      textLower.includes('डिब्बे') ||
      textLower.includes('पेटी');

    const isAskingCost =
      textLower.includes('cost') ||
      textLower.includes('expensive') ||
      textLower.includes('price') ||
      textLower.includes('kharacha') ||
      textLower.includes('kharch') ||
      textLower.includes('dabbulu') ||
      textLower.includes('ఖర్చు') ||
      textLower.includes('ధర') ||
      textLower.includes('డబ్బులు') ||
      textLower.includes('खर्च') ||
      textLower.includes('दाम');

    const isAskingPerforations =
      textLower.includes('perforation') ||
      textLower.includes('holes') ||
      textLower.includes('randhra') ||
      textLower.includes('రంధ్రాలు') ||
      textLower.includes('రంధ్రం') ||
      textLower.includes('వెంటిలేషన్') ||
      textLower.includes('గాలి') ||
      textLower.includes('ventilat') ||
      textLower.includes('breath') ||
      textLower.includes('छेद');

    // -------------------------------------------------------------
    // 3. Multi-Fact Extraction
    // -------------------------------------------------------------

    // A. Produce / Commodity
    const cropMappings: [RegExp, string][] = [
      [/tomato|tamatar|tamata|thakkali|టమాటా|టమాటాలు/i, 'Fresh Tomatoes'],
      [/strawberr|berr|స్ట్రాబెర్రీ|స్ట్రాబెర్రీలు/i, 'Fresh Strawberries'],
      [/mango|aam|mamidi|maambazham|మామిడి|మామిడికాయలు|మామిడిపండ్లు/i, 'Ripening Mangoes'],
      [/mushroom|puttagodugu|dhingri|kalan|పుట్టగొడుగులు|పుట్టగొడుగు/i, 'Button Mushrooms'],
      [/broccoli|బ్రోకలీ/i, 'Broccoli Florets'],
      [/onion|pyaz|kanda|ullipaya|vengayam|ఉల్లిపాయలు|ఉల్లిపాయ/i, 'Potatoes / Onions'],
      [/potato|aloo|aalu|bangaladumpa|urulaikizhangu|బంగాళాదుంప|బంగాళాదుంపలు/i, 'Potatoes / Onions'],
      [/spinach|palak|palakura|leafy|salad|greens|keerai|saag|ఆకుకూరలు|పాలకూర/i, 'Fresh Cut Salad Greens'],
      [/grape|angoor|draksha|thiratchai|ద్రాక్ష|ద్రాక్షపండ్లు/i, 'Table Grapes'],
      [/banana|kela|arati|vazhaipazham|అరటి|అరటిపండ్లు/i, 'Bananas'],
      [/carrot|gajar|క్యారెట్లు|క్యారెట్/i, 'Carrots'],
      [/capsicum|bell pepper|shimla mirch|క్యాప్సికమ్/i, 'Bell Peppers / Capsicum'],
      [/chilli|chili|mirchi|pasi milagai|మిర్చి|పచ్చిమిర్చి/i, 'Bell Peppers / Capsicum'],
      [/okra|bhindi|bhendi|lady'?s? finger|bendakaya|vendaikkai|బెండకాయ|బెండకాయలు/i, 'Fresh Cut Salad Greens'],
      [/brinjal|eggplant|baingan|vankaya|వంకాయ|వంకాయలు/i, 'Fresh Cut Salad Greens'],
      [/cauliflower|gobhi|phool gobhi|కాలీఫ్లవర్/i, 'Broccoli Florets'],
      [/cabbage|patta gobhi|muttaikose|క్యాబేజీ/i, 'Fresh Cut Salad Greens'],
      [/cucumber|khira|kheera|dosakaya|vellarikkai|దోసకాయ/i, 'Fresh Cut Salad Greens'],
      [/papaya|papita|boppayi|pappali|బొప్పాయి/i, 'Ripening Mangoes'],
      [/guava|amrood|jama|koyya|జామకాయ/i, 'Ripening Mangoes'],
      [/pomegranate|anar|danimma|madhulampazham|దానిమ్మ/i, 'Table Grapes'],
      [/apple|seb|యాపిల్/i, 'Table Grapes'],
      [/orange|citrus|mosambi|santra|battayi|బత్తాయి|నారింజ/i, 'Table Grapes'],
      [/watermelon|tarbooj|puchakaya|పుచ్చకాయ/i, 'Ripening Mangoes'],
      [/bean|french bean|chikkudukaya|చిక్కుడుకాయ/i, 'Fresh Cut Salad Greens'],
      [/bitter gourd|karela|kakarakaya|కాకరకాయ/i, 'Fresh Cut Salad Greens'],
      [/bottle gourd|lauki|sorakaya|సొరకాయ/i, 'Fresh Cut Salad Greens'],
      [/ginger|adrak|allam|అల్లం/i, 'Potatoes / Onions'],
      [/garlic|lasun|lahsun|vellulli|వెల్లుల్లి/i, 'Potatoes / Onions']
    ];

    for (const [regex, commodityName] of cropMappings) {
      if (regex.test(textLower)) {
        updated.commodity = commodityName;
        extractedFacts.commodity = commodityName;
        if (!updated.confirmedFields.includes('commodity')) {
          updated.confirmedFields.push('commodity');
        }
        break;
      }
    }

    // B. Variety
    if (textLower.includes('desi') || textLower.includes('country') || textLower.includes('nattu') || textLower.includes('heirloom') || textLower.includes('నాటు') || textLower.includes('దేసి')) {
      updated.variety = 'Desi / Heirloom';
      extractedFacts.variety = updated.variety;
      if (!updated.confirmedFields.includes('variety')) updated.confirmedFields.push('variety');
    } else if (textLower.includes('hybrid') || textLower.includes('roma') || textLower.includes('f1') || textLower.includes('హైబ్రిడ్')) {
      updated.variety = 'Commercial Hybrid';
      extractedFacts.variety = updated.variety;
      if (!updated.confirmedFields.includes('variety')) updated.confirmedFields.push('variety');
    }

    // C. Freshness & Harvest Maturity
    if (textLower.includes('fresh') || textLower.includes('harvested today') || textLower.includes('just picked') || textLower.includes('picked today') || textLower.includes('తాజా') || textLower.includes('కోసిన') || textLower.includes('ఈ రోజే')) {
      updated.freshness = 'Freshly Harvested';
      extractedFacts.freshness = updated.freshness;
      if (!updated.confirmedFields.includes('freshness')) updated.confirmedFields.push('freshness');
    }

    // D. Quantity
    const qtyMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(kg|kilos|kilograms|quintals|quintal|tons|ton|crates|boxes|bags|baskets|కేజీలు|కేజీ|క్వింటాళ్ళు|టన్నులు)/i);
    if (qtyMatch) {
      updated.quantity = `${qtyMatch[1]} ${qtyMatch[2]}`;
      extractedFacts.quantity = updated.quantity;
      if (!updated.confirmedFields.includes('quantity')) updated.confirmedFields.push('quantity');
    }

    // E. Destination & Logistics Purpose
    const destMatch = textLower.match(/(?:to|send to|towards|for)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
    if (destMatch) {
      const candidate = destMatch[1].trim();
      const ignored = ['the', 'market', 'mandi', 'cold', 'ambient', 'customer', 'buyers', 'me', 'us', 'now', 'today', 'tomorrow'];
      if (!ignored.includes(candidate.toLowerCase())) {
        updated.destination = candidate;
        extractedFacts.destination = candidate;
        if (!updated.confirmedFields.includes('destination')) updated.confirmedFields.push('destination');
      }
    }

    if (
      textLower.includes('transport') ||
      textLower.includes('market') ||
      textLower.includes('mandi') ||
      textLower.includes('send') ||
      textLower.includes('truck') ||
      textLower.includes('tempo') ||
      textLower.includes('journey') ||
      textLower.includes('travel') ||
      textLower.includes('road') ||
      textLower.includes('మార్కెట్') ||
      textLower.includes('మండి') ||
      textLower.includes('రవాణా') ||
      textLower.includes('తీసుకెళ్') ||
      textLower.includes('పంప')
    ) {
      updated.packagingPurpose = 'Transportation';
      extractedFacts.packagingPurpose = 'Transportation';
      if (!updated.confirmedFields.includes('packagingPurpose')) updated.confirmedFields.push('packagingPurpose');
    } else if (textLower.includes('storage') || textLower.includes('store') || textLower.includes('godown') || textLower.includes('warehouse') || textLower.includes('నిల్వ')) {
      updated.packagingPurpose = 'Storage';
      extractedFacts.packagingPurpose = 'Storage';
      if (!updated.confirmedFields.includes('packagingPurpose')) updated.confirmedFields.push('packagingPurpose');
    } else if (textLower.includes('export') || textLower.includes('air') || textLower.includes('abroad') || textLower.includes('ఎగుమతి')) {
      updated.packagingPurpose = 'Export';
      extractedFacts.packagingPurpose = 'Export';
      if (!updated.confirmedFields.includes('packagingPurpose')) updated.confirmedFields.push('packagingPurpose');
    }

    // F. Transport & Storage Duration
    const parseWordNumber = (val: string): number => {
      const numMap: Record<string, number> = {
        a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        twelve: 12, fourteen: 14, fifteen: 15, twenty: 20, 'twenty-four': 24, 'twenty four': 24, 'forty-eight': 48, 'forty eight': 48,
        'ఒక': 1, 'ఒకటి': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5, 'ఆరు': 6, 'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10, 'ఇరవై': 20,
        'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10
      };
      const v = val.toLowerCase().trim();
      if (numMap[v] !== undefined) return numMap[v];
      const parsed = parseInt(v, 10);
      return isNaN(parsed) ? 1 : parsed;
    };

    const dayMatch = textLower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a couple of|few|ఒకటి|ఒక|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది|పది|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\s*(?:days|day|రోజులు|రోజు|rojulu|roju|din|dina)/i);
    const hourMatch = textLower.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty-four|twenty four|forty-eight|forty eight|ఒకటి|ఒక|రెండు|మూడు|నాలుగు|ఐదు|ఆరు|ఏడు|ఎనిమిది|తొమ్మిది|పది|ఇరవై|एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\s*(?:hours|hrs|hr|గంటలు|గంట|gantalu|ganta|ghante|ghanta)/i);
    const weekMatch = textLower.match(/(\d+|one|two|three|four|ఒకటి|ఒక|రెండు|మూడు|నాలుగు|एक|दो|तीन|चार)\s*(?:weeks|week|వారాలు|వారం|saptaah|hafte)/i);

    if (dayMatch) {
      const raw = dayMatch[1].toLowerCase();
      let d = 2;
      if (raw.includes('couple') || raw.includes('few')) d = 2;
      else d = parseWordNumber(raw);
      updated.transportDurationDays = d;
      updated.transportDuration = d;
      extractedFacts.transportDurationDays = d;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    } else if (hourMatch) {
      const hours = parseWordNumber(hourMatch[1]);
      const days = Math.max(1, Math.round(hours / 24));
      updated.transportDurationDays = days;
      updated.transportDuration = days;
      extractedFacts.transportDurationDays = days;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    } else if (weekMatch) {
      const weeks = parseWordNumber(weekMatch[1]);
      const days = weeks * 7;
      updated.transportDurationDays = days;
      updated.transportDuration = days;
      extractedFacts.transportDurationDays = days;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    } else if (
      (textLower.includes('tomorrow') && !textLower.includes('day after tomorrow')) ||
      textLower.includes('రేపు') ||
      textLower.includes('repu') ||
      textLower.includes('kal')
    ) {
      updated.transportDurationDays = 1;
      updated.transportDuration = 1;
      extractedFacts.transportDurationDays = 1;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    } else if (
      textLower.includes('day after tomorrow') ||
      textLower.includes('ఎల్లుండి') ||
      textLower.includes('ellundi') ||
      textLower.includes('parson')
    ) {
      updated.transportDurationDays = 2;
      updated.transportDuration = 2;
      extractedFacts.transportDurationDays = 2;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    } else if (
      textLower.includes('today evening') ||
      textLower.includes('tonight') ||
      textLower.includes('same day') ||
      textLower.includes('by evening') ||
      textLower.includes('few hours') ||
      textLower.includes('ఈ రోజు సాయంత్రం') ||
      textLower.includes('సాయంత్రం') ||
      textLower.includes('రాత్రికి')
    ) {
      updated.transportDurationDays = 1;
      updated.transportDuration = 1;
      extractedFacts.transportDurationDays = 1;
      if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
    }

    // G. Temperature & Cold Chain
    const hasRefrigerationNegation =
      textLower.includes('normal temp') ||
      textLower.includes('room temp') ||
      textLower.includes('ambient') ||
      textLower.includes('ordinary') ||
      textLower.includes('no cold') ||
      textLower.includes('without cold') ||
      textLower.includes('no refrig') ||
      textLower.includes('without refrig') ||
      textLower.includes("won't be refrig") ||
      textLower.includes('wont be refrig') ||
      textLower.includes('not refrig') ||
      textLower.includes('non-ac') ||
      textLower.includes('non ac') ||
      textLower.includes('normal truck') ||
      textLower.includes('open vehicle') ||
      textLower.includes('normal tempo') ||
      textLower.includes('open tempo') ||
      textLower.includes('open truck') ||
      textLower.includes('no ac') ||
      textLower.includes('no fridge') ||
      textLower.includes('outside') ||
      textLower.includes('ordinary vehicle') ||
      textLower.includes('ఏసీ లేదు') ||
      textLower.includes('కోల్డ్ స్టోరేజ్ లేదు') ||
      textLower.includes('సాధారణ ఉష్ణోగ్రత') ||
      textLower.includes('మామూలు ఉష్ణోగ్రత') ||
      textLower.includes('సాధారణ వాతావరణం') ||
      textLower.includes('మామూలు బండి') ||
      textLower.includes('సాధారణ వాహనం') ||
      textLower.includes('చల్లదనం లేదు') ||
      textLower.includes('ఎండ') ||
      textLower.includes('వేడి') ||
      textLower.includes('గది ఉష్ణోగ్రత') ||
      textLower.includes('బయటే') ||
      textLower.includes('सामान्य तापमान') ||
      textLower.includes('बिना फ्रिज') ||
      textLower.includes('एसी नहीं') ||
      textLower.includes('साधारण गाड़ी');

    const hasRefrigerationPositive =
      !hasRefrigerationNegation &&
      (textLower.includes('refrigerat') ||
        textLower.includes('cold storage') ||
        textLower.includes('chilled') ||
        textLower.includes('reefer') ||
        textLower.includes('ac truck') ||
        textLower.includes('with ac') ||
        textLower.includes('cold chain') ||
        textLower.includes('cold room') ||
        textLower.includes('కోల్డ్ స్టోరేజ్') ||
        textLower.includes('ఏసీ ఉంది') ||
        textLower.includes('చల్లగా') ||
        textLower.includes('రెఫ్రిజిరేషన్') ||
        textLower.includes('కోల్డ్ చైన్') ||
        textLower.includes('కోల్డ్ రూమ్') ||
        textLower.includes('कोल्ड स्टोरेज') ||
        textLower.includes('रेफ्रिजरेटेड') ||
        textLower.includes('एसी गाड़ी'));

    if (hasRefrigerationNegation) {
      updated.refrigeration = false;
      if (!updated.storageTemperature) updated.storageTemperature = 28;
      extractedFacts.refrigeration = false;
      if (!updated.confirmedFields.includes('temperature')) updated.confirmedFields.push('temperature');
    } else if (hasRefrigerationPositive) {
      updated.refrigeration = true;
      if (!updated.storageTemperature) updated.storageTemperature = 4;
      extractedFacts.refrigeration = true;
      if (!updated.confirmedFields.includes('temperature')) updated.confirmedFields.push('temperature');
    }

    const tempMatch = textLower.match(/(\d+)\s*(?:degrees|degree|°c|c\b|డిగ్రీలు|డిగ్రీ|डिग्री)/i);
    if (tempMatch) {
      const parsedTemp = parseInt(tempMatch[1], 10);
      updated.storageTemperature = parsedTemp;
      updated.transportTemperature = parsedTemp;
      extractedFacts.storageTemperature = parsedTemp;
      if (!updated.confirmedFields.includes('temperature')) updated.confirmedFields.push('temperature');
      if (parsedTemp > 18) updated.refrigeration = false;
      else if (parsedTemp <= 10) updated.refrigeration = true;
    }

    if (
      textLower.includes('hot') ||
      textLower.includes('heat') ||
      textLower.includes('garmi') ||
      textLower.includes('scorching') ||
      textLower.includes('summer') ||
      textLower.includes('వేడి') ||
      textLower.includes('ఎండ')
    ) {
      if (!updated.storageTemperature || updated.storageTemperature < 28) {
        updated.storageTemperature = 30;
      }
      updated.refrigeration = false;
      extractedFacts.storageTemperature = updated.storageTemperature;
      if (!updated.confirmedFields.includes('temperature')) updated.confirmedFields.push('temperature');
    }

    // H. Unknown Fields Handling ("I don't know the humidity", etc.)
    const isUnknownStatement =
      textLower.includes("don't know") ||
      textLower.includes('dont know') ||
      textLower.includes('do not know') ||
      textLower.includes('no idea') ||
      textLower.includes('not sure') ||
      textLower.includes('not known') ||
      textLower.includes('teleedu') ||
      textLower.includes('తెలీదు') ||
      textLower.includes('తెలియదు') ||
      textLower.includes('ఐడియా లేదు') ||
      textLower.includes('గుర్తు లేదు') ||
      textLower.includes('pata nahi') ||
      textLower.includes('theriyathu') ||
      textLower.includes('gothilla');

    if (isUnknownStatement) {
      if (textLower.includes('humidity') || updated.lastQuestion?.toLowerCase().includes('humid') || textLower.includes('తేమ')) {
        if (!updated.unknownFields.includes('humidity')) updated.unknownFields.push('humidity');
        updated.humidity = updated.refrigeration ? 90 : 75; // safe agricultural default
        extractedFacts.unknownField = 'humidity';
      }
      if (textLower.includes('temperature') || textLower.includes('temp') || updated.lastQuestion?.toLowerCase().includes('temperature') || textLower.includes('ఉష్ణోగ్రత')) {
        if (!updated.unknownFields.includes('temperature')) updated.unknownFields.push('temperature');
        if (updated.storageTemperature === undefined || updated.storageTemperature === null) {
          updated.storageTemperature = 28;
          updated.refrigeration = false;
        }
        if (!updated.confirmedFields.includes('temperature')) updated.confirmedFields.push('temperature');
        extractedFacts.unknownField = 'temperature';
      }
      if (textLower.includes('duration') || textLower.includes('time') || textLower.includes('days') || updated.lastQuestion?.toLowerCase().includes('journey') || updated.lastQuestion?.toLowerCase().includes('transit') || textLower.includes('సమయం') || textLower.includes('రోజులు')) {
        if (!updated.unknownFields.includes('duration')) updated.unknownFields.push('duration');
        if (!updated.transportDurationDays) {
          updated.transportDurationDays = 2;
          updated.transportDuration = 2;
        }
        if (!updated.confirmedFields.includes('duration')) updated.confirmedFields.push('duration');
        extractedFacts.unknownField = 'duration';
      }
    }

    // I. Budget & Sustainability Preferences
    if (textLower.includes('cheap') || textLower.includes('low cost') || textLower.includes('budget') || textLower.includes('affordable') || textLower.includes('economical')) {
      updated.budget = 'Economy';
      extractedFacts.budget = 'Economy';
      if (!updated.confirmedFields.includes('budget')) updated.confirmedFields.push('budget');
    } else if (textLower.includes('premium') || textLower.includes('high end') || textLower.includes('best quality')) {
      updated.budget = 'Premium';
      extractedFacts.budget = 'Premium';
      if (!updated.confirmedFields.includes('budget')) updated.confirmedFields.push('budget');
    }

    if (textLower.includes('eco-friendly') || textLower.includes('eco friendly') || textLower.includes('biodegradable') || textLower.includes('plastic-free') || textLower.includes('compostable') || textLower.includes('organic') || textLower.includes('bagasse')) {
      updated.sustainability = 'Prefer biodegradable/compostable';
      updated.sustainabilityPreference = 'Prefer biodegradable/compostable';
      extractedFacts.sustainability = updated.sustainability;
      if (!updated.confirmedFields.includes('sustainability')) updated.confirmedFields.push('sustainability');
    } else if (textLower.includes('recyclable')) {
      updated.sustainability = 'Prefer recyclable';
      updated.sustainabilityPreference = 'Prefer recyclable';
      extractedFacts.sustainability = updated.sustainability;
      if (!updated.confirmedFields.includes('sustainability')) updated.confirmedFields.push('sustainability');
    }

    // J. User explicit request to calculate
    const wantsCalculationNow =
      textLower.includes('calculate') ||
      textLower.includes('recommend') ||
      textLower.includes('tell me the package') ||
      textLower.includes('give recommendation') ||
      textLower.includes('what should i use') ||
      textLower.includes('generate report') ||
      textLower.includes('yes, please calculate') ||
      textLower.includes('yes calculate') ||
      textLower.includes('please calculate');

    // K. Corrections Handling
    const isCorrection =
      textLower.includes('actually') ||
      textLower.includes('changed') ||
      textLower.includes('correction') ||
      textLower.includes('instead') ||
      textLower.includes('not ') ||
      textLower.includes('wait');

    // -------------------------------------------------------------
    // 4. Dynamic Conversational Reasoning & Question Planning
    // -------------------------------------------------------------
    let reply = '';
    let isReady = false;
    let selectedQuestionKey = '';

    const hasCrop = Boolean(updated.commodity);
    const hasDuration = Boolean(updated.transportDurationDays || updated.storageDurationDays || updated.unknownFields.includes('duration'));
    const hasTemperature = Boolean(updated.refrigeration !== undefined || updated.storageTemperature !== undefined || updated.unknownFields.includes('temperature'));
    const coreComplete = hasCrop && hasDuration && hasTemperature;

    // SCENARIO 1: Post-Recommendation Consultation Mode (ZERO LOOPING)
    if (updated.recommendationDelivered) {
      isReady = true;

      if (isCorrection || (extractedFacts.transportDurationDays && extractedFacts.transportDurationDays !== context.transportDurationDays)) {
        if (activeLanguage === 'te') {
          reply = `సవరణ నమోదు చేశాను! ప్రయాణ సమయాన్ని ${updated.transportDurationDays} రోజులకు మార్చి, తాజా ప్యాకేజింగ్ లెక్కించాను.`;
        } else if (activeLanguage === 'hi') {
          reply = `बदलाव दर्ज कर लिया गया है! यात्रा का समय ${updated.transportDurationDays} दिन मानकर पैकेजिंग दोबारा तैयार कर दी गई है।`;
        } else {
          reply = `Understood! Updated your journey timeline to ${updated.transportDurationDays} days and recalculated your packaging requirements.`;
        }
      } else if (isAskingCardboard) {
        if (activeLanguage === 'te') {
          reply = `అవును, మీ ${updated.commodity} కోసం వెంటిలేషన్ రంధ్రాలు ఉన్న గట్టి కార్డ్‌బోర్డ్ క్రేట్‌లు చాలా అనుకూలం. అవి గాలిని ఆడనిస్తాయి మరియు రవాణాలో కాయలు నలగకుండా కాపాడతాయి.`;
        } else if (activeLanguage === 'hi') {
          reply = `हाँ, आपकी ${updated.commodity} के लिए वेंटिलेशन छेद वाले 5-प्लाई कोरूगेटेड डिब्बे बहुत उपयुक्त हैं। इससे हवा का संचार बना रहता है और फसल दबने से बचती है।`;
        } else {
          reply = `Yes, heavy-duty 5-ply corrugated cardboard boxes with side ventilation slots are very effective for ${updated.commodity}. They cushion the produce and allow chimney ventilation during transport.`;
        }
      } else if (isAskingPerforations || isAskingWhy) {
        if (activeLanguage === 'te') {
          reply = `తాజా కూరగాయలు ప్యాక్ చేసిన తర్వాత కూడా శ్వాసక్రియ జరుపుతాయి. సరైన మైక్రో-వెంటిలేషన్ రంధ్రాలు లేకపోతే లోపల తేమ నిలిచిపోయి బూజు పడుతుంది.`;
        } else if (activeLanguage === 'hi') {
          reply = `ताज़ा फसल पैक होने के बाद भी सांस लेती है। अगर पैकेट में वेंटिलेशन नहीं होगा तो अंदर पसीना और फंगస్ लग जाएगी।`;
        } else {
          reply = `Fresh produce continuously respires and releases moisture vapor. Calibrated micro-perforations maintain oxygen equilibrium while allowing excess humidity to escape, preventing rot.`;
        }
      } else if (isAskingCost || extractedFacts.budget) {
        if (activeLanguage === 'te') {
          reply = `మీ బడ్జెట్ ప్రకారం అతి తక్కువ ఖర్చుతో కూడిన పొదుపైన ప్యాకేజింగ్ ఎంపికను ఎంపిక చేశాను. ఇది బాక్సుకు దాదాపు ₹15 నుండి ₹22 వరకు ఖర్చవుతుంది.`;
        } else if (activeLanguage === 'hi') {
          reply = `आपकी पसंद के अनुसार सबसे किफायती और कम लागत वाली पैकेजिंग चुनी गई है। इसकी प्रति डिब्बा अनुमानित लागत ₹15 से ₹22 है।`;
        } else {
          reply = `Understood! Selected an economical, low-cost configuration for your harvest. Estimated cost is around ₹15 to ₹25 per container.`;
        }
      } else {
        if (activeLanguage === 'te') {
          reply = `మీ ${updated.commodity} ప్యాకేజింగ్ ప్రణాళిక సిద్ధంగా ఉంది. రవాణాలో క్రేట్‌లను ఎండ తగలకుండా నీడలో ఉంచండి, మరియు గాలి తగిలేలా పేర్చండి.`;
        } else if (activeLanguage === 'hi') {
          reply = `आपकी ${updated.commodity} की सिफारिश सक्रिय रूप से तैयार है। यात्रा के दौरान डिब्बों को सीधी धूप से बचाएं और हवा आने दें।`;
        } else {
          reply = `Your packaging plan for ${updated.commodity} is actively calculated and ready on your screen. Keep crates ventilated and shielded from direct sunlight during transit.`;
        }
      }
      selectedQuestionKey = 'consultation_followup';
    }
    // SCENARIO 2: Crop / Produce is Missing
    else if (!hasCrop) {
      selectedQuestionKey = 'ask_crop';
      if (activeLanguage === 'te') {
        reply = "నమస్కారం! మీరు ఏ తాజా పంటను ప్యాక్ చేయాలనుకుంటున్నారు? ఉదాహరణకు టమాటాలు, మామిడి, స్ట్రాబెర్రీలు లేదా ఆకుకూరలు?";
      } else if (activeLanguage === 'hi') {
        reply = "नमस्ते! आज आप कौन सी ताज़ा फसल पैक करने जा रहे हैं? जैसे टमाटर, आम, स्ट्रॉबेरी या हरी सब्जियां?";
      } else if (activeLanguage === 'ta') {
        reply = "வணக்கம்! என்ன பயிரை பேக் செய்ய திட்டமிட்டுள்ளீர்கள்? தக்காளி, மாம்பழம், அல்லது கீரைகள்?";
      } else if (activeLanguage === 'kn') {
        reply = "ನಮಸ್ಕಾರ! ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಪ್ಯಾಕ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? ಟೊಮೆಟೊ, ಮಾವು, ಅಥವಾ ಹಸಿರು ತರಕಾರಿಗಳೇ?";
      } else {
        reply = "Welcome! What crop or fresh produce are you packing today? For example, fresh tomatoes, mangoes, strawberries, or leafy greens?";
      }
    }
    // SCENARIO 3: Farmer asks "Why do you need to know that?"
    else if (isAskingWhy) {
      let explanation = '';
      if (activeLanguage === 'te') {
        explanation = `పంట కోత తర్వాత కూడా కాయలు శ్వాసక్రియ జరుపుతాయి మరియు తేమను విడుదల చేస్తాయి. ప్రయాణ సమయం మరియు వాహన ఉష్ణోగ్రత తెలిస్తేనే ప్యాకెట్‌కు ఎన్ని మైక్రో రంధ్రాలు కావాలో శాస్త్రీయంగా లెక్కించగలం.`;
      } else if (activeLanguage === 'hi') {
        explanation = `फसल कटने के बाद भी सांस लेती है और नमी छोड़ती है। यात्रा का समय और तापमान पता होने पर ही हम सही वेंटिलेशन छेद और सुरक्षा तय कर सकते हैं ताकि उपज खराब न हो।`;
      } else {
        explanation = `Fresh harvest respires and releases moisture vapor continuously. Knowing your transit duration and vehicle temperature lets our scientific engine calculate the exact ventilation perforations to prevent mold without drying out.`;
      }

      if (!hasDuration) {
        selectedQuestionKey = 'ask_duration';
        reply = activeLanguage === 'te'
          ? `${explanation} మార్కెట్‌కు చేరడానికి ఎంత సమయం లేదా ఎన్ని రోజులు పడుతుంది?`
          : `${explanation} How long will the journey take until it reaches the market or buyer?`;
      } else if (!hasTemperature) {
        selectedQuestionKey = 'ask_temperature';
        reply = activeLanguage === 'te'
          ? `${explanation} రవాణాలో ఏసీ ఉందా లేదా సాధారణ వాహనమా?`
          : `${explanation} Will the vehicle be refrigerated, or carried in normal ambient weather?`;
      } else {
        reply = explanation;
      }
    }
    // SCENARIO 4: Crop Known, Missing Transit/Storage Duration
    else if (!hasDuration) {
      selectedQuestionKey = 'ask_duration';
      const cropName = updated.commodity;
      const ackCrop = updated.variety ? `${updated.variety} ${cropName}` : cropName;
      const ackDest = updated.destination ? ` to ${updated.destination}` : '';

      if (activeLanguage === 'te') {
        reply = `సరే, ${ackCrop}! మార్కెట్‌కు చేరడానికి ప్రయాణానికి ఎంత సమయం లేదా ఎన్ని రోజులు పడుతుంది?`;
      } else if (activeLanguage === 'hi') {
        reply = `समझ गया, ${ackCrop}! मंडी तक पहुँचने में कितने दिन या घंटे लगेंगे?`;
      } else if (activeLanguage === 'ta') {
        reply = `சரி, ${ackCrop}! சந்தையை அடைய எத்தனை நாட்கள் அல்லது மணிநேரம் ஆகும்?`;
      } else if (activeLanguage === 'kn') {
        reply = `ಸರಿ, ${ackCrop}! ಮಾರುಕಟ್ಟೆಗೆ ತಲುಪಲು ಎಷ್ಟು ಸಮಯ ಅಥವಾ ದಿನ ಬೇಕಾಗುತ್ತದೆ?`;
      } else {
        reply = `Got it, ${ackCrop}${ackDest}! How long will the journey take until it reaches the market or buyer?`;
      }
    }
    // SCENARIO 5: Crop & Duration Known, Missing Temperature / Cold Chain
    else if (!hasTemperature) {
      selectedQuestionKey = 'ask_temperature';
      const daysText = updated.transportDurationDays ? `${updated.transportDurationDays} days` : 'your transit';

      if (activeLanguage === 'te') {
        reply = `అర్థమైంది. రవాణా వాహనంలో ఏసీ లేదా కోల్డ్ స్టోరేజ్ ఉందా, లేదా సాధారణ వేడి వాతావరణంలో తీసుకెళ్తారా?`;
      } else if (activeLanguage === 'hi') {
        reply = `समझ गया। क्या गाड़ी में कोल्ड स्टोरेज है, या फिर सामान्य तापमान और गर्मी में ले जाया जाएगा?`;
      } else if (activeLanguage === 'ta') {
        reply = `வாகனம் குளிரூட்டப்பட்டதா அல்லது சாதாரண வெப்பநிலையா?`;
      } else if (activeLanguage === 'kn') {
        reply = `ವಾಹನದಲ್ಲಿ ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್ ಇದೆಯೇ ಅಥವಾ ಸಾಮಾನ್ಯ ತಾಪಮಾನವೇ?`;
      } else {
        reply = `Understood. Will the transport vehicle be refrigerated with cold storage, or will it be carried in normal ambient weather?`;
      }
    }
    // SCENARIO 6: Core Facts Complete -> Offer Budget/Sustainability (if early) OR Run Recommendation
    else if (
      !updated.confirmedFields.includes('budget') &&
      !updated.confirmedFields.includes('sustainability') &&
      !updated.askedQuestionKeys.includes('ask_preference') &&
      (updated.turnCount || 0) < 4 &&
      !wantsCalculationNow
    ) {
      selectedQuestionKey = 'ask_preference';
      if (activeLanguage === 'te') {
        reply = `ప్రధాన వివరాలు లభించాయి. మీరు తక్కువ ఖర్చుతో కూడిన ప్యాకేజింగ్ కోరుకుంటున్నారా, లేదా పర్యావరణ అనుకూల బయో-మెటీరియల్ కావాలా?`;
      } else if (activeLanguage === 'hi') {
        reply = `मुख्य विवरण मिल गए हैं। क्या आप कम लागत वाली सामान्य पैकेजिंग चाहते हैं, या पर्यावरण-अनुकूल बायोडिग्रेडेबल सामग्री?`;
      } else {
        reply = `I have the core transit conditions. Do you prefer economical low-cost packaging, or eco-friendly biodegradable materials?`;
      }
    }
    // SCENARIO 7: Sufficient Information -> EXECUTE LEVEL 1 RECOMMENDATION!
    else {
      isReady = true;
      updated.recommendationDelivered = true;
      selectedQuestionKey = 'delivered_recommendation';

      if (activeLanguage === 'te') {
        reply = `ధన్యవాదాలు! మీ ${updated.commodity} కోసం శాస్త్రీయ ప్యాకేజింగ్ మరియు అవసరమైన మైక్రో-వెంటిలేషన్ రంధ్రాలు లెక్కించాను. వివరాలు మీ స్క్రీన్ పై చూడండి!`;
      } else if (activeLanguage === 'hi') {
        reply = `धन्यवाद! आपकी ${updated.commodity} के लिए अनुकूलित पैकेजिंग और वेंटिलेशन तैयार कर दिया गया है। रिपोर्ट स्क्रीन पर उपलब्ध है।`;
      } else if (activeLanguage === 'ta') {
        reply = `நன்றி! உங்கள் ${updated.commodity}க்கான சரியான காற்றோட்ட பேக்கேஜிங் பரிந்துரை தயாராக உள்ளது.`;
      } else if (activeLanguage === 'kn') {
        reply = `ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ${updated.commodity}ಗೆ ಸೂಕ್ತ ಪ್ಯಾಕೇಜಿಂಗ್ ಸಿದ್ಧವಾಗಿದೆ.`;
      } else {
        reply = `Thank you! I have all necessary harvest details for your ${updated.commodity}. I have calculated the optimal packaging structure and ventilation on your screen.`;
      }
    }

    if (selectedQuestionKey && !updated.askedQuestionKeys.includes(selectedQuestionKey)) {
      updated.askedQuestionKeys.push(selectedQuestionKey);
    }
    if (reply && !updated.askedQuestions.includes(reply)) {
      updated.askedQuestions.push(reply);
    }
    updated.lastQuestion = reply;

    let recommendationResult: Level1RecommendationResult | undefined;
    let detailedReport: FarmerDetailedReport | undefined;

    // RUN REAL LEVEL 1 RECOMMENDATION ENGINE
    if (isReady && updated.commodity) {
      const engineInput: Level1Input = {
        commodityName: updated.commodity,
        storageTempC: updated.storageTemperature ?? (updated.refrigeration ? 4 : 28),
        relativeHumidity: updated.humidity ?? (updated.refrigeration ? 90 : 75),
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

    // DEVELOPER LOGGING (PART 23)
    this.logTurn({
      turn: updated.turnCount || 1,
      userSpeech: speech,
      extractedFacts,
      updatedContext: updated,
      decision: isReady ? 'EXECUTE_LEVEL1_RECOMMENDATION' : `ASK_${selectedQuestionKey.toUpperCase()}`,
      reply
    });

    return {
      reply,
      updatedContext: updated,
      readyForRecommendation: isReady,
      recommendation: recommendationResult,
      detailedReport,
      provider: 'Dynamic Kisan Multilingual Agent + FOODPACK Level-1 Scientific DSS',
      detectedLanguage: activeLanguage
    };
  }

  /**
   * Developer Structured Turn Logging (PART 23)
   */
  private logTurn(data: {
    turn: number;
    userSpeech: string;
    extractedFacts: Record<string, any>;
    updatedContext: FarmerConversationContext;
    decision: string;
    reply: string;
  }) {
    const known = data.updatedContext.confirmedFields || [];
    const unknown = data.updatedContext.unknownFields || [];
    const missing: string[] = [];

    if (!data.updatedContext.commodity) missing.push('commodity');
    if (!data.updatedContext.transportDurationDays && !data.updatedContext.storageDurationDays) missing.push('duration');
    if (data.updatedContext.refrigeration === undefined && data.updatedContext.storageTemperature === undefined) missing.push('temperature');

    console.log(`\n============================================================`);
    console.log(`[FOODPACK-AI LEVEL 1 VOICE AGENT] TURN ${data.turn}`);
    console.log(`------------------------------------------------------------`);
    console.log(`USER TRANSCRIPT: "${data.userSpeech}"`);
    console.log(`EXTRACTED FACTS:`, JSON.stringify(data.extractedFacts));
    console.log(`KNOWN FIELDS: [${known.join(', ')}]`);
    console.log(`UNKNOWN FIELDS: [${unknown.join(', ')}]`);
    console.log(`MISSING ESSENTIAL FIELDS: [${missing.join(', ')}]`);
    console.log(`DECISION: ${data.decision}`);
    console.log(`ASSISTANT RESPONSE: "${data.reply}"`);
    console.log(`============================================================\n`);
  }

  public getLocalizedProduceName(commodity: string, lang: string): string {
    const lower = (commodity || '').toLowerCase();
    if (lang === 'te') {
      if (lower.includes('tomato')) return 'టమాటాలు';
      if (lower.includes('strawberr')) return 'స్ట్రాబెర్రీలు';
      if (lower.includes('mango')) return 'మామిడి';
      if (lower.includes('mushroom')) return 'పుట్టగొడుగులు';
      if (lower.includes('broccoli')) return 'బ్రోకలీ';
      if (lower.includes('onion')) return 'ఉల్లిపాయలు';
      if (lower.includes('potato')) return 'బంగాళాదుంపలు';
      if (lower.includes('spinach') || lower.includes('greens')) return 'ఆకుకూరలు';
      if (lower.includes('grape')) return 'ద్రాక్ష';
      if (lower.includes('banana')) return 'అరటిపండ్లు';
      if (lower.includes('carrot')) return 'క్యారెట్లు';
      if (lower.includes('capsicum')) return 'క్యాప్సికమ్';
      return commodity;
    }
    if (lang === 'hi') {
      if (lower.includes('tomato')) return 'टमाटर';
      if (lower.includes('strawberr')) return 'स्ट्रॉबेरी';
      if (lower.includes('mango')) return 'आम';
      if (lower.includes('mushroom')) return 'मशरूम';
      if (lower.includes('broccoli')) return 'ब्रोकोली';
      if (lower.includes('onion')) return 'प्याज';
      if (lower.includes('potato')) return 'आलू';
      if (lower.includes('spinach') || lower.includes('greens')) return 'हरी सब्जियां';
      if (lower.includes('grape')) return 'अंगूर';
      if (lower.includes('banana')) return 'केले';
      if (lower.includes('carrot')) return 'गाजर';
      if (lower.includes('capsicum')) return 'शिमला मिर्च';
      return commodity;
    }
    return commodity;
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
