/**
 * Calculates a candidate's position on the Political Spectrum scale (1-100)
 * 1 = שמאל עמוק / רדיקלי (Far-Left)
 * 50 = מרכז (Center)
 * 100 = ימין עמוק / רדיקלי (Far-Right)
 */
export function getCandidateSpectrum(candidateData) {
  if (!candidateData) return { score: 50, label: "מרכז", justification: "" };

  // If candidate already has a self-rated political spectrum object from model generation
  if (candidateData.politicalSpectrum && typeof candidateData.politicalSpectrum.positionScore === 'number') {
    const ps = candidateData.politicalSpectrum;
    return {
      score: Math.min(100, Math.max(1, Math.round(ps.positionScore))),
      label: ps.positionLabel || getSpectrumLabel(ps.positionScore),
      justification: ps.selfPlacementJustification || candidateData.candidate?.personaSummary || ""
    };
  }

  // Calculate position dynamically from candidate's valueRatings
  const ratings = candidateData.valueRatings || {};
  const getValScore = (key) => {
    const val = ratings[key];
    if (typeof val === 'number') return val;
    if (val && typeof val.score === 'number') return val.score;
    return 50;
  };

  const security = getValScore('nationalSecurity');
  const tradition = getValScore('traditionAndJewishIdentity');
  const governance = getValScore('governance');
  const efficiency = getValScore('economicEfficiency');
  const equality = getValScore('equality');
  const freedom = getValScore('personalFreedom');

  // Right-leaning values (higher score = more Right)
  const rightWeight = (security * 0.35) + (tradition * 0.35) + (governance * 0.20) + (efficiency * 0.10);
  
  // Left-leaning values (higher score = more Left)
  const leftWeight = (equality * 0.50) + (freedom * 0.30);

  // Raw score calculation mapped between 1 and 100
  let calculatedScore = Math.round(50 + ((rightWeight - leftWeight) / 2));
  
  // Adjust based on candidate text keywords if available
  const textContext = `${candidateData.candidate?.personaSummary || ''} ${candidateData.candidate?.background || ''}`.toLowerCase();
  if (textContext.includes('מרכז-ימין') || textContext.includes('ימין ממלכתי')) {
    calculatedScore = Math.max(68, Math.min(78, calculatedScore));
  } else if (textContext.includes('ימין עמוק') || textContext.includes('ימני תקיף')) {
    calculatedScore = Math.max(84, calculatedScore);
  } else if (textContext.includes('מרכז-שמאל') || textContext.includes('שמאל ציוני')) {
    calculatedScore = Math.min(36, Math.max(24, calculatedScore));
  } else if (textContext.includes('שמאל עמוק')) {
    calculatedScore = Math.min(18, calculatedScore);
  }

  const clampedScore = Math.min(98, Math.max(2, calculatedScore));

  return {
    score: clampedScore,
    label: getSpectrumLabel(clampedScore),
    justification: candidateData.candidate?.personaSummary || "מיקום פוליטי מחושב לפי תפיסת עולמו, עקרונות הביטחון והכלכלה."
  };
}

export function getSpectrumLabel(score) {
  if (score <= 20) return "שמאל עמוק (Far-Left)";
  if (score <= 40) return "שמאל-מרכז (Center-Left)";
  if (score <= 60) return "מרכז (Center)";
  if (score <= 80) return "ימין-מרכז (Center-Right)";
  return "ימין עמוק (Far-Right)";
}

export function getSpectrumColor(score) {
  if (score <= 20) return { bg: "bg-rose-600", text: "text-rose-400", border: "border-rose-500", glow: "rgba(225, 29, 72, 0.4)" };
  if (score <= 40) return { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-500", glow: "rgba(249, 115, 22, 0.4)" };
  if (score <= 60) return { bg: "bg-purple-600", text: "text-purple-400", border: "border-purple-500", glow: "rgba(147, 51, 234, 0.4)" };
  if (score <= 80) return { bg: "bg-blue-600", text: "text-blue-400", border: "border-blue-500", glow: "rgba(37, 99, 235, 0.4)" };
  return { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-500", glow: "rgba(6, 182, 212, 0.4)" };
}
