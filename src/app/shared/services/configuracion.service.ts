import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError, Subject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionDialogComponent } from '../components/configuracion-dialog/configuracion-dialog.component';

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
}

const CONFIG_KEY = 'sistema_configuracion';
const DEFAULT_CONFIG: ConfiguracionSistema = {
  serverIp: 'localhost',
  serverPort: '8081',
  serverCentralIp: 'localhost',
  serverCentralPort: '8081',
  printers: {
    ticket: 'ticket-mb',
    factura: 'factura'
  },
  local: 'Caja 1',
  precios: 'EXPO, EXPO-DEPOSITO',
  modo: 'NOT',
  pdvId: 2
};

// Legacy localStorage keys for backward compatibility
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
        
        // If there's an error, try to migrate from legacy keys
        if (this.tryMigrateLegacyConfig()) {
          console.log('Successfully migrated from legacy keys after parsing error');
        } else {
          // If migration failed, use default config
          this.config = { ...DEFAULT_CONFIG };
          this.saveConfig(this.config);
          console.log('Using default configuration after parsing error');
        }
      }
    } else {
      // No consolidated config, try to migrate from legacy keys
      if (!this.tryMigrateLegacyConfig()) {
        console.log('No legacy configuration found, loading from file...');
        // If migration failed, try to load from file
        this.loadDefaultConfig().subscribe(config => {
          if (config) {
            console.log('Configuration loaded from file successfully');
            this.config = config;
            this.saveConfig(config);
          } else {
            // If all else fails, use default config
            console.log('Using default configuration as fallback');
            this.config = { ...DEFAULT_CONFIG };
            this.saveConfig(this.config);
          }
        });
      } else {
        console.log('Successfully migrated from legacy keys');
      }
    }
  }

  /**
   * Synchronizes the consolidated config object to legacy localStorage keys
   */
  private syncToLegacyKeys(config: ConfiguracionSistema): void {
    // Update basic keys
    localStorage.setItem(LEGACY_KEYS.serverIp, config.serverIp);
    localStorage.setItem(LEGACY_KEYS.serverPort, config.serverPort);
    localStorage.setItem(LEGACY_KEYS.serverCentralIp, config.serverCentralIp);
    localStorage.setItem(LEGACY_KEYS.serverCentralPort, config.serverCentralPort);
    localStorage.setItem(LEGACY_KEYS.local, config.local);
    localStorage.setItem(LEGACY_KEYS.precios, config.precios);
    localStorage.setItem(LEGACY_KEYS.modo, config.modo);
    localStorage.setItem(LEGACY_KEYS.pdvId, config.pdvId.toString());
    
    // Update printer keys
    if (config.printers) {
      localStorage.setItem(LEGACY_KEYS['printers.ticket'], config.printers.ticket);
      localStorage.setItem(LEGACY_KEYS['printers.factura'], config.printers.factura);
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
        console.error('Error al parsear configuración guardada', e);
      }
    }
    
    // Try reading from legacy localStorage keys
    if (this.tryMigrateLegacyConfig()) {
      return of(true);
    }
    
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
          pdvId: parseInt(localStorage.getItem(LEGACY_KEYS.pdvId) || '1', 10)
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
        // Check if the response is in the new format or legacy format
        if (response.serverIp) {
          // New format
          return response as ConfiguracionSistema;
        } else {
          // Legacy format - map to new format
          return {
            serverIp: response.ipDefault,
            serverPort: response.puertoDefault?.toString() || '8081',
            serverCentralIp: response.centralIp || response.ipCentralDefault || 'localhost',
            serverCentralPort: (response.centralPort || response.puertoCentralDefault || 8081).toString(),
            printers: response.printers || {
              ticket: 'ticket-mb',
              factura: 'factura'
            },
            local: response.local || 'Caja 1',
            precios: response.precios || 'EXPO, EXPO-DEPOSITO',
            modo: response.modo || 'NOT',
            pdvId: response.pdvId || 1
          };
        }
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
   * Saves configuration to localStorage and updates legacy keys for compatibility
   */
  saveConfig(config: ConfiguracionSistema): void {
    const previousConfig = this.config;
    this.config = config;
    
    // Save to consolidated storage format
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    
    // Update legacy keys for compatibility
    this.syncToLegacyKeys(config);
    
    // Log changes for debugging
    const serverChanged = previousConfig && (
      previousConfig.serverIp !== config.serverIp || 
      previousConfig.serverPort !== config.serverPort ||
      previousConfig.serverCentralIp !== config.serverCentralIp ||
      previousConfig.serverCentralPort !== config.serverCentralPort
    );
    
    if (serverChanged) {
      console.log('Server configuration changed. Connection will be updated.');
    }
    
    // Emit the configuration change event
    this.configChanged.next(config);
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
          this.saveConfig(result);
        }
      }),
      map(result => !!result)
    );
  }
}
