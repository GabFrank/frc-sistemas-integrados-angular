# Thermal Printer Implementation

This module provides thermal printer functionality for the application using the `node-thermal-printer` and `electron-pos-printer` libraries.

## Installation

1. Make sure the required dependencies are installed:

```bash
npm install node-thermal-printer electron-pos-printer --save
```

2. Rebuild Electron to ensure native dependencies work correctly:

```bash
npm run electron:serve-tsc
```

## Usage

### Printer Management

1. Access the Thermal Printer Management screen from the Configuration menu
2. Add and configure your printers
3. Test printers to ensure they're working correctly

### Using in Code

To use the thermal printer in your components:

```typescript
import { ThermalPrinterService } from 'path/to/thermal-printer.service';

@Component({...})
export class YourComponent {
  constructor(private printerService: ThermalPrinterService) {}

  printReceipt() {
    // Example order data
    const order = {
      id: 123,
      orderTime: new Date(),
      customerName: 'John Doe',
      tableNumber: 5,
      totalAmount: 25.50
    };

    // Example order items
    const orderItems = [
      {
        product: { name: 'Product 1', price: 10.00 },
        quantity: 2,
        notes: 'No sugar'
      },
      {
        product: { name: 'Product 2', price: 5.50 },
        quantity: 1,
        notes: ''
      }
    ];

    // Get default printer and print
    this.printerService.getDefaultPrinterId().subscribe(printerId => {
      if (printerId > 0) {
        this.printerService.printReceipt(printerId, order, orderItems).subscribe(result => {
          console.log('Print result:', result);
        });
      } else {
        console.error('No printer configured');
      }
    });
  }
  
  // Print a product price label
  printProductLabel(product) {
    this.printerService.printProductLabel(
      printerId, 
      product, 
      false, // landscape orientation
      true   // show snackbar notification
    ).subscribe(result => {
      console.log('Print result:', result);
    });
  }
  
  // Print a barcode label
  printBarcode() {
    this.printerService.printBarcodeLabel(
      printerId, 
      '7890123456789',  // barcode data
      'EAN13',          // barcode type
      true,             // show human readable text
      true              // show snackbar notification
    ).subscribe(result => {
      console.log('Print result:', result);
    });
  }
  
  // Print a QR code
  printQRCode() {
    this.printerService.printQRCodeLabel(
      printerId,
      'https://example.com',  // QR data (URL, text, etc.)
      'Scan Me',              // title (optional)
      true                    // show snackbar notification
    ).subscribe(result => {
      console.log('Print result:', result);
    });
  }
}
```

## Print Label Dialog

The application includes a print dialog component that allows users to:

1. Print price labels for products
2. Print barcodes
3. Print QR codes

To use the dialog:

```typescript
import { MatDialog } from '@angular/material/dialog';
import { PrintLabelDialogComponent } from 'path/to/print-label-dialog.component';

@Component({...})
export class YourComponent {
  constructor(private matDialog: MatDialog) {}
  
  openPrintDialog(product) {
    this.matDialog.open(PrintLabelDialogComponent, {
      width: '400px',
      data: { producto: product }
    });
  }
}
```

## Supported Printer Types

- EPSON
- STAR

## Supported Connection Types

- Network (TCP/IP)
- USB
- Bluetooth
- CUPS (Linux/macOS)

## Advanced Features

### Barcode Printing

The module supports printing various barcode formats:
- EAN13 (default)
- CODE128
- CODE39
- ITF
- And others supported by electron-pos-printer

### QR Code Printing

QR codes can be generated from:
- Plain text
- URLs
- Contact information
- And any other text-based data

## Troubleshooting

### Common Issues

1. **Printer not found**: Ensure the printer is connected and the address/port is correct
2. **Permission errors on Linux/macOS**: Ensure your user has permission to access the printer device
3. **Connection refused**: Check firewall settings for network printers
4. **Barcodes not scanning**: Ensure the print density is appropriate and barcode data is valid
5. **Poor image quality**: Try using the image-based printing option for better results

## Demo Component

Here's a complete example of a component that demonstrates all the printing features:

```typescript
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThermalPrinterService } from '../thermal-printer/thermal-printer.service';
import { PrintLabelDialogComponent } from '../print-label-dialog/print-label-dialog.component';

@Component({
  selector: 'app-thermal-printer-demo',
  template: `
    <div class="container">
      <h2>Thermal Printer Demo</h2>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>Select Printer</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Printer</mat-label>
            <mat-select [(ngModel)]="selectedPrinterId">
              <mat-option *ngFor="let printer of printers" [value]="printer.id">
                {{printer.name}}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
      
      <mat-card class="mt-3">
        <mat-card-header>
          <mat-card-title>Barcode Printing</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Barcode Data</mat-label>
            <input matInput [(ngModel)]="barcodeData" placeholder="Enter barcode data">
            <mat-hint>Enter numbers for EAN13 format</mat-hint>
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width mt-2">
            <mat-label>Barcode Type</mat-label>
            <mat-select [(ngModel)]="barcodeType">
              <mat-option value="EAN13">EAN13</mat-option>
              <mat-option value="CODE128">CODE128</mat-option>
              <mat-option value="CODE39">CODE39</mat-option>
              <mat-option value="ITF">ITF</mat-option>
            </mat-select>
          </mat-form-field>
          
          <mat-checkbox [(ngModel)]="showBarcodeText" class="mt-2">
            Show text below barcode
          </mat-checkbox>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="printBarcode()" [disabled]="!selectedPrinterId || !barcodeData">
            Print Barcode
          </button>
        </mat-card-actions>
      </mat-card>
      
      <mat-card class="mt-3">
        <mat-card-header>
          <mat-card-title>QR Code Printing</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>QR Code Title (Optional)</mat-label>
            <input matInput [(ngModel)]="qrTitle" placeholder="Enter title">
          </mat-form-field>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>QR Code Data</mat-label>
            <textarea matInput [(ngModel)]="qrData" rows="4" placeholder="Enter URL, text, or other data"></textarea>
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="printQRCode()" [disabled]="!selectedPrinterId || !qrData">
            Print QR Code
          </button>
        </mat-card-actions>
      </mat-card>
      
      <mat-card class="mt-3">
        <mat-card-header>
          <mat-card-title>Price Label</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Use the print dialog to print product price labels with more options.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="openPrintDialog()">
            Open Print Dialog
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    .full-width {
      width: 100%;
    }
    .mt-2 {
      margin-top: 16px;
    }
    .mt-3 {
      margin-top: 24px;
    }
  `]
})
export class ThermalPrinterDemoComponent implements OnInit {
  printers = [];
  selectedPrinterId: number = null;
  
  // Barcode options
  barcodeData: string = '7890123456789';
  barcodeType: string = 'EAN13';
  showBarcodeText: boolean = true;
  
  // QR code options
  qrTitle: string = 'Scan Me';
  qrData: string = 'https://example.com';
  
  // Sample product for price label
  sampleProduct = {
    id: 1,
    descripcion: 'Sample Product',
    precio_venta: 25000
  };
  
  constructor(
    private thermalPrinterService: ThermalPrinterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadPrinters();
  }
  
  loadPrinters(): void {
    this.thermalPrinterService.getPrinters().subscribe(printers => {
      this.printers = printers;
      if (printers.length > 0) {
        this.selectedPrinterId = printers[0].id;
      }
    });
  }
  
  printBarcode(): void {
    if (!this.selectedPrinterId || !this.barcodeData) {
      this.snackBar.open('Please select a printer and enter barcode data', 'Close', { duration: 3000 });
      return;
    }
    
    this.thermalPrinterService.printBarcodeLabel(
      this.selectedPrinterId,
      this.barcodeData,
      this.barcodeType,
      this.showBarcodeText
    ).subscribe(result => {
      if (!result.success) {
        this.snackBar.open(`Error printing barcode: ${result.error || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }
  
  printQRCode(): void {
    if (!this.selectedPrinterId || !this.qrData) {
      this.snackBar.open('Please select a printer and enter QR code data', 'Close', { duration: 3000 });
      return;
    }
    
    this.thermalPrinterService.printQRCodeLabel(
      this.selectedPrinterId,
      this.qrData,
      this.qrTitle || undefined
    ).subscribe(result => {
      if (!result.success) {
        this.snackBar.open(`Error printing QR code: ${result.error || 'Unknown error'}`, 'Close', { duration: 5000 });
      }
    });
  }
  
  openPrintDialog(): void {
    this.dialog.open(PrintLabelDialogComponent, {
      width: '400px',
      data: { producto: this.sampleProduct }
    });
  }
} 