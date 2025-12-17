const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electron', {
  send: (channel, data) => {
    let validChannels = [
      'channel1',
      'channel2',
      'reiniciar',
      'get-config-file',
      'START_NOTIFICATION_SERVICE',
      'print',
      'get-system-printers',
      'print-with-pos-printer'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      'channel1',
      'channel2',
      'NOTIFICATION_SERVICE_STARTED',
      'NOTIFICATION_SERVICE_ERROR',
      'NOTIFICATION_RECEIVED',
      'TOKEN_UPDATED'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  ipcRenderer: {
    invoke: (channel, ...args) => {
      const validChannels = [
        'get-app-version',
        'get-printers',
        'save-printer',
        'delete-printer',
        'test-printer',
        'print-receipt',
        'get-system-printers',
        'print-with-pos-printer'
      ];

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }

      return Promise.reject(new Error(`Channel ${channel} is not allowed`));
    }
  }
}
);
