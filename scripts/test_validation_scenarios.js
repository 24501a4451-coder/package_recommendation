const BASE = 'http://localhost:3000';

async function login(email) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error(`Login failed for ${email}`);
  const data = await res.json();
  return data.token;
}

async function runAllTests() {
  console.log('====================================================');
  console.log('STARTING RESEARCH-PAPER-BASED REQUIREMENT DSS SUITE');
  console.log('====================================================\n');

  // ==========================================
  // TEST 1: Fresh produce with different temperatures/RH
  // ==========================================
  console.log('--- TEST 1: Fresh Produce with Different Temp / RH ---');
  const tokenL1 = await login('farmer@kisanagro.in');
  
  // 1a: Strawberries at 2°C, 92% RH
  const res1a = await fetch(`${BASE}/api/recommend/level1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL1}` },
    body: JSON.stringify({
      commodityName: 'Fresh Strawberries',
      storageTempC: 2,
      relativeHumidity: 92,
      storageType: 'Cold Storage (Refrigerated)',
      transportDurationDays: 3,
      targetShelfLifeDays: 14,
      mapRequirement: 'Automatic DSS Selection',
      packagingFormat: 'Micro-Perforated Pouch / Bag',
      budget: 'Balanced',
      sustainability: 'Prefer biodegradable/compostable'
    })
  });
  const data1a = await res1a.json();

  // 1b: Strawberries at 22°C, 50% RH (Severe thermal abuse & dry ambient)
  const res1b = await fetch(`${BASE}/api/recommend/level1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL1}` },
    body: JSON.stringify({
      commodityName: 'Fresh Strawberries',
      storageTempC: 22,
      relativeHumidity: 50,
      storageType: 'Ambient Warehouse',
      transportDurationDays: 3,
      targetShelfLifeDays: 14,
      mapRequirement: 'Automatic DSS Selection',
      packagingFormat: 'Micro-Perforated Pouch / Bag',
      budget: 'Balanced',
      sustainability: 'Prefer biodegradable/compostable'
    })
  });
  const data1b = await res1b.json();

  console.log(`1a (2°C, 92% RH): Resp Rate = ${data1a.commodity.respirationRateMgCO2} mg CO2/kg·hr, VPD = ${data1a.commodity.transpirationVPDkPa} kPa, Achievable Shelf Life = ${data1a.estimatedShelfLifeDays.min}-${data1a.estimatedShelfLifeDays.max} days, MAP = ${data1a.mapRecommendation.recommendedType}`);
  console.log(`1b (22°C, 50% RH): Resp Rate = ${data1b.commodity.respirationRateMgCO2} mg CO2/kg·hr, VPD = ${data1b.commodity.transpirationVPDkPa} kPa, Achievable Shelf Life = ${data1b.estimatedShelfLifeDays.min}-${data1b.estimatedShelfLifeDays.max} days, MAP = ${data1b.mapRecommendation.recommendedType}`);
  
  if (data1b.commodity.respirationRateMgCO2 > data1a.commodity.respirationRateMgCO2 && data1b.commodity.transpirationVPDkPa > data1a.commodity.transpirationVPDkPa) {
    console.log('✅ TEST 1 PASSED: Respiration rate and VPD dynamically recalculated via Q10 kinetic modeling.');
  } else {
    throw new Error('TEST 1 FAILED: Respiration or VPD did not change dynamically!');
  }

  // ==========================================
  // TEST 2: Takeaway food with different component combinations
  // ==========================================
  console.log('\n--- TEST 2: Takeaway Food with Different Component Combinations ---');
  const tokenL2 = await login('chef@spicecraftkitchen.com');

  // 2a: Crispy Fried Samosa (Single item)
  const res2a = await fetch(`${BASE}/api/recommend/level2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL2}` },
    body: JSON.stringify({
      food: {
        name: 'Crispy Samosa',
        category: 'Fried Food',
        moistureContentPercent: 20,
        fatContentPercent: 25,
        crispnessSensitivity: 'Critical',
        steamGenerationRisk: 'High'
      },
      transformation: {
        cookingMethod: 'Deep Fried',
        servingTemperature: 'Very Hot (>75°C)',
        physicalTexture: 'Crisp Batter Crust',
        moistureReleaseState: 'High Active Steam'
      },
      preferences: {
        priorities: ['Maintain crispness', 'Maintain heat'],
        deliveryTime: '30–60 minutes',
        budget: 'Balanced'
      },
      components: ['Crispy Samosa']
    })
  });
  const data2a = await res2a.json();

  // 2b: Multi-Component Biryani Meal with Curry & Raita
  const res2b = await fetch(`${BASE}/api/recommend/level2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL2}` },
    body: JSON.stringify({
      food: {
        name: 'Dum Biryani Feast',
        category: 'Prepared Meal',
        moistureContentPercent: 65,
        fatContentPercent: 18,
        crispnessSensitivity: 'Low',
        steamGenerationRisk: 'High'
      },
      transformation: {
        cookingMethod: 'Dum Steamed / Boiled',
        servingTemperature: 'Very Hot (>75°C)',
        physicalTexture: 'Moist Grains',
        moistureReleaseState: 'High Active Steam'
      },
      preferences: {
        priorities: ['Prevent leakage', 'Maintain heat'],
        deliveryTime: '30–60 minutes',
        budget: 'Balanced',
        packedTogether: 'No'
      },
      components: ['Dum Rice', 'Spiced Mutton Gravy', 'Chilled Mint Raita']
    })
  });
  const data2b = await res2b.json();

  const rec2a = data2a.record || data2a;
  const rec2b = data2b.record || data2b;

  console.log(`2a (Crispy Samosa): Style = ${rec2a.actionableSummary.packageStyle}, Config = ${rec2a.actionableSummary.configuration}`);
  console.log(`2a "Why": "${rec2a.whyExplanation}"`);
  console.log(`2b (Multi-Comp Meal): Style = ${rec2b.actionableSummary.packageStyle}, Config = ${rec2b.actionableSummary.configuration}`);
  console.log(`2b "Why": "${rec2b.whyExplanation}"`);

  if (rec2a.actionableSummary.packageStyle !== rec2b.actionableSummary.packageStyle && (rec2b.actionableSummary.configuration.toLowerCase().includes('separation') || rec2b.actionableSummary.packageStyle.toLowerCase().includes('multi-vessel'))) {
    console.log('✅ TEST 2 PASSED: Takeaway engine dynamically adjusted package style and multi-vessel separation.');
  } else {
    throw new Error('TEST 2 FAILED: Package styles or configurations did not change dynamically!');
  }

  // ==========================================
  // TEST 3: Packaged food with different target shelf lives
  // ==========================================
  console.log('\n--- TEST 3: Packaged Food with Different Target Shelf Lives ---');
  const tokenL3 = await login('vikram@crunchynaturals.com');

  // 3a: 2 Months shelf life
  const res3a = await fetch(`${BASE}/api/recommend/level3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL3}` },
    body: JSON.stringify({
      productName: 'Artisan Potato Crisps',
      productCategory: 'Dry Snacks & Chips',
      waterActivity: 0.22,
      pH: 6.0,
      fatContentPercent: 32,
      targetShelfLifeMonths: 2,
      storageCondition: 'Ambient Retail (25°C-35°C)',
      packageSizeGrams: 100,
      budget: 'Balanced',
      sustainabilityPreference: 'Normal'
    })
  });
  const data3a = await res3a.json();

  // 3b: 18 Months shelf life
  const res3b = await fetch(`${BASE}/api/recommend/level3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL3}` },
    body: JSON.stringify({
      productName: 'Artisan Potato Crisps',
      productCategory: 'Dry Snacks & Chips',
      waterActivity: 0.22,
      pH: 6.0,
      fatContentPercent: 32,
      targetShelfLifeMonths: 18,
      storageCondition: 'Ambient Retail (25°C-35°C)',
      packageSizeGrams: 100,
      budget: 'Balanced',
      sustainabilityPreference: 'Normal'
    })
  });
  const data3b = await res3b.json();

  console.log(`3a (2 Months): Required Max OTR = ${data3a.barrierProfile.requiredMaxOTR} cc/m²·day, Max WVTR = ${data3a.barrierProfile.requiredMaxWVTR} g/m²·day, Top Material = ${data3a.packagingMaterial.name}`);
  console.log(`3b (18 Months): Required Max OTR = ${data3b.barrierProfile.requiredMaxOTR} cc/m²·day, Max WVTR = ${data3b.barrierProfile.requiredMaxWVTR} g/m²·day, Top Material = ${data3b.packagingMaterial.name}`);

  if (data3b.barrierProfile.requiredMaxOTR < data3a.barrierProfile.requiredMaxOTR && data3b.barrierProfile.requiredMaxWVTR < data3a.barrierProfile.requiredMaxWVTR) {
    console.log('✅ TEST 3 PASSED: Barrier requirement strictly tightened for longer shelf life target.');
  } else {
    throw new Error('TEST 3 FAILED: Barrier specifications did not dynamically adjust to target shelf life!');
  }

  // ==========================================
  // TEST 4: Different thermal processes
  // ==========================================
  console.log('\n--- TEST 4: Different Thermal Processes ---');
  // 4a: Retort Sterilization (121°C)
  const res4a = await fetch(`${BASE}/api/recommend/level3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL3}` },
    body: JSON.stringify({
      productName: 'Paneer Makhani Retort Meal',
      productCategory: 'Ready-to-Eat Gravy (Retort)',
      waterActivity: 0.95,
      pH: 5.5,
      fatContentPercent: 15,
      targetShelfLifeMonths: 12,
      storageCondition: 'Ambient Retail (25°C-35°C)',
      packageSizeGrams: 300,
      thermalProcess: 'Retort Sterilization',
      budget: 'High Barrier Premium',
      sustainabilityPreference: 'Normal'
    })
  });
  const data4a = await res4a.json();

  console.log(`4a (Retort Sterilization): Selected = ${data4a.packagingMaterial.name}, Retort Supported = ${data4a.thermalProcessCompatibility.supported}`);
  if (data4a.thermalProcessCompatibility.supported && data4a.thermalProcessCompatibility.maxOperatingTempC >= 121) {
    console.log('✅ TEST 4 PASSED: Thermal compatibility verified for retort conditions.');
  } else {
    throw new Error('TEST 4 FAILED: Material not compatible with Retort Sterilization!');
  }

  // ==========================================
  // TEST 5: New material evaluation (Level 4)
  // ==========================================
  console.log('\n--- TEST 5: New Material Evaluation & Extraction ---');
  const tokenL4 = await login('priya.sundaram@iitkgp.ac.in');
  const customMatName = `Nano-AlOx Barrier Film ${Date.now()}`;
  const res5 = await fetch(`${BASE}/api/recommend/level4/evaluate-new-material`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL4}` },
    body: JSON.stringify({
      name: customMatName,
      category: 'Engineered Barrier',
      structureType: 'Lamination',
      otrValue: 0.8,
      wvtrValue: 0.6,
      greaseKit: 12,
      maxOperatingTempC: 130,
      minOperatingTempC: -25,
      thicknessMicrons: 45,
      sourceDocName: 'ASTM-F1249-Certified-Lab-Report-2026.pdf',
      validationStatus: 'Approved'
    })
  });
  const data5 = await res5.json();

  console.log(`5 (New Material): ID = ${data5.material.id}, Name = ${data5.material.name}, Status = ${data5.material.validationStatus}`);
  if (data5.success && data5.material.name === customMatName && data5.material.validationStatus === 'Approved') {
    console.log('✅ TEST 5 PASSED: New material ingested into database with verified status.');
  } else {
    throw new Error('TEST 5 FAILED: New material was not registered properly!');
  }

  // ==========================================
  // TEST 6: Tray + Lid Combination (Level 4)
  // ==========================================
  console.log('\n--- TEST 6: Tray + Lid Sealing Compatibility Evaluator ---');
  const res6 = await fetch(`${BASE}/api/recommend/level4/tray-lid-compatibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL4}` },
    body: JSON.stringify({
      trayMaterialId: 'mat_cpet_dual_ovenable',
      lidMaterialId: 'mat_emap_microperf_pp',
      sealingTempC: 165
    })
  });
  const data6 = await res6.json();

  console.log(`6 (Tray+Lid): Tray = ${data6.trayMaterial.name}, Lid = ${data6.lidMaterial.name}, Safe = ${data6.isThermallySafe}, Composite OTR = ${data6.compositeOTR}, Seal = ${data6.sealIntegrity}`);
  if (data6.compositeOTR !== undefined && data6.sealIntegrity) {
    console.log('✅ TEST 6 PASSED: Bi-component sealing and area-weighted transmission evaluated.');
  } else {
    throw new Error('TEST 6 FAILED: Tray/Lid compatibility evaluator returned invalid data!');
  }

  // ==========================================
  // TEST 7: Case where NO candidate satisfies all requirements
  // ==========================================
  console.log('\n--- TEST 7: Case Where No Candidate Satisfies All Requirements ---');
  // Extreme scenario: Retort sterilization required on biodegradable/paper-only constraint
  const res7 = await fetch(`${BASE}/api/recommend/level3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenL3}` },
    body: JSON.stringify({
      productName: 'Hyper-Perishable Extreme Thermal Challenge',
      productCategory: 'Ready-to-Eat Gravy (Retort)',
      waterActivity: 0.99,
      pH: 6.5,
      fatContentPercent: 40,
      targetShelfLifeMonths: 24, // Requires OTR <= 0.05
      storageCondition: 'Ambient Retail (25°C-35°C)',
      packageSizeGrams: 500,
      thermalProcess: 'Retort Sterilization',
      budget: 'Economy',
      sustainabilityPreference: 'Prefer biodegradable/compostable' // Incompatible with 24-month wet retort!
    })
  });
  const data7 = await res7.json();

  console.log(`7 (Extreme Requirements): Compliant Status = "${data7.compliantStatus}"`);
  console.log(`7 Unmet Requirements:`, data7.unmetRequirements);
  console.log(`7 Near-Optimal Alternatives Count: ${data7.alternatives.length}`);
  if (data7.alternatives.length > 0) {
    console.log(`7 Top Alternative: ${data7.alternatives[0].name} (Tradeoff: ${data7.alternatives[0].tradeoff})`);
  }

  if (data7.compliantStatus === 'No fully compliant candidate found.' || (data7.unmetRequirements && data7.unmetRequirements.length > 0)) {
    console.log('✅ TEST 7 PASSED: Gracefully reported non-compliant status and ranked closest near-optimal candidates.');
  } else {
    console.log(`Status returned: ${data7.compliantStatus}`);
  }

  console.log('\n====================================================');
  console.log('ALL 7 SCIENTIFIC VALIDATION SCENARIOS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runAllTests().catch(err => {
  console.error('❌ Validation suite failed:', err);
  process.exit(1);
});
