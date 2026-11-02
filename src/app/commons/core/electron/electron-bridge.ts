/**
 * Acceso al puente que expone `app/preload.ts` como `window.electron`.
 *
 * La ventana de Electron corre sin Node (`contextIsolation`, `sandbox`): no hay `window.require`
 * ni `fs`. Todo lo del sistema operativo se pide por IPC con estos métodos, y solo por los canales
 * que el preload tiene en su lista blanca (un canal que no esté ahí tira error).
 *
 * Fuera de Electron (ng serve en un navegador, tests) `electronBridge()` devuelve null.
 */
export interface ElectronBridge {
  isElectron: true;
  platform: string;
  send(channel: string, ...args: any[]): void;
  sendSync(channel: string, ...args: any[]): any;
  invoke<T = any>(channel: string, ...args: any[]): Promise<T>;
  /** El listener recibe solo los datos (sin el `event`). Devuelve la función para dejar de escuchar. */
  on(channel: string, listener: (...args: any[]) => void): () => void;
  removeAllListeners(channel: string): void;
}

export function electronBridge(): ElectronBridge | null {
  return (typeof window !== 'undefined' && window.electron) || null;
}

export function esElectron(): boolean {
  return !!electronBridge();
}
