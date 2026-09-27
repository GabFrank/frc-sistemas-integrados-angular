import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
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
import { estadoPrecioEspecial, fechaParam, idsSucursalesSeleccionadas } from '../precio-especial.util';

export class PrecioEspecialDialogData {
  precio: PrecioPorSucursal;
  presentacion: Presentacion;
  costoMedio?: number;
}

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
  dataSource = new MatTableDataSource<PrecioEspecialSucursal>([]);
  displayedColumns = ['sucursal', 'precio', 'vigencia', 'estado', 'acciones'];
  /** Especial que se esta editando; null = alta. */
  editando: PrecioEspecialSucursal = null;
  hoy = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PrecioEspecialDialogData,
    private matDialogRef: MatDialogRef<PrecioEspecialDialogComponent>,
    private service: PrecioEspecialService,
    private sucursalService: SucursalService,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe((res) => {
      this.sucursalList = (res || []).filter((s) => Number(s.id) !== 0);
    });
    this.cargar();
  }

  cargar(): void {
    this.service.onPorPrecio(this.data.precio.id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.dataSource.data = res || [];
    });
  }

  estado(e: PrecioEspecialSucursal) {
    return estadoPrecioEspecial(e, this.hoy);
  }

  vigencia(e: PrecioEspecialSucursal): string {
    const f = (v: string) => (v ? stringToLocalDate(v).toLocaleDateString('es-PY') : null);
    return `${f(e.fechaDesde) ?? 'siempre'} → ${f(e.fechaHasta) ?? 'sin fin'}`;
  }

  onEditar(e: PrecioEspecialSucursal): void {
    this.editando = e;
    this.sucursalControl.setValue(this.sucursalList.filter((s) => Number(s.id) === Number(e.sucursal?.id)));
    this.sucursalControl.disable();
    this.precioControl.setValue(e.precio);
    this.desdeControl.setValue(e.fechaDesde ? stringToLocalDate(e.fechaDesde) : null);
    this.hastaControl.setValue(e.fechaHasta ? stringToLocalDate(e.fechaHasta) : null);
  }

  onNuevo(): void {
    this.editando = null;
    this.sucursalControl.enable();
    this.sucursalControl.setValue([]);
    this.precioControl.setValue(null);
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
  }

  onCortar(e: PrecioEspecialSucursal): void {
    this.dialogosService
      .confirm('Cortar precio especial', `¿Cortar el precio especial de ${e.sucursal?.nombre}?`,
        'La sucursal vuelve al precio global desde el próximo escaneo.')
      .pipe(untilDestroyed(this))
      .subscribe((ok) => {
        if (ok) this.service.onCortar(e.id).pipe(untilDestroyed(this)).subscribe(() => this.cargar());
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
}
