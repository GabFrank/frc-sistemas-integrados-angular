import { Component, Input, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { auditTime, catchError, filter, switchMap } from 'rxjs/operators';
import { TesoreriaCambio } from '../graphql/tesoreriaCambioSub';
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
         labelMovimiento, formatoDe, ordenarSegun, parseListaJson } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PageInfo } from '../../../../app.component';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { TransferenciaCajaVirtualDialogComponent } from '../transferencia-caja-virtual-dialog/transferencia-caja-virtual-dialog.component';
import { ConfigurarCajaVirtualDialogComponent } from '../configurar-caja-virtual-dialog/configurar-caja-virtual-dialog.component';
import { RegistrarIngresoDialogComponent } from '../registrar-ingreso-dialog/registrar-ingreso-dialog.component';
import { RegistrarEgresoDialogComponent } from '../registrar-egreso-dialog/registrar-egreso-dialog.component';
import { MainService } from '../../../../main.service';
import { esSoloTesoreriaCaja, operaAcotadoCaja, puedeOperarCaja } from '../rol-tesoreria-caja';
import { ROLES } from '../../../personas/roles/roles.enum';
import { AddEntradaVariaDialogComponent, EntradaVariaDialogData } from '../../entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { ListEntradasVariasDialogComponent } from '../../entrada-varia/list-entradas-varias-dialog/list-entradas-varias-dialog.component';
import { AddOperacionFinancieraDialogComponent } from '../../operacion-financiera/add-operacion-financiera-dialog/add-operacion-financiera-dialog.component';
import { DetallePagoDialogComponent, DetallePagoDialogData } from '../detalle-pago-dialog/detalle-pago-dialog.component';
import { DetalleRetiroDialogComponent, DetalleRetiroDialogData } from '../detalle-retiro-dialog/detalle-retiro-dialog.component';
import { DatoDetalle, DetalleMovimientoDialogComponent, DetalleMovimientoDialogData } from '../detalle-movimiento-dialog/detalle-movimiento-dialog.component';
import { ChequesDashboardComponent } from '../../cheque/cheques-dashboard/cheques-dashboard.component';
import { ConteoCajaDialogComponent, ConteoCajaDialogData } from '../conteo-caja-dialog/conteo-caja-dialog.component';
import { QrLectorDialogComponent, QrLectorDialogData, QrLectorResultado } from '../../../../shared/qr-lector/qr-lector-dialog/qr-lector-dialog.component';
import { QrTipoSoportado } from '../../../../shared/qr-lector/qr-lector.model';
import { IngresarRetiroCajaMayorDialogComponent, IngresarRetiroCajaMayorDialogData } from '../ingresar-retiro-caja-mayor-dialog/ingresar-retiro-caja-mayor-dialog.component';
import { OperacionFinancieraDetalleDialogComponent } from '../../operacion-financiera/operacion-financiera-detalle-dialog/operacion-financiera-detalle-dialog.component';
import { OperacionFinancieraService } from '../../operacion-financiera/operacion-financiera.service';
import { PagarComprasService } from '../pagar-compras-dialog/pagar-compras.service';
import { MovimientoBancario } from '../../operacion-financiera/operacion-financiera.model';
import { AccionAnularMovimientoBancario, PermisosAnulacionBancaria,
         accionAnularMovimientoBancario } from '../../operacion-financiera/movimiento-bancario-anulacion';
import { MovimientoBancarioAnulacionService } from '../../operacion-financiera/movimiento-bancario-anulacion.service';
import { RetiroVerificacionService } from '../../retiro/verificacion/retiro-verificacion.service';
import { EntradaVariaService } from '../../entrada-varia/entrada-varia.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MENSAJE_RESPUESTA_VACIA } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';

/** Filtros con los que se cargó la tabla: el reporte imprime exactamente lo mismo. */
interface FiltrosMovimientos {
  desde: string | null;
  fin: string | null;
  tipo: string | null;
  soloActivos: boolean;
  monedaId: number | null;   // solo caja mayor: una cuenta bancaria tiene una sola moneda
}

// Fila de la tabla de movimientos con campos de display precalculados.
interface MovimientoRow extends MovimientoCajaVirtual {
  _label?: string;          // concepto real del movimiento (del origenTipo, no del tipo grueso)
  _color?: string;          // color saturado del chip (fondo)
  _colorTexto?: string;     // color claro del monto (texto sobre fondo oscuro)
  _anulable?: boolean;
  _motivoNoAnulable?: string | null;  // por qué no se anula desde la caja (tooltip de «Anular»)
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

/** Movimiento bancario con lo que ofrece su menú, precalculado al cargar la página. */
interface MovimientoBancarioRow extends MovimientoBancario {
  _accion: AccionAnularMovimientoBancario;
  /** «Ver detalle» según el origen (desk #721), precalculado al cargar; null = sin detalle. */
  _detalle: ((row: MovimientoBancarioRow) => void) | null;
  /** El menú se muestra si hay algo que hacer: anular o ver el detalle (también en una fila anulada). */
  _conMenu: boolean;
}

/** Card de cuenta bancaria del sidebar, con el formato de su moneda precalculado. */
interface BancoCard {
  resumen: CuentaBancariaResumen;
  formato: string;
}

/** «12/11/2026 15:50» para los detalles; vacío si no hay fecha. */
function fechaHora(f: Date | string): string {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d.getTime())) return String(f);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Fecha de hoy como "14-09-2026". Con guiones y no barras: termina en un nombre de archivo. */
function fechaHoyArchivo(): string {
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, '0');
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${hoy.getFullYear()}`;
}

const SIN_CONFIRMAR_ANULACION = 'No se pudo confirmar la anulación: se vuelve a leer la caja para verificarla.';

/**
 * Orígenes cuyo «ir al origen» abre una pantalla que el rol acotado no puede leer: el detalle de una
 * operación financiera (trae cuentas bancarias), la lista de vales de RRHH y el retiro del PDV (la query `retiro`
 * no admite TESORERIA CAJA: el diálogo quedaba vacío).
 */
const ORIGENES_SIN_DETALLE_EN_MODO_ACOTADO = ['OPERACION_FINANCIERA', 'RRHH_VALE', 'RETIRO_CAJA'];

/** Espejo de TesoreriaService.anular (central): los únicos orígenes que anula como movimiento suelto. Cambiar juntos. */
const ORIGENES_ANULABLES_EN_CAJA = ['MANUAL', 'MALETIN', 'VUELTO'];

/** Orígenes que se anulan en la pantalla de su módulo (que devuelve también la caja), con el rol que hace falta. */
const ANULACION_EN_SU_MODULO: Record<string, string> = {
  RRHH_VALE: 'Se anula en R.R.H.H. → Anticipos → Vales (rol RRHH GESTIONAR)',
  RRHH_LIQUIDACION_SUELDO: 'Se anula en R.R.H.H. → Liquidaciones (rol RRHH PAGAR)',
  RRHH_LIQUIDACION_FINAL: 'Se anula en R.R.H.H. → Liquidaciones → Finiquito (rol RRHH PAGAR)',
};

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
  /** La última carga de saldos falló: los montos de las cards no se muestran ni se usan para ajustar. */
  saldosNoDisponibles = false;
  /** Número de la última carga de saldos: una respuesta vieja (dos recargas seguidas) no pisa a la nueva. */
  private saldosCargaId = 0;
  /**
   * Los saldos se están releyendo después de un conteo: hasta que vuelvan, el conteo se abre sin saldo del
   * sistema (no se puede ajustar). No es `saldosNoDisponibles`, que además muestra el cartel de lectura fallida.
   */
  private saldosEnRelectura = false;
  /** Moneda por la que se está filtrando la tabla (null = todas). La activa el click en la card. */
  monedaSelId: number = null;

  // Paleta estable de las cards: se indexa por id de moneda, así el color no baila entre recargas.
  private monedaPaleta = ['#26a69a', '#5c6bc0', '#ffa726', '#ab47bc', '#ef5350', '#42a5f5', '#8d6e63'];

  // Sidebar
  resumenBancario: CuentaBancariaResumen[] = [];
  bancoCards: BancoCard[] = [];
  config: CajaVirtualConfiguracion;
  /** La configuración se leyó bien al menos una vez: `recargar()` ya no la pide (solo cambia por «Configurar»). */
  private configCargada = false;
  /** Orden configurado de las cards de moneda (ids). Vacío = por id de moneda. */
  private monedasOrden: number[] = [];
  /** Número de la última carga del resumen bancario: una respuesta vieja no pisa a la nueva. */
  private bancosCargaId = 0;

  // Movimientos (tabla)
  dataSource = new MatTableDataSource<MovimientoRow>([]);
  isLoading = false;
  /** La última lectura de movimientos (de caja o de banco) falló: la tabla muestra lo que había antes. */
  movimientosNoCargados = false;
  /** Número de la última lectura de movimientos: una respuesta vieja (dos recargas seguidas) no pisa a la nueva. */
  private movimientosCargaId = 0;
  /**
   * Operaciones con una anulación pedida: en vuelo (`null`) o terminada sin que la caja se haya vuelto a leer
   * (número de la lectura vigente cuando terminó). No se pueden volver a anular hasta que una lectura de caja
   * **posterior** termine bien: si la anulación quedó sin respuesta pudo haberse aplicado, y con la fila todavía
   * «activa» un segundo intento postearía otro contra-movimiento (#390). Se guarda acá y no en la fila porque las
   * filas se reconstruyen en cada lectura.
   */
  private anulacionesPendientes = new Map<string, number | null>();
  pageIndex = 0;
  pageSize = 15;
  selectedPageInfo: PageInfo<MovimientoCajaVirtual> | any;
  displayedColumns = ['creadoEn', 'usuario', 'entregadoA', 'tipoMovimiento', 'descripcion', 'cantidad', 'saldoPosterior', 'acciones'];

  // Fuente de la tabla: caja mayor o una cuenta bancaria (los movimientos de banco no
  // ocurren en la caja mayor; el selector permite verlos sin salir del dashboard).
  fuentes: { label: string; tipo: 'CAJA' | 'BANCO'; cuentaId: number | null }[] =
    [{ label: 'Caja Mayor', tipo: 'CAJA', cuentaId: null }];
  fuenteSel = this.fuentes[0];
  fuenteEsBanco = false;

  dataSourceBanco = new MatTableDataSource<MovimientoBancarioRow>([]);
  displayedColumnsBanco = ['creadoEn', 'usuarioBanco', 'tipoBanco', 'descripcion', 'montoBanco', 'saldoBanco', 'accionesBanco'];
  private permisosAnulacionBanco: PermisosAnulacionBancaria = { gestionar: false, pagarCpp: false };

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
  /** Mover el efectivo de la caja: GESTIONAR o el rol acotado TESORERIA CAJA. */
  puedeOperar = false;
  /** Rol acotado: sin cuentas bancarias, sin configuración, sin conteo, sin detalle de operaciones. */
  soloCaja = false;
  /** Mueve plata como el rol acotado (TESORERIA CAJA sin GESTIONAR): sin conteo ni anular retiros. */
  operaAcotado = false;

  tipoMovimientoList = [
    { label: 'Ingreso', value: CajaVirtualTipoMovimiento.INGRESO },
    { label: 'Egreso', value: CajaVirtualTipoMovimiento.EGRESO },
    { label: 'Transf. Entrada', value: CajaVirtualTipoMovimiento.TRANSFERENCIA_ENTRADA },
    { label: 'Transf. Salida', value: CajaVirtualTipoMovimiento.TRANSFERENCIA_SALIDA },
    { label: 'Pago Proveedor', value: CajaVirtualTipoMovimiento.PAGO_PROVEEDOR },
    { label: 'Ajuste', value: CajaVirtualTipoMovimiento.AJUSTE },
  ];

  tipoMovimientoBancoList = [
    { label: 'Entrada', value: 'ENTRADA_MANUAL' },
    { label: 'Salida', value: 'SALIDA_MANUAL' },
    { label: 'Ajuste +', value: 'AJUSTE_POSITIVO' },
    { label: 'Ajuste −', value: 'AJUSTE_NEGATIVO' },
    { label: 'Acreditación POS', value: 'ACREDITACION_POS' },
  ];

  /** Opciones del filtro de tipo según la fuente: caja y banco no comparten tipos. */
  tipoOpciones: { label: string; value: string }[] = this.tipoMovimientoList;

  private filtrosAplicados: FiltrosMovimientos = null;

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
    private retiroVerificacionService: RetiroVerificacionService,
    private notificacion: NotificacionSnackbarService,
    private impresionService: ImpresionService,
    private movimientoBancarioAnulacionService: MovimientoBancarioAnulacionService,
    private entradaVariaService: EntradaVariaService,
    public mainService: MainService
  ) {}

  ngOnInit(): void {
    this.cajaVirtual = this.data?.tabData?.data as CajaVirtual;
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.puedeOperar = puedeOperarCaja(this.mainService);
    this.soloCaja = esSoloTesoreriaCaja(this.mainService);
    this.operaAcotado = operaAcotadoCaja(this.mainService);
    this.permisosAnulacionBanco = {
      gestionar: this.puedeGestionar,
      pagarCpp: this.mainService.tieneAlgunRol([ROLES.TESORERIA_CPP_PAGAR]),
    };
    this.cargarOrdenes();
    this.recargar();
    // Lo que mueve esta caja desde otro lado (otro usuario, otra pantalla) se ve sin recargar. A lo sumo una
    // relectura por segundo: un pago genera varios cambios seguidos.
    this.cajaVirtualService.onCambiosTesoreria()
      .pipe(filter(c => this.esCambioDeEstaCaja(c)), auditTime(1000), untilDestroyed(this))
      .subscribe(() => this.recargar(true));
  }

  /** De esta caja, de una de sus cuentas bancarias, o sin ids (el central volvió tras un corte). */
  private esCambioDeEstaCaja(c: TesoreriaCambio): boolean {
    if (c.cajaVirtualId == null && c.cuentaBancariaId == null) return true;
    if (c.cajaVirtualId != null) return String(c.cajaVirtualId) === String(this.cajaVirtual?.id);
    return this.bancoCards.some(b => String(b.resumen.cuentaBancaria?.id) === String(c.cuentaBancariaId));
  }

  /**
   * Relee saldos, cuentas y movimientos. La de fondo (`deFondo`, por un cambio hecho en otro lado) usa los filtros
   * ya aplicados, no lo que haya a medio escribir, y no avisa si falla: el usuario no hizo nada.
   */
  recargar(deFondo = false) {
    this.cargarSaldos(deFondo);
    // La configuración no la cambia ninguna operación de caja: solo se reintenta si la última lectura falló (#646).
    if (!this.configCargada) this.cargarConfig(deFondo);
    this.cargarBancos(deFondo);
    this.cargarMovimientos(!deFondo);
  }

  cargarSaldos(silenciosa = false) {
    if (!this.cajaVirtual?.id) return;
    const id = ++this.saldosCargaId;
    this.cajaVirtualService.onGetSaldos(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (id !== this.saldosCargaId) return;
          this.saldosEnRelectura = false;
          if (res == null) { this.saldosNoCargados(silenciosa); return; }
          this.saldosNoDisponibles = false;
          this.saldos = res;
          this.construirCards();
        },
        error: () => { if (id === this.saldosCargaId) { this.saldosEnRelectura = false; this.saldosNoCargados(silenciosa); } }
      });
  }

  /**
   * La recarga de saldos falló: las cards se conservan (moneda y filtro) pero sin el monto, que puede estar
   * viejo, y el conteo se abre sin saldo del sistema para que no se postee un AJUSTE contra un saldo
   * desactualizado (#390).
   */
  private saldosNoCargados(silenciosa = false) {
    this.saldosNoDisponibles = true;
    if (!silenciosa) this.notificacion.openWarn('No se pudieron cargar los saldos de la caja: no se puede ajustar hasta recargar.', 5);
  }

  /**
   * Orden de las cards de moneda (#540). El central nuevo ya devuelve los saldos ordenados; acá se aplica la misma
   * regla para que con un central viejo (que los manda sin orden) las cards tampoco salten.
   */
  private cargarOrdenes() {
    if (!this.cajaVirtual?.id) return;
    this.cajaVirtualService.onGetOrdenes(this.cajaVirtual.id).pipe(untilDestroyed(this)).subscribe(o => {
      this.monedasOrden = parseListaJson<any>(o.monedasOrden).map(x => Number(x));
      if (this.saldos?.length) this.construirCards();
    });
  }

  /** Arma las cards de saldo por moneda con su color estable y el estado de selección. */
  private construirCards() {
    const porId = (a: CajaVirtualSaldoItem, b: CajaVirtualSaldoItem) => Number(a.moneda?.id || 0) - Number(b.moneda?.id || 0);
    const ordenados = ordenarSegun(this.saldos || [], s => Number(s.moneda?.id), this.monedasOrden, porId);
    this.saldoCards = ordenados.map(s => ({
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
      saldoSistema: (this.saldosNoDisponibles || this.saldosEnRelectura) ? null : (card.saldo?.saldo || 0),
      color: card.color,
    };
    this.dialog.open(ConteoCajaDialogComponent, {
      // Sin ancho fijo: la grilla de denominaciones define el tamaño (1 columna o varias).
      maxWidth: '96vw', maxHeight: '92vh', autoFocus: false, data,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (!res) return;
      // Hasta que vuelvan los saldos el conteo no tiene contra qué ajustar: reabrirlo ya, con el saldo de
      // antes, repetiría un ajuste que pudo haberse registrado (#390).
      this.saldosEnRelectura = true;
      this.recargar();
    });
  }

  /** Tarjetas CPP/CPC. Se lee al abrir y tras «Configurar»; el resumen bancario no la necesita y va aparte. */
  cargarConfig(silenciosa = false) {
    if (!this.cajaVirtual?.id) return;
    // El rol acotado no ve la configuración: el central la rechaza.
    if (this.soloCaja) { this.config = null; return; }
    this.cajaVirtualService.onGetConfiguracion(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe({
        // Con un rechazo llega null igual que sin configuración: solo un error de red cuenta como no cargada.
        next: cfg => { this.config = cfg; this.configCargada = true; },
        error: () => {
          this.config = null;
          if (!silenciosa) this.notificacion.openWarn('No se pudo cargar la configuración de la caja.', 5);
        }
      });
  }

  cargarBancos(silenciosa = false) {
    if (!this.cajaVirtual?.id) return;
    if (this.soloCaja) {
      // El rol acotado no ve los saldos bancarios: el central los rechaza. Queda solo la caja como fuente,
      // sin aviso de error.
      this.resumenBancario = [];
      this.bancoCards = [];
      this.construirFuentes();
      return;
    }
    const id = ++this.bancosCargaId;
    this.cajaVirtualService.onGetResumenBancario(this.cajaVirtual.id)
      .pipe(untilDestroyed(this)).subscribe({
        next: res => {
          if (id !== this.bancosCargaId) return;
          if (res == null) { this.bancosNoCargados(silenciosa); return; }
          this.resumenBancario = res;
          this.bancoCards = this.resumenBancario.map(r => ({
            resumen: r,
            formato: formatoDe(r.cuentaBancaria?.moneda),
          }));
          this.construirFuentes();
        },
        error: () => { if (id === this.bancosCargaId) this.bancosNoCargados(silenciosa); }
      });
  }

  /** Sin configuración o resumen no se muestran las cuentas de antes: solo Caja Mayor, con aviso (#390). */
  private bancosNoCargados(silenciosa = false) {
    this.resumenBancario = [];
    this.bancoCards = [];
    this.construirFuentes();
    if (!silenciosa) this.notificacion.openWarn('No se pudieron cargar las cuentas bancarias de la caja.', 5);
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
    this.setFuenteEsBanco(this.fuenteSel.tipo === 'BANCO');
  }

  onFuenteChange(f: { label: string; tipo: 'CAJA' | 'BANCO'; cuentaId: number | null }) {
    this.fuenteSel = f;
    this.setFuenteEsBanco(f.tipo === 'BANCO');
    this.pageIndex = 0;
    this.cargarMovimientos();
  }

  /** Al pasar de caja a banco (o al revés) el tipo elegido deja de existir: se limpia. */
  private setFuenteEsBanco(esBanco: boolean) {
    if (esBanco !== this.fuenteEsBanco) this.tipoControl.setValue(null);
    this.fuenteEsBanco = esBanco;
    this.tipoOpciones = esBanco ? this.tipoMovimientoBancoList : this.tipoMovimientoList;
  }

  private leerFiltros(): FiltrosMovimientos {
    return {
      desde: this.desdeControl.value ? dateToString(this.desdeControl.value) : null,
      fin: this.hastaControl.value ? dateToString(this.hastaControl.value) : null,
      tipo: this.tipoControl.value || null,
      soloActivos: !this.verAnulaciones,
      monedaId: this.fuenteEsBanco ? null : this.monedaSelId,
    };
  }

  /** `releerFiltros = false`: con los filtros de la última carga (la relectura de fondo). */
  cargarMovimientos(releerFiltros = true) {
    if (releerFiltros || !this.filtrosAplicados) this.filtrosAplicados = this.leerFiltros();
    if (this.fuenteEsBanco) { this.cargarMovimientosBancarios(); return; }
    if (!this.cajaVirtual?.id) return;
    this.isLoading = true;
    const carga = ++this.movimientosCargaId;
    const f = this.filtrosAplicados;
    this.cajaVirtualService.onGetMovimientosFilter(this.cajaVirtual.id, {
      desde: f.desde,
      fin: f.fin,
      tipo: f.tipo as CajaVirtualTipoMovimiento,
      monedaId: f.monedaId,
      soloActivos: f.soloActivos,
    }, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          if (carga !== this.movimientosCargaId) return;
          this.isLoading = false;
          // Un resultado vacío sin error tampoco es una lectura: antes dejaba las filas viejas sin avisar.
          this.movimientosNoCargados = res == null;
          if (res != null) {
            this.liberarAnulacionesLeidas(carga);
            this.selectedPageInfo = res;
            const rows = (res.getContent || []).map(m => this.toRow(m));
            this.marcarGruposOperacion(rows);
            this.dataSource.data = rows;
          }
        },
        error: () => {
          if (carga !== this.movimientosCargaId) return;
          this.isLoading = false;
          this.movimientosNoCargados = true;
        }
      });
  }

  /** Carga los movimientos de la cuenta bancaria seleccionada como fuente. */
  private cargarMovimientosBancarios() {
    const cuentaId = this.fuenteSel.cuentaId;
    if (!cuentaId) {
      // También cuenta como lectura: una respuesta bancaria anterior todavía en vuelo no debe llenar la tabla.
      ++this.movimientosCargaId;
      this.dataSourceBanco.data = [];
      this.movimientosNoCargados = false;
      return;
    }
    this.isLoading = true;
    const carga = ++this.movimientosCargaId;
    const f = this.filtrosAplicados;
    this.operacionFinancieraService.onGetMovimientosBancarios(cuentaId, this.pageIndex, this.pageSize, {
      desde: f.desde, fin: f.fin, tipo: f.tipo, soloActivos: f.soloActivos,
    })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          if (carga !== this.movimientosCargaId) return;
          this.isLoading = false;
          this.movimientosNoCargados = res == null;
          if (res == null) return;
          // Clonar: Apollo congela los resultados (mismo motivo que toRow).
          this.dataSourceBanco.data = (res.getContent || []).map(m => {
            const row = { ...m, _accion: accionAnularMovimientoBancario(m, this.permisosAnulacionBanco) } as MovimientoBancarioRow;
            row._detalle = this.detalleBancoDe(row);
            row._conMenu = !!row._accion.visible || !!row._detalle;
            return row;
          });
          this.selectedPageInfo = { getTotalElements: res.getTotalElements };
        },
        error: () => {
          if (carga !== this.movimientosCargaId) return;
          this.isLoading = false;
          this.movimientosNoCargados = true;
        }
      });
  }

  /**
   * Reporte PDF de la fuente seleccionada (caja mayor o la cuenta bancaria), con los filtros con los
   * que se cargó la tabla: si el usuario tocó un filtro sin aplicarlo, el PDF no lo toma.
   */
  onGenerarReporte() {
    const f = this.filtrosAplicados;
    const fuente = this.fuenteSel;
    if (!this.cajaVirtual?.id || !f) return;
    // El nombre es también el del archivo al descargar: lleva la fecha de generación para distinguir un PDF de otro.
    const nombre = `Movimientos ${this.cajaVirtual.nombre || ''} - ${fuente.label} - ${fechaHoyArchivo()}`;
    if (fuente.tipo === 'BANCO') {
      if (!fuente.cuentaId) return;
      this.impresionService.imprimir(nombre, () => this.cajaVirtualService.onImprimirReporteMovimientosBancarios(
        this.cajaVirtual.id, fuente.cuentaId, { desde: f.desde, fin: f.fin, tipo: f.tipo, soloActivos: f.soloActivos }), true);
    } else {
      this.impresionService.imprimir(nombre, () => this.cajaVirtualService.onImprimirReporteMovimientos(
        this.cajaVirtual.id, {
          desde: f.desde, fin: f.fin, tipo: f.tipo as CajaVirtualTipoMovimiento,
          monedaId: f.monedaId, soloActivos: f.soloActivos,
        }), true);
    }
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
      row._origenLabel = 'Ver detalle';
      row._origenIcon = 'receipt_long';
    } else {
      row._verOrigen = !!nav && !(this.soloCaja && ORIGENES_SIN_DETALLE_EN_MODO_ACOTADO.includes(m.origenTipo as any));
      row._origenLabel = nav?.label;
      row._origenIcon = nav?.icon;
    }
    row._motivoNoAnulable = this.motivoNoAnulable(m);
    row._anulable = this.esAnulable(m);
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

  /**
   * Carrito de escaneo: el operador pasa uno o varios documentos por el lector y el diálogo
   * devuelve los que resolvió. El ruteo al destino vive acá y no adentro del carrito, para
   * que el mismo diálogo sirva después al PDV o a RRHH.
   */
  onEscanear() {
    const data: QrLectorDialogData = { cajaVirtual: this.cajaVirtual };
    this.dialog.open(QrLectorDialogComponent, {
      width: '65vw', height: '70vh', maxWidth: '96vw', autoFocus: false, disableClose: true, data,
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: QrLectorResultado) => {
      if (!res?.items?.length) return;
      this.rutearEscaneo(res);
    });
  }

  /**
   * Lleva lo escaneado a su destino. Cada tipo abre el diálogo que ya sabe operarlo, con
   * los documentos preseleccionados: el carrito resuelve y valida, el destino ejecuta.
   */
  private rutearEscaneo(res: QrLectorResultado) {
    if (res.tipo === QrTipoSoportado.RETIRO) {
      const d: IngresarRetiroCajaMayorDialogData = {
        cajaVirtual: this.cajaVirtual,
        preseleccion: res.items.map(i => i.documento),
      };
      // disableClose: cerrar con Esc devuelve undefined y el saldo no se recargaría aunque haya ingresos.
      this.dialog.open(IngresarRetiroCajaMayorDialogComponent, {
        width: '65vw', height: '70vh', maxWidth: '96vw', disableClose: true, data: d,
      }).afterClosed().pipe(untilDestroyed(this)).subscribe(r => { if (r) this.recargar(); });
      return;
    }
    // F4 agrega SOLPAG -> pagar-compras-dialog con los documentos preseleccionados.
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
    // Con la caja: el diálogo ordena y oculta las operaciones según su configuración y la precarga como origen (#720).
    this.dialog.open(AddOperacionFinancieraDialogComponent, { width: '880px', maxWidth: '95vw', maxHeight: '92vh',
      data: { cajaVirtual: this.cajaVirtual } })
      .afterClosed().subscribe(res => { if (res) this.recargar(); });
  }

  /** Anular una entrada varia ahí adentro mueve el saldo de esta caja: al cerrarse, se relee. */
  onVerEntradasVarias() {
    const ref = this.dialog.open(ListEntradasVariasDialogComponent, {
      width: '95vw', maxWidth: '1200px', height: '85vh', data: this.cajaVirtual
    });
    // Se captura acá: el diálogo se cierra con Esc o clic afuera, y después componentInstance es null.
    const entradas = ref.componentInstance;
    ref.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      if (entradas.huboCambios) this.recargar();
    });
  }

  onConfigurar() {
    this.dialog.open(ConfigurarCajaVirtualDialogComponent, { width: '520px', maxHeight: '90vh', data: { cajaVirtual: this.cajaVirtual } })
      // La configuración cambia también el orden de las cards de moneda: se releen órdenes y saldos (#540).
      .afterClosed().subscribe(res => { if (res) { this.cargarConfig(); this.cargarBancos(); this.cargarOrdenes(); this.cargarSaldos(); } });
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
      open: () => this.onVerEntradasVarias(),
    },
    RRHH_VALE: {
      label: 'Ir a Vales (RRHH)', icon: 'payments',
      open: () => this.tabService.addTab(new Tab(ListValeComponent, 'Vales', null, null)),
    },
    OPERACION_FINANCIERA: {
      label: 'Ver detalle', icon: 'swap_horiz',
      open: (row) => this.abrirDetalleOperacion(row.referenciaId),
    },
    // El ingreso más común de la caja (desk #721): el retiro del PDV con lo declarado y lo verificado.
    RETIRO_CAJA: {
      label: 'Ver detalle', icon: 'point_of_sale',
      open: (row) => this.abrirDetalleRetiro(row),
    },
    ANULACION: {
      label: 'Ver detalle', icon: 'info',
      open: (row) => this.abrirDetalleMovimiento('Anulación', row.descripcion, this.datosMovimientoCaja(row)),
    },
    MANUAL: {
      label: 'Ver detalle', icon: 'info',
      open: (row) => this.abrirDetalleMovimiento('Movimiento manual', row.descripcion, this.datosMovimientoCaja(row)),
    },
  };

  private abrirDetalleOperacion(operacionId: number) {
    if (!operacionId) return;
    this.dialog.open(OperacionFinancieraDetalleDialogComponent, {
      width: '640px', maxWidth: '95vw', maxHeight: '90vh',
      data: { operacionId, puedeGestionar: this.puedeGestionar },
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(r => { if (r) this.recargar(); });
  }

  /** El id del retiro no es global (cada filial numera desde 1): sin la sucursal no se encuentra. */
  private abrirDetalleRetiro(row: MovimientoRow) {
    const retiroId = row.origenId || row.referenciaId;
    if (!retiroId || row.origenSucursalId == null) {
      this.notificacion.openWarn('Este ingreso no registra de qué sucursal vino el retiro: no se puede abrir su detalle.', 5);
      return;
    }
    const data: DetalleRetiroDialogData = {
      retiroId, sucursalId: row.origenSucursalId, descripcion: row.descripcion,
      conVerificacion: !this.soloCaja && !this.operaAcotado,
    };
    this.dialog.open(DetalleRetiroDialogComponent, { width: '65vw', maxWidth: '95vw', maxHeight: '70vh', data });
  }

  private abrirDetalleMovimiento(titulo: string, subtitulo: string, datos: DatoDetalle[]) {
    const data: DetalleMovimientoDialogData = { titulo, subtitulo, datos };
    this.dialog.open(DetalleMovimientoDialogComponent, { width: '520px', maxWidth: '95vw', maxHeight: '70vh', data });
  }

  private datosMovimientoCaja(row: MovimientoRow): DatoDetalle[] {
    return [
      { etiqueta: 'Tipo', valor: row._label || String(row.tipoMovimiento || '') },
      { etiqueta: 'Monto', valor: `${row.moneda?.simbolo || ''} ${(row.cantidad ?? 0).toLocaleString('es-PY')}` },
      { etiqueta: 'Usuario', valor: row.usuario?.persona?.nombre || '—' },
      { etiqueta: 'Fecha', valor: fechaHora(row.creadoEn) },
      { etiqueta: 'Estado', valor: row.activo === false ? 'Anulado' : 'Activo' },
    ];
  }

  /**
   * «Ver detalle» de una fila de banco, por origen (desk #721). Lo mismo que la tabla de caja: operación financiera,
   * evento de pago, cheque suelto; el resto (manual, anulación, acreditación) abre un detalle simple.
   */
  private detalleBancoDe(m: MovimientoBancarioRow): ((row: MovimientoBancarioRow) => void) | null {
    if (m.origenTipo === 'OPERACION_FINANCIERA' && m.origenId) return r => this.abrirDetalleOperacion(r.origenId);
    if (m.pagoId) {
      return r => {
        const data: DetallePagoDialogData = { pagoId: r.pagoId, descripcion: r.descripcion };
        this.dialog.open(DetallePagoDialogComponent, { width: '65vw', maxWidth: '95vw', height: '70vh', data });
      };
    }
    if (m.origenTipo === 'CHEQUE') return () => this.tabService.addTab(new Tab(ChequesDashboardComponent, 'Cheques', null, null));
    const titulo = m.origenTipo === 'ANULACION' ? 'Anulación' : 'Movimiento bancario';
    return r => this.abrirDetalleMovimiento(titulo, r.descripcion, [
      { etiqueta: 'Tipo', valor: String(r.tipoMovimiento || '') },
      { etiqueta: 'Monto', valor: (r.monto ?? 0).toLocaleString('es-PY') },
      { etiqueta: 'Usuario', valor: r.usuario?.persona?.nombre || '—' },
      { etiqueta: 'Fecha', valor: fechaHora(r.creadoEn) },
      { etiqueta: 'Estado', valor: r.anulado ? 'Anulado' : 'Activo' },
    ]);
  }

  onVerDetalleBanco(row: MovimientoBancarioRow) {
    row._detalle?.(row);
  }


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

  /** Doble clic en una fila de caja: abre su detalle, si tiene. */
  onDobleClicCaja(row: MovimientoRow) {
    if (row._verOrigen) this.irAlOrigen(row);
  }

  irAlOrigen(row: MovimientoRow) {
    if (row.esPagoConsolidado && row.referenciaId) return this.abrirDetallePago(row);
    this.origenNav[row.origenTipo as any]?.open(row);
  }

  private esAnulable(m: MovimientoCajaVirtual): boolean {
    // Deshacer la acreditación de un retiro anula su verificación, que no entra en el rol acotado.
    if (this.operaAcotado && m.origenTipo === 'RETIRO_CAJA') return false;
    return this.puedeOperar
      && m.tipoMovimiento !== CajaVirtualTipoMovimiento.AJUSTE
      && m.activo !== false
      && !this.motivoNoAnulable(m)
      && !this.anulacionesPendientes.has(this.claveAnulacion(m));
  }

  /**
   * Por qué esta fila no se anula desde la caja, o null si se puede. Solo mira los datos de la fila (no permisos ni
   * anulaciones en curso: ahí se sigue viendo «Anular» gris). Las filas sin rama propia en onAnular van a
   * anularMovimientoCajaVirtual, que solo acepta los orígenes de ORIGENES_ANULABLES_EN_CAJA.
   */
  private motivoNoAnulable(m: MovimientoCajaVirtual): string | null {
    if (m.tipoMovimiento === CajaVirtualTipoMovimiento.AJUSTE || m.activo === false) return null;
    if (!this.claveAnulacion(m).startsWith('MOVIMIENTO:')) return null;
    if (ORIGENES_ANULABLES_EN_CAJA.includes(m.origenTipo || 'MANUAL')) return null;
    return ANULACION_EN_SU_MODULO[m.origenTipo] ?? 'Este movimiento no se puede anular';
  }

  /**
   * Qué se anula al anular esta fila. Un pago, una operación financiera o la verificación de un retiro tienen
   * varias patas (filas): todas comparten la clave y quedan bloqueadas juntas.
   */
  private claveAnulacion(m: MovimientoCajaVirtual): string {
    if (m.origenTipo === 'RETIRO_CAJA' && m.origenId && m.origenSucursalId) return `RETIRO:${m.origenId}:${m.origenSucursalId}`;
    if (m.esPagoConsolidado && m.referenciaId) return `PAGO:${m.referenciaId}`;
    if (m.origenTipo === 'OPERACION_FINANCIERA' && m.referenciaId) return `OPERACION:${m.referenciaId}`;
    const entradaVariaId = this.entradaVariaIdDe(m);
    if (entradaVariaId) return `ENTRADA_VARIA:${entradaVariaId}`;
    return `MOVIMIENTO:${m.id}`;
  }

  /** Id de la entrada/salida varia de la fila: el central pone el mismo en origenId y referenciaId. */
  private entradaVariaIdDe(m: MovimientoCajaVirtual): number | null {
    return m.origenTipo === 'ENTRADA_VARIA' ? (m.origenId ?? m.referenciaId ?? null) : null;
  }

  /** Vuelve a calcular «Anular» en las filas en pantalla (el bloqueo cambió sin que se releyera la tabla). */
  private actualizarAnulables(): void {
    this.dataSource.data.forEach(row => row._anulable = this.esAnulable(row));
  }

  /** Una lectura de caja que empezó después de terminar la anulación ya refleja su resultado: se desbloquea. */
  private liberarAnulacionesLeidas(carga: number): void {
    this.anulacionesPendientes.forEach((terminadaEn, clave) => {
      if (terminadaEn != null && carga > terminadaEn) this.anulacionesPendientes.delete(clave);
    });
  }

  onAnular(mov: MovimientoCajaVirtual) {
    if (!mov?.id) return;
    const clave = this.claveAnulacion(mov);
    if (this.anulacionesPendientes.has(clave)) return;
    const esOpFinanciera = mov.origenTipo === 'OPERACION_FINANCIERA' && !!mov.referenciaId;
    // El movimiento consolidado del pago lleva referenciaId = origenId = pago.id (el evento).
    //
    // Se pregunta por esPagoConsolidado y NO por el origenTipo: desde que el movimiento lleva el
    // concepto real (gasto, vale, liquidación…), el origen ya no distingue un pago del motor de
    // un egreso directo del módulo — los de RRHH usan el mismo valor para las dos cosas.
    const esPagoCpp = !!mov.esPagoConsolidado && !!mov.referenciaId;
    // La acreditación de un retiro no se revierte con un ajuste suelto: hay que deshacer la
    // verificación entera (movimiento + estado del retiro + caso abierto), y para ubicarla
    // hacen falta las dos mitades de la PK del retiro.
    const esRetiro = mov.origenTipo === 'RETIRO_CAJA' && !!mov.origenId && !!mov.origenSucursalId;
    // El central no anula una entrada varia como movimiento suelto: va por su módulo, que además la marca anulada.
    const entradaVariaId = this.entradaVariaIdDe(mov);
    // Una transferencia entre cajas hecha a mano se anula entera: el central revierte también la pata de
    // la otra caja. Las de una operación financiera llevan su origen y entran por esOpFinanciera.
    const esTransferencia = (mov.tipoMovimiento === CajaVirtualTipoMovimiento.TRANSFERENCIA_ENTRADA
        || mov.tipoMovimiento === CajaVirtualTipoMovimiento.TRANSFERENCIA_SALIDA)
      && (!mov.origenTipo || mov.origenTipo === 'MANUAL');

    let titulo: string, mensaje: string, exito: string;
    if (esRetiro) {
      titulo = 'Anular verificación del retiro';
      mensaje = `¿Deshacer la verificación del retiro #${mov.origenId}? Se revierte lo acreditado, el retiro vuelve a quedar pendiente y se cierra el caso abierto.`;
      exito = 'Verificación anulada';
    } else if (esPagoCpp) {
      titulo = 'Anular pago a proveedor';
      mensaje = '¿Anular todo el pago a proveedor? Se revertirán TODOS los movimientos consolidados (caja y banco) y se reabrirán las notas pagadas.';
      exito = 'Pago a proveedor anulado';
    } else if (esOpFinanciera) {
      titulo = 'Anular operación financiera';
      mensaje = '¿Anular la operación financiera completa? Se revertirán TODOS sus movimientos vinculados (origen y destino).';
      exito = 'Operación financiera anulada';
    } else if (entradaVariaId) {
      titulo = 'Anular entrada/salida varia';
      mensaje = `¿Anular la entrada/salida varia #${entradaVariaId}? Se generará un contra-movimiento de ajuste y la entrada quedará anulada también en Entradas/salidas varias.`;
      exito = 'Entrada/salida varia anulada';
    } else if (esTransferencia) {
      titulo = 'Anular transferencia';
      mensaje = '¿Anular la transferencia completa? Se revierte en las DOS cajas: la plata vuelve a la caja de origen y sale de la de destino. Hace falta permiso sobre las dos.';
      exito = 'Transferencia anulada';
    } else {
      titulo = 'Anular movimiento';
      mensaje = '¿Anular este movimiento? Se generará un contra-movimiento de ajuste (el original no se borra).';
      exito = 'Movimiento anulado';
    }

    this.dialogosService.confirm(
      titulo, mensaje, mov.descripcion || null, null, true, 'Sí, anular', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true || this.anulacionesPendientes.has(clave)) return;
      this.anulacionesPendientes.set(clave, null);
      this.actualizarAnulables();
      // Con cualquier resultado se relee la caja (movimientos y saldos): si se anuló hay que mostrarlo, un
      // rechazo por «ya está anulado» significa que la tabla estaba vieja, y sin respuesta es la única forma de
      // saber. La operación sigue bloqueada hasta que esa lectura termine bien.
      const terminar = () => {
        this.anulacionesPendientes.set(clave, this.movimientosCargaId);
        this.recargar();
      };
      // Cuatro ramas pasan por onSaveCustom: van sin su «Guardado con éxito» (el éxito lo avisa este
      // componente) y su error ya lo avisó onSaveCustom, así que se marca para no repetirlo. Todo
      // otro error —el pago a proveedor (Apollo directo, sin aviso genérico), la verificación que
      // no aparece, o uno que nadie previó— se avisa acá: por defecto se avisa, no se calla.
      const sinExitoGenerico = { avisarExito: false };
      const yaAvisado = (o: Observable<any>) => o.pipe(
        catchError(e => throwError(() => Object.assign(e ?? {}, { avisadoPorOnSaveCustom: true }))));
      const obs: Observable<any> = esRetiro
        ? this.retiroVerificacionService.onGetVerificacion(mov.origenId, mov.origenSucursalId).pipe(
            catchError(() => throwError(() => new Error('No se pudo consultar la verificación del retiro: el servidor no responde.'))),
            switchMap(v => v?.id
              ? yaAvisado(this.retiroVerificacionService.onAnular(v.id, undefined, sinExitoGenerico))
              : throwError(() => new Error('No se encontró la verificación de este retiro'))))
        : esPagoCpp
          ? this.pagarComprasService.onAnularPago(mov.referenciaId)
          : esOpFinanciera
            ? yaAvisado(this.operacionFinancieraService.onAnular(mov.referenciaId, undefined, sinExitoGenerico))
            : entradaVariaId
              ? yaAvisado(this.entradaVariaService.onAnular(entradaVariaId, undefined, sinExitoGenerico))
              : yaAvisado(this.cajaVirtualService.onAnularMovimiento(mov.id, undefined, sinExitoGenerico));
      obs.pipe(untilDestroyed(this)).subscribe({
        next: r => {
          if (r != null) {
            this.notificacion.notification$.next({ texto: exito, color: NotificacionColor.success, duracion: 3 });
          } else {
            // Ni error ni resultado: nadie avisó y no se sabe si se anuló.
            this.notificacion.openWarn(SIN_CONFIRMAR_ANULACION, 6);
          }
          terminar();
        },
        error: err => {
          // onSaveCustom ya avisó el rechazo, el error de red y la respuesta vacía; el corte, el link.
          if (!err?.avisadoPorOnSaveCustom && !esTimeoutDeLink(err)) {
            // Pago a proveedor (Apollo directo): sin respuesta llega con networkError (una respuesta vacía llega
            // como resultado nulo, arriba; se mira igual el mensaje por si cambia); cualquier otro error trae el
            // motivo del servidor.
            const sinRespuesta = !!err?.networkError || err?.message === MENSAJE_RESPUESTA_VACIA;
            const msg = sinRespuesta
              ? SIN_CONFIRMAR_ANULACION
              : (err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo anular');
            this.notificacion.notification$.next({ texto: msg, color: NotificacionColor.warn, duracion: sinRespuesta ? 6 : 5 });
          }
          terminar();
        }
      });
    });
  }

  /**
   * Anular desde la fila de banco: un pago 100 % bancario no tiene fila de caja. No revierte el
   * movimiento suelto: anula el pago o la operación a la que pertenece (ver accionAnularMovimientoBancario).
   */
  onAnularBanco(row: MovimientoBancarioRow) {
    this.movimientoBancarioAnulacionService.anular(row, row._accion)
      .pipe(untilDestroyed(this))
      .subscribe(hayQueReleer => {
        // Recarga todo: un pago mixto también movió la caja, y las cards de banco muestran el saldo. También
        // tras un rechazo o un «sin respuesta»: la anulación pudo haberse aplicado, o la tabla estaba vieja.
        if (hayQueReleer) this.recargar();
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarMovimientos();
  }
}
