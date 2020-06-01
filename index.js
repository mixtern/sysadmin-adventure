let { app, BrowserWindow } = require('electron');
let aspect = require("electron-aspectratio");
let winHandler;

function createWindow() {
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 576,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreenable:true,
        frame:false
    })

    win.loadFile('index.html');
    win.removeMenu();
    
    winHandler = new aspect(win);
    winHandler.setRatio(16, 9, 50);
}

app.whenReady().then(createWindow);