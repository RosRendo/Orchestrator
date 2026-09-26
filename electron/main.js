const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const FRONTEND_URL = process.env.RENDOOS_URL || 'http://localhost:3010';
const BACKEND_URL = process.env.RENDOOS_BACKEND_URL || 'http://localhost:3005';

function createTrayIcon() {
  // 16x16 transparent PNG with purple diamond dot for RendoOS tray
  // Generates a clean 16x16 nativeImage programmatically if icon file not found
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" rx="4" fill="#6366f1"/>
    <polygon points="8,2 14,8 8,14 2,8" fill="#ffffff"/>
  </svg>`;
  try {
    return nativeImage.createFromBuffer(Buffer.from(svg));
  } catch {
    return nativeImage.createEmpty();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0d1117',
    title: 'RendoOS — Founder & AI Operating System',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const loadUrlWithRetry = (url, retriesLeft = 15) => {
    mainWindow.loadURL(url).catch((err) => {
      if (retriesLeft > 0) {
        console.log(`[RendoOS] Waiting for ${url}... (${retriesLeft} retries remaining)`);
        setTimeout(() => loadUrlWithRetry(url, retriesLeft - 1), 2000);
      } else {
        console.error(`[RendoOS] Failed to load ${url}:`, err);
        mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
          <!DOCTYPE html>
          <html>
          <body style="background:#0d1117;color:#fff;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
            <h1 style="font-size:1.6rem;color:#818cf8;">RendoOS Desktop</h1>
            <p style="color:#8b949e;">Connecting to orchestrator server at <code>${url}</code>...</p>
            <button onclick="location.reload()" style="background:#6366f1;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;">Retry Connection</button>
          </body>
          </html>
        `)}`);
      }
    });
  };

  loadUrlWithRetry(FRONTEND_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Intercept close to hide to tray instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

function setupTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('RendoOS — Founder & AI Operating System');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⚡ Open RendoOS',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '🌅 Founder Morning Briefing',
      click: () => {
        // Trigger briefing via backend API
        http.get(`${BACKEND_URL}/automation/briefing`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          });
        }).on('error', (err) => {
          console.error('[RendoOS Tray] Error requesting briefing:', err.message);
        });
      },
    },
    { type: 'separator' },
    {
      label: '🌐 Open in Web Browser',
      click: () => shell.openExternal(FRONTEND_URL),
    },
    { type: 'separator' },
    {
      label: '❌ Quit RendoOS',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function registerShortcuts() {
  // Global summon toggle: Alt+Space
  const registeredAltSpace = globalShortcut.register('Alt+Space', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  if (!registeredAltSpace) {
    console.warn('[RendoOS] Alt+Space registration failed. Trying Ctrl+Shift+O fallback...');
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setupTray();
    registerShortcuts();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep app alive in tray unless explicitly quit
    if (isQuitting) {
      app.quit();
    }
  }
});
