export type PackagingViewType = 'product' | 'inside' | 'front' | 'side';

export interface PackagingImageItem {
  id: string;
  viewType: PackagingViewType;
  imageUrl: string;
  caption?: string;
  isPrimary?: boolean;
}

export interface PackagingDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  description: string;
}

export interface PackagingCapacity {
  maxWeightKg: number;
  volumeLiters: number;
  description: string;
}

export interface PackagingCostInfo {
  unitCostEstimate: string;
  tier: 'Economy' | 'Balanced' | 'Premium';
  currency: string;
}

export interface PackagingScientificProps {
  otr?: string;
  wvtr?: string;
  perforationType?: string;
  cushioningGrade?: string;
  operatingTempRange?: string;
  burstingStrengthKPa?: number;
}

export interface PackagingShoppingInfo {
  title: string;
  supplier: string;
  url: string;
  source: string;
  availability: string;
  priceEstimate?: string;
}

export interface PackagingAssetRecord {
  packageId?: string; // e.g. 'PKG-001'
  materialId: string; // e.g. 'MAT-001'
  materialName: string;
  packageType: string;
  materialComposition: string;
  realProductImage: string; // Real primary product image
  additionalImages: PackagingImageItem[];
  insidePackageImage?: string; // Inside view
  dimensions: PackagingDimensions;
  capacity: PackagingCapacity;
  ventilationCharacteristics: string;
  reusableRecyclableProperties: string;
  costInformation: PackagingCostInfo;
  scientificProperties: PackagingScientificProps;
  compatibleCrops: string[];
  foodCategories: string[];
  source: string;
  validationStatus: 'Validated' | 'Pending Review' | 'Field Tested';
  shoppingInfo?: PackagingShoppingInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackingConfiguration {
  quantityPerPackage: string;
  layerCount: number;
  layerArrangement: string;
  cushioningAndSeparation: string;
  ventilationRequirement: string;
  maxFillPercentage: number;
  stackingLimit: string;
  handlingInstructions: string[];
  transportPrecautions: string[];
  stepByStepInstructions: string[];
  dos?: string[];
  donts?: string[];
}

export interface PackingVisualizationResult {
  crop: string;
  materialId: string;
  packageType: string;
  realPackageImage: string;
  visualizationImageUrl: string;
  packingConfiguration: PackingConfiguration;
  promptUsed: string;
  disclaimer: string;
  isGenerated: boolean;
  timestamp: string;
}
