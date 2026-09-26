'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api, Project } from '@/lib/api';
import FileTree from '@/components/FileTree';
import WorkspaceTerminal from '@/components/WorkspaceTerminal';
import GitPanel from '@/components/GitPanel';
import AgentChat from '@/components/AgentChat';
import Editor from '@monaco-editor/react';

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const { id: projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs and editor state
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [editorLoading, setEditorLoading] = useState<boolean>(false);

  // Bottom Panel State
  const [bottomTab, setBottomTab] = useState<'terminal' | 'git'>('terminal');

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (activeFile) {
      loadFileContent(activeFile);
    } else {
      setFileContent('');
      setEditedContent('');
      setIsDirty(false);
    }
  }, [activeFile]);

  // Handle Ctrl+S keybind for saving files
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFile, editedContent, isDirty]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await api.getProject(projectId);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (path: string) => {
    try {
      setEditorLoading(true);
      const res = await api.readFile(projectId, path);
      setFileContent(res.content);
      setEditedContent(res.content);
      setIsDirty(false);
    } catch (err: any) {
      alert(`Failed to load file: ${err.message}`);
      // Remove from tabs if load fails
      closeFile(path);
    } finally {
      setEditorLoading(false);
    }
  };

  const openFile = (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles([...openFiles, path]);
    }
    setActiveFile(path);
  };

  const closeFile = (path: string) => {
    const nextTabs = openFiles.filter(f => f !== path);
    setOpenFiles(nextTabs);
    if (activeFile === path) {
      setActiveFile(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
    }
  };

  const handleSave = async () => {
    if (!activeFile || !isDirty) return;

    try {
      await api.writeFile(projectId, activeFile, editedContent);
      setFileContent(editedContent);
      setIsDirty(false);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setEditedContent(val);
    setIsDirty(val !== fileContent);
  };

  const getEditorLanguage = (filePath: string | null): string => {
    if (!filePath) return 'plaintext';
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'sh':
      case 'bash':
      case 'ps1':
        return 'shell';
      case 'yml':
      case 'yaml':
        return 'yaml';
      default:
        return 'plaintext';
    }
  };

  if (loading) {
    return <div style={styles.loadingContainer}>Loading workspace...</div>;
  }

  if (error || !project) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error Loading Workspace</h2>
        <p>{error || 'Project not found'}</p>
        <Link href="/" style={{ marginTop: '16px' }} className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Workspace Header */}
      <header style={styles.header} className="glass-panel">
        <Link href="/" style={styles.backBtn} title="Back to Dashboard">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Dashboard
        </Link>
        <div style={styles.projectInfo}>
          <span style={styles.projectName}>{project.name}</span>
          <span style={styles.projectPath}>{project.path}</span>
        </div>
        <div style={styles.actions}>
          {activeFile && isDirty && (
            <button style={styles.saveBtn} className="btn-primary" onClick={handleSave}>
              💾 Save Change (Ctrl+S)
            </button>
          )}
        </div>
      </header>

      {/* Main Split Panels */}
      <div style={styles.mainSplit}>
        {/* Left Panel: Files */}
        <div style={{
          ...styles.leftPanel,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 12px 12px 12px',
        }} className="glass-panel">
          {/* Logo */}
          <div style={styles.sidebarLogoArea}>
            <span style={styles.logoText}>ORCHESTRATOR</span>
          </div>
          <div style={{ height: '1px', background: 'var(--panel-border)', margin: '12px 0 8px 0', flexShrink: 0 }}></div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FileTree
              projectId={projectId}
              onFileSelect={openFile}
              activeFilePath={activeFile}
            />
          </div>
        </div>

        {/* Middle Panel: Editor + Terminal */}
        <div style={styles.middlePanel}>
          {/* Editor Area */}
          <div style={styles.editorArea} className="glass-panel">
            {/* Tabs */}
            <div style={styles.tabsHeader}>
              {openFiles.map(file => {
                const isActive = activeFile === file;
                const fileIsDirty = activeFile === file ? isDirty : false; // basic tab indicator
                
                return (
                  <div
                    key={file}
                    style={{
                      ...styles.tab,
                      background: isActive ? '#1e222b' : 'rgba(255,255,255,0.02)',
                      borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                    }}
                    onClick={() => setActiveFile(file)}
                  >
                    <span style={styles.tabName}>
                      {file.split('/').pop()}
                      {fileIsDirty && <span style={styles.dirtyDot}>•</span>}
                    </span>
                    <button
                      style={styles.closeTabBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(file);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Monaco Editor */}
            <div style={styles.editorContainer}>
              {activeFile ? (
                editorLoading ? (
                  <div style={styles.editorPlaceholder}>Loading content...</div>
                ) : (
                  <Editor
                    height="100%"
                    language={getEditorLanguage(activeFile)}
                    theme="vs-dark"
                    value={editedContent}
                    onChange={handleEditorChange}
                    options={{
                      fontSize: 13.5,
                      fontFamily: 'var(--font-mono)',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      padding: { top: 12 },
                      scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                      },
                    }}
                  />
                )
              ) : (
                <div style={styles.editorPlaceholder}>
                  <h2>Orchestrator Code Editor</h2>
                  <p>Select a file from the sidebar to open it. Press Ctrl+S to save changes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel (Terminal / Git) */}
          <div style={styles.bottomPanel} className="glass-panel">
            <div style={styles.bottomTabsHeader}>
              <button
                style={{
                  ...styles.bottomTabBtn,
                  background: bottomTab === 'terminal' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  color: bottomTab === 'terminal' ? '#fff' : 'var(--text-secondary)',
                  borderBottom: bottomTab === 'terminal' ? '2px solid var(--primary)' : '2px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setBottomTab('terminal')}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="4 17 10 11 4 5" />
                  <line x1="12" y1="19" x2="20" y2="19" />
                </svg>
                Terminal
              </button>
              <button
                style={{
                  ...styles.bottomTabBtn,
                  background: bottomTab === 'git' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  color: bottomTab === 'git' ? '#fff' : 'var(--text-secondary)',
                  borderBottom: bottomTab === 'git' ? '2px solid var(--primary)' : '2px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setBottomTab('git')}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="18" cy="18" r="3" />
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 15V9a4 4 0 0 0-4-4H9" />
                  <line x1="6" y1="9" x2="6" y2="15" />
                </svg>
                Git status
              </button>
            </div>
            <div style={styles.bottomTabContent}>
              {bottomTab === 'terminal' ? (
                <WorkspaceTerminal projectId={projectId} />
              ) : (
                <GitPanel projectId={projectId} />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Agent Chat */}
        <div style={styles.rightPanel} className="glass-panel">
          <AgentChat projectId={projectId} />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--background)',
    padding: '12px',
    gap: '12px',
  },
  loadingContainer: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--background)',
    color: 'var(--text-secondary)',
  },
  errorContainer: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--background)',
    color: 'var(--text-primary)',
    gap: '8px',
  },
  header: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderRadius: '8px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    textDecoration: 'none',
    fontWeight: '500',
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  projectName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#fff',
  },
  projectPath: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
  },
  saveBtn: {
    fontSize: '0.75rem',
    padding: '6px 12px',
  },
  mainSplit: {
    flex: 1,
    display: 'flex',
    gap: '12px',
    height: 'calc(100vh - 80px)',
    overflow: 'hidden',
  },
  leftPanel: {
    width: 'var(--sidebar-width)',
    height: '100%',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  middlePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%',
    overflow: 'hidden',
  },
  editorArea: {
    flex: 1.6,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  tabsHeader: {
    height: '36px',
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid var(--panel-border)',
    overflowX: 'auto',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    height: '100%',
    fontSize: '0.8rem',
    borderRight: '1px solid var(--panel-border)',
    cursor: 'pointer',
    userSelect: 'none',
    gap: '8px',
    transition: 'background-color 0.2s',
  },
  tabName: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  dirtyDot: {
    color: 'var(--warning)',
    fontSize: '1rem',
    lineHeight: '0',
  },
  closeTabBtn: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    padding: '2px',
  },
  editorContainer: {
    flex: 1,
    background: '#1e222b', // vscode dark theme background standard
  },
  editorPlaceholder: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: 'var(--text-muted)',
    gap: '8px',
    padding: '24px',
  },
  bottomPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  bottomTabsHeader: {
    height: '36px',
    display: 'flex',
    background: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid var(--panel-border)',
  },
  bottomTabBtn: {
    padding: '0 18px',
    fontSize: '0.75rem',
    fontWeight: '600',
    height: '100%',
  },
  bottomTabContent: {
    flex: 1,
    overflow: 'hidden',
  },
  rightPanel: {
    width: 'var(--chat-width)',
    height: '100%',
    overflow: 'hidden',
    borderRadius: '8px',
  },
  sidebarLogoArea: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '4px 0',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '900',
    letterSpacing: '0.08em',
    background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
  },
};
