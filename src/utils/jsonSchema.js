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
 * Fixes missing opening braces in JSON arrays (e.g. `}, "domainId": 7` -> `}, { "domainId": 7`)
 */
function fixMissingArrayObjectBraces(jsonStr) {
  return jsonStr.replace(/\},\s*"([a-zA-Z0-9_-]+)"\s*:/g, '}, { "$1":');
}

/**
 * Sanitizes control characters (literal unescaped newlines/tabs inside JSON string values)
 */
function sanitizeControlCharacters(jsonStr) {
  let inString = false;
  let result = '';

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else {
        const code = char.charCodeAt(0);
        if (code < 32) {
          result += `\\u${code.toString(16).padStart(4, '0')}`;
        } else {
          result += char;
        }
      }
    } else {
      result += char;
    }
  }

  return result;
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
 * Handles markdown code blocks, unescaped Hebrew acronym quotes, missing array braces, bad control chars, and truncated JSON.
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

  // Attempt 1: Direct JSON parse after control character sanitization
  const sanitized = sanitizeControlCharacters(trimmed);
  try {
    const parsed = JSON.parse(sanitized);
    return sanitizeParsedData(parsed);
  } catch (err1) {
    // Attempt 2: Fix missing array object braces + Hebrew acronym quotes
    try {
      const fixedBraces = fixMissingArrayObjectBraces(sanitized);
      const fixedHebrew = fixHebrewQuotes(fixedBraces);
      const parsed = JSON.parse(fixedHebrew);
      return sanitizeParsedData(parsed);
    } catch (err2) {
      // Attempt 3: Repair truncated JSON (unclosed strings and brackets)
      try {
        const fixedBraces = fixMissingArrayObjectBraces(sanitized);
        const fixedHebrew = fixHebrewQuotes(fixedBraces);
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
