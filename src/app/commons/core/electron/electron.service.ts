import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { environment } from '../../../../environments/environment';
import { Observable, from } from 'rxjs';

const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;

// Define thermal printer interfaces
export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor(
  ) {
    if (this.isElectron) {

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

  relaunch() {
    ipcRenderer.send('reiniciar')
  }

  print(data) {
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

    ipcRenderer.send('print', data, options)
  }

  getAppVersion() {
    return ipcRenderer.sendSync('get-app-version');
  }

  /**
   * Thermal Printer Functions
   */

  /**
   * Get all available printers using the webContents.getPrinters() method
   */
  getPrinters(): Observable<PrinterInfo[]> {
    return from(ipcRenderer.invoke('get-system-printers')) as Observable<PrinterInfo[]>;
  }

  /**
   * Print using electron-pos-printer
   * @param data Array of content elements to print
   * @param options Printing options including printer name
   */
  printWithPosPrinter(data: any[], options: any): Observable<PrintResult> {
    return from(ipcRenderer.invoke('print-with-pos-printer', { data, options })) as Observable<PrintResult>;
  }
}
