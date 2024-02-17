import { ElectronAPI } from '@electron-toolkit/preload'
import { SelectFolderResult } from '../types/ipcTypes'

interface API {
  selectFolder: () => Promise<SelectFolderResult>
  readFile: (path: string) => Promise<File>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
