import React, { useState } from 'react';
import { Compass, UserCheck, ChevronLeft, Award, Sparkles, Filter, Info } from 'lucide-react';
import { getCandidateSpectrum, getSpectrumColor } from '../utils/politicalSpectrum';

export default function PoliticalSpectrumPage({ candidatesData = [], onSelectCandidate }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Map candidates with calculated/self-rated spectrum score
  const candidateSpectrumList = candidatesData.map(c => {
    const spec = getCandidateSpectrum(c);
    return {
      ...c,
      spectrumScore: spec.score,
      spectrumLabel: spec.label,
      spectrumJustification: spec.justification
    };
  }).sort((a, b) => b.spectrumScore - a.spectrumScore); // Sort Right-to-Left (100 to 1)

  const activeCandidate = candidateSpectrumList.find(c => c.id === selectedCandidateId) || candidateSpectrumList[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden space-y-3">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-blue-600 to-cyan-400 p-[2px] shadow-lg">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Compass className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-rubik tracking-tight flex items-center gap-2">
              <span>המפה הפוליטית של מועמדי ה-AI</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                1-100 Political Spectrum
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              מיקום המועמדים במפה הפוליטית: שמאל (1 - צד שמאל פיזי) עד ימין (100 - צד ימין פיזי).
            </p>
          </div>
        </div>
      </div>

      {/* Visual Political Spectrum Axis */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl">
        
        {/* Top Header Labels: Far-Left on Physical Left, Center in Middle, Far-Right on Physical Right */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800" dir="ltr">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>1 - שמאל עמוק (Far Left)</span>
          </span>
          <span className="text-purple-400">50 - מרכז (Center)</span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span>100 - ימין עמוק (Far Right)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          </span>
        </div>

        {/* Spectrum Container - Enforcing LTR so 0% = Physical Left & 100% = Physical Right */}
        <div dir="ltr" className="relative pt-12 pb-6 px-4">
          
          {/* Main Axis Gradient Bar (Left = Rose/Red -> Right = Blue/Cyan) */}
          <div className="h-4 w-full rounded-full bg-gradient-to-r from-rose-600 via-orange-500 via-purple-600 via-blue-600 to-cyan-400 shadow-inner border border-slate-800 relative">
            {/* Center tick line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/70 -translate-x-1/2 shadow-lg" />
          </div>

          {/* Spectrum Zone Labels in LTR (Column 1 = Far-Left, Column 5 = Far-Right) */}
          <div className="grid grid-cols-5 text-[10px] sm:text-xs font-bold text-slate-400 text-center mt-3">
            <div className="text-rose-400 font-bold">שמאל עמוק (1-20)</div>
            <div className="text-orange-400 font-bold">שמאל-מרכז (21-40)</div>
            <div className="text-purple-300 font-bold">מרכז (41-60)</div>
            <div className="text-blue-400 font-bold">ימין-מרכז (61-80)</div>
            <div className="text-cyan-400 font-bold">ימין עמוק (81-100)</div>
          </div>

          {/* Candidate Pins (left: score% places Left-Wing on Left & Right-Wing on Right) */}
          {candidateSpectrumList.map((cand) => {
            const isSelected = activeCandidate?.id === cand.id;
            const colorObj = getSpectrumColor(cand.spectrumScore);

            return (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className="absolute top-0 -translate-x-1/2 cursor-pointer transition-all duration-300 group z-20"
                style={{ left: `${cand.spectrumScore}%` }}
                dir="rtl"
              >
                {/* Pin Card */}
                <div className={`flex flex-col items-center gap-1 ${isSelected ? 'scale-125 z-30' : 'hover:scale-110'}`}>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xl transition-all border-2 ${
                      isSelected ? 'border-amber-400 ring-4 ring-amber-400/30' : colorObj.border
                    }`}
                    style={{
                      backgroundColor: cand.badgeColor || '#3b82f6',
                      boxShadow: `0 0 15px ${colorObj.glow}`
                    }}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-950/95 text-white border border-slate-700 whitespace-nowrap shadow-xl">
                    {cand.candidate?.name} ({cand.spectrumScore})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Candidate Detailed Spectrum Card */}
      {activeCandidate && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ backgroundColor: activeCandidate.badgeColor || '#3b82f6' }}
              >
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white font-rubik flex items-center gap-2">
                  <span>{activeCandidate.candidate?.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {activeCandidate.modelName}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  גיל {activeCandidate.candidate?.age} | {activeCandidate.candidate?.origin}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-xs text-slate-400 font-semibold">דירוג בסולם הפוליטי:</div>
                <div className="text-lg font-black text-cyan-400 font-rubik">
                  {activeCandidate.spectrumScore} / 100 ({activeCandidate.spectrumLabel})
                </div>
              </div>

              <button
                onClick={() => onSelectCandidate(activeCandidate)}
                className="btn-primary text-xs py-2.5 px-4 shadow-md flex items-center gap-1.5 shrink-0"
              >
                <span>צפה במצע המלא</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>נימוק המיקום הפוליטי ותפיסת העולם:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              "{activeCandidate.spectrumJustification}"
            </p>
          </div>
        </div>
      )}

      {/* Full Candidates Ranking Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <h3 className="text-base font-black text-white font-rubik flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>טבלת מיקומים מפורטת במפה הפוליטית</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold">
                <th className="p-3">מועמד AI</th>
                <th className="p-3">מודל שפה</th>
                <th className="p-3">מיקום בסולם (1-100)</th>
                <th className="p-3">הגדרה במפה</th>
                <th className="p-3">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {candidateSpectrumList.map((c) => {
                const colorObj = getSpectrumColor(c.spectrumScore);
                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-white font-rubik flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.badgeColor }} />
                      {c.candidate?.name}
                    </td>
                    <td className="p-3 text-slate-300 font-mono">{c.modelName}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full font-black text-xs font-mono text-white ${colorObj.bg}`}>
                        {c.spectrumScore} / 100
                      </span>
                    </td>
                    <td className={`p-3 font-bold ${colorObj.text}`}>{c.spectrumLabel}</td>
                    <td className="p-3">
                      <button
                        onClick={() => onSelectCandidate(c)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold underline"
                      >
                        צפה במצע
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
