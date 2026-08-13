import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin } from 'rxjs';
import { CajaVirtual } from '../caja-virtual.model';
import { Retiro } from '../../retiro/retiro.model';
import { RetiroService } from '../../retiro/retiro.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface IngresarRetiroCajaMayorDialogData {
  cajaVirtual: CajaVirtual;
}

// Fila de display: clon del retiro (Apollo congela los resultados) + campos derivados.
interface RetiroRow extends Retiro {
  sucursal?: { nombre?: string };
  _sel: boolean;
  _montos: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ingresar-retiro-caja-mayor-dialog',
  templateUrl: './ingresar-retiro-caja-mayor-dialog.component.html',
  styleUrls: ['./ingresar-retiro-caja-mayor-dialog.component.scss']
})
export class IngresarRetiroCajaMayorDialogComponent implements OnInit {

  displayedColumns = ['sel', 'id', 'sucursal', 'cajaSalida', 'montos', 'responsable', 'creadoEn'];
  dataSource = new MatTableDataSource<RetiroRow>([]);

  sucursalControl = new FormControl(null);
  cajaControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);
  sucursalList: Sucursal[] = [];

  // Selección multi por clave `${id}_${sucursalId}`.
  seleccionados = new Map<string, RetiroRow>();

  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;

  isLoading = false;
  isSaving = false;

  constructor(
    private dialogRef: MatDialogRef<IngresarRetiroCajaMayorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IngresarRetiroCajaMayorDialogData,
    private retiroService: RetiroService,
    private sucursalService: SucursalService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.sucursalList = res.filter(s => s.id != 0);
    });
    this.cargar();
  }

  cargar() {
    this.isLoading = true;
    const sucId = this.sucursalControl.value?.id ?? null;
    const cajaId = this.cajaControl.value ? Number(this.cajaControl.value) : null;
    const desde = this.desdeControl.value ? dateToString(this.desdeControl.value) : null;
    const hasta = this.hastaControl.value ? dateToString(this.hastaControl.value) : null;
    this.retiroService.onGetFlotantes(sucId, cajaId, desde, hasta, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isLoading = false;
          const content = res?.getContent ?? [];
          // Clonar cada fila (Apollo congela los resultados en dev) + campos de display.
          this.dataSource.data = content.map((r: Retiro) => {
            const row = { ...r } as RetiroRow;
            row._montos = this.formatMontos(r);
            row._sel = this.seleccionados.has(`${r.id}_${r.sucursalId}`);
            return row;
          });
          this.totalElements = res?.getTotalElements ?? 0;
        },
        error: () => { this.isLoading = false; }
      });
  }

  onFiltroChange() {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiarFiltros() {
    this.sucursalControl.reset();
    this.cajaControl.reset();
    this.desdeControl.reset();
    this.hastaControl.reset();
    this.onFiltroChange();
  }

  onPage(ev: any) {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.cargar();
  }

  private formatMontos(r: Retiro): string {
    const partes: string[] = [];
    const fmt = (n: number) => Math.round(n).toLocaleString('es-PY');
    if (r.retiroGs) partes.push(`${fmt(r.retiroGs)} Gs`);
    if (r.retiroRs) partes.push(`${r.retiroRs.toLocaleString('es-PY')} R$`);
    if (r.retiroDs) partes.push(`${r.retiroDs.toLocaleString('es-PY')} US$`);
    return partes.length ? partes.join(' · ') : '—';
  }

  cantidadSeleccionada = 0;
  totalGs = 0;
  totalRs = 0;
  totalDs = 0;

  toggle(row: RetiroRow) {
    const k = `${row.id}_${row.sucursalId}`;
    if (row._sel) this.seleccionados.set(k, row);
    else this.seleccionados.delete(k);
    this.recomputarTotales();
  }

  private recomputarTotales() {
    let gs = 0, rs = 0, ds = 0;
    this.seleccionados.forEach(r => {
      gs += r.retiroGs || 0;
      rs += r.retiroRs || 0;
      ds += r.retiroDs || 0;
    });
    this.cantidadSeleccionada = this.seleccionados.size;
    this.totalGs = gs;
    this.totalRs = rs;
    this.totalDs = ds;
  }

  onIngresar() {
    if (this.seleccionados.size === 0) return;
    const caja = this.data.cajaVirtual;
    const items = Array.from(this.seleccionados.values());

    this.isSaving = true;
    forkJoin(
      items.map(r => this.retiroService.onIngresarACajaMayor(r.id, r.sucursalId, caja.id))
    ).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isSaving = false;
        this.notificacion.openSucess(`${items.length} retiro(s) ingresado(s) a ${caja.nombre}`);
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        this.notificacion.openAlgoSalioMal(err?.message || 'Error al ingresar los retiros');
      }
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
