'use client';

import { useState, useEffect } from 'react';
import { api, SystemDirResponse } from '@/lib/api';

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export default function FolderPicker({ isOpen, onClose, onSelect, initialPath }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [inputPath, setInputPath] = useState<string>('');
  const [folders, setFolders] = useState<SystemDirResponse['folders']>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDirs(initialPath);
    }
  }, [isOpen, initialPath]);

  const loadDirs = async (path?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getSystemDirs(path);
      setCurrentPath(res.currentPath);
      setInputPath(res.currentPath);
      setFolders(res.folders);
      setDrives(res.drives);
      setParentPath(res.parentPath);
    } catch (err: any) {
      setError(err.message || 'Failed to load directories');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (path: string) => {
    loadDirs(path);
  };

  const handleDriveClick = (drive: string) => {
    loadDirs(drive);
  };

  const handleGoUp = () => {
    if (parentPath) {
      loadDirs(parentPath);
    }
  };

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPath.trim()) {
      loadDirs(inputPath.trim());
    }
  };

  const handleSelect = () => {
    onSelect(currentPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent} className="glass-panel animate-fade-in">
        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>Select Folder</h3>
            <p style={styles.modalSubtitle}>Navigate and choose a project directory from your computer</p>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Path Input Form */}
        <form onSubmit={handlePathSubmit} style={styles.pathForm}>
          <button
            type="button"
            style={{
              ...styles.upButton,
              opacity: parentPath ? 1 : 0.4,
              cursor: parentPath ? 'pointer' : 'not-allowed',
            }}
            onClick={handleGoUp}
            disabled={!parentPath}
            title="Go to parent directory"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
          <input
            type="text"
            style={styles.pathInput}
            value={inputPath}
            onChange={(e) => setInputPath(e.target.value)}
            placeholder="Type path or select folder below..."
          />
          <button type="submit" className="btn-secondary" style={styles.goButton}>
            Go
          </button>
        </form>

        {/* Drive Selector (Windows only) */}
        {drives.length > 0 && (
          <div style={styles.drivesSection}>
            <span style={styles.sectionLabel}>Drives:</span>
            <div style={styles.drivesList}>
              {drives.map((drive) => {
                const isCurrentDrive = currentPath.toLowerCase().startsWith(drive.toLowerCase());
                return (
                  <button
                    key={drive}
                    type="button"
                    style={{
                      ...styles.driveBtn,
                      border: isCurrentDrive ? '1px solid var(--primary)' : '1px solid var(--panel-border)',
                      background: isCurrentDrive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                      color: isCurrentDrive ? '#fff' : 'var(--text-secondary)',
                    }}
                    onClick={() => handleDriveClick(drive)}
                  >
                    💾 {drive}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Folders List Area */}
        <div style={styles.folderListContainer}>
          {loading ? (
            <div style={styles.loadingMessage}>
              <div style={styles.spinner}></div>
              <span>Loading folders...</span>
            </div>
          ) : error ? (
            <div style={styles.errorMessage}>
              <span>⚠️ {error}</span>
              <button
                type="button"
                style={styles.retryBtn}
                onClick={() => loadDirs(currentPath || initialPath)}
              >
                Retry
              </button>
            </div>
          ) : folders.length === 0 ? (
            <div style={styles.emptyMessage}>
              No subdirectories found in this folder.
            </div>
          ) : (
            <div style={styles.folderGrid}>
              {folders.map((folder) => (
                <div
                  key={folder.path}
                  style={styles.folderItem}
                  onClick={() => handleFolderClick(folder.path)}
                  title={folder.name}
                >
                  <div style={styles.folderIcon}>
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9" />
                    </svg>
                  </div>
                  <span style={styles.folderName}>{folder.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={styles.modalFooter}>
          <span style={styles.selectedLabel} title={currentPath}>
            Selected Path: <strong style={styles.selectedPathText}>{currentPath}</strong>
          </span>
          <div style={styles.footerActions}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSelect}
              disabled={loading || !!error}
            >
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5, 5, 8, 0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxWidth: '650px',
    height: '520px',
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '1.25rem',
    color: '#fff',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },
  closeButton: {
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathForm: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  upButton: {
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--panel-border)',
    borderRadius: '6px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
  },
  pathInput: {
    flex: 1,
    height: '38px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
  },
  goButton: {
    height: '38px',
    padding: '0 16px',
  },
  drivesSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  drivesList: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  driveBtn: {
    fontSize: '0.75rem',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  folderListContainer: {
    flex: 1,
    border: '1px solid var(--panel-border)',
    background: 'rgba(0,0,0,0.15)',
    borderRadius: '8px',
    overflowY: 'auto',
    marginBottom: '16px',
    padding: '12px',
  },
  folderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '10px',
  },
  folderItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    background: 'rgba(255,255,255,0.01)',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  folderIcon: {
    color: 'var(--primary)',
    marginBottom: '6px',
  },
  folderName: {
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  selectedLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    maxWidth: '60%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  selectedPathText: {
    color: 'var(--primary)',
    fontFamily: 'var(--font-mono)',
    fontWeight: 'normal',
  },
  loadingMessage: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    gap: '10px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderTop: '2px solid var(--primary)',
    borderRadius: '50%',
  },
  errorMessage: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fca5a5',
    gap: '12px',
  },
  retryBtn: {
    background: 'rgba(244, 63, 94, 0.15)',
    border: '1px solid var(--error)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.75rem',
  },
  emptyMessage: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--panel-border)',
    paddingTop: '16px',
  },
  footerActions: {
    display: 'flex',
    gap: '8px',
  },
};
