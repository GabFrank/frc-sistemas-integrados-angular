import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, Subject, from } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionDialogComponent } from '../components/configuracion-dialog/configuracion-dialog.component';
import { apiCentralDelHost } from '../../commons/core/utils/webEndpoints';
import { electronBridge } from '../../commons/core/electron/electron-bridge';

export type UpdateChannel = 'stable' | 'beta' | 'alpha' | 'dev';

export interface ConfiguracionSistema {
  serverIp: string;
  serverPort: string;
  serverCentralIp: string;
  serverCentralPort: string;
  printers: {
    ticket: string;
    factura: string;
  };
  local: string;
  precios: string;
  modo: string;
  pdvId: number;
  isConfigured: boolean;
  isLocal: boolean;
  updateChannel: UpdateChannel;
  /**
   * Impresora USB instalada en el SO de ESTA PC (CUPS en Linux, Generic / Text Only en Windows)
   * desde Configuración. Imprime directo desde Electron, sin backend. Independiente de
   * `printers.ticket`, que sigue viajando al backend en el flujo de impresión actual.
   */
  impresoraLocal?: ImpresoraLocalConfig | null;
  /**
   * Por dónde imprime esta PC. BACKEND (por defecto): el flujo de siempre, el servidor imprime en
   * `printers.ticket`. FRONTEND: Electron imprime en `impresoraLocal`. Ver `imprimirPorFrontend()`.
   */
  modoImpresion?: ModoImpresion;
}

export type ModoImpresion = 'BACKEND' | 'FRONTEND';

export type PerfilPapelLocal = 'MM_48' | 'MM_58' | 'MM_72' | 'MM_80';

export interface ImpresoraLocalConfig {
  nombre: string;
  cola: string;
  uri: string;
  /** USB: instalada desde este diálogo. SISTEMA: una cola que ya existía en el SO (sin `uri`). */
  conexion: 'USB' | 'SISTEMA';
  perfil: PerfilPapelLocal;
}

import { environment } from '../../../environments/environment';

const CONFIG_KEY = 'configuracion-sistema';
const CONFIG_BACKUP_KEY = 'configuracion-sistema-backup';
const CONFIG_LEGACY_KEY = 'configuracion';
const BACKUP_CONFIG_FILE = 'assets/config-backup.json';
const BACKUP_FILE_NAME = 'config-backup.json';
const DEFAULT_CONFIG: ConfiguracionSistema = {
  serverIp: environment.serverIp || 'localhost',
  serverPort: (environment.serverPort || '8082').toString(),
  serverCentralIp: environment.serverCentralIp || 'localhost',
  serverCentralPort: (environment.serverCentralPort || '8081').toString(),
  printers: {
    ticket: 'ticket',
    factura: ''
  },
  local: 'Caja 1',
  precios: 'EXPO, EXPO-DEPOSITO',
  modo: 'NOT',
  pdvId: null,
  isConfigured: false,
  isLocal: true,
  updateChannel: null
};

const LEGACY_KEYS = {
  serverIp: 'ip',
  serverPort: 'puerto',
  serverCentralIp: 'centralIp',
  serverCentralPort: 'centralPort',
  'printers.ticket': 'printerTicket',
  'printers.factura': 'printerFactura',
  local: 'local',
  precios: 'precios',
  modo: 'modo',
  pdvId: 'pdvId'
};

@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private config: ConfiguracionSistema = null;

  /**
   * Canal de actualización guardado en config-backup.json (el que usa el updater del main), leído
   * una sola vez al arrancar. Manda sobre el de localStorage: si no, una copia vieja o sin canal
   * en localStorage pisaba el canal real de la PC (#384). null fuera de Electron o si no hay.
   */
  private canalDelMainAlArrancar: UpdateChannel | null = null;

  // Event emitter for configuration changes
  public configChanged = new Subject<ConfiguracionSistema>();

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.canalDelMainAlArrancar = this.leerCanalDelMain();
    // Ensure config is synchronized on service initialization
    this.ensureConfigSynced();
  }

  private leerCanalDelMain(): UpdateChannel | null {
    try {
      const bridge = electronBridge();
      if (!bridge) {
        return null;
      }
      const canal = bridge.sendSync('get-update-channel');
      return ['stable', 'beta', 'alpha', 'dev'].includes(canal) ? canal : null;
    } catch (e) {
      console.warn('No se pudo leer el canal de actualización del main:', e);
      return null;
    }
  }

  /** Devuelve la config con el canal guardado en el main, si hay uno y difiere. */
  private adoptarCanalDelMain(config: ConfiguracionSistema): ConfiguracionSistema {
    const canal = this.canalDelMainAlArrancar;
    if (!config || !canal || config.updateChannel === canal) {
      return config;
    }
    console.log(`Canal de actualización: se adopta el guardado (${canal}) en vez de ${config.updateChannel}`);
    return { ...config, updateChannel: canal };
  }

  /**
   * Ensures all configuration is properly synchronized between 
   * the new consolidated format and legacy localStorage keys
   */
  private ensureConfigSynced(): void {
    // First check if we have consolidated config
    const savedConfig = localStorage.getItem(CONFIG_KEY);

    if (savedConfig) {
      try {
        // We have consolidated config, sync it to legacy keys
        const guardada = JSON.parse(savedConfig);
        const parsedConfig = this.adoptarCanalDelMain(guardada);
        if (parsedConfig !== guardada) {
          this.saveConfigToLocalStorage(parsedConfig);
        }
        this.config = parsedConfig;
        this.syncToLegacyKeys(parsedConfig);
        console.log('Configuration loaded from localStorage');
        // Sync to main process so it can find the config file on next startup
        this.syncConfigToMainProcess(parsedConfig);
      } catch (e) {
        console.error('Error parsing saved configuration', e);
        this.loadConfigFromBackupSources();
      }
    } else {
      // No consolidated config, try to load from backup sources
      this.loadConfigFromBackupSources();
    }
  }

  /**
   * Helper method to load configuration from backup sources in priority order:
   * 1. Backup file
   * 2. Legacy localStorage keys
   * 3. configuracion-local.json
   * 4. Default config
   */
  private loadConfigFromBackupSources(): void {
    console.log('No valid localStorage configuration, checking backup sources...');

    // First check for backup file (highest priority after localStorage)
    this.loadFromBackupFile().subscribe(backupLeido => {
      // El backup puede salir de la clave config_backup de localStorage: también ahí manda el main
      const backupConfig = this.adoptarCanalDelMain(backupLeido);
      if (backupConfig) {
        console.log('Configuration loaded from backup file');
        this.config = backupConfig;
        // Save to localStorage but don't overwrite the backup file
        this.saveConfigToLocalStorage(backupConfig);
      } else {
        // No backup file, try legacy localStorage keys
        if (this.tryMigrateLegacyConfig()) {
          console.log('Successfully migrated from legacy keys');
        } else {
          // No legacy keys, try configuracion-local.json
          console.log('No legacy configuration found, trying configuracion-local.json...');
          this.loadDefaultConfig().subscribe(config => {
            if (config) {
              console.log('Configuration loaded from configuracion-local.json file');
              this.config = config;
              // Save to all storage locations since this is a fresh config
              this.saveConfig(config);
            } else {
              // If all else fails, use default config
              console.log('Using default configuration as fallback');
              this.config = { ...DEFAULT_CONFIG };
              // Save to all storage locations since this is a fresh config
              this.saveConfig(this.config);
            }
          });
        }
      }
    });
  }

  /**
   * Salva la configuración al localStorage y actualiza claves legacy
   * @param config Configuración a guardar
   * @private
   */
  private saveConfigToLocalStorage(config: ConfiguracionSistema): void {
    try {
      const validConfig = this.validateConfigObject(config);
      if (!validConfig) {
        console.error('Invalid configuration object detected, not saving to localStorage');
        return;
      }

      // Save to primary localStorage
      localStorage.setItem(CONFIG_KEY, JSON.stringify(validConfig));

      // Also save to backup key in localStorage for redundancy
      localStorage.setItem(CONFIG_BACKUP_KEY, JSON.stringify(validConfig));

      // Update legacy keys
      this.syncToLegacyKeys(validConfig);

      console.log('Configuration saved to localStorage');
    } catch (e) {
      console.error('Error saving configuration to localStorage:', e);
    }
  }

  /**
   * Load configuration from backup file in the assets folder
   * or from localStorage backup if available
   */
  private loadFromBackupFile(): Observable<ConfiguracionSistema | null> {
    // First, try to load from localStorage backup
    try {
      const localBackup = localStorage.getItem('config_backup');
      if (localBackup) {
        try {
          const config = JSON.parse(localBackup);
          console.log('Found configuration backup in localStorage alternate key');

          // Validate the configuration before using it
          if (config && config.serverIp && config.serverPort) {
            // Found valid config in localStorage backup
            const validatedConfig = this.validateConfigObject(config);
            console.log('Using validated configuration from localStorage backup');
            return of(validatedConfig);
          }
        } catch (e) {
          console.warn('Error parsing localStorage backup:', e);
          // Continue to file backup attempt
        }
      }
    } catch (e) {
      console.warn('Error checking localStorage backup:', e);
    }

    // En Electron, el respaldo en disco lo lee el proceso principal (la pantalla no tiene fs)
    const bridge = electronBridge();
    const desdeDisco$: Observable<ConfiguracionSistema | null> = bridge
      ? from(bridge.invoke<string | null>('leer-config-backup')).pipe(
        map((texto) => {
          if (!texto) {
            return null;
          }
          const config = JSON.parse(texto);
          if (config && config.serverIp && config.serverPort) {
            console.log('Using validated configuration from backup file');
            return this.validateConfigObject(config);
          }
          return null;
        }),
        catchError((e) => {
          console.warn('No se pudo leer el respaldo de configuración en disco:', e);
          return of(null);
        })
      )
      : of(null);

    // Si no hay respaldo en disco (o no es Electron), el archivo de assets como último recurso
    return desdeDisco$.pipe(switchMap((configDisco) => configDisco ? of(configDisco) : this.http.get<ConfiguracionSistema>(BACKUP_CONFIG_FILE).pipe(
      map(config => {
        if (!config) {
          console.warn('Assets backup file contained null or invalid configuration');
          return null;
        }

        // Validate the configuration by checking essential fields
        if (!config.serverIp || !config.serverPort) {
          console.warn('Assets backup file missing essential configuration fields');
          return null;
        }

        // Validate the config with our helper method
        const validatedConfig = this.validateConfigObject(config);
        console.log('Validated backup configuration from assets file:', validatedConfig);
        return validatedConfig;
      }),
      catchError(err => {
        console.warn('No backup configuration file found in assets.', err);
        return of(null);
      })
    )));
  }

  /**
   * Helper to validate a configuration object and fill in missing fields
   */
  private validateConfigObject(config: Partial<ConfiguracionSistema>): ConfiguracionSistema {
    // Ensure all required fields exist with fallback values
    return {
      serverIp: config.serverIp || DEFAULT_CONFIG.serverIp,
      serverPort: config.serverPort || DEFAULT_CONFIG.serverPort,
      serverCentralIp: config.serverCentralIp || config.serverIp || DEFAULT_CONFIG.serverCentralIp,
      serverCentralPort: config.serverCentralPort || config.serverPort || DEFAULT_CONFIG.serverCentralPort,
      local: config.local || DEFAULT_CONFIG.local,
      precios: config.precios || DEFAULT_CONFIG.precios,
      modo: config.modo || DEFAULT_CONFIG.modo,
      pdvId: config.pdvId ?? DEFAULT_CONFIG.pdvId,
      isConfigured: config.isConfigured ?? DEFAULT_CONFIG.isConfigured,
      isLocal: config.isLocal ?? DEFAULT_CONFIG.isLocal,
      // Una config armada desde cero (legacy, configuracion-local.json, DEFAULT) toma el canal del
      // main en vez de quedar vacía; una elección del usuario nunca llega vacía (#384)
      updateChannel: config.updateChannel || this.canalDelMainAlArrancar || DEFAULT_CONFIG.updateChannel,
      impresoraLocal: config.impresoraLocal || null,
      // FRONTEND sin impresora local no tiene dónde imprimir: se cae al flujo de siempre.
      modoImpresion: config.modoImpresion === 'FRONTEND' && config.impresoraLocal ? 'FRONTEND' : 'BACKEND',
      printers: {
        ticket: config.printers?.ticket || DEFAULT_CONFIG.printers.ticket,
        factura: config.printers?.factura || DEFAULT_CONFIG.printers.factura
      }
    };
  }

  /**
   * Saves the configuration to a backup file
   * @param config Configuration to save
   */
  private saveToBackupFile(config: ConfiguracionSistema): Promise<void> {
    try {
      const configData = JSON.stringify(config, null, 2);
      // Copia en localStorage siempre; en Electron además el proceso principal la escribe en
      // userData/config/config-backup.json (la pantalla no tiene acceso a disco).
      localStorage.setItem('config_backup', configData);
      const bridge = electronBridge();
      if (bridge) {
        bridge.send('save-config-backup', configData);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error in saveToBackupFile:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Synchronizes the consolidated config object to legacy localStorage keys
   */
  private syncConfigToMainProcess(config: ConfiguracionSistema): void {
    try {
      const bridge = electronBridge();
      if (bridge) {
        bridge.send('save-config-backup', JSON.stringify(config, null, 2));
        if (config.updateChannel && config.updateChannel !== 'dev') {
          bridge.send('set-update-channel', config.updateChannel);
        }
        console.log('Configuration synced to main process via IPC');
      }
    } catch (e) {
      console.warn('Could not sync config to main process:', e);
    }
  }

  private syncToLegacyKeys(config: ConfiguracionSistema): void {
    if (!config) {
      console.warn('Attempted to sync undefined/null configuration to legacy keys');
      return;
    }

    // Update basic keys
    localStorage.setItem(LEGACY_KEYS.serverIp, config.serverIp || 'localhost');
    localStorage.setItem(LEGACY_KEYS.serverPort, config.serverPort || '8081');
    localStorage.setItem(LEGACY_KEYS.serverCentralIp, config.serverCentralIp || 'localhost');
    localStorage.setItem(LEGACY_KEYS.serverCentralPort, config.serverCentralPort || '8081');
    localStorage.setItem(LEGACY_KEYS.local, config.local || 'Caja 1');
    localStorage.setItem(LEGACY_KEYS.precios, config.precios || 'EXPO, EXPO-DEPOSITO');
    localStorage.setItem(LEGACY_KEYS.modo, config.modo || 'NOT');

    // Handle null/undefined pdvId
    const pdvIdStr = config.pdvId !== null && config.pdvId !== undefined
      ? config.pdvId.toString()
      : '1';
    localStorage.setItem(LEGACY_KEYS.pdvId, pdvIdStr);

    // Update printer keys
    if (config.printers) {
      localStorage.setItem(LEGACY_KEYS['printers.ticket'], config.printers.ticket || 'ticket');
      localStorage.setItem(LEGACY_KEYS['printers.factura'], config.printers.factura || '');
    } else {
      // Default printer values if missing
      localStorage.setItem(LEGACY_KEYS['printers.ticket'], 'ticket');
      localStorage.setItem(LEGACY_KEYS['printers.factura'], '');
    }
  }

  /**
   * Checks if the system has valid configuration
   */
  isConfigured(): Observable<boolean> {
    if (this.config) {
      return of(true);
    }

    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig);
        // Ensure legacy keys are up to date
        this.syncToLegacyKeys(this.config);
        return of(true);
      } catch (e) {
        console.error('Error parsing saved configuration', e);
      }
    }

    // Set up a cascade of checks for different backup sources, preserving the isConfigured flag
    return this.loadFromBackupFile().pipe(
      switchMap(backupConfig => {
        if (backupConfig) {
          this.config = backupConfig;
          // Save to localStorage but don't overwrite the backup file
          this.saveConfigToLocalStorage(backupConfig);
          return of(true);
        } else {
          // Try reading from legacy localStorage keys
          if (this.tryMigrateLegacyConfig()) {
            return of(true);
          } else {
            // If no backup, try loading from default config file
            return this.loadDefaultConfig().pipe(
              map(config => {
                if (config) {
                  this.config = config;
                  this.saveConfig(config);
                  return true;
                }
                return false;
              })
            );
          }
        }
      })
    );
  }

  /**
   * `true` si esta PC tiene que imprimir desde el frontend (Electron → `impresoraLocal`) en vez de
   * mandarle `printerName` al backend. Es el punto único que consulta cada flujo de impresión.
   */
  imprimirPorFrontend(): boolean {
    const config = this.getConfig();
    return config?.modoImpresion === 'FRONTEND' && !!config?.impresoraLocal;
  }

  /**
   * Persiste SOLO la impresora USB local (localStorage + config-backup.json) apenas se instala o
   * se cambia, sin esperar al GUARDAR de Configuración. No emite `configChanged`: los que lo
   * escuchan (graphql-connection, header, etc.) reaccionan a cambios de servidor, no de impresora.
   */
  guardarImpresoraLocal(impresora: ImpresoraLocalConfig | null): void {
    try {
      const validConfig = this.validateConfigObject({ ...(this.getConfig() || DEFAULT_CONFIG), impresoraLocal: impresora });
      this.saveConfigToLocalStorage(validConfig);
      this.saveToBackupFile(validConfig).catch((error) => {
        console.error('Failed to save configuration backup file:', error);
      });
      this.config = validConfig;
      electronBridge()?.send('save-config-backup', JSON.stringify(validConfig, null, 2));
    } catch (e) {
      console.error('Error guardando la impresora local:', e);
    }
  }

  /**
   * Salva la configuración del sistema
   * @param config
   */
  saveConfig(config: ConfiguracionSistema): void {
    try {
      const validConfig = this.validateConfigObject(config);
      if (!validConfig) {
        console.error('Invalid configuration object detected, not saving');
        return;
      }

      // Save to localStorage and legacy keys
      this.saveConfigToLocalStorage(validConfig);

      // Also save to backup file
      this.saveToBackupFile(validConfig).then(() => {
        console.log('Configuration backup file saved successfully');
      }).catch(error => {
        console.error('Failed to save configuration backup file:', error);
      });

      // Update the BehaviorSubject
      this.config = validConfig;
      this.configChanged.next(validConfig);

      // Notify Electron main process of channel change and save config via IPC
      try {
        const bridge = electronBridge();
        if (bridge) {
          bridge.send('save-config-backup', JSON.stringify(validConfig, null, 2));
          bridge.send('set-update-channel', validConfig.updateChannel || 'stable');
        }
      } catch (e) {
        console.warn('Could not notify main process of config/channel change:', e);
      }
    } catch (e) {
      console.error('Error saving configuration:', e);
    }
  }

  /**
   * Try to migrate old configuration format from localStorage
   */
  private tryMigrateLegacyConfig(): boolean {
    try {
      // Check if old configuration keys exist
      const ip = localStorage.getItem(LEGACY_KEYS.serverIp);
      const port = localStorage.getItem(LEGACY_KEYS.serverPort);

      if (ip && port) {
        // Create new config from old keys
        const newConfig: ConfiguracionSistema = {
          serverIp: ip,
          serverPort: port,
          serverCentralIp: localStorage.getItem(LEGACY_KEYS.serverCentralIp) || ip,
          serverCentralPort: localStorage.getItem(LEGACY_KEYS.serverCentralPort) || port,
          printers: {
            ticket: localStorage.getItem(LEGACY_KEYS['printers.ticket']) || 'ticket-mb',
            factura: localStorage.getItem(LEGACY_KEYS['printers.factura']) || 'factura'
          },
          local: localStorage.getItem(LEGACY_KEYS.local) || 'Caja 1',
          precios: localStorage.getItem(LEGACY_KEYS.precios) || 'EXPO, EXPO-DEPOSITO',
          modo: localStorage.getItem(LEGACY_KEYS.modo) || 'NOT',
          pdvId: parseInt(localStorage.getItem(LEGACY_KEYS.pdvId) || '1', 10),
          isConfigured: false,
          isLocal: true,
          updateChannel: DEFAULT_CONFIG.updateChannel
        };

        // Save the migrated config
        this.config = newConfig;
        this.saveConfig(newConfig);
        console.log('Configuración migrada correctamente');

        return true;
      }
    } catch (e) {
      console.error('Error al migrar configuración antigua', e);
    }

    return false;
  }

  /**
   * Loads default configuration from file
   * Falls back to default values if file is not found or cannot be read
   */
  private loadDefaultConfig(): Observable<ConfiguracionSistema | null> {
    return this.http.get<any>('configuracion-local.json').pipe(
      map(response => {
        console.log('Loaded configuration from file:', response);

        if (!response) {
          console.warn('Configuration file loaded but contained null data');
          return { ...DEFAULT_CONFIG };
        }

        // Create a validated configuration object with fallback values
        let validatedConfig: ConfiguracionSistema;

        // Check if the response is in the new format or legacy format
        if (response.serverIp) {
          // New format - but still mark as not configured since it's from a file
          validatedConfig = {
            serverIp: response.serverIp || DEFAULT_CONFIG.serverIp,
            serverPort: response.serverPort || DEFAULT_CONFIG.serverPort,
            serverCentralIp: response.serverCentralIp || response.serverIp || DEFAULT_CONFIG.serverCentralIp,
            serverCentralPort: response.serverCentralPort || response.serverPort || DEFAULT_CONFIG.serverCentralPort,
            local: response.local || DEFAULT_CONFIG.local,
            precios: response.precios || DEFAULT_CONFIG.precios,
            modo: response.modo || DEFAULT_CONFIG.modo,
            pdvId: response.pdvId ?? DEFAULT_CONFIG.pdvId,
            isConfigured: false, // Always mark as not configured since it's from a file
            isLocal: response.isLocal ?? DEFAULT_CONFIG.isLocal,
            updateChannel: response.updateChannel || DEFAULT_CONFIG.updateChannel,
            impresoraLocal: response.impresoraLocal || null,
            modoImpresion: response.modoImpresion === 'FRONTEND' && response.impresoraLocal ? 'FRONTEND' : 'BACKEND',
            printers: {
              ticket: response.printers?.ticket || DEFAULT_CONFIG.printers.ticket,
              factura: response.printers?.factura || DEFAULT_CONFIG.printers.factura
            }
          };
        } else {
          // Legacy format - map to new format with validation
          const serverIp = response.ipDefault || DEFAULT_CONFIG.serverIp;
          const serverPort = response.puertoDefault?.toString() || DEFAULT_CONFIG.serverPort;

          validatedConfig = {
            serverIp: serverIp,
            serverPort: serverPort,
            serverCentralIp: response.centralIp || response.ipCentralDefault || serverIp,
            serverCentralPort: (response.centralPort || response.puertoCentralDefault || serverPort).toString(),
            printers: {
              ticket: response.printers?.ticket || 'ticket-mb',
              factura: response.printers?.factura || 'factura'
            },
            local: response.local || DEFAULT_CONFIG.local,
            precios: response.precios || DEFAULT_CONFIG.precios,
            modo: response.modo || DEFAULT_CONFIG.modo,
            pdvId: response.pdvId ?? DEFAULT_CONFIG.pdvId,
            isConfigured: false,
            isLocal: response.isLocal ?? DEFAULT_CONFIG.isLocal,
            updateChannel: DEFAULT_CONFIG.updateChannel
          };
        }

        console.log('Validated file configuration:', validatedConfig);
        return validatedConfig;
      }),
      catchError(err => {
        console.warn('No se encontró archivo de configuración local. Usando valores por defecto.', err);
        // Return default config if file is not found
        return of({ ...DEFAULT_CONFIG });
      })
    );
  }

  /**
   * Gets current configuration
   */
  getConfig(): ConfiguracionSistema {
    if (!this.config) {
      const savedConfig = localStorage.getItem(CONFIG_KEY);
      if (savedConfig) {
        try {
          this.config = JSON.parse(savedConfig);
        } catch (e) {
          console.error('Error al parsear configuración guardada', e);
          this.config = { ...DEFAULT_CONFIG };
        }
      } else {
        // If no saved config, try to migrate from legacy keys
        if (!this.tryMigrateLegacyConfig()) {
          this.config = { ...DEFAULT_CONFIG };
          // Save the default config
          this.saveConfig(this.config);
        }
      }
    }
    return this.aplicarOverrideWeb(this.config);
  }

  /**
   * Cuando la app se sirve desde una puerta web conocida, el servidor no lo
   * elige el usuario: lo define el hostname. Además se fuerza `isLocal: false`,
   * porque el filial vive en la LAN de cada sucursal y hablando HTTP plano — una
   * página servida por HTTPS no puede alcanzarlo.
   *
   * El override es una capa en memoria y NO se persiste: dentro de Electron
   * `apiCentralDelHost()` devuelve `null` y esto no hace absolutamente nada.
   */
  private aplicarOverrideWeb(config: ConfiguracionSistema): ConfiguracionSistema {
    const apiCentral = apiCentralDelHost();
    if (!config || !apiCentral) return config;

    return {
      ...config,
      serverCentralIp: apiCentral,
      serverCentralPort: '443',
      serverIp: apiCentral,
      serverPort: '443',
      isLocal: false,
      isConfigured: true
    };
  }

  /**
   * Updates part of the configuration
   */
  updateConfig(partialConfig: Partial<ConfiguracionSistema>): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, ...partialConfig };
    this.saveConfig(newConfig);
  }

  /**
   * Shows the configuration dialog
   */
  showConfigDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfiguracionDialogComponent, {
      width: '500px',
      disableClose: true,
      data: this.getConfig()
    });

    return dialogRef.afterClosed().pipe(
      tap(result => {
        if (result) {
          // Get previous configuration to check for server changes
          const previousConfig = this.config;

          // Save new configuration with isConfigured set to true
          this.saveConfig({ ...result, isConfigured: true });

          // Check if server settings were changed
          const serverChanged = previousConfig && (
            previousConfig.serverIp !== result.serverIp ||
            previousConfig.serverPort !== result.serverPort ||
            previousConfig.serverCentralIp !== result.serverCentralIp ||
            previousConfig.serverCentralPort !== result.serverCentralPort
          );

          // do not show restart confirmation dialog, just apply the new configuration
        }
      }),
      map(result => !!result)
    );
  }

  /**
   * Checks if the system has been explicitly configured by the user
   */
  hasUserConfiguration(): boolean {
    return this.getConfig().isConfigured === true;
  }

  /**
   * Creates a manual backup of the configuration
   * Triggers a file download in browser environment, saves to file in Electron
   */
  createConfigBackup(): void {
    const config = this.getConfig();
    const configData = JSON.stringify(config, null, 2);

    // En Electron el diálogo y la escritura los hace el proceso principal
    const bridge = electronBridge();

    if (bridge) {
      bridge.invoke<{ ok: boolean; cancelado?: boolean; error?: string }>('exportar-config-backup', configData)
        .then((resultado) => {
          if (!resultado?.ok && !resultado?.cancelado) {
            console.error('Error exportando la configuración:', resultado?.error);
            this.fallbackDownload(configData);
          }
        })
        .catch((e) => {
          console.error('Error en el respaldo de configuración (Electron):', e);
          this.fallbackDownload(configData);
        });
    } else if ('showSaveFilePicker' in window) {
      // Modern browser with File System Access API
      this.saveWithFileSystemAccessAPI(configData);
    } else {
      // Fallback to download method
      this.fallbackDownload(configData);
    }
  }

  /**
   * Save configuration using the File System Access API
   */
  private async saveWithFileSystemAccessAPI(configData: string): Promise<void> {
    try {
      // @ts-ignore - TypeScript might not recognize this API
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: 'config-backup.json',
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] }
        }]
      });

      // @ts-ignore - TypeScript might not recognize this API
      const writable = await fileHandle.createWritable();
      // @ts-ignore - TypeScript might not recognize this API
      await writable.write(configData);
      // @ts-ignore - TypeScript might not recognize this API
      await writable.close();

      console.log('Configuration backup saved with File System Access API');
    } catch (e) {
      console.error('Error using File System Access API:', e);
      this.fallbackDownload(configData);
    }
  }

  /**
   * Fallback method to download configuration as a file
   */
  private fallbackDownload(configData: string): void {
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-backup.json';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    console.log('Configuration backup downloaded via browser download');
  }
}


