export const updateApi = {
  checkForUpdates: async () => {
    return await (window as any).api.invoke('update:check')
  },

  downloadUpdate: async () => {
    return await (window as any).api.invoke('update:download')
  },

  installUpdate: async () => {
    return await (window as any).api.invoke('update:install')
  },

  getDownloadProgress: async () => {
    return await (window as any).api.invoke('update:progress')
  },

  isUpdateAvailable: async () => {
    return await (window as any).api.invoke('update:available')
  }
}
