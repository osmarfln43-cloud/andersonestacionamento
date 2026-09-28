const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const APP_URL = 'https://estacionamentoanderson.online/';
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
  window.loadURL(APP_URL);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
