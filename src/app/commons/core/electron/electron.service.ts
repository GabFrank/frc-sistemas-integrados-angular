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

// Guard para poder servir la app en un browser normal (dev/test): fuera de Electron
// `window.require` no existe. Todo consumidor de `electron`/`ipcRenderer` está detrás
// del getter `isElectron` (false en web), así que en browser quedan null sin romper.
const electron = (window && (window as any).require) ? (window as any).require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

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

export interface NetworkInfo {
  mejor: string | null;
  todas: { iface: string; ip: string }[];
  usuario: string | null;
}

export interface ShareResult {
  success: boolean;
  ip: string | null;
  uri: string | null;
  error?: string;
  aviso?: string;
}

/** Datos para imprimir un payload ESC/POS en una impresora local a esta PC, sin backend. */
export interface PrintLocalArgs {
  conexion: string; // 'CUPS' | 'USB' | 'RED' | 'BLUETOOTH'
  cola?: string;    // cola CUPS (CUPS/USB/BLUETOOTH)
  ip?: string;      // impresora de red (RED)
  puerto?: number;  // impresora de red (RED), típico 9100
  payloadBase64: string;
}

/** Datos para imprimir el ticket de PRUEBA local (Electron genera el ESC/POS, sin backend). */
export interface PrintTestLocalArgs {
  conexion: string;
  cola?: string;
  ip?: string;
  puerto?: number;
  nombre?: string;
  sucursal?: string;
  columnas?: number;
  perfil?: string;
}

/** Resultado de imprimir localmente (print-local / print-test-local). */
export interface PrintLocalResult {
  success: boolean;
  error?: string;
}

/** Resultado de instalar la impresora en el CUPS/spooler local de esta PC (sin pasar por el servidor). */
export interface InstallResult {
  success: boolean;
  cola?: string;
  uri?: string;
  needsPassword?: boolean; // Linux: CUPS necesita permisos de admin → la UI reintenta con contraseña
  error?: string;
}

/** Impresora de red descubierta por mDNS/DNS-SD (Bonjour) desde el proceso Electron. */
export interface NetworkPrinter {
  nombre: string;
  ip: string;
  host: string | null;
  modelo: string | null;
  puerto: number;
  uri: string;
  protocolos: string[];
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
      // Log del error pero no bloqueamos la aplicación
      // PHONE_REGISTRATION_ERROR es un error conocido de la librería cuando falla el registro con FCM
      // Puede deberse a problemas de red, configuración de Firebase, o bugs de la librería
      console.warn('Push notification service error:', error);
      // La aplicación continúa funcionando normalmente aunque las notificaciones push fallen
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
    // En browser (dev/test) no hay ipcRenderer; el header llama esto en ngOnInit.
    if (!this.isElectron || !ipcRenderer) return 'web';
    return ipcRenderer.sendSync('get-app-version');
  }
  getPrinters(): Observable<PrinterInfo[]> {
    return from(ipcRenderer.invoke('get-system-printers')) as Observable<PrinterInfo[]>;
  }

  /**
   * Descubre impresoras de red (Wi-Fi/Ethernet) por mDNS/DNS-SD (Bonjour). La detección la hace
   * este proceso Electron (frontend), independiente de la detección por cable/USB del backend.
   * Detecta Epson, HP, Brother, Canon, etc. que anuncian _ipp / _pdl-datastream (9100) / _printer.
   */
  detectNetworkPrinters(timeoutMs?: number): Observable<NetworkPrinter[]> {
    return from(ipcRenderer.invoke('detect-network-printers', { timeoutMs })) as Observable<NetworkPrinter[]>;
  }

  /**
   * Detecta las IPs LAN de esta máquina (para compartir la impresora local al servidor
   * central: el central alcanza la impresora por la IP de esta PC).
   */
  getLocalIp(): Observable<NetworkInfo> {
    return from(ipcRenderer.invoke('get-local-ip')) as Observable<NetworkInfo>;
  }

  /**
   * Comparte una cola CUPS local en la red y devuelve la URI IPP lista para instalarla en el
   * servidor central. Requiere permisos de administración de CUPS. Solo Linux.
   */
  shareLocalPrinter(queue: string, password?: string, centralIp?: string): Observable<ShareResult> {
    return from(ipcRenderer.invoke('share-local-printer', { queue, password, centralIp })) as Observable<ShareResult>;
  }

  /**
   * Instala la impresora en el CUPS/spooler LOCAL de esta PC (sin pasar por el servidor). Linux:
   * lpadmin (raw térmica / everywhere). Windows: Add-Printer. Si CUPS necesita permisos de admin
   * devuelve { needsPassword: true } para reintentar con la contraseña.
   */
  installLocalPrinter(cola: string, uri: string, raw = true, password?: string): Observable<InstallResult> {
    return from(ipcRenderer.invoke('install-local-printer', { cola, uri, raw, password })) as Observable<InstallResult>;
  }

  /**
   * Imprime un payload ESC/POS (base64) en una impresora LOCAL a esta PC, sin pasar por ningún
   * backend. Para PCs que solo corren el desktop contra el central en la nube: el backend nube no
   * alcanza una USB/cola CUPS ni una impresora de red de la LAN del cliente. RED → socket TCP a
   * ip:puerto; CUPS/USB/BLUETOOTH → `lp -d <cola> -o raw` (Linux/mac).
   */
  printLocal(args: PrintLocalArgs): Observable<PrintLocalResult> {
    return from(ipcRenderer.invoke('print-local', args)) as Observable<PrintLocalResult>;
  }

  /**
   * Imprime el ticket de PRUEBA generado 100% en el frontend (Electron arma el ESC/POS) y lo manda
   * a la impresora local a esta PC, sin ninguna llamada a servidores. RED → socket TCP; CUPS/USB →
   * `lp -d <cola> -o raw`.
   */
  printTestLocal(args: PrintTestLocalArgs): Observable<PrintLocalResult> {
    return from(ipcRenderer.invoke('print-test-local', args)) as Observable<PrintLocalResult>;
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