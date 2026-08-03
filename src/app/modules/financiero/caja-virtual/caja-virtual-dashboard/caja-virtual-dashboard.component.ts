import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { Tab } from '../../../../layouts/tab/tab.model';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual,
         CajaVirtualSaldoItem, CuentaBancariaResumen, CajaVirtualConfiguracion } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PageInfo } from '../../../../app.component';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { TransferenciaCajaVirtualDialogComponent } from '../transferencia-caja-virtual-dialog/transferencia-caja-virtual-dialog.component';
import { ConfigurarCajaVirtualDialogComponent } from '../configurar-caja-virtual-dialog/configurar-caja-virtual-dialog.component';
import { RegistrarIngresoDialogComponent } from '../registrar-ingreso-dialog/registrar-ingreso-dialog.component';
import { RegistrarEgresoDialogComponent } from '../registrar-egreso-dialog/registrar-egreso-dialog.component';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { AddEntradaVariaDialogComponent, EntradaVariaDialogData } from '../../entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { ListEntradasVariasDialogComponent } from '../../entrada-varia/list-entradas-varias-dialog/list-entradas-varias-dialog.component';
import { AddOperacionFinancieraDialogComponent } from '../../operacion-financiera/add-operacion-financiera-dialog/add-operacion-financiera-dialog.component';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

// Fila de la tabla de movimientos con campos de display precalculados.
interface MovimientoRow extends MovimientoCajaVirtual {
  _color?: string;
  _anulable?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja-virtual-dashboard',
  templateUrl: './caja-virtual-dashboard.component.html',
  styleUrls: ['./caja-virtual-dashboard.component.scss']
})
export class CajaVirtualDashboardComponent implements OnInit {

  @Input() data: Tab;

  cajaVirtual: CajaVirtual;

  // Sidebar
  saldos: CajaVirtualSaldoItem[] = [];
  resumenBancario: CuentaBancariaResumen[] = [];
  config: CajaVirtualConfiguracion;

  // Movimientos (tabla)
  dataSource = new MatTableDataSource<MovimientoRow>([]);
  isLoading = false;
  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<MovimientoCajaVirtual>;
  displayedColumns = ['creadoEn', 'responsable', 'tipoMovimiento', 'descripcion', 'cantidad', 'saldoPosterior', 'acciones'];

  // Filtros de movimientos
  desdeControl = new FormControl();
  hastaControl = new FormControl();
  tipoControl = new FormControl();
  verAnulaciones = false;
  showFiltros = false;

  puedeGestionar = false;

  tipoMovimientoList = [
    { label: 'Ingreso', value: CajaVirtualTipoMovimiento.INGRESO },
    { label: 'Egreso', value: CajaVirtualTipoMovimiento.EGRESO },
    { label: 'Transf. Entrada', value: CajaVirtualTipoMovimiento.TRANSFERENCIA_ENTRADA },
    { label: 'Transf. Salida', value: CajaVirtualTipoMovimiento.TRANSFERENCIA_SALIDA },
    { label: 'Pago Proveedor', value: CajaVirtualTipoMovimiento.PAGO_PROVEEDOR },
    { label: 'Ajuste', value: CajaVirtualTipoMovimiento.AJUSTE },
  ];

  tipoMovimientoLabels: Record<string, string> = {
    INGRESO: 'Ingreso',
    EGRESO: 'Egreso',
    TRANSFERENCIA_ENTRADA: 'Transf. Entrada',
    TRANSFERENCIA_SALIDA: 'Transf. Salida',
    PAGO_PROVEEDOR: 'Pago Proveedor',
    AJUSTE: 'Ajuste',
  };

  tipoColores: Record<string, string> = {
    INGRESO: '#4caf50',
    EGRESO: '#f44336',
    TRANSFERENCIA_ENTRADA: '#2196f3',
    TRANSFERENCIA_SALIDA: '#ff9800',
    PAGO_PROVEEDOR: '#9c27b0',
    AJUSTE: '#607d8b',
  };

  constructor(
    private cajaVirtualService: CajaVirtualService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.cajaVirtual = this.data?.tabData?.data as CajaVirtual;
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.recargar();
  }

  recargar() {
    this.cargarSaldos();
    this.cargarConfigYBancos();
    this.cargarMovimientos();
  }

  cargarSaldos() {
    if (!this.cajaVirtual?.id) return;
    this.cajaVirtualService.onGetSaldos(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe(res => {
        if (res) this.saldos = res;
      });
  }

  cargarConfigYBancos() {
    if (!this.cajaVirtual?.id) return;
    this.cajaVirtualService.onGetConfiguracion(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe(cfg => {
        this.config = cfg;
        this.cajaVirtualService.onGetResumenBancario(this.cajaVirtual.id)
          .pipe(untilDestroyed(this)).subscribe(res => {
            this.resumenBancario = res || [];
          });
      });
  }

  cargarMovimientos() {
    if (!this.cajaVirtual?.id) return;
    this.isLoading = true;
    this.cajaVirtualService.onGetMovimientosFilter(this.cajaVirtual.id, {
      desde: this.desdeControl.value ? dateToString(this.desdeControl.value) : null,
      fin: this.hastaControl.value ? dateToString(this.hastaControl.value) : null,
      tipo: this.tipoControl.value || null,
      soloActivos: !this.verAnulaciones,
    }, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isLoading = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = (res.getContent || []).map(m => this.toRow(m));
        }
      });
  }

  private toRow(m: MovimientoCajaVirtual): MovimientoRow {
    const row = m as MovimientoRow;
    row._color = this.tipoColores[m.tipoMovimiento as any] || '#607d8b';
    row._anulable = this.puedeGestionar
      && m.tipoMovimiento !== CajaVirtualTipoMovimiento.AJUSTE
      && m.activo !== false;
    return row;
  }

  toggleFiltros() {
    this.showFiltros = !this.showFiltros;
  }

  aplicarFiltros() {
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  limpiarFiltros() {
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
    this.tipoControl.setValue(null);
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  onToggleVerAnulaciones() {
    this.verAnulaciones = !this.verAnulaciones;
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  // ---- Acciones ----

  onIngreso() {
    this.dialog.open(RegistrarIngresoDialogComponent, { width: '440px', data: { cajaVirtual: this.cajaVirtual } })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onEgreso() {
    this.dialog.open(RegistrarEgresoDialogComponent, { width: '440px', data: { cajaVirtual: this.cajaVirtual } })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onTransferencia() {
    this.dialog.open(TransferenciaCajaVirtualDialogComponent, { width: '500px', data: this.cajaVirtual })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onIngresoVario() {
    const dialogData: EntradaVariaDialogData = { cajaVirtual: this.cajaVirtual, esIngreso: true };
    this.dialog.open(AddEntradaVariaDialogComponent, { width: '500px', data: dialogData })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onEgresoVario() {
    const dialogData: EntradaVariaDialogData = { cajaVirtual: this.cajaVirtual, esIngreso: false };
    this.dialog.open(AddEntradaVariaDialogComponent, { width: '500px', data: dialogData })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onOperacionFinanciera() {
    this.dialog.open(AddOperacionFinancieraDialogComponent, { width: '880px', maxWidth: '95vw', maxHeight: '92vh', data: null })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onVerEntradasVarias() {
    this.dialog.open(ListEntradasVariasDialogComponent, {
      width: '95vw', maxWidth: '1200px', height: '85vh', data: this.cajaVirtual
    });
  }

  onConfigurar() {
    this.dialog.open(ConfigurarCajaVirtualDialogComponent, { width: '520px', maxHeight: '90vh', data: { cajaVirtual: this.cajaVirtual } })
      .afterClosed().subscribe(res => { if (res) this.cargarConfigYBancos(); });
  }

  /** Anula un movimiento manual con contra-movimiento. El backend bloquea los de otro módulo y los AJUSTE. */
  onAnular(mov: MovimientoCajaVirtual) {
    if (!mov?.id) return;
    this.dialogosService.confirm(
      'Anular movimiento',
      '¿Anular este movimiento? Se generará un contra-movimiento de ajuste (el original no se borra).',
      mov.descripcion || null, null, true, 'Sí, anular', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.cajaVirtualService.onAnularMovimiento(mov.id)
          .pipe(untilDestroyed(this)).subscribe({
            next: r => {
              if (r != null) {
                this.notificacion.notification$.next({ texto: 'Movimiento anulado', color: NotificacionColor.success, duracion: 3 });
                this.recargar();
              }
            },
            error: err => {
              const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo anular el movimiento';
              this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
            }
          });
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarMovimientos();
  }
}
