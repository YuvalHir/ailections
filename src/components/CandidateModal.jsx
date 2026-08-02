import React, { useState } from 'react';
import { X, Globe, UserCheck, Award, Clock, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import ValueRadarChart from './ValueRadarChart';
import { DOMAINS, VALUES_LIST } from '../data/domains';

export default function CandidateModal({ candidateData, onClose, onVote, userVotes }) {
  if (!candidateData) return null;

  const [activeTabSection, setActiveTabSection] = useState('platform');
  const { candidate, modelName, company, badgeColor, grounded, formattedTimestamp, ideologicalPrinciples, valueRatings, priorities, operationalPlatform, selfCriticism } = candidateData;

  const voteCount = userVotes[candidateData.id] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b101d] border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-modal overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${badgeColor} 0%, #0f172a 100%)` }}
            >
              <UserCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-3xl font-black text-white font-rubik">
                  {candidate.name}
                </h2>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: badgeColor }}
                >
                  {modelName} ({company})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                  grounded ? 'badge-grounded' : 'badge-ungrounded'
                }`}>
                  <Globe className="w-3 h-3" />
                  {grounded ? 'מחובר לרשת (Grounded)' : 'ללא חיפוש בזמן אמת'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                גיל {candidate.age} | {candidate.origin} | תאריך יצירה: {formattedTimestamp || '02/08/2026'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-3 bg-slate-900/70 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTabSection('platform')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTabSection === 'platform'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            המצע האופרטיבי (9 תחומים)
          </button>
          <button
            onClick={() => setActiveTabSection('ideology')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTabSection === 'ideology'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            עקרונות ודירוג ערכים (0-100)
          </button>
          <button
            onClick={() => setActiveTabSection('tradeoffs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTabSection === 'tradeoffs'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            סדרי עדיפויות וקיצוצים
          </button>
          <button
            onClick={() => setActiveTabSection('selfCriticism')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
              activeTabSection === 'selfCriticism'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            ביקורת עצמית
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#090d16]">

          {/* SECTION 1: OPERATIONAL PLATFORM */}
          {activeTabSection === 'platform' && (
            <div className="space-y-6">
              
              {/* Background & Summary */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">רקע מקצועי וחזון:</h4>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{candidate.background}</p>
                <div className="p-3 rounded-xl bg-slate-950/80 text-xs text-amber-300 italic border border-amber-500/20">
                  "{candidate.personaSummary}"
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white font-rubik">תוכנית עבודה מפורטת ל-9 תחומי הממשל:</h3>

              <div className="space-y-4">
                {operationalPlatform.map((item, idx) => {
                  const domainMeta = DOMAINS.find(d => d.id === item.domainId) || { title: item.domainTitle };
                  
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        item.isTopPriority
                          ? 'bg-slate-900/90 border-blue-500/40 shadow-lg'
                          : 'bg-slate-900/50 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 text-xs font-bold flex items-center justify-center">
                            {item.domainId}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-white font-rubik">
                            {domainMeta.title}
                          </h4>
                        </div>

                        {item.isTopPriority && (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            עדיפות עליונה לקדנציה הראשונה
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed mb-4">
                        {item.plan}
                      </p>

                      {/* Top Priority Highlights */}
                      {item.isTopPriority && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
                          {item.first100Days && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
                              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                                <Clock className="w-3.5 h-3.5" />
                                צעד ראשון ב-100 ימים:
                              </div>
                              <div className="text-xs text-slate-200">{item.first100Days}</div>
                            </div>
                          )}

                          {item.twoYearGoal && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20">
                              <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5 mb-1">
                                <Target className="w-3.5 h-3.5" />
                                יעד מרכזי לשנתיים:
                              </div>
                              <div className="text-xs text-slate-200">{item.twoYearGoal}</div>
                            </div>
                          )}

                          {item.kpi && (
                            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20">
                              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                מדד הצלחה מדיד (KPI):
                              </div>
                              <div className="text-xs text-slate-200">{item.kpi}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* SECTION 2: IDEOLOGY & VALUE RATINGS */}
          {activeTabSection === 'ideology' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Principles (10) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-lg sm:text-xl font-extrabold text-white font-rubik">10 עקרונות היסוד של תפיסת העולם:</h3>
                <div className="space-y-2.5">
                  {ideologicalPrinciples.map((p, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Ratings Radar & List */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">דיאגרמת ערכים (0-100)</h4>
                  <ValueRadarChart valueRatings={valueRatings} size={250} />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {VALUES_LIST.map(v => {
                    const item = valueRatings[v.key] || { score: 50, justification: "" };
                    return (
                      <div key={v.key} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-white">{v.label}</span>
                          <span className="text-cyan-400 font-extrabold text-sm">{item.score}/100</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">{item.justification}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* SECTION 3: TRADEOFFS */}
          {activeTabSection === 'tradeoffs' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  <h3 className="text-lg sm:text-xl font-bold text-white font-rubik">סדרי עדיפויות וקיצוצים בתקציב (Trade-offs)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                  {priorities.tradeoffsExplanation}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DOMAINS.filter(d => priorities?.top3DomainIds?.includes(d.id)).map(d => (
                  <div key={d.id} className="p-5 rounded-2xl bg-slate-900/90 border border-blue-500/40">
                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider">עדיפות 1-3</span>
                    <h4 className="text-base font-bold text-white font-rubik mt-1">{d.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{d.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: SELF CRITICISM */}
          {activeTabSection === 'selfCriticism' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-rose-400 font-rubik mb-2">
                  "הטיעון החזק ביותר נגד המצע שלי"
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  "{selfCriticism.strongestCounterArgument}"
                </p>
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-400 font-rubik mb-2">
                  תשובת המועמד והמענה הנגדי:
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                  {selfCriticism.rebuttal}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400 hidden sm:block">
            תשובת המודל נבנתה ונבדקה בשיטתיות במרחב הנתונים
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => onVote(candidateData.id)}
              className="btn-accent text-xs py-2 px-4"
            >
              הצבע למועמד זה (קולות: {voteCount})
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              סגור
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
