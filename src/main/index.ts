import { app, BrowserWindow } from 'electron';
import { runMigrations } from './database/migrations';
import { registerAllHandlers } from './ipc';
import { getDb } from './database/connection';
import { closeDb } from './database/connection';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

function loadWindowBounds(): Partial<Electron.Rectangle> {
  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('window_bounds') as
      | { value: string }
      | undefined;
    if (row) return JSON.parse(row.value);
  } catch {
    // ignore
  }
  return {};
}

function saveWindowBounds(bounds: Electron.Rectangle): void {
  try {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run(
      'window_bounds',
      JSON.stringify(bounds)
    );
  } catch {
    // ignore
  }
}

const createWindow = (): void => {
  const savedBounds = loadWindowBounds();

  mainWindow = new BrowserWindow({
    width: savedBounds.width || 1200,
    height: savedBounds.height || 800,
    x: savedBounds.x,
    y: savedBounds.y,
    minWidth: 900,
    minHeight: 600,
    title: 'Trakko',
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Save window bounds on resize/move
  mainWindow.on('close', () => {
    if (mainWindow) {
      saveWindowBounds(mainWindow.getBounds());
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', () => {
  runMigrations();
  registerAllHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  closeDb();
});
