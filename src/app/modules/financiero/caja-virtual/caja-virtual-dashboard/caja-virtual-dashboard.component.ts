import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
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
import { OperacionFinancieraService } from '../../operacion-financiera/operacion-financiera.service';
import { MovimientoBancario } from '../../operacion-financiera/operacion-financiera.model';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

// Fila de la tabla de movimientos con campos de display precalculados.
interface MovimientoRow extends MovimientoCajaVirtual {
  _color?: string;
  _anulable?: boolean;
  // Agrupación visual de las patas de una misma operación financiera (mismo referenciaId).
  _opGrupo?: number | null;   // referenciaId de la op, o null si no es op financiera
  _opColor?: string;          // color del acento lateral del grupo
  _grupoInicio?: boolean;     // primera fila del grupo consecutivo
  _grupoFin?: boolean;        // última fila del grupo consecutivo
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
  selectedPageInfo: PageInfo<MovimientoCajaVirtual> | any;
  displayedColumns = ['creadoEn', 'responsable', 'tipoMovimiento', 'descripcion', 'cantidad', 'saldoPosterior', 'acciones'];

  // Fuente de la tabla: caja mayor o una cuenta bancaria (los movimientos de banco no
  // ocurren en la caja mayor; el selector permite verlos sin salir del dashboard).
  fuentes: { label: string; tipo: 'CAJA' | 'BANCO'; cuentaId: number | null }[] =
    [{ label: 'Caja Mayor', tipo: 'CAJA', cuentaId: null }];
  fuenteSel = this.fuentes[0];
  fuenteEsBanco = false;

  dataSourceBanco = new MatTableDataSource<MovimientoBancario>([]);
  displayedColumnsBanco = ['creadoEn', 'tipoBanco', 'descripcion', 'montoBanco', 'saldoBanco'];

  bancoTipoLabels: Record<string, string> = {
    ENTRADA_MANUAL: 'Entrada', SALIDA_MANUAL: 'Salida',
    AJUSTE_POSITIVO: 'Ajuste +', AJUSTE_NEGATIVO: 'Ajuste −', ACREDITACION_POS: 'Acreditación POS',
  };
  bancoTipoColores: Record<string, string> = {
    ENTRADA_MANUAL: '#4caf50', ACREDITACION_POS: '#4caf50', AJUSTE_POSITIVO: '#4caf50',
    SALIDA_MANUAL: '#f44336', AJUSTE_NEGATIVO: '#f44336',
  };

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
    private operacionFinancieraService: OperacionFinancieraService,
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
            this.construirFuentes();
          });
      });
  }

  /** Arma el selector de fuente: Caja Mayor + cada cuenta bancaria visible (banco - nº cuenta). */
  private construirFuentes() {
    const bancos = this.resumenBancario.map(r => ({
      label: `${r.cuentaBancaria?.banco?.nombre || 'Banco'} - ${r.cuentaBancaria?.numero || ''}`,
      tipo: 'BANCO' as const,
      cuentaId: r.cuentaBancaria?.id || null,
    }));
    this.fuentes = [{ label: 'Caja Mayor', tipo: 'CAJA', cuentaId: null }, ...bancos];
    // Preserva la selección actual si la cuenta sigue visible; si no, vuelve a Caja Mayor.
    const sigue = this.fuentes.find(f => f.tipo === this.fuenteSel.tipo && f.cuentaId === this.fuenteSel.cuentaId);
    this.fuenteSel = sigue || this.fuentes[0];
    this.fuenteEsBanco = this.fuenteSel.tipo === 'BANCO';
  }

  onFuenteChange(f: { label: string; tipo: 'CAJA' | 'BANCO'; cuentaId: number | null }) {
    this.fuenteSel = f;
    this.fuenteEsBanco = f.tipo === 'BANCO';
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    if (this.fuenteEsBanco) { this.cargarMovimientosBancarios(); return; }
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
          const rows = (res.getContent || []).map(m => this.toRow(m));
          this.marcarGruposOperacion(rows);
          this.dataSource.data = rows;
        }
      });
  }

  /** Carga los movimientos de la cuenta bancaria seleccionada como fuente. */
  private cargarMovimientosBancarios() {
    const cuentaId = this.fuenteSel.cuentaId;
    if (!cuentaId) { this.dataSourceBanco.data = []; return; }
    this.isLoading = true;
    this.operacionFinancieraService.onGetMovimientosBancarios(cuentaId, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isLoading = false;
        if (res != null) {
          this.dataSourceBanco.data = res.getContent || [];
          this.selectedPageInfo = { getTotalElements: res.getTotalElements };
        }
      });
  }

  private toRow(m: MovimientoCajaVirtual): MovimientoRow {
    const row = m as MovimientoRow;
    row._color = this.tipoColores[m.tipoMovimiento as any] || '#607d8b';
    row._anulable = this.puedeGestionar
      && m.tipoMovimiento !== CajaVirtualTipoMovimiento.AJUSTE
      && m.activo !== false;
    row._opGrupo = (m.origenTipo === 'OPERACION_FINANCIERA' && m.referenciaId) ? m.referenciaId : null;
    return row;
  }

  // Paleta estable para el acento lateral de los grupos de operación (por referenciaId).
  private opGrupoPaleta = ['#7e57c2', '#26a69a', '#5c6bc0', '#ab47bc', '#26c6da', '#66bb6a', '#ec407a'];

  /**
   * Marca las patas consecutivas de una misma operación financiera (mismo referenciaId)
   * como un grupo visual: comparten color de acento y se dibujan sin divisoria entre ellas.
   */
  private marcarGruposOperacion(rows: MovimientoRow[]) {
    for (let i = 0; i < rows.length; i++) {
      const g = rows[i]._opGrupo;
      if (g == null) { rows[i]._grupoInicio = false; rows[i]._grupoFin = false; continue; }
      rows[i]._opColor = this.opGrupoPaleta[g % this.opGrupoPaleta.length];
      const prevIgual = i > 0 && rows[i - 1]._opGrupo === g;
      const nextIgual = i < rows.length - 1 && rows[i + 1]._opGrupo === g;
      rows[i]._grupoInicio = !prevIgual;
      rows[i]._grupoFin = !nextIgual;
    }
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

  /**
   * Anula un movimiento. Si proviene de una operación financiera, anula la operación entera
   * (revierte todas sus patas: ambos lados de un cambio/transferencia, caja+banco de un
   * depósito/retiro). Un movimiento manual se anula con su contra-movimiento.
   */
  onAnular(mov: MovimientoCajaVirtual) {
    if (!mov?.id) return;
    const esOpFinanciera = mov.origenTipo === 'OPERACION_FINANCIERA' && !!mov.referenciaId;
    const mensaje = esOpFinanciera
      ? '¿Anular la operación financiera completa? Se revertirán TODOS sus movimientos vinculados (origen y destino).'
      : '¿Anular este movimiento? Se generará un contra-movimiento de ajuste (el original no se borra).';

    this.dialogosService.confirm(
      esOpFinanciera ? 'Anular operación financiera' : 'Anular movimiento',
      mensaje, mov.descripcion || null, null, true, 'Sí, anular', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      const obs: Observable<any> = esOpFinanciera
        ? this.operacionFinancieraService.onAnular(mov.referenciaId)
        : this.cajaVirtualService.onAnularMovimiento(mov.id);
      obs.pipe(untilDestroyed(this)).subscribe({
        next: r => {
          if (r != null) {
            this.notificacion.notification$.next({
              texto: esOpFinanciera ? 'Operación financiera anulada' : 'Movimiento anulado',
              color: NotificacionColor.success, duracion: 3
            });
            this.recargar();
          }
        },
        error: err => {
          const msg = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo anular';
          this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: 5 });
        }
      });
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarMovimientos();
  }
}
