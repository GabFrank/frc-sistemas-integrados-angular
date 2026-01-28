import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';
const QRCode = require('qrcode');

@Injectable({ providedIn: 'root' })
export class BarcodeQrGeneratorService {
  generateBarcode(data: string, format: string = 'CODE128', options?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, data, {
          format,
          displayValue: true,
          margin: 4,
          textAlign: 'center',
          ...options
        });
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    });
  }

  generateQR(data: string, options?: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const defaultOptions = {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          ...options
        };
        QRCode.toDataURL(data, defaultOptions)
          .then((dataUrl: string) => resolve(dataUrl))
          .catch((err: any) => reject(err));
      } catch (e) {
        reject(e);
      }
    });
  }
}