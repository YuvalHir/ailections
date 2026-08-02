const VOTES_KEY = "ailections_user_votes_2026";
const API_KEY_STORAGE = "ailections_openrouter_key";
const CUSTOM_MODELS_KEY = "ailections_custom_models";

export function getUserVotes() {
  try {
    const data = localStorage.getItem(VOTES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function castVote(modelId) {
  const currentVotes = getUserVotes();
  currentVotes[modelId] = (currentVotes[modelId] || 0) + 1;
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(currentVotes));
  } catch (e) {
    console.error("Failed to save vote to localStorage", e);
  }
  return currentVotes;
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
