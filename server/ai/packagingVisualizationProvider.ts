/**
 * FOODPACK-AI: Packaging Visualization Provider Abstractions
 * 
 * Supports open-weight models and real AI image APIs:
 * - Gemini Image Generation: imagen-3.0-generate-002
 * - Open Model / Diffusers: FLUX.1-schnell (Apache 2.0 license) / SDXL (OpenRAIL++ license)
 * - Vector Fallback: Deterministic realistic SVG rendering (cleanly labeled as fallback)
 */

import { GoogleGenAI } from '@google/genai';

export interface PackagingVisualSpec {
  food: string;
  foodName?: string;
  components: string[];
  material: string;
  materialName?: string;
  materialCategory?: string;
  packageStyle: string;
  packingConfiguration: string;
  configuration?: string;
  compartments?: string;
  lid?: string;
  ventilation?: string;
  ventingType?: string;
  foodState?: string;
  temperatureState?: string;
  temperatureContext?: string;
  servingTemperature?: string;
  processingMethod?: string;
  cookingMethod?: string;
  recommendationId?: string;
}

export interface PackagingVisualResult {
  success: boolean;
  imageUrl?: string;
  prompt: string;
  provider: string;
  model: string;
  license: string;
  specSummary: {
    food: string;
    components: string[];
    material: string;
    packageStyle: string;
    packingConfiguration: string;
    ventilation: string;
  };
  disclaimer: string;
  error?: string;
}

export interface PackagingVisualizationProvider {
  readonly name: string;
  readonly model: string;
  readonly license: string;
  generateVisualization(spec: PackagingVisualSpec, dynamicPrompt: string): Promise<PackagingVisualResult>;
}

// -------------------------------------------------------------
// 1. Gemini Image Generation Provider
// -------------------------------------------------------------

export class GeminiImageProvider implements PackagingVisualizationProvider {
  public readonly name = 'Gemini Commercial Image Provider';
  public readonly model = 'imagen-3.0-generate-002';
  public readonly license = 'Google Generative AI Developer Terms';
  private ai: GoogleGenAI | null = null;

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

  public async generateVisualization(spec: PackagingVisualSpec, prompt: string): Promise<PackagingVisualResult> {
    const specSummary = {
      food: spec.food,
      components: spec.components,
      material: spec.material,
      packageStyle: spec.packageStyle,
      packingConfiguration: spec.packingConfiguration,
      ventilation: spec.ventilation || 'Calibrated Micro-Vents'
    };

    if (!this.ai || !process.env.GEMINI_API_KEY) {
      return {
        success: false,
        prompt,
        provider: this.name,
        model: this.model,
        license: this.license,
        specSummary,
        disclaimer: 'AI-generated commercial mockup of your recommended packaging configuration.',
        error: 'Gemini API key is not configured on the server. Please verify GEMINI_API_KEY.'
      };
    }

    const modelsToTry = ['imagen-3.0-generate-002', 'gemini-2.0-flash-exp', 'imagen-3.0-fast-generate-001'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[GeminiImageProvider] Requesting image with model: ${modelName}`);
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: '4:3',
              imageSize: '1K'
            }
          }
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
              return {
                success: true,
                imageUrl,
                prompt,
                provider: this.name,
                model: modelName,
                license: this.license,
                specSummary,
                disclaimer: 'AI-generated visualization of your recommended packaging configuration.'
              };
            }
          }
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    return {
      success: false,
      prompt,
      provider: this.name,
      model: this.model,
      license: this.license,
      specSummary,
      disclaimer: 'Packaging recommendation remains fully intact.',
      error: lastError?.message || 'Gemini image generation was unable to produce an image.'
    };
  }
}

// -------------------------------------------------------------
// 2. Open Model / Diffusers Provider (FLUX.1-schnell / SDXL)
// -------------------------------------------------------------

export class OpenModelDiffusersProvider implements PackagingVisualizationProvider {
  public readonly name = 'FLUX.1-schnell / SDXL Open-Weights Adapter';
  public readonly model = process.env.OPEN_IMAGE_MODEL_NAME || 'FLUX.1-schnell';
  public readonly license = 'Apache 2.0 (FLUX.1-schnell) / OpenRAIL++ (SDXL)';
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.OPEN_IMAGE_MODEL_ENDPOINT || '';
  }

  public async generateVisualization(spec: PackagingVisualSpec, prompt: string): Promise<PackagingVisualResult> {
    const specSummary = {
      food: spec.food,
      components: spec.components,
      material: spec.material,
      packageStyle: spec.packageStyle,
      packingConfiguration: spec.packingConfiguration,
      ventilation: spec.ventilation || 'Micro-Vents'
    };

    if (!this.endpoint) {
      return {
        success: false,
        prompt,
        provider: this.name,
        model: this.model,
        license: this.license,
        specSummary,
        disclaimer: 'Open Model Endpoint not configured (Set OPEN_IMAGE_MODEL_ENDPOINT).',
        error: 'OPEN_IMAGE_MODEL_ENDPOINT not configured.'
      };
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.OPEN_IMAGE_MODEL_KEY ? { 'Authorization': `Bearer ${process.env.OPEN_IMAGE_MODEL_KEY}` } : {})
        },
        body: JSON.stringify({
          prompt,
          width: 1024,
          height: 768,
          num_inference_steps: 4
        })
      });

      if (!res.ok) {
        throw new Error(`Open Model endpoint returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.images?.[0] || data.output?.[0] || data.imageUrl;

      return {
        success: true,
        imageUrl,
        prompt,
        provider: this.name,
        model: this.model,
        license: this.license,
        specSummary,
        disclaimer: 'Generated via Open-Weight Model (FLUX.1-schnell Apache-2.0).'
      };
    } catch (err: any) {
      return {
        success: false,
        prompt,
        provider: this.name,
        model: this.model,
        license: this.license,
        specSummary,
        disclaimer: 'Open Model inference failed.',
        error: err?.message || 'Open image model error'
      };
    }
  }
}
