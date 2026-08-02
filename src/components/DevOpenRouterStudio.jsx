import React, { useState, useEffect } from 'react';
import { Terminal, Key, Play, Globe, CheckCircle2, AlertCircle, RefreshCw, Search, Sparkles, Copy, Download, Save, Check, Filter, Layers, Gift, Edit3 } from 'lucide-react';
import { DEFAULT_MODELS } from '../data/modelsConfig';
import { runModelPrompt, fetchOpenRouterModels, checkModelGroundingSupport, checkModelIsFree } from '../services/openRouterApi';
import { cleanAndParseJson } from '../utils/jsonSchema';
import { getStoredApiKey, saveStoredApiKey, saveToDiskFile } from '../services/storage';

export default function DevOpenRouterStudio({ candidatesData = [], onAddCustomCandidate }) {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [groundingFilter, setGroundingFilter] = useState('ALL'); // 'ALL' | 'GROUNDED' | 'UNGROUNDED'
  const [priceFilter, setPriceFilter] = useState('ALL'); // 'ALL' | 'FREE_ONLY' | 'PAID_ONLY'
  
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [fetchingModels, setFetchingModels] = useState(false);

  // Multi-model batch selection
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchGroundedSetting, setBatchGroundedSetting] = useState(true);

  // Single model selection
  const [selectedSingleId, setSelectedSingleId] = useState(DEFAULT_MODELS[0].id);
  const [singleGroundedSetting, setSingleGroundedSetting] = useState(true);

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({});
  const [error, setError] = useState('');
  const [lastResults, setLastResults] = useState([]);
  const [diskSaveSuccess, setDiskSaveSuccess] = useState(false);

  // Raw text recovery state if JSON parse fails
  const [failedRawText, setFailedRawText] = useState('');
  const [manualRawInput, setManualRawInput] = useState('');

  // Fetch OpenRouter models dynamically
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

  const companiesList = Array.from(new Set(availableModels.map(m => m.company))).filter(Boolean).sort();

  // Filter models based on search, company, grounding, and price filters
  const filteredModels = availableModels.filter(m => {
    const matchesSearch = !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = companyFilter === 'ALL' || m.company.toLowerCase() === companyFilter.toLowerCase();

    const matchesGrounding = groundingFilter === 'ALL' || 
      (groundingFilter === 'GROUNDED' && m.supportsGrounding) ||
      (groundingFilter === 'UNGROUNDED' && !m.supportsGrounding);

    const matchesPrice = priceFilter === 'ALL' ||
      (priceFilter === 'FREE_ONLY' && (m.isFree || checkModelIsFree(m))) ||
      (priceFilter === 'PAID_ONLY' && (!m.isFree && !checkModelIsFree(m)));

    return matchesSearch && matchesCompany && matchesGrounding && matchesPrice;
  });

  // Auto-sync selectedSingleId whenever filteredModels list changes
  useEffect(() => {
    if (filteredModels && filteredModels.length > 0) {
      const exists = filteredModels.some(m => m.id === selectedSingleId);
      if (!exists) {
        setSelectedSingleId(filteredModels[0].id);
      }
    }
  }, [searchQuery, companyFilter, groundingFilter, priceFilter, availableModels]);

  const toggleBatchSelect = (modelId) => {
    if (selectedBatchIds.includes(modelId)) {
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== modelId));
    } else {
      setSelectedBatchIds([...selectedBatchIds, modelId]);
    }
  };

  const selectAllFreeModels = () => {
    const freeIds = filteredModels.filter(m => m.isFree || checkModelIsFree(m)).map(m => m.id);
    setSelectedBatchIds(freeIds);
  };

  const selectAllGrounded = () => {
    const groundedIds = filteredModels.filter(m => m.supportsGrounding).map(m => m.id);
    setSelectedBatchIds(groundedIds);
  };

  const selectAllFiltered = () => {
    setSelectedBatchIds(filteredModels.map(m => m.id));
  };

  const clearBatchSelection = () => {
    setSelectedBatchIds([]);
  };

  // Run single prompt execution
  const handleRunSinglePrompt = async () => {
    setError('');
    setLastResults([]);
    setFailedRawText('');
    setManualRawInput('');
    setDiskSaveSuccess(false);

    if (!apiKey) {
      setError('אנא הזן מפתח API של OpenRouter כדי להריץ את המודל');
      return;
    }

    setLoading(true);
    const targetModel = availableModels.find(m => m.id === selectedSingleId) || {
      id: selectedSingleId,
      name: selectedSingleId,
      supportsGrounding: checkModelGroundingSupport({ id: selectedSingleId }),
      isFree: checkModelIsFree({ id: selectedSingleId })
    };

    const useGrounding = targetModel.supportsGrounding ? singleGroundedSetting : false;

    try {
      const parsed = await runModelPrompt({
        apiKey,
        modelId: selectedSingleId,
        modelConfig: targetModel,
        isGrounded: useGrounding
      });

      const result = {
        id: `custom_${Date.now()}_${selectedSingleId.replace(/[^a-zA-Z0-9]/g, '_')}`,
        modelId: selectedSingleId,
        modelName: targetModel.name,
        company: targetModel.company || "OpenRouter",
        badgeColor: targetModel.badgeColor || "#3b82f6",
        accentGlow: targetModel.accentGlow || "rgba(59, 130, 246, 0.4)",
        avatarIcon: targetModel.avatarIcon || "Sparkles",
        grounded: singleGroundedSetting,
        timestamp: new Date().toISOString(),
        formattedTimestamp: new Date().toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" }),
        ...parsed
      };

      setLastResults([result]);
      setFailedRawText('');

      const updatedFull = [result, ...candidatesData.filter(c => c.modelId !== result.modelId)];
      const savedToDisk = await saveToDiskFile(updatedFull);
      if (savedToDisk) setDiskSaveSuccess(true);

      if (onAddCustomCandidate) {
        onAddCustomCandidate(result);
      }
    } catch (err) {
      console.error("Failed to run single model prompt:", err);
      setError(err.message || 'שגיאה בהרצת המודל מול OpenRouter');
      if (err.rawContent) {
        setFailedRawText(err.rawContent);
        setManualRawInput(err.rawContent);
      }
    } finally {
      setLoading(false);
    }
  };

  // Run multi-model batch execution
  const handleRunBatchPrompts = async () => {
    setError('');
    setLastResults([]);
    setFailedRawText('');
    setManualRawInput('');
    setDiskSaveSuccess(false);

    if (!apiKey) {
      setError('אנא הזן מפתח API של OpenRouter כדי להריץ את המודלים');
      return;
    }

    if (selectedBatchIds.length === 0) {
      setError('אנא בחר לפחות מודל אחד להרצה מרובה');
      return;
    }

    setLoading(true);
    const initialProgress = {};
    selectedBatchIds.forEach(id => {
      initialProgress[id] = { status: 'pending', error: null };
    });
    setBatchProgress(initialProgress);

    const completedResults = [];
    let currentFullDataset = [...candidatesData];

    // Execute in parallel
    const promises = selectedBatchIds.map(async (modelId) => {
      setBatchProgress(prev => ({
        ...prev,
        [modelId]: { status: 'running', error: null }
      }));

      const targetModel = availableModels.find(m => m.id === modelId) || {
        id: modelId,
        name: modelId,
        supportsGrounding: checkModelGroundingSupport({ id: modelId }),
        isFree: checkModelIsFree({ id: modelId })
      };

      const useGrounding = targetModel.supportsGrounding ? batchGroundedSetting : false;

      try {
        const parsed = await runModelPrompt({
          apiKey,
          modelId: modelId,
          modelConfig: targetModel,
          isGrounded: useGrounding
        });

        const result = {
          id: `custom_${Date.now()}_${modelId.replace(/[^a-zA-Z0-9]/g, '_')}`,
          modelId: modelId,
          modelName: targetModel.name,
          company: targetModel.company || "OpenRouter",
          badgeColor: targetModel.badgeColor || "#3b82f6",
          accentGlow: targetModel.accentGlow || "rgba(59, 130, 246, 0.4)",
          avatarIcon: targetModel.avatarIcon || "Sparkles",
          grounded: useGrounding,
          timestamp: new Date().toISOString(),
          formattedTimestamp: new Date().toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" }),
          ...parsed
        };

        completedResults.push(result);
        currentFullDataset = [result, ...currentFullDataset.filter(c => c.modelId !== result.modelId)];

        setBatchProgress(prev => ({
          ...prev,
          [modelId]: { status: 'success', result }
        }));
      } catch (err) {
        console.error(`Batch execution failed for ${modelId}:`, err);
        setBatchProgress(prev => ({
          ...prev,
          [modelId]: { status: 'error', error: err.message, rawContent: err.rawContent }
        }));
      }
    });

    await Promise.allSettled(promises);

    setLastResults(completedResults);
    setLoading(false);

    if (completedResults.length > 0) {
      const savedToDisk = await saveToDiskFile(currentFullDataset);
      if (savedToDisk) setDiskSaveSuccess(true);
    }
  };

  // Manual retry of raw text extraction
  const handleRetryManualJson = () => {
    if (!manualRawInput) return;
    try {
      const parsed = cleanAndParseJson(manualRawInput);
      const targetModel = availableModels.find(m => m.id === selectedSingleId) || {
        id: selectedSingleId,
        name: selectedSingleId
      };

      const result = {
        id: `custom_${Date.now()}_${selectedSingleId.replace(/[^a-zA-Z0-9]/g, '_')}`,
        modelId: selectedSingleId,
        modelName: targetModel.name,
        company: targetModel.company || "OpenRouter",
        badgeColor: targetModel.badgeColor || "#3b82f6",
        accentGlow: targetModel.accentGlow || "rgba(59, 130, 246, 0.4)",
        avatarIcon: targetModel.avatarIcon || "Sparkles",
        grounded: singleGroundedSetting,
        timestamp: new Date().toISOString(),
        formattedTimestamp: new Date().toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" }),
        ...parsed
      };

      setLastResults([result]);
      setError('');
      setFailedRawText('');

      const updatedFull = [result, ...candidatesData.filter(c => c.modelId !== result.modelId)];
      saveToDiskFile(updatedFull).then(saved => {
        if (saved) setDiskSaveSuccess(true);
      });

      if (onAddCustomCandidate) {
        onAddCustomCandidate(result);
      }
    } catch (err) {
      setError(`ניסיון החילוץ מחדש נכשל: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-950/90 border-b border-amber-500/30 p-4 sm:p-6 text-slate-100 shadow-2xl relative z-30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Studio Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white font-rubik flex items-center gap-2">
                <span>Dev Studio: הרצת מודלים ושמירה ישירה לקובץ</span>
                <span className="px-2 py-0.5 text-xs bg-amber-500/30 text-amber-200 rounded-full font-bold">
                  OpenRouter API
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                סינון מודלים חינמיים/בתשלום, הרצה במקביל, שחזור טקסט גולמי ושמירה ל-src/data/modelsData.json.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isBatchMode
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isBatchMode ? 'מצב הרצה מרובה (Batch)' : 'מצב מודל בודד'}</span>
            </button>

            <button
              onClick={() => loadModelsFromOpenRouter(searchQuery)}
              disabled={fetchingModels}
              className="text-xs text-slate-300 bg-slate-900 border border-slate-700 hover:text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingModels ? 'animate-spin' : ''}`} />
              <span>רענן מודלים</span>
            </button>
          </div>
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

        {/* Filters Section (Company, Grounding, Price, Search) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Filter className="w-4 h-4" />
            <span>מסנני מודלים מתקדמים (Filtering):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            
            {/* Free Search */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">חיפוש חופשי:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="למשל: gpt-4o, claude, free..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Filter by Price (Free vs Paid) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">מחיר מודל:</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="ALL">כל המודלים (חינמיים ובתשלום)</option>
                <option value="FREE_ONLY">🎁 מודלים חינמיים בלבד (Free Models)</option>
                <option value="PAID_ONLY">💳 מודלים בתשלום (Paid Models)</option>
              </select>
            </div>

            {/* Filter by Company */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">חברה / ספק:</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">כל החברות ({availableModels.length} מודלים)</option>
                {companiesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Filter by Grounding Support */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">תמיכה ב-Grounding:</label>
              <select
                value={groundingFilter}
                onChange={(e) => setGroundingFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">כל המודלים</option>
                <option value="GROUNDED">🌐 תומכים ב-Grounding בלבד</option>
                <option value="UNGROUNDED">ללא Grounding</option>
              </select>
            </div>

          </div>
        </div>

        {/* Execution Mode 1: Single Model Selection */}
        {!isBatchMode && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                בחר מודל להרצה ({filteredModels.length} מודלים מתאימים לסינון):
              </label>
              <select
                value={selectedSingleId}
                onChange={(e) => setSelectedSingleId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              >
                {filteredModels.map(m => {
                  const isFree = m.isFree || checkModelIsFree(m);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.company}) {isFree ? '🎁 [FREE]' : ''} {m.supportsGrounding ? '🌐 [Grounding]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleGroundedSetting}
                  onChange={(e) => setSingleGroundedSetting(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
                />
                <span>הפעל חיפוש רשת בזמן אמת (Grounding via Web Plugin)</span>
              </label>

              <button
                onClick={handleRunSinglePrompt}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-slate-950" />
                )}
                <span>{loading ? 'מריץ מודל...' : 'הרץ מודל וחלץ מצע מלא'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Execution Mode 2: Multi-Model Batch Selection */}
        {isBatchMode && (
          <div className="space-y-4 bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-purple-300 font-rubik flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>מצב הרצה במקביל (Batch Mode)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  נבחרו {selectedBatchIds.length} מודלים מתוך {filteredModels.length} מסוננים
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={selectAllFreeModels}
                  className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold flex items-center gap-1"
                >
                  <Gift className="w-3 h-3" />
                  <span>🎁 בחר את כל החינמיים</span>
                </button>

                <button
                  onClick={selectAllGrounded}
                  className="px-2.5 py-1 rounded-lg text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-bold flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>🌐 בחר תומכי Grounding</span>
                </button>

                <button
                  onClick={selectAllFiltered}
                  className="px-2.5 py-1 rounded-lg text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 font-bold"
                >
                  בחר את כל המסוננים ({filteredModels.length})
                </button>

                <button
                  onClick={clearBatchSelection}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                >
                  נקה בחירה
                </button>
              </div>
            </div>

            {/* Checkbox grid of models */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-2 bg-slate-900/90 rounded-xl border border-slate-800">
              {filteredModels.map(m => {
                const isSelected = selectedBatchIds.includes(m.id);
                const isFree = m.isFree || checkModelIsFree(m);
                const prog = batchProgress[m.id];

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleBatchSelect(m.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-purple-900/40 border-purple-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{m.company}</span>
                          {isFree && <span className="text-emerald-400 font-bold">🎁 FREE</span>}
                          {m.supportsGrounding && <span className="text-cyan-400">🌐 Grounded</span>}
                        </div>
                      </div>
                    </div>

                    {prog && (
                      <div className="shrink-0 ml-2">
                        {prog.status === 'running' && <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />}
                        {prog.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {prog.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" title={prog.error} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={batchGroundedSetting}
                  onChange={(e) => setBatchGroundedSetting(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700"
                />
                <span>הפעל חיפוש בזמן אמת (Grounding) למודלים נתמכים ב-Batch</span>
              </label>

              <button
                onClick={handleRunBatchPrompts}
                disabled={loading || selectedBatchIds.length === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>{loading ? 'מריץ אצווה במקביל...' : `הרץ ${selectedBatchIds.length} מודלים במקביל`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Disk Save Notification */}
        {diskSaveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>התוצאות נשמרו בהצלחה ישירות לקובץ הפיזי src/data/modelsData.json ובזיכרון!</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Raw Response Recovery Panel */}
        {failedRawText && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>שחזור טקסט גולמי (Raw Text JSON Recovery):</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualRawInput);
                }}
                className="text-[11px] text-slate-300 hover:text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>העתק טקסט גולמי</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              פענוח ה-JSON מהמודל נכשל. תוכל לערוך ולתקן את הטקסט הגולמי ולנסות לפענח שנית:
            </p>

            <textarea
              value={manualRawInput}
              onChange={(e) => setManualRawInput(e.target.value)}
              rows={6}
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={handleRetryManualJson}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>🔄 נסה לפענח JSON מחדש ולשמור לקובץ</span>
            </button>
          </div>
        )}

        {/* Results Preview Cards */}
        {lastResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>תוצאות אחרונות שנוצרו ונשמרו ({lastResults.length} מודלים):</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lastResults.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{r.candidate?.name}</span>
                    <span className="text-xs text-cyan-400 font-mono">{r.modelName}</span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{r.candidate?.personaSummary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
