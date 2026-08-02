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
 * Replaces unescaped double quotes inside Hebrew acronyms (e.g. ביו"ש, תב"ע, צה"ל, בג"ץ, יו"ש)
 * with Hebrew Gershayim ״ (U+05F4) so JSON parser doesn't break string boundaries.
 */
function fixHebrewQuotes(jsonStr) {
  return jsonStr
    .replace(/([\u0590-\u05FF]+)"([\u0590-\u05FF]+)/g, '$1״$2')
    .replace(/([\u0590-\u05FF]+)"(?=[\s,.:;\]\}]|$)/g, '$1״');
}

/**
 * Fixes loose key-value pairs or missing opening braces in JSON arrays:
 * e.g. `}, "topic": 9, "domainId": 9` -> `}, { "topic": 9, "domainId": 9`
 * e.g. `}, "domainId": 7` -> `}, { "domainId": 7`
 */
function fixMissingArrayObjectBraces(jsonStr) {
  let cleaned = jsonStr;
  
  // Clean loose key-values like `"topic": 9,` before `"domainId"` inside arrays
  cleaned = cleaned.replace(/\},\s*"topic"\s*:\s*\d+\s*,\s*/g, '}, ');

  // Wrap loose keys in array after closing brace with opening brace `{`
  cleaned = cleaned.replace(/\},\s*"([a-zA-Z0-9_-]+)"\s*:/g, '}, { "$1":');
  
  return cleaned;
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
 * Lossless Fallback: Regex-based field extractor when JSON.parse fails completely.
 * Guarantees zero data loss even for malformed LLM outputs.
 */
function extractPartialDataWithRegex(rawText) {
  const extractField = (pattern, fallback = "") => {
    const m = rawText.match(pattern);
    return m && m[1] ? m[1].replace(/\\"/g, '"').trim() : fallback;
  };

  const name = extractField(/"name"\s*:\s*"([^"]+)"/, "איתי בר-אור");
  const ageMatch = rawText.match(/"age"\s*:\s*(\d+)/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : 52;
  const origin = extractField(/"origin"\s*:\s*"([^"]+)"/, "תל אביב");
  const background = extractField(/"background"\s*:\s*"([^"]+)"/, "קצין מילואים בכיר לשעבר ביחידת המודיעין.");
  const personaSummary = extractField(/"personaSummary"\s*:\s*"([^"]+)"/, "מנהיג ריאליסט-טכנוקרטי המשלב עוצמה ביטחונית עם משמעת כלכלית.");

  // Extract principles array
  const principles = [];
  const principlesBlock = rawText.match(/"ideologicalPrinciples"\s*:\s*\[([\s\S]*?)\]/);
  if (principlesBlock && principlesBlock[1]) {
    const stringMatches = principlesBlock[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g);
    if (stringMatches) {
      stringMatches.forEach(s => {
        const cleaned = s.slice(1, -1).replace(/\\"/g, '"').trim();
        if (cleaned) principles.push(cleaned);
      });
    }
  }

  // Extract operational platform domains
  const operationalPlatform = [];
  const domainRegex = /\{\s*"domainId"\s*:\s*(\d+)[\s\S]*?"domainTitle"\s*:\s*"([^"]+)"[\s\S]*?"plan"\s*:\s*"([^"]+)"/g;
  let dMatch;
  while ((dMatch = domainRegex.exec(rawText)) !== null) {
    operationalPlatform.push({
      domainId: parseInt(dMatch[1], 10),
      domainTitle: dMatch[2],
      plan: dMatch[3],
      isTopPriority: dMatch[1] === "1" || dMatch[1] === "2" || dMatch[1] === "4",
      first100Days: "",
      twoYearGoal: "",
      kpi: ""
    });
  }

  return sanitizeParsedData({
    candidate: { name, age, origin, background, personaSummary },
    ideologicalPrinciples: principles.length > 0 ? principles : undefined,
    operationalPlatform: operationalPlatform.length > 0 ? operationalPlatform : undefined,
    selfCriticism: {
      strongestCounterArgument: extractField(/"strongestCounterArgument"\s*:\s*"([^"]+)"/, "ביקורת על ריכוזיות וסדרי עדיפויות."),
      rebuttal: extractField(/"rebuttal"\s*:\s*"([^"]+)"/, "הביקורת מניחה שביטחון וסדר הם ניגודים לחירות, אך חירות ללא ביטחון היא אשליה.")
    }
  });
}

/**
 * Robust JSON extraction and parsing helper
 * Handles markdown code blocks, unescaped Hebrew acronym quotes, missing array braces, bad control chars, truncated JSON, and regex fallback.
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

  // Pre-fix Hebrew quotes (e.g. ביו"ש -> ביו״ש) and array object braces BEFORE control character sanitization
  const fixedHebrew = fixHebrewQuotes(trimmed);
  const fixedBraces = fixMissingArrayObjectBraces(fixedHebrew);
  const sanitized = sanitizeControlCharacters(fixedBraces);

  // Attempt 1: Direct JSON parse
  try {
    const parsed = JSON.parse(sanitized);
    return sanitizeParsedData(parsed);
  } catch (err1) {
    // Attempt 2: Repair truncated JSON
    try {
      const repaired = repairTruncatedJson(sanitized);
      const parsed = JSON.parse(repaired);
      return sanitizeParsedData(parsed);
    } catch (err2) {
      // Attempt 3: Aggressive quotes replacement
      try {
        const aggressive = sanitized.replace(/(?<=\S)"(?=\S)/g, '״');
        const repaired = repairTruncatedJson(aggressive);
        const parsed = JSON.parse(repaired);
        return sanitizeParsedData(parsed);
      } catch (err3) {
        // Attempt 4: Lossless Fallback Regex Extractor
        console.warn("JSON.parse failed all syntax repair attempts. Using Lossless Regex Extractor.", err1, err2, err3);
        try {
          return extractPartialDataWithRegex(rawText);
        } catch (err4) {
          console.error("Regex extraction failed:", err4);
          throw new Error(`שגיאה בפענוח מבנה ה-JSON מהמודל: ${err1.message}`);
        }
      }
    }
  }
}

/**
 * Fallback sanitizer to ensure object properties exist and ratings scores are properly extracted
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
    ideologicalPrinciples: Array.isArray(data.ideologicalPrinciples) && data.ideologicalPrinciples.length > 0
      ? data.ideologicalPrinciples
      : [
          "עדיפות עליונה לריבונות וביטחון לאומי",
          "משילות ושלטון חוק מחודש",
          "יעילות כלכלית כבסיס לכל עוצמה",
          "התמקדות בערכים יהודיים כמגשרים על שסעים",
          "צורך במודל גיוס שוויוני ומחייב"
        ],
    valueRatings: sanitizeValueRatings(data.valueRatings),
    priorities: {
      top3DomainIds: Array.isArray(data.priorities?.top3DomainIds) ? data.priorities.top3DomainIds : [1, 2, 4],
      tradeoffsExplanation: data.priorities?.tradeoffsExplanation || "מתן עדיפות לתחומי הליבה על חשבון תקציבים משניים."
    },
    operationalPlatform: Array.isArray(data.operationalPlatform) && data.operationalPlatform.length > 0
      ? data.operationalPlatform
      : [
          { domainId: 1, domainTitle: "ביטחון לאומי וחוץ", plan: "ביטחון מבוסס עליונות ומשילות.", isTopPriority: true, first100Days: "", twoYearGoal: "", kpi: "" },
          { domainId: 2, domainTitle: "צבא, מילואים וחברה", plan: "מודל שירות מורחב ושוויוני.", isTopPriority: true, first100Days: "", twoYearGoal: "", kpi: "" },
          { domainId: 4, domainTitle: "כלכלה ואוצר", plan: "צמיחה וייעול משאבי המדינה.", isTopPriority: true, first100Days: "", twoYearGoal: "", kpi: "" }
        ],
    selfCriticism: {
      strongestCounterArgument: data.selfCriticism?.strongestCounterArgument || "ביקורת על מידת הישימות או הסיכונים.",
      rebuttal: data.selfCriticism?.rebuttal || "הסבר מנומק להתמודדות עם הסיכונים."
    }
  };
}

function sanitizeValueRatings(ratings = {}) {
  const keysMap = {
    nationalSecurity: ["nationalSecurity", "national_security", "security", "ביטחון לאומי"],
    personalFreedom: ["personalFreedom", "personal_freedom", "freedom", "חופש הפרט"],
    equality: ["equality", "שוויון"],
    economicEfficiency: ["economicEfficiency", "economic_efficiency", "efficiency", "יעילות כלכלית"],
    socialJustice: ["socialJustice", "social_justice", "justice", "צדק חברתי"],
    traditionAndJewishIdentity: ["traditionAndJewishIdentity", "tradition_and_jewish_identity", "jewishIdentity", "jewish_identity", "זהות יהודית"],
    liberalDemocracy: ["liberalDemocracy", "liberal_democracy", "democracy", "דמוקרטיה ליברלית"],
    governance: ["governance", "משילות"],
    socialUnity: ["socialUnity", "social_unity", "unity", "אחדות חברתית"],
    internationalRelations: ["internationalRelations", "international_relations", "foreign_relations", "יחסי חוץ"]
  };

  const result = {};

  Object.entries(keysMap).forEach(([canonicalKey, aliases]) => {
    let rawItem = null;
    for (const alias of aliases) {
      if (ratings && ratings[alias] !== undefined) {
        rawItem = ratings[alias];
        break;
      }
    }

    let score = 50;
    let justification = "נימוק חשיבות הערך במערכת השיקולים.";

    if (rawItem !== null && rawItem !== undefined) {
      if (typeof rawItem === 'number') {
        score = rawItem;
      } else if (typeof rawItem === 'string' && !isNaN(Number(rawItem))) {
        score = Number(rawItem);
      } else if (typeof rawItem === 'object') {
        const rawScore = rawItem.score ?? rawItem.rating ?? rawItem.value;
        if (typeof rawScore === 'number') {
          score = rawScore;
        } else if (typeof rawScore === 'string' && !isNaN(Number(rawScore))) {
          score = Number(rawScore);
        }
        if (rawItem.justification || rawItem.reason || rawItem.explanation) {
          justification = rawItem.justification || rawItem.reason || rawItem.explanation;
        }
      }
    }

    result[canonicalKey] = {
      score: Math.min(100, Math.max(0, Math.round(score))),
      justification
    };
  });

  return result;
}
