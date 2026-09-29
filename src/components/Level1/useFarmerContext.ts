import { useState, useEffect, useCallback, useMemo } from 'react';
import { FarmerConversationContext } from '../../../server/ai/farmerVoiceService';

export interface StructuredTransport {
  destination: string;
  distance: string;
  durationDays: number | null;
  mode: string;
  roadCondition: string;
}

export interface StructuredStorage {
  type: string;
  durationDays: number | null;
  temperatureC: number | null;
  humidity: number | null;
  refrigerated: boolean | null;
}

export interface StructuredCropProfile {
  crop: string;
  commodity: string;
  variety: string;
  quantity: string;
  harvestStage: string;
  harvestDate: string;
  freshness: string;
  maturity: string;
  transport: StructuredTransport;
  transportDistance: string;
  transportDurationDays: number | null;
  transportMode: string;
  roadCondition: string;
  destination: string;
  storage: StructuredStorage;
  storageType: string;
  storageTemperature: number | null;
  storageDurationDays: number | null;
  ambientTemperature: number | null;
  humidity: number | null;
  refrigeration: boolean | null;
  targetBuyer: string;
  packagingPurpose: string;
  packagingFormatPreference: string;
  budget: string;
  sustainability: string;
  confirmedFields: string[];
  rawContext: Partial<FarmerConversationContext>;
  lastUpdated: string;
}

const STORAGE_KEY = 'foodpack_farmer_crop_profile_v1';

const DEFAULT_PROFILE: StructuredCropProfile = {
  crop: '',
  commodity: '',
  variety: '',
  quantity: '',
  harvestStage: '',
  harvestDate: '',
  freshness: '',
  maturity: '',
  transport: {
    destination: '',
    distance: '',
    durationDays: null,
    mode: '',
    roadCondition: ''
  },
  transportDistance: '',
  transportDurationDays: null,
  transportMode: '',
  roadCondition: '',
  destination: '',
  storage: {
    type: '',
    durationDays: null,
    temperatureC: null,
    humidity: null,
    refrigerated: null
  },
  storageType: '',
  storageTemperature: null,
  storageDurationDays: null,
  ambientTemperature: null,
  humidity: null,
  refrigeration: null,
  targetBuyer: '',
  packagingPurpose: '',
  packagingFormatPreference: '',
  budget: '',
  sustainability: '',
  confirmedFields: [],
  rawContext: {},
  lastUpdated: ''
};

export function useFarmerContext(initialOverride?: Partial<StructuredCropProfile>) {
  const [profile, setProfile] = useState<StructuredCropProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          transport: { ...DEFAULT_PROFILE.transport, ...(parsed.transport || {}) },
          storage: { ...DEFAULT_PROFILE.storage, ...(parsed.storage || {}) },
          ...(initialOverride || {})
        };
      }
    } catch (e) {
      console.warn('Failed to load saved farmer crop profile from storage:', e);
    }
    return { ...DEFAULT_PROFILE, ...(initialOverride || {}) };
  });

  // Sync to localStorage on update to guarantee persistence across language switches & tab transitions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to persist farmer crop profile:', e);
    }
  }, [profile]);

  /**
   * Dynamically update the structured crop profile whenever the Gemini Live tool
   * or conversational extractor returns new structured context.
   * Preserves existing fields unless newly extracted data provides an updated value.
   */
  const updateFromExtractedData = useCallback((extracted: Partial<FarmerConversationContext>) => {
    if (!extracted || typeof extracted !== 'object') return;

    setProfile((prev) => {
      const cropName = (extracted.crop || extracted.commodity || prev.crop || prev.commodity || '').trim();
      const commodityName = (extracted.commodity || extracted.crop || prev.commodity || prev.crop || '').trim();
      const variety = (extracted.variety || prev.variety || '').trim();
      const quantity = (extracted.quantity || prev.quantity || '').trim();
      const harvestStage = (extracted.harvestStage || prev.harvestStage || '').trim();
      const harvestDate = (extracted.harvestDate || prev.harvestDate || '').trim();
      const freshness = (extracted.freshness || prev.freshness || '').trim();
      const maturity = (extracted.maturity || prev.maturity || '').trim();

      // Transport extraction
      const destination = (extracted.destination || prev.destination || prev.transport.destination || '').trim();
      const transportDistance = extracted.transportDistance != null
        ? String(extracted.transportDistance).trim()
        : (prev.transportDistance || prev.transport.distance || '');
      const transportDurationDays = extracted.transportDurationDays != null
        ? Number(extracted.transportDurationDays)
        : extracted.transportDuration != null
          ? Number(extracted.transportDuration)
          : (prev.transportDurationDays ?? prev.transport.durationDays);
      const transportMode = (extracted.transportMode || prev.transportMode || prev.transport.mode || '').trim();
      const roadCondition = (extracted.roadCondition || prev.roadCondition || prev.transport.roadCondition || '').trim();

      // Storage extraction
      const storageType = (extracted.storageType || prev.storageType || prev.storage.type || '').trim();
      const storageDurationDays = extracted.storageDurationDays != null
        ? Number(extracted.storageDurationDays)
        : extracted.storageDuration != null
          ? Number(extracted.storageDuration)
          : (prev.storageDurationDays ?? prev.storage.durationDays);
      const storageTemperature = extracted.storageTemperature != null
        ? Number(extracted.storageTemperature)
        : (prev.storageTemperature ?? prev.storage.temperatureC);
      const ambientTemperature = extracted.ambientTemperature != null
        ? Number(extracted.ambientTemperature)
        : prev.ambientTemperature;
      const humidity = extracted.humidity != null
        ? Number(extracted.humidity)
        : (prev.humidity ?? prev.storage.humidity);
      const refrigeration = extracted.refrigeration != null
        ? Boolean(extracted.refrigeration)
        : extracted.refrigerationAvailable != null
          ? Boolean(extracted.refrigerationAvailable)
          : (prev.refrigeration ?? prev.storage.refrigerated);

      // Preferences extraction
      const targetBuyer = (extracted.targetBuyer || prev.targetBuyer || '').trim();
      const packagingPurpose = (extracted.packagingPurpose || prev.packagingPurpose || '').trim();
      const packagingFormatPreference = (extracted.packagingFormatPreference || extracted.packagingPreference || prev.packagingFormatPreference || '').trim();
      const budget = (extracted.budget || extracted.budgetPreference || prev.budget || '').trim();
      const sustainability = (extracted.sustainability || extracted.sustainabilityPreference || prev.sustainability || '').trim();

      // Combine confirmed fields
      const newConfirmed = Array.from(new Set([
        ...(prev.confirmedFields || []),
        ...(extracted.confirmedFields || [])
      ]));

      // Merge rawContext
      const mergedRawContext: Partial<FarmerConversationContext> = {
        ...prev.rawContext,
        ...extracted
      };

      const updatedProfile: StructuredCropProfile = {
        crop: cropName,
        commodity: commodityName,
        variety,
        quantity,
        harvestStage,
        harvestDate,
        freshness,
        maturity,
        transport: {
          destination,
          distance: transportDistance,
          durationDays: transportDurationDays,
          mode: transportMode,
          roadCondition
        },
        transportDistance,
        transportDurationDays,
        transportMode,
        roadCondition,
        destination,
        storage: {
          type: storageType,
          durationDays: storageDurationDays,
          temperatureC: storageTemperature,
          humidity,
          refrigerated: refrigeration
        },
        storageType,
        storageTemperature,
        storageDurationDays,
        ambientTemperature,
        humidity,
        refrigeration,
        targetBuyer,
        packagingPurpose,
        packagingFormatPreference,
        budget,
        sustainability,
        confirmedFields: newConfirmed,
        rawContext: mergedRawContext,
        lastUpdated: new Date().toISOString()
      };

      return updatedProfile;
    });
  }, []);

  /**
   * Partial direct update helper
   */
  const updateProfile = useCallback((partial: Partial<StructuredCropProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...partial,
      transport: {
        ...prev.transport,
        ...(partial.transport || {})
      },
      storage: {
        ...prev.storage,
        ...(partial.storage || {})
      },
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  /**
   * Reset profile for a fresh crop harvesting session
   */
  const resetCropProfile = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    setProfile({
      ...DEFAULT_PROFILE,
      lastUpdated: new Date().toISOString()
    });
  }, []);

  /**
   * Check if profile has minimum necessary information
   */
  const isProfilePopulated = useMemo(() => {
    return Boolean(profile.crop || profile.commodity);
  }, [profile.crop, profile.commodity]);

  /**
   * Calculate completeness percentage across key farmer attributes
   * 1. Crop / Commodity (25%)
   * 2. Quantity (20%)
   * 3. Transport details (25%)
   * 4. Storage / Refrigeration (20%)
   * 5. Destination / Target buyer (10%)
   */
  const completenessPercentage = useMemo(() => {
    let score = 0;
    if (profile.crop || profile.commodity) score += 25;
    if (profile.quantity) score += 20;
    if (profile.transportDurationDays != null || profile.transportDistance || profile.destination) score += 25;
    if (profile.storageType || profile.storageTemperature != null || profile.refrigeration != null) score += 20;
    if (profile.targetBuyer || profile.packagingPurpose || profile.budget) score += 10;
    return Math.min(score, 100);
  }, [profile]);

  return {
    cropProfile: profile,
    profile, // alias for convenience
    updateFromExtractedData,
    updateProfile,
    resetCropProfile,
    isProfilePopulated,
    completenessPercentage
  };
}
