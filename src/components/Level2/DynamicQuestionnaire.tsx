import React, { useState } from 'react';
import { UserPreferences } from '../../types';
import { Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface Props {
  foodName: string;
  cookingMethod: string;
  components: string[];
  onSubmit: (preferences: UserPreferences) => void;
  onBack: () => void;
  loading: boolean;
}

export const DynamicQuestionnaire: React.FC<Props> = ({
  foodName,
  cookingMethod,
  components,
  onSubmit,
  onBack,
  loading
}) => {
  // Core Questions State
  const [deliveryMethod, setDeliveryMethod] = useState('Food delivery');
  const [customDeliveryMethod, setCustomDeliveryMethod] = useState('');

  const [deliveryTime, setDeliveryTime] = useState<'Less than 30 minutes' | '30–60 minutes' | '1–2 hours' | 'More than 2 hours'>('30–60 minutes');
  const [customDeliveryTime, setCustomDeliveryTime] = useState('');

  const [foodCondition, setFoodCondition] = useState('Very hot');
  const [transport, setTransport] = useState('Ambient');

  const [servingSize, setServingSize] = useState('Single serving');
  const [customServingSize, setCustomServingSize] = useState('');

  const [budget, setBudget] = useState<'Economy' | 'Balanced' | 'Premium'>('Balanced');

  const [sustainability, setSustainability] = useState<
    'Normal' | 'Prefer recyclable' | 'Prefer biodegradable/compostable' | 'Strong sustainability preference'
  >('Prefer biodegradable/compostable');
  const [customSustainability, setCustomSustainability] = useState('');

  // Multi-select Priorities
  const [priorities, setPriorities] = useState<string[]>([
    'Keep food hot',
    'Prevent leakage',
    'Reduce condensation',
    'Sustainability'
  ]);

  // Food-Specific Questions State - considers both primary food and all side components
  const allFoodText = [foodName, ...(components || [])].join(' ').toLowerCase();
  const isFried = cookingMethod === 'Deep Fried' || allFoodText.includes('fried') || allFoodText.includes('crisp') || allFoodText.includes('65') || allFoodText.includes('fry');
  const isBiryaniOrRice = cookingMethod === 'Dum Steamed / Boiled' || allFoodText.includes('biryani') || allFoodText.includes('rice') || allFoodText.includes('dum') || allFoodText.includes('pulao');
  const isPizza = allFoodText.includes('pizza');
  const isCurry = cookingMethod === 'Simmered Curry' || allFoodText.includes('curry') || allFoodText.includes('gravy') || allFoodText.includes('salan') || allFoodText.includes('dal') || allFoodText.includes('sambar');
  const isBakery = allFoodText.includes('cake') || allFoodText.includes('pastry') || allFoodText.includes('bakery');

  const [friedCrispPriority, setFriedCrispPriority] = useState('Mandate steam chimney ventilation to prevent sogginess');
  const [riceCompartmentPref, setRiceCompartmentPref] = useState('Separate chilled raita / hot salan into leakproof side cups');
  const [pizzaRidgePref, setPizzaRidgePref] = useState('Elevated micro-flute ridges with corner steam vents');
  const [currySealingPref, setCurrySealingPref] = useState('Hermetic snap-rim gasket certified for hot oils');

  const togglePriority = (p: string) => {
    if (priorities.includes(p)) {
      setPriorities(priorities.filter(item => item !== p));
    } else {
      setPriorities([...priorities, p]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      deliveryMethod: deliveryMethod === 'Other' ? customDeliveryMethod || 'Custom Delivery' : deliveryMethod,
      deliveryTime,
      servingSize: servingSize === 'Custom' ? customServingSize || 'Custom Size' : servingSize,
      budget,
      sustainability,
      priorities
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto text-slate-200">
      
      {/* Dynamic Intro Card */}
      <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/40 p-6 rounded-3xl border border-indigo-500/20 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold uppercase mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Dynamic Decision Questionnaire</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Takeaway Scenario for: <span className="text-indigo-400">{foodName}</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Questions adapt to detected food properties ({cookingMethod}). The answers feed into the multi-objective optimization Pareto solver to balance thermal retention, barrier impedance, cost, and circularity.
        </p>
      </div>

      {/* SECTION 1: FOOD-SPECIFIC ADAPTIVE QUESTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
            Category-Specific Physical Physics
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            {isFried && 'Fried Food Moisture Dynamics'}
            {isBiryaniOrRice && 'Dum Rice & Multi-Compartment Management'}
            {isPizza && 'Pizza Steam Venting & Base Crispness'}
            {isCurry && 'Viscous Liquid Sealing & Capillary Creep'}
            {isBakery && 'Bakery Structural & Temperature Protection'}
            {!isFried && !isBiryaniOrRice && !isPizza && !isCurry && !isBakery && 'Prepared Food Quality Considerations'}
          </h3>
        </div>

        {isFried && (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Crisp Batter Vapor Management Rule
            </label>
            <p className="text-xs text-slate-400">
              Fried foods trapped in airtight non-vented plastic experience rapid sogginess due to steam condensation.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Mandate steam chimney ventilation to prevent sogginess',
                'Calibrated micro-slits (maintain warmth while exhausting steam)',
                'Breathable natural sugarcane bagasse fiber wall',
                'Other custom venting protocol'
              ].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setFriedCrispPriority(opt)}
                  className={`text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    friedCrispPriority === opt
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isBiryaniOrRice && (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Multi-Dish Condiment Isolation Architecture
            </label>
            <p className="text-xs text-slate-400">
              Detected components include hot dum rice with side gravies/curds. Combining hot steam with cold raita causes curd syneresis.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Separate chilled raita / hot salan into leakproof side cups',
                'Multi-compartment tray with hermetically isolated divider walls',
                'Deep single insulated bowl (no side dishes present)',
                'Eco-friendly bagasse bowl + separate PP sauce cups'
              ].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setRiceCompartmentPref(opt)}
                  className={`text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    riceCompartmentPref === opt
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isPizza && (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Pizza Box Airflow & Thermal Rigidity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Elevated micro-flute ridges with corner steam vents',
                'Virgin E-Flute corrugated board with greaseproof parchment insert',
                'Solid unvented box (not recommended - sogginess risk)'
              ].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setPizzaRidgePref(opt)}
                  className={`text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    pizzaRidgePref === opt
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {isCurry && (
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Liquid Sealing & Hot Oil Migration Barrier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Hermetic snap-rim gasket certified for hot oils',
                'Polypropylene container with leak-tight silicone rim channel',
                'Heat-sealed peelable barrier membrane lid'
              ].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setCurrySealingPref(opt)}
                  className={`text-left p-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    currySealingPref === opt
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DELIVERY SCENARIO & TRANSIT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
            Logistics & Transport Parameters
          </span>
          <h3 className="text-lg font-bold text-white mt-1">Delivery Context</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Delivery Method
            </label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Food delivery">Food delivery (Swiggy / Zomato / DoorDash)</option>
              <option value="Local delivery">Local delivery (Own driver / bike courier)</option>
              <option value="Customer pickup">Customer pickup / Takeaway counter</option>
              <option value="Catering">Catering / Bulk insulated carrier</option>
              <option value="Long-distance delivery">Long-distance delivery (&gt; 25 km)</option>
              <option value="Other">Other / Custom</option>
            </select>
            {deliveryMethod === 'Other' && (
              <input
                type="text"
                placeholder="Specify custom delivery method..."
                value={customDeliveryMethod}
                onChange={(e) => setCustomDeliveryMethod(e.target.value)}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            )}
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Target Transit Time
            </label>
            <select
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Less than 30 minutes">Less than 30 minutes (Express)</option>
              <option value="30–60 minutes">30–60 minutes (Standard Urban Transit)</option>
              <option value="1–2 hours">1–2 hours (Peak Traffic / Far Suburb)</option>
              <option value="More than 2 hours">More than 2 hours (Catering / Buffer Holding)</option>
            </select>
          </div>

          {/* Serving Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Serving Size / Capacity
            </label>
            <select
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Single serving">Single serving (500ml - 750ml)</option>
              <option value="Two servings">Two servings (1000ml - 1200ml)</option>
              <option value="Family">Family Pack (1500ml - 2500ml)</option>
              <option value="Bulk/catering">Bulk / Catering Tray</option>
              <option value="Custom">Custom capacity</option>
            </select>
            {servingSize === 'Custom' && (
              <input
                type="text"
                placeholder="Specify volume or weight (e.g., 900ml Bento)..."
                value={customServingSize}
                onChange={(e) => setCustomServingSize(e.target.value)}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            )}
          </div>

          {/* Transport Environment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Transport Environment
            </label>
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Ambient">Ambient Courier Bike Crate (28°C - 38°C)</option>
              <option value="Refrigerated">Refrigerated Van (4°C - 8°C)</option>
              <option value="Frozen">Frozen Cold Chain (&lt;-18°C)</option>
              <option value="Thermal Insulated Box">Thermal Insulated Pouch / Bag</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: USER PRIORITIES & OPTIMIZATION OBJECTIVES */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
            Multi-Objective Pareto Weights
          </span>
          <h3 className="text-lg font-bold text-white mt-1">
            Customer Quality Priorities (Select all that apply)
          </h3>
          <p className="text-xs text-slate-400">
            Selected objectives dynamically adjust the scoring weights in the recommendation engine.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            'Keep food hot',
            'Maintain crispness',
            'Prevent leakage',
            'Reduce condensation',
            'Preserve texture',
            'Preserve aroma',
            'Maintain appearance',
            'Prevent grease leakage',
            'Low cost',
            'Sustainability',
            'Premium presentation'
          ].map(p => {
            const isSelected = priorities.includes(p);
            return (
              <button
                type="button"
                key={p}
                onClick={() => togglePriority(p)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition text-left ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Budget & Sustainability Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Packaging Budget Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Economy', 'Balanced', 'Premium'] as const).map(b => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer text-center ${
                    budget === b
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Circularity & Sustainability Preference
            </label>
            <select
              value={sustainability}
              onChange={(e) => setSustainability(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            >
              <option value="Prefer biodegradable/compostable">Prefer biodegradable / compostable (Bagasse/PLA)</option>
              <option value="Prefer recyclable">Prefer recyclable (PP 05 / PET 01)</option>
              <option value="Strong sustainability preference">Strong sustainability preference (Zero plastic / EN 13432)</option>
              <option value="Normal">Normal / Cost balanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold cursor-pointer"
        >
          Back to Verification
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Optimizing Multi-Objective Solver...</span>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>BUILD MY TAKEAWAY PACKAGE</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </form>
  );
};
