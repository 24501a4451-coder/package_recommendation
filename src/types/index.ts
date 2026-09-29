export type UserRole = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  organization?: string;
  createdAt: string;
}

export type ValidationStatus = 'Validated' | 'Pending validation' | 'Extracted' | 'Approved' | 'Estimated';
export type RequirementPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ScientificProvenance {
  source: string;
  sourceType: 'Published literature' | 'Validated database' | 'Laboratory measured' | 'User provided' | 'Rule derived' | 'Model inferred' | 'Estimated';
  testMethod?: string;
  testTemperatureC?: number;
  testRelativeHumidity?: number;
  thicknessMicrons?: number;
  unit?: string;
  dateOrVersion: string;
  validationStatus?: ValidationStatus;
  notes?: string;
}

export type ScientificEvidence = ScientificProvenance;

export interface MaterialTemperatureProperty {
  temperatureC: number;
  otr?: { value: number; unit: string; testMethod?: string; evidence: ScientificEvidence };
  wvtr?: { value: number; unit: string; testMethod?: string; evidence: ScientificEvidence };
  tensileModulusMPa?: { value: number; unit: string; evidence: ScientificEvidence };
}

export interface MaterialRHProperty {
  relativeHumidityPercent: number;
  temperatureC: number;
  wvtr?: { value: number; unit: string; testMethod?: string; evidence: ScientificEvidence };
}

export interface ThermalProcessCompatibility {
  hotFilling: { supported: boolean; maxTempC?: number; evidence?: ScientificEvidence };
  pasteurization: { supported: boolean; conditions?: string; evidence?: ScientificEvidence };
  retortSterilization: { supported: boolean; conditions?: string; evidence?: ScientificEvidence };
  microwave: { supported: boolean; notes?: string; evidence?: ScientificEvidence };
  oven: { supported: boolean; maxTempC?: number; evidence?: ScientificEvidence };
  reheating: { supported: boolean; maxTempC?: number; evidence?: ScientificEvidence };
}

export interface PackagingMaterialProperty {
  propertyKey: string;
  propertyName: string;
  value: number | string | boolean;
  unit?: string;
  temperatureC?: number;
  relativeHumidityPercent?: number;
  thicknessMicrons?: number;
  testMethod?: string;
  source: string;
  sourceDateOrVersion: string;
  validationStatus: ValidationStatus;
}

export interface PackagingMaterial {
  id: string;
  name: string;
  code: string;
  category: 'Cellulose / Paper' | 'Molded Fiber' | 'Bioplastics' | 'Commodity Polymers' | 'Engineered Barrier' | 'Metal / Foil';
  description: string;
  structureType: 'Monolayer' | 'Co-extruded' | 'Lamination' | 'Aqueous Coated Board' | 'Thermoformed';
  thicknessRangeMicrons: { min: number; max: number; standard: number };
  
  // Barrier Properties (with provenance)
  otr: {
    value: number; // cc / (m² · day · atm)
    provenance: ScientificProvenance;
  };
  wvtr: {
    value: number; // g / (m² · day)
    provenance: ScientificProvenance;
  };
  greaseResistanceKit: {
    value: number; // 1 to 12 (TAPPI T559)
    provenance: ScientificProvenance;
  };

  // Temperature and RH specific properties
  temperatureProperties?: MaterialTemperatureProperty[];
  rhProperties?: MaterialRHProperty[];
  thermalProcessCompatibility?: ThermalProcessCompatibility;
  sealingProperties?: {
    sealInitiationTempC: number;
    maxSealTempC: number;
    typicalSealStrengthNPer15mm: number;
    compatibleSealantTypes: string[];
    evidence?: ScientificEvidence;
  };

  // Thermal & Mechanical limits
  maxOperatingTempC: number;
  minOperatingTempC: number;
  microwaveSafe: boolean;
  freezerSafe: boolean;
  hotOilResistant: boolean;
  steamVentingCompatible: boolean;

  // Sustainability & Economics
  sustainabilityRating: number; // 1-100
  biodegradable: boolean;
  compostableStandard?: string;
  recyclabilityCode: string;
  carbonFootprintKgCO2ePerKg: number;
  estimatedCostPerUnitINR: number;

  // Suitable Applications
  suitableForTakeaway: boolean;
  suitableForFreshProduce: boolean;
  suitableForLongShelfLife: boolean;
  typicalApplications: string[];
  validationStatus?: ValidationStatus;
}

export interface FoodSensitivity {
  id: string;
  pathway:
    | 'water_loss'
    | 'oxidation'
    | 'microbial_deterioration'
    | 'respiration'
    | 'color_change'
    | 'texture_degradation'
    | 'nutrient_loss'
    | 'steam_condensation'
    | 'grease_absorption'
    | 'crispness_loss'
    | 'flavor_scalping'
    | 'leakage'
    | 'anaerobic_fermentation';
  name: string;
  priority: RequirementPriority;
  criticalLimitDescription: string;
  triggers: {
    minTemperatureC?: number;
    minWaterActivity?: number;
    oxygenSensitive?: boolean;
    highMoisture?: boolean;
    highFat?: boolean;
    isHot?: boolean;
    isCrispy?: boolean;
    storageDaysThreshold?: number;
  };
  scientificEvidence?: ScientificProvenance;
}

export interface FoodRequirement {
  id: string;
  sensitivityId: string;
  sensitivityName: string;
  priority: RequirementPriority;
  requirementDescription: string;
  targetParameter: string;
  thresholdValue?: number | string;
  comparisonOperator?: '<=' | '>=' | '==' | 'contains' | 'between';
  thresholdUnit?: string;
  scientificBasis: string;
}

export interface PackagingSpecification {
  id: string;
  foodRequirementId: string;
  propertyKey: 'maxOTR' | 'maxWVTR' | 'greaseKit' | 'maxOperatingTempC' | 'minOperatingTempC' | 'ventingType' | 'lightBarrier' | 'sealIntegrity' | 'thermalProcess';
  targetValue: number | string | boolean;
  unit: string;
  importance: RequirementPriority;
  description: string;
  validationStatus: ValidationStatus;
}

export interface PackageStyle {
  id: string;
  name: string;
  category: 'Clamshell' | 'Compartment Tray' | 'Bowl with Lid' | 'Box' | 'Pouch' | 'Dome Container' | 'Hybrid Multi-Vessel';
  description: string;
  compartments: number;
  ventingType: 'Active Chimney' | 'Perimeter Slits' | 'Adjustable Valve' | 'Hermetic Non-Vented' | 'Micro-Perforated';
  sealingMechanism: 'Dual Perimeter Clip' | 'Hermetic Snap-Rim' | 'Tuck-in Flap' | 'Dome Snap-on' | 'Heat Sealed';
  stackable: boolean;
  typicalFoodTypes: string[];
  suitableForLiquids: boolean;
  suitableForCrispy: boolean;
  suitableForChilled: boolean;
  suitableForHot: boolean;
}

export interface PackingConfiguration {
  id: string;
  name: string;
  description: string;
  requiresSeparation: boolean;
  steps: string[];
  accessories: string[];
}

export interface PackagingCombination {
  id: string;
  name: string;
  trayMaterialId: string;
  lidMaterialId: string;
  sealingCompatibility: boolean;
  sealingTemperatureRangeC: { min: number; max: number };
  surfaceAreaRatioTrayToLid: number;
  compositeOTR: number; // area-weighted
  compositeWVTR: number; // area-weighted
  validationStatus: ValidationStatus;
  notes: string;
}

export interface MaterialApplication {
  materialId: string;
  foodCategory: string;
  foodName?: string;
  typicalShelfLifeDaysRange: { min: number; max: number };
  sensitivitiesCovered: string[];
  sensitivitiesNotCovered: string[];
  coverageRatio: number; // 0 - 1.0
  limitations: string[];
  validationStatus: ValidationStatus;
}

export interface CoverageMatrixItem {
  requirement: string;
  target: string;
  candidateValue: string;
  status: 'Met' | 'Unmet' | 'Exceeded' | 'Near-Optimal';
  importance: RequirementPriority;
  evidence: string;
}

export interface FoodCommodity {
  id: string;
  name: string;
  category: 'Fresh Produce' | 'Prepared Meal' | 'Fried Food' | 'Curry / Liquid' | 'Bakery' | 'Snack / Dry';
  defaultState: 'Raw' | 'Cooked / Hot' | 'Cooked / Chilled' | 'Ambient';
  moistureContentPercent: number;
  waterActivity: number;
  pH: number;
  fatContentPercent: number;
  respirationRateClass?: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Extremely High';
  respirationRateMgCO2PerKgHr?: number;
  steamGenerationRisk: 'None' | 'Low' | 'Moderate' | 'High' | 'Extreme';
  crispnessSensitivity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  greaseMigrationTendency: 'None' | 'Low' | 'Medium' | 'High';
  acidFatReactionRisk: 'None' | 'Low' | 'Moderate' | 'High';
  provenance: ScientificProvenance;
}

export interface AIAnalysisResult {
  detectedFoods: string[];
  primaryFoodName: string;
  components: string[];
  possibleIngredients: string[];
  processingState: string;
  cookingMethod: 'Deep Fried' | 'Dum Steamed / Boiled' | 'Baked / Roasted' | 'Simmered Curry' | 'Raw / Fresh' | 'Extruded / Dried' | 'Refrigerated Cold';
  servingTemperature: 'Very Hot (>75°C)' | 'Warm (50-70°C)' | 'Room Temp (20-30°C)' | 'Chilled (0-8°C)' | 'Frozen (<-18°C)';
  moistureReleaseState: 'High Active Steam' | 'Moderate Vapor' | 'Static Moisture' | 'Dry';
  physicalTexture: 'Crisp Batter Crust' | 'Moist Grains' | 'Viscous Liquid Gravy' | 'Solid Fresh Cell' | 'Brittle Snack';
  confidence: string;
  confidenceScore: number;
  warnings: string[];
  requiresConfirmation: boolean;
  aiMode: 'REAL' | 'FALLBACK';
  modelArchitecture: {
    multimodalReasoning: string;
    classificationBackbone: string;
    segmentationModel: string;
    textOcrEngine: string;
    ontologyMapping: string;
  };
  matchedDatabaseFood?: Partial<FoodCommodity>;
}

export interface UserPreferences {
  priorities: string[];
  budget: 'Economy' | 'Balanced' | 'Premium';
  sustainability: 'Normal' | 'Prefer recyclable' | 'Prefer biodegradable/compostable' | 'Strong sustainability preference';
  deliveryTime: 'Less than 30 minutes' | '30–60 minutes' | '1–2 hours' | 'More than 2 hours';
  deliveryMethod?: string;
  servingSize?: string;
}

export interface ActionableSummary {
  packagingName: string;
  materialName: string;
  materialCategory: string;
  packageStyle: string;
  configuration: string;
  quickWhy: string;
  deliveryWindow: string;
  packingInstructions: string[];
}

export interface ExplainabilityChain {
  sensitivity: string;
  requirement: string;
  specification: string;
  materialFeature: string;
  rationale: string;
}

export interface RecommendationRecord {
  id: string;
  userId: string;
  userName: string;
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
  title: string;
  foodName: string;
  components: string[];
  foodProfile: any;
  inputScenario: any;
  topCandidate?: PackagingMaterial;
  actionableSummary?: ActionableSummary;
  detailedAnalysis?: any;
  configuration: {
    containerName: string;
    materialId: string;
    structure: string;
    containerStyle: string;
    compartments: string;
    lidType: string;
    venting: string;
    sauceContainer: string;
    leakageProtection: string;
    greaseResistance: string;
    moistureManagement: string;
    mechanicalStrength?: string;
  };
  alternatives: {
    material?: PackagingMaterial;
    name?: string;
    materialId?: string;
    costDelta: string;
    tradeoff: string;
  }[];
  whyExplanation: string;
  explainabilityChain?: ExplainabilityChain[];
  evidence: ScientificProvenance[];
  assumptions: string[];
  limitations: string[];
  validationRequired: string[];
  coverageMatrix?: CoverageMatrixItem[];
  compliantStatus?: 'Fully Compliant' | 'No fully compliant candidate found.';
  unmetRequirements?: string[];
  costEstimate: {
    unitCostINR: number;
    currency: string;
    basis: string;
  };
  sustainabilityScore: number;
  aiMode: 'REAL' | 'FALLBACK';
  qrCodeUrl: string;
  generatedPackagingImage?: string;
  packagingImagePrompt?: string;
  createdAt: string;
}

export * from './packagingAsset';
