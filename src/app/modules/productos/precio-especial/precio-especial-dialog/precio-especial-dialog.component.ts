import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Presentacion } from '../../presentacion/presentacion.model';
import { evaluarMargenPrecio, MARGEN_MINIMO_PORCENTAJE } from '../../precio-por-sucursal/margen-precio.util';
import { PrecioPorSucursal } from '../../precio-por-sucursal/precio-por-sucursal.model';
import { PrecioEspecialSucursal } from '../precio-especial.model';
import { PrecioEspecialService } from '../precio-especial.service';
import { EstadoPrecioEspecial, estadoPrecioEspecial, fechaParam, idsSucursalesSeleccionadas } from '../precio-especial.util';

export class PrecioEspecialDialogData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
  costoMedio?: number;
  /** Nombre del producto, para el encabezado. */
  productoDescripcion?: string;
}

/** Fila de la lista ya resuelta: el template no llama funciones (regla del repo). */
interface FilaEspecial {
  especial: PrecioEspecialSucursal;
  sucursal: string;
  vigencia: string;
  estado: EstadoPrecioEspecial;
  estadoTexto: string;
}

type NivelMargen = 'ok' | 'bajo' | 'negativo' | 'sin-costo';

const ESTADO_TEXTO: Record<EstadoPrecioEspecial, string> = {
  VIGENTE: 'Vigente',
  PROGRAMADO: 'Programado',
  VENCIDO: 'Vencido',
  CORTADO: 'Cortado',
};

@UntilDestroy()
@Component({
  selector: 'app-precio-especial-dialog',
  templateUrl: './precio-especial-dialog.component.html',
  styleUrls: ['./precio-especial-dialog.component.scss'],
})
export class PrecioEspecialDialogComponent implements OnInit {
  sucursalControl = new FormControl<(Sucursal | null)[]>([], Validators.required);
  precioControl = new FormControl<number>(null, [Validators.required, Validators.min(1)]);
  desdeControl = new FormControl<Date>(null);
  hastaControl = new FormControl<Date>(null);
  sucursalList: Sucursal[] = [];
  filas: FilaEspecial[] = [];
  vigentes = 0;
  /** Especial que se esta editando; null = alta. */
  editando: PrecioEspecialSucursal = null;
  editandoSucursal = '';

  // Encabezado, calculado una vez.
  titulo = '';
  presentacionTexto = '';
  tipoPrecioTexto = '';
  esPrincipal = false;
  precioGlobal: number = null;

  // Comparador: se recalcula con cada cambio del precio.
  precioEspecial: number = null;
  descuentoPorcentaje: number = null;
  margenPorcentaje: number = null;
  nivelMargen: NivelMargen = 'sin-costo';
  margenMinimo = MARGEN_MINIMO_PORCENTAJE;

  // Texto del selector de sucursales.
  sucursalesResumen = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PrecioEspecialDialogData,
    private matDialogRef: MatDialogRef<PrecioEspecialDialogComponent>,
    private service: PrecioEspecialService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    const p = this.data.presentacion;
    this.titulo = this.data.productoDescripcion || p?.producto?.descripcion || 'Precio especial';
    const cantidad = p?.cantidad != null ? ` ×${p.cantidad}` : '';
    this.presentacionTexto = `${this.capitalizar(p?.descripcion) || 'Presentación'}${cantidad}`;
    this.tipoPrecioTexto = this.data.precio?.tipoPrecio?.descripcion || '';
    this.esPrincipal = !!this.data.precio?.principal;
    this.precioGlobal = this.data.precio?.precio ?? null;

    this.precioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarComparador());
    this.sucursalControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarResumenSucursales());
    this.actualizarComparador();

    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = (res || []).filter((s) => Number(s.id) !== 0);
    });
    this.cargar();
  }

  cargar(): void {
    this.service.onPorPrecio(this.data.precio.id).pipe(untilDestroyed(this)).subscribe((res) => {
      const hoy = new Date();
      this.filas = (res || []).map((e) => {
        const estado = estadoPrecioEspecial(e, hoy);
        return {
          especial: e,
          sucursal: `${e.sucursal?.id} · ${this.capitalizar(e.sucursal?.nombre)}`,
          vigencia: this.textoVigencia(e),
          estado,
          estadoTexto: ESTADO_TEXTO[estado],
        };
      });
      this.vigentes = this.filas.filter((f) => f.estado === 'VIGENTE').length;
    });
  }

  onEditar(fila: FilaEspecial): void {
    const e = fila.especial;
    this.editando = e;
    this.editandoSucursal = fila.sucursal;
    this.sucursalControl.setValue(this.sucursalList.filter((s) => Number(s.id) === Number(e.sucursal?.id)));
    this.sucursalControl.disable();
    this.precioControl.setValue(e.precio);
    this.desdeControl.setValue(e.fechaDesde ? stringToLocalDate(e.fechaDesde) : null);
    this.hastaControl.setValue(e.fechaHasta ? stringToLocalDate(e.fechaHasta) : null);
  }

  onNuevo(): void {
    this.editando = null;
    this.editandoSucursal = '';
    this.sucursalControl.enable();
    this.sucursalControl.setValue([]);
    this.precioControl.setValue(null);
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
  }

  onCortar(fila: FilaEspecial): void {
    const e = fila.especial;
    this.dialogosService
      .confirm('Cortar precio especial', `¿Cortar el precio especial de ${fila.sucursal}?`,
        'La sucursal vuelve al precio global desde el próximo escaneo.')
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) this.service.onCortar(e.id).pipe(untilDestroyed(this)).subscribe({ next: () => this.cargar(), error: () => {} });
      });
  }

  onGuardar(): void {
    if (this.precioControl.invalid || (!this.editando && this.ids().length === 0)) return;
    const evaluacion = evaluarMargenPrecio(Number(this.precioControl.value), this.data.costoMedio, this.data.presentacion?.cantidad);
    if (evaluacion?.debeAvisar) {
      this.dialogosService
        .confirm('Margen por debajo del mínimo',
          `El precio especial deja un margen de ${evaluacion.margenPorcentaje.toFixed(1).replace('.', ',')}% sobre el costo.`,
          `Se espera un margen mínimo de ${MARGEN_MINIMO_PORCENTAJE}%.`)
        .pipe(untilDestroyed(this))
        .subscribe((ok) => ok && this.guardar());
      return;
    }
    this.guardar();
  }

  private ids(): number[] {
    return idsSucursalesSeleccionadas(this.sucursalControl.value || [], this.sucursalList);
  }

  private guardar(): void {
    const precio = Number(this.precioControl.value);
    const desde = fechaParam(this.desdeControl.value);
    const hasta = fechaParam(this.hastaControl.value);
    // Tipado explicito: onEditar y onCrear devuelven Observable<T> con T distinto, y la union de
    // sus overloads de subscribe no es invocable con un objeto {next, error} sin este cast.
    const op: Observable<any> = this.editando
      ? this.service.onEditar(this.editando.id, precio, desde, hasta)
      : this.service.onCrear({ precioId: Number(this.data.precio.id), sucursalIds: this.ids(), precio, fechaDesde: desde, fechaHasta: hasta });
    op.pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        if (res != null) {
          this.onNuevo();
          this.cargar();
        }
      },
      // onSaveCustom ya mostro el error de negocio (superposicion, rol) en un snackbar.
      error: () => {},
    });
  }

  onCerrar(): void {
    this.matDialogRef.close(true);
  }

  private actualizarComparador(): void {
    const valor = Number(this.precioControl.value);
    this.precioEspecial = valor > 0 ? valor : null;
    this.descuentoPorcentaje = this.precioEspecial != null && this.precioGlobal > 0
      ? ((this.precioEspecial - this.precioGlobal) / this.precioGlobal) * 100
      : null;
    const evaluacion = this.precioEspecial != null
      ? evaluarMargenPrecio(this.precioEspecial, this.data.costoMedio, this.data.presentacion?.cantidad)
      : null;
    this.margenPorcentaje = evaluacion?.margenPorcentaje ?? null;
    this.nivelMargen = evaluacion == null ? 'sin-costo'
      : evaluacion.margenPorcentaje < 0 ? 'negativo'
      : evaluacion.debeAvisar ? 'bajo' : 'ok';
  }

  private actualizarResumenSucursales(): void {
    const seleccion = this.sucursalControl.value || [];
    if (seleccion.includes(null)) {
      this.sucursalesResumen = `Todas (${this.sucursalList.length})`;
      return;
    }
    const nombres = seleccion.filter((s) => s != null).map((s) => `${s.id} · ${this.capitalizar(s.nombre)}`);
    this.sucursalesResumen = nombres.length <= 2 ? nombres.join(', ') : `${nombres.slice(0, 2).join(', ')} y ${nombres.length - 2} más`;
  }

  private textoVigencia(e: PrecioEspecialSucursal): string {
    const f = (v: string) => (v ? stringToLocalDate(v).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null);
    const desde = f(e.fechaDesde);
    const hasta = f(e.fechaHasta);
    if (!desde && !hasta) return 'Sin fechas';
    if (desde && !hasta) return `Desde el ${desde}`;
    if (!desde && hasta) return `Hasta el ${hasta}`;
    return `${desde} al ${hasta}`;
  }

  private capitalizar(texto: string): string {
    return (texto || '').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  }
}
