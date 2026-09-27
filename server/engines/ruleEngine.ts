import { PackagingMaterial, FoodCommodity, ScientificProvenance } from '../db/dataStore';

export interface HardConstraintCheckResult {
  passed: boolean;
  materialId: string;
  violations: string[];
}

export interface ProcessingTransformation {
  rawIngredients: string[];
  cookingMethod: 'Deep Fried' | 'Dum Steamed / Boiled' | 'Baked / Roasted' | 'Simmered Curry' | 'Raw / Fresh' | 'Extruded / Dried' | 'Refrigerated Cold';
  servingTemperature: 'Very Hot (>75°C)' | 'Warm (50-70°C)' | 'Room Temp (20-30°C)' | 'Chilled (0-8°C)' | 'Frozen (<-18°C)';
  moistureReleaseState: 'High Active Steam' | 'Moderate Vapor' | 'Static Moisture' | 'Dry';
  physicalTexture: 'Crisp Batter Crust' | 'Moist Grains' | 'Viscous Liquid Gravy' | 'Solid Fresh Cell' | 'Brittle Snack';
}

export class ScientificRuleEngine {
  /**
   * Applies thermodynamic, chemical, and physical hard constraints.
   */
  public evaluateHardConstraints(
    material: PackagingMaterial,
    food: Partial<FoodCommodity>,
    transformation: ProcessingTransformation,
    deliveryMinutes: number,
    requiresLiquidSeal: boolean
  ): HardConstraintCheckResult {
    const violations: string[] = [];

    // 1. Thermal Degradation Constraint
    let foodTempC = 25;
    if (transformation.servingTemperature === 'Very Hot (>75°C)') foodTempC = 85;
    else if (transformation.servingTemperature === 'Warm (50-70°C)') foodTempC = 60;
    else if (transformation.servingTemperature === 'Chilled (0-8°C)') foodTempC = 5;
    else if (transformation.servingTemperature === 'Frozen (<-18°C)') foodTempC = -18;

    if (foodTempC > material.maxOperatingTempC) {
      violations.push(
        `Thermal Failure: Food temperature (${foodTempC}°C) exceeds material glass transition / melting limit (${material.maxOperatingTempC}°C) of ${material.name}. Risk of polymer leaching or warping.`
      );
    }
    if (foodTempC < material.minOperatingTempC) {
      violations.push(
        `Cryogenic Brittleness: Food temperature (${foodTempC}°C) drops below material cold-crack threshold (${material.minOperatingTempC}°C).`
      );
    }

    // 2. Grease Resistance Constraint (TAPPI T559 Kit Test)
    const fatPercent = food.fatContentPercent ?? 5;
    if (fatPercent > 12 && material.greaseResistanceKit.value < 6) {
      violations.push(
        `Lipid Penetration: Fat content (${fatPercent}%) requires minimum TAPPI Kit 6; material only delivers Kit ${material.greaseResistanceKit.value}. Risk of grease bleed and structural softening.`
      );
    }
    if (transformation.cookingMethod === 'Deep Fried' && !material.hotOilResistant) {
      violations.push(
        `Hot Oil Incompatibility: Deep-fried food requires certified hot oil resistance; material degrades on direct contact.`
      );
    }

    // 3. Crispness vs Moisture Entrapment Constraint (The "Rain Effect")
    if (
      food.crispnessSensitivity === 'Critical' &&
      transformation.moistureReleaseState === 'High Active Steam' &&
      !material.steamVentingCompatible &&
      material.wvtr.value < 20
    ) {
      violations.push(
        `Condensation Trap: Critical crispness with active steam cannot use non-vented, zero-WVTR sealed barrier (${material.wvtr.value} g/m²·day). Trapped steam will condensate on interior lid and drip back, causing irreversible crust sogginess.`
      );
    }

    // 4. Liquid Gravy & Sealing Hermeticity Constraint
    if (requiresLiquidSeal && (food.moistureContentPercent ?? 0) > 70) {
      if (material.category === 'Molded Fiber' && !material.structureType.includes('Co-extruded') && !material.name.includes('Hermetic')) {
        // Fiber clamshell without tight mechanical gasket
        violations.push(
          `Liquid Hydrostatic Seepage: High moisture curry (>70%) transported for ${deliveryMinutes} min through courier transit requires positive locking mechanical seal or hermetic rim. Porous pulp rim risks capillary liquid edge-leakage.`
        );
      }
    }

    // 5. Fresh Produce Anaerobic Fermentation Constraint (Level 1)
    if (food.respirationRateClass === 'Extremely High' || food.respirationRateClass === 'High') {
      if (material.otr.value < 100 && !material.steamVentingCompatible && !material.name.includes('Micro-Perforated')) {
        violations.push(
          `Anaerobic Asphyxiation Risk: Fresh commodity with ${food.respirationRateClass} respiration will deplete headspace oxygen within hours in non-perforated barrier (OTR ${material.otr.value} cc/m²·day). Causes anaerobic fermentation, ethanol/acetaldehyde accumulation, and rapid rot.`
        );
      }
    }

    return {
      passed: violations.length === 0,
      materialId: material.id,
      violations
    };
  }

  /**
   * Analyzes multi-component food interaction (e.g. Biryani + Chicken 65 + Raita)
   */
  public analyzeMultiComponentInteractions(components: string[]): {
    requiresSeparation: boolean;
    recommendedVesselArchitecture: string;
    identifiedHazards: string[];
    scientificReasoning: string;
  } {
    const hazards: string[] = [];
    let hasHotSteam = false;
    let hasColdDairy = false;
    let hasCrispyFried = false;
    let hasOilyGravy = false;

    const lower = components.map(c => c.toLowerCase());

    lower.forEach(c => {
      if (c.includes('biryani') || c.includes('rice') || c.includes('noodles') || c.includes('pulao')) {
        hasHotSteam = true;
      }
      if (c.includes('raita') || c.includes('curd') || c.includes('salad') || c.includes('ice cream') || c.includes('chutney')) {
        hasColdDairy = true;
      }
      if (c.includes('65') || c.includes('crispy') || c.includes('fried') || c.includes('papad') || c.includes('kachori') || c.includes('fry')) {
        hasCrispyFried = true;
      }
      if (c.includes('gravy') || c.includes('salan') || c.includes('curry') || c.includes('dal') || c.includes('sambar') || c.includes('soup')) {
        hasOilyGravy = true;
      }
    });

    if (hasHotSteam && hasColdDairy) {
      hazards.push('Thermodynamic Condensation & Microbial Spoilage: Hot steam will heat cold curd/raita above 15°C promoting bacterial growth while accelerating liquid curd syneresis (whey separation).');
    }
    if (hasHotSteam && hasCrispyFried) {
      hazards.push('Vapor Absorption & Batter Plasticization: Water vapor from hot rice will diffuse into the batter starch matrix of crispy fried components, plasticizing the crisp crust into a rubbery texture.');
    }
    if (hasOilyGravy && hasCrispyFried) {
      hazards.push('Liquid Phase Migration: Free oil and water from runny gravy will wet crunchy coatings, causing structural collapse.');
    }

    if (hazards.length >= 2) {
      return {
        requiresSeparation: true,
        recommendedVesselArchitecture: 'Multi-Vessel Hybrid System: Main insulated fiber container for hot rice + separate external hermetic clip-cup for cold raita/salan + dry ventilated pouch/insert for crispy fried starter.',
        identifiedHazards: hazards,
        scientificReasoning: 'Thermodynamics dictates that combining hot moist food with cold dairy or crispy items in a single unpartitioned vessel results in rapid quality degradation. Vapor pressure differentials drive moisture directly into crisp pores, while heat conduction degrades lactic cultures in chilled condiments.'
      };
    } else if (hazards.length === 1) {
      return {
        requiresSeparation: true,
        recommendedVesselArchitecture: 'Compartment Tray with Independent Lid Seals or Separate Side Cup',
        identifiedHazards: hazards,
        scientificReasoning: 'Physical barrier needed between liquid/chilled condiments and primary food to prevent cross-contamination and sogginess.'
      };
    } else {
      return {
        requiresSeparation: false,
        recommendedVesselArchitecture: 'Single Unified Container',
        identifiedHazards: [],
        scientificReasoning: 'Components share similar water activity, moisture state, and temperature thresholds; single vessel is thermodynamically compatible.'
      };
    }
  }
}

export const scientificRuleEngine = new ScientificRuleEngine();
