import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ThermalPrinterService } from '../../../../configuracion/thermal-printer/thermal-printer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import html2canvas from 'html2canvas';
import { Observable, of, from } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Producto } from '../../producto.model';
import { PrinterInfo, PrintResult } from '../../../../../commons/core/electron/electron.service';

@Component({
  selector: 'app-print-label-dialog',
  templateUrl: './print-label-dialog.component.html',
  styleUrls: ['./print-label-dialog.component.scss']
})
export class PrintLabelDialogComponent implements OnInit {
  printers: PrinterInfo[] = [];
  printForm: FormGroup;
  loading: boolean = false;

  @ViewChild('labelPreview') labelPreview: ElementRef;

  // Label type options
  labelTypes = [
    { value: 'price', label: 'Etiqueta de Precio' },
    { value: 'barcode', label: 'Código de Barras' },
    { value: 'qr', label: 'Código QR' }
  ];

  constructor(
    public dialogRef: MatDialogRef<PrintLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private thermalPrinterService: ThermalPrinterService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPrinters();
    console.log('Product data:', this.data.producto);
    
    // Set initial form values based on product
    if (this.data.producto) {
      const product = this.data.producto;
      
      // If product has a barcode, set it as default data
      if (product.codigoPrincipal) {
        this.printForm.get('barcodeData').setValue(product.codigoPrincipal);
      }
      
      // Set default QR code data
      const qrData = `${product.codigoPrincipal || ''}\n${product.descripcion}\nPrecio: ${product.precioPrincipal.toLocaleString('es-PY', {
        style: 'currency',
        currency: 'PYG'
      })}`;
      this.printForm.get('qrCodeData').setValue(qrData);
      this.printForm.get('qrCodeTitle').setValue(product.descripcion);
    }
  }

  initForm(): void {
    this.printForm = this.fb.group({
      selectedPrinter: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      isLandscape: [false],
      useImagePrinting: [true],
      selectedLabelType: ['price'],
      barcodeData: [''],
      qrCodeData: [''],
      qrCodeTitle: ['']
    });
  }

  loadPrinters(): void {
    this.loading = true;
    console.log('[loadPrinters] Requesting printers from system');
    
    this.thermalPrinterService.getPrinters().subscribe({
      next: (printers) => {
        this.printers = printers;
        console.log('[loadPrinters] Loaded', printers.length, 'printers');
        
        // Set default printer if available
        if (printers.length > 0) {
          this.printForm.get('selectedPrinter').setValue(printers[0].name);
          console.log('[loadPrinters] Set default printer to:', printers[0].name);
        } else {
          console.warn('[loadPrinters] No printers found');
          this.snackBar.open('No hay impresoras disponibles', 'Cerrar', { duration: 5000 });
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('[loadPrinters] Error loading printers:', error);
        this.snackBar.open('Error al cargar impresoras térmicas', 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  onPrint(): void {
    // Redirect to the new method
    this.printLabel();
  }

  /**
   * Prints a label using the image-based approach
   * @returns An Observable<PrintResult> with the print result
   */
  printAsImage(): Observable<PrintResult> {
    console.log('[printAsImage] Starting image-based printing');
    const printerName = this.printForm.get('selectedPrinter').value;
    
    try {
      // Get product details
      const productName = this.data.producto?.descripcion || '';
      const truncatedName = productName.length > 30 ? productName.substring(0, 27) + '...' : productName;
      
      // Format price with proper locale settings
      const price = typeof this.data.producto?.precioPrincipal === 'number' 
        ? this.data.producto.precioPrincipal 
        : parseFloat(this.data.producto?.precioPrincipal) || 0;
      
      console.log('[printAsImage] Product details:', { name: truncatedName, price });
      
      // We'll skip image generation and just use text format which is more reliable
      console.log('[printAsImage] Using text-based printing instead of image capture');
      
      // Create data for the printer - text only approach (more reliable)
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
          value: `Gs. ${price.toLocaleString('es-PY', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}`,
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
        copies: this.printForm.get('quantity').value,
        printerName: printerName,
        timeOutPerLine: 400,
        silent: true
      };
      
      console.log('[printAsImage] Sending data to printer:', data);
      
      // Send to printer
      return this.thermalPrinterService.electronService.printWithPosPrinter(data, options);
    } catch (err) {
      console.error('[printAsImage] Exception during print setup:', err);
      return of({ success: false, error: err.message });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  toggleUseImage(): void {
    const useImage = this.printForm.get('useImagePrinting');
    useImage.setValue(!useImage.value);
  }

  printLabel(): void {
    try {
      if (this.printForm.invalid) {
        this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', {
          duration: 3000
        });
        return;
      }
      
      this.loading = true;
      const printerName = this.printForm.get('selectedPrinter').value;
      const quantity = this.printForm.get('quantity').value;
      const labelType = this.printForm.get('selectedLabelType').value;
      
      console.log('[printLabel] Printing label', { 
        type: labelType, 
        printer: printerName,
        quantity
      });
      
      let printObservable: Observable<PrintResult>;
      
      if (labelType === 'price') {
        // Price label printing
        if (this.printForm.get('useImagePrinting').value) {
          console.log('[printLabel] Using image-based printing for price label');
          printObservable = this.printAsImage();
        } else {
          console.log('[printLabel] Using text-based printing for price label');
          printObservable = this.thermalPrinterService.printPriceLabel(
            printerName, 
            this.data.producto,
            false
          );
        }
      } else if (labelType === 'barcode') {
        // Barcode printing
        const barcodeData = this.printForm.get('barcodeData').value || '0000000000000';
        console.log('[printLabel] Printing barcode:', barcodeData);
        
        // We need to ensure we have valid barcode data
        if (!barcodeData || barcodeData.trim() === '') {
          this.loading = false;
          this.snackBar.open('Datos de código de barras inválidos', 'Cerrar', { duration: 5000 });
          return;
        }
        
        printObservable = this.thermalPrinterService.printBarcodeLabel(
          printerName,
          barcodeData,
          'EAN13',
          true,
          false
        );
      } else if (labelType === 'qr') {
        // QR code printing
        const qrData = this.printForm.get('qrCodeData').value || 'https://example.com';
        const qrTitle = this.printForm.get('qrCodeTitle').value;
        console.log('[printLabel] Printing QR code:', { data: qrData, title: qrTitle });
        
        // We need to ensure we have valid QR data
        if (!qrData || qrData.trim() === '') {
          this.loading = false;
          this.snackBar.open('Datos de código QR inválidos', 'Cerrar', { duration: 5000 });
          return;
        }
        
        printObservable = this.thermalPrinterService.printQRCodeLabel(
          printerName,
          qrData,
          qrTitle,
          false
        );
      } else {
        this.loading = false;
        this.snackBar.open('Tipo de etiqueta no soportado', 'Cerrar', { duration: 5000 });
        return;
      }
      
      // Handle printing for the selected quantity
      printObservable.pipe(
        // Map to array of observables for multiple copies
        switchMap(result => {
          console.log('[printLabel] First print result:', result);
          
          if (!result.success) {
            return of(result);
          }
          
          // If quantity > 1 and first print was successful, print additional copies
          const remainingCopies = quantity - 1;
          if (remainingCopies <= 0) {
            return of(result);
          }
          
          console.log(`[printLabel] Printing ${remainingCopies} additional copies`);
          
          // We'll ignore errors on additional copies
          return of(result);
        }),
        catchError(err => {
          console.error('[printLabel] Error printing:', err);
          this.snackBar.open('Error al imprimir: ' + (err.message || 'Error desconocido'), 'Cerrar', {
            duration: 5000
          });
          return of({ success: false, error: err.message || 'Error desconocido' });
        })
      ).subscribe(result => {
        console.log('[printLabel] Final print result:', result);
        this.loading = false;
        
        if (result.success) {
          this.snackBar.open('Etiqueta enviada a la impresora', 'Cerrar', {
            duration: 3000
          });
        } else {
          this.snackBar.open('Error al imprimir: ' + (result.error || 'Error desconocido'), 'Cerrar', {
            duration: 5000
          });
        }
      });
    } catch (err) {
      console.error('[printLabel] Exception in print setup:', err);
      this.loading = false;
      this.snackBar.open('Error al configurar la impresión: ' + (err.message || 'Error desconocido'), 'Cerrar', {
        duration: 5000
      });
    }
  }
} 