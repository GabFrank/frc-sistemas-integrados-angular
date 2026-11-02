/* SystemJS module definition */
declare const nodeModule: NodeModule;

interface NodeModule {
  id: string;
}

interface Window {
  /** Puente del preload de Electron (app/preload.ts). Ver commons/core/electron/electron-bridge.ts. */
  electron?: import('./app/commons/core/electron/electron-bridge').ElectronBridge;
}

// CAMBIO PRINCIPAL: Actualizar declaración de módulo para @superhuman/electron-push-receiver
declare module '@superhuman/electron-push-receiver/src/constants' {
  export const START_NOTIFICATION_SERVICE: string;
  export const NOTIFICATION_SERVICE_STARTED: string;
  export const NOTIFICATION_SERVICE_ERROR: string;
  export const NOTIFICATION_RECEIVED: string;
  export const TOKEN_UPDATED: string;
}