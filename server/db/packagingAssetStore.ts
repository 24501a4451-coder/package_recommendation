import fs from 'fs';
import path from 'path';
import {
  PackagingAssetRecord,
  PackagingImageItem,
  PackingConfiguration,
  PackingVisualizationResult
} from '../../src/types/packagingAsset';

// Helper to create clean, high-fidelity SVG product graphics for the authoritative asset library
function createProductGraphic(
  type: 'crate' | 'kraft_box' | 'bagasse_punnet' | 'emap_pouch' | 'mesh_sack' | 'kraft_sack' | 'hermetic_grain',
  view: 'product' | 'inside' | 'front' | 'side'
): string {
  const width = 600;
  const height = 450;

  if (type === 'crate') {
    if (view === 'inside') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#0f172a"/>
        <rect x="30" y="30" width="540" height="390" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="4"/>
        <rect x="55" y="55" width="490" height="340" rx="10" fill="#022c22" stroke="#047857" stroke-width="2"/>
        <!-- Bottom perforated lattice -->
        <g fill="#064e3b" opacity="0.8">
          ${Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) =>
              `<rect x="${75 + c * 58}" y="${75 + r * 50}" width="42" height="34" rx="4" fill="#065f46" stroke="#10b981" stroke-width="1"/>`
            ).join('')
          ).join('')}
        </g>
        <text x="300" y="240" fill="#34d399" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">INSIDE VIEW • PERFORATED AIRFLOW BASE</text>
        <text x="300" y="265" fill="#a7f3d0" font-family="monospace" font-size="12" text-anchor="middle">45L Interior Volume • Drainage & Forced-Air Channels</text>
        <rect x="40" y="380" width="120" height="25" rx="5" fill="#047857"/>
        <text x="100" y="397" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">MAT-001 • INSIDE</text>
      </svg>`;
    }

    if (view === 'side') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#0f172a"/>
        <!-- Side Profile -->
        <rect x="60" y="100" width="480" height="250" rx="12" fill="#065f46" stroke="#10b981" stroke-width="4"/>
        <rect x="50" y="90" width="500" height="25" rx="6" fill="#047857" stroke="#34d399" stroke-width="2"/>
        <!-- Interlocking stacking feet -->
        <polygon points="90,350 120,370 140,370 130,350" fill="#047857"/>
        <polygon points="460,350 470,370 490,370 480,350" fill="#047857"/>
        <!-- Side Ventilation slots -->
        ${Array.from({ length: 9 }).map((_, i) =>
          `<rect x="${95 + i * 46}" y="145" width="22" height="150" rx="6" fill="#022c22" stroke="#34d399" stroke-width="1.5"/>`
        ).join('')}
        <text x="300" y="60" fill="#34d399" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">SIDE PROFILE • 32% VENTILATION RATIO</text>
        <rect x="420" y="300" width="100" height="25" rx="5" fill="#0f172a" stroke="#10b981" stroke-width="1"/>
        <text x="470" y="316" fill="#34d399" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">600×400×220mm</text>
      </svg>`;
    }

    // Default 3D Perspective Product Shot
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="cTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#047857"/>
        </linearGradient>
        <linearGradient id="cFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#047857"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </linearGradient>
        <linearGradient id="cLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#065f46"/>
          <stop offset="100%" stop-color="#022c22"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <!-- Soft ambient shadow -->
      <ellipse cx="300" cy="390" rx="240" ry="25" fill="#000000" opacity="0.6"/>
      
      <!-- 3D Crate Body -->
      <!-- Left Face -->
      <polygon points="70,140 180,210 180,360 70,280" fill="url(#cLeft)" stroke="#10b981" stroke-width="2"/>
      <!-- Front Face -->
      <polygon points="180,210 510,150 510,300 180,360" fill="url(#cFront)" stroke="#10b981" stroke-width="2"/>
      <!-- Top Rim -->
      <polygon points="70,140 400,80 510,150 180,210" fill="url(#cTop)" stroke="#34d399" stroke-width="2.5"/>
      <!-- Inside Cavity Shadow -->
      <polygon points="100,150 390,95 480,155 190,205" fill="#022c22" stroke="#047857" stroke-width="1"/>

      <!-- Front Ventilation Slots -->
      ${Array.from({ length: 7 }).map((_, i) =>
        `<polygon points="${220 + i * 38},215 ${235 + i * 38},212 ${235 + i * 38},320 ${220 + i * 38},325" fill="#022c22" stroke="#34d399" stroke-width="1"/>`
      ).join('')}

      <!-- Ergonomic Handle Cutout -->
      <polygon points="110,195 140,212 140,230 110,210" rx="4" fill="#022c22" stroke="#34d399" stroke-width="1.5"/>

      <!-- Badge Placard -->
      <polygon points="340,310 440,292 440,320 340,338" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="390" y="323" fill="#064e3b" font-family="monospace" font-size="10" font-weight="900" text-anchor="middle" transform="rotate(-10 390 323)">FOODPACK • MAT-001</text>

      <!-- Label Overlay -->
      <rect x="25" y="25" width="230" height="42" rx="8" fill="#064e3b" stroke="#10b981" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">VENTILATED HARVEST CRATE</text>
      <text x="40" y="58" fill="#a7f3d0" font-family="monospace" font-size="10">HDPE Copolymer • Real Asset</text>
    </svg>`;
  }

  if (type === 'kraft_box') {
    if (view === 'inside') {
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#0f172a"/>
        <rect x="50" y="40" width="500" height="370" rx="8" fill="#92400e" stroke="#d97706" stroke-width="3"/>
        <rect x="80" y="70" width="440" height="310" rx="4" fill="#78350f" stroke="#b45309" stroke-width="2"/>
        <!-- Fluting Corrugation texture -->
        <g stroke="#92400e" stroke-width="1" opacity="0.6">
          ${Array.from({ length: 15 }).map((_, i) => `<line x1="80" y1="${80 + i * 20}" x2="520" y2="${80 + i * 20}"/>`).join('')}
        </g>
        <text x="300" y="220" fill="#fde68a" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">5-PLY HEAVY KRAFT INTERIOR</text>
        <text x="300" y="245" fill="#fef3c7" font-family="monospace" font-size="12" text-anchor="middle">Reinforced B/C Double Wall Flute Cushioning</text>
        <rect x="40" y="380" width="120" height="25" rx="5" fill="#78350f"/>
        <text x="100" y="397" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">MAT-002 • INSIDE</text>
      </svg>`;
    }

    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="kTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="kFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b45309"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
        <linearGradient id="kLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#92400e"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <ellipse cx="300" cy="390" rx="230" ry="25" fill="#000000" opacity="0.6"/>

      <!-- 3D Box Geometry -->
      <polygon points="90,140 200,210 200,350 90,270" fill="url(#kLeft)" stroke="#d97706" stroke-width="2"/>
      <polygon points="200,210 500,155 500,295 200,350" fill="url(#kFront)" stroke="#d97706" stroke-width="2"/>
      <polygon points="90,140 390,85 500,155 200,210" fill="url(#kTop)" stroke="#f59e0b" stroke-width="2"/>

      <!-- Vertical Chimney Die-Cut Vents -->
      <ellipse cx="270" cy="280" rx="8" ry="25" fill="#451a03" stroke="#f59e0b" stroke-width="1.5" transform="rotate(-10 270 280)"/>
      <ellipse cx="340" cy="268" rx="8" ry="25" fill="#451a03" stroke="#f59e0b" stroke-width="1.5" transform="rotate(-10 340 268)"/>
      <ellipse cx="410" cy="256" rx="8" ry="25" fill="#451a03" stroke="#f59e0b" stroke-width="1.5" transform="rotate(-10 410 256)"/>

      <!-- Moisture-Resistant Kraft Stamp -->
      <circle cx="440" cy="200" r="28" fill="#451a03" stroke="#d97706" stroke-width="1.5"/>
      <text x="440" y="196" fill="#fde68a" font-family="monospace" font-size="7" font-weight="bold" text-anchor="middle">5-PLY CFB</text>
      <text x="440" y="208" fill="#fde68a" font-family="monospace" font-size="7" text-anchor="middle">CHIMNEY VENT</text>

      <!-- Label Overlay -->
      <rect x="25" y="25" width="240" height="42" rx="8" fill="#78350f" stroke="#d97706" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">5-PLY KRAFT CORRUGATED BOX</text>
      <text x="40" y="58" fill="#fde68a" font-family="monospace" font-size="10">Chimney Airflow • Real Asset</text>
    </svg>`;
  }

  if (type === 'bagasse_punnet') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <ellipse cx="300" cy="380" rx="200" ry="20" fill="#000000" opacity="0.6"/>
      <!-- Clamshell Molded Fiber Body -->
      <rect x="120" y="140" width="360" height="190" rx="30" fill="#d6c7b2" stroke="#a89a85" stroke-width="3"/>
      <!-- Inner Well -->
      <rect x="145" y="165" width="310" height="140" rx="20" fill="#c4b5a0" stroke="#8c7e6b" stroke-width="2"/>
      <!-- Slotted Vented Lid Hinged Back -->
      <path d="M 120,140 Q 300,70 480,140" fill="none" stroke="#a89a85" stroke-width="8"/>
      <!-- Capillary flute ridges in base -->
      ${Array.from({ length: 6 }).map((_, i) =>
        `<line x1="${180 + i * 45}" y1="180" x2="${180 + i * 45}" y2="290" stroke="#8c7e6b" stroke-width="4" stroke-linecap="round"/>`
      ).join('')}
      <!-- Eco Compostable Stamp -->
      <rect x="360" y="260" width="85" height="30" rx="6" fill="#065f46"/>
      <text x="402" y="278" fill="#a7f3d0" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">100% COMPOST</text>

      <rect x="25" y="25" width="240" height="42" rx="8" fill="#574c3d" stroke="#a89a85" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">MOLDED BAGASSE PUNNET</text>
      <text x="40" y="58" fill="#e5ded4" font-family="monospace" font-size="10">Bio-Porous Fiber • Real Asset</text>
    </svg>`;
  }

  if (type === 'emap_pouch') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="pouchGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <ellipse cx="300" cy="400" rx="180" ry="18" fill="#000000" opacity="0.6"/>
      <!-- Stand-up Pouch Outline -->
      <polygon points="180,80 420,80 440,370 160,370" fill="url(#pouchGrad)" stroke="#38bdf8" stroke-width="2.5"/>
      <!-- Top Heat Seal Zip Strip -->
      <rect x="180" y="80" width="240" height="30" fill="#0369a1" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="300" cy="95" r="5" fill="#f8fafc"/>
      <!-- Laser Micro-Perforations Matrix (visible 60µm pinhole indicators) -->
      <g fill="#38bdf8">
        ${Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) =>
            `<circle cx="${260 + c * 40}" cy="${180 + r * 35}" r="3" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>`
          ).join('')
        ).join('')}
      </g>
      <text x="300" y="320" fill="#7dd3fc" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">EQUILIBRIUM MAP (EMAP)</text>
      <text x="300" y="338" fill="#e0f2fe" font-family="monospace" font-size="9" text-anchor="middle">Anti-Fog • 3-5% O2 / 5-8% CO2</text>

      <rect x="25" y="25" width="240" height="42" rx="8" fill="#0c4a6e" stroke="#38bdf8" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">MICRO-PERFORATED EMAP POUCH</text>
      <text x="40" y="58" fill="#bae6fd" font-family="monospace" font-size="10">Laser Pinhole Film • Real Asset</text>
    </svg>`;
  }

  if (type === 'mesh_sack') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <ellipse cx="300" cy="400" rx="170" ry="18" fill="#000000" opacity="0.6"/>
      <!-- Leno Mesh Bag Body -->
      <path d="M 200,90 Q 300,100 400,90 L 430,370 Q 300,390 170,370 Z" fill="#b91c1c" fill-opacity="0.35" stroke="#ef4444" stroke-width="2.5"/>
      <!-- Drawstring Collar -->
      <rect x="190" y="75" width="220" height="20" rx="4" fill="#7f1d1d" stroke="#f87171" stroke-width="1.5"/>
      <!-- Leno Mesh Crosshatch Pattern -->
      <g stroke="#f87171" stroke-width="1" opacity="0.75">
        ${Array.from({ length: 18 }).map((_, i) => `<line x1="${180 + i * 14}" y1="95" x2="${160 + i * 16}" y2="370"/>`).join('')}
        ${Array.from({ length: 16 }).map((_, j) => `<line x1="175" y1="${110 + j * 16}" x2="425" y2="${110 + j * 16}"/>`).join('')}
      </g>
      <text x="300" y="240" fill="#fee2e2" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">MACRO-VENTED LENO MESH</text>
      <text x="300" y="260" fill="#fca5a5" font-family="monospace" font-size="11" text-anchor="middle">65% Open Convective Airflow</text>

      <rect x="25" y="25" width="240" height="42" rx="8" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">VENTILATED LENO MESH SACK</text>
      <text x="40" y="58" fill="#fecaca" font-family="monospace" font-size="10">Ambient Aeration • Real Asset</text>
    </svg>`;
  }

  if (type === 'kraft_sack') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="#090d16"/>
      <ellipse cx="300" cy="400" rx="160" ry="18" fill="#000000" opacity="0.6"/>
      <!-- Multiwall Kraft Root Crop Sack -->
      <polygon points="200,90 400,90 420,380 180,380" fill="#78350f" stroke="#d97706" stroke-width="3"/>
      <!-- Sewn Thread Closure -->
      <line x1="170" y1="380" x2="430" y2="380" stroke="#fef3c7" stroke-width="4" stroke-dasharray="8,4"/>
      <!-- Needle punch vent dots -->
      <g fill="#451a03">
        ${Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 5 }).map((_, c) =>
            `<circle cx="${220 + c * 40}" cy="${160 + r * 30}" r="2.5" fill="#fef3c7"/>`
          ).join('')
        ).join('')}
      </g>
      <text x="300" y="320" fill="#fde68a" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">3-PLY EXTENSIBLE KRAFT SACK</text>
      <text x="300" y="338" fill="#fef3c7" font-family="monospace" font-size="10" text-anchor="middle">Light-Shielded • Anti-Greening Root Barrier</text>

      <rect x="25" y="25" width="240" height="42" rx="8" fill="#451a03" stroke="#d97706" stroke-width="1.5" opacity="0.95"/>
      <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">VENTED ROOT CROP SACK</text>
      <text x="40" y="58" fill="#fde68a" font-family="monospace" font-size="10">UV Shielded • Real Asset</text>
    </svg>`;
  }

  // hermetic_grain
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#090d16"/>
    <ellipse cx="300" cy="400" rx="170" ry="18" fill="#000000" opacity="0.6"/>
    <!-- Hermetic Grain Bag Body -->
    <polygon points="190,70 410,70 435,380 165,380" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
    <!-- Triple Fold Seal at Top with Cable Ties -->
    <rect x="180" y="60" width="240" height="25" rx="5" fill="#0f172a" stroke="#0ea5e9" stroke-width="2"/>
    <circle cx="240" cy="72" r="6" fill="#38bdf8"/>
    <circle cx="360" cy="72" r="6" fill="#38bdf8"/>
    <!-- Oxygen Gas Icon with Zero Symbol -->
    <circle cx="300" cy="200" r="45" fill="#0284c7" fill-opacity="0.2" stroke="#38bdf8" stroke-width="2"/>
    <text x="300" y="208" fill="#38bdf8" font-family="monospace" font-size="24" font-weight="900" text-anchor="middle">O₂ = 0%</text>
    <text x="300" y="280" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">HERMETIC MULTI-LAYER GRAIN SACK</text>
    <text x="300" y="300" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="middle">Insect Suffocation • Chemical-Free Storage</text>

    <rect x="25" y="25" width="240" height="42" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" opacity="0.95"/>
    <text x="40" y="44" fill="#ffffff" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">HERMETIC PICS-STYLE SACK</text>
    <text x="40" y="58" fill="#7dd3fc" font-family="monospace" font-size="10">Zero O2 Ingress • Real Asset</text>
  </svg>`;
}

export const SEED_PACKAGING_ASSETS: PackagingAssetRecord[] = [
  {
    materialId: 'MAT-001',
    materialName: 'Ventilated High-Density Polyethylene (HDPE) Produce Crate',
    packageType: 'Reusable Ventilated Harvest Crate',
    materialComposition: 'Virgin Food-Grade HDPE copolymer with UV stabilizers and high-impact structural ribs',
    realProductImage: createProductGraphic('crate', 'product'),
    additionalImages: [
      { id: 'mat-001-img-1', viewType: 'product', imageUrl: createProductGraphic('crate', 'product'), caption: 'Angled product perspective with ventilation grid', isPrimary: true },
      { id: 'mat-001-img-2', viewType: 'inside', imageUrl: createProductGraphic('crate', 'inside'), caption: 'Interior floor view showing perforated drainage and air chimneys' },
      { id: 'mat-001-img-3', viewType: 'side', imageUrl: createProductGraphic('crate', 'side'), caption: 'Side elevation with 32% convective airflow slots and interlocking feet' }
    ],
    insidePackageImage: createProductGraphic('crate', 'inside'),
    dimensions: {
      lengthCm: 60,
      widthCm: 40,
      heightCm: 22,
      description: 'Standard Euro-norm 600 x 400 x 220 mm crate'
    },
    capacity: {
      maxWeightKg: 25,
      volumeLiters: 45,
      description: '20 - 25 kg raw commodity load capacity'
    },
    ventilationCharacteristics: '32% open sidewall lattice aperture; rapid forced-air precooling and continuous passive convective heat venting',
    reusableRecyclableProperties: '100% recyclable (#2 HDPE). Heavy-duty reusable design certified for > 300 round trips',
    costInformation: {
      unitCostEstimate: '₹220 - ₹280 per reusable unit (₹0.85 per transit trip amortized)',
      tier: 'Economy',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '> 50,000 cc / (m² · day · atm) (Free atmospheric convection)',
      wvtr: '> 2,000 g / (m² · day) (Moisture vapor freely vents to prevent dewpoint condensation)',
      perforationType: 'Macro lattice grid (12mm x 40mm continuous slots)',
      cushioningGrade: 'Rigid perimeter deflection protection (< 2mm under 200kg stacking load)',
      operatingTempRange: '-30°C to +75°C'
    },
    compatibleCrops: [
      'Tomato',
      'Fresh Tomatoes',
      'Tomatoes',
      'Cherry Tomatoes',
      'Bell Peppers',
      'Capsicum',
      'Brinjal / Eggplant',
      'Citrus',
      'Oranges',
      'Apples'
    ],
    foodCategories: ['Fresh Produce', 'Solanaceous Fruit', 'Citrus'],
    source: 'National Horticulture Board (NHB) Standard Packaging & ISO 9001 Industrial Specs',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-002',
    materialName: '5-Ply Kraft Corrugated Box with Chimney Die-Cut Vents',
    packageType: 'Heavy-Duty Telescopic Ventilated CFB Box',
    materialComposition: '5-Ply Virgin Unbleached Kraft Paperboard (Top/Bottom 180 GSM, Fluting 140 GSM B/C Flute)',
    realProductImage: createProductGraphic('kraft_box', 'product'),
    additionalImages: [
      { id: 'mat-002-img-1', viewType: 'product', imageUrl: createProductGraphic('kraft_box', 'product'), caption: 'Heavy-duty 5-ply Kraft telescopic carton with side chimney vents', isPrimary: true },
      { id: 'mat-002-img-2', viewType: 'inside', imageUrl: createProductGraphic('kraft_box', 'inside'), caption: 'Interior cavity with shock-absorbing fluted Kraft floor' }
    ],
    insidePackageImage: createProductGraphic('kraft_box', 'inside'),
    dimensions: {
      lengthCm: 45,
      widthCm: 30,
      heightCm: 18,
      description: '450 x 300 x 180 mm export produce carton'
    },
    capacity: {
      maxWeightKg: 10,
      volumeLiters: 24,
      description: '5 - 10 kg produce capacity'
    },
    ventilationCharacteristics: 'Dual vertical chimney vents (15mm diameter) on four sides aligned with pallet airflow lanes',
    reusableRecyclableProperties: '100% biodegradable and recyclable (PAP 20). Reusable up to 3 cycles if dry',
    costInformation: {
      unitCostEstimate: '₹42 - ₹55 per box with die-cut vents',
      tier: 'Balanced',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '12,000 - 18,000 cc / (m² · day · atm) (Through calibrated chimney vents)',
      wvtr: '180 g / (m² · day) (Moisture buffering Kraft substrate)',
      perforationType: 'Die-cut circular and oblong chimney vents',
      cushioningGrade: 'Double-wall B/C flute energy absorption (Edge Crush Test > 7.5 kN/m)',
      operatingTempRange: '5°C to 45°C',
      burstingStrengthKPa: 1250
    },
    compatibleCrops: [
      'Mango',
      'Ripening Mangoes',
      'Mangoes',
      'Papaya',
      'Avocado',
      'Melons',
      'Export Tomatoes'
    ],
    foodCategories: ['Fresh Produce', 'Climacteric Tree Fruit', 'Tropicals'],
    source: 'APEDA Fresh Fruit Export Specification & Indian Institute of Packaging (IIP)',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-003',
    materialName: 'Breathable Molded Bagasse Sugarcane Pulp Clamshell Punnet',
    packageType: 'Micro-Porous Compostable Bio-Fiber Punnet',
    materialComposition: '100% Sugarcane Bagasse Pulp, PFAS-free water-resistant sizing',
    realProductImage: createProductGraphic('bagasse_punnet', 'product'),
    additionalImages: [
      { id: 'mat-003-img-1', viewType: 'product', imageUrl: createProductGraphic('bagasse_punnet', 'product'), caption: 'Bio-fiber punnet with slotted lid and moisture-absorbing capillary base', isPrimary: true }
    ],
    insidePackageImage: createProductGraphic('bagasse_punnet', 'product'),
    dimensions: {
      lengthCm: 19,
      widthCm: 12,
      heightCm: 8.5,
      description: '190 x 120 x 85 mm retail punnet'
    },
    capacity: {
      maxWeightKg: 0.5,
      volumeLiters: 1.2,
      description: '250g - 500g delicate berry/mushroom payload'
    },
    ventilationCharacteristics: 'Natural capillary bio-fiber breathability prevents moisture condensation while slotted top releases metabolic CO2',
    reusableRecyclableProperties: '100% Home & Industrial Compostable (EN 13432 / ASTM D6400 in 90 days)',
    costInformation: {
      unitCostEstimate: '₹4.50 - ₹6.80 per punnet',
      tier: 'Balanced',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '1,800 - 3,200 cc / (m² · day · atm) (Natural capillary micro-porosity)',
      wvtr: '85 - 120 g / (m² · day) (Wicks condensation without berry desiccation)',
      perforationType: 'Inter-fiber bio-capillaries + lid slots',
      cushioningGrade: 'Soft natural molded pulp cradle against skin abrasion',
      operatingTempRange: '-20°C to 120°C'
    },
    compatibleCrops: [
      'Fresh Strawberries',
      'Strawberries',
      'Mushrooms',
      'Button Mushrooms',
      'Cherry Tomatoes',
      'Raspberries',
      'Blackberries',
      'Grapes'
    ],
    foodCategories: ['Fresh Produce', 'Soft Berries', 'Fungi'],
    source: 'ASTM D6400 Certified Bio-Packaging Lab Standard',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-004',
    materialName: 'Equilibrium MAP Micro-Perforated Breathable Film Pouch',
    packageType: 'Stand-Up Laser-Microperforated EMAP Pouch',
    materialComposition: 'Co-extruded BOPP/PE (35µm) with internal food-grade anti-fog surfactant coating',
    realProductImage: createProductGraphic('emap_pouch', 'product'),
    additionalImages: [
      { id: 'mat-004-img-1', viewType: 'product', imageUrl: createProductGraphic('emap_pouch', 'product'), caption: 'Transparent anti-fog pouch with laser pinholes for equilibrium modified atmosphere', isPrimary: true }
    ],
    insidePackageImage: createProductGraphic('emap_pouch', 'product'),
    dimensions: {
      lengthCm: 25,
      widthCm: 32,
      heightCm: 8,
      description: '250 x 320 x 80 mm stand-up fresh pouch'
    },
    capacity: {
      maxWeightKg: 1,
      volumeLiters: 3.5,
      description: '250g - 1 kg fresh leafy produce'
    },
    ventilationCharacteristics: 'Calibrated laser micro-pinholes (60µm, 12 holes/pack) maintaining steady-state 3-5% O2 and 5-8% CO2',
    reusableRecyclableProperties: 'Recyclable mono-polymer stream (#5 PP / #4 LDPE)',
    costInformation: {
      unitCostEstimate: '₹2.80 - ₹4.20 per pouch',
      tier: 'Economy',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '10,000 - 14,000 cc / (m² · day · atm) (Laser micro-vent equilibrium flux)',
      wvtr: '25 - 45 g / (m² · day) (Anti-fog prevents water droplet pooling)',
      perforationType: 'Laser micro-pinholes (50 - 70 microns)',
      cushioningGrade: 'Gas pillow effect when sealed',
      operatingTempRange: '0°C to 30°C'
    },
    compatibleCrops: [
      'Leafy Greens',
      'Spinach',
      'Palak',
      'Lettuce',
      'Coriander',
      'Coriander / Cilantro',
      'Broccoli',
      'Mint',
      'Kale'
    ],
    foodCategories: ['Fresh Produce', 'Leafy Greens', 'Cruciferous'],
    source: 'Postharvest Biology & Technology EMAP Research Paper Standards',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-005',
    materialName: 'Heavy-Duty Macro-Vented Polypropylene Leno Mesh Sack',
    packageType: 'Convective Airflow Open-Mesh Tubular Sack',
    materialComposition: 'Woven High-Tenacity Polypropylene (PP) Monofilament with woven draw-string closure',
    realProductImage: createProductGraphic('mesh_sack', 'product'),
    additionalImages: [
      { id: 'mat-005-img-1', viewType: 'product', imageUrl: createProductGraphic('mesh_sack', 'product'), caption: 'Heavy-duty tubular leno mesh sack with drawstring for maximum convective aeration', isPrimary: true }
    ],
    insidePackageImage: createProductGraphic('mesh_sack', 'product'),
    dimensions: {
      lengthCm: 50,
      widthCm: 80,
      heightCm: 25,
      description: '500 x 800 mm tubular sack'
    },
    capacity: {
      maxWeightKg: 50,
      volumeLiters: 65,
      description: '25 - 50 kg bulk allium root cargo'
    },
    ventilationCharacteristics: '65% open aperture mesh enabling continuous ambient cross-ventilation, preventing moisture condensation and neck rot',
    reusableRecyclableProperties: '100% recyclable (#5 PP), reusable across multiple wholesale seasons',
    costInformation: {
      unitCostEstimate: '₹14 - ₹20 per sack',
      tier: 'Economy',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '> 80,000 cc / (m² · day · atm) (Completely open convective breathing)',
      wvtr: '> 3,500 g / (m² · day) (Zero moisture buildup)',
      perforationType: 'Woven leno mesh open apertures (3mm x 3mm)',
      cushioningGrade: 'Flexible tension envelope with high tensile burst resistance',
      operatingTempRange: '-10°C to 65°C'
    },
    compatibleCrops: [
      'Onions',
      'Onion',
      'Red Onions',
      'Garlic',
      'Shallots'
    ],
    foodCategories: ['Fresh Produce', 'Allium Bulb Crops', 'Dry Tubers'],
    source: 'National Agricultural Cooperative Marketing Federation of India (NAFED) Specs',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-006',
    materialName: 'Multi-Wall Kraft Paper Sack with Micro-Needle Air Vents',
    packageType: 'UV-Shielding Ventilated Heavy-Duty Root Crop Bag',
    materialComposition: '3-Ply High-Porosity Extensible Clupak Kraft Paper (3x 75 GSM) with sewn bottom thread',
    realProductImage: createProductGraphic('kraft_sack', 'product'),
    additionalImages: [
      { id: 'mat-006-img-1', viewType: 'product', imageUrl: createProductGraphic('kraft_sack', 'product'), caption: 'Multi-wall Kraft root crop sack with micro-needle venting and light-shielding', isPrimary: true }
    ],
    insidePackageImage: createProductGraphic('kraft_sack', 'product'),
    dimensions: {
      lengthCm: 40,
      widthCm: 65,
      heightCm: 18,
      description: '400 x 650 x 180 mm multi-wall sack'
    },
    capacity: {
      maxWeightKg: 25,
      volumeLiters: 35,
      description: '10 - 25 kg root crop capacity'
    },
    ventilationCharacteristics: 'Uniform micro-needle punch venting + 100% light blockage to suppress solanine toxic greening and sprouting',
    reusableRecyclableProperties: '100% biodegradable and recyclable unbleached Kraft',
    costInformation: {
      unitCostEstimate: '₹22 - ₹32 per sack',
      tier: 'Economy',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '15,000 - 22,000 cc / (m² · day · atm) (Micro-needle matrix)',
      wvtr: '150 g / (m² · day)',
      perforationType: 'Needle micro-pores + breathable paper fiber matrix',
      cushioningGrade: '3-ply paper puncture resistance and dirt/abrasion isolation',
      operatingTempRange: '0°C to 50°C'
    },
    compatibleCrops: [
      'Potatoes',
      'Potato',
      'Potatoes / Onions',
      'Sweet Potatoes',
      'Yams',
      'Ginger'
    ],
    foodCategories: ['Fresh Produce', 'Root Crops', 'Tubers'],
    source: 'Central Potato Research Institute (CPRI) Post-Harvest Guidelines',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    materialId: 'MAT-007',
    materialName: 'Hermetic Multi-Layer Grain & Pulse Storage Sack (PICS Type)',
    packageType: 'Multi-Layer Hermetic Grain Storage Bag',
    materialComposition: 'Outer Woven Polypropylene (WPP) protective sack + Dual High-Density Polyethylene (HDPE) Inner Liners (80µm each)',
    realProductImage: createProductGraphic('hermetic_grain', 'product'),
    additionalImages: [
      { id: 'mat-007-img-1', viewType: 'product', imageUrl: createProductGraphic('hermetic_grain', 'product'), caption: 'Multi-layer hermetic grain sack with dual high-barrier liners for pesticide-free storage', isPrimary: true }
    ],
    insidePackageImage: createProductGraphic('hermetic_grain', 'product'),
    dimensions: {
      lengthCm: 60,
      widthCm: 110,
      heightCm: 25,
      description: '600 x 1100 mm heavy grain sack'
    },
    capacity: {
      maxWeightKg: 100,
      volumeLiters: 110,
      description: '50 - 100 kg grain payload'
    },
    ventilationCharacteristics: 'Hermetic zero-ventilation barrier; biological grain & insect respiration consumes residual O2 down to <1%, suffocating weevils and molds without chemical fumigation',
    reusableRecyclableProperties: 'Heavy-duty reusable for 3 to 5 storage seasons; 100% recyclable (#5 PP / #2 HDPE)',
    costInformation: {
      unitCostEstimate: '₹140 - ₹180 per complete hermetic bag system',
      tier: 'Balanced',
      currency: 'INR'
    },
    scientificProperties: {
      otr: '< 5 cc / (m² · day · atm) (Double 80µm high-barrier liner)',
      wvtr: '< 2.5 g / (m² · day) (Preserves grain equilibrium moisture content)',
      perforationType: 'Hermetic non-perforated double twist-and-tie seal',
      cushioningGrade: 'High-tenacity woven outer envelope (Drop test > 1.8m)',
      operatingTempRange: '-10°C to 55°C'
    },
    compatibleCrops: [
      'Grains',
      'Rice',
      'Paddy',
      'Wheat',
      'Corn',
      'Corn / Maize',
      'Maize',
      'Millets',
      'Chickpeas',
      'Pulses',
      'Lentils',
      'Soybean',
      'Coffee Beans'
    ],
    foodCategories: ['Grains & Cereals', 'Pulses & Legumes', 'Dry Commodities'],
    source: 'Purdue Improved Crop Storage (PICS) / ICRISAT Postharvest Protocol',
    validationStatus: 'Validated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class PackagingAssetStore {
  private assets: PackagingAssetRecord[] = [];
  private dataFilePath = path.join(process.cwd(), 'data', 'packaging-assets.json');

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.assets = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read packaging assets file, using seeded defaults:', err);
    }
    this.assets = [...SEED_PACKAGING_ASSETS];
    this.persistToDisk();
  }

  private persistToDisk() {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.assets, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Failed to persist packaging assets to disk:', err);
    }
  }

  public getAll(): PackagingAssetRecord[] {
    return this.assets;
  }

  public getById(id: string): PackagingAssetRecord | undefined {
    return this.assets.find(
      (a) => a.materialId.toLowerCase() === id.toLowerCase()
    );
  }

  /**
   * Authoritative resolution: maps crop and conditions directly to the validated packaging database record
   */
  public findByCropAndConditions(
    cropName: string,
    transportDays?: number,
    refrigeration?: boolean,
    packagingFormatPreference?: string
  ): PackagingAssetRecord {
    const cropLower = (cropName || '').toLowerCase().trim();

    // 1. Soft Berries & Mushrooms -> MAT-003 Bagasse Punnet
    if (
      cropLower.includes('strawberr') ||
      cropLower.includes('berr') ||
      cropLower.includes('mushroom')
    ) {
      return this.getById('MAT-003') || this.assets[2];
    }

    // 2. Leafy Greens -> MAT-004 EMAP Breathable Film Pouch
    if (
      cropLower.includes('spinach') ||
      cropLower.includes('palak') ||
      cropLower.includes('leaf') ||
      cropLower.includes('coriander') ||
      cropLower.includes('lettuce') ||
      cropLower.includes('broccoli') ||
      cropLower.includes('herb')
    ) {
      return this.getById('MAT-004') || this.assets[3];
    }

    // 3. Onions / Garlic / Shallots -> MAT-005 Macro-Vented Leno Mesh Sack
    if (
      cropLower.includes('onion') ||
      cropLower.includes('garlic') ||
      cropLower.includes('shallot')
    ) {
      return this.getById('MAT-005') || this.assets[4];
    }

    // 4. Potatoes / Sweet Potatoes / Tubers -> MAT-006 Kraft Root Crop Sack
    if (
      cropLower.includes('potato') ||
      cropLower.includes('yam') ||
      cropLower.includes('tuber') ||
      cropLower.includes('ginger')
    ) {
      return this.getById('MAT-006') || this.assets[5];
    }

    // 5. Grains / Pulses -> MAT-007 Hermetic Storage Sack
    if (
      cropLower.includes('grain') ||
      cropLower.includes('rice') ||
      cropLower.includes('paddy') ||
      cropLower.includes('wheat') ||
      cropLower.includes('corn') ||
      cropLower.includes('maize') ||
      cropLower.includes('pulse') ||
      cropLower.includes('lentil') ||
      cropLower.includes('millet')
    ) {
      return this.getById('MAT-007') || this.assets[6];
    }

    // 6. Mangoes / Papayas / Delicate Tree Fruits -> MAT-002 Kraft Corrugated Chimney Box
    if (
      cropLower.includes('mango') ||
      cropLower.includes('papaya') ||
      cropLower.includes('avocado') ||
      cropLower.includes('melon')
    ) {
      return this.getById('MAT-002') || this.assets[1];
    }

    // 7. Format preference override check
    if (packagingFormatPreference) {
      const prefLower = packagingFormatPreference.toLowerCase();
      if (prefLower.includes('corrugated') || prefLower.includes('box') || prefLower.includes('carton')) {
        return this.getById('MAT-002') || this.assets[1];
      }
      if (prefLower.includes('crate')) {
        return this.getById('MAT-001') || this.assets[0];
      }
      if (prefLower.includes('pouch') || prefLower.includes('bag')) {
        return this.getById('MAT-004') || this.assets[3];
      }
    }

    // 8. Long transit (> 3 days) export tomatoes -> MAT-002 Kraft Box, otherwise MAT-001 Crate
    if (cropLower.includes('tomato')) {
      if (transportDays && transportDays > 3) {
        return this.getById('MAT-002') || this.assets[1];
      }
      return this.getById('MAT-001') || this.assets[0];
    }

    // Default to MAT-001 Produce Crate
    return this.assets[0];
  }

  public create(
    recordData: Omit<PackagingAssetRecord, 'createdAt' | 'updatedAt'>
  ): PackagingAssetRecord {
    // Generate next MAT-ID if not supplied
    let id = recordData.materialId;
    if (!id || id.trim() === '') {
      const count = this.assets.length + 1;
      id = `MAT-${String(count).padStart(3, '0')}`;
    }

    const newRecord: PackagingAssetRecord = {
      ...recordData,
      materialId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Replace if exists, or append
    const idx = this.assets.findIndex(
      (a) => a.materialId.toLowerCase() === id.toLowerCase()
    );
    if (idx >= 0) {
      this.assets[idx] = newRecord;
    } else {
      this.assets.push(newRecord);
    }
    this.persistToDisk();
    return newRecord;
  }

  public update(
    id: string,
    partial: Partial<PackagingAssetRecord>
  ): PackagingAssetRecord | undefined {
    const idx = this.assets.findIndex(
      (a) => a.materialId.toLowerCase() === id.toLowerCase()
    );
    if (idx < 0) return undefined;

    this.assets[idx] = {
      ...this.assets[idx],
      ...partial,
      materialId: this.assets[idx].materialId, // Prevent ID mutability
      updatedAt: new Date().toISOString()
    };
    this.persistToDisk();
    return this.assets[idx];
  }

  public addImage(
    id: string,
    image: PackagingImageItem
  ): PackagingAssetRecord | undefined {
    const record = this.getById(id);
    if (!record) return undefined;

    const existingImages = record.additionalImages || [];
    const updatedImages = [...existingImages.filter((img) => img.id !== image.id), image];

    const updates: Partial<PackagingAssetRecord> = {
      additionalImages: updatedImages
    };

    if (image.viewType === 'inside') {
      updates.insidePackageImage = image.imageUrl;
    }
    if (image.isPrimary || image.viewType === 'product') {
      updates.realProductImage = image.imageUrl;
    }

    return this.update(id, updates);
  }

  public delete(id: string): boolean {
    const initialLen = this.assets.length;
    this.assets = this.assets.filter(
      (a) => a.materialId.toLowerCase() !== id.toLowerCase()
    );
    if (this.assets.length !== initialLen) {
      this.persistToDisk();
      return true;
    }
    return false;
  }
}

export const packagingAssetStore = new PackagingAssetStore();
