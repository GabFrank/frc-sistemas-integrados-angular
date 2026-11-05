import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { fechaParam } from '../../../productos/precio-especial/precio-especial.util';
import { Producto } from '../../../productos/producto/producto.model';
import {
  PdvSearchProductoData, PdvSearchProductoDialogComponent, PdvSearchProductoResponseData,
} from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { ModoParticipacionSorteo, Sorteo, SorteoInput } from '../sorteo.model';
import { SorteoService } from '../sorteo.service';
import { ayudaTickets, MODO_SORTEO_TEXTO } from '../sorteo.util';

export interface SorteoDialogData {
  /** null = alta. */
  sorteo: Sorteo | null;
}

@UntilDestroy()
@Component({
  selector: 'app-sorteo-dialog',
  templateUrl: './sorteo-dialog.component.html',
  styleUrls: ['./sorteo-dialog.component.scss'],
})
export class SorteoDialogComponent implements OnInit {
  modos = Object.keys(MODO_SORTEO_TEXTO).map((valor) => ({ valor, texto: MODO_SORTEO_TEXTO[valor] }));
  editando: Sorteo | null = null;
  /** El sorteo ya tiene participaciones: las reglas no se tocan. */
  bloqueado = false;
  sucursalList: Sucursal[] = [];
  /** Opciones del selector. `fija`: ya participaba y el sorteo tiene participaciones (no se quita). */
  sucursalOpciones: { id: number; nombre: string; fija: boolean }[] = [];
  /** Sucursales y "todas" con las que se abrió la edición: con participaciones solo se agregan. */
  private sucursalesOriginales = new Set<number>();
  todasOriginal = false;
  sucursalesFallo = false;
  ayuda = '';

  form = new FormGroup({
    nombre: new FormControl<string>('', [Validators.required, Validators.maxLength(120)]),
    descripcion: new FormControl<string>(''),
    montoMinimo: new FormControl<number>(null, [Validators.required, Validators.min(1)]),
    modoParticipacion: new FormControl<ModoParticipacionSorteo>('UNA_POR_VENTA', Validators.required),
    cantidadFija: new FormControl<number>(null),
    topePorVenta: new FormControl<number>(null),
    incluyeTarjeta: new FormControl<boolean>(true),
    fechaDesde: new FormControl<Date>(null),
    fechaHasta: new FormControl<Date>(null),
    fechaSorteo: new FormControl<Date>(null, Validators.required),
    todasSucursales: new FormControl<boolean>(true),
    sucursales: new FormControl<number[]>([]),
    premios: new FormArray<FormGroup>([]),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SorteoDialogData,
    private matDialogRef: MatDialogRef<SorteoDialogComponent>,
    private matDialog: MatDialog,
    private service: SorteoService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  get premios(): FormArray<FormGroup> {
    return this.form.controls.premios;
  }

  ngOnInit(): void {
    this.editando = this.data?.sorteo ?? null;
    this.cargarSucursales();
    if (this.editando) this.cargarEdicion(this.editando);

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarAyuda());
    this.form.controls.todasSucursales.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarSucursales());
    this.form.controls.modoParticipacion.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.actualizarValidadoresModo());
    this.actualizarValidadoresModo();
    this.actualizarSucursales();
    this.actualizarAyuda();
  }

  private cargarEdicion(s: Sorteo): void {
    this.bloqueado = !!s.tieneParticipaciones;
    this.form.patchValue({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      montoMinimo: s.montoMinimo,
      modoParticipacion: s.modoParticipacion,
      cantidadFija: s.cantidadFija,
      topePorVenta: s.topePorVenta,
      incluyeTarjeta: s.incluyeTarjeta !== false,
      fechaDesde: s.fechaDesde ? stringToLocalDate(s.fechaDesde) : null,
      fechaHasta: s.fechaHasta ? stringToLocalDate(s.fechaHasta) : null,
      fechaSorteo: s.fechaSorteo ? stringToLocalDate(s.fechaSorteo) : null,
      todasSucursales: !!s.todasSucursales,
      sucursales: (s.sucursales ?? []).map((x) => Number(x.id)),
    }, { emitEvent: false });
    (s.premios ?? []).forEach((p) => this.premios.push(this.nuevoPremio(p.descripcion, p.producto ?? null, p.cantidad)));
    this.sucursalesOriginales = new Set((s.sucursales ?? []).map((x) => Number(x.id)));
    this.todasOriginal = !!s.todasSucursales;
    if (this.bloqueado) {
      ['montoMinimo', 'modoParticipacion', 'cantidadFija', 'topePorVenta', 'incluyeTarjeta']
        .forEach((c) => this.form.get(c).disable({ emitEvent: false }));
      // Las sucursales solo crecen: si ya era para todas, queda así.
      if (this.todasOriginal) this.form.controls.todasSucursales.disable({ emitEvent: false });
    }
    this.armarOpciones();
  }

  cargarSucursales(): void {
    this.sucursalesFallo = false;
    this.sucursalService
      .onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true })
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.sucursalesFallo = true;
        this.notificacionService.openWarn('No se pudieron cargar las sucursales: usá «Reintentar».', 5);
      }, next: (res) => {
        if (res == null) {
          this.sucursalesFallo = true; // error del servidor: ya se avisó
          return;
        }
        this.sucursalList = res.filter((s) => Number(s.id) !== 0);
        this.armarOpciones();
      } });
  }

  private armarOpciones(): void {
    this.sucursalOpciones = this.sucursalList.map((s) => ({
      id: Number(s.id),
      nombre: s.nombre,
      fija: this.bloqueado && this.sucursalesOriginales.has(Number(s.id)),
    }));
  }

  /** "Todas" deshabilita el selector. Con participaciones se pueden sumar sucursales, no quitar. */
  private actualizarSucursales(): void {
    const ctrl = this.form.controls.sucursales;
    if (this.form.controls.todasSucursales.value) ctrl.disable({ emitEvent: false });
    else ctrl.enable({ emitEvent: false });
  }

  private actualizarValidadoresModo(): void {
    const modo = this.form.controls.modoParticipacion.value;
    const fija = this.form.controls.cantidadFija;
    fija.setValidators(modo === 'CANTIDAD_FIJA' ? [Validators.required, Validators.min(1)] : []);
    fija.updateValueAndValidity({ emitEvent: false });
    const tope = this.form.controls.topePorVenta;
    tope.setValidators(modo === 'POR_MULTIPLO' ? [Validators.min(1)] : []);
    tope.updateValueAndValidity({ emitEvent: false });
  }

  private actualizarAyuda(): void {
    const v = this.form.getRawValue();
    this.ayuda = ayudaTickets(v.modoParticipacion, v.montoMinimo, v.cantidadFija, v.topePorVenta);
  }

  private nuevoPremio(descripcion: string | null, producto: Producto | null, cantidad: number): FormGroup {
    return new FormGroup({
      descripcion: new FormControl<string>(descripcion ?? ''),
      producto: new FormControl<Producto>(producto),
      cantidad: new FormControl<number>(cantidad, [Validators.required, Validators.min(1)]),
    });
  }

  onAgregarPremio(): void {
    this.premios.push(this.nuevoPremio('', null, 1));
  }

  onQuitarPremio(i: number): void {
    this.premios.removeAt(i);
  }

  onQuitarProducto(i: number): void {
    this.premios.at(i).controls['producto'].setValue(null);
  }

  /** Reusa el buscador de productos del sistema (el mismo del análisis de costos). */
  onElegirProducto(i: number): void {
    const data: PdvSearchProductoData = {
      mostrarOpciones: false,
      mostrarStock: false,
      conservarUltimaBusqueda: true,
      modoSeleccionMultiple: false,
      productosSeleccionados: [],
    };
    this.matDialog.open(PdvSearchProductoDialogComponent, { data, width: '75%', height: '85%', maxWidth: '95vw' })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        const producto = res?.productos?.length ? res.productos[0] : res?.producto;
        if (!producto) return;
        const premio = this.premios.at(i);
        premio.controls['producto'].setValue(producto);
        if (!premio.controls['descripcion'].value) premio.controls['descripcion'].setValue(producto.descripcion);
      });
  }

  /** Cada premio necesita una descripción o un producto; hace falta al menos un premio. */
  get premiosValidos(): boolean {
    return this.premios.length > 0 && this.premios.controls.every((p) =>
      p.valid && (!!(p.value.descripcion || '').trim() || !!p.value.producto));
  }

  get puedeGuardar(): boolean {
    return this.form.valid && this.premiosValidos && (this.form.getRawValue().todasSucursales
      || (this.form.getRawValue().sucursales ?? []).length > 0);
  }

  onGuardar(): void {
    if (!this.puedeGuardar) return;
    const v = this.form.getRawValue();
    const input: SorteoInput = {
      id: this.editando ? Number(this.editando.id) : null,
      nombre: (v.nombre || '').trim(),
      descripcion: (v.descripcion || '').trim() || null,
      montoMinimo: Number(v.montoMinimo),
      modoParticipacion: v.modoParticipacion,
      cantidadFija: v.modoParticipacion === 'CANTIDAD_FIJA' ? Number(v.cantidadFija) : null,
      topePorVenta: v.modoParticipacion === 'POR_MULTIPLO' && v.topePorVenta ? Number(v.topePorVenta) : null,
      incluyeTarjeta: !!v.incluyeTarjeta,
      fechaDesde: fechaParam(v.fechaDesde),
      fechaHasta: fechaParam(v.fechaHasta),
      fechaSorteo: fechaParam(v.fechaSorteo),
      todasSucursales: !!v.todasSucursales,
      sucursalIds: v.todasSucursales ? [] : Array.from(new Set((v.sucursales ?? []).map(Number))),
      premios: v.premios.map((p) => ({
        descripcion: (p.descripcion || '').trim() || null,
        productoId: p.producto ? Number(p.producto.id) : null,
        cantidad: Number(p.cantidad),
      })),
    };
    // onSaveCustom ya muestra el éxito y los errores del servidor.
    this.service.onGuardar(input).pipe(untilDestroyed(this)).subscribe({
      next: (res) => res != null && this.matDialogRef.close(true),
    });
  }

  onCancelar(): void {
    this.matDialogRef.close(false);
  }
}
