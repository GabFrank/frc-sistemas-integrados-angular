// DEPRECATED: This service is being replaced by initial-config.service.ts
// Keep for backward compatibility during transition
// TODO: Remove this file once transition to new configuration system is complete

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, EMPTY, throwError } from 'rxjs';
import { catchError, filter, switchMap, tap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { isDevMode } from '@angular/core';
import { ConfigDialogComponent } from '../components/config-dialog/config-dialog.component';
import { NotificacionSnackbarService } from '../../notificacion-snackbar.service';

/**
 * Interface for the application configuration
 */
export interface AppConfig {
  initialized: boolean;
  server: {
    ip: string;
    port: string;
  };
  central: {
    ip: string;
    port: string;
  };
  features: {
    useFinancieroDashBoard: boolean;
  };
  printers?: {
    ticket?: string;
    factura?: string;
  };
  branding?: {
    local?: string;
    precios?: string;
    modo?: string;
  };
  sucursales?: Array<{
    id: number;
    nombre: string;
    ip: string;
    port: string;
  }>;
  pdvId?: number;
}

/**
 * Centralized service for managing application configuration
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly CONFIG_KEY = 'app_config';
  private readonly DEFAULT_CONFIG: AppConfig = {
    initialized: false,
    server: { ip: 'localhost', port: '8082' },
    central: { ip: 'localhost', port: '8081' },
    features: { useFinancieroDashBoard: false },
    sucursales: [{ id: 0, nombre: 'SERVIDOR', ip: '172.25.1.200', port: '8082' }]
  };

  private configSubject = new BehaviorSubject<AppConfig>(null);
  public config$ = this.configSubject.asObservable();
  private isInitialized = false;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private notificationService: NotificacionSnackbarService
  ) {
    console.log('ConfigService created');
  }

  /**
   * Initialize configuration: load from localStorage or file system,
   * or prompt user via dialog if not available
   */
  public init(): Observable<AppConfig> {
    console.log('Initializing configuration...');
    
    // Try localStorage first (fastest)
    const storedConfig = this.loadFromLocalStorage();
    if (storedConfig?.initialized) {
      console.log('Configuration loaded from localStorage');
      this.setConfig(storedConfig);
      return of(storedConfig);
    }
    
    // Try loading from file
    return this.loadFromFile().pipe(
      catchError(err => {
        console.error('Error loading config file:', err);
        return EMPTY;
      }),
      // If file loading fails, open dialog
      switchMap(fileConfig => {
        if (fileConfig) {
          console.log('Configuration loaded from file');
          this.setConfig({ ...fileConfig, initialized: true });
          return of(fileConfig);
        } else {
          console.log('No configuration found, opening dialog');
          return this.openConfigDialog();
        }
      })
    );
  }

  /**
   * Load configuration from localStorage
   */
  private loadFromLocalStorage(): AppConfig | null {
    try {
      const config = localStorage.getItem(this.CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch (err) {
      console.error('Error loading config from localStorage:', err);
      return null;
    }
  }

  /**
   * Load configuration from file system (Electron environment)
   */
  private loadFromFile(): Observable<AppConfig | null> {
    if (!window.require) {
      console.log('Not in Electron environment, skipping file load');
      return of(null); // Not in Electron
    }
    
    try {
      const fs = window.require('fs');
      const path = this.getConfigFilePath();
      
      // Check if file exists
      if (!fs.existsSync(path)) {
        console.log(`Config file not found at ${path}`);
        
        // Try fallback to asset paths for backward compatibility
        const assetsPaths = [
          './assets/configuracion-local.json',
          './src/assets/configuracion-local.json'
        ];
        
        for (const assetPath of assetsPaths) {
          if (fs.existsSync(assetPath)) {
            console.log(`Found legacy config at ${assetPath}, will migrate`);
            // Here we would load and convert legacy format to new format
            const legacyData = JSON.parse(fs.readFileSync(assetPath, 'utf8'));
            return of(this.convertLegacyConfig(legacyData));
          }
        }
        
        return of(null);
      }
      
      const configData = fs.readFileSync(path, 'utf8');
      const config = JSON.parse(configData);
      return of(config);
    } catch (err) {
      console.error('Error reading config file:', err);
      return throwError(err);
    }
  }

  /**
   * Convert legacy configuration format to the new AppConfig format
   */
  private convertLegacyConfig(legacyData: any): AppConfig {
    try {
      // Basic conversion from old format to new
      return {
        initialized: false,
        server: {
          ip: legacyData.ip || 'localhost',
          port: legacyData.port || '8082'
        },
        central: {
          ip: legacyData.centralIp || 'localhost',
          port: legacyData.centralPort || '8081'
        },
        features: {
          useFinancieroDashBoard: false
        },
        printers: legacyData.printers || { ticket: 'ticket' },
        branding: {
          local: legacyData.local || 'CAJA 1',
          precios: legacyData.precios || 'EXPO, EXPO-DEPOSITO',
          modo: legacyData.modo || 'NOT'
        },
        pdvId: legacyData.pdvId || 1
      };
    } catch (err) {
      console.error('Error converting legacy config:', err);
      return this.DEFAULT_CONFIG;
    }
  }

  /**
   * Get the appropriate file path based on platform
   */
  private getConfigFilePath(): string {
    const basePath = isDevMode() ? './src/assets' : './assets';
    const fileName = 'app-config.json';
    
    return process.platform === 'win32' 
      ? `${basePath}\\${fileName}`
      : `${basePath}/${fileName}`;
  }

  /**
   * Open configuration dialog for user input
   */
  private openConfigDialog(): Observable<AppConfig> {
    console.log('Opening configuration dialog');
    const dialogRef = this.dialog.open(ConfigDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { config: this.DEFAULT_CONFIG }
    });
    
    return dialogRef.afterClosed().pipe(
      filter(result => !!result),
      tap(result => {
        console.log('Dialog closed with result:', result);
        const newConfig = { ...result, initialized: true };
        this.setConfig(newConfig);
        this.saveToFile(newConfig);
        this.notificationService.openSucess('CONFIGURACIÓN GUARDADA CORRECTAMENTE');
        
        // Reload application to apply new config
        setTimeout(() => {
          console.log('Reloading application to apply new configuration');
          window.location.reload();
        }, 1500);
      })
    );
  }

  /**
   * Set configuration in memory and localStorage
   */
  private setConfig(config: AppConfig): void {
    if (!config) return;
    
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    this.configSubject.next(config);
    this.isInitialized = true;
    
    // Update environment variables with new naming convention
    if (!window.environment) window.environment = {};
    
    // Server configuration (renamed for clarity)
    window.environment.ip = config.server.ip;               
    window.environment.port = config.server.port;          
    window.environment.centralIp = config.central.ip;      
    window.environment.centralPort = config.central.port;  
    
    // Feature flags
    window.environment.useFinancieroDashBoard = config.features.useFinancieroDashBoard;
    
    // Additional settings
    if (config.sucursales) window.environment.sucursales = config.sucursales;
    if (config.printers) window.environment.printers = config.printers;
    if (config.branding) {
      window.environment.local = config.branding.local;
      window.environment.precios = config.branding.precios;
      window.environment.modo = config.branding.modo;
    }
    if (config.pdvId) window.environment.pdvId = config.pdvId;
    
    console.log('Environment updated with new configuration:', window.environment);
  }

  /**
   * Get an environment variable by name, supporting both old and new naming conventions
   * @param name The variable name to retrieve
   * @param defaultValue Default value to return if not found
   */
  public getEnvironmentValue(name: string, defaultValue: any = null): any {
    if (!window.environment) return defaultValue;
    
    // Map of old variable names to new variable names
    const nameMap = {
      'serverIp': 'ip',
      'serverPort': 'port',
      'serverCentralIp': 'centralIp',
      'serverCentralPort': 'centralPort'
    };
    
    // Check for new name first, then old name, then default
    const newName = nameMap[name] || name;
    return window.environment[newName] !== undefined ? 
          window.environment[newName] : 
          window.environment[name] !== undefined ?
          window.environment[name] : 
          defaultValue;
  }

  /**
   * Save configuration to file system (Electron environment)
   */
  private saveToFile(config: AppConfig): void {
    if (!window.require) {
      console.log('Not in Electron environment, skipping file save');
      return; // Not in Electron
    }
    
    try {
      const fs = window.require('fs');
      const path = this.getConfigFilePath();
      const dir = path.substring(0, path.lastIndexOf(process.platform === 'win32' ? '\\' : '/'));
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write config file
      fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf8');
      console.log(`Configuration saved to ${path}`);
    } catch (err) {
      console.error('Error saving config to file:', err);
    }
  }

  /**
   * Update configuration with new values
   */
  public updateConfig(config: Partial<AppConfig>, reload: boolean = false): void {
    const currentConfig = this.configSubject.getValue();
    const newConfig = { ...currentConfig, ...config };
    
    this.setConfig(newConfig);
    this.saveToFile(newConfig);
    
    if (reload) {
      this.notificationService.openInfo('Reloading application to apply new configuration...');
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  /**
   * Open configuration dialog with current config for editing
   */
  public openConfigurationDialog(): void {
    const currentConfig = this.configSubject.getValue() || this.DEFAULT_CONFIG;
    const dialogRef = this.dialog.open(ConfigDialogComponent, {
      width: '600px',
      data: { config: currentConfig }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateConfig(result, true);
      }
    });
  }
} 