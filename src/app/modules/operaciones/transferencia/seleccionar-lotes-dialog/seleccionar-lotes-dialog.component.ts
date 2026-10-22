import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  OnInit
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ESTADO_LOTE_LABELS, EstadoLote, StockLotePresentacion } from '../../lote/lote.model';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { LoteService } from '../../lote/lote.service';
import { EtapaAsignacionLote, TransferenciaItemLote } from '../transferencia.model';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { esSucursalCompras } from '../../../empresarial/sucursal/sucursal-compras.util';

/** Tolerancia al comparar cantidades que el backend devuelve ya divididas. */
const EPSILON = 0.0001;

export interface SeleccionarLotesDialogData {
  productoId: number;
  productoDescripcion: string;
  sucursalOrigenId: number;
  sucursalOrigenNombre: string;
  /**
   * Cantidad del ítem EN PRESENTACIONES, la misma unidad que muestra la fila de alta. Es lo que
   * hay que cubrir con el lote elegido.
   */
  cantidad: number;
  etapa: EtapaAsignacionLote;
  /** Presentación con la que se está cargando. El backend convierte los saldos a esta medida. */
  presentacionId: number;
  /** Asignación ya guardada, con las cantidades ya expresadas en presentaciones por el backend. */
  asignacionActual?: TransferenciaItemLote[];
  /**
   * Invierte la relación: en vez de repartir una cantidad ya fijada, el total que se asigna acá
   * ES la cantidad a transferir. Se usa al cargar un ítem nuevo, donde la cantidad todavía no
   * existe y sale justamente de decidir cuánto se saca del lote.
   */
  cantidadDefinidaPorLotes?: boolean;
}

/** Lo que devuelve el diálogo al cerrarse con "Confirmar". */
export interface SeleccionarLotesDialogResult {
  /** Reparto elegido, EN PRESENTACIONES. El backend lo convierte a unidades al guardar. */
  lotes: { loteId: number; cantidad: number }[];
  etapa: EtapaAsignacionLote;
  /** Cantidad elegida, en presentaciones. Es lo que va al campo "Cant. por present.". */
  total: number;
}

/**
 * Lote elegido. Vive fuera de las filas a propósito: la lista se pagina contra el backend y las
 * filas se reconstruyen en cada página, así que la selección tiene que sobrevivir a eso.
 */
interface LoteSeleccionado {
  loteId: number;
  numeroLote: string;
  cantidad: number;
}

/**
 * Fila de la tabla. Todo lo derivado se precalcula acá: el template solo lee propiedades.
 */
interface LoteRow {
  loteId: number;
  numeroLote: string;
  fechaVencimientoLabel: string;
  fechaRetiroLabel: string;
  estadoLabel: string;
  estadoClase: string;
  /** Saldo en presentaciones completas, tal como lo devolvió el backend. */
  disponible: number;
  /** El mismo saldo ya formateado, sin separador de miles. */
  disponibleLabel: string;
  /** Detalle en unidades y sobrantes. Vacío si la presentación vale 1. */
  disponibleUnidadesLabel: string;
  /** Los lotes que no están LIBERADO no se pueden elegir: es el bloqueo por recall. */
  seleccionable: boolean;
  /** Se mantiene por compatibilidad del template: con varios lotes por ítem ya no se bloquea. */
  bloqueada: boolean;
  control: FormControl;
}

/**
 * Elección manual del lote del que sale un ítem de transferencia.
 *
 * Por defecto el backend reparte por FEFO. Este diálogo deja sobreescribir esa decisión cuando
 * la realidad del depósito no coincide con el orden teórico.
 *
 * Se puede repartir un ítem entre VARIOS lotes (#429, lotes flexibles fase 1). La elección es
 * opcional: lo que no se asigna (o lo que pasa del saldo de un lote) lo completa el central por
 * FEFO y, si no alcanza, queda como SIN LOTE en origen y destino.
 *
 * Unidad de medida: se trabaja siempre en presentaciones, igual que el campo "Cant. por present."
 * de la fila de alta. La conversión a unidades y el saldo en presentaciones completas los
 * resuelve el backend, para que no existan dos implementaciones de la misma regla.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-lotes-dialog',
  templateUrl: './seleccionar-lotes-dialog.component.html',
  styleUrls: ['./seleccionar-lotes-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeleccionarLotesDialogComponent implements OnInit {

  readonly displayedColumns = [
    'numeroLote', 'fechaVencimiento', 'fechaRetiro', 'estado', 'disponible', 'cantidad'
  ];

  /** Filas de la página actual. */
  filas: LoteRow[] = [];
  /** Origen COMPRAS sin `VER_STOCK_COMPRAS`: el saldo de cada lote se muestra "—". */
  ocultarDisponible = false;
  busquedaControl = new FormControl('');
  cargando = true;
  /**
   * Solo la primera carga. Buscar y paginar recargan la lista, pero no deben esconder el
   * buscador ni el paginador: hacerlo sacaría el foco en cada tecla y en cada cambio de página.
   */
  cargandoInicial = true;
  sinLotes = false;
  /** True cuando la búsqueda no trajo nada, para distinguirlo de "el producto no tiene lotes". */
  sinCoincidencias = false;
  /**
   * La última carga de lotes falló (#390): se vacían las filas (no quedan saldos viejos a la vista) y Confirmar
   * se bloquea hasta reintentar; la selección se conserva.
   */
  cargaFallo = false;
  /** Solo aplica la última carga (búsqueda, página o reintento). */
  private cargaLotes = 0;

  // Paginación server-side, con el mismo contrato que el resto de los listados del sistema.
  pageIndex = 0;
  pageSize = 10;
  totalElementos = 0;

  /** Lotes elegidos (por loteId), independientes de la página que se esté viendo. */
  seleccion = new Map<number, LoteSeleccionado>();
  numeroLoteSeleccionado = '';
  hayLoteElegido = false;
  /** Mensaje cuando algún lote elegido no tiene saldo para lo asignado: se permite, con aviso. */
  avisoSobreSaldo = '';

  // Totales precalculados. La guía prohíbe getters y cálculos en el template.
  cantidadRequerida = 0;
  totalAsignado = 0;
  faltante = 0;
  hayFaltante = false;
  excedeRequerido = false;
  mensajeFaltante = '';
  // Etiquetas ya formateadas, para que el template no aplique pipes ni formatee nada.
  cantidadRequeridaLabel = '0';
  totalAsignadoLabel = '0';
  faltanteLabel = '0';

  productoDescripcion = '';
  sucursalOrigenNombre = '';
  presentacionLabel = '';
  /** Solo el nombre, sin la equivalencia, para armar mensajes legibles. */
  presentacionNombre = 'presentación';
  /** True si una presentación vale más de una unidad: ahí importa mostrar la equivalencia. */
  esPresentacionMultiple = false;
  /**
   * Paso del input. Con presentaciones de varias unidades solo se admiten enteros, porque una
   * caja no se parte; con presentación unidad se deja libre para los productos de balanza.
   */
  pasoCantidad = 'any';
  /** True cuando el total elegido define la cantidad, en vez de tener que cubrir una ya fijada. */
  cantidadDefinidaPorLotes = false;
  tituloCantidad = 'Cantidad a transferir';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarLotesDialogData,
    private dialogRef: MatDialogRef<SeleccionarLotesDialogComponent>,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
    private mainService: MainService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.ocultarDisponible =
      !this.mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS]) &&
      esSucursalCompras({ nombre: this.data?.sucursalOrigenNombre });
    this.cantidadDefinidaPorLotes = this.data?.cantidadDefinidaPorLotes === true;
    this.cantidadRequerida = this.data?.cantidad || 0;
    this.cantidadRequeridaLabel = this.formatearCantidad(this.cantidadRequerida);
    this.productoDescripcion = this.data?.productoDescripcion || '';
    this.sucursalOrigenNombre = this.data?.sucursalOrigenNombre || '';
    this.tituloCantidad = this.cantidadDefinidaPorLotes
      ? 'Total elegido'
      : 'Cantidad a transferir';

    this.tomarAsignacionPrevia();

    // La búsqueda va al backend: con paginación server-side, filtrar en la pantalla solo
    // alcanzaría a la página visible.
    this.busquedaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarLotes(true);
      });

    this.cargarLotes();
  }

  /** Precarga el lote que ya tenía asignado el ítem, para poder corregirlo en vez de recargarlo. */
  private tomarAsignacionPrevia(): void {
    (this.data?.asignacionActual || []).forEach((previa) => {
      // Las filas SIN LOTE (loteId nulo) no se eligen: las arma el central con lo que sobra.
      if (previa?.loteId == null || !(previa.cantidadPresentacion > 0)) {
        return;
      }
      this.seleccion.set(previa.loteId, {
        loteId: previa.loteId,
        numeroLote: previa.numeroLote,
        cantidad: previa.cantidadPresentacion
      });
    });
  }

  private cargarLotes(silentLoad = false): void {
    const carga = ++this.cargaLotes;
    this.cargando = true;
    this.loteService
      .onGetStockPorLoteEnPresentacion(
        this.data.productoId,
        this.data.sucursalOrigenId,
        this.data.presentacionId,
        this.busquedaControl.value,
        this.pageIndex,
        this.pageSize,
        true,
        silentLoad,
        TIMEOUT_CONSULTA_DE_FONDO_MS
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<StockLotePresentacion>) => {
          if (carga !== this.cargaLotes) return; // respuesta de una búsqueda o página anterior
          if (res == null) {
            this.marcarCargaFallida(); // error GraphQL: el servicio ya avisó
            return;
          }
          this.cargaFallo = false;
          const lotes = res?.getContent || [];
          this.totalElementos = res?.getTotalElements || 0;
          this.tomarDatosDePresentacion(lotes);
          this.filas = lotes.map((lote) => this.crearFila(lote));
          this.evaluarEstadoVacio();
          this.cargando = false;
          this.cargandoInicial = false;
          this.aplicarBloqueoPorSeleccion();
          this.recalcularTotales();
          this.cdr.markForCheck();
        },
        error: () => {
          if (carga !== this.cargaLotes) return;
          this.notificacionService.openWarn('No se pudieron consultar los lotes disponibles: usá «Reintentar».', 5);
          this.marcarCargaFallida();
        }
      });
  }

  private marcarCargaFallida(): void {
    this.cargando = false;
    this.cargandoInicial = false;
    this.cargaFallo = true;
    this.filas = [];
    this.totalElementos = 0;
    this.sinLotes = false;
    this.sinCoincidencias = false;
    this.cdr.markForCheck();
  }

  reintentarCarga(): void {
    this.cargarLotes();
  }

  /**
   * Distingue "el producto no tiene lotes" de "la búsqueda no encontró nada": el primero es
   * informativo, el segundo se resuelve borrando el filtro.
   */
  private evaluarEstadoVacio(): void {
    const vacio = this.totalElementos === 0;
    const buscando = (this.busquedaControl.value || '').trim().length > 0;
    this.sinLotes = vacio && !buscando;
    this.sinCoincidencias = vacio && buscando;
  }

  /** El nombre y el factor de la presentación vienen resueltos junto con el saldo. */
  private tomarDatosDePresentacion(lotes: StockLotePresentacion[]): void {
    const primero = lotes[0];
    if (primero == null) {
      return;
    }
    const unidades = primero.unidadesPorPresentacion || 1;
    this.esPresentacionMultiple = unidades > 1;
    this.pasoCantidad = this.esPresentacionMultiple ? '1' : 'any';
    const nombre = primero.presentacionDescripcion;
    this.presentacionNombre = nombre || 'presentación';
    this.presentacionLabel = this.esPresentacionMultiple
      ? `${nombre || 'Presentación'} · ${unidades} unidades c/u`
      : nombre || 'Unidad';
  }

  private crearFila(lote: StockLotePresentacion): LoteRow {
    const seleccionable = lote.estado === EstadoLote.LIBERADO;
    const elegido = this.seleccion.get(lote.loteId);
    const control = new FormControl({
      value: elegido ? elegido.cantidad : null,
      disabled: !seleccionable
    });
    return {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote || '-',
      fechaVencimientoLabel: this.fechaCorta(lote.fechaVencimiento),
      fechaRetiroLabel: this.fechaCorta(lote.fechaRetiro),
      estadoLabel: ESTADO_LOTE_LABELS[lote.estado] || lote.estado || '-',
      estadoClase: this.claseSegunEstado(lote.estado),
      disponible: lote.cantidadDisponiblePresentacion,
      // `disponible` se queda con el número: la validación de sobreasignación lo necesita.
      disponibleLabel: this.ocultarDisponible
        ? '—'
        : this.formatearCantidad(lote.cantidadDisponiblePresentacion),
      disponibleUnidadesLabel: this.ocultarDisponible ? '' : this.armarDetalleUnidades(lote),
      seleccionable,
      bloqueada: false,
      control
    };
  }

  /**
   * Detalle en unidades debajo del saldo: cuántas unidades hay en total y cuántas quedan fuera
   * de las presentaciones completas. Que el operador vea que las sueltas existen pero no salen
   * con esta presentación evita que crea que se le perdió stock.
   */
  private armarDetalleUnidades(lote: StockLotePresentacion): string {
    if (!this.esPresentacionMultiple) {
      return '';
    }
    const total = `${this.formatearCantidad(lote.cantidadDisponible)} unid.`;
    if (!lote.unidadesSobrantes) {
      return total;
    }
    return `${total} · sobran ${this.formatearCantidad(lote.unidadesSobrantes)}`;
  }

  /**
   * Se dispara al tipear una cantidad. Cada fila con cantidad suma un lote al reparto; vaciarla
   * (o dejarla en 0) lo saca. Un lote en 0 se ignora.
   */
  onCantidadCambiada(fila: LoteRow): void {
    const valor = Number(fila.control.value);
    const tieneCantidad = fila.control.value != null && !isNaN(valor) && valor > 0;

    if (tieneCantidad) {
      this.seleccion.set(fila.loteId, {
        loteId: fila.loteId,
        numeroLote: fila.numeroLote,
        cantidad: valor
      });
    } else {
      this.seleccion.delete(fila.loteId);
    }

    this.aplicarBloqueoPorSeleccion();
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  /** Lotes elegidos con cantidad mayor a cero, en el orden en que se eligieron. */
  private lotesElegidos(): LoteSeleccionado[] {
    return Array.from(this.seleccion.values()).filter((l) => l.cantidad > EPSILON);
  }

  /**
   * Ya no se bloquean filas: se puede sacar de varios lotes. Solo se actualiza el resumen de
   * qué lotes están elegidos. Los lotes que no están LIBERADO siguen deshabilitados desde
   * `crearFila` (el recall manda).
   */
  private aplicarBloqueoPorSeleccion(): void {
    const elegidos = this.lotesElegidos();
    this.numeroLoteSeleccionado = elegidos.map((l) => l.numeroLote).join(', ');
    this.hayLoteElegido = elegidos.length > 0;
    this.filas.forEach((fila) => (fila.bloqueada = false));
  }

  /** Arma los totales y el mensaje de estado: el total es la suma de todos los lotes elegidos. */
  private recalcularTotales(): void {
    const total = this.lotesElegidos().reduce((acc, l) => acc + l.cantidad, 0);
    this.totalAsignado = total;
    this.totalAsignadoLabel = this.formatearCantidad(total);
    this.avisoSobreSaldo = this.armarAvisoSobreSaldo();

    // Cuando el total define la cantidad no hay nada que cubrir: no puede faltar ni sobrar.
    if (this.cantidadDefinidaPorLotes) {
      this.cantidadRequerida = total;
      this.cantidadRequeridaLabel = this.totalAsignadoLabel;
      this.faltante = 0;
      this.faltanteLabel = '0';
      this.hayFaltante = false;
      this.excedeRequerido = false;
      this.mensajeFaltante =
        total > 0
          ? 'Esta es la cantidad que se va a transferir del producto.'
          : 'Indicá cuánto sacar de cada lote. Esa suma es la que se transfiere.';
      return;
    }

    this.faltante = this.cantidadRequerida - total;
    this.faltanteLabel = this.formatearCantidad(this.faltante);
    this.hayFaltante = this.faltante > EPSILON;
    this.excedeRequerido = this.faltante < -EPSILON;

    if (this.excedeRequerido) {
      this.mensajeFaltante =
        'Asignaste más de lo que se transfiere. Ajustá la cantidad antes de confirmar.';
    } else if (this.hayFaltante) {
      this.mensajeFaltante =
        'El resto lo completa el sistema por FEFO y, si no alcanza, sale como SIN LOTE.';
    } else {
      this.mensajeFaltante = 'La cantidad está cubierta con los lotes elegidos.';
    }
  }

  /**
   * Aviso (no bloqueo) cuando a un lote visible se le asigna más que su saldo: el excedente
   * sale como SIN LOTE. Solo se valida contra filas visibles; el central recorta igual.
   */
  private armarAvisoSobreSaldo(): string {
    const pasados = this.lotesElegidos().filter((l) => {
      const fila = this.filas.find((f) => f.loteId === l.loteId);
      return fila != null && l.cantidad - fila.disponible > EPSILON;
    });
    if (pasados.length === 0) {
      return '';
    }
    const nombres = pasados.map((l) => l.numeroLote).join(', ');
    return `Asignaste más del saldo de ${pasados.length > 1 ? 'los lotes' : 'el lote'} ${nombres}: lo que pase del saldo sale como SIN LOTE.`;
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarLotes(true);
  }

  onLimpiar(): void {
    this.seleccion.clear();
    this.filas.forEach((fila) => fila.control.setValue(null, { emitEvent: false }));
    this.aplicarBloqueoPorSeleccion();
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  onConfirmar(): void {
    // Sin saldo verificado no se cambia el reparto, pero tampoco se traba la transferencia: el
    // ítem sigue como está y el central reparte por FEFO; lo que no cubra queda SIN LOTE.
    if (this.cargaFallo) {
      this.notificacionService.openWarn('No se pudo verificar el saldo de los lotes: el ítem queda como estaba y el sistema asigna los lotes.', 5);
      this.dialogRef.close(null);
      return;
    }
    if (this.excedeRequerido) {
      this.notificacionService.openWarn(
        'No podés asignar más cantidad de la que se transfiere'
      );
      return;
    }
    // En este modo la cantidad elegida ES la del ítem: confirmar con cero lo dejaría sin nada.
    if (this.cantidadDefinidaPorLotes && this.totalAsignado <= 0) {
      this.notificacionService.openWarn('Indicá cuánto sacar de cada lote');
      return;
    }
    if (this.hayPresentacionFraccionada()) {
      return;
    }
    if (this.avisoSobreSaldo) {
      this.notificacionService.openWarn(this.avisoSobreSaldo, 5);
    }
    this.dialogRef.close({
      lotes: this.lotesElegidos().map((l) => ({ loteId: l.loteId, cantidad: l.cantidad })),
      etapa: this.data.etapa,
      total: this.totalAsignado
    } as SeleccionarLotesDialogResult);
  }

  /**
   * Una presentación es indivisible: no se puede mandar media caja. Solo aplica cuando la
   * presentación vale más de una unidad, porque con presentación UNIDAD un producto de balanza
   * sí puede llevar decimales.
   */
  private hayPresentacionFraccionada(): boolean {
    if (!this.esPresentacionMultiple) {
      return false;
    }
    if (this.lotesElegidos().every((l) => Number.isInteger(l.cantidad))) {
      return false;
    }
    this.notificacionService.openWarn(
      `Solo se pueden transferir ${this.presentacionNombre} completas`
    );
    return true;
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }

  /**
   * Cantidades sin separador de miles: un saldo de 3000 se lee mejor como "3000" que como
   * "3.000", que en es-PY se confunde con un decimal. Se respeta el separador decimal del
   * locale, porque una presentación de varias unidades da cantidades fraccionarias.
   */
  private formatearCantidad(valor: number): string {
    return (valor || 0).toLocaleString(this.locale, {
      useGrouping: false,
      maximumFractionDigits: 3
    });
  }

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }
}
