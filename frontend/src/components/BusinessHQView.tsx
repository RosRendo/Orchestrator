'use client';

import React, { useState, useEffect } from 'react';

interface BusinessHQViewProps {
  backendUrl: string;
}

interface IdeaItem {
  id: string;
  title: string;
  description: string;
  stage: string;
  target?: string;
}

export default function BusinessHQView({ backendUrl }: BusinessHQViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'skills' | 'ledger' | 'crm'>('pipeline');
  const [pipelineRaw, setPipelineRaw] = useState<string>('');
  const [ledgerRaw, setLedgerRaw] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // New Idea Modal
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaTarget, setNewIdeaTarget] = useState('');
  const [submittingIdea, setSubmittingIdea] = useState(false);

  // New Experience Modal
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expDomain, setExpDomain] = useState('Sales');
  const [expAction, setExpAction] = useState('');
  const [expResult, setExpResult] = useState('');
  const [expLesson, setExpLesson] = useState('');
  const [expSkill, setExpSkill] = useState('+SalesExecution');
  const [submittingExp, setSubmittingExp] = useState(false);

  // 1-Click AI Action Execution State
  const [actionLoading, setActionLoading] = useState(false);
  const [activeActionTitle, setActiveActionTitle] = useState('');
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [actionSavedPath, setActionSavedPath] = useState<string | null>(null);
  const [isActionDrawerOpen, setIsActionDrawerOpen] = useState(false);

  const handleRunAction = async (ideaTitle: string, stage: string, actionType: string, description?: string) => {
    setActionLoading(true);
    setActiveActionTitle(`${ideaTitle}: ${actionType.replace(/_/g, ' ').toUpperCase()}`);
    setIsActionDrawerOpen(true);
    setActionResult('');
    setActionSavedPath(null);
    try {
      const res = await fetch(`${backendUrl}/automation/business/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaTitle, stage, actionType, description })
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult(data.result);
        setActionSavedPath(data.savedPath);
      } else {
        setActionResult(`Action execution failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionResult(`Network connection error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const [showRawPipeline, setShowRawPipeline] = useState(false);

  // Parse markdown items into interactive cards
  const parsedVentures = React.useMemo(() => {
    const ventures: Array<{ title: string; desc: string; stage: string; actionType: string; actionLabel: string }> = [];
    if (!pipelineRaw) return ventures;

    const stageMap: Record<string, { actionType: string; actionLabel: string }> = {
      'Stage 1: 💡 Ideas': { actionType: 'validate_problem', actionLabel: '🔍 Validate Problem' },
      'Stage 2: 🔬 Research': { actionType: 'design_solution', actionLabel: '📐 Design Solution Architecture' },
      'Stage 3: 🗣️ Interviews': { actionType: 'design_solution', actionLabel: '📐 Design Solution Architecture' },
      'Stage 4: 🎯 Validated': { actionType: 'scaffold_mvp', actionLabel: '⚡ Scaffold MVP Blueprint' },
      'Stage 5: 🛠️ MVP': { actionType: 'generate_pricing', actionLabel: '🏷️ Generate 3-Tier Pricing' },
      'Stage 6: 💳 First Payment': { actionType: 'draft_copy', actionLabel: '📝 Draft Landing Page Copy' },
      'Stage 7: 👥 10 Customers': { actionType: 'launch_post', actionLabel: '🚀 Write Viral Launch Posts' },
      'Stage 8: 📈 Growth': { actionType: 'cold_outreach', actionLabel: '💼 Generate Cold Outreach DMs' },
      'Stage 9: ⚙️ Automate': { actionType: 'automate_ops', actionLabel: '⚙️ Design Scaling Stack' }
    };

    let currentStage = 'Stage 1: 💡 Ideas';
    const lines = pipelineRaw.split('\n');
    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentStage = line.replace('## ', '').trim();
      } else if (line.trim().startsWith('- **')) {
        const match = line.match(/- \*\*([^*]+)\*\*:\s*(.*)/);
        if (match) {
          const title = match[1].trim();
          const desc = match[2].trim();
          const action = stageMap[currentStage] || { actionType: 'validate_problem', actionLabel: '🔍 Run AI Analysis' };
          ventures.push({
            title,
            desc,
            stage: currentStage,
            actionType: action.actionType,
            actionLabel: action.actionLabel
          });
        }
      }
    }
    return ventures;
  }, [pipelineRaw]);

  // Load Business Pipeline & Ledger
  const loadData = async () => {
    setLoading(true);
    try {
      const [pipeRes, ledgRes] = await Promise.all([
        fetch(`${backendUrl}/automation/business/pipeline`),
        fetch(`${backendUrl}/automation/experience/ledger`)
      ]);
      const pipeData = await pipeRes.json();
      const ledgData = await ledgRes.json();
      if (pipeData.ok) setPipelineRaw(pipeData.content || '');
      if (ledgData.ok) setLedgerRaw(ledgData.content || '');
    } catch (e) {
      console.error('Error fetching Business HQ data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [backendUrl]);

  // Submit Idea
  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    setSubmittingIdea(true);
    try {
      const res = await fetch(`${backendUrl}/automation/business/idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newIdeaTitle,
          description: newIdeaDesc,
          targetAudience: newIdeaTarget,
          stage: 'Stage 1: 💡 Ideas'
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIsIdeaModalOpen(false);
        setNewIdeaTitle('');
        setNewIdeaDesc('');
        setNewIdeaTarget('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingIdea(false);
    }
  };

  // Submit Experience
  const handleLogExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAction.trim() || !expLesson.trim()) return;
    setSubmittingExp(true);
    try {
      const res = await fetch(`${backendUrl}/automation/experience/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: expDomain,
          action: expAction,
          result: expResult,
          lesson: expLesson,
          skillImpact: expSkill
        })
      });
      const data = await res.json();
      if (data.ok) {
        setIsExpModalOpen(false);
        setExpAction('');
        setExpResult('');
        setExpLesson('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingExp(false);
    }
  };

  const STAGES = [
    { id: '1', title: '💡 Ideas', desc: 'Hypotheses' },
    { id: '2', title: '🔬 Research', desc: 'Market pain' },
    { id: '3', title: '🗣️ Interview', desc: 'Problem validation' },
    { id: '4', title: '🎯 Validated', desc: 'Willingness to pay' },
    { id: '5', title: '🛠️ MVP', desc: 'Core feature only' },
    { id: '6', title: '💳 1st Payment', desc: 'Stripe conversion' },
    { id: '7', title: '👥 10 Customers', desc: 'Manual delight' },
    { id: '8', title: '📈 Growth', desc: 'Repeatable funnel' },
    { id: '9', title: '⚙️ Automate', desc: 'Delegated / SaaS' },
  ];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ─── Top Header & Summary ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '14px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>💼</span>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
              Business HQ
            </h1>
            <span style={{ background: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px' }}>
              FOUNDER OS
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '650px' }}>
            Transforming technical intelligence into real-world cash flow. Moving ventures through the 10-stage pipeline while training founder skills and logging immutable experience.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsIdeaModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
            }}
          >
            <span>💡</span> Add Venture Idea
          </button>

          <button
            onClick={() => setIsExpModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem'
            }}
          >
            <span>📓</span> Log Experience
          </button>
        </div>
      </div>

      {/* ─── Metric Cockpit ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid var(--panel-border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Ideas</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>12</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Hypotheses logged</div>
        </div>

        <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid var(--panel-border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>In Validation</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>2</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Active interviews</div>
        </div>

        <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid var(--panel-border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active MVPs</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>1</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>RendoOS Gateway</div>
        </div>

        <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid var(--panel-border, rgba(255,255,255,0.08))', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Current MRR</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>$0</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>Target: $10,000 / mo</div>
        </div>

        <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Primary Bottleneck</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fca5a5', marginTop: '6px' }}>Customer Discovery</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>5 Discovery calls needed</div>
        </div>

      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('pipeline')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeSubTab === 'pipeline' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeSubTab === 'pipeline' ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'pipeline' ? 700 : 500,
            border: activeSubTab === 'pipeline' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🚀</span> 10-Stage Pipeline
        </button>

        <button
          onClick={() => setActiveSubTab('skills')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeSubTab === 'skills' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeSubTab === 'skills' ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'skills' ? 700 : 500,
            border: activeSubTab === 'skills' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🎯</span> Founder Skill Graph
        </button>

        <button
          onClick={() => setActiveSubTab('ledger')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeSubTab === 'ledger' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeSubTab === 'ledger' ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'ledger' ? 700 : 500,
            border: activeSubTab === 'ledger' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📓</span> Experience Ledger
        </button>

        <button
          onClick={() => setActiveSubTab('crm')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeSubTab === 'crm' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeSubTab === 'crm' ? '#f59e0b' : 'var(--text-secondary)',
            fontWeight: activeSubTab === 'crm' ? 700 : 500,
            border: activeSubTab === 'crm' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>👥</span> Leads & Customers
        </button>
      </div>

      {/* ─── TAB 1: 10-STAGE PIPELINE ────────────────────────────────────── */}
      {activeSubTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Horizontal Flow Indicator */}
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            gap: '8px'
          }}>
            {STAGES.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: idx <= 4 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx <= 4 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                  flexShrink: 0,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: idx <= 4 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {s.desc}
                  </div>
                </div>
                {idx < STAGES.length - 1 && (
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', flexShrink: 0 }}>➔</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Pipeline Kanban View */}
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Active Ventures in Motion
                </h3>
                <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                  {parsedVentures.length} Ventures Active
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowRawPipeline(p => !p)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#c9d1d9',
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {showRawPipeline ? '🎴 Visual Kanban Cards' : '📄 Raw Obsidian Markdown'}
                </button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Mirrored: <code style={{ color: '#10b981' }}>09_Business/Pipeline.md</code>
                </span>
              </div>
            </div>

            {!showRawPipeline ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
                {parsedVentures.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No ventures active yet. Click "+ New Idea" above or message Telegram with <code>/idea Title: Desc</code> to get started!
                  </div>
                ) : (
                  parsedVentures.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        background: '#0d1117',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        transition: 'border-color 0.15s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#fff' }}>
                            {v.title}
                          </h4>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                          }}>
                            {v.stage}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {v.desc}
                        </p>
                      </div>

                      {/* 1-Click AI Action Button */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <button
                          onClick={() => handleRunAction(v.title, v.stage, v.actionType, v.desc)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#000',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            padding: '8px 12px',
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <span>⚡</span>
                          <span>{v.actionLabel}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{
                background: '#0d1117',
                borderRadius: '8px',
                padding: '16px',
                fontFamily: 'monospace',
                fontSize: '0.86rem',
                color: '#c9d1d9',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                maxHeight: '450px',
                overflowY: 'auto'
              }}>
                {pipelineRaw || 'Loading pipeline from Obsidian...'}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── TAB 2: FOUNDER SKILL GRAPH ─────────────────────────────────── */}
      {activeSubTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Bottleneck Warning Banner */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 800, color: '#f87171', fontSize: '0.95rem' }}>
                CURRENT BOTTLENECK: Customer Discovery & Sales (Level 2 / 10)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Your engineering and AI systems capabilities (Level 8) vastly outpace market validation. Coding more features without customer conversations will create developer debt. Conduct 5 customer discovery calls.
              </div>
            </div>
          </div>

          {/* Founder Pillars Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* BUILD Pillar */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#3b82f6' }}>🔨 BUILD</div>
                <span style={{ background: '#3b82f6', color: '#000', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px' }}>Level 8 / 10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '12px 0 16px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '80%', background: '#3b82f6', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>✓ Full-Stack Software Engineering (NestJS, React)</div>
                <div>✓ Multi-Agent System Design (Hermes, OpenCode)</div>
                <div>✓ Docker & Deployment Orchestration</div>
                <div style={{ color: '#10b981', marginTop: '6px', fontWeight: 600 }}>Status: Superpower</div>
              </div>
            </div>

            {/* SELL Pillar */}
            <div style={{ background: '#161b22', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f87171' }}>💰 SELL</div>
                <span style={{ background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px' }}>Level 2 / 10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '12px 0 16px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '20%', background: '#ef4444', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>✓ Ideal Customer Profile (ICP) definition</div>
                <div>⚠ Cold Outreach & Script Crafting</div>
                <div>⚠ Live Discovery Call Objection Handling</div>
                <div style={{ color: '#f87171', marginTop: '6px', fontWeight: 600 }}>Status: Immediate Focus</div>
              </div>
            </div>

            {/* THINK Pillar */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#a855f7' }}>🧠 THINK</div>
                <span style={{ background: '#a855f7', color: '#fff', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px' }}>Level 7 / 10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '12px 0 16px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '70%', background: '#a855f7', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>✓ First Principles Reasoning</div>
                <div>✓ System Architecture & Modularity</div>
                <div>✓ Algorithmic Trading Logic (MT5)</div>
                <div style={{ color: '#a855f7', marginTop: '6px', fontWeight: 600 }}>Status: Strong Foundation</div>
              </div>
            </div>

            {/* COMMUNICATION Pillar */}
            <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f59e0b' }}>🗣️ COMMUNICATION</div>
                <span style={{ background: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px' }}>Level 6 / 10</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', margin: '12px 0 16px 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '60%', background: '#f59e0b', borderRadius: '3px' }} />
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>✓ Technical Documentation & Obsidian Notes</div>
                <div>⚠ High-Converting Copywriting</div>
                <div>⚠ Investor & Partner Pitching</div>
                <div style={{ color: '#f59e0b', marginTop: '6px', fontWeight: 600 }}>Status: Developing</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 3: EXPERIENCE LEDGER ────────────────────────────────────── */}
      {activeSubTab === 'ledger' && (
        <div style={{
          background: '#161b22',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Real-World Founder Action Log
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Immutable record of market actions, customer responses, and lessons. Mirrored to <code style={{ color: '#10b981' }}>D:\AI\Obsidian\08_Experience\Ledger.md</code>.
              </p>
            </div>
            <button
              onClick={() => setIsExpModalOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              + Log New Action
            </button>
          </div>

          <div style={{
            background: '#0d1117',
            borderRadius: '8px',
            padding: '16px',
            fontFamily: 'monospace',
            fontSize: '0.86rem',
            color: '#c9d1d9',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            maxHeight: '450px',
            overflowY: 'auto'
          }}>
            {ledgerRaw || 'No ledger entries found.'}
          </div>
        </div>
      )}

      {/* ─── TAB 4: LEADS & CRM ──────────────────────────────────────────── */}
      {activeSubTab === 'crm' && (
        <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Founder CRM & Early Conversations
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Rule: Talk to 5 customers before building features</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Apex Cleaning Services (Regional Operator)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Contact: Marcus R. (Operations Manager) • Lead source: Cold Telegram outreach</div>
                <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '4px' }}>Discovery Note: Pain point is missed evening quote requests. Average ticket $180.</div>
              </div>
              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
                🗣️ Interview Done
              </span>
            </div>

            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Alpha Trading Community (500+ members)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Contact: Alex T. (Group Admin) • Lead source: Twitter/X DM</div>
                <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '4px' }}>Discovery Note: Wants automatic MT5 signal broadcasting directly into VIP channel.</div>
              </div>
              <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}>
                🎯 Validated Interest
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL: ADD VENTURE IDEA ─────────────────────────────────────── */}
      {isIdeaModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '520px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>
              💡 Register New Venture Hypothesis
            </h2>
            <form onSubmit={handleCreateIdea} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Venture Name / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telegram SaaS Manager"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Problem Hypothesis & Description
                </label>
                <textarea
                  placeholder="What painful problem does this solve? Why will customers pay?"
                  value={newIdeaDesc}
                  onChange={(e) => setNewIdeaDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Target Customer / ICP
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agency Owners, Cleaning Contractors"
                  value={newIdeaTarget}
                  onChange={(e) => setNewIdeaTarget(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsIdeaModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-secondary)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIdea}
                  style={{
                    background: '#f59e0b',
                    border: 'none',
                    color: '#000',
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {submittingIdea ? 'Saving...' : 'Add to Stage 1 (Ideas)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LOG REAL EXPERIENCE ──────────────────────────────────── */}
      {isExpModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '520px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              📓 Record Real-World Action to Experience Ledger
            </h2>
            <form onSubmit={handleLogExperience} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Domain
                </label>
                <select
                  value={expDomain}
                  onChange={(e) => setExpDomain(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="Sales">Sales & Customer Discovery</option>
                  <option value="Product">Product Launch & Feature Release</option>
                  <option value="Engineering">Engineering / Incident Fix</option>
                  <option value="Trading">Trading Execution (MT5)</option>
                  <option value="Operations">Founder Operations</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Action Taken (What did you do?)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pitched 5 cleaning companies on Telegram"
                  value={expAction}
                  onChange={(e) => setExpAction(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Result (What happened?)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 replied, 1 booked a 15-minute call"
                  value={expResult}
                  onChange={(e) => setExpResult(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Lesson Learned (The takeaway for your brain)
                </label>
                <textarea
                  placeholder="e.g. Operators care about missed revenue, not AI keywords."
                  value={expLesson}
                  onChange={(e) => setExpLesson(e.target.value)}
                  rows={2}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0d1117',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--text-secondary)',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExp}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: '#000',
                    fontWeight: 700,
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {submittingExp ? 'Logging...' : 'Save to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── MODAL: 1-CLICK AI ACTION EXECUTION DRAWER ────────────────── */}
      {isActionDrawerOpen && (
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
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.05) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>
                    {activeActionTitle}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
                    Specialist Agent Output & Action Playbook
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsActionDrawerOpen(false)}
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
              {actionLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(245, 158, 11, 0.2)',
                    borderTopColor: '#f59e0b',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Specialist Agent is executing strategy & writing playbook...
                  </div>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {actionResult}
                </div>
              )}
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
                {actionSavedPath ? `✓ Saved to Obsidian: ${actionSavedPath}` : 'Autonomous Agent Executor'}
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                {actionResult && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(actionResult);
                      alert('Copied asset to clipboard!');
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
                    📋 Copy Asset
                  </button>
                )}
                <button
                  onClick={() => setIsActionDrawerOpen(false)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    color: '#000',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
