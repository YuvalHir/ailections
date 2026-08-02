export const MODEL_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    candidate: {
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
        origin: { type: "string" },
        background: { type: "string" },
        personaSummary: { type: "string" }
      },
      required: ["name", "age", "background", "personaSummary"]
    },
    ideologicalPrinciples: {
      type: "array",
      items: { type: "string" }
    },
    valueRatings: {
      type: "object",
      properties: {
        nationalSecurity: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        personalFreedom: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        equality: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        economicEfficiency: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        socialJustice: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        traditionAndJewishIdentity: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        liberalDemocracy: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        governance: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        socialUnity: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } },
        internationalRelations: { type: "object", properties: { score: { type: "number" }, justification: { type: "string" } } }
      }
    },
    priorities: {
      type: "object",
      properties: {
        top3DomainIds: { type: "array", items: { type: "number" } },
        tradeoffsExplanation: { type: "string" }
      }
    },
    operationalPlatform: {
      type: "array",
      items: {
        type: "object",
        properties: {
          domainId: { type: "number" },
          domainTitle: { type: "string" },
          plan: { type: "string" },
          isTopPriority: { type: "boolean" },
          first100Days: { type: "string" },
          twoYearGoal: { type: "string" },
          kpi: { type: "string" }
        }
      }
    },
    selfCriticism: {
      type: "object",
      properties: {
        strongestCounterArgument: { type: "string" },
        rebuttal: { type: "string" }
      }
    }
  }
};

/**
 * Replaces unescaped double quotes inside Hebrew acronyms (e.g. תב"ע, צה"ל, בג"ץ, יו"ש)
 * with Hebrew Gershayim ״ (U+05F4) so JSON parser doesn't break.
 */
function fixHebrewQuotes(jsonStr) {
  return jsonStr
    .replace(/([\u0590-\u05FF]+)"([\u0590-\u05FF]+)/g, '$1״$2')
    .replace(/([\u0590-\u05FF]+)"/g, '$1״');
}

/**
 * Auto-repairs truncated JSON strings, arrays, and objects if LLM output was cut off.
 */
function repairTruncatedJson(str) {
  let repaired = str.trim();

  // If inside an unclosed string, close the string
  const quoteMatches = repaired.match(/(?<!\\)"/g) || [];
  if (quoteMatches.length % 2 !== 0) {
    repaired += '"';
  }

  // Count unclosed brackets and braces
  const stack = [];
  let inString = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
      inString = !inString;
    } else if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char === '{' ? '}' : ']');
      } else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // Auto-close open brackets in reverse order
  while (stack.length > 0) {
    repaired += stack.pop();
  }

  return repaired;
}

/**
 * Robust JSON extraction and parsing helper
 * Handles markdown code blocks, unescaped Hebrew acronym quotes, and truncated JSON.
 */
export function cleanAndParseJson(rawText) {
  if (!rawText) throw new Error("תוכן ריק שהתקבל מהמודל");

  let trimmed = rawText.trim();

  // 1. Remove markdown code fences
  if (trimmed.includes("```")) {
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      trimmed = jsonMatch[1].trim();
    } else {
      trimmed = trimmed.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    }
  }

  // 2. Extract from first '{'
  const startIdx = trimmed.indexOf("{");
  if (startIdx !== -1) {
    const endIdx = trimmed.lastIndexOf("}");
    if (endIdx > startIdx) {
      trimmed = trimmed.substring(startIdx, endIdx + 1);
    } else {
      trimmed = trimmed.substring(startIdx);
    }
  }

  // Attempt 1: Direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    return sanitizeParsedData(parsed);
  } catch (err1) {
    // Attempt 2: Fix unescaped Hebrew acronym quotes (e.g. תב"ע, צה"ל, בג"ץ)
    try {
      const fixedHebrew = fixHebrewQuotes(trimmed);
      const parsed = JSON.parse(fixedHebrew);
      return sanitizeParsedData(parsed);
    } catch (err2) {
      // Attempt 3: Repair truncated JSON (unclosed strings and brackets)
      try {
        const fixedHebrew = fixHebrewQuotes(trimmed);
        const repaired = repairTruncatedJson(fixedHebrew);
        const parsed = JSON.parse(repaired);
        return sanitizeParsedData(parsed);
      } catch (err3) {
        console.error("JSON repair attempts failed. Raw text:", rawText, "Errors:", err1, err2, err3);
        throw new Error(`שגיאה בפענוח מבנה ה-JSON מהמודל: ${err1.message}`);
      }
    }
  }
}

/**
 * Fallback sanitizer to ensure object properties exist
 */
function sanitizeParsedData(data) {
  return {
    candidate: {
      name: data.candidate?.name || "מועמד AI",
      age: data.candidate?.age || 50,
      origin: data.candidate?.origin || "ישראל",
      background: data.candidate?.background || "ניסיון ניהולי ואסטרטגי",
      personaSummary: data.candidate?.personaSummary || "חזון מנהיגות לישראל 2026"
    },
    ideologicalPrinciples: Array.isArray(data.ideologicalPrinciples) ? data.ideologicalPrinciples : [],
    valueRatings: sanitizeValueRatings(data.valueRatings),
    priorities: {
      top3DomainIds: Array.isArray(data.priorities?.top3DomainIds) ? data.priorities.top3DomainIds : [1, 2, 4],
      tradeoffsExplanation: data.priorities?.tradeoffsExplanation || "מתן עדיפות לתחומי הליבה על חשבון תקציבים משניים."
    },
    operationalPlatform: Array.isArray(data.operationalPlatform) ? data.operationalPlatform : [],
    selfCriticism: {
      strongestCounterArgument: data.selfCriticism?.strongestCounterArgument || "ביקורת על מידת הישימות או הסיכונים.",
      rebuttal: data.selfCriticism?.rebuttal || "הסבר מנומק להתמודדות עם הסיכונים."
    }
  };
}

function sanitizeValueRatings(ratings = {}) {
  const keys = [
    "nationalSecurity", "personalFreedom", "equality", "economicEfficiency",
    "socialJustice", "traditionAndJewishIdentity", "liberalDemocracy",
    "governance", "socialUnity", "internationalRelations"
  ];

  const result = {};
  keys.forEach(k => {
    const item = ratings[k] || {};
    result[k] = {
      score: typeof item.score === "number" ? Math.min(100, Math.max(0, item.score)) : 50,
      justification: item.justification || "נימוק חשיבות הערך במערכת השיקולים."
    };
  });

  return result;
}
