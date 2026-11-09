'use client';

import { useState, useEffect } from 'react';
import { api, Idea } from '@/lib/api';
import { Lightbulb, Plus, Trash2, ArrowRight, Tag, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function IdeasInboxView() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getIdeas();
      setIdeas(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSubmitting(true);
      await api.createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() || undefined,
      });
      setTitle('');
      setDescription('');
      setTags('');
      loadIdeas();
    } catch (err: any) {
      alert(`Failed to save idea: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    try {
      await api.deleteIdea(id);
      loadIdeas();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      setConvertingId(id);
      const proj = await api.convertIdea(id);
      alert(`Success! Created new project: "${proj.name}" at path: ${proj.path}`);
      loadIdeas();
    } catch (err: any) {
      alert(`Failed to convert idea: ${err.message}`);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '8px 0 40px 0' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ec4899, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Lightbulb size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Ideas & Experiment Scratchpad
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Frictionless idea capture inbox. Promote any idea into an active codebase with 1-click.
            </p>
          </div>
        </div>

        <button
          onClick={loadIdeas}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--panel-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* QUICK IDEA CAPTURE FORM */}
      <form onSubmit={handleCreateIdea} className="glass-panel" style={{ padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(236, 72, 153, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: '700', fontSize: '0.85rem' }}>
          <Sparkles size={16} />
          <span>QUICK CAPTURE NEW IDEA</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Idea name or concept (e.g. AI-Powered Smart CRM Voice Agent)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 2, minWidth: '260px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            required
          />
          <input
            type="text"
            placeholder="Tags: ai, fintech, automation"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>

        <textarea
          placeholder="Brief description, target user, why it matters, or notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ec4899', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            <Plus size={16} />
            <span>Save to Ideas Inbox</span>
          </button>
        </div>
      </form>

      {/* IDEAS GRID */}
      {loading && ideas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading ideas...</div>
      ) : ideas.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <Lightbulb size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3>No ideas captured yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Write down your raw concepts above to preserve momentum.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="glass-panel"
              style={{ padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px', border: idea.convertedToProjectId ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--panel-border)' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {idea.title}
                  </h3>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    title="Delete Idea"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {idea.description && (
                  <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {idea.description}
                  </p>
                )}

                {idea.tags && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {idea.tags.split(',').map((tag, idx) => (
                      <span key={idx} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: '#ec4899', padding: '2px 8px', borderRadius: '4px' }}>
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                {idea.convertedToProjectId ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: '600' }}>
                    <CheckCircle2 size={14} />
                    <span>Converted to Project</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvert(idea.id)}
                    disabled={convertingId === idea.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #6366f1, #10b981)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <span>Convert to Project</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

