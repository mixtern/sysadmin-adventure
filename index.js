let { app, BrowserWindow } = require('electron');
let aspect = require("electron-aspectratio");
let dotenv = require("dotenv");

dotenv.config()

let winHandler;
const ENABLE_DEBUGGER = process.env.DEBUG_GAME ==="true" || false;

function createWindow() {
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 576,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreenable: true,
        frame: false
    })

    win.loadFile('index.html');
    win.removeMenu();

    winHandler = new aspect(win);
    winHandler.setRatio(16, 9, 50);

    if (ENABLE_DEBUGGER) {
        devtools = new BrowserWindow()
        win.webContents.setDevToolsWebContents(devtools.webContents)
        win.webContents.openDevTools({ mode: 'detach' })
    }
}

app.whenReady().then(createWindow)