import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Package,
  Layers,
  Sparkles,
  Bot,
  UserCheck,
  ChevronDown,
  History,
  Database,
  Shield,
  UserPlus,
  LogOut,
  Building,
  User
} from 'lucide-react';
import { AIModeBadge } from './AIModeBadge';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAssistant: () => void;
  onOpenRegister: () => void;
}

interface NavItem {
  id: string;
  label: string;
  badge?: string;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenAssistant,
  onOpenRegister
}) => {
  const { user, switchRole, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Build dynamic navigation items according to user level permissions
  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    const sharedItems: NavItem[] = [
      { id: 'KNOWLEDGE', label: 'Knowledge Base' },
      { id: 'HISTORY', label: 'My History' }
    ];

    if (user.role === 'ADMIN') {
      return [
        { id: 'LEVEL_1', label: 'Level 1: Fresh Produce', badge: 'L1' },
        { id: 'LEVEL_2', label: 'Level 2: Takeaway', badge: 'SHOWCASE' },
        { id: 'LEVEL_3', label: 'Level 3: Packaged Food', badge: 'L3' },
        { id: 'LEVEL_4', label: 'Level 4: Expert Workbench', badge: 'L4' },
        ...sharedItems,
        { id: 'ADMIN', label: 'Admin Console' }
      ];
    }

    if (user.role === 'LEVEL_1') {
      return [
        { id: 'LEVEL_1', label: 'Fresh Produce Intelligence', badge: 'LEVEL 1' },
        ...sharedItems
      ];
    }

    if (user.role === 'LEVEL_2') {
      return [
        { id: 'LEVEL_2', label: 'Takeaway Intelligence', badge: 'LEVEL 2' },
        ...sharedItems
      ];
    }

    if (user.role === 'LEVEL_3') {
      return [
        { id: 'LEVEL_3', label: 'Packaged Food Intelligence', badge: 'LEVEL 3' },
        ...sharedItems
      ];
    }

    if (user.role === 'LEVEL_4') {
      return [
        { id: 'LEVEL_4', label: 'Technologist Workbench', badge: 'LEVEL 4' },
        ...sharedItems
      ];
    }

    return sharedItems;
  };

  const navItems = getNavItems();

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    setShowUserDropdown(false);
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => {
              if (user?.role === 'LEVEL_1') onSelectTab('LEVEL_1');
              else if (user?.role === 'LEVEL_3') onSelectTab('LEVEL_3');
              else if (user?.role === 'LEVEL_4') onSelectTab('LEVEL_4');
              else onSelectTab('LEVEL_2');
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight flex items-center gap-1.5">
                FOODPACK-AI
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  SIH26236
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {user?.roleName || 'Intelligent Packaging System'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links (Tailored to active level) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded-sm font-bold uppercase ${
                      item.badge === 'SHOWCASE' || item.badge.includes('LEVEL')
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: AI Consultant & User Account / Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-semibold border border-indigo-800/60 cursor-pointer transition shadow-xs"
            title="Ask Packaging AI Assistant"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Consultant</span>
          </button>

          {/* User Account / Role / Logout Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium border border-slate-800 cursor-pointer transition"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
              <div className="text-left hidden sm:block">
                <span className="font-bold text-white text-[11px] block leading-none">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-[9px] text-indigo-400 font-mono block truncate max-w-[120px]">
                  {user?.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-50 text-xs space-y-2">
                
                {/* User info card */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs block">{user?.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {user?.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate">{user?.email}</span>
                  {user?.organization && (
                    <span className="text-[10px] text-slate-500 block truncate">
                      🏢 {user.organization}
                    </span>
                  )}
                </div>

                {/* If Admin: Allow instant switching across all levels */}
                {user?.role === 'ADMIN' ? (
                  <div className="space-y-1 pt-1">
                    <div className="px-2 py-1 text-[10px] text-slate-400 font-mono">
                      ADMIN LEVEL SIMULATOR
                    </div>
                    {[
                      { role: 'LEVEL_1' as const, label: 'Level 1: Fresh Produce (Farmer)' },
                      { role: 'LEVEL_2' as const, label: 'Level 2: Takeaway (Restaurant Chef)' },
                      { role: 'LEVEL_3' as const, label: 'Level 3: Packaged Food (Startup)' },
                      { role: 'LEVEL_4' as const, label: 'Level 4: Technologist (Expert)' },
                      { role: 'ADMIN' as const, label: 'Admin (All Access)' }
                    ].map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleRoleSwitch(r.role)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition flex items-center justify-between cursor-pointer text-xs ${
                          user?.role === r.role
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{r.label}</span>
                        {user?.role === r.role && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-slate-950/60 rounded-xl text-[11px] text-slate-400">
                    <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Permitted Workspace</span>
                    <p className="text-slate-300 font-medium">{user?.roleName}</p>
                  </div>
                )}

                {/* Actions & Logout */}
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenRegister();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer text-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create / Switch Account Role</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer text-xs font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>[ Logout ]</span>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/80 text-[11px] font-semibold no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1 rounded-lg shrink-0 ${
              currentTab === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

