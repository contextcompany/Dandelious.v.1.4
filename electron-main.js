// Vanguard Desktop Electron Entry Point
// Powered by Context & Reshaped Engine

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#03060d',
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const isDev = process.env.NODE_ENV === 'development';
  const serverUrl = isDev ? 'http://localhost:3000' : 'http://localhost:3000';

  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackendServer() {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '3000', NODE_ENV: 'production' },
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Reshaped Engine]: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Reshaped Engine Error]: ${data}`);
  });
}

app.whenReady().then(() => {
  if (process.env.NODE_ENV !== 'development') {
    startBackendServer();
  }
  
  // Wait brief moment for Express server to start if production
  setTimeout(createWindow, 800);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
