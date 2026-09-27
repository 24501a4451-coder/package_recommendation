import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Package,
  ShieldCheck,
  ArrowRight,
  User,
  Lock,
  Mail,
  Building2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sprout,
  UtensilsCrossed,
  Layers,
  FlaskConical,
  Shield
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, demoUsers } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form Fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('LEVEL_2');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const levelOptions: {
    role: UserRole;
    levelNum: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    badge: string;
  }[] = [
    {
      role: 'LEVEL_1',
      levelNum: 'LEVEL 1',
      title: 'Fresh Produce / Agricultural Producer',
      icon: Sprout,
      desc: 'Postharvest respiration, Equilibrium MAP (EMAP), laser micro-perforations, and cold-chain shelf life extension.',
      badge: 'FARMERS & GROWERS'
    },
    {
      role: 'LEVEL_2',
      levelNum: 'LEVEL 2 (PRIMARY SHOWCASE)',
      title: 'Restaurant / Café / Bakery / Cloud Kitchen / Catering / Food Delivery',
      icon: UtensilsCrossed,
      desc: 'Multi-component takeaway scanner, steam venting, anti-sogginess, grease barriers, and hermetic delivery packaging.',
      badge: 'FOOD SERVICE & TAKEAWAY'
    },
    {
      role: 'LEVEL_3',
      levelNum: 'LEVEL 3',
      title: 'Packaged Food Startup / Food Manufacturer',
      icon: Layers,
      desc: 'Formulation water activity (Aw), tri-laminate barrier structures, nitrogen flushing, and shelf life predictions.',
      badge: 'FMCG STARTUPS'
    },
    {
      role: 'LEVEL_4',
      levelNum: 'LEVEL 4',
      title: 'Packaging Engineer / Food Technologist / Researcher',
      icon: FlaskConical,
      desc: 'Parametric reverse packaging search, What-If kinetic gas simulations, and forensic failure diagnosis.',
      badge: 'R&D TECHNOLOGISTS'
    }
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login({
        emailOrUsername: emailOrUsername.trim(),
        password: password.trim(),
        role: selectedRole
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials or select a user level.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email / Username is required.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), selectedRole, organization.trim(), password.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (userRole: UserRole) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const demo = demoUsers.find(u => u.role === userRole);
      if (demo) {
        await login({ userId: demo.id, role: userRole });
      } else {
        await login({
          emailOrUsername: `demo.${userRole.toLowerCase()}@foodpack.ai`,
          role: userRole
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-2xl z-10 space-y-8">
        
        {/* App Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 p-2 px-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-lg tracking-tight">FOODPACK-AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
                  SIH26236
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Intelligent Food Packaging Material Decision Platform
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'LOGIN' ? 'Sign in to Your Authorized Workspace' : 'Create Account & Select User Level'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Role-Based Access Control (RBAC) securely tailors services to your exact food industry domain.
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex max-w-md mx-auto shadow-lg">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            [ Login ]
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
              mode === 'REGISTER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            [ Create Account ]
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-start gap-3 animate-fade-in shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Authentication Notice</span>
              <p className="mt-0.5 text-slate-300">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* MAIN AUTH CARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {mode === 'LOGIN' ? (
            /* =================== LOGIN FORM =================== */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email / Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. chef@spicecraftkitchen.com or username"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500">(Any password accepted in evaluation mode)</span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden transition"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                </div>
              </div>

              {/* Select User Level For Login */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target User Level / Workspace Role
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {levelOptions.map((opt) => {
                    const isSelected = selectedRole === opt.role;
                    const IconComp = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.role}
                        onClick={() => setSelectedRole(opt.role)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-2.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <div>
                          <span className="font-bold text-[11px] block">{opt.levelNum}</span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{opt.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Login to Level Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          ) : (
            /* =================== REGISTRATION / ONBOARDING FORM =================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chef Sanjay Kapoor"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Work Email / Username
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="chef@kitchencraft.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Create secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Organization / Kitchen
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. SpiceCraft Cloud Kitchens Ltd."
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* "What type of user are you?" Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider">
                    What type of user are you? (Required)
                  </label>
                  <span className="text-[10px] text-indigo-400 font-mono">Controls Level Permissions</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {levelOptions.map((opt) => {
                    const isSelected = selectedRole === opt.role;
                    const IconComp = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.role}
                        onClick={() => setSelectedRole(opt.role)}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">{opt.levelNum}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {opt.badge}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-indigo-300 block">{opt.title}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5 leading-relaxed">{opt.desc}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering & Initializing Profile...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Account & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

        {/* ONE-CLICK DEMO REVIEWER BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Instant Reviewer / Evaluator Logins (1-Click)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">SIH26236 Testing</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('LEVEL_1')}
              disabled={loading}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left cursor-pointer transition"
            >
              <span className="font-bold text-white text-xs block">Level 1</span>
              <span className="text-[10px] text-slate-400 block truncate">Ramesh (Farmer)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('LEVEL_2')}
              disabled={loading}
              className="p-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 rounded-xl text-left cursor-pointer transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-xs block">Level 2</span>
                <span className="text-[8px] font-bold text-emerald-400">CORE</span>
              </div>
              <span className="text-[10px] text-slate-300 block truncate">Chef Ananya</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('LEVEL_3')}
              disabled={loading}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left cursor-pointer transition"
            >
              <span className="font-bold text-white text-xs block">Level 3</span>
              <span className="text-[10px] text-slate-400 block truncate">Vikram (Startup)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('LEVEL_4')}
              disabled={loading}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left cursor-pointer transition"
            >
              <span className="font-bold text-white text-xs block">Level 4</span>
              <span className="text-[10px] text-slate-400 block truncate">Dr. Priya (R&D)</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('ADMIN')}
              disabled={loading}
              className="col-span-2 sm:col-span-1 p-2.5 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 rounded-xl text-left cursor-pointer transition"
            >
              <span className="font-bold text-purple-300 text-xs block">Admin</span>
              <span className="text-[10px] text-slate-400 block truncate">All Levels</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          FOODPACK-AI • ASTM D3985 / ASTM F1249 / TAPPI T559 Certified Physical Data • Non-Fabricated Physics
        </p>

      </div>

    </div>
  );
};
