'use client';

import { useState, useEffect } from 'react';
import { api, PlaybookEntry } from '@/lib/api';
import {
  Brain,
  Layers,
  Plus,
  Search,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Tag,
  Sparkles,
  RefreshCw,
  FolderSync
} from 'lucide-react';

const SEED_PLAYBOOK: PlaybookEntry[] = [
  {
    id: 'adr-001',
    type: 'DECISION',
    title: 'Use Prisma ORM with SQLite (Local) and PostgreSQL Connection Pooling',
    content: 'Adopted Prisma ORM v6 with pgBouncer for high-concurrency connection pooling in production, and SQLite for lightweight local dev.',
    tags: 'database,prisma,sqlite,postgresql',
    scope: 'Reusable',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'adr-002',
    type: 'DECISION',
    title: 'Centralized Secret Vault & Zero-Plaintext Policy',
    content: 'All API credentials and secrets stored encrypted in memory vault, never committed to git or exposed to browser client.',
    tags: 'security,secrets,env',
    scope: 'Global',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pat-001',
    type: 'PATTERN',
    title: 'Webhook Signature HMAC-SHA256 Verification Guard',
    content: 'Problem: Third-party webhooks vulnerable to replay attacks. Solution: Inject raw body parser middleware before express.json() and verify HMAC-SHA256 signature with signing secret.',
    tags: 'security,webhooks,nest',
    scope: 'Reusable',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pat-002',
    type: 'PATTERN',
    title: 'Optimistic UI Updates with Rollback Compensation',
    content: 'Problem: High network latency causes sluggish UI. Solution: Immediately apply optimistic state update in React with a rollback snapshot on error.',
    tags: 'react,ux,frontend',
    scope: 'Reusable',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'les-001',
    type: 'LESSON',
    title: 'Hard-cap retries to 3 attempts on autonomous agent loops',
    content: 'Autonomous debugging agents can run in circles on missing imports. Cap retries to 3 and require human-in-the-loop approval if confidence is < 80%.',
    tags: 'ai,agents,orchestration',
    scope: 'Global',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'anti-001',
    type: 'ANTI_PATTERN',
    title: 'Never use process-local in-memory caching across multi-replica containers',
    content: 'What Happened: Multiple container replicas had out-of-sync session states when scaling up. Solution: Switched to centralized Redis cache cluster with pub/sub invalidation.',
    tags: 'docker,redis,caching',
    scope: 'Global',
    createdAt: new Date().toISOString(),
  },
];

export default function EngineeringPlaybookView() {
  const [entries, setEntries] = useState<PlaybookEntry[]>(SEED_PLAYBOOK);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'DECISION' | 'PATTERN' | 'LESSON' | 'ANTI_PATTERN'>('DECISION');
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Global' | 'Reusable'>('All');
  const [search, setSearch] = useState('');

  // New entry form
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [scope, setScope] = useState('Reusable');

  const loadPlaybook = async () => {
    try {
      setLoading(true);
      const res = await api.getPlaybook(activeTab);
      if (res && res.length > 0) {
        setEntries(res);
      }
    } catch (err) {
      // Fallback to seed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaybook();
  }, [activeTab]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const newEntry = await api.createPlaybookEntry({
        type: activeTab,
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim() || undefined,
        scope,
      });
      setEntries([newEntry, ...entries]);
      setTitle('');
      setContent('');
      setTags('');
      setIsAdding(false);
    } catch (err: any) {
      alert(`Failed to save playbook entry: ${err.message}`);
    }
  };

  const filtered = entries.filter((e) => {
    const matchesTab = e.type === activeTab;
    const matchesScope = scopeFilter === 'All' || e.scope === scopeFilter;
    const matchesSearch =
      search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesScope && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '8px 0 40px 0' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Brain size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Cross-Project Engineering Playbook & 4-Tier Memory
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Capture proven patterns, architectural decisions, and anti-patterns ("We tried this before and it failed") to accelerate new builds.
            </p>
          </div>
        </div>

        {/* Obsidian Mirror Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#a78bfa' }}>
          <FolderSync size={14} />
          <span>Obsidian Mirror: <code>D:\AI\Obsidian</code></span>
        </div>
      </div>

      {/* Tabs Bar: Decisions, Patterns, Lessons, Anti-Patterns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
          <button
            onClick={() => setActiveTab('DECISION')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'DECISION' ? '#6366f1' : 'transparent',
              color: activeTab === 'DECISION' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Decisions (ADRs)
          </button>
          <button
            onClick={() => setActiveTab('PATTERN')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'PATTERN' ? '#10b981' : 'transparent',
              color: activeTab === 'PATTERN' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Proven Patterns
          </button>
          <button
            onClick={() => setActiveTab('LESSON')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'LESSON' ? '#f59e0b' : 'transparent',
              color: activeTab === 'LESSON' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Lessons Learned
          </button>
          <button
            onClick={() => setActiveTab('ANTI_PATTERN')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'ANTI_PATTERN' ? '#ef4444' : 'transparent',
              color: activeTab === 'ANTI_PATTERN' ? '#fff' : 'var(--text-muted)',
            }}
          >
            Mistakes & Anti-Patterns
          </button>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={15} />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Search & Scope Filter */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={`Search ${activeTab.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Global', 'Reusable'].map((sc) => (
            <button
              key={sc}
              onClick={() => setScopeFilter(sc as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                border: '1px solid var(--panel-border)',
                background: scopeFilter === sc ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: scopeFilter === sc ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {sc}
            </button>
          ))}
        </div>
      </div>

      {/* Add Entry Form Drawer */}
      {isAdding && (
        <form onSubmit={handleCreateEntry} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #6366f1' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
            Add New {activeTab === 'DECISION' ? 'Architectural Decision Record (ADR)' : activeTab}
          </h3>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Title or summary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ flex: 2, minWidth: '260px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              required
            />
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{ flex: 1, minWidth: '160px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            />
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              style={{ padding: '8px 10px', background: '#1e2029', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value="Reusable">Reusable (Cross-Project)</option>
              <option value="Global">Global Ecosystem</option>
              <option value="Project">Project Specific</option>
            </select>
          </div>

          <textarea
            placeholder="Detailed rationale, problem/solution, or what to avoid..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ padding: '6px 14px', background: 'transparent', border: '1px solid var(--panel-border)', color: 'var(--text-muted)', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '6px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
            >
              Save Playbook Entry
            </button>
          </div>
        </form>
      )}

      {/* Entries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filtered.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '14px' }}>
            <BookOpen size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
            <h3>No entries found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No records matching current filters.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                borderLeft: `4px solid ${
                  item.type === 'DECISION'
                    ? '#6366f1'
                    : item.type === 'PATTERN'
                    ? '#10b981'
                    : item.type === 'LESSON'
                    ? '#f59e0b'
                    : '#ef4444'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.scope}
                    </span>
                    {item.project && (
                      <span style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>
                        Source: {item.project.name}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {item.title}
                  </h3>
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                {item.content}
              </p>

              {item.tags && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {item.tags.split(',').map((t, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

