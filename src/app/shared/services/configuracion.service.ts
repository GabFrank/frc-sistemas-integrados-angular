import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, Subject } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionDialogComponent } from '../components/configuracion-dialog/configuracion-dialog.component';

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

  // Event emitter for configuration changes
  public configChanged = new Subject<ConfiguracionSistema>();

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    // Ensure config is synchronized on service initialization
    this.ensureConfigSynced();
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
        const parsedConfig = JSON.parse(savedConfig);
        this.config = parsedConfig;
        this.syncToLegacyKeys(parsedConfig);
        console.log('Configuration loaded from localStorage');
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
    this.loadFromBackupFile().subscribe(backupConfig => {
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

    // Check if we're in Electron environment
    const isElectron = window && typeof window['require'] === 'function';

    if (isElectron) {
      try {
        const fs = window['require']('fs');
        const path = window['require']('path');
        let userDataPath = '';
        let homePath = '';
        let appPath = '';

        try {
          // Try to get Electron's app paths
          const remote = window['require']('@electron/remote');
          if (remote && remote.app) {
            try { userDataPath = remote.app.getPath('userData'); } catch (e) { }
            try { homePath = remote.app.getPath('home'); } catch (e) { }
            try { appPath = remote.app.getPath('appData'); } catch (e) { }
          }
        } catch (e) {
          // Fallback to environment variables
          console.warn('Could not get Electron app paths, falling back to environment variables', e);
          homePath = process.env.HOME || process.env.USERPROFILE || '';
          try { userDataPath = path.join(homePath, '.config', 'frc-sistemas'); } catch (e) { }
        }

        // Try to find the backup file in the same locations we might have saved it
        const possiblePaths = [
          userDataPath ? path.join(userDataPath, 'config', BACKUP_FILE_NAME) : null,
          appPath ? path.join(appPath, 'frc-sistemas', BACKUP_FILE_NAME) : null,
          homePath ? path.join(homePath, '.frc-sistemas', BACKUP_FILE_NAME) : null
        ].filter(Boolean);

        // Try each path until we find the file
        for (const filePath of possiblePaths) {
          try {
            if (fs.existsSync(filePath)) {
              const fileContent = fs.readFileSync(filePath, 'utf8');
              const config = JSON.parse(fileContent);
              console.log('Found configuration backup file at:', filePath);

              // Validate the configuration before using it
              if (config && config.serverIp && config.serverPort) {
                // Found valid config in file
                const validatedConfig = this.validateConfigObject(config);
                console.log('Using validated configuration from backup file');
                return of(validatedConfig);
              }
            }
          } catch (e) {
            console.warn(`Error reading backup file at ${filePath}:`, e);
            // Continue to next path
          }
        }

        // If we got here, we failed to find a valid backup in any of the local paths
        console.warn('No valid configuration found in backup files');
      } catch (e) {
        console.error('Error trying to load backup files in Electron environment:', e);
      }
    }

    // If Electron file loading failed or we're not in Electron, try the asset file as a last resort
    return this.http.get<ConfiguracionSistema>(BACKUP_CONFIG_FILE).pipe(
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
    );
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
      updateChannel: config.updateChannel || DEFAULT_CONFIG.updateChannel,
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
    return new Promise<void>((resolve, reject) => {
      try {
        // Create JSON data
        const configData = JSON.stringify(config, null, 2);

        // Check if running in Electron environment
        const isElectron = window && typeof window['require'] === 'function';

        if (isElectron) {
          try {
            // Electron environment - save to userData folder
            const fs = window['require']('fs');
            const path = window['require']('path');
            let userDataPath = '';
            let homePath = '';
            let appPath = '';

            try {
              // Try to get Electron's app paths
              const remote = window['require']('@electron/remote');
              if (remote && remote.app) {
                try { userDataPath = remote.app.getPath('userData'); } catch (e) { }
                try { homePath = remote.app.getPath('home'); } catch (e) { }
                try { appPath = remote.app.getPath('appData'); } catch (e) { }
              }
            } catch (e) {
              // Fallback to environment variables
              console.warn('Could not get Electron app paths, falling back to environment variables', e);
              homePath = process.env.HOME || process.env.USERPROFILE || '';
              try { userDataPath = path.join(homePath, '.config', 'frc-sistemas'); } catch (e) { }
            }

            // Define backup file path - first try userData (preferred)
            let backupFilePath = '';
            if (userDataPath) {
              try {
                // Ensure the directory exists
                const configDir = path.join(userDataPath, 'config');
                if (!fs.existsSync(configDir)) {
                  fs.mkdirSync(configDir, { recursive: true });
                }
                backupFilePath = path.join(configDir, BACKUP_FILE_NAME);
              } catch (e) {
                console.warn('Failed to create config directory in userData:', e);
              }
            }

            // If userData path didn't work, try appData
            if (!backupFilePath && appPath) {
              try {
                // Ensure the directory exists
                const configDir = path.join(appPath, 'frc-sistemas');
                if (!fs.existsSync(configDir)) {
                  fs.mkdirSync(configDir, { recursive: true });
                }
                backupFilePath = path.join(configDir, BACKUP_FILE_NAME);
              } catch (e) {
                console.warn('Failed to create config directory in appData:', e);
              }
            }

            // Last resort - try home directory
            if (!backupFilePath && homePath) {
              try {
                const configDir = path.join(homePath, '.frc-sistemas');
                if (!fs.existsSync(configDir)) {
                  fs.mkdirSync(configDir, { recursive: true });
                }
                backupFilePath = path.join(configDir, BACKUP_FILE_NAME);
              } catch (e) {
                console.warn('Failed to create config directory in home:', e);
              }
            }

            // If we have a path, write the file
            if (backupFilePath) {
              fs.writeFileSync(backupFilePath, configData, 'utf8');
              console.log('Configuration backup saved to:', backupFilePath);

              // Also save to localStorage backup for additional redundancy
              localStorage.setItem('config_backup', configData);

              resolve();
            } else {
              throw new Error('Could not determine a writable location for backup file');
            }
          } catch (e) {
            console.error('Error saving configuration backup in Electron environment:', e);

            // Fall back to localStorage backup only
            localStorage.setItem('config_backup', configData);
            console.log('Saved configuration backup to localStorage only');

            resolve(); // Still resolve as we at least saved to localStorage
          }
        } else {
          // Browser environment - just save to localStorage backup
          localStorage.setItem('config_backup', configData);
          console.log('In browser environment, saved configuration backup to localStorage only');
          resolve();
        }
      } catch (error) {
        console.error('Error in saveToBackupFile:', error);
        reject(error);
      }
    });
  }

  /**
   * Synchronizes the consolidated config object to legacy localStorage keys
   */
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

      // Notify Electron main process of channel change
      try {
        const isElectron = window && typeof window['require'] === 'function';
        if (isElectron) {
          const { ipcRenderer } = window['require']('electron');
          ipcRenderer.send('set-update-channel', validConfig.updateChannel || 'stable');
        }
      } catch (e) {
        console.warn('Could not notify main process of update channel change:', e);
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
    return this.config;
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

    // Check if running in Electron
    const isElectron = window && typeof window['require'] === 'function';

    if (isElectron) {
      try {
        // Electron environment
        const fs = window['require']('fs');
        const path = window['require']('path');
        let dialog = null;

        // Try to get the dialog module from Electron
        try {
          // First try @electron/remote (preferred in newer Electron)
          const remote = window['require']('@electron/remote');
          if (remote && remote.dialog) {
            dialog = remote.dialog;
          }
        } catch (e) {
          console.warn('Could not load @electron/remote, trying electron.remote', e);
          try {
            // Fall back to older electron.remote
            const electronRemote = window['require']('electron').remote;
            if (electronRemote && electronRemote.dialog) {
              dialog = electronRemote.dialog;
            }
          } catch (e2) {
            console.error('Could not load Electron dialog module', e2);
          }
        }

        if (dialog) {
          // Use dialog to let user select save location
          dialog.showSaveDialog({
            title: 'Guardar Respaldo de Configuración',
            defaultPath: BACKUP_FILE_NAME,
            filters: [{ name: 'Archivos JSON', extensions: ['json'] }]
          }).then(result => {
            if (!result.canceled && result.filePath) {
              try {
                fs.writeFileSync(result.filePath, configData, 'utf8');
                console.log('Configuration backup saved to user-selected location:', result.filePath);
              } catch (writeErr) {
                console.error('Error writing to selected file:', writeErr);
                this.fallbackDownload(configData);
              }
            }
          }).catch(err => {
            console.error('Error showing save dialog:', err);
            this.fallbackDownload(configData);
          });
        } else {
          // If dialog is not available, use fallback paths
          this.saveToFallbackPath(configData, fs, path);
        }
      } catch (e) {
        console.error('Error in Electron backup process:', e);
        this.fallbackDownload(configData);
      }
    } else if ('showSaveFilePicker' in window) {
      // Modern browser with File System Access API
      this.saveWithFileSystemAccessAPI(configData);
    } else {
      // Fallback to download method
      this.fallbackDownload(configData);
    }
  }

  /**
   * Helper method to save configuration to fallback paths when dialog is not available
   */
  private saveToFallbackPath(configData: string, fs: any, path: any): void {
    // Get user-writable paths
    let userDataPath = '';
    let homePath = '';
    let documentsPath = '';

    try {
      // Try to get Electron's app paths
      const remote = window['require']('@electron/remote');
      if (remote && remote.app) {
        try { userDataPath = remote.app.getPath('userData'); } catch (e) { }
        try { homePath = remote.app.getPath('home'); } catch (e) { }
        try { documentsPath = remote.app.getPath('documents'); } catch (e) { }
      }
    } catch (e) {
      // Fallback to environment variables
      homePath = process.env.HOME || process.env.USERPROFILE || '';
      documentsPath = homePath ? path.join(homePath, 'Documents') : '';
    }

    // Priority order of paths to try
    const possiblePaths = [
      documentsPath ? path.join(documentsPath, BACKUP_FILE_NAME) : null,
      userDataPath ? path.join(userDataPath, BACKUP_FILE_NAME) : null,
      homePath ? path.join(homePath, BACKUP_FILE_NAME) : null,
      path.join(process.cwd(), BACKUP_FILE_NAME)
    ].filter(Boolean);

    // Try each path until one works
    for (const filePath of possiblePaths) {
      try {
        fs.writeFileSync(filePath, configData, 'utf8');
        console.log('Configuration backup saved to fallback location:', filePath);
        return; // Success
      } catch (err) {
        console.warn(`Failed to write to ${filePath}:`, err);
      }
    }

    // If all paths fail, use download method
    console.warn('All fallback paths failed, using browser download method');
    this.fallbackDownload(configData);
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


