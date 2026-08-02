const VOTES_KEY = "ailections_user_votes_2026";
const VOTED_MODEL_KEY = "ailections_user_voted_model";
const API_KEY_STORAGE = "ailections_openrouter_key";
const CUSTOM_MODELS_KEY = "ailections_custom_models";

// Vercel KV Environment Variables (auto-populated by Vercel KV REST integration)
const KV_URL = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_KV_REST_API_URL || import.meta.env.KV_REST_API_URL)
  : null;

const KV_TOKEN = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_KV_REST_API_TOKEN || import.meta.env.KV_REST_API_TOKEN)
  : null;

/**
 * Get candidate model ID that this browser user voted for (or null if hasn't voted)
 */
export function getUserVotedModel() {
  try {
    return localStorage.getItem(VOTED_MODEL_KEY) || null;
  } catch (e) {
    return null;
  }
}

/**
 * Fetches current aggregate votes map from Vercel KV REST API or fallback to localStorage
 */
export async function fetchAggregateVotes() {
  if (KV_URL && KV_TOKEN) {
    try {
      const res = await fetch(`${KV_URL}/hgetall/votes`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result) {
          const votesMap = {};
          if (Array.isArray(data.result)) {
            for (let i = 0; i < data.result.length; i += 2) {
              votesMap[data.result[i]] = parseInt(data.result[i + 1], 10) || 0;
            }
          } else if (typeof data.result === 'object') {
            Object.keys(data.result).forEach(k => {
              votesMap[k] = parseInt(data.result[k], 10) || 0;
            });
          }
          return votesMap;
        }
      }
    } catch (e) {
      console.warn("Vercel KV fetch failed, falling back to local votes:", e);
    }
  }
  return getUserVotes();
}

export function getUserVotes() {
  try {
    const data = localStorage.getItem(VOTES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Cast or change vote for a model ID.
 * Enforces 1 vote per browser, and syncs with Vercel KV if connected!
 */
export async function castVote(modelId) {
  const previousVotedModel = getUserVotedModel();
  const currentVotes = getUserVotes();

  // If changing vote from previous model
  if (previousVotedModel && previousVotedModel !== modelId) {
    currentVotes[previousVotedModel] = Math.max(0, (currentVotes[previousVotedModel] || 1) - 1);
  }

  currentVotes[modelId] = (currentVotes[modelId] || 0) + 1;

  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(currentVotes));
    localStorage.setItem(VOTED_MODEL_KEY, modelId);
  } catch (e) {
    console.error("Failed to save vote to localStorage", e);
  }

  // Sync to Vercel KV in background if configured
  if (KV_URL && KV_TOKEN) {
    try {
      if (previousVotedModel && previousVotedModel !== modelId) {
        fetch(`${KV_URL}/hincrby/votes/${encodeURIComponent(previousVotedModel)}/-1`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${KV_TOKEN}` }
        }).catch(() => {});
      }
      fetch(`${KV_URL}/hincrby/votes/${encodeURIComponent(modelId)}/1`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      }).catch(() => {});
    } catch (e) {
      console.warn("Vercel KV sync failed:", e);
    }
  }

  return { votes: currentVotes, userVotedModel: modelId };
}

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function saveStoredApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key || "");
}

export function getCustomModels() {
  try {
    const data = localStorage.getItem(CUSTOM_MODELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomModel(modelData) {
  const existing = getCustomModels();
  const updated = [modelData, ...existing.filter(m => m.modelId !== modelData.modelId)];
  try {
    localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save custom model", e);
  }
  return updated;
}

/**
 * Saves dataset directly to physical src/data/modelsData.json on disk via Vite dev server middleware
 */
export async function saveToDiskFile(fullDataset) {
  try {
    const res = await fetch('/api/save-models-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullDataset)
    });
    if (res.ok) {
      console.log('Successfully saved models dataset directly to disk file src/data/modelsData.json!');
      return true;
    }
  } catch (err) {
    console.warn('Local disk save middleware not available (only active in dev mode):', err);
  }
  return false;
}
