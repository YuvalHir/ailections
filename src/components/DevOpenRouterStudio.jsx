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
      const result = await runModelPrompt({
        apiKey,
        modelId: selectedSingleId,
        modelConfig: targetModel,
        isGrounded: useGrounding
      });

      setLastResults([result]);

      const updatedFull = [result, ...candidatesData.filter(c => c.modelId !== result.modelId)];
      const savedToDisk = await saveToDiskFile(updatedFull);
      if (savedToDisk) setDiskSaveSuccess(true);

      onAddCustomCandidate(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בהרצת המודל');
      if (err.rawContent) {
        setFailedRawText(err.rawContent);
        setManualRawInput(err.rawContent);
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry parsing manually modified/recovered raw text
  const handleRetryParseRaw = async () => {
    setError('');
    try {
      const parsed = cleanAndParseJson(manualRawInput || failedRawText);
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
      setFailedRawText('');

      const updatedFull = [result, ...candidatesData.filter(c => c.modelId !== result.modelId)];
      const savedToDisk = await saveToDiskFile(updatedFull);
      if (savedToDisk) setDiskSaveSuccess(true);

      onAddCustomCandidate(result);
    } catch (retryErr) {
      console.error(retryErr);
      setError(`ניסיון פענוח נוסף נכשל: ${retryErr.message}`);
    }
  };

  // Run batch multi-model execution in parallel
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
      initialProgress[id] = { status: 'pending' };
    });
    setBatchProgress(initialProgress);

    const newResults = [];
    let currentDataset = [...candidatesData];

    const promises = selectedBatchIds.map(async (modelId) => {
      const targetModel = availableModels.find(m => m.id === modelId) || {
        id: modelId,
        name: modelId,
        supportsGrounding: checkModelGroundingSupport({ id: modelId }),
        isFree: checkModelIsFree({ id: modelId })
      };

      const useGrounding = targetModel.supportsGrounding ? batchGroundedSetting : false;

      setBatchProgress(prev => ({
        ...prev,
        [modelId]: { status: 'running' }
      }));

      try {
        const result = await runModelPrompt({
          apiKey,
          modelId,
          modelConfig: targetModel,
          isGrounded: useGrounding
        });

        setBatchProgress(prev => ({
          ...prev,
          [modelId]: { status: 'done' }
        }));

        newResults.push(result);
        currentDataset = [result, ...currentDataset.filter(c => c.modelId !== result.modelId)];
      } catch (err) {
        console.error(`Error running model ${modelId}:`, err);
        setBatchProgress(prev => ({
          ...prev,
          [modelId]: { status: 'error', error: err.message, rawContent: err.rawContent }
        }));
      }
    });

    await Promise.allSettled(promises);

    setLastResults(newResults);

    if (newResults.length > 0) {
      const savedToDisk = await saveToDiskFile(currentDataset);
      if (savedToDisk) setDiskSaveSuccess(true);
      newResults.forEach(r => onAddCustomCandidate(r));
    }

    setLoading(false);
  };

  const handleSaveAllToDisk = async () => {
    const saved = await saveToDiskFile(candidatesData);
    if (saved) setDiskSaveSuccess(true);
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
                <span>הפעל חיפוש ברשת בזמן אמת (Grounding) במידה ונתמך</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunSinglePrompt}
                disabled={loading}
                className="btn-accent py-3 px-6 text-sm font-bold shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>מריץ מודל מול OpenRouter...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white" />
                    <span>הרצ מודל יחיד בלייב</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Execution Mode 2: Multi-Model Batch Mode */}
        {isBatchMode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>בחר מודלים להרצה במקביל ({selectedBatchIds.length} נבחרו מתוך {filteredModels.length}):</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAllFreeModels}
                  className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>בחר את כל החינמיים</span>
                </button>
                <button
                  onClick={selectAllGrounded}
                  className="text-xs text-cyan-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 px-2.5 py-1 rounded-lg"
                >
                  בחר תומכי Grounding
                </button>
                <button
                  onClick={selectAllFiltered}
                  className="text-xs text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 px-2.5 py-1 rounded-lg"
                >
                  בחר הכל לפי מסנן
                </button>
                <button
                  onClick={clearBatchSelection}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  נקה
                </button>
              </div>
            </div>

            {/* Checkbox grid for batch models */}
            <div className="max-h-64 overflow-y-auto p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredModels.map(m => {
                const isChecked = selectedBatchIds.includes(m.id);
                const isFree = m.isFree || checkModelIsFree(m);
                return (
                  <label
                    key={m.id}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-purple-950/40 border-purple-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleBatchSelect(m.id)}
                        className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 shrink-0"
                      />
                      <span className="truncate font-mono">{m.name} ({m.company})</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isFree && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-300 rounded font-extrabold flex items-center gap-0.5">
                          🎁 FREE
                        </span>
                      )}
                      {m.supportsGrounding && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-bold">
                          🌐 Grounding
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunBatchPrompts}
                disabled={loading || selectedBatchIds.length === 0}
                className="btn-accent py-3 px-6 text-sm font-bold shadow-lg flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>מריץ {selectedBatchIds.length} מודלים במקביל...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white" />
                    <span>הרצ {selectedBatchIds.length} מודלים במקביל (Batch Run)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Batch Progress Indicators */}
        {loading && isBatchMode && (
          <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 space-y-2">
            <h4 className="text-xs font-bold text-purple-300">התקדמות הרצה מרובה:</h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {Object.entries(batchProgress).map(([modelId, info]) => (
                <div key={modelId} className="flex items-center justify-between text-xs p-2 rounded bg-slate-950">
                  <span className="font-mono text-slate-200">{modelId}</span>
                  {info.status === 'pending' && <span className="text-slate-400">ממתין...</span>}
                  {info.status === 'running' && <span className="text-amber-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> מריץ...</span>}
                  {info.status === 'done' && <span className="text-emerald-400 font-bold">הושלם ✓</span>}
                  {info.status === 'error' && (
                    <button
                      onClick={() => {
                        if (info.rawContent) {
                          setFailedRawText(info.rawContent);
                          setManualRawInput(info.rawContent);
                          setSelectedSingleId(modelId);
                          setIsBatchMode(false);
                        }
                      }}
                      className="text-rose-400 font-bold hover:underline flex items-center gap-1"
                    >
                      שגיאה ❌ ({info.error}) - לחץ לתיקון
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Disk Save Success Notification */}
        {diskSaveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>התוצאות נשמרו בהצלחה ישירות לקובץ הפיזי <strong>src/data/modelsData.json</strong> בדיסק!</span>
          </div>
        )}

      </div>

      {/* Raw Text Recovery & Manual JSON Retry Panel */}
      {failedRawText && (
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-amber-500/50 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div>
                <h4 className="text-base font-bold text-white font-rubik">
                  טקסט גולמי שנשמר מהמודל (Raw Response Recovery)
                </h4>
                <p className="text-xs text-slate-400">
                  התשובה מהמודל לא אבדה! ניתן לתקן ידנית בתיבת הטקסט ולנסות לפענח שוב.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(manualRawInput || failedRawText);
                }}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>העתק טקסט גולמי</span>
              </button>

              <button
                onClick={handleRetryParseRaw}
                className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                <span>🔄 נסה לפענח JSON מחדש</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>ערוך/בדוק את הטקסט הגולמי שהתקבל מהמודל:</span>
            </label>
            <textarea
              value={manualRawInput}
              onChange={(e) => setManualRawInput(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl bg-[#090d16] font-mono text-xs text-slate-200 border border-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Results Section */}
      {lastResults.length > 0 && (
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-emerald-500/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h4 className="text-lg font-bold text-white font-rubik">
                התקבלו {lastResults.length} תשובות מ-OpenRouter!
              </h4>
            </div>

            <button
              onClick={handleSaveAllToDisk}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-emerald-300" />
              <span>שמור את כל המועמדים בדיסק (modelsData.json)</span>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lastResults.map((res, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-400">{res.modelName} ({res.company})</span>
                  <span className="text-amber-400">שם המועמד: {res.candidate?.name}</span>
                </div>
                <div className="text-xs text-slate-300 line-clamp-2">{res.candidate?.personaSummary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
