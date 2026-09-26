'use client';

import React, { useState, useRef, useEffect } from 'react';

interface WarRoomMessage {
  id: string;
  role: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  content: string;
  timestamp: string;
}

interface WarRoomChatViewProps {
  backendUrl: string;
}

const AGENT_MENTIONS = [
  { id: 'research', name: 'Research Specialist', tag: '@research', icon: '🔬', color: '#10b981', model: 'Gemini 2.0 Flash' },
  { id: 'business', name: 'Business Strategist', tag: '@business', icon: '💼', color: '#f59e0b', model: 'Claude 3.5 Sonnet' },
  { id: 'marketing', name: 'Marketing Director', tag: '@marketing', icon: '📣', color: '#ec4899', model: 'Claude 3.5 Sonnet' },
  { id: 'sales', name: 'Sales Director', tag: '@sales', icon: '🎯', color: '#3b82f6', model: 'Claude 3.5 Sonnet' },
  { id: 'hermes', name: 'Hermes Engineer', tag: '@hermes', icon: '⚡', color: '#6366f1', model: 'DeepSeek R1' },
  { id: 'trading', name: 'Quant Trader', tag: '@trading', icon: '📈', color: '#14b8a6', model: 'DeepSeek V3' },
  { id: 'ops', name: 'DevOps & SRE', tag: '@ops', icon: '⚙️', color: '#a855f7', model: 'DeepSeek V3' }
];

export default function WarRoomChatView({ backendUrl }: WarRoomChatViewProps) {
  const [messages, setMessages] = useState<WarRoomMessage[]>([
    {
      id: 'init-1',
      role: 'agent',
      agentId: 'business',
      agentName: 'Business Strategist',
      content: `# 🏛️ Executive War Room Active\n\nWelcome Founder Rendo. All 7 department heads are in the room with shared real-time blackboard context.\n\nUse \`@agent\` mentions to assign objectives:\n- \`@research\`: Deep market research & customer pain points\n- \`@business\`: Offer packaging, unit economics, risk-reversal guarantees\n- \`@marketing\`: High-converting headlines, hooks, landing page copy\n- \`@sales\`: Cold outreach scripts & objection handling\n- \`@hermes\`: Full-stack code architecture & webhook implementations\n- \`@trading\`: Algorithmic execution, risk sizing, and MT5 rules\n- \`@ops\`: Docker orchestration & database automations\n\n*How shall we advance your business today?*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Extract target agent from text or default to 'business'
  const parseTargetAgent = (text: string): string => {
    for (const a of AGENT_MENTIONS) {
      if (text.toLowerCase().includes(a.tag)) {
        return a.id;
      }
    }
    return 'business';
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const targetAgentId = parseTargetAgent(userText);
    const userMsg: WarRoomMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/automation/agent/war-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            agentId: m.agentId,
            content: m.content
          })),
          targetAgentId
        })
      });

      const data = await res.json();
      if (data.ok) {
        const agentMsg: WarRoomMessage = {
          id: `reply-${Date.now()}`,
          role: 'agent',
          agentId: data.agentId,
          agentName: data.agentName,
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentMsg]);
      } else {
        const errorMsg: WarRoomMessage = {
          id: `err-${Date.now()}`,
          role: 'agent',
          agentId: targetAgentId,
          agentName: 'System Notice',
          content: `> [!WARNING]\n> War Room agent execution error: ${data.error}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: WarRoomMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        agentId: targetAgentId,
        agentName: 'System Notice',
        content: `> [!WARNING]\n> Network connection error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Save War Room Transcript to Obsidian
  const handleSaveToObsidian = async () => {
    try {
      const transcript = messages.map(m => {
        const sender = m.role === 'user' ? '### 👤 Founder (Rendo)' : `### ${m.agentName || 'Agent'} (@${m.agentId})`;
        return `${sender} - *${m.timestamp}*\n\n${m.content}`;
      }).join('\n\n---\n\n');

      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch(`${backendUrl}/automation/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thought: `# 🏛️ Executive War Room Session (${today})\n\n${transcript}`,
          source: 'WarRoom_Transcript'
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSavedStatus('Saved to Obsidian AI_Brain_Sync');
        setTimeout(() => setSavedStatus(null), 3500);
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 'calc(100vh - 140px)',
      background: '#161b22',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      {/* ─── Header & Mention Bar ─────────────────────────────────────────── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏛️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                Multi-Agent Executive War Room
              </h2>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Collaborate with 7 specialized department heads in a single shared blackboard thread.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {savedStatus && (
              <span style={{ background: '#10b981', color: '#000', fontWeight: 700, fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px' }}>
                ✓ {savedStatus}
              </span>
            )}
            <button
              onClick={handleSaveToObsidian}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontSize: '0.78rem',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📓</span> Save Session to Obsidian
            </button>
          </div>
        </div>

        {/* Quick Mention Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '4px' }}>
            Quick Mention:
          </span>
          {AGENT_MENTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => setInput(prev => `${a.tag} ${prev}`.trim())}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${a.color}40`,
                borderRadius: '6px',
                color: a.color,
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s'
              }}
              title={`Role: ${a.name} | Engine: ${a.model}`}
            >
              <span>{a.icon}</span>
              <span>{a.tag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Chat Messages Thread ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const agentInfo = AGENT_MENTIONS.find(a => a.id === m.agentId) || AGENT_MENTIONS[1];

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              {/* Sender Name & Tag */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                {!isUser && (
                  <>
                    <span>{agentInfo.icon}</span>
                    <strong style={{ color: agentInfo.color }}>{m.agentName || 'Agent'}</strong>
                    <span style={{
                      background: 'rgba(255,255,255,0.06)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      color: '#c9d1d9'
                    }}>
                      @{m.agentId}
                    </span>
                  </>
                )}
                {isUser && <strong style={{ color: '#818cf8' }}>👤 Founder (You)</strong>}
                <span style={{ fontSize: '0.7rem' }}>• {m.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: isUser ? '75%' : '88%',
                background: isUser ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#0d1117',
                border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '14px 18px',
                color: '#fff',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                boxShadow: isUser ? '0 4px 14px rgba(79, 70, 229, 0.3)' : '0 4px 14px rgba(0,0,0,0.2)'
              }}>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '10px 0' }}>
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span>Executive Agent is analyzing thread context & writing strategy...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Bottom Unified Input ─────────────────────────────────────────── */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: '#0d1117'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your strategic objective... (e.g. '@marketing Draft 3 cold DM hooks based on what @business just priced')"
            rows={2}
            style={{
              flex: 1,
              background: '#161b22',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: '0.88rem',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              height: '48px',
              padding: '0 20px',
              background: !input.trim() || loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: !input.trim() || loading ? 'var(--text-muted)' : '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: !input.trim() || loading ? 'none' : '0 0 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <span>🚀</span>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
