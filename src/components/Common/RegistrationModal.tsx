import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { UserPlus, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { register, demoUsers, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<UserRole>('LEVEL_2');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const roleOptions: {
    role: UserRole;
    title: string;
    level: string;
    desc: string;
  }[] = [
    {
      role: 'LEVEL_1',
      title: 'Fresh Produce / Farmer / Agricultural Producer',
      level: 'LEVEL 1',
      desc: 'Postharvest respiration management, Equilibrium MAP (EMAP), laser micro-perforations, and cold chain rules.'
    },
    {
      role: 'LEVEL_2',
      title: 'Restaurant / Café / Bakery / Cloud Kitchen / Catering / Food Delivery',
      level: 'LEVEL 2 (Main Showcase)',
      desc: 'Smart Takeaway Scanner, multi-component meal isolation, steam venting, grease barriers, and package building.'
    },
    {
      role: 'LEVEL_3',
      title: 'Packaged Food Startup / Food Manufacturer',
      level: 'LEVEL 3',
      desc: 'Formulation water activity (Aw), tri-laminate barrier pouches, N₂ flushing, and evidence-based shelf life ranges.'
    },
    {
      role: 'LEVEL_4',
      title: 'Packaging Engineer / Food Technologist / Researcher',
      level: 'LEVEL 4',
      desc: 'Parametric reverse packaging search, What-If headspace kinetic simulations, and forensic failure diagnostics.'
    }
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      await register(name, email, role, organization);
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userId: string) => {
    setLoading(true);
    try {
      await login(userId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-200 shadow-2xl my-8 relative">
        
        {/* Header */}
        <div className="text-center pb-6 border-b border-slate-800 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            User Registration & Level RBAC Onboarding
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Select your professional role. FOODPACK-AI enforces strict level-based service isolation and API authorization according to SIH26236.
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chef Sanjay Kapoor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
              <input
                type="email"
                required
                placeholder="chef@kitchencraft.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization / Brand</label>
            <input
              type="text"
              placeholder="e.g. SpiceCraft Cloud Kitchens Ltd."
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Role Selection Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Select Your Access Level Role (Section 2 Standard)
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {roleOptions.map((opt) => {
                const isSelected = role === opt.role;
                return (
                  <div
                    key={opt.role}
                    onClick={() => setRole(opt.role)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{opt.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold">
                          {opt.level}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{opt.desc}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {loading ? 'Registering Account...' : 'Complete Registration & Enter'}
            </button>
          </div>
        </form>

        {/* Quick Demo Personas Selector */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <span className="text-[11px] font-mono uppercase text-slate-500 block mb-2 font-semibold">
            Or Switch to a Pre-Seeded SIH Test Persona:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.id)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-[11px] transition cursor-pointer"
              >
                <span className="font-bold text-white block truncate">{u.name.split(' ')[0]}</span>
                <span className="text-indigo-400 font-mono text-[10px] block">{u.role}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
