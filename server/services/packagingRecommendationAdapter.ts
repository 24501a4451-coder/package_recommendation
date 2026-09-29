/**
 * FOODPACK-AI: Packaging Recommendation Adapter
 * 
 * Bridges the conversational FarmerContext to the authoritative Level 1
 * FOODPACK Recommendation Engine (levelEngines.generateLevel1), resolving the exact
 * packaging asset record, packing configuration, dos/don'ts, and verified shopping details.
 * 
 * Implements the required:
 * recommendPackaging(farmerContext)
 */

import { levelEngines, Level1Input, Level1RecommendationResult } from '../engines/levelEngines';
import { packagingAssetStore } from '../db/packagingAssetStore';
import { packagingVisualizationService } from './packagingVisualizationService';
import { packagingShoppingService, PackagingShoppingInfo } from './packagingShoppingService';
import { FarmerConversationContext } from '../ai/farmerVoiceService';
import { PackingConfiguration } from '../../src/types/packagingAsset';

export interface PackagingRecommendationResponse {
  recommendationId: string;
  material: {
    materialId: string;
    name: string;
    composition: string;
    properties: {
      otr?: string;
      wvtr?: string;
      perforationType?: string;
      operatingTempRange?: string;
    };
  };
  package: {
    packageId: string;
    materialId: string;
    name: string;
    packageType: string;
    capacity: string;
    dimensions: string;
    ventilation: string;
    reusability: string;
    realProductImage: string;
    additionalImages: any[];
    insidePackageImage?: string;
    shoppingInfo: PackagingShoppingInfo | null;
  };
  packingConfiguration: PackingConfiguration & {
    dos: string[];
    donts: string[];
  };
  requirements: string[];
  reason: string;
  alternatives: { name: string; tradeoff: string }[];
  evidence: { source: string; dateOrVersion: string }[];
  limitations: string[];
  shelfLifeDays: { min: number; max: number };
  costPerUnitINR: number;
  sustainabilityRating: number;
  scientificResult: Level1RecommendationResult;
}

export class PackagingRecommendationAdapter {
  /**
   * The authoritative packaging recommendation function.
   * Invoked directly by Gemini Live Voice and the frontend API.
   */
  public recommendPackaging(
    farmerContext: Partial<FarmerConversationContext>
  ): PackagingRecommendationResponse {
    const cropName = (farmerContext.commodity || farmerContext.crop || 'Fresh Tomatoes').trim();
    const transportDays = farmerContext.transportDurationDays || (farmerContext.transportDuration ? Math.max(1, Math.round(Number(farmerContext.transportDuration) / 24)) : 2);
    const refrigeration = farmerContext.refrigeration !== undefined 
      ? Boolean(farmerContext.refrigeration) 
      : Boolean(farmerContext.refrigerationAvailable);

    const storageTemp = farmerContext.storageTemperature ?? (refrigeration ? 4 : (farmerContext.ambientTemperature ?? 26));
    const humidity = farmerContext.humidity ?? (refrigeration ? 90 : 75);
    const storageType = refrigeration ? 'Cold Storage (Refrigerated)' : (farmerContext.storageType || 'Ambient Aerated Truck');

    // 1. Prepare input for the existing scientific Level 1 Recommendation Engine
    const level1Input: Level1Input = {
      commodityName: cropName,
      storageTempC: storageTemp,
      relativeHumidity: humidity,
      storageType: storageType as any,
      transportDurationDays: transportDays,
      targetShelfLifeDays: transportDays + 5,
      mapRequirement: 'Automatic DSS Selection',
      packagingFormat: (farmerContext.packagingFormatPreference as any) || 'Micro-Perforated Pouch / Bag',
      budget: farmerContext.budget || (farmerContext.budgetPreference as any) || 'Balanced',
      sustainability: farmerContext.sustainability || (farmerContext.sustainabilityPreference as any) || 'Prefer biodegradable/compostable'
    };

    // 2. Execute existing FOODPACK Level 1 Recommendation Engine
    const scientificResult = levelEngines.generateLevel1(level1Input);

    // 3. Resolve authoritative packaging asset record from the Packaging Asset Library
    const asset = packagingAssetStore.findByCropAndConditions(
      cropName,
      transportDays,
      refrigeration,
      farmerContext.packagingFormatPreference || undefined
    );

    // 4. Derive authoritative packing configuration
    const basePackingConfig = packagingVisualizationService.derivePackingConfiguration(
      cropName,
      asset,
      {
        transportDays,
        refrigeration,
        quantity: farmerContext.quantity || undefined
      }
    );

    // 5. Derive actionable practical DOs and DONTs for Container 4 (Packing & Transport Plan)
    const { dos, donts } = this.deriveDosAndDonts(cropName, asset, basePackingConfig, refrigeration, transportDays);

    // 6. Retrieve verified shopping info via the Shopping Service Abstraction
    const shoppingInfo = packagingShoppingService.getShoppingInfo(asset.materialId);

    // 7. Map packageId (e.g. PKG-001)
    const packageId = asset.materialId.replace('MAT-', 'PKG-');

    // 8. Generate unique recommendation ID
    const recYear = new Date().getFullYear();
    const randomHash = Math.floor(1000 + Math.random() * 9000);
    const recommendationId = `REC-${recYear}-L1-${randomHash}`;

    // 9. Construct formatted clean response
    return {
      recommendationId,
      material: {
        materialId: asset.materialId,
        name: asset.materialName,
        composition: asset.materialComposition,
        properties: {
          otr: asset.scientificProperties.otr,
          wvtr: asset.scientificProperties.wvtr,
          perforationType: asset.scientificProperties.perforationType,
          operatingTempRange: asset.scientificProperties.operatingTempRange
        }
      },
      package: {
        packageId,
        materialId: asset.materialId,
        name: asset.materialName,
        packageType: asset.packageType,
        capacity: asset.capacity.description,
        dimensions: asset.dimensions.description,
        ventilation: asset.ventilationCharacteristics,
        reusability: asset.reusableRecyclableProperties,
        realProductImage: asset.realProductImage,
        additionalImages: asset.additionalImages || [],
        insidePackageImage: asset.insidePackageImage,
        shoppingInfo
      },
      packingConfiguration: {
        ...basePackingConfig,
        dos,
        donts
      },
      requirements: scientificResult.foodRequirements.map(r => `${r.sensitivityName}: ${r.requirementDescription}`),
      reason: scientificResult.justNecessaryPackaging?.explanation || 
        `Selected ${asset.packageType} because freshly harvested ${cropName} undergoes active postharvest metabolic respiration. The calibrated ventilation permits respiratory heat and vapor egress, suppressing humidity condensation and sour rotting, while rigid sidewalls isolate produce from road vibration impact.`,
      alternatives: scientificResult.alternatives || [
        { name: '5-Ply Kraft Corrugated Box with Chimney Vents', tradeoff: 'Biodegradable single/dual trip alternative, higher moisture absorption in heavy humidity' },
        { name: 'Micro-Perforated BOPP/PE Pouch', tradeoff: 'Excellent retail unit presentation, requires rigid secondary master crates during truck transport' }
      ],
      evidence: scientificResult.scientificEvidence.map(e => ({
        source: e.source,
        dateOrVersion: e.dateOrVersion
      })),
      limitations: scientificResult.limitations || [
        'Respiration rates vary according to field harvest maturity and diurnal orchard temperature.',
        'Ambient truck transport exceeding 36°C accelerates ethylene breakdown; pre-cooling recommended.'
      ],
      shelfLifeDays: scientificResult.estimatedShelfLifeDays,
      costPerUnitINR: scientificResult.estimatedCostPerUnitINR,
      sustainabilityRating: scientificResult.sustainabilityRating,
      scientificResult
    };
  }

  /**
   * Derives farmer-friendly DOs and DONTs based on crop biology, packaging format, and transit rules
   */
  private deriveDosAndDonts(
    cropName: string,
    asset: any,
    config: PackingConfiguration,
    refrigeration: boolean,
    transportDays: number
  ): { dos: string[]; donts: string[] } {
    const cropLower = cropName.toLowerCase();

    const dos: string[] = [
      `Inspect all ${asset.packageType} units before harvest packing to confirm side airflow vents are free of field dirt.`,
      `Follow the recommended ${config.layerCount}-tier packing arrangement with calyx/stems pointing downward.`,
      `Maintain a minimum 25mm (1 inch) top clearance beneath the container rim to prevent compression under top crates.`,
      `Align crate side vents parallel with the truck length to utilize convective vehicle motion airflow.`
    ];

    const donts: string[] = [
      `DO NOT pack bruised, split, or damp produce into the same container; microbial rots spread rapidly in transit.`,
      `DO NOT cover ventilated crates with non-porous airtight plastic sheeting; trapped condensation causes anaerobic fermentation.`,
      `DO NOT exceed the maximum stacking limit of ${config.stackingLimit.split(';')[0]}.`,
      `DO NOT drag or throw loaded containers; deceleration impact triggers deep vascular tissue bruising.`
    ];

    if (cropLower.includes('tomato')) {
      dos.push('Pre-cool tomatoes to 12°C - 14°C before long-haul journeys to suppress ethylene spikes.');
      donts.push('DO NOT store or transport tomatoes below 8°C; chilling temperatures destroy flavor volatiles and induce pitting.');
    } else if (cropLower.includes('mango')) {
      dos.push('Fit individual expandable foam net sleeves over each fruit to eliminate skin abrasion.');
      donts.push('DO NOT drop cartons from vehicle tailgate; latent internal spongy tissue breakdown occurs within 24 hours.');
    } else if (cropLower.includes('onion') || cropLower.includes('garlic')) {
      dos.push('Ensure complete field neck curing before filling sacks (outer skins papery and dry).');
      donts.push('DO NOT transport onions in closed airtight reefer containers; lack of cross-draft causes neck rot.');
    } else if (cropLower.includes('potato')) {
      dos.push('Keep multi-wall Kraft sacks fully shaded from sunlight to prevent poisonous green solanine buildup.');
      donts.push('DO NOT wash freshly dug potatoes with cold water immediately before transport.');
    } else if (cropLower.includes('spinach') || cropLower.includes('leaf')) {
      dos.push('Maintain strict unbroken cold chain (2°C - 4°C, 95% RH) to preserve leaf turgor pressure.');
      donts.push('DO NOT squeeze or over-compress bunches into bags; crushed leaves release water and rot within 12 hours.');
    }

    return { dos, donts };
  }
}

export const packagingRecommendationAdapter = new PackagingRecommendationAdapter();

export function recommendPackaging(farmerContext: Partial<FarmerConversationContext>): PackagingRecommendationResponse {
  return packagingRecommendationAdapter.recommendPackaging(farmerContext);
}
