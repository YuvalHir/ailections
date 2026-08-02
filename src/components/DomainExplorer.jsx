import React, { useState } from 'react';
import { ShieldCheck, Award, Clock, Target, TrendingUp, ChevronLeft } from 'lucide-react';
import { DOMAINS } from '../data/domains';

export default function DomainExplorer({ candidatesData = [], onSelectCandidate }) {
  const [selectedDomainId, setSelectedDomainId] = useState(1);

  const activeDomain = DOMAINS.find(d => d.id === selectedDomainId) || DOMAINS[0];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4" />
          אגרגטור סוגיות מדיניות
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-rubik tracking-tight">
          פתרונות המודלים לסוגיות הבוערות
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          בחר תחום מדיניות מתוך 9 התחומים וראה כיצד כל מודל ניגש לפתרון הבעיה.
        </p>
      </div>

      {/* Domain Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
        {DOMAINS.map(d => {
          const isSelected = d.id === selectedDomainId;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDomainId(d.id)}
              className={`p-3 rounded-2xl text-right transition-all flex flex-col justify-between border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-white/5 hover:border-white/20 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-black opacity-70">#{d.id}</div>
              <div className="text-xs font-bold font-rubik line-clamp-2 mt-1">{d.title}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Domain Banner */}
      <div className="p-6 rounded-2xl glass-panel border-blue-500/30 bg-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">תחום נבחר #{activeDomain.id}</div>
          <h3 className="text-2xl font-black text-white font-rubik mt-1">{activeDomain.title}</h3>
          <p className="text-xs text-slate-300 mt-1">{activeDomain.subtitle}</p>
        </div>
      </div>

      {/* Models Policy Cards Stack */}
      <div className="space-y-6">
        {candidatesData.map(c => {
          const domainPlan = c.operationalPlatform.find(p => p.domainId === selectedDomainId) || {
            plan: "אין תוכנית מפורטת לתחום זה."
          };

          return (
            <div
              key={c.id}
              className={`glass-panel p-6 border-white/10 transition-all ${
                domainPlan.isTopPriority ? 'border-amber-500/40 bg-slate-900/90' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold"
                    style={{ backgroundColor: c.badgeColor }}
                  >
                    {c.candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white font-rubik">{c.candidate.name}</h4>
                    <p className="text-xs text-slate-400">{c.modelName} ({c.company})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {domainPlan.isTopPriority && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      עדיפות עליונה
                    </span>
                  )}
                  <button
                    onClick={() => onSelectCandidate(c)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>פרופיל מלא</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Policy Plan */}
              <div className="pt-4 space-y-4">
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {domainPlan.plan}
                </p>

                {/* 100 Days & KPI if top priority */}
                {domainPlan.isTopPriority && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5">
                    {domainPlan.first100Days && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs">
                        <div className="font-bold text-cyan-400 flex items-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5" /> 100 ימים ראשונים:
                        </div>
                        <div className="text-slate-200">{domainPlan.first100Days}</div>
                      </div>
                    )}
                    {domainPlan.twoYearGoal && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 text-xs">
                        <div className="font-bold text-purple-400 flex items-center gap-1 mb-1">
                          <Target className="w-3.5 h-3.5" /> יעד לשנתיים:
                        </div>
                        <div className="text-slate-200">{domainPlan.twoYearGoal}</div>
                      </div>
                    )}
                    {domainPlan.kpi && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs">
                        <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3.5 h-3.5" /> מדד KPI מדיד:
                        </div>
                        <div className="text-slate-200">{domainPlan.kpi}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
