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
import { BarcodeQrGeneratorService } from './barcode-qr-generator.service';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../../financiero/moneda/moneda.model';

@Component({
  selector: 'app-print-label-dialog',
  templateUrl: './print-label-dialog.component.html',
  styleUrls: ['./print-label-dialog.component.scss']
})
export class PrintLabelDialogComponent implements OnInit {
  printers: PrinterInfo[] = [];
  printForm: FormGroup;
  loading: boolean = false;
  // Preview computed props (sin getters en template)
  previewNameLines: string[] = [];
  previewPrice: string = '';
  previewDate: string = '';
  previewBarcodeDataUrl: string | null = null;
  previewQrDataUrl: string | null = null;
  previewVisible: boolean = false;
  includeCreationDate: boolean = false;

  @ViewChild('labelPreview') labelPreview: ElementRef;

  // Label type options
  labelTypes = [
    { value: 'price', label: 'Etiqueta de Precio' },
    { value: 'barcode', label: 'Código de Barras' },
    { value: 'qr', label: 'Código QR' }
  ];

  // Cotizaciones cargadas desde MonedaService
  cotizacionReal: number = 130;
  cotizacionDolar: number = 7000;

  // Precios calculados para preview
  previewPrecioReal: string = '';
  previewPrecioDolar: string = '';

  constructor(
    public dialogRef: MatDialogRef<PrintLabelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private thermalPrinterService: ThermalPrinterService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private barcodeQrService: BarcodeQrGeneratorService,
    private monedaService: MonedaService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadPrinters();
    this.loadCotizaciones();
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

    // Inicializar preview y actualizar en cambios del formulario
    this.updatePreviewComputedProperties();

    // Suscribirse a cambios del tipo de etiqueta para resetear includeCreationDate
    let previousLabelType = this.printForm.get('selectedLabelType').value;
    this.printForm.get('selectedLabelType').valueChanges.subscribe((newLabelType) => {
      if (previousLabelType !== newLabelType) {
        this.includeCreationDate = false;
        previousLabelType = newLabelType;
      }
    });

    // Suscribirse a todos los cambios del formulario para actualizar preview
    this.printForm.valueChanges.subscribe(() => {
      this.updatePreviewComputedProperties();
    });
  }

  loadCotizaciones(): void {
    this.monedaService.onGetAll(false).subscribe({
      next: (monedas: Moneda[]) => {
        const real = monedas?.find(m => m.denominacion === 'REAL');
        const dolar = monedas?.find(m => m.denominacion === 'DOLAR');
        if (real?.cambio) {
          this.cotizacionReal = real.cambio;
          this.printForm.get('cotizacionReal').setValue(real.cambio, { emitEvent: false });
        }
        if (dolar?.cambio) {
          this.cotizacionDolar = dolar.cambio;
          this.printForm.get('cotizacionDolar').setValue(dolar.cambio, { emitEvent: false });
        }
        this.updatePreviewComputedProperties();
      },
      error: () => {/* usa valores por defecto */}
    });
  }

  initForm(): void {
    this.printForm = this.fb.group({
      selectedPrinter: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      isLandscape: [false],
      useImagePrinting: [false],
      selectedLabelType: ['price'],
      barcodeData: [''],
      qrCodeData: [''],
      qrCodeTitle: [''],
      creationDate: [new Date().toISOString().split('T')[0]],
      currencyMode: ['guarani'],
      cotizacionReal: [this.cotizacionReal],
      cotizacionDolar: [this.cotizacionDolar]
    });
  }

  wrapNameToTwoLines(name: string, maxChars: number = 22): string[] {
    const text = (name || '').trim();
    if (!text) return [];

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    const maxLines = maxChars === 17 ? 3 : 2; // 3 líneas para Xprinter (17 chars), 2 para otros

    for (const word of words) {
      const prospective = currentLine ? `${currentLine} ${word}` : word;

      if (prospective.length <= maxChars) {
        currentLine = prospective;
      } else {
        if (word.length > maxChars) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = '';
          }
          // Cortar palabra si es muy larga
          let i = 0;
          while (i < word.length && lines.length < maxLines) {
            const chunk = word.substring(i, i + maxChars);
            lines.push(chunk);
            i += maxChars;
          }
        } else {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        }
      }

      if (lines.length >= maxLines) {
        // Si ya tenemos el máximo de líneas, intentar agregar a la última si cabe
        if (currentLine && lines.length === maxLines) {
          const lastLine = lines[maxLines - 1];
          const testLastLine = lastLine + ' ' + currentLine;
          if (testLastLine.length <= maxChars) {
            lines[maxLines - 1] = testLastLine;
            currentLine = '';
          }
        }
        if (lines.length >= maxLines) {
          currentLine = '';
          break;
        }
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    } else if (currentLine && lines.length === maxLines) {
      // Intentar agregar a la última línea si cabe
      const lastLine = lines[maxLines - 1];
      const testLastLine = lastLine + ' ' + currentLine;
      if (testLastLine.length <= maxChars) {
        lines[maxLines - 1] = testLastLine;
      }
    }

    return lines.slice(0, maxLines);
  }

  getSelectedPrinterLower(): string {
    return (this.printForm?.get('selectedPrinter')?.value || '').toString().toLowerCase();
  }

  getMaxNameCharsForLabel(labelType: string): number {
    const printerName = this.getSelectedPrinterLower();
    if (printerName.includes('xprinter')) {
      return 17; // Reducido a 17 para evitar cortes al final
    }
    return labelType === 'barcode' ? 18 : 22;
  }

  formatShortDate(isoOrDate: any): string {
    const date = new Date(isoOrDate || new Date());
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  updatePreviewComputedProperties(): void {
    const productName: string = (this.data.producto?.descripcion || '').toString();
    const priceNum: number = typeof this.data.producto?.precioPrincipal === 'number'
      ? this.data.producto?.precioPrincipal
      : parseFloat(this.data.producto?.precioPrincipal) || 0;
    const barcodeVal: string = (this.printForm.get('barcodeData').value || this.data.producto?.codigoPrincipal || '').toString();
    const qrDataVal: string = (this.printForm.get('qrCodeData').value || '').toString();
    const creationDate = this.printForm.get('creationDate').value;
    const cotReal = this.printForm.get('cotizacionReal')?.value || this.cotizacionReal;
    const cotDolar = this.printForm.get('cotizacionDolar')?.value || this.cotizacionDolar;

    const selType = this.printForm.get('selectedLabelType').value;
    const nameMaxChars = this.getMaxNameCharsForLabel(selType);
    this.previewNameLines = this.wrapNameToTwoLines(productName, nameMaxChars);
    this.previewPrice = `Gs. ${priceNum.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    this.previewDate = `Fab: ${this.formatShortDate(creationDate)}`;
    this.previewPrecioReal = `R$ ${(priceNum / cotReal).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    this.previewPrecioDolar = `D$ ${(priceNum / cotDolar).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Generar imagen de código de barras para preview si el tipo seleccionado es barcode
    if (selType === 'barcode' && barcodeVal) {
      this.barcodeQrService.generateBarcode(barcodeVal, 'CODE128', { height: 80, margin: 0, displayValue: true })
        .then(dataUrl => this.previewBarcodeDataUrl = dataUrl)
        .catch(() => this.previewBarcodeDataUrl = null);
      this.previewQrDataUrl = null;
    } else if (selType === 'qr' && qrDataVal) {
      this.barcodeQrService.generateQR(qrDataVal, { width: 200, margin: 1 })
        .then(dataUrl => this.previewQrDataUrl = dataUrl)
        .catch(() => this.previewQrDataUrl = null);
      this.previewBarcodeDataUrl = null;
    } else {
      this.previewBarcodeDataUrl = null;
      this.previewQrDataUrl = null;
    }
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
        // Forzar texto (convertido a ESC/POS/EPL en el proceso principal)
        const productName = (this.data.producto?.descripcion || '').toString();
        const priceNum: number = typeof this.data.producto?.precioPrincipal === 'number'
          ? this.data.producto?.precioPrincipal
          : parseFloat(this.data.producto?.precioPrincipal) || 0;
        const priceText = `Gs. ${priceNum.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        const data: any[] = [];
        const maxNameChars = this.getMaxNameCharsForLabel(labelType);
        const nameLines = this.wrapNameToTwoLines(productName, maxNameChars);
        const nameStyle = { textAlign: 'center', fontSize: '12px' } as const;
        if (nameLines.length > 0) {
          nameLines.forEach(line => data.push({ type: 'text', value: line, style: nameStyle }));
        } else if (productName) {
          data.push({ type: 'text', value: productName, style: nameStyle });
        }
        data.push({ type: 'text', value: priceText, style: { textAlign: 'center', fontSize: '14px', fontWeight: 'bold' } });

        // Solo incluir fecha si el checkbox está activo
        if (this.includeCreationDate) {
          const creationDate = this.printForm.get('creationDate').value || new Date().toISOString().split('T')[0];
          // Use shorter date format: dd/mm/yy
          const date = new Date(creationDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          const formattedDate = `${day}/${month}/${year}`;
          data.push({ type: 'text', value: `Fab: ${formattedDate}`, style: { textAlign: 'center', fontSize: '10px' } });
        }

        data.push({ type: 'cut', position: 'full' } as any);
        const options = { preview: false, width: '58mm', margin: '0 0 0 0', copies: quantity, printerName, timeOutPerLine: 400, silent: true } as any;
        printObservable = this.thermalPrinterService.electronService.printWithPosPrinter(data, options);
      } else if (labelType === 'barcode') {
        // Barcode printing (name + date + price + barcode)
        const barcodeData = this.printForm.get('barcodeData').value || '0000000000000';
        console.log('[printLabel] Printing barcode:', barcodeData);
        if (!barcodeData || barcodeData.trim() === '') {
          this.loading = false;
          this.snackBar.open('Datos de código de barras inválidos', 'Cerrar', { duration: 5000 });
          return;
        }

        const productName = (this.data.producto?.descripcion || '').toString();
        const priceNum: number = typeof this.data.producto?.precioPrincipal === 'number'
          ? this.data.producto?.precioPrincipal
          : parseFloat(this.data.producto?.precioPrincipal) || 0;
        const priceText = `Gs. ${priceNum.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        const data: any[] = [];
        const maxNameChars = this.getMaxNameCharsForLabel(labelType);
        const nameLines = this.wrapNameToTwoLines(productName, maxNameChars);
        const nameStyle = { textAlign: 'center', fontSize: '12px' } as const;
        if (nameLines.length > 0) {
          nameLines.forEach(line => data.push({ type: 'text', value: line, style: nameStyle }));
        } else if (productName) {
          data.push({ type: 'text', value: productName, style: nameStyle });
        }
        data.push({ type: 'text', value: priceText, style: { textAlign: 'center', fontSize: '14px', fontWeight: 'bold' } });

        // Solo incluir fecha si el checkbox está activo
        if (this.includeCreationDate) {
          const creationDate = this.printForm.get('creationDate').value || new Date().toISOString().split('T')[0];
          // Use shorter date format: dd/mm/yy
          const date = new Date(creationDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = String(date.getFullYear()).slice(-2);
          const formattedDate = `${day}/${month}/${year}`;
          data.push({ type: 'text', value: `Fab: ${formattedDate}`, style: { textAlign: 'center', fontSize: '10px' } });
        }

        data.push({ type: 'barCode', value: barcodeData, barcodeType: 'CODE128', format: 'CODE128' } as any);
        data.push({ type: 'cut', position: 'full' } as any);
        const options = { preview: false, width: '58mm', margin: '0 0 0 0', copies: quantity, printerName, timeOutPerLine: 400, silent: true } as any;
        printObservable = this.thermalPrinterService.electronService.printWithPosPrinter(data, options);
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

  togglePreview(): void {
    this.previewVisible = !this.previewVisible;
  }

  toggleIncludeCreationDate(): void {
    this.includeCreationDate = !this.includeCreationDate;
  }

  async printOfficeLabel(): Promise<void> {
    const product = this.data.producto;
    if (!product) return;

    const productName: string = (product.descripcion || '').toString().toUpperCase();
    const codigoPrincipal: string = (product.codigoPrincipal || '').toString().trim();
    const priceNum: number = typeof product.precioPrincipal === 'number'
      ? product.precioPrincipal
      : parseFloat(product.precioPrincipal) || 0;
    const quantity: number = this.printForm.get('quantity').value || 1;
    const currencyMode: string = this.printForm.get('currencyMode').value || 'guarani';
    const cotReal: number = this.printForm.get('cotizacionReal').value || this.cotizacionReal;
    const cotDolar: number = this.printForm.get('cotizacionDolar').value || this.cotizacionDolar;

    const priceGs = priceNum.toLocaleString('es-PY', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const priceReal = (priceNum / cotReal).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const priceDolar = (priceNum / cotDolar).toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const showAllCurrencies = currencyMode === 'todas';

    // Generar barcode como data URL (Code 128)
    let barcodeDataUrl: string | null = null;
    if (codigoPrincipal) {
      try {
        barcodeDataUrl = await this.barcodeQrService.generateBarcode(codigoPrincipal, 'CODE128', {
          height: 40,
          width: 1.5,
          margin: 2,
          displayValue: true,
          fontSize: 10,
          textMargin: 2,
          fontOptions: '',
          font: 'Arial',
          textAlign: 'center',
          lineColor: '#000000',
          background: '#ffffff'
        });
      } catch (e) {
        barcodeDataUrl = null;
      }
    }

    // Bloque barcode o espacio vacío si no tiene código
    const barcodeSection = barcodeDataUrl
      ? `<div class="barcode-wrap"><img class="barcode-img" src="${barcodeDataUrl}" alt="${codigoPrincipal}"/></div>`
      : '';

    // Construir HTML de una etiqueta individual
    const buildLabel = (): string => {
      const priceSection = showAllCurrencies
        ? `<div class="prices-row">
            <span class="price-gs">Gs. ${priceGs}</span>
            <span class="price-divider">|</span>
            <span class="price-other">R$ ${priceReal}</span>
            <span class="price-divider">|</span>
            <span class="price-other">D$ ${priceDolar}</span>
           </div>`
        : `<div class="prices-row"><span class="price-gs-solo">Gs. ${priceGs}</span></div>`;

      return `<div class="etiqueta">
        <div class="product-name">${productName}</div>
        ${barcodeSection}
        <div class="separator"></div>
        ${priceSection}
      </div>`;
    };

    // Generar N etiquetas
    let labelsHtml = '';
    for (let i = 0; i < quantity; i++) {
      labelsHtml += buildLabel();
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiquetas de Precio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: Arial, sans-serif; background: white; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 104mm);
      gap: 0;
    }
    .etiqueta {
      width: 104mm;
      height: 42mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 2mm 5mm;
      border: 1px dashed #aaa;
      text-align: center;
      overflow: hidden;
      gap: 0;
    }
    .product-name {
      font-size: 14pt;
      font-weight: bold;
      line-height: 1.1;
      text-align: center;
      word-break: break-word;
      width: 100%;
      margin-bottom: 1mm;
    }
    .barcode-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      margin: 0.5mm 0;
    }
    .barcode-img {
      max-width: 88mm;
      height: 11mm;
      object-fit: contain;
    }
    .separator {
      width: 85%;
      height: 1px;
      background: #333;
      margin: 1mm 0;
    }
    .prices-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3mm;
      flex-wrap: nowrap;
      width: 100%;
    }
    .price-gs { font-size: 14pt; font-weight: bold; }
    .price-gs-solo { font-size: 14pt; font-weight: bold; }
    .price-other { font-size: 14pt; font-weight: 600; }
    .price-divider { font-size: 8pt; color: #555; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="grid">${labelsHtml}</div>
</body>
</html>`;

    // Crear iframe oculto e imprimir
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      this.snackBar.open('Error al preparar impresión', 'Cerrar', { duration: 3000 });
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        this.snackBar.open('Error al imprimir', 'Cerrar', { duration: 3000 });
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }
    }, 500);
  }
}
