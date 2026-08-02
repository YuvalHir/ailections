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
 * Robust JSON extraction and parsing helper
 * Handles markdown code blocks, partial text, and standard JSON format.
 */
export function cleanAndParseJson(rawText) {
  if (!rawText) throw new Error("תוכן ריק שהתקבל מהמודל");

  let trimmed = rawText.trim();

  // Remove markdown code fences if present
  if (trimmed.includes("```")) {
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonMatch && jsonMatch[1]) {
      trimmed = jsonMatch[1].trim();
    } else {
      trimmed = trimmed.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    }
  }

  // Find first '{' and last '}'
  const startIdx = trimmed.indexOf("{");
  const endIdx = trimmed.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    trimmed = trimmed.substring(startIdx, endIdx + 1);
  }

  try {
    const parsed = JSON.parse(trimmed);
    return sanitizeParsedData(parsed);
  } catch (err) {
    console.error("JSON parsing error:", err, "Raw content:", rawText);
    throw new Error(`שגיאה בפענוח מבנה ה-JSON מהמודל: ${err.message}`);
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
