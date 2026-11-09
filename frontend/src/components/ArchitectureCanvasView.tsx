'use client';

import { useState } from 'react';
import { Network, Plus, Server, Database, Cloud, Cpu, Sparkles, Layers, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface CanvasNode {
  id: string;
  label: string;
  tech: string;
  type: 'gateway' | 'ingress' | 'frontend' | 'backend' | 'database' | 'cache' | 'service';
  x: number;
  y: number;
  status: 'healthy' | 'warning' | 'idle';
  port?: number;
}

const DEFAULT_NODES: CanvasNode[] = [
  { id: 'node-1', label: 'Next.js 16 Web Client', tech: 'Next.js / Tailwind / TS', type: 'frontend', x: 80, y: 140, status: 'healthy', port: 3010 },
  { id: 'node-2', label: 'Telegram Mobile Remote Bot', tech: 'Telegraf / Webhook', type: 'ingress', x: 80, y: 300, status: 'healthy' },
  { id: 'node-3', label: 'Nginx Gateway & SSL Reverse Proxy', tech: 'Nginx / Certbot', type: 'gateway', x: 340, y: 220, status: 'healthy', port: 443 },
  { id: 'node-4', label: 'NestJS Orchestration Daemon', tech: 'NestJS 11 / Node-PTY', type: 'backend', x: 600, y: 160, status: 'healthy', port: 8001 },
  { id: 'node-5', label: 'n8n Visual Automation Workflows', tech: 'n8n / Webhooks', type: 'service', x: 600, y: 320, status: 'healthy', port: 5678 },
  { id: 'node-6', label: 'PostgreSQL 16 & SQLite Engine', tech: 'Prisma ORM / SQLite / PG', type: 'database', x: 880, y: 140, status: 'healthy', port: 5432 },
  { id: 'node-7', label: 'Redis 7 Event Bus & Cache', tech: 'Redis / BullMQ', type: 'cache', x: 880, y: 280, status: 'healthy', port: 6379 },
  { id: 'node-8', label: 'Obsidian Engineering Vault', tech: 'Markdown Mirror', type: 'database', x: 880, y: 400, status: 'healthy' },
];

export default function ArchitectureCanvasView() {
  const [nodes, setNodes] = useState<CanvasNode[]>(DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(DEFAULT_NODES[3]);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [label, setLabel] = useState('');
  const [tech, setTech] = useState('Microservice');
  const [type, setType] = useState<CanvasNode['type']>('backend');
  const [port, setPort] = useState('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const getNodeIcon = (nodeType: CanvasNode['type']) => {
    switch (nodeType) {
      case 'gateway': return <Cloud size={16} style={{ color: '#38bdf8' }} />;
      case 'ingress': return <Cpu size={16} style={{ color: '#a855f7' }} />;
      case 'frontend': return <Layers size={16} style={{ color: '#10b981' }} />;
      case 'backend': return <Server size={16} style={{ color: '#6366f1' }} />;
      case 'database': return <Database size={16} style={{ color: '#f59e0b' }} />;
      case 'cache': return <Database size={16} style={{ color: '#ef4444' }} />;
      default: return <Server size={16} style={{ color: '#6366f1' }} />;
    }
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const newNode: CanvasNode = {
      id: `node-${Date.now().toString().slice(-4)}`,
      label: label.trim(),
      tech: tech.trim(),
      type,
      x: 400 + Math.floor(Math.random() * 80),
      y: 200 + Math.floor(Math.random() * 80),
      status: 'healthy',
      port: port ? parseInt(port, 10) : undefined,
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setLabel('');
    setPort('');
    setIsAddingNode(false);
  };

  const handleExportTopology = () => {
    const topologySummary = nodes.map(n => `- **${n.label}** (${n.tech})${n.port ? ` on port :${n.port}` : ''} [${n.type.toUpperCase()}]`).join('\n');
    const text = `# System Architecture Topology\n\n${topologySummary}\n\nGenerated from Orchestrator Interactive Architecture Canvas`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1250px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: 'calc(100vh - 120px)' }}>
      
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Network size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                Interactive Architecture Canvas
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Visual node-graph modeling. Click any component to inspect runtime configs, ports, and data flow.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsAddingNode(!isAddingNode)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--panel-border)', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            <Plus size={14} />
            <span>Add Node</span>
          </button>
          <button
            onClick={handleExportTopology}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #6366f1, #38bdf8)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
          >
            {copiedSuccess ? <Check size={14} /> : <Sparkles size={14} />}
            <span>{copiedSuccess ? 'Topology Copied!' : 'Copy Architecture Spec'}</span>
          </button>
        </div>
      </div>

      {/* Add Node Modal / Drawer */}
      {isAddingNode && (
        <form onSubmit={handleAddNode} className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', border: '1px solid #38bdf8' }}>
          <input
            type="text"
            placeholder="Node Name (e.g. Auth Service)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ flex: 2, minWidth: '200px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            required
          />
          <input
            type="text"
            placeholder="Tech Stack (e.g. NestJS / JWT)"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            style={{ flex: 2, minWidth: '180px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
          <select
            value={type}
            onChange={(e: any) => setType(e.target.value)}
            style={{ padding: '8px 10px', background: '#1e2029', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
          >
            <option value="frontend">Frontend / UI</option>
            <option value="ingress">Ingress / Remote</option>
            <option value="gateway">API Gateway / Proxy</option>
            <option value="backend">Backend Service</option>
            <option value="database">Database</option>
            <option value="cache">Cache / Queue</option>
            <option value="service">Automation / Worker</option>
          </select>
          <input
            type="number"
            placeholder="Port (e.g. 8000)"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            style={{ width: '110px', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
          />
          <button
            type="submit"
            style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Add
          </button>
        </form>
      )}

      {/* Main Graph Canvas Body */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: '520px', overflow: 'hidden' }}>
        
        {/* Visual Graph Viewport */}
        <div
          className="glass-panel"
          style={{
            flex: 3,
            position: 'relative',
            borderRadius: '16px',
            background: 'radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.4) 0%, rgba(13, 14, 18, 0.95) 100%)',
            overflow: 'auto',
            border: '1px solid var(--panel-border)',
            padding: '40px',
          }}
        >
          {/* Subtle Grid Pattern Overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

          {/* Render Nodes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', position: 'relative', zIndex: 1 }}>
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getNodeIcon(node.type)}
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                        {node.type}
                      </span>
                    </div>
                    {node.port && (
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                        :{node.port}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' }}>
                      {node.label}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {node.tech}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: node.status === 'healthy' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ● {node.status}
                    </span>
                    <span style={{ fontSize: '0.68rem' }}>Inspect &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: '280px',
            maxWidth: '360px',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--panel-border)',
          }}
        >
          {selectedNode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {selectedNode.type} Node
                  </span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                    {selectedNode.label}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Technology</div>
                  <div style={{ color: '#fff', fontWeight: '600', marginTop: '2px' }}>{selectedNode.tech}</div>
                </div>

                {selectedNode.port && (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Listening Port</div>
                    <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>http://127.0.0.1:{selectedNode.port}</code>
                  </div>
                )}

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Runtime Health</div>
                  <div style={{ color: '#10b981', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} />
                    <span>Operational & Ready</span>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Data Flow Ingress</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Communicates via HTTP REST endpoints & WebSocket duplex streams with JWT authentication.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Select a component to inspect details.
            </div>
          )}

          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleExportTopology}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--panel-border)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Sparkles size={14} style={{ color: '#6366f1' }} />
              <span>Export Architecture Config</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

