import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  requiredLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
  levelName: string;
  levelDescription: string;
  children: React.ReactNode;
}

export const LevelGate: React.FC<Props> = ({ requiredLevel, levelName, levelDescription, children }) => {
  const { user, canAccessLevel, switchRole } = useAuth();

  if (!user) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center text-slate-300">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-sm text-slate-400 mb-6">Please log in to access this decision-support intelligence level.</p>
        </div>
      </div>
    );
  }

  const hasAccess = canAccessLevel(requiredLevel);

  if (!hasAccess) {
    return (
      <div className="min-h-[550px] flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-xl text-center text-slate-300 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
          
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="text-xs font-mono uppercase tracking-widest text-red-400 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/60 inline-block mb-3">
            HTTP 403 / Access Denied by Authorization Layer
          </span>

          <h2 className="text-2xl font-bold text-white mb-2">
            Restricted to {levelName}
          </h2>

          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Your current logged-in role is <strong className="text-amber-400">{user.roleName}</strong> ({user.role}). 
            In compliance with SIH26236 Role-Based Access Control (RBAC), this module is isolated and restricted to authorized {levelName} accounts.
          </p>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Level:</span>
              <span className="text-indigo-400 font-mono font-semibold">{requiredLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Depth:</span>
              <span className="text-slate-300">{levelDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Your Identity:</span>
              <span className="text-slate-300">{user.email}</span>
            </div>
          </div>

          {/* Demonstration Role Switcher for Hackathon Reviewers */}
          <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-900/40 text-left">
            <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold">
              <UserCheck className="w-4 h-4" />
              <span>SIH Hackathon Evaluator Quick-Role Switch</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              To test this workflow without registering a new email, you may switch your session role directly:
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => switchRole(requiredLevel as UserRole)}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Switch to {requiredLevel} Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => switchRole('ADMIN')}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Switch to Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
