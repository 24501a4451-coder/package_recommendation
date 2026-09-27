import fs from 'fs';
import path from 'path';
import {
  User,
  PackagingMaterial,
  PackageStyle,
  PackingConfiguration,
  FoodCommodity,
  RecommendationRecord,
  ScientificProvenance,
  ValidationStatus,
  RequirementPriority,
  PackagingCombination,
  MaterialApplication,
  CoverageMatrixItem,
  ExplainabilityChain
} from '../../src/types';

export * from '../../src/types';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  level: string;
  details: string;
}

export const SEED_PACKAGE_STYLES: PackageStyle[] = [
  {
    id: 'style_chimney_clamshell',
    name: 'Chimney-Vented Clamshell Box with Raised Ridge Base',
    category: 'Clamshell',
    description: 'Thermoformed single-chamber clamshell with perimeter vapor chimney tabs and fluted floor that keeps fried foods elevated above residual oil.',
    compartments: 1,
    ventingType: 'Active Chimney',
    sealingMechanism: 'Dual Perimeter Clip',
    stackable: true,
    typicalFoodTypes: ['Fried Chicken', 'Crispy Fries', 'Samosas', 'Spring Rolls', 'Tempura'],
    suitableForLiquids: false,
    suitableForCrispy: true,
    suitableForChilled: false,
    suitableForHot: true
  },
  {
    id: 'style_hermetic_bowl',
    name: 'Hermetic Leakproof Lidded Bowl with Gasket Seal',
    category: 'Bowl with Lid',
    description: 'Deep bowl with positive-locking snap rim preventing hydrostatic liquid leaks during motorized courier transit.',
    compartments: 1,
    ventingType: 'Hermetic Non-Vented',
    sealingMechanism: 'Hermetic Snap-Rim',
    stackable: true,
    typicalFoodTypes: ['Curries', 'Gravies', 'Soups', 'Dal', 'Rasam', 'Stews'],
    suitableForLiquids: true,
    suitableForCrispy: false,
    suitableForChilled: true,
    suitableForHot: true
  },
  {
    id: 'style_two_compartment_tray',
    name: 'Dual-Compartment Thermal Barrier Tray',
    category: 'Compartment Tray',
    description: 'Rigid partitioned tray separating wet/liquid gravy from dry starch or hot primary from cold side with independent lid seals.',
    compartments: 2,
    ventingType: 'Perimeter Slits',
    sealingMechanism: 'Hermetic Snap-Rim',
    stackable: true,
    typicalFoodTypes: ['Rice with Curry', 'Noodles with Stir-fry', 'Pancakes with Syrup'],
    suitableForLiquids: true,
    suitableForCrispy: false,
    suitableForChilled: true,
    suitableForHot: true
  },
  {
    id: 'style_three_compartment_meal_box',
    name: 'Three-Compartment Bento / Meal Suite Box',
    category: 'Compartment Tray',
    description: 'Molded three-chamber container isolating main dish, side vegetable, and dessert/condiment.',
    compartments: 3,
    ventingType: 'Perimeter Slits',
    sealingMechanism: 'Dual Perimeter Clip',
    stackable: true,
    typicalFoodTypes: ['Executive Combo Meals', 'Thali', 'Salad + Protein + Bread', 'Rice + Curry + Vegetable'],
    suitableForLiquids: true,
    suitableForCrispy: true,
    suitableForChilled: true,
    suitableForHot: true
  },
  {
    id: 'style_multi_vessel_suite',
    name: 'Multi-Vessel Hybrid Packaging Suite',
    category: 'Hybrid Multi-Vessel',
    description: 'Engineered modular suite: insulated primary fiber bowl for hot main course, external sealed leakproof side cups, and ventilated pouch for crispy sides.',
    compartments: 4,
    ventingType: 'Adjustable Valve',
    sealingMechanism: 'Hermetic Snap-Rim',
    stackable: false,
    typicalFoodTypes: ['Combo Meals with Hot + Cold + Crispy items', 'Biryani + Raita + Fried Chicken 65', 'Curry + Rice + Salad'],
    suitableForLiquids: true,
    suitableForCrispy: true,
    suitableForChilled: true,
    suitableForHot: true
  },
  {
    id: 'style_dome_bakery_box',
    name: 'High-Clearance Protective Dome Container with Fluted Base',
    category: 'Dome Container',
    description: 'Crystal-clear high-rise dome that shields fragile cream frosting and delicate decorations with non-skid base indentation.',
    compartments: 1,
    ventingType: 'Hermetic Non-Vented',
    sealingMechanism: 'Dome Snap-on',
    stackable: true,
    typicalFoodTypes: ['Cakes', 'Pastries', 'Cupcakes', 'Frosted Desserts', 'Tarts'],
    suitableForLiquids: false,
    suitableForCrispy: false,
    suitableForChilled: true,
    suitableForHot: false
  },
  {
    id: 'style_vented_corrugated_box',
    name: 'E-Flute Micro-Corrugated Ventilated Food Box',
    category: 'Box',
    description: 'Sturdy micro-corrugated box with calibrated side breathers and greaseproof parchment liner for wide-surface baked or grilled items.',
    compartments: 1,
    ventingType: 'Active Chimney',
    sealingMechanism: 'Tuck-in Flap',
    stackable: true,
    typicalFoodTypes: ['Pizza', 'Flatbreads', 'Calzones', 'Grilled Kebabs', 'Large Fried Appetizers'],
    suitableForLiquids: false,
    suitableForCrispy: true,
    suitableForChilled: false,
    suitableForHot: true
  },
  {
    id: 'style_clear_chilled_tub',
    name: 'Anti-Fog Transparent Cold Deli Tub with Tamper Ring',
    category: 'Bowl with Lid',
    description: 'Cold-chain compliant transparent bowl with anti-fog coating and audible tamper-evident break tab.',
    compartments: 1,
    ventingType: 'Hermetic Non-Vented',
    sealingMechanism: 'Hermetic Snap-Rim',
    stackable: true,
    typicalFoodTypes: ['Fresh Green Salads', 'Cut Fruits', 'Cold Pasta', 'Cold Desserts', 'Sushi'],
    suitableForLiquids: true,
    suitableForCrispy: false,
    suitableForChilled: true,
    suitableForHot: false
  }
];

export const SEED_PACKING_CONFIGURATIONS: PackingConfiguration[] = [
  {
    id: 'config_crisp_vented',
    name: 'Active Chimney Vented Configuration with Grease Buffer',
    description: 'Optimized for fried foods: active steam exhaust tabs left open, resting on grease-absorbing corrugated or parchment bed.',
    requiresSeparation: false,
    steps: [
      'Place greaseproof parchment liner on base.',
      'Deposit hot fried food directly from fryer after 30s drain.',
      'Engage dual perimeter clips while verifying both chimney vents remain 100% open.',
      'Transport in breathable Kraft outer bag without airtight poly wrap.'
    ],
    accessories: ['TAPPI Kit 9 Parchment Liner', 'Perimeter Vent Clips']
  },
  {
    id: 'config_liquid_hermetic',
    name: 'Hermetic Hydrostatic Containment with 15mm Headspace',
    description: 'Optimized for liquid curries, soups, and gravies: 100% liquid-tight seal with expansion headspace.',
    requiresSeparation: false,
    steps: [
      'Fill container leaving minimum 15mm headspace for thermal liquid expansion.',
      'Wipe container rim completely dry before pressing lid.',
      'Press snap-lock lid firmly until perimeter click is heard continuously around rim.',
      'Transport vertically in flat-bottom bag.'
    ],
    accessories: ['Food-Grade Silicone Gasket Ring', 'Tamper-Evident Security Seal']
  },
  {
    id: 'config_multi_vessel_hot_cold',
    name: 'Thermal & Moisture Separation Modular Suite',
    description: 'Isolates cold/dairy elements from hot steam to prevent curd syneresis, bacterial risk, and crust plasticization.',
    requiresSeparation: true,
    steps: [
      'Pack hot primary meal in central insulated fiber container; close vented lid.',
      'Seal cold sauce/raita in separate 50ml hermetic airtight cup.',
      'If crispy side is included, pack in separate dry micro-vented pouch.',
      'Place cold and dry vessels alongside the main vessel using a partitioned carrier caddy.'
    ],
    accessories: ['Separate 50ml Airtight Sauce Cup', 'Dry Vented Starter Sleeve', 'Partitioned Carrier Caddy']
  },
  {
    id: 'config_compartment_partitioned',
    name: 'Molded Baffle Compartment Isolation',
    description: 'Keeps disparate sides in a single tray using high-baffle partition walls.',
    requiresSeparation: true,
    steps: [
      'Place primary hot food in large chamber (50% volume).',
      'Place sides and condiments in secondary chambers (25% volume each).',
      'Press contoured partition lid ensuring inter-chamber sealing ribs seat firmly.',
      'Verify no liquid seepage occurs between compartments.'
    ],
    accessories: ['Inter-Chamber Sealing Rib Lid']
  },
  {
    id: 'config_delicate_clearance',
    name: 'Suspended Clearance Zero-Contact Enclosure',
    description: 'Protects delicate frostings, toppings, and soft textures from container wall contact.',
    requiresSeparation: false,
    steps: [
      'Place dessert/cake onto center of fluted base indentation.',
      'Lower high-clearance transparent dome vertically without tilt.',
      'Snap base-lock rim into place.',
      'Maintain chilled cold-chain (<8°C) during transit.'
    ],
    accessories: ['Non-Skid Base Ring', 'Audible Tamper Snap Rim']
  }
];

// Initial Seed Data
export const SEED_MATERIALS: PackagingMaterial[] = [
  {
    id: 'mat_bagasse_clamshell',
    name: 'Sugarcane Bagasse (PFAS-Free Water/Oil Resistant)',
    code: 'BAGASSE-750',
    category: 'Molded Fiber',
    description: 'Thermoformed agro-waste sugarcane pulp fiber with certified food-grade plant wax barrier.',
    structureType: 'Thermoformed',
    thicknessRangeMicrons: { min: 400, max: 700, standard: 550 },
    otr: {
      value: 1200,
      provenance: {
        source: 'Journal of Cleaner Production, Vol 284: Molded Pulp Barriers',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 50,
        thicknessMicrons: 550,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2022.04',
        notes: 'Porous structure allows controlled moisture breathability preventing steam sogginess.'
      }
    },
    wvtr: {
      value: 280,
      provenance: {
        source: 'Packaging Technology and Science, Vol 35',
        sourceType: 'Published literature',
        testMethod: 'ASTM F1249',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 550,
        unit: 'g / (m² · day)',
        dateOrVersion: '2023.01'
      }
    },
    greaseResistanceKit: {
      value: 8,
      provenance: {
        source: 'TAPPI T559 Certified Lab Report 2024-FP',
        sourceType: 'Validated database',
        testMethod: 'TAPPI T559',
        dateOrVersion: '2024-v2'
      }
    },
    maxOperatingTempC: 120,
    minOperatingTempC: -20,
    microwaveSafe: true,
    freezerSafe: true,
    hotOilResistant: true,
    steamVentingCompatible: true,
    sustainabilityRating: 94,
    biodegradable: true,
    compostableStandard: 'EN 13432 / ASTM D6400 (Commercial & Home 90 days)',
    recyclabilityCode: 'PAP 21',
    carbonFootprintKgCO2ePerKg: 1.15,
    estimatedCostPerUnitINR: 5.20,
    suitableForTakeaway: true,
    suitableForFreshProduce: true,
    suitableForLongShelfLife: false,
    typicalApplications: ['Biryani', 'Hot Meals', 'Fried Chicken', 'Burgers', 'Pasta', 'Salads']
  },
  {
    id: 'mat_kraft_pla_vented',
    name: 'Virgin Kraft Paperboard with Bio-PLA Liner & Vented Lid',
    code: 'KRAFT-PLA-VENT',
    category: 'Cellulose / Paper',
    description: 'FSC-certified unbleached Kraft board with 25-micron internal bio-PLA leakproof barrier and perimeter micro-vent slits.',
    structureType: 'Aqueous Coated Board',
    thicknessRangeMicrons: { min: 300, max: 450, standard: 350 },
    otr: {
      value: 450,
      provenance: {
        source: 'Industrial Bio-Packaging Consortium Test Series 2023',
        sourceType: 'Validated database',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 0,
        thicknessMicrons: 350,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2023-B2'
      }
    },
    wvtr: {
      value: 45,
      provenance: {
        source: 'TAPPI Barrier Board Standards Database',
        sourceType: 'Validated database',
        testMethod: 'ASTM E96',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 350,
        unit: 'g / (m² · day)',
        dateOrVersion: '2023-11'
      }
    },
    greaseResistanceKit: {
      value: 10,
      provenance: {
        source: 'Food Packaging Safety Council Lab Test',
        sourceType: 'Laboratory measured',
        testMethod: 'TAPPI T559',
        dateOrVersion: '2024.02'
      }
    },
    maxOperatingTempC: 95,
    minOperatingTempC: -10,
    microwaveSafe: true,
    freezerSafe: false,
    hotOilResistant: true,
    steamVentingCompatible: true,
    sustainabilityRating: 88,
    biodegradable: true,
    compostableStandard: 'EN 13432 Industrial Compostable',
    recyclabilityCode: 'PAP 22 / Biodegradable',
    carbonFootprintKgCO2ePerKg: 1.45,
    estimatedCostPerUnitINR: 4.80,
    suitableForTakeaway: true,
    suitableForFreshProduce: false,
    suitableForLongShelfLife: false,
    typicalApplications: ['Fried Snacks', 'Noodles', 'Rice Bowls', 'Wraps', 'French Fries', 'Dimsums']
  },
  {
    id: 'mat_pp_hermetic_compartment',
    name: 'Food-Grade Polypropylene (PP) Hermetic Multi-Compartment',
    code: 'PP-HERMETIC-3C',
    category: 'Commodity Polymers',
    description: 'BPA-free high-impact food grade polypropylene with tight snap-lock seal channels and steam release valve tab.',
    structureType: 'Thermoformed',
    thicknessRangeMicrons: { min: 450, max: 750, standard: 600 },
    otr: {
      value: 85,
      provenance: {
        source: 'Polymer Handbook 4th Edition / ASTM D3985',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 0,
        thicknessMicrons: 600,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2021'
      }
    },
    wvtr: {
      value: 3.5,
      provenance: {
        source: 'Polymer Handbook 4th Edition / ASTM F1249',
        sourceType: 'Published literature',
        testMethod: 'ASTM F1249',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 600,
        unit: 'g / (m² · day)',
        dateOrVersion: '2021'
      }
    },
    greaseResistanceKit: {
      value: 12,
      provenance: {
        source: 'Plastics Food Contact Regulatory Dossier (FDA 21 CFR 177.1520)',
        sourceType: 'Validated database',
        testMethod: 'TAPPI T559',
        dateOrVersion: '2023'
      }
    },
    maxOperatingTempC: 125,
    minOperatingTempC: -20,
    microwaveSafe: true,
    freezerSafe: true,
    hotOilResistant: true,
    steamVentingCompatible: true,
    sustainabilityRating: 62,
    biodegradable: false,
    recyclabilityCode: 'PP 05 (Widely Recyclable)',
    carbonFootprintKgCO2ePerKg: 2.10,
    estimatedCostPerUnitINR: 6.80,
    suitableForTakeaway: true,
    suitableForFreshProduce: false,
    suitableForLongShelfLife: true,
    typicalApplications: ['Curries', 'Gravies', 'Multi-dish Thali', 'Biryani + Salan + Raita', 'Soups', 'Sambar']
  },
  {
    id: 'mat_cpet_dual_ovenable',
    name: 'Crystalline PET (CPET) Dual-Ovenable High-Barrier Tray',
    code: 'CPET-DO-TRAYS',
    category: 'Engineered Barrier',
    description: 'Thermoformed crystallised polyethylene terephthalate tray capable of withstanding conventional ovens and deep microwave heating.',
    structureType: 'Thermoformed',
    thicknessRangeMicrons: { min: 500, max: 900, standard: 700 },
    otr: {
      value: 15,
      provenance: {
        source: 'Barrier Polymers in Food Packaging, Elsevier Science',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 0,
        thicknessMicrons: 700,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2022'
      }
    },
    wvtr: {
      value: 2.1,
      provenance: {
        source: 'Barrier Polymers in Food Packaging, Elsevier Science',
        sourceType: 'Published literature',
        testMethod: 'ASTM F1249',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 700,
        unit: 'g / (m² · day)',
        dateOrVersion: '2022'
      }
    },
    greaseResistanceKit: {
      value: 12,
      provenance: {
        source: 'ASTM F119 Grease Penetration Testing',
        sourceType: 'Laboratory measured',
        testMethod: 'ASTM F119',
        dateOrVersion: '2023.05'
      }
    },
    maxOperatingTempC: 220,
    minOperatingTempC: -40,
    microwaveSafe: true,
    freezerSafe: true,
    hotOilResistant: true,
    steamVentingCompatible: true,
    sustainabilityRating: 68,
    biodegradable: false,
    recyclabilityCode: 'PET 01',
    carbonFootprintKgCO2ePerKg: 2.80,
    estimatedCostPerUnitINR: 9.50,
    suitableForTakeaway: true,
    suitableForFreshProduce: false,
    suitableForLongShelfLife: true,
    typicalApplications: ['Frozen Ready-to-Eat', 'Bakery Reheat', 'Oven Grills', 'Hospital Catering']
  },
  {
    id: 'mat_emap_microperf_pp',
    name: 'Equilibrium MAP Micro-Perforated BOPP Film (Laser Pinhole)',
    code: 'EMAP-BOPP-30',
    category: 'Commodity Polymers',
    description: 'Biaxially oriented polypropylene with precision laser micro-perforations tuned to commodity respiration rate (O2/CO2 flux balancing).',
    structureType: 'Monolayer',
    thicknessRangeMicrons: { min: 25, max: 40, standard: 30 },
    otr: {
      value: 8500, // Elevated due to calibrated micro-perforations for EMAP
      provenance: {
        source: 'Postharvest Biology and Technology, Vol 178: EMAP Permeation Dynamics',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985 + Laser Perforation Flux Meter',
        testTemperatureC: 10,
        testRelativeHumidity: 85,
        thicknessMicrons: 30,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2023.03',
        notes: 'Calibrated specifically to prevent anaerobic fermentation in high-respiration commodities.'
      }
    },
    wvtr: {
      value: 18,
      provenance: {
        source: 'Postharvest Biology and Technology, Vol 178',
        sourceType: 'Published literature',
        testMethod: 'ASTM E96 Desiccant Method',
        testTemperatureC: 10,
        testRelativeHumidity: 85,
        thicknessMicrons: 30,
        unit: 'g / (m² · day)',
        dateOrVersion: '2023.03'
      }
    },
    greaseResistanceKit: {
      value: 4,
      provenance: {
        source: 'Packaging Standard Lab 2023',
        sourceType: 'Rule derived',
        dateOrVersion: '2023'
      }
    },
    maxOperatingTempC: 70,
    minOperatingTempC: 0,
    microwaveSafe: false,
    freezerSafe: false,
    hotOilResistant: false,
    steamVentingCompatible: true,
    sustainabilityRating: 70,
    biodegradable: false,
    recyclabilityCode: 'PP 05',
    carbonFootprintKgCO2ePerKg: 1.85,
    estimatedCostPerUnitINR: 1.80,
    suitableForTakeaway: false,
    suitableForFreshProduce: true,
    suitableForLongShelfLife: false,
    typicalApplications: ['Broccoli', 'Mushrooms', 'Berries', 'Cut Greens', 'Capsicum', 'Mangoes']
  },
  {
    id: 'mat_metallized_pet_foil_pouch',
    name: 'Multi-layer High-Barrier Stand-Up Pouch (PET / ALOX / LLDPE)',
    code: 'BARRIER-ALOX-110',
    category: 'Engineered Barrier',
    description: '3-ply laminated structure with aluminium oxide nano-coating providing near-zero oxygen and moisture transmission for extended shelf stability.',
    structureType: 'Lamination',
    thicknessRangeMicrons: { min: 90, max: 130, standard: 110 },
    otr: {
      value: 0.65,
      provenance: {
        source: 'Wiley Encyclopedia of Packaging Technology, Chapter on Vacuum Deposition',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985 Coulometric Sensor',
        testTemperatureC: 23,
        testRelativeHumidity: 0,
        thicknessMicrons: 110,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2022'
      }
    },
    wvtr: {
      value: 0.45,
      provenance: {
        source: 'Mocon Permatran-W Model 3/34 Test Report',
        sourceType: 'Laboratory measured',
        testMethod: 'ASTM F1249 Modulated IR',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 110,
        unit: 'g / (m² · day)',
        dateOrVersion: '2024.01'
      }
    },
    greaseResistanceKit: {
      value: 12,
      provenance: {
        source: 'ISO 16532-1 Barrier Test',
        sourceType: 'Validated database',
        dateOrVersion: '2023'
      }
    },
    maxOperatingTempC: 100,
    minOperatingTempC: -25,
    microwaveSafe: false,
    freezerSafe: true,
    hotOilResistant: true,
    steamVentingCompatible: false,
    sustainabilityRating: 48,
    biodegradable: false,
    recyclabilityCode: 'OTHER 07 (Multilayer)',
    carbonFootprintKgCO2ePerKg: 3.40,
    estimatedCostPerUnitINR: 7.20,
    suitableForTakeaway: false,
    suitableForFreshProduce: false,
    suitableForLongShelfLife: true,
    typicalApplications: ['Roasted Coffee Beans', 'Potato Crisps / Namkeen', 'Spices & Masalas', 'Dehydrated Fruits', 'Powdered Nutraceuticals']
  },
  {
    id: 'mat_corrugated_flute_e_vented',
    name: 'Ventilated E-Flute Micro-Corrugated Box with Grease Barrier Insert',
    code: 'CORR-EFLUTE-VENT',
    category: 'Cellulose / Paper',
    description: 'Double-walled recyclable corrugated board engineered with side chimney vents to relieve moisture vapor while sustaining 12kg top stacking load.',
    structureType: 'Aqueous Coated Board',
    thicknessRangeMicrons: { min: 1100, max: 1500, standard: 1200 },
    otr: {
      value: 2500,
      provenance: {
        source: 'Forest Products Laboratory Technical Note FPL-TN-24',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 50,
        thicknessMicrons: 1200,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2020'
      }
    },
    wvtr: {
      value: 320,
      provenance: {
        source: 'TAPPI T448 Water Vapor Transmission',
        sourceType: 'Published literature',
        testMethod: 'TAPPI T448',
        testTemperatureC: 23,
        testRelativeHumidity: 50,
        thicknessMicrons: 1200,
        unit: 'g / (m² · day)',
        dateOrVersion: '2020'
      }
    },
    greaseResistanceKit: {
      value: 9, // with parchment paper / greaseproof food-grade insert
      provenance: {
        source: 'TAPPI T559 Test Report with Vegetable Parchment Liner',
        sourceType: 'Validated database',
        dateOrVersion: '2023'
      }
    },
    maxOperatingTempC: 180,
    minOperatingTempC: -20,
    microwaveSafe: false,
    freezerSafe: false,
    hotOilResistant: true,
    steamVentingCompatible: true,
    sustainabilityRating: 92,
    biodegradable: true,
    compostableStandard: 'Home Compostable (Unprinted/Soy Ink)',
    recyclabilityCode: 'PAP 20 (100% Recyclable)',
    carbonFootprintKgCO2ePerKg: 0.95,
    estimatedCostPerUnitINR: 7.50,
    suitableForTakeaway: true,
    suitableForFreshProduce: true,
    suitableForLongShelfLife: false,
    typicalApplications: ['Artisan Pizza', 'Catering Platters', 'Fried Chicken Buckets', 'Pie / Tart Boxes']
  },
  {
    id: 'mat_rpet_transparent_tamper_evident',
    name: '100% Recycled Post-Consumer PET (rPET) Hinged Clamshell',
    code: 'RPET-CLEAR-100',
    category: 'Commodity Polymers',
    description: 'Food-grade certified rPET with superior visual clarity, anti-fog inner coating, and audible perimeter tamper-evident lock tabs.',
    structureType: 'Thermoformed',
    thicknessRangeMicrons: { min: 300, max: 450, standard: 380 },
    otr: {
      value: 65,
      provenance: {
        source: 'Journal of Applied Polymer Science: rPET Mechanical and Gas Barrier',
        sourceType: 'Published literature',
        testMethod: 'ASTM D3985',
        testTemperatureC: 23,
        testRelativeHumidity: 0,
        thicknessMicrons: 380,
        unit: 'cc / (m² · day · atm)',
        dateOrVersion: '2023.08'
      }
    },
    wvtr: {
      value: 12,
      provenance: {
        source: 'Journal of Applied Polymer Science',
        sourceType: 'Published literature',
        testMethod: 'ASTM F1249',
        testTemperatureC: 38,
        testRelativeHumidity: 90,
        thicknessMicrons: 380,
        unit: 'g / (m² · day)',
        dateOrVersion: '2023.08'
      }
    },
    greaseResistanceKit: {
      value: 12,
      provenance: {
        source: 'European Food Safety Authority (EFSA) rPET Safety Opinion',
        sourceType: 'Validated database',
        dateOrVersion: '2022'
      }
    },
    maxOperatingTempC: 65,
    minOperatingTempC: -20,
    microwaveSafe: false,
    freezerSafe: true,
    hotOilResistant: false, // Will warp above 65°C
    steamVentingCompatible: false,
    sustainabilityRating: 82,
    biodegradable: false,
    recyclabilityCode: 'PET 01 (Highest Circularity)',
    carbonFootprintKgCO2ePerKg: 1.25,
    estimatedCostPerUnitINR: 4.50,
    suitableForTakeaway: true,
    suitableForFreshProduce: true,
    suitableForLongShelfLife: false,
    typicalApplications: ['Cold Salads', 'Cut Fruits', 'Bakery / Pastries', 'Sushi Rolls', 'Cold Desserts']
  }
];

export const SEED_FOODS: FoodCommodity[] = [
  {
    id: 'food_biryani_chicken',
    name: 'Hyderabadi Chicken Biryani',
    category: 'Prepared Meal',
    defaultState: 'Cooked / Hot',
    moistureContentPercent: 58,
    waterActivity: 0.94,
    pH: 5.6,
    fatContentPercent: 14.5,
    steamGenerationRisk: 'Extreme',
    crispnessSensitivity: 'Medium',
    greaseMigrationTendency: 'High',
    acidFatReactionRisk: 'Moderate',
    provenance: {
      source: 'National Institute of Nutrition (NIN) Indian Food Composition Tables (IFCT 2017)',
      sourceType: 'Validated database',
      dateOrVersion: '2017/2021'
    }
  },
  {
    id: 'food_crispy_fried_chicken',
    name: 'Crispy Fried Chicken / Nuggets',
    category: 'Fried Food',
    defaultState: 'Cooked / Hot',
    moistureContentPercent: 42,
    waterActivity: 0.88,
    pH: 6.2,
    fatContentPercent: 19.8,
    steamGenerationRisk: 'Extreme',
    crispnessSensitivity: 'Critical',
    greaseMigrationTendency: 'High',
    acidFatReactionRisk: 'Low',
    provenance: {
      source: 'Journal of Food Engineering, Vol 112: Moisture Migration in Batter Crust',
      sourceType: 'Published literature',
      dateOrVersion: '2019'
    }
  },
  {
    id: 'food_butter_chicken_curry',
    name: 'Butter Chicken Gravy / Rogan Josh',
    category: 'Curry / Liquid',
    defaultState: 'Cooked / Hot',
    moistureContentPercent: 76,
    waterActivity: 0.97,
    pH: 4.8,
    fatContentPercent: 18.2,
    steamGenerationRisk: 'High',
    crispnessSensitivity: 'None',
    greaseMigrationTendency: 'High',
    acidFatReactionRisk: 'High',
    provenance: {
      source: 'Indian Food Composition Tables (NIN-ICMR)',
      sourceType: 'Validated database',
      dateOrVersion: '2017'
    }
  },
  {
    id: 'food_artisan_pizza',
    name: 'Wood-Fired Neapolitan Pizza',
    category: 'Prepared Meal',
    defaultState: 'Cooked / Hot',
    moistureContentPercent: 48,
    waterActivity: 0.91,
    pH: 5.2,
    fatContentPercent: 11.0,
    steamGenerationRisk: 'Extreme',
    crispnessSensitivity: 'Critical',
    greaseMigrationTendency: 'Medium',
    acidFatReactionRisk: 'Moderate',
    provenance: {
      source: 'USDA FoodData Central / Italian Food Science Journal',
      sourceType: 'Validated database',
      dateOrVersion: '2023'
    }
  },
  {
    id: 'food_fresh_strawberries',
    name: 'Fresh Strawberries',
    category: 'Fresh Produce',
    defaultState: 'Raw',
    moistureContentPercent: 91,
    waterActivity: 0.99,
    pH: 3.5,
    fatContentPercent: 0.3,
    respirationRateClass: 'Extremely High',
    respirationRateMgCO2PerKgHr: 45, // at 10°C
    steamGenerationRisk: 'None',
    crispnessSensitivity: 'High',
    greaseMigrationTendency: 'None',
    acidFatReactionRisk: 'High',
    provenance: {
      source: 'UC Davis Postharvest Technology Center Commodity Summaries',
      sourceType: 'Validated database',
      testMethod: 'Respirometer closed-cell chromatography at 10°C',
      dateOrVersion: '2022'
    }
  },
  {
    id: 'food_fresh_mushrooms',
    name: 'Fresh Button Mushrooms (Agaricus bisporus)',
    category: 'Fresh Produce',
    defaultState: 'Raw',
    moistureContentPercent: 92,
    waterActivity: 0.99,
    pH: 6.5,
    fatContentPercent: 0.4,
    respirationRateClass: 'Extremely High',
    respirationRateMgCO2PerKgHr: 80, // at 10°C
    steamGenerationRisk: 'None',
    crispnessSensitivity: 'None',
    greaseMigrationTendency: 'None',
    acidFatReactionRisk: 'Low',
    provenance: {
      source: 'FAO Agricultural Services Bulletin 152: Handling and Packaging of Fresh Mushrooms',
      sourceType: 'Published literature',
      dateOrVersion: '2020'
    }
  },
  {
    id: 'food_potato_chips_namkeen',
    name: 'Fried Potato Crisps / Bhujia Namkeen',
    category: 'Snack / Dry',
    defaultState: 'Ambient',
    moistureContentPercent: 2.2,
    waterActivity: 0.22,
    pH: 6.4,
    fatContentPercent: 34.0,
    steamGenerationRisk: 'None',
    crispnessSensitivity: 'Critical',
    greaseMigrationTendency: 'High',
    acidFatReactionRisk: 'High', // lipid oxidation
    provenance: {
      source: 'Food Chemistry, Vol 278: Lipid Oxidation Kinetics and Water Activity Isotherms',
      sourceType: 'Published literature',
      dateOrVersion: '2021'
    }
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'user_level1_demo',
    name: 'Ramesh Patel (Kisan Agro Farms)',
    email: 'farmer@kisanagro.in',
    role: 'LEVEL_1',
    roleName: 'Fresh Produce / Farmer',
    organization: 'Kisan Agro Producer Co-op',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_level2_demo',
    name: 'Chef Ananya Sharma',
    email: 'chef@spicecraftkitchen.com',
    role: 'LEVEL_2',
    roleName: 'Restaurant & Cloud Kitchen Partner',
    organization: 'SpiceCraft Gourmet Takeaways',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_level3_demo',
    name: 'Vikram Sethi',
    email: 'vikram@crunchynaturals.com',
    role: 'LEVEL_3',
    roleName: 'Packaged Food Startup Founder',
    organization: 'CrunchyNaturals FMCG Ltd',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_level4_demo',
    name: 'Dr. Priya Sundaram',
    email: 'priya.sundaram@iitkgp.ac.in',
    role: 'LEVEL_4',
    roleName: 'Packaging Engineer & Technologist',
    organization: 'Center for Food Packaging Technology',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_admin_demo',
    name: 'System Administrator (SIH Portal)',
    email: 'admin@foodpack.gov.in',
    role: 'ADMIN',
    roleName: 'Platform Administrator',
    organization: 'Smart India Hackathon SIH26236 Division',
    createdAt: new Date().toISOString()
  }
];

// Persistent state class with seed fallback
class DataStore {
  public users: User[] = [...SEED_USERS];
  public materials: PackagingMaterial[] = [...SEED_MATERIALS];
  public packageStyles: PackageStyle[] = [...SEED_PACKAGE_STYLES];
  public packingConfigurations: PackingConfiguration[] = [...SEED_PACKING_CONFIGURATIONS];
  public foods: FoodCommodity[] = [...SEED_FOODS];
  public recommendations: RecommendationRecord[] = [];
  public auditLogs: AuditLog[] = [
    {
      id: 'log_init',
      timestamp: new Date().toISOString(),
      userId: 'system',
      action: 'SYSTEM_BOOT',
      level: 'ALL',
      details: 'FOODPACK-AI decision-support core initialized with certified materials and SIH26236 rule engine.'
    }
  ];

  constructor() {
    this.seedDemoHistory();
  }

  private seedDemoHistory() {
    this.recommendations.push({
      id: 'REC-2026-TK8912',
      userId: 'user_level2_demo',
      userName: 'Chef Ananya Sharma',
      level: 'LEVEL_2',
      title: 'Chicken Dum Biryani Takeaway System (Single Serving)',
      foodName: 'Hyderabadi Chicken Biryani',
      components: ['Dum Basmati Rice', 'Marinated Chicken', 'Fried Onions (Birista)', 'Spiced Ghee Gravy', 'Separate Raita (Curd)'],
      foodProfile: {
        moistureContentPercent: 58,
        temperatureState: 'Hot (75°C - 85°C)',
        crispnessSensitivity: 'Medium',
        steamRisk: 'Extreme',
        greaseRisk: 'High',
        deliveryDuration: '45-60 min'
      },
      inputScenario: {
        deliveryMethod: 'Food delivery (Swiggy/Zomato)',
        deliveryTime: '30-60 minutes',
        foodCondition: 'Very hot',
        priorities: ['Prevent leakage', 'Reduce condensation', 'Keep food hot', 'Sustainability'],
        budget: 'Balanced',
        sustainability: 'Prefer biodegradable/compostable'
      },
      configuration: {
        containerName: 'Sugarcane Bagasse Deep Bowl with Micro-Vented Lid + PP Sauce Cup Insert',
        materialId: 'mat_bagasse_clamshell',
        structure: 'Molded bagasse fiber with natural plant-wax grease barrier (TAPPI Kit 8)',
        containerStyle: 'Round 750ml deep bowl with dual-perimeter leak lock',
        compartments: 'Single main container + 60ml external clip-on leakproof cup for Raita',
        lidType: 'Self-locking bagasse dome lid with calibrated 2mm steam chimney tab',
        venting: 'Directional steam vent (releases pressure while preventing ambient dust ingress)',
        sauceContainer: 'Hermetic twist-lock polypropylene cup (zero odor/temperature bleed to warm rice)',
        leakageProtection: 'Dual-step recessed rim seal preventing oil meniscus migration',
        greaseResistance: 'TAPPI T559 Kit Rating 8 (adequate for hot spiced animal fats up to 110°C)',
        moistureManagement: 'Breathable fiber wall absorbs boundary condensation without structural softening'
      },
      alternatives: [
        {
          name: 'PP Hermetic Dual-Compartment Tray',
          materialId: 'mat_pp_hermetic_compartment',
          costDelta: '+₹1.60',
          tradeoff: '100% leakproof for liquid gravies, but higher internal steam condensation risk if opened hot.'
        },
        {
          name: 'Ventilated Kraft Paperboard Box with Bio-Liner',
          materialId: 'mat_kraft_pla_vented',
          costDelta: '-₹0.40',
          tradeoff: 'Good crispness retention, but lower heat retention over 50 minutes delivery.'
        }
      ],
      whyExplanation: 'Sugarcane bagasse is scientifically superior for hot biryani over 45 minutes because traditional unvented plastic wraps trap 85°C steam, turning top rice soggy into mush. Bagasse fiber offers moderate natural vapor breathability (WVTR 280 g/m²·day) preventing the "rain effect" inside the lid while retaining meal core temperature above 62°C.',
      evidence: [
        {
          source: 'Journal of Cleaner Production, Vol 284',
          sourceType: 'Published literature',
          testMethod: 'ASTM D3985 / ASTM F1249',
          dateOrVersion: '2022'
        },
        {
          source: 'National Institute of Nutrition (NIN) Food Thermal Profiles',
          sourceType: 'Validated database',
          dateOrVersion: '2021'
        }
      ],
      assumptions: [
        'Serving temperature at dispatch is ~80°C.',
        'Ambient delivery temperature is 28°C - 34°C (typical Indian urban transit).',
        'Raita is packed cold (4°C - 8°C) in a separate hermetic vessel to avoid whey separation.'
      ],
      limitations: [
        'Bagasse without fluorochemicals should not be held with hot boiling liquid for > 3 hours.',
        'Not recommended for long-haul overnight shipping.'
      ],
      validationRequired: [
        'Drop test from 1.2 meters to simulate bike delivery courier vibration.',
        '30-minute tilt test at 45 degrees to verify lid perimeter clasp against oily curry splash.'
      ],
      costEstimate: {
        unitCostINR: 5.20,
        currency: 'INR',
        basis: 'Per 750ml container + lid + sauce cup (batch order > 2,000 units)'
      },
      sustainabilityScore: 94,
      aiMode: 'REAL',
      qrCodeUrl: '',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    });
  }

  public log(userId: string, action: string, level: string, details: string) {
    this.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      level,
      details
    });
    // Keep last 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
  }
}

export const dataStore = new DataStore();
