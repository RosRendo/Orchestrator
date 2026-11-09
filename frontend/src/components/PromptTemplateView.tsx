'use client';

import { useState } from 'react';
import { BookMarked, Copy, Check, Sparkles, Plus, Search, Tag, Send } from 'lucide-react';

interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  template: string;
  tags: string[];
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'pr-01',
    title: 'Surgical Bug Fixing & Root Cause Isolation',
    category: 'Debugging',
    description: 'Diagnose runtime errors, isolate root cause, and apply minimal safe patch without mass refactoring.',
    template: 'Analyze the following error in project {{project}} (Stack: {{stack}}):\n\nError:\n{{error}}\n\nTask:\n1. Isolate root cause in {{repository}}\n2. Write a minimal reproducible test\n3. Provide the surgical patch (< 20 lines)',
    tags: ['debug', 'bugfix', 'surgical']
  },
  {
    id: 'pr-02',
    title: 'Webhook Cryptographic Signature Guard',
    category: 'Security',
    description: 'Scaffold secure webhook receiver with HMAC-SHA256 signature verification.',
    template: 'Implement secure webhook receiver in {{project}} ({{stack}}) for {{payment_provider}}.\n\nRequirements:\n- Parse raw body buffer before JSON parsing\n- Verify HMAC-SHA256 signature header\n- Idempotent transaction record in database\n- Return immediate 200 OK after queueing',
    tags: ['security', 'webhooks', 'payments']
  },
  {
    id: 'pr-03',
    title: 'High-Concurrency Database Connection Pooling',
    category: 'Architecture',
    description: 'Configure Prisma ORM with connection pooling, PgBouncer, and transaction timeouts.',
    template: 'Optimize database layer for {{project}} on {{stack}}.\n\nArchitecture: {{architecture}}\n\nTasks:\n- Configure connection pool limits (max 20)\n- Set transaction timeout to 5000ms\n- Add index recommendations on high-frequency query paths',
    tags: ['database', 'prisma', 'postgres']
  },
  {
    id: 'pr-04',
    title: 'Automated Vitest & Playwright QA Suite',
    category: 'Testing',
    description: 'Generate pragmatic integration and smoke tests without brittle mocks.',
    template: 'Generate test suite for {{project}}.\n\nRun command: {{test_command}}\n\nCoverage goals:\n- 1 happy path user flow\n- 2 boundary/edge error conditions\n- Webhook signature failure test',
    tags: ['testing', 'vitest', 'playwright']
  }
];

export default function PromptTemplateView() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate>(DEFAULT_PROMPTS[0]);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Variables
  const [varValues, setVarValues] = useState<Record<string, string>>({
    project: 'Orchestrator',
    feature: 'Telegram Remote Link',
    stack: 'NestJS / Next.js / TypeScript',
    repository: 'github.com/my-org/orchestrator',
    payment_provider: 'Stripe & ABA PayWay KHQR',
    error: 'Error: Connection pool timeout (max 20 reached)',
    test_command: 'npm run test',
    architecture: 'Next.js 16 -> NestJS 11 -> SQLite/Postgres',
  });

  const getCompiledText = (template: string) => {
    let result = template;
    Object.keys(varValues).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, varValues[key] || `[${key}]`);
    });
    return result;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = prompts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '8px 0 40px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <BookMarked size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Reusable Prompt Template Library
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Variable-driven prompt engineering templates (`{`{{project}}`}`, `{`{{stack}}`}`, `{`{{error}}`}`) with live compilation preview.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px' }}>
        
        {/* Left: Template Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="text"
            placeholder="Search prompt templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((p) => {
              const isSelected = selectedPrompt.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPrompt(p)}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid var(--panel-border)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: '#06b6d4' }}>
                      {p.category}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', margin: '0 0 6px 0' }}>
                    {p.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Variable Inputs & Live Preview */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '18px', border: '1px solid var(--panel-border)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: '#06b6d4' }}>
              ACTIVE TEMPLATE: {selectedPrompt.category}
            </span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff', margin: '2px 0 0 0' }}>
              {selectedPrompt.title}
            </h3>
          </div>

          {/* Variables Configuration */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Template Variables
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.keys(varValues).slice(0, 4).map((k) => (
                <div key={k}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {k}
                  </label>
                  <input
                    type="text"
                    value={varValues[k]}
                    onChange={(e) => setVarValues({ ...varValues, [k]: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', marginTop: '2px' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Compiled Output Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Compiled Prompt Preview
              </span>
              <button
                onClick={() => handleCopy(selectedPrompt.id, getCompiledText(selectedPrompt.template))}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#06b6d4', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                {copiedId === selectedPrompt.id ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedId === selectedPrompt.id ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>
            <pre style={{ flex: 1, margin: 0, padding: '14px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', color: '#a5b4fc', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {getCompiledText(selectedPrompt.template)}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
}

