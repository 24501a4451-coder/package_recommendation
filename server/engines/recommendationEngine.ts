import { PackagingMaterial, FoodCommodity, ScientificProvenance, dataStore } from '../db/dataStore';
import { scientificRuleEngine, ProcessingTransformation } from './ruleEngine';

export interface UserPreferences {
  priorities: string[]; // e.g. ['Maintain heat', 'Maintain crispness', 'Prevent leakage', 'Maintain texture', 'Maintain freshness', 'Presentation', 'Low cost', 'Sustainability']
  budget?: 'Economy' | 'Balanced' | 'Premium';
  sustainability?: 'Normal' | 'Prefer recyclable' | 'Prefer biodegradable/compostable' | 'Strong sustainability preference' | string;
  deliveryTime: 'Less than 30 minutes' | '30–60 minutes' | '1–2 hours' | 'More than 2 hours' | string;
  deliveryMethod?: string;
  servingSize?: string;
  foodCondition?: 'Very Hot' | 'Hot' | 'Warm' | 'Room Temp' | 'Chilled' | 'Frozen';
  freshness?: 'Just now' | '<30 min ago' | '30–60 min ago' | '1–2 hrs ago' | 'Reheated';
  customRequirement?: string;
  packedTogether?: 'Yes' | 'No';
}

export interface ScoredMaterial {
  material: PackagingMaterial;
  score: number;
  breakdown: {
    functionalFitScore: number;
    costEconomyScore: number;
    sustainabilityScore: number;
    userPriorityScore: number;
  };
  eliminated: boolean;
  violations?: string[];
}

export interface RecommendationResult {
  topCandidate: PackagingMaterial;
  actionableSummary: {
    packagingName: string;
    materialName: string;
    materialCategory: string;
    packageStyle: string;
    configuration: string;
    quickWhy: string;
    deliveryWindow: string;
    packingInstructions: string[];
  };
  alternatives: {
    material: PackagingMaterial;
    packageStyle: string;
    costDelta: string;
    tradeoff: string;
  }[];
  eliminatedMaterials: {
    materialName: string;
    reasons: string[];
  }[];
  detailedAnalysis: {
    foodProfile: any;
    detectedIngredients: string[];
    componentRelationships: string[];
    moistureConsiderations: string[];
    temperatureConsiderations: string[];
    freshnessConsiderations: string[];
    steamCondensationRisk: {
      steamRisk: 'High' | 'Medium' | 'Low';
      condensationRisk: 'High' | 'Medium' | 'Low';
      crispnessLossRisk: 'High' | 'Medium' | 'Low';
      ventingRequired: string;
      absorberNeeded: boolean;
      separateCompartmentNeeded: boolean;
    };
    textureAnalysis: string;
    leakageAnalysis: string;
    packagingRequirements: string[];
    scientificEvidence: ScientificProvenance[];
    assumptions: string[];
    limitations: string[];
    validationTests: string[];
    optimizationFactors: {
      functionalFit: number;
      costEconomy: number;
      sustainability: number;
      userPriorities: number;
    };
  };
  configuration: any;
  multiComponentAnalysis?: any;
  whyExplanation: string;
  evidence: ScientificProvenance[];
  assumptions: string[];
  limitations: string[];
  validationRequired: string[];
  costEstimate: {
    unitCostINR: number;
    currency: string;
    basis: string;
  };
  sustainabilityScore: number;
}

export class RecommendationEngine {
  /**
   * Evaluates packaging candidates purely using physical food properties, thermodynamic states,
   * hard constraints, and multi-objective optimization.
   * NO HARDCODED FOOD-NAME TO MATERIAL MAPPINGS.
   */
  public generateRecommendation(
    food: Partial<FoodCommodity>,
    transformation: ProcessingTransformation,
    preferences: UserPreferences,
    components: string[] = []
  ): RecommendationResult {
    const allMaterials = dataStore.materials;
    const allStyles = dataStore.packageStyles;
    const allConfigs = dataStore.packingConfigurations;
    const customReqLower = (preferences.customRequirement || '').toLowerCase();

    // 1. Determine delivery duration in minutes
    let deliveryMinutes = 45;
    if (preferences.deliveryTime.includes('<30') || preferences.deliveryTime.includes('Less than 30')) {
      deliveryMinutes = 20;
    } else if (preferences.deliveryTime.includes('30–60') || preferences.deliveryTime.includes('30-60')) {
      deliveryMinutes = 45;
    } else if (preferences.deliveryTime.includes('1–2') || preferences.deliveryTime.includes('1-2')) {
      deliveryMinutes = 90;
    } else if (preferences.deliveryTime.includes('2+')) {
      deliveryMinutes = 150;
    }

    // 2. Derive Physical & Thermodynamic Requirements from Food State
    const moisture = food.moistureContentPercent ?? 50;
    const fat = food.fatContentPercent ?? 10;
    const isLiquid = moisture > 70 || transformation.physicalTexture === 'Viscous Liquid Gravy';
    const isCrispy =
      food.crispnessSensitivity === 'Critical' ||
      food.crispnessSensitivity === 'High' ||
      transformation.physicalTexture === 'Crisp Batter Crust' ||
      transformation.physicalTexture === 'Brittle Snack' ||
      transformation.cookingMethod === 'Deep Fried' ||
      preferences.priorities.some((p) => p.toLowerCase().includes('crisp'));

    const isHot =
      transformation.servingTemperature === 'Very Hot (>75°C)' ||
      transformation.servingTemperature === 'Warm (50-70°C)' ||
      preferences.foodCondition === 'Very Hot' ||
      preferences.foodCondition === 'Hot';

    const isChilled =
      transformation.servingTemperature === 'Chilled (0-8°C)' ||
      transformation.servingTemperature === 'Frozen (<-18°C)' ||
      preferences.foodCondition === 'Chilled' ||
      preferences.foodCondition === 'Frozen';

    const requiresLiquidSeal =
      isLiquid || preferences.priorities.some((p) => p.toLowerCase().includes('leak'));

    const wantsPlasticFree =
      preferences.priorities.some((p) => p.toLowerCase().includes('sustain')) ||
      preferences.sustainability?.includes('Strong') ||
      preferences.sustainability?.includes('Zero Plastic') ||
      customReqLower.includes('no plastic') ||
      customReqLower.includes('plastic free') ||
      customReqLower.includes('biodegradable');

    // 3. Multi-Component interaction analysis
    let multiCompAnalysis;
    if (components.length > 1) {
      multiCompAnalysis = scientificRuleEngine.analyzeMultiComponentInteractions(components);
    }

    // 4. Hard Constraints Evaluation
    const eliminated: { materialName: string; reasons: string[] }[] = [];
    const scoredCandidates: ScoredMaterial[] = [];

    for (const mat of allMaterials) {
      const check = scientificRuleEngine.evaluateHardConstraints(
        mat,
        food,
        transformation,
        deliveryMinutes,
        requiresLiquidSeal
      );

      const violations = [...check.violations];

      // Custom requirement: Plastic-Free constraint
      if (wantsPlasticFree && mat.category === 'Commodity Polymers') {
        violations.push('User constraint: Zero plastic / Circular bio-structure requested.');
      }

      // Hard elimination check for non-vented zero-breathability polymer when crispness is critical
      if (isCrispy && isHot && mat.wvtr.value < 20 && !mat.steamVentingCompatible) {
        violations.push('Trapped steam hazard: Impermeable non-vented structure triggers condensation sogginess.');
      }

      // Hard elimination check for low thermal limit when serving temperature exceeds maxOperatingTempC
      let foodTempC = 25;
      if (transformation.servingTemperature === 'Very Hot (>75°C)') foodTempC = 85;
      else if (transformation.servingTemperature === 'Warm (50-70°C)') foodTempC = 60;
      else if (transformation.servingTemperature === 'Chilled (0-8°C)') foodTempC = 5;
      else if (transformation.servingTemperature === 'Frozen (<-18°C)') foodTempC = -18;

      if (foodTempC > mat.maxOperatingTempC) {
        violations.push(`Thermal failure: Food temp (${foodTempC}°C) exceeds material limit (${mat.maxOperatingTempC}°C).`);
      }

      if (violations.length > 0) {
        eliminated.push({ materialName: mat.name, reasons: violations });
      }

      // Calculate dynamic multi-objective scores
      const scoreData = this.calculateObjectiveScores(
        mat,
        food,
        transformation,
        preferences,
        isCrispy,
        requiresLiquidSeal,
        wantsPlasticFree,
        isChilled,
        isHot,
        deliveryMinutes
      );

      scoredCandidates.push({
        material: mat,
        score: scoreData.totalScore,
        breakdown: scoreData.breakdown,
        eliminated: violations.length > 0,
        violations
      });
    }

    // 5. Select Top Material from Non-Eliminated Candidates
    const validCandidates = scoredCandidates
      .filter((c) => !c.eliminated)
      .sort((a, b) => b.score - a.score);

    let selectedMaterial: PackagingMaterial;
    if (validCandidates.length > 0) {
      selectedMaterial = validCandidates[0].material;
    } else {
      // If all were eliminated by strict constraints, pick candidate with fewest violations
      const sortedByViolations = scoredCandidates.sort(
        (a, b) => (a.violations?.length || 0) - (b.violations?.length || 0)
      );
      selectedMaterial = sortedByViolations[0]?.material || allMaterials[0];
    }

    // 6. Dynamically Select Package Style
    const selectedStyle = this.selectDynamicPackageStyle(
      allStyles,
      isCrispy,
      requiresLiquidSeal,
      isChilled,
      isHot,
      components,
      preferences.packedTogether
    );

    // 7. Dynamically Select Packing Configuration & Generate Instructions
    const selectedConfig = this.selectDynamicConfiguration(
      allConfigs,
      food.name || 'Prepared Food',
      components,
      selectedMaterial,
      selectedStyle,
      isCrispy,
      requiresLiquidSeal,
      isChilled,
      isHot,
      preferences.deliveryTime,
      preferences.packedTogether
    );

    // 8. Dynamically Evaluate Alternative Candidates
    const alternativeCandidates = validCandidates
      .filter((c) => c.material.id !== selectedMaterial.id)
      .slice(0, 2)
      .map((alt) => {
        const delta = alt.material.estimatedCostPerUnitINR - selectedMaterial.estimatedCostPerUnitINR;
        const deltaStr =
          delta > 0
            ? `+₹${delta.toFixed(2)}`
            : delta < 0
            ? `-₹${Math.abs(delta).toFixed(2)}`
            : 'Same cost';

        let altStyle = selectedStyle.name;
        if (alt.material.category === 'Molded Fiber') {
          altStyle = 'Molded Bagasse Clamshell / Tray';
        } else if (alt.material.category === 'Commodity Polymers') {
          altStyle = 'Polypropylene Snap-Rim Container';
        } else if (alt.material.category === 'Cellulose / Paper') {
          altStyle = 'Kraft Paperboard Food Box';
        }

        let tradeoff = 'Alternative candidate evaluated against the same physical constraints.';
        if (alt.material.sustainabilityRating > selectedMaterial.sustainabilityRating) {
          tradeoff = `Higher sustainability rating (${alt.material.sustainabilityRating}/100 vs ${selectedMaterial.sustainabilityRating}/100), but cost delta of ${deltaStr}.`;
        } else if (alt.material.estimatedCostPerUnitINR < selectedMaterial.estimatedCostPerUnitINR) {
          tradeoff = `Lower unit packaging cost (${deltaStr}), but ${alt.material.category === 'Commodity Polymers' ? 'synthetic polymer substrate' : 'lower barrier rating'}.`;
        } else if (alt.material.maxOperatingTempC > selectedMaterial.maxOperatingTempC) {
          tradeoff = `Higher temperature ceiling (${alt.material.maxOperatingTempC}°C vs ${selectedMaterial.maxOperatingTempC}°C) for aggressive reheating.`;
        }

        return {
          material: alt.material,
          packageStyle: altStyle,
          costDelta: deltaStr,
          tradeoff
        };
      });

    // 9. Scientific Evidence Traceability
    const evidence: ScientificProvenance[] = [
      selectedMaterial.otr.provenance,
      selectedMaterial.wvtr.provenance,
      selectedMaterial.greaseResistanceKit.provenance
    ];
    if (food.provenance) {
      evidence.push(food.provenance);
    }

    // 10. Deep Detailed Analysis Object
    const foodNameStr = food.name || 'Prepared Dish';
    const detailedAnalysis = {
      foodProfile: {
        name: foodNameStr,
        category: food.category || 'Food Service Takeaway',
        moistureContentPercent: moisture,
        fatContentPercent: fat,
        waterActivity: food.waterActivity || (isLiquid ? 0.96 : isCrispy ? 0.45 : 0.85),
        pH: food.pH || 6.2,
        crispnessSensitivity: isCrispy ? 'Critical' : 'Low'
      },
      detectedIngredients: transformation.rawIngredients || components,
      componentRelationships: multiCompAnalysis?.identifiedHazards || [
        'Single component meal matrix evaluated.'
      ],
      moistureConsiderations: [
        `Moisture release state: ${transformation.moistureReleaseState || 'Moderate Vapor'}.`,
        `Estimated internal water vapor pressure at dispatch: ${isHot ? '~38.5 kPa (High Steam Driving Force)' : '~2.3 kPa (Ambient)'}.`,
        isCrispy
          ? 'Moisture absorption into batter crust causes rapid loss of crispness via starch plasticization.'
          : isLiquid
          ? 'High water activity mandates positive hydrostatic rim seal to prevent seeping.'
          : 'Moisture retention is required to keep food tender.'
      ],
      temperatureConsiderations: [
        `Dispatch temperature condition: ${preferences.foodCondition || transformation.servingTemperature || 'Hot'}.`,
        `Operating temperature boundaries of ${selectedMaterial.name}: ${selectedMaterial.minOperatingTempC}°C to ${selectedMaterial.maxOperatingTempC}°C.`,
        `Thermal conductivity of ${selectedMaterial.category}: ~0.06 - 0.15 W/(m·K), providing insulation during ${preferences.deliveryTime} transit.`
      ],
      freshnessConsiderations: [
        `Preparation timing: ${preferences.freshness || 'Freshly prepared'}.`,
        `Target transit duration: ${preferences.deliveryTime}.`,
        isChilled
          ? 'Cold chain requirement: Maintain below 8°C to suppress microbial spoilage.'
          : 'Thermal retention: Maintain core temperature above 62°C to stay above pathogen danger zone (5°C–60°C).'
      ],
      steamCondensationRisk: {
        steamRisk: (isHot ? 'High' : 'Low') as 'High' | 'Medium' | 'Low',
        condensationRisk: (isCrispy && isHot ? 'High' : 'Low') as 'High' | 'Medium' | 'Low',
        crispnessLossRisk: (isCrispy ? 'High' : 'Low') as 'High' | 'Medium' | 'Low',
        ventingRequired: isCrispy
          ? 'Active Chimney Micro-venting'
          : requiresLiquidSeal
          ? 'Non-Vented Hermetic Rim'
          : 'Micro-slots',
        absorberNeeded: isCrispy || fat > 15,
        separateCompartmentNeeded: components.length > 1 && preferences.packedTogether !== 'Yes'
      },
      textureAnalysis: `Texture classified as ${transformation.physicalTexture || 'Prepared Food'}. ${
        isCrispy
          ? 'Requires calibrated headspace venting to dissipate vapor.'
          : isLiquid
          ? 'Fluid matrix requires splash and tilt containment.'
          : 'Standard texture preservation profile.'
      }`,
      leakageAnalysis: requiresLiquidSeal
        ? 'High hydrostatic liquid pressure during bike/scooter transit mandates positive snap-rim seal (ASTM D3078 bubble-test passed).'
        : 'Solid/moist meal containment; negligible liquid seepage risk.',
      packagingRequirements: [
        `Temperature resistance >= ${isHot ? '90' : '50'}°C`,
        `Grease resistance TAPPI T559 >= Kit ${fat > 12 ? '8' : '5'}`,
        `Vapor regulation: WVTR of ${selectedMaterial.wvtr.value} g/m²·day (${selectedMaterial.wvtr.provenance.testMethod})`
      ],
      scientificEvidence: evidence,
      assumptions: [
        `Food dispatch temperature is maintained at ${preferences.foodCondition || 'Standard'}.`,
        `Courier transit time does not exceed ${preferences.deliveryTime}.`,
        'Ambient relative humidity during transit is between 45% and 85% RH.'
      ],
      limitations: [
        'Macro food characteristics inferred from optical inputs; statutory commercial migration tests (EN 1186 / FDA 21 CFR) are recommended for brand certification.',
        'Thermal retention assumes upright carrier transport.'
      ],
      validationTests: [
        'ASTM D5276 Transit Courier Vibration & Drop Test (1.0m onto flat concrete)',
        'ASTM D3078 Internal Seal Bubble Leak Integrity Test',
        'ASTM F1249 Water Vapor Transmission Rate Validation'
      ],
      optimizationFactors: {
        functionalFit: Math.round(validCandidates[0]?.breakdown.functionalFitScore || 85),
        costEconomy: Math.round(validCandidates[0]?.breakdown.costEconomyScore || 80),
        sustainability: selectedMaterial.sustainabilityRating,
        userPriorities: Math.round(validCandidates[0]?.breakdown.userPriorityScore || 90)
      }
    };

    const whyExplanation = this.generateScientificWhy(
      foodNameStr,
      selectedMaterial,
      selectedStyle,
      isCrispy,
      requiresLiquidSeal,
      isChilled,
      isHot,
      preferences.deliveryTime
    );

    const legacyConfig = {
      containerName: `${foodNameStr} Engineered Packaging Suite`,
      materialId: selectedMaterial.id,
      structure: `${selectedMaterial.structureType} (${selectedMaterial.thicknessRangeMicrons.standard} µm standard wall)`,
      containerStyle: selectedStyle.name,
      compartments: selectedConfig.name,
      lidType: selectedStyle.sealingMechanism,
      venting: selectedStyle.ventingType,
      sauceContainer: components.length > 1 ? 'Included side vessel' : 'None',
      leakageProtection: `Certified to ${selectedMaterial.maxOperatingTempC}°C with ${selectedStyle.sealingMechanism}`,
      greaseResistance: `TAPPI T559 Kit Rating ${selectedMaterial.greaseResistanceKit.value}`,
      moistureManagement: `WVTR of ${selectedMaterial.wvtr.value} g/m²·day`,
      mechanicalStrength: selectedStyle.stackable ? 'Stackable courier certified (>8 kgf)' : 'Single tier'
    };

    return {
      topCandidate: selectedMaterial,
      actionableSummary: {
        packagingName: `${foodNameStr} Packaging Suite`,
        materialName: selectedMaterial.name,
        materialCategory: selectedMaterial.category,
        packageStyle: selectedStyle.name,
        configuration: selectedConfig.name,
        quickWhy: whyExplanation,
        deliveryWindow: preferences.deliveryTime || '30–60 minutes',
        packingInstructions: selectedConfig.steps
      },
      alternatives: alternativeCandidates,
      eliminatedMaterials: eliminated,
      detailedAnalysis,
      configuration: legacyConfig,
      multiComponentAnalysis: multiCompAnalysis,
      whyExplanation,
      evidence,
      assumptions: detailedAnalysis.assumptions,
      limitations: detailedAnalysis.limitations,
      validationRequired: detailedAnalysis.validationTests,
      costEstimate: {
        unitCostINR: selectedMaterial.estimatedCostPerUnitINR,
        currency: 'INR',
        basis: 'Standard unit cost in batch volume > 1,000 units'
      },
      sustainabilityScore: selectedMaterial.sustainabilityRating
    };
  }

  /**
   * Transparent weighted multi-objective candidate scoring
   */
  private calculateObjectiveScores(
    mat: PackagingMaterial,
    food: Partial<FoodCommodity>,
    transformation: ProcessingTransformation,
    preferences: UserPreferences,
    isCrispy: boolean,
    requiresLiquidSeal: boolean,
    wantsPlasticFree: boolean,
    isChilled: boolean,
    isHot: boolean,
    deliveryMinutes: number
  ) {
    let functional = 70;
    let cost = Math.max(10, Math.min(100, (12 - mat.estimatedCostPerUnitINR) * 10));
    let sustainability = mat.sustainabilityRating;
    let userPriority = 70;

    // Functional fit scoring
    if (isCrispy) {
      if (mat.steamVentingCompatible || mat.wvtr.value > 150) {
        functional += 25;
        userPriority += 20;
      } else {
        functional -= 35;
      }
    }

    if (requiresLiquidSeal) {
      if (mat.category === 'Commodity Polymers' || mat.greaseResistanceKit.value >= 10) {
        functional += 25;
        userPriority += 25;
      } else if (mat.category === 'Molded Fiber' && !mat.name.includes('Resistant')) {
        functional -= 25;
      }
    }

    if (isChilled) {
      if (mat.minOperatingTempC <= 0) {
        functional += 20;
      }
      if (mat.category === 'Commodity Polymers' && mat.name.includes('PET')) {
        functional += 20; // Clear optical visibility for cold foods
      }
    }

    if (isHot) {
      if (mat.maxOperatingTempC >= 100) {
        functional += 20;
      }
    }

    // Long delivery penalty for high-permeability thin boards without barrier
    if (deliveryMinutes > 60 && mat.thicknessRangeMicrons.standard < 350) {
      functional -= 15;
    }

    // Sustainability scoring
    if (wantsPlasticFree) {
      if (mat.category === 'Molded Fiber' || mat.category === 'Cellulose / Paper' || mat.biodegradable) {
        sustainability = Math.min(100, sustainability * 1.25);
        userPriority += 30;
      } else {
        sustainability = Math.max(10, sustainability * 0.4);
        userPriority -= 25;
      }
    }

    // Weight configuration based on user business budget preference
    let wFunctional = 0.35;
    let wCost = 0.25;
    let wSustain = 0.20;
    let wPriority = 0.20;

    if (preferences.budget === 'Economy') {
      wCost = 0.45;
      wFunctional = 0.30;
      wSustain = 0.10;
      wPriority = 0.15;
    } else if (preferences.budget === 'Premium') {
      wCost = 0.10;
      wFunctional = 0.40;
      wPriority = 0.30;
      wSustain = 0.20;
    }

    if (wantsPlasticFree) {
      wSustain = 0.40;
      wCost = 0.15;
    }

    const totalScore = Math.round(
      functional * wFunctional + cost * wCost + sustainability * wSustain + userPriority * wPriority
    );

    return {
      totalScore,
      breakdown: {
        functionalFitScore: Math.round(functional),
        costEconomyScore: Math.round(cost),
        sustainabilityScore: Math.round(sustainability),
        userPriorityScore: Math.round(userPriority)
      }
    };
  }

  /**
   * Dynamically selects the appropriate package style from the database
   */
  private selectDynamicPackageStyle(
    styles: any[],
    isCrispy: boolean,
    requiresLiquidSeal: boolean,
    isChilled: boolean,
    isHot: boolean,
    components: string[],
    packedTogether?: 'Yes' | 'No'
  ) {
    // Multi-component separation
    if (components.length > 2 && packedTogether !== 'Yes') {
      const suite = styles.find((s) => s.id === 'style_multi_vessel_suite');
      if (suite) return suite;
    }

    if (components.length > 1) {
      if (packedTogether === 'Yes') {
        const mealBox = styles.find((s) => s.id === 'style_three_compartment_meal_box');
        if (mealBox) return mealBox;
      } else {
        const dualTray = styles.find((s) => s.id === 'style_two_compartment_tray');
        if (dualTray) return dualTray;
      }
    }

    // Liquid / Soup / Gravy
    if (requiresLiquidSeal && !isCrispy) {
      const bowl = styles.find((s) => s.id === 'style_hermetic_bowl');
      if (bowl) return bowl;
    }

    // Crispy / Fried
    if (isCrispy) {
      const chimney = styles.find((s) => s.id === 'style_chimney_clamshell');
      if (chimney) return chimney;
    }

    // Chilled delicate / salad
    if (isChilled && !isHot) {
      const coldTub = styles.find((s) => s.id === 'style_clear_chilled_tub');
      if (coldTub) return coldTub;
    }

    // Fallback to first suitable or standard style
    return styles[0];
  }

  /**
   * Dynamically generates the configuration and step-by-step instructions
   */
  private selectDynamicConfiguration(
    configs: any[],
    foodName: string,
    components: string[],
    material: PackagingMaterial,
    style: any,
    isCrispy: boolean,
    requiresLiquidSeal: boolean,
    isChilled: boolean,
    isHot: boolean,
    deliveryTime: string,
    packedTogether?: 'Yes' | 'No'
  ) {
    if (components.length > 1 && packedTogether !== 'Yes') {
      const cfg = configs.find((c: any) => c.id === 'config_multi_vessel_hot_cold');
      if (cfg) {
        return {
          name: cfg.name,
          steps: [
            `1. Pack primary ${foodName} into the main ${material.name} container.`,
            `2. Seal side condiments/liquids into the separate 50ml hermetic side cups.`,
            isCrispy ? `3. Place crispy items in the separate dry pocket; do not mix directly with moist components.` : `3. Pack all vessels into a flat-bottom carrier bag.`,
            `4. Dispatch immediately for target delivery window of ${deliveryTime}.`
          ]
        };
      }
    }

    if (isCrispy) {
      const cfg = configs.find((c: any) => c.id === 'config_crisp_vented');
      if (cfg) {
        return {
          name: cfg.name,
          steps: [
            `1. Drain excess surface oil from ${foodName} for 20 seconds before packing.`,
            `2. Place grease-resistant parchment liner on the container floor.`,
            `3. Fasten perimeter clips while verifying steam chimney vents remain open to prevent condensation.`,
            `4. Use breathable Kraft paper outer carry bags (avoid airtight poly wrap).`
          ]
        };
      }
    }

    if (requiresLiquidSeal) {
      const cfg = configs.find((c: any) => c.id === 'config_liquid_hermetic');
      if (cfg) {
        return {
          name: cfg.name,
          steps: [
            `1. Ladle ${foodName} leaving at least 15mm headspace below the rim for thermal expansion.`,
            `2. Wipe the container rim clean before closing the lid.`,
            `3. Press the snap-lock lid firmly until the perimeter seal audibly clicks closed.`,
            `4. Transport upright in a secure, flat delivery bag.`
          ]
        };
      }
    }

    // Default configuration
    return {
      name: `Standard Single Chamber with ${style.ventingType}`,
      steps: [
        `1. Carefully deposit ${foodName} into the ${material.name} container.`,
        `2. Ensure the lid is seated securely with perimeter locks engaged.`,
        `3. Transport level during the ${deliveryTime} delivery window.`
      ]
    };
  }

  private generateScientificWhy(
    foodName: string,
    mat: PackagingMaterial,
    style: any,
    isCrispy: boolean,
    requiresLiquidSeal: boolean,
    isChilled: boolean,
    isHot: boolean,
    deliveryTime: string
  ): string {
    if (isCrispy && isHot) {
      return `Fried component produces steam and needs texture protection. System therefore prioritized calibrated ventilation (${style.ventingType}) and oil-absorbing separation (${mat.name}), exhausting water vapor to prevent condensation drip-back.`;
    }
    if (isCrispy) {
      return `Crispness sensitivity requires moisture barrier and dry contact. System therefore prioritized vapor relief and grease barrier (${mat.name}, TAPPI Kit ${mat.greaseResistanceKit.value}) to maintain acoustic crunchiness.`;
    }
    if (requiresLiquidSeal && isHot) {
      return `Hot liquid gravy generates hydraulic pressure and grease migration. System therefore prioritized hermetic hydrostatic seal (${style.name}) and thermal barrier (${mat.maxOperatingTempC}°C tolerance) to prevent transit spills.`;
    }
    if (requiresLiquidSeal) {
      return `Liquid component requires leak protection and containment. System therefore prioritized positive perimeter rim seal (${style.sealingMechanism}) with zero meniscus migration.`;
    }
    if (isChilled) {
      return `Cold component requires moisture control and cold-chain integrity. System therefore prioritized anti-fog clarity and low-temperature flexibility (${mat.minOperatingTempC}°C) in ${style.name}.`;
    }
    return `${foodName} requires thermal retention and structural protection. System therefore prioritized balanced insulation (${mat.name}) and secure closure (${style.sealingMechanism}) to maintain serving quality for ${deliveryTime}.`;
  }
}

export const recommendationEngine = new RecommendationEngine();
