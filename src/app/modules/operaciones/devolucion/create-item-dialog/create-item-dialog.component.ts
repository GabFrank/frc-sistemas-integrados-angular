import { Component, ElementRef, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { PresentacionService } from "../../../productos/presentacion/presentacion.service";
import { Producto } from "../../../productos/producto/producto.model";
import {
  DevolucionItem,
  MotivoAveria,
  TipoDevolucion,
} from "../devolucion.model";

export interface CreateDevolucionItemDialogData {
  item?: DevolucionItem;
  producto?: Producto;
  presentacion?: Presentacion;
  tipo?: TipoDevolucion;
  motivosAveria?: MotivoAveria[];
}

@UntilDestroy()
@Component({
  selector: "app-create-devolucion-item-dialog",
  templateUrl: "./create-item-dialog.component.html",
  styleUrls: ["./create-item-dialog.component.scss"],
})
export class CreateItemDialogComponent implements OnInit {
  @ViewChild("cantidadInput", { static: true }) cantidadInput: ElementRef;

  selectedItem = new DevolucionItem();
  selectedProducto: Producto;

  presentacionControl = new FormControl(null, Validators.required);
  cantidadControl = new FormControl(1, [
    Validators.required,
    Validators.min(0),
  ]);
  motivoAveriaControl = new FormControl(null);
  costoUnitarioControl = new FormControl(null);
  vencimientoControl = new FormControl(null);
  loteControl = new FormControl(null);
  motivoControl = new FormControl(null);

  formGroup = new FormGroup({
    presentacion: this.presentacionControl,
    cantidad: this.cantidadControl,
    motivoAveria: this.motivoAveriaControl,
    costoUnitario: this.costoUnitarioControl,
    vencimiento: this.vencimientoControl,
    lote: this.loteControl,
    motivo: this.motivoControl,
  });

  presentacionList: Presentacion[] = [];
  motivosAveria: MotivoAveria[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreateDevolucionItemDialogData,
    private matDialogRef: MatDialogRef<CreateItemDialogComponent>,
    private presentacionService: PresentacionService
  ) {}

  ngOnInit(): void {
    this.motivosAveria = this.data?.motivosAveria ?? [];

    // Costo unitario sugerido por el sistema: costo medio del producto x factor de
    // la presentacion. Solo autocompleta si el campo esta vacio, para no pisar un
    // costo ya cargado (edicion de item o edicion manual del usuario).
    this.presentacionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((pres: Presentacion) => {
        if (
          this.costoUnitarioControl.value == null ||
          this.costoUnitarioControl.value === ""
        ) {
          const costo = this.costoSistema(pres);
          if (costo != null) this.costoUnitarioControl.setValue(costo);
        }
      });

    if (this.data?.item != null) {
      this.cargarItem(this.data.item);
    } else if (this.data?.presentacion != null) {
      this.selectedProducto = this.data.presentacion.producto;
      this.cargarPresentaciones(
        this.data.presentacion.producto?.id,
        this.data.presentacion
      );
    } else if (this.data?.producto != null) {
      this.selectedProducto = this.data.producto;
      this.cargarPresentaciones(this.data.producto.id, null);
    } else {
      this.matDialogRef.close();
    }

    setTimeout(() => {
      if (this.cantidadInput != null) {
        this.cantidadInput.nativeElement.select();
      }
    }, 400);
  }

  cargarPresentaciones(productoId: number, seleccionada: Presentacion) {
    if (productoId == null) return;
    this.presentacionService
      .onGetPresentacionesPorProductoId(productoId)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.presentacionList = res ?? [];
        let target =
          seleccionada != null
            ? this.presentacionList.find((p) => p.id == seleccionada.id)
            : this.presentacionList.find((p) => p.principal) ??
              this.presentacionList[0];
        if (target != null) {
          this.presentacionControl.setValue(target);
        }
      });
  }

  cargarItem(item: DevolucionItem) {
    this.selectedItem = item;
    this.selectedProducto = item.producto;
    this.cantidadControl.setValue(item.cantidad);
    this.motivoAveriaControl.setValue(item.motivoAveria);
    this.costoUnitarioControl.setValue(item.costoUnitario);
    this.loteControl.setValue(item.lote);
    this.motivoControl.setValue(item.motivo);
    this.vencimientoControl.setValue(
      item.vencimiento != null ? new Date(item.vencimiento) : null
    );
    this.cargarPresentaciones(item.producto?.id, item.presentacion);
  }

  /** Costo unitario segun el sistema: costo medio del producto x factor de presentacion. */
  private costoSistema(presentacion: Presentacion): number | null {
    const costoMedio = presentacion?.producto?.costo?.costoMedio;
    if (costoMedio == null) return null;
    const factor = presentacion?.cantidad ?? 1;
    return costoMedio * factor;
  }

  onCancelar() {
    this.matDialogRef.close();
  }

  onGuardar() {
    if (this.formGroup.invalid) return;
    let item = new DevolucionItem();
    Object.assign(item, this.selectedItem);
    item.producto = this.selectedProducto;
    item.presentacion = this.presentacionControl.value;
    item.cantidad = this.cantidadControl.value;
    item.motivoAveria = this.motivoAveriaControl.value;
    item.costoUnitario = this.costoUnitarioControl.value;
    item.vencimiento = this.vencimientoControl.value;
    item.lote =
      this.loteControl.value != null
        ? ("" + this.loteControl.value).toUpperCase()
        : null;
    item.motivo =
      this.motivoControl.value != null
        ? ("" + this.motivoControl.value).toUpperCase()
        : null;
    this.matDialogRef.close({ item });
  }
}
