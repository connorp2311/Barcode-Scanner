import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectDirectory: async (): Promise<string[]> => {
    // send message to main process to get a directory and wait for the response
    const dir = await ipcRenderer.invoke('select-directory')
    console.log('directories selected', dir)
    return dir
  },
  readFile: async (path: string): Promise<File> => {
    const ImageData: { buffer: Buffer; name: string; type: string } = await ipcRenderer.invoke(
      'read-image',
      path
    )
    return new File([ImageData.buffer], ImageData.name, { type: ImageData.type })
  }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
