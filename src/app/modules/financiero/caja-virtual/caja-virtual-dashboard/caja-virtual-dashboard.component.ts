import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { FormControl } from '@angular/forms';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { ListValeComponent } from '../../../rrhh/vale/list-vale/list-vale.component';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual,
         CajaVirtualSaldoItem, CuentaBancariaResumen, CajaVirtualConfiguracion,
         labelMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { Moneda } from '../../moneda/moneda.model';
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
import { DetallePagoDialogComponent, DetallePagoDialogData } from '../detalle-pago-dialog/detalle-pago-dialog.component';
import { ConteoCajaDialogComponent, ConteoCajaDialogData } from '../conteo-caja-dialog/conteo-caja-dialog.component';
import { OperacionFinancieraDetalleDialogComponent } from '../../operacion-financiera/operacion-financiera-detalle-dialog/operacion-financiera-detalle-dialog.component';
import { OperacionFinancieraService } from '../../operacion-financiera/operacion-financiera.service';
import { PagarComprasService } from '../pagar-compras-dialog/pagar-compras.service';
import { MovimientoBancario } from '../../operacion-financiera/operacion-financiera.model';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

// Fila de la tabla de movimientos con campos de display precalculados.
interface MovimientoRow extends MovimientoCajaVirtual {
  _label?: string;          // concepto real del movimiento (del origenTipo, no del tipo grueso)
  _color?: string;          // color saturado del chip (fondo)
  _colorTexto?: string;     // color claro del monto (texto sobre fondo oscuro)
  _anulable?: boolean;
  _verOrigen?: boolean;     // el origenTipo tiene una pantalla destino navegable
  _origenLabel?: string;    // etiqueta del ítem "Ir al origen"
  _origenIcon?: string;     // ícono del ítem
  // Agrupación visual de las patas de una misma operación financiera (mismo referenciaId).
  _opGrupo?: number | null;   // referenciaId de la op, o null si no es op financiera
  _opColor?: string;          // color del acento lateral del grupo
  _grupoInicio?: boolean;     // primera fila del grupo consecutivo
  _grupoFin?: boolean;        // última fila del grupo consecutivo
  _esGrupoMulti?: boolean;    // el grupo tiene 2+ filas consecutivas (par de cambio/transferencia)
}

/** Card de saldo por moneda que se muestra sobre la tabla de movimientos. */
interface SaldoCard {
  saldo: CajaVirtualSaldoItem;
  color: string;        // color de acento de la card (fondo del borde/valor)
  seleccionada: boolean;
  formato: string;      // digitsInfo del pipe number, según los decimales de la moneda
}

/** Card de cuenta bancaria del sidebar, con el formato de su moneda precalculado. */
interface BancoCard {
  resumen: CuentaBancariaResumen;
  formato: string;
}

/**
 * digitsInfo para el pipe number, según la moneda. El fallback por denominación es el mismo
 * patrón que usa el resto del módulo (pagar-compras-dialog): el guaraní no lleva fracción,
 * las demás sí. Ver migración V207.5, que pobló `decimales` — estaba en 0 para todas.
 */
function formatoDe(moneda: Moneda): string {
  const d = moneda?.decimales != null
    ? moneda.decimales
    : ((moneda?.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
  return `1.0-${d}`;
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

  // Saldos por moneda: cards sobre la tabla (antes iban en el sidebar).
  saldos: CajaVirtualSaldoItem[] = [];
  saldoCards: SaldoCard[] = [];
  /** Moneda por la que se está filtrando la tabla (null = todas). La activa el click en la card. */
  monedaSelId: number = null;

  // Paleta estable de las cards: se indexa por id de moneda, así el color no baila entre recargas.
  private monedaPaleta = ['#26a69a', '#5c6bc0', '#ffa726', '#ab47bc', '#ef5350', '#42a5f5', '#8d6e63'];

  // Sidebar
  resumenBancario: CuentaBancariaResumen[] = [];
  bancoCards: BancoCard[] = [];
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
  displayedColumnsBanco = ['creadoEn', 'responsableBanco', 'tipoBanco', 'descripcion', 'montoBanco', 'saldoBanco'];

  bancoTipoLabels: Record<string, string> = {
    ENTRADA_MANUAL: 'Entrada', SALIDA_MANUAL: 'Salida',
    AJUSTE_POSITIVO: 'Ajuste +', AJUSTE_NEGATIVO: 'Ajuste −', ACREDITACION_POS: 'Acreditación POS',
  };
  bancoTipoColores: Record<string, string> = {
    ENTRADA_MANUAL: '#4caf50', ACREDITACION_POS: '#4caf50', AJUSTE_POSITIVO: '#4caf50',
    SALIDA_MANUAL: '#f44336', AJUSTE_NEGATIVO: '#f44336',
  };

  // Variantes claras para el texto del monto bancario (contraste AA sobre fondo oscuro).
  bancoTipoColoresTexto: Record<string, string> = {
    ENTRADA_MANUAL: '#81c784', ACREDITACION_POS: '#81c784', AJUSTE_POSITIVO: '#81c784',
    SALIDA_MANUAL: '#ff8a80', AJUSTE_NEGATIVO: '#ff8a80',
  };

  // Filtros de movimientos
  desdeControl = new FormControl();
  hastaControl = new FormControl();
  tipoControl = new FormControl();
  verAnulaciones = true;   // anulados visibles (tachados) por defecto; el toggle los oculta
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

  // Colores saturados para el fondo del chip (texto blanco encima).
  tipoColores: Record<string, string> = {
    INGRESO: '#4caf50',
    EGRESO: '#f44336',
    TRANSFERENCIA_ENTRADA: '#2196f3',
    TRANSFERENCIA_SALIDA: '#ff9800',
    PAGO_PROVEEDOR: '#9c27b0',
    AJUSTE: '#607d8b',
  };

  // Variantes claras para el TEXTO del monto sobre el fondo gris oscuro (~#303030).
  // Verificadas con contraste WCAG ≥ 4.5:1 (AA): saturado como #9c27b0 daba 2.1:1 (ilegible).
  tipoColoresTexto: Record<string, string> = {
    INGRESO: '#81c784',              // 6.6:1
    EGRESO: '#ff8a80',               // 5.8:1
    TRANSFERENCIA_ENTRADA: '#64b5f6',// 6.0:1
    TRANSFERENCIA_SALIDA: '#ffb74d', // 7.6:1
    PAGO_PROVEEDOR: '#ce93d8',       // 5.5:1
    AJUSTE: '#b0bec5',               // 6.9:1
  };

  constructor(
    private cajaVirtualService: CajaVirtualService,
    private operacionFinancieraService: OperacionFinancieraService,
    private pagarComprasService: PagarComprasService,
    private tabService: TabService,
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
        if (res) {
          this.saldos = res;
          this.construirCards();
        }
      });
  }

  /** Arma las cards de saldo por moneda con su color estable y el estado de selección. */
  private construirCards() {
    this.saldoCards = this.saldos.map(s => ({
      saldo: s,
      color: this.monedaPaleta[(s.moneda?.id || 0) % this.monedaPaleta.length],
      seleccionada: this.monedaSelId != null && this.monedaSelId === s.moneda?.id,
      formato: formatoDe(s.moneda),
    }));
    // Si la moneda filtrada dejó de tener saldo, el filtro quedaría colgado sin card visible.
    if (this.monedaSelId != null && !this.saldoCards.some(c => c.seleccionada)) {
      this.monedaSelId = null;
    }
  }

  /** Click en una card: filtra la tabla por esa moneda; volver a clickear la misma quita el filtro. */
  onCardClick(card: SaldoCard) {
    const id = card.saldo?.moneda?.id;
    if (id == null) return;
    this.monedaSelId = this.monedaSelId === id ? null : id;
    this.saldoCards.forEach(c => c.seleccionada = c.saldo?.moneda?.id === this.monedaSelId);
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  /**
   * Conteo de efectivo de una moneda. El conteo vive en localStorage (no en el backend):
   * es una herramienta de arqueo, y tiene que sobrevivir a que se cierre el diálogo sin ajustar.
   * Solo se persiste en la caja un AJUSTE, y únicamente si el usuario lo pide.
   */
  onConteo(card: SaldoCard, event: MouseEvent) {
    event.stopPropagation();   // el click del botón no debe además togglear el filtro de la card
    const data: ConteoCajaDialogData = {
      cajaVirtual: this.cajaVirtual,
      moneda: card.saldo?.moneda,
      saldoSistema: card.saldo?.saldo || 0,
      color: card.color,
    };
    this.dialog.open(ConteoCajaDialogComponent, {
      // Sin ancho fijo: la grilla de denominaciones define el tamaño (1 columna o varias).
      maxWidth: '96vw', maxHeight: '92vh', autoFocus: false, data,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res) this.recargar(); });
  }

  cargarConfigYBancos() {
    if (!this.cajaVirtual?.id) return;
    this.cajaVirtualService.onGetConfiguracion(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe(cfg => {
        this.config = cfg;
        this.cajaVirtualService.onGetResumenBancario(this.cajaVirtual.id)
          .pipe(untilDestroyed(this)).subscribe(res => {
            this.resumenBancario = res || [];
            this.bancoCards = this.resumenBancario.map(r => ({
              resumen: r,
              formato: formatoDe(r.cuentaBancaria?.moneda),
            }));
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
      monedaId: this.monedaSelId,
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
    // Clonar antes de agregar props de display: Apollo congela los resultados y en dev
    // asignar sobre el objeto devuelto tira TypeError (mismo patron que cheques-dashboard).
    const row = { ...m } as MovimientoRow;
    // Concepto real del movimiento: sale del origen, no del tipo grueso (ver caja-virtual.model).
    row._label = labelMovimiento(m.origenTipo, m.tipoMovimiento, this.tipoMovimientoLabels);
    row._color = this.tipoColores[m.tipoMovimiento as any] || '#607d8b';
    row._colorTexto = this.tipoColoresTexto[m.tipoMovimiento as any] || '#b0bec5';
    const nav = this.origenNav[m.origenTipo as any];
    // Un pago del motor ofrece su desglose; si no, se cae al registro por origen.
    if (m.esPagoConsolidado && m.referenciaId) {
      row._verOrigen = true;
      row._origenLabel = 'Ver detalle del pago';
      row._origenIcon = 'receipt_long';
    } else {
      row._verOrigen = !!nav;
      row._origenLabel = nav?.label;
      row._origenIcon = nav?.icon;
    }
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
      if (g == null) { rows[i]._grupoInicio = false; rows[i]._grupoFin = false; rows[i]._esGrupoMulti = false; continue; }
      rows[i]._opColor = this.opGrupoPaleta[g % this.opGrupoPaleta.length];
      const prevIgual = i > 0 && rows[i - 1]._opGrupo === g;
      const nextIgual = i < rows.length - 1 && rows[i + 1]._opGrupo === g;
      rows[i]._grupoInicio = !prevIgual;
      rows[i]._grupoFin = !nextIgual;
      // Solo se agrupa visualmente cuando hay 2+ patas consecutivas (cambio/transferencia).
      // Un depósito/retiro tiene una sola pata en caja mayor: no se marca.
      rows[i]._esGrupoMulti = prevIgual || nextIgual;
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
    this.monedaSelId = null;
    this.saldoCards.forEach(c => c.seleccionada = false);
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
    this.dialog.open(RegistrarIngresoDialogComponent, { width: '720px', maxWidth: '95vw', data: { cajaVirtual: this.cajaVirtual } })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  onEgreso() {
    this.dialog.open(RegistrarEgresoDialogComponent, { width: '720px', maxWidth: '95vw', data: { cajaVirtual: this.cajaVirtual } })
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
  /**
   * Registro genérico "Ir al origen": mapea cada origenTipo a la pantalla dueña del movimiento.
   * Solo los que tienen destino real aparecen en el menú; agregar uno nuevo = una entrada acá.
   * Se navega con el origenId (o referenciaId) cuando la pantalla destino lo acepta.
   */
  private origenNav: Record<string, { label: string; icon: string; open: (row: MovimientoRow) => void }> = {
    ENTRADA_VARIA: {
      label: 'Ver entradas/salidas varias', icon: 'receipt_long',
      open: () => this.dialog.open(ListEntradasVariasDialogComponent, {
        width: '95vw', maxWidth: '1200px', height: '85vh', data: this.cajaVirtual
      }),
    },
    RRHH_VALE: {
      label: 'Ir a Vales (RRHH)', icon: 'payments',
      open: () => this.tabService.addTab(new Tab(ListValeComponent, 'Vales', null, null)),
    },
    OPERACION_FINANCIERA: {
      label: 'Ver operación financiera', icon: 'swap_horiz',
      open: (row) => {
        if (!row.referenciaId) return;
        this.dialog.open(OperacionFinancieraDetalleDialogComponent, {
          width: '640px', maxWidth: '95vw', maxHeight: '90vh',
          data: { operacionId: row.referenciaId, puedeGestionar: this.puedeGestionar },
        }).afterClosed().pipe(untilDestroyed(this)).subscribe(r => { if (r) this.recargar(); });
      },
    },
  };


  /**
   * Desglose de un evento de pago, abierto desde su movimiento en la caja.
   *
   * Un evento que paga N documentos postea UN movimiento consolidado, cuya descripción no puede
   * nombrarlos a todos (ver PagoProveedorService.etiquetaDe). El movimiento lleva
   * referenciaId = pago.id, y el backend marca cuáles son de un pago con esPagoConsolidado.
   */
  private abrirDetallePago(row: MovimientoRow) {
    if (!row.referenciaId) return;
    const data: DetallePagoDialogData = { pagoId: row.referenciaId, descripcion: row.descripcion };
    this.dialog.open(DetallePagoDialogComponent, {
      width: '65vw', maxWidth: '95vw', height: '70vh', data,
    });
  }

  irAlOrigen(row: MovimientoRow) {
    if (row.esPagoConsolidado && row.referenciaId) return this.abrirDetallePago(row);
    this.origenNav[row.origenTipo as any]?.open(row);
  }

  onAnular(mov: MovimientoCajaVirtual) {
    if (!mov?.id) return;
    const esOpFinanciera = mov.origenTipo === 'OPERACION_FINANCIERA' && !!mov.referenciaId;
    // El movimiento consolidado del pago lleva referenciaId = origenId = pago.id (el evento).
    //
    // Se pregunta por esPagoConsolidado y NO por el origenTipo: desde que el movimiento lleva el
    // concepto real (gasto, vale, liquidación…), el origen ya no distingue un pago del motor de
    // un egreso directo del módulo — los de RRHH usan el mismo valor para las dos cosas.
    const esPagoCpp = !!mov.esPagoConsolidado && !!mov.referenciaId;

    let titulo: string, mensaje: string, exito: string;
    if (esPagoCpp) {
      titulo = 'Anular pago a proveedor';
      mensaje = '¿Anular todo el pago a proveedor? Se revertirán TODOS los movimientos consolidados (caja y banco) y se reabrirán las notas pagadas.';
      exito = 'Pago a proveedor anulado';
    } else if (esOpFinanciera) {
      titulo = 'Anular operación financiera';
      mensaje = '¿Anular la operación financiera completa? Se revertirán TODOS sus movimientos vinculados (origen y destino).';
      exito = 'Operación financiera anulada';
    } else {
      titulo = 'Anular movimiento';
      mensaje = '¿Anular este movimiento? Se generará un contra-movimiento de ajuste (el original no se borra).';
      exito = 'Movimiento anulado';
    }

    this.dialogosService.confirm(
      titulo, mensaje, mov.descripcion || null, null, true, 'Sí, anular', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      const obs: Observable<any> = esPagoCpp
        ? this.pagarComprasService.onAnularPago(mov.referenciaId)
        : esOpFinanciera
          ? this.operacionFinancieraService.onAnular(mov.referenciaId)
          : this.cajaVirtualService.onAnularMovimiento(mov.id);
      obs.pipe(untilDestroyed(this)).subscribe({
        next: r => {
          if (r != null) {
            this.notificacion.notification$.next({ texto: exito, color: NotificacionColor.success, duracion: 3 });
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
