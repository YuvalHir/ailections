import { SYSTEM_ROLEPLAY_PROMPT } from '../data/promptText';
import { MODEL_RESPONSE_JSON_SCHEMA, cleanAndParseJson } from '../utils/jsonSchema';

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

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
 * Fetch available models dynamically from OpenRouter OpenAPI endpoint
 */
export async function fetchOpenRouterModels(searchQuery = '') {
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
      const company = m.id.includes('/') ? m.id.split('/')[0] : 'AI';

      return {
        id: m.id,
        name: m.name || m.id,
        company: company.charAt(0).toUpperCase() + company.slice(1),
        description: m.description || '',
        contextLength: m.context_length || 0,
        pricing: m.pricing || {},
        supportedParameters: m.supported_parameters || [],
        supportsGrounding: supportsGrounding
      };
    });
  } catch (err) {
    console.error("Failed to fetch models from OpenRouter API:", err);
    throw err;
  }
}

/**
 * Call an AI model via OpenRouter API with grounding (if supported) and strict format instructions
 */
export async function runModelPrompt({ apiKey, modelId, modelConfig, isGrounded = false }) {
  if (!apiKey) {
    throw new Error("נא להזין מפתח API של OpenRouter");
  }

  const systemInstructions = `${SYSTEM_ROLEPLAY_PROMPT}

IMPORTANT INSTRUCTIONS FOR OUTPUT FORMAT:
You MUST respond strictly in valid JSON format corresponding to the following schema.
Do NOT output any intro or outro markdown text outside the JSON. Return only the JSON object.

JSON Schema structure:
${JSON.stringify(MODEL_RESPONSE_JSON_SCHEMA, null, 2)}`;

  const payload = {
    model: modelId,
    messages: [
      {
        role: "system",
        content: "אתה מנהיג אסטרטגי פוליטי מנוסה. עליך לענות בעברית רהוטה ומדויקת בלבד ולחזור בפורמט JSON תקני ובלעדי."
      },
      {
        role: "user",
        content: systemInstructions
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 4000
  };

  // Enable web grounding plugin ONLY if requested and supported
  if (isGrounded) {
    payload.plugins = [{ id: "web" }];
  }

  const response = await fetch(OPENROUTER_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "AIlections Israel 2026",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `שגיאה בתקשורת מול OpenRouter (${response.status})`);
  }

  const data = await response.json();
  const rawChoiceContent = data.choices?.[0]?.message?.content;

  if (!rawChoiceContent) {
    throw new Error("לא התקבלה תשובה מהמודל");
  }

  const parsedResponse = cleanAndParseJson(rawChoiceContent);

  return {
    id: `custom_${Date.now()}_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`,
    modelId: modelId,
    modelName: modelConfig?.name || modelId,
    company: modelConfig?.company || "OpenRouter",
    badgeColor: modelConfig?.badgeColor || "#3b82f6",
    accentGlow: modelConfig?.accentGlow || "rgba(59, 130, 246, 0.4)",
    avatarIcon: modelConfig?.avatarIcon || "Sparkles",
    grounded: isGrounded,
    timestamp: new Date().toISOString(),
    formattedTimestamp: new Date().toLocaleString("he-IL", {
      dateStyle: "medium",
      timeStyle: "short"
    }),
    ...parsedResponse
  };
}
