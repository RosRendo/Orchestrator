'use client';

import { useState, useEffect, useRef } from 'react';
import { api, FileNode } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

interface FileTreeProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  activeFilePath: string | null;
}

export default function FileTree({ projectId, onFileSelect, activeFilePath }: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

  const loadTree = async () => {
    try {
      const data = await api.getFileTree(projectId);
      setTree(data);
    } catch (err) {
      console.error('Failed to load file tree', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3005');
    const socket = io(backendUrl || undefined);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('watch:init', { projectId });
    });

    socket.on('files:changed', () => {
      // Reload tree on modifications
      loadTree();
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleCreateFile = async (type: 'file' | 'folder') => {
    const name = prompt(`Enter ${type} name (e.g. index.js):`);
    if (!name) return;

    try {
      await api.createFile(projectId, name, type === 'folder');
      loadTree();
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    }
  };

  const handleDelete = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${path}?`)) return;

    try {
      await api.deleteFile(projectId, path);
      loadTree();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleRename = async (oldPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Enter new path/name:', oldPath);
    if (!newName || newName === oldPath) return;

    try {
      await api.renameFile(projectId, oldPath, newName);
      loadTree();
    } catch (err: any) {
      alert(err.message || 'Failed to rename item');
    }
  };

  const renderNode = (node: FileNode) => {
    const isOpen = openFolders[node.path] || false;
    const isActive = activeFilePath === node.path;

    if (node.isDirectory) {
      return (
        <div key={node.path} style={styles.treeNodeGroup}>
          <div
            style={{
              ...styles.treeNode,
              paddingLeft: `${(node.path.split('/').length - 1) * 12 + 8}px`,
            }}
            onClick={() => toggleFolder(node.path)}
          >
            {isOpen ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
                <path d="M2 10V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v2"></path>
                <path d="M20 21H4a2 2 0 0 1-2-2v-9h20v9a2 2 0 0 1-2 2z"></path>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            )}
            <span style={styles.nodeName}>{node.name}</span>
            <div style={styles.nodeActions} className="node-actions">
              <button style={{ ...styles.iconBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleRename(node.path, e)} title="Rename">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
              <button style={{ ...styles.iconBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(node.path, e)} title="Delete">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>
          {isOpen && node.children && (
            <div style={styles.folderChildren}>
              {node.children.map(child => renderNode(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        style={{
          ...styles.treeNode,
          paddingLeft: `${(node.path.split('/').length - 1) * 12 + 8}px`,
          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
        }}
        onClick={() => onFileSelect(node.path)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', flexShrink: 0 }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span style={{ ...styles.nodeName, color: isActive ? '#fff' : 'var(--text-primary)' }}>{node.name}</span>
        <div style={styles.nodeActions} className="node-actions">
          <button style={{ ...styles.iconBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleRename(node.path, e)} title="Rename">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button style={{ ...styles.iconBtn, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => handleDelete(node.path, e)} title="Delete">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <span style={styles.title}>Files</span>
        <div style={styles.toolbarButtons}>
          <button style={{ ...styles.toolbarBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleCreateFile('file')} title="New File">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </button>
          <button style={{ ...styles.toolbarBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleCreateFile('folder')} title="New Folder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </button>
          <button style={{ ...styles.toolbarBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={loadTree} title="Refresh">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>
        </div>
      </div>

      <div style={styles.treeBody}>
        {loading ? (
          <div style={styles.loading}>Loading files...</div>
        ) : tree.length === 0 ? (
          <div style={styles.empty}>Empty project directory</div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>

      <style jsx global>{`
        .node-actions {
          display: none;
        }
        div:hover > .node-actions {
          display: flex;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  toolbar: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--panel-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },
  toolbarButtons: {
    display: 'flex',
    gap: '6px',
  },
  toolbarBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--panel-border)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '0.75rem',
    color: 'var(--text-primary)',
  },
  treeBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  treeNodeGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  treeNode: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    margin: '1px 8px',
    transition: 'background-color 0.2s',
    position: 'relative',
  },
  folderChildren: {
    display: 'flex',
    flexDirection: 'column',
  },
  folderIcon: {
    marginRight: '8px',
    fontSize: '0.9rem',
    userSelect: 'none',
  },
  fileIcon: {
    marginRight: '8px',
    fontSize: '0.9rem',
    userSelect: 'none',
  },
  nodeName: {
    fontSize: '0.85rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  nodeActions: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    gap: '4px',
    background: 'var(--background)',
    padding: '2px 4px',
    borderRadius: '4px',
    border: '1px solid var(--panel-border)',
  },
  iconBtn: {
    fontSize: '0.7rem',
    padding: '2px',
  },
  loading: {
    padding: '16px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  empty: {
    padding: '16px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
};
