'use client';

import { useState, useEffect } from 'react';
import { api, Project } from '@/lib/api';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Scan,
  RefreshCw,
  Sparkles,
  Check,
  Code,
  ShieldCheck,
  Folder
} from 'lucide-react';

interface Finding {
  category: string;
  title: string;
  description: string;
  severity: string;
  autoFixCode?: string;
}

export default function GapEngineView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<{
    projectId: string;
    projectName: string;
    score: string;
    findings: Finding[];
    scannedAt: string;
  } | null>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    api.getProjects().then((projs) => {
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
        runScan(projs[0].id);
      }
    });
  }, []);

  const runScan = async (projId: string) => {
    if (!projId) return;
    try {
      setScanning(true);
      const res = await api.getProjectGaps(projId);
      setReport(res);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '8px 0 40px 0' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              "What Did I Forget?" Production Gap Engine
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Proactively scans codebase against historical playbooks to catch missing rate limits, wildcard CORS, rollback procedures, and test suites before release.
            </p>
          </div>
        </div>

        {/* Project Selector & Scan Action */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              runScan(e.target.value);
            }}
            style={{ padding: '8px 12px', background: '#1e2029', border: '1px solid var(--panel-border)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => runScan(selectedProjectId)}
            disabled={scanning || !selectedProjectId}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
          >
            <Scan size={15} className={scanning ? 'animate-spin' : ''} />
            <span>{scanning ? 'Scanning...' : 'Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Score & Summary Banner */}
      {report && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(#10b981 0% 85%, rgba(255,255,255,0.08) 85% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>{report.score}</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.06em' }}>
                AUDIT COMPLIANCE SCORE
              </span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff', margin: '2px 0 4px 0' }}>
                {report.projectName}
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Last evaluated: {new Date(report.scannedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: report.findings.length === 0 ? '#10b981' : '#ef4444' }}>
                {report.findings.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Identified Gaps</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8' }}>
                {report.findings.filter(f => f.autoFixCode).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>1-Click Fixes</div>
            </div>
          </div>
        </div>
      )}

      {/* Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {scanning ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#10b981' }} />
            <span>Scanning project blueprints and source configuration...</span>
          </div>
        ) : !report || report.findings.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
            <ShieldCheck size={44} style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>Zero Production Gaps Detected</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Project has rate limits, valid CORS boundaries, test harnesses, and container configurations.
            </p>
          </div>
        ) : (
          report.findings.map((finding, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '12px',
                borderLeft: `4px solid ${
                  finding.severity === 'HIGH' ? '#ef4444' : finding.severity === 'MEDIUM' ? '#f59e0b' : '#38bdf8'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
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
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          finding.severity === 'HIGH'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : finding.severity === 'MEDIUM'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                        color:
                          finding.severity === 'HIGH'
                            ? '#ef4444'
                            : finding.severity === 'MEDIUM'
                            ? '#f59e0b'
                            : '#38bdf8',
                      }}
                    >
                      {finding.severity} SEVERITY
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Category: {finding.category}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {finding.title}
                  </h3>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {finding.description}
              </p>

              {finding.autoFixCode && (
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      Recommended Remediation
                    </span>
                    <button
                      onClick={() => handleCopyCode(finding.autoFixCode!, idx)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      {copiedIndex === idx ? <Check size={12} /> : <Code size={12} />}
                      <span>{copiedIndex === idx ? 'Copied!' : 'Copy Fix Code'}</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.78rem', color: '#a5b4fc', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {finding.autoFixCode}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}

