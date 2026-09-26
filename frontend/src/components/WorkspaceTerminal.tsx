'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  projectId: string;
  initialCommand?: string;
  hideHeader?: boolean;
}

export default function WorkspaceTerminal({ projectId, initialCommand, hideHeader }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';
    const socket = io(backendUrl);
    socketRef.current = socket;

    // Initialize Terminal
    const term = new Terminal({
      theme: {
        background: '#0e1117',
        foreground: '#e1e4e8',
        cursor: '#f3f4f6',
        selectionBackground: 'rgba(99, 102, 241, 0.3)',
      },
      cursorBlink: true,
      fontFamily: 'var(--font-mono)',
      fontSize: 13,
      lineHeight: 1.2,
    });
    termInstance.current = term;

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    let isOpened = false;

    const fitTerminal = () => {
      if (
        terminalRef.current &&
        terminalRef.current.clientWidth > 0 &&
        terminalRef.current.clientHeight > 0 &&
        term.element
      ) {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('xterm fit failed:', e);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
        if (!isOpened) {
          try {
            term.open(terminalRef.current);
            isOpened = true;
          } catch (e) {
            console.error('Failed to open terminal', e);
          }
        }
        if (isOpened) {
          window.requestAnimationFrame(() => fitTerminal());
        }
      }
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Handshake
    socket.on('connect', () => {
      // Send actual terminal dimensions so the PTY matches the viewport
      const cols = term.cols || 80;
      const rows = term.rows || 24;
      socket.emit('terminal:init', { projectId, cols, rows });
      // Auto-launch the agent CLI after the shell spawns
      if (initialCommand) {
        setTimeout(() => {
          socket.emit('terminal:input', { input: initialCommand + '\r' });
        }, 500);
      }
    });

    // Handle incoming terminal outputs
    socket.on('terminal:output', (data: string) => {
      try {
        term.write(data);
      } catch (e) {}
    });

    // Handle user keystrokes
    term.onData((data) => {
      socket.emit('terminal:input', { input: data });
    });

    // Notify backend when terminal resizes so PTY cols/rows stay in sync
    term.onResize(({ cols, rows }) => {
      socket.emit('terminal:resize', { cols, rows });
    });

    return () => {
      resizeObserver.disconnect();
      try {
        term.dispose();
      } catch (e) {
        console.warn('xterm dispose failed:', e);
      }
      socket.disconnect();
      console.log('Terminal session cleaned up');
    };
  }, [projectId, initialCommand]);

  return (
    <div style={{ ...styles.container, borderTop: hideHeader ? 'none' : '1px solid var(--panel-border)' }}>
      {!hideHeader && (
        <div style={styles.header}>
          <span style={styles.title}>Powershell Terminal</span>
        </div>
      )}
      <div ref={terminalRef} style={{ ...styles.terminalBody, height: hideHeader ? '100%' : 'calc(100% - 28px)' }}></div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0e1117',
    borderTop: '1px solid var(--panel-border)',
  },
  header: {
    padding: '6px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
    fontWeight: '600',
  },
  terminalBody: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    height: 'calc(100% - 28px)',
  },
};
