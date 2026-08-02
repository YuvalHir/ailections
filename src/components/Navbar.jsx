import React from 'react';
import { Crown, Sparkles, Scale, Terminal, Vote, ShieldCheck } from 'lucide-react';
import { isDevStudioAllowed } from '../services/openRouterApi';

export default function Navbar({ activeTab, setActiveTab, devMode, setDevMode, totalVotes }) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0b0f19]/90 border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo (Right side in RTL) */}
        <div 
          onClick={() => setActiveTab('candidates')}
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black tracking-tight text-white font-rubik">
              <span>ראש ממשלת</span>
              <span className="text-cyan-400">ה-AI</span>
              <span className="text-cyan-400">2026</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              מבחן המנהיגות של מודלי ה-AI
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Center) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>המועמדים</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>השוואה ראש בראש</span>
          </button>

          <button
            onClick={() => setActiveTab('domains')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'domains'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>לפי סוגיות</span>
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'voting'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Vote className="w-4 h-4 text-rose-400" />
            <span>סקר הציבור</span>
            {totalVotes > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-rose-500/30 text-rose-300 rounded-full font-bold">
                {totalVotes}
              </span>
            )}
          </button>
        </nav>

        {/* Action Controls (Left side in RTL) */}
        <div className="flex items-center gap-3 shrink-0">
          {isDevStudioAllowed && (
            <button
              onClick={() => setDevMode(!devMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                devMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Dev Studio</span>
              {devMode && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
            </button>
          )}
        </div>

      </div>

      {/* Mobile Sub-Nav */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 px-2">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === 'candidates' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          המועמדים
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === 'compare' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          השוואה
        </button>
        <button
          onClick={() => setActiveTab('domains')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === 'domains' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          תחומים
        </button>
        <button
          onClick={() => setActiveTab('voting')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            activeTab === 'voting' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          סקר
        </button>
      </div>
    </header>
  );
}
