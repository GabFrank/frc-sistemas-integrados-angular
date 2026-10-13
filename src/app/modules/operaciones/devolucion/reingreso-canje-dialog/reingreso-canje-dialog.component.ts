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
  vencimientoReingreso: Date;
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
  vencimientoControl = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReingresoCanjeDialogData,
    private dialogRef: MatDialogRef<ReingresoCanjeDialogComponent>
  ) {}

  ngOnInit(): void {
    const item = this.data?.item;
    // No se reingresa más de lo devuelto (el central lo vuelve a validar).
    if (item?.cantidad != null) {
      this.cantidadReingresadaControl.addValidators(Validators.max(item.cantidad));
    }
    // Pre-carga: cant. reingresada = cantidad devuelta (caso mas comun: canje total).
    this.cantidadReingresadaControl.setValue(
      item?.cantidadReingresada != null ? item.cantidadReingresada : item?.cantidad
    );
    if (item?.vencimientoReingreso != null) {
      this.vencimientoControl.setValue(new Date(item.vencimientoReingreso));
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onGuardar() {
    if (this.cantidadReingresadaControl.invalid || this.vencimientoControl.invalid) {
      return;
    }
    const result: ReingresoCanjeDialogResult = {
      cantidadReingresada: this.cantidadReingresadaControl.value,
      vencimientoReingreso: this.vencimientoControl.value,
    };
    this.dialogRef.close(result);
  }
}
