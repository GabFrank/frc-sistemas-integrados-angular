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
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { RetiroVerificacionService } from '../../retiro/verificacion/retiro-verificacion.service';
import { VerificarRetiroDialogComponent, VerificarRetiroDialogData } from '../../retiro/verificacion/verificar-retiro-dialog/verificar-retiro-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface IngresarRetiroCajaMayorDialogData {
  cajaVirtual: CajaVirtual;
  /**
   * Retiros ya resueltos por el carrito de escaneo. Cuando vienen, el diálogo arranca
   * mostrando exactamente esos y no el listado de flotantes: si el operador escaneó tres
   * papeles, tiene que ver esos tres, no una página donde quizá ni aparezcan.
   */
  preseleccion?: Retiro[];
}

// Fila de display: clon del retiro (Apollo congela los resultados) + campos derivados.
interface RetiroRow extends Retiro {
  _sel: boolean;
  _montos: string;
  /** PENDIENTE | EN_PROCESO | VERIFICADO. Lo que muestra el chip de la fila. */
  _estadoVerif: string;
  _chipLabel: string;
  _chipColor: string;
  _chipBg: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ingresar-retiro-caja-mayor-dialog',
  templateUrl: './ingresar-retiro-caja-mayor-dialog.component.html',
  styleUrls: ['./ingresar-retiro-caja-mayor-dialog.component.scss']
})
export class IngresarRetiroCajaMayorDialogComponent implements OnInit {

  displayedColumns = ['estado', 'id', 'sucursal', 'cajaSalida', 'montos', 'responsable', 'creadoEn', 'acciones'];
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

  /**
   * true cuando el diálogo se abrió desde el escáner. La tabla muestra lo escaneado; el
   * operador puede pasar al listado completo con "Ver todos los flotantes".
   */
  modoEscaneo = false;

  constructor(
    private dialogRef: MatDialogRef<IngresarRetiroCajaMayorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IngresarRetiroCajaMayorDialogData,
    private retiroService: RetiroService,
    private sucursalService: SucursalService,
    private notificacion: NotificacionSnackbarService,
    private verificacionService: RetiroVerificacionService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.sucursalList = res.filter(s => s.id != 0);
    });
    if (this.data?.preseleccion?.length) {
      this.modoEscaneo = true;
      this.data.preseleccion.forEach(r => {
        const row = { ...r } as RetiroRow;
        row._montos = this.formatMontos(r);
        row._sel = true;
        this.seleccionados.set(`${r.id}_${r.sucursalId}`, row);
      });
      this.mostrarEscaneados();
      return;
    }
    this.cargar();
  }

  /** Pinta en la tabla solo lo que vino del escáner, ya tildado. */
  private mostrarEscaneados() {
    this.dataSource.data = Array.from(this.seleccionados.values());
    this.totalElements = this.dataSource.data.length;
    this.recomputarTotales();
  }

  /** Sale del modo escaneo sin perder lo ya seleccionado. */
  verTodosLosFlotantes() {
    this.modoEscaneo = false;
    this.pageIndex = 0;
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
            this.marcarEstadoVerificacion(row);
            return row;
          });
          this.totalElements = res?.getTotalElements ?? 0;
        },
        error: () => { this.isLoading = false; }
      });
  }

  /**
   * Estado de verificación de la fila.
   *
   * "En proceso" sale del borrador local: alguien empezó a contar este retiro en esta máquina
   * y lo dejó a medias. Es lo que evita que se cuente dos veces por olvido.
   */
  private marcarEstadoVerificacion(row: RetiroRow) {
    // Fondo tenue + texto y borde del color: con diez filas iguales, un fondo sólido
    // saturado es ruido. El acento se lo da el punto de color.
    if (row.movimientoCajaVirtualId != null) {
      row._estadoVerif = 'VERIFICADO';
      row._chipLabel = 'Verificado';
      row._chipColor = '#81c784';
      row._chipBg = 'rgba(102, 187, 106, 0.16)';
      return;
    }
    if (this.verificacionService.hayBorrador(row.id, row.sucursalId)) {
      row._estadoVerif = 'EN_PROCESO';
      row._chipLabel = 'En proceso';
      row._chipColor = '#ffb74d';
      row._chipBg = 'rgba(255, 167, 38, 0.18)';
      return;
    }
    row._estadoVerif = 'PENDIENTE';
    row._chipLabel = 'Pendiente';
    row._chipColor = '#b0bec5';
    row._chipBg = 'rgba(176, 190, 197, 0.14)';
  }

  /** Abre la verificación de un retiro puntual. Es el único camino de ingreso. */
  onProcesar(row: RetiroRow) {
    const data: VerificarRetiroDialogData = {
      retiro: row,
      cajaVirtual: this.data.cajaVirtual,
    };
    this.dialog.open(VerificarRetiroDialogComponent, {
      width: '65vw', height: '70vh', maxWidth: '96vw', disableClose: true, data,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      // Se recarga siempre, no solo al confirmar: cerrar a medias cambia el chip a "En proceso".
      this.cargar();
      if (res) {
        this.notificacion.notification$.next({
          texto: `Retiro #${row.id} verificado e ingresado`,
          color: NotificacionColor.success, duracion: 3,
        });
      }
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
