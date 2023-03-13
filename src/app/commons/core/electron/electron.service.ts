import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { IpcRenderer, ipcRenderer, webFrame } from 'electron';
import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { ConfigFile } from '../../../../environments/conectionConfig';
import { Observable } from 'rxjs';
import { ElectronServiceRef } from 'ngx-electron';
import { ElectronService as ElService }  from 'ngx-electron';
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  app: any;
  public renderer: IpcRenderer;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor(
    private electronServiceInstance: ElService
  ) {
    this.renderer = this.electronServiceInstance.ipcRenderer;
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');

      // If you want to use a NodeJS 3rd party deps in Renderer process (like @electron/remote),
      // it must be declared in dependencies of both package.json (in root and app folders)
      // If you want to use remote object in renderer process, please set enableRemoteModule to true in main.ts
      this.remote = window.require('@electron/remote');
    }
  }

  // getConfigFile(): Promise<ConfigFile>{
  //   return new Promise((resolve) => {
  //     this.ipcRenderer.send('get-config-file')
  //     this.ipcRenderer.on('send-config-file', (event, args) => {
  //       return resolve(args)        
  //     })
  //   })
  // }

  relaunch(){
    this.ipcRenderer.send('reiniciar')
  }

  print(data){
    const options = {
      preview: false,
      margin: '0 0 0 0',    
      copies: 1,
      printerName: environment['printers']['ticket'],
      timeOutPerLine: 400,
      pageSize: '58mm', // page size,
      silent: true,
      dpi: {
        horizontal: 300,
        vertical: 300
      }
   }

   this.ipcRenderer.send('print', data, options)

  }
}
