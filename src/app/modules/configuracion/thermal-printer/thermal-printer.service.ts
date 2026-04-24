import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of, catchError, map } from 'rxjs';
import { ElectronService, PrinterInfo, PrintResult } from '../../../commons/core/electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class ThermalPrinterService {

  constructor(
    public electronService: ElectronService,
    private snackBar: MatSnackBar
  ) { }

  /**
   * Get all available system printers directly from the electron API
   */
  getPrinters(): Observable<PrinterInfo[]> {
    console.log('[ThermalPrinterService] Getting printers from system');
    return this.electronService.getPrinters().pipe(
      map(printers => {
        console.log('[ThermalPrinterService] Found', printers.length, 'printers');
        return printers;
      }),
      catchError(err => {
        console.error('[ThermalPrinterService] Error getting printers:', err);
        this.snackBar.open('Error al obtener impresoras: ' + err.message, 'Cerrar', { duration: 5000 });
        return of([]);
      })
    );
  }

  /**
   * Print a price label
   * @param printerName Printer name to use
   * @param product Product to print label for
   * @param showSnackbar Whether to show a snackbar with the result
   */
  printPriceLabel(printerName: string, product: any, showSnackbar: boolean = true): Observable<PrintResult> {
    console.log('[ThermalPrinterService] Printing price label for', product.descripcion);
    
    // Make sure we have a product name and price
    const productName = product.descripcion || 'Producto';
    const truncatedName = productName.length > 30 ? productName.substring(0, 27) + '...' : productName;
    
    // Ensure price is a number
    const price = typeof product.precioPrincipal === 'number' 
      ? product.precioPrincipal 
      : parseFloat(product.precioPrincipal) || 0;
    
    // Format price with proper locale settings
    const formattedPrice = price.toLocaleString('es-PY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    // Create data structure for pos-printer
    const data = [
      // Product name
      {
        type: 'text',
        value: truncatedName,
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '10px'
        }
      },
      // Price
      {
        type: 'text',
        value: `Gs. ${formattedPrice}`,
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '24px'
        }
      },
      // Add space after price
      { type: 'text', value: ' ' },
      // Cut the paper
      { type: 'cut', position: 'full' }
    ];

    // Print options
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: true
    };

    // Send to printer
    return this.electronService.printWithPosPrinter(data, options).pipe(
      map(result => {
        if (showSnackbar) {
          if (result.success) {
            this.snackBar.open('Etiqueta impresa exitosamente', 'Cerrar', { duration: 3000 });
          } else {
            this.snackBar.open(`Error al imprimir etiqueta: ${result.error || 'Error desconocido'}`, 'Cerrar', { duration: 5000 });
          }
        }
        return result;
      }),
      catchError(err => {
        console.error('[ThermalPrinterService] Error printing price label:', err);
        if (showSnackbar) {
          this.snackBar.open('Error al imprimir etiqueta: ' + err.message, 'Cerrar', { duration: 5000 });
        }
        return of({ success: false, error: err.message });
      })
    );
  }

  /**
   * Print a barcode label
   * @param printerName Printer name to use
   * @param barcodeData The barcode data to print
   * @param barcodeType The type of barcode (default: 'EAN13')
   * @param showHumanReadable Show human-readable text below barcode
   * @param showSnackbar Whether to show a snackbar with the result
   */
  printBarcodeLabel(
    printerName: string, 
    barcodeData: string,
    barcodeType: string = 'EAN13',
    showHumanReadable: boolean = true,
    showSnackbar: boolean = true
  ): Observable<PrintResult> {
    console.log('[ThermalPrinterService] Printing barcode:', barcodeData);
    
    // Validate barcode data
    if (!barcodeData || typeof barcodeData !== 'string' || barcodeData.trim() === '') {
      console.error('[ThermalPrinterService] Invalid barcode data, using placeholder');
      barcodeData = '123456789012';
    }
    
    // Ensure barcode type is valid
    if (!barcodeType || typeof barcodeType !== 'string') {
      console.error('[ThermalPrinterService] Invalid barcode type, using EAN13');
      barcodeType = 'EAN13';
    }
    
    // Create data for electron-pos-printer
    const data = [
      // Title
      {
        type: 'text',
        value: 'Código de Barras',
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '14px'
        }
      },
      // Spacing
      { type: 'text', value: ' ' },
      // Barcode
      {
        type: 'barCode',
        value: barcodeData,
        height: 40,
        width: 2,
        displayValue: showHumanReadable,
        fontsize: 12,
        position: 'center'
      },
      // Spacing
      { type: 'text', value: ' ' },
      // Cut
      { type: 'cut', position: 'full' }
    ];
    
    // Print options
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: true
    };
    
    // Log the data we're sending
    console.log('[ThermalPrinterService] Barcode print data:', JSON.stringify(data));
    console.log('[ThermalPrinterService] Print options:', JSON.stringify(options));
    
    // Send to printer
    return this.electronService.printWithPosPrinter(data, options).pipe(
      map(result => {
        console.log('[ThermalPrinterService] Barcode print result:', result);
        
        if (showSnackbar) {
          if (result.success) {
            this.snackBar.open('Código de barras impreso exitosamente', 'Cerrar', { duration: 3000 });
          } else {
            this.snackBar.open(`Error al imprimir código de barras: ${result.error || 'Error desconocido'}`, 'Cerrar', { duration: 5000 });
          }
        }
        return result;
      }),
      catchError(err => {
        console.error('[ThermalPrinterService] Error printing barcode:', err);
        if (showSnackbar) {
          this.snackBar.open('Error al imprimir código de barras: ' + err.message, 'Cerrar', { duration: 5000 });
        }
        return of({ success: false, error: err.message });
      })
    );
  }
  
  /**
   * Print a QR code label
   * @param printerName Printer name to use
   * @param qrData The QR code data to print
   * @param title Optional title to show above QR code
   * @param showSnackbar Whether to show a snackbar with the result
   */
  printQRCodeLabel(
    printerName: string, 
    qrData: string,
    title?: string,
    showSnackbar: boolean = true
  ): Observable<PrintResult> {
    console.log('[ThermalPrinterService] Printing QR code with data:', qrData);
    
    // Validate QR data
    if (!qrData || typeof qrData !== 'string' || qrData.trim() === '') {
      console.error('[ThermalPrinterService] Invalid QR data, using placeholder');
      qrData = 'https://example.com';
    }
    
    // Create data for electron-pos-printer
    const data = [];
    
    // Add title if provided
    if (title && typeof title === 'string' && title.trim() !== '') {
      data.push({
        type: 'text',
        value: title,
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '14px'
        }
      });
      // Add spacing
      data.push({ type: 'text', value: ' ' });
    }
    
    // Add QR code
    data.push({
      type: 'qrCode',
      value: qrData,
      height: 150,
      width: 150,
      position: 'center',
      style: { margin: '10px 0' }
    });
    
    // Add spacing
    data.push({ type: 'text', value: ' ' });
    
    // Add data as small text below QR if reasonably short
    if (qrData.length <= 40) {
      data.push({
        type: 'text',
        value: qrData,
        style: {
          fontSize: '10px',
          textAlign: 'center'
        }
      });
      data.push({ type: 'text', value: ' ' });
    }
    
    // Cut
    data.push({ type: 'cut', position: 'full' });
    
    // Print options
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: printerName,
      timeOutPerLine: 400,
      silent: true
    };
    
    // Log the data we're sending
    console.log('[ThermalPrinterService] QR code print data:', JSON.stringify(data));
    console.log('[ThermalPrinterService] Print options:', JSON.stringify(options));
    
    // Send to printer
    return this.electronService.printWithPosPrinter(data, options).pipe(
      map(result => {
        console.log('[ThermalPrinterService] QR code print result:', result);
        
        if (showSnackbar) {
          if (result.success) {
            this.snackBar.open('Código QR impreso exitosamente', 'Cerrar', { duration: 3000 });
          } else {
            this.snackBar.open(`Error al imprimir código QR: ${result.error || 'Error desconocido'}`, 'Cerrar', { duration: 5000 });
          }
        }
        return result;
      }),
      catchError(err => {
        console.error('[ThermalPrinterService] Error printing QR code:', err);
        if (showSnackbar) {
          this.snackBar.open('Error al imprimir código QR: ' + err.message, 'Cerrar', { duration: 5000 });
        }
        return of({ success: false, error: err.message });
      })
    );
  }
} 