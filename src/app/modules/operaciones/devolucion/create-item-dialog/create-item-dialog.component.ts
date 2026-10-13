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
import { EstadoLote, LoteDeProducto } from "../../lote/lote.model";
import { LoteService } from "../../lote/lote.service";

/** Un lote del producto, con el texto que muestra el selector ya armado. */
interface OpcionLote {
  lote: LoteDeProducto;
  texto: string;
}

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
  /** Lote del maestro elegido, para productos con control de lote. null = sin elegir. */
  loteElegidoControl = new FormControl<OpcionLote>(null);
  motivoControl = new FormControl(null);

  /** El producto lleva control de lote: el lote se elige del maestro en vez de tipearse. */
  llevaLote = false;
  opcionesLote: OpcionLote[] = [];
  cargandoLotes = false;

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
   * Con un producto con control de lote, trae sus lotes con el saldo en la sucursal de origen.
   * Al separar, la baja se descuenta del lote elegido; sin elegir, el central reparte por
   * vencimiento más próximo.
   */
  private prepararLotes() {
    this.llevaLote = this.selectedProducto?.lote === true;
    if (!this.llevaLote || this.selectedProducto?.id == null) return;

    // Elegir un lote trae su vencimiento, si el campo está vacío.
    this.loteElegidoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((opcion) => {
        if (opcion?.lote?.fechaVencimiento != null && this.vencimientoControl.value == null) {
          this.vencimientoControl.setValue(new Date(opcion.lote.fechaVencimiento));
        }
      });

    this.cargandoLotes = true;
    this.loteService
      .onBuscarLotesDeProducto(this.selectedProducto.id, this.data?.sucursalId, null, 0, 100)
      .pipe(terminarSiFalla(() => (this.cargandoLotes = false)), untilDestroyed(this))
      .subscribe((res) => {
        this.cargandoLotes = false;
        this.opcionesLote = (res?.getContent ?? []).map((lote) => ({
          lote,
          texto: this.textoDeLote(lote),
        }));
        // Al editar, el lote se vuelve a marcar por su número: el central no devuelve el id.
        const numero = this.selectedItem?.lote;
        if (numero != null) {
          const actual = this.opcionesLote.find((o) => o.lote.numeroLote === numero);
          if (actual != null) this.loteElegidoControl.setValue(actual, { emitEvent: false });
        }
      });
  }

  private textoDeLote(lote: LoteDeProducto): string {
    const partes = [lote.numeroLote];
    if (lote.fechaVencimiento != null) {
      partes.push("vence " + new Date(lote.fechaVencimiento).toLocaleDateString("es-PY"));
    }
    partes.push("saldo " + (lote.saldo ?? 0));
    if (lote.estado != null && lote.estado !== EstadoLote.LIBERADO) partes.push("" + lote.estado);
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
    // Con los lotes a medio cargar todavía no se sabe cuál estaba elegido: guardar lo borraría.
    if (this.formGroup.invalid || this.cargandoLotes) return;
    let item = new DevolucionItem();
    Object.assign(item, this.selectedItem);
    item.producto = this.selectedProducto;
    item.presentacion = this.presentacionControl.value;
    item.cantidad = this.cantidadControl.value;
    item.motivoAveria = this.motivoAveriaControl.value;
    item.costoUnitario = this.costoUnitarioControl.value;
    item.vencimiento = this.vencimientoControl.value;
    if (this.llevaLote) {
      const elegido = this.loteElegidoControl.value?.lote;
      item.loteId = elegido?.loteId ?? null;
      item.lote = elegido?.numeroLote ?? null;
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
