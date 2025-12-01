import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, from, Subject } from 'rxjs';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import {
  START_NOTIFICATION_SERVICE,
  NOTIFICATION_SERVICE_STARTED,
  NOTIFICATION_SERVICE_ERROR,
  NOTIFICATION_RECEIVED as ON_NOTIFICATION_RECEIVED,
  TOKEN_UPDATED,
} from '@superhuman/electron-push-receiver/src/constants';

const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public notificationReceived = new Subject<any>();

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor(
    private configService: ConfiguracionService
  ) {
    if (this.isElectron) {
    }
  }

  initPushNotifications(onToken?: (token: string) => void): void {
    if (!this.isElectron) {
      console.warn('[FCM] Not running in Electron, aborting push initialization');
      return;
    }

    // LIMPIEZA FORZADA COMPLETA para resolver SENDER_ID_MISMATCH
    const currentToken = localStorage.getItem('pushToken');
    const deviceId = localStorage.getItem('deviceId');
    const notifications = localStorage.getItem('notifications');

    console.log('[FCM] 🧹 LIMPIEZA FORZADA COMPLETA');
    console.log('[FCM] 🗑️ Token anterior eliminado:', currentToken);
    console.log('[FCM] 🗑️ DeviceId eliminado:', deviceId);
    console.log('[FCM] 🗑️ Notificaciones eliminadas:', notifications);

    localStorage.removeItem('pushToken');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('notifications');

    // También limpiamos cualquier otra clave relacionada
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('pushNotificationToken');

    console.log('[FCM] ✅ Limpieza completada - forzando regeneración');

    const firebaseConfig = environment.firebaseConfig;

    if (!firebaseConfig) {
      console.error('[FCM] No firebaseConfig configured in environment');
      console.error('[FCM] Please add firebaseConfig to your environment file');
      return;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.projectId) {
      console.error('[FCM] Firebase config is incomplete');
      console.error('[FCM] Required: apiKey, appId, projectId');
      return;
    }
    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_: any, token: string) => {
      if (token) {
        localStorage.setItem('pushToken', token);
        if (onToken) {
          onToken(token);
        }
      } else {
        console.warn('[FCM] ⚠️ NOTIFICATION_SERVICE_STARTED without token');
      }
    });
    ipcRenderer.on(TOKEN_UPDATED, (_: any, token: string) => {
      console.log('[ElectronService] 🔄 TOKEN_UPDATED recibido:', token);
      if (token) {
        console.log('[ElectronService] ✅ Guardando token en localStorage');
        localStorage.setItem('pushToken', token);
        if (onToken) {
          onToken(token);
        }
      } else {
        console.warn('[FCM] ⚠️ TOKEN_UPDATED without token');
      }
    });

    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_: any, error: any) => {
    });
    ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_: any, notification: any) => {
      try {
        console.log('[Renderer] 📬 Notificación recibida en renderer process:', JSON.stringify(notification, null, 2));

        // Reenviar al main process para que muestre la notificación nativa
        // Usamos un nombre de evento diferente para evitar conflictos
        ipcRenderer.send('SHOW_NATIVE_NOTIFICATION', notification);
        console.log('[Renderer] 📤 Notificación reenviada al main process para mostrar notificación nativa');

        // Emitir al servicio de notificaciones para actualizar el tablero
        this.notificationReceived.next(notification);

        console.log('[Renderer] ✅ Notificación procesada en renderer');
      } catch (e) {
        console.error('[Renderer] ❌ Error handling notification', e);
        console.error('[Renderer] ❌ Notification object:', notification);
      }
    });
    const pushConfig = {
      senderId: firebaseConfig.messagingSenderId, // IMPORTANTE: Agregar senderId
      firebase: {
        apiKey: firebaseConfig.apiKey,
        appID: firebaseConfig.appId,
        projectID: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId
      },
      vapidKey: (firebaseConfig as any).vapidKey // Usar vapidKey de la configuración
    };

    console.log('[ElectronService] Iniciando servicio de notificaciones con config:', pushConfig);
    ipcRenderer.send(START_NOTIFICATION_SERVICE, pushConfig); // Enviar objeto completo
  }

  relaunch() {
    ipcRenderer.send('reiniciar')
  }

  print(data) {
    const options = {
      preview: false,
      margin: '0 0 0 0',
      copies: 1,
      printerName: this.configService?.getConfig()?.printers?.ticket,
      timeOutPerLine: 400,
      pageSize: '58mm',
      silent: true,
      dpi: {
        horizontal: 300,
        vertical: 300
      }
    }

    ipcRenderer.send('print', data, options)
  }

  getAppVersion() {
    return ipcRenderer.sendSync('get-app-version');
  }
  getPrinters(): Observable<PrinterInfo[]> {
    return from(ipcRenderer.invoke('get-system-printers')) as Observable<PrinterInfo[]>;
  }

  /**
   * Print using electron-pos-printer
   * @param data Array of content elements to print
   * @param options Printing options including printer name
   */
  printWithPosPrinter(data: any[], options: any): Observable<PrintResult> {
    return from(ipcRenderer.invoke('print-with-pos-printer', { data, options })) as Observable<PrintResult>;
  }
}