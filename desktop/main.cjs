const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const APP_URL = 'https://andersonestacionamento.online/';
const APP_ORIGIN = new URL(APP_URL).origin;

app.whenReady().then(() => {
  const window = new BrowserWindow({
    title: 'Anderson Estacionamento',
    width: 1180,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault();
      if (url.startsWith('https://')) shell.openExternal(url);
    }
  });
  window.webContents.session.on('will-download', (_event, item) => {
    const suggested = path.basename(item.getFilename());
    if (!suggested.toLowerCase().endsWith('.pdf')) return;
    const downloads = app.getPath('downloads');
    const base = suggested.slice(0, -4).replace(/[^a-zA-Z0-9_.-]/g, '_');
    let destination = path.join(downloads, `${base}.pdf`);
    for (let number = 2; fs.existsSync(destination); number++) {
      destination = path.join(downloads, `${base}-${number}.pdf`);
    }
    item.setSavePath(destination);
  });
  window.loadURL(APP_URL);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
