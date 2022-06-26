import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
const { readFileSync } = window.require('fs');
import { app } from "electron";

import { AppModule } from './app/app.module';
import { ConfigFile } from './environments/conectionConfig';
import { APP_CONFIG, environment } from './environments/environment';

if (APP_CONFIG.production) {
  enableProdMode();
}

(async () => {
  var configPath;
  if (process.platform == 'darwin') {
    configPath = "/FRC/configuracion.json"
  }
  if (process.platform == 'win32') {
    configPath = "C:\\FRC\\configuracion.json"
  }
  var configFile = JSON.parse(readFileSync(configPath));

  if (configFile != null) {
    environment['serverIp'] = configFile.serverUrl;
    environment['serverPort'] = configFile.serverPort
  } else {
    environment['serverIp'] = 'localhost';
    environment['serverPort'] = 8082
  }
  platformBrowserDynamic()
    .bootstrapModule(AppModule, {
      preserveWhitespaces: false
    })
    .catch(err => console.error(err));
})();


