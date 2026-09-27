export interface FailureDiagnosisInput {
  observedProblem:
    | 'Soggy Food / Loss of Crispness'
    | 'Internal Condensation / Puddling'
    | 'Liquid Leakage / Splashing'
    | 'Grease Bleed / Bottom Softening'
    | 'Food Arriving Cold (Temperature Loss)'
    | 'Odor Transfer / Taint'
    | 'Package Crushing / Structural Collapse'
    | 'Premature Spoilage / Mold';
  foodType: string;
  deliveryDurationMinutes: number;
  currentPackagingMaterial: string;
  ventingPresent: 'Yes' | 'No' | 'Unsure';
  stackingCount?: number;
}

export interface FailureDiagnosisResult {
  observedProblem: string;
  primaryRootCause: string;
  contributingMechanisms: string[];
  scientificEvidence: string[];
  recommendedInvestigation: string[];
  correctivePackagingChange: string;
  validationRequired: string[];
  disclaimer: string;
}

export class FailureDiagnosisEngine {
  public diagnose(input: FailureDiagnosisInput): FailureDiagnosisResult {
    const p = input.observedProblem;

    if (p === 'Soggy Food / Loss of Crispness' || p === 'Internal Condensation / Puddling') {
      return {
        observedProblem: p,
        primaryRootCause: 'Headspace Steam Vapor Saturation and Lid Condensation ("The Rain Effect")',
        contributingMechanisms: [
          'Food packaged above 70°C emits high partial pressure water vapor.',
          'If lid lacks calibrated chimney vents or breathable fiber, vapor hits cold boundary lid surface (<55°C) and condenses into liquid droplets.',
          'Liquid water drips onto hot crust, causing starch retrogradation and structural collapse of fried batter/pizza crust.'
        ],
        scientificEvidence: [
          'Journal of Food Engineering: Moisture sorption isotherms show critical crispness threshold is exceeded when crust Aw surpasses 0.45.',
          'Thermodynamic condensation occurs when inner wall temperature drops below the dew point of the 100% RH headspace.'
        ],
        recommendedInvestigation: [
          'Inspect inner lid immediately upon customer opening for beaded moisture droplets.',
          'Measure crust temperature and moisture before packaging vs after 30 minutes.'
        ],
        correctivePackagingChange: 'Switch to Molded Sugarcane Bagasse with Calibrated Chimney Micro-Vents or E-Flute Corrugated Box with Perforated Risers. Ensure minimum WVTR of 200 g/m²·day.',
        validationRequired: [
          'Sensory Crispness Acoustic Penetration Test (Texture Analyzer) over 45 minutes.',
          'Headspace Relative Humidity Data-Logger Logging during transit.'
        ],
        disclaimer: 'Physical moisture analysis only. Does not replace microbiological shelf-life assessment.'
      };
    }

    if (p === 'Liquid Leakage / Splashing') {
      return {
        observedProblem: p,
        primaryRootCause: 'Hydrostatic Pressure & Capillary Seam Failure during Courier Transit',
        contributingMechanisms: [
          'Curries with low viscosity and high surface tension seep through friction-fit lids under vehicle vibration.',
          'Spiced lipids lower liquid surface tension, enabling capillary creeping along rim corners.',
          'Molded fiber containers without perimeter mechanical gasket allow oil/water absorption along raw cut edges.'
        ],
        scientificEvidence: [
          'ASTM D3078 standard for leak detection by bubble emission.',
          'Capillary flow in porous fiber media driven by Washburn equation.'
        ],
        recommendedInvestigation: [
          'Conduct 45-degree angle static tilt test with colored water for 30 minutes.',
          'Perform drop vibration test mimicking two-wheeler delivery crate shaking.'
        ],
        correctivePackagingChange: 'Adopt Food-Grade Polypropylene (PP) with Silicone-like Hermetic Snap Channel or Ultrasonic Heat-Sealed Lidding Film for hot liquid gravies.',
        validationRequired: [
          'ASTM D5276 Courier Drop Test (1.2m drop test onto concrete floor).',
          'Inverted Incline Ingress Test at 60°C.'
        ],
        disclaimer: 'Physical containment test only. Seals must also be certified for food contact under local regulation.'
      };
    }

    if (p === 'Grease Bleed / Bottom Softening') {
      return {
        observedProblem: p,
        primaryRootCause: 'Insufficient Lipid Barrier (TAPPI T559 Kit Rating < 7) & Plasticization by Free Hot Fatty Acids',
        contributingMechanisms: [
          'Animal fats and heated vegetable oils (above 75°C) solubilize and migrate through standard cellulose boards.',
          'Weak aqueous coatings dissolve or swell when exposed to acidic gravies and hot lipids simultaneously.'
        ],
        scientificEvidence: [
          'TAPPI T559 Kit Test standard for grease resistance of paper and board.',
          'ISO 16532-1 Determination of grease resistance of paperboard.'
        ],
        recommendedInvestigation: [
          'Apply 30-minute hot oil puddle test with stained lard at 80°C to container floor.',
          'Measure loss of tensile Mullen burst strength when wetted with cooking oil.'
        ],
        correctivePackagingChange: 'Specify certified fluorochemical-free (PFAS-free) bio-wax or bio-PLA internal dispersion coating rated to minimum TAPPI Kit 8 to 10.',
        validationRequired: [
          'Overall Migration Limit testing under 10% ethanol and olive oil simulant (FSSAI/EU 10/2011).',
          '60-minute holding test with hot spiced ghee at 85°C.'
        ],
        disclaimer: 'Grease resistance does not guarantee long-term shelf stability without barrier verification.'
      };
    }

    if (p === 'Food Arriving Cold (Temperature Loss)') {
      return {
        observedProblem: p,
        primaryRootCause: 'High Thermal Conductivity of Single-Wall Material & Convective Transit Cooling',
        contributingMechanisms: [
          'Thin single-wall thermoformed plastic has high thermal transmission (U-value > 4.5 W/m²K).',
          'Motorcycle delivery speeds (30–50 km/h) dramatically increase convective heat loss from outer surfaces.'
        ],
        scientificEvidence: [
          'Fourier’s Law of Thermal Conduction: Heat flux is directly proportional to temperature gradient and inversely to wall thermal resistance.',
          'Newton’s Law of Cooling under forced air convection.'
        ],
        recommendedInvestigation: [
          'Place thermocouple probe in food geometric center; record time-temperature curve for 45 minutes.',
          'Check delivery bag thermal insulation and closure tightness.'
        ],
        correctivePackagingChange: 'Switch to cellular Molded Bagasse Fiber or Double-Walled Insulated Paperboard. Pair with an insulated thermal courier delivery pouch.',
        validationRequired: [
          'Time-temperature decay curve: Ensure food core temperature stays strictly above 60°C (food safety danger zone boundary).'
        ],
        disclaimer: 'Hot food holding must comply with local food safety regulations (>60°C hot holding).'
      };
    }

    // Default / general fallback failure diagnosis
    return {
      observedProblem: p,
      primaryRootCause: 'Multi-factorial Structural or Environmental Incompatibility',
      contributingMechanisms: [
        'Storage temperature and ambient humidity incompatible with current barrier specs.',
        'Mechanical compression load exceeded during stacking in transport.'
      ],
      scientificEvidence: [
        'ASTM D4169 Performance Testing of Shipping Containers and Systems.'
      ],
      recommendedInvestigation: [
        'Inspect compression creases on bottom cartons in stack.',
        'Measure headspace gas composition using portable O2/CO2 analyzer.'
      ],
      correctivePackagingChange: 'Re-evaluate primary and secondary packaging structural rigidity and barrier thickness.',
      validationRequired: [
        'Stacking Compression Strength Test (ASTM D642).'
      ],
      disclaimer: 'Root cause analysis requires physical laboratory verification.'
    };
  }
}

export const failureDiagnosisEngine = new FailureDiagnosisEngine();
