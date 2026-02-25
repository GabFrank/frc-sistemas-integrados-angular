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
      return;
    }

    localStorage.removeItem('pushToken');
    localStorage.removeItem('deviceId');
    localStorage.removeItem('notifications');
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('pushNotificationToken');

    const firebaseConfig = environment.firebaseConfig;

    if (!firebaseConfig) {
      return;
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.appId || !firebaseConfig.projectId) {
      return;
    }

    // Remove existing listeners to prevent duplicates
    ipcRenderer.removeAllListeners(NOTIFICATION_SERVICE_STARTED);
    ipcRenderer.removeAllListeners(TOKEN_UPDATED);
    ipcRenderer.removeAllListeners(NOTIFICATION_SERVICE_ERROR);
    ipcRenderer.removeAllListeners(ON_NOTIFICATION_RECEIVED);

    ipcRenderer.on(NOTIFICATION_SERVICE_STARTED, (_: any, token: string) => {
      if (token) {
        localStorage.setItem('pushToken', token);
        if (onToken) {
          onToken(token);
        }
      }
    });

    ipcRenderer.on(TOKEN_UPDATED, (_: any, token: string) => {
      if (token) {
        localStorage.setItem('pushToken', token);
        if (onToken) {
          onToken(token);
        }
      }
    });

    ipcRenderer.on(NOTIFICATION_SERVICE_ERROR, (_: any, error: any) => {
    });

    let lastNotificationTime = 0;
    let lastNotificationJson = '';

    ipcRenderer.on(ON_NOTIFICATION_RECEIVED, (_: any, notification: any) => {
      try {
        const now = Date.now();
        const notificationJson = JSON.stringify(notification);

        // Prevent duplicates within 2 seconds
        if (notificationJson === lastNotificationJson && (now - lastNotificationTime < 2000)) {
          return;
        }

        // Rate limit: Enforce at least 500ms between notifications to please libnotify
        if (now - lastNotificationTime > 500) {
          ipcRenderer.send('SHOW_NATIVE_NOTIFICATION', notification);
          lastNotificationTime = now;
          lastNotificationJson = notificationJson;
        }

        this.notificationReceived.next(notification);
      } catch (e) {
      }
    });

    const pushConfig = {
      senderId: firebaseConfig.messagingSenderId,
      firebase: {
        apiKey: firebaseConfig.apiKey,
        appID: firebaseConfig.appId,
        projectID: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId
      },
      vapidKey: (firebaseConfig as any).vapidKey
    };

    ipcRenderer.send(START_NOTIFICATION_SERVICE, pushConfig);
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