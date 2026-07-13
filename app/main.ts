import { app, BrowserWindow, dialog, Menu, MessageBoxOptions, screen } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import * as os from "os";
import { exec, spawn } from "child_process";
import { Buffer } from 'buffer';
import { PosPrinter } from 'electron-pos-printer';

import { autoUpdater, UpdateDownloadedEvent } from "electron-updater";

const log = require('electron-log');
const isDev = require('electron-is-dev');
const { setup: setupPushReceiver } = require('@superhuman/electron-push-receiver');

app.disableHardwareAcceleration();

autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

// Patch: safe AppImage swap (rename-then-move instead of unlink-then-move)
// Prevents losing the AppImage if the update fails mid-swap.
if (process.platform === 'linux') {
  const origDoInstall = (autoUpdater as any).doInstall;
  if (origDoInstall) {
    (autoUpdater as any).doInstall = function (options: any) {
      const appImageFile = process.env['APPIMAGE'];
      if (appImageFile && fs.existsSync(appImageFile)) {
        const backupPath = appImageFile + '.old';
        try {
          // Step 1: rename current → .old (atomic, never leaves gap)
          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          fs.renameSync(appImageFile, backupPath);
          log.info(`AppImage backed up: ${backupPath}`);
        } catch (e) {
          log.error('Failed to backup AppImage, proceeding with default install:', e);
          return origDoInstall.call(this, options);
        }
        try {
          // Step 2: move new AppImage to operative path
          const { execFileSync } = require('child_process');
          const destination = appImageFile;
          execFileSync('mv', ['-f', options.installerPath, destination]);
          execFileSync('chmod', ['+x', destination]);
          log.info(`New AppImage installed: ${destination}`);
          // Step 3: clean up backup
          if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
          // Step 4: relaunch
          const { spawn } = require('child_process');
          const env = { ...process.env, APPIMAGE_SILENT_INSTALL: 'true' };
          if (options.isForceRunAfter) {
            spawn(destination, [], { detached: true, stdio: 'ignore', env }).unref();
          }
          return true;
        } catch (e) {
          // Rollback: restore backup
          log.error('Failed to install new AppImage, restoring backup:', e);
          try {
            fs.renameSync(backupPath, appImageFile);
            log.info('Backup restored successfully');
          } catch (restoreErr) {
            log.error('CRITICAL: Failed to restore backup:', restoreErr);
          }
          return false;
        }
      }
      return origDoInstall.call(this, options);
    };
  }
}

let updateEnabled = false;

function configureUpdateChannel(): boolean {
  try {
    const configPath = path.join(app.getPath('userData'), 'config', 'config-backup.json');
    log.info(`Looking for config at: ${configPath}`);
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const channel = config.updateChannel;
      if (!channel || channel === 'dev') {
        log.info('Update channel not configured or set to dev, auto-update disabled');
        updateEnabled = false;
        return false;
      }
      log.info(`Update channel from config: ${channel}`);
      return applyUpdateChannel(channel);
    } else {
      log.info(`Config file NOT found at: ${configPath}`);
      // Try fallback: check parent userData directory for misplaced config
      const fallbackPaths = [
        path.join(app.getPath('userData'), 'config-backup.json'),
        path.join(app.getPath('appData'), 'frc-sistemas', 'config-backup.json'),
      ];
      for (const fallback of fallbackPaths) {
        log.info(`Trying fallback: ${fallback}`);
        if (fs.existsSync(fallback)) {
          log.info(`Found config at fallback: ${fallback}`);
          const config = JSON.parse(fs.readFileSync(fallback, 'utf8'));
          const channel = config.updateChannel;
          if (!channel || channel === 'dev') {
            updateEnabled = false;
            return false;
          }
          // Copy to expected location for next time
          const configDir = path.join(app.getPath('userData'), 'config');
          if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
          }
          fs.copyFileSync(fallback, configPath);
          log.info(`Copied config to expected location: ${configPath}`);
          return applyUpdateChannel(channel);
        }
      }
      log.info('No config file found in any location, auto-update disabled until configured');
      updateEnabled = false;
      return false;
    }
  } catch (e) {
    log.error('Error reading update channel config:', e);
    updateEnabled = false;
    return false;
  }
}

function applyUpdateChannel(channel: string): boolean {
  switch (channel) {
    case 'alpha':
      autoUpdater.allowPrerelease = true;
      autoUpdater.channel = 'alpha';
      updateEnabled = true;
      break;
    case 'beta':
      autoUpdater.allowPrerelease = true;
      autoUpdater.channel = 'beta';
      updateEnabled = true;
      break;
    case 'stable':
      autoUpdater.allowPrerelease = false;
      autoUpdater.channel = 'latest';
      updateEnabled = true;
      break;
    default:
      updateEnabled = false;
      break;
  }
  log.info(`Auto-updater configured: channel=${channel}, enabled=${updateEnabled}, allowPrerelease=${autoUpdater.allowPrerelease}`);
  return updateEnabled;
}

function calculateDefaultZoom(): number {
  try {
    const display = screen.getPrimaryDisplay();
    const { width } = display.workAreaSize;
    const scaleFactor = display.scaleFactor;
    // workAreaSize ya es la resolución lógica (descontando scaleFactor y taskbar)
    // A menor resolución lógica disponible, más necesitamos reducir el zoom
    // Referencia: 1920px lógicos con scale 1.0 → -1.5
    let zoom: number;
    if (width <= 1280) {
      zoom = -2.5;
    } else if (width <= 1366) {
      zoom = -2.0;
    } else if (width <= 1600) {
      zoom = -1.75;
    } else if (width <= 1920) {
      zoom = -1.5;
    } else if (width <= 2560) {
      zoom = -1.0;
    } else {
      zoom = -0.5;
    }
    // Si el SO tiene escala > 100%, reducir un poco más porque el SO ya agranda todo
    if (scaleFactor > 1.0) {
      zoom -= (scaleFactor - 1.0);
    }
    log.info(`Default zoom calculated: ${zoom} (resolution: ${width}x${display.workAreaSize.height}, scaleFactor: ${scaleFactor})`);
    return zoom;
  } catch (e) {
    log.warn('Could not calculate default zoom, using -1.5:', e);
    return -1.5;
  }
}

function getZoomFilePath(): string {
  return path.join(app.getPath('userData'), 'config', 'zoom-level.json');
}

function saveZoomLevel(level: number): void {
  try {
    const filePath = getZoomFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ zoomLevel: level }), 'utf8');
  } catch (e) {
    log.warn('Could not save zoom level to file:', e);
  }
}

function loadZoomLevel(): number {
  try {
    const filePath = getZoomFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (typeof data.zoomLevel === 'number') {
        log.info(`Zoom level loaded from file: ${data.zoomLevel}`);
        return data.zoomLevel;
      }
    }
  } catch (e) {
    log.warn('Could not read zoom level from file:', e);
  }
  return calculateDefaultZoom();
}

interface PrinterConfig {
  id: number;
  name: string;
  type: string;
  connectionType: string;
  address: string;
  port?: number;
  width?: number;
  characterSet?: string;
  options?: any;
}

let printers: PrinterConfig[] = [];


const { ipcMain } = require('electron');

require("@electron/remote/main").initialize();

let win: BrowserWindow;
let windows: BrowserWindow[] = [];
// Particion (sesion/localStorage propios) para la 2da ventana: permite tener un
// usuario logueado distinto al de la 1ra (caso cambio de turno de cajero). La config
// del sistema (servidor/caja/pdv) NO se aisla: la 2da ventana la recupera del archivo
// compartido config-backup.json via el fallback de ConfiguracionService.
const SECOND_INSTANCE_PARTITION = 'persist:frc-caja-2';
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

// Maximo 2 instancias. El lock de instancia unica hace que cualquier re-lanzamiento
// del ejecutable caiga en el proceso primario via 'second-instance'. Ahi decidimos:
// si hay < 2 ventanas, abrir una 2da; si ya hay 2, enfocar la activa y avisar.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}
app.on('second-instance', () => {
  if (windows.length >= 2) {
    const target = win || windows[windows.length - 1];
    if (target) {
      if (target.isMinimized()) target.restore();
      target.focus();
      target.webContents.send('max-instances-reached');
    }
    return;
  }
  createWindow(SECOND_INSTANCE_PARTITION);
});

export async function createWindow(partition?: string): Promise<BrowserWindow> {
  const electronScreen = screen;
  const size = screen.getPrimaryDisplay().workAreaSize;
  let factor = screen.getPrimaryDisplay().scaleFactor;

  const w = new BrowserWindow({
    icon: `file://${__dirname}/dist/assets/logo.ico`,
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
      ...(partition ? { partition } : {}),
    },
  });
  win = w;
  windows.push(w);
  require("@electron/remote/main").enable(w.webContents);
  // 'win' (global) apunta siempre a la ventana enfocada: menu, zoom y update-status operan sobre ella.
  w.on('focus', () => { win = w; });
  w.on('closed', () => {
    windows = windows.filter((other) => other !== w);
    if (win === w) win = windows[windows.length - 1];
  });

  setupPushReceiver(w.webContents);
  const { Notification } = require('electron');

  // Registrar el handler de notificaciones nativas una sola vez (no por ventana):
  // evita notificaciones duplicadas cuando hay 2 instancias abiertas.
  ipcMain.removeAllListeners('SHOW_NATIVE_NOTIFICATION');
  ipcMain.on('SHOW_NATIVE_NOTIFICATION', (event: any, notification: any) => {

    try {
      if (!Notification.isSupported()) {
        log.warn('Native notifications not supported on this system, skipping');
        return;
      }

      const title = notification?.notification?.title ||
        notification?.data?.title ||
        'FRC Sistemas Integrados';

      const body = notification?.notification?.body ||
        notification?.notification?.message ||
        notification?.data?.message ||
        notification?.data?.body ||
        '';

      const data = notification?.data || {};

      const nativeNotification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, 'dist/assets/logo.png'),
        silent: false,
        urgency: 'normal'
      });

      nativeNotification.on('click', () => {
        if (win) {
          if (win.isMinimized()) win.restore();
          win.focus();
        }
        if (data.path) {
          win.webContents.send('notification-clicked', data.path);
        }
      });

      nativeNotification.show();

    } catch (error) {
      log.warn('Error showing native notification:', error);
    }
  });

  // win.webContents.setZoomFactor(1); // Removido para permitir que el zoom se maneje dinámicamente en did-finish-load

  w.maximize();
  w.show();

  if (serve) {
    w.webContents.openDevTools();
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    w.loadURL('http://localhost:4200');
  } else {
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    w.loadURL(url.href);
  }

  w.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    console.log("did-fail-load", { errorCode, errorDescription, validatedURL });
    // Solo relanzamos si es un error crítico de carga de la página principal (index.html o localhost:4200)
    // No relanzamos por errores de recursos secundarios o servicios externos (como FCM/push notifications)
    const isMainPage = validatedURL && (
      validatedURL.includes('index.html') || 
      validatedURL.includes('localhost:4200') ||
      validatedURL.includes('file://')
    );
    
    if (isMainPage && errorCode !== -3) { // -3 = ABORTED (puede ser cancelado intencionalmente)
      console.log("Error crítico en página principal, relanzando aplicación");
      relaunchElectron();
    } else {
      console.log("Error en recurso secundario o no crítico, continuando sin relanzar");
    }
  });

  w.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });

  w.webContents.on('did-finish-load', () => {
    // Leer zoom desde archivo (no depende de localStorage ni del renderer)
    const zoom = loadZoomLevel();
    w.webContents.setZoomLevel(zoom);
    // Sincronizar con localStorage del renderer para mantener compatibilidad
    w.webContents.executeJavaScript(`localStorage.setItem("zoomLevel", ${zoom});`, true);
    log.info(`Zoom level applied on load: ${zoom}`);
  });

  return w;
}

ipcMain.on('get-config-file', (event: any, arg: any) => {
  console.log(arg)
})

ipcMain.on('save-config-backup', (event: any, configData: string) => {
  try {
    const configDir = path.join(app.getPath('userData'), 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, 'config-backup.json');
    fs.writeFileSync(configPath, configData, 'utf8');
    log.info(`Config backup saved by main process to: ${configPath}`);
  } catch (e) {
    log.error('Error saving config backup from renderer:', e);
  }
});

ipcMain.on('set-update-channel', (event: any, channel: string) => {
  log.info(`Update channel changed to: ${channel}`);
  if (applyUpdateChannel(channel)) {
    autoUpdater.checkForUpdates();
  }
})

ipcMain.on('check-for-update-manual', () => {
  if (!updateEnabled) {
    if (win) win.webContents.send('update-status', 'Auto-update desactivado. Configure un canal primero.');
    return;
  }
  autoUpdater.checkForUpdates().then(result => {
    if (!result || !result.updateInfo) {
      if (win) win.webContents.send('update-status', 'Ya tiene la ultima version.');
    }
  }).catch(err => {
    log.error('Error checking for updates:', err);
    if (win) win.webContents.send('update-status', `Error: ${(err as any)?.message}`);
  });
})

ipcMain.on('open-update-dialog', () => {
  if (win) win.webContents.send('open-update-dialog');
})

ipcMain.on('reiniciar', (event: any, arg: any) => {
  relaunchElectron()
})

ipcMain.on('get-app-version', (event: any) => {
  event.returnValue = app.getVersion();
});

// Add Thermal Printer IPC handlers
ipcMain.handle('get-printers', (event: any) => {
  return printers;
});

ipcMain.handle('save-printer', (event: any, printer: PrinterConfig) => {
  const existingIndex = printers.findIndex(p => p.id === printer.id);
  if (existingIndex >= 0) {
    printers[existingIndex] = printer;
  } else {
    printer.id = printers.length > 0 ? Math.max(...printers.map(p => p.id)) + 1 : 1;
    printers.push(printer);
  }
  return printer;
});

ipcMain.handle('delete-printer', (event: any, printerId: number) => {
  const existingIndex = printers.findIndex(p => p.id === printerId);
  if (existingIndex >= 0) {
    printers.splice(existingIndex, 1);
    return true;
  }
  return false;
});

ipcMain.handle('test-printer', async (event: any, printerId: number) => {
  try {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) {
      return { success: false, error: 'Printer not found' };
    }

    const content = generateTestPageContent(printer);
    const success = await printThermalReceipt(printer, content);

    return { success };
  } catch (error) {
    console.error('Error printing test page:', error);
    return { success: false, error: (error as any)?.message };
  }
});

ipcMain.handle('print-receipt', async (event, { printerId, order, orderItems }) => {
  try {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) {
      return { success: false, error: 'Printer not found' };
    }

    const content = generateReceiptContent(order, orderItems);
    const success = await printThermalReceipt(printer, content);

    return { success };
  } catch (error) {
    console.error('Error printing receipt:', error);
    return { success: false, error: (error as any)?.message };
  }
});

/**
 * Detecta las IPs LAN (IPv4 no internas) de esta maquina. Se usa para compartir la
 * impresora local al servidor central: el central alcanza la impresora por la IP de esta PC.
 * Prefiere la interfaz en la subred del servidor FRC (172.25.x), luego cualquier rango privado.
 */
function detectarIpsLocales(): {
  mejor: string | null;
  todas: { iface: string; ip: string }[];
  usuario: string | null;
} {
  const todas: { iface: string; ip: string }[] = [];
  const ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach((nombre) => {
    (ifaces[nombre] || []).forEach((info: any) => {
      if (info.family === 'IPv4' && !info.internal) {
        todas.push({ iface: nombre, ip: info.address });
      }
    });
  });
  const preferida =
    todas.find((t) => t.ip.startsWith('172.25.')) ||
    todas.find((t) => /^(10\.|192\.168\.|172\.)/.test(t.ip)) ||
    todas[0];
  let usuario: string | null = null;
  try {
    usuario = os.userInfo().username;
  } catch {
    usuario = null;
  }
  return { mejor: preferida ? preferida.ip : null, todas, usuario };
}

/**
 * Devuelve la IP de origen que ESTA PC usa para alcanzar `destIp` (equivalente a `ip route get`).
 * Un socket UDP con `connect` no envía paquetes: solo fija la ruta y expone la IP local que el
 * kernel elige. Así la URI IPP siempre usa la interfaz que realmente rutea al servidor destino
 * (ZeroTier en cualquier subred, Tailscale 100.x, LAN, o varias NICs), en vez de adivinar por
 * prefijo `172.25.`. Devuelve null si no hay destino o no se pudo resolver (cae al heurístico).
 */
function ipLocalHaciaDestino(destIp?: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!destIp) {
      resolve(null);
      return;
    }
    let done = false;
    const dgram = require('dgram');
    const socket = dgram.createSocket('udp4');
    const finish = (ip: string | null) => {
      if (done) return;
      done = true;
      try { socket.close(); } catch { /* noop */ }
      resolve(ip);
    };
    socket.on('error', () => finish(null));
    try {
      // Puerto 9 (discard): connect no transmite, solo resuelve la ruta de origen.
      socket.connect(9, destIp, () => {
        try {
          const dir = socket.address();
          finish(dir && dir.address ? dir.address : null);
        } catch {
          finish(null);
        }
      });
    } catch {
      finish(null);
    }
    setTimeout(() => finish(null), 1500);
  });
}

/**
 * Comparte una cola CUPS local en la red y devuelve la URI IPP lista para instalarla en el
 * servidor central. Habilita el compartir en cupsd (cupsctl --share-printers --remote-any) y
 * marca la cola como compartida. Requiere permisos de administracion de CUPS (grupo lpadmin).
 * Solo Linux (CUPS); en otras plataformas devuelve la IP para uso manual.
 */
async function compartirImpresoraLocal(
  queue: string,
  password?: string,
  centralIp?: string,
): Promise<{ success: boolean; ip: string | null; uri: string | null; error?: string; aviso?: string }> {
  // IP de esta PC que el servidor destino puede rutear: se DERIVA de la ruta real hacia el
  // centralIp que el usuario indicó (nunca se adivina por prefijo). Si no hay destino o no se
  // pudo resolver, ipPc queda null y el frontend pedirá la IP manual antes de instalar.
  const ipPc = await ipLocalHaciaDestino(centralIp);
  return new Promise((resolve) => {
    const colaSegura = (queue || '').replace(/[^A-Za-z0-9_-]/g, '');
    const uri = ipPc && colaSegura ? `ipp://${ipPc}:631/printers/${colaSegura}` : null;
    if (process.platform !== 'linux') {
      resolve({ success: false, ip: ipPc, uri: null, error: 'Compartir CUPS solo disponible en Linux' });
      return;
    }
    if (!colaSegura) {
      resolve({ success: false, ip: ipPc, uri: null, error: 'Nombre de cola invalido' });
      return;
    }
    // Ejecuta un comando (con o sin sudo) y devuelve {code, stdout, stderr}.
    // sudo: -S lee el password de stdin · -k fuerza reautenticación · -p '' sin texto de prompt.
    const run = (args: string[], useSudo: boolean): Promise<{ code: number; stdout: string; stderr: string }> =>
      new Promise((res) => {
        const proc = useSudo
          ? spawn('sudo', ['-S', '-k', '-p', '', ...args])
          : spawn(args[0], args.slice(1));
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: any) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: any) => { stderr += d.toString(); });
        proc.on('error', (err: any) => res({ code: 1, stdout, stderr: stderr || err.message }));
        proc.on('close', (code: number) => res({ code: code == null ? 1 : code, stdout, stderr }));
        if (useSudo && password) {
          proc.stdin.write(password + '\n');
        }
        proc.stdin.end();
      });
    const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      try {
        // 1) Solo habilitamos compartir/acceso remoto si aún no está activo (evita reiniciar cupsd al pedo).
        const estado = await run(['cupsctl'], false);
        const yaCompartido = /_share_printers=1/.test(estado.stdout) && /_remote_any=1/.test(estado.stdout);
        if (!yaCompartido) {
          const c1 = await run(['cupsctl', '--share-printers', '--remote-any'], !!password);
          if (c1.code !== 0) {
            const msg = (c1.stderr || '').trim() || 'No se pudo habilitar el compartir en CUPS';
            console.error('[CUPS] cupsctl falló:', msg);
            resolve({ success: false, ip: ipPc, uri, error: msg });
            return;
          }
          await espera(1000); // cupsd puede reiniciarse tras el cambio de config
        }
        // 2) Marcamos la cola como compartida; reintentamos si cupsd está reiniciando (Service unavailable).
        let ultimo = { code: 1, stdout: '', stderr: '' };
        for (let i = 0; i < 6; i++) {
          ultimo = await run(['lpadmin', '-p', colaSegura, '-o', 'printer-is-shared=true'], !!password);
          if (ultimo.code === 0) {
            break;
          }
          if (!/no disponible|unavailable|503|refus|connect/i.test(ultimo.stderr)) {
            break; // error real (no es el reinicio) → no tiene sentido reintentar
          }
          await espera(800);
        }
        if (ultimo.code !== 0) {
          const msg = (ultimo.stderr || '').trim() || 'lpadmin no pudo compartir la cola';
          console.error('[CUPS] lpadmin falló:', msg);
          resolve({ success: false, ip: ipPc, uri, error: msg });
          return;
        }
        // 3) Hardening (best-effort, no bloqueante): abrir el puerto 631 SOLO para el central.
        // Con VPN, restringe quién puede alcanzar tu CUPS. Si no hay firewalld o falla, seguimos.
        const aviso = await restringirCupsAlCentral(run, centralIp);
        resolve({ success: true, ip: ipPc, uri, aviso });
      } catch (e: any) {
        resolve({ success: false, ip: ipPc, uri, error: e && e.message ? e.message : 'error compartiendo' });
      }
    })();
  });
}

/**
 * Best-effort: restringe el acceso al CUPS local (puerto 631) SOLO a la IP del central via
 * firewalld (Fedora/RHEL). Agrega una rich rule que acepta 631/tcp desde esa IP. No abre 631
 * de forma amplia, así solo el central lo alcanza. Si no hay firewalld o falla, devuelve un aviso
 * (no es fatal: el compartir ya funcionó).
 */
async function restringirCupsAlCentral(
  run: (args: string[], useSudo: boolean) => Promise<{ code: number; stdout: string; stderr: string }>,
  centralIp?: string,
): Promise<string | undefined> {
  const ipValida = centralIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(centralIp);
  if (!ipValida) {
    return 'No se aplicó restricción de firewall (IP del central inválida o vacía).';
  }
  // ¿Hay firewalld?
  const cual = await run(['sh', '-c', 'command -v firewall-cmd || true'], false);
  if (!cual.stdout.trim()) {
    return 'CUPS compartido sin restricción de firewall (no se encontró firewalld). Restringí el puerto 631 al central a mano.';
  }
  const regla = `rule family="ipv4" source address="${centralIp}" port port="631" protocol="tcp" accept`;
  const add = await run(['firewall-cmd', '--permanent', `--add-rich-rule=${regla}`], true);
  if (add.code !== 0) {
    return 'No se pudo aplicar la restricción de firewall (' + ((add.stderr || '').trim() || 'error') + '). CUPS quedó compartido igual.';
  }
  await run(['firewall-cmd', '--reload'], true);
  return undefined; // aplicado OK
}

interface ResultadoInstalacionLocal {
  success: boolean;
  cola?: string;
  uri?: string;
  needsPassword?: boolean; // Linux: lpadmin necesita permisos de admin (sudo) → la UI vuelve a pedir contraseña
  error?: string;
}

/**
 * Instala la impresora en el CUPS/spooler LOCAL de esta PC (NO en el servidor). Es la vía por
 * defecto: cada PC instala su propia impresora sin depender del backend; luego opcionalmente la
 * comparte al filial/central por IP. Los datos de la impresora se siguen guardando en la BD (que
 * replica a las filiales) por separado.
 *  - Linux: `lpadmin -p <cola> -E -v <uri> -m raw` (térmica ESC/POS crudo) o `-m everywhere`
 *    (driverless IPP). Requiere permisos de admin de CUPS: se intenta sin sudo y, si CUPS lo
 *    rechaza, se devuelve needsPassword para reintentar con la contraseña.
 *  - Windows: `Add-PrinterPort` (TCP/IP raw) + `Add-Printer` (driver "Generic / Text Only").
 */
function instalarImpresoraLocal(
  cola: string,
  uri: string,
  raw: boolean,
  password?: string,
): Promise<ResultadoInstalacionLocal> {
  return new Promise((resolve) => {
    const colaSegura = (cola || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
    if (!colaSegura) {
      resolve({ success: false, error: 'Nombre de cola inválido' });
      return;
    }
    if (!uri) {
      resolve({ success: false, error: 'URI de impresora vacía' });
      return;
    }
    // Ejecuta un comando (con o sin sudo) y devuelve {code, stdout, stderr}. Igual que compartir.
    const run = (args: string[], useSudo: boolean): Promise<{ code: number; stdout: string; stderr: string }> =>
      new Promise((res) => {
        const proc = useSudo
          ? spawn('sudo', ['-S', '-k', '-p', '', ...args])
          : spawn(args[0], args.slice(1));
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: any) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: any) => { stderr += d.toString(); });
        proc.on('error', (err: any) => res({ code: 1, stdout, stderr: stderr || err.message }));
        proc.on('close', (code: number) => res({ code: code == null ? 1 : code, stdout, stderr }));
        if (useSudo && password) {
          proc.stdin.write(password + '\n');
        }
        proc.stdin.end();
      });

    (async () => {
      try {
        if (process.platform === 'win32') {
          // Windows: crea el puerto TCP/IP raw y agrega la impresora con driver de texto genérico.
          const m = (uri || '').match(/^(socket|ipp|ipps|lpd):\/\/([^:/]+)(?::(\d+))?/i);
          const host = m ? m[2] : null;
          const puerto = m && m[3] ? m[3] : '9100';
          if (!host) {
            resolve({ success: false, error: 'URI no soportada en Windows: ' + uri });
            return;
          }
          const portName = ('FRC_' + host + '_' + puerto).replace(/[^A-Za-z0-9_]/g, '');
          const ps =
            `if (-not (Get-PrinterPort -Name '${portName}' -ErrorAction SilentlyContinue)) { `
            + `Add-PrinterPort -Name '${portName}' -PrinterHostAddress '${host}' -PortNumber ${puerto} }; `
            + `Add-Printer -Name '${colaSegura}' -DriverName 'Generic / Text Only' -PortName '${portName}'`;
          const r = await run(['powershell', '-NoProfile', '-NonInteractive', '-Command', ps], false);
          if (r.code !== 0) {
            resolve({ success: false, cola: colaSegura, error: (r.stderr || '').trim() || 'Add-Printer falló' });
            return;
          }
          resolve({ success: true, cola: colaSegura, uri });
          return;
        }
        if (process.platform !== 'linux') {
          resolve({ success: false, error: 'Instalación local solo disponible en Linux y Windows' });
          return;
        }
        // Linux/CUPS. raw para térmicas (ESC/POS); everywhere solo aplica a URIs IPP.
        const modelo = raw ? 'raw' : (/^ipps?:/i.test(uri) ? 'everywhere' : 'raw');
        const args = ['lpadmin', '-p', colaSegura, '-E', '-v', uri, '-m', modelo];
        const r = await run(args, !!password);
        if (r.code !== 0) {
          const stderr = (r.stderr || '').trim();
          const esPermisos = /forbid|denied|permission|not allowed|unauthor|password|contrase/i.test(stderr);
          if (esPermisos && !password) {
            // Sin sudo no alcanza: pedimos la contraseña de admin y reintentamos.
            resolve({ success: false, cola: colaSegura, needsPassword: true, error: stderr });
            return;
          }
          resolve({ success: false, cola: colaSegura, error: stderr || 'lpadmin no pudo instalar la cola' });
          return;
        }
        resolve({ success: true, cola: colaSegura, uri });
      } catch (e: any) {
        resolve({ success: false, cola: colaSegura, error: e && e.message ? e.message : 'error instalando' });
      }
    })();
  });
}

// ---------------------------------------------------------------------------
// Descubrimiento de impresoras de RED (lo hace el frontend/Electron).
// Combina dos fuentes: (1) mDNS/DNS-SD (Bonjour) para las que se anuncian, y
// (2) barrido de la subred /24 por puertos de impresion, para las que NO se
// anuncian (JetDirect crudo, mDNS deshabilitado). Ambas se fusionan por IP.
// ---------------------------------------------------------------------------

interface EntradaRed {
  nombre: string | null;
  ip: string;
  host: string | null;
  modelo: string | null;
  puertos: Set<number>;
  protocolos: Set<string>;
}

/** Etiqueta de protocolo legible a partir de un puerto de impresion de red. */
function etiquetaPuerto(puerto: number): string {
  if (puerto === 9100) return 'raw:9100';
  if (puerto === 631) return 'ipp';
  if (puerto === 515) return 'lpd';
  return String(puerto);
}

function obtenerOCrearEntrada(mapa: Map<string, EntradaRed>, ip: string): EntradaRed {
  let e = mapa.get(ip);
  if (!e) {
    e = { nombre: null, ip, host: null, modelo: null, puertos: new Set(), protocolos: new Set() };
    mapa.set(ip, e);
  }
  return e;
}

/** Descubre impresoras que se anuncian por mDNS/DNS-SD (Bonjour). */
function descubrirImpresorasMdns(timeoutMs: number, locales: Set<string>): Promise<Map<string, EntradaRed>> {
  return new Promise((resolve) => {
    const mapa = new Map<string, EntradaRed>();
    let bonjour: any = null;
    try {
      const { Bonjour } = require('bonjour-service');
      bonjour = new Bonjour();
    } catch (e) {
      console.error('mDNS (bonjour-service) no disponible:', e);
      resolve(mapa);
      return;
    }
    const tipoAProtocolo: { [t: string]: string } = {
      ipp: 'ipp', ipps: 'ipps', 'pdl-datastream': 'raw:9100', printer: 'lpd',
    };
    const browsers = Object.keys(tipoAProtocolo).map((type) => bonjour.find({ type }));
    const primeraIpv4 = (s: any): string | null => {
      const dir = ((s && s.addresses) || []).find((a: string) => /^\d+\.\d+\.\d+\.\d+$/.test(a));
      return dir || null;
    };
    const limpiarNombre = (n: string): string => (n || '').replace(/\s*@.*$/, '').trim();
    const limpiarModelo = (m: any): string | null => (m ? String(m).replace(/[()]/g, '').trim() : null);

    browsers.forEach((br: any) => {
      br.on('up', (s: any) => {
        const ip = primeraIpv4(s);
        if (!ip || locales.has(ip)) {
          return; // sin IPv4 utilizable o es esta misma PC (ya cubierta por la deteccion local)
        }
        const e = obtenerOCrearEntrada(mapa, ip);
        if (typeof s.port === 'number' && s.port > 0) {
          e.puertos.add(s.port);
        }
        e.protocolos.add(tipoAProtocolo[s.type] || s.type);
        const txt = (s && s.txt) || {};
        const modelo = limpiarModelo(txt.ty || txt.product || txt.usb_MDL);
        if (!e.modelo && modelo) {
          e.modelo = modelo;
        }
        if (!e.host && s.host) {
          e.host = s.host;
        }
        const nombre = limpiarNombre(s.name);
        if (!e.nombre && nombre) {
          e.nombre = nombre;
        }
      });
    });

    setTimeout(() => {
      browsers.forEach((br: any) => { try { br.stop(); } catch { /* noop */ } });
      try { bonjour.destroy(); } catch { /* noop */ }
      resolve(mapa);
    }, timeoutMs);
  });
}

/**
 * Escanea la(s) subred(es) /24 locales probando los puertos de impresion (raw 9100, IPP 631,
 * LPD 515). Encuentra impresoras que NO se anuncian por mDNS/CUPS. Best-effort, acotado a /24
 * y a los rangos privados para no saturar la red. El nombre se resuelve por PTR (reverse DNS).
 * Solo consideramos impresora a la IP con el puerto RAW 9100 abierto: el 631 (IPP/CUPS) solo lo
 * tiene abierto cualquier PC con CUPS, asi que filtrarlo evita falsos positivos. Las impresoras
 * que solo exponen IPP igual se descubren por mDNS.
 */
async function escanearImpresorasRed(connectTimeoutMs: number, locales: Set<string>): Promise<Map<string, EntradaRed>> {
  const net = require('net');
  const dnsp = require('dns').promises;
  const PUERTOS_IMPRESORA = [9100, 515]; // señales fuertes de impresora (631 lo tiene cualquier PC con CUPS)
  const MAX_SUBREDES = 3;
  // Barrido de vida: mayormente son hosts ausentes esperando el temporizador (no estresan a las
  // impresoras), asi que la concurrencia alta acelera sin perder fiabilidad. El reintento sobre los
  // hosts vivos va gentil (poca concurrencia, mas timeout).
  const CONC_VIDA = 256;
  const CONC_RETRY = 32;

  // Bases /24 unicas de las interfaces IPv4 privadas de esta PC.
  const bases: string[] = [];
  detectarIpsLocales().todas.forEach((t) => {
    if (!/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(t.ip)) {
      return; // solo rangos privados (evita escanear redes publicas/VPN amplias)
    }
    const base = t.ip.replace(/\.\d+$/, '.');
    if (!bases.includes(base)) {
      bases.push(base);
    }
  });

  const objetivos: string[] = [];
  bases.slice(0, MAX_SUBREDES).forEach((base) => {
    for (let h = 1; h <= 254; h++) {
      const ip = base + h;
      if (!locales.has(ip)) {
        objetivos.push(ip); // esta misma PC excluida
      }
    }
  });

  const sondear = (ip: string, puerto: number, timeoutMs: number): Promise<boolean> => new Promise((resolve) => {
    const sock = new net.Socket();
    let resuelto = false;
    // Temporizador explicito: net.Socket.setTimeout NO dispara 'timeout' durante la fase de
    // connect, asi que sin esto los hosts ausentes esperarian el timeout del SO (~2 min).
    const temporizador = setTimeout(() => terminar(false), timeoutMs);
    const terminar = (abierto: boolean) => {
      if (resuelto) { return; }
      resuelto = true;
      clearTimeout(temporizador);
      try { sock.destroy(); } catch { /* noop */ }
      resolve(abierto);
    };
    sock.once('connect', () => terminar(true));
    sock.once('error', () => terminar(false));
    sock.connect(puerto, ip);
  });

  const abiertosPorIp = new Map<string, Set<number>>();
  const registrar = (ip: string, puerto: number): void => {
    const s = abiertosPorIp.get(ip) || new Set<number>();
    s.add(puerto);
    abiertosPorIp.set(ip, s);
  };

  // Pool de concurrencia sobre una lista de tareas.
  const correr = async (tareas: { ip: string; puerto: number }[], concurrencia: number, timeoutMs: number): Promise<void> => {
    let idx = 0;
    const worker = async (): Promise<void> => {
      while (idx < tareas.length) {
        const t = tareas[idx++];
        // eslint-disable-next-line no-await-in-loop
        if (await sondear(t.ip, t.puerto, timeoutMs)) {
          registrar(t.ip, t.puerto);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrencia, tareas.length || 1) }, worker));
  };

  // Barrido de vida: solo puertos de impresora, con 9100 sondeado dos veces para tolerar un SYN
  // perdido en WiFi (clave para impresoras raw-only que si no se pierden intermitentemente).
  const tareasVida: { ip: string; puerto: number }[] = [];
  [9100, 515, 9100].forEach((puerto) => objetivos.forEach((ip) => tareasVida.push({ ip, puerto })));
  await correr(tareasVida, CONC_VIDA, connectTimeoutMs);

  // Enriquecer/reintentar SOLO en hosts que ya dieron señal: agrega IPP (631) para saber si se
  // puede instalar por CUPS, y reintenta gentil los puertos de impresora que no abrieron.
  const tareasDetalle: { ip: string; puerto: number }[] = [];
  abiertosPorIp.forEach((puertos, ip) => {
    [631, ...PUERTOS_IMPRESORA].forEach((puerto) => { if (!puertos.has(puerto)) { tareasDetalle.push({ ip, puerto }); } });
  });
  if (tareasDetalle.length) {
    await correr(tareasDetalle, CONC_RETRY, connectTimeoutMs + 500);
  }

  const mapa = new Map<string, EntradaRed>();
  await Promise.all(Array.from(abiertosPorIp.keys()).map(async (ip) => {
    const puertos = abiertosPorIp.get(ip) || new Set<number>();
    if (!PUERTOS_IMPRESORA.some((p) => puertos.has(p))) {
      return; // solo 631 abierto: es una PC con CUPS, no una impresora
    }
    const e = obtenerOCrearEntrada(mapa, ip);
    puertos.forEach((p) => { e.puertos.add(p); e.protocolos.add(etiquetaPuerto(p)); });
    try {
      // Reverse DNS con tope de 1s para no colgar el escaneo si el DNS no responde.
      const hosts = await Promise.race([
        dnsp.reverse(ip),
        new Promise<string[] | null>((r) => setTimeout(() => r(null), 1000)),
      ]);
      if (hosts && hosts[0]) {
        e.host = hosts[0];
        e.nombre = hosts[0].replace(/\.local$/i, '').split('.')[0];
      }
    } catch { /* sin PTR: se queda sin nombre y la UI muestra la IP */ }
  }));
  return mapa;
}

/**
 * Imprime un payload ESC/POS (base64) en una impresora LOCAL a esta PC, sin backend.
 *   - RED: socket TCP crudo a ip:puerto (raw/JetDirect, típico 9100).
 *   - CUPS/USB/BLUETOOTH: `lp -d <cola> -o raw` (Linux/mac) con el payload por stdin. `lp` habla
 *     directo con cupsd (no depende de PrintServiceLookup) y `-o raw` garantiza passthrough.
 * Devuelve { success, error? }. No lanza: cualquier fallo vuelve como { success:false, error }.
 */
function imprimirLocalRaw(arg: any): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const conexion = String(arg?.conexion || '').toUpperCase();
    const payloadB64 = arg?.payloadBase64;
    if (!payloadB64) {
      resolve({ success: false, error: 'Payload de impresión vacío' });
      return;
    }
    let buffer: Buffer;
    try {
      buffer = Buffer.from(payloadB64, 'base64');
    } catch {
      resolve({ success: false, error: 'Payload base64 inválido' });
      return;
    }

    if (conexion === 'RED') {
      const net = require('net');
      const ip = arg?.ip;
      const puerto = Number(arg?.puerto) || 9100;
      if (!ip) {
        resolve({ success: false, error: 'IP de la impresora de red vacía' });
        return;
      }
      const socket = new net.Socket();
      let terminado = false;
      const finish = (r: { success: boolean; error?: string }) => {
        if (terminado) return;
        terminado = true;
        try { socket.destroy(); } catch { /* noop */ }
        resolve(r);
      };
      socket.setTimeout(8000);
      socket.on('error', (e: any) => finish({ success: false, error: e && e.message ? e.message : 'error de socket' }));
      socket.on('timeout', () => finish({ success: false, error: 'timeout conectando a ' + ip + ':' + puerto }));
      socket.connect(puerto, ip, () => {
        socket.write(buffer, () => {
          socket.end();
          finish({ success: true });
        });
      });
      return;
    }

    // CUPS / USB / BLUETOOTH: cola local via `lp -d <cola> -o raw`.
    const cola = String(arg?.cola || '').trim();
    if (!cola) {
      resolve({ success: false, error: 'Cola CUPS vacía' });
      return;
    }
    if (process.platform === 'win32') {
      resolve({ success: false, error: 'Impresión CUPS local aún no soportada en Windows' });
      return;
    }
    try {
      const proc = spawn('lp', ['-d', cola, '-o', 'raw']);
      let stderr = '';
      proc.stderr.on('data', (d: any) => { stderr += d.toString(); });
      proc.on('error', (e: any) => resolve({ success: false, error: e && e.message ? e.message : 'no se pudo ejecutar lp' }));
      proc.on('close', (code: number) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: stderr.trim() || ('lp terminó con código ' + code) });
        }
      });
      proc.stdin.write(buffer);
      proc.stdin.end();
    } catch (e: any) {
      resolve({ success: false, error: e && e.message ? e.message : 'error ejecutando lp' });
    }
  });
}

/** Columnas por defecto según el perfil de papel (fuente A). Replica PerfilPapelHelper del backend. */
function columnasPorPerfil(perfil?: string): number {
  switch (String(perfil || '').toUpperCase()) {
    case 'MM_48':
    case 'MM_58': return 32;
    case 'MM_72': return 42;
    case 'MM_80': return 48;
    default: return 32; // A4 / CARTA / CUSTOM / desconocido
  }
}

/**
 * Genera el ESC/POS del ticket de PRUEBA en el frontend (sin backend): título centrado en negrita,
 * separadores y datos de la impresora. Se imprime local con `print-local`.
 */
function construirTicketPruebaEscPos(meta: any): Buffer {
  const cols = Number(meta?.columnas) > 0 ? Number(meta.columnas) : columnasPorPerfil(meta?.perfil);
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;
  const partes: Buffer[] = [];
  const ctrl = (arr: number[]) => partes.push(Buffer.from(arr));
  const linea = (s: string) => partes.push(Buffer.from(s + '\n', 'latin1'));
  const sep = '-'.repeat(cols);

  ctrl([ESC, 0x40]);          // init
  ctrl([ESC, 0x61, 0x01]);    // centrar
  ctrl([ESC, 0x45, 0x01]);    // negrita on
  linea('PRUEBA DE IMPRESION');
  ctrl([ESC, 0x45, 0x00]);    // negrita off
  ctrl([ESC, 0x61, 0x00]);    // izquierda
  linea(sep);
  linea('Impresora: ' + (meta?.nombre || ''));
  if (meta?.sucursal) { linea('Sucursal: ' + meta.sucursal); }
  linea('Conexion: ' + (meta?.conexion || ''));
  linea('Columnas: ' + cols);
  linea('Perfil: ' + (meta?.perfil || ''));
  linea(sep);
  ctrl([LF, LF, LF]);         // feed
  ctrl([GS, 0x56, 0x00]);     // corte total
  return Buffer.concat(partes);
}

function registerPrinterIpcHandlers() {
  // IP LAN de esta maquina (para compartir la impresora local al central por IP).
  ipcMain.handle('get-local-ip', async () => {
    return detectarIpsLocales();
  });

  // Comparte la cola CUPS local en la red y devuelve la URI IPP lista para instalar en el central.
  // arg: { queue, password } (o string queue por retrocompat). El password corre los comandos como root.
  ipcMain.handle('share-local-printer', async (_event: any, arg: any) => {
    const queue = typeof arg === 'string' ? arg : arg?.queue;
    const password = typeof arg === 'string' ? undefined : arg?.password;
    const centralIp = typeof arg === 'string' ? undefined : arg?.centralIp;
    return compartirImpresoraLocal(queue, password, centralIp);
  });

  // Instala la impresora en el CUPS/spooler LOCAL de esta PC (sin pasar por el servidor).
  // arg: { cola, uri, raw, password }. Si CUPS pide permisos devuelve { needsPassword: true }.
  ipcMain.handle('install-local-printer', async (_event: any, arg: any) => {
    const cola = arg?.cola ?? arg?.queue;
    const uri = arg?.uri;
    const raw = arg?.raw !== false; // por defecto raw (térmica ESC/POS)
    const password = arg?.password;
    return instalarImpresoraLocal(cola, uri, raw, password);
  });

  // Imprime un payload ESC/POS (base64) en una impresora LOCAL a esta PC, SIN pasar por ningún
  // backend. Para PCs que solo corren el desktop contra el central en la nube: el backend nube no
  // alcanza una USB/cola CUPS ni una impresora de red de la LAN del cliente, así que imprime acá.
  //   - RED: socket TCP crudo a ip:puerto (raw/JetDirect, típico 9100).
  //   - CUPS/USB/BLUETOOTH: `lp -d <cola> -o raw` (Linux/mac) con el payload por stdin.
  // arg: { conexion, cola, ip, puerto, payloadBase64 } → { success, error? }
  ipcMain.handle('print-local', async (_event: any, arg: any) => imprimirLocalRaw(arg));

  // Imprime el ticket de PRUEBA generado 100% en el frontend (ESC/POS), sin ningún backend.
  // arg: { conexion, cola, ip, puerto, nombre, sucursal, columnas, perfil } → { success, error? }
  ipcMain.handle('print-test-local', async (_event: any, arg: any) => {
    const payload = construirTicketPruebaEscPos(arg);
    return imprimirLocalRaw({ ...arg, payloadBase64: payload.toString('base64') });
  });

  ipcMain.handle('get-system-printers', async () => {
    try {
      console.log('Getting system printers');
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (!mainWindow) {
        console.error('No focused window found');
        return [];
      }

      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log(`Found ${printers.length} system printers`);
      return printers;
    } catch (error) {
      console.error('Error getting system printers:', error);
      return [];
    }
  });

  // Descubre impresoras de RED (Wi-Fi/Ethernet) por mDNS/DNS-SD (Bonjour). Detecta Epson, HP,
  // Brother, Canon, etc. que anuncian _ipp / _ipps / _pdl-datastream (raw 9100) / _printer (LPD).
  // La deteccion la hace el frontend (este proceso Electron), NO el backend, y es independiente de
  // la deteccion por cable/USB (que sigue corriendo por lpinfo en el backend). No instala nada:
  // solo devuelve la lista para que la UI autocomplete conexion RED (ip:9100) o instale una cola
  // CUPS via el backend existente (uri socket://ip:puerto).
  ipcMain.handle('detect-network-printers', async (_event: any, opts: any) => {
    const timeoutMs = Math.min(Math.max(Number(opts && opts.timeoutMs) || 4000, 1000), 15000);
    const connectTimeoutMs = Math.min(Math.max(Number(opts && opts.connectTimeoutMs) || 1000, 150), 4000);
    const escanearRed = !opts || opts.escanearRed !== false; // por defecto barre la subred ademas de mDNS
    try {
      const locales = new Set(detectarIpsLocales().todas.map((t) => t.ip));
      const [mdns, red] = await Promise.all([
        descubrirImpresorasMdns(timeoutMs, locales),
        escanearRed ? escanearImpresorasRed(connectTimeoutMs, locales) : Promise.resolve(new Map<string, EntradaRed>()),
      ]);

      // Fusion por IP: mDNS aporta nombre/modelo; el barrido aporta puertos abiertos reales.
      const fusion = new Map<string, EntradaRed>(mdns);
      red.forEach((e, ip) => {
        const base = fusion.get(ip);
        if (!base) { fusion.set(ip, e); return; }
        e.puertos.forEach((p) => base.puertos.add(p));
        e.protocolos.forEach((p) => base.protocolos.add(p));
        if (!base.nombre && e.nombre) { base.nombre = e.nombre; }
        if (!base.host && e.host) { base.host = e.host; }
      });

      return Array.from(fusion.values()).map((p) => {
        // Puerto para conexion RED directa (raw/ESC-POS). 9100 si esta abierto; si no, el primero.
        const puerto = p.puertos.has(9100) ? 9100 : (Array.from(p.puertos)[0] || 9100);
        // URI para instalar cola CUPS via backend: raw > IPP > LPD segun lo disponible.
        let uri: string;
        if (p.puertos.has(9100)) { uri = `socket://${p.ip}:9100`; }
        else if (p.puertos.has(631)) { uri = `ipp://${p.ip}:631/ipp/print`; }
        else if (p.puertos.has(515)) { uri = `lpd://${p.ip}/queue`; }
        else { uri = `socket://${p.ip}:9100`; }
        return {
          nombre: p.nombre || `Impresora de red ${p.ip}`,
          ip: p.ip,
          host: p.host,
          modelo: p.modelo,
          puerto,
          uri,
          protocolos: Array.from(p.protocolos),
        };
      });
    } catch (error) {
      console.error('Error detecting network printers:', error);
      return [];
    }
  });

  ipcMain.handle('print-with-pos-printer', async (event, args) => {
    try {
      console.log('print-with-pos-printer called with args:', JSON.stringify(args, (key, value) => {
        if (key === 'path' && typeof value === 'string' && value.startsWith('data:image')) {
          return 'data:image... [truncated]';
        }
        return value;
      }));

      const { data, options } = args;
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data for printing - not an array');
        return { success: false, error: 'Invalid data for printing' };
      }

      if (!options || !options.printerName) {
        console.error('Invalid printer options - missing printerName');
        return { success: false, error: 'Invalid printer options' };
      }

      let printData = JSON.parse(JSON.stringify(data));

      for (let i = 0; i < printData.length; i++) {
        const item = printData[i];
        if (item.style === null || item.style === undefined) {
          printData[i].style = {};
        }
        switch (item.type) {
          case 'text':
            if (item.value === null || item.value === undefined) {
              printData[i].value = '';
            }
            break;

          case 'image':
            if (!item.path) {
              console.error('Image missing path, removing from print job');
              printData[i] = {
                type: 'text',
                value: '[Image placeholder]',
                style: { textAlign: 'center' }
              };
            }
            break;

          case 'barCode':
            if (!item.value) {
              console.error('Barcode missing value, replacing with placeholder');
              printData[i].value = '12345678';
            }

            printData[i].height = item.height || 40;
            printData[i].width = item.width || 2;
            printData[i].position = item.position || 'center';
            printData[i].displayValue = item.displayValue !== undefined ? item.displayValue : true;
            break;

          case 'qrCode':
            if (!item.value) {
              console.error('QR code missing value, replacing with placeholder');
              printData[i].value = 'https://example.com';
            }

            printData[i].height = item.height || 150;
            printData[i].width = item.width || 150;
            printData[i].position = item.position || 'center';
            break;
        }
      }

      const imageItems = printData.filter((item: any) =>
        (item.type === 'image' && item.path && item.path.startsWith('data:image')) ||
        (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image'))
      );

      if (imageItems.length > 0) {
        console.log(`Detected ${imageItems.length} image items in print job`);

        const tmpDir = path.join(app.getPath('temp'), 'pos-printer-images');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }

        for (let i = 0; i < printData.length; i++) {
          const item = printData[i];

          if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
            try {
              const timestamp = Date.now();
              const imgPath = path.join(tmpDir, `img-${timestamp}-${i}.png`);

              const base64Data = item.path.split(';base64,').pop();
              if (base64Data) {
                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64') as any);
                printData[i].path = imgPath;
                console.log(`Saved image ${i} to temp file: ${imgPath}`);
              }
            } catch (err) {
              console.error(`Error handling image ${i}:`, err);
            }
          }

          if (item.style && item.style.backgroundImage && item.style.backgroundImage.startsWith('data:image')) {
            try {
              const timestamp = Date.now();
              const imgPath = path.join(tmpDir, `bg-${timestamp}-${i}.png`);

              const base64Data = item.style.backgroundImage.split(';base64,').pop();
              if (base64Data) {
                fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64') as any);
                printData[i].style.backgroundImage = `url(${imgPath})`;
                console.log(`Saved background image ${i} to temp file: ${imgPath}`);
              }
            } catch (err) {
              console.error(`Error handling background image ${i}:`, err);
            }
          }
        }
      }

      try {
        const isLinux = process.platform === 'linux';
        const isNetwork = typeof options.printerName === 'string' && options.printerName.includes('://');
        const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));

        // Revertido: El envío directo de PNG a una cola CUPS RAW causa caracteres chinos.
        // Generaremos el bitmask ESC * en el frontend y lo enviaremos como rawBase64.

        if (isLinux && !isNetwork && !isXprinter) {
          const buildEscPos = async (): Promise<Buffer> => {
            const chunks: Buffer[] = [];
            const push = (b: number[] | Buffer) => chunks.push(Buffer.isBuffer(b as any) ? (b as Buffer) : Buffer.from(b as number[]));
            const textEnc = (s: string) => Buffer.from((s || '').replace(/\n/g, '\r\n'), 'ascii');
            push([0x1B, 0x40]);
            push(textEnc('\n\n')); // Double feed at top to completely prevent tear bar cutoff

            for (const item of (printData as any[])) {
              if (item.type === 'text') {
                const center = item.style && item.style.textAlign === 'center';
                push([0x1B, 0x61, center ? 0x01 : 0x00]);
                let mode = 0x00;
                const size = parseInt((item.style && item.style.fontSize || '12px').toString().replace('px', ''), 10);
                if (item.style && item.style.fontWeight === 'bold') mode |= 0x08;
                
                if (size >= 14 && size < 18) {
                  mode |= 0x10; // Double height only
                } else if (size >= 18) {
                  mode |= 0x10; // Double height
                  mode |= 0x20; // Double width
                }
                
                push([0x1B, 0x21, mode]);
                push(textEnc((item.value || '') + '\n'));
                push([0x1B, 0x21, 0x00]);
                push([0x1B, 0x61, 0x00]);
                } else if (item.type === 'barCode' || item.type === 'barcode') {
                  let value = (item.value || '').toString().trim();
                  if (value.length > 0) {
                    push([0x1B, 0x61, 0x01]);
                    // Handle position
                    let hriPos = 0x02; // BELOW
                    if (item.position === 'OFF') hriPos = 0x00;
                    else if (item.position === 'ABOVE') hriPos = 0x01;
                    push([0x1D, 0x48, hriPos]);

                    // Handle height
                    const height = item.height ? parseInt(item.height) : 60;
                    push([0x1D, 0x68, height]);
                    
                    // Handle width
                    const width = item.width ? parseInt(item.width) : 2;
                    push([0x1D, 0x77, width]);
                  
                    let m = 0x49; // CODE128 (73)
                    let printValue = value;
                    if (item.barcodeType === 'CODE128' || !item.barcodeType) {
                        m = 0x49; // 0x49 = 73 = CODE128
                        printValue = value; // Generic printers assume Charset B
                    } else if (item.barcodeType === 'EAN13') {
                        m = 0x43; // 0x43 = 67 = EAN13
                        printValue = value.replace(/[^0-9]/g, '');
                    }
                  
                    push([0x1D, 0x6B, m, printValue.length]);
                    push(Buffer.from(printValue, 'ascii'));
                    push(textEnc('\n')); // Only one newline
                    push([0x1B, 0x61, 0x00]);
                  }
              } else if (item.type === 'qrCode' || item.type === 'qrcode') {
                const val = (item.value || '').toString();
                push([0x1B, 0x61, 0x01]);
                push([0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x06]);
                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x01]);
                const dataBuf = Buffer.from(val, 'ascii');
                const pL = (dataBuf.length + 3) & 0xFF;
                const pH = ((dataBuf.length + 3) >> 8) & 0xFF;
                push([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
                push(dataBuf);
                push([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
                push(textEnc('\n\n'));
                push([0x1B, 0x61, 0x00]);
              } else if (item.type === 'rawBase64' && item.value) {
                try {
                  const buf = Buffer.from(item.value, 'base64');
                  push(buf);
                } catch (e) {
                  console.error('Error parsing rawBase64:', e);
                }
              } else if (item.type === 'cut') {
                push([0x1D, 0x56, 0x00]);
              }
            }
            push(textEnc('\n'));
            push([0x1D, 0x56, 0x00]);
            return Buffer.concat(chunks as any) as any;
          };

          const rawBuf = await buildEscPos();
          const tmp = path.join(app.getPath('temp'), `escpos-${Date.now()}.bin`);
          fs.writeFileSync(tmp, rawBuf as any);
          const cmd = `lp -d "${options.printerName}" -o raw ${tmp}`;
          console.log('Executing ESC/POS raw:', cmd);

          return await new Promise((resolve) => {
            exec(cmd, (error, stdout, stderr) => {
              try { fs.unlinkSync(tmp); } catch { }
              if (error) {
                console.error('ESC/POS raw error:', error, stderr);
                resolve(null as any);
                return;
              }
              console.log('ESC/POS raw stdout:', stdout);
              resolve({ success: true } as any);
            });
          });
        }
      } catch (e) {
        console.warn('ESC/POS raw path skipped:', e);
      }

      try {
        const isLinux = process.platform === 'linux';
        const isXprinter = typeof options.printerName === 'string' && (options.printerName.toLowerCase().includes('xprinter') || options.printerName.toLowerCase().includes('xp-'));

        if (isLinux && isXprinter) {
          const labelWidth = 320;
          const labelHeight = 320;
          const charWidth: any = { 1: 7, 2: 9, 3: 11, 4: 14 };
          const lineHeight: any = { 1: 12, 2: 14, 3: 18, 4: 26 };

          const centerX = (text: string, fontNum: number) => {
            const w = charWidth[fontNum] || 10;
            const len = (text || '').length;
            return Math.max(0, Math.floor((labelWidth - (w * len)) / 2));
          };

          const wrap = (text: string, fontNum: number, maxDots: number) => {
            const maxChars = 17;
            const words = (text || '').trim().split(/\s+/);
            const out: string[] = [];
            let line = '';

            for (const word of words) {
              if (word.length > maxChars) {
                if (line) {
                  out.push(line);
                  line = '';
                }
                let i = 0;
                while (i < word.length && out.length < 3) {
                  const chunk = word.substring(i, i + maxChars);
                  out.push(chunk);
                  i += maxChars;
                }
              } else {
                const testLine = line ? line + ' ' + word : word;
                if (testLine.length <= maxChars) {
                  line = testLine;
                } else {
                  if (line) {
                    out.push(line);
                    line = '';
                  }
                  if (out.length >= 3) {
                    const lastLine = out[out.length - 1];
                    const testLastLine = lastLine + ' ' + word;
                    if (testLastLine.length <= maxChars) {
                      out[out.length - 1] = testLastLine;
                    }
                  } else {
                    line = word;
                  }
                }
              }
            }

            if (line && out.length < 3) {
              out.push(line);
            } else if (line && out.length === 3) {
              const lastLine = out[out.length - 1];
              const testLastLine = lastLine + ' ' + line;
              if (testLastLine.length <= maxChars) {
                out[out.length - 1] = testLastLine;
              }
            }
            return out.slice(0, 3);
          };

          const texts = (printData as any[]).filter(i => i.type === 'text').map(i => (i.value || '').toString());
          const nameTexts = texts.filter(t => {
            const lower = (t || '').toLowerCase();
            return t &&
              !lower.includes('gs.') &&
              !/^fab[:]?\s*/i.test(t) &&
              !/fabricado/i.test(lower) &&
              !/^\d+\/\d+\/\d+/.test(t.trim());
          });

          const nameLinesPrepared = nameTexts.length > 0 ? nameTexts : [];
          const nameText = nameLinesPrepared.join(' ').trim();

          let priceText = texts.find(t => /(^|\s)Gs\.?/i.test(t)) || '';
          if (!priceText) {
            const candidate = texts.find(t => /\d/.test(t));
            if (candidate) priceText = candidate;
          }

          let dateText = texts.find(t => {
            const trimmed = (t || '').trim();
            return /^fab[:]?\s*/i.test(trimmed) || /^fabricado/i.test(trimmed.toLowerCase());
          }) || '';

          const barcodeItem = (printData as any[]).find(i => i.type === 'barCode' || i.type === 'barcode');
          const qrItem = (printData as any[]).find(i => i.type === 'qrCode' || i.type === 'qrcode');

          let epl = 'SIZE 40 mm,40 mm\nGAP 3 mm,0\nCLS\n';
          let y = 10;
          const maxDotsForName = 280;
          let nameLines: string[] = [];

          if (nameText) {
            nameLines = wrap(nameText, 3, Math.min(labelWidth - 12, maxDotsForName));
          }
          nameLines = nameLines.filter(l => !!l).slice(0, 3);

          for (const line of nameLines) {
            const x = Math.max(0, centerX(line, 3) - 16);
            epl += `TEXT ${x},${y},"3",0,1,1,"${line.replace(/"/g, '\\"')}"\n`;
            y += (lineHeight[3] || 18) + 6;
          }

          y += 6;
          y += 24;

          if (priceText) {
            let x = centerX(priceText, 4) - 32;
            if (x < 0) x = 0;
            epl += `TEXT ${x},${y},"4",0,1,1,"${priceText.replace(/"/g, '\\"')}"\n`;
            y += (lineHeight[4] || 26) + 8;
          }

          y += 24;

          if (dateText) {
            const dateLen = dateText.length;
            const dateWidth = (charWidth[3] || 11) * dateLen;
            let x;
            if (dateWidth <= labelWidth - 10) {
              x = centerX(dateText, 3);
            } else {
              x = 10;
            }
            x = Math.max(0, x - 16);
            epl += `TEXT ${x},${y},"3",0,1,1,"${dateText.replace(/"/g, '\\"')}"\n`;
            y += (lineHeight[3] || 18) + 12;
          }

          if (barcodeItem) {
            const rawBarcodeValue = (barcodeItem.value || '').toString();
            const barcodeType = ((barcodeItem.barcodeType || 'EAN13').toString() || 'EAN13').toUpperCase();
            const hasValue = rawBarcodeValue.trim().length > 0;

            if (hasValue) {
              let commandType = 'EAN13';
              let barcodeVal = rawBarcodeValue;

              if (barcodeType === 'CODE128') {
                commandType = '128';
              } else if (barcodeType === 'EAN13') {
                const digitsOnly = rawBarcodeValue.replace(/[^0-9]/g, '');
                if (digitsOnly.length >= 8) {
                  barcodeVal = digitsOnly;
                  if (barcodeVal.length === 13) {
                    barcodeVal = barcodeVal.substring(0, 12);
                  } else if (barcodeVal.length < 12) {
                    barcodeVal = barcodeVal.padStart(12, '0');
                  }
                } else {
                  barcodeVal = '';
                }
              } else {
                commandType = barcodeType;
              }

              if (barcodeVal) {
                const digitsOnlyForText = rawBarcodeValue.replace(/[^0-9]/g, '');
                const barcodeHeight = 60;
                const barcodeWidth = 200;
                const bx = Math.max(0, Math.floor((labelWidth - barcodeWidth) / 2));
                const by = Math.max(180, y + 16);
                const escapedBarcode = barcodeVal.replace(/"/g, '\\"');
                epl += `BARCODE ${bx},${by},"${commandType}",${barcodeHeight},0,0,2,2,"${escapedBarcode}"\n`;

                if (digitsOnlyForText) {
                  const barcodeTextFont = 2;
                  const textWidthDots = (charWidth[barcodeTextFont] || 9) * digitsOnlyForText.length;
                  const textX = Math.max(0, bx + Math.floor((barcodeWidth - textWidthDots) / 2));
                  const textY = by + barcodeHeight + 8;
                  epl += `TEXT ${textX},${textY},"2",0,1,1,"${digitsOnlyForText}"\n`;
                }
              }
            }
          }

          if (qrItem && (qrItem.value || '').toString()) {
            const qv = (qrItem.value || '').toString();
            const qSize = 90;
            const qx = Math.floor((labelWidth - qSize) / 2);
            const qy = Math.min(labelHeight - (qSize + 20), Math.max(y + 6, 150));
            epl += `QRCODE ${qx},${qy},M,3,A,0,"${qv.replace(/"/g, '\\"')}"\n`;
          }

          epl += 'PRINT 1\n';

          const tempFile = path.join(app.getPath('temp'), `epl-${Date.now()}.txt`);
          fs.writeFileSync(tempFile, epl, 'utf8');
          const cmd = `lp -d "${options.printerName}" -o raw ${tempFile}`;
          console.log('Executing EPL command:', cmd);

          return await new Promise((resolve) => {
            exec(cmd, (error, stdout, stderr) => {
              try { fs.unlinkSync(tempFile); } catch { }
              if (error) {
                console.error('EPL error:', error, stderr);
                resolve({ success: false, error: (error as any)?.message || 'EPL error' });
                return;
              }
              console.log('EPL stdout:', stdout);
              resolve({ success: true });
            });
          });
        }
      } catch (e) {
        console.warn('EPL path skipped:', e);
      }

      console.log(`Printing to "${options.printerName}" with ${printData.length} items`);

      const printOptions = {
        ...options,
        silent: options.silent !== undefined ? options.silent : true,
        preview: options.preview !== undefined ? options.preview : false,
        width: options.width || '58mm',
        margin: options.margin || '0 0 0 0',
        copies: options.copies || 1,
        timeOutPerLine: options.timeOutPerLine || 400
      };

      console.log('Using print options:', JSON.stringify(printOptions));

      try {
        await PosPrinter.print(printData, printOptions);
        console.log('Print completed successfully');

        setTimeout(() => {
          try {
            const tmpDir = path.join(app.getPath('temp'), 'pos-printer-images');
            if (fs.existsSync(tmpDir)) {
              const files = fs.readdirSync(tmpDir);
              for (const file of files) {
                if (file.startsWith('img-') || file.startsWith('bg-')) {
                  fs.unlinkSync(path.join(tmpDir, file));
                }
              }
              console.log(`Cleaned up ${files.length} temporary image files`);
            }
          } catch (error) {
            console.error('Error cleaning up temporary files:', error);
          }
        }, 1000);

        return { success: true };
      } catch (printError) {
        console.error('PosPrinter.print() threw an error:', printError);
        const errObj = printError as any;
        const msg = errObj?.message || (typeof printError === 'string' ? printError : JSON.stringify(printError)) || 'Unknown printing error';
        return {
          success: false,
          error: msg
        };
      }
    } catch (error) {
      console.error('Error in print-with-pos-printer handler:', error);
      const errObj = error as any;
      const msg = errObj?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown printing error';
      return { success: false, error: msg };
    }
  });
}

try {
  app.on('ready', () => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          role: "appMenu",
          label: "Aplicacion",
          submenu: [
            {
              label: "Reiniciar",
              click() {
                relaunchElectron()
              }
            },
            {
              label: "Open Dev Tools",
              click() {
                win.webContents.openDevTools();
              },
            },
            {
              label: "Close Dev Tools",
              click() {
                win.webContents.closeDevTools();
              },
            },
            {
              label: "Minimizar",
              click() {
                win.minimize();
              },
            },
            {
              label: "Zoom in",
              click() {
                const currentZoom = win.webContents.getZoomLevel();
                const newZoom = currentZoom + 0.5;
                win.webContents.setZoomLevel(newZoom);
                saveZoomLevel(newZoom);
                win.webContents.executeJavaScript(`localStorage.setItem("zoomLevel", ${newZoom});`, true);
              },
            },
            {
              label: "Zoom out",
              click() {
                const currentZoom = win.webContents.getZoomLevel();
                const newZoom = currentZoom - 0.5;
                win.webContents.setZoomLevel(newZoom);
                saveZoomLevel(newZoom);
                win.webContents.executeJavaScript(`localStorage.setItem("zoomLevel", ${newZoom});`, true);
              },
            },
            {
              label: "Restablecer Zoom",
              click() {
                const defaultZoom = calculateDefaultZoom();
                win.webContents.setZoomLevel(defaultZoom);
                saveZoomLevel(defaultZoom);
                win.webContents.executeJavaScript(`localStorage.setItem("zoomLevel", ${defaultZoom});`, true);
              },
            },
            {
              label: "Salir",
              click() {
                app.quit();
              },
            },
          ],
        },
        {
          role: 'editMenu',
          label: "Editar",
          submenu: [
            {
              label: 'Cortar',
              accelerator: 'CmdOrCtrl+X',
              role: 'cut',
            },
            {
              label: 'Copiar',
              accelerator: 'CmdOrCtrl+C',
              role: 'copy',
            },
            {
              label: 'Pegar',
              accelerator: 'CmdOrCtrl+V',
              role: 'paste',
            },
            {
              label: 'Deshacer',
              accelerator: 'CmdOrCtrl+Z',
              role: 'undo',
            },
            {
              label: 'Rehacer',
              accelerator: 'Shift+CmdOrCtrl+Z',
              role: 'redo',
            },
            {
              label: 'Seleccionar Todo',
              accelerator: 'CmdOrCtrl+A',
              role: 'selectAll',
            },
          ],
        },
        {
          label: "Actualizacion",
          submenu: [
            {
              label: `Version: ${app.getVersion()}`,
              enabled: false,
            },
            { type: 'separator' },
            {
              label: 'Gestionar actualizaciones...',
              click() {
                if (win) win.webContents.send('open-update-dialog');
              }
            },
          ],
        }
      ])
    );

    log.info(`=== FRC v${app.getVersion()} started ===`);

    createWindow().then(() => {
      registerPrinterIpcHandlers();
    });

    if (!isDev) {
      if (configureUpdateChannel()) {
        autoUpdater.checkForUpdates();
        setInterval(() => {
          if (updateEnabled) {
            log.info('Buscando actualizacion...');
            autoUpdater.checkForUpdates();
          }
        }, 5 * 60 * 1000); // cada 5 minutos
      }
    }

    autoUpdater.on('update-available', (info) => {
      log.info(`Actualizacion disponible: version ${info.version}`);
      if (win) win.webContents.send('update-status', `Version ${info.version} disponible. Descargando...`);
      autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-not-available', () => {
      log.info('No existen actualizaciones disponibles.');
      if (win) win.webContents.send('update-status', 'Ya tiene la ultima version.');
    });

    autoUpdater.on('download-progress', (progress) => {
      log.info(`Descarga en progreso: ${progress.percent.toFixed(1)}% (${(progress.transferred / 1024 / 1024).toFixed(1)}MB / ${(progress.total / 1024 / 1024).toFixed(1)}MB)`);
      if (win) win.webContents.send('update-status', `Descargando: ${progress.percent.toFixed(0)}%`);
    });

    autoUpdater.on('update-downloaded', (event: UpdateDownloadedEvent) => {
      const version = event.version || 'desconocida';
      log.info(`Actualizacion descargada: version ${version}`);
      const dialogOpts: MessageBoxOptions = {
        type: 'info',
        buttons: ['Cerrar y actualizar', 'Mas tarde'],
        title: 'Actualizacion disponible',
        message: `Version ${version}`,
        detail: 'Una actualizacion fue descargada. Al cerrar la aplicacion se instalara automaticamente.',
      };

      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    autoUpdater.on('error', (err) => {
      log.error('Error en auto-update:', err);
      if (win) win.webContents.send('update-status', `Error en actualizacion: ${(err as any)?.message}`);
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

} catch (e) {
  console.error('Error in app initialization:', e);
}

export function relaunchElectron() {
  if (serve) {
    win.webContents.openDevTools();
    require("electron-reload")(__dirname, {
      electron: require(path.join(__dirname, "/../node_modules/electron")),
    });
    win.loadURL("http://localhost:4200");
  } else {
    let pathIndex = "./index.html";

    if (fs.existsSync(path.join(__dirname, "../dist/index.html"))) {
      pathIndex = "../dist/index.html";
    }

    win.loadURL(
      url.format({
        pathname: path.join(__dirname, pathIndex),
        protocol: "file:",
        slashes: true,
      })
    );
  }
}

async function printThermalReceipt(printer: PrinterConfig, content: string): Promise<boolean> {
  try {
    if (!printer) {
      console.error('Printer not found');
      return false;
    }

    console.log(`Using printer: ${printer.name} (${printer.id}) of type ${printer.type}`);

    const isPosPrinterData = content.includes('__POS_PRINTER_DATA__:');
    const isImageLabel = content.includes('data:image/') &&
      (content.includes('base64') || content.startsWith('__IMAGE_PRINT_DATA__:'));

    if (isPosPrinterData) {
      console.log("Detected electron-pos-printer data format. Using advanced printing.")
      return await printWithElectronPosPrinter(printer, content);
    }

    if (isImageLabel) {
      console.log("Detected image data for label. Using specialized image printing.");
      return await printImageWithCUPS(printer, content);
    }

    const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
    console.log(`Print job detected as ${isLabel ? 'LABEL' : 'RECEIPT/TEST'}`);

    if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
      console.log("Detected CUPS printer. Using CUPS printing approach.");
      console.log(`Printer address: ${printer.address}`);
      console.log(`Content length: ${content.length} bytes`);

      if (isLabel && content.length < 10) {
        console.error('Label content too short, might not trigger printing');
        content += '\n\n\n\n\n\n\n\n\n';
      }

      console.log(`Content preview: ${content.replace(/[\x00-\x1F\x7F-\xFF]/g, '?').substring(0, 30)}...`);

      return await printWithCUPS(printer, content);
    }

    console.log(`Using node-thermal-printer with interface type: ${printer.connectionType}`);
    return await printWithNodeThermalPrinter(printer, content);
  } catch (error) {
    console.error('Error during printing:', error);
    return false;
  }
}

async function printImageWithCUPS(printer: PrinterConfig, content: string): Promise<boolean> {
  try {
    console.log('Processing image data for specialized CUPS printing...');

    let imageData = content;
    if (content.includes('__IMAGE_PRINT_DATA__:')) {
      imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();
    }

    if (!imageData || (!imageData.startsWith('data:image') && !content.includes('base64'))) {
      console.error('Invalid image data for CUPS printing');
      return false;
    }

    console.log('Valid image data found, preparing for CUPS printing...');

    let base64Data = imageData;
    if (base64Data.startsWith('data:image')) {
      base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);

    const imageTempFile = path.join(app.getPath('temp'), `label-${Date.now()}.png`);
    fs.writeFileSync(imageTempFile, imageBuffer as any);
    console.log(`Image saved to temp file: ${imageTempFile}`);

    let printerName = printer.name;
    if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
      printerName = printer.address.replace('ticket-', '');
    }

    const printCommand = `lp -d "${printerName}" ${imageTempFile}`;
    console.log(`Executing image print command: ${printCommand}`);

    return new Promise((resolve, reject) => {
      exec(printCommand, (error: any, stdout: string, stderr: string) => {
        try { fs.unlinkSync(imageTempFile); } catch (e) { console.error('Failed to delete temp image file:', e); }

        if (error) {
          console.error(`CUPS image printing error: ${(error as any)?.message}`);
          console.error(`stderr: ${stderr}`);
          reject(error);
          return;
        }

        console.log(`CUPS image printing stdout: ${stdout}`);
        console.log("CUPS image printing done!");
        resolve(true);
      });
    });
  } catch (err) {
    console.error('Error handling image data for CUPS:', err);
    return false;
  }
}

async function printWithCUPS(printer: PrinterConfig, content: string): Promise<boolean> {
  const isImagePrint = content.includes('__IMAGE_PRINT_DATA__:');
  const isLabel = content.includes('Gs.') && content.includes('\x1B\x61\x01');
  const isRotatedLabel = (isLabel || isImagePrint) && (
    content.includes('\x1B\x54\x01') ||
    content.includes('\x1D\x7C\x01') ||
    content.includes('\x1B\x56\x01')
  );

  const tempFile = path.join(app.getPath('temp'), `receipt-${Date.now()}.txt`);

  if (isImagePrint) {
    try {
      console.log('Processing image data for CUPS printing...');

      const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();

      if (!imageData || !imageData.startsWith('data:image')) {
        console.error('Invalid image data for CUPS printing');
        return false;
      }

      console.log('Valid image data found, preparing for CUPS printing...');
      console.log(`Image data length: ${imageData.length} bytes`);

      const imageBuffer = Buffer.from(
        imageData.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );

      console.log(`Image buffer created, size: ${imageBuffer.length} bytes`);

      const imageTempFile = path.join(app.getPath('temp'), `label-${Date.now()}.png`);
      fs.writeFileSync(imageTempFile, imageBuffer as any);
      console.log(`Image saved to temp file: ${imageTempFile}`);

      const orientationOption = isRotatedLabel ? '-o orientation-requested=4' : '';

      const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${orientationOption} ${imageTempFile}`;
      console.log(`Executing image print command: ${printCommand}`);

      return new Promise((resolve, reject) => {
        exec(printCommand, (error: any, stdout: string, stderr: string) => {
          try { fs.unlinkSync(imageTempFile); } catch (e) { console.error('Failed to delete temp image file:', e); }

          if (error) {
            console.error(`CUPS image printing error: ${(error as any)?.message}`);
            console.error(`stderr: ${stderr}`);
            reject(error);
            return;
          }

          console.log(`CUPS image printing stdout: ${stdout}`);
          console.log("CUPS image printing done!");
          resolve(true);
        });
      });
    } catch (err) {
      console.error('Error handling image data for CUPS:', err);
      return false;
    }
  } else if (isLabel) {
    if (!content.includes('\f') && !content.includes('\x0C')) {
      content += '\x0C';
    }

    if (isRotatedLabel) {
      console.log('Detected rotated text for CUPS printing - using enhanced rotation mode');

      fs.writeFileSync(tempFile, content, { encoding: 'binary' });

      const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw -o orientation-requested=4 ${tempFile}`;
      console.log(`Executing rotated label print command: ${printCommand}`);

      return new Promise((resolve, reject) => {
        exec(printCommand, (error: any, stdout: string, stderr: string) => {
          try { fs.unlinkSync(tempFile); } catch (e) { console.error('Failed to delete temp file:', e); }

          if (error) {
            console.error(`CUPS rotated label printing error: ${(error as any)?.message}`);
            console.error(`stderr: ${stderr}`);
            reject(error);
            return;
          }

          console.log(`CUPS rotated label printing stdout: ${stdout}`);
          console.log("CUPS rotated label printing done!");
          resolve(true);
        });
      });
    } else {
      fs.writeFileSync(tempFile, content, { encoding: 'binary' });

      const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" -o raw ${tempFile}`;
      console.log(`Executing label print command: ${printCommand}`);

      return new Promise((resolve, reject) => {
        exec(printCommand, (error: any, stdout: string, stderr: string) => {
          try { fs.unlinkSync(tempFile); } catch (e) { console.error('Failed to delete temp file:', e); }

          if (error) {
            console.error(`CUPS label printing error: ${(error as any)?.message}`);
            console.error(`stderr: ${stderr}`);
            reject(error);
            return;
          }

          console.log(`CUPS label printing stdout: ${stdout}`);
          console.log("CUPS label printing done!");
          resolve(true);
        });
      });
    }
  } else {
    fs.writeFileSync(tempFile, content, 'utf8');

    const printCommand = `lp -d "${printer.address.replace('ticket-', '')}" ${tempFile}`;
    console.log(`Executing standard print command: ${printCommand}`);

    return new Promise((resolve, reject) => {
      exec(printCommand, (error: any, stdout: string, stderr: string) => {
        try { fs.unlinkSync(tempFile); } catch (e) { console.error('Failed to delete temp file:', e); }

        if (error) {
          console.error(`CUPS printing error: ${(error as any)?.message}`);
          console.error(`stderr: ${stderr}`);
          reject(error);
          return;
        }

        console.log(`CUPS printing stdout: ${stdout}`);
        console.log("CUPS printing done!");
        resolve(true);
      });
    });
  }
}

async function printWithNodeThermalPrinter(printer: PrinterConfig, content: string): Promise<boolean> {
  try {
    const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

    let interfaceConfig: string;

    if (printer.connectionType === 'network') {
      interfaceConfig = `tcp://${printer.address}:${printer.port || 9100}`;
    } else if (printer.connectionType === 'usb') {
      interfaceConfig = printer.address;
    } else if (printer.connectionType === 'bluetooth') {
      interfaceConfig = `bt:${printer.address}`;
    } else {
      interfaceConfig = printer.address;
    }

    console.log(`Using printer interface: ${interfaceConfig}`);

    const characterSet = printer.characterSet ? getCharacterSet(printer.characterSet, CharacterSet) : CharacterSet.PC437_USA;

    const thermalPrinter = new ThermalPrinter({
      type: getPrinterType(printer.type, PrinterTypes),
      interface: interfaceConfig,
      options: {
        timeout: 5000
      },
      width: printer.width || 48,
      characterSet: characterSet,
    });

    const isConnected = await thermalPrinter.isPrinterConnected();

    if (!isConnected) {
      console.error('Printer is not connected');
      return false;
    }

    if (content.includes('__IMAGE_PRINT_DATA__:')) {
      console.log('Detected image print request for node-thermal-printer');

      const imageData = content.split('__IMAGE_PRINT_DATA__:')[1].trim();

      if (!imageData || !imageData.startsWith('data:image')) {
        console.error('Invalid image data for node-thermal-printer');
        return false;
      }

      console.log('Valid image data found, preparing for printing...');
      console.log(`Image data length: ${imageData.length} bytes`);

      thermalPrinter.clear();
      thermalPrinter.initialize();
      thermalPrinter.alignCenter();

      const imgBuffer = Buffer.from(
        imageData.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );

      console.log(`Image buffer created, size: ${imgBuffer.length} bytes`);

      console.log('Sending image to printer...');
      thermalPrinter.printImage(imgBuffer);

      thermalPrinter.newLine();
      thermalPrinter.cut();

      console.log('Executing print job...');
      await thermalPrinter.execute();
      console.log("Image print done!");
      return true;
    } else {
      thermalPrinter.alignCenter();
      thermalPrinter.println(content);
      thermalPrinter.cut();

      await thermalPrinter.execute();
      console.log("Print done!");
      return true;
    }
  } catch (error) {
    console.error('Error in printWithNodeThermalPrinter:', error);
    return false;
  }
}

function getPrinterType(type: string, PrinterTypes: any): any {
  switch (type.toLowerCase()) {
    case 'epson':
      return PrinterTypes.EPSON;
    case 'star':
      return PrinterTypes.STAR;
    default:
      return PrinterTypes.EPSON;
  }
}

function getCharacterSet(charset: string, CharacterSet: any): any {
  switch (charset) {
    case 'PC437_USA':
      return CharacterSet.PC437_USA;
    case 'PC850_MULTILINGUAL':
      return CharacterSet.PC850_MULTILINGUAL;
    case 'PC860_PORTUGUESE':
      return CharacterSet.PC860_PORTUGUESE;
    case 'PC863_CANADIAN_FRENCH':
      return CharacterSet.PC863_CANADIAN_FRENCH;
    case 'PC865_NORDIC':
      return CharacterSet.PC865_NORDIC;
    case 'PC851_GREEK':
      return CharacterSet.PC851_GREEK;
    case 'PC857_TURKISH':
      return CharacterSet.PC857_TURKISH;
    case 'PC737_GREEK':
      return CharacterSet.PC737_GREEK;
    case 'ISO8859_7_GREEK':
      return CharacterSet.ISO8859_7_GREEK;
    case 'SLOVENIA':
      return CharacterSet.SLOVENIA;
    case 'PC852_LATIN2':
      return CharacterSet.PC852_LATIN2;
    case 'PC858_EURO':
      return CharacterSet.PC858_EURO;
    case 'WPC1252':
      return CharacterSet.WPC1252;
    case 'PC866_CYRILLIC2':
      return CharacterSet.PC866_CYRILLIC2;
    case 'PC852_LATIN2_2':
      return CharacterSet.PC852_LATIN2;
    default:
      return CharacterSet.PC437_USA;
  }
}

function generateReceiptContent(order: any, orderItems: any[]): string {
  if (order.type === 'product-label' && orderItems.length > 0) {
    return orderItems[0].notes || '';
  }

  if (order.type === 'image-label' && orderItems.length > 0 && orderItems[0].isImage) {
    const imageData = orderItems[0].notes;
    console.log('Image label detected, using specialized image handling');
    return imageData;
  }

  const dateTime = new Date(order.orderTime || new Date()).toLocaleString();

  let content = `
==============================
         YOUR BUSINESS
==============================
Order #: ${order.id || 'N/A'}
Date: ${dateTime}
Customer: ${order.customerName || 'N/A'}
Table: ${order.tableNumber || 'N/A'}
------------------------------
ITEMS
------------------------------
`;

  let subtotal = 0;
  for (const item of orderItems) {
    const product = item.product || {};
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1;
    const lineTotal = price * quantity;
    subtotal += lineTotal;

    content += `${product.name || 'Unknown Item'}
${quantity} x ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${item.notes && !item.notes.includes('__POS_PRINTER_DATA__:') ? `Note: ${item.notes}` : ''}
------------------------------
`;
  }

  const totalAmount = typeof order.totalAmount === 'number' ? order.totalAmount : parseFloat(order.totalAmount) || subtotal;
  content += `
SUBTOTAL: ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TAX: ${(subtotal * 0.08).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
TOTAL: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
==============================
        THANK YOU!
   PLEASE COME AGAIN SOON
==============================
`;

  return content;
}

function generateTestPageContent(printer: PrinterConfig): string {
  return `
==============================
         TEST PAGE
==============================
Printer: ${printer.name}
Type: ${printer.type}
Connection: ${printer.connectionType}
Address: ${printer.address}
${printer.port ? `Port: ${printer.port}` : ''}
------------------------------
This is a test page to verify
that your printer is working
correctly with your application.
==============================
If you can read this message,
your printer is correctly
configured and working!
==============================
        THANK YOU!
==============================
`;
}

async function printWithElectronPosPrinter(printer: PrinterConfig, content: string): Promise<boolean> {
  try {
    let data: any[];
    try {
      if (content.startsWith('__POS_PRINTER_DATA__:')) {
        const jsonContent = content.replace('__POS_PRINTER_DATA__:', '');
        console.log(`Parsing JSON content, length: ${jsonContent.length}`);
        data = JSON.parse(jsonContent);

        const hasImage = data.some((item: any) => item.type === 'image');
        if (hasImage) {
          console.log('Image data detected in print job - WARNING: electron-pos-printer may fail with very long base64 strings');

          data = data.map((item: any) => {
            if (item.type === 'image' && item.path && item.path.startsWith('data:image')) {
              console.log('Converting image item to text to avoid ENAMETOOLONG error');
              return {
                type: 'text',
                value: 'Image label - processed separately',
                style: {
                  fontSize: '12px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }
              };
            }
            return item;
          });
        }
      } else {
        data = [{ type: 'text', value: content }];
      }
    } catch (error) {
      console.error('Error parsing print data:', error);
      data = [{ type: 'text', value: content }];
    }

    let printerName = printer.name;
    if (printer.connectionType === 'usb' && printer.address.includes('ticket-')) {
      printerName = printer.address.replace('ticket-', '');
    } else if (printer.connectionType === 'network') {
      printerName = `${printer.address}:${printer.port || 9100}`;
    } else {
      printerName = printer.address;
    }

    const printerWidth = printer.width || 48;
    const paperWidth = printerWidth <= 48 ? '58mm' : '80mm';

    const options = {
      preview: false,
      width: paperWidth,
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: false,
      printer: printer.type
    } as any;

    console.log(`Printing with electron-pos-printer to "${printerName}" (${printer.type})`);
    console.log('Printer options:', JSON.stringify(options));

    return new Promise((resolve, reject) => {
      PosPrinter.print(data, options)
        .then(() => {
          console.log('Print completed successfully');
          resolve(true);
        })
        .catch((error) => {
          console.error('Error printing with electron-pos-printer:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error in printWithElectronPosPrinter:', error);
    return false;
  }
}// auto-update test
// auto-update channel test
// channel auto-update test 1775060791
