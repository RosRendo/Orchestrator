'use client';

import React, { useState, useEffect } from 'react';

interface MultiModelArenaViewProps {
  backendUrl: string;
}

interface ModelColumn {
  id: string;
  name: string;
  provider: string;
  model: string;
  role: string;
  customBaseUrl?: string;
  customApiKey?: string;
  response: string;
  loading: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
  timeMs?: number;
}

const PRESET_MODELS = [
  { provider: 'deepseek', model: 'deepseek-chat', name: 'DeepSeek V3', role: 'coding' },
  { provider: 'deepseek', model: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoner)', role: 'coding' },
  { provider: 'claude', model: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', role: 'business' },
  { provider: 'claude', model: 'claude-3-opus-20240229', name: 'Claude 3 Opus', role: 'business' },
  { provider: 'openai', model: 'gpt-4o', name: 'GPT-4o', role: 'general' },
  { provider: 'openai', model: 'o3-mini', name: 'OpenAI o3-mini', role: 'coding' },
  { provider: 'gemini', model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', role: 'research' },
  { provider: 'openrouter', model: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 (OpenRouter)', role: 'marketing' },
  { provider: 'ollama', model: 'llama3', name: 'Local Llama 3 (Ollama)', role: 'general' },
];

export default function MultiModelArenaView({ backendUrl }: MultiModelArenaViewProps) {
  const [columns, setColumns] = useState<ModelColumn[]>([
    {
      id: 'col-1',
      name: 'DeepSeek V3',
      provider: 'deepseek',
      model: 'deepseek-chat',
      role: 'coding',
      response: '',
      loading: false,
      status: 'idle'
    },
    {
      id: 'col-2',
      name: 'Claude 3.5 Sonnet',
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      role: 'business',
      response: '',
      loading: false,
      status: 'idle'
    },
    {
      id: 'col-3',
      name: 'GPT-4o',
      provider: 'openai',
      model: 'gpt-4o',
      role: 'general',
      response: '',
      loading: false,
      status: 'idle'
    }
  ]);

  const [prompt, setPrompt] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('Custom Endpoint');
  const [customBaseUrl, setCustomBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [customModel, setCustomModel] = useState('anthropic/claude-3.7-sonnet');
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedOutput, setSynthesizedOutput] = useState<string | null>(null);
  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);

  // Synthesize responses from multiple models into one Master Asset
  const handleSynthesize = async () => {
    const readyCols = columns.filter(c => c.response);
    if (readyCols.length < 2) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch(`${backendUrl}/automation/arena/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          responses: readyCols.map(c => ({
            name: c.name,
            model: c.model,
            response: c.response,
            role: c.role
          }))
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSynthesizedOutput(data.synthesized);
        setIsSynthesisModalOpen(true);
      }
    } catch (err: any) {
      alert(`Synthesis failed: ${err.message}`);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Send prompt to all active columns in parallel
  const handleSendAll = async () => {
    if (!prompt.trim()) return;
    const currentPrompt = prompt.trim();

    // Mark all columns as loading
    setColumns(prev => prev.map(c => ({
      ...c,
      loading: true,
      status: 'running',
      error: undefined,
      response: ''
    })));

    const promises = columns.map(async (col) => {
      const start = Date.now();
      try {
        const payload: any = {
          agentId: col.role,
          action: 'arena_query',
          prompt: currentPrompt,
          mode: 'llm',
          provider: col.provider,
          model: col.model,
        };

        if (col.customBaseUrl) {
          payload.ollamaUrl = col.customBaseUrl;
          payload.customBaseUrl = col.customBaseUrl;
        }
        if (col.customApiKey) {
          payload.apiKey = col.customApiKey;
        }

        const res = await fetch(`${backendUrl}/automation/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        const elapsed = Date.now() - start;

        if (data.ok) {
          setColumns(prev => prev.map(c => c.id === col.id ? {
            ...c,
            response: data.result || 'No response generated.',
            loading: false,
            status: 'completed',
            timeMs: elapsed
          } : c));
        } else {
          setColumns(prev => prev.map(c => c.id === col.id ? {
            ...c,
            error: data.error || 'Execution failed',
            loading: false,
            status: 'error',
            timeMs: elapsed
          } : c));
        }
      } catch (err: any) {
        const elapsed = Date.now() - start;
        setColumns(prev => prev.map(c => c.id === col.id ? {
          ...c,
          error: err.message || 'Network connection failed',
          loading: false,
          status: 'error',
          timeMs: elapsed
        } : c));
      }
    });

    await Promise.allSettled(promises);
  };

  // Remove Column
  const handleRemoveColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns(prev => prev.filter(c => c.id !== id));
  };

  // Add Column
  const handleAddColumn = () => {
    if (columns.length >= 4) return;
    const newId = `col-${Date.now()}`;
    const nextPreset = PRESET_MODELS[columns.length % PRESET_MODELS.length];
    setColumns(prev => [
      ...prev,
      {
        id: newId,
        name: nextPreset.name,
        provider: nextPreset.provider,
        model: nextPreset.model,
        role: nextPreset.role,
        response: '',
        loading: false,
        status: 'idle'
      }
    ]);
  };

  // Change Column Model
  const handleChangeModel = (colId: string, presetName: string) => {
    if (presetName === '__custom__') {
      setTargetColumnId(colId);
      setIsCustomModalOpen(true);
      return;
    }
    const preset = PRESET_MODELS.find(p => p.name === presetName);
    if (!preset) return;
    setColumns(prev => prev.map(c => c.id === colId ? {
      ...c,
      name: preset.name,
      provider: preset.provider,
      model: preset.model,
      role: preset.role,
      customBaseUrl: undefined,
      customApiKey: undefined
    } : c));
  };

  // Save Custom Endpoint
  const handleSaveCustomEndpoint = () => {
    if (!targetColumnId) return;
    setColumns(prev => prev.map(c => c.id === targetColumnId ? {
      ...c,
      name: customName || 'Custom API',
      provider: 'custom',
      model: customModel,
      customBaseUrl,
      customApiKey
    } : c));
    setIsCustomModalOpen(false);
  };

  // Save Answer to Obsidian
  const handleSaveToObsidian = async (col: ModelColumn) => {
    if (!col.response) return;
    try {
      const res = await fetch(`${backendUrl}/automation/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought: `[Arena Comparison Winner: ${col.name}]\n\nPrompt: ${prompt}\n\nResponse:\n${col.response}`,
          source: `Arena_${col.name}`
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSavedStatus(`Saved to Obsidian (${col.name})`);
        setTimeout(() => setSavedStatus(null), 3000);
      }
    } catch {}
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 'calc(100vh - 120px)',
      width: '100%',
      gap: '12px',
      position: 'relative'
    }}>

      {/* ─── Top Controls & Presets ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: '#161b22',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚔️</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Multi-Model Parallel Arena
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Side-by-side comparison across multiple models & specialized skills in real time.
            </span>
          </div>
        </div>

        {/* Quick Presets & Add Column */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {columns.filter(c => c.response).length >= 2 && (
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 700,
                padding: '6px 14px',
                fontSize: '0.8rem',
                cursor: isSynthesizing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🧬</span>
              <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Master Output'}</span>
            </button>
          )}

          {savedStatus && (
            <span style={{ background: '#10b981', color: '#000', fontWeight: 700, fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px' }}>
              ✓ {savedStatus}
            </span>
          )}

          <button
            onClick={() => {
              setTargetColumnId(null);
              setIsCustomModalOpen(true);
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              color: '#c9d1d9',
              padding: '6px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🔌</span> Custom API Endpoint
          </button>

          {columns.length < 4 && (
            <button
              onClick={handleAddColumn}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '6px',
                color: '#818cf8',
                fontWeight: 600,
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span> Add Model Column
            </button>
          )}
        </div>
      </div>

      {/* ─── Columns Area (Matching Reference Image) ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
        gap: '12px',
        flex: 1,
        minHeight: 0
      }}>
        {columns.map((col) => (
          <div
            key={col.id}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e1e4e8',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eaecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fafbfc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={col.name}
                  onChange={(e) => handleChangeModel(col.id, e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    color: '#24292e',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {PRESET_MODELS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__custom__">⚙️ + Custom API / Model</option>
                </select>

                <span style={{
                  fontSize: '0.68rem',
                  background: '#e1e4e8',
                  color: '#444d56',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {col.role}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {col.timeMs && (
                  <span style={{ fontSize: '0.72rem', color: '#586069' }}>
                    {(col.timeMs / 1000).toFixed(1)}s
                  </span>
                )}
                {columns.length > 1 && (
                  <button
                    onClick={() => handleRemoveColumn(col.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#959da5',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      lineHeight: 1
                    }}
                    title="Remove column"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Column Body / Response Area */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              color: '#24292e',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {col.loading ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#586069' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid #e1e4e8',
                    borderTopColor: '#0366d6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ fontSize: '0.85rem' }}>{col.name} is thinking...</span>
                </div>
              ) : col.error ? (
                <div style={{ color: '#cb2431', background: '#ffeef0', padding: '12px', borderRadius: '6px', fontSize: '0.82rem' }}>
                  <strong>Error:</strong> {col.error}
                </div>
              ) : col.response ? (
                <div>
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {col.response}
                  </div>
                  
                  {/* Action row */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eaecef', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigator.clipboard.writeText(col.response)}
                      style={{
                        background: '#f6f8fa',
                        border: '1px solid #d1d5da',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        color: '#24292e'
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handleSaveToObsidian(col)}
                      style={{
                        background: '#2ea44f',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    >
                      📓 Save to Obsidian
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#959da5',
                  fontSize: '0.88rem'
                }}>
                  {col.name} answers here.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Bottom Unified Input Bar (Matching Reference Image) ──────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#ffffff',
        border: '1px solid #e1e4e8',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
      }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendAll();
            }
          }}
          placeholder={`Send to ${columns.length} models... (e.g. "Draft an ICP and cold email pitch for a Telegram SaaS")`}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.92rem',
            color: '#24292e',
            background: 'transparent'
          }}
        />

        <button
          onClick={handleSendAll}
          disabled={!prompt.trim() || columns.some(c => c.loading)}
          style={{
            background: columns.some(c => c.loading) ? '#959da5' : '#586069',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 20px',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: columns.some(c => c.loading) ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease'
          }}
        >
          {columns.some(c => c.loading) ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* ─── MODAL: CUSTOM API ENDPOINT ──────────────────────────────────── */}
      {isCustomModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '480px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>
              🔌 Connect Custom AI Endpoint / Model
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Add any OpenAI-compatible provider (OpenRouter, Groq, local Ollama, or future Claude 5.3 / Codex 5.6).
            </p>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Display Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Claude 3.7 Sonnet / OpenRouter"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Base URL (OpenAI-compatible)
              </label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                API Key
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Model Identifier String
              </label>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. anthropic/claude-3.7-sonnet or deepseek/deepseek-r1"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomEndpoint}
                style={{ background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 700, padding: '6px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Apply Model
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── MODAL: ARENA MASTER SYNTHESIS ─────────────────────────────── */}
      {isSynthesisModalOpen && synthesizedOutput && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(168, 85, 247, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🧬</span>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                    Master Synthesized Asset
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#a78bfa' }}>
                    Merged best logic, code, and persuasive hooks across {columns.filter(c => c.response).length} candidate models
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsSynthesisModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Content Body */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              color: '#e6edf3',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}>
              <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {synthesizedOutput}
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0d1117'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                ✓ Automatically mirrored to Obsidian AI_Brain_Sync
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(synthesizedOutput);
                    alert('Copied Master Asset to clipboard!');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Full Asset
                </button>
                <button
                  onClick={() => setIsSynthesisModalOpen(false)}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS spinner keyframe */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
