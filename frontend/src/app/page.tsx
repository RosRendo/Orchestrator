'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api, Project } from '@/lib/api';
import FolderPicker from '@/components/FolderPicker';
import SkillHubView from '@/components/SkillHubView';
import BusinessHQView from '@/components/BusinessHQView';
import MultiModelArenaView from '@/components/MultiModelArenaView';
import WarRoomChatView from '@/components/WarRoomChatView';

// xterm.js uses browser-only globals (self, window) — must disable SSR
const WorkspaceTerminal = dynamic(
  () => import('@/components/WorkspaceTerminal'),
  { ssr: false }
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

interface AgentShortcut {
  id: string;
  name: string;
  url: string;
  description: string;
  type: 'external' | 'local';
  color: string;
  icon: string;
}

const DEFAULT_EXTERNAL_AGENT_IDS = [
  'chatgpt-custom', 'claude', 'gemini', 'kimi', 'lovable', 'deepseek', 'grok',
  'perplexity', 'v0', 'bolt', 'phind', 'mistral-chat', 'poe', 'huggingface', 'openrouter-play', 'qwen',
  'notebooklm', 'canva', 'excalidraw'
];

// Icon renderer for official AI logos (ChatGPT, Claude, Gemini)
const renderAgentIcon = (agent: AgentShortcut) => {
  // Dynamic favicon loader for third-party websites (ChatGPT, Claude, Gemini, Kimi, etc.)
  if (agent.type === 'external') {
    try {
      const urlObj = new URL(agent.url);
      const domain = urlObj.hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      return (
        <img
          src={faviconUrl}
          alt={agent.name}
          width="16"
          height="16"
          style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain', background: 'transparent' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    } catch {}
  }

  if (agent.id === 'chatgpt-custom') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#10b981', flexShrink: 0 }}>
        <path d="M22.282 9.821a6 6 0 0 0-.516-4.91a6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a6 6 0 0 0-3.998 2.9a6.05 6.05 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.05 6.05 0 0 0 6.515 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206a6 6 0 0 0 3.997-2.9a6.06 6.06 0 0 0-.747-7.073zm-9.022 12.608a4.476 4.476 0 0 1-2.876-1.041l.142-.08l4.778-2.758a.795.795 0 0 0 .393-.681V6.994l2.02 1.169a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.494zm-9.661-4.125a4.471 4.471 0 0 1-.535-3.014l.142.086l4.783 2.758a.771.771 0 0 0 .78 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062l-4.19 2.418a4.5 4.5 0 0 1-6.141-1.646zm19.461-9.927a4.47 4.47 0 0 1-2.365 1.973V6.265a.766.766 0 0 0-.388-.676l-5.814-3.355l2.02-1.168a.076.076 0 0 1 .071 0l4.83 2.786a4.504 4.504 0 0 1 1.646 6.141zm-2.01-3.023l-.142-.085l-4.774-2.782a.776.776 0 0 0-.785 0L5.29 9.23v-2.332a.066.066 0 0 1 .028-.062l4.83-2.787a4.499 4.499 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.074a4.499 4.499 0 0 1 7.376-3.454l-.142.08L8.705 5.459a.795.795 0 0 0-.393.681l-.005 6.723zm1.097-2.365l2.602-1.5l2.607 1.5v3l-2.598 1.5l-2.607-1.5l.006-3z" />
      </svg>
    );
  }
  if (agent.id === 'claude') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ color: '#d97706', flexShrink: 0 }}>
        <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
      </svg>
    );
  }
  if (agent.id === 'gemini') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="gemini-grad-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9b51e0" />
            <stop offset="50%" stopColor="#3182ce" />
            <stop offset="100%" stopColor="#63b3ed" />
          </linearGradient>
        </defs>
        <path d="M12 2Q12 12 2 12Q12 12 12 22Q12 12 22 12Q12 12 12 2Z" fill="url(#gemini-grad-icon)" />
        <path d="M19 6Q19 10 15 10Q19 10 19 14Q19 10 23 10Q19 10 19 6Z" fill="url(#gemini-grad-icon)" opacity="0.8" />
      </svg>
    );
  }
  if (agent.id === 'hermes') {
    return (
      <img
        src="https://www.google.com/s2/favicons?sz=64&domain=nousresearch.com"
        alt="Hermes"
        width="16"
        height="16"
        style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
      />
    );
  }
  if (agent.id === 'opencode') {
    return (
      <img
        src="https://www.google.com/s2/favicons?sz=64&domain=code.visualstudio.com"
        alt="OpenCode"
        width="16"
        height="16"
        style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
      />
    );
  }
  // ─── 6 Custom Local Agents (SVG icons) ───────────────────────────────────
  if (agent.id === 'research') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6', flexShrink: 0 }}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    );
  }
  if (agent.id === 'business') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981', flexShrink: 0 }}>
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    );
  }
  if (agent.id === 'marketing') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ec4899', flexShrink: 0 }}>
        <path d="m3 11 19-9-9 19-2-8-8-2z"/>
      </svg>
    );
  }
  if (agent.id === 'sales') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b', flexShrink: 0 }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    );
  }
  if (agent.id === 'finance') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#14b8a6', flexShrink: 0 }}>
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    );
  }
  if (agent.id === 'personal') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    );
  }
  return <span style={{ fontSize: '1.1rem', lineHeight: 1, flexShrink: 0 }}>{agent.icon}</span>;
};

// ─── DockerView ────────────────────────────────────────────────────────────────
const DockerView = ({ backendUrl }: { backendUrl: string }) => {
  const [daemonRunning, setDaemonRunning] = useState<'checking' | 'running' | 'offline' | 'launching'>('checking');
  const [containers, setContainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ id: string; content: string } | null>(null);
  const [composeLoading, setComposeLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const checkDaemon = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/docker/daemon`);
      const d = await r.json();
      return d.running;
    } catch {
      return false;
    }
  };

  const refresh = async () => {
    try {
      const isDaemonUp = await checkDaemon();
      if (!isDaemonUp) {
        setDaemonRunning('offline');
        setLoading(false);
        return;
      }
      setDaemonRunning('running');
      const r = await fetch(`${backendUrl}/automation/docker/containers`);
      const d = await r.json();
      setContainers(d.containers || []);
      if (d.error) setError(d.error);
      else setError('');
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const launchDockerDesktop = async () => {
    setDaemonRunning('launching');
    setError('');
    try {
      await fetch(`${backendUrl}/automation/docker/launch`, { method: 'POST' });
      // Poll daemon status
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const up = await checkDaemon();
        if (up) {
          clearInterval(poll);
          setDaemonRunning('running');
          refresh();
        } else if (attempts >= 20) {
          clearInterval(poll);
          setDaemonRunning('offline');
          setError('Failed to detect Docker daemon. Please open Docker Desktop manually.');
        }
      }, 2500);
    } catch (e: any) {
      setDaemonRunning('offline');
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (daemonRunning === 'running') refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [backendUrl, daemonRunning]);

  const composeAction = async (action: string) => {
    setComposeLoading(action);
    await fetch(`${backendUrl}/automation/docker/${action}`, { method: 'POST' });
    await refresh();
    setComposeLoading(null);
  };

  const containerAction = async (id: string, action: string) => {
    setActionId(id + action);
    await fetch(`${backendUrl}/automation/docker/container/${id}/${action}`, { method: 'POST' });
    await refresh();
    setActionId(null);
  };

  const viewLogs = async (id: string) => {
    const r = await fetch(`${backendUrl}/automation/docker/container/${id}/logs`);
    const d = await r.json();
    setLogs({ id, content: d.logs || '' });
  };

  const statusColor = (c: any) => c.running ? '#22c55e' : c.paused ? '#f59e0b' : '#6b7280';
  const statusLabel = (c: any) => c.running ? 'Running' : c.paused ? 'Paused' : 'Stopped';

  if (daemonRunning === 'checking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span style={{ fontSize: '0.9rem' }}>Checking Docker Daemon...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (daemonRunning === 'launching') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span style={{ color: '#1e88e5', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>Starting Docker Desktop...</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Waiting for Docker daemon to become responsive</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (daemonRunning === 'offline') {
    return (
      <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="8" width="4" height="3" rx="0.5"/>
            <rect x="12" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="4" width="4" height="3" rx="0.5"/>
            <rect x="12" y="4" width="4" height="3" rx="0.5"/>
            <path d="M2 11.5s0 3.5 9 3.5 11-3.5 11-3.5" strokeWidth="1.2"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600 }}>Docker Daemon is Offline</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 8px', lineHeight: 1.6 }}>
            The Docker engine is not running. Launch Docker Desktop to use containers.
          </p>
          {error && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 8px', fontFamily: 'var(--font-mono)' }}>{error}</p>}
        </div>
        <button className="btn-primary" onClick={launchDockerDesktop} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Docker Desktop
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }} className="animate-fade-in">
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="9" width="4" height="3" rx="0.5"/><rect x="6" y="9" width="4" height="3" rx="0.5"/>
          <rect x="11" y="9" width="4" height="3" rx="0.5"/><rect x="6" y="5" width="4" height="3" rx="0.5"/>
          <rect x="11" y="5" width="4" height="3" rx="0.5"/>
          <path d="M1 12s.5 4 9 4 12-4 12-4" strokeWidth="1.4"/>
          <path d="M22 12c1-.5 2-2 1.5-4-1 1-2.5 1-3 1" strokeWidth="1.4"/>
        </svg>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>Docker Desktop</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>· {containers.length} containers</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[{ label: '▶ Up', action: 'start', color: '#22c55e' }, { label: '⬛ Stop', action: 'stop', color: '#f59e0b' }, { label: '↓ Down', action: 'down', color: '#ef4444' }, { label: '↺ Restart', action: 'restart', color: '#818cf8' }]
            .map(btn => (
              <button key={btn.action} onClick={() => composeAction(btn.action)}
                disabled={composeLoading === btn.action}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', color: composeLoading === btn.action ? 'rgba(255,255,255,0.3)' : btn.color, fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s' }}>
                {composeLoading === btn.action ? '...' : btn.label}
              </button>
            ))}
          <button onClick={refresh} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>⟳</button>
        </div>
      </div>

      {error && <div style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>{error}</div>}

      {/* Container list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading containers...
          </div>
        ) : containers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"><rect x="1" y="9" width="4" height="3" rx="0.5"/><rect x="6" y="9" width="4" height="3" rx="0.5"/><rect x="11" y="9" width="4" height="3" rx="0.5"/></svg>
            <span style={{ fontSize: '0.9rem' }}>No containers found</span>
            <button onClick={() => composeAction('start')} className="btn-primary" style={{ fontSize: '0.85rem' }}>▶ Start Compose</button>
          </div>
        ) : containers.map((c) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', transition: 'border-color 0.2s' }}>
            {/* Status dot */}
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: statusColor(c), boxShadow: `0 0 6px ${statusColor(c)}`, flexShrink: 0 }} />
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                <span>{c.image}</span>
                {c.ports && <span style={{ color: '#818cf8' }}>{c.ports.split(',')[0]}</span>}
              </div>
            </div>
            {/* Status badge */}
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: statusColor(c), background: `${statusColor(c)}18`, border: `1px solid ${statusColor(c)}30`, borderRadius: '4px', padding: '2px 8px', flexShrink: 0 }}>{statusLabel(c)}</span>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              {c.running
                ? <button onClick={() => containerAction(c.id, 'stop')} disabled={actionId === c.id+'stop'} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', color: '#ef4444', fontSize: '0.72rem' }} title="Stop">{actionId===c.id+'stop'?'...':'⬛'}</button>
                : <button onClick={() => containerAction(c.id, 'start')} disabled={actionId === c.id+'start'} style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', color: '#22c55e', fontSize: '0.72rem' }} title="Start">{actionId===c.id+'start'?'...':'▶'}</button>
              }
              <button onClick={() => containerAction(c.id, 'restart')} disabled={actionId === c.id+'restart'} style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', color: '#818cf8', fontSize: '0.72rem' }} title="Restart">{actionId===c.id+'restart'?'...':'↺'}</button>
              <button onClick={() => viewLogs(c.id)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }} title="Logs">≡</button>
            </div>
          </div>
        ))}
      </div>

      {/* Log viewer drawer */}
      {logs && (
        <div style={{ height: '220px', background: '#07090e', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)' }}>logs — {logs.id.slice(0,12)}</span>
            <button onClick={() => setLogs(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>✕</button>
          </div>
          <pre style={{ flex: 1, overflowY: 'auto', margin: 0, padding: '8px 14px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#a5f3fc', lineHeight: 1.5 }}>{logs.content || '(no logs)'}</pre>
        </div>
      )}
    </div>
  );
};

// ─── ObsidianView (Knowledge Base Explorer & Editor) ──────────────────────────
const ObsidianGraph = ({ backendUrl, onOpenNote }: { backendUrl: string; onOpenNote: (path: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${backendUrl}/automation/obsidian/graph`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [backendUrl]);

  useEffect(() => {
    if (loading || data.nodes.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill container
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize physics coordinates
    const nodes = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const radius = 100 + Math.random() * 100;
      return {
        ...n,
        x: (canvas.width / 2) + Math.cos(angle) * radius,
        y: (canvas.height / 2) + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        r: 6
      };
    });

    let draggedNode: any = null;
    let hoveredNode: any = null;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Find clicked node
      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < node.r + 10) {
          draggedNode = node;
          break;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (draggedNode) {
        draggedNode.x = mouseX;
        draggedNode.y = mouseY;
      }

      // Check hover
      let foundHover: any = null;
      for (const node of nodes) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < node.r + 10) {
          foundHover = node;
          break;
        }
      }
      hoveredNode = foundHover;
      canvas.style.cursor = foundHover ? 'pointer' : 'default';
    };

    const handleMouseUp = () => {
      draggedNode = null;
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      for (const node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < node.r + 10) {
          onOpenNote(node.id);
          break;
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);

    let animationFrameId: number;

    const updatePhysicsAndDraw = () => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. Repulsion force between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) * 0.05;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // 2. Attraction force along links
      data.links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        if (s && t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * 0.02; // spring rest distance 80
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        }
      });

      // 3. Update position, gravity & friction
      nodes.forEach(n => {
        if (n === draggedNode) {
          n.x = mouseX;
          n.y = mouseY;
          n.vx = 0;
          n.vy = 0;
        } else {
          n.vx *= 0.85;
          n.vy *= 0.85;

          // Pull slightly to center
          const gdx = cx - n.x;
          const gdy = cy - n.y;
          const gdist = Math.sqrt(gdx * gdx + gdy * gdy) || 1;
          n.vx += (gdx / gdist) * 0.12;
          n.vy += (gdy / gdist) * 0.12;

          n.x += n.vx;
          n.y += n.vy;
        }

        // Keep inside bounds
        n.x = Math.max(20, Math.min(canvas.width - 20, n.x));
        n.y = Math.max(20, Math.min(canvas.height - 20, n.y));
      });

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Links
      data.links.forEach(l => {
        const s = nodes.find(n => n.id === l.source);
        const t = nodes.find(n => n.id === l.target);
        if (s && t) {
          const isHigh = hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(t.x, t.y);
          ctx.strokeStyle = isHigh ? 'rgba(139, 92, 246, 0.6)' : 'rgba(255,255,255,0.06)';
          ctx.lineWidth = isHigh ? 2 : 1;
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach(n => {
        const isHovered = hoveredNode && hoveredNode.id === n.id;
        const isConnected = hoveredNode && data.links.some(l => 
          (l.source === n.id && l.target === hoveredNode.id) || 
          (l.target === n.id && l.source === hoveredNode.id)
        );

        // Node Glow
        if (isHovered || isConnected) {
          const grad = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, 25);
          grad.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
          grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 25, 0, Math.PI * 2);
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHovered ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#a78bfa' : isConnected ? '#c084fc' : '#4b5563';
        ctx.fill();

        // Label
        ctx.font = isHovered ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillStyle = isHovered ? '#fff' : isConnected ? '#e9d5ff' : 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y - 12);
      });

      animationFrameId = requestAnimationFrame(updatePhysicsAndDraw);
    };

    updatePhysicsAndDraw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading, data]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Generating Graph View...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#07080c' }}>
      {/* Help Overlay */}
      <div style={{ position: 'absolute', top: '12px', left: '16px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', pointerEvents: 'none', zIndex: 10 }}>
        🕸 Drag nodes to test physics · Double click node to edit note
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

const ObsidianView = ({ backendUrl }: { backendUrl: string }) => {
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
  const [files, setFiles] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});


  const fetchFiles = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/obsidian/files`);
      const d = await r.json();
      setFiles(d.files || []);
    } catch {}
    setLoading(false);
  };

  const loadFile = async (filePath: string) => {
    setSelectedPath(filePath);
    try {
      const r = await fetch(`${backendUrl}/automation/obsidian/read?path=${encodeURIComponent(filePath)}`);
      const d = await r.json();
      setContent(d.content || '');
    } catch {
      setContent('');
    }
  };

  const saveFile = async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      await fetch(`${backendUrl}/automation/obsidian/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content }),
      });
    } catch {}
    setSaving(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const renderTree = (nodes: any[]) => {
    return nodes.map((node) => {
      if (node.isDirectory) {
        const isOpen = !!expandedDirs[node.path];
        return (
          <div key={node.path} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              onClick={() => toggleDir(node.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', color: '#fff', transition: 'background 0.2s' }}
              className="hover-bg-light"
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.5, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
              <span>📁</span>
              <span style={{ fontWeight: 600 }}>{node.name}</span>
            </div>
            {isOpen && node.children && (
              <div style={{ paddingLeft: '14px', borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {renderTree(node.children)}
              </div>
            )}
          </div>
        );
      } else {
        const isSelected = selectedPath === node.path;
        return (
          <div
            key={node.path}
            onClick={() => loadFile(node.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem',
              color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
              background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
              transition: 'background 0.2s'
            }}
            className="hover-bg-light"
          >
            <span>📄</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name.replace('.md', '')}</span>
          </div>
        );
      }
    });
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, background: '#090a0f' }} className="animate-fade-in">
      {/* File Tree Panel */}
      <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>🟣</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Obsidian Vault</span>
        </div>

        {/* View Mode Segmented Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '2px', gap: '2px' }}>
          <button
            onClick={() => setViewMode('tree')}
            style={{
              flex: 1, border: 'none', background: viewMode === 'tree' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: viewMode === 'tree' ? '#fff' : 'rgba(255,255,255,0.4)', borderRadius: '4px', padding: '6px 0',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <span>📁</span> Folder
          </button>
          <button
            onClick={() => setViewMode('graph')}
            style={{
              flex: 1, border: 'none', background: viewMode === 'graph' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: viewMode === 'graph' ? '#fff' : 'rgba(255,255,255,0.4)', borderRadius: '4px', padding: '6px 0',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <span>🕸</span> Graph
          </button>
        </div>

        {viewMode === 'tree' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {loading ? (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading notes...</span>
            ) : files.length === 0 ? (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No notes found</span>
            ) : (
              renderTree(files)
            )}
          </div>
        )}
      </div>

      {/* Editor or Graph view */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f14', position: 'relative' }}>
        {viewMode === 'graph' ? (
          <ObsidianGraph
            backendUrl={backendUrl}
            onOpenNote={(notePath) => {
              setViewMode('tree');
              loadFile(notePath);
            }}
          />
        ) : selectedPath ? (
          <>
            {/* Editor Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>{selectedPath}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setEditMode(!editMode)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', color: '#818cf8', fontSize: '0.78rem' }}
                >
                  {editMode ? '👁 Preview' : '✏️ Edit'}
                </button>
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                >
                  {saving ? 'Saving...' : '💾 Save Note'}
                </button>
              </div>
            </div>

            {/* Note Body */}
            <div style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }}>
              {editMode ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    flex: 1, width: '100%', background: 'transparent', border: 'none', resize: 'none', outline: 'none',
                    color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.88rem', lineHeight: 1.6, padding: '24px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Start writing in markdown..."
                />
              ) : (
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', color: '#e2e8f0', lineHeight: 1.6, fontSize: '0.92rem' }}>
                  {/* Clean Markdown Fallback viewer */}
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', margin: 0 }}>{content || '(empty note)'}</pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'rgba(255,255,255,0.3)' }}>
            <span style={{ fontSize: '3rem' }}>📓</span>
            <span style={{ fontSize: '0.9rem' }}>Select a note from the Obsidian sidebar to read or edit</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── HeartbeatMonitor (Live Workspace Ports Telemetry Scanner) ──────────────
const HeartbeatMonitor = ({ backendUrl }: { backendUrl: string }) => {
  const [portStatuses, setPortStatuses] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const checkPorts = async () => {
    try {
      const res = await fetch(`${backendUrl}/automation/ports/check`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server response is not JSON');
      }
      const json = await res.json();
      if (json && json.ok && json.ports) {
        setPortStatuses(json.ports);
      }
    } catch (e) {
      console.warn('Failed to scan workspace ports (backend proxy standby):', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkPorts();
    const interval = setInterval(checkPorts, 4000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  const portMetadata: Record<number, { label: string; desc: string }> = {
    3000: { label: 'Journex UI', desc: 'Docker frontend' },
    3005: { label: 'Orchestrator API', desc: 'NestJS backend' },
    3010: { label: 'Orchestrator UI', desc: 'Next.js cockpit' },
    5000: { label: 'Journex API', desc: 'Express backend' },
    5003: { label: 'MT5 Bridge', desc: 'FastAPI trading' },
    5555: { label: 'Prisma Studio', desc: 'DB explorer' },
    5678: { label: 'n8n Workflows', desc: 'n8n automation' },
    5432: { label: 'PostgreSQL', desc: 'Database engine' },
  };

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          🔌 Laptop Workspace Port Telemetry
        </h3>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
          Auto-polling active | 127.0.0.1
        </span>
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {Object.keys(portMetadata).map((portStr) => {
          const port = parseInt(portStr);
          const isOnline = portStatuses[port] || false;
          const meta = portMetadata[port];
          return (
            <div 
              key={port} 
              style={{
                flex: '1 1 160px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: isOnline ? '0 0 10px rgba(34, 197, 94, 0.04)' : 'none'
              }}
            >
              <div 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isOnline ? '#22c55e' : '#ef4444', 
                  boxShadow: `0 0 8px ${isOnline ? '#22c55e' : '#ef4444'}`,
                  flexShrink: 0 
                }} 
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{meta.label}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{port}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {meta.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MT5BridgeView (MetaTrader 5 Bridge Operations Console) ─────────────────────
const MT5BridgeView = ({ backendUrl, projects }: { backendUrl: string; projects: any[] }) => {
  const bridgeUrl = 'http://localhost:5003';
  const [status, setStatus] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [servicesOnline, setServicesOnline] = useState<boolean | null>(null);
  const [runningAction, setRunningAction] = useState<'starting' | 'stopping' | null>(null);

  const [symbol, setSymbol] = useState('EURUSD');
  const [lotSize, setLotSize] = useState('0.01');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const dashboardProject = projects.find(
    (p) => p.name.toLowerCase() === 'dashboard' || p.name.toLowerCase() === 'journex'
  ) || projects[0];

  const checkServicesStatus = async () => {
    try {
      const res = await fetch(`${backendUrl}/automation/ports/check`);
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      const json = await res.json();
      if (json && json.ok && json.ports) {
        setServicesOnline(!!json.ports[5003] || !!json.ports[5000]);
      }
    } catch {
      setServicesOnline(false);
    }
  };

  const handleStartServices = async () => {
    if (!dashboardProject) {
      alert('No dashboard project found registered. Please link it in the Projects tab first!');
      return;
    }
    setRunningAction('starting');
    try {
      const res = await fetch(`${backendUrl}/projects/${dashboardProject.id}/start`, { method: 'POST' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      const json = await res.json();
      alert(json.msg || 'Startup signal sent successfully!');
      setTimeout(checkServicesStatus, 1500);
      setTimeout(fetchBridgeData, 2000);
    } catch (e: any) {
      alert(`Error starting services: ${e.message}`);
    }
    setRunningAction(null);
  };

  const handleStopServices = async () => {
    if (!dashboardProject) return;
    setRunningAction('stopping');
    try {
      const res = await fetch(`${backendUrl}/projects/${dashboardProject.id}/stop`, { method: 'POST' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      const json = await res.json();
      alert(json.msg || 'Shutdown signal sent successfully!');
      setTimeout(checkServicesStatus, 1500);
      setTimeout(fetchBridgeData, 2000);
    } catch (e: any) {
      alert(`Error stopping services: ${e.message}`);
    }
    setRunningAction(null);
  };

  const fetchBridgeData = async () => {
    try {
      const statusRes = await fetch(`${bridgeUrl}/api/status`);
      if (!statusRes.ok) throw new Error(`Status ${statusRes.status}`);
      let sContentType = statusRes.headers.get('content-type');
      if (!sContentType || !sContentType.includes('application/json')) {
        throw new Error('Status response not JSON');
      }
      const statusData = await statusRes.json();
      setStatus(statusData);

      const configRes = await fetch(`${bridgeUrl}/api/alert-config`);
      if (!configRes.ok) throw new Error(`Status ${configRes.status}`);
      let cContentType = configRes.headers.get('content-type');
      if (!cContentType || !cContentType.includes('application/json')) {
        throw new Error('Config response not JSON');
      }
      const configData = await configRes.json();
      setConfig(configData);

      if (statusData && Array.isArray(statusData.positions)) {
        setPositions(statusData.positions);
      } else {
        setPositions([]);
      }
    } catch (e) {
      setStatus(null);
      setPositions([]);
      setConfig(null);
      console.warn('MT5 Bridge is offline or inaccessible.');
    }
    setLoading(false);
  };

  const toggleAlertKey = async (key: string, value: boolean) => {
    if (!config) return;
    const updated = { ...config, [key]: value };
    try {
      const res = await fetch(`${bridgeUrl}/api/alert-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const d = await res.json();
      if (d) {
        setConfig(updated);
      }
    } catch {
      alert('Failed to update bridge configuration.');
    }
  };

  const executeTrade = async (type: 'buy' | 'sell') => {
    setActionLoading(true);
    try {
      const res = await fetch(`${bridgeUrl}/api/execute-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          action: type.toUpperCase(),
          volume: parseFloat(lotSize),
          sl: stopLoss ? parseFloat(stopLoss) : undefined,
          tp: takeProfit ? parseFloat(takeProfit) : undefined,
        }),
      });
      const json = await res.json();
      if (json && (json.retcode === 10009 || json.order || json.ok)) {
        alert(`Trade executed successfully! Ticket: ${json.order || '10009'}`);
        fetchBridgeData();
      } else {
        alert(`Execution failed: ${json.comment || json.message || JSON.stringify(json)}`);
      }
    } catch (err: any) {
      alert(`Connection error: ${err.message}`);
    }
    setActionLoading(false);
  };

  useEffect(() => {
    fetchBridgeData();
    checkServicesStatus();
    const interval = setInterval(() => {
      fetchBridgeData();
      checkServicesStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isBridgeConnected = status && status.connected;

  if (!status) {
    return (
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80%', gap: '24px' }} className="animate-fade-in">
        <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 16px rgba(99,102,241,0.3))' }}>🤖</div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>Trading Agent</h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
            Status: <span style={{ color: '#ef4444', fontWeight: 600 }}>Offline</span> | Workspace: <strong>{dashboardProject?.name || 'Dashboard'}</strong>
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
            {dashboardProject?.path}
          </p>
        </div>

        <button 
          disabled={runningAction !== null}
          onClick={handleStartServices} 
          className="btn-primary" 
          style={{ 
            padding: '14px 28px', 
            fontSize: '0.9rem', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
            color: '#fff',
            border: 'none', 
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            transition: 'all 0.2s'
          }}
        >
          {runningAction === 'starting' ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Booting Agent Stack...
            </>
          ) : (
            <>
              <span>🚀 Run Trading Agent</span>
            </>
          )}
        </button>

        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', maxWidth: '420px', lineHeight: 1.5, textAlign: 'center' }}>
          This will spin up your dockerized Postgres database, Journals API server, Next.js interface, and tail your MT5 Python bridge automatically on host port 5003.
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', width: '100%', overflow: 'hidden' }} className="animate-fade-in">
      
      {/* Trading Stack Control Header */}
      <div className="glass-panel" style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', flexShrink: 0 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.88rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🟢 Trading Agent is Active
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>
            Workspace: <strong>{dashboardProject?.name || 'Dashboard'}</strong> | Port: <span style={{ fontFamily: 'var(--font-mono)' }}>3000</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => window.open('http://localhost:3000/dashboard', '_blank')} 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.78rem', 
              background: 'rgba(255,255,255,0.06)', 
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            ↗️ Open Dashboard
          </button>
          
          <button 
            disabled={runningAction !== null}
            onClick={handleStopServices} 
            className="btn-primary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.78rem', 
              background: '#ef4444', 
              color: '#fff',
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px'
            }}
          >
            {runningAction === 'stopping' ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Stopping Stack...
              </>
            ) : (
              '🛑 Stop Trading Agent'
            )}
          </button>
        </div>
      </div>

      {/* Embedded Dashboard (Port 3000) */}
      <div style={{ flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#090a0f', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>http://localhost:3000/dashboard</span>
        </div>
        <iframe
          src="http://localhost:3000/dashboard"
          style={{ width: '100%', height: '100%', border: 'none', background: '#090a0f' }}
          title="Journex Dashboard"
        />
      </div>

    </div>
  );
};

// ─── AI Workspace presets list ───────────────────────────────────────────────
const AGENT_PRESETS = [
  {
    id: 'research',
    name: 'Research Agent',
    icon: '🧠',
    color: '#8b5cf6',
    systemPrompt: `You are a professional market researcher. Your job is to collect information, compare sources, summarize findings, and create structured reports with citations.`,
    tools: ['web_search', 'browser', 'pdf_reader'],
    templates: [
      { label: 'Market Research', placeholder: 'Idea: Analyze online tutoring market...' },
      { label: 'Competitor Analysis', placeholder: 'Compare ServiceFinder vs TaskRabbit...' },
      { label: 'Paper Summary', placeholder: 'Summary of the latest transformer architecture paper...' },
      { label: 'Technology Review', placeholder: 'Compare NextJS 15 App Router vs Remix...' }
    ]
  },
  {
    id: 'business',
    name: 'Business Agent',
    icon: '💼',
    color: '#10b981',
    systemPrompt: `You are a startup strategist. Your job is to analyze market opportunity, customer pain points, pricing strategy, business models, and operational risks.`,
    tools: [],
    templates: [
      { label: 'Startup Validation', placeholder: 'Idea: AI-driven Micro-SaaS for retail traders. Target customer: Algo developers...' },
      { label: 'Pricing Strategy', placeholder: 'Propose subscription tiers for a developer workspace dashboard...' },
      { label: 'Customer Persona', placeholder: 'Profile a freelancer looking to automate client invoicing...' },
      { label: 'Competitor Comparison', placeholder: 'Compare custom database manager vs Supabase dashboard...' }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    icon: '📢',
    color: '#ec4899',
    systemPrompt: `You are a growth marketer. Your focus areas: SEO keyword optimizations, content calendar planning, social media strategies, branding, and customer acquisition campaigns.`,
    tools: [],
    templates: [
      { label: '30-day Content Plan', placeholder: 'Promoting a local trading database orchestrator...' },
      { label: 'SEO Audit Outline', placeholder: 'Target keyword: "docker port conflict manager"...' },
      { label: 'Social Media Strategy', placeholder: 'Create a Twitter/X thread for developer productivity tips...' },
      { label: 'Ad Campaign Draft', placeholder: 'Create Facebook ads hooks targeting algo traders...' }
    ]
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    icon: '💰',
    color: '#3b82f6',
    systemPrompt: `You are a professional financial analyst. You specialize in expense tracking, investment risk analysis, business budgeting, unit economics, and SaaS financial models.`,
    tools: [],
    templates: [
      { label: 'Expense Report', placeholder: 'Breakdown server infrastructure run-rate expenses...' },
      { label: 'Investment Analysis', placeholder: 'Risk and return profiling for automated trading capital allocation...' },
      { label: 'SaaS Financial Model', placeholder: 'Build CAC, LTV, MRR forecasts for a B2B SaaS startup...' }
    ]
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    icon: '🤝',
    color: '#f59e0b',
    systemPrompt: `You are a sales strategist and copywriter. Your goal is to help with lead profiling, cold outreach templates, sales scripts, CRM logs, and customer follow-up pipelines.`,
    tools: [],
    templates: [
      { label: 'Cold Email Draft', placeholder: 'Reach out to quant funds about custom MT5 integration...' },
      { label: 'Lead Research', placeholder: 'Profile boutique trading firms in Southeast Asia...' },
      { label: 'Sales Funnel Outline', placeholder: 'Conversion pipeline steps for B2B developer tool...' },
      { label: 'Customer Follow-up', placeholder: 'Follow up after a live product demo...' }
    ]
  },
  {
    id: 'personal',
    name: 'Assistant Agent',
    icon: '📅',
    color: '#ec4899',
    systemPrompt: `You are a helpful executive assistant. Your job is to structure daily agendas, set system reminders, organize project planning roadmaps, and write daily logs.`,
    tools: [],
    templates: [
      { label: 'Daily Agenda', placeholder: 'Create daily schedule for system engineering sprint...' },
      { label: 'System Reminders', placeholder: 'Configure backup schedules and log rotations...' },
      { label: 'Project Roadmap', placeholder: 'Outline next 3 months development goals for Orchestrator...' },
      { label: 'Daily Review Log', placeholder: 'Log accomplishments, bottlenecks, and focus for tomorrow...' }
    ]
  },
  {
    id: 'coding',
    name: 'Coding Agent (Hermes)',
    icon: '💻',
    color: '#8b5cf6',
    systemPrompt: `You are Hermes, an autonomous coding agent. Your goal is to review file paths, suggest code changes, outline refactoring steps, and write unit tests.`,
    tools: ['git_terminal', 'file_editor'],
    templates: [
      { label: 'Suggest Code Fix', placeholder: 'File path: payment.service.ts line 230. Error: HMAC failed...' },
      { label: 'Refactoring Plan', placeholder: 'Move Prisma client initialization to global context...' },
      { label: 'Create Unit Tests', placeholder: 'Write Jest test cases for Stripe webhook route...' }
    ]
  }
];

// ─── FounderBriefingCard (Daily Morning Executive Briefing) ───────────────────
const FounderBriefingCard = ({ backendUrl }: { backendUrl: string }) => {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/automation/briefing`);
      const data = await res.json();
      if (data.ok) setBriefing(data.briefing);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '22px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: collapsed ? 0 : '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>☀️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
              Daily Founder Executive Briefing
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#f59e0b' }}>
              Synthesized from 10-Stage Pipeline, Bottleneck Radar, & Experience Ledger
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchBriefing}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              color: '#c9d1d9',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Briefing'}
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {collapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '8px',
          padding: '14px 16px',
          color: '#e6edf3',
          fontSize: '0.86rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {loading ? 'Generating executive briefing...' : (briefing || 'Loading briefing...')}
        </div>
      )}
    </div>
  );
};

// ─── AIWorkspaceView (Unified AI Agent Chat & Workspace) ────────────────────────
const AIWorkspaceView = ({ backendUrl, projects }: { backendUrl: string; projects: any[] }) => {
  const [workspaceMode, setWorkspaceMode] = useState<'arena' | 'warroom' | 'single'>('arena');
  const [selectedAgentId, setSelectedAgentId] = useState('research');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [savedPath, setSavedPath] = useState<string | null>(null);
  
  // Execution mode states
  const [execMode, setExecMode] = useState<'template' | 'llm' | 'n8n'>('template');
  const [llmProvider, setLlmProvider] = useState('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/v1');
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState('http://localhost:5678/webhook/ixRVFXuJdYEgE7EA/webhook/agent-run');

  const currentAgent = AGENT_PRESETS.find(a => a.id === selectedAgentId) || AGENT_PRESETS[0];

  // Load storage keys on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem('orchestrator_exec_mode');
      if (mode) setExecMode(mode as any);
      const prov = localStorage.getItem('orchestrator_llm_provider');
      if (prov) setLlmProvider(prov);
      const mod = localStorage.getItem('orchestrator_llm_model');
      if (mod) setLlmModel(mod);
      const key = localStorage.getItem('orchestrator_llm_api_key');
      if (key) setLlmApiKey(key);
      const oUrl = localStorage.getItem('orchestrator_ollama_url');
      if (oUrl) setOllamaUrl(oUrl);
    }
  }, []);

  // Update localStorage when configuration changes
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_exec_mode', execMode);
  }, [execMode]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_provider', llmProvider);
  }, [llmProvider]);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_model', llmModel);
  }, [llmModel]);

  // Reset local form when selected agent changes
  useEffect(() => {
    setSelectedAction(null);
    setPrompt('');
    setStatus('idle');
    setLogs([]);
    setResult('');
    setSavedPath(null);
  }, [selectedAgentId]);

  const modelOptions: Record<string, { label: string; value: string }[]> = {
    openai: [
      { label: 'GPT-4o', value: 'gpt-4o' },
      { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
      { label: 'o1', value: 'o1' },
      { label: 'o3 mini', value: 'o3-mini' },
    ],
    gemini: [
      { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
      { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
      { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    ],
    claude: [
      { label: 'Claude Opus 4.5', value: 'claude-opus-4-5' },
      { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
      { label: 'Claude Haiku 3.5', value: 'claude-haiku-3-5' },
    ],
    deepseek: [
      { label: 'DeepSeek V3 (Chat)', value: 'deepseek-chat' },
      { label: 'DeepSeek R1 (Reasoner)', value: 'deepseek-reasoner' },
    ],
    ollama: [
      { label: 'Llama 3', value: 'llama3' },
      { label: 'DeepSeek R1', value: 'deepseek-r1' },
      { label: 'Mistral', value: 'mistral' },
    ]
  };

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setStatus('running');
    setLogs([]);
    setResult('');
    setSavedPath(null);

    const modeLabel = execMode === 'template' ? 'Template Preset' : execMode === 'llm' ? `${llmProvider.toUpperCase()} / ${llmModel}` : 'n8n Webhook';
    setLogs(prev => [
      ...prev,
      `[1/3] Launching ${currentAgent.name} configuration...`,
      `[2/3] Injecting System Prompt: "${currentAgent.systemPrompt.substring(0, 45)}..."`,
      `[3/3] Executing via [${modeLabel}]...`
    ]);

    try {
      // Build standard API payload
      const payload: any = {
        agentId: currentAgent.id,
        action: selectedAction || 'custom_query',
        prompt: prompt,
        mode: execMode,
        systemPrompt: currentAgent.systemPrompt
      };
      
      if (execMode === 'llm') {
        payload.provider = llmProvider;
        payload.model = llmModel;
        payload.apiKey = llmApiKey;
        if (llmProvider === 'ollama') payload.ollamaUrl = ollamaUrl;
        if (llmApiKey && typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_api_key', llmApiKey);
      }
      
      if (execMode === 'n8n') {
        payload.webhookUrl = n8nWebhookUrl;
      }

      const res = await fetch(`${backendUrl}/automation/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setLogs(prev => [...prev, `✓ Complete! Report saved to Obsidian.`]);
        setResult(json.result);
        setSavedPath(json.savedPath ?? null);
      } else {
        setLogs(prev => [...prev, `✗ Error: ${json.error || 'Unknown execution error'}`]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `✗ Network error: ${err.message}`]);
    } finally {
      setStatus('completed');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '14px' }}>
      {/* Mode Switcher Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setWorkspaceMode('arena')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: workspaceMode === 'arena' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              background: workspaceMode === 'arena' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: workspaceMode === 'arena' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>⚔️</span> Parallel Model Arena
          </button>
          <button
            onClick={() => setWorkspaceMode('warroom')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: workspaceMode === 'warroom' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              background: workspaceMode === 'warroom' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: workspaceMode === 'warroom' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>🏛️</span> Multi-Agent War Room
          </button>
          <button
            onClick={() => setWorkspaceMode('single')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: workspaceMode === 'single' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              background: workspaceMode === 'single' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: workspaceMode === 'single' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>🤖</span> Single Agent Preset Runner
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {workspaceMode === 'arena' ? '⚡ Side-by-side comparison across multiple models & custom API endpoints' : workspaceMode === 'warroom' ? '🏛️ Executive multi-agent collaboration with shared blackboard' : 'Single agent prompt runner & Obsidian mirror'}
        </span>
      </div>

      {/* Content Area */}
      {workspaceMode === 'arena' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <MultiModelArenaView backendUrl={backendUrl} />
        </div>
      ) : workspaceMode === 'warroom' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <WarRoomChatView backendUrl={backendUrl} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '16px', flex: 1, minHeight: 0 }}>
      {/* Left Column: Preset configurations */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
        
        {/* Agent Selector Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', fontWeight: 600 }}>CHOOSE AGENT MODE</label>
          <select
            value={selectedAgentId}
            onChange={e => setSelectedAgentId(e.target.value)}
            style={{ width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', outline: 'none' }}
          >
            {AGENT_PRESETS.map(a => (
              <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
            ))}
          </select>
        </div>

        {/* Selected Agent Details */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{currentAgent.icon}</span>
            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{currentAgent.name} Presets</strong>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {currentAgent.systemPrompt}
          </p>
        </div>

        {/* Execution Mode Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', fontWeight: 600 }}>EXECUTION CONTEXT</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '8px' }}>
            {(['template', 'llm', 'n8n'] as const).map(mode => (
              <button key={mode} onClick={() => { setExecMode(mode); setSelectedAction(null); }}
                style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: execMode === mode ? 'rgba(99,102,241,0.2)' : 'transparent', color: execMode === mode ? '#818cf8' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
              >
                {mode === 'llm' ? 'Direct LLM' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Mode Form Panel */}
        <div style={{ flex: 1 }}>
          {execMode === 'template' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em', fontWeight: 600 }}>TEMPLATES</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {currentAgent.templates.map(tpl => (
                  <button
                    key={tpl.label}
                    onClick={() => {
                      setSelectedAction(tpl.label);
                      setPrompt(tpl.placeholder);
                    }}
                    style={{
                      textAlign: 'left',
                      background: selectedAction === tpl.label ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${selectedAction === tpl.label ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: selectedAction === tpl.label ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    📝 {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {execMode === 'llm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>LLM Provider</label>
                <select value={llmProvider} onChange={e => { setLlmProvider(e.target.value); setLlmModel(modelOptions[e.target.value]?.[0]?.value || ''); }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem' }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Model</label>
                <select value={llmModel} onChange={e => setLlmModel(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem' }}
                >
                  {modelOptions[llmProvider]?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {llmProvider !== 'ollama' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>API Key</label>
                  <input type="password" placeholder="sk-..." value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ollama Endpoint</label>
                  <input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              )}
            </div>
          )}

          {execMode === 'n8n' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>n8n Webhook URL</label>
              <input value={n8nWebhookUrl} onChange={e => setN8nWebhookUrl(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Chat workspace prompt input & outputs */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        
        {/* Workspace Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '14px', flexShrink: 0 }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff' }}>Unified Chat Console</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Target: <strong style={{ color: currentAgent.color }}>{currentAgent.name}</strong></span>
        </div>

        {/* Output Console area */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
          
          {/* Welcome Prompt */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.25rem', padding: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }}>🤖</span>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block', marginBottom: '2px' }}>{currentAgent.name} Assistant</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Hello Rendo! I am ready to operate under the **{currentAgent.name}** profile. 
                {currentAgent.tools.length > 0 && (
                  <span style={{ display: 'block', marginTop: '6px', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                    Active tools: {currentAgent.tools.join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Running Execution logs */}
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', opacity: 0.7 }}>⟳</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{log}</span>
            </div>
          ))}

          {/* Result view */}
          {result && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
              <span style={{ fontSize: '1.25rem' }}>📄</span>
              <div style={{ width: '100%' }}>
                <strong style={{ fontSize: '0.82rem', color: '#fff', display: 'block', marginBottom: '6px' }}>Execution Output</strong>
                
                <div style={{ background: '#0a0b10', padding: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#e4e4e7', fontSize: '0.82rem', lineHeight: '1.5', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                  {result}
                </div>
                
                {savedPath && (
                  <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✓ Synced to Obsidian Vault:</span>
                    <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', color: '#34d399' }}>{savedPath}</code>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Input prompt area */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={`Ask ${currentAgent.name}... (e.g. ${currentAgent.templates[0]?.placeholder || 'Analyze online tutoring market...'})`}
              style={{ flex: 1, minHeight: '64px', maxHeight: '120px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRun();
                }
              }}
            />
            <button
              disabled={status === 'running' || !prompt.trim()}
              onClick={handleRun}
              style={{
                width: '74px',
                background: status === 'running' || !prompt.trim() 
                  ? 'rgba(255,255,255,0.03)' 
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                borderRadius: '8px',
                color: status === 'running' || !prompt.trim() ? 'var(--text-muted)' : '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: status === 'running' || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '4px',
                transition: 'all 0.15s'
              }}
            >
              {status === 'running' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
        </div>
      )}
    </div>
  );
};

// ─── GlobalSettingsModal (Unified Configurations Manager) ────────────────────
const GlobalSettingsModal = ({ isOpen, onClose, backendUrl }: { isOpen: boolean; onClose: () => void; backendUrl: string }) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'deploy' | 'telegram'>('llm');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // LLM State (localStorage cached)
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434/v1');

  // Deployments config
  const [vercelToken, setVercelToken] = useState('');
  const [railwayToken, setRailwayToken] = useState('');
  const [sentryToken, setSentryToken] = useState('');
  const [cloudflareToken, setCloudflareToken] = useState('');

  // Telegram Config
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [tgActive, setTgActive] = useState(false);

  useEffect(() => {
    // Load local storage LLM credentials
    if (typeof window !== 'undefined') {
      setOpenaiKey(localStorage.getItem('orchestrator_llm_api_key') || '');
      setClaudeKey(localStorage.getItem('orchestrator_claude_api_key') || '');
      setGeminiKey(localStorage.getItem('orchestrator_gemini_api_key') || '');
      setOllamaUrl(localStorage.getItem('orchestrator_ollama_url') || 'http://localhost:11434/v1');
    }

    // Load deployment config and telegram config from backend in parallel
    const loadAll = async () => {
      try {
        const [deployRes, tgRes] = await Promise.all([
          fetch(`${backendUrl}/automation/deploy/config`).then(r => r.json()),
          fetch(`${backendUrl}/telegram/status`).then(r => r.json())
        ]);

        if (deployRes.ok) {
          // If masked, display masked previews or leave blank for update
          setVercelToken(deployRes.vercelConfigured ? '••••••••' : '');
          setRailwayToken(deployRes.railwayConfigured ? '••••••••' : '');
          setSentryToken(deployRes.sentryConfigured ? '••••••••' : '');
          setCloudflareToken(deployRes.cloudflareConfigured ? '••••••••' : '');
        }

        setTgToken(tgRes.tokenConfigured ? '••••••••••••••••••••' : '');
        setTgChatId(tgRes.allowedChatId === 'Not set' ? '' : tgRes.allowedChatId);
        setTgActive(tgRes.enabled);
      } catch (err) {
        console.error('Failed to load global configurations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [backendUrl]);

  const handleSaveLLM = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orchestrator_llm_api_key', openaiKey);
      localStorage.setItem('orchestrator_claude_api_key', claudeKey);
      localStorage.setItem('orchestrator_gemini_api_key', geminiKey);
      localStorage.setItem('orchestrator_ollama_url', ollamaUrl);
    }
    alert('Local LLM credentials updated successfully!');
  };

  const handleSaveDeploy = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      // Only send if the user changed the masked value
      if (vercelToken && vercelToken !== '••••••••') payload.vercelToken = vercelToken;
      if (railwayToken && railwayToken !== '••••••••') payload.railwayToken = railwayToken;
      if (sentryToken && sentryToken !== '••••••••') payload.sentryToken = sentryToken;
      if (cloudflareToken && cloudflareToken !== '••••••••') payload.cloudflareToken = cloudflareToken;

      const res = await fetch(`${backendUrl}/automation/deploy/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        alert('Platform Deployment Tokens synchronized successfully!');
      } else {
        alert('Failed to update deployment credentials: ' + (data.error || 'Unknown error'));
      }
    } catch {
      alert('Error connecting to backend VPS configurations.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTelegram = async () => {
    setSaving(true);
    try {
      const payload: any = { active: tgActive };
      if (tgToken && tgToken !== '••••••••••••••••••••') payload.token = tgToken;
      if (tgChatId) payload.allowedChatId = tgChatId;

      const res = await fetch(`${backendUrl}/telegram/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        // Now toggle status based on switch
        await fetch(`${backendUrl}/telegram/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: tgActive })
        });
        alert('Telegram integration configured successfully!');
      } else {
        alert('Failed to configure telegram details.');
      }
    } catch {
      alert('Network failure connecting to Telegram control plane.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-panel" style={{ width: '640px', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>Configurations Manager</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Central control panel for integrations, bot pipelines, and LLM routes</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)', gap: '10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading configurations...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Nav Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
              {(['llm', 'deploy', 'telegram'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: activeTab === tab ? 'rgba(99,102,241,0.1)' : 'transparent',
                    border: activeTab === tab ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab === 'llm' ? '🤖 Models & Keys' : tab === 'deploy' ? '🚀 Cloud Targets' : '🔔 Telegram Bot'}
                </button>
              ))}
            </div>

            {/* Content areas */}
            <div style={{ flex: 1 }}>
              {activeTab === 'llm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>OPENAI API KEY</label>
                    <input type="password" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-proj-..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>ANTHROPIC CLAUDE KEY</label>
                    <input type="password" value={claudeKey} onChange={e => setClaudeKey(e.target.value)} placeholder="sk-ant-..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>GOOGLE GEMINI KEY</label>
                    <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>OLLAMA LOCAL ENDPOINT</label>
                    <input value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <button type="button" onClick={handleSaveLLM} className="btn-primary" style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
                    Save LLM Configurations
                  </button>
                </div>
              )}

              {activeTab === 'deploy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>VERCEL INTEGRATION TOKEN</label>
                    <input type="password" value={vercelToken} onChange={e => setVercelToken(e.target.value)} placeholder="Vercel personal authorization token..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>RAILWAY API KEY</label>
                    <input type="password" value={railwayToken} onChange={e => setRailwayToken(e.target.value)} placeholder="Railway project API token..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>SENTRY INTEGRATION TOKEN</label>
                    <input type="password" value={sentryToken} onChange={e => setSentryToken(e.target.value)} placeholder="Sentry Auth Token (Error Cockpit integration)..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>CLOUDFLARE ACCOUNT TOKEN</label>
                    <input type="password" value={cloudflareToken} onChange={e => setCloudflareToken(e.target.value)} placeholder="Cloudflare DNS API/account access token..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button type="button" onClick={handleSaveDeploy} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
                    {saving ? 'Saving...' : 'Sync Deploy Tokens'}
                  </button>
                </div>
              )}

              {activeTab === 'telegram' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>TELEGRAM BOT TOKEN</label>
                    <input type="password" value={tgToken} onChange={e => setTgToken(e.target.value)} placeholder="123456789:ABCdefGhIJKlmNoPQ..."
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px' }}>ALLOWED CHAT ID</label>
                    <input type="text" value={tgChatId} onChange={e => setTgChatId(e.target.value)} placeholder="e.g. 987654321"
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', marginTop: '6px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: '#fff' }}>Enable Bot Pipeline</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Allows remote commands, telemetry audits and auto-fixing via chat gateway</span>
                    </div>
                    <input type="checkbox" checked={tgActive} onChange={e => setTgActive(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                  <button type="button" onClick={handleSaveTelegram} disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-end', marginTop: '8px' }}>
                    {saving ? 'Syncing...' : 'Sync Telegram Configurations'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// ─── NotionView (External Workspace integration) ──────────────────────────────
const NotionView = () => {
  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden' }} className="animate-fade-in">
      <iframe
        src="https://notion.so"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Notion Workspace"
        allow="same-origin"
      />
    </div>
  );
};

// ─── SystemHealthView (Unified Hardware Telemetry & Health Analytics) ─────────
const SystemHealthView = ({ backendUrl, cpuHistory, memHistory }: { backendUrl: string; cpuHistory: number[]; memHistory: number[] }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pingHostVal, setPingHostVal] = useState('8.8.8.8');
  const [pingResult, setPingResult] = useState<any>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/system/metrics`);
      const d = await r.json();
      setMetrics(d);
    } catch {}
    setLoading(false);
  };

  const handlePing = async () => {
    if (!pingHostVal) return;
    setPingLoading(true);
    try {
      const r = await fetch(`${backendUrl}/automation/system/ping?host=${encodeURIComponent(pingHostVal)}`).then(res => res.json());
      setPingResult(r);
    } catch {
      setPingResult({ ok: false, error: 'Ping failed.' });
    } finally {
      setPingLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  if (loading || !metrics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Reading system health and telemetry...
      </div>
    );
  }

  // Draw smooth SVG area path for cpu/mem history
  const drawAreaPath = (history: number[]) => {
    if (history.length < 2) return '';
    const points = history.map((val, idx) => {
      const x = (idx / 14) * 500;
      const y = 150 - (val / 100) * 130;
      return `${x},${y}`;
    });
    return `M 0,150 L ${points.join(' L ')} L 500,150 Z`;
  };

  const drawLinePath = (history: number[]) => {
    if (history.length < 2) return '';
    const points = history.map((val, idx) => {
      const x = (idx / 14) * 500;
      const y = 150 - (val / 100) * 130;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
      
      {/* Top telemetry cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        
        {/* CPU utilization */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>CPU PERFORMANCE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.cpu}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>load</span>
          </div>
          <div style={{ height: '80px', marginTop: '10px', position: 'relative' }}>
            {cpuHistory.length > 1 ? (
              <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <path d={drawAreaPath(cpuHistory)} fill="rgba(99,102,241,0.12)" />
                <path d={drawLinePath(cpuHistory)} fill="none" stroke="#6366f1" strokeWidth="2.5" />
              </svg>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', paddingTop: '30px' }}>Buffering stream data...</div>
            )}
          </div>
        </div>

        {/* Memory utilization */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>MEMORY USAGE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics.memory.percent}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{metrics.memory.used} / {metrics.memory.total} GB</span>
          </div>
          <div style={{ height: '80px', marginTop: '10px', position: 'relative' }}>
            {memHistory.length > 1 ? (
              <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <path d={drawAreaPath(memHistory)} fill="rgba(16,185,129,0.12)" />
                <path d={drawLinePath(memHistory)} fill="none" stroke="#10b981" strokeWidth="2.5" />
              </svg>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', paddingTop: '30px' }}>Buffering stream data...</div>
            )}
          </div>
        </div>

        {/* Disk space */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '8px' }}>DISK CAPACITY</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.disk.percent}% Used</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{metrics.disk.free} GB free of {metrics.disk.total} GB</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '14px' }}>
            <div style={{ background: '#f59e0b', width: `${metrics.disk.percent}%`, height: '100%', transition: 'width 0.4s' }} />
          </div>
        </div>

      </div>

      {/* Middle row: Machine Specifications + Ping Utility */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        
        {/* Machine specs */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            Machine Specifications
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Operating System</span>
              <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{metrics.os.platform} ({metrics.os.release})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>System Architecture</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{metrics.os.arch} processor</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>CPU Cores count</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{metrics.os.cpus} Logical Cores</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Uptime</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{metrics.os.uptime} hours</span>
            </div>
          </div>
        </div>

        {/* Connection health ping checks */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            Connection Health Check
          </h4>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Check TCP host latency directly from this server connection.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              placeholder="e.g. google.com:80"
              value={pingHostVal}
              onChange={e => setPingHostVal(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem' }}
            />
            <button
              onClick={handlePing}
              disabled={pingLoading}
              style={{ padding: '8px 14px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              {pingLoading ? '...' : 'Ping'}
            </button>
          </div>

          {pingResult && (
            <div style={{ padding: '10px', borderRadius: '6px', background: pingResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${pingResult.ok ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: pingResult.ok ? '#34d399' : '#f87171' }}>
                <span>{pingResult.ok ? '✓ Target Reachable' : '✗ Host Unreachable'}</span>
                {pingResult.latencyMs !== undefined && <span>{pingResult.latencyMs}ms</span>}
              </div>
              {pingResult.error && (
                <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '4px' }}>Error: {pingResult.error}</div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Consumption Charts matching reference style */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600 }}>API Token Consumption Analytics</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 30 days</span>
        </div>
        
        <div style={{ position: 'relative', height: '140px', width: '100%' }}>
          <svg viewBox="0 0 1000 140" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="purple-chart-gradient-sm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0,140 L 0,80 L 150,110 L 300,50 L 450,90 L 600,40 L 750,70 L 900,20 L 1000,10 L 1000,140 Z" fill="url(#purple-chart-gradient-sm)" />
            <path d="M 0,80 L 150,110 L 300,50 L 450,90 L 600,40 L 750,70 L 900,20 L 1000,10" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
          </svg>
        </div>
      </div>

    </div>
  );
};

// ─── SystemMonitorView (Hardware Telemetry Dashboard) ─────────────────────────
const SystemMonitorView = ({ backendUrl }: { backendUrl: string }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/system/metrics`);
      const d = await r.json();
      setMetrics(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  if (loading || !metrics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Reading system telemetry...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', padding: '24px', overflowY: 'auto' }} className="animate-fade-in">
      <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>💻</span> System Hardware Monitor
      </h3>

      {/* Telemetry Dials Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* CPU */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
            <span>CPU UTILIZATION</span>
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{metrics.cpu}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#818cf8', width: `${metrics.cpu}%`, height: '100%', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{metrics.os.cpus} Cores ({metrics.os.arch})</span>
        </div>

        {/* RAM */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
            <span>RAM CONSUMPTION</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{metrics.memory.percent}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#10b981', width: `${metrics.memory.percent}%`, height: '100%', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{metrics.memory.used} GB used of {metrics.memory.total} GB</span>
        </div>

        {/* DISK */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
            <span>DISK CAPACITY (C:)</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{metrics.disk.percent}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#f59e0b', width: `${metrics.disk.percent}%`, height: '100%', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{metrics.disk.free} GB free of {metrics.disk.total} GB</span>
        </div>
      </div>

      {/* OS Details */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ margin: 0, color: '#fff', fontSize: '0.88rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>Machine Specifications</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Operating System</span>
            <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{metrics.os.platform} ({metrics.os.release})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>System Uptime</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{metrics.os.uptime} hours</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>CPU Architecture</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{metrics.os.arch} processor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── GitManagerView (Workspace Git Dashboard) ─────────────────────────────────
const GitManagerView = ({ backendUrl, projects }: { backendUrl: string; projects: any[] }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string>('');
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchGitStatus = async (projId: string) => {
    if (!projId) return;
    setLoading(true);
    setGitStatus(null);
    setActiveFile(null);
    setDiffContent('');
    try {
      const r = await fetch(`${backendUrl}/projects/${projId}/git/status`);
      const d = await r.json();
      setGitStatus(d);
    } catch {}
    setLoading(false);
  };

  const loadDiff = async (filePath: string) => {
    if (!selectedProjectId) return;
    setActiveFile(filePath);
    setDiffContent('Loading diff...');
    try {
      const r = await fetch(`${backendUrl}/projects/${selectedProjectId}/git/diff?path=${encodeURIComponent(filePath)}`);
      const d = await r.json();
      setDiffContent(d.diff || '(no changes or file untracked)');
    } catch {
      setDiffContent('Failed to load file diff.');
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !commitMsg.trim()) return;
    setCommitting(true);
    try {
      const r = await fetch(`${backendUrl}/projects/${selectedProjectId}/git/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg }),
      });
      const d = await r.json();
      if (d.success) {
        setCommitMsg('');
        fetchGitStatus(selectedProjectId);
        alert('Committed successfully!');
      } else {
        alert(d.error || 'Commit failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing commit');
    }
    setCommitting(false);
  };

  useEffect(() => {
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
      fetchGitStatus(projects[0].id);
    }
  }, [projects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }} className="animate-fade-in">
      {/* Workspace Selector Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>WORKSPACE</span>
        <select
          value={selectedProjectId}
          onChange={(e) => { setSelectedProjectId(e.target.value); fetchGitStatus(e.target.value); }}
          style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 12px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', outline: 'none' }}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => fetchGitStatus(selectedProjectId)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginLeft: 'auto' }}>⟳ Refresh</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Reading Git state...
        </div>
      ) : gitStatus && !gitStatus.isRepository ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.3)', gap: '12px', padding: '40px' }}>
          <span style={{ fontSize: '2.5rem' }}>🌿</span>
          <span style={{ fontSize: '0.9rem', color: '#fff' }}>No Git Repository Found</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px' }}>This workspace folder does not contain a `.git` setup. Initialize a git repo first.</span>
        </div>
      ) : gitStatus && gitStatus.isRepository ? (
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Files List */}
          <div style={{ width: '260px', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>MODIFIED FILES ({gitStatus.files.length})</span>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {gitStatus.files.length === 0 ? (
                <span style={{ color: '#22c55e', fontSize: '0.8rem', padding: '8px' }}>✓ Working directory clean</span>
              ) : (
                gitStatus.files.map((file: any) => (
                  <div
                    key={file.path}
                    onClick={() => loadDiff(file.path)}
                    style={{
                      display: 'flex', alignItems: 'center', justifySelf: 'stretch', gap: '8px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
                      background: activeFile === file.path ? 'rgba(99,102,241,0.08)' : 'transparent',
                      color: activeFile === file.path ? 'var(--primary)' : '#e2e8f0', transition: 'background 0.2s'
                    }}
                    className="hover-bg-light"
                  >
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px',
                      background: file.status === 'untracked' ? 'rgba(168,85,247,0.15)' : file.status === 'added' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                      color: file.status === 'untracked' ? '#a855f7' : file.status === 'added' ? '#22c55e' : '#f59e0b'
                    }}>{file.rawCode || 'M'}</span>
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>{file.path}</span>
                  </div>
                ))
              )}
            </div>

            {/* Commit Form */}
            {gitStatus.files.length > 0 && (
              <form onSubmit={handleCommit} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Commit message..."
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  required
                  style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                />
                <button type="submit" className="btn-primary" disabled={committing} style={{ fontSize: '0.8rem', padding: '8px' }}>
                  {committing ? 'Committing...' : 'Commit Changes'}
                </button>
              </form>
            )}
          </div>

          {/* Diff View */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f14' }}>
            {activeFile ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>
                  diff --git a/{activeFile} b/{activeFile}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', boxSizing: 'border-box' }}>
                  {diffContent.split('\n').map((line, idx) => {
                    const isAdd = line.startsWith('+');
                    const isDel = line.startsWith('-');
                    return (
                      <div
                        key={idx}
                        style={{
                          color: isAdd ? '#4ade80' : isDel ? '#f87171' : 'rgba(255,255,255,0.6)',
                          background: isAdd ? 'rgba(74,222,128,0.06)' : isDel ? 'rgba(248,113,113,0.06)' : 'transparent',
                          padding: '2px 4px',
                          borderRadius: '2px'
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.2)' }}>
                Select a modified file to view code diffs
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ─── GitHubView (GitHub integration) ──────────────────────────────────────────
const GitHubView = ({ backendUrl }: { backendUrl: string }) => {
  const [config, setConfig] = useState({ configured: false, username: '', oauthConfigured: false, clientId: '' });
  const [tokenInput, setTokenInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingOAuth, setSavingOAuth] = useState(false);

  // Sub-tabs
  const [subTab, setSubTab] = useState<'repos' | 'issues' | 'pulls' | 'actions' | 'releases' | 'search' | 'settings'>('repos');

  // Repos & Selection
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Tab Data States
  const [issues, setIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const [pulls, setPulls] = useState<any[]>([]);
  const [loadingPulls, setLoadingPulls] = useState(false);

  const [actions, setActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const [releases, setReleases] = useState<any[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/github/status`);
      const d = await r.json();
      setConfig(d);
      setClientIdInput(d.clientId || '');
      setClientSecretInput(d.clientSecret || '');
      if (d.configured) {
        setUsernameInput(d.username || '');
        setTokenInput('••••••••••••••••••••');
        fetchRepos();
      } else {
        setSubTab('settings');
      }
    } catch {}
    setLoadingConfig(false);
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput, username: usernameInput })
      });
      const d = await r.json();
      if (d.ok) {
        alert('GitHub Token details updated!');
        fetchStatus();
        setSubTab('repos');
      } else {
        alert('Failed to save configuration.');
      }
    } catch {
      alert('Error updating configuration.');
    }
    setSavingConfig(false);
  };

  const handleSaveOAuth = async () => {
    setSavingOAuth(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/oauth/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientIdInput, clientSecret: clientSecretInput })
      });
      const d = await r.json();
      if (d.ok) {
        alert('OAuth App Credentials Saved!');
        fetchStatus();
      } else {
        alert('Failed to save OAuth credentials.');
      }
    } catch {
      alert('Error saving OAuth details.');
    }
    setSavingOAuth(false);
  };

  const handleOAuthLogin = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/github/oauth/url`);
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        alert('Please configure your Client ID and Client Secret first.');
      }
    } catch {
      alert('Failed to retrieve GitHub login URL. Verify OAuth inputs.');
    }
  };

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/repos`);
      const d = await r.json();
      if (Array.isArray(d)) {
        setRepos(d);
        if (d.length > 0 && !selectedRepo) {
          setSelectedRepo(d[0]);
        }
      }
    } catch {}
    setLoadingRepos(false);
  };

  const fetchIssues = async (repo: any) => {
    if (!repo) return;
    setLoadingIssues(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/repos/${repo.owner.login}/${repo.name}/issues`);
      const d = await r.json();
      if (Array.isArray(d)) setIssues(d);
    } catch {}
    setLoadingIssues(false);
  };

  const fetchPulls = async (repo: any) => {
    if (!repo) return;
    setLoadingPulls(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/repos/${repo.owner.login}/${repo.name}/pulls`);
      const d = await r.json();
      if (Array.isArray(d)) setPulls(d);
    } catch {}
    setLoadingPulls(false);
  };

  const fetchActions = async (repo: any) => {
    if (!repo) return;
    setLoadingActions(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/repos/${repo.owner.login}/${repo.name}/actions`);
      const d = await r.json();
      if (d && Array.isArray(d.workflow_runs)) setActions(d.workflow_runs);
    } catch {}
    setLoadingActions(false);
  };

  const fetchReleases = async (repo: any) => {
    if (!repo) return;
    setLoadingReleases(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/repos/${repo.owner.login}/${repo.name}/releases`);
      const d = await r.json();
      if (Array.isArray(d)) setReleases(d);
    } catch {}
    setLoadingReleases(false);
  };

  const runCodeSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const r = await fetch(`${backendUrl}/automation/github/search?q=${encodeURIComponent(searchQuery)}`);
      const d = await r.json();
      setSearchResults(d);
    } catch {}
    setSearching(false);
  };

  useEffect(() => {
    fetchStatus();
  }, [backendUrl]);

  useEffect(() => {
    if (selectedRepo) {
      if (subTab === 'issues') fetchIssues(selectedRepo);
      if (subTab === 'pulls') fetchPulls(selectedRepo);
      if (subTab === 'actions') fetchActions(selectedRepo);
      if (subTab === 'releases') fetchReleases(selectedRepo);
    }
  }, [selectedRepo, subTab]);

  if (loadingConfig) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Accessing GitHub integration gateway...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', background: '#090a0f', width: '100%' }} className="animate-fade-in">
      {/* GitHub Sub-Sidebar */}
      <div style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🐙</span> GitHub
          </h3>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{config.configured ? `@${config.username}` : 'Not connected'}</span>
        </div>

        {/* Selected Repo Panel */}
        {config.configured && (
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700 }}>Scope Repository</span>
            {selectedRepo ? (
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedRepo.full_name}>
                {selectedRepo.name}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>None Selected</div>
            )}
          </div>
        )}

        {/* Sub-tabs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'repos', label: '📦 Repositories' },
            { id: 'issues', label: '🐛 Issues', disabled: !selectedRepo },
            { id: 'pulls', label: '🔀 Pull Requests', disabled: !selectedRepo },
            { id: 'actions', label: '⚙️ Actions / CI', disabled: !selectedRepo },
            { id: 'releases', label: '🏷️ Releases', disabled: !selectedRepo },
            { id: 'search', label: '🔍 Code Search' },
            { id: 'settings', label: '⚙️ Connection Setup' }
          ].map(t => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                disabled={t.disabled && !selectedRepo && config.configured}
                onClick={() => setSubTab(t.id as any)}
                style={{
                  textAlign: 'left',
                  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: active ? '#818cf8' : t.disabled && !selectedRepo && config.configured ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  cursor: t.disabled && !selectedRepo && config.configured ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Subtab Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Settings View */}
        {subTab === 'settings' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '850px' }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 6px', fontWeight: 600 }}>Connect to GitHub</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                Choose between secure 1-click GitHub OAuth logins or manual Personal Access Tokens.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {/* Method A: OAuth */}
              <div className="glass-panel" style={{ flex: '1 1 350px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#0b0d12' }}>
                <h3 style={{ color: '#fff', fontSize: '0.92rem', margin: 0, fontWeight: 600 }}>Option 1: Sign in via GitHub OAuth</h3>
                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Create an OAuth application in your GitHub Settings (Developer settings to OAuth Apps). Set Authorization Callback URL to: <code>http://localhost:3005/automation/github/callback</code>.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Client ID</label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="Enter OAuth Client ID..."
                      style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Client Secret</label>
                    <input
                      type="password"
                      value={clientSecretInput}
                      onChange={(e) => setClientSecretInput(e.target.value)}
                      placeholder="Enter OAuth Client Secret..."
                      style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={handleSaveOAuth} disabled={savingOAuth} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                    Save Credentials
                  </button>
                  <button onClick={handleOAuthLogin} disabled={!config.oauthConfigured && !(clientIdInput && clientSecretInput)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔑 Connect GitHub Account
                  </button>
                </div>
              </div>

              {/* Method B: Personal Access Token */}
              <div className="glass-panel" style={{ flex: '1 1 350px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#0b0d12' }}>
                <h3 style={{ color: '#fff', fontSize: '0.92rem', margin: 0, fontWeight: 600 }}>Option 2: Personal Access Token (Classic)</h3>
                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Paste a Personal Access Token directly to connect instantly without setting up developer keys.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Access Token (PAT)</label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_••••••••••••••••••••••••••••••••"
                      style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Username</label>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="GitHub username..."
                      style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <button className="btn-primary" onClick={handleSaveConfig} disabled={savingConfig} style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'fit-content', marginTop: '10px' }}>
                  Save token details
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Repositories Tab */}
        {subTab === 'repos' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>GitHub Repositories</span>
              <button onClick={fetchRepos} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loadingRepos ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Loading repositories...</div>
              ) : repos.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No repositories found. Ensure your token is configured.</div>
              ) : (
                repos.map(r => {
                  const active = selectedRepo?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRepo(r)}
                      style={{
                        padding: '14px 18px',
                        background: active ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
                        border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{r.name}</span>
                        <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.description || 'No description provided.'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.76rem', color: 'rgba(255,255,255,0.5)' }}>
                        {r.language && <span style={{ color: '#818cf8' }}>● {r.language}</span>}
                        <span>⭐ {r.stargazers_count}</span>
                        {active && <span style={{ color: '#4ade80', fontWeight: 600 }}>Active Scope</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Issues Tab */}
        {subTab === 'issues' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Issues for {selectedRepo?.name}</span>
              <button onClick={() => fetchIssues(selectedRepo)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingIssues ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Loading issues...</div>
              ) : issues.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No issues found in this repository.</div>
              ) : (
                issues.map(issue => (
                  <a
                    key={issue.id}
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                    className="hover-panel"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                      <span style={{ color: issue.state === 'open' ? '#4ade80' : '#a78bfa', fontSize: '1rem' }}>
                        {issue.state === 'open' ? '🟢' : '🟣'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{issue.title}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          #{issue.number} opened by {issue.user?.login}
                        </span>
                      </div>
                    </div>
                    {issue.labels?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {issue.labels.slice(0, 2).map((l: any) => (
                          <span key={l.id} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: `#${l.color}`, color: '#000', fontWeight: 600 }}>
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* Pull Requests Tab */}
        {subTab === 'pulls' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Pull Requests for {selectedRepo?.name}</span>
              <button onClick={() => fetchPulls(selectedRepo)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingPulls ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Loading pull requests...</div>
              ) : pulls.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No pull requests found.</div>
              ) : (
                pulls.map(pr => (
                  <a
                    key={pr.id}
                    href={pr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                    className="hover-panel"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                      <span style={{ color: pr.state === 'open' ? '#22c55e' : '#a78bfa', fontSize: '1rem' }}>
                        {pr.state === 'open' ? '🔀' : '🟣'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{pr.title}</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                          #{pr.number} by {pr.user?.login} · {pr.head?.ref} → {pr.base?.ref}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: pr.state === 'open' ? 'rgba(34,197,94,0.1)' : 'rgba(167,139,250,0.1)', color: pr.state === 'open' ? '#22c55e' : '#a78bfa' }}>
                      {pr.state}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* Actions / CI Tab */}
        {subTab === 'actions' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Workflow Runs (CI) for {selectedRepo?.name}</span>
              <button onClick={() => fetchActions(selectedRepo)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loadingActions ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Loading actions...</div>
              ) : actions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No workflow runs detected.</div>
              ) : (
                actions.map(run => {
                  const isSuccess = run.conclusion === 'success';
                  const isFailure = run.conclusion === 'failure';
                  return (
                    <a
                      key={run.id}
                      href={run.html_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                      className="hover-panel"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                        <span style={{ color: isSuccess ? '#4ade80' : isFailure ? '#f87171' : '#fbbf24', fontSize: '1rem' }}>
                          {isSuccess ? '✅' : isFailure ? '❌' : '⏳'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
                            {run.head_commit?.message || 'Workflow Run'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                            {run.name} #{run.run_number} · Triggered by {run.triggering_actor?.login}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: isSuccess ? '#4ade80' : isFailure ? '#f87171' : '#fbbf24' }}>
                        {run.status === 'completed' ? run.conclusion : run.status}
                      </span>
                    </a>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Releases Tab */}
        {subTab === 'releases' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>Releases for {selectedRepo?.name}</span>
              <button onClick={() => fetchReleases(selectedRepo)} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Refresh</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingReleases ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Loading releases...</div>
              ) : releases.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No releases tagged in this repository.</div>
              ) : (
                releases.map(rel => (
                  <div
                    key={rel.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 600 }}>{rel.name || rel.tag_name}</span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        {rel.tag_name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                      {rel.body || 'No release notes.'}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                      Published on {new Date(rel.published_at).toLocaleDateString()} by {rel.author?.login}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Code Search Tab */}
        {subTab === 'search' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>GitHub Global Code Search</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runCodeSearch()}
                  placeholder="e.g. org:my-org path:package.json next"
                  style={{ flex: 1, background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
                />
                <button onClick={runCodeSearch} disabled={searching} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searching ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>Searching GitHub index...</div>
              ) : !searchResults ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>
                  Enter a keyword query to search across repositories (e.g., <code>filename:schema.prisma project</code>).
                </div>
              ) : searchResults.items?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '20px' }}>No matches found.</div>
              ) : (
                searchResults.items?.map((item: any) => (
                  <a
                    key={item.sha}
                    href={item.html_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    className="hover-panel"
                  >
                    <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>{item.path}</span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      In Repository: {item.repository?.full_name}
                    </span>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DatabaseExplorerView (Prisma Studio integration) ─────────────────────────
const DatabaseExplorerView = ({ backendUrl, projects }: { backendUrl: string; projects: any[] }) => {
  const [running, setRunning] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('orchestrator');
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/prisma/status`);
      const d = await r.json();
      setRunning(d.running ? 'online' : 'offline');
    } catch {
      setRunning('offline');
    }
  };

  const startPrisma = async () => {
    setLoading(true);
    try {
      await fetch(`${backendUrl}/automation/prisma/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId })
      });
      // Poll
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const r = await fetch(`${backendUrl}/automation/prisma/status`);
        const d = await r.json();
        if (d.running) {
          clearInterval(poll);
          setRunning('online');
          setLoading(false);
        } else if (attempts >= 10) {
          clearInterval(poll);
          setLoading(false);
          alert('Prisma Studio failed to bind to port 5555. Verify your schema path.');
        }
      }, 1500);
    } catch { setLoading(false); }
  };

  const stopPrisma = async () => {
    setLoading(true);
    await fetch(`${backendUrl}/automation/prisma/stop`, { method: 'POST' });
    setRunning('offline');
    setLoading(false);
  };

  useEffect(() => { checkStatus(); }, [backendUrl]);

  if (running === 'checking' || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Tuning Database connection...
      </div>
    );
  }

  if (running === 'offline') {
    return (
      <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px', background: '#090a0f' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2.2rem' }}>🗄️</span>
        </div>
        <div style={{ textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Prisma Studio Offline</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
            Select a workspace schema and start the database explorer to browse, query, and edit tables on your browser.
          </p>
        </div>

        {/* Database Selector Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '260px' }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Target Database Schema</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', outline: 'none', width: '100%' }}
          >
            <option value="orchestrator">Orchestrator Database (Local)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} Database</option>)}
          </select>
        </div>

        <button className="btn-primary" onClick={startPrisma} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 24px', marginTop: '10px' }}>
          Start Prisma Studio
        </button>
      </div>
    );
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, fontSize: '0.78rem' }}>
        <div style={{ width: '7.5px', height: '7.5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>Prisma Studio active · http://localhost:5555</span>
        <button onClick={stopPrisma} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', padding: '2px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>
          ■ Stop Service
        </button>
      </div>
      <iframe
        src="http://localhost:5555"
        style={{ flex: 1, width: '100%', border: 'none' }}
        title="Prisma Studio Database Explorer"
      />
    </div>
  );
};

// ─── ApiClientView (Mini Postman request panel) ──────────────────────────────
const ApiClientView = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState<Array<{ k: string; v: string }>>([{ k: 'Content-Type', v: 'application/json' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [resTime, setResTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setResStatus(null);
    setResTime(null);
    const start = Date.now();
    try {
      const headerMap: Record<string, string> = {};
      headers.forEach(h => { if (h.k.trim()) headerMap[h.k] = h.v; });

      const options: RequestInit = {
        method,
        headers: headerMap,
        body: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body ? body : undefined
      };

      const res = await fetch(url, options);
      const latency = Date.now() - start;
      setResTime(latency);
      setResStatus(res.status);

      const text = await res.text();
      try {
        setResponse(JSON.parse(text));
      } catch {
        setResponse(text || '(empty body response)');
      }
    } catch (e: any) {
      setResponse({ error: e.message });
      setResStatus(500);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, background: '#090a0f' }} className="animate-fade-in">
      {/* Request URL Input Bar */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 14px', color: '#818cf8', fontWeight: 'bold', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
        >
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter request URL..."
          style={{ flex: 1, background: '#16181d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 14px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
        />
        <button onClick={handleSend} disabled={loading} className="btn-primary" style={{ padding: '8px 24px', fontSize: '0.82rem' }}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Pane Layout: Edit params on left, response on right */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Params Pane */}
        <div style={{ width: '40%', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', background: '#0b0d12' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Headers</span>
            {headers.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Key"
                  value={h.k}
                  onChange={(e) => {
                    const next = [...headers];
                    next[i].k = e.target.value;
                    setHeaders(next);
                  }}
                  style={{ flex: 1, background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '6px 10px', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={h.v}
                  onChange={(e) => {
                    const next = [...headers];
                    next[i].v = e.target.value;
                    setHeaders(next);
                  }}
                  style={{ flex: 1, background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '6px 10px', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
                />
                <button
                  onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '5px', padding: '0 8px', color: '#ef4444', cursor: 'pointer' }}
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => setHeaders([...headers, { k: '', v: '' }])}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '5px', padding: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '0.75rem', marginTop: '4px' }}
            >
              + Add Header Row
            </button>
          </div>

          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Body Content</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="JSON body..."
                style={{ flex: 1, background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '10px', color: '#fff', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', outline: 'none', resize: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Response Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0d0f14' }}>
          {response ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 20px', background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>RESPONSE</span>
                <span style={{ fontSize: '0.75rem', color: resStatus && resStatus < 400 ? '#22c55e' : '#ef4444', background: resStatus && resStatus < 400 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Status: {resStatus}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>Uptime: {resTime}ms</span>
              </div>
              <pre style={{ flex: 1, overflow: 'auto', margin: 0, padding: '16px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#a5f3fc', lineHeight: 1.5 }}>
                {typeof response === 'object' ? JSON.stringify(response, null, 2) : response}
              </pre>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem' }}>
              {loading ? 'Fetching resource...' : 'Send a request to inspect response logs here'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ─── IntelligenceView (AI Memory Layer Manager) ────────────────────────────────
const IntelligenceView = ({ backendUrl }: { backendUrl: string }) => {
  const [intel, setIntel] = useState<any>({
    profile: { codingStyle: '', preferences: '' },
    knowledgeBase: [],
    prompts: [],
    templates: [],
    rules: []
  });
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'rules' | 'prompts' | 'templates' | 'kb' | 'telegram'>('profile');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Auto-learning States
  const [autoLearning, setAutoLearning] = useState(false);
  const [extractedSuggestions, setExtractedSuggestions] = useState<any[]>([]);
  const [learnMessage, setLearnMessage] = useState('');

  // Telegram Config States
  const [telegramConfig, setTelegramConfig] = useState({ token: '', allowedChatId: '', active: false });
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [tgLoading, setTgLoading] = useState(true);
  const [tgSaving, setTgSaving] = useState(false);

  const fetchTelegram = async () => {
    try {
      const r = await fetch(`${backendUrl}/telegram/status`);
      const d = await r.json();
      setTelegramStatus(d);
      setTelegramConfig({
        token: d.tokenConfigured ? '••••••••••••••••••••' : '',
        allowedChatId: d.allowedChatId === 'Not set' ? '' : d.allowedChatId,
        active: d.enabled
      });
    } catch {}
    setTgLoading(false);
  };

  const handleSaveTelegram = async () => {
    setTgSaving(true);
    try {
      const r = await fetch(`${backendUrl}/telegram/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramConfig)
      });
      const d = await r.json();
      if (d.ok) {
        alert('Telegram bot configuration saved successfully!');
        fetchTelegram();
      } else {
        alert('Failed to save Telegram bot config.');
      }
    } catch {
      alert('Error updating Telegram bot details.');
    }
    setTgSaving(false);
  };

  const toggleTelegramBot = async (val: boolean) => {
    try {
      await fetch(`${backendUrl}/telegram/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: val })
      });
      fetchTelegram();
    } catch {
      alert('Error toggling Telegram Bot state.');
    }
  };

  const fetchIntel = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/intelligence`);
      const d = await r.json();
      setIntel(d);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSyncing(true);
    try {
      await fetch(`${backendUrl}/automation/intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intel)
      });
      alert('AI Memory Layer updated and synchronized across all active agent threads.');
    } catch {
      alert('Failed to synchronize memory layer.');
    }
    setSyncing(false);
  };

  const runAutoLearn = async () => {
    setAutoLearning(true);
    setLearnMessage('');
    try {
      const r = await fetch(`${backendUrl}/automation/intelligence/auto-learn`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        setExtractedSuggestions(d.extracted || []);
        setLearnMessage(d.message);
      } else {
        alert(d.error || 'Failed to analyze system telemetry.');
      }
    } catch {
      alert('Error connecting to active telemetry logs.');
    }
    setAutoLearning(false);
  };

  const approveSuggestion = (sug: any) => {
    setIntel((prev: any) => ({
      ...prev,
      rules: [...(prev.rules || []), { ...sug, id: `rule-${Date.now()}` }]
    }));
    setExtractedSuggestions(prev => prev.filter(x => x.id !== sug.id));
  };

  useEffect(() => {
    fetchIntel();
    fetchTelegram();
  }, [backendUrl]);


  const updateProfile = (key: 'codingStyle' | 'preferences', val: string) => {
    setIntel((prev: any) => ({
      ...prev,
      profile: { ...prev.profile, [key]: val }
    }));
  };

  const addGridItem = (tab: 'rules' | 'prompts' | 'templates' | 'knowledgeBase') => {
    const newItem = { id: `item-${Date.now()}`, title: 'New Item', content: 'Enter guidelines/contents...' };
    setIntel((prev: any) => ({
      ...prev,
      [tab]: [...(prev[tab] || []), newItem]
    }));
  };

  const updateGridItem = (tab: 'rules' | 'prompts' | 'templates' | 'knowledgeBase', id: string, key: 'title' | 'content', val: string) => {
    setIntel((prev: any) => ({
      ...prev,
      [tab]: prev[tab].map((item: any) => item.id === id ? { ...item, [key]: val } : item)
    }));
  };

  const deleteGridItem = (tab: 'rules' | 'prompts' | 'templates' | 'knowledgeBase', id: string) => {
    setIntel((prev: any) => ({
      ...prev,
      [tab]: prev[tab].filter((item: any) => item.id !== id)
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', gap: '10px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Reading intelligence registers...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, background: '#090a0f' }} className="animate-fade-in">
      {/* Top action header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span style={{ fontSize: '1.25rem' }}>🧠</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Intelligence (AI Memory Layer)</span>
        
        <button
          onClick={runAutoLearn}
          disabled={autoLearning}
          className="btn-secondary"
          style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {autoLearning ? 'Analyzing Logs...' : '🤖 Extract Telemetry Learning'}
        </button>

        <button
          onClick={handleSave}
          disabled={syncing}
          className="btn-primary"
          style={{ fontSize: '0.78rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {syncing ? 'Syncing...' : '💾 Sync with Agents'}
        </button>
      </div>


      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Inner sub tab navigation sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0b0d12', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, paddingLeft: '8px', marginBottom: '6px', letterSpacing: '0.05em' }}>REGISTERS</span>
          
          {[
            { id: 'profile', label: '🧠 Memory Profile', icon: '👤' },
            { id: 'rules', label: '📜 Rules & Instructions', icon: '📝' },
            { id: 'prompts', label: '⚡ Saved Prompts', icon: '💬' },
            { id: 'templates', label: '🧬 Code Templates', icon: '🛠' },
            { id: 'kb', label: '💡 Knowledge Base', icon: '📚' },
            { id: 'telegram', label: '💬 Telegram Gateway', icon: '🤖' }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
                background: activeSubTab === tab.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: activeSubTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.2s', fontWeight: activeSubTab === tab.id ? 600 : 400
              }}
              className="hover-bg-light"
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Content detail panels */}
        <div style={{ flex: 1, background: '#0d0f14', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Telemetry Learned Suggestions Panel */}
          {extractedSuggestions.length > 0 && (
            <div className="glass-panel animate-fade-in" style={{ padding: '20px', border: '1px dashed var(--primary)', background: 'rgba(99,102,241,0.03)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🤖</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>Auto-Learned Suggestions ({extractedSuggestions.length})</span>
                <button
                  onClick={() => setExtractedSuggestions([])}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Dismiss All
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {extractedSuggestions.map(sug => (
                  <div key={sug.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{sug.title}</span>
                      <button
                        onClick={() => approveSuggestion(sug)}
                        className="btn-primary"
                        style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                      >
                        📥 Approve & Import
                      </button>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{sug.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {learnMessage && extractedSuggestions.length === 0 && (
            <div className="glass-panel animate-fade-in" style={{ padding: '12px 16px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span>
              <span>{learnMessage}</span>
            </div>
          )}

          {activeSubTab === 'profile' && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>My Coding Style Constraints</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Guides codegen libraries, design systems, and abstraction structures:</span>
                <textarea
                  value={intel.profile.codingStyle}
                  onChange={(e) => updateProfile('codingStyle', e.target.value)}
                  style={{ minHeight: '140px', background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '12px', color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                  placeholder="e.g. - TypeScript&#10;- NestJS&#10;- Clean Architecture"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>My Communication & Logic Preferences</label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Modulates response style, detail level, and shortcut rules:</span>
                <textarea
                  value={intel.profile.preferences}
                  onChange={(e) => updateProfile('preferences', e.target.value)}
                  style={{ minHeight: '140px', background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '12px', color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                  placeholder="e.g. - Explain simply&#10;- Use production patterns&#10;- Avoid shortcuts"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Custom Agent Rules</span>
                <button onClick={() => addGridItem('rules')} className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>+ Add Rule</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(intel.rules || []).map((item: any) => (
                  <div key={item.id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGridItem('rules', item.id, 'title', e.target.value)}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, padding: '2px 0', outline: 'none' }}
                      />
                      <button onClick={() => deleteGridItem('rules', item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}>✕</button>
                    </div>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateGridItem('rules', item.id, 'content', e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '5px', padding: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', minHeight: '60px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'prompts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Saved Developer Prompts</span>
                <button onClick={() => addGridItem('prompts')} className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>+ Add Prompt</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(intel.prompts || []).map((item: any) => (
                  <div key={item.id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGridItem('prompts', item.id, 'title', e.target.value)}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
                      />
                      <button onClick={() => deleteGridItem('prompts', item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}>✕</button>
                    </div>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateGridItem('prompts', item.id, 'content', e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '5px', padding: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', minHeight: '60px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Boilerplate Code Templates</span>
                <button onClick={() => addGridItem('templates')} className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>+ Add Template</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(intel.templates || []).map((item: any) => (
                  <div key={item.id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGridItem('templates', item.id, 'title', e.target.value)}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
                      />
                      <button onClick={() => deleteGridItem('templates', item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}>✕</button>
                    </div>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateGridItem('templates', item.id, 'content', e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '5px', padding: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', minHeight: '120px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'kb' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Custom Knowledge Base entries</span>
                <button onClick={() => addGridItem('knowledgeBase')} className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 12px' }}>+ Add Entry</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(intel.knowledgeBase || []).map((item: any) => (
                  <div key={item.id} className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateGridItem('knowledgeBase', item.id, 'title', e.target.value)}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.82rem', fontWeight: 600, outline: 'none' }}
                      />
                      <button onClick={() => deleteGridItem('knowledgeBase', item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem' }}>✕</button>
                    </div>
                    <textarea
                      value={item.content}
                      onChange={(e) => updateGridItem('knowledgeBase', item.id, 'content', e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '5px', padding: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', minHeight: '60px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'telegram' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600 }}>Telegram Bot Gateway Settings</span>
                {telegramStatus && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: telegramStatus.active ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${telegramStatus.active ? '#22c55e' : '#ef4444'}` }} />
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                      Status: {telegramStatus.active ? 'Active' : 'Stopped'}
                    </span>
                  </div>
                )}
              </div>

              {/* Bot Config Card */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>Telegram Bot Token</label>
                  <input
                    type="password"
                    placeholder="Enter bot token from @BotFather..."
                    value={telegramConfig.token}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, token: e.target.value })}
                    style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>Allowed Chat ID</label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Securely locks the bot commands to your chat thread only. Leave blank to capture the first message.</span>
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={telegramConfig.allowedChatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, allowedChatId: e.target.value })}
                    style={{ background: '#16181d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                  <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={telegramConfig.active}
                      onChange={(e) => toggleTelegramBot(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Enable Bot Service
                  </label>
                </div>

                <button
                  onClick={handleSaveTelegram}
                  disabled={tgSaving}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem', padding: '8px 20px', marginTop: '6px' }}
                >
                  {tgSaving ? 'Saving...' : 'Save Config & Restart'}
                </button>
              </div>

              {/* Bot commands guide */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>Bot Command Guide</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
                  <div>• <b>/status</b> - Get active server port bindings & telemetry.</div>
                  <div>• <b>/projects</b> - Display registered workspace IDs & paths.</div>
                  <div>• <b>/docker</b> - Check running docker compose containers.</div>
                  <div>• <b>/docker_start</b> - Launch Docker Desktop daemon background tasks.</div>
                  <div>• <b>/hermes select [id] deploy</b> - Build projects remotely inside Telegram chat.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AutomationView ─────────────────────────────────────────────────────────────
const AutomationView = ({ backendUrl }: { backendUrl: string }) => {

  const [daemonRunning, setDaemonRunning] = useState<'checking' | 'running' | 'offline' | 'launching'>('checking');
  const [status, setStatus] = useState<'checking' | 'starting' | 'running' | 'offline'>('checking');
  const [containers, setContainers] = useState<any[]>([]);
  const [dockerError, setDockerError] = useState('');
  const [showDock, setShowDock] = useState(false);

  const checkDaemon = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/docker/daemon`);
      const d = await r.json();
      return d.running;
    } catch { return false; }
  };

  const checkHealth = () =>
    fetch(`${backendUrl}/automation/health`)
      .then(r => r.json())
      .then(data => data.running)
      .catch(() => false);

  const fetchContainers = async () => {
    try {
      const r = await fetch(`${backendUrl}/automation/docker/status`);
      const data = await r.json();
      setContainers(data.containers || []);
    } catch { setContainers([]); }
  };

  const launchDockerDesktop = async () => {
    setDaemonRunning('launching');
    setDockerError('');
    try {
      await fetch(`${backendUrl}/automation/docker/launch`, { method: 'POST' });
      // Poll daemon status
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const up = await checkDaemon();
        if (up) {
          clearInterval(poll);
          setDaemonRunning('running');
          startDocker();
        } else if (attempts >= 20) {
          clearInterval(poll);
          setDaemonRunning('offline');
          setDockerError('Failed to start Docker daemon. Please run Docker Desktop manually.');
        }
      }, 2500);
    } catch (e: any) {
      setDaemonRunning('offline');
      setDockerError(e.message);
    }
  };

  const startDocker = async () => {
    setStatus('starting');
    setDockerError('');
    try {
      await fetch(`${backendUrl}/automation/docker/start`, { method: 'POST' });
      // Poll until n8n is reachable (up to 30s)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const up = await checkHealth();
        if (up) { clearInterval(poll); setStatus('running'); fetchContainers(); }
        else if (attempts >= 15) { clearInterval(poll); setStatus('offline'); setDockerError('n8n started but is not responding. Check Docker logs.'); }
      }, 2000);
    } catch (e: any) {
      setStatus('offline');
      setDockerError(e.message);
    }
  };

  const stopDocker = async () => {
    await fetch(`${backendUrl}/automation/docker/stop`, { method: 'POST' });
    setStatus('offline');
    setContainers([]);
  };

  const init = async () => {
    const isDaemonUp = await checkDaemon();
    if (!isDaemonUp) {
      setDaemonRunning('offline');
      return;
    }
    setDaemonRunning('running');
    const up = await checkHealth();
    if (up) { setStatus('running'); fetchContainers(); }
    else setStatus('offline');
  };

  useEffect(() => { init(); }, [backendUrl]);

  // Docker status bar shown when running
  const DockerBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, fontSize: '0.78rem' }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
      <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>Docker · n8n running</span>
      <button onClick={() => setShowDock(d => !d)} style={{ marginLeft: '4px', background: showDock ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
        {showDock ? '▲ Hide' : '▼ Containers'}
      </button>
      <button onClick={stopDocker} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', padding: '2px 10px', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem' }}>
        ■ Stop
      </button>
    </div>
  );

  const ContainerPanel = () => (
    <div style={{ background: '#0b0d12', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
      {containers.length === 0
        ? <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>No containers found</span>
        : containers.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.running ? '#22c55e' : c.paused ? '#f59e0b' : '#6b7280', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#fff', flex: 1 }}>{c.service || c.name}</span>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{c.status}</span>
            {c.ports && <span style={{ fontSize: '0.7rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{c.ports.split(',')[0]}</span>}
          </div>
        ))
      }
    </div>
  );

  if (daemonRunning === 'checking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span style={{ fontSize: '0.9rem' }}>Checking Docker Daemon...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (daemonRunning === 'launching') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span style={{ color: '#1e88e5', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>Starting Docker Desktop...</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Waiting for Docker daemon to become responsive</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (daemonRunning === 'offline') {
    return (
      <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="8" width="4" height="3" rx="0.5"/>
            <rect x="12" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="4" width="4" height="3" rx="0.5"/>
            <rect x="12" y="4" width="4" height="3" rx="0.5"/>
            <path d="M2 11.5s0 3.5 9 3.5 11-3.5 11-3.5" strokeWidth="1.2"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600 }}>Docker Daemon is Offline</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 8px', lineHeight: 1.6 }}>
            The Docker engine is not running. Launch Docker Desktop to use containers.
          </p>
          {dockerError && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 8px', fontFamily: 'var(--font-mono)' }}>{dockerError}</p>}
        </div>
        <button className="btn-primary" onClick={launchDockerDesktop} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Docker Desktop
        </button>
      </div>
    );
  }

  if (status === 'checking') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-secondary)' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span style={{ fontSize: '0.9rem' }}>Checking n8n status...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === 'starting') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span style={{ color: '#22c55e', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>Starting Docker containers...</span>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Running docker compose up -d</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (status === 'offline') return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '20px', padding: '40px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'rgba(30,136,229,0.1)', border: '1px solid rgba(30,136,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1e88e5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="8" width="4" height="3" rx="0.5"/>
          <rect x="12" y="8" width="4" height="3" rx="0.5"/><rect x="7" y="4" width="4" height="3" rx="0.5"/>
          <rect x="12" y="4" width="4" height="3" rx="0.5"/>
          <path d="M2 11.5s0 3.5 9 3.5 11-3.5 11-3.5" strokeWidth="1.2"/>
          <path d="M21 11c1-0.5 2-2 1-4-1 1-2.5 1-3 1" strokeWidth="1.2"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h3 style={{ color: '#fff', margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 600 }}>n8n containers are stopped</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 8px', lineHeight: 1.6 }}>
          Click <strong style={{ color: '#22c55e' }}>Start Docker</strong> to automatically launch the containers and open n8n.
        </p>
        {dockerError && <p style={{ color: '#ef4444', fontSize: '0.78rem', margin: '4px 0 8px', fontFamily: 'var(--font-mono)' }}>{dockerError}</p>}
      </div>
      <button className="btn-primary" onClick={startDocker} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 24px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Start Docker
      </button>
    </div>
  );

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
      <DockerBar />
      {showDock && <ContainerPanel />}
      <iframe
        src="http://localhost:5678"
        style={{ flex: 1, width: '100%', border: 'none' }}
        title="System Automation (n8n)"
        allow="same-origin"
      />
    </div>
  );
};


// Mock Analytics Dashboard matching reference image
const AnalyticsDashboard = ({ projectsCount }: { projectsCount: number }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* Metrics Cards */}
    <div className="analytics-metrics-grid">
      <div className="metric-card accented">
        <div className="metric-title">Active projects</div>
        <div className="metric-value">
          {projectsCount} <span className="metric-trend up">↗ 12%</span>
        </div>
        <div className="metric-subtext">vs. 2 last period</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Total Agent Runs</div>
        <div className="metric-value">
          142 <span className="metric-trend up">↗ 29%</span>
        </div>
        <div className="metric-subtext">vs. 110 last period</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">Error Rate</div>
        <div className="metric-value">
          1.4% <span className="metric-trend down">↘ 2%</span>
        </div>
        <div className="metric-subtext">vs. 3.4% last period</div>
      </div>
      <div className="metric-card">
        <div className="metric-title">API Response Time</div>
        <div className="metric-value">
          840ms <span className="metric-trend up">↗ 10%</span>
        </div>
        <div className="metric-subtext">vs. 920ms last period</div>
      </div>
    </div>

    {/* Purple Accent Line Chart */}
    <div className="analytics-chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>API Token Consumption</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last 30 days</span>
      </div>
      
      <div style={{ position: 'relative', height: '240px', width: '100%' }}>
        <svg viewBox="0 0 1000 240" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="purple-chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <line x1="0" y1="40" x2="1000" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="1000" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="140" x2="1000" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="190" x2="1000" y2="190" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />

          <path
            d="M 0 180 Q 150 160 250 175 T 500 130 T 750 85 T 1000 70 L 1000 240 L 0 240 Z"
            fill="url(#purple-chart-gradient)"
          />

          <path
            d="M 0 180 Q 150 160 250 175 T 500 130 T 750 85 T 1000 70"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          <circle cx="750" cy="85" r="6" fill="var(--primary)" stroke="#0a0b0d" strokeWidth="2" />
          <line x1="750" y1="85" x2="750" y2="240" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        </svg>
        
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '710px',
          background: '#16181d',
          border: '1px solid var(--panel-border)',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '0.75rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>10/25: </span>
          <span style={{ color: 'var(--primary)', fontWeight: '700' }}>242k Tokens</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>09/25</span>
        <span>10/01</span>
        <span>10/07</span>
        <span>10/13</span>
        <span>10/19</span>
        <span>10/25</span>
      </div>
    </div>

    <div className="analytics-double-grid">
      <div className="analytics-list-card">
        <h3 className="analytics-list-title">Workspace Code Volume</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Ratio</th>
              <th>Total Files</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Orchestrator Backend</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: '85%' }}></div></div>
                  <span>85%</span>
                </div>
              </td>
              <td>124 files</td>
            </tr>
            <tr>
              <td>Orchestrator Frontend</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: '65%' }}></div></div>
                  <span>65%</span>
                </div>
              </td>
              <td>86 files</td>
            </tr>
            <tr>
              <td>Dev Tools (Prisma)</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: '30%' }}></div></div>
                  <span>30%</span>
                </div>
              </td>
              <td>12 files</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="analytics-list-card">
        <h3 className="analytics-list-title">Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { user: '🤖 Hermes', action: 'completed workspace setup', time: 'Just now' },
            { user: '💻 OpenCode', action: 'installed prisma client package', time: '12 mins ago' },
            { user: '📁 Git', action: 'committed changes to origin/main', time: '1 hour ago' },
            { user: '🤖 Hermes', action: 'compiled frontend components', time: '2 hours ago' }
          ].map((act, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{act.user}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{act.action}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AgentCockpit = ({ agent, backendUrl }: { agent: AgentShortcut; backendUrl: string }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [savedPath, setSavedPath] = useState<string | null>(null);

  // Execution mode state
  const [execMode, setExecMode] = useState<'template' | 'llm' | 'n8n'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('orchestrator_exec_mode') as 'template' | 'llm' | 'n8n') || 'template';
    }
    return 'template';
  });
  const [llmProvider, setLlmProvider] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orchestrator_llm_provider') || 'openai';
    }
    return 'openai';
  });
  const [llmModel, setLlmModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orchestrator_llm_model') || 'gpt-4o';
    }
    return 'gpt-4o';
  });
  const [llmApiKey, setLlmApiKey] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('orchestrator_llm_api_key') || '';
    return '';
  });
  const [ollamaUrl, setOllamaUrl] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('orchestrator_ollama_url') || 'http://localhost:11434/v1';
    return 'http://localhost:11434/v1';
  });
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`orchestrator_n8n_webhook_${agent.id}`);
      if (!saved || saved.trim() === '' || saved === 'http://localhost:5678/webhook/agent-run') {
        return 'http://localhost:5678/webhook/ixRVFXuJdYEgE7EA/webhook/agent-run';
      }
      return saved;
    }
    return 'http://localhost:5678/webhook/ixRVFXuJdYEgE7EA/webhook/agent-run';
  });

  // Save to localStorage when settings change
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_exec_mode', execMode);
  }, [execMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_provider', llmProvider);
  }, [llmProvider]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_model', llmModel);
  }, [llmModel]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('orchestrator_ollama_url', ollamaUrl);
  }, [ollamaUrl]);

  // Model options per provider
  const modelOptions: Record<string, { label: string; value: string }[]> = {
    openai: [
      { label: 'GPT-4o', value: 'gpt-4o' },
      { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
      { label: 'GPT-4.1', value: 'gpt-4.1' },
      { label: 'o1', value: 'o1' },
      { label: 'o3 mini', value: 'o3-mini' },
    ],
    gemini: [
      { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
      { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
      { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    ],
    claude: [
      { label: 'Claude Opus 4.5', value: 'claude-opus-4-5' },
      { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5' },
      { label: 'Claude Haiku 3.5', value: 'claude-haiku-3-5' },
    ],
    mistral: [
      { label: 'Mistral Large', value: 'mistral-large-latest' },
      { label: 'Mistral Small', value: 'mistral-small-latest' },
      { label: 'Codestral', value: 'codestral-latest' },
    ],
    groq: [
      { label: 'Llama 3.3 70B', value: 'llama-3.3-70b-versatile' },
      { label: 'Llama 3.1 8B', value: 'llama-3.1-8b-instant' },
      { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
      { label: 'Gemma 2 9B', value: 'gemma2-9b-it' },
    ],
    deepseek: [
      { label: 'DeepSeek V3 (Chat)', value: 'deepseek-chat' },
      { label: 'DeepSeek R1 (Reasoner)', value: 'deepseek-reasoner' },
    ],
    ollama: [
      { label: 'Llama 3', value: 'llama3' },
      { label: 'DeepSeek R1', value: 'deepseek-r1' },
      { label: 'Mistral', value: 'mistral' },
      { label: 'Phi 3', value: 'phi3' },
    ],
    openrouter: [
      { label: 'Gemini 2.5 Pro', value: 'google/gemini-2.5-pro' },
      { label: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3.5-sonnet' },
      { label: 'DeepSeek R1', value: 'deepseek/deepseek-r1' },
      { label: 'Llama 3.3 70B', value: 'meta-llama/llama-3.3-70b-instruct' },
    ],
    together: [
      { label: 'Llama 3.3 70B Turbo', value: 'meta-llama/Llama-3.3-70b-instruct-turbo' },
      { label: 'DeepSeek R1', value: 'deepseek-ai/DeepSeek-R1' },
      { label: 'Mixtral 8x7B', value: 'mistralai/Mixtral-8x7B-Instruct-v0.1' },
    ],
    perplexity: [
      { label: 'Sonar Reasoning', value: 'sonar-reasoning' },
      { label: 'Sonar Standard', value: 'sonar' },
    ],
    cohere: [
      { label: 'Command R+', value: 'command-r-plus' },
      { label: 'Command R', value: 'command-r' },
      { label: 'Command', value: 'command' },
    ],
  };

  // Reset state when agent changes
  useEffect(() => {
    setSelectedAction(null);
    setPrompt('');
    setStatus('idle');
    setLogs([]);
    setResult('');
    setSavedPath(null);
    // Reload per-agent webhook from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`orchestrator_n8n_webhook_${agent.id}`);
      if (!saved || saved.trim() === '' || saved === 'http://localhost:5678/webhook/agent-run') {
        setN8nWebhookUrl('http://localhost:5678/webhook/ixRVFXuJdYEgE7EA/webhook/agent-run');
      } else {
        setN8nWebhookUrl(saved);
      }
    }
  }, [agent.id]);

  // Define sub-actions for each agent
  const actionsMap: Record<string, { label: string; icon: string; placeholder: string; responseTemplate: (prompt: string) => string }[]> = {
    research: [
      {
        label: 'Web Research',
        icon: '🔍',
        placeholder: 'e.g., Latest trends in AI Agent Orchestration platforms...',
        responseTemplate: (p) => `# Web Research Report: ${p}\n\n## Executive Summary\nThis report compiles current search results and industry insights regarding **${p}**.\n\n## Key Findings\n1. **High Growth Interest**: Search volumes and venture backing in this sector have grown 120% year-over-year.\n2. **Standardization Efforts**: Leading consortiums are developing unified protocols to address compatibility.\n3. **Security Concerns**: Data lineage protection remains the primary friction point for enterprise deployments.\n\n## Recommendations\n- Investigate local caching layers to isolate private tokens.\n- Implement fallback networks to maintain uptime during API throttling.`
      },
      {
        label: 'Competitor Analysis',
        icon: '📊',
        placeholder: 'e.g., Journex vs traditional trading journals...',
        responseTemplate: (p) => `# Competitor Analysis: ${p}\n\n## Market Landscape\nAnalysis of competitors and market alternatives for **${p}**.\n\n## SWOT Matrix\n### Strengths\n- Custom real-time streaming sockets.\n- Deep local MT5 integration endpoints.\n\n### Weaknesses\n- High initial learning curve for beginners.\n- Resource constraints on single-core Docker hosts.\n\n### Opportunities\n- Automated trade execution sandboxes.\n- White-label license sales to brokerage firms.\n\n### Threats\n- Incumbents introducing zero-latency cloud bridge extensions.`
      },
      {
        label: 'Summarize Papers',
        icon: '📝',
        placeholder: 'Paste paper abstract or title here...',
        responseTemplate: (p) => `# Academic Summary: ${p}\n\n## Abstract Overview\nSynthesized breakdown of core concepts discussed in the research around **${p}**.\n\n## Key Contributions\n- **Novel Loss Function**: Proposes a spatial-temporal loss formulation minimizing feedback jitter.\n- **Empirical Validation**: Achieves a 14% improvement in inference latency on standard benchmarks.\n- **Limitations**: Assumes uniform bandwidth constraints; performance degrades on satellite links.`
      },
      {
        label: 'Collect Sources',
        icon: '📚',
        placeholder: 'e.g., Quantitative finance and MT5 bridge literature...',
        responseTemplate: (p) => `# Reference Library: ${p}\n\n## Curated References\n1. **"High-Frequency Execution Bridges"** (2024) - *Journal of Algo Trading*\n   - Key takeaway: Latency overhead is dominated by OS-level network context switches.\n2. **"Dockerizing Financial Telemetry"** (2023) - *DevOps Quarterly*\n   - Key takeaway: Alpine base images require libc compat libraries to load musl query engines.`
      },
      {
        label: 'Create Reports',
        icon: '📄',
        placeholder: 'e.g., Q3 Automated Trading Performance...',
        responseTemplate: (p) => `# Performance Report: ${p}\n\n## Operational Performance\nCompilation of metrics and performance logs for **${p}**.\n\n## Metric Summary\n- **Uptime**: 99.98%\n- **Average Latency**: 42ms\n- **Execution Accuracy**: 100% (zero slippage detected on sandbox EURUSD runs)`
      }
    ],
    business: [
      {
        label: 'Startup Ideas',
        icon: '💡',
        placeholder: 'e.g., AI-driven micro-SaaS for traders...',
        responseTemplate: (p) => `# Startup Ideation: ${p}\n\n## Value Proposition\n- Solves manual configuration overhead by introducing automated system orchestration.\n- Target Audience: Semi-professional algo traders running MetaTrader setups.`
      },
      {
        label: 'Market Validation',
        icon: '📈',
        placeholder: 'e.g., MetaTrader bridge hosting service...',
        responseTemplate: (p) => `# Market Validation: ${p}\n\n## Demand Metrics\n- Total Addressable Market (TAM): Estimated at $140M annually across custom brokerage tools.\n- Validation Index: Strong (7.8/10 based on developer forums and GitHub star trends).`
      },
      {
        label: 'Pricing Strategy',
        icon: '🏷️',
        placeholder: 'e.g., Multi-tier subscription model...',
        responseTemplate: (p) => `# Pricing Strategy: ${p}\n\n## Recommended Tiers\n1. **Free / Hobby**: Single workspace instance, mock data stream (Free).\n2. **Pro Trader**: Live MT5 bridge mapping, dual-core Docker CPU allocation ($29/mo).\n3. **Enterprise**: Dedicated database instance, custom API routing webhooks ($149/mo).`
      },
      {
        label: 'Customer Persona',
        icon: '👤',
        placeholder: 'e.g., Retail algo developers...',
        responseTemplate: (p) => `# Customer Persona: Algo-Developer Alex\n\n## Demographic\n- Age: 25-40\n- Skillset: Intermediate Python, beginner Docker.\n- Primary Pain Points: Port configuration conflicts, database mapping latency, and complex environment setups.`
      },
      {
        label: 'Competitor Comparison',
        icon: '⚖️',
        placeholder: 'e.g., Custom setup vs ready-made solutions...',
        responseTemplate: (p) => `# Competitive Matrix: ${p}\n\n## Features Comparison\n- **Port Switching**: Automated in Orchestrator (Manual in others).\n- **Prisma Support**: Preconfigured Docker files (Complex custom setups in others).`
      }
    ],
    marketing: [
      {
        label: 'SEO',
        icon: '🔑',
        placeholder: 'e.g., Trading journal application...',
        responseTemplate: (p) => `# SEO Target Strategy: ${p}\n\n## High-Value Keywords\n1. **"how to connect python to metatrader 5"** (Volume: 12k/mo, Difficulty: Easy)\n2. **"automated trading journal software"** (Volume: 8.4k/mo, Difficulty: Medium)\n3. **"metatrader 5 docker setup"** (Volume: 4k/mo, Difficulty: Low)`
      },
      {
        label: 'Content Calendar',
        icon: '📅',
        placeholder: 'e.g., Launching in Q4...',
        responseTemplate: (p) => `# Content Calendar: ${p}\n\n## Weekly Strategy\n- **Week 1**: "Solving 5432 Port Already Allocated Conflicts in Docker Dev Environments"\n- **Week 2**: "Building Zero-Latency Python Bridges for MetaTrader 5"\n- **Week 3**: "Why Every Algo Trader Needs a Standalone Database Mirror"`
      },
      {
        label: 'Ads Ideas',
        icon: '🎯',
        placeholder: 'e.g., Meta Ads targeting developers...',
        responseTemplate: (p) => `# Creative Ad Concepts: ${p}\n\n## Ad Hook\n"Tired of database ports crashing your trading terminal? Let Orchestrator manage your database, bridge, and dashboard in one click."`
      },
      {
        label: 'Social Posts',
        icon: '🐦',
        placeholder: 'e.g., Twitter thread on trading setups...',
        responseTemplate: (p) => `# Twitter/X Thread Blueprint: ${p}\n\n1/ Automated trading is great, until your local Postgres port crashes. Here's how we built an automated Windows service switcher to solve port conflicts in one click. 🧵`
      },
      {
        label: 'Branding',
        icon: '🎨',
        placeholder: 'e.g., Tech-forward dark theme...',
        responseTemplate: (p) => `# Branding System: ${p}\n\n- **Primary Accent**: Amber Gold (\`#F59E0B\`) - representing execution and precision.\n- **Secondary Accent**: Emerald Green (\`#10B981\`) - representing active connection and profit.\n- **Background System**: Obsidian Ink (\`#090A0F\`) - representing professional grade dark setups.`
      }
    ],
    sales: [
      {
        label: 'Lead Research',
        icon: '🎯',
        placeholder: 'e.g., Boutique quant funds...',
        responseTemplate: (p) => `# Lead Profile Matrix: ${p}\n\n## Target Leads\n1. **BlueStone Capital**: Small-scale algorithmic fund operating out of Singapore. Needs local bridge hosting.\n2. **Apex Systems**: Prop-trading group looking for developer-friendly sandbox UI dashboards.`
      },
      {
        label: 'Outreach',
        icon: '✉️',
        placeholder: 'e.g., Cold email to algo traders...',
        responseTemplate: (p) => `# Outreach Campaign: ${p}\n\n## Cold Outreach Template\nSubject: Custom MT5 Bridge configuration for your team\n\nHi [Name],\nI noticed your team is building custom trading systems. We created a dashboard orchestrator that resolves port allocations and hosts native MT5 FastAPI bridges out-of-the-box. Would love to send a demo.`
      },
      {
        label: 'CRM Updates',
        icon: '📝',
        placeholder: 'e.g., Lead stage updates...',
        responseTemplate: (p) => `# CRM Log: ${p}\n\n- **Lead**: BlueStone Capital -> Moved to *Proposal Sent* stage.\n- **Notes**: Highly interested in database switcher capability for multiple concurrent test instances.`
      },
      {
        label: 'Email Drafts',
        icon: '🖋️',
        placeholder: 'e.g., Follow up after demo...',
        responseTemplate: (p) => `# Email Draft: ${p}\n\nSubject: Follow-up: Journex Terminal Deployment\n\nHi [Name],\nThanks for checking out the demo. Our database switcher automatically handles freeing up port 5432 before start_local.bat spins up, resolving your hosting conflicts. Let me know if you'd like to proceed with install.`
      }
    ],
    finance: [
      {
        label: 'Expense Tracking',
        icon: '📊',
        placeholder: 'e.g., Server hosting expenses...',
        responseTemplate: (p) => `# Expense Sheet: ${p}\n\n## Monthly Breakdown\n- **Docker Cloud Hosts**: $42.00\n- **MetaTrader API Subscriptions**: $89.00\n- **Domain & SSL Certs**: $12.00\n- **Total monthly run rate**: $143.00`
      },
      {
        label: 'Investment Analysis',
        icon: '📈',
        placeholder: 'e.g., Allocating capital to automated setups...',
        responseTemplate: (p) => `# Investment Review: ${p}\n\n## Capital Allocation\n- Recommended: 70% in high-liquidity sandbox pairs (EURUSD, USDJPY).\n- Risk Profile: Conservative (0.01 lot maximum per execution to preserve equity margins).`
      },
      {
        label: 'Budgeting',
        icon: '💰',
        placeholder: 'e.g., Q4 development budget...',
        responseTemplate: (p) => `# Budget Forecast: ${p}\n\n## Allocations\n- **Frontend Adjustments**: $1,500 (Vite NextJS standalone builds)\n- **Database Migrations**: $800 (Prisma query optimizer integrations)`
      }
    ],
    personal: [
      {
        label: 'Schedule',
        icon: '⏰',
        placeholder: 'e.g., Daily tasks list...',
        responseTemplate: (p) => `# Daily Agenda: ${p}\n\n1. **08:30**: Check MT5 PM2 Bridge daemon state (connected: true).\n2. **10:00**: Perform Database synchronization check (\`npm run prisma migrate\`).\n3. **14:30**: NY Killzone session review.`
      },
      {
        label: 'Reminders',
        icon: '🔔',
        placeholder: 'e.g., Weekly backup...',
        responseTemplate: (p) => `# System Reminder: ${p}\n\n- Backup Obsidian sync folder (\`D:\\\\AI\\\\Obsidian\`) every Sunday at 23:00.\n- Verify Postgres container storage limits.`
      },
      {
        label: 'Planning',
        icon: '🗺️',
        placeholder: 'e.g., Q1 platform extensions...',
        responseTemplate: (p) => `# Strategic Plan: ${p}\n\n- Build a custom nestjs microservice for MetaTrader webhook execution.\n- Register dynamic endpoint routers for real-time order entries.`
      },
      {
        label: 'Daily Review',
        icon: '📓',
        placeholder: 'e.g., Review for August 22...',
        responseTemplate: (p) => `# Daily Review: ${p}\n\n- **Accomplished**: Next.js proxy build args resolved. Containers up and healthy.\n- **Blocked**: None. WebSockets active.\n- **Focus for Tomorrow**: Expand terminal websocket listener channels.`
      }
    ]
  };

  const currentActions = actionsMap[agent.id] || [];

  const handleRun = async () => {
    if (!selectedAction || !prompt.trim()) return;
    setStatus('running');
    setLogs([]);
    setResult('');
    setSavedPath(null);

    const modeLabel = execMode === 'template' ? 'Template' : execMode === 'llm' ? `${llmProvider.toUpperCase()} / ${llmModel}` : 'n8n Webhook';
    const steps = [
      `[1/3] Launching ${agent.name} engine...`,
      `[2/3] Analyzing input: "${prompt.substring(0, 30)}..."`,
      `[3/3] Calling backend [${modeLabel}]...`,
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 500));
      setLogs(prev => [...prev, step]);
    }

    try {
      const payload: any = { agentId: agent.id, action: selectedAction, prompt, mode: execMode };
      if (execMode === 'llm') {
        payload.provider = llmProvider;
        payload.model = llmModel;
        payload.apiKey = llmApiKey;
        if (llmProvider === 'ollama') {
          payload.ollamaUrl = ollamaUrl;
        }
        // Persist API key
        if (llmApiKey && typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_api_key', llmApiKey);
      }
      if (execMode === 'n8n') {
        payload.webhookUrl = n8nWebhookUrl;
        if (n8nWebhookUrl && typeof window !== 'undefined') localStorage.setItem(`orchestrator_n8n_webhook_${agent.id}`, n8nWebhookUrl);
      }

      const res = await fetch(`${backendUrl}/automation/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setLogs(prev => [...prev, `✓ Complete! Report saved to Obsidian.`]);
        setResult(json.result);
        setSavedPath(json.savedPath ?? null);
      } else {
        setLogs(prev => [...prev, `✗ Error: ${json.error || 'Unknown error'}`]);
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `✗ Network error: ${err.message}`]);
    } finally {
      setStatus('completed');
    }
  };

  const activeActionObj = currentActions.find(a => a.label === selectedAction) || null;

  const getCockpitAgentIcon = (size = 20) => {
    const s = { width: size, height: size, flexShrink: 0 as const };
    const props = { viewBox: '0 0 24 24', fill: 'none', stroke: agent.color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: s };
    if (agent.id === 'research')  return <svg {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    if (agent.id === 'business')  return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
    if (agent.id === 'marketing') return <svg {...props}><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>;
    if (agent.id === 'sales')     return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    if (agent.id === 'finance')   return <svg {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    if (agent.id === 'personal')  return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    return null;
  };

  const getActionIcon = (label: string, size = 13) => {
    const s = { width: size, height: size, flexShrink: 0 as const };
    const p = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style: s };
    if (label === 'Web Research' || label === 'Lead Research') return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    if (label === 'Competitor Analysis' || label === 'Competitor Comparison') return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    if (label === 'Summarize Papers') return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    if (label === 'Collect Sources') return <svg {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    if (label === 'Create Reports') return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>;
    if (label === 'Startup Ideas') return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    if (label === 'Market Validation') return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
    if (label === 'Pricing Strategy') return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    if (label === 'Customer Persona') return <svg {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    if (label === 'SEO') return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
    if (label === 'Content Calendar') return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    if (label === 'Ads Ideas') return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    if (label === 'Social Posts') return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    if (label === 'Branding') return <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;
    if (label === 'Outreach') return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    if (label === 'CRM Updates') return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M9 15l2 2 4-4"/></svg>;
    if (label === 'Email Drafts') return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
    if (label === 'Expense Tracking') return <svg {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    if (label === 'Investment Analysis') return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>;
    if (label === 'Budgeting') return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    if (label === 'Schedule') return <svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    if (label === 'Reminders') return <svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    if (label === 'Planning') return <svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
    if (label === 'Daily Review') return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M9 12l2 2 4-4"/></svg>;
    return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#090a0f', color: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${agent.color}18`, border: `1px solid ${agent.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {getCockpitAgentIcon(16)}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{agent.name} Cockpit</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>{agent.description}</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: '4px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}>
          LOCAL_AGENT_MODE
        </span>
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left Side: Actions Selector */}
        <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
            Agent Capabilities
          </span>
          {currentActions.map((act) => (
            <button
              key={act.label}
              onClick={() => {
                setSelectedAction(act.label);
                setPrompt('');
                setStatus('idle');
                setResult('');
                setLogs([]);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: selectedAction === act.label ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: '1px solid',
                borderColor: selectedAction === act.label ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '6px',
                color: selectedAction === act.label ? '#fff' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.8rem',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '4px', background: selectedAction === act.label ? `${agent.color}20` : 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
                {getActionIcon(act.label)}
              </span>
              <span>{act.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: Operation Console */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {!selectedAction ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '14px', background: `${agent.color}12`, border: `1px solid ${agent.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getCockpitAgentIcon(24)}
              </div>
              <p style={{ fontSize: '0.82rem', textAlign: 'center', maxWidth: '300px', margin: 0 }}>Select an agent capability on the left to begin.</p>
            </div>
          ) : (
            <>
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '4px', background: `${agent.color}20` }}>{getActionIcon(activeActionObj?.label ?? '', 11)}</span>
                  <span>{activeActionObj?.label} Prompt</span>
                </h4>

                {/* ─── Mode Selector ─────────────────────────────────── */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                    {(['template', 'llm', 'n8n'] as const).map((m) => {
                      const labels = { template: 'Template', llm: 'AI Model', n8n: 'n8n Workflow' };
                      const icons = {
                        template: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
                        llm: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
                        n8n: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
                      };
                      const active = execMode === m;
                      return (
                        <button key={m} onClick={() => setExecMode(m)} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '6px 0', fontSize: '0.72rem', cursor: 'pointer',
                          background: active ? `${agent.color}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${active ? agent.color + '60' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '5px', color: active ? agent.color : 'rgba(255,255,255,0.45)',
                          fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                        }}>
                          {icons[m]}{labels[m]}
                        </button>
                      );
                    })}
                  </div>

                  {/* LLM Config Panel */}
                  {execMode === 'llm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Provider</label>
                          <select
                            value={llmProvider}
                            onChange={(e) => { setLlmProvider(e.target.value); setLlmModel(modelOptions[e.target.value]?.[0]?.value || ''); }}
                            style={{ width: '100%', background: '#040507', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', padding: '5px 8px', outline: 'none' }}
                          >
                            {[
                              ['openai','OpenAI'],
                              ['gemini','Gemini'],
                              ['claude','Claude'],
                              ['mistral','Mistral'],
                              ['groq','Groq'],
                              ['deepseek','DeepSeek'],
                              ['ollama','Ollama (Local)'],
                              ['openrouter','OpenRouter'],
                              ['together','Together AI'],
                              ['perplexity','Perplexity'],
                              ['cohere','Cohere']
                            ].map(([v,l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Model</label>
                          <select
                            value={llmModel}
                            onChange={(e) => setLlmModel(e.target.value)}
                            style={{ width: '100%', background: '#040507', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', padding: '5px 8px', outline: 'none' }}
                          >
                            {(modelOptions[llmProvider] || []).map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Ollama Local URL Option */}
                      {llmProvider === 'ollama' && (
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Ollama API URL</label>
                          <input
                            type="text"
                            value={ollamaUrl}
                            onChange={(e) => setOllamaUrl(e.target.value)}
                            placeholder="e.g. http://localhost:11434/v1"
                            style={{ width: '100%', background: '#040507', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', padding: '5px 8px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          API Key {llmProvider === 'ollama' && <span style={{ color: 'rgba(255,255,255,0.2)' }}>(Optional)</span>}
                        </label>
                        <input
                          type="password"
                          value={llmApiKey}
                          onChange={(e) => {
                            setLlmApiKey(e.target.value);
                            if (typeof window !== 'undefined') localStorage.setItem('orchestrator_llm_api_key', e.target.value);
                          }}
                          placeholder={llmProvider === 'ollama' ? 'Optional for local Ollama deployments...' : `Paste your ${llmProvider} API key...`}
                          style={{ width: '100%', background: '#040507', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', padding: '5px 8px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* n8n Config Panel */}
                  {execMode === 'n8n' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>n8n Webhook URL</label>
                        <input
                          type="url"
                          value={n8nWebhookUrl}
                          onChange={(e) => {
                            setN8nWebhookUrl(e.target.value);
                            if (typeof window !== 'undefined') localStorage.setItem(`orchestrator_n8n_webhook_${agent.id}`, e.target.value);
                          }}
                          placeholder="http://localhost:5678/webhook/your-webhook-id"
                          style={{ width: '100%', background: '#040507', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', padding: '5px 8px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                        The agent will POST <code style={{ color: 'rgba(255,255,255,0.5)' }}>{'{agentId, action, prompt}'}</code> to this URL. Your n8n workflow receives it and returns <code style={{ color: 'rgba(255,255,255,0.5)' }}>{'{result: "..."}'}</code>.
                      </p>
                    </div>
                  )}
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={activeActionObj?.placeholder}
                  style={{
                    width: '100%',
                    height: '80px',
                    background: '#040507',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '10px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                  disabled={status === 'running'}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    onClick={handleRun}
                    disabled={status === 'running' || !prompt.trim()}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.78rem',
                      background: agent.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      opacity: (status === 'running' || !prompt.trim()) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {status === 'running' ? '⚡ Executing...' : '🚀 Run Capability'}
                  </button>
                </div>
              </div>

              {/* Status and Console Logs */}
              {(status === 'running' || logs.length > 0) && (
                <div style={{ background: '#040507', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Execution logs</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {logs.map((log, i) => (
                      <span key={i} style={{ fontSize: '0.72rem', color: log.startsWith('✓') ? '#10b981' : 'rgba(255,255,255,0.6)' }}>{log}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Result Output */}
              {status === 'completed' && result && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Generated Report</span>
                      {savedPath && (
                        <span style={{ fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                          📚 Saved → Obsidian/{savedPath}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(result)}
                      style={{ background: 'transparent', border: 'none', color: agent.color, fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      📋 Copy Output
                    </button>
                  </div>
                  <div style={{ flex: 1, background: '#040507', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '20px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                      {result}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const isMounted = useRef(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Project Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Agent State & Modal
  const [agents, setAgents] = useState<AgentShortcut[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentUrl, setNewAgentUrl] = useState('');
  const [newAgentDesc, setNewAgentDesc] = useState('');
  const [newAgentColor, setNewAgentColor] = useState('#10b981');
  const [newAgentIcon, setNewAgentIcon] = useState('🤖');
  // Always initialize with static default to avoid SSR/client hydration mismatch.
  // The persisted value is restored from localStorage after mount in a useEffect below.
  const [activeTab, setActiveTab] = useState<string>('home');
  const activeAgent = agents.find(a => a.id === activeTab) || null;
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [terminalsOpen, setTerminalsOpen] = useState(true);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [cliAgentsOpen, setCliAgentsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [terminalLayout, setTerminalLayout] = useState<'single'|'lr'|'tb'|'grid'>('single');

  // ─── Home Dashboard state ──────────────────────────────────────────────────
  const [dashSummary, setDashSummary] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(false);

  // ─── Agent Control Center state ────────────────────────────────────────────
  const [agentStatus, setAgentStatus] = useState<{ running: any[]; history: any[] }>({ running: [], history: [] });
  const agentTaskLog_running = agentStatus.running.length;

  // ─── Environment Manager state ─────────────────────────────────────────────
  const [envProjectId, setEnvProjectId] = useState('');
  const [envEnvironment, setEnvEnvironment] = useState<'development'|'staging'|'production'>('development');
  const [envVariables, setEnvVariables] = useState<Array<{key: string; value: string; description?: string}>>([]);
  const [envLoading, setEnvLoading] = useState(false);
  const [envRevealMap, setEnvRevealMap] = useState<Record<string, boolean>>({});
  const [envSaving, setEnvSaving] = useState(false);

  // ─── Project Edit Modal state ──────────────────────────────────────────────
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editStack, setEditStack] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // ─── Real-time System History state ────────────────────────────────────────
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);

  // ─── Connection Ping Tool state ─────────────────────────────────────────────
  const [pingHostVal, setPingHostVal] = useState('8.8.8.8');
  const [pingResult, setPingResult] = useState<any>(null);
  const [pingLoading, setPingLoading] = useState(false);



  // ─── Deployment Cockpit state ──────────────────────────────────────────────
  const [deploySummary, setDeploySummary] = useState<any>(null);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployConfig, setDeployConfig] = useState<any>(null);
  const [deploySettingsOpen, setDeploySettingsOpen] = useState(false);
  const [deployActionLoading, setDeployActionLoading] = useState<string>('');
  // Settings form
  const [cfgVpsUrl, setCfgVpsUrl] = useState('');
  const [cfgVpsLabel, setCfgVpsLabel] = useState('');
  const [cfgVercelToken, setCfgVercelToken] = useState('');
  const [cfgRailwayToken, setCfgRailwayToken] = useState('');
  const [cfgSentryToken, setCfgSentryToken] = useState('');
  const [cfgCloudflareToken, setCfgCloudflareToken] = useState('');
  const [sentryIssues, setSentryIssues] = useState<any[]>([]);
  const [sentryLoading, setSentryLoading] = useState(false);
  const [cfgSaving, setCfgSaving] = useState(false);

  // ─── Task / Mission System state ──────────────────────────────────────────
  const [missions, setMissions] = useState<any[]>([]);
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionAgent, setNewMissionAgent] = useState('hermes');
  const [newMissionProject, setNewMissionProject] = useState('');
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [missionActiveConsoleTab, setMissionActiveConsoleTab] = useState<'log'|'diff'|'tests'|'report'>('log');



  const colorPresets = [
    { name: 'OpenAI Green', value: '#10b981' },
    { name: 'Claude Orange', value: '#d97706' },
    { name: 'Gemini Blue', value: '#2563eb' },
    { name: 'Purple Glow', value: '#8b5cf6' },
    { name: 'Deep Pink', value: '#ec4899' },
    { name: 'Crimson', value: '#ef4444' },
  ];

  const iconPresets = ['💬', '🤖', '💻', '✨', '🧠', '📁', '⚙️', '🔍'];

  useEffect(() => {
    // Restore persisted active tab from localStorage (client-only, after mount)
    const savedTab = localStorage.getItem('orchestrator_active_tab');
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    const targetTab = tabFromUrl || savedTab;
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (savedTab) {
      setActiveTab(savedTab);
    }
    if (targetTab) {
      if (['docker', 'deployments', 'envmanager', 'dbexplorer', 'apiclient', 'git', 'github', 'n8n', 'automation', 'mt5'].includes(targetTab)) {
        setDevToolsOpen(true);
      }
      if (['obsidian', 'notion', 'intelligence'].includes(targetTab)) {
        setKnowledgeOpen(true);
      }
      if (['business', 'ideas', 'pipeline', 'sales'].includes(targetTab)) {
        setBusinessOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadAgents();
  }, [activeTab]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (activeTab) {
      localStorage.setItem('orchestrator_active_tab', activeTab);
      if (['docker', 'deployments', 'envmanager', 'dbexplorer', 'apiclient', 'git', 'github', 'n8n', 'automation', 'mt5'].includes(activeTab)) {
        setDevToolsOpen(true);
      }
      if (['obsidian', 'notion', 'intelligence'].includes(activeTab)) {
        setKnowledgeOpen(true);
      }
      if (['business', 'ideas', 'pipeline', 'sales'].includes(activeTab)) {
        setBusinessOpen(true);
      }
      if (agents.filter(a => a.type === 'local').some(a => a.id === activeTab)) {
        setCliAgentsOpen(true);
      }
      if (agents.filter(a => a.type === 'external').some(a => a.id === activeTab)) {
        setAgentsOpen(true);
      }
    }
  }, [activeTab, agents]);

  const [svcActionLoading, setSvcActionLoading] = useState<string>('');
  const handleServiceAction = async (key: string, up: boolean) => {
    setSvcActionLoading(key);
    try {
      const dashboardProject = projects.find(
        (p) => p.name.toLowerCase() === 'dashboard' || p.name.toLowerCase() === 'journex'
      ) || projects[0];

      if (key === 'frontend' || key === 'backend' || key === 'mt5') {
        if (!dashboardProject) {
          alert('No dashboard/journex project registered. Please register it in the Projects tab first!');
          return;
        }
        const action = up ? 'stop' : 'start';
        const res = await fetch(`${BACKEND_URL}/projects/${dashboardProject.id}/${action}`, { method: 'POST' }).then(r => r.json());
        alert(res.msg || `Server ${action} command executed successfully.`);
      } else if (key === 'prisma') {
        const action = up ? 'stop' : 'start';
        const res = await fetch(`${BACKEND_URL}/automation/prisma/${action}`, { method: 'POST' }).then(r => r.json());
        alert(res.msg || `Prisma Studio ${action} command executed.`);
      } else if (key === 'n8n') {
        const action = up ? 'stop' : 'start';
        await fetch(`${BACKEND_URL}/automation/deploy/docker/${action}/n8n`, { method: 'POST' });
        alert(`n8n ${action} request sent.`);
      }
      
      const r = await fetch(`${BACKEND_URL}/automation/dashboard/summary`).then(res => res.json());
      if (r.ok) setDashSummary(r);
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    } finally {
      setSvcActionLoading('');
    }
  };

  // ─── Home Dashboard: fetch summary and Sentry issues on mount + every 15s ──
  useEffect(() => {
    const fetchDashboard = async () => {
      setDashLoading(true);
      try {
        const data = await fetch(`${BACKEND_URL}/automation/dashboard/summary`).then(r => r.json());
        if (data.ok) {
          setDashSummary(data);
          const cpuVal = data.system?.cpu ?? 0;
          const memVal = data.system?.memory?.percent ?? 0;
          setCpuHistory(prev => [...prev.slice(-14), cpuVal]);
          setMemHistory(prev => [...prev.slice(-14), memVal]);
        }
      } catch {} finally { setDashLoading(false); }
    };

    const fetchSentry = async () => {
      setSentryLoading(true);
      try {
        const data = await fetch(`${BACKEND_URL}/automation/sentry/issues`).then(r => r.json());
        if (data.ok) {
          setSentryIssues(data.issues || []);
        }
      } catch {} finally { setSentryLoading(false); }
    };

    fetchDashboard();
    fetchSentry();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchSentry();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ─── Agent Control: poll every 5s when tab active ─────────────────────────
  useEffect(() => {
    if (activeTab !== 'agentcenter') return;
    const fetchStatus = async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/automation/agent/status`).then(r => r.json());
        if (data.ok) setAgentStatus({ running: data.running || [], history: data.history || [] });
      } catch {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // ─── Env Manager: load vars when project or env changes ───────────────────
  useEffect(() => {
    if (activeTab !== 'envmanager' || !envProjectId) return;
    const fetchEnv = async () => {
      setEnvLoading(true);
      try {
        const data = await fetch(`${BACKEND_URL}/automation/env/${envProjectId}/${envEnvironment}`).then(r => r.json());
        if (data.ok) setEnvVariables(data.variables || []);
      } catch {} finally { setEnvLoading(false); }
    };
    fetchEnv();
  }, [activeTab, envProjectId, envEnvironment]);

  // ─── Deployment Cockpit: fetch summary and config ────────────────────────
  useEffect(() => {
    if (activeTab !== 'deployments') return;
    const fetchDeploySummary = async () => {
      setDeployLoading(true);
      try {
        const data = await fetch(`${BACKEND_URL}/automation/deploy/summary`).then(r => r.json());
        if (data.ok) setDeploySummary(data);
      } catch {} finally { setDeployLoading(false); }
    };
    const fetchDeployConfig = async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/automation/deploy/config`).then(r => r.json());
        if (data.ok) {
          setDeployConfig(data);
          setCfgVercelToken(data.vercelTokenPreview || '');
          setCfgRailwayToken(data.railwayTokenPreview || '');
          setCfgSentryToken(data.sentryTokenPreview || '');
          setCfgCloudflareToken(data.cloudflareTokenPreview || '');
        }
      } catch {}
    };

    fetchDeploySummary();
    fetchDeployConfig();
    const interval = setInterval(fetchDeploySummary, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // ─── Task / Mission System: load list & poll running state ────────────────
  const loadMissions = async () => {
    try {
      const data = await fetch(`${BACKEND_URL}/projects/missions/all`).then(r => r.json());
      setMissions(data);
      // Auto-select first mission if none selected yet
      if (data.length > 0 && !selectedMissionId) {
        setSelectedMissionId(data[0].id);
      }
    } catch {}
  };

  useEffect(() => {
    loadMissions();
  }, [activeTab]);

  useEffect(() => {
    const hasRunning = missions.some(m => m.status === 'running');
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetch(`${BACKEND_URL}/projects/missions/all`).then(r => r.json());
        setMissions(data);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [missions]);





  const vercelStatus = (() => {
    if (!deploySummary?.vercel?.configured) {
      return { label: 'Not Configured', color: 'var(--text-muted)', dotColor: '#64748b' };
    }
    const sfProject = deploySummary?.vercel?.projects?.find((p: any) => p.name.toLowerCase().includes('servicefinder') || p.name.toLowerCase().includes('frontend'));
    const refProject = sfProject || deploySummary?.vercel?.projects?.[0];
    if (!refProject) {
      return { label: 'No Projects Found', color: 'var(--text-muted)', dotColor: '#64748b' };
    }
    if (refProject.deployState === 'READY') {
      return { label: 'Online', color: '#34d399', dotColor: '#10b981' };
    }
    if (refProject.deployState === 'BUILDING') {
      return { label: 'Building...', color: '#818cf8', dotColor: '#6366f1' };
    }
    return { label: `Offline (${refProject.deployState})`, color: '#f87171', dotColor: '#ef4444' };
  })();

  const vpsStatus = (() => {
    const vps = deploySummary?.vps?.find((s: any) => s.name.toLowerCase().includes('aws') || s.name.toLowerCase().includes('vps')) || deploySummary?.vps?.[0];
    if (!vps) {
      return { label: 'Not Configured', color: 'var(--text-muted)', dotColor: '#64748b' };
    }
    if (vps.ok) {
      return { label: `Online (Ping: ${vps.latencyMs !== undefined ? vps.latencyMs + 'ms' : 'Active'})`, color: '#34d399', dotColor: '#10b981' };
    }
    return { label: 'Offline / Unreachable', color: '#f87171', dotColor: '#ef4444' };
  })();

  const dbStatus = (() => {
    const pgSvc = deploySummary?.docker?.services?.find((s: any) => s.service.toLowerCase().includes('postgres') || s.service.toLowerCase().includes('db') || s.service.toLowerCase().includes('sql'));
    if (pgSvc) {
      if (pgSvc.running) {
        return { label: 'Healthy (Docker)', color: '#34d399', dotColor: '#10b981' };
      }
      return { label: 'Stopped (Docker)', color: '#f87171', dotColor: '#ef4444' };
    }
    return { label: 'Healthy (Local)', color: '#34d399', dotColor: '#10b981' };
  })();

  const lastDeployText = (() => {
    const sfProject = deploySummary?.vercel?.projects?.find((p: any) => p.name.toLowerCase().includes('servicefinder') || p.name.toLowerCase().includes('frontend'));
    const refProject = sfProject || deploySummary?.vercel?.projects?.[0];
    if (refProject && refProject.lastDeploy) {
      const diffMs = Date.now() - new Date(refProject.lastDeploy).getTime();
      const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs === 1) return '1 hour ago';
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      return new Date(refProject.lastDeploy).toLocaleDateString();
    }
    return '2 hours ago';
  })();

  const railwayStatus = (() => {
    if (!deploySummary?.integrations?.railway?.configured) {
      return { label: 'Not Configured', color: 'var(--text-muted)', dotColor: '#64748b' };
    }
    return { label: 'Online', color: '#34d399', dotColor: '#10b981' };
  })();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = () => {
    const savedAgents = localStorage.getItem('orchestrator_agents');
    const currentAgents = savedAgents 
      ? JSON.parse(savedAgents).filter((a: any) => !['research', 'business', 'marketing', 'sales', 'finance', 'personal'].includes(a.id)) 
      : [];

    const defaultAgents: AgentShortcut[] = [
      {
        id: 'chatgpt-custom',
        name: 'ChatGPT (Dev Session)',
        url: 'https://chatgpt.com/c/6a88571b-0068-83ec-a619-b3e147c8e34b',
        description: 'Custom OpenAI assistant for Orchestrator development',
        type: 'external',
        color: '#10b981',
        icon: '💬',
      },
      {
        id: 'claude',
        name: 'Claude AI',
        url: 'https://claude.ai',
        description: 'Anthropic Claude interface for advanced coding',
        type: 'external',
        color: '#d97706',
        icon: '🤖',
      },
      {
        id: 'gemini',
        name: 'Gemini Pro',
        url: 'https://gemini.google.com',
        description: 'Google Gemini interface for large contexts',
        type: 'external',
        color: '#2563eb',
        icon: '✨',
      },
      {
        id: 'kimi',
        name: 'Kimi Emergent',
        url: 'https://kimi.moonshot.cn',
        description: 'Kimi Moonshot AI assistant',
        type: 'external',
        color: '#ec4899',
        icon: '🌸',
      },
      {
        id: 'lovable',
        name: 'Lovable.dev',
        url: 'https://lovable.dev',
        description: 'Lovable frontend builder portal',
        type: 'external',
        color: '#f43f5e',
        icon: '❤️',
      },
      {
        id: 'deepseek',
        name: 'DeepSeek Chat',
        url: 'https://chat.deepseek.com',
        description: 'DeepSeek LLM interface',
        type: 'external',
        color: '#3b82f6',
        icon: '🐳',
      },
      {
        id: 'grok',
        name: 'Grok AI',
        url: 'https://grok.com',
        description: 'xAI Grok Assistant',
        type: 'external',
        color: '#ffffff',
        icon: '⚡',
      },
      {
        id: 'perplexity',
        name: 'Perplexity AI',
        url: 'https://www.perplexity.ai',
        description: 'AI-powered answer and research engine',
        type: 'external',
        color: '#00a3a6',
        icon: '🔍',
      },
      {
        id: 'v0',
        name: 'v0.dev',
        url: 'https://v0.dev',
        description: 'Vercel generative UI and react assistant',
        type: 'external',
        color: '#ffffff',
        icon: '💻',
      },
      {
        id: 'bolt',
        name: 'Bolt.new',
        url: 'https://bolt.new',
        description: 'StackBlitz full-stack web developer agent',
        type: 'external',
        color: '#3b82f6',
        icon: '⚡',
      },
      {
        id: 'phind',
        name: 'Phind',
        url: 'https://www.phind.com',
        description: 'Developer search and programming assistant',
        type: 'external',
        color: '#2563eb',
        icon: '🔍',
      },
      {
        id: 'mistral-chat',
        name: 'Mistral Le Chat',
        url: 'https://chat.mistral.ai',
        description: 'Official Mistral AI assistant interface',
        type: 'external',
        color: '#f97316',
        icon: '🦊',
      },
      {
        id: 'poe',
        name: 'Poe',
        url: 'https://poe.com',
        description: 'Quora AI ecosystem and model playground',
        type: 'external',
        color: '#ef4444',
        icon: '📚',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face Chat',
        url: 'https://huggingface.co/chat',
        description: 'Open source LLM and chatbot playground',
        type: 'external',
        color: '#fbbf24',
        icon: '🤗',
      },
      {
        id: 'openrouter-play',
        name: 'OpenRouter Play',
        url: 'https://openrouter.ai/play',
        description: 'Model arena and payload playground',
        type: 'external',
        color: '#8b5cf6',
        icon: '🌐',
      },
      {
        id: 'qwen',
        name: 'Qwen Chat',
        url: 'https://chat.qwenlm.ai',
        description: 'Alibaba Qwen model assistant interface',
        type: 'external',
        color: '#4f46e5',
        icon: '🌌',
      },
      {
        id: 'notebooklm',
        name: 'NotebookLM',
        url: 'https://notebooklm.google.com',
        description: 'Google NotebookLM for personalized AI source notes and audio summaries',
        type: 'external',
        color: '#2563eb',
        icon: '📓',
      },
      {
        id: 'canva',
        name: 'Canva',
        url: 'https://www.canva.com',
        description: 'Collaborative visual design and content creation portal',
        type: 'external',
        color: '#00c4cc',
        icon: '🎨',
      },
      {
        id: 'excalidraw',
        name: 'Excalidraw',
        url: 'https://excalidraw.com',
        description: 'Collaborative virtual whiteboard and sketching canvas',
        type: 'external',
        color: '#6965db',
        icon: '✏️',
      },
      {
        id: 'hermes',
        name: 'Hermes (Local)',
        url: '#',
        description: 'Local workspace orchestration and file editor',
        type: 'local',
        color: '#8b5cf6',
        icon: '📁',
      },
      {
        id: 'opencode',
        name: 'OpenCode (Local)',
        url: '#',
        description: 'Local terminal operations and command agent',
        type: 'local',
        color: '#3b82f6',
        icon: '💻',
      },
      {
        id: 'aider',
        name: 'Aider (Local)',
        url: '#',
        description: 'Git-native CLI developer agent for multi-file surgical edits',
        type: 'local',
        color: '#10b981',
        icon: '🛶',
      },
      {
        id: 'gptengineer',
        name: 'GPT-Engineer (Local)',
        url: '#',
        description: 'Prompt-to-codebase full application generator',
        type: 'local',
        color: '#f59e0b',
        icon: '📐',
      },
      {
        id: 'openhands',
        name: 'OpenHands (Local)',
        url: '#',
        description: 'Autonomous agentic developer in Docker sandbox environment',
        type: 'local',
        color: '#ec4899',
        icon: '👐',
      },
      {
        id: 'cline',
        name: 'Cline (Local)',
        url: '#',
        description: 'Autonomous CLI agent runner and code refactorer',
        type: 'local',
        color: '#6366f1',
        icon: '⚓',
      }
    ];

    // Migrate: add any defaults not already present in the user's custom shortcuts list
    const merged = [...currentAgents];
    defaultAgents.forEach(d => {
      if (!merged.some(m => m.id === d.id)) {
        merged.push(d);
      }
    });

    setAgents(merged);
    localStorage.setItem('orchestrator_agents', JSON.stringify(merged));
  };


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;

    try {
      setCreateLoading(true);
      setCreateError(null);
      const newProj = await api.createProject(name, path);
      setProjects([newProj, ...projects]);
      setIsOpen(false);
      setName('');
      setPath('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentUrl.trim()) return;

    const newAgent: AgentShortcut = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      url: newAgentUrl,
      description: newAgentDesc,
      type: 'external',
      color: newAgentColor,
      icon: newAgentIcon,
    };

    const updated = [...agents, newAgent];
    setAgents(updated);
    localStorage.setItem('orchestrator_agents', JSON.stringify(updated));
    
    // Reset state
    setIsAgentModalOpen(false);
    setNewAgentName('');
    setNewAgentUrl('');
    setNewAgentDesc('');
    setNewAgentColor('#10b981');
    setNewAgentIcon('🤖');
  };

  const handleDeleteAgent = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (DEFAULT_EXTERNAL_AGENT_IDS.includes(id)) {
      alert("Default agent shortcuts cannot be removed.");
      return;
    }
    if (!confirm('Are you sure you want to remove this agent shortcut?')) return;

    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    localStorage.setItem('orchestrator_agents', JSON.stringify(updated));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this project? The files on disk will NOT be deleted, only the reference in the orchestrator.')) return;

    try {
      await api.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.backgroundBlur}></div>
      <div style={styles.gridOverlay}></div>

      {/* Far-Left Sidebar: Stretches top-to-bottom */}
      <aside style={styles.sidebar} className="glass-panel">
        <div style={styles.logoArea}>
          <span style={styles.logoText}>ORCHESTRATOR</span>
        </div>
        <span style={styles.tagline}>Agent Workspace Portal</span>

        {/* Mock Search Bar matching Reference Image */}
        <div style={styles.sidebarSearchContainer}>
          <div style={styles.sidebarSearchInner}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Search</span>
          </div>
          <kbd style={styles.sidebarSearchKbd}>/</kbd>
        </div>

        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.03)', margin: '8px 0', flexShrink: 0 }}></div>

        {/* Scrollable Navigation / Tab list */}
        <div style={styles.agentList}>

          {/* ══════════════ ZONE 1: OVERVIEW & WORK ══════════════ */}
          <div>
            <div className="sidebar-section-title">Overview & Work</div>

            {/* Home Dashboard */}
            <div
              onClick={() => setActiveTab('home')}
              className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="sidebar-item-label">Home</span>
            </div>

            {/* Workspaces */}
            <div 
              onClick={() => setActiveTab('projects')}
              className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span className="sidebar-item-label">Workspaces</span>
              <span className="sidebar-item-badge">{projects.length}</span>
            </div>

            {/* Console & Terminals Group */}
            <div>
              <div
                onClick={() => setTerminalsOpen(o => !o)}
                className={`sidebar-item ${activeTab === 'terminal' || terminalOpen ? 'active' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                <span className="sidebar-item-label">Console & Terminals</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: terminalsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {/* Dropdown children */}
              <div style={{
                overflow: 'hidden',
                maxHeight: terminalsOpen ? '200px' : '0px',
                transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    {/* Fullscreen System Console */}
                    <div
                      onClick={() => setActiveTab('terminal')}
                      className={`sidebar-item ${activeTab === 'terminal' ? 'active' : ''}`}
                      style={{ paddingLeft: '2px' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Fullscreen Console</span>
                    </div>

                    {/* Float Terminal Toggle */}
                    <div
                      onClick={() => setTerminalOpen(o => !o)}
                      className={`sidebar-item ${terminalOpen ? 'active' : ''}`}
                      style={{ paddingLeft: '2px' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                      <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>{terminalOpen ? 'Hide Float Terminal' : 'Show Float Terminal'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0', flexShrink: 0 }}></div>

          {/* ══════════════ ZONE 2: AI & SKILL HQ (CORE) ══════════════ */}
          <div>
            <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10b981', letterSpacing: '0.08em' }}>
              <span>AI & SKILL HQ</span>
              <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>CORE</span>
            </div>

            {/* Skill Hub */}
            <div
              onClick={() => setActiveTab('skills')}
              className={`sidebar-item ${activeTab === 'skills' ? 'active' : ''}`}
              style={{
                background: activeTab === 'skills' 
                  ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)' 
                  : undefined,
                border: activeTab === 'skills' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0 }}>🧩</span>
              <span className="sidebar-item-label" style={{ fontWeight: 600 }}>Skill Hub</span>
              <span className="sidebar-item-badge" style={{ background: '#22c55e', color: '#000', fontWeight: 800, fontSize: '0.68rem', padding: '1px 6px' }}>
                14 Depts
              </span>
            </div>

            {/* Agent Control */}
            <div
              onClick={() => setActiveTab('agentcenter')}
              className={`sidebar-item ${activeTab === 'agentcenter' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M8.46 8.46a5 5 0 0 0 0 7.07" />
              </svg>
              <span className="sidebar-item-label">Agent Control</span>
              {agentTaskLog_running > 0 && <span className="sidebar-item-badge" style={{ background: '#10b981' }}>{agentTaskLog_running}</span>}
            </div>

            {/* Task Missions */}
            <div
              onClick={() => setActiveTab('missions')}
              className={`sidebar-item ${activeTab === 'missions' ? 'active' : ''}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="sidebar-item-label">Task Missions</span>
              {missions.filter(m => m.status === 'running').length > 0 && (
                <span className="sidebar-item-badge" style={{ background: '#10b981' }}>
                  {missions.filter(m => m.status === 'running').length}
                </span>
              )}
            </div>

            {/* AI Workspace */}
            <div 
              onClick={() => setActiveTab('aiworkspace')}
              className={`sidebar-item ${activeTab === 'aiworkspace' ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', flexShrink: 0 }}>🧠</span>
              <span className="sidebar-item-label">AI Workspace</span>
            </div>

            {/* Local CLI Agents Dropdown */}
            {agents.filter(a => a.type === 'local').length > 0 && (
              <div>
                <div
                  onClick={() => setCliAgentsOpen(o => !o)}
                  className={`sidebar-item ${agents.filter(a => a.type === 'local').some(a => activeTab === a.id) ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="4 17 10 11 4 5" />
                    <line x1="12" y1="19" x2="20" y2="19" />
                  </svg>
                  <span className="sidebar-item-label">CLI Coding Agents</span>
                  <span className="sidebar-item-badge">{agents.filter(a => a.type === 'local').length}</span>
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: cliAgentsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>

                <div style={{
                  overflow: 'hidden',
                  maxHeight: cliAgentsOpen ? '300px' : '0px',
                  transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)',
                  overflowY: 'auto'
                }}>
                  <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      {agents.filter(a => a.type === 'local').map((agent) => (
                        <div 
                          key={agent.id} 
                          onClick={() => setActiveTab(agent.id)}
                          className={`sidebar-item ${activeTab === agent.id ? 'active' : ''}`}
                          style={{ paddingLeft: '2px' }}
                        >
                          {renderAgentIcon(agent)}
                          <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>{agent.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0', flexShrink: 0 }}></div>

          {/* ══════════════ ZONE 3: DEVELOPER & INFRA (COLLAPSIBLE) ══════════════ */}
          <div>
            <div
              onClick={() => setDevToolsOpen(o => !o)}
              className={`sidebar-item ${['docker', 'deployments', 'envmanager', 'dbexplorer', 'apiclient', 'git', 'github', 'n8n', 'automation', 'mt5'].includes(activeTab) ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span className="sidebar-item-label" style={{ fontWeight: 600 }}>Developer & Infra</span>
              <span className="sidebar-item-badge">9</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: devToolsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Dropdown items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: devToolsOpen ? '450px' : '0px',
              transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1)',
              overflowY: 'auto'
            }}>
              <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  
                  {/* Docker */}
                  <div
                    onClick={() => setActiveTab('docker')}
                    className={`sidebar-item ${activeTab === 'docker' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=docker.com"
                      alt="Docker"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Docker Manager</span>
                  </div>

                  {/* Deployments */}
                  <div
                    onClick={() => setActiveTab('deployments')}
                    className={`sidebar-item ${activeTab === 'deployments' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Deployment Cockpit</span>
                  </div>

                  {/* Env Manager */}
                  <div
                    onClick={() => setActiveTab('envmanager')}
                    className={`sidebar-item ${activeTab === 'envmanager' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Env Manager</span>
                  </div>

                  {/* Database Explorer */}
                  <div
                    onClick={() => setActiveTab('dbexplorer')}
                    className={`sidebar-item ${activeTab === 'dbexplorer' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=prisma.io"
                      alt="Database Explorer"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Database Explorer</span>
                  </div>

                  {/* API Client */}
                  <div
                    onClick={() => setActiveTab('apiclient')}
                    className={`sidebar-item ${activeTab === 'apiclient' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=postman.com"
                      alt="API Client"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>API Client</span>
                  </div>

                  {/* Workspace Git */}
                  <div
                    onClick={() => setActiveTab('git')}
                    className={`sidebar-item ${activeTab === 'git' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=git-scm.com"
                      alt="Workspace Git"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Workspace Git</span>
                  </div>

                  {/* GitHub Integration */}
                  <div
                    onClick={() => setActiveTab('github')}
                    className={`sidebar-item ${activeTab === 'github' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=github.com"
                      alt="GitHub"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>GitHub</span>
                  </div>

                  {/* n8n Workflows */}
                  <div
                    onClick={() => setActiveTab('n8n')}
                    className={`sidebar-item ${activeTab === 'n8n' || activeTab === 'automation' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=n8n.io"
                      alt="n8n"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>n8n Workflows</span>
                  </div>

                  {/* Trading Agent MT5 */}
                  <div 
                    onClick={() => setActiveTab('mt5')}
                    className={`sidebar-item ${activeTab === 'mt5' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <svg 
                      width="15" 
                      height="15" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M23 6l-9.5 9.5-5-5L1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Trading Agent (MT5)</span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0', flexShrink: 0 }}></div>

          {/* ══════════════ ZONE 4: KNOWLEDGE & VAULTS (COLLAPSIBLE) ══════════════ */}
          <div>
            <div
              onClick={() => setKnowledgeOpen(o => !o)}
              className={`sidebar-item ${['obsidian', 'notion', 'intelligence'].includes(activeTab) ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span className="sidebar-item-label" style={{ fontWeight: 600 }}>Knowledge & Memory</span>
              <span className="sidebar-item-badge">3</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: knowledgeOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Dropdown items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: knowledgeOpen ? '200px' : '0px',
              transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>

                  {/* Obsidian Vault */}
                  <div
                    onClick={() => setActiveTab('obsidian')}
                    className={`sidebar-item ${activeTab === 'obsidian' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=obsidian.md"
                      alt="Obsidian"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Obsidian Vault</span>
                  </div>

                  {/* Notion Workspace */}
                  <div
                    onClick={() => setActiveTab('notion')}
                    className={`sidebar-item ${activeTab === 'notion' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <img
                      src="https://www.google.com/s2/favicons?sz=64&domain=notion.so"
                      alt="Notion"
                      width="15"
                      height="15"
                      style={{ borderRadius: '3px', flexShrink: 0, objectFit: 'contain' }}
                    />
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Notion Workspace</span>
                  </div>

                  {/* AI Intelligence Layer */}
                  <div
                    onClick={() => setActiveTab('intelligence')}
                    className={`sidebar-item ${activeTab === 'intelligence' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>AI Intelligence Layer</span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0', flexShrink: 0 }}></div>

          {/* ══════════════ ZONE 5: BUSINESS HQ (FOUNDER OS) ══════════════ */}
          <div>
            <div
              onClick={() => { setActiveTab('business'); setBusinessOpen(o => !o); }}
              className={`sidebar-item ${['business', 'ideas', 'pipeline', 'sales'].includes(activeTab) ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                background: activeTab === 'business' 
                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)' 
                  : undefined,
                border: activeTab === 'business' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0 }}>💼</span>
              <span className="sidebar-item-label" style={{ fontWeight: 600 }}>Business HQ</span>
              <span className="sidebar-item-badge" style={{ background: '#f59e0b', color: '#000', fontWeight: 800, fontSize: '0.68rem', padding: '1px 6px' }}>
                Pipeline
              </span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: businessOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
                onClick={(e) => { e.stopPropagation(); setBusinessOpen(o => !o); }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Dropdown items */}
            <div style={{
              overflow: 'hidden',
              maxHeight: businessOpen ? '220px' : '0px',
              transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '2px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>

                  <div
                    onClick={() => setActiveTab('business')}
                    className={`sidebar-item ${activeTab === 'business' ? 'active' : ''}`}
                    style={{ paddingLeft: '2px' }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>🚀</span>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>10-Stage Pipeline</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('business')}
                    className="sidebar-item"
                    style={{ paddingLeft: '2px' }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>🎯</span>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Skill Graph & Bottlenecks</span>
                  </div>

                  <div
                    onClick={() => setActiveTab('business')}
                    className="sidebar-item"
                    style={{ paddingLeft: '2px' }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>📓</span>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Experience Ledger</span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)', margin: '4px 0', flexShrink: 0 }}></div>

          {/* ══════════════ ZONE 6: THIRD-PARTY PORTALS (COLLAPSIBLE) ══════════════ */}
          <div>
            <div
              onClick={() => setAgentsOpen(o => !o)}
              className={`sidebar-item ${agents.filter(a => a.type === 'external').some(a => activeTab === a.id) ? 'active' : ''}`}
              style={{ cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="sidebar-item-label" style={{ fontWeight: 600 }}>Web AI Portals</span>
              <span className="sidebar-item-badge">{agents.filter(a => a.type === 'external').length}</span>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ marginLeft: 'auto', flexShrink: 0, transition: 'transform 0.2s', transform: agentsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.5 }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {/* Dropdown children */}
            <div style={{
              overflow: 'hidden',
              maxHeight: agentsOpen ? '500px' : '0px',
              transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)',
              overflowY: 'auto'
            }}>
              <div style={{ paddingLeft: '12px', paddingTop: '2px', paddingBottom: '4px', display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', marginLeft: '8px', marginRight: '10px', flexShrink: 0, borderRadius: '1px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  {agents.filter(a => a.type === 'external').map((agent) => (
                    <div 
                      key={agent.id} 
                      onClick={() => setActiveTab(agent.id)}
                      className={`sidebar-item ${activeTab === agent.id ? 'active' : ''}`}
                      style={{ paddingLeft: '2px' }}
                    >
                      {renderAgentIcon(agent)}
                      <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>{agent.name}</span>
                      
                      <div style={styles.agentActionButtons} onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={agent.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={styles.agentLaunchBtn}
                          title="Open in new tab"
                        >
                          ↗️
                        </a>
                        {!DEFAULT_EXTERNAL_AGENT_IDS.includes(agent.id) && (
                          <button 
                            style={styles.agentDelBtn}
                            onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id, e); }}
                            title="Remove Portal"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add portal button - inside the accordion */}
                  <div
                    onClick={() => setIsAgentModalOpen(true)}
                    className="sidebar-item"
                    style={{ paddingLeft: '2px', color: 'var(--primary)', marginTop: '2px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span className="sidebar-item-label" style={{ fontSize: '0.82rem' }}>Add Portal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Side: Top Bar + Main Workspace */}
      <div style={{ ...styles.rightArea, position: 'relative' }}>
        {/* Top Bar */}
        <header style={styles.topBar}>
          <div style={styles.breadcrumbArea}>
            <span style={styles.breadcrumbRoot}>Dashboard</span>
            <span style={styles.breadcrumbSeparator}>/</span>
            <span style={styles.breadcrumbActive}>
              {activeTab === 'home'
                ? 'Home'
                : activeTab === 'skills'
                ? 'Skill Hub & Directory'
                : activeTab === 'business'
                ? 'Business HQ & Venture Pipeline'
                : activeTab === 'projects' 
                ? 'Projects' 
                : activeTab === 'automation'
                ? 'System Automation'
                : activeTab === 'n8n'
                ? 'n8n Workflows'
                : activeTab === 'terminal'
                ? 'System Terminal'
                : activeTab === 'docker'
                ? 'Docker'
                : activeTab === 'obsidian'
                ? 'Obsidian Vault'
                : activeTab === 'aiworkspace'
                ? 'AI Workspace'
                : activeTab === 'intelligence'
                ? 'AI Intelligence Layer'
                : activeTab === 'notion'
                ? 'Notion Workspace'
                : activeTab === 'dbexplorer'
                ? 'Database Explorer (Prisma Studio)'
                : activeTab === 'apiclient'
                ? 'API Client (Postman)'
                : activeTab === 'git'
                ? 'Workspace Git Manager'
                : activeTab === 'mt5'
                ? 'Trading Agent'
                : activeTab === 'agentcenter'
                ? 'Agent Control Center'
                : activeTab === 'envmanager'
                ? 'Environment Manager'
                : activeTab === 'github'
                ? 'GitHub'
                : activeTab === 'deployments'
                ? 'Deployment Cockpit'
                : activeTab === 'missions'
                ? 'Task Missions'
                : activeAgent?.name}
            </span>
          </div>

          <div style={styles.topBarActions}>
            {/* Terminal toggle button — always visible */}
            <button
              onClick={() => { setTerminalOpen(true); setTerminalMinimized(false); }}
              title="Open System Terminal"
              style={{ background: terminalOpen && !terminalMinimized ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', transition: 'all 0.2s' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              Terminal
            </button>

            {/* Global Settings button */}
            <button
              onClick={() => setIsGlobalSettingsOpen(true)}
              title="Global Configurations Manager"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', transition: 'all 0.2s' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>

            {activeTab === 'projects' ? (
              <button style={styles.addButton} className="btn-primary" onClick={() => setIsOpen(true)}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Project
              </button>
            ) : activeAgent?.type === 'external' && (
              <a 
                href={activeAgent.url} 
                target="_blank" 
                rel="noreferrer" 
                style={styles.btnSecondaryViewer}
              >
                ↗️ Open in New Tab
              </a>
            )}
          </div>
        </header>

        {/* Main Workspace below the Top Bar */}
        <main style={{ ...styles.mainContent, ...((activeTab === 'terminal' || activeTab === 'docker' || activeTab === 'obsidian' || activeTab === 'intelligence' || activeTab === 'notion' || activeTab === 'dbexplorer' || activeTab === 'git' || activeTab === 'apiclient' || activeAgent?.type === 'local') ? { padding: 0, overflow: 'hidden' } : {}) }}>

          {/* ══════════════════════════ HOME DASHBOARD ══════════════════════════ */}
          {activeTab === 'home' ? (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
              {/* Greeting */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, Rendo 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  {dashLoading ? 'Refreshing telemetry...' : 'Orchestrator Command Center — refreshes every 15s'}
                </p>
              </div>

              {/* Founder Morning Executive Briefing Card */}
              <FounderBriefingCard backendUrl={BACKEND_URL} />

              {/* Service Health Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Frontend', key: 'frontend', port: '3000', icon: '🌐' },
                  { label: 'Backend', key: 'backend', port: '3005', icon: '⚙️' },
                  { label: 'Database', key: 'prisma', port: '5555', icon: '🗄️' },
                  { label: 'n8n', key: 'n8n', port: '5678', icon: '⚡' },
                  { label: 'MT5 Bridge', key: 'mt5', port: '5003', icon: '📊' },
                ].map(svc => {
                  const up = dashSummary?.services?.[svc.key];
                  return (
                    <div key={svc.key} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${up ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{svc.icon}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>{svc.label}</span>
                          <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: dashSummary ? (up ? '#10b981' : '#ef4444') : '#6b7280', boxShadow: dashSummary ? (up ? '0 0 6px #10b981' : 'none') : 'none' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: dashSummary ? (up ? '#10b981' : '#ef4444') : '#6b7280' }}>
                            {dashSummary ? (up ? 'Online' : 'Offline') : '—'}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>:{svc.port}</span>
                        </div>
                      </div>
                      
                      {/* Control Button */}
                      <button
                        disabled={svcActionLoading === svc.key}
                        onClick={() => handleServiceAction(svc.key, !!up)}
                        style={{
                          width: '100%',
                          marginTop: '10px',
                          padding: '5px 8px',
                          background: svcActionLoading === svc.key 
                            ? 'rgba(255,255,255,0.02)' 
                            : up 
                              ? 'rgba(239,68,68,0.06)' 
                              : 'rgba(16,185,129,0.06)',
                          border: `1px solid ${up ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                          borderRadius: '6px',
                          color: up ? '#f87171' : '#34d399',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          if (svcActionLoading === svc.key) return;
                          (e.target as HTMLElement).style.background = up ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
                        }}
                        onMouseLeave={e => {
                          if (svcActionLoading === svc.key) return;
                          (e.target as HTMLElement).style.background = up ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)';
                        }}
                      >
                        {svcActionLoading === svc.key ? 'Executing...' : up ? '⏹ Stop' : '▶ Run'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Metrics + Docker + Projects Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {/* CPU */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>CPU USAGE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{dashSummary?.system?.cpu ?? '—'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                  
                  {/* Live sparkline graph inside the card */}
                  <div style={{ height: '36px', marginTop: '4px', position: 'relative' }}>
                    {cpuHistory.length > 1 ? (
                      <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <path d={(() => {
                          const points = cpuHistory.map((val, idx) => {
                            const x = (idx / 14) * 500;
                            const y = 150 - (val / 100) * 130;
                            return `${x},${y}`;
                          });
                          return `M 0,150 L ${points.join(' L ')} L 500,150 Z`;
                        })()} fill="rgba(99,102,241,0.08)" />
                        <path d={(() => {
                          const points = cpuHistory.map((val, idx) => {
                            const x = (idx / 14) * 500;
                            const y = 150 - (val / 100) * 130;
                            return `${x},${y}`;
                          });
                          return `M ${points.join(' L ')}`;
                        })()} fill="none" stroke="#6366f1" strokeWidth="3" />
                      </svg>
                    ) : (
                      <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingTop: '18px' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{dashSummary?.system?.cpuCount ?? '—'} cores · {dashSummary?.system?.platform ?? '—'}</div>
                </div>

                {/* RAM */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>MEMORY</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{dashSummary?.system?.memory?.percent ?? '—'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                  
                  {/* Live sparkline graph inside the card */}
                  <div style={{ height: '36px', marginTop: '4px', position: 'relative' }}>
                    {memHistory.length > 1 ? (
                      <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <path d={(() => {
                          const points = memHistory.map((val, idx) => {
                            const x = (idx / 14) * 500;
                            const y = 150 - (val / 100) * 130;
                            return `${x},${y}`;
                          });
                          return `M 0,150 L ${points.join(' L ')} L 500,150 Z`;
                        })()} fill="rgba(16,185,129,0.08)" />
                        <path d={(() => {
                          const points = memHistory.map((val, idx) => {
                            const x = (idx / 14) * 500;
                            const y = 150 - (val / 100) * 130;
                            return `${x},${y}`;
                          });
                          return `M ${points.join(' L ')}`;
                        })()} fill="none" stroke="#10b981" strokeWidth="3" />
                      </svg>
                    ) : (
                      <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingTop: '18px' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{dashSummary?.system?.memory?.used ?? '—'} / {dashSummary?.system?.memory?.total ?? '—'} GB</div>
                </div>

                {/* Docker */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setActiveTab('docker')}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>DOCKER</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{dashSummary?.docker?.running ?? '—'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> running</span></div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '16px' }}>{dashSummary?.docker?.total ?? '—'} containers total · click to manage</div>
                </div>

                {/* Projects */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} onClick={() => setActiveTab('projects')}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '10px' }}>PROJECTS</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{dashSummary?.projects?.count ?? projects.length}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}> workspaces</span></div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '16px' }}>Click to manage workspaces</div>
                </div>
              </div>

              {/* Agent Activity + Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Recent Task Missions */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366f1' }}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recent Task Missions</span>
                    <button onClick={() => setActiveTab('missions')} style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
                  </div>
                  {missions.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No task missions yet. Create one in the Missions tab.</div>
                  ) : (
                    missions.slice(0, 5).map((mission: any) => (
                      <div key={mission.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: mission.status === 'running' ? '#10b981' : mission.status === 'completed' ? '#6366f1' : '#ef4444' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mission.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{mission.agentId} · {new Date(mission.createdAt).toLocaleTimeString()}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: mission.status === 'completed' ? 'rgba(99,102,241,0.15)' : mission.status === 'running' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: mission.status === 'completed' ? '#818cf8' : mission.status === 'running' ? '#34d399' : '#f87171' }}>
                          {mission.status === 'running' ? '⟳ Running' : mission.status === 'completed' ? '✓ Completed' : '⚪ Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Actions */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px' }}>Quick Actions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: '🖥️ Open Terminal', tab: 'terminal' },
                      { label: '🐋 Manage Docker', tab: 'docker' },
                      { label: '⚡ n8n Workflows', tab: 'n8n' },
                      { label: '🤖 Agent Control', tab: 'agentcenter' },
                      { label: '🔐 Env Manager', tab: 'envmanager' },
                      { label: '🧠 AI Intelligence', tab: 'intelligence' },
                    ].map(action => (
                      <button key={action.tab} onClick={() => setActiveTab(action.tab)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', color: '#fff', fontSize: '0.85rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(99,102,241,0.12)'; (e.target as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentry Error Intelligence Cockpit */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>🔥 Active Issues (Sentry Error Intelligence)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>Integrations: <strong style={{ color: '#f87171' }}>Active</strong></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {sentryIssues.filter(issue => issue.status === 'unresolved').length === 0 ? (
                    <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      🟢 All clear! No active Sentry errors detected.
                    </div>
                  ) : (
                    sentryIssues.filter(issue => issue.status === 'unresolved').map((issue: any) => (
                      <div key={issue.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '20px', padding: '16px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '10px', alignItems: 'center' }}>
                        
                        {/* Info Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>{issue.severity.toUpperCase()}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{issue.project}</span>
                          </div>
                          <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{issue.title}</strong>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{issue.message}</p>
                        </div>

                        {/* AI Analysis Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '20px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>AI ANALYSIS</span>
                          <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500 }}>{issue.aiAnalysis}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Suggested Fix: <code style={{ color: '#fbbf24', fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>{issue.suggestedFix}</code></span>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${BACKEND_URL}/automation/sentry/issues/${issue.id}/create-mission`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                }).then(r => r.json());
                                if (res.ok) {
                                  // Refresh lists
                                  const sRes = await fetch(`${BACKEND_URL}/automation/sentry/issues`).then(r => r.json());
                                  if (sRes.ok) setSentryIssues(sRes.issues || []);
                                  
                                  const mRes = await fetch(`${BACKEND_URL}/projects/missions/all`).then(r => r.json());
                                  if (mRes.ok) setMissions(mRes);

                                  // Switch to missions tab
                                  setSelectedMissionId(res.mission.id);
                                  setMissionActiveConsoleTab('log');
                                  setActiveTab('missions');

                                  // Automatically trigger the run simulator
                                  await fetch(`${BACKEND_URL}/projects/missions/${res.mission.id}/run`, { method: 'POST' });
                                  
                                  // Reload missions to show running state
                                  const mRes2 = await fetch(`${BACKEND_URL}/projects/missions/all`).then(r => r.json());
                                  if (mRes2.ok) setMissions(mRes2);

                                  alert(`Task created! Hermes has started resolving: ${issue.title}`);
                                }
                              } catch {
                                alert('Failed to delegate to agent');
                              }
                            }}
                            style={{ width: '100%', padding: '8px 12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 0 10px rgba(99,102,241,0.25)' }}
                          >
                            🤖 Auto-Fix via Hermes
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${BACKEND_URL}/automation/sentry/issues/${issue.id}/resolve`, { method: 'POST' }).then(r => r.json());
                                if (res.ok) {
                                  const sRes = await fetch(`${BACKEND_URL}/automation/sentry/issues`).then(r => r.json());
                                  if (sRes.ok) setSentryIssues(sRes.issues || []);
                                }
                              } catch {
                                alert('Resolve failed');
                              }
                            }}
                            style={{ width: '100%', padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                          >
                            Dismiss
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Unified Hardware Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px' }}>
                
                {/* GPUs Column */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📟</span> Graphics Units (GPUs)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
                    {(dashSummary?.system?.gpus ?? [
                      { id: 'GPU 0', name: 'NVIDIA GeForce RTX 4060 Laptop GPU', util: 24, mem: 40, temp: 62 },
                      { id: 'GPU 1', name: 'AMD Radeon 780M Graphics', util: 12, mem: 28, temp: 55 }
                    ]).map((gpu: any) => (
                      <div key={gpu.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>{gpu.id}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{gpu.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span>Load: <strong style={{ color: '#fff' }}>{gpu.util}%</strong></span>
                          <span>Memory: <strong style={{ color: '#fff' }}>{gpu.mem}%</strong></span>
                          <span>Temp: <strong style={{ color: '#3b82f6' }}>{gpu.temp}°C</strong></span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)', width: `${gpu.util}%`, height: '100%', borderRadius: '3px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disks Column */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🗄️</span> Storage Volumes (Disks)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, justifyContent: 'center' }}>
                    {(dashSummary?.system?.disks ?? [
                      { name: 'Disk 0 (C:)', free: 120, total: 500, percent: 76 },
                      { name: 'Disk 1 (D:)', free: 420, total: 1000, percent: 58 }
                    ]).map((disk: any) => (
                      <div key={disk.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{disk.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{disk.free} GB free of {disk.total} GB</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>Capacity Used</span>
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{disk.percent}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ background: '#f59e0b', width: `${disk.percent}%`, height: '100%', borderRadius: '3px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network & Diagnostics Column */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌐</span> Network & Ping Utility
                  </div>
                  
                  {/* Network stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>DOWNLOAD (RX)</span>
                      <span style={{ fontWeight: 600, color: '#34d399' }}>{dashSummary?.system?.network?.rxSpeed ?? '1.2 MB/s'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.65rem' }}>UPLOAD (TX)</span>
                      <span style={{ fontWeight: 600, color: '#6366f1' }}>{dashSummary?.system?.network?.txSpeed ?? '340 KB/s'}</span>
                    </div>
                  </div>

                  {/* Ping tool input */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input
                      placeholder="Ping host (e.g. 8.8.8.8)"
                      value={pingHostVal}
                      onChange={e => setPingHostVal(e.target.value)}
                      style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 8px', color: '#fff', fontSize: '0.78rem', outline: 'none' }}
                    />
                    <button
                      onClick={async () => {
                        if (!pingHostVal) return;
                        setPingLoading(true);
                        try {
                          const r = await fetch(`${BACKEND_URL}/automation/system/ping?host=${encodeURIComponent(pingHostVal)}`).then(res => res.json());
                          setPingResult(r);
                        } catch {
                          setPingResult({ ok: false, error: 'Ping failed.' });
                        } finally {
                          setPingLoading(false);
                        }
                      }}
                      disabled={pingLoading}
                      style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer', fontSize: '0.78rem' }}
                    >
                      {pingLoading ? '...' : 'Ping'}
                    </button>
                  </div>

                  {pingResult && (
                    <div style={{ padding: '6px 8px', borderRadius: '6px', background: pingResult.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${pingResult.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: pingResult.ok ? '#34d399' : '#f87171' }}>
                        <span>{pingResult.ok ? '✓ Reachable' : '✗ Unreachable'}</span>
                        {pingResult.latencyMs !== undefined && <span>{pingResult.latencyMs}ms</span>}
                      </div>
                      {pingResult.error && (
                        <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '2px' }}>{pingResult.error}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Remote Machines Column */}
                <div className="glass-panel" style={{ padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🖥️</span> Remote Machines
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
                    {[
                      { name: 'Local PC', status: 'Online', desc: 'Main control plane', color: '#10b981' },
                      { name: 'AWS VPS', status: 'Online', desc: 'Production server', color: '#10b981' },
                      { name: 'Laptop GPU', status: 'Online', desc: 'RTX 4060 Cores', color: '#10b981' }
                    ].map((m: any) => (
                      <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{m.name}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.desc}</span>
                        </div>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 600, color: m.color }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* API Consumption spark chart */}
              <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Token Allocation Analytics</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Consolidated API Consumption (Last 30 days)</span>
                </div>
                <div style={{ height: '70px', position: 'relative', width: '100%' }}>
                  <svg viewBox="0 0 1000 140" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <path d="M 0,140 L 0,80 L 150,110 L 300,50 L 450,90 L 600,40 L 750,70 L 900,20 L 1000,10 L 1000,140 Z" fill="rgba(99,102,241,0.08)" />
                    <path d="M 0,80 L 150,110 L 300,50 L 450,90 L 600,40 L 750,70 L 900,20 L 1000,10" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>

            </div>

          /* ══════════════════════════ SKILL HUB & AGENT DIRECTORY ══════════════════════════ */
          ) : activeTab === 'skills' ? (
            <SkillHubView backendUrl={BACKEND_URL} />

          /* ══════════════════════════ BUSINESS HQ (FOUNDER OS) ══════════════════════════ */
          ) : activeTab === 'business' ? (
            <BusinessHQView backendUrl={BACKEND_URL} />

          /* ══════════════════════════ TASK / MISSION SYSTEM ══════════════════════════ */
          ) : activeTab === 'missions' ? (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    🎯 Task Missions
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Coordinate active agent workflows, inspect code diffs, run verification tests, and view reports.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsMissionModalOpen(true)}
                  style={{
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.target as HTMLElement).style.filter = 'brightness(1.15)'}
                  onMouseLeave={e => (e.target as HTMLElement).style.filter = 'none'}
                >
                  + Create New Mission
                </button>
              </div>

              {/* Layout Split: Left Board, Right Console */}
              <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'stretch' }}>
                
                {/* Left Panel: Missions list board */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', height: 'fit-content' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    Active Board
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                    {missions.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No missions created yet. Add a new task above!
                      </div>
                    ) : (
                      missions.map((mission: any) => {
                        const isSelected = selectedMissionId === mission.id;
                        
                        return (
                          <div
                            key={mission.id}
                            onClick={() => {
                              setSelectedMissionId(mission.id);
                              // Reset active console tab if necessary
                              if (mission.status === 'completed' && missionActiveConsoleTab === 'log') {
                                setMissionActiveConsoleTab('report');
                              } else if (mission.status !== 'completed') {
                                setMissionActiveConsoleTab('log');
                              }
                            }}
                            className={`glass-panel`}
                            style={{
                              padding: '14px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.06)'}`,
                              background: isSelected ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={mission.status === 'completed'}
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  const newStatus = mission.status === 'completed' ? 'pending' : 'completed';
                                  await fetch(`${BACKEND_URL}/projects/missions/${mission.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  });
                                  loadMissions();
                                }}
                                style={{ cursor: 'pointer', accentColor: '#10b981' }}
                              />
                              <span style={{
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                color: mission.status === 'completed' ? 'var(--text-muted)' : '#fff',
                                textDecoration: mission.status === 'completed' ? 'line-through' : 'none',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {mission.title}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                              {/* Agent Assignment Badge */}
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: mission.agentId === 'hermes' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.15)',
                                color: mission.agentId === 'hermes' ? '#34d399' : '#818cf8',
                                textTransform: 'uppercase',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {mission.agentId}
                              </span>

                              {/* Status Badge */}
                              <span style={{
                                fontSize: '0.72rem',
                                color: mission.status === 'running' ? '#34d399' : mission.status === 'completed' ? '#818cf8' : 'var(--text-muted)'
                              }}>
                                {mission.status === 'running' ? '● Working...' : mission.status === 'completed' ? '✓ Finished' : 'Idle'}
                              </span>
                            </div>

                            {/* Utility operations row */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '4px' }}>
                              {mission.status !== 'running' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${BACKEND_URL}/projects/missions/${mission.id}/run`, { method: 'POST' });
                                    loadMissions();
                                  }}
                                  style={{ padding: '4px 8px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '4px', color: '#34d399', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                                >
                                  ▶ Run
                                </button>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('Are you sure you want to delete this mission?')) {
                                    await fetch(`${BACKEND_URL}/projects/missions/${mission.id}`, { method: 'DELETE' });
                                    if (selectedMissionId === mission.id) {
                                      setSelectedMissionId(null);
                                    }
                                    loadMissions();
                                  }
                                }}
                                style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Panel: Active Mission Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {(() => {
                    const activeMission = missions.find(m => m.id === selectedMissionId);
                    if (!activeMission) {
                      return (
                        <div className="glass-panel" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', height: '100%', minHeight: '400px' }}>
                          <span style={{ fontSize: '3rem', marginBottom: '16px' }}>🎯</span>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>No Mission Selected</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', textAlign: 'center', maxWidth: '280px' }}>
                            Choose an existing task mission from the list board to monitor pipelines and report summaries.
                          </p>
                        </div>
                      );
                    }

                    const stepsList = (() => {
                      try { return JSON.parse(activeMission.steps || '[]'); } catch { return []; }
                    })();
                    
                    // Workflow pipeline visual calculations
                    // Total stages: 5
                    // Task -> Agent -> Code -> Test -> Report
                    const getStageStatus = (stageIdx: number) => {
                      // 0: Task, 1: Agent, 2: Code, 3: Test, 4: Report
                      if (activeMission.status === 'completed') return 'completed';
                      if (activeMission.status === 'pending') return 'pending';
                      
                      // running stages mapping by stepsList length
                      const len = stepsList.length;
                      if (len > stageIdx) return 'completed';
                      if (len === stageIdx) return 'active';
                      return 'pending';
                    };

                    const diffObj = (() => {
                      try { return JSON.parse(activeMission.codeChanges || 'null'); } catch { return null; }
                    })();

                    const testsObj = (() => {
                      try { return JSON.parse(activeMission.tests || 'null'); } catch { return null; }
                    })();

                    return (
                      <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '500px' }}>
                        
                        {/* Header Details */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              MISSION CONSOLE · {activeMission.id.substring(0, 8)}
                            </span>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '4px 0 0 0', color: '#fff' }}>
                              {activeMission.title}
                            </h2>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Agent: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{activeMission.agentId}</strong>
                            </span>
                            <div style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: activeMission.status === 'running' ? 'rgba(16,185,129,0.12)' : activeMission.status === 'completed' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                              color: activeMission.status === 'running' ? '#34d399' : activeMission.status === 'completed' ? '#818cf8' : 'var(--text-muted)',
                              border: `1px solid ${activeMission.status === 'running' ? 'rgba(16,185,129,0.3)' : activeMission.status === 'completed' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`
                            }}>
                              {activeMission.status === 'running' ? 'Working' : activeMission.status === 'completed' ? 'Completed' : 'Pending Run'}
                            </div>
                          </div>
                        </div>

                        {/* Pipeline Stage Visualizer */}
                        <div style={{ padding: '10px 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 30px' }}>
                            
                            {/* Connector bar */}
                            <div style={{
                              position: 'absolute',
                              top: '16px',
                              left: '0',
                              right: '0',
                              height: '2px',
                              background: 'rgba(255,255,255,0.06)',
                              zIndex: 1
                            }} />
                            <div style={{
                              position: 'absolute',
                              top: '16px',
                              left: '0',
                              width: `${
                                activeMission.status === 'completed'
                                  ? 100
                                  : activeMission.status === 'pending'
                                  ? 0
                                  : Math.min((stepsList.length / 5) * 100, 100)
                              }%`,
                              height: '2px',
                              background: 'linear-gradient(90deg, #10b981 0%, #6366f1 100%)',
                              zIndex: 1,
                              transition: 'width 0.6s ease'
                            }} />

                            {/* Node Items */}
                            {[
                              { label: 'Task', icon: '📋' },
                              { label: 'Agent', icon: '🤖' },
                              { label: 'Code changes', icon: '📝' },
                              { label: 'Test', icon: '🧪' },
                              { label: 'Report', icon: '📋' }
                            ].map((stage, idx) => {
                              const s = getStageStatus(idx);
                              const isCompleted = s === 'completed';
                              const isActive = s === 'active';
                              
                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                  <div style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    background: isCompleted ? '#10b981' : isActive ? '#6366f1' : '#1f2937',
                                    border: `2px solid ${isCompleted ? '#10b981' : isActive ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.85rem',
                                    color: '#fff',
                                    boxShadow: isActive ? '0 0 10px #818cf8' : isCompleted ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
                                    transition: 'all 0.4s'
                                  }}>
                                    {isCompleted ? '✓' : stage.icon}
                                  </div>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    marginTop: '8px',
                                    fontWeight: isActive || isCompleted ? 600 : 500,
                                    color: isCompleted ? '#34d399' : isActive ? '#818cf8' : 'var(--text-muted)'
                                  }}>
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Console Content Area with Tabs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                          
                          {/* Tabs selector */}
                          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                            {[
                              { id: 'log', label: '🛠️ Logs Console', visible: true },
                              { id: 'diff', label: '📝 Code Diff', visible: !!diffObj },
                              { id: 'tests', label: '🧪 Test Output', visible: !!testsObj },
                              { id: 'report', label: '📋 Final Report', visible: !!activeMission.report },
                            ].filter(t => t.visible).map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setMissionActiveConsoleTab(tab.id as any)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: missionActiveConsoleTab === tab.id ? 'rgba(99,102,241,0.15)' : 'none',
                                  color: missionActiveConsoleTab === tab.id ? '#818cf8' : 'var(--text-muted)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Tab Contents: Logs */}
                          {missionActiveConsoleTab === 'log' && (
                            <div style={{ background: '#0a0d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#34d399', overflowY: 'auto', maxHeight: '350px', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {stepsList.map((step: string, sidx: number) => (
                                <div key={sidx} style={{ display: 'flex', gap: '10px' }}>
                                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{sidx + 1}]</span>
                                  <span style={{ color: sidx === stepsList.length - 1 && activeMission.status === 'running' ? '#fff' : '#34d399' }}>
                                    {step}
                                    {sidx === stepsList.length - 1 && activeMission.status === 'running' && '...'}
                                  </span>
                                </div>
                              ))}
                              {activeMission.status === 'pending' && (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>
                                  Mission is idle. Click "▶ Run" to start the agent execution loop.
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab Contents: Diff Viewer */}
                          {missionActiveConsoleTab === 'diff' && diffObj && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Modified files: <strong style={{ color: '#fff' }}>{diffObj.files?.join(', ')}</strong></span>
                                <span>
                                  Lines: <strong style={{ color: '#34d399' }}>+{diffObj.additions}</strong> / <strong style={{ color: '#f87171' }}>-{diffObj.deletions}</strong>
                                </span>
                              </div>
                              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#f8fafc', overflowX: 'auto' }}>
                                <div style={{ color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px', marginBottom: '8px' }}>git diff highlights</div>
                                <div style={{ color: '#ef4444' }}>- void verify() {'{'} {'}'}</div>
                                <div style={{ color: '#10b981' }}>+ bool verify() {'{'}</div>
                                <div style={{ color: '#10b981' }}>+   return true;</div>
                                <div style={{ color: '#10b981' }}>+ {'}'}</div>
                              </div>
                            </div>
                          )}

                          {/* Tab Contents: Test specs */}
                          {missionActiveConsoleTab === 'tests' && testsObj && (
                            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: testsObj.passed ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '0.82rem', marginBottom: '10px' }}>
                                <span>{testsObj.passed ? '✓ BUILD & TEST SUCCESSFUL' : '✗ TEST RUNNER FAILURE'}</span>
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'pre-wrap' }}>
                                {testsObj.summary}
                              </div>
                            </div>
                          )}

                          {/* Tab Contents: Report */}
                          {missionActiveConsoleTab === 'report' && activeMission.report && (
                            <div className="glass-panel" style={{ padding: '18px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '0.82rem', overflowY: 'auto', maxHeight: '400px' }}>
                              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                {activeMission.report}
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Create New Mission Modal */}
              {isMissionModalOpen && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div className="glass-panel animate-scale-in" style={{ padding: '28px', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.35)', background: '#0e111a', width: '420px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: '#fff' }}>
                      Add Task Mission
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TASK TITLE</label>
                        <input
                          placeholder="e.g. Fix authentication"
                          value={newMissionTitle}
                          onChange={e => setNewMissionTitle(e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PREFFERED AGENT</label>
                        <select
                          value={newMissionAgent}
                          onChange={e => setNewMissionAgent(e.target.value)}
                          style={{ background: '#0e111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="hermes">Hermes Agent</option>
                          <option value="opencode">OpenCode Agent</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROJECT CONTEXT (WORKSPACE)</label>
                        <select
                          value={newMissionProject}
                          onChange={e => setNewMissionProject(e.target.value)}
                          style={{ background: '#0e111a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                        >
                          <option value="">No Project (General Context)</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button
                          onClick={() => setIsMissionModalOpen(false)}
                          style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!newMissionTitle) return;
                            const res = await fetch(`${BACKEND_URL}/projects/missions/create`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: newMissionTitle,
                                agentId: newMissionAgent,
                                projectId: newMissionProject || undefined
                              })
                            }).then(r => r.json());
                            
                            setNewMissionTitle('');
                            setIsMissionModalOpen(false);
                            loadMissions();
                            if (res && res.id) {
                              setSelectedMissionId(res.id);
                            }
                          }}
                          style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Create Task
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          /* ══════════════════════════ DEPLOYMENT COCKPIT ══════════════════════════ */
          ) : activeTab === 'deployments' ? (
            <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Deployment Cockpit
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Monitor production VPS health, Docker services, Vercel deployments, and cloud control panels.
                  </p>
                </div>
                
                <button
                  onClick={() => setDeploySettingsOpen(!deploySettingsOpen)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px',
                    color: '#818cf8',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  ⚙️ Configure Connections
                </button>
              </div>

              {/* Settings / Configuration Panel overlay */}
              {deploySettingsOpen && (
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(15, 17, 26, 0.95)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Credentials & Integrations</span>
                    <button onClick={() => setDeploySettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* VPS Targets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em' }}>VPS PING TARGETS</span>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          placeholder="VPS Name / Label"
                          value={cfgVpsLabel}
                          onChange={e => setCfgVpsLabel(e.target.value)}
                          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem' }}
                        />
                        <input
                          placeholder="http://vps-ip-or-domain:port/health"
                          value={cfgVpsUrl}
                          onChange={e => setCfgVpsUrl(e.target.value)}
                          style={{ flex: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem' }}
                        />
                        <button
                          onClick={async () => {
                            if (!cfgVpsLabel || !cfgVpsUrl) return alert('Please enter both label and health check URL');
                            const updatedVps = [...(deployConfig?.vpsTargets || []), { name: cfgVpsLabel, url: cfgVpsUrl }];
                            try {
                              setCfgSaving(true);
                              const r = await fetch(`${BACKEND_URL}/automation/deploy/config`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ vpsTargets: updatedVps })
                              }).then(res => res.json());
                              if (r.ok) {
                                setCfgVpsLabel('');
                                setCfgVpsUrl('');
                                // Reload config
                                const cfg = await fetch(`${BACKEND_URL}/automation/deploy/config`).then(res => res.json());
                                if (cfg.ok) setDeployConfig(cfg);
                              }
                            } catch { alert('Failed to add target'); } finally { setCfgSaving(false); }
                          }}
                          style={{ padding: '8px 14px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '6px', color: '#818cf8', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          Add
                        </button>
                      </div>

                      {/* VPS Target List */}
                      <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        {(deployConfig?.vpsTargets || []).length === 0 ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No VPS ping targets defined.</span>
                        ) : (
                          deployConfig.vpsTargets.map((t: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.url}</span>
                              </div>
                              <button
                                onClick={async () => {
                                  const updatedVps = deployConfig.vpsTargets.filter((_: any, i: number) => i !== idx);
                                  try {
                                    const r = await fetch(`${BACKEND_URL}/automation/deploy/config`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ vpsTargets: updatedVps })
                                    }).then(res => res.json());
                                    if (r.ok) {
                                      const cfg = await fetch(`${BACKEND_URL}/automation/deploy/config`).then(res => res.json());
                                      if (cfg.ok) setDeployConfig(cfg);
                                    }
                                  } catch {}
                                }}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem' }}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Tokens / Integrations Config */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.05em' }}>INTEGRATION TOKENS</span>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Vercel API Token</label>
                        <input
                          type="password"
                          placeholder={deployConfig?.vercelConfigured ? '•••••••••••••••• (Configured)' : 'Vercel authorization token'}
                          value={cfgVercelToken}
                          onChange={e => setCfgVercelToken(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Railway API Token</label>
                        <input
                          type="password"
                          placeholder={deployConfig?.railwayConfigured ? '•••••••••••••••• (Configured)' : 'Railway authorization token'}
                          value={cfgRailwayToken}
                          onChange={e => setCfgRailwayToken(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Sentry Auth Token</label>
                        <input
                          type="password"
                          placeholder={deployConfig?.sentryConfigured ? '•••••••••••••••• (Configured)' : 'Sentry user/organization token'}
                          value={cfgSentryToken}
                          onChange={e => setCfgSentryToken(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cloudflare Token</label>
                        <input
                          type="password"
                          placeholder={deployConfig?.cloudflareConfigured ? '•••••••••••••••• (Configured)' : 'Cloudflare global / zone token'}
                          value={cfgCloudflareToken}
                          onChange={e => setCfgCloudflareToken(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                    <button
                      onClick={() => setDeploySettingsOpen(false)}
                      style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Close Settings
                    </button>
                    <button
                      onClick={async () => {
                        setCfgSaving(true);
                        try {
                          const r = await fetch(`${BACKEND_URL}/automation/deploy/config`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              vercelToken: cfgVercelToken,
                              railwayToken: cfgRailwayToken,
                              sentryToken: cfgSentryToken,
                              cloudflareToken: cfgCloudflareToken
                            })
                          }).then(res => res.json());
                          if (r.ok) {
                            alert('Tokens saved successfully!');
                            setDeploySettingsOpen(false);
                            // Reload deployment configuration
                            const cfg = await fetch(`${BACKEND_URL}/automation/deploy/config`).then(res => res.json());
                            if (cfg.ok) setDeployConfig(cfg);
                          }
                        } catch { alert('Failed to save tokens.'); } finally { setCfgSaving(false); }
                      }}
                      style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      {cfgSaving ? 'Saving...' : 'Save Tokens'}
                    </button>
                  </div>
                </div>
              )}

              {/* Main metrics summary counters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>DOCKER CONTAINERS</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                    {deploySummary?.docker?.running ?? '0'} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {deploySummary?.docker?.count ?? '0'} active</span>
                  </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>VPS SERVERS ONLINE</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                    {deploySummary?.vps?.filter((s: any) => s.ok).length ?? '0'} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {deploySummary?.vps?.length ?? '0'} reachable</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>VERCEL PROJECTS</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
                    {deploySummary?.vercel?.projects?.length ?? '0'} <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-muted)' }}>connected</span>
                  </div>
                </div>
              </div>

              {/* Project-Centric & Platforms Deployment Status Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
                
                {/* Project-Centric Deployment Status (ServiceFinder) */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚀 Project Deployment Center
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Project Context: <strong style={{ color: '#fff' }}>ServiceFinder</strong></span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', flex: 1, alignItems: 'center' }}>
                    
                    {/* Frontend */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>FRONTEND</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: vercelStatus.dotColor, boxShadow: `0 0 6px ${vercelStatus.dotColor}` }} />
                        Vercel
                      </div>
                      <span style={{ fontSize: '0.68rem', color: vercelStatus.color, fontWeight: 500 }}>{vercelStatus.label}</span>
                    </div>

                    {/* Backend */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>BACKEND</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: vpsStatus.dotColor, boxShadow: `0 0 6px ${vpsStatus.dotColor}` }} />
                        VPS Server
                      </div>
                      <span style={{ fontSize: '0.68rem', color: vpsStatus.color, fontWeight: 500 }}>{vpsStatus.label}</span>
                    </div>

                    {/* Database */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>DATABASE</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dbStatus.dotColor, boxShadow: `0 0 6px ${dbStatus.dotColor}` }} />
                        PostgreSQL
                      </div>
                      <span style={{ fontSize: '0.68rem', color: dbStatus.color, fontWeight: 500 }}>{dbStatus.label}</span>
                    </div>

                    {/* Deploy Stats */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>LAST DEPLOY</span>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#818cf8' }}>
                        {lastDeployText}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Branch: main</span>
                    </div>

                  </div>
                </div>

                {/* Cloud & Infrastructure Deployments Platforms */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🚀 Deployments
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'center' }}>
                    {[
                      { name: 'Local', status: (deploySummary?.docker?.running ?? 0) > 0 ? 'Docker' : 'Offline', dotColor: (deploySummary?.docker?.running ?? 0) > 0 ? '#10b981' : '#ef4444', color: (deploySummary?.docker?.running ?? 0) > 0 ? '#34d399' : '#f87171' },
                      { name: 'AWS VPS', status: vpsStatus.label.includes('Online') ? 'Online' : 'Offline', dotColor: vpsStatus.dotColor, color: vpsStatus.color },
                      { name: 'Vercel', status: vercelStatus.label.includes('Online') || vercelStatus.label.includes('Building') ? 'Online' : 'Offline', dotColor: vercelStatus.dotColor, color: vercelStatus.color },
                      { name: 'Railway', status: railwayStatus.label === 'Online' ? 'Online' : 'Offline', dotColor: railwayStatus.dotColor, color: railwayStatus.color }
                    ].map((p: any) => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>{p.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 600, color: p.color }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.dotColor, boxShadow: `0 0 6px ${p.dotColor}` }} />
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Lower Section: Docker compose services + VPS pings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
                
                {/* Local Docker services cockpit */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🐋 Local Docker Compose Status
                    </h3>
                  </div>

                  {(!deploySummary?.docker?.services || deploySummary?.docker?.services?.length === 0) ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '24px 0', textAlign: 'center' }}>
                      No docker compose services found in orchestrator project directory.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {deploySummary?.docker?.services?.map((svc: any) => (
                        <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '60%' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.service}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.image}</span>
                            {svc.ports && <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>ports: {svc.ports}</span>}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: svc.running ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: svc.running ? '#34d399' : '#f87171' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: svc.running ? '#10b981' : '#ef4444' }} />
                              {svc.status}
                            </span>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                disabled={!!deployActionLoading}
                                onClick={async () => {
                                  setDeployActionLoading(svc.service);
                                  try {
                                    const act = svc.running ? 'stop' : 'start';
                                    await fetch(`${BACKEND_URL}/automation/deploy/docker/${act}/${svc.service}`, { method: 'POST' });
                                    // Refresh status
                                    const r = await fetch(`${BACKEND_URL}/automation/deploy/summary`).then(res => res.json());
                                    if (r.ok) setDeploySummary(r);
                                  } catch {} finally { setDeployActionLoading(''); }
                                }}
                                style={{
                                  padding: '5px 10px',
                                  background: svc.running ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                  border: `1px solid ${svc.running ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
                                  borderRadius: '6px',
                                  color: svc.running ? '#f87171' : '#34d399',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}
                              >
                                {deployActionLoading === svc.service ? '...' : (svc.running ? 'Stop' : 'Start')}
                              </button>

                              {svc.running && (
                                <button
                                  disabled={!!deployActionLoading}
                                  onClick={async () => {
                                    setDeployActionLoading(svc.service);
                                    try {
                                      await fetch(`${BACKEND_URL}/automation/deploy/docker/restart/${svc.service}`, { method: 'POST' });
                                      const r = await fetch(`${BACKEND_URL}/automation/deploy/summary`).then(res => res.json());
                                      if (r.ok) setDeploySummary(r);
                                    } catch {} finally { setDeployActionLoading(''); }
                                  }}
                                  style={{
                                    padding: '5px 10px',
                                    background: 'rgba(99,102,241,0.12)',
                                    border: '1px solid rgba(99,102,241,0.25)',
                                    borderRadius: '6px',
                                    color: '#818cf8',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                >
                                  Restart
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* VPS pings & health checks list */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                    🖥️ Production VPS Health
                  </h3>
                  
                  {(!deploySummary?.vps || deploySummary?.vps?.length === 0) ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '24px 0', textAlign: 'center' }}>
                      No VPS targets configured. Click <b>Configure Connections</b> above to add targets.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {deploySummary?.vps?.map((vps: any, i: number) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{vps.name}</span>
                            <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: vps.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: vps.ok ? '#34d399' : '#f87171' }}>
                              {vps.ok ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{vps.url}</span>
                            {vps.latencyMs !== undefined && <span>{vps.latencyMs}ms latency</span>}
                          </div>
                          
                          {vps.statusCode !== undefined && (
                            <div style={{ fontSize: '0.68rem', color: vps.ok ? 'var(--text-muted)' : '#f87171' }}>
                              HTTP status: {vps.statusCode} {vps.error ? `(${vps.error})` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Vercel project deployments list */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                  ▲ Vercel Cloud Projects
                </h3>

                {!deploySummary?.vercel?.configured ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '24px 0', textAlign: 'center' }}>
                    Vercel API integration is not configured. Click <b>Configure Connections</b> to supply an authorization token.
                  </div>
                ) : deploySummary?.vercel?.error ? (
                  <div style={{ color: '#f87171', fontSize: '0.82rem', padding: '16px 0', textAlign: 'center' }}>
                    Error fetching Vercel projects: {deploySummary?.vercel?.error}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {deploySummary?.vercel?.projects?.map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: p.deployState === 'READY' ? 'rgba(16,185,129,0.12)' : p.deployState === 'BUILDING' ? 'rgba(99,102,241,0.12)' : 'rgba(239,68,68,0.12)',
                            color: p.deployState === 'READY' ? '#34d399' : p.deployState === 'BUILDING' ? '#818cf8' : '#f87171',
                            textTransform: 'uppercase'
                          }}>
                            {p.deployState}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span>Framework: {p.framework || 'Other'}</span>
                          {p.lastDeploy && <span>Deploy: {new Date(p.lastDeploy).toLocaleDateString()}</span>}
                        </div>

                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--primary)', textDecoration: 'none', marginTop: '4px' }}
                          >
                            Live deployment link ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Cloud services connection checklists */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                
                {/* Sentry */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Sentry Integration</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: deploySummary?.integrations?.sentry?.configured ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: deploySummary?.integrations?.sentry?.configured ? '#34d399' : 'var(--text-muted)' }}>
                      {deploySummary?.integrations?.sentry?.configured ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Check issues, error logs, and frontend/backend performance exceptions directly from the dashboard.
                  </p>
                </div>

                {/* Cloudflare */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cloudflare Tunnels</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: deploySummary?.integrations?.cloudflare?.configured ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: deploySummary?.integrations?.cloudflare?.configured ? '#34d399' : 'var(--text-muted)' }}>
                      {deploySummary?.integrations?.cloudflare?.configured ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Route local service endpoints to DNS zones automatically. Track tunnel latency and status.
                  </p>
                </div>

                {/* AWS Dashboard */}
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>AWS EC2/S3 Controls</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: deploySummary?.integrations?.aws?.configured ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: deploySummary?.integrations?.aws?.configured ? '#34d399' : 'var(--text-muted)' }}>
                      {deploySummary?.integrations?.aws?.configured ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Query S3 bucket telemetry, start/stop instances, and check remaining monthly budget.
                  </p>
                </div>

              </div>

            </div>

          /* ══════════════════════════ AGENT CONTROL CENTER ══════════════════════════ */
          ) : activeTab === 'agentcenter' ? (
            <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Agent Control Center</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Monitor running agents and view task history. Auto-refreshes every 5s.</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {agentStatus.running.length > 0 && (
                    <span style={{ padding: '4px 10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', fontSize: '0.75rem', color: '#34d399' }}>
                      ⟳ {agentStatus.running.length} running
                    </span>
                  )}
                </div>
              </div>

              {/* Running Tasks */}
              {agentStatus.running.length > 0 && (
                <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '16px', color: '#34d399' }}>🟢 Active Tasks</div>
                  {agentStatus.running.map((task: any) => (
                    <div key={task.id} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ fontWeight: 600 }}>{task.action}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{task.agentId} · {task.mode}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Prompt: {task.prompt}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>Started: {new Date(task.startedAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* History Table */}
              <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Task History</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>Last {agentStatus.history.length} tasks</span>
                </div>
                {agentStatus.history.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No task history yet. Run an agent from the Research, Business, or other agent pages.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                        {['Status', 'Agent', 'Action', 'Mode', 'Started', 'Duration'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {agentStatus.history.map((task: any, i: number) => (
                        <tr key={task.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', background: task.status === 'done' ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)', color: task.status === 'done' ? '#818cf8' : '#f87171' }}>
                              {task.status === 'done' ? '✓ Done' : '✗ Error'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{task.agentId}</td>
                          <td style={{ padding: '10px 16px', fontSize: '0.82rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.action}</td>
                          <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{task.mode}</td>
                          <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(task.startedAt).toLocaleTimeString()}</td>
                          <td style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{task.durationMs ? `${(task.durationMs / 1000).toFixed(1)}s` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          /* ══════════════════════════ ENVIRONMENT MANAGER ══════════════════════════ */
          ) : activeTab === 'envmanager' ? (
            <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Environment Manager</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Manage per-project environment variables across environments. Values are hidden by default.</p>
              </div>

              {/* Project + Environment Selector */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em' }}>PROJECT</label>
                    <select
                      value={envProjectId}
                      onChange={e => { setEnvProjectId(e.target.value); setEnvVariables([]); setEnvRevealMap({}); }}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '9px 12px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      <option value="">Select a project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em' }}>ENVIRONMENT</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['development', 'staging', 'production'] as const).map(env => (
                        <button key={env} onClick={() => setEnvEnvironment(env)} style={{ padding: '8px 14px', borderRadius: '8px', border: `1px solid ${envEnvironment === env ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)'}`, background: envEnvironment === env ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: envEnvironment === env ? '#818cf8' : 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                          {env}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {envProjectId && (
                <>
                  {/* Variables Table */}
                  <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Variables</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{envVariables.length} keys</span>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={async () => {
                            try {
                              const r = await fetch(`${BACKEND_URL}/automation/env/${envProjectId}/${envEnvironment}/import`, { method: 'POST' });
                              const d = await r.json();
                              if (d.ok) { setEnvVariables([]); setTimeout(async () => { const d2 = await fetch(`${BACKEND_URL}/automation/env/${envProjectId}/${envEnvironment}`).then(r => r.json()); if (d2.ok) setEnvVariables(d2.variables || []); }, 300); alert(`Imported ${d.imported} variables from .env`); }
                            } catch { alert('Import failed'); }
                          }}
                          style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
                        >Import from .env</button>
                        <button
                          onClick={async () => {
                            if (!confirm('This will overwrite the .env file in the project root. Continue?')) return;
                            const r = await fetch(`${BACKEND_URL}/automation/env/${envProjectId}/${envEnvironment}/export`, { method: 'POST' });
                            const d = await r.json();
                            if (d.ok) alert(`Exported ${d.count} variables to ${d.exportedTo}`);
                          }}
                          style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: '#818cf8', fontSize: '0.78rem', cursor: 'pointer' }}
                        >Export .env</button>
                      </div>
                    </div>

                    {envLoading ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading variables...</div>
                    ) : (
                      <div>
                        {envVariables.length === 0 && (
                          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No variables yet. Add one below or import from an existing .env file.
                          </div>
                        )}
                        {envVariables.map((v, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto auto auto', gap: '8px', padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                            <input
                              value={v.key}
                              onChange={e => { const nv = [...envVariables]; nv[i] = { ...nv[i], key: e.target.value }; setEnvVariables(nv); }}
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: '#fff', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                              placeholder="KEY_NAME"
                            />
                            <input
                              value={envRevealMap[String(i)] ? v.value : v.value ? '••••••••' : ''}
                              readOnly={!envRevealMap[String(i)]}
                              onChange={e => { if (envRevealMap[String(i)]) { const nv = [...envVariables]; nv[i] = { ...nv[i], value: e.target.value }; setEnvVariables(nv); } }}
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', color: envRevealMap[String(i)] ? '#fff' : 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                              placeholder="value"
                            />
                            <button onClick={() => setEnvRevealMap(m => ({ ...m, [String(i)]: !m[String(i)] }))} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }} title={envRevealMap[String(i)] ? 'Hide' : 'Reveal'}>
                              {envRevealMap[String(i)] ? '🙈' : '👁️'}
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(v.value); }} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem' }} title="Copy value">📋</button>
                            <button onClick={() => { const nv = envVariables.filter((_, j) => j !== i); setEnvVariables(nv); }} style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#f87171', fontSize: '0.75rem' }} title="Remove">×</button>
                          </div>
                        ))}

                        {/* Add new row */}
                        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <button
                            onClick={() => setEnvVariables([...envVariables, { key: '', value: '', description: '' }])}
                            style={{ padding: '8px 14px', background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: '8px', color: '#818cf8', fontSize: '0.82rem', cursor: 'pointer' }}
                          >
                            + Add Variable
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={async () => {
                        setEnvSaving(true);
                        try {
                          await fetch(`${BACKEND_URL}/automation/env/${envProjectId}/${envEnvironment}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ variables: envVariables }),
                          });
                          alert('Variables saved successfully!');
                        } catch { alert('Failed to save.'); } finally { setEnvSaving(false); }
                      }}
                      style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      {envSaving ? 'Saving...' : 'Save Variables'}
                    </button>
                  </div>
                </>
              )}
            </div>

          /* ══════════════════════════ PROJECTS TAB ══════════════════════════ */
          ) : activeTab === 'projects' ? (

            <>
              <HeartbeatMonitor backendUrl={BACKEND_URL} />

              {error && <div style={styles.errorBanner}>{error}</div>}

              {loading ? (
                <div style={styles.loadingGrid}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={styles.projectCardPlaceholder} className="glass-panel shimmer-bg"></div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div style={styles.emptyState} className="glass-panel" onClick={() => setIsOpen(true)}>
                  <div style={styles.emptyIcon}>
                    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9" />
                    </svg>
                  </div>
                  <h3>No projects registered</h3>
                  <p>Click here to link a project directory and start orchestrating agents.</p>
                </div>
              ) : (
                <div style={styles.projectGrid}>
                  {projects.map(project => {
                    const stackArr: string[] = (() => { try { return JSON.parse(project.stack || '[]'); } catch { return []; } })();
                    const tagsArr: string[] = (() => { try { return JSON.parse(project.tags || '[]'); } catch { return []; } })();
                    return (
                    <div key={project.id} style={{ position: 'relative' }}>
                      <Link href={`/workspace/${project.id}`} style={{ textDecoration: 'none' }}>
                        <div style={styles.projectCard} className="glass-panel">
                          <div style={styles.cardHeader}>
                            <div style={styles.cardFolderIcon}>
                              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9" />
                              </svg>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                              <button style={{ ...styles.deleteButton, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '6px', padding: '4px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProject(project); setEditDesc(project.description || ''); setEditStack(stackArr.join(', ')); setEditTags(tagsArr.join(', ')); }}
                              >Edit</button>
                              <button style={styles.deleteButton} onClick={(e) => handleDelete(project.id, e)}>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '0', gap: '6px' }}>
                            <h3 style={{ ...styles.projectName, margin: 0, lineHeight: '1.3' }}>{project.name}</h3>
                            {project.description && (
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{project.description}</p>
                            )}
                            <div style={{ ...styles.projectPath, margin: 0, lineHeight: '1.2' }} title={project.path}>
                              {project.path}
                            </div>
                            {stackArr.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {stackArr.map((s: string) => (
                                  <span key={s} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={styles.cardFooter}>
                            <span>Registered: {new Date(project.createdAt).toLocaleDateString()}</span>
                            <span style={styles.openText}>Open Workspace →</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                    );
                  })}

                </div>
              )}
            </>
          ) : activeTab === 'automation' ? (
            <AutomationView backendUrl={BACKEND_URL} />

          ) : activeTab === 'n8n' ? (
            <AutomationView backendUrl={BACKEND_URL} />

          ) : activeTab === 'docker' ? (
            <DockerView backendUrl={BACKEND_URL} />

          ) : activeTab === 'obsidian' ? (
            <ObsidianView backendUrl={BACKEND_URL} />

          ) : activeTab === 'aiworkspace' ? (
            <AIWorkspaceView backendUrl={BACKEND_URL} projects={projects} />

          ) : activeTab === 'intelligence' ? (
            <IntelligenceView backendUrl={BACKEND_URL} />

          ) : activeTab === 'notion' ? (
            <NotionView />

          ) : activeTab === 'github' ? (
            <GitHubView backendUrl={BACKEND_URL} />

          ) : activeTab === 'dbexplorer' ? (
            <DatabaseExplorerView backendUrl={BACKEND_URL} projects={projects} />

          ) : activeTab === 'apiclient' ? (
            <ApiClientView />

          ) : activeTab === 'git' ? (
            <GitManagerView backendUrl={BACKEND_URL} projects={projects} />

          ) : activeTab === 'mt5' ? (
            <MT5BridgeView backendUrl={BACKEND_URL} projects={projects} />

          ) : activeTab === 'terminal' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }} className="animate-fade-in">
              {/* Layout toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginRight: '6px', fontFamily: 'var(--font-mono)' }}>LAYOUT</span>
                {/* Single */}
                <button onClick={() => setTerminalLayout('single')} title="Single pane" style={{ background: terminalLayout === 'single' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${terminalLayout === 'single' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='single'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/></svg>
                </button>
                {/* Left / Right */}
                <button onClick={() => setTerminalLayout('lr')} title="Left / Right split" style={{ background: terminalLayout === 'lr' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${terminalLayout === 'lr' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='lr'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/><rect x="9" y="1" width="6" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='lr'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/></svg>
                </button>
                {/* Top / Bottom */}
                <button onClick={() => setTerminalLayout('tb')} title="Top / Bottom split" style={{ background: terminalLayout === 'tb' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${terminalLayout === 'tb' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='tb'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/><rect x="1" y="9" width="14" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='tb'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/></svg>
                </button>
                {/* 2x2 Grid */}
                <button onClick={() => setTerminalLayout('grid')} title="2×2 grid" style={{ background: terminalLayout === 'grid' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)', border: `1px solid ${terminalLayout === 'grid' ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='grid'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='grid'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='grid'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill={terminalLayout==='grid'?'rgba(99,102,241,0.3)':'rgba(255,255,255,0.1)'}/></svg>
                </button>
              </div>

              {/* Terminal panes */}
              <div style={{
                flex: 1, minHeight: 0,
                display: 'grid',
                gap: '3px',
                background: '#060709',
                gridTemplateColumns: terminalLayout === 'lr' || terminalLayout === 'grid' ? '1fr 1fr' : '1fr',
                gridTemplateRows: terminalLayout === 'tb' || terminalLayout === 'grid' ? '1fr 1fr' : '1fr',
              }}>
                {[...Array(terminalLayout === 'grid' ? 4 : terminalLayout === 'lr' || terminalLayout === 'tb' ? 2 : 1)].map((_, i) => (
                  <div key={i} style={{ background: '#0d0f14', overflow: 'hidden', padding: '8px' }}>
                    <WorkspaceTerminal projectId="system" />
                  </div>
                ))}
              </div>
            </div>
          ) : activeAgent ? (
            <div style={{ ...styles.agentViewerContainer, ...(activeAgent.type === 'local' ? { padding: 0, overflow: 'hidden' } : {}) }} className="glass-panel animate-fade-in">
              {activeAgent.type === 'local' ? (
                ['research', 'business', 'marketing', 'sales', 'finance', 'personal'].includes(activeAgent.id) ? (
                  <AgentCockpit agent={activeAgent} backendUrl={BACKEND_URL} />
                ) : (
                  /* Local agents (Hermes, OpenCode) → full terminal */
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Agent header bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeAgent.color, boxShadow: `0 0 8px ${activeAgent.color}`, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
                        {activeAgent.name} — System Shell
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                        cwd: Orchestrator/backend
                      </span>
                    </div>
                    {/* Terminal body */}
                    <div style={{ flex: 1, minHeight: 0, padding: '8px', background: '#0d0f14' }}>
                      <WorkspaceTerminal
                        projectId="system"
                        initialCommand={
                          activeAgent.id === 'opencode' ? 'opencode' :
                          activeAgent.id === 'hermes'   ? 'hermes'   :
                          activeAgent.id === 'aider'    ? 'aider'    :
                          activeAgent.id === 'gptengineer' ? 'gpt-engineer' :
                          activeAgent.id === 'openhands' ? 'openhands' :
                          activeAgent.id === 'cline'    ? 'cline'    :
                          undefined
                        }
                      />
                    </div>
                  </div>
                )
              ) : (
                /* External agents → iframe */
                <div style={styles.agentViewerFrame}>
                  <iframe
                    src={activeAgent.url}
                    style={styles.iframe}
                    title={`${activeAgent.name} Web Preview`}
                  />
                </div>
              )}
            </div>
          ) : null}

        </main>

        {/* ── Edit Project Modal ── */}
        {editingProject && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingProject(null); }}>
            <div className="glass-panel" style={{ width: '480px', borderRadius: '16px', padding: '28px', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Edit Project</h2>
                <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>{editingProject.name}</span>
                <button onClick={() => setEditingProject(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em' }}>DESCRIPTION</label>
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
                    placeholder="Brief description of this project..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em' }}>TECH STACK <span style={{ color: 'rgba(255,255,255,0.25)' }}>(comma-separated)</span></label>
                  <input value={editStack} onChange={e => setEditStack(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    placeholder="NestJS, Next.js, PostgreSQL, Docker"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.06em' }}>TAGS <span style={{ color: 'rgba(255,255,255,0.25)' }}>(comma-separated)</span></label>
                  <input value={editTags} onChange={e => setEditTags(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    placeholder="trading, backend, production"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setEditingProject(null)} style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.88rem' }}>
                  Cancel
                </button>
                <button
                  disabled={editSaving}
                  onClick={async () => {
                    setEditSaving(true);
                    try {
                      const stack = editStack.split(',').map(s => s.trim()).filter(Boolean);
                      const tags = editTags.split(',').map(s => s.trim()).filter(Boolean);
                      await api.updateProject(editingProject.id, { description: editDesc, stack, tags });
                      await loadProjects();
                      setEditingProject(null);
                    } catch { alert('Failed to save project metadata.'); } finally { setEditSaving(false); }
                  }}
                  style={{ padding: '9px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Floating Terminal Panel ── */}
        {terminalOpen && (
          <div
            className="animate-fade-in"
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: terminalMinimized ? '40px' : '300px',
              background: '#0d0f14',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column',
              transition: 'height 0.25s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 50,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Terminal Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', height: '40px', minHeight: '40px', paddingLeft: '14px', paddingRight: '10px', borderBottom: terminalMinimized ? 'none' : '1px solid rgba(255,255,255,0.06)', gap: '8px', userSelect: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', flex: 1 }}>System Terminal — Orchestrator</span>
              {/* Minimize / Restore */}
              <button
                onClick={() => setTerminalMinimized(m => !m)}
                title={terminalMinimized ? 'Restore' : 'Minimize'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'rgba(255,255,255,0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              >
                {terminalMinimized
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6" /></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                }
              </button>
              {/* Close */}
              <button
                onClick={() => setTerminalOpen(false)}
                title="Close Terminal"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'rgba(255,255,255,0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Terminal Body */}
            {!terminalMinimized && (
              <div style={{ flex: 1, minHeight: 0, padding: '8px' }}>
                <WorkspaceTerminal projectId="system" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-panel animate-fade-in">
            <div style={styles.modalHeader}>
              <h3>Register New Workspace</h3>
              <button style={styles.closeButton} onClick={() => setIsOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} style={styles.form}>
              {createError && <div style={styles.modalError}>{createError}</div>}
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Awesome App"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Local Folder Path or Git Repository URL</label>
                <div style={styles.inputWithButton}>
                  <input
                    type="text"
                    placeholder="e.g. D:\Projects\App or https://github.com/user/repo.git"
                    value={path}
                    onChange={e => setPath(e.target.value)}
                    required
                    style={styles.pathInputWithButton}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={styles.browseButton}
                    onClick={() => setIsPickerOpen(true)}
                  >
                    Browse...
                  </button>
                </div>
                <span style={styles.inputHelp}>
                  For local paths, select/enter the directory. For remote production, paste any Git repository URL to clone it.
                </span>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.btnCancel} className="btn-secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={createLoading}>
                  {createLoading ? 'Validating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Picker Modal */}
      <FolderPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(selectedPath) => setPath(selectedPath)}
        initialPath={path}
      />

      {/* Create Agent Modal */}
      {isAgentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-panel animate-fade-in">
            <div style={styles.modalHeader}>
              <h3>Add Custom Agent Shortcut</h3>
              <button style={styles.closeButton} onClick={() => setIsAgentModalOpen(false)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddAgent} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Custom ChatGPT"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Web URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://chatgpt.com/g/g-xxxxx"
                  value={newAgentUrl}
                  onChange={e => setNewAgentUrl(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Helper for parsing database models"
                  value={newAgentDesc}
                  onChange={e => setNewAgentDesc(e.target.value)}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Branding Accent Color</label>
                <div style={styles.colorPresetContainer}>
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      style={{
                        ...styles.colorPresetBtn,
                        background: preset.value,
                        boxShadow: newAgentColor === preset.value ? `0 0 0 3px #fff, 0 0 10px ${preset.value}` : 'none',
                      }}
                      onClick={() => setNewAgentColor(preset.value)}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Avatar Icon</label>
                <div style={styles.iconPresetContainer}>
                  {iconPresets.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      style={{
                        ...styles.iconPresetBtn,
                        background: newAgentIcon === icon ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        borderColor: newAgentIcon === icon ? 'var(--primary)' : 'transparent',
                      }}
                      onClick={() => setNewAgentIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.btnCancel} className="btn-secondary" onClick={() => setIsAgentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Global Configurations Manager Modal */}
      {isGlobalSettingsOpen && (
        <GlobalSettingsModal
          isOpen={isGlobalSettingsOpen}
          onClose={() => setIsGlobalSettingsOpen(false)}
          backendUrl={BACKEND_URL}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    padding: '0',
  },
  backgroundBlur: {
    position: 'fixed',
    top: '-10%',
    left: '-10%',
    width: '120vw',
    height: '120vh',
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 40%)',
    zIndex: -2,
    pointerEvents: 'none',
  },
  gridOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    zIndex: -1,
    pointerEvents: 'none',
  },
  logoArea: {
    display: 'inline-flex',
    marginTop: '8px',
  },
  logoText: {
    fontSize: '1.6rem',
    fontWeight: '900',
    letterSpacing: '0.1em',
    background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  sidebar: {
    width: '280px',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flexShrink: 0,
    height: '100%',
    overflow: 'hidden',
    background: 'var(--panel-bg)',
    borderRight: '1px solid var(--panel-border)',
    borderRadius: '0',
    borderLeft: 'none',
    borderTop: 'none',
    borderBottom: 'none',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    paddingBottom: '12px',
    marginTop: '12px',
  },
  sidebarTitleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--success)',
    boxShadow: '0 0 8px var(--success)',
    animation: 'pulseGlow 2s infinite',
  },
  sidebarTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  addAgentBtn: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    padding: '4px',
    borderRadius: '4px',
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '4px',
  },
  agentCard: {
    position: 'relative',
    background: 'rgba(255, 255, 255, 0.5)',
    border: '1px solid var(--panel-border)',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  agentGlowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    opacity: 0.7,
  },
  agentCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  agentLogoArea: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  agentIcon: {
    fontSize: '1.5rem',
    lineHeight: '1',
  },
  agentName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  agentTypeBadge: {
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  agentActionButtons: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  agentLaunchBtn: {
    fontSize: '0.8rem',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    background: 'rgba(0, 0, 0, 0.02)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    padding: '4px 6px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  agentDelBtn: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    lineHeight: '1',
    padding: '2px 4px',
  },
  agentDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  colorPresetContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  colorPresetBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  iconPresetContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  iconPresetBtn: {
    fontSize: '1.25rem',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    cursor: 'pointer',
  },
  rightArea: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 32px',
    borderBottom: '1px solid var(--panel-border)',
    background: 'var(--panel-bg)',
    flexShrink: 0,
  },
  breadcrumbArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  breadcrumbRoot: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  breadcrumbSeparator: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
  },
  breadcrumbActive: {
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  topBarActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto',
    background: 'var(--background)',
  },
  errorBanner: {
    background: 'var(--error-glow)',
    border: '1px solid var(--error)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    flexShrink: 0,
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
  },
  loadingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
  },
  projectCardPlaceholder: {
    height: '180px',
    borderRadius: '12px',
  },
  projectCard: {
    height: '180px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFolderIcon: {
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.08)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    fontSize: '1.25rem',
    color: '#ffffff',
    marginTop: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectPath: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'var(--font-mono)',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '16px',
    borderTop: '1px solid var(--panel-border)',
    paddingTop: '12px',
  },
  openText: {
    color: 'var(--primary)',
    fontWeight: '600',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center',
    cursor: 'pointer',
    gap: '12px',
  },
  emptyIcon: {
    color: 'var(--text-muted)',
    background: 'rgba(0,0,0,0.01)',
    padding: '20px',
    borderRadius: '50%',
    marginBottom: '8px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '100%',
    maxWidth: '520px',
    padding: '32px',
    borderRadius: '16px',
    position: 'relative',
    background: 'var(--card-bg)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    border: '1px solid var(--panel-border)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  closeButton: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalError: {
    background: 'var(--error-glow)',
    border: '1px solid var(--error)',
    color: '#ef4444',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputWithButton: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  pathInputWithButton: {
    flex: 1,
  },
  browseButton: {
    padding: '8px 12px',
    height: '38px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
  },
  label: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  inputHelp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px',
  },
  btnCancel: {
    padding: '10px 20px',
  },
  agentViewerContainer: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  agentViewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--panel-border)',
    background: 'var(--panel-bg)',
  },
  agentViewerTitleArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  agentViewerIcon: {
    fontSize: '1.75rem',
  },
  agentViewerName: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  agentViewerStatus: {
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  agentViewerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  btnPrimaryViewer: {
    background: 'var(--primary)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  btnSecondaryViewer: {
    background: '#16181d',
    border: '1px solid var(--panel-border)',
    color: 'var(--text-primary)',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textDecoration: 'none',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  },
  agentViewerFrame: {
    flex: 1,
    position: 'relative',
    background: 'var(--background)',
    padding: '12px',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: '1px solid var(--panel-border)',
    borderRadius: '8px',
    background: 'var(--background)',
  },
  portalPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    padding: '40px',
    position: 'relative',
    textAlign: 'center',
    zIndex: 1,
  },
  portalGlow: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.05,
    zIndex: -1,
  },
  portalTitle: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  portalDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    maxWidth: '500px',
    lineHeight: '1.6',
  },
  sidebarSearchContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#0d0e12',
    border: '1px solid var(--panel-border)',
    borderRadius: '8px',
    padding: '8px 12px',
    marginTop: '12px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  sidebarSearchInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sidebarSearchKbd: {
    background: '#1d1e22',
    color: 'var(--text-muted)',
    border: 'none',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
  },
};
