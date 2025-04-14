# Application Configuration Management

## Current Implementation Analysis

The current configuration management in the application is complex and involves multiple steps, files, and services. Here's an overview:

### Key Files
- `app.module.ts`: Configures Apollo client with server details
- `app.component.ts`: Initializes configuration on app startup
- `configuracion.service.ts`: Manages configuration lifecycle
- `configuracion-full-dialog.component.ts`: UI for user configuration input

### Current Flow
1. On application startup, checks for `config_initialized` flag in localStorage
2. If initialized, loads config from localStorage
3. If not initialized, checks for configuration files on the filesystem
4. If files exist and are valid, loads them into localStorage
5. If files don't exist or are invalid, shows configuration dialog
6. When configuration is saved, updates both localStorage and filesystem
7. Application reloads to apply new configuration

### Current Issues
- Overly complex implementation with redundant code
- Multiple data formats and transformations
- Complex fallback mechanisms
- Unnecessary fields in configuration objects
- Many interdependencies between components
- Difficult to maintain and debug

## Simplified Approach

Here's a cleaner approach that achieves the same functionality with less code:

### Streamlined Configuration Structure

```typescript
// Single interface for all configuration
interface AppConfig {
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
    // Other feature flags
  };
  // Optional additional configuration
  printers?: {
    ticket?: string;
    factura?: string;
  };
  branding?: {
    local?: string;
    precios?: string;
    modo?: string;
  };
  // Application metadata 
  sucursales?: Array<{
    id: number;
    nombre: string;
    ip: string; 
    port: string;
  }>;
  pdvId?: number;
}
```

### Configuration Service

```typescript
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
    private notificationService: NotificationSnackbarService
  ) {}
  
  /**
   * Initialize configuration: load from localStorage or file system,
   * or prompt user via dialog if not available
   */
  public init(): Observable<AppConfig> {
    // Try localStorage first
    const storedConfig = this.loadFromLocalStorage();
    if (storedConfig?.initialized) {
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
          this.setConfig({ ...fileConfig, initialized: true });
          return of(fileConfig);
        } else {
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
      return of(null); // Not in Electron
    }
    
    const fs = window.require('fs');
    const path = this.getConfigFilePath();
    
    // Check if file exists
    if (!fs.existsSync(path)) {
      return of(null);
    }
    
    try {
      const configData = fs.readFileSync(path, 'utf8');
      const config = JSON.parse(configData);
      return of(config);
    } catch (err) {
      console.error('Error reading config file:', err);
      return throwError(err);
    }
  }
  
  /**
   * Get the appropriate file path based on platform
   */
  private getConfigFilePath(): string {
    const basePath = isDevMode() ? '.' : 
      process.platform === 'darwin' ? `${process.env.HOME}/franco-system` :
      process.platform === 'win32' ? `${process.env.USERPROFILE}\\franco-system` :
      `${process.env.HOME}/franco-system`;
    
    const fileName = 'app-config.json';
    
    return process.platform === 'win32' 
      ? `${basePath}\\${fileName}`
      : `${basePath}/${fileName}`;
  }
  
  /**
   * Open configuration dialog for user input
   */
  private openConfigDialog(): Observable<AppConfig> {
    const dialogRef = this.dialog.open(ConfigDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { config: this.DEFAULT_CONFIG }
    });
    
    return dialogRef.afterClosed().pipe(
      filter(result => !!result),
      tap(result => {
        const newConfig = { ...result, initialized: true };
        this.setConfig(newConfig);
        this.saveToFile(newConfig);
        this.notificationService.openSucess('Configuration saved successfully');
        
        // Reload application to apply new config
        setTimeout(() => window.location.reload(), 1500);
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
    window.environment.ip = config.server.ip;               // Instead of serverIp
    window.environment.port = config.server.port;           // Instead of serverPort
    window.environment.centralIp = config.central.ip;       // Instead of serverCentralIp
    window.environment.centralPort = config.central.port;   // Instead of serverCentralPort
    
    // Feature flags
    window.environment.useFinancieroDashBoard = config.features.useFinancieroDashBoard;
    
    // Additional settings (use the same structure as the config object)
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
    if (!window.require) return; // Not in Electron
    
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
      
      // Also save to assets in development mode
      if (isDevMode()) {
        const assetsPath = './src/assets/app-config.json';
        if (!fs.existsSync('./src/assets')) {
          fs.mkdirSync('./src/assets', { recursive: true });
        }
        fs.writeFileSync(assetsPath, JSON.stringify(config, null, 2), 'utf8');
      }
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
}
```

### App Module Configuration

```typescript
@NgModule({
  // ... other module properties
  providers: [
    // Initialize configuration on app start
    {
      provide: APP_INITIALIZER,
      useFactory: (configService: ConfigService) => () => configService.init().toPromise(),
      deps: [ConfigService],
      multi: true
    },
    // Configure Apollo with loaded configuration
    {
      provide: APOLLO_OPTIONS,
      useFactory: (httpLink: HttpLink): ApolloClientOptions<any> {
        // Use new variable names from environment
        const serverIp = window.environment?.ip || 'localhost';
        const serverPort = window.environment?.port || '8082';
        const centralIp = window.environment?.centralIp || 'localhost';
        const centralPort = window.environment?.centralPort || '8081';
        
        // Create URLs with the updated variables 
        const url = `http://${serverIp}:${serverPort}/graphql`;
        const url2 = `http://${centralIp}:${centralPort}/graphql`;
        const wUri = `ws://${serverIp}:${serverPort}/subscriptions`;
        const wUri2 = `ws://${centralIp}:${centralPort}/subscriptions`;
        
        console.log('Apollo: configuring with URLs:', { 
          url, 
          url2, 
          wUri, 
          wUri2,
          environment: {
            ip: serverIp,
            port: serverPort,
            centralIp,
            centralPort
          }
        });
        
        // Rest of Apollo configuration...
      },
      deps: [HttpLink]
    }
  ]
})
export class AppModule { }
```

### ConfigDialogComponent

```typescript
@Component({
  selector: 'app-config-dialog',
  template: `
    <h2 mat-dialog-title>Application Configuration</h2>
    <form [formGroup]="configForm">
      <mat-dialog-content>
        <mat-tab-group>
          <mat-tab label="Server Settings">
            <!-- Server IP and port fields -->
          </mat-tab>
          <mat-tab label="Central Server">
            <!-- Central server settings -->
          </mat-tab>
          <mat-tab label="Advanced">
            <!-- Other settings -->
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-raised-button color="primary" [disabled]="configForm.invalid"
          (click)="saveConfig()">Save Configuration</button>
      </mat-dialog-actions>
    </form>
  `
})
export class ConfigDialogComponent implements OnInit {
  configForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { config: AppConfig }
  ) { }
  
  ngOnInit(): void {
    this.configForm = this.fb.group({
      server: this.fb.group({
        ip: [this.data.config.server?.ip || 'localhost', [Validators.required]],
        port: [this.data.config.server?.port || '8082', [Validators.required]]
      }),
      central: this.fb.group({
        ip: [this.data.config.central?.ip || 'localhost', [Validators.required]],
        port: [this.data.config.central?.port || '8081', [Validators.required]]
      }),
      features: this.fb.group({
        useFinancieroDashBoard: [this.data.config.features?.useFinancieroDashBoard || false]
      }),
      // Additional form groups as needed
    });
  }
  
  saveConfig(): void {
    if (this.configForm.valid) {
      this.dialogRef.close(this.configForm.value);
    }
  }
}
```

## Key Benefits of the Simplified Approach

1. **Unified Configuration Object**: Eliminates the need for multiple interfaces and data structures.

2. **Single Source of Truth**: All configuration comes from one service with a clear API.

3. **Simpler State Management**: Uses RxJS BehaviorSubject to manage state updates.

4. **Cleaner Application Initialization**: Handles initialization through APP_INITIALIZER.

5. **Reduced Code Duplication**: Consolidates file and localStorage operations.

6. **Better Typing**: More comprehensive TypeScript interfaces for configuration.

7. **More Maintainable Structure**: Separates concerns into clear methods.

8. **Enhanced Developer Experience**: Cleaner APIs and more consistent behavior.

## Migration Strategy for Environment Variables

The new configuration approach uses simplified environment variable names:

| Old Name             | New Name      |
|----------------------|---------------|
| `serverIp`           | `ip`          |
| `serverPort`         | `port`        |
| `serverCentralIp`    | `centralIp`   |
| `serverCentralPort`  | `centralPort` |

### Updating Existing Code

For components that use the old environment variable names, you have two options:

1. **Update references directly**: Change all occurrences of old variable names to new ones
   
   ```typescript
   // Old
   const ip = window.environment?.serverIp || 'localhost';
   
   // New
   const ip = window.environment?.ip || 'localhost';
   ```

2. **Use the helper method**: Use the `getEnvironmentValue` method from ConfigService
   
   ```typescript
   // Works with both old and new names during transition
   const ip = this.configService.getEnvironmentValue('serverIp', 'localhost');
   ```

Over time, all references should be updated to use the new naming convention for consistency.

## Implementation Steps

1. Create the new `ConfigService` with simplified configuration management
2. Update `app.module.ts` to use APP_INITIALIZER with the new service
3. Create a simpler `ConfigDialogComponent` with a single form
4. Remove redundant code from `app.component.ts`
5. Update application services to consume configuration from the new service

The result is a more maintainable system with fewer interdependencies and clearer flow for handling configuration in the application. 