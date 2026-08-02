import React from 'react';
import { VALUES_LIST } from '../data/domains';

export default function ValueRadarChart({ valueRatings = {}, limit = null }) {
  // Map value ratings into an ordered list with scores and justifications
  const ratingsData = VALUES_LIST.map((v) => {
    const item = valueRatings[v.key] || {};
    const score = typeof item.score === 'number' ? item.score : 50;
    const justification = item.justification || "";
    return {
      key: v.key,
      label: v.label,
      score,
      justification
    };
  });

  // Sort by score descending so top priorities appear at the top
  let sortedData = [...ratingsData].sort((a, b) => b.score - a.score);

  if (limit && typeof limit === 'number') {
    sortedData = sortedData.slice(0, limit);
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-blue-500 to-cyan-400 text-cyan-300 border-cyan-500/40 bg-cyan-500/10';
    if (score >= 80) return 'from-indigo-500 to-blue-400 text-blue-300 border-blue-500/40 bg-blue-500/10';
    if (score >= 70) return 'from-emerald-500 to-teal-400 text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'from-amber-500 to-yellow-400 text-amber-300 border-amber-500/40 bg-amber-500/10';
    return 'from-slate-600 to-slate-500 text-slate-300 border-slate-700 bg-slate-800/40';
  };

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
        <span>{limit ? `3 ערכי הליבה המרכזיים` : `דירוג 10 ערכי היסוד (מ-0 עד 100)`}</span>
        <span className="text-[11px] text-blue-400 font-mono">ממוין לפי חשיבות</span>
      </div>

      <div className="space-y-2.5">
        {sortedData.map((item) => {
          const colorClass = getScoreColor(item.score);
          const barGradient = item.score >= 85 
            ? 'bg-gradient-to-r from-blue-600 to-cyan-400' 
            : item.score >= 75 
            ? 'bg-gradient-to-r from-indigo-600 to-blue-500'
            : 'bg-gradient-to-r from-slate-600 to-slate-400';

          const hasRealJustification = item.justification && 
            item.justification.trim() !== "" && 
            !item.justification.includes("נימוק חשיבות הערך במערכת השיקולים");

          return (
            <div key={item.key} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
              {/* Header: Label & Score */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white tracking-wide font-rubik">
                  {item.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black font-mono border ${colorClass}`}>
                  {item.score} / 100
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barGradient}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                />
              </div>

              {/* Justification Text - Only render real custom candidate justifications when not strictly limited */}
              {!limit && hasRealJustification && (
                <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                  {item.justification}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
