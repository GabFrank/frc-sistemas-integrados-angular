import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { DateAdapter } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FechaPyDateAdapter } from "../../../../shared/utils/fecha-py-date-adapter";
import { DevolucionItem } from "../devolucion.model";

export interface ReingresoCanjeDialogData {
  item: DevolucionItem;
}

export interface ReingresoCanjeDialogResult {
  cantidadReingresada: number;
  /** Opcional: el proveedor no siempre informa el vencimiento de lo que repone. */
  vencimientoReingreso?: Date;
  /** Número del lote que entrega el proveedor. Solo para productos con control de lote. */
  loteReingreso?: string;
}

@Component({
  selector: "app-reingreso-canje-dialog",
  templateUrl: "./reingreso-canje-dialog.component.html",
  styleUrls: ["./reingreso-canje-dialog.component.scss"],
  providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }],
})
export class ReingresoCanjeDialogComponent implements OnInit {
  cantidadReingresadaControl = new FormControl(null, [
    Validators.required,
    Validators.min(0),
  ]);
  // Opcional: el central acepta el canje sin vencimiento.
  vencimientoControl = new FormControl<Date>(null);
  loteReingresoControl = new FormControl<string>(null);

  /** El producto lleva control de lote: lo repuesto entra al lote que entrega el proveedor. */
  llevaLote = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReingresoCanjeDialogData,
    private dialogRef: MatDialogRef<ReingresoCanjeDialogComponent>
  ) {}

  ngOnInit(): void {
    const item = this.data?.item;
    this.llevaLote = item?.producto?.lote === true;
    if (this.llevaLote) {
      // El central rechaza el canje de un producto con lote sin este número.
      this.loteReingresoControl.addValidators(Validators.required);
      this.loteReingresoControl.setValue(item?.loteReingreso ?? null);
    }
    // No se reingresa más de lo devuelto (el central lo vuelve a validar).
    if (item?.cantidad != null) {
      this.cantidadReingresadaControl.addValidators(Validators.max(item.cantidad));
    }
    // Pre-carga: cant. reingresada = cantidad devuelta (caso mas comun: canje total).
    this.cantidadReingresadaControl.setValue(
      item?.cantidadReingresada != null ? item.cantidadReingresada : item?.cantidad
    );
    // Un valor precargado fuera de tope tiene que mostrar su error sin esperar a que se toque el campo.
    this.cantidadReingresadaControl.markAsTouched();
    if (item?.vencimientoReingreso != null) {
      this.vencimientoControl.setValue(new Date(item.vencimientoReingreso));
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onGuardar() {
    if (
      this.cantidadReingresadaControl.invalid ||
      this.vencimientoControl.invalid ||
      this.loteReingresoControl.invalid
    ) {
      return;
    }
    const result: ReingresoCanjeDialogResult = {
      cantidadReingresada: this.cantidadReingresadaControl.value,
      vencimientoReingreso: this.vencimientoControl.value,
      loteReingreso: this.llevaLote
        ? ("" + this.loteReingresoControl.value).trim().toUpperCase()
        : undefined,
    };
    this.dialogRef.close(result);
  }
}
