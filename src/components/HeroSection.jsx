import React, { useState } from 'react';
import { Globe, FileText, X } from 'lucide-react';
import { SYSTEM_ROLEPLAY_PROMPT } from '../data/promptText';

export default function HeroSection({ candidateCount }) {
  const [showPromptModal, setShowPromptModal] = useState(false);

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
        
        {/* Grounding Pill */}
        <div>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 border border-blue-500/30 backdrop-blur-md shadow-lg">
            <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Globe className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              מחוברים לרשת בזמן אמת (Grounded)
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-xs text-slate-300 font-semibold">
              {candidateCount} מודלים מובילים
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-rubik">
          מי ה-AI שיבנה את <br className="hidden sm:inline" />
          <span className="gradient-text-blue">ראש הממשלה האידיאלי</span> לישראל?
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
          נתנו למודלי ה-AI החזקים בתבל פרומפט אסטרטגי פולשני: להיכנס לנעליו של מועמד לראשות הממשלה בבחירות 2026. 
          ללא תכתיבים פוליטיים, תוך התמודדות עם גירעונות תקציביים, שיוויון בנטל, איום איראני ומבנה מערכת המשפט.
        </p>

        {/* Prompt Modal Trigger Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowPromptModal(true)}
            className="btn-secondary text-xs sm:text-sm py-2.5 px-5 shadow-md inline-flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>צפה בפרומפט המלא (prompt.txt)</span>
          </button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-6">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-rubik">7</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">מודלי AI שונים</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-rubik">10</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">ערכי יסוד מדורגים (0-100)</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-rubik">9</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">תחומי מדיניות אופרטיביים</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-rubik">100</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">ימי פעילות ו-KPIs מדידים</div>
          </div>
        </div>

      </div>

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-modal">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white font-rubik">ההנחיות שנשלחו למודלים (prompt.txt)</h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap bg-[#090d16]">
              {SYSTEM_ROLEPLAY_PROMPT}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowPromptModal(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                סגור תצוגה
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
