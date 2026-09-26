'use client';

import { useState, useEffect } from 'react';
import { api, GitFile } from '@/lib/api';

interface GitPanelProps {
  projectId: string;
}

export default function GitPanel({ projectId }: GitPanelProps) {
  const [isRepo, setIsRepo] = useState(false);
  const [gitFiles, setGitFiles] = useState<GitFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);

  const loadGitStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getGitStatus(projectId);
      setIsRepo(data.isRepository);
      setGitFiles(data.files);
      if (data.files.length > 0 && !selectedFile) {
        handleSelectFile(data.files[0].path);
      }
    } catch (err) {
      console.error('Failed to load git status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGitStatus();
  }, [projectId]);

  const handleSelectFile = async (path: string) => {
    setSelectedFile(path);
    setDiff('Loading diff...');
    try {
      const res = await api.getGitDiff(projectId, path);
      setDiff(res.diff || '[No modifications or untracked binary file]');
    } catch (err: any) {
      setDiff(`Error loading diff: ${err.message}`);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim() || gitFiles.length === 0) return;

    try {
      setCommitting(true);
      await api.gitCommit(projectId, commitMsg);
      setCommitMsg('');
      setSelectedFile(null);
      setDiff('');
      await loadGitStatus();
      alert('Changes committed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to commit');
    } finally {
      setCommitting(false);
    }
  };

  // Helper to color lines in git diff
  const renderDiffLine = (line: string, index: number) => {
    let color = 'var(--text-primary)';
    let background = 'transparent';

    if (line.startsWith('+')) {
      color = '#a7f3d0'; // Light emerald
      background = 'rgba(16, 185, 129, 0.15)';
    } else if (line.startsWith('-')) {
      color = '#fca5a5'; // Light red
      background = 'rgba(244, 63, 94, 0.15)';
    } else if (line.startsWith('@@')) {
      color = 'var(--primary)';
      background = 'rgba(99, 102, 241, 0.05)';
    }

    return (
      <div key={index} style={{ ...styles.diffLine, color, background }}>
        {line}
      </div>
    );
  };

  if (loading && gitFiles.length === 0) {
    return <div style={styles.paddingState}>Loading Git state...</div>;
  }

  if (!isRepo) {
    return (
      <div style={styles.emptyState}>
        <span style={styles.emptyIcon}>📂</span>
        <h3>Not a Git Repository</h3>
        <p>Initialize git inside this project directory to see status and commits here.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar: Changed files list & Commit Form */}
      <div style={styles.sidebar}>
        <div style={styles.sectionHeader}>
          <span style={styles.title}>Git Status</span>
          <button style={styles.refreshBtn} onClick={loadGitStatus} title="Reload Git Status">
            🔄
          </button>
        </div>

        <div style={styles.fileList}>
          {gitFiles.length === 0 ? (
            <div style={styles.cleanState}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <span>Working tree clean</span>
            </div>
          ) : (
            gitFiles.map((file) => {
              const isActive = selectedFile === file.path;
              return (
                <div
                  key={file.path}
                  style={{
                    ...styles.fileItem,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  }}
                  onClick={() => handleSelectFile(file.path)}
                >
                  <span style={styles.filePath} title={file.path}>
                    {file.path}
                  </span>
                  <span
                    style={{
                      ...styles.statusTag,
                      backgroundColor:
                        file.status === 'untracked'
                          ? 'var(--success-glow)'
                          : file.status === 'modified'
                          ? 'var(--primary-glow)'
                          : 'var(--error-glow)',
                      color:
                        file.status === 'untracked'
                          ? 'var(--success)'
                          : file.status === 'modified'
                          ? 'var(--primary)'
                          : 'var(--error)',
                    }}
                  >
                    {file.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Commit Form */}
        <form onSubmit={handleCommit} style={styles.commitForm}>
          <textarea
            placeholder="Commit message..."
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            style={styles.commitInput}
            required
            disabled={gitFiles.length === 0}
          />
          <button
            type="submit"
            className="btn-primary"
            style={styles.commitBtn}
            disabled={committing || gitFiles.length === 0 || !commitMsg.trim()}
          >
            {committing ? 'Committing...' : 'Commit All Changes'}
          </button>
        </form>
      </div>

      {/* Main panel: Diff Viewer */}
      <div style={styles.diffViewer}>
        <div style={styles.diffHeader}>
          <span style={styles.diffTitle}>
            {selectedFile ? `Diff: ${selectedFile}` : 'Select a file to view diff'}
          </span>
        </div>
        <div style={styles.diffBody}>
          {diff ? (
            diff.split('\n').map((line, idx) => renderDiffLine(line, idx))
          ) : (
            <div style={styles.noDiff}>No changes selected</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    background: '#0d0f13',
    borderTop: '1px solid var(--panel-border)',
  },
  sidebar: {
    width: '280px',
    borderRight: '1px solid var(--panel-border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  sectionHeader: {
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.01)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    fontWeight: '700',
  },
  refreshBtn: {
    fontSize: '0.8rem',
  },
  fileList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filePath: {
    fontSize: '0.8rem',
    fontFamily: 'var(--font-mono)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: '8px',
    flex: 1,
  },
  statusTag: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  cleanState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  commitForm: {
    padding: '16px',
    borderTop: '1px solid var(--panel-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'rgba(0, 0, 0, 0.1)',
  },
  commitInput: {
    width: '100%',
    height: '60px',
    resize: 'none',
    fontSize: '0.8rem',
  },
  commitBtn: {
    width: '100%',
    justifyContent: 'center',
  },
  diffViewer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#090a0f',
  },
  diffHeader: {
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.01)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  diffTitle: {
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  diffBody: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    whiteSpace: 'pre',
    lineHeight: '1.5',
  },
  diffLine: {
    padding: '1px 8px',
    borderRadius: '2px',
  },
  noDiff: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '32px',
  },
  paddingState: {
    padding: '24px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  emptyState: {
    padding: '40px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  emptyIcon: {
    fontSize: '2rem',
  },
};
