import { Component, Inject, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { OperacionDevolucionService } from "../operacion-devolucion/operacion-devolucion.service";

export interface AcreditarRetiroDialogData {
  retiroId: number;
  proveedorNombre?: string;
}

interface LineaEditable {
  productoId: number;
  productoDescripcion: string;
  presentaciones: any[];
  presentacionId: number | null;
  factor: number;
  // Canonicos (unidad base) — invariantes de la linea.
  cantidadBase: number;
  costoBase: number;
  // Mostrados en la presentacion elegida (editables).
  cantidad: number;
  costo: number;
  total: number;
}

/**
 * Registra la nota de credito consolidada de un retiro a proveedor. Consolida
 * por producto (a costo medio); el usuario ajusta cantidad/costo/total y puede
 * cambiar la presentacion. Editar el total recalcula el costo.
 */
@UntilDestroy()
@Component({
  selector: "app-acreditar-retiro-dialog",
  templateUrl: "./acreditar-retiro-dialog.component.html",
  styleUrls: ["./acreditar-retiro-dialog.component.scss"],
})
export class AcreditarRetiroDialogComponent implements OnInit {
  cargando = false;
  procesando = false;
  proveedorNombre = "";
  nroNotaCredito = "";
  // Fecha con datepicker (DD/MM/AAAA segun locale del proyecto). Por defecto hoy.
  fechaControl = new FormControl<Date | null>(new Date());
  lineas: LineaEditable[] = [];
  montoTotal = 0;
  puedeConfirmar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AcreditarRetiroDialogData,
    private dialogRef: MatDialogRef<AcreditarRetiroDialogComponent>,
    private operacionService: OperacionDevolucionService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.proveedorNombre = this.data.proveedorNombre || "";
    this.cargar();
  }

  private cargar(): void {
    this.cargando = true;
    this.operacionService
      .onGetAcreditacionPreview(this.data.retiroId)
      .pipe(untilDestroyed(this))
      .subscribe(
        (res: any) => {
          this.cargando = false;
          if (res == null) return;
          if (!this.proveedorNombre) {
            this.proveedorNombre = res.proveedor?.persona?.nombre || "";
          }
          this.lineas = (res.lineas || []).map((l: any) => this.mapLinea(l));
          this.recalcularMonto();
        },
        () => (this.cargando = false)
      );
  }

  private mapLinea(l: any): LineaEditable {
    const presentaciones = (l.presentaciones || [])
      .slice()
      .sort((a: any, b: any) => (a.cantidad || 1) - (b.cantidad || 1));
    const cantidadBase = l.cantidadBase || 0;
    // Presentacion base por defecto (principal, o factor 1, o la primera).
    // Solo sirve la que divide exacto lo devuelto: con la principal x100 y 10
    // unidades devueltas la nota de credito arrancaba en 0,1 — cantidad
    // fraccionaria que el operador tenia que corregir a mano.
    const divideExacto = (p: any) =>
      cantidadBase % (p?.cantidad || 1) === 0;
    const base =
      [
        presentaciones.find((p: any) => p.principal),
        presentaciones.find((p: any) => (p.cantidad || 1) === 1),
        presentaciones[0],
      ].find((p: any) => p != null && divideExacto(p)) ||
      presentaciones.find((p: any) => (p.cantidad || 1) === 1) ||
      presentaciones[0];
    const factor = base?.cantidad || 1;
    const costoBase = l.costoMedio || 0;
    return {
      productoId: l.productoId,
      productoDescripcion: l.productoDescripcion,
      presentaciones,
      presentacionId: base?.id ?? null,
      factor,
      cantidadBase,
      costoBase,
      cantidad: factor ? cantidadBase / factor : cantidadBase,
      costo: costoBase * factor,
      total: cantidadBase * costoBase,
    };
  }

  onCantidadChange(l: LineaEditable): void {
    l.cantidad = this.num(l.cantidad);
    l.total = l.cantidad * l.costo;
    l.cantidadBase = l.cantidad * l.factor;
    this.recalcularMonto();
  }

  onCostoChange(l: LineaEditable): void {
    l.costo = this.num(l.costo);
    l.total = l.cantidad * l.costo;
    l.costoBase = l.factor ? l.costo / l.factor : l.costo;
    this.recalcularMonto();
  }

  onTotalChange(l: LineaEditable): void {
    l.total = this.num(l.total);
    if (l.cantidad > 0) {
      l.costo = l.total / l.cantidad;
      l.costoBase = l.factor ? l.costo / l.factor : l.costo;
    }
    this.recalcularMonto();
  }

  onPresentacionChange(l: LineaEditable): void {
    const pres = l.presentaciones.find((p: any) => p.id === +l.presentacionId!);
    const factor = pres?.cantidad || 1;
    l.factor = factor;
    // Se conserva el invariante en unidad base: total no cambia.
    l.cantidad = factor ? l.cantidadBase / factor : l.cantidadBase;
    l.costo = l.costoBase * factor;
    l.total = l.cantidad * l.costo;
    this.recalcularMonto();
  }

  private recalcularMonto(): void {
    this.montoTotal = this.lineas.reduce((acc, l) => acc + (l.total || 0), 0);
    this.actualizarValidez();
  }

  /** Recalcula la validez (campo, no getter: evita re-evaluacion en el template).
      El nro de nota es OPCIONAL: solo requiere lineas con cantidad valida. */
  actualizarValidez(): void {
    this.puedeConfirmar =
      !this.procesando &&
      this.lineas.length > 0 &&
      this.lineas.every((l) => l.cantidad > 0);
  }

  private num(v: any): number {
    const n = typeof v === "number" ? v : parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  onConfirmar(): void {
    if (!this.puedeConfirmar) return;
    const items = this.lineas.map((l) => ({
      productoId: l.productoId,
      presentacionId: l.presentacionId,
      cantidad: l.cantidad,
      costoUnitario: l.costo,
      cantidadBase: l.cantidadBase,
      total: l.total,
    }));
    this.procesando = true;
    this.actualizarValidez();
    const nro = this.nroNotaCredito?.trim();
    const fecha = this.fechaControl.value ? dateToString(this.fechaControl.value) : null;
    this.operacionService
      .onAcreditarRetiro(
        this.data.retiroId,
        nro ? nro.toUpperCase() : null,
        fecha,
        items
      )
      .pipe(untilDestroyed(this))
      .subscribe(
        (r: any) => {
          this.procesando = false;
          if (r != null) {
            this.notificacion.openSucess("Nota de crédito registrada");
            this.dialogRef.close(true);
          }
        },
        () => {
          this.procesando = false;
          this.actualizarValidez();
        }
      );
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
