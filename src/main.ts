import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { APP_CONFIG, environment } from './environments/environment';

// Check production mode and enable production mode if needed
if (APP_CONFIG && APP_CONFIG.production) {
  enableProdMode();
}

// Bootstrap the Angular application
platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    preserveWhitespaces: false
  })
  .catch(err => console.error(err));
