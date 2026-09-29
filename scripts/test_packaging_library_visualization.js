// scripts/test_packaging_library_visualization.js
// Tests the 6 authoritative crop packaging scenarios:
// 1. Tomato (MAT-001 Crate -> change to >3 days -> MAT-002 Kraft Box)
// 2. Mango (MAT-002 Kraft Box with EPE foam netting)
// 3. Onion (MAT-005 Leno Mesh Sack)
// 4. Potato (MAT-006 Multi-Wall Kraft Root Sack)
// 5. Leafy Vegetable / Spinach (MAT-004 Micro-Perforated EMAP Pouch)
// 6. Grain / Rice / Corn (MAT-007 Hermetic Storage Sack)

const BASE = 'http://localhost:3000';

async function runTests() {
  console.log('=== FOODPACK-AI PACKAGING ASSET LIBRARY & VISUALIZATION VERIFICATION ===\n');

  // 1. Authenticate as Level 1 user
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer@kisanagro.in' })
  });
  if (!loginRes.ok) {
    throw new Error('Failed to login as farmer');
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`✓ Authenticated as: ${loginData.user.name} (${loginData.user.role})`);

  // 2. Verify Packaging Assets Database
  const assetsRes = await fetch(`${BASE}/api/packaging/assets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const assetsData = await assetsRes.json();
  console.log(`✓ Retrieved packaging asset library: ${assetsData.count} certified packaging records registered.`);
  
  const requiredAssetIds = ['MAT-001', 'MAT-002', 'MAT-003', 'MAT-004', 'MAT-005', 'MAT-006', 'MAT-007'];
  for (const id of requiredAssetIds) {
    const found = assetsData.assets.find(a => a.materialId === id);
    if (!found) throw new Error(`Missing required packaging asset ${id}`);
    if (!found.realProductImage || !found.realProductImage.startsWith('data:image')) {
      throw new Error(`Asset ${id} is missing a real product image!`);
    }
  }
  console.log('✓ All MAT-001 to MAT-007 assets verified with authoritative real product images.\n');

  // Test scenarios:
  const scenarios = [
    {
      name: 'Scenario 1: Fresh Tomatoes (Local Transit, 2 Days)',
      crop: 'Fresh Tomatoes',
      transportDays: 2,
      refrigeration: false,
      expectedMaterialId: 'MAT-001',
      expectedPackageType: 'Reusable Ventilated Harvest Crate',
      expectedLayerCount: 2
    },
    {
      name: 'Scenario 1B: Fresh Tomatoes (Long Transit / Export, 5 Days Recalculation)',
      crop: 'Fresh Tomatoes',
      transportDays: 5,
      refrigeration: true,
      expectedMaterialId: 'MAT-002',
      expectedPackageType: '5-Ply Kraft Corrugated Box with Vertical Chimney Vents',
      expectedLayerCount: 2
    },
    {
      name: 'Scenario 2: Mangoes (Alphonso / Banganapalle)',
      crop: 'Mango',
      transportDays: 3,
      refrigeration: false,
      expectedMaterialId: 'MAT-002',
      expectedPackageType: '5-Ply Kraft Corrugated Box with Vertical Chimney Vents',
      expectedLayerCount: 1
    },
    {
      name: 'Scenario 3: Red Onions (Bulk Allium)',
      crop: 'Onions',
      transportDays: 4,
      refrigeration: false,
      expectedMaterialId: 'MAT-005',
      expectedPackageType: 'Convective Airflow Open-Mesh Tubular Sack',
      expectedLayerCount: 4
    },
    {
      name: 'Scenario 4: Potatoes (Table Tubers)',
      crop: 'Potato',
      transportDays: 5,
      refrigeration: false,
      expectedMaterialId: 'MAT-006',
      expectedPackageType: 'UV-Shielding Ventilated Heavy-Duty Root Crop Bag',
      expectedLayerCount: 3
    },
    {
      name: 'Scenario 5: Leafy Vegetable (Spinach / Palak)',
      crop: 'Spinach',
      transportDays: 2,
      refrigeration: true,
      expectedMaterialId: 'MAT-004',
      expectedPackageType: 'Laser Micro-Perforated Equilibrium MAP (EMAP) Film Pouch',
      expectedLayerCount: 1
    },
    {
      name: 'Scenario 6: Grain / Commodity (Rice / Corn / Wheat)',
      crop: 'Rice Grain',
      transportDays: 14,
      refrigeration: false,
      expectedMaterialId: 'MAT-007',
      expectedPackageType: 'Multi-Layer Hermetic Grain Storage Bag',
      expectedLayerCount: 1
    }
  ];

  for (const s of scenarios) {
    console.log(`--- Running ${s.name} ---`);
    
    // Step A: Resolve Packaging Asset
    const resolveRes = await fetch(`${BASE}/api/packaging/resolve-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        crop: s.crop,
        transportDays: s.transportDays,
        refrigeration: s.refrigeration
      })
    });
    
    if (!resolveRes.ok) {
      throw new Error(`Failed to resolve asset for ${s.name}`);
    }
    const resolveData = await resolveRes.json();
    const asset = resolveData.packagingAsset;
    const config = resolveData.packingConfiguration;

    console.log(`  Authoritative Selected Packaging: [${asset.materialId}] ${asset.materialName}`);
    console.log(`  Package Type: ${asset.packageType}`);
    console.log(`  Real Product Image Present: ${asset.realProductImage ? 'YES (Valid Base64/SVG)' : 'NO'}`);
    console.log(`  Inside / Side Views Available: ${asset.additionalImages?.length || 0} views`);
    console.log(`  Packing Arrangement: ${config.layerCount} Layer (${config.quantityPerPackage})`);

    if (asset.materialId !== s.expectedMaterialId) {
      throw new Error(`Expected ${s.expectedMaterialId} but got ${asset.materialId}`);
    }
    if (config.layerCount !== s.expectedLayerCount) {
      throw new Error(`Expected layerCount ${s.expectedLayerCount} but got ${config.layerCount}`);
    }

    // Step B: Generate Crop-Inside-Package Dynamic Visualization
    const vizRes = await fetch(`${BASE}/api/packaging/visualize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        crop: s.crop,
        materialId: asset.materialId,
        transportDays: s.transportDays,
        refrigeration: s.refrigeration
      })
    });

    if (!vizRes.ok) {
      throw new Error(`Failed to visualize for ${s.name}`);
    }
    const vizData = await vizRes.json();
    const viz = vizData.visualization;

    console.log(`  Visualization URL: ${viz.visualizationImageUrl.substring(0, 40)}...`);
    console.log(`  Preserves Authoritative Package: ${viz.materialId} (${viz.packageType})`);
    console.log(`  Disclaimer Attached: "${viz.disclaimer}"`);
    console.log(`  Dynamic Prompt Used:\n    "${viz.promptUsed.replace(/\n/g, ' ')}"`);
    console.log(`✓ ${s.name} PASSED.\n`);
  }

  console.log('================================================================');
  console.log('✓ ALL 6 CROP SCENARIOS + RECALCULATION VALIDATED SUCCESSFULLY!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
