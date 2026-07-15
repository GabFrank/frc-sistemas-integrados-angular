import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { PrinterInfo } from "../../../../commons/core/electron/electron.service";
import { ThermalPrinterService } from "../../../configuracion/thermal-printer/thermal-printer.service";
import { BarcodeQrGeneratorService } from "../../../productos/producto/list-producto/print-label-dialog/barcode-qr-generator.service";
import { TerminalPos } from "../terminal-pos.model";

export class PrintTerminalPosData {
  terminalPos: TerminalPos;
}

@Component({
  selector: "app-print-terminal-pos-dialog",
  templateUrl: "./print-terminal-pos-dialog.component.html",
  styleUrls: ["./print-terminal-pos-dialog.component.scss"],
})
export class PrintTerminalPosDialogComponent implements OnInit {
  printers: PrinterInfo[] = [];
  printForm: FormGroup;
  loading = false;
  previewBarcodeDataUrl: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<PrintTerminalPosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrintTerminalPosData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private thermalPrinterService: ThermalPrinterService,
    private barcodeQrService: BarcodeQrGeneratorService
  ) {}

  ngOnInit(): void {
    this.printForm = this.fb.group({
      selectedPrinter: ["", Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
    this.loadPrinters();
    this.generatePreview();
  }

  get codigo(): string {
    return (this.data.terminalPos?.codigo || "").toString().trim();
  }

  loadPrinters(): void {
    this.loading = true;
    this.thermalPrinterService.getPrinters().subscribe({
      next: (printers) => {
        this.printers = printers;
        if (printers.length > 0) {
          this.printForm.get("selectedPrinter").setValue(printers[0].name);
        } else {
          this.snackBar.open("No hay impresoras disponibles", "Cerrar", { duration: 5000 });
        }
        this.loading = false;
      },
      error: () => {
        this.snackBar.open("Error al cargar impresoras térmicas", "Cerrar", { duration: 5000 });
        this.loading = false;
      },
    });
  }

  generatePreview(): void {
    if (!this.codigo) {
      this.previewBarcodeDataUrl = null;
      return;
    }
    this.barcodeQrService
      .generateBarcode(this.codigo, "CODE128", { height: 80, margin: 0, displayValue: true })
      .then((dataUrl) => (this.previewBarcodeDataUrl = dataUrl))
      .catch(() => (this.previewBarcodeDataUrl = null));
  }

  onPrint(): void {
    if (this.printForm.invalid) {
      this.snackBar.open("Por favor complete todos los campos requeridos", "Cerrar", { duration: 3000 });
      return;
    }
    if (!this.codigo) {
      this.snackBar.open("El terminal POS no tiene un código válido", "Cerrar", { duration: 5000 });
      return;
    }

    this.loading = true;
    const printerName = this.printForm.get("selectedPrinter").value;
    const quantity = this.printForm.get("quantity").value;
    const descripcion = (this.data.terminalPos?.descripcion || "").toString();

    const printData: any[] = [];
    // Salto inicial para que el cabezal térmico no corte el contenido superior
    printData.push({ type: "text", value: "\n", style: { fontSize: "10px" } });

    if (descripcion) {
      printData.push({
        type: "text",
        value: descripcion,
        style: { textAlign: "center", fontSize: "14px", fontWeight: "bold", color: "#000000" },
      });
    }

    // Mismo formato de código de barras que print-label-dialog (CODE128 nativo ESC/POS)
    printData.push({
      type: "barCode",
      value: this.codigo,
      barcodeType: "CODE128",
      format: "CODE128",
      position: "BELOW",
      includeParity: true,
    } as any);

    printData.push({
      type: "text",
      value: "------------------------",
      style: { textAlign: "center", fontSize: "12px", color: "#000000" },
    });
    printData.push({ type: "cut", position: "full" } as any);

    const options = {
      preview: false,
      width: "58mm",
      margin: "0 0 0 0",
      copies: quantity,
      printerName,
      timeOutPerLine: 400,
      silent: true,
    } as any;

    this.thermalPrinterService.electronService
      .printWithPosPrinter(printData, options)
      .subscribe((result) => {
        this.loading = false;
        if (result.success) {
          this.snackBar.open("Código enviado a la impresora", "Cerrar", { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open("Error al imprimir: " + (result.error || "Error desconocido"), "Cerrar", { duration: 5000 });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
