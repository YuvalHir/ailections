import { SYSTEM_ROLEPLAY_PROMPT } from '../data/promptText';
import { MODEL_RESPONSE_JSON_SCHEMA, cleanAndParseJson } from '../utils/jsonSchema';

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

export const isDevStudioAllowed = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_ENABLE_DEV_STUDIO === 'true'
  : false;

/**
 * Helper to determine if an OpenRouter model supports web search / grounding
 */
export function checkModelGroundingSupport(model) {
  if (!model) return false;
  
  const params = model.supported_parameters || model.supportedParameters || [];
  if (params.includes('web_search_options') || params.includes('web_search')) {
    return true;
  }
  
  if (model.pricing?.web_search != null && Number(model.pricing.web_search) >= 0) {
    return true;
  }
  
  const idLower = (model.id || '').toLowerCase();
  if (idLower.endsWith(':online') || idLower.includes('perplexity') || idLower.includes('sonar')) {
    return true;
  }

  return false;
}

/**
 * Helper to determine if an OpenRouter model is 100% Free
 */
export function checkModelIsFree(model) {
  if (!model) return false;

  const idLower = (model.id || '').toLowerCase();
  if (idLower.endsWith(':free') || idLower.includes('free')) {
    return true;
  }

  const pricing = model.pricing || {};
  const promptPrice = Number(pricing.prompt || 0);
  const completionPrice = Number(pricing.completion || 0);

  if (promptPrice === 0 && completionPrice === 0) {
    return true;
  }

  return false;
}

/**
 * Helper to assign unique brand styling (colors, glow, icon) to AI models/providers
 */
export function getModelStyling(modelId = '', companyName = '') {
  const id = modelId.toLowerCase();
  const comp = companyName.toLowerCase();

  if (id.includes('anthropic') || id.includes('claude') || comp.includes('anthropic')) {
    return { badgeColor: "#d97706", accentGlow: "rgba(217, 119, 6, 0.45)", avatarIcon: "Brain" };
  }
  if (id.includes('openai') || id.includes('gpt') || comp.includes('openai')) {
    return { badgeColor: "#10b981", accentGlow: "rgba(16, 185, 129, 0.45)", avatarIcon: "Zap" };
  }
  // Added styling for OpenRouter models
  if (id.includes('openrouter') || comp.includes('openrouter')) {
    return { badgeColor: "#991b1b", accentGlow: "rgba(153, 27, 27, 0.45)", avatarIcon: "Star" };
  }
  if (id.includes('google') || id.includes('gemini') || id.includes('gemma') || comp.includes('google')) {
    return { badgeColor: "#0284c7", accentGlow: "rgba(2, 132, 199, 0.45)", avatarIcon: "Sparkles" };
  }
  if (id.includes('deepseek') || comp.includes('deepseek')) {
    return { badgeColor: "#06b6d4", accentGlow: "rgba(6, 182, 212, 0.45)", avatarIcon: "Cpu" };
  }
  if (id.includes('meta') || id.includes('llama') || comp.includes('meta')) {
    return { badgeColor: "#8b5cf6", accentGlow: "rgba(139, 92, 246, 0.45)", avatarIcon: "Flame" };
  }
  if (id.includes('mistral') || comp.includes('mistral')) {
    return { badgeColor: "#f97316", accentGlow: "rgba(249, 115, 22, 0.45)", avatarIcon: "Rocket" };
  }
  if (id.includes('nvidia') || id.includes('nemotron') || comp.includes('nvidia')) {
    return { badgeColor: "#84cc16", accentGlow: "rgba(132, 204, 22, 0.45)", avatarIcon: "Compass" };
  }
  if (id.includes('qwen') || id.includes('alibaba') || comp.includes('alibaba')) {
    return { badgeColor: "#d946ef", accentGlow: "rgba(217, 70, 239, 0.45)", avatarIcon: "Sparkles" };
  }
  if (id.includes('x-ai') || id.includes('grok') || comp.includes('xai')) {
    return { badgeColor: "#f43f5e", accentGlow: "rgba(244, 63, 94, 0.45)", avatarIcon: "Rocket" };
  }
  if (id.includes('perplexity') || id.includes('sonar')) {
    return { badgeColor: "#14b8a6", accentGlow: "rgba(20, 184, 166, 0.45)", avatarIcon: "Globe" };
  }

  // Dynamic hash fallback palette for unique model styling
  const colors = [
    { badgeColor: "#ec4899", accentGlow: "rgba(236, 72, 153, 0.45)", avatarIcon: "Sparkles" },
    { badgeColor: "#6366f1", accentGlow: "rgba(99, 102, 241, 0.45)", avatarIcon: "Cpu" },
    { badgeColor: "#eab308", accentGlow: "rgba(234, 179, 8, 0.45)", avatarIcon: "Brain" },
    { badgeColor: "#059669", accentGlow: "rgba(5, 150, 105, 0.45)", avatarIcon: "Zap" },
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Fetch available models dynamically from OpenRouter OpenAPI endpoint
 */
export async function fetchOpenRouterModels(searchQuery = '') {
  if (!isDevStudioAllowed) {
    return [];
  }

  try {
    const url = searchQuery 
      ? `${OPENROUTER_MODELS_URL}?q=${encodeURIComponent(searchQuery)}`
      : OPENROUTER_MODELS_URL;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`שגיאה בטעינת רשימת המודלים מ-OpenRouter (${response.status})`);
    }

    const data = await response.json();
    const rawModels = data.data || [];

    return rawModels.map(m => {
      const supportsGrounding = checkModelGroundingSupport(m);
      const isFree = checkModelIsFree(m);
      const company = m.id.includes('/') ? m.id.split('/')[0] : 'AI';
      const styling = getModelStyling(m.id, company);

      return {
        id: m.id,
        name: m.name || m.id,
        company: company.charAt(0).toUpperCase() + company.slice(1),
        badgeColor: styling.badgeColor,
        accentGlow: styling.accentGlow,
        avatarIcon: styling.avatarIcon,
        description: m.description || '',
        contextLength: m.context_length || 0,
        pricing: m.pricing || {},
        supportedParameters: m.supported_parameters || [],
        supportsGrounding: supportsGrounding,
        isFree: isFree
      };
    });
  } catch (err) {
    console.error("Failed to fetch models from OpenRouter API:", err);
    throw err;
  }
}

/**
 * Call an AI model via OpenRouter API using Structured Outputs and Response Healing
 */
export async function runModelPrompt({ apiKey, modelId, modelConfig, isGrounded = false }) {
  if (!isDevStudioAllowed) {
    throw new Error("הרצת מודלים מבוטלת בסביבה זו. יש להגדיר VITE_ENABLE_DEV_STUDIO=true בקובץ ה-env.");
  }

  if (!apiKey) {
    throw new Error("נא להזין מפתח API של OpenRouter");
  }

  const systemInstructions = `${SYSTEM_ROLEPLAY_PROMPT}

CRITICAL COMPREHENSIVE OUTPUT INSTRUCTIONS:
- You MUST rate yourself on the Political Spectrum in politicalSpectrum (positionScore: 1-100 where 1 = שמאל עמוק/רדיקלי, 50 = מרכז, 100 = ימין עמוק/רדיקלי) and explain your selfPlacementJustification.
- You MUST provide a full, detailed, deep plan for ALL 9 governance domains in operationalPlatform (1. ביטחון לאומי וחוץ, 2. צבא ומילואים, 3. ביטחון פנים, 4. כלכלה ואוצר, 5. פנים, 6. חינוך, 7. בריאות, 8. משפטים, 9. תקשורת).
- For the top 3 priorities, ALWAYS include first100Days, twoYearGoal, and kpi!
- Do NOT abbreviate, shorten, or skip any domain.
- Ensure all double quotes inside strings (especially Hebrew acronyms like צה"ל, יו"ש, ביו"ש, בג"ץ, תב"ע, ד"ר) are properly escaped as \\" or written with gershayim (״).`;

  // Always enable OpenRouter's Response Healing plugin for automatic provider-side JSON repair
  const plugins = [{ id: "response-healing" }];
  if (isGrounded) {
    plugins.push({ id: "web" });
  }

  // OpenRouter Structured Outputs format configuration
  const payload = {
    model: modelId,
    messages: [
      {
        role: "system",
        content: "אתה מנהיג אסטרטגי פוליטי מנוסה. עליך לענות בעברית רהוטה ומדויקת בלבד ולחזור בפורמט JSON תקני, מלא ומפורט בלבד."
      },
      {
        role: "user",
        content: systemInstructions
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "prime_minister_platform",
        strict: false,
        schema: MODEL_RESPONSE_JSON_SCHEMA
      }
    },
    plugins: plugins
  };

  let response = await fetch(OPENROUTER_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "AIlections Israel 2026",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  // If structured outputs fail on provider fallback, retry with json_object
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (errData.error?.message?.includes("response_format") || errData.error?.message?.includes("json_schema")) {
      payload.response_format = { type: "json_object" };
      response = await fetch(OPENROUTER_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AIlections Israel 2026",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } else {
      throw new Error(errData.error?.message || `שגיאה בתקשורת מול OpenRouter (${response.status})`);
    }
  }

  const data = await response.json();
  const rawChoiceContent = data.choices?.[0]?.message?.content;

  if (!rawChoiceContent) {
    throw new Error("לא התקבלה תשובה מהמודל");
  }

  let parsedResponse;
  try {
    parsedResponse = cleanAndParseJson(rawChoiceContent);
  } catch (err) {
    const customErr = new Error(err.message || "שגיאה בפענוח ה-JSON מהמודל");
    customErr.rawContent = rawChoiceContent;
    throw customErr;
  }

  const styling = getModelStyling(modelId, modelConfig?.company || '');

  return {
    id: `custom_${Date.now()}_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    modelId: modelId,
    modelName: modelConfig?.name || modelId,
    company: modelConfig?.company || "OpenRouter",
    badgeColor: modelConfig?.badgeColor || styling.badgeColor,
    accentGlow: modelConfig?.accentGlow || styling.accentGlow,
    avatarIcon: modelConfig?.avatarIcon || styling.avatarIcon,
    grounded: isGrounded,
    timestamp: new Date().toISOString(),
    formattedTimestamp: new Date().toLocaleString("he-IL", {
      dateStyle: "medium",
      timeStyle: "short"
    }),
    rawResponse: rawChoiceContent,
    ...parsedResponse
  };
}
