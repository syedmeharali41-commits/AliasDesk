const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

function logDebug(msg) {
  try {
    const logPath = path.join(app.getPath('userData'), 'aliasdesk-debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
}

// Enforce single instance lock to prevent multiple conflicting processes
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logDebug('Secondary instance attempted to launch; exiting because primary instance holds lock.');
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let serverProcess = null;
let allocatedPort = null;

process.on('uncaughtException', (err) => {
  logDebug(`Uncaught Exception: ${err ? err.stack || err.message : err}`);
});

process.on('unhandledRejection', (reason) => {
  logDebug(`Unhandled Rejection: ${reason ? reason.stack || reason : reason}`);
});

// Cleanly kill server process tree on Windows and Unix
function killServerProcess() {
  if (!serverProcess) return;
  const pid = serverProcess.pid;
  serverProcess = null;
  if (!pid) return;

  logDebug(`Terminating server process tree (PID ${pid})...`);
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    try {
      if (serverProcess) serverProcess.kill('SIGKILL');
    } catch {}
  }
}

// Dynamically locate a free port (defaults to 39182 upwards or ephemeral)
function findAvailablePort(startPort = 39182) {
  return new Promise((resolve) => {
    function testPort(port) {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          testPort(port + 1);
        } else {
          const fallbackServer = net.createServer();
          fallbackServer.listen(0, '127.0.0.1', () => {
            const assigned = fallbackServer.address().port;
            fallbackServer.close(() => resolve(assigned));
          });
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      server.listen(port, '127.0.0.1');
    }
    testPort(startPort);
  });
}

function findServerScript() {
  const possiblePaths = [
    path.join(process.resourcesPath, 'app-server', 'server.js'),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'app-server', 'server.js'),
    path.join(process.resourcesPath, 'app', 'app-server', 'server.js'),
    path.join(__dirname, '..', 'app-server', 'server.js'),
    path.join(__dirname, '..', '.next', 'standalone', 'server.js'),
    path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function waitForServer(port, timeoutMs = 30000) {
  const url = `http://127.0.0.1:${port}`;
  const start = Date.now();
  logDebug(`Waiting for server at ${url} (timeout: ${timeoutMs}ms)...`);
  return new Promise((resolve) => {
    function ping() {
      const req = http.get(url, (res) => {
        logDebug(`Server is fully ready on port ${port} (HTTP ${res.statusCode}) in ${Date.now() - start}ms`);
        res.resume();
        resolve(true);
      });
      req.setTimeout(1200, () => {
        req.destroy();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          logDebug(`waitForServer timeout reached after ${timeoutMs}ms`);
          resolve(false);
        } else {
          setTimeout(ping, 250);
        }
      });
    }
    ping();
  });
}

async function startProductionServer(port) {
  const serverPath = findServerScript();
  logDebug(`Resolved server script: ${serverPath}`);

  if (!serverPath) {
    logDebug('CRITICAL: server.js could not be located in packaged resources!');
    return false;
  }

  const serverDir = path.dirname(serverPath);
  logDebug(`Starting production server from: ${serverDir} on port ${port}`);

  try {
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: serverDir,
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    serverProcess.stdout?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) logDebug(`[Next.js stdout] ${msg}`);
    });

    serverProcess.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) logDebug(`[Next.js stderr] ${msg}`);
    });

    serverProcess.on('error', (err) => {
      logDebug(`Server process spawn error: ${err.message}`);
    });

    serverProcess.on('exit', (code, signal) => {
      logDebug(`Server process exited with code ${code}, signal ${signal}`);
    });

    const ready = await waitForServer(port, 30000);
    return ready;
  } catch (err) {
    logDebug(`startProductionServer exception: ${err.message}`);
    return false;
  }
}

// Built-in splash screen HTML
function getSplashHtml() {
  let logoDataUri = '';
  const possibleLogoPaths = [
    path.join(__dirname, '..', 'public', 'logo.png'),
    path.join(process.resourcesPath, 'public', 'logo.png'),
    path.join(process.resourcesPath, 'app', 'public', 'logo.png'),
  ];
  for (const lp of possibleLogoPaths) {
    if (fs.existsSync(lp)) {
      try {
        logoDataUri = `data:image/png;base64,${fs.readFileSync(lp).toString('base64')}`;
        break;
      } catch {}
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AliasDesk</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #050505;
      color: #F5F5F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      overflow: hidden;
      -webkit-app-region: drag;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .logo-box {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: #0D0D0E;
      border: 1px solid rgba(245, 158, 11, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px rgba(245, 158, 11, 0.15);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.9; }
      50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.4)); }
    }
    .title {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.85);
    }
    .status {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(245, 158, 11, 0.2);
      border-top-color: #F59E0B;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-box">
      ${logoDataUri ? `<img src="${logoDataUri}" width="36" height="36" style="object-fit: contain;" />` : `
      <svg viewBox="0 0 64 64" width="30" height="30" fill="none">
        <path d="M20 44 L32 18 L44 44" stroke="#F59E0B" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        <line x1="25" y1="35" x2="39" y2="35" stroke="#F5F5F0" stroke-width="5" stroke-linecap="round" />
      </svg>`}
    </div>
    <div class="title">AliasDesk</div>
    <div class="status">
      <div class="spinner"></div>
      <span>Initializing engine...</span>
    </div>
  </div>
</body>
</html>`;
}

function getErrorHtml(errorDetails, port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AliasDesk — Error</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #050505;
      color: #F5F5F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 520px;
      background: #0D0D0E;
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      text-align: center;
    }
    h2 { color: #EF4444; font-size: 18px; margin-bottom: 12px; }
    p { font-size: 13px; color: rgba(255, 255, 255, 0.7); line-height: 1.6; margin-bottom: 20px; }
    pre {
      background: #000;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 12px;
      font-size: 11px;
      color: #F59E0B;
      text-align: left;
      overflow-x: auto;
      margin-bottom: 20px;
      max-height: 140px;
    }
    button {
      background: #F59E0B;
      color: #000;
      border: none;
      font-weight: 600;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
    }
    button:hover { background: #D97706; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Failed to Launch AliasDesk Backend</h2>
    <p>The internal production engine could not initialize on port ${port}.</p>
    <pre>${errorDetails}</pre>
    <button onclick="location.reload()">Retry Launch</button>
  </div>
</body>
</html>`;
}

async function createWindow() {
  logDebug('createWindow started');
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1020,
    minHeight: 680,
    backgroundColor: '#050505',
    title: 'AliasDesk',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const isPackaged = app.isPackaged;

  if (isPackaged) {
    logDebug('Packaged mode detected. Loading splash screen...');
    // Display obsidian splash immediately while server boots
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHtml())}`);

    // Allocate dynamic port to prevent collisions
    allocatedPort = await findAvailablePort(39182);
    logDebug(`Dynamically allocated production port: ${allocatedPort}`);

    const started = await startProductionServer(allocatedPort);
    if (!started) {
      logDebug('Production server failed to start within timeout');
      const errHtml = getErrorHtml('Server did not respond within timeout. Check aliasdesk-debug.log in AppData for details.', allocatedPort);
      await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errHtml)}`);
      return;
    }

    logDebug(`Navigating to http://127.0.0.1:${allocatedPort}...`);
    try {
      await mainWindow.loadURL(`http://127.0.0.1:${allocatedPort}`);
      logDebug('Successfully loaded AliasDesk UI');
    } catch (err) {
      logDebug(`mainWindow.loadURL failed: ${err.message}`);
      const errHtml = getErrorHtml(`Navigation failed: ${err.message}`, allocatedPort);
      await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errHtml)}`);
    }
  } else {
    // Development mode
    const devPort = process.env.PORT || 3000;
    const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:${devPort}`;
    logDebug(`Dev mode detected. Loading ${startUrl}`);
    await mainWindow.loadURL(startUrl);
  }
}

// When a secondary instance is launched, focus the existing window
app.on('second-instance', () => {
  logDebug('Second instance prevented, bringing existing window to front');
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  killServerProcess();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  killServerProcess();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
