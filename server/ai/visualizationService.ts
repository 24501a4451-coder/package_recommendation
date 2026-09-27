import { GoogleGenAI } from '@google/genai';
import {
  PackagingVisualSpec,
  PackagingVisualResult,
  PackagingVisualizationProvider,
  GeminiImageProvider,
  OpenModelDiffusersProvider
} from './packagingVisualizationProvider';

export interface VisualPackagingRequest extends PackagingVisualSpec {}

export interface VisualPackagingResponse extends PackagingVisualResult {}

export class VisualizationService {
  private geminiProvider: GeminiImageProvider;
  private openModelProvider: OpenModelDiffusersProvider;

  constructor() {
    this.geminiProvider = new GeminiImageProvider();
    this.openModelProvider = new OpenModelDiffusersProvider();
  }

  /**
   * Constructs a photorealistic commercial food-packaging product photography prompt
   * dynamically based on the current food, material, style, and configuration.
   */
  public buildDynamicPrompt(req: VisualPackagingRequest): string {
    const food = (req.food || req.foodName || 'Prepared Takeaway Food').trim();
    const componentsList = Array.isArray(req.components) && req.components.length > 0 
      ? req.components 
      : [food];
    const componentsStr = componentsList.join(', ');

    const material = (req.material || req.materialName || 'Sugarcane Bagasse').trim();
    const style = (req.packageStyle || 'Takeaway Food Container').trim();
    const config = (req.packingConfiguration || req.configuration || 'Multi-compartment food container').trim();
    const ventilation = (req.ventilation || req.ventingType || '').trim();
    const temp = (req.temperatureState || req.servingTemperature || 'Hot').trim();

    // 1. Material appearance description
    const materialLower = material.toLowerCase();
    let materialVisualDesc = 'realistic commercial food-safe packaging material with natural manufactured textures';

    if (materialLower.includes('bagasse') || materialLower.includes('sugarcane') || materialLower.includes('molded fiber')) {
      materialVisualDesc = 'natural molded sugarcane bagasse fiber. Show the realistic molded-fiber texture, natural matte organic tactile grain, and characteristic off-white/beige warm appearance of authentic bagasse packaging';
    } else if (materialLower.includes('corrugated') || materialLower.includes('kraft flute')) {
      materialVisualDesc = 'natural unbleached kraft corrugated cardboard with realistic micro-flute structural edges and earthy brown paperboard surface';
    } else if (materialLower.includes('paperboard') || materialLower.includes('carton') || materialLower.includes('aqueous')) {
      materialVisualDesc = 'premium food-grade folded paperboard with smooth aqueous-coated barrier finish, clean creased edges, and natural unbleached or satin white food container walls';
    } else if (materialLower.includes('cpet') || materialLower.includes('crystallized pet')) {
      materialVisualDesc = 'heat-resistant matte black CPET (crystallized polyethylene terephthalate) tray with rigid engineered structural ribs and clean food-safe satin surface';
    } else if (materialLower.includes('pet') || materialLower.includes('polyethylene terephthalate')) {
      materialVisualDesc = 'crystal-clear transparent recyclable PET food packaging with realistic translucent reflections and clean formed ridges';
    } else if (materialLower.includes('pp') || materialLower.includes('polypropylene')) {
      materialVisualDesc = 'durable food-grade polypropylene (PP 05) container with realistic semi-translucent frosted plastic walls, molded reinforced rims, and smooth food-safe interior';
    } else if (materialLower.includes('aluminium') || materialLower.includes('aluminum') || materialLower.includes('foil')) {
      materialVisualDesc = 'food-grade pressed aluminium container with authentic silver metallic sheen, embossed rigid walls, and cleanly crimped hemmed rim';
    } else if (materialLower.includes('bio') || materialLower.includes('compostable') || materialLower.includes('pla')) {
      materialVisualDesc = 'certified compostable plant-based molded biopolymer container with clean matte finish and authentic eco-friendly commercial appearance';
    } else if (materialLower.includes('laminate') || materialLower.includes('pouch') || materialLower.includes('barrier film')) {
      materialVisualDesc = 'premium commercial multi-layer barrier packaging with sleek matte exterior, airtight heat-sealed borders, and authentic flexible structural packaging look';
    }

    // 2. Ventilation description
    const isVented = ventilation && !ventilation.toLowerCase().includes('none') && !ventilation.toLowerCase().includes('hermetic');
    let ventilationDesc = '';
    if (isVented) {
      ventilationDesc = `If ventilation is part of the recommendation, represent it realistically through small practical factory-cut vents or calibrated steam escape slits in the lid rather than adding floating labels or arrows.`;
    } else {
      ventilationDesc = `The container features a secure, leak-proof fitted lid with clean locking rim designed to keep liquids contained.`;
    }

    // 3. Compartment layout & food presentation
    let layoutDesc = '';
    if (componentsList.length > 1) {
      layoutDesc = `Show the actual food components clearly separated inside the recommended compartment configuration: ${componentsStr}. Each food item is neatly placed inside its designated physical chamber or side cup according to the packaging configuration (${config}), preventing cross-mixing of textures and sauces.`;
    } else {
      layoutDesc = `Show the freshly prepared ${food} generously and neatly portioned inside the physical container according to the recommended configuration (${config}).`;
    }

    // 4. Steam / Temperature cue
    let thermalDesc = '';
    if (temp.toLowerCase().includes('hot')) {
      thermalDesc = 'Subtle, gentle wisps of natural steam softly rising from the hot food, showing freshness.';
    } else if (temp.toLowerCase().includes('chill') || temp.toLowerCase().includes('cold')) {
      thermalDesc = 'Freshly chilled presentation with crisp textures maintained.';
    }

    // 5. Assembled prompt
    const prompt = `Create a photorealistic commercial food-packaging product photograph showing ${food} served inside a ${style}.

The recommended packaging material is ${material}.
${materialVisualDesc}.

${layoutDesc}

Show the recommended compartment configuration clearly through the physical container design.

Use a realistic hinged or fitted food-safe lid matching the container design. Show the packaging in an open product photography angle where both the arranged food inside the compartments and the container structure/lid design are clearly visible.

${ventilationDesc}
${thermalDesc}

The result should look like a real commercially manufactured takeaway package, not a concept drawing or engineering diagram.

Professional restaurant product photography.
Realistic commercial container geometry and physical proportions.
Natural studio lighting with soft shadows.
Photorealistic, appetizing food.
Photorealistic packaging material textures and tactile surface.
Clean neutral background on a contemporary restaurant countertop.
Premium but realistic commercial takeaway presentation.

Do not include:
blueprint lines,
neon lines,
arrows,
technical annotations,
measurement labels,
engineering diagrams,
floating text,
UI elements,
CAD rendering,
wireframe geometry,
schematic drawings,
or infographic elements.`;

    return prompt;
  }

  /**
   * Generates a realistic packaging visual mockup using Gemini Image Generation API
   */
  public async generatePackagingVisual(req: VisualPackagingRequest): Promise<VisualPackagingResponse> {
    const prompt = this.buildDynamicPrompt(req);

    // If Open Model Diffusers endpoint (e.g. FLUX.1-schnell / SDXL) is explicitly configured, use it
    if (process.env.OPEN_IMAGE_MODEL_ENDPOINT) {
      console.log(`[VisualizationService] Using Open Model Provider (${this.openModelProvider.model})`);
      return await this.openModelProvider.generateVisualization(req, prompt);
    }

    // Default to Gemini Commercial Image Generation Provider
    console.log(`[VisualizationService] Using Gemini Image Provider (${this.geminiProvider.model})`);
    return await this.geminiProvider.generateVisualization(req, prompt);
  }
}

export const visualizationService = new VisualizationService();
