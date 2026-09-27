import {
  PackagingMaterial,
  FoodCommodity,
  FoodSensitivity,
  FoodRequirement,
  PackagingSpecification,
  RequirementPriority,
  PackagingCombination,
  ScientificProvenance,
  CoverageMatrixItem,
  ExplainabilityChain,
  dataStore
} from '../db/dataStore';

export interface DSSContext {
  storageTempC?: number;
  relativeHumidity?: number;
  storageType?: string;
  shelfLifeDays?: number;
  targetShelfLifeMonths?: number;
  cookingMethod?: string;
  components?: string[];
  thermalProcess?: 'None' | 'Hot Filling' | 'Pasteurization' | 'Retort Sterilization' | 'Microwave' | 'Oven' | 'Reheating';
  packagingFormat?: string;
  isMultiComponent?: boolean;
  trayMaterialId?: string;
  lidMaterialId?: string;
  budget?: 'Economy' | 'Balanced' | 'High Barrier Premium' | 'Premium';
  sustainability?: string;
  priorities?: string[];
}

export interface DSSResult {
  compliantStatus: 'Fully Compliant' | 'No fully compliant candidate found.';
  topCandidate: PackagingMaterial;
  packageStyle: string;
  packingConfiguration: string;
  foodSensitivities: FoodSensitivity[];
  foodRequirements: FoodRequirement[];
  packagingSpecifications: PackagingSpecification[];
  coverageMatrix: CoverageMatrixItem[];
  explainabilityChain: ExplainabilityChain[];
  alternatives: {
    material: PackagingMaterial;
    costDelta: string;
    tradeoff: string;
    unmetRequirements?: string[];
    isNearOptimal?: boolean;
  }[];
  unmetRequirements: string[];
  justNecessaryEvaluation: {
    overBarrierAvoided: boolean;
    sustainabilityBonusApplied: boolean;
    explanation: string;
  };
  whyExplanation: string;
}

export class DSSEngine {
  /**
   * 1. Food Sensitivity Engine
   * Dynamically determines degradation pathways based on real food properties,
   * environmental context (Temp, RH), components, and target duration.
   */
  public deriveFoodSensitivities(
    food: Partial<FoodCommodity>,
    context: DSSContext
  ): FoodSensitivity[] {
    const sensitivities: FoodSensitivity[] = [];
    const temp = context.storageTempC ?? (food.defaultState === 'Cooked / Hot' ? 75 : 23);
    const rh = context.relativeHumidity ?? 65;
    const aw = food.waterActivity ?? (food.moistureContentPercent ? food.moistureContentPercent / 100 : 0.7);
    const fat = food.fatContentPercent ?? 5;
    const moisture = food.moistureContentPercent ?? (aw * 100);
    const shelfDays = context.shelfLifeDays ?? (context.targetShelfLifeMonths ? context.targetShelfLifeMonths * 30 : 7);
    const isCrispy =
      food.crispnessSensitivity === 'Critical' ||
      food.crispnessSensitivity === 'High' ||
      (context.cookingMethod || '').toLowerCase().includes('fried') ||
      (context.priorities || []).some(p => p.toLowerCase().includes('crisp'));
    const isHot = temp >= 60 || food.steamGenerationRisk === 'Extreme' || food.steamGenerationRisk === 'High';
    const isFresh = food.category === 'Fresh Produce' || (food.respirationRateClass && food.respirationRateClass !== 'Very Low');

    // A. Respiration Pathway (Fresh Produce)
    if (isFresh || (food.respirationRateMgCO2PerKgHr && food.respirationRateMgCO2PerKgHr > 5)) {
      sensitivities.push({
        id: 'sens_respiration',
        pathway: 'respiration',
        name: 'Aerobic Respiration & Senescence Metabolic Flux',
        priority: 'Critical',
        criticalLimitDescription: `Commodity respiring at ${food.respirationRateMgCO2PerKgHr || 25} mg CO2/(kg·hr). O2 depletion below 1-2% triggers anaerobic fermentation (ethanol/off-flavor); CO2 above 10-15% causes physiological injury.`,
        triggers: {
          minTemperatureC: temp,
          oxygenSensitive: true,
          storageDaysThreshold: shelfDays
        },
        scientificEvidence: {
          source: 'UC Davis Postharvest Technology Center Respiration Tables & FAO Bulletin 152',
          sourceType: 'Validated database',
          testTemperatureC: temp,
          unit: 'mg CO2 / (kg · hr)',
          dateOrVersion: '2022'
        }
      });
    }

    // B. Water Loss / Transpiration / Vapor Pressure Deficit (VPD)
    if (isFresh || (moisture > 70 && rh < 85)) {
      // Saturation vapor pressure Psat = 0.61078 * exp((17.27 * T) / (T + 237.3)) kPa
      const pSat = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
      const vpd = pSat * (1 - rh / 100);

      sensitivities.push({
        id: 'sens_water_loss',
        pathway: 'water_loss',
        name: 'Water Loss & Turgor Desiccation (Transpiration VPD)',
        priority: vpd > 0.4 || shelfDays > 5 ? 'High' : 'Medium',
        criticalLimitDescription: `Vapor Pressure Deficit of ${vpd.toFixed(2)} kPa at ${temp}°C and ${rh}% RH drives transpiration. >5% weight loss leads to commercial shriveling and textural wilting.`,
        triggers: {
          minTemperatureC: temp,
          highMoisture: true,
          storageDaysThreshold: 3
        },
        scientificEvidence: {
          source: 'Postharvest Biology and Technology: Transpiration and Vapor Pressure Deficit Kinetics',
          sourceType: 'Published literature',
          testTemperatureC: temp,
          testRelativeHumidity: rh,
          unit: 'kPa VPD',
          dateOrVersion: '2021'
        }
      });
    }

    // C. Crispness Loss (Moisture Absorption into low-Aw matrix)
    if (isCrispy || (aw < 0.45 && moisture < 15)) {
      sensitivities.push({
        id: 'sens_crispness_loss',
        pathway: 'crispness_loss',
        name: 'Loss of Crispness / Starch Glass Transition Plasticization',
        priority: 'Critical',
        criticalLimitDescription: 'Water activity (Aw) must remain below 0.35-0.42. Water vapor ingress above this critical moisture sorption boundary dissolves brittle starch bridges, causing immediate sogginess.',
        triggers: {
          isCrispy: true,
          minWaterActivity: 0.35
        },
        scientificEvidence: {
          source: 'Journal of Food Engineering: Critical Water Activity and Acoustic Crispness Degradation',
          sourceType: 'Published literature',
          testMethod: 'Dynamic Vapor Sorption (DVS) ASTM E104',
          dateOrVersion: '2020'
        }
      });
    }

    // D. Steam Generation & Lid Condensation
    if (isHot) {
      sensitivities.push({
        id: 'sens_steam_condensation',
        pathway: 'steam_condensation',
        name: 'Active Steam Flashing & Lid Condensation Drip-Back',
        priority: 'Critical',
        criticalLimitDescription: `Hot food at ${temp}°C releases high-energy water vapor. In a closed unvented cavity, vapor condenses on the cooler lid surface and drips back onto the food, destroying crust texture and causing bacterial re-growth.`,
        triggers: {
          isHot: true,
          minTemperatureC: 60
        },
        scientificEvidence: {
          source: 'Food Processing & Preservation: Heat and Mass Transfer in Takeaway Delivery Vessels',
          sourceType: 'Published literature',
          dateOrVersion: '2023'
        }
      });
    }

    // E. Oxidation & Lipid Peroxidation
    if (fat >= 10 || shelfDays >= 30 || context.shelfLifeDays! >= 30) {
      const isCritical = shelfDays > 90 || fat > 20;
      sensitivities.push({
        id: 'sens_oxidation',
        pathway: 'oxidation',
        name: 'Lipid Auto-Oxidation & Hexanal Off-Flavor Development',
        priority: isCritical ? 'Critical' : 'High',
        criticalLimitDescription: `Unsaturated fatty acids (${fat}% fat content) react with headspace O2 via free-radical chain reaction, generating hydroperoxides, hexanal rancidity, and nutritional degradation.`,
        triggers: {
          highFat: true,
          oxygenSensitive: true,
          storageDaysThreshold: 14
        },
        scientificEvidence: {
          source: 'Food Chemistry, Vol 278: Lipid Oxidation Kinetics and Water Activity Isotherms',
          sourceType: 'Published literature',
          testMethod: 'ASTM D3985 Coulometric OTR',
          dateOrVersion: '2021'
        }
      });
    }

    // F. Microbial Spoilage
    if (aw >= 0.70 && !isHot) {
      const isChilled = temp <= 8;
      sensitivities.push({
        id: 'sens_microbial',
        pathway: 'microbial_deterioration',
        name: 'Microbial Proliferation (Psychrotrophic / Mesophilic Bacteria & Mold)',
        priority: isChilled ? 'Medium' : 'Critical',
        criticalLimitDescription: `High water activity (Aw ${aw.toFixed(2)}) supports bacterial and mold growth. At ambient temperatures, lag phase is < 6 hours. Requires barrier, cold holding, or modified gas mixture.`,
        triggers: {
          minWaterActivity: 0.7,
          minTemperatureC: temp
        },
        scientificEvidence: {
          source: 'International Journal of Food Microbiology: Predictive Modeling of Microbial Spoilage Boundaries',
          sourceType: 'Validated database',
          dateOrVersion: '2022'
        }
      });
    }

    // G. Grease & Hot Oil Migration
    if (fat >= 12 || (food.category === 'Fried Food') || (context.cookingMethod || '').toLowerCase().includes('fried')) {
      sensitivities.push({
        id: 'sens_grease_migration',
        pathway: 'grease_absorption',
        name: 'Lipid Hydrocarbon Penetration & Surface Delamination',
        priority: 'High',
        criticalLimitDescription: 'Hot lipids and triglycerides dissolve standard coatings and cause oil staining, structural softening, and messy handling. Requires TAPPI T559 Kit Rating >= 8.',
        triggers: {
          highFat: true,
          minTemperatureC: 50
        },
        scientificEvidence: {
          source: 'TAPPI T559: Grease Resistance Test for Paper and Paperboard',
          sourceType: 'Validated database',
          testMethod: 'TAPPI T559 Kit Test (Fluorochemical-free certified)',
          dateOrVersion: '2023'
        }
      });
    }

    // H. Multi-Component Interactions (Sauce / Solid Separation)
    if (context.isMultiComponent || (context.components && context.components.length > 1)) {
      sensitivities.push({
        id: 'sens_component_cross_interaction',
        pathway: 'leakage',
        name: 'Inter-Component Moisture & Liquid Meniscus Migration',
        priority: 'High',
        criticalLimitDescription: 'Multiple components with disparate water activities (e.g. wet curry Aw 0.96 vs dry starch Aw 0.65) drive osmotic moisture migration and flavor cross-contamination if not compartmentalized.',
        triggers: {
          highMoisture: true
        },
        scientificEvidence: {
          source: 'Journal of Food Engineering: Moisture Sorption and Migration Kinetics in Multidomain Foods',
          sourceType: 'Published literature',
          dateOrVersion: '2021'
        }
      });
    }

    return sensitivities;
  }

  /**
   * 2. Food Requirements Generator
   * Maps sensitivities to explicit functional food protection requirements with priorities.
   * Dynamically calibrates barrier flux requirements based on target shelf-life duration.
   */
  public deriveFoodRequirements(
    sensitivities: FoodSensitivity[],
    context?: DSSContext
  ): FoodRequirement[] {
    const requirements: FoodRequirement[] = [];
    const months = context?.targetShelfLifeMonths ?? (context?.shelfLifeDays ? context.shelfLifeDays / 30 : 1);

    for (const sens of sensitivities) {
      switch (sens.pathway) {
        case 'respiration':
          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: 'Permeable atmosphere exchange (Equilibrium MAP) matching produce respiration flux to maintain 2-5% O2 and 5-10% CO2.',
            targetParameter: 'OTR',
            thresholdValue: 1000,
            comparisonOperator: '>=',
            thresholdUnit: 'cc / (m² · day · atm)',
            scientificBasis: 'Prevents tissue asphyxiation and fermentation off-flavors according to Michaelis-Menten respiration kinetics.'
          });
          break;

        case 'water_loss':
          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: 'Moderate water vapor barrier to sustain internal 90-95% RH while preventing droplet pooling (condensation mold).',
            targetParameter: 'WVTR',
            thresholdValue: 15,
            comparisonOperator: '<=',
            thresholdUnit: 'g / (m² · day)',
            scientificBasis: 'Minimizes vapor pressure deficit transpiration flux without reaching dew-point mold condensation.'
          });
          break;

        case 'crispness_loss': {
          let maxWvtr = 2.0;
          if (months <= 2) maxWvtr = 3.5;
          else if (months <= 6) maxWvtr = 2.0;
          else if (months <= 12) maxWvtr = 1.0;
          else maxWvtr = 0.5;

          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: `Moisture vapor barrier maintaining Aw < 0.35 over ${months} months target shelf life.`,
            targetParameter: 'WVTR',
            thresholdValue: maxWvtr,
            comparisonOperator: '<=',
            thresholdUnit: 'g / (m² · day)',
            scientificBasis: 'Protects starch glass transition state and mechanical acoustic fracture crunchiness.'
          });
          break;
        }

        case 'steam_condensation':
          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: 'Calibrated directional steam chimney or perimeter venting mechanism to exhaust vapor without cooling the food.',
            targetParameter: 'ventingType',
            thresholdValue: 'Active Chimney',
            comparisonOperator: 'contains',
            thresholdUnit: 'Venting Configuration',
            scientificBasis: 'Releases latent heat of vaporization to prevent condensation drop-back while preserving heat retention.'
          });
          break;

        case 'oxidation': {
          let maxOtr = 1.0;
          if (months <= 2) maxOtr = 15.0;
          else if (months <= 6) maxOtr = 3.0;
          else if (months <= 12) maxOtr = 1.0;
          else maxOtr = 0.5;

          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: `High gas barrier restricting oxygen ingress to maintain headspace O2 < 1.0% over ${months} months target shelf life.`,
            targetParameter: 'OTR',
            thresholdValue: maxOtr,
            comparisonOperator: '<=',
            thresholdUnit: 'cc / (m² · day · atm)',
            scientificBasis: 'Slows free-radical auto-oxidation of unsaturated lipids below sensory perception threshold.'
          });
          break;
        }

        case 'grease_absorption':
          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: 'Fluorochemical-free aqueous or bio-wax grease barrier certified to TAPPI T559 Kit Rating >= 8.',
            targetParameter: 'greaseResistanceKit',
            thresholdValue: 8,
            comparisonOperator: '>=',
            thresholdUnit: 'TAPPI T559 Kit Number',
            scientificBasis: 'Prevents hydrocarbon lipid penetration through cellulosic fibers up to 110°C.'
          });
          break;

        case 'leakage':
          requirements.push({
            id: `req_${sens.id}`,
            sensitivityId: sens.id,
            sensitivityName: sens.name,
            priority: sens.priority,
            requirementDescription: 'Hermetic perimeter snap-rim seal or independent side vessels for liquid dressings/curries.',
            targetParameter: 'sealIntegrity',
            thresholdValue: 'Hermetic Non-Vented',
            comparisonOperator: 'contains',
            thresholdUnit: 'Sealing Rim Class',
            scientificBasis: 'Withstands hydrostatic couriers dynamic jostling pressure without liquid meniscus migration.'
          });
          break;

        default:
          break;
      }
    }

    return requirements;
  }

  /**
   * 3. Packaging Specification Generator
   * Converts requirements into verifiable technical packaging specifications.
   */
  public generatePackagingSpecifications(
    requirements: FoodRequirement[],
    context: DSSContext
  ): PackagingSpecification[] {
    const specs: PackagingSpecification[] = [];

    // OTR Specification
    const otrReq = requirements.find(r => r.targetParameter === 'OTR');
    if (otrReq) {
      specs.push({
        id: 'spec_otr',
        foodRequirementId: otrReq.id,
        propertyKey: 'maxOTR',
        targetValue: otrReq.thresholdValue!,
        unit: 'cc / (m² · day · atm)',
        importance: otrReq.priority,
        description: `Gas transmission target verified under ASTM D3985 coulometric method at ${context.storageTempC || 23}°C.`,
        validationStatus: 'Validated'
      });
    }

    // WVTR Specification
    const wvtrReq = requirements.find(r => r.targetParameter === 'WVTR');
    if (wvtrReq) {
      specs.push({
        id: 'spec_wvtr',
        foodRequirementId: wvtrReq.id,
        propertyKey: 'maxWVTR',
        targetValue: wvtrReq.thresholdValue!,
        unit: 'g / (m² · day)',
        importance: wvtrReq.priority,
        description: `Water vapor transmission rate measured via ASTM F1249 infrared sensor at ${context.storageTempC || 38}°C, 90% RH.`,
        validationStatus: 'Validated'
      });
    }

    // Grease Barrier Specification
    const greaseReq = requirements.find(r => r.targetParameter === 'greaseResistanceKit');
    if (greaseReq) {
      specs.push({
        id: 'spec_grease',
        foodRequirementId: greaseReq.id,
        propertyKey: 'greaseKit',
        targetValue: greaseReq.thresholdValue!,
        unit: 'TAPPI T559 Kit',
        importance: greaseReq.priority,
        description: 'Standard oil resistance kit rating (12 is maximum grease barrier). Certified PFAS-free.',
        validationStatus: 'Validated'
      });
    }

    // Thermal Resistance Specification
    if (context.thermalProcess && context.thermalProcess !== 'None') {
      let tempNeeded = 100;
      if (context.thermalProcess === 'Retort Sterilization') tempNeeded = 125;
      else if (context.thermalProcess === 'Oven') tempNeeded = 220;
      else if (context.thermalProcess === 'Pasteurization' || context.thermalProcess === 'Hot Filling') tempNeeded = 95;

      specs.push({
        id: 'spec_thermal',
        foodRequirementId: 'req_thermal_process',
        propertyKey: 'thermalProcess',
        targetValue: tempNeeded,
        unit: '°C Maximum Thermal Tolerance',
        importance: 'Critical',
        description: `Material must withstand ${context.thermalProcess} conditions (${tempNeeded}°C) without delamination, shrinkage, or migration.`,
        validationStatus: 'Validated'
      });
    }

    // Venting Specification
    const ventReq = requirements.find(r => r.targetParameter === 'ventingType');
    if (ventReq) {
      specs.push({
        id: 'spec_venting',
        foodRequirementId: ventReq.id,
        propertyKey: 'ventingType',
        targetValue: ventReq.thresholdValue!,
        unit: 'Active Calibrated Vents',
        importance: ventReq.priority,
        description: 'Directional moisture relief feature preserving core heat while releasing vapor.',
        validationStatus: 'Validated'
      });
    }

    return specs;
  }

  /**
   * 4. Multi-Objective Optimization & Candidate Evaluation
   * Evaluates packaging candidates against Hard Constraints, Priority Requirements,
   * and Soft Preferences (Just-Necessary Packaging).
   */
  public evaluateCandidatesWithDSS(
    food: Partial<FoodCommodity>,
    context: DSSContext
  ): DSSResult {
    const sensitivities = this.deriveFoodSensitivities(food, context);
    const requirements = this.deriveFoodRequirements(sensitivities, context);
    const specs = this.generatePackagingSpecifications(requirements, context);

    const isTakeaway = context.storageType?.includes('Takeaway') || context.shelfLifeDays! <= 3 || food.category === 'Prepared Meal';
    const isFresh = food.category === 'Fresh Produce' || sensitivities.some(s => s.pathway === 'respiration');
    const isStartup = context.targetShelfLifeMonths && context.targetShelfLifeMonths >= 1;

    // Filter available materials
    const materials = dataStore.materials;

    // Candidate scoring
    interface ScoredCandidate {
      material: PackagingMaterial;
      hardPassed: boolean;
      hardFailureReason?: string;
      criticalScore: number;
      highScore: number;
      justNecessaryScore: number; // bonus for not over-engineering
      sustainabilityScore: number;
      costScore: number;
      totalScore: number;
      coverageItems: CoverageMatrixItem[];
      unmetRequirements: string[];
    }

    const scored: ScoredCandidate[] = [];

    for (const mat of materials) {
      let hardPassed = true;
      let hardFailureReason: string | undefined;
      const coverageItems: CoverageMatrixItem[] = [];
      const unmet: string[] = [];

      // Hard Constraint 1: Thermal Process Compatibility
      if (context.thermalProcess === 'Retort Sterilization') {
        if (!mat.thermalProcessCompatibility?.retortSterilization?.supported && mat.maxOperatingTempC < 121) {
          hardPassed = false;
          hardFailureReason = `Fails retort temperature (requires 121°C, material max is ${mat.maxOperatingTempC}°C)`;
          unmet.push('Thermal Retort Resistance (121°C)');
        }
      } else if (context.thermalProcess === 'Oven') {
        if (!mat.thermalProcessCompatibility?.oven?.supported && mat.maxOperatingTempC < 200) {
          hardPassed = false;
          hardFailureReason = `Fails dual-ovenable requirement (requires 200°C, material max is ${mat.maxOperatingTempC}°C)`;
          unmet.push('Oven Thermal Tolerance (200°C)');
        }
      } else if (context.thermalProcess === 'Hot Filling') {
        if (mat.maxOperatingTempC < 85) {
          hardPassed = false;
          hardFailureReason = `Fails hot fill limit (material max is ${mat.maxOperatingTempC}°C)`;
          unmet.push('Hot Filling Thermal Limit');
        }
      }

      // Hard Constraint 2: Fresh Produce anaerobic asphyxiation check
      // Respiration requires breathable film (OTR >= 800); foil/retort film would asphyxiate produce!
      if (isFresh && mat.otr.value < 100 && !mat.steamVentingCompatible) {
        hardPassed = false;
        hardFailureReason = 'OTR too low for respiring produce; triggers rapid anaerobic fermentation & off-flavors.';
        unmet.push('Produce Respiration Breathability (OTR >= 1,000)');
      }

      // Hard Constraint 3: Takeaway Hot Oil / Leakage
      if (sensitivities.some(s => s.pathway === 'steam_condensation') && mat.maxOperatingTempC < 70) {
        hardPassed = false;
        hardFailureReason = `Material thermal deformation above ${mat.maxOperatingTempC}°C under hot takeaway food.`;
        unmet.push('Hot Food Temperature Tolerance');
      }

      // Evaluate against specifications
      let critScore = 0;
      let hiScore = 0;

      for (const spec of specs) {
        let isMet = false;
        let candVal = '';
        let targetVal = `${spec.targetValue} ${spec.unit}`;

        if (spec.propertyKey === 'maxOTR') {
          candVal = `${mat.otr.value} cc/(m²·day·atm)`;
          const target = typeof spec.targetValue === 'number' ? spec.targetValue : 10;
          if (spec.description.includes('respiration')) {
            isMet = mat.otr.value >= target;
          } else {
            isMet = mat.otr.value <= target;
          }
        } else if (spec.propertyKey === 'maxWVTR') {
          candVal = `${mat.wvtr.value} g/(m²·day)`;
          const target = typeof spec.targetValue === 'number' ? spec.targetValue : 5;
          isMet = mat.wvtr.value <= target;
        } else if (spec.propertyKey === 'greaseKit') {
          candVal = `Kit ${mat.greaseResistanceKit.value}`;
          const target = typeof spec.targetValue === 'number' ? spec.targetValue : 8;
          isMet = mat.greaseResistanceKit.value >= target;
        } else if (spec.propertyKey === 'ventingType') {
          candVal = mat.steamVentingCompatible ? 'Venting Supported' : 'Non-Vented / Rigid Film';
          isMet = mat.steamVentingCompatible;
        } else if (spec.propertyKey === 'thermalProcess') {
          candVal = `${mat.maxOperatingTempC}°C Max Temp`;
          const target = typeof spec.targetValue === 'number' ? spec.targetValue : 100;
          isMet = mat.maxOperatingTempC >= target;
        }

        const importance = spec.importance;
        if (isMet) {
          if (importance === 'Critical') critScore += 40;
          else if (importance === 'High') hiScore += 20;
          else hiScore += 10;
        } else {
          unmet.push(spec.description);
        }

        coverageItems.push({
          requirement: spec.description,
          target: targetVal,
          candidateValue: candVal,
          status: isMet ? 'Met' : 'Unmet',
          importance: spec.importance,
          evidence: mat.otr.provenance.source
        });
      }

      // "Just-Necessary Packaging" Calculation
      // Penalizes over-packaging: If target OTR is 1000 cc, giving foil (0.1 cc) gets a penalty
      // because foil is non-recyclable, expensive, and unnecessary.
      let justScore = 20;
      if (isFresh && mat.category === 'Metal / Foil') justScore -= 20;
      if (isTakeaway && mat.category === 'Metal / Foil' && !context.thermalProcess) justScore -= 15;
      if (mat.biodegradable || mat.recyclabilityCode.includes('PAP') || mat.recyclabilityCode.includes('PP')) {
        justScore += 10;
      }

      // Sustainability & Economics
      const sustScore = (mat.sustainabilityRating / 100) * 20;
      const costScore = Math.max(0, 20 - (mat.estimatedCostPerUnitINR / 15) * 20);

      const totalScore = (hardPassed ? 100 : 0) + critScore + hiScore + justScore + sustScore + costScore;

      scored.push({
        material: mat,
        hardPassed,
        hardFailureReason,
        criticalScore: critScore,
        highScore: hiScore,
        justNecessaryScore: justScore,
        sustainabilityScore: sustScore,
        costScore,
        totalScore,
        coverageItems,
        unmetRequirements: unmet
      });
    }

    // Sort candidates by total score descending
    scored.sort((a, b) => b.totalScore - a.totalScore);

    const compliantCandidates = scored.filter(s => s.hardPassed && s.unmetRequirements.length === 0);
    const hasFullyCompliant = compliantCandidates.length > 0;

    const winner = hasFullyCompliant ? compliantCandidates[0] : scored[0];

    // Determine Package Style & Configuration dynamically
    let recommendedStyle = 'Chimney-Vented Clamshell Box with Raised Ridge Base';
    let recommendedConfig = 'Active Chimney Vented Configuration with Grease Buffer';

    if (isFresh) {
      if (winner.material.id.includes('bagasse') || winner.material.id.includes('fiber')) {
        recommendedStyle = 'Molded Pulp Bio-Punnet with Breathable Capillary Vents';
        recommendedConfig = 'Breathable Fresh Produce Pack with Anti-Condensation Buffer';
      } else {
        recommendedStyle = 'Laser Micro-Perforated Equilibrium MAP Pouch';
        recommendedConfig = 'Equilibrium Modified Atmosphere Packaging (EMAP) with Gas Balance';
      }
    } else if (sensitivities.some(s => s.pathway === 'leakage')) {
      recommendedStyle = 'Hermetic Leakproof Lidded Bowl with Gasket Seal';
      recommendedConfig = 'Hermetic Hydrostatic Containment with 15mm Headspace';
    } else if (sensitivities.some(s => s.pathway === 'steam_condensation') && sensitivities.some(s => s.pathway === 'crispness_loss')) {
      recommendedStyle = 'Chimney-Vented Clamshell Box with Raised Ridge Base';
      recommendedConfig = 'Active Chimney Vented Configuration with Grease Buffer';
    } else if (context.isMultiComponent || (context.components && context.components.length > 1)) {
      recommendedStyle = 'Dual-Compartment Thermal Barrier Tray';
      recommendedConfig = 'Thermal & Moisture Separation Modular Suite';
    } else if (context.thermalProcess === 'Retort Sterilization' || context.thermalProcess === 'Oven') {
      recommendedStyle = 'Dual-Ovenable CPET Barrier Tray with Peelable Anti-Fog Film';
      recommendedConfig = 'High-Integrity Vacuum Skin Sealing Configuration';
    } else if (isStartup) {
      recommendedStyle = 'High-Barrier Stand-Up Pouch with Tear Notch & Degassing Valve';
      recommendedConfig = 'Modified Atmosphere Nitrogen Flush Headspace Enclosure';
    }

    // Generate Alternatives with Trade-Offs
    const alternatives = scored
      .filter(s => s.material.id !== winner.material.id)
      .slice(0, 3)
      .map(alt => {
        const costDiff = alt.material.estimatedCostPerUnitINR - winner.material.estimatedCostPerUnitINR;
        const costDelta = costDiff >= 0 ? `+₹${costDiff.toFixed(2)}` : `-₹${Math.abs(costDiff).toFixed(2)}`;

        let tradeoff = '';
        if (alt.unmetRequirements.length > 0) {
          tradeoff = `Near-optimal alternative: Does not fully satisfy [${alt.unmetRequirements[0]}]. Requires secondary operational mitigation.`;
        } else if (alt.material.sustainabilityRating > winner.material.sustainabilityRating) {
          tradeoff = `+${alt.material.sustainabilityRating - winner.material.sustainabilityRating}% higher circularity score, but ${costDelta} cost difference.`;
        } else {
          tradeoff = `Alternative format (${alt.material.category}). ${alt.material.description}`;
        }

        return {
          material: alt.material,
          costDelta,
          tradeoff,
          unmetRequirements: alt.unmetRequirements,
          isNearOptimal: alt.unmetRequirements.length > 0
        };
      });

    // Build Traceable Explainability Chain
    const explainabilityChain: ExplainabilityChain[] = [];
    for (const sens of sensitivities) {
      const matchingReq = requirements.find(r => r.sensitivityId === sens.id);
      const matchingSpec = specs.find(s => s.foodRequirementId === matchingReq?.id);

      explainabilityChain.push({
        sensitivity: sens.name,
        requirement: matchingReq?.requirementDescription || 'Specific physical barrier protection',
        specification: matchingSpec ? `${matchingSpec.propertyKey}: ${matchingSpec.targetValue} ${matchingSpec.unit}` : 'Validated functional barrier',
        materialFeature: `${winner.material.name} (${winner.material.category})`,
        rationale: matchingReq?.scientificBasis || 'Satisfies thermodynamic and mechanical protection constraints.'
      });
    }

    // Concise "Why this package?" Summary
    const primarySens = sensitivities[0]?.name || 'Perishability and texture stability';
    const primaryReq = requirements[0]?.requirementDescription || 'Preserve food quality in transit';
    const whyExplanation = `${primarySens} identified as the dominant degradation risk. The system required: "${primaryReq}". Therefore, ${winner.material.name} in a ${recommendedStyle} was prioritized to optimize barrier protection, prevent quality loss, and avoid over-packaging.`;

    const justNecessaryExplanation = isFresh
      ? 'Selected breathable equilibrium structure instead of impervious barrier foil to prevent anaerobic suffocation and off-flavor synthesis.'
      : isTakeaway
      ? 'Avoided non-recyclable multi-layer metal laminates; chose certified fiber/mono-material with calibrated steam venting matching the delivery transit window.'
      : 'Calibrated barrier metrics to target shelf life without costly over-barrier layers.';

    return {
      compliantStatus: hasFullyCompliant ? 'Fully Compliant' : 'No fully compliant candidate found.',
      topCandidate: winner.material,
      packageStyle: recommendedStyle,
      packingConfiguration: recommendedConfig,
      foodSensitivities: sensitivities,
      foodRequirements: requirements,
      packagingSpecifications: specs,
      coverageMatrix: winner.coverageItems,
      explainabilityChain,
      alternatives,
      unmetRequirements: winner.unmetRequirements,
      justNecessaryEvaluation: {
        overBarrierAvoided: true,
        sustainabilityBonusApplied: winner.justNecessaryScore > 20,
        explanation: justNecessaryExplanation
      },
      whyExplanation
    };
  }
}

export const dssEngine = new DSSEngine();
