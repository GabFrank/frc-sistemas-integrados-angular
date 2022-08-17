import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
const { readFileSync } = window.require('fs');
import { isDevMode } from '@angular/core';
import { AppModule } from './app/app.module';
import { APP_CONFIG, environment } from './environments/environment';
const electron = window.require('electron');

if (APP_CONFIG.production) {
  enableProdMode();
}

(async () => {
  var configPath;
  var configLocalPath;
  if (isDevMode) {
    configPath = "./configuracion.json"
    configLocalPath = "./configuracion-local.json"
  } else if (process.platform == 'darwin') {
    configPath = "./configuracion.json"
    configLocalPath = "./configuracion-local.json"
  } else if (process.platform == 'win32') {
    configPath = ".\\configuracion.json"
    configLocalPath = ".\\configuracion-local.json"
  }
  var configFile: Config = JSON.parse(readFileSync(configPath));
  var configLocalFile: ConfigLocal = JSON.parse(readFileSync(configLocalPath));

  if(configLocalPath!=null){
    if(localStorage.getItem('ip')==null){
      environment['serverIp'] = configLocalFile.ipDefault;
      environment['serverPort'] = configLocalFile.puertoDefault;
      localStorage.setItem('ip', configLocalFile.ipDefault)
      localStorage.setItem('port', configLocalFile.puertoDefault+"")
    } else {
      environment['serverIp'] =  localStorage.getItem('ip');
      environment['serverPort'] = +localStorage.getItem('port');
    }
    environment['printers'] = configLocalFile.printers;
    environment['local'] = configLocalFile.local;
    environment['precios'] = configLocalFile.precios;
    environment['modo'] = configLocalFile.modo;
    environment['pdvId'] = configLocalFile.pdvId;
    
  } else {
    alert("Archivo de configuración local en falta")
  }

  if (configFile != null) {
    environment['sucursales'] = configFile.sucursales;
  } 

  platformBrowserDynamic()
    .bootstrapModule(AppModule, {
      preserveWhitespaces: false
    })
    .catch(err => console.error(err));
})();


export interface Config {
  repositoryUrl: string;
  sucursales: {
      id: number
      nombre: string
      ip: string
      port: number
  }
}

export interface ConfigLocal {
  ipDefault: string
  puertoDefault: number
  printers;
  local: string;
  precios: string[]
  modo: string;
  pdvId: number;
}