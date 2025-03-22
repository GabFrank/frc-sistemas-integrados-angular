import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
  'electron', {
    send: (channel: string, data: any) => {
      // whitelist channels
      let validChannels = ['channel1', 'channel2', 'reiniciar', 'get-config-file'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: (...args: any[]) => void) => {
      let validChannels = ['channel1', 'channel2'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Add IPC invoke methods for thermal printer functionality
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => {
        // Whitelist channels for invoking IPC handlers
        const validChannels = [
          'get-app-version', 
          'get-system-printers',
          'print-with-pos-printer'
        ];
        
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args);
        }
        
        console.error(`Channel ${channel} is not allowed for IPC invoke`);
        return Promise.reject(new Error(`Channel ${channel} is not allowed`));
      }
    }
  }
); 