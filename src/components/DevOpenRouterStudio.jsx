import React, { useState, useEffect } from 'react';
import { Terminal, Key, Play, Globe, CheckCircle2, AlertCircle, RefreshCw, Search, ShieldAlert, Zap, Cpu, Sparkles } from 'lucide-react';
import { DEFAULT_MODELS } from '../data/modelsConfig';
import { runModelPrompt, fetchOpenRouterModels, checkModelGroundingSupport } from '../services/openRouterApi';
import { getStoredApiKey, saveStoredApiKey } from '../services/storage';

export default function DevOpenRouterStudio({ onAddCustomCandidate }) {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [fetchingModels, setFetchingModels] = useState(false);

  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODELS[0].id);
  const [isGrounded, setIsGrounded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  // Fetch real OpenRouter models dynamically on load & search
  useEffect(() => {
    loadModelsFromOpenRouter(searchQuery);
  }, [searchQuery]);

  const loadModelsFromOpenRouter = async (query) => {
    setFetchingModels(true);
    try {
      const apiModels = await fetchOpenRouterModels(query);
      if (apiModels && apiModels.length > 0) {
        setAvailableModels(apiModels);
      } else {
        // Fallback to defaults filtered by query
        const filteredDefaults = DEFAULT_MODELS.filter(m => 
          m.name.toLowerCase().includes(query.toLowerCase()) || 
          m.id.toLowerCase().includes(query.toLowerCase())
        );
        setAvailableModels(filteredDefaults);
      }
    } catch (e) {
      console.warn("Could not load dynamic models from OpenRouter, using default preset list.", e);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSaveKey = (e) => {
    const val = e.target.value;
    setApiKey(val);
    saveStoredApiKey(val);
  };

  // Find currently selected model object
  const currentSelectedModel = availableModels.find(m => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId,
    supportsGrounding: checkModelGroundingSupport({ id: selectedModelId })
  };

  const modelSupportsGrounding = currentSelectedModel.supportsGrounding;

  // Auto-adjust grounding state if selected model doesn't support it
  const handleModelChange = (modelId) => {
    setSelectedModelId(modelId);
    const targetModel = availableModels.find(m => m.id === modelId);
    if (targetModel && !targetModel.supportsGrounding) {
      setIsGrounded(false); // Force disable grounding for unsupported models
    }
  };

  const handleRunPrompt = async () => {
    setError('');
    setLastResult(null);

    if (!apiKey) {
      setError('אנא הזן מפתח API של OpenRouter כדי להריץ את המודל');
      return;
    }

    setLoading(true);

    try {
      const result = await runModelPrompt({
        apiKey,
        modelId: selectedModelId,
        modelConfig: currentSelectedModel,
        isGrounded: modelSupportsGrounding ? isGrounded : false
      });

      setLastResult(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בהרצת המודל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      
      {/* Studio Header */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-amber-500/40 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-rubik flex items-center gap-2">
                <span>Dev Studio: הרצת מודלים בלייב מ-OpenRouter</span>
                <span className="px-2 py-0.5 text-xs bg-amber-500/30 text-amber-200 rounded-full font-bold">
                  API Live
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                משיכת מודלים בזמן אמת, סינון וחיפוש, ובדיקת תמיכה ב-Grounding לפני הרצה.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadModelsFromOpenRouter(searchQuery)}
            disabled={fetchingModels}
            className="text-xs text-slate-300 bg-slate-900 border border-slate-700 hover:text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
            <span>רענן רשימת מודלים</span>
          </button>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-400" />
            <span>מפתח OpenRouter API:</span>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={handleSaveKey}
            placeholder="sk-or-v1-..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Search & Model Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          
          {/* Search Box */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">חפש מודל ב-OpenRouter (אופציונלי):</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="למשל: gpt-4o, claude-3.7, gemini, deepseek..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Model Selector Dropdown */}
          <div className="sm:col-span-7 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              בחר מודל ({availableModels.length} מודלים נמצאו):
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.company || m.id}) {m.supportsGrounding ? '🌐 [Supports Grounding]' : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Grounding Capabilities & Toggle Control */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            
            {/* Grounding Checkbox Toggle */}
            <label className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              modelSupportsGrounding 
                ? 'bg-slate-950 border-slate-700 text-white cursor-pointer'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-60'
            }`}>
              <input
                type="checkbox"
                checked={isGrounded && modelSupportsGrounding}
                disabled={!modelSupportsGrounding}
                onChange={(e) => setIsGrounded(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
              <span className="flex items-center gap-1.5">
                <Globe className={`w-4 h-4 ${modelSupportsGrounding ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>הפעל חיפוש ברשת בזמן אמת (Grounding)</span>
              </span>
            </label>

            {/* Capability Status Badge */}
            <div>
              {modelSupportsGrounding ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  מודל זה תומך ב-Grounding (Web Search)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Grounding אינו זמין למודל זה לפי מפרט OpenRouter
                </span>
              )}
            </div>

          </div>

          {currentSelectedModel.description && (
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              <strong>תיאור המודל:</strong> {currentSelectedModel.description}
            </p>
          )}
        </div>

        {/* Run Action Button */}
        <div className="flex justify-end">
          <button
            onClick={handleRunPrompt}
            disabled={loading}
            className="btn-accent py-3 px-6 text-sm font-bold shadow-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>מריץ ומעבד תשובה מ-OpenRouter...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white" />
                <span>הרצ מודל בלייב</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      </div>

      {/* Result Output Preview */}
      {lastResult && (
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-emerald-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-white font-rubik">
                תשובה עובדה בהצלחה! ({lastResult.candidate?.name})
              </h4>
            </div>

            <button
              onClick={() => onAddCustomCandidate(lastResult)}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>הוסף לרשימת המועמדים באתר</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#090d16] font-mono text-xs text-slate-300 max-h-96 overflow-y-auto whitespace-pre-wrap border border-slate-800">
            {JSON.stringify(lastResult, null, 2)}
          </div>
        </div>
      )}

    </section>
  );
}
