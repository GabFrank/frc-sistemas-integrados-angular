import { Injectable } from '@angular/core';

import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { environment } from '../../../../environments/environment';
import { Observable, from } from 'rxjs';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';

// CAMBIO PRINCIPAL: Importar desde @superhuman/electron-push-receiver
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

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor(
    private configService: ConfiguracionService
  ) {
    if (this.isElectron) {
      console.log('[FCM] ElectronService initialized in Electron environment');
    }
  }

  initPushNotifications(onToken?: (token: string) => void): void {
    console.log('[FCM] initPushNotifications called with @superhuman/electron-push-receiver');
    console.log('[FCM] isElectron =', this.isElectron);

    if (!this.isElectron) {
      console.warn('[FCM] Not running in Electron, aborting push initialization');
      return;
    }

    const firebaseConfig = environment.firebaseConfig;
    console.log('[FCM] Firebase config from environment:', firebaseConfig);
    
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

    // Registrar listener para cuando el servicio se inicie correctamente
    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_: any, token: string) => {
      console.log('[FCM] ✅ NOTIFICATION_SERVICE_STARTED event received');
      console.log('[FCM] FCM Token received');
      
      if (token) {
        localStorage.setItem('pushToken', token);
        console.log('[FCM] ✅ pushToken stored in localStorage');
        
        if (onToken) {
          onToken(token);
        }
      } else {
        console.warn('[FCM] ⚠️ NOTIFICATION_SERVICE_STARTED without token');
      }
    });

    // Registrar listener para actualizaciones de token
    ipcRenderer.on(TOKEN_UPDATED, (_: any, token: string) => {
      console.log('[FCM] 🔄 TOKEN_UPDATED event received');
      console.log('[FCM] FCM Token updated');
      
      if (token) {
        localStorage.setItem('pushToken', token);
        console.log('[FCM] ✅ pushToken updated in localStorage');
        
        if (onToken) {
          onToken(token);
        }
      } else {
        console.warn('[FCM] ⚠️ TOKEN_UPDATED without token');
      }
    });

    // Registrar listener para errores
    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_: any, error: any) => {
      console.error('[FCM] ❌ NOTIFICATION_SERVICE_ERROR');
      console.error('[FCM] Error details:', error);
    });

    // Registrar listener para notificaciones recibidas
    ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_: any, notification: any) => {
      console.log('[FCM] 📬 ON_NOTIFICATION_RECEIVED');
      console.log('[FCM] Notification:', notification);
      
      try {
        const title = notification?.notification?.title || 'FRC Sistemas Integrados';
        const body = notification?.notification?.body || '';
        const data = notification?.data;

        console.log('[FCM] Notification details:', { title, body, data });

        // Mostrar notificación nativa del sistema
        if (typeof Notification !== 'undefined') {
          const n = new Notification(title, { body, data });
          
          n.onclick = () => {
            console.log('[FCM] Notification clicked');
            console.log('[FCM] Notification data:', data);
            
            // Si hay un path en los datos, emitir evento personalizado
            if (data?.path && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('push-path', { detail: data.path }));
            }
          };
        }
      } catch (e) {
        console.error('[FCM] ❌ Error handling foreground notification', e);
      }
    });

    // Iniciar el servicio de notificaciones
    // La librería espera un objeto con la configuración de Firebase
    const pushConfig = {
      firebase: {
        apiKey: firebaseConfig.apiKey,
        appID: firebaseConfig.appId,
        projectID: firebaseConfig.projectId
      },
      vapidKey: '' // Opcional, se puede dejar vacío
    };
    
    console.log('[FCM] 🚀 Sending START_NOTIFICATION_SERVICE');
    console.log('[FCM] Config:', JSON.stringify(pushConfig, null, 2));
    ipcRenderer.send(START_NOTIFICATION_SERVICE, pushConfig);
    console.log('[FCM] START_NOTIFICATION_SERVICE sent, waiting for response...');
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

  /**
   * Thermal Printer Functions
   */

  /**
   * Get all available printers
   */
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