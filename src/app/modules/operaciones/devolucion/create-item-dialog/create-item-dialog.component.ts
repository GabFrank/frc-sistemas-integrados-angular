import { Component, ElementRef, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { DateAdapter } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FechaPyDateAdapter } from "../../../../shared/utils/fecha-py-date-adapter";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { PresentacionService } from "../../../productos/presentacion/presentacion.service";
import { Producto } from "../../../productos/producto/producto.model";
import {
  DevolucionItem,
  MotivoAveria,
  TipoDevolucion,
} from "../devolucion.model";
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { LoteDeProducto } from "../../lote/lote.model";
import { LoteService } from "../../lote/lote.service";

export interface CreateDevolucionItemDialogData {
  item?: DevolucionItem;
  producto?: Producto;
  presentacion?: Presentacion;
  tipo?: TipoDevolucion;
  motivosAveria?: MotivoAveria[];
  /** Sucursal de origen de la devolución: el saldo de cada lote se muestra para esa sucursal. */
  sucursalId?: number;
}

@UntilDestroy()
@Component({
  selector: "app-create-devolucion-item-dialog",
  templateUrl: "./create-item-dialog.component.html",
  styleUrls: ["./create-item-dialog.component.scss"],
  providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }],
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

  /** El producto lleva control de lote: el lote se busca en el maestro en vez de tipearse. */
  llevaLote = false;
  /**
   * Lote elegido en el buscador. Queda en null al editar un ítem que ya tenía lote: el central no
   * devuelve su id, así que mientras no se elija otro se reenvía el número y el central lo conserva.
   */
  loteElegido: LoteDeProducto = null;
  /** Lo que muestra el campo: el número del lote, y su vencimiento y saldo si se acaba de elegir. */
  loteTexto: string = null;

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
    private presentacionService: PresentacionService,
    private loteService: LoteService
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

    this.prepararLotes();

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
      // Sin presentaciones el formulario queda inválido y no deja guardar; el aviso lo da el genérico (#390).
      .pipe(terminarSiFalla(() => this.presentacionList = []), untilDestroyed(this))
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

  /**
   * Con un producto con control de lote, el lote se elige con el buscador genérico. Al separar,
   * la baja se descuenta del lote elegido; sin elegir, el central reparte por vencimiento más próximo.
   */
  private prepararLotes() {
    this.llevaLote = this.selectedProducto?.lote === true;
    if (this.llevaLote) this.loteTexto = this.selectedItem?.lote ?? null;
  }

  /** Abre el buscador genérico de lotes del producto, con el saldo en la sucursal de origen. */
  onBuscarLote() {
    if (this.selectedProducto?.id == null) return;
    this.loteService
      .onBuscarLoteDeProducto(this.selectedProducto.id, this.data?.sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe((lote) => {
        if (lote == null) return;
        this.loteElegido = lote;
        this.loteControl.setValue(lote.numeroLote);
        this.loteTexto = this.textoDeLote(lote);
        // El vencimiento es el del lote: al cambiar de lote no puede quedar el del anterior.
        if (lote.fechaVencimiento != null) {
          this.vencimientoControl.setValue(new Date(lote.fechaVencimiento));
        }
      });
  }

  /** Deja el ítem sin lote: al separar, el central reparte por vencimiento más próximo. */
  onQuitarLote() {
    this.loteElegido = null;
    this.loteControl.setValue(null);
    this.loteTexto = null;
  }

  private textoDeLote(lote: LoteDeProducto): string {
    const partes = [lote.numeroLote];
    if (lote.fechaVencimiento != null) {
      partes.push("vence " + new Date(lote.fechaVencimiento).toLocaleDateString("es-PY"));
    }
    partes.push("saldo " + (lote.saldo ?? 0));
    return partes.join(" · ");
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
    if (this.llevaLote) {
      // Sin elegir uno nuevo viaja solo el número que ya tenía (o nada, si se quitó).
      item.loteId = this.loteElegido?.loteId ?? null;
      item.lote = this.loteControl.value ?? null;
    } else {
      item.lote =
        this.loteControl.value != null
          ? ("" + this.loteControl.value).toUpperCase()
          : null;
    }
    item.motivo =
      this.motivoControl.value != null
        ? ("" + this.motivoControl.value).toUpperCase()
        : null;
    this.matDialogRef.close({ item });
  }
}
