'use client';

import React, { useState, useEffect } from 'react';

interface AgentItem {
  id: string;
  name: string;
  description: string;
  detected: boolean;
  filePath?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalCatalogCount: number;
  detectedCount: number;
  agents: AgentItem[];
}

interface SkillHubViewProps {
  backendUrl: string;
}

export default function SkillHubView({ backendUrl }: SkillHubViewProps) {
  const [catalog, setCatalog] = useState<CategoryItem[]>([]);
  const [totalDetected, setTotalDetected] = useState(0);
  const [totalCatalog, setTotalCatalog] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    engineering: true, // open engineering by default
  });

  // Modal states
  const [runModalAgent, setRunModalAgent] = useState<{ agent: AgentItem; category: CategoryItem } | null>(null);
  const [runPrompt, setRunPrompt] = useState('');
  const [runProvider, setRunProvider] = useState('auto');
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState<{ answer: string; provider: string; savedPath?: string } | null>(null);
  const [runError, setRunError] = useState('');

  // Playbook Viewer Modal
  const [playbookModal, setPlaybookModal] = useState<{ name: string; content: string; path: string } | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(false);

  // Create Skill Modal
  const [createModalCategory, setCreateModalCategory] = useState<CategoryItem | null>(null);
  const [createName, setCreateName] = useState('');
  const [createId, setCreateId] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createInstructions, setCreateInstructions] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${backendUrl}/automation/skills/catalog`);
      const data = await res.json();
      if (data.ok) {
        setCatalog(data.catalog || []);
        setTotalDetected(data.totalDetected || 0);
        setTotalCatalog(data.totalCatalog || 0);
      }
    } catch (err: any) {
      console.error('Failed to load skills catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [backendUrl]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const openPlaybook = async (agent: AgentItem) => {
    if (!agent.filePath) return;
    setPlaybookLoading(true);
    try {
      const res = await fetch(`${backendUrl}/automation/obsidian/read?path=${encodeURIComponent(agent.filePath)}`);
      const data = await res.json();
      if (data.content) {
        setPlaybookModal({
          name: agent.name,
          content: data.content,
          path: agent.filePath
        });
      } else {
        showToast('Playbook file is empty or not readable.');
      }
    } catch (err: any) {
      showToast(`Error reading playbook: ${err.message}`);
    } finally {
      setPlaybookLoading(false);
    }
  };

  const installTemplateSkill = async (cat: CategoryItem, agent: AgentItem) => {
    try {
      const res = await fetch(`${backendUrl}/automation/skills/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat.id,
          skillId: agent.id,
          name: agent.name,
          description: agent.description,
          instructions: `You are the ${agent.name} specialist in ${cat.name}. Follow operational protocols to deliver world-class, production-ready outputs.`
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✓ Skill "${agent.name}" installed into Obsidian!`);
        fetchCatalog();
      } else {
        showToast(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModalCategory || !createName || !createId) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`${backendUrl}/automation/skills/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: createModalCategory.id,
          skillId: createId,
          name: createName,
          description: createDesc,
          instructions: createInstructions
        })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✓ Created skill "${createName}" in Obsidian!`);
        setCreateModalCategory(null);
        setCreateName('');
        setCreateId('');
        setCreateDesc('');
        setCreateInstructions('');
        fetchCatalog();
      } else {
        showToast(`Error: ${data.error}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRunAgent = async () => {
    if (!runModalAgent || !runPrompt.trim()) return;
    setRunLoading(true);
    setRunError('');
    setRunResult(null);

    try {
      const res = await fetch(`${backendUrl}/automation/skills/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: runModalAgent.category.id,
          skillId: runModalAgent.agent.id,
          prompt: runPrompt.trim(),
          provider: runProvider === 'auto' ? undefined : runProvider
        })
      });

      const data = await res.json();
      if (data.ok) {
        setRunResult({
          answer: data.answer,
          provider: data.provider,
          savedPath: data.savedPath
        });
        showToast(`✓ Execution complete & saved to Obsidian!`);
      } else {
        setRunError(data.error || 'Execution failed');
      }
    } catch (err: any) {
      setRunError(err.message || 'Connection error');
    } finally {
      setRunLoading(false);
    }
  };

  // Filter categories by search
  const filteredCatalog = catalog.map(cat => {
    if (!searchQuery.trim()) return cat;
    const q = searchQuery.toLowerCase();
    const catMatches = cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
    const matchingAgents = cat.agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
    if (catMatches || matchingAgents.length > 0) {
      return { ...cat, agents: catMatches ? cat.agents : matchingAgents };
    }
    return null;
  }).filter(Boolean) as CategoryItem[];

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1400px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#18181b',
          border: '1px solid #22c55e',
          color: '#4ade80',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <span style={{ fontSize: '2rem' }}>🧩</span>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Skill Hub & Agent Directory
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Centralized skill operating system. Connected to Obsidian Vault: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85rem' }}>D:\AI\Obsidian\Skills</code>
          </p>
        </div>

        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            {totalDetected} Active Detected
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)'
          }}>
            📚 {totalCatalog} Total Blueprints
          </div>
          <button
            onClick={fetchCatalog}
            title="Refresh from Obsidian"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-primary)',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔄 Sync
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Filter departments, skills, or capabilities (e.g. 'hermes', 'pricing', 'seo', 'design')..."
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        />
      </div>

      {/* Categories Accordion List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⏳</div>
          Scanning Obsidian vault & assembling catalog...
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No skills or departments matched your query.
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {filteredCatalog.map((cat, idx) => {
            const isExpanded = !!expandedCategories[cat.id];
            return (
              <div
                key={cat.id}
                style={{
                  borderBottom: idx < filteredCatalog.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'background 0.15s'
                }}
              >
                {/* Category Header Bar (Matching screenshot) */}
                <div
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Category Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${cat.color}15`,
                      border: `1px solid ${cat.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      flexShrink: 0
                    }}>
                      {cat.icon}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1.02rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {cat.totalCatalogCount} agents
                        {cat.detectedCount > 0 && (
                          <span style={{
                            color: '#4ade80',
                            fontWeight: 600,
                            marginLeft: '6px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            padding: '1px 6px',
                            borderRadius: '6px'
                          }}>
                            · {cat.detectedCount} detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Right Chevron */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        color: 'var(--text-muted)',
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                      }}
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Agents Grid */}
                {isExpanded && (
                  <div style={{
                    padding: '16px 24px 24px 24px',
                    background: 'rgba(0,0,0,0.15)',
                    borderTop: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    {/* Section actions bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Active skills in <strong>{cat.name}</strong>. Run directly or view playbooks in Obsidian.
                      </span>
                      <button
                        onClick={() => {
                          setCreateModalCategory(cat);
                          setCreateName('');
                          setCreateId('');
                          setCreateDesc('');
                          setCreateInstructions('');
                        }}
                        style={{
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#a5b4fc',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        + Create Skill in {cat.name}
                      </button>
                    </div>

                    {/* Agent Cards Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                      gap: '14px'
                    }}>
                      {cat.agents.map((agent) => (
                        <div
                          key={agent.id}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: agent.detected
                              ? '1px solid rgba(34, 197, 94, 0.3)'
                              : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'transform 0.15s, border-color 0.15s'
                          }}
                        >
                          <div>
                            {/* Top row: Name + Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                                {agent.name}
                              </div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '8px',
                                background: agent.detected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                                color: agent.detected ? '#4ade80' : 'var(--text-muted)',
                                border: agent.detected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)'
                              }}>
                                {agent.detected ? '🟢 Installed' : '⚪ Catalog'}
                              </span>
                            </div>

                            {/* Description */}
                            <p style={{
                              margin: 0,
                              fontSize: '0.84rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                              minHeight: '36px'
                            }}>
                              {agent.description}
                            </p>

                            {/* Vault file tag if detected */}
                            {agent.filePath && (
                              <div style={{
                                marginTop: '8px',
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>📁</span>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {agent.filePath}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            paddingTop: '10px',
                            borderTop: '1px solid rgba(255,255,255,0.04)'
                          }}>
                            {/* Run Button */}
                            <button
                              onClick={() => {
                                setRunModalAgent({ agent, category: cat });
                                setRunPrompt('');
                                setRunResult(null);
                                setRunError('');
                              }}
                              style={{
                                flex: 1,
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                color: '#a5b4fc',
                                padding: '7px 12px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>▶</span> Run Agent
                            </button>

                            {/* View Playbook Button (if detected) */}
                            {agent.detected && agent.filePath ? (
                              <button
                                onClick={() => openPlaybook(agent)}
                                title="View Obsidian Playbook"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: 'var(--text-secondary)',
                                  padding: '7px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                📖 Playbook
                              </button>
                            ) : (
                              /* Install to Obsidian Button */
                              <button
                                onClick={() => installTemplateSkill(cat, agent)}
                                title="Install this blueprint to your Obsidian vault"
                                style={{
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  border: '1px solid rgba(34, 197, 94, 0.25)',
                                  color: '#4ade80',
                                  padding: '7px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                📥 Install
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal 1: Interactive Agent Runner ─────────────────────────── */}
      {runModalAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#121316',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>{runModalAgent.category.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                    Execute: {runModalAgent.agent.name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Department: {runModalAgent.category.name} · {runModalAgent.agent.detected ? '🟢 Obsidian Playbook Active' : '⚪ Template'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRunModalAgent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Model Router Selection */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Model Router
                </label>
                <select
                  value={runProvider}
                  onChange={(e) => setRunProvider(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="auto">⚡ Dynamic Auto Router (Recommended)</option>
                  <option value="deepseek">DeepSeek-V3 / Coder</option>
                  <option value="claude">Claude 3.5 Sonnet</option>
                  <option value="gemini">Gemini 2.0 Flash</option>
                  <option value="openai">OpenAI / GPT-4o</option>
                </select>
              </div>

              {/* Prompt Input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Task / Prompt for {runModalAgent.agent.name}
                </label>
                <textarea
                  rows={4}
                  value={runPrompt}
                  onChange={(e) => setRunPrompt(e.target.value)}
                  placeholder={`Enter specific instruction or task for ${runModalAgent.agent.name}...`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Error Box */}
              {runError && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}>
                  ✗ {runError}
                </div>
              )}

              {/* Result Preview */}
              {runResult && (
                <div style={{
                  marginTop: '20px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.04)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#4ade80' }}>
                      ✓ Generated Output [{runResult.provider.toUpperCase()}]:
                    </span>
                    {runResult.savedPath && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Saved to: <code>{runResult.savedPath}</code>
                      </span>
                    )}
                  </div>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {runResult.answer}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setRunModalAgent(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-secondary)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={handleRunAgent}
                disabled={runLoading || !runPrompt.trim()}
                style={{
                  background: '#6366f1',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 22px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: runLoading || !runPrompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: runLoading || !runPrompt.trim() ? 0.6 : 1
                }}
              >
                {runLoading ? 'Running...' : 'Execute Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Obsidian Playbook Viewer ──────────────────────────── */}
      {playbookModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#121316',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  📖 {playbookModal.name} Playbook
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Obsidian Path: <code>{playbookModal.path}</code>
                </span>
              </div>
              <button
                onClick={() => setPlaybookModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <pre style={{
                margin: 0,
                fontSize: '0.86rem',
                lineHeight: 1.55,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(0,0,0,0.25)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {playbookModal.content}
              </pre>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPlaybookModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'var(--text-primary)',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Create Custom Skill ───────────────────────────────── */}
      {createModalCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#121316',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                {createModalCategory.icon} Add Skill to {createModalCategory.name}
              </h3>
              <button
                onClick={() => setCreateModalCategory(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSkillSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    if (!createId) setCreateId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Cold Email Pitch Specialist"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Skill ID (folder name in Obsidian)
                </label>
                <input
                  type="text"
                  required
                  value={createId}
                  onChange={(e) => setCreateId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                  placeholder="e.g. cold-email-pitch"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Short Description
                </label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="e.g. Writes high-converting 3-part B2B cold email sequences."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Operating Instructions / Rules
                </label>
                <textarea
                  rows={4}
                  value={createInstructions}
                  onChange={(e) => setCreateInstructions(e.target.value)}
                  placeholder="Enter the specific rules, methodology, or checklist this agent must follow..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalCategory(null)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-secondary)',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    background: '#22c55e',
                    border: 'none',
                    color: '#000',
                    fontWeight: 600,
                    padding: '8px 22px',
                    borderRadius: '8px',
                    cursor: createLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {createLoading ? 'Saving...' : 'Save to Obsidian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
