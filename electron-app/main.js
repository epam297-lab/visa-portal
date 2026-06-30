'use strict';

// IMPORTANT: Get Electron's built-in modules by clearing require cache
// This avoids the npm electron package shadowing the built-in API
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startApp() {
  // Now get Electron after our module resolution path is set
  const { app, BrowserWindow, Menu } = require('electron');
  
  app.on('ready', function() {
    console.log('Electron ready - starting server...');
    
    const serverScript = path.join(__dirname, '..', 'server', 'server.js');
    
    if (fs.existsSync(serverScript)) {
      serverProcess = spawn('node', [serverScript], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        env: Object.assign({}, process.env, { PORT: '4500' })
      });
      
      serverProcess.stdout.on('data', function(data) {
        console.log('[server] ' + data.toString().trim());
      });
      
      serverProcess.stderr.on('data', function(data) {
        console.log('[server-err] ' + data.toString().trim());
      });
      
      serverProcess.on('error', function(err) {
        console.log('Server error: ' + err.message);
      });
      
      serverProcess.on('exit', function(code) {
        console.log('Server exited with code ' + code);
      });
    }
    
    setTimeout(function() {
      tryCreateWindow(BrowserWindow, Menu, app);
    }, 4000);
  });
}

function tryCreateWindow(BrowserWindow, Menu, app) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, '..', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    backgroundColor: '#f0f2f5'
  });
  
  Menu.setApplicationMenu(null);
  
  mainWindow.loadURL('http://localhost:4500/admin.html');
  
  mainWindow.once('ready-to-show', function() {
    mainWindow.show();
    mainWindow.maximize();
  });
  
  mainWindow.on('closed', function() {
    mainWindow = null;
    cleanup();
  });
}

function cleanup() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// Remove electron module from cache BEFORE requiring it
// This tricks Node into resolving the built-in module
const electronPkgPath = path.join(__dirname, 'node_modules', 'electron');
if (require.cache) {
  // Don't let the npm package shadow built-in
}

// Use a different resolution strategy: clear the npm electron from path resolution
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent) {
  if (request === 'electron') {
    // Force resolution to built-in by looking up from a non-node_modules path
    const fakeParent = { paths: ['C:\\\\'] };
    try {
      return origResolve.call(Module, 'electron', fakeParent);
    } catch(e) {
      return origResolve.call(Module, request, parent);
    }
  }
  return origResolve.call(Module, request, parent);
};

startApp();
