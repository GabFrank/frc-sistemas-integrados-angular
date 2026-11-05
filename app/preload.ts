/**
 * Único puente entre el Angular y el proceso principal de Electron.
 *
 * La ventana corre con `contextIsolation: true`, `nodeIntegration: false` y `sandbox: true`:
 * el código de la pantalla no tiene `require`, ni `fs`, ni `process`. Todo lo que necesita del
 * sistema operativo lo pide por IPC, y solo por los canales de estas listas. Así un script
 * inyectado (XSS) no puede leer archivos ni ejecutar comandos en la PC.
 *
 * Al agregar un canal nuevo en `main.ts` que el Angular tenga que usar, sumarlo acá.
 * Cada lista es por tipo de llamada: un canal de `send` no se puede usar con `invoke`.
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Canales de @superhuman/electron-push-receiver (src/constants). Copiados a mano porque el
// preload corre en sandbox y no puede hacer require de módulos que no sean 'electron'.
const PUSH_START = 'PUSH_RECEIVER:::START_NOTIFICATION_SERVICE';
const PUSH_STARTED = 'PUSH_RECEIVER:::NOTIFICATION_SERVICE_STARTED';
const PUSH_ERROR = 'PUSH_RECEIVER:::NOTIFICATION_SERVICE_ERROR';
const PUSH_RECEIVED = 'PUSH_RECEIVER:::NOTIFICATION_RECEIVED';
const PUSH_TOKEN_UPDATED = 'PUSH_RECEIVER:::TOKEN_UPDATED';

/** Renderer → main, sin respuesta. */
const CANALES_SEND = [
  'reiniciar',
  'set-window-icon',
  'save-config-backup',
  'set-update-channel',
  'check-for-update-manual',
  'SHOW_NATIVE_NOTIFICATION',
  PUSH_START,
];

/** Renderer → main, bloqueante. Solo lecturas cortas que el main siempre responde. */
const CANALES_SEND_SYNC = [
  'get-app-version',
  'get-update-channel',
];

/** Renderer → main, con respuesta (Promise). */
const CANALES_INVOKE = [
  'get-system-printers',
  'detect-local-devices',
  'detect-network-printers',
  'print-local',
  'print-test-local',
  'print-with-pos-printer',
  'get-local-ip',
  'share-local-printer',
  'install-local-printer',
  'leer-config-backup',
  'exportar-config-backup',
];

/** Main → renderer. */
const CANALES_ON = [
  'open-update-dialog',
  'max-instances-reached',
  'update-status',
  'notification-clicked',
  PUSH_STARTED,
  PUSH_ERROR,
  PUSH_RECEIVED,
  PUSH_TOKEN_UPDATED,
];

function verificar(lista: string[], channel: string, tipo: string): void {
  if (!lista.includes(channel)) {
    throw new Error(`Canal IPC no permitido (${tipo}): ${channel}`);
  }
}

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,

  send(channel: string, ...args: any[]): void {
    verificar(CANALES_SEND, channel, 'send');
    ipcRenderer.send(channel, ...args);
  },

  sendSync(channel: string, ...args: any[]): any {
    verificar(CANALES_SEND_SYNC, channel, 'sendSync');
    return ipcRenderer.sendSync(channel, ...args);
  },

  invoke(channel: string, ...args: any[]): Promise<any> {
    verificar(CANALES_INVOKE, channel, 'invoke');
    return ipcRenderer.invoke(channel, ...args);
  },

  /**
   * Escucha un canal. El listener recibe solo los datos, sin el `event` de Electron (que trae
   * `sender` y daría acceso al IPC sin filtro). Devuelve la función para dejar de escuchar.
   */
  on(channel: string, listener: (...args: any[]) => void): () => void {
    verificar(CANALES_ON, channel, 'on');
    const handler = (_event: IpcRendererEvent, ...args: any[]) => listener(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  removeAllListeners(channel: string): void {
    verificar(CANALES_ON, channel, 'removeAllListeners');
    ipcRenderer.removeAllListeners(channel);
  },
});
