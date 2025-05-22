import { dialog, session } from 'electron'
import { join } from 'path'

export const pickExtensionPath = async (_event, defaultPath) => {
  return await dialog.showOpenDialog({ defaultPath, properties: ['openDirectory'] })
}

export const setupSession = async (_event, data) => {
  const partition = session.fromPartition(data.partition)

  /** Register onHeadersReceived */
  partition.webRequest.onHeadersReceived({ urls: ['<all_urls>'] }, (details, callback) => {
    const responseHeaders = Object.fromEntries(
      Object.entries(details.responseHeaders).filter(([key]) => {
        return ![
          'x-frame-options',
          'content-security-policy',
          'cross-origin-embedder-policy',
          'cross-origin-opener-policy',
          'cross-origin-resource-policy'
        ].includes(key.toLowerCase())
      })
    )
    callback({ responseHeaders })
  })

  if (data.proxy) {
    // Implement Proxy
  }

  /** Register Preload Script */
  partition.registerPreloadScript({
    type: 'frame',
    filePath: join(__dirname, '../preload/webview.js')
  })

  if (data.extensionPath) {
    /** Load Extension */
    const extension = await partition.loadExtension(data.extensionPath, { allowFileAccess: true })

    return extension
  }
}
