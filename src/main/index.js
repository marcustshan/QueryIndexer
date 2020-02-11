import { app, BrowserWindow, ipcMain } from 'electron'
import { Settings } from './settings.js'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const settings = new Settings({
  defaults: {
    windowSize: { width: 1700, height: 800 }
  }
})

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    useContentSize: true,
    width: settings.get('windowSize').width,
    height: settings.get('windowSize').height,
    minWidth: 1000,
    minHeight: 600,
    webSecurity: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  const path = require('path')
  const nativeImage = require('electron').nativeImage
  mainWindow.setIcon(nativeImage.createFromPath(path.join(__dirname, '../renderer/assets/icons/win/icon.ico')))

  const fs = require('fs')
  const themes = fs.readdirSync(path.join(__dirname, '../renderer/assets/css/themes'))
  for (let i = 0; i < themes.length; i++) {
    if (!themes[i].endsWith('.css')) {
      themes.splice(i, 1)
      i--
    } else {
      themes[i] = themes[i].split('.css')[0]
    }
  }

  if (settings.get('windowMaximized')) {
    mainWindow.maximize()
  }

  mainWindow.on('resize', () => {
    let { width, height } = mainWindow.getBounds()
    settings.set('windowSize', { width, height })
  })
  mainWindow.on('maximize', () => {
    let { width, height } = mainWindow.getBounds()
    settings.set('windowSize', { width, height })
    settings.set('windowMaximized', true)
  })
  mainWindow.on('unmaximize', () => {
    let { width, height } = mainWindow.getBounds()
    settings.set('windowSize', { width, height })
    settings.set('windowMaximized', false)
  })
  mainWindow.on('restore', () => {
    let { width, height } = mainWindow.getBounds()
    settings.set('windowSize', { width, height })
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  ipcMain.on('set_connection', (event, connection) => {
    settings.set('connection', connection)
  })

  ipcMain.on('get_connection', (event) => {
    mainWindow.webContents.send('get_connection', settings.get('connection'))
  })

  ipcMain.on('get_themes', (event) => {
    mainWindow.webContents.send('get_themes', themes)
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
