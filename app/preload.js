const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electron', {
    send: (channel, data) => {
      // whitelist channels
      let validChannels = ['channel1', 'channel2', 'reiniciar', 'get-config-file'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ['channel1', 'channel2'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Add IPC invoke methods for thermal printer functionality
    ipcRenderer: {
      invoke: (channel, ...args) => {
        // Whitelist channels for invoking IPC handlers
        const validChannels = [
          'get-app-version', 
          'get-printers', 
          'save-printer', 
          'delete-printer', 
          'test-printer', 
          'print-receipt'
        ];
        
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args);
        }
        
        return Promise.reject(new Error(`Channel ${channel} is not allowed`));
      }
    }
  }
);
