import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, BookOpen, HelpCircle } from 'lucide-react';
import { AIModeBadge } from '../AIModeBadge';
import { apiFetch } from '../../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  context?: any;
}

export const AIAssistantDrawer: React.FC<Props> = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; text: string; evidence?: string[]; aiMode?: 'REAL' | 'FALLBACK' }[]
  >([
    {
      role: 'assistant',
      text: 'Hello! I am your FOODPACK-AI Packaging Engineering Consultant. I can explain the thermodynamic reasons behind your packaging recommendation, explain OTR and WVTR metrics, or clarify material trade-offs.',
      evidence: ['FOODPACK-AI Scientific Knowledge Base (SIH26236)']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          context
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            text: data.answer,
            evidence: data.evidenceCited,
            aiMode: data.aiMode
          }
        ]);
      }
    } catch (err) {
      console.error('Assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-200">
      
      {/* Drawer Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Packaging AI Consultant</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </h3>
            <p className="text-[11px] text-slate-400">SIH26236 Grounded Scientific Assistant</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <button
          onClick={() => handleSend('Explain OTR and WVTR test standards (ASTM D3985 / ASTM F1249)')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
        >
          Explain OTR / WVTR
        </button>
        <button
          onClick={() => handleSend('Why is sugarcane bagasse recommended over plastic for hot food?')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
        >
          Bagasse vs Plastic
        </button>
        <button
          onClick={() => handleSend('What causes condensation sogginess in takeaway deliveries?')}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
        >
          Prevent Sogginess
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 rounded-bl-none shadow-sm space-y-2'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              
              {m.evidence && m.evidence.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                  <span className="font-semibold text-slate-500 uppercase font-mono block">Citations & Standards:</span>
                  <ul className="list-disc pl-3">
                    {m.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Consulting polymer standards & food physics...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask about materials, OTR, WVTR, or this recommendation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
