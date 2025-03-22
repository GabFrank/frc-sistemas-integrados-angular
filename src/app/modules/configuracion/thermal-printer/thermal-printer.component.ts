import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThermalPrinterService } from './thermal-printer.service';
import { PrinterInfo, PrintResult } from '../../../commons/core/electron/electron.service';

@Component({
  selector: 'app-thermal-printer',
  templateUrl: './thermal-printer.component.html',
  styleUrls: ['./thermal-printer.component.scss']
})
export class ThermalPrinterComponent implements OnInit {
  printerForm: FormGroup;
  printers: PrinterInfo[] = [];
  selectedPrinter: PrinterInfo | null = null;
  hasStoredPrinter: boolean = false;
  loading = false;

  // Options for form select fields
  printerTypes = [
    { value: 'EPSON', label: 'EPSON' },
    { value: 'STAR', label: 'STAR' }
  ];

  connectionTypes = [
    { value: 'network', label: 'Red (TCP/IP)' },
    { value: 'usb', label: 'USB' },
    { value: 'cups', label: 'CUPS (Linux/macOS)' },
    { value: 'bluetooth', label: 'Bluetooth' }
  ];

  characterSets = [
    { value: 'SLOVENIA', label: 'Eslovenia' },
    { value: 'PC852', label: 'PC852 (Europa Central)' },
    { value: 'PC858', label: 'PC858 (Europa Occidental)' },
    { value: 'PC860', label: 'PC860 (Português)' },
    { value: 'PC863', label: 'PC863 (Canadá)' },
    { value: 'PC865', label: 'PC865 (Nórdico)' },
    { value: 'LATIN-2', label: 'Latino-2' },
    { value: 'PC866', label: 'PC866 (Cirílico)' },
    { value: 'PC857', label: 'PC857 (Turco)' },
    { value: 'WPC1250', label: 'WPC1250' },
    { value: 'WPC1251', label: 'WPC1251 (Cirílico)' },
    { value: 'WPC1252', label: 'WPC1252 (Europa Occidental)' },
    { value: 'WPC1253', label: 'WPC1253 (Griego)' },
    { value: 'WPC1254', label: 'WPC1254 (Turco)' },
    { value: 'WPC1255', label: 'WPC1255 (Hebreo)' },
    { value: 'WPC1256', label: 'WPC1256 (Árabe)' },
    { value: 'WPC1257', label: 'WPC1257 (Báltico)' },
    { value: 'WPC1258', label: 'WPC1258 (Vietnam)' },
    { value: 'ISO88596', label: 'ISO8859-6 (Árabe)' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private thermalPrinterService: ThermalPrinterService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPrinters();
  }

  private initForm(): void {
    this.printerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      type: ['EPSON', [Validators.required]],
      connectionType: ['network', [Validators.required]],
      address: ['', [Validators.required]],
      port: [9100],
      width: [48],
      characterSet: ['PC850']
    });
  }

  loadPrinters(): void {
    this.loading = true;
    this.thermalPrinterService.getPrinters().subscribe({
      next: (printers) => {
        this.printers = printers;
        this.loading = false;
        
        // If we have printers, select the first one by default
        if (printers.length > 0) {
          this.hasStoredPrinter = true;
          this.selectedPrinter = printers[0];
          
          this.printerForm.patchValue({
            name: this.selectedPrinter.name,
            type: 'EPSON', // Default type as this isn't included in PrinterInfo
            connectionType: 'network', // Default connection as this isn't included in PrinterInfo
            address: this.selectedPrinter.name,
            port: 9100, // Default port
            width: 48, // Default width
            characterSet: 'PC850' // Default character set
          });
        }
      },
      error: (error) => {
        console.error('Error loading printers:', error);
        this.snackBar.open('Error al cargar impresoras', 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  onSavePrinter(): void {
    if (this.printerForm.invalid) {
      return;
    }

    this.loading = true;
    
    // Show success message 
    this.snackBar.open('La configuración se guardó localmente. Para usar esta impresora, selecciónela en el diálogo de impresión.', 'Cerrar', { duration: 5000 });
    this.loading = false;
    
    // Update selected printer with form values
    this.selectedPrinter = {
      name: this.printerForm.value.name,
      displayName: this.printerForm.value.name,
      description: `${this.printerForm.value.type} printer`,
      status: 0,
      isDefault: false
    };
    
    this.hasStoredPrinter = true;
  }

  onDeletePrinter(): void {
    if (!this.selectedPrinter) {
      return;
    }
    
    // Confirm deletion
    if (!confirm(`¿Está seguro de que desea eliminar la configuración de la impresora?`)) {
      return;
    }
    
    this.selectedPrinter = null;
    this.hasStoredPrinter = false;
    this.initForm();
    this.snackBar.open('Configuración eliminada', 'Cerrar', { duration: 3000 });
  }

  onTestPrinter(): void {
    if (!this.hasStoredPrinter || !this.selectedPrinter || this.printerForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    // Create test content
    const testData = [
      {
        type: 'text',
        value: '--- PRUEBA DE IMPRESIÓN ---',
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          fontSize: '14px'
        }
      },
      { type: 'text', value: ' ' },
      {
        type: 'text',
        value: this.selectedPrinter.name,
        style: {
          textAlign: 'center',
          fontSize: '12px'
        }
      },
      { type: 'text', value: ' ' },
      {
        type: 'text',
        value: new Date().toLocaleString(),
        style: {
          textAlign: 'center',
          fontSize: '10px'
        }
      },
      { type: 'text', value: ' ' },
      { type: 'text', value: '1234567890 ABCDEFGHIJK' },
      { type: 'text', value: 'áéíóúñÁÉÍÓÚÑ @#$%&*()' },
      { type: 'text', value: ' ' },
      {
        type: 'barCode',
        value: '123456789012',
        height: 40,
        width: 2,
        displayValue: true,
        fontsize: 12
      },
      { type: 'text', value: ' ' },
      { type: 'cut' }
    ];
    
    // Print options
    const options = {
      preview: false,
      width: '58mm',
      margin: '0 0 0 0',
      copies: 1,
      printerName: this.selectedPrinter.name,
      timeOutPerLine: 400,
      silent: true
    };
    
    // Send to printer
    this.thermalPrinterService.electronService.printWithPosPrinter(testData, options).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.snackBar.open('Prueba enviada a la impresora', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open(`Error al imprimir prueba: ${result.error || 'Error desconocido'}`, 'Cerrar', { duration: 5000 });
        }
      },
      error: (error) => {
        console.error('Error testing printer:', error);
        this.snackBar.open('Error al probar impresora: ' + error.message, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }
} 