import React from 'react';
import { Crown, Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#060911] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white font-rubik">
              ראש ממשלת ה-AI <span className="text-cyan-400">2026</span>
            </div>
            <div className="text-xs text-slate-400">
              ניסוי מחשבתי ואסטרטגי בהשוואת מודלי שפה מתקדמים
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 max-w-md leading-relaxed">
          כל התשובות והמצעים נוצרו בצורה אוטונומית על ידי מודלי ה-AI בהתאם להנחיות הפרומפט.
          אין בתוכן משום תעמולת בחירות או המלצה פוליטית.
        </div>

        <div className="text-xs text-slate-400 flex flex-col items-center md:items-end gap-1">
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            נבנה עבור בחירות ה-AI 2026
          </span>
          <span>עודכן לאחרונה: 02/08/2026</span>
        </div>

      </div>
    </footer>
  );
}
