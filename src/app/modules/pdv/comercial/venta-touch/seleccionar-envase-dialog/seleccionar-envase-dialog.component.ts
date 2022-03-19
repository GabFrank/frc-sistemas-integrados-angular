import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { VentaItem } from "../../../../operaciones/venta/venta-item.model";
import { Producto } from "../../../../productos/producto/producto.model";
import { ProductoService } from "../../../../productos/producto/producto.service";

class Data {
  envase: Producto;
  cantidad: number;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-seleccionar-envase-dialog",
  templateUrl: "./seleccionar-envase-dialog.component.html",
  styleUrls: ["./seleccionar-envase-dialog.component.scss"],
})
export class SeleccionarEnvaseDialogComponent implements OnInit {
  selectedEnvase: Producto;
  cantidadControl = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    public dialogRef: MatDialogRef<SeleccionarEnvaseDialogComponent>,
    private productoService: ProductoService
  ) {
    if (data.cantidad != null) {
      this.cantidadControl.setValue(data.cantidad);
    }
    if (data.envase != null) {
      productoService.onGetProductoPorId(data.envase.id).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          this.selectedEnvase = res;
        }
      });
    }
  }

  ngOnInit(): void {}

  onAceptar() {
    this.dialogRef.close()
  }

  onCancelar() {
    let item = new VentaItem();
    item.cantidad = this.cantidadControl.value;
    item.presentacion = this.selectedEnvase.presentaciones.find(p => p.principal == true);
    item.precioVenta = item?.presentacion?.precioPrincipal;
    item.producto = this.selectedEnvase
    this.dialogRef.close(item)
  }
}
