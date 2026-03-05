import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import { ipcMain } from 'electron'

export class AutoUpdateService {
  private updateAvailable = false
  private downloadProgress = 0

  constructor() {
    this.setupAutoUpdater()
  }

  private setupAutoUpdater(): void {
    autoUpdater.logger = log
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...')
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version)
      this.updateAvailable = true
    })

    autoUpdater.on('update-not-available', () => {
      log.info('No updates available')
    })

    autoUpdater.on('download-progress', (progress) => {
      this.downloadProgress = progress.percent
      log.info(`Download progress: ${progress.percent.toFixed(2)}%`)
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version)
    })

    autoUpdater.on('error', (error) => {
      log.error('AutoUpdater error:', error)
    })
  }

  async checkForUpdates(): Promise<{ available: boolean; version?: string }> {
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result?.updateInfo) {
        return {
          available: this.updateAvailable,
          version: result.updateInfo.version
        }
      }
      return { available: false }
    } catch (error) {
      log.error('Error checking for updates:', error)
      return { available: false }
    }
  }

  async downloadUpdate(): Promise<boolean> {
    try {
      await autoUpdater.downloadUpdate()
      return true
    } catch (error) {
      log.error('Error downloading update:', error)
      return false
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall(false, true)
  }

  getDownloadProgress(): number {
    return this.downloadProgress
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }
}

let updateService: AutoUpdateService | null = null

export function getUpdateService(): AutoUpdateService {
  if (!updateService) {
    updateService = new AutoUpdateService()
  }
  return updateService
}

export function setupUpdateIpcHandlers(): void {
  ipcMain.handle('update:check', async () => {
    return getUpdateService().checkForUpdates()
  })

  ipcMain.handle('update:download', async () => {
    return getUpdateService().downloadUpdate()
  })

  ipcMain.handle('update:install', () => {
    getUpdateService().installUpdate()
    return true
  })

  ipcMain.handle('update:progress', () => {
    return getUpdateService().getDownloadProgress()
  })

  ipcMain.handle('update:available', () => {
    return getUpdateService().isUpdateAvailable()
  })
}
