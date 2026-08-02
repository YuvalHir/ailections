import React from 'react';
import { Globe, UserCheck, ChevronLeft, Vote, Sparkles, Brain, Zap, Cpu, Flame, Rocket, Compass } from 'lucide-react';
import ValueRadarChart from './ValueRadarChart';
import { DOMAINS } from '../data/domains';

const ICON_MAP = {
  Brain,
  Sparkles,
  Zap,
  Cpu,
  Flame,
  Rocket,
  Compass
};

export default function CandidateCard({ candidateData, onSelectCandidate, onVote, userVotes = {} }) {
  const { candidate, modelName, company, badgeColor, grounded, priorities, valueRatings, avatarIcon } = candidateData;
  const IconComp = ICON_MAP[avatarIcon] || Sparkles;

  const top3Domains = DOMAINS.filter(d => priorities?.top3DomainIds?.includes(d.id));
  const voteCount = userVotes[candidateData.id] || 0;

  return (
    <div className="bg-[#0f172a]/90 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 group">
      
      {/* Top Banner & Metadata Badges */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-900/60 space-y-4">
        
        {/* Model & Grounding Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5 shrink-0"
            style={{ backgroundColor: badgeColor }}
          >
            <IconComp className="w-3.5 h-3.5" />
            {modelName} ({company})
          </span>

          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 ${
            grounded ? 'badge-grounded' : 'badge-ungrounded'
          }`}>
            <Globe className="w-3 h-3" />
            {grounded ? 'מחובר לרשת (Grounded)' : 'ללא חיפוש בזמן אמת'}
          </span>
        </div>

        {/* Candidate Profile Info */}
        <div className="flex items-start gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md mt-0.5"
            style={{
              background: `linear-gradient(135deg, ${badgeColor} 0%, #0f172a 100%)`
            }}
          >
            <UserCheck className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black text-white font-rubik tracking-tight group-hover:text-cyan-400 transition-colors truncate">
              {candidate.name}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              גיל {candidate.age} | {candidate.origin}
            </p>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {candidate.background}
            </p>
          </div>
        </div>

      </div>

      {/* Middle Content */}
      <div className="p-5 space-y-4 flex-1">
        
        {/* Quote */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 italic leading-relaxed">
          "{candidate.personaSummary}"
        </div>

        {/* Top 3 Focus Areas */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
            עדיפות עליונה לקדנציה הראשונה:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {top3Domains.map(d => (
              <span
                key={d.id}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                {d.title}
              </span>
            ))}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="pt-2 flex justify-center">
          <ValueRadarChart valueRatings={valueRatings} size={200} />
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between gap-3">
        <button
          onClick={() => onVote(candidateData.id)}
          className="btn-secondary text-xs py-2 px-3.5 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 transition-all flex items-center gap-1.5"
        >
          <Vote className="w-4 h-4 text-rose-400" />
          <span>הצבע ({voteCount})</span>
        </button>

        <button
          onClick={() => onSelectCandidate(candidateData)}
          className="btn-primary text-xs py-2 px-4 shadow-md flex items-center gap-1.5"
        >
          <span>למצע המלא</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
