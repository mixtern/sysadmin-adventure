const { app, BrowserWindow } = require('electron')

function createWindow () {
  let win = new BrowserWindow({
    width: 960,
    height: 540,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
  win.removeMenu()
}

app.whenReady().then(createWindow)
