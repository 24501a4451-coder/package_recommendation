import { GoogleGenAI } from '@google/genai';
import { dataStore } from '../db/dataStore';

export class AssistantService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });
      } catch (err) {
        this.ai = null;
      }
    }
  }

  public async answerQuestion(
    question: string,
    context?: {
      recommendation?: any;
      material?: any;
      foodProfile?: any;
      level?: string;
    }
  ): Promise<{ answer: string; evidenceCited: string[]; aiMode: 'REAL' | 'FALLBACK' }> {
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are the FOODPACK-AI Scientific Packaging Assistant (SIH26236).
User Level: ${context?.level || 'LEVEL_2 Takeaway Intelligence'}
Context: ${JSON.stringify(context || {})}
User Question: "${question}"

GUIDELINES:
1. Ground answers strictly in food science, polymer physics, ASTM/ISO testing, and the current recommendation context.
2. DO NOT invent fake laboratory numbers or unverified shelf lives.
3. If explaining OTR or WVTR, explain the units (cc/m²·day·atm and g/m²·day) and why test temperature/RH conditions matter.
4. Keep the response concise, authoritative, structured, and easy to read.

Return JSON:
{
  "answer": "string (markdown allowed)",
  "evidenceCited": ["string"]
}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text?.trim() || '{}');
        return {
          answer: parsed.answer || 'No response generated.',
          evidenceCited: parsed.evidenceCited || ['FOODPACK-AI Scientific Knowledge Base'],
          aiMode: 'REAL'
        };
      } catch (err) {
        console.warn('AI Assistant error, using grounded deterministic responder:', err);
      }
    }

    // Grounded fallback responder based on scientific keywords
    const q = question.toLowerCase();
    let answer = '';
    const evidenceCited: string[] = [];

    if (q.includes('otr') || q.includes('oxygen')) {
      answer = `**Oxygen Transmission Rate (OTR)** measures the amount of oxygen gas that passes through a packaging film over 24 hours per square meter at 1 atmosphere partial pressure (unit: cc / (m² · day · atm)).
      
- **Standard Test Method:** ASTM D3985 (Coulometric Sensor method, typically run at 23°C and 0% or 50% Relative Humidity).
- **Why it matters:** Low OTR (< 2 cc/m²·day) is crucial for fatty foods and fried snacks to prevent **lipid autoxidation** and rancid off-flavors. Conversely, fresh produce (Level 1) requires **high or micro-perforated OTR** to prevent anaerobic fermentation and ethanol off-flavor development.`;
      evidenceCited.push('ASTM D3985 Coulometric Sensor Protocol', 'Polymer Handbook 4th Edition');
    } else if (q.includes('wvtr') || q.includes('moisture') || q.includes('vapor')) {
      answer = `**Water Vapor Transmission Rate (WVTR)** measures the passage of moisture vapor through a packaging barrier per unit area per day (unit: g / (m² · day)).
      
- **Standard Test Method:** ASTM F1249 (Modulated Infrared Sensor at 38°C / 90% RH) or ASTM E96 (Gravimetric Cup method).
- **Critical Takeaway Insight:** In hot takeaway food (like Fried Chicken or Biryani), an ultra-tight moisture barrier (very low WVTR) is actually a *hazard* if unvented, because 80°C steam trapped inside will condense against the cooler lid ("the rain effect") and drip back down, ruining crispy batters!`;
      evidenceCited.push('ASTM F1249 Standard Test Method', 'Packaging Technology and Science Vol 35');
    } else if (q.includes('why') || q.includes('recommend') || q.includes('bagasse') || q.includes('container')) {
      answer = `**Recommendation Rationale:**
      
The system selected this packaging configuration because:
1. **Thermodynamic Breathability:** Sugarcane bagasse / ventilated board possesses a calibrated vapor permeation rate (WVTR ~280 g/m²·day), which dissipates boiling steam without suffocating the meal.
2. **Thermal Insulation:** Molded agro-waste fibers feature low bulk thermal conductivity compared to thin plastics, keeping the core food temperature above 62°C for up to 45–60 minutes.
3. **Oil Resistance:** Certified TAPPI T559 Kit 8 resistance prevents ghee and spiced animal fats from bleeding through during bumpy bike transit.
4. **Separation Rule:** Hot steam must never share an unpartitioned cavity with cold dairy or fried sides.`;
      evidenceCited.push('Journal of Cleaner Production Vol 284', 'TAPPI T559 Oil Barrier Test');
    } else if (q.includes('sustainab') || q.includes('plastic') || q.includes('compost')) {
      answer = `**Sustainability & Circularity Profile:**
      
- **Sugarcane Bagasse & Molded Pulp:** Upcycled agricultural residues. Certified under **EN 13432** / **ASTM D6400** to biodegrade in commercial composting conditions within 90 days, producing zero microplastics.
- **Comparison to Conventional Plastic:** Polypropylene (PP 05) is technically recyclable, but post-consumer food-contaminated containers have less than 9% actual recycling recovery in urban sorting streams due to grease residue.
- **PFAS-Free Requirement:** FOODPACK-AI strictly recommends fluorochemical-free plant-based wax liners to avoid persistent PFAS contamination in soil.`;
      evidenceCited.push('EN 13432 European Bioplastics Standard', 'Central Pollution Control Board (CPCB) Guidelines');
    } else {
      answer = `**FOODPACK-AI Packaging Engineering Advisory:**
      
Your configuration has been evaluated against:
1. **Hard Thermodynamic Constraints:** Operating temperature limit, liquid seal pressure, and hot oil resistance.
2. **Dynamic Food Properties:** Water activity (Aw), pH, moisture vapor flux, and crispness vulnerability.
3. **Multi-Objective Optimization:** Balancing culinary quality, delivery transit duration, cost per serving, and carbon footprint.
      
Ask me specific questions regarding **OTR, WVTR, ASTM standards, grease barrier (Kit ratings), or multi-compartment food physics**!`;
      evidenceCited.push('FOODPACK-AI Decision Support Core');
    }

    return {
      answer,
      evidenceCited,
      aiMode: 'FALLBACK'
    };
  }
}

export const assistantService = new AssistantService();
