import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, dialog, ipcMain, screen, shell } from 'electron'
import { promises as fs } from 'fs'
import * as mime from 'mime-types'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { SelectFolderResult } from '../types/ipcTypes'

function createWindow(): void {
  let { width, height } = screen.getPrimaryDisplay().workAreaSize // get the screen size
  // get 80% of the screen size
  width = Math.floor(width * 0.8)
  height = Math.floor(height * 0.8)
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  ipcMain.handle('select-directory', async (): Promise<SelectFolderResult> => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })

    let files: string[] = []
    if (result.filePaths.length > 0) {
      try {
        const allFiles = await fs.readdir(result.filePaths[0])
        files = allFiles.filter((file) => {
          const ext = path.extname(file).toLowerCase()
          return ext === '.png' || ext === '.jpeg' || ext === '.jpg'
        })
      } catch (err) {
        console.log('Error reading the directory', err)
        throw err // propagate the error
      }
    }

    return {
      path: result.filePaths[0],
      files: files
    }
  })

  ipcMain.handle(
    'read-image',
    async (_, imagePath): Promise<{ buffer: Buffer; name: string; type: string }> => {
      try {
        // get the mime type based on the file extension
        const mimeType = mime.lookup(imagePath)
        if (!mimeType || !mimeType.startsWith('image/')) {
          throw new Error('Unsupported image format')
        }

        const buffer = await fs.readFile(imagePath)
        return { buffer, name: path.basename(imagePath), type: mimeType }
      } catch (err) {
        console.error(err)
        throw new Error('Failed to read the image file')
      }
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
