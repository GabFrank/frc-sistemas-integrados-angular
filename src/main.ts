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

  // preserve the real console.error
const _consoleError = console.error.bind(console);

console.error = (...args: any[]) => {
  // if it's exactly the WebSocket connection-refused error, swallow it
  if (
    typeof args[0] === 'string' &&
    args[0].includes('WebSocket connection to') &&
    args[0].includes('failed: Error in connection establishment: net::ERR_CONNECTION_REFUSED')
  ) {
    return;
  }
  // otherwise delegate to the real console.error
  _consoleError(...args);
};
