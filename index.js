const { app, BrowserWindow } = require('electron');

function createWindow() {
    let win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        },
        fullscreenable:true,
        frame:false
    })

    win.loadFile('index.html');
    win.removeMenu();
}

app.whenReady().then(createWindow);
