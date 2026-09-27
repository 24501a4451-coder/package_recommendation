import React, { useState } from 'react';
import { AIAnalysisResult } from '../../types';
import {
  Check,
  Edit2,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Layers,
  Thermometer,
  CloudRain,
  Flame
} from 'lucide-react';

export interface ConfirmedFoodPayload {
  primaryFoodName: string;
  components: string[];
  ingredients: { name: string; isCertain: boolean }[];
  possibleIngredients: string[];
  processingState: string;
  cookingMethod: 'Deep Fried' | 'Dum Steamed / Boiled' | 'Baked / Roasted' | 'Simmered Curry' | 'Raw / Fresh' | 'Extruded / Dried' | 'Refrigerated Cold' | 'Grilled / Charred';
  preparationFreshness: 'Freshly Prepared' | 'Previously Cooked / Held' | 'Reheated';
  consistency: 'Dry / Crispy' | 'Moist / Solid Grains' | 'Viscous Gravy / Curry' | 'High Liquid / Runny';
  servingTemperature: 'Very Hot (>75°C)' | 'Warm (50-70°C)' | 'Room Temp (20-30°C)' | 'Chilled (0-8°C)' | 'Frozen (<-18°C)';
  moistureReleaseState: 'High Active Steam' | 'Moderate Vapor' | 'Static Moisture' | 'Dry';
  physicalTexture: 'Crisp Batter Crust' | 'Moist Grains' | 'Viscous Liquid Gravy' | 'Solid Fresh Cell' | 'Brittle Snack';
  multiComponentHazards: string[];
}

interface Props {
  analysis: AIAnalysisResult;
  onConfirm: (confirmedFood: ConfirmedFoodPayload) => void;
  onCancel: () => void;
}

export const FoodConfirmationModal: React.FC<Props> = ({ analysis, onConfirm, onCancel }) => {
  const [foodName, setFoodName] = useState(analysis.primaryFoodName);
  
  // Components / Sides (e.g. Biryani, Chicken 65, Raita, Salad)
  const [components, setComponents] = useState<string[]>([...analysis.components]);
  const [newComponent, setNewComponent] = useState('');

  // Ingredients with certainty flags
  const initialIngredients = (analysis.possibleIngredients || []).map((ing, i) => ({
    name: ing,
    isCertain: i < 3 // First few visually prominent are certain; others are inferred
  }));
  const [ingredients, setIngredients] = useState<{ name: string; isCertain: boolean }[]>(
    initialIngredients.length > 0
      ? initialIngredients
      : [
          { name: 'Primary Core Food', isCertain: true },
          { name: 'Spices & Seasoning', isCertain: false },
          { name: 'Cooking Oil / Ghee', isCertain: false }
        ]
  );
  const [newIngredient, setNewIngredient] = useState('');
  const [newIngredientCertain, setNewIngredientCertain] = useState(true);
  const [editingIngredientIdx, setEditingIngredientIdx] = useState<number | null>(null);
  const [editingIngredientText, setEditingIngredientText] = useState('');

  // Cooking & Thermodynamic Parameters
  const [cookingMethod, setCookingMethod] = useState<any>(analysis.cookingMethod || 'Dum Steamed / Boiled');
  const [preparationFreshness, setPreparationFreshness] = useState<'Freshly Prepared' | 'Previously Cooked / Held' | 'Reheated'>('Freshly Prepared');
  const [consistency, setConsistency] = useState<'Dry / Crispy' | 'Moist / Solid Grains' | 'Viscous Gravy / Curry' | 'High Liquid / Runny'>(
    analysis.physicalTexture === 'Crisp Batter Crust'
      ? 'Dry / Crispy'
      : analysis.physicalTexture === 'Viscous Liquid Gravy'
      ? 'Viscous Gravy / Curry'
      : 'Moist / Solid Grains'
  );
  const [servingTemp, setServingTemp] = useState(analysis.servingTemperature || 'Very Hot (>75°C)');
  const [moistureRelease, setMoistureRelease] = useState(analysis.moistureReleaseState || 'High Active Steam');
  const [physicalTexture, setPhysicalTexture] = useState(analysis.physicalTexture || 'Moist Grains');
  const [processingState, setProcessingState] = useState(analysis.processingState || 'Cooked Hot');

  // Dynamic Hazard Analysis based on components & ingredients
  const calculateHazards = () => {
    const list = [...components, foodName].map(c => c.toLowerCase());
    const hazards: string[] = [];
    
    const hasRiceOrSteam = list.some(c => c.includes('biryani') || c.includes('rice') || c.includes('dum') || c.includes('steamed') || c.includes('pulao'));
    const hasColdDairy = list.some(c => c.includes('raita') || c.includes('curd') || c.includes('yogurt') || c.includes('salad') || c.includes('chutney'));
    const hasCrisp = list.some(c => c.includes('65') || c.includes('fried') || c.includes('crisp') || c.includes('fry') || c.includes('papad') || c.includes('kachori') || c.includes('finger'));
    const hasGravy = list.some(c => c.includes('gravy') || c.includes('curry') || c.includes('salan') || c.includes('dal') || c.includes('sambar'));

    if (hasRiceOrSteam && hasColdDairy) {
      hazards.push('Cold Dairy Degradation: Hot steam (>75°C) warming cold raita/curd causes curd syneresis (whey separation) and microbial risk.');
    }
    if (hasRiceOrSteam && hasCrisp) {
      hazards.push('Crispness Loss Hazard: Trapped water vapor from hot rice will diffuse into crispy batter, causing plasticization and rapid sogginess.');
    }
    if (hasGravy && hasCrisp) {
      hazards.push('Gravy Capillary Migration: Free liquid and oil from gravy will wet crunchy surfaces, requiring sealed physical barrier.');
    }
    if (hasGravy && hasRiceOrSteam && hasColdDairy && hasCrisp) {
      hazards.push('Quad-Component Meal System: Mandates a multi-compartment hybrid system with separate leakproof cold cup and ventilated crisp chamber.');
    }

    return hazards;
  };

  const currentHazards = calculateHazards();

  // Ingredient actions
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([
        ...ingredients,
        { name: newIngredient.trim(), isCertain: newIngredientCertain }
      ]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleSaveEditIngredient = (idx: number) => {
    if (editingIngredientText.trim()) {
      const updated = [...ingredients];
      updated[idx].name = editingIngredientText.trim();
      setIngredients(updated);
    }
    setEditingIngredientIdx(null);
    setEditingIngredientText('');
  };

  // Component actions
  const handleAddComponent = () => {
    if (newComponent.trim() && !components.includes(newComponent.trim())) {
      setComponents([...components, newComponent.trim()]);
      setNewComponent('');
    }
  };

  const handleRemoveComponent = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const handleConfirmSubmit = () => {
    onConfirm({
      primaryFoodName: foodName,
      components,
      ingredients,
      possibleIngredients: ingredients.map(i => i.name),
      processingState,
      cookingMethod,
      preparationFreshness,
      consistency,
      servingTemperature: servingTemp,
      moistureReleaseState: moistureRelease,
      physicalTexture,
      multiComponentHazards: currentHazards
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 text-slate-200 shadow-2xl my-8 relative">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Step 2: Ingredient & Recipe Verification
              </span>
              <span className="text-xs text-slate-400 font-mono">Confidence: {analysis.confidence}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Food System & Processing Verification
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Packaging physics depend on food constituents, preparation methods, and meal combinations. Confirm or adjust the detected properties below.
            </p>
          </div>
        </div>

        {/* Multi-Component Interaction Alerts */}
        {currentHazards.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-6 text-xs text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Multi-Component Thermodynamic Interactions Detected ({currentHazards.length})</span>
            </div>
            <ul className="space-y-1 pl-5 list-disc text-slate-300">
              {currentHazards.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          
          {/* 1. Primary Food Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Primary Food Identity (Edit if needed)
            </label>
            <div className="relative">
              <input
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-medium focus:border-indigo-500 focus:outline-hidden text-sm"
              />
              <Edit2 className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          {/* 2. Detected Ingredients with Certainty Indicators */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Detected Ingredients ({ingredients.length})
              </label>
              <span className="text-[11px] text-slate-500">Probabilistic detections tagged with (?)</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                    ing.isCertain
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                  }`}
                >
                  {editingIngredientIdx === idx ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingIngredientText}
                        onChange={(e) => setEditingIngredientText(e.target.value)}
                        className="bg-slate-950 text-white px-2 py-0.5 rounded text-xs border border-indigo-500 focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveEditIngredient(idx)}
                        className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{ing.name}</span>
                      {!ing.isCertain && (
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded-sm">
                          (?) Uncertain
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIngredientIdx(idx);
                          setEditingIngredientText(ing.name);
                        }}
                        className="text-slate-400 hover:text-white p-0.5"
                        title="Edit ingredient name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-slate-400 hover:text-red-400 p-0.5"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add Ingredient Form */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                placeholder="Add ingredient (e.g., Cashews, Saffron, Garlic, Mint)..."
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIngredientCertain}
                    onChange={(e) => setNewIngredientCertain(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Verified Certain</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>[ Add Ingredient ]</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Meal Components / Side Items */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Multi-Component Meal Items & Sides ({components.length})
              </label>
              <span className="text-[11px] text-indigo-400 font-mono">Controls Separation Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Adding side components (e.g. Biryani + Raita + Chicken 65 + Salad) triggers thermodynamic separation rules and compartment recommendations.
            </p>

            <div className="flex flex-wrap gap-2">
              {components.map((comp, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60"
                >
                  <span>{comp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="text-slate-400 hover:text-red-400 p-0.5 cursor-pointer"
                    title="Remove component"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                placeholder="Add component / side (e.g., Crispy Chicken 65, Cold Raita, Salan, Green Salad)..."
                value={newComponent}
                onChange={(e) => setNewComponent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddComponent())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddComponent}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>[ Add Component ]</span>
              </button>
            </div>
          </div>

          {/* 4. Recipe, Processing & Thermodynamic Understanding */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Recipe & Processing Understanding</span>
              </span>
              <span className="text-[10px] text-slate-500">Thermodynamic Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Cooking / Preparation Method</label>
                <select
                  value={cookingMethod}
                  onChange={(e) => setCookingMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Dum Steamed / Boiled">Dum Steamed / Boiled (e.g. Biryani, Rice, Idli)</option>
                  <option value="Deep Fried">Deep Fried (e.g. Fried Chicken, Samosa, Fries)</option>
                  <option value="Baked / Roasted">Baked / Roasted (e.g. Pizza, Bread, Tandoori)</option>
                  <option value="Grilled / Charred">Grilled / Charred (e.g. Kebabs, Paneer Tikka)</option>
                  <option value="Simmered Curry">Simmered Curry / Gravy (e.g. Butter Gravy, Dal, Salan)</option>
                  <option value="Raw / Fresh">Raw / Fresh (e.g. Fresh Salad, Greens, Fruits)</option>
                  <option value="Refrigerated Cold">Refrigerated Cold (e.g. Cold Pastry, Cold Curd)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Preparation Freshness & State</label>
                <select
                  value={preparationFreshness}
                  onChange={(e) => setPreparationFreshness(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Freshly Prepared">Freshly Prepared (Hot Dispatch directly from pan)</option>
                  <option value="Previously Cooked / Held">Previously Cooked / Bain-Marie Hot Holding</option>
                  <option value="Reheated">Reheated (Microwave / Salamander blast)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Meal Consistency</label>
                <select
                  value={consistency}
                  onChange={(e) => setConsistency(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Dry / Crispy">Dry / Crispy (Requires ventilation)</option>
                  <option value="Moist / Solid Grains">Moist / Solid Grains (Basmati Rice, Noodles)</option>
                  <option value="Viscous Gravy / Curry">Viscous Gravy / Curry (Spill risk)</option>
                  <option value="High Liquid / Runny">High Liquid / Runny (Soup, Rasam, Broth)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Dispatch Serving Temperature</label>
                <select
                  value={servingTemp}
                  onChange={(e) => setServingTemp(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Very Hot (>75°C)">Very Hot (&gt;75°C) — Extreme Steam Pressure</option>
                  <option value="Warm (50-70°C)">Warm (50-70°C)</option>
                  <option value="Room Temp (20-30°C)">Room Temperature (20-30°C)</option>
                  <option value="Chilled (0-8°C)">Chilled (0-8°C) — Cold Chain</option>
                  <option value="Frozen (<-18°C)">Frozen (&lt;-18°C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Moisture Release Behavior</label>
                <select
                  value={moistureRelease}
                  onChange={(e) => setMoistureRelease(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="High Active Steam">High Active Steam (Trapped vapor causes sogginess)</option>
                  <option value="Moderate Vapor">Moderate Vapor</option>
                  <option value="Static Moisture">Static Moisture (Liquid Gravy)</option>
                  <option value="Dry">Dry / Non-emitting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Texture Vulnerability</label>
                <select
                  value={physicalTexture}
                  onChange={(e) => setPhysicalTexture(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Crisp Batter Crust">Crisp Batter Crust (Extreme sogginess risk)</option>
                  <option value="Moist Grains">Moist Grains (Basmati Rice, Dum)</option>
                  <option value="Viscous Liquid Gravy">Viscous Liquid Gravy (Spill / Seepage risk)</option>
                  <option value="Solid Fresh Cell">Solid Fresh Cell (Crisp Raw Greens)</option>
                  <option value="Brittle Snack">Brittle Snack</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold cursor-pointer"
          >
            Cancel & Re-scan
          </button>
          <button
            type="button"
            onClick={handleConfirmSubmit}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>[ Confirm ] & Proceed to Takeaway Questionnaire</span>
          </button>
        </div>

      </div>
    </div>
  );
};
