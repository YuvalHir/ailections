import React, { useState } from 'react';
import { Scale, Check, UserCheck, Award } from 'lucide-react';
import { DOMAINS, VALUES_LIST } from '../data/domains';

export default function CompareMatrix({ candidatesData = [] }) {
  const [selectedIds, setSelectedIds] = useState([
    candidatesData[0]?.id || '',
    candidatesData[1]?.id || '',
    candidatesData[2]?.id || ''
  ].filter(Boolean));

  const [selectedDomainId, setSelectedDomainId] = useState(1);

  const selectedModels = candidatesData.filter(c => selectedIds.includes(c.id));

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        setSelectedIds([selectedIds[1], selectedIds[2], id]);
      }
    }
  };

  const activeDomainMeta = DOMAINS.find(d => d.id === Number(selectedDomainId)) || DOMAINS[0];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
          <Scale className="w-4 h-4" />
          השוואה ראש בראש (Side-by-Side)
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white font-rubik tracking-tight">
          השווה בין המועמדים בזמן אמת
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          בחר עד 3 מודלים והשווה ביניהם לפי תחומי מדיניות, דירוגי ערכים ותוכניות עבודה.
        </p>
      </div>

      {/* Candidate Selection Chips */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold text-slate-400 ml-2">בחר מודלים להשוואה:</span>
        {candidatesData.map(c => {
          const isSelected = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleSelect(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.badgeColor }}
              ></div>
              <span>{c.candidate.name} ({c.modelName})</span>
              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}
      </div>

      {/* Domain Selection Tabs */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2">
        {DOMAINS.map(d => (
          <button
            key={d.id}
            onClick={() => setSelectedDomainId(d.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              selectedDomainId === d.id
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {d.id}. {d.title}
          </button>
        ))}
      </div>

      {/* Side-by-Side Domain Comparison Grid */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-white font-rubik flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">
              {activeDomainMeta.id}
            </span>
            <span>תחום {activeDomainMeta.id}: {activeDomainMeta.title}</span>
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">{activeDomainMeta.subtitle}</span>
        </div>

        {/* Fixed grid classes for Tailwind */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedModels.map(c => {
            const domainPlan = c.operationalPlatform.find(p => p.domainId === activeDomainMeta.id) || {
              plan: "אין תוכנית מפורטת לתחום זה."
            };

            return (
              <div key={c.id} className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
                
                {/* Header */}
                <div className="pb-4 border-b border-slate-800 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold"
                    style={{ backgroundColor: c.badgeColor }}
                  >
                    {c.candidate.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-rubik">{c.candidate.name}</h4>
                    <span className="text-xs font-medium text-slate-400">{c.modelName} ({c.company})</span>
                  </div>
                </div>

                {/* Plan Content */}
                <div className="flex-1 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {domainPlan.plan}
                  </p>

                  {domainPlan.isTopPriority && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        עדיפות עליונה לקדנציה הראשונה
                      </div>
                      {domainPlan.first100Days && (
                        <div><strong className="text-cyan-400">100 ימים:</strong> {domainPlan.first100Days}</div>
                      )}
                      {domainPlan.kpi && (
                        <div><strong className="text-emerald-400">KPI:</strong> {domainPlan.kpi}</div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Values Matrix Table */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-lg sm:text-xl font-bold text-white font-rubik">
          טבלת השוואת ערכים (0–100)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-4">ערך יסוד</th>
                {selectedModels.map(c => (
                  <th key={c.id} className="pb-3 px-4 text-center font-bold text-white">
                    {c.candidate.name} <br />
                    <span className="text-xs font-normal text-slate-400">({c.modelName})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {VALUES_LIST.map(v => (
                <tr key={v.key} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs sm:text-sm">{v.label}</td>
                  {selectedModels.map(c => {
                    const valObj = c.valueRatings?.[v.key] || { score: 50 };
                    return (
                      <td key={c.id} className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-bold text-cyan-400 text-xs sm:text-sm">
                          {valObj.score}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  );
}
