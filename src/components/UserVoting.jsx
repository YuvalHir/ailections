import React from 'react';
import { Vote, Trophy, CheckCircle2, Sparkles } from 'lucide-react';

export default function UserVoting({ candidatesData = [], userVotes = {}, onVote }) {
  const totalVotes = Object.values(userVotes).reduce((acc, v) => acc + v, 0);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
          <Vote className="w-4 h-4" />
          סקר הציבור 2026
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-rubik tracking-tight">
          במי היית בוחר כראש הממשלה של ישראל?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          הצבע למועמד שהציג את המצע האופטימלי והמנומק ביותר. התוצאות משתקפות בזמן אמת.
        </p>
      </div>

      {/* Voting Cards Grid */}
      <div className="space-y-4">
        {candidatesData.map(c => {
          const votes = userVotes[c.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <div
              key={c.id}
              className="glass-panel p-5 border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
            >
              {/* Background percentage fill bar */}
              <div
                className="absolute top-0 right-0 bottom-0 bg-blue-600/10 transition-all duration-500 pointer-events-none"
                style={{ width: `${percentage}%` }}
              ></div>

              <div className="flex items-center gap-4 relative z-10">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 font-extrabold text-lg"
                  style={{ backgroundColor: c.badgeColor }}
                >
                  {c.candidate.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-rubik">{c.candidate.name}</h3>
                    <span className="text-xs text-slate-400 font-medium">({c.modelName})</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{c.candidate.personaSummary}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end relative z-10">
                <div className="text-right">
                  <div className="text-lg font-black text-white font-rubik">{percentage}%</div>
                  <div className="text-xs text-slate-400">{votes} קולות</div>
                </div>

                <button
                  onClick={() => onVote(c.id)}
                  className="btn-accent text-xs py-2 px-4 shadow-md"
                >
                  <Vote className="w-4 h-4" />
                  <span>הצבע</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-slate-400 font-medium">
        סה"כ קולות בסקר: <strong className="text-cyan-400">{totalVotes}</strong> | ההצבעה נשמרת בדפדפן המקומי (localStorage)
      </div>

    </section>
  );
}
