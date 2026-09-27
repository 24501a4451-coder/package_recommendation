import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/Auth/LoginPage';
import { Navbar } from './components/Navbar';
import { LevelGate } from './components/LevelGate';
import { SmartTakeawayScanner } from './components/Level2/SmartTakeawayScanner';
import { FreshProduceIntelligence } from './components/Level1/FreshProduceIntelligence';
import { PackagedFoodIntelligence } from './components/Level3/PackagedFoodIntelligence';
import { ExpertWorkbench } from './components/Level4/ExpertWorkbench';
import { KnowledgeBaseView } from './components/Common/KnowledgeBaseView';
import { HistoryView } from './components/Common/HistoryView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ReportModal } from './components/Common/ReportModal';
import { AIAssistantDrawer } from './components/Common/AIAssistantDrawer';
import { RegistrationModal } from './components/Common/RegistrationModal';
import { QRVerificationView } from './components/Common/QRVerificationView';
import { RecommendationRecord } from './types';
import { Package, ShieldCheck } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('LEVEL_2');
  const [selectedReport, setSelectedReport] = useState<RecommendationRecord | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantContext, setAssistantContext] = useState<any>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [qrVerifyId, setQrVerifyId] = useState<string | null>(null);

  // Check URL pathname for public /verify/:id
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/verify/')) {
      const id = pathname.replace('/verify/', '').trim();
      if (id) {
        setQrVerifyId(id);
      }
    }
  }, []);

  // Update primary tab when user logs in or their level changes
  useEffect(() => {
    if (user) {
      if (user.role === 'LEVEL_1') setCurrentTab('LEVEL_1');
      else if (user.role === 'LEVEL_2') setCurrentTab('LEVEL_2');
      else if (user.role === 'LEVEL_3') setCurrentTab('LEVEL_3');
      else if (user.role === 'LEVEL_4') setCurrentTab('LEVEL_4');
      else if (user.role === 'ADMIN') setCurrentTab('LEVEL_2');
    }
  }, [user?.role]);

  // If viewing QR verification route directly (Public route)
  if (qrVerifyId) {
    return (
      <QRVerificationView
        recommendationId={qrVerifyId}
        onBackToApp={() => {
          setQrVerifyId(null);
          window.history.pushState({}, '', '/');
        }}
      />
    );
  }

  // Session verification loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 animate-pulse text-indigo-400 shadow-xl">
          <Package className="w-7 h-7" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight">FOODPACK-AI</h2>
          <p className="text-xs text-slate-400">Verifying authenticated user session...</p>
        </div>
      </div>
    );
  }

  // MANDATORY AUTHENTICATION: Show Login Page if no active session
  if (!user) {
    return <LoginPage />;
  }

  const handleOpenAssistant = (context?: any) => {
    setAssistantContext(context || null);
    setAssistantOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAssistant={() => handleOpenAssistant()}
        onOpenRegister={() => setRegisterOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* LEVEL 1: FRESH PRODUCE */}
        {currentTab === 'LEVEL_1' && (
          <LevelGate
            requiredLevel="LEVEL_1"
            levelName="Level 1: Fresh Produce Intelligence"
            levelDescription="Tailored for Farmers and Agricultural Producers to calculate postharvest respiration rates, Equilibrium MAP (EMAP), and laser micro-perforations."
          >
            <FreshProduceIntelligence />
          </LevelGate>
        )}

        {/* LEVEL 2: TAKEAWAY INTELLIGENCE (PRIMARY SHOWCASE) */}
        {currentTab === 'LEVEL_2' && (
          <LevelGate
            requiredLevel="LEVEL_2"
            levelName="Level 2: Food Service & Takeaway Intelligence"
            levelDescription="Tailored for Restaurants, Cloud Kitchens, and Food Delivery to prevent sogginess, steam puddling, and hot oil leaks via Smart Scanning."
          >
            <SmartTakeawayScanner
              onOpenReport={(rec) => setSelectedReport(rec)}
              onOpenAssistant={(ctx) => handleOpenAssistant(ctx)}
            />
          </LevelGate>
        )}

        {/* LEVEL 3: PACKAGED FOOD STARTUP */}
        {currentTab === 'LEVEL_3' && (
          <LevelGate
            requiredLevel="LEVEL_3"
            levelName="Level 3: Packaged Food Startup"
            levelDescription="Tailored for FMCG Manufacturers and Food Startups to formulate tri-laminate pouches, OTR/WVTR barrier requirements, and N2 flushing."
          >
            <PackagedFoodIntelligence />
          </LevelGate>
        )}

        {/* LEVEL 4: EXPERT WORKBENCH */}
        {currentTab === 'LEVEL_4' && (
          <LevelGate
            requiredLevel="LEVEL_4"
            levelName="Level 4: Technologist & Research Workbench"
            levelDescription="Tailored for Packaging Engineers and Food Technologists for What-If kinetic modeling, reverse material searches, and failure forensics."
          >
            <ExpertWorkbench />
          </LevelGate>
        )}

        {/* KNOWLEDGE BASE */}
        {currentTab === 'KNOWLEDGE' && <KnowledgeBaseView />}

        {/* HISTORY */}
        {currentTab === 'HISTORY' && (
          <HistoryView onOpenReport={(rec) => setSelectedReport(rec)} />
        )}

        {/* ADMIN DASHBOARD */}
        {currentTab === 'ADMIN' && (
          <LevelGate
            requiredLevel="LEVEL_4"
            levelName="System Administration Console"
            levelDescription="Restricted to System Administrators and Certified Packaging Technologists for inspecting audit trails and managing materials."
          >
            <AdminDashboard />
          </LevelGate>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FOODPACK-AI</span>
            <span>•</span>
            <span>SIH26236 Decision Support Architecture</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Strict Scientific Compliance: Real barrier properties (ASTM D3985 / ASTM F1249 / TAPPI T559) • No fabricated physical numbers
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      {selectedReport && (
        <ReportModal
          record={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      <AIAssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        context={assistantContext}
      />

      <RegistrationModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
