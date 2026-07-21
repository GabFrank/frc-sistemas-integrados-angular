import { Component, Inject, OnInit, HostListener } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Presentacion } from "../../presentacion/presentacion.model";
import { CodigoInput } from "../codigo-input.model";
import { Codigo } from "../codigo.model";
import { CodigoService } from "../codigo.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BarcodeQrGeneratorService } from "../../producto/list-producto/print-label-dialog/barcode-qr-generator.service";
import {
  ThermalPrinterService,
} from "../../../configuracion/thermal-printer/thermal-printer.service";
import { PrinterInfo } from "../../../../commons/core/electron/electron.service";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";

export class AdicionarCodigoData {
  codigo: Codigo;
  presentacion: Presentacion;
  index: number;
  presentacionIndex: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-codigo-dialog",
  templateUrl: "./adicionar-codigo-dialog.component.html",
  styleUrls: ["./adicionar-codigo-dialog.component.scss"],
})
export class AdicionarCodigoDialogComponent implements OnInit {
  formGroup: FormGroup;
  selectedCodigo: Codigo;
  codigoControl = new FormControl(null, Validators.required);
  principalControl = new FormControl(null);
  activoControl = new FormControl(null);
  imprimirAlGuardarControl = new FormControl(false);
  printerControl = new FormControl(null);
  codigoInput = new CodigoInput();
  isEditting = false;
  isPesable = false;
  inputChanged = false;
  inputTimer: any = null;
  generating = false;
  printing = false;
  barcodePreviewUrl: string | null = null;
  printers: PrinterInfo[] = [];
  /** Cola ticket de config/environment (impresora por defecto de la app). */
  impresoraConfigNombre = "";

  /** Valor EAN-13; la impresora térmica lo emite como CODE128 (flujo existente). */
  readonly barcodePrintFormat = "CODE128";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarCodigoData,
    private matDialogRef: MatDialogRef<AdicionarCodigoDialogComponent>,
    private codigoService: CodigoService,
    private notificacionSnackBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService,
    private barcodeQrService: BarcodeQrGeneratorService,
    private thermalPrinterService: ThermalPrinterService,
    private configuracionService: ConfiguracionService
  ) {}

  @HostListener("window:keydown", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && this.isEditting) {
      if (this.inputChanged) {
        event.preventDefault();
      } else {
        event.preventDefault();
        this.onSave();
      }
    }
  }

  ngOnInit(): void {
    this.createForm();
    this.loadPrinters();
    if (this.data?.presentacion?.producto?.balanza == true) {
      this.codigoControl.setValidators([
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
      ]);
      this.codigoControl.updateValueAndValidity();
      this.isPesable = true;
    }
    if (this.data?.codigo?.id != null) {
      this.cargarDato();
      this.formGroup.disable();
      this.imprimirAlGuardarControl.enable();
      this.printerControl.enable();
      this.refreshBarcodePreview(this.codigoControl.value);
    } else {
      this.isEditting = true;
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl("codigo", this.codigoControl);
    this.formGroup.addControl("principal", this.principalControl);
    this.formGroup.addControl("activo", this.activoControl);

    this.principalControl.setValue(false);
    this.activoControl.setValue(true);

    this.codigoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      this.inputChanged = true;
      if (this.inputTimer) {
        clearTimeout(this.inputTimer);
      }
      this.inputTimer = setTimeout(() => {
        this.inputChanged = false;
      }, 500);
      this.refreshBarcodePreview(val);
    });
  }

  loadPrinters() {
    this.impresoraConfigNombre = (
      this.configuracionService.getConfig()?.printers?.ticket || ""
    ).trim();

    this.thermalPrinterService
      .getPrinters()
      .pipe(untilDestroyed(this))
      .subscribe((printers) => {
        const list = [...(printers || [])];
        const configName = this.impresoraConfigNombre;

        if (configName) {
          const yaEsta = list.some(
            (p) =>
              (p.name || "").toLowerCase() === configName.toLowerCase()
          );
          if (!yaEsta) {
            list.unshift({
              name: configName,
              displayName: `${configName} (app)`,
              description: "Impresora configurada en la app",
              status: 0,
              isDefault: true,
            });
          }
        }

        this.printers = list;

        // Por defecto: cola ticket de config; si no, la primera del sistema.
        if (configName) {
          const match = list.find(
            (p) =>
              (p.name || "").toLowerCase() === configName.toLowerCase()
          );
          this.printerControl.setValue(match?.name || configName);
        } else if (list.length > 0 && !this.printerControl.value) {
          this.printerControl.setValue(list[0].name);
        }
      });
  }

  etiquetaImpresora(p: PrinterInfo): string {
    const esConfig =
      this.impresoraConfigNombre &&
      (p.name || "").toLowerCase() ===
        this.impresoraConfigNombre.toLowerCase();
    if (esConfig) {
      return `${p.name} (por defecto)`;
    }
    return p.displayName || p.name;
  }

  async refreshBarcodePreview(codigo: string) {
    const value = (codigo || "").toString().trim();
    if (!value || this.isPesable) {
      this.barcodePreviewUrl = null;
      return;
    }
    try {
      this.barcodePreviewUrl = await this.barcodeQrService.generateBarcode(
        value,
        this.barcodePrintFormat,
        { width: 2, height: 60, displayValue: true, fontSize: 14 }
      );
    } catch {
      this.barcodePreviewUrl = null;
    }
  }

  cargarDato() {
    this.selectedCodigo = this.data.codigo;
    this.codigoControl.setValue(this.selectedCodigo.codigo);
    this.principalControl.setValue(this.selectedCodigo.principal);
    this.activoControl.setValue(this.selectedCodigo.activo);
    this.codigoInput.id = this.selectedCodigo.id;
  }

  onGenerarCodigo() {
    if (this.isPesable || !this.isEditting) {
      return;
    }
    this.generating = true;
    this.codigoService
      .onGenerarCodigoInterno()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (codigo) => {
          this.generating = false;
          if (codigo) {
            this.codigoControl.setValue(codigo);
            this.notificacionSnackBar.notification$.next({
              texto: "Código generado: " + codigo,
              duracion: 2,
              color: NotificacionColor.success,
            });
          }
        },
        error: () => {
          this.generating = false;
        },
      });
  }

  onImprimirAhora() {
    const codigo = (this.codigoControl.value || "").toString().trim();
    const printerName = this.printerControl.value;
    if (!codigo) {
      this.notificacionSnackBar.notification$.next({
        texto: "Ingrese o genere un código antes de imprimir",
        duracion: 3,
        color: NotificacionColor.warn,
      });
      return;
    }
    if (!printerName) {
      this.notificacionSnackBar.notification$.next({
        texto: "Seleccione una impresora térmica",
        duracion: 3,
        color: NotificacionColor.warn,
      });
      return;
    }
    this.printing = true;
    this.thermalPrinterService
      .printBarcodeLabel(
        printerName,
        codigo,
        this.barcodePrintFormat,
        true,
        true,
        this.productoNombre
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.printing = false;
        },
        error: () => {
          this.printing = false;
        },
      });
  }

  /** Nombre del producto para la etiqueta térmica (siempre presente en un producto válido). */
  get productoNombre(): string {
    return this.data.presentacion.producto.descripcion;
  }

  onSave() {
    this.codigoInput.codigo = this.codigoControl.value;
    this.codigoInput.activo = this.activoControl.value;
    this.codigoInput.principal = this.principalControl.value;
    this.codigoInput.presentacionId = this.data.presentacion.id;
    const debeImprimir = !!this.imprimirAlGuardarControl.value;
    const printerName = this.printerControl.value;

    let isCodigoInUse = false;
    this.codigoService
      .onGetCodigoPorCodigo(this.codigoInput.codigo)
      .pipe(untilDestroyed(this))
      .subscribe((res: Codigo[]) => {
        if (res == null) {
          return;
        }
        switch (res.length) {
          case 0:
            isCodigoInUse = false;
            break;
          case 1:
            isCodigoInUse =
              res[0].id !== this.codigoInput.id;
            break;
          default:
            isCodigoInUse = true;
            break;
        }

        if (isCodigoInUse) {
          this.notificacionSnackBar.notification$.next({
            texto: "El código ya está en uso",
            duracion: 3,
            color: NotificacionColor.danger,
          });
          return;
        }

        this.codigoService
          .onSaveCodigo(this.codigoInput)
          .pipe(untilDestroyed(this))
          .subscribe((res2) => {
            if (res2 == null) {
              return;
            }
            const closePayload = {
              codigo: res2,
              index: this.data.index,
              presentacionIndex: this.data.presentacionIndex,
            };
            if (debeImprimir && printerName && res2.codigo) {
              this.thermalPrinterService
                .printBarcodeLabel(
                  printerName,
                  res2.codigo,
                  this.barcodePrintFormat,
                  true,
                  true,
                  this.productoNombre
                )
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: () => this.matDialogRef.close(closePayload),
                  error: () => this.matDialogRef.close(closePayload),
                });
            } else {
              this.matDialogRef.close(closePayload);
            }
          });
      });
  }

  onCancelar() {
    this.matDialogRef.close();
  }
}
