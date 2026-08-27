import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageInfo } from '../../../../../app.component';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { StockLotePresentacion } from '../../../../operaciones/lote/lote.model';
import { LoteService } from '../../../../operaciones/lote/lote.service';
import { VentaItemLoteInput } from '../../../../operaciones/venta/venta-item.model';

/** Tolerancia al comparar cantidades en punto flotante. */
const EPSILON = 0.0001;

/**
 * Tamaño con el que se pide el universo de lotes: uno solo, grande, para traerlos todos.
 *
 * El backend arma la lista entera en memoria y recién después la corta, así que pedir todo no le
 * cuesta más que pedir una página. Un producto con más lotes vendibles que esto no existe en el
 * catálogo, y si apareciera el peor caso es que el diálogo crea que ya no queda de dónde elegir.
 */
const TAMANIO_UNIVERSO = 500;

export interface SeleccionarLoteVentaDialogData {
  productoId: number;
  productoDescripcion: string;
  presentacionId: number;
  sucursalId: number;
  /** Cantidad del ítem, EN PRESENTACIONES: es el número que el cajero cargó en la venta. */
  cantidad: number;
  /**
   * Unidades que trae cada presentación. Es el único factor que hace falta para expresar el ítem
   * en unidades, que es como se muestra y se elige el lote acá.
   */
  unidadesPorPresentacion: number;
}

/** Lo que devuelve el diálogo. Lista vacía = FEFO automático. Las cantidades van EN UNIDADES. */
export interface SeleccionarLoteVentaDialogResult {
  lotes: VentaItemLoteInput[];
}

/**
 * Lote elegido por el cajero.
 *
 * Vive FUERA de las filas a propósito: la lista se pagina y se filtra contra el backend, así que
 * las filas se reconstruyen en cada búsqueda y en cada cambio de página. Si la elección viviera en
 * la fila, se perdería sin aviso al pasar de página.
 */
interface LoteElegido {
  loteId: number;
  numeroLote: string;
  cantidad: number;
  cantidadLabel: string;
}

/**
 * Fila de la tabla. Es una proyección de solo lectura de la página actual: la fuente de verdad de
 * lo elegido es el mapa de selección. Todo lo derivado se precalcula acá, el template solo lee
 * propiedades y nunca llama funciones ni getters.
 */
interface LoteRow {
  loteId: number;
  numeroLote: string;
  vencimientoLabel: string;
  retiroLabel: string;
  /** Unidades disponibles. Es el techo de lo que se puede pedir de este lote. */
  disponible: number;
  disponibleLabel: string;
  /**
   * Unidades que se sacan de este lote. No la tipea el cajero: se reparte sola al marcar el lote,
   * porque el backend trata la elección como preferencia y recorta contra el saldo real igual.
   */
  cantidad: number;
  cantidadLabel: string;
  seleccionado: boolean;
  /**
   * Precalculado para el template: un lote que no puede llevar nada no se puede marcar. Es lo que
   * impide tildar un segundo lote cuando lo pedido ya sale entero del primero.
   */
  deshabilitado: boolean;
  /** Precalculado para resaltar lo que hay que sacar antes, sin lógica en el template. */
  clase: string;
}

/**
 * Selector de lote para la venta.
 *
 * Abre directo en la lista de lotes, con el buscador enfocado. El cajero marca de dónde sale la
 * mercadería que tiene en la mano: mientras quede un lote sin marcar y falte cubrir, el confirmar
 * espera. Lo que se marca es una preferencia, que el backend recorta al saldo real.
 *
 * FEFO queda como último recurso y no como camino normal: solo cubre lo que ya no tiene lote de
 * dónde salir, y en ese caso la pantalla lo dice antes de dejar confirmar.
 *
 * La lista se busca y se pagina contra el backend, porque con el tiempo un producto acumula
 * muchos lotes y filtrar solo la página visible dejaría lotes invisibles sin que el cajero se
 * entere.
 *
 * Si el producto tiene control de lote pero no hay stock por lote (mercadería cargada antes de que
 * el producto lo tuviera), el diálogo avisa y deja vender igual: la venta nunca se bloquea por
 * datos de lote incompletos.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-lote-venta-dialog',
  templateUrl: './seleccionar-lote-venta-dialog.component.html',
  styleUrls: ['./seleccionar-lote-venta-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeleccionarLoteVentaDialogComponent implements OnInit {

  readonly displayedColumns = ['seleccion', 'numeroLote', 'vencimiento', 'retiro', 'disponible', 'cantidad'];

  @ViewChild('inputBusqueda') inputBusqueda: ElementRef<HTMLInputElement>;
  @ViewChild('botonConfirmar', { read: ElementRef }) botonConfirmar: ElementRef<HTMLButtonElement>;

  /** Filas de la página actual. */
  filas: LoteRow[] = [];

  busquedaControl = new FormControl('');

  /**
   * Lo elegido, indexado por lote. Sobrevive a la búsqueda y a la paginación porque no depende de
   * qué filas estén en pantalla.
   */
  private seleccion = new Map<number, LoteElegido>();

  /** La misma selección como lista, para que el template la recorra sin pipes ni conversiones. */
  lotesElegidos: LoteElegido[] = [];
  hayLotesElegidos = false;

  /**
   * Solo la primera carga. Buscar y paginar recargan la lista, pero no deben esconder el buscador:
   * hacerlo le sacaría el foco al cajero en cada tecla.
   */
  cargandoInicial = true;
  sinLotes = false;
  /** True cuando la búsqueda no trajo nada, para distinguirlo de "el producto no tiene lotes". */
  sinCoincidencias = false;
  /** Enter pendiente de resolverse contra el resultado de la consulta que está en camino. */
  private seleccionarUnicoAlCargar = false;
  /** Error de una recarga posterior. No bloquea: el buscador sigue en pantalla para reintentar. */
  mensajeError = '';

  // Paginación server-side, con el mismo contrato que el resto de los listados del sistema.
  pageIndex = 0;
  pageSize = 5;
  totalElementos = 0;

  /** Todo precalculado para el template. */
  productoDescripcion = '';
  /** Cantidad a cubrir, EN UNIDADES: es la unidad del ledger de lotes y de la tabla de abajo. */
  cantidadRequerida = 0;
  totalSeleccionado = 0;
  totalSeleccionadoLabel = '0';
  faltanteLabel = '';
  hayFaltante = false;
  /** Unidades que todavía no tienen lote. Manda sobre qué filas se pueden marcar. */
  pendiente = 0;
  /** Lo pedido ya sale entero de lo marcado: no queda nada para darle a otro lote. */
  todoCubierto = false;
  /** El aviso de "ya está cubierto" solo tiene sentido después de marcar algo. */
  mostrarCubierto = false;
  /**
   * Todos los lotes vendibles del producto, sin el filtro del buscador ni la página visible.
   *
   * La tabla muestra de a poco y filtra contra el backend, así que por sí sola no sabe si queda
   * algún lote sin marcar. Sin ese dato no se puede distinguir "todavía hay de dónde sacarlo" de
   * "el stock por lote no alcanza", que es lo único que decide si la venta puede salir sin cubrir.
   */
  private universo: { loteId: number; disponible: number }[] = [];
  /** Sin universo no se bloquea nada: una consulta caída no puede trabar el mostrador. */
  private universoCargado = false;
  /** Queda al menos un lote vendible sin marcar, en cualquier página. */
  hayLotesSinMarcar = false;
  /** Por qué está bloqueado el confirmar. Vacío cuando se puede confirmar. */
  motivoBloqueo = '';
  puedeConfirmar = true;
  mensajeSinLotes = '';

  constructor(
    private dialogRef: MatDialogRef<SeleccionarLoteVentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarLoteVentaDialogData,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.productoDescripcion = data?.productoDescripcion || '';
    this.calcularCantidadRequerida();
  }

  /**
   * Toda la pantalla habla en unidades: es la unidad del lote, la del ledger y la de FEFO. Lo que
   * el cajero necesita decidir acá es de qué lote salen esas unidades, así que el encabezado
   * muestra un solo número y no obliga a convertir nada mentalmente.
   *
   * La conversión presentación → unidad es la misma que ya aplica el resto del sistema para
   * cualquier producto: cantidad por el tamaño de la presentación.
   */
  private calcularCantidadRequerida(): void {
    const porPresentacion = this.data?.unidadesPorPresentacion > 0
      ? this.data.unidadesPorPresentacion
      : 1;
    this.cantidadRequerida = (this.data?.cantidad || 0) * porPresentacion;
  }

  ngOnInit(): void {
    // La búsqueda va al backend: con paginación server-side, filtrar en la pantalla solo
    // alcanzaría a la página visible.
    this.busquedaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => {
        this.pageIndex = 0;
        this.cargarLotes();
      });

    this.cargarUniverso();
    this.cargarLotes();
  }

  /**
   * El universo se pide una sola vez y sin filtro: es la foto de todo lo que se puede elegir.
   *
   * Va aparte de la consulta de la tabla porque esa se rearma en cada tecla y en cada página, y lo
   * que se necesita acá es justo lo contrario: algo estable contra lo que comparar lo marcado.
   *
   * Si falla, el diálogo sigue andando sin bloquear nada. Es la misma decisión que el resto de la
   * pantalla: ante datos de lote incompletos, la venta sale igual.
   */
  private cargarUniverso(): void {
    this.loteService
      .onGetStockPorLoteEnPresentacion(
        this.data.productoId,
        this.data.sucursalId,
        this.data.presentacionId,
        null,
        0,
        TAMANIO_UNIVERSO,
        false,
        true
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<StockLotePresentacion>) => {
          this.universo = (res?.getContent || []).map((lote) => ({
            loteId: lote.loteId,
            disponible: lote.cantidadDisponible || 0
          }));
          this.universoCargado = true;
          this.recalcular();
        },
        error: () => {
          this.universo = [];
          this.universoCargado = false;
          this.recalcular();
        }
      });
  }

  /**
   * Los lotes se piden al servidor FILIAL (servidor = false): es donde vive el stock de esta
   * sucursal y donde la venta va a resolver FEFO. Pedirlos al central daría un saldo que no es el
   * que se va a descontar.
   *
   * Siempre en silencio: el diálogo muestra su propio estado de carga y el spinner global taparía
   * el mostrador en cada tecla del buscador.
   */
  private cargarLotes(): void {
    this.loteService
      .onGetStockPorLoteEnPresentacion(
        this.data.productoId,
        this.data.sucursalId,
        this.data.presentacionId,
        this.busquedaControl.value,
        this.pageIndex,
        this.pageSize,
        false,
        true
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<StockLotePresentacion>) => {
          const primeraCarga = this.cargandoInicial;
          const contenido = res?.getContent || [];
          this.totalElementos = res?.getTotalElements || 0;
          this.filas = contenido.map((lote) => this.mapearFila(lote));
          this.mensajeError = '';
          this.evaluarEstadoVacio();
          this.cargandoInicial = false;
          this.recalcular();
          this.resolverEnterPendiente();
          // El buscador recién existe cuando Angular pinta la lista, así que el foco va acá y no
          // en ngOnInit: es lo primero que el cajero necesita para tipear el lote que tiene en la
          // mano.
          if (primeraCarga && !this.sinLotes) {
            this.enfocarBusqueda();
          }
        },
        error: () => {
          this.manejarErrorDeCarga();
        }
      });
  }

  /**
   * Un error en la primera carga deja al cajero sin lista: se avisa y se sigue vendiendo por FEFO,
   * que es la salida que no bloquea el mostrador. Un error al buscar o al paginar, en cambio, no
   * puede esconder el buscador: sacarlo dejaría al cajero sin forma de reintentar.
   */
  /** Cierra el Enter que quedó esperando esta consulta. Con más de un lote no elige nada. */
  private resolverEnterPendiente(): void {
    if (!this.seleccionarUnicoAlCargar) {
      return;
    }
    this.seleccionarUnicoAlCargar = false;
    if (this.hayUnSoloResultado()) {
      this.elegirUnicoResultado();
    }
  }

  private manejarErrorDeCarga(): void {
    this.seleccionarUnicoAlCargar = false;
    this.filas = [];
    this.totalElementos = 0;
    this.sinCoincidencias = false;

    if (this.cargandoInicial) {
      this.cargandoInicial = false;
      this.sinLotes = true;
      this.mensajeSinLotes = 'No se pudo consultar el stock por lote. La venta se puede '
        + 'completar igual, por FEFO automático.';
    } else {
      this.mensajeError = 'No se pudo consultar el stock por lote. Probá de nuevo; lo que ya '
        + 'elegiste se mantiene.';
    }

    this.notificacionService.openAlgoSalioMal('Error al consultar el stock por lote');
    this.recalcular();
  }

  /**
   * Distingue "el producto no tiene lotes" de "la búsqueda no encontró nada": el primero deja
   * vender igual sin trazabilidad, el segundo se resuelve borrando el filtro.
   */
  private evaluarEstadoVacio(): void {
    const vacio = this.totalElementos === 0;
    const buscando = (this.busquedaControl.value || '').trim().length > 0;
    this.sinLotes = vacio && !buscando;
    this.sinCoincidencias = vacio && buscando;
    this.mensajeSinLotes = this.sinLotes
      ? 'Este producto tiene control de lote pero no hay stock por lote en esta sucursal. '
        + 'La venta se puede completar igual y quedará sin trazabilidad de lote.'
      : '';
  }

  /**
   * La fila se hidrata desde la selección: lo elegido reaparece al volver a su página.
   *
   * El saldo se toma en unidades, tal como lo manda el backend, y no en presentaciones completas.
   * Además de ser la unidad que ve el cajero, evita el caso confuso de un lote con 4 unidades y
   * presentación de 6, que como "presentaciones completas" mostraba 0 disponible.
   */
  private mapearFila(lote: StockLotePresentacion): LoteRow {
    const disponible = lote.cantidadDisponible || 0;
    const elegido = this.seleccion.get(lote.loteId);
    return {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote || '-',
      vencimientoLabel: this.fechaCorta(lote.fechaVencimiento),
      retiroLabel: this.fechaCorta(lote.fechaRetiro),
      disponible,
      disponibleLabel: `${disponible}`,
      cantidad: elegido ? elegido.cantidad : 0,
      cantidadLabel: elegido ? `${elegido.cantidad}` : '—',
      seleccionado: elegido != null,
      // La resuelve recalcular(), que corre siempre después de mapear la página.
      deshabilitado: false,
      clase: this.claseSegunFecha(lote)
    };
  }

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
  }

  /** Resalta lo que hay que sacar antes. Se calcula una vez por fila, no en el template. */
  private claseSegunFecha(lote: StockLotePresentacion): string {
    const referencia = lote.fechaRetiro || lote.fechaVencimiento;
    if (!referencia) return '';
    const dias = Math.floor((new Date(referencia).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'fila-vencida';
    if (dias <= 30) return 'fila-por-vencer';
    return '';
  }

  /**
   * Marcar un lote le asigna lo que falta cubrir, acotado a su saldo. La cantidad no se tipea: el
   * cajero elige DE QUÉ lote sale, y el reparto lo resuelve el sistema.
   *
   * Es lo que el backend hace de todos modos —la elección es una preferencia que FEFO recorta al
   * saldo real y completa con otros lotes—, así que un campo editable prometía un control que no
   * existía. Si un lote no alcanza, se marca otro y se lleva el resto.
   */
  alternarLote(fila: LoteRow): void {
    if (fila.seleccionado) {
      this.desmarcar(fila);
    } else {
      // `pendiente` lo mantiene al día recalcular(), que corre al final de cada cambio.
      const asignada = Math.max(0, Math.min(fila.disponible, this.pendiente));
      // Con lo pedido ya cubierto no queda nada para este lote: marcarlo no diría nada. Con la
      // fila deshabilitada esto casi no llega, pero si llega hay que repintar: el checkbox ya se
      // tildó solo al hacer click y `seleccionado` no cambió de valor, así que el binding no lo
      // vuelve atrás y el tilde queda mintiendo sobre de dónde sale el stock.
      if (asignada <= EPSILON) {
        this.repintarFila(fila);
        return;
      }
      fila.seleccionado = true;
      fila.cantidad = asignada;
      fila.cantidadLabel = `${asignada}`;
      this.registrarSeleccion(fila);
    }
    this.recalcular();
  }

  private desmarcar(fila: LoteRow): void {
    fila.seleccionado = false;
    fila.cantidad = 0;
    fila.cantidadLabel = '—';
    this.seleccion.delete(fila.loteId);
  }

  /** Quita un lote desde el resumen, sin tener que volver a la página donde está su fila. */
  quitarLote(elegido: LoteElegido): void {
    this.seleccion.delete(elegido.loteId);
    const fila = this.filas.find((f) => f.loteId === elegido.loteId);
    if (fila != null) {
      this.desmarcar(fila);
    }
    this.recalcular();
  }

  private registrarSeleccion(fila: LoteRow): void {
    this.seleccion.set(fila.loteId, {
      loteId: fila.loteId,
      numeroLote: fila.numeroLote,
      cantidad: fila.cantidad,
      cantidadLabel: `${fila.cantidad}`
    });
  }

  /**
   * Fuerza a Angular a redibujar una fila reemplazando su objeto: con OnPush y `[checked]`, un
   * valor que no cambió no repinta el checkbox, y el estado interno del mat-checkbox se queda con
   * lo que pintó el click.
   */
  private repintarFila(fila: LoteRow): void {
    const indice = this.filas.indexOf(fila);
    if (indice < 0) {
      return;
    }
    const copia = this.filas.slice();
    copia[indice] = { ...fila };
    this.filas = copia;
    this.cdr.markForCheck();
  }

  /**
   * Un lote se puede marcar solo si le queda algo para llevar. Sin unidades pendientes —o sin
   * saldo— marcarlo no asignaría nada, y un tilde sin cantidad hace creer que la venta salió de
   * dos lotes cuando salió de uno: es justo lo que después no coincide con el ticket.
   *
   * Lo ya marcado nunca se deshabilita: destildarlo es la forma de cambiar de dónde sale.
   */
  private actualizarHabilitacion(): void {
    this.filas.forEach((fila) => {
      fila.deshabilitado = !fila.seleccionado
        && (this.todoCubierto || fila.disponible <= EPSILON);
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarLotes();
  }

  /**
   * Enter en el buscador cierra el caso frecuente: tipear el lote que se tiene en la mano y
   * confirmar sin soltar el teclado. Solo actúa si el filtro dejó UN lote en todo el resultado;
   * con varios no se elige por adivinanza.
   *
   * Si lo que hay en pantalla todavía es de antes de la última tecla (la búsqueda espera 300 ms),
   * se fuerza la consulta y se decide con lo que devuelva: esperar el debounce haría que la tecla
   * pareciera no responder justo cuando el cajero va rápido.
   */
  onEnterBusqueda(): void {
    if (this.hayUnSoloResultado()) {
      this.elegirUnicoResultado();
      return;
    }
    this.seleccionarUnicoAlCargar = true;
    this.pageIndex = 0;
    this.cargarLotes();
  }

  private hayUnSoloResultado(): boolean {
    return this.totalElementos === 1 && this.filas.length === 1;
  }

  private elegirUnicoResultado(): void {
    const fila = this.filas[0];
    if (fila == null) {
      return;
    }
    if (!fila.seleccionado) {
      this.alternarLote(fila);
    }
    this.enfocarConfirmar();
  }

  private enfocarBusqueda(): void {
    // El input recién existe después de que Angular pinta la lista.
    setTimeout(() => this.inputBusqueda?.nativeElement?.focus());
  }

  private enfocarConfirmar(): void {
    setTimeout(() => this.botonConfirmar?.nativeElement?.focus());
  }

  /** Totales sobre la selección completa, no sobre la página visible. */
  private recalcular(): void {
    this.lotesElegidos = Array.from(this.seleccion.values());
    this.hayLotesElegidos = this.lotesElegidos.length > 0;
    this.totalSeleccionado = this.lotesElegidos.reduce(
      (total, elegido) => total + (elegido.cantidad || 0),
      0
    );
    this.totalSeleccionadoLabel = `${this.totalSeleccionado}`;

    this.pendiente = Math.max(0, this.cantidadRequerida - this.totalSeleccionado);
    this.hayFaltante = this.pendiente > EPSILON;
    this.todoCubierto = !this.hayFaltante;
    this.mostrarCubierto = this.todoCubierto && this.hayLotesElegidos;
    // Bloquear exige las dos cosas: saber que queda un lote sin marcar Y que la tabla esté en
    // condiciones de marcarlo. Con la lista caída o vacía, pedirle al cajero que elija otro lote
    // sería trabarlo sin salida.
    const sePuedeElegir = !this.cargandoInicial && !this.sinLotes && !this.mensajeError;
    this.hayLotesSinMarcar = this.universoCargado && sePuedeElegir
      && this.universo.some((lote) => !this.seleccion.has(lote.loteId));
    this.actualizarFaltante();
    this.actualizarHabilitacion();
    this.cdr.markForCheck();
  }

  /**
   * Mientras quede un lote sin marcar, el faltante es una decisión pendiente y no un dato: hay de
   * dónde sacarlo y el cajero es el único que sabe de qué lote está agarrando la mercadería. Por
   * eso el confirmar espera.
   *
   * Cuando ya no queda ninguno, el faltante pasa a ser un hecho del stock: se avisa que esas
   * unidades salen sin trazabilidad y la venta se completa igual, que es la regla de toda la
   * pantalla.
   */
  private actualizarFaltante(): void {
    if (!this.hayFaltante) {
      this.faltanteLabel = '';
      this.motivoBloqueo = '';
      this.puedeConfirmar = true;
      return;
    }
    if (this.hayLotesSinMarcar) {
      this.faltanteLabel = `Faltan ${this.pendiente} unid. — elegí otro lote para cubrirlas.`;
      this.motivoBloqueo = `Elegí de qué lote salen las ${this.pendiente} unid. que faltan.`;
      this.puedeConfirmar = false;
      return;
    }
    this.faltanteLabel = `Faltan ${this.pendiente} unid. y no hay más stock por lote: `
      + 'esas unidades salen sin trazabilidad.';
    this.motivoBloqueo = '';
    this.puedeConfirmar = true;
  }

  confirmar(): void {
    const lotes: VentaItemLoteInput[] = this.lotesElegidos
      .filter((elegido) => elegido.cantidad > EPSILON)
      .map((elegido) => ({ loteId: elegido.loteId, cantidad: elegido.cantidad }));
    this.dialogRef.close({ lotes } as SeleccionarLoteVentaDialogResult);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
