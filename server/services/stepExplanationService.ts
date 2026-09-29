/**
 * FOODPACK-AI: Step Explanation Service
 * 
 * Explains specific packing or handling instructions to the farmer on demand
 * (e.g., "Explain step 3", "Why should I do this?").
 * 
 * Provides biological, packaging, and logistical rationale tailored to the
 * exact crop, package type, and environmental conditions in the farmer's language.
 */

import { GoogleGenAI } from '@google/genai';
import { FarmerConversationContext } from '../ai/farmerVoiceService';

export interface StepExplanationRequest {
  crop: string;
  packageType: string;
  stepNumber: number;
  stepText: string;
  farmerContext?: Partial<FarmerConversationContext>;
  language?: string;
}

export interface StepExplanationResponse {
  stepNumber: number;
  stepText: string;
  explanation: string;
  spokenText: string;
  language: string;
}

export class StepExplanationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
      } catch (e) {
        this.ai = null;
      }
    }
  }

  public async explainStep(req: StepExplanationRequest): Promise<StepExplanationResponse> {
    const lang = (req.language || 'en').toLowerCase();
    const crop = req.crop || 'Fresh Produce';
    const pkg = req.packageType || 'Ventilated Container';
    const stepNum = req.stepNumber || 1;
    const step = req.stepText || 'Pack produce according to instructions';

    // Rule-grounded domain explanation fallbacks guaranteeing instantaneous zero-failure response
    let explanationEn = '';
    let spokenEn = '';
    let explanationTe = '';
    let spokenTe = '';

    const stepLower = step.toLowerCase();

    if (stepLower.includes('sort') || stepLower.includes('inspect') || stepLower.includes('liner') || stepLower.includes('clean')) {
      explanationEn = `Step ${stepNum} protects the produce from friction and cross-contamination. Inspecting the ${pkg} ensures ventilation chimneys are free of dirt and no sharp plastic burrs puncture the produce skin. Removing split fruits prevents fungal molds from spreading to healthy cargo in transit.`;
      spokenEn = `We do step ${stepNum} to make sure only firm, unbruised ${crop} enters the container and no sharp corners scratch the skins.`;

      explanationTe = `దశ ${stepNum} పంటను రాపిడి మరియు ఇన్ఫెక్షన్ల నుండి కాపాడుతుంది. ${pkg} లో ఎటువంటి దుమ్ము లేదా పదునైన అంచులు లేకుండా చూసుకోవడం ద్వారా కాయల తొక్క దెబ్బతినకుండా ఉంటుంది. ఒకే కుళ్ళిన కాయ మొత్తం బాక్స్‌ను పాడు చేయకుండా నివారిస్తుంది.`;
      spokenTe = `దశ ${stepNum} ద్వారా కాయలకు గీతలు పడకుండా, కుళ్ళిపోకుండా కాపాడతాము.`;
    } else if (stepLower.includes('stem') || stepLower.includes('calyx') || stepLower.includes('tier') || stepLower.includes('layer') || stepLower.includes('arrange')) {
      explanationEn = `Step ${stepNum} uses the natural anatomy of ${crop}. Placing stems or calyxes downward stabilizes the fruit center of gravity and prevents the sharp stem from puncturing adjacent produce when the vehicle hits potholes or vibrates on highways.`;
      spokenEn = `Arranging ${crop} stem-downward in step ${stepNum} prevents sharp stems from puncturing neighboring fruits during vehicle vibration.`;

      explanationTe = `దశ ${stepNum} లో కాయలను తొడిమ కిందకి ఉండేలా పేర్చడం వల్ల రవాణాలో కుదుపులకు పక్కనున్న కాయలకు తొడిమలు గుచ్చుకోకుండా ఉంటాయి.`;
      spokenTe = `కుదుపులకు కాయలు ఒకదానికొకటి గుచ్చుకోకుండా దశ ${stepNum} ని పాటిస్తాము.`;
    } else if (stepLower.includes('clearance') || stepLower.includes('rim') || stepLower.includes('fill') || stepLower.includes('weight')) {
      explanationEn = `Step ${stepNum} prevents compression bruising. Leaving at least 25mm clearance under the top rim ensures that when crates are stacked 5 to 6 high in the truck, the entire vertical load rests on the structural container walls, not on the ${crop}.`;
      spokenEn = `Leaving top clearance in step ${stepNum} ensures the weight of stacked crates is supported by the container walls, not crushing the ${crop}.`;

      explanationTe = `దశ ${stepNum} కాయలు నలిగిపోకుండా కాపాడుతుంది. పైభాగంలో కనీసం ఒక అంగుళం ఖాళీ ఉంచడం వల్ల పైనున్న బాక్సుల బరువు క్రేట్ అంచుల మీద పడుతుంది కానీ కాయల మీద పడదు.`;
      spokenTe = `పై క్రేట్ల బరువు కాయల మీద పడకుండా దశ ${stepNum} రక్షిస్తుంది.`;
    } else if (stepLower.includes('vent') || stepLower.includes('chimney') || stepLower.includes('air') || stepLower.includes('airflow')) {
      explanationEn = `Step ${stepNum} maintains active respiration gas exchange. Freshly harvested ${crop} constantly breathes and releases heat and humidity. Keeping side vents open and unobstructed allows natural wind drafts to sweep out heat, preventing sour fermentation.`;
      spokenEn = `Step ${stepNum} keeps ventilation passages open so heat and moisture escape, stopping sour mold rot.`;

      explanationTe = `దశ ${stepNum} గాలి ప్రసరణను నిరంతరం కొనసాగిస్తుంది. కోసిన తర్వాత కూడా ${crop} శ్వాసక్రియ జరుపుతుంది కాబట్టి వెంటిలేషన్ రంధ్రాలు తెరిచి ఉంచితే లోపల తేమ పేరుకుపోకుండా బూజు పట్టదు.`;
      spokenTe = `గాలి ఆడేలా చూసుకోవడం వల్ల లోపల ఉక్కపోత మరియు బూజు రాకుండా ఉంటాయి.`;
    } else {
      explanationEn = `Step ${stepNum} is calibrated specifically for ${crop} in ${pkg}. Following this method ensures mechanical protection against road vibration, uniform weight distribution, and controlled transpiration throughout your journey.`;
      spokenEn = `Step ${stepNum} ensures your ${crop} stays fresh and protected from transit shock.`;

      explanationTe = `దశ ${stepNum} మీ ${crop} రవాణాలో పాడవకుండా రక్షిస్తుంది. ఇది కాయల బరువు సమానంగా పడేలా చేసి మార్కెట్‌లో మంచి రేటు వచ్చేలా చేస్తుంది.`;
      spokenTe = `మీ పంట రవాణాలో పాడవకుండా దశ ${stepNum} ఎంతో ముఖ్యం.`;
    }

    // If Gemini model is available, attempt real-time dynamic explanation enhancement
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an expert postharvest agricultural specialist explaining to an Indian farmer why a specific packing instruction is important.
Crop: ${crop}
Package Type: ${pkg}
Step Number: ${stepNum}
Instruction: "${step}"
Language Requested: ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}

Provide a 2-sentence simple, practical explanation of the biological or mechanical reason for this step. Do not use jargon like OTR or Arrhenius. Focus on preventing bruising, rot, or heat buildup.`;

        const res = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });

        const generated = res.text?.trim();
        if (generated && generated.length > 20) {
          return {
            stepNumber: stepNum,
            stepText: step,
            explanation: generated,
            spokenText: generated,
            language: lang
          };
        }
      } catch (err: any) {
        console.info('Dynamic step explanation notice (using domain fallback):', err?.message);
      }
    }

    if (lang === 'te') {
      return {
        stepNumber: stepNum,
        stepText: step,
        explanation: explanationTe,
        spokenText: spokenTe,
        language: 'te'
      };
    }

    return {
      stepNumber: stepNum,
      stepText: step,
      explanation: explanationEn,
      spokenText: spokenEn,
      language: 'en'
    };
  }
}

export const stepExplanationService = new StepExplanationService();
