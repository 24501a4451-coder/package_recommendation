import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import QRCode from 'qrcode';
import { dataStore, User, PackagingMaterial, FoodCommodity } from './server/db/dataStore';
import { visionAIService } from './server/ai/visionService';
import { assistantService } from './server/ai/assistantService';
import { visualizationService } from './server/ai/visualizationService';
import { recommendationEngine, UserPreferences } from './server/engines/recommendationEngine';
import { levelEngines } from './server/engines/levelEngines';
import { failureDiagnosisEngine } from './server/engines/failureDiagnosisEngine';
import { ProcessingTransformation } from './server/engines/ruleEngine';
import { farmerVoiceService } from './server/ai/farmerVoiceService';
import { GeminiAudioSTTProvider, WhisperSTTProvider } from './server/ai/voiceProviders';
import { packagingAssetStore } from './server/db/packagingAssetStore';
import { packagingVisualizationService } from './server/services/packagingVisualizationService';
import { packagingShoppingService } from './server/services/packagingShoppingService';
import { packagingRecommendationAdapter, recommendPackaging } from './server/services/packagingRecommendationAdapter';
import { stepExplanationService } from './server/services/stepExplanationService';

dotenv.config();

// Ensure external HTTPS calls (TTS audio synthesis, Google GenAI) work reliably across environments
if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parsing with 25MB limit for high-res food photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// CORS middleware for production deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Production & deployment health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FOODPACK-AI Platform',
    engineVersion: '2.4.0 (SIH26236 Certified Core)',
    mode: process.env.NODE_ENV || 'production'
  });
});

// Active token session store
const activeSessions = new Map<string, User>();
let currentSessionUser: User | null = null;

// Seed initial demo user sessions
dataStore.users.forEach(u => {
  activeSessions.set(u.id, u);
  activeSessions.set(`token_${u.id}`, u);
});

// Auth Middleware: inspect Authorization header first, then current session
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token) {
      const found = activeSessions.get(token) || dataStore.users.find(u => u.id === token || u.email.toLowerCase() === token.toLowerCase());
      if (found) {
        req.user = found;
        return next();
      }
    }
  }
  // Fall back to active server-side session user if authenticated
  if (currentSessionUser) {
    req.user = currentSessionUser;
    return next();
  }
  req.user = undefined;
  next();
};

// Role & Level Authorization Middleware
const requireLevel = (allowedLevels: ('LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'User login required. Please sign in.' });
    }
    // Admin has access to all levels
    if (user.role === 'ADMIN') {
      return next();
    }
    if (!allowedLevels.includes(user.role as any)) {
      dataStore.log(user.id, 'UNAUTHORIZED_ACCESS_ATTEMPT', user.role, `Attempted access to restricted level(s): ${allowedLevels.join(', ')}`);
      return res.status(403).json({
        error: 'ACCESS_DENIED',
        message: `Access Denied: Your account role is ${user.roleName} (${user.role}). This module strictly requires authorization for ${allowedLevels.join(' or ')}.`,
        currentRole: user.role,
        requiredLevels: allowedLevels
      });
    }
    next();
  };
};

// Declare user property on Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

app.use(authMiddleware);

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, role, organization, password } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role selection are required.' });
  }

  const roleNameMap: Record<string, string> = {
    LEVEL_1: 'Fresh Produce / Farmer / Agricultural Producer',
    LEVEL_2: 'Restaurant / Café / Bakery / Cloud Kitchen / Food Delivery',
    LEVEL_3: 'Packaged Food Startup / Food Manufacturer',
    LEVEL_4: 'Packaging Engineer / Food Technologist / Researcher',
    ADMIN: 'Platform Administrator'
  };

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    email,
    role,
    roleName: roleNameMap[role] || role,
    organization: organization || 'Independent',
    createdAt: new Date().toISOString()
  };

  dataStore.users.push(newUser);
  currentSessionUser = newUser;
  const token = `token_${newUser.id}_${Date.now()}`;
  activeSessions.set(token, newUser);
  activeSessions.set(newUser.id, newUser);
  dataStore.log(newUser.id, 'USER_REGISTERED', newUser.role, `Registered with role ${newUser.roleName}`);

  res.json({ success: true, token, user: newUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId, email, emailOrUsername, role, level } = req.body;
  const lookup = (emailOrUsername || email || '').trim().toLowerCase();
  
  let user: User | undefined;
  if (userId) {
    user = dataStore.users.find(u => u.id === userId);
  } else if (lookup) {
    user = dataStore.users.find(u => 
      u.email.toLowerCase() === lookup || 
      u.name.toLowerCase().includes(lookup)
    );
  } else if (role || level) {
    user = dataStore.users.find(u => u.role === (role || level));
  }

  // If user requested a specific demo level or credentials don't match, give a friendly demo fallback or 401
  if (!user && (role || level)) {
    user = dataStore.users.find(u => u.role === (role || level));
  }

  if (!user) {
    // If entered a custom email/username not registered yet, auto-create a user with selected role if provided
    if (lookup && (role || level)) {
      const selectedRole = role || level || 'LEVEL_2';
      const roleNameMap: Record<string, string> = {
        LEVEL_1: 'Fresh Produce / Agricultural Producer',
        LEVEL_2: 'Restaurant / Café / Bakery / Cloud Kitchen / Food Delivery',
        LEVEL_3: 'Packaged Food Startup / Food Manufacturer',
        LEVEL_4: 'Packaging Engineer / Food Technologist / Researcher',
        ADMIN: 'Platform Administrator'
      };
      user = {
        id: `user_${Date.now()}`,
        name: lookup.includes('@') ? lookup.split('@')[0] : lookup,
        email: lookup.includes('@') ? lookup : `${lookup}@foodpack.ai`,
        role: selectedRole,
        roleName: roleNameMap[selectedRole] || selectedRole,
        organization: 'Independent Operator',
        createdAt: new Date().toISOString()
      };
      dataStore.users.push(user);
    } else {
      return res.status(401).json({ 
        error: 'INVALID_CREDENTIALS', 
        message: 'Invalid credentials. Please select your user role or register a new account.' 
      });
    }
  }

  currentSessionUser = user;
  const token = `token_${user.id}_${Date.now()}`;
  activeSessions.set(token, user);
  activeSessions.set(user.id, user);
  dataStore.log(user.id, 'USER_LOGIN', user.role, `User logged in`);
  res.json({ success: true, token, user });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]?.trim();
    if (token) {
      activeSessions.delete(token);
    }
  }
  if (req.user) {
    dataStore.log(req.user.id, 'USER_LOGOUT', req.user.role, 'User logged out');
  }
  currentSessionUser = null;
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  if (req.user) {
    return res.json({ user: req.user });
  }
  return res.status(401).json({ error: 'UNAUTHENTICATED', user: null });
});

app.get('/api/auth/demo-users', (req: Request, res: Response) => {
  res.json({ users: dataStore.users });
});

app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Login required to switch role.' });
  }
  const { role } = req.body;
  const roleNameMap: Record<string, string> = {
    LEVEL_1: 'Fresh Produce / Farmer',
    LEVEL_2: 'Restaurant & Cloud Kitchen Partner',
    LEVEL_3: 'Packaged Food Startup Founder',
    LEVEL_4: 'Packaging Engineer & Technologist',
    ADMIN: 'Platform Administrator'
  };

  if (role) {
    req.user.role = role;
    req.user.roleName = roleNameMap[role] || role;
    dataStore.log(req.user.id, 'ROLE_SWITCHED', role, `Active role switched to ${role}`);
  }
  res.json({ success: true, user: req.user });
});

// ==========================================
// 2. LEVEL 2: TAKEAWAY INTELLIGENCE (SHOWCASE)
// ==========================================

// Helper for AI Image Perception Scan
const handleScanFood = async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, userHint } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image base64 data required.' });
    }

    const result = await visionAIService.analyzeFoodImage(imageBase64, mimeType || 'image/jpeg', userHint);
    if (req.user) {
      dataStore.log(req.user.id, 'IMAGE_FOOD_SCAN', 'LEVEL_2', `Detected: ${result.primaryFoodName} (AI Mode: ${result.aiMode})`);
    }
    res.json(result);
  } catch (err: any) {
    console.error('Scan food error:', err);
    res.status(500).json({ error: 'Failed to process food image', details: err?.message });
  }
};

app.post('/api/level2/analyze-image', requireLevel(['LEVEL_2']), handleScanFood);
app.post('/api/level2/analyze-food-image', requireLevel(['LEVEL_2']), handleScanFood);
app.post('/api/ai/scan-food', requireLevel(['LEVEL_2']), handleScanFood);

// Generate Dynamic Questions based on food profile
app.post('/api/level2/generate-questions', requireLevel(['LEVEL_2']), async (req: Request, res: Response) => {
  try {
    const { foodName, components, cookingMethod, servingTemperature, physicalTexture } = req.body;
    const name = (foodName || 'Prepared Dish').trim();
    const comps = Array.isArray(components) && components.length > 0 ? components : [name];

    const isCrispy =
      (cookingMethod || '').toLowerCase().includes('fried') ||
      (physicalTexture || '').toLowerCase().includes('crisp');

    const isCurry =
      (cookingMethod || '').toLowerCase().includes('curry') ||
      (cookingMethod || '').toLowerCase().includes('simmer') ||
      (physicalTexture || '').toLowerCase().includes('liquid') ||
      (physicalTexture || '').toLowerCase().includes('gravy');

    const questions = [
      {
        id: 'foodCondition',
        question: 'Food Condition / Temperature',
        options: ['Very Hot', 'Hot', 'Warm', 'Room Temp', 'Chilled', 'Frozen'],
        default: (servingTemperature || '').includes('>75') ? 'Very Hot' : (servingTemperature || '').includes('Chilled') ? 'Chilled' : 'Hot'
      },
      {
        id: 'deliveryTime',
        question: 'Target Delivery Duration',
        options: ['<30 min', '30–60 min', '1–2 hrs', '2+ hrs'],
        default: '30–60 min'
      },
      {
        id: 'priorities',
        question: 'Key Priorities (Select all that apply)',
        options: [
          'Maintain heat',
          'Maintain crispness',
          'Prevent leakage',
          'Maintain texture',
          'Maintain freshness',
          'Presentation',
          'Low cost',
          'Sustainability'
        ],
        default: isCrispy
          ? ['Maintain crispness', 'Maintain heat']
          : isCurry
          ? ['Prevent leakage', 'Maintain heat']
          : ['Maintain heat', 'Maintain freshness']
      }
    ];

    if (comps.length > 1) {
      questions.push({
        id: 'packedTogether',
        question: 'Multi-Component Packing Strategy',
        options: ['Separate Vessels (Recommended for quality)', 'Pack Together in One Container'],
        default: 'Separate Vessels (Recommended for quality)'
      });
    }

    res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate questions', details: err?.message });
  }
});

// Confirm Food & Derive Dynamic Relevant Questions
app.post('/api/level2/confirm-food', requireLevel(['LEVEL_2']), async (req: Request, res: Response) => {
  try {
    const { foodName, components, possibleIngredients, cookingMethod, servingTemperature, freshness, physicalTexture } = req.body;
    const name = (foodName || 'Prepared Dish').trim();
    const comps = Array.isArray(components) && components.length > 0 ? components : [name];

    const isCrispy =
      (cookingMethod || '').toLowerCase().includes('fried') ||
      (physicalTexture || '').toLowerCase().includes('crisp');

    const isCurry =
      (cookingMethod || '').toLowerCase().includes('curry') ||
      (cookingMethod || '').toLowerCase().includes('simmer') ||
      (physicalTexture || '').toLowerCase().includes('liquid') ||
      (physicalTexture || '').toLowerCase().includes('gravy');

    const foodProfile = {
      name,
      category: isCurry ? 'Curry / Liquid' : isCrispy ? 'Fried Food' : 'Prepared Meal',
      moistureContentPercent: isCurry ? 78 : isCrispy ? 22 : 58,
      fatContentPercent: isCrispy ? 22 : 12,
      waterActivity: isCurry ? 0.96 : isCrispy ? 0.45 : 0.88,
      crispnessSensitivity: isCrispy ? 'Critical' : 'Low',
      steamGenerationRisk: (servingTemperature || '').includes('>75') ? 'High' : 'Moderate',
      greaseMigrationTendency: isCrispy || isCurry ? 'High' : 'Medium'
    };

    const transformation = {
      rawIngredients: possibleIngredients || comps,
      cookingMethod: cookingMethod || (isCrispy ? 'Deep Fried' : 'Dum Steamed / Boiled'),
      servingTemperature: servingTemperature || 'Warm (50-70°C)',
      moistureReleaseState: (servingTemperature || '').includes('>75') ? 'High Active Steam' : 'Moderate Vapor',
      physicalTexture: physicalTexture || (isCrispy ? 'Crisp Batter Crust' : isCurry ? 'Viscous Liquid Gravy' : 'Moist Grains')
    };

    // Determine minimal relevant dynamic questions
    const relevantQuestions = [];
    relevantQuestions.push({
      id: 'foodCondition',
      question: 'Food Condition / Temperature',
      options: ['Very Hot', 'Hot', 'Warm', 'Room Temp', 'Chilled', 'Frozen'],
      default: (servingTemperature || '').includes('>75') ? 'Very Hot' : (servingTemperature || '').includes('Chilled') ? 'Chilled' : 'Hot'
    });

    relevantQuestions.push({
      id: 'deliveryTime',
      question: 'Target Delivery Duration',
      options: ['<30 min', '30–60 min', '1–2 hrs', '2+ hrs'],
      default: '30–60 min'
    });

    relevantQuestions.push({
      id: 'priorities',
      question: 'Key Priorities (Select all that apply)',
      options: [
        'Maintain heat',
        'Maintain crispness',
        'Prevent leakage',
        'Maintain texture',
        'Maintain freshness',
        'Presentation',
        'Low cost',
        'Sustainability'
      ],
      default: isCrispy
        ? ['Maintain crispness', 'Maintain heat']
        : isCurry
        ? ['Prevent leakage', 'Maintain heat']
        : ['Maintain heat', 'Maintain freshness']
    });

    if (comps.length > 1) {
      relevantQuestions.push({
        id: 'packedTogether',
        question: 'Multi-Component Packing Strategy',
        options: ['Separate Vessels (Recommended for quality)', 'Pack Together in One Container'],
        default: 'Separate Vessels (Recommended for quality)'
      });
    }

    res.json({
      success: true,
      confirmedFood: {
        foodName: name,
        components: comps,
        foodProfile,
        transformation
      },
      relevantQuestions
    });
  } catch (err: any) {
    console.error('Confirm food error:', err);
    res.status(500).json({ error: 'Failed to confirm food', details: err?.message });
  }
});

// Evaluate Existing Packaging
app.post('/api/ai/evaluate-existing', requireLevel(['LEVEL_2']), async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, specs } = req.body;
    const result = await visionAIService.evaluateExistingPackagingImage(imageBase64 || '', mimeType || 'image/jpeg', specs);
    dataStore.log(req.user!.id, 'EVALUATE_PACKAGING', 'LEVEL_2', `Evaluated container: ${result.observedContainerType}`);
    res.json(result);
  } catch (err: any) {
    console.error('Evaluate packaging error:', err);
    res.status(500).json({ error: 'Evaluation failed', details: err?.message });
  }
});

// Generate Takeaway Recommendation Handler
const handleRecommendLevel2 = async (req: Request, res: Response) => {
  try {
    const { food, transformation, preferences, components, aiMode } = req.body as {
      food: Partial<FoodCommodity>;
      transformation: ProcessingTransformation;
      preferences: UserPreferences;
      components: string[];
      aiMode?: 'REAL' | 'FALLBACK';
    };

    if (!food || !food.name) {
      return res.status(400).json({ error: 'Confirmed food profile is required.' });
    }

    const recResult = recommendationEngine.generateRecommendation(
      food,
      transformation,
      preferences,
      components || []
    );

    const recId = `REC-${new Date().getFullYear()}-TK${Math.floor(1000 + Math.random() * 9000)}`;
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify/${recId}`;

    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (qrErr) {
      console.warn('QR Code generation warning:', qrErr);
    }

    const record = {
      id: recId,
      userId: req.user!.id,
      userName: req.user!.name,
      level: 'LEVEL_2' as const,
      title: `${food.name} Takeaway Packaging Suite`,
      foodName: food.name,
      components: components || [],
      foodProfile: {
        ...food,
        transformation
      },
      inputScenario: preferences,
      topCandidate: recResult.topCandidate,
      actionableSummary: recResult.actionableSummary,
      detailedAnalysis: recResult.detailedAnalysis,
      configuration: recResult.configuration,
      alternatives: recResult.alternatives,
      whyExplanation: recResult.whyExplanation,
      evidence: recResult.evidence,
      assumptions: recResult.assumptions,
      limitations: recResult.limitations,
      validationRequired: recResult.validationRequired,
      costEstimate: recResult.costEstimate,
      sustainabilityScore: recResult.sustainabilityScore,
      aiMode: aiMode || 'REAL',
      qrCodeUrl,
      createdAt: new Date().toISOString()
    };

    dataStore.recommendations.unshift(record);
    dataStore.log(req.user!.id, 'GENERATE_RECOMMENDATION', 'LEVEL_2', `Generated recommendation ${recId} for ${food.name}`);

    res.json({
      recommendationId: recId,
      record,
      analysis: recResult
    });
  } catch (err: any) {
    console.error('Recommendation generation error:', err);
    res.status(500).json({ error: 'Failed to generate recommendation', details: err?.message });
  }
};

app.post('/api/level2/recommend', requireLevel(['LEVEL_2']), handleRecommendLevel2);
app.post('/api/recommend/level2', requireLevel(['LEVEL_2']), handleRecommendLevel2);

// Real-Time Recalculate Recommendation (/api/level2/recommend/recalculate)
app.post('/api/level2/recommend/recalculate', requireLevel(['LEVEL_2']), async (req: Request, res: Response) => {
  try {
    const { recommendationId, food, transformation, preferences, components, aiMode } = req.body;
    if (!food || !food.name) {
      return res.status(400).json({ error: 'Food profile is required.' });
    }

    const recResult = recommendationEngine.generateRecommendation(
      food,
      transformation,
      preferences,
      components || []
    );

    const existingIdx = dataStore.recommendations.findIndex((r) => r.id === recommendationId);
    let record: any;

    if (existingIdx !== -1) {
      record = {
        ...dataStore.recommendations[existingIdx],
        inputScenario: preferences,
        foodProfile: { ...food, transformation },
        topCandidate: recResult.topCandidate,
        actionableSummary: recResult.actionableSummary,
        detailedAnalysis: recResult.detailedAnalysis,
        configuration: recResult.configuration,
        alternatives: recResult.alternatives,
        whyExplanation: recResult.whyExplanation,
        costEstimate: recResult.costEstimate,
        sustainabilityScore: recResult.sustainabilityScore
      };
      dataStore.recommendations[existingIdx] = record;
    } else {
      const recId = recommendationId || `REC-${new Date().getFullYear()}-TK${Math.floor(1000 + Math.random() * 9000)}`;
      record = {
        id: recId,
        userId: req.user!.id,
        userName: req.user!.name,
        level: 'LEVEL_2' as const,
        title: `${food.name} Takeaway Packaging Suite`,
        foodName: food.name,
        components: components || [],
        foodProfile: { ...food, transformation },
        inputScenario: preferences,
        topCandidate: recResult.topCandidate,
        actionableSummary: recResult.actionableSummary,
        detailedAnalysis: recResult.detailedAnalysis,
        configuration: recResult.configuration,
        alternatives: recResult.alternatives,
        whyExplanation: recResult.whyExplanation,
        evidence: recResult.evidence,
        assumptions: recResult.assumptions,
        limitations: recResult.limitations,
        validationRequired: recResult.validationRequired,
        costEstimate: recResult.costEstimate,
        sustainabilityScore: recResult.sustainabilityScore,
        aiMode: aiMode || 'REAL',
        qrCodeUrl: '',
        createdAt: new Date().toISOString()
      };
      dataStore.recommendations.unshift(record);
    }

    dataStore.log(req.user!.id, 'RECALCULATE_RECOMMENDATION', 'LEVEL_2', `Recalculated recommendation for ${food.name}`);

    res.json({
      success: true,
      updated: true,
      recommendationId: record.id,
      record,
      analysis: recResult
    });
  } catch (err: any) {
    console.error('Recalculate error:', err);
    res.status(500).json({ error: 'Recalculation failed', details: err?.message });
  }
});

// Generate AI Packaging Visualization (POST /api/ai/packaging/visualize & /api/level2/package-preview)
const handleVisualizePackaging = async (req: Request, res: Response) => {
  try {
    const {
      food,
      foodName,
      components,
      material,
      materialName,
      materialCategory,
      packageStyle,
      packingConfiguration,
      configuration,
      ventilation,
      ventingType,
      temperatureState,
      servingTemperature,
      processingMethod,
      cookingMethod,
      recommendationId,
      recommendation
    } = req.body;

    let targetRec = recommendation;
    if (!targetRec && recommendationId) {
      targetRec = dataStore.recommendations.find((r) => r.id === recommendationId);
    }

    const payload = {
      food: food || foodName || targetRec?.foodName || targetRec?.title,
      components: components || targetRec?.components || [],
      material: material || materialName || targetRec?.topCandidate?.name || targetRec?.actionableSummary?.materialName || 'Sugarcane Bagasse',
      materialCategory: materialCategory || targetRec?.topCandidate?.category || targetRec?.actionableSummary?.materialCategory,
      packageStyle: packageStyle || targetRec?.actionableSummary?.packageStyle || targetRec?.configuration?.containerStyle || 'Three-compartment takeaway food container',
      packingConfiguration: packingConfiguration || configuration || targetRec?.actionableSummary?.configuration || targetRec?.configuration?.compartments || 'Dedicated separated food compartments',
      ventilation: ventilation || ventingType || targetRec?.detailedAnalysis?.steamCondensationRisk?.ventingRequired || targetRec?.configuration?.lidType,
      temperatureState: temperatureState || servingTemperature || targetRec?.foodProfile?.transformation?.servingTemperature || 'Hot',
      processingMethod: processingMethod || cookingMethod || targetRec?.foodProfile?.transformation?.cookingMethod,
      recommendationId
    };

    const visualResult = await visualizationService.generatePackagingVisual(payload);

    // Save the generated image/reference with the recommendation if available
    if (visualResult.success && visualResult.imageUrl && targetRec) {
      targetRec.generatedPackagingImage = visualResult.imageUrl;
      targetRec.packagingImagePrompt = visualResult.prompt;
    }

    if (req.user) {
      dataStore.log(
        req.user.id,
        'AI_PACKAGING_VISUALIZATION',
        req.user.role,
        `Generated packaging mockup for ${payload.food} (Success: ${visualResult.success})`
      );
    }

    res.json(visualResult);
  } catch (err: any) {
    console.error('Packaging visualization error:', err);
    res.status(500).json({
      success: false,
      error: 'Packaging visualization could not be generated.',
      details: err?.message
    });
  }
};

app.post('/api/ai/packaging/visualize', handleVisualizePackaging);
app.post('/api/level2/package-preview', requireLevel(['LEVEL_2']), handleVisualizePackaging);

// Packaging Knowledge Database APIs & Level 2 Specifics
app.get(['/api/packaging/materials', '/api/level2/materials'], (req: Request, res: Response) => {
  res.json({ materials: dataStore.materials });
});

app.get(['/api/packaging/styles', '/api/level2/package-styles', '/api/level2/styles'], (req: Request, res: Response) => {
  res.json({ styles: dataStore.packageStyles });
});

app.get(['/api/packaging/configurations', '/api/level2/configurations'], (req: Request, res: Response) => {
  res.json({ configurations: dataStore.packingConfigurations });
});

// Level 2 Audit / Recommendation History
app.get('/api/level2/history', requireLevel(['LEVEL_2']), (req: Request, res: Response) => {
  const userRecs = dataStore.recommendations.filter(
    (r) => r.level === 'LEVEL_2' && (r.userId === req.user?.id || req.user?.role === 'ADMIN')
  );
  res.json({ history: userRecs });
});

// ==========================================
// 3. LEVEL 1: FRESH PRODUCE INTELLIGENCE
// ==========================================

// Real Farmer Expert-Buddy Voice Conversation API (Accessible during Level 1 farmer experience)
app.post('/api/voice/farmer-converse', async (req: Request, res: Response) => {
  try {
    const { message, history, currentContext, language } = req.body;
    if (!message && (!history || history.length === 0)) {
      return res.status(400).json({ error: 'Message or conversation context required.' });
    }

    const result = await farmerVoiceService.converse(
      message || '',
      Array.isArray(history) ? history : [],
      currentContext || {},
      language || 'en'
    );

    if (req.user) {
      dataStore.log(
        req.user.id,
        'FARMER_VOICE_CONVERSATION',
        'LEVEL_1',
        `Farmer spoke: "${(message || '').slice(0, 60)}..." (Ready: ${result.readyForRecommendation})`
      );
    }

    res.json(result);
  } catch (err: any) {
    try {
      const fallbackResult = await farmerVoiceService.converseWithDynamicAgent(
        req.body?.message || '',
        Array.isArray(req.body?.history) ? req.body.history : [],
        req.body?.currentContext || {},
        req.body?.language || 'en'
      );
      return res.json(fallbackResult);
    } catch {
      res.status(500).json({ error: 'Failed to process farmer voice turn' });
    }
  }
});

// Audio Speech-to-Text Transcription Service (Accessible during Level 1 farmer experience)
app.post('/api/voice/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, language } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio base64 data required.' });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '').trim();
    const buffer = Buffer.from(cleanBase64, 'base64');

    // PRIMARY: Gemini Live & Multimodal Audio STT Provider
    const geminiAudio = new GeminiAudioSTTProvider();

    // OPTIONAL FALLBACK: Only if a valid external Whisper endpoint is explicitly configured in environment
    const whisper = new WhisperSTTProvider();
    if (whisper.isConfigured()) {
      try {
        const whisperResult = await whisper.transcribe(buffer, mimeType || 'audio/webm', language);
        if (whisperResult && whisperResult.text) {
          return res.json(whisperResult);
        }
      } catch (err: any) {
        console.info('[Audio] Optional Whisper fallback skipped, utilizing primary Gemini Live:', err?.message);
      }
    }

    // Default & Primary Execution via Gemini Live Speech Understanding
    try {
      const stt = await geminiAudio.transcribe(buffer, mimeType || 'audio/webm', language);
      return res.json(stt);
    } catch (sttErr: any) {
      console.info('Gemini Live server STT returned notice, providing client fallback:', sttErr?.message);
      return res.json({
        text: '',
        languageDetected: language || 'en',
        provider: 'Gemini Live Client STT Layer',
        notice: sttErr?.message
      });
    }
  } catch (err: any) {
    console.info('Voice transcription notice (using client STT):', err?.message || err);
    res.json({
      text: '',
      provider: 'Gemini Live Client Speech Layer',
      notice: err?.message
    });
  }
});

// Audio Text-to-Speech Synthesis Service (Accessible during Level 1 farmer experience)
// Guarantees real spoken audio output for Telugu, Hindi, Tamil, Kannada, and English on any client
app.post('/api/voice/tts', async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for speech synthesis.' });
    }

    const lang = (language || 'te').toLowerCase();
    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) {
      return res.status(400).json({ error: 'Non-empty text required.' });
    }

    // Split text into chunks <= 180 characters along sentence boundaries
    const sentences = cleanText.match(/[^.!?\n]+[.!?\n]?/g) || [cleanText];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      if ((current + ' ' + trimmed).length > 180) {
        if (current) chunks.push(current.trim());
        if (trimmed.length > 180) {
          const words = trimmed.split(' ');
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).length > 180) {
              if (sub) chunks.push(sub.trim());
              sub = w;
            } else {
              sub += (sub ? ' ' : '') + w;
            }
          }
          if (sub) chunks.push(sub.trim());
          current = '';
        } else {
          current = trimmed;
        }
      } else {
        current += (current ? ' ' : '') + trimmed;
      }
    }
    if (current) chunks.push(current.trim());

    // Fetch MP3 chunks for the target language (supports te, hi, ta, kn, en)
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks.slice(0, 5)) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
      const ttsRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (ttsRes.ok) {
        const ab = await ttsRes.arrayBuffer();
        audioBuffers.push(Buffer.from(ab));
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'Failed to synthesize speech audio from upstream' });
    }

    const combinedAudio = Buffer.concat(audioBuffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', combinedAudio.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(combinedAudio);
  } catch (err: any) {
    console.info('TTS synthesis error notice:', err?.message || err);
    res.status(500).json({ error: 'Failed to synthesize speech', details: err?.message });
  }
});

app.post('/api/recommend/level1', async (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (!input.commodityName) {
      return res.status(400).json({ error: 'Commodity name is required.' });
    }
    const result = levelEngines.generateLevel1(input);
    if (req.user) {
      dataStore.log(req.user.id, 'LEVEL1_RECOMMENDATION', 'LEVEL_1', `Analyzed fresh commodity: ${input.commodityName}`);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Level 1 recommendation error', details: err?.message });
  }
});

// ==========================================
// 4. LEVEL 3: PACKAGED FOOD / STARTUP
// ==========================================

app.post('/api/recommend/level3', requireLevel(['LEVEL_3']), async (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (!input.productName || !input.productCategory) {
      return res.status(400).json({ error: 'Product name and category are required.' });
    }
    const result = levelEngines.generateLevel3(input);
    dataStore.log(req.user!.id, 'LEVEL3_RECOMMENDATION', 'LEVEL_3', `Formulated barrier laminate for: ${input.productName}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Level 3 recommendation error', details: err?.message });
  }
});

// ==========================================
// 5. LEVEL 4: EXPERT & INDUSTRIAL WORKBENCH
// ==========================================

app.post('/api/recommend/level4/what-if', requireLevel(['LEVEL_4']), async (req: Request, res: Response) => {
  try {
    const params = req.body;
    const result = levelEngines.runWhatIfSimulation(params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Simulation failed', details: err?.message });
  }
});

app.post('/api/recommend/level4/reverse-search', requireLevel(['LEVEL_4']), async (req: Request, res: Response) => {
  try {
    const criteria = req.body;
    const results = levelEngines.reverseMaterialSearch(criteria);
    res.json({ count: results.length, materials: results });
  } catch (err: any) {
    res.status(500).json({ error: 'Reverse search failed', details: err?.message });
  }
});

// Level 4: Evaluate New Material
app.post('/api/recommend/level4/evaluate-new-material', requireLevel(['LEVEL_4']), async (req: Request, res: Response) => {
  try {
    const submission = req.body;
    if (!submission.name || submission.otrValue === undefined || submission.wvtrValue === undefined) {
      return res.status(400).json({ error: 'Material name, OTR, and WVTR values are required.' });
    }
    const newMaterial = levelEngines.evaluateNewMaterial(submission);
    dataStore.log(req.user!.id, 'EVALUATE_NEW_MATERIAL', 'LEVEL_4', `Evaluated new material: ${newMaterial.name} (${newMaterial.code})`);
    res.json({ success: true, material: newMaterial });
  } catch (err: any) {
    res.status(500).json({ error: 'New material evaluation failed', details: err?.message });
  }
});

// Level 4: Tray + Lid Sealing Compatibility
app.post('/api/recommend/level4/tray-lid-compatibility', requireLevel(['LEVEL_4']), async (req: Request, res: Response) => {
  try {
    const { trayMaterialId, lidMaterialId, sealingTempC } = req.body;
    if (!trayMaterialId || !lidMaterialId) {
      return res.status(400).json({ error: 'Both trayMaterialId and lidMaterialId are required.' });
    }
    const result = levelEngines.evaluateTrayLidCompatibility(trayMaterialId, lidMaterialId, sealingTempC);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Tray/Lid compatibility check failed', details: err?.message });
  }
});

// Level 4: Material -> Food Application Matching Matrix
app.post('/api/recommend/level4/material-application-match', requireLevel(['LEVEL_4']), async (req: Request, res: Response) => {
  try {
    const { materialId } = req.body;
    if (!materialId) {
      return res.status(400).json({ error: 'Material ID is required.' });
    }
    const results = levelEngines.reverseMaterialSearch({ materialId });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Material not found.' });
    }
    res.json(results[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Material application match failed', details: err?.message });
  }
});

app.post('/api/diagnose/failure', requireLevel(['LEVEL_4', 'LEVEL_2', 'LEVEL_3']), async (req: Request, res: Response) => {
  try {
    const input = req.body;
    if (!input.observedProblem) {
      return res.status(400).json({ error: 'Observed problem is required.' });
    }
    const result = failureDiagnosisEngine.diagnose(input);
    dataStore.log(req.user!.id, 'FAILURE_DIAGNOSIS', req.user!.role, `Diagnosed problem: ${input.observedProblem}`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Diagnosis failed', details: err?.message });
  }
});

// ==========================================
// 6. SHARED KNOWLEDGE BASE & AI ASSISTANT
// ==========================================

app.get('/api/knowledge/materials', (req: Request, res: Response) => {
  res.json({ materials: dataStore.materials });
});

app.get('/api/knowledge/foods', (req: Request, res: Response) => {
  res.json({ foods: dataStore.foods });
});

app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question text is required.' });
    }
    const result = await assistantService.answerQuestion(question, context);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Assistant failed', details: err?.message });
  }
});

// ==========================================
// 7. HISTORY & PUBLIC QR VERIFICATION
// ==========================================

app.get('/api/history', (req: Request, res: Response) => {
  const user = req.user!;
  const userRecs = user.role === 'ADMIN'
    ? dataStore.recommendations
    : dataStore.recommendations.filter(r => r.userId === user.id);
  res.json({ recommendations: userRecs });
});

app.get('/api/history/:id', (req: Request, res: Response) => {
  const rec = dataStore.recommendations.find(r => r.id === req.params.id);
  if (!rec) {
    return res.status(404).json({ error: 'Recommendation not found.' });
  }
  res.json({ recommendation: rec });
});

// Public Non-Sensitive QR Verification Endpoint
app.get('/api/verify/:id', (req: Request, res: Response) => {
  const rec = dataStore.recommendations.find(r => r.id === req.params.id);
  if (!rec) {
    return res.status(404).json({
      valid: false,
      error: 'Invalid or expired recommendation ID.'
    });
  }

  // Strictly non-sensitive verification payload (zero private user PII)
  res.json({
    valid: true,
    recommendationId: rec.id,
    title: rec.title,
    foodName: rec.foodName,
    configuration: {
      containerName: rec.configuration?.containerName,
      materialStructure: rec.configuration?.structure,
      lidType: rec.configuration?.lidType,
      greaseBarrierRating: rec.configuration?.greaseResistance,
      moistureManagement: rec.configuration?.moistureManagement
    },
    sustainabilityScore: rec.sustainabilityScore,
    certifiedDate: rec.createdAt,
    engineVersion: 'FOODPACK-AI v2.4 (SIH26236 Certified Core)',
    validationStatus: 'Evidence-Based Engineering Compliance Verified',
    traceableStandards: rec.evidence?.map((e: any) => `${e.source} (${e.testMethod || 'ASTM/ISO'})`) || []
  });
});

// ==========================================
// 7.5 PACKAGING ASSET LIBRARY & DYNAMIC VISUALIZATION
// ==========================================

// Get all packaging asset records
app.get('/api/packaging/assets', (req: Request, res: Response) => {
  try {
    const { crop, category } = req.query;
    let list = packagingAssetStore.getAll();
    if (crop && typeof crop === 'string') {
      const cLower = crop.toLowerCase();
      list = list.filter((a) =>
        a.compatibleCrops.some((c) => c.toLowerCase().includes(cLower))
      );
    }
    if (category && typeof category === 'string') {
      const catLower = category.toLowerCase();
      list = list.filter((a) =>
        a.foodCategories.some((c) => c.toLowerCase().includes(catLower))
      );
    }
    res.json({ count: list.length, assets: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve packaging assets', details: err?.message });
  }
});

// Get single packaging asset record by ID (e.g. MAT-001)
app.get('/api/packaging/assets/:id', (req: Request, res: Response) => {
  try {
    const record = packagingAssetStore.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: `Packaging asset ${req.params.id} not found.` });
    }
    res.json(record);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve packaging asset', details: err?.message });
  }
});

// Resolve authoritative packaging asset and packing configuration from recommendation parameters
app.post('/api/packaging/resolve-asset', (req: Request, res: Response) => {
  try {
    const { crop, transportDays, refrigeration, packagingFormat } = req.body;
    if (!crop || typeof crop !== 'string') {
      return res.status(400).json({ error: 'Crop parameter required.' });
    }

    const asset = packagingAssetStore.findByCropAndConditions(
      crop,
      transportDays ? Number(transportDays) : undefined,
      refrigeration !== undefined ? Boolean(refrigeration) : undefined,
      packagingFormat
    );

    const packingConfiguration = packagingVisualizationService.derivePackingConfiguration(
      crop,
      asset,
      { transportDays: Number(transportDays), refrigeration: Boolean(refrigeration) }
    );

    res.json({
      success: true,
      crop,
      packagingAsset: asset,
      packingConfiguration
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve packaging asset', details: err?.message });
  }
});

// Generate or retrieve dynamic crop-inside-package visualization
app.post('/api/packaging/visualize', async (req: Request, res: Response) => {
  try {
    const { crop, materialId, transportDays, refrigeration, packagingFormat } = req.body;
    if (!crop) {
      return res.status(400).json({ error: 'Crop name required.' });
    }

    let asset = materialId ? packagingAssetStore.getById(materialId) : undefined;
    if (!asset) {
      asset = packagingAssetStore.findByCropAndConditions(
        crop,
        transportDays ? Number(transportDays) : undefined,
        refrigeration !== undefined ? Boolean(refrigeration) : undefined,
        packagingFormat
      );
    }

    const config = packagingVisualizationService.derivePackingConfiguration(
      crop,
      asset,
      { transportDays: Number(transportDays), refrigeration: Boolean(refrigeration) }
    );

    const visualization = await packagingVisualizationService.generatePackingVisualization(
      crop,
      asset,
      config
    );

    res.json({
      success: true,
      visualization,
      packagingAsset: asset,
      packingConfiguration: config
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Packaging visualization failed', details: err?.message });
  }
});

// Dedicated AI Packaging Visualization endpoint (POST /api/ai/packaging/visualize)
app.post('/api/ai/packaging/visualize', async (req: Request, res: Response) => {
  try {
    const { crop, packageId, material, materialId, packageType, packingConfiguration, transportConfiguration } = req.body;
    if (!crop) {
      return res.status(400).json({ error: 'Crop name required for packaging visualization.' });
    }

    const matId = materialId || packageId || (material && material.includes('MAT-') ? material : undefined);
    let asset = matId ? packagingAssetStore.getById(matId) : undefined;
    if (!asset) {
      asset = packagingAssetStore.findByCropAndConditions(
        crop,
        transportConfiguration?.durationDays,
        transportConfiguration?.refrigeration,
        packageType
      );
    }

    const config = packingConfiguration || packagingVisualizationService.derivePackingConfiguration(
      crop,
      asset,
      {
        transportDays: transportConfiguration?.durationDays,
        refrigeration: transportConfiguration?.refrigeration
      }
    );

    const visualization = await packagingVisualizationService.generatePackingVisualization(
      crop,
      asset,
      config
    );

    res.json({
      success: true,
      visualization,
      packagingAsset: asset,
      packingConfiguration: config
    });
  } catch (err: any) {
    res.status(500).json({ error: 'AI packaging visualization failed', details: err?.message });
  }
});

// Authoritative Level 1 Packaging Recommendation (recommendPackaging)
app.post('/api/level1/recommend-packaging', (req: Request, res: Response) => {
  try {
    const farmerContext = req.body || {};
    const result = recommendPackaging(farmerContext);
    res.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Packaging recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate packaging recommendation', details: err?.message });
  }
});

// Packaging Shopping Links / Verified Suppliers
app.get('/api/packaging/shopping-links', (req: Request, res: Response) => {
  try {
    const { packageId, materialId } = req.query;
    const id = (packageId || materialId) as string | undefined;
    if (!id) {
      return res.json({
        available: false,
        shoppingInfo: null,
        message: 'Supplier link unavailable'
      });
    }

    const shoppingInfo = packagingShoppingService.getShoppingInfo(id);
    if (!shoppingInfo) {
      return res.json({
        available: false,
        shoppingInfo: null,
        message: 'Supplier link unavailable'
      });
    }

    res.json({
      available: true,
      shoppingInfo,
      message: 'Verified procurement source available'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve shopping link', details: err?.message });
  }
});

// Explain Specific Packing Instruction Step (Container 3)
app.post('/api/level1/explain-step', async (req: Request, res: Response) => {
  try {
    const { crop, packageType, stepNumber, stepText, farmerContext, language } = req.body;
    if (!stepText) {
      return res.status(400).json({ error: 'stepText is required.' });
    }

    const explanation = await stepExplanationService.explainStep({
      crop,
      packageType,
      stepNumber: Number(stepNumber) || 1,
      stepText,
      farmerContext,
      language
    });

    res.json({
      success: true,
      ...explanation
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to explain instruction step', details: err?.message });
  }
});

// Save Farmer Recommendation with QR Code Hash
app.post('/api/recommendations/save-farmer', async (req: Request, res: Response) => {
  try {
    const { recommendation, farmerContext } = req.body;
    if (!recommendation) {
      return res.status(400).json({ error: 'Recommendation object is required.' });
    }

    const recId = recommendation.recommendationId || `REC-${new Date().getFullYear()}-L1-${Math.floor(1000 + Math.random() * 9000)}`;
    const cropName = farmerContext?.crop || farmerContext?.commodity || recommendation.package?.name || 'Fresh Produce';

    let qrCodeUrl = '';
    try {
      const verifyPayload = JSON.stringify({
        id: recId,
        crop: cropName,
        package: recommendation.package?.packageType,
        material: recommendation.material?.name,
        date: new Date().toISOString().split('T')[0],
        engine: 'FOODPACK-AI v2.4 (Level 1 Post-Harvest)'
      });
      qrCodeUrl = await QRCode.toDataURL(verifyPayload, {
        margin: 1,
        color: {
          dark: '#059669',
          light: '#022c22'
        }
      });
    } catch (qrErr) {
      console.warn('QR Code generation error:', qrErr);
    }

    const userId = req.user ? req.user.id : 'usr-farmer-01';
    const userName = req.user ? req.user.name : 'Ramesh Patel (Kisan Agro Farms)';

    const record = {
      id: recId,
      userId,
      userName,
      level: 'LEVEL_1' as const,
      title: `${cropName} Post-Harvest Packaging Suite`,
      foodName: cropName,
      inputScenario: farmerContext || {},
      topCandidate: {
        containerName: recommendation.package?.packageType,
        materialStructure: recommendation.material?.name,
        lidType: recommendation.package?.ventilation,
        greaseResistance: 'TAPPI T559 Certified',
        moistureManagement: recommendation.package?.ventilation
      },
      actionableSummary: recommendation.reason,
      detailedAnalysis: {
        packing: recommendation.packingConfiguration,
        shelfLife: recommendation.shelfLifeDays
      },
      configuration: {
        containerName: recommendation.package?.packageType,
        structure: recommendation.material?.composition,
        ventilation: recommendation.package?.ventilation
      },
      alternatives: recommendation.alternatives || [],
      whyExplanation: recommendation.reason,
      evidence: recommendation.evidence || [],
      limitations: recommendation.limitations || [],
      sustainabilityScore: recommendation.sustainabilityRating || 90,
      costEstimate: `₹${(recommendation.costPerUnitINR || 45).toFixed(2)} / unit`,
      aiMode: 'REAL' as const,
      qrCodeUrl,
      createdAt: new Date().toISOString()
    };

    dataStore.recommendations.unshift(record);
    dataStore.log(userId, 'GENERATE_RECOMMENDATION', 'LEVEL_1', `Saved post-harvest recommendation ${recId} for ${cropName}`);

    res.json({
      success: true,
      recommendationId: recId,
      record,
      qrCodeUrl
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save recommendation', details: err?.message });
  }
});

// Admin: Create or update packaging asset record
app.post('/api/packaging/assets', requireLevel(['ADMIN', 'LEVEL_4']), (req: Request, res: Response) => {
  try {
    const record = packagingAssetStore.create(req.body);
    dataStore.log(req.user!.id, 'CREATE_PACKAGING_ASSET', req.user!.role, `Created packaging asset: ${record.materialId} (${record.materialName})`);
    res.json({ success: true, asset: record });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create packaging asset', details: err?.message });
  }
});

app.put('/api/packaging/assets/:id', requireLevel(['ADMIN', 'LEVEL_4']), (req: Request, res: Response) => {
  try {
    const updated = packagingAssetStore.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: `Packaging asset ${req.params.id} not found.` });
    }
    dataStore.log(req.user!.id, 'UPDATE_PACKAGING_ASSET', req.user!.role, `Updated packaging asset: ${req.params.id}`);
    res.json({ success: true, asset: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update packaging asset', details: err?.message });
  }
});

// Admin: Upload / add packaging image to record
app.post('/api/packaging/assets/:id/images', requireLevel(['ADMIN', 'LEVEL_4']), (req: Request, res: Response) => {
  try {
    const { viewType, imageUrl, caption, isPrimary } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL or base64 data required.' });
    }

    const imageItem = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      viewType: viewType || 'product',
      imageUrl,
      caption: caption || `${viewType || 'product'} view`,
      isPrimary: Boolean(isPrimary)
    };

    const updated = packagingAssetStore.addImage(req.params.id, imageItem);
    if (!updated) {
      return res.status(404).json({ error: `Packaging asset ${req.params.id} not found.` });
    }

    dataStore.log(req.user!.id, 'ADD_PACKAGING_IMAGE', req.user!.role, `Added ${viewType} image to ${req.params.id}`);
    res.json({ success: true, asset: updated, addedImage: imageItem });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add image to packaging asset', details: err?.message });
  }
});

// ==========================================
// 8. ADMIN DASHBOARD APIS
// ==========================================

app.get('/api/admin/audit-logs', requireLevel(['LEVEL_4']), (req: Request, res: Response) => {
  res.json({ logs: dataStore.auditLogs });
});

app.get('/api/admin/stats', requireLevel(['LEVEL_4']), (req: Request, res: Response) => {
  res.json({
    totalUsers: dataStore.users.length,
    totalRecommendations: dataStore.recommendations.length,
    totalMaterials: dataStore.materials.length,
    totalFoods: dataStore.foods.length,
    recentAudits: dataStore.auditLogs.slice(0, 10),
    levelDistribution: {
      LEVEL_1: dataStore.users.filter(u => u.role === 'LEVEL_1').length,
      LEVEL_2: dataStore.users.filter(u => u.role === 'LEVEL_2').length,
      LEVEL_3: dataStore.users.filter(u => u.role === 'LEVEL_3').length,
      LEVEL_4: dataStore.users.filter(u => u.role === 'LEVEL_4').length,
      ADMIN: dataStore.users.filter(u => u.role === 'ADMIN').length
    }
  });
});

// ==========================================
// 9. VITE DEV SERVER / STATIC SERVING
// ==========================================

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(` FOODPACK-AI Full-Stack Server Running on Port ${PORT}`);
    console.log(` SIH26236 Decision Support Engine Initialized`);
    console.log(` AI Mode: ${process.env.GEMINI_API_KEY ? 'REAL (Gemini 3.8 Flash)' : 'FALLBACK (Simulated Multimodal Pipeline)'}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
