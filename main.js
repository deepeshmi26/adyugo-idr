const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true 
    }
  });

  // Load the React app's build file
  win.loadURL('file://' + path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(() => {
  // Start backend proxy server
  fork(path.join(__dirname, 'proxy-server.js'));

  // Create the frontend window
  createWindow();
});
