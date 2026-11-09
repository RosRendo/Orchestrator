'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, TodaySummary, Task, Blocker } from '@/lib/api';
import {
  Zap,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Folder,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Flame
} from 'lucide-react';

export default function TodayFocusView() {
  const [data, setData] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskBucket, setNewTaskBucket] = useState<'NOW' | 'NEXT' | 'LATER'>('NOW');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // New blocker form
  const [newBlockerTitle, setNewBlockerTitle] = useState('');
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getTodaySummary();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load today focus summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
      await api.updateTask(task.id, { status: newStatus });
      loadSummary();
    } catch (err: any) {
      alert(`Failed to update task: ${err.message}`);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !data?.focusProject?.id) return;

    try {
      await api.createTask({
        projectId: data.focusProject.id,
        title: newTaskTitle.trim(),
        bucket: newTaskBucket,
        priority: newTaskPriority,
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      loadSummary();
    } catch (err: any) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  const handleResolveBlocker = async (id: string) => {
    try {
      await api.resolveBlocker(id);
      loadSummary();
    } catch (err: any) {
      alert(`Failed to resolve blocker: ${err.message}`);
    }
  };

  const handleCreateBlocker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockerTitle.trim() || !data?.focusProject?.id) return;

    try {
      await api.createBlocker({
        projectId: data.focusProject.id,
        title: newBlockerTitle.trim(),
      });
      setNewBlockerTitle('');
      setIsAddingBlocker(false);
      loadSummary();
    } catch (err: any) {
      alert(`Failed to create blocker: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: '#6366f1' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading Today's Command Center...</span>
      </div>
    );
  }

  const focus = data?.focusProject;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '8px 0 40px 0' }}>
      
      {/* Top Header & Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Flame size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Today's Focus & Command Center
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Focus on high-leverage execution. Top tasks segmented into NOW, NEXT, and LATER.
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Metrics */}
        {data?.stats && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>{data.stats.activeProjects}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Projects</div>
            </div>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{data.stats.completedTasks} / {data.stats.totalTasks}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tasks Done</div>
            </div>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>{data.stats.ideasCount}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ideas Saved</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Unresolved Blockers Alert Banner */}
      {data?.blockers && data.blockers.length > 0 && (
        <div style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              <span>ACTIVE BLOCKERS DETECTED ({data.blockers.length})</span>
            </div>
            <button
              onClick={() => setIsAddingBlocker(!isAddingBlocker)}
              style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              + Add Blocker
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.blockers.map((b) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ef4444' }}>•</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{b.title}</span>
                  {b.project && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      {b.project.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleResolveBlocker(b.id)}
                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CURRENT FOCUS HERO BANNER */}
      {focus ? (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(15, 23, 42, 0.6))', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                  CURRENT ACTIVE FOCUS
                </span>
                <span style={{ fontSize: '0.75rem', color: focus.health === 'HEALTHY' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ● {focus.health || 'HEALTHY'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                {focus.name}
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '700px' }}>
                {focus.description || focus.overview || 'Primary active project.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href={`/workspace/${focus.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#fff', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                <span>Open in IDE Workspace</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Progress Bar & Milestone */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Milestone: <strong style={{ color: '#fff' }}>{focus.currentMilestone || 'Production Release v1.0'}</strong></span>
              <span>{focus.progress || 65}% Complete</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${focus.progress || 65}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Path: <code style={{ color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>{focus.path}</code></span>
            {focus.port && <span>Port: <strong style={{ color: '#fff' }}>:{focus.port}</strong></span>}
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', borderRadius: '16px' }}>
          <Folder size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3>No primary focus project set</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select an active project to track milestone progress and focus tasks.</p>
        </div>
      )}

      {/* QUICK ADD TASK FORM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: '#6366f1' }} />
          <span>Actionable Task Matrix</span>
        </h3>
        <button
          onClick={() => setIsAddingTask(!isAddingTask)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>

      {isAddingTask && (
        <form onSubmit={handleCreateTask} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ flex: 1, minWidth: '240px', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
            autoFocus
          />
          <select
            value={newTaskBucket}
            onChange={(e: any) => setNewTaskBucket(e.target.value)}
            style={{ padding: '8px 10px', background: '#1e2029', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
          >
            <option value="NOW">NOW (Top Priority)</option>
            <option value="NEXT">NEXT (Upcoming)</option>
            <option value="LATER">LATER (Backlog)</option>
          </select>
          <select
            value={newTaskPriority}
            onChange={(e: any) => setNewTaskPriority(e.target.value)}
            style={{ padding: '8px 10px', background: '#1e2029', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
          >
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button
            type="submit"
            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
          >
            Save Task
          </button>
        </form>
      )}

      {/* 3-COLUMN TASK MATRIX: NOW / NEXT / LATER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* NOW COLUMN */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', borderTop: '3px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Zap size={16} />
              <span>NOW (Immediate Focus)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              {data?.nowTasks.length || 0}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.nowTasks && data.nowTasks.length > 0 ? (
              data.nowTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <Circle size={16} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>{t.title}</div>
                    {t.project && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.project.name}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                All clear for NOW!
              </div>
            )}
          </div>
        </div>

        {/* NEXT COLUMN */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', borderTop: '3px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Clock size={16} />
              <span>NEXT (Upcoming Sprint)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              {data?.nextTasks.length || 0}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.nextTasks && data.nextTasks.length > 0 ? (
              data.nextTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Circle size={16} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>{t.title}</div>
                    {t.project && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.project.name}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No tasks queued for NEXT.
              </div>
            )}
          </div>
        </div>

        {/* LATER COLUMN */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '14px', borderTop: '3px solid #6366f1', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818cf8', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Layers size={16} />
              <span>LATER (Idea / Backlog)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              {data?.laterTasks.length || 0}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.laterTasks && data.laterTasks.length > 0 ? (
              data.laterTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Circle size={16} style={{ color: '#818cf8', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.title}</div>
                    {t.project && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.project.name}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Backlog is empty.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

