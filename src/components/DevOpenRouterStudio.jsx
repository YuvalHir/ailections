import React, { useState, useEffect } from 'react';
import { Terminal, Key, Play, Globe, CheckCircle2, AlertCircle, RefreshCw, Search, Sparkles, Copy, Download, Save, Check, Filter, Layers } from 'lucide-react';
import { DEFAULT_MODELS } from '../data/modelsConfig';
import { runModelPrompt, fetchOpenRouterModels, checkModelGroundingSupport } from '../services/openRouterApi';
import { getStoredApiKey, saveStoredApiKey, saveToDiskFile } from '../services/storage';

export default function DevOpenRouterStudio({ candidatesData = [], onAddCustomCandidate }) {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [groundingFilter, setGroundingFilter] = useState('ALL'); // 'ALL' | 'GROUNDED' | 'UNGROUNDED'
  
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
  const [batchProgress, setBatchProgress] = useState({}); // { [modelId]: { status: 'pending'|'running'|'done'|'error', error?: string } }
  const [error, setError] = useState('');
  const [lastResults, setLastResults] = useState([]);
  const [diskSaveSuccess, setDiskSaveSuccess] = useState(false);

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

  // Get unique companies list for filter dropdown
  const companiesList = Array.from(new Set(availableModels.map(m => m.company))).filter(Boolean).sort();

  // Filter models based on search, company, and grounding filters
  const filteredModels = availableModels.filter(m => {
    const matchesSearch = !searchQuery || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = companyFilter === 'ALL' || m.company.toLowerCase() === companyFilter.toLowerCase();

    const matchesGrounding = groundingFilter === 'ALL' || 
      (groundingFilter === 'GROUNDED' && m.supportsGrounding) ||
      (groundingFilter === 'UNGROUNDED' && !m.supportsGrounding);

    return matchesSearch && matchesCompany && matchesGrounding;
  });

  // Toggle selection for batch mode
  const toggleBatchSelect = (modelId) => {
    if (selectedBatchIds.includes(modelId)) {
      setSelectedBatchIds(selectedBatchIds.filter(id => id !== modelId));
    } else {
      setSelectedBatchIds([...selectedBatchIds, modelId]);
    }
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
    setDiskSaveSuccess(false);

    if (!apiKey) {
      setError('אנא הזן מפתח API של OpenRouter כדי להריץ את המודל');
      return;
    }

    setLoading(true);
    const targetModel = availableModels.find(m => m.id === selectedSingleId) || {
      id: selectedSingleId,
      name: selectedSingleId,
      supportsGrounding: checkModelGroundingSupport({ id: selectedSingleId })
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

      // Automatically save directly to physical src/data/modelsData.json on disk!
      const updatedFull = [result, ...candidatesData.filter(c => c.modelId !== result.modelId)];
      const savedToDisk = await saveToDiskFile(updatedFull);
      if (savedToDisk) setDiskSaveSuccess(true);

      onAddCustomCandidate(result);
    } catch (err) {
      console.error(err);
      setError(err.message || 'שגיאה בהרצת המודל');
    } finally {
      setLoading(false);
    }
  };

  // Run batch multi-model execution in parallel
  const handleRunBatchPrompts = async () => {
    setError('');
    setLastResults([]);
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

    // Execute in parallel promises
    const promises = selectedBatchIds.map(async (modelId) => {
      const targetModel = availableModels.find(m => m.id === modelId) || {
        id: modelId,
        name: modelId,
        supportsGrounding: checkModelGroundingSupport({ id: modelId })
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
          [modelId]: { status: 'error', error: err.message }
        }));
      }
    });

    await Promise.allSettled(promises);

    setLastResults(newResults);

    // Save full updated dataset directly to physical src/data/modelsData.json on disk!
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
                הרצת מודלים בודדים או במקביל, סינון לפי חברה ו-Grounding, ושמירה ישירה ל-src/data/modelsData.json.
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

        {/* Filters Section (Company, Grounding, Search) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <Filter className="w-4 h-4" />
            <span>מסנני מודלים מפתח (Filtering):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Free Search */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">חיפוש חופשי:</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש לפי שם או slug..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Filter by Company */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">סינון לפי חברה/ספק:</label>
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
                {filteredModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.company}) {m.supportsGrounding ? '🌐 [Supports Grounding]' : ''}
                  </option>
                ))}
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

              <div className="flex items-center gap-2">
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

                    {m.supportsGrounding && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded font-bold shrink-0">
                        🌐 Grounding
                      </span>
                    )}
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
                  {info.status === 'error' && <span className="text-rose-400 font-bold">שגיאה ❌ ({info.error})</span>}
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
