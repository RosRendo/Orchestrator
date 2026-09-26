'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Session, Message } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface AgentChatProps {
  projectId: string;
}

export default function AgentChat({ projectId }: AgentChatProps) {
  const [agent, setAgent] = useState<'hermes' | 'opencode'>('hermes');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  // Running Agent State
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSockets
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
    const socket = io(backendUrl);
    socketRef.current = socket;

    socket.on('chat:status', (data: { status: string }) => {
      setStatusText(data.status);
    });

    socket.on('chat:output', (data: { text: string }) => {
      setStreamingText(prev => prev + data.text);
    });

    socket.on('chat:log', (data: { log: string }) => {
      setAgentLogs(prev => [...prev, data.log]);
    });

    socket.on('chat:done', (data: { message: Message }) => {
      setIsRunning(false);
      setStatusText('');
      setStreamingText('');
      setMessages(prev => [...prev, data.message]);
    });

    socket.on('chat:error', (data: { error: string }) => {
      setIsRunning(false);
      setStatusText('');
      alert(`Agent Error: ${data.error}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load Sessions
  useEffect(() => {
    loadSessions();
  }, [projectId]);

  // Load messages when session changes
  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession);
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLogs]);

  const loadSessions = async () => {
    try {
      const data = await api.getSessions(projectId);
      setSessions(data);
      if (data.length > 0) {
        // Find most recent session matching agent
        const lastSes = data.find(s => s.agentType === agent);
        setActiveSession(lastSes ? lastSes.id : data[0].id);
      } else {
        // Auto create first session
        handleCreateSession();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await api.getMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async () => {
    const name = prompt('Enter chat session name:', `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    if (!name) return;

    try {
      const newSes = await api.createSession(projectId, agent, name);
      setSessions(prev => [newSes, ...prev]);
      setActiveSession(newSes.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this session? This will remove all chat records.')) return;

    try {
      await api.deleteSession(id);
      const filtered = sessions.filter(s => s.id !== id);
      setSessions(filtered);
      if (activeSession === id) {
        setActiveSession(filtered.length > 0 ? filtered[0].id : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete session');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeSession || isRunning) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sessionId: activeSession,
      role: 'user',
      content: inputMsg,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsRunning(true);
    setStreamingText('');
    setAgentLogs([]);
    setInputMsg('');

    socketRef.current?.emit('chat:send', {
      projectId,
      sessionId: activeSession,
      agent,
      message: userMsg.content,
    });
  };

  return (
    <div style={styles.container}>
      {/* Top Header Selector */}
      <div style={styles.header}>
        <div style={styles.agentSelector}>
          <button
            style={{
              ...styles.agentBtn,
              borderBottom: agent === 'hermes' ? '2px solid var(--primary)' : '2px solid transparent',
              color: agent === 'hermes' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => { setAgent('hermes'); }}
            disabled={isRunning}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: agent === 'hermes' ? '#8b5cf6' : 'var(--text-secondary)', flexShrink: 0 }}>
              <polyline points="9 16 5 12 9 8" />
              <polyline points="15 8 19 12 15 16" />
              <line x1="11" y1="17" x2="13" y2="7" />
              <path d="M5 12c-3-1-4.5-3-4.5-5 0 3 2.5 5 4.5 5" />
              <path d="M19 12c3-1 4.5-3 4.5-5 0 3-2.5 5-4.5 5" />
            </svg>
            Hermes
          </button>
          <button
            style={{
              ...styles.agentBtn,
              borderBottom: agent === 'opencode' ? '2px solid var(--primary)' : '2px solid transparent',
              color: agent === 'opencode' ? '#fff' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => { setAgent('opencode'); }}
            disabled={isRunning}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: agent === 'opencode' ? '#3b82f6' : 'var(--text-secondary)', flexShrink: 0 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
              <polyline points="7 10 11 13 7 16" />
              <line x1="13" y1="16" x2="17" y2="16" />
            </svg>
            OpenCode
          </button>
        </div>

        <button style={{ ...styles.addSesBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleCreateSession} title="New Session" disabled={isRunning}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Session Select Bar */}
      <div style={styles.sessionBar}>
        <select
          value={activeSession || ''}
          onChange={e => setActiveSession(e.target.value)}
          style={styles.select}
          disabled={isRunning}
        >
          {sessions.filter(s => s.agentType === agent).map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          {sessions.filter(s => s.agentType === agent).length === 0 && (
            <option value="">No Active Sessions</option>
          )}
        </select>
        {activeSession && (
          <button
            style={styles.delSesBtn}
            onClick={(e) => handleDeleteSession(activeSession, e)}
            title="Delete Session"
            disabled={isRunning}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Message List */}
      <div style={styles.messagesList}>
        {messages.length === 0 && !streamingText && (
          <div style={styles.welcome}>
            <div style={styles.agentAvatar}>🤖</div>
            <h3>I'm ready!</h3>
            <p>Type a message to start directing the AI agent on your workspace files and terminal.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} style={isUser ? styles.messageRowUser : styles.messageRowAgent}>
              <div style={isUser ? styles.bubbleUser : styles.bubbleAgent}>
                <div style={styles.bubbleRole}>{isUser ? 'You' : agent.toUpperCase()}</div>
                <div style={styles.bubbleContent}>{msg.content}</div>
              </div>
            </div>
          );
        })}

        {/* Streaming text */}
        {streamingText && (
          <div style={styles.messageRowAgent}>
            <div style={styles.bubbleAgent}>
              <div style={styles.bubbleRole}>{agent.toUpperCase()}</div>
              <div style={styles.bubbleContent}>{streamingText}</div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isRunning && (
          <div style={styles.statusRow}>
            <span style={styles.spinner}>🌀</span>
            <span style={styles.statusLabel}>{statusText || 'Agent is working...'}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Logs Drawer */}
      {agentLogs.length > 0 && (
        <div style={styles.logsDrawer}>
          <div style={styles.logsHeader} onClick={() => setShowLogs(!showLogs)}>
            <span>🛠️ Agent Execution Logs ({agentLogs.length})</span>
            <span>{showLogs ? '▼' : '▲'}</span>
          </div>
          {showLogs && (
            <div style={styles.logsBody}>
              {agentLogs.map((log, idx) => (
                <div key={idx} style={styles.logLine}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSend} style={styles.inputArea}>
        <input
          type="text"
          placeholder={activeSession ? "Ask agent to do something..." : "Create a session first..."}
          value={inputMsg}
          onChange={e => setInputMsg(e.target.value)}
          style={styles.chatInput}
          disabled={isRunning || !activeSession}
          required
        />
        <button
          type="submit"
          className="btn-primary"
          style={styles.sendBtn}
          disabled={isRunning || !activeSession || !inputMsg.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(17, 20, 26, 0.45)',
    borderLeft: '1px solid var(--panel-border)',
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--panel-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  agentSelector: {
    display: 'flex',
    gap: '12px',
  },
  agentBtn: {
    fontSize: '0.85rem',
    fontWeight: '600',
    padding: '4px 0',
  },
  addSesBtn: {
    fontSize: '0.9rem',
  },
  sessionBar: {
    padding: '8px 16px',
    background: 'rgba(0,0,0,0.1)',
    borderBottom: '1px solid var(--panel-border)',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  select: {
    flex: 1,
    padding: '4px 8px',
    fontSize: '0.8rem',
    background: 'rgba(0,0,0,0.3)',
  },
  delSesBtn: {
    fontSize: '0.8rem',
    padding: '4px 8px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  messagesList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  welcome: {
    margin: 'auto 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    padding: '0 24px',
  },
  agentAvatar: {
    fontSize: '2.5rem',
    background: 'var(--agent-glow)',
    padding: '16px',
    borderRadius: '50%',
    color: 'var(--agent-color)',
    marginBottom: '8px',
  },
  messageRowUser: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  messageRowAgent: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  bubbleUser: {
    maxWidth: '85%',
    background: 'var(--primary-glow)',
    border: '1px solid var(--primary)',
    padding: '10px 14px',
    borderRadius: '12px 12px 0 12px',
  },
  bubbleAgent: {
    maxWidth: '85%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid var(--panel-border)',
    padding: '10px 14px',
    borderRadius: '12px 12px 12px 0',
  },
  bubbleRole: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    fontWeight: '700',
    marginBottom: '4px',
  },
  bubbleContent: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    borderRadius: '6px',
    background: 'var(--agent-glow)',
    border: '1px solid var(--agent-color)',
    alignSelf: 'flex-start',
  },
  spinner: {
    animation: 'spin 1.5s linear infinite',
  },
  statusLabel: {
    fontSize: '0.8rem',
    color: '#c084fc',
    fontWeight: '500',
  },
  logsDrawer: {
    borderTop: '1px solid var(--panel-border)',
    background: '#0a0b0d',
  },
  logsHeader: {
    padding: '8px 16px',
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.02)',
    userSelect: 'none',
  },
  logsBody: {
    maxHeight: '150px',
    overflowY: 'auto',
    padding: '8px 16px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  logLine: {
    padding: '2px 0',
    whiteSpace: 'pre-wrap',
    borderBottom: '1px solid rgba(255,255,255,0.01)',
  },
  inputArea: {
    padding: '16px',
    borderTop: '1px solid var(--panel-border)',
    background: 'rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '8px',
  },
  chatInput: {
    flex: 1,
  },
  sendBtn: {
    padding: '8px 16px',
  },
};
