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

export interface SeleccionarLoteVentaDialogData {
  productoId: number;
  productoDescripcion: string;
  presentacionId: number;
  sucursalId: number;
  /** Cantidad a cubrir, EN PRESENTACIONES: la misma unidad que ve el cajero. */
  cantidad: number;
}

/** Lo que devuelve el diálogo. Lista vacía = FEFO automático. */
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
  /** Presentaciones completas disponibles. Es el techo de lo que se puede pedir de este lote. */
  disponible: number;
  disponibleLabel: string;
  /** Cantidad que el cajero decidió sacar de este lote, en presentaciones. */
  cantidad: number;
  seleccionado: boolean;
  /** Precalculado para resaltar lo que hay que sacar antes, sin lógica en el template. */
  clase: string;
}

/**
 * Selector de lote para la venta.
 *
 * Abre con FEFO preseleccionado: confirmar sin tocar nada es la venta normal y no cambia el ritmo
 * del POS. Elegir lotes a mano es la excepción deliberada, y aun así el backend recorta cada
 * elección al saldo real y completa el faltante por FEFO.
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

  /** Modo activo. Arranca en FEFO: es el camino de casi todas las ventas. */
  modoFefo = true;

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
  cantidadRequerida = 0;
  totalSeleccionado = 0;
  totalSeleccionadoLabel = '0';
  faltanteLabel = '';
  hayFaltante = false;
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
    this.cantidadRequerida = data?.cantidad || 0;
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

    this.cargarLotes();
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
          const contenido = res?.getContent || [];
          this.totalElementos = res?.getTotalElements || 0;
          this.filas = contenido.map((lote) => this.mapearFila(lote));
          this.mensajeError = '';
          this.evaluarEstadoVacio();
          this.cargandoInicial = false;
          this.recalcular();
          this.resolverEnterPendiente();
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

  /** La fila se hidrata desde la selección: lo elegido reaparece al volver a su página. */
  private mapearFila(lote: StockLotePresentacion): LoteRow {
    const disponible = lote.cantidadDisponiblePresentacion || 0;
    const elegido = this.seleccion.get(lote.loteId);
    return {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote || '-',
      vencimientoLabel: this.fechaCorta(lote.fechaVencimiento),
      retiroLabel: this.fechaCorta(lote.fechaRetiro),
      disponible,
      disponibleLabel: `${disponible}`,
      cantidad: elegido ? elegido.cantidad : 0,
      seleccionado: elegido != null,
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

  /** Vuelve a FEFO: se descarta lo elegido a mano. El filtro se conserva por si se vuelve atrás. */
  activarFefo(): void {
    this.modoFefo = true;
    this.seleccion.clear();
    this.filas.forEach((fila) => {
      fila.seleccionado = false;
      fila.cantidad = 0;
    });
    this.recalcular();
  }

  activarManual(): void {
    this.modoFefo = false;
    this.recalcular();
    this.enfocarBusqueda();
  }

  /**
   * Al marcar un lote se propone lo que falta cubrir, acotado a lo disponible. Es lo que el cajero
   * quiere el 90% de las veces y le ahorra tipear.
   */
  alternarLote(fila: LoteRow): void {
    if (fila.seleccionado) {
      fila.seleccionado = false;
      fila.cantidad = 0;
      this.seleccion.delete(fila.loteId);
    } else {
      const pendiente = this.cantidadRequerida - this.totalSeleccionado;
      fila.seleccionado = true;
      fila.cantidad = Math.max(0, Math.min(fila.disponible, pendiente));
      this.registrarSeleccion(fila);
    }
    this.recalcular();
  }

  cambiarCantidad(fila: LoteRow, valor: string): void {
    const cantidad = Number(valor);
    fila.cantidad = isNaN(cantidad) || cantidad < 0 ? 0 : Math.min(cantidad, fila.disponible);
    fila.seleccionado = fila.cantidad > 0;
    if (fila.seleccionado) {
      this.registrarSeleccion(fila);
    } else {
      this.seleccion.delete(fila.loteId);
    }
    this.recalcular();
  }

  /** Quita un lote desde el resumen, sin tener que volver a la página donde está su fila. */
  quitarLote(elegido: LoteElegido): void {
    this.seleccion.delete(elegido.loteId);
    const fila = this.filas.find((f) => f.loteId === elegido.loteId);
    if (fila != null) {
      fila.seleccionado = false;
      fila.cantidad = 0;
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
    if (this.modoFefo) {
      return;
    }
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
    // El input recién existe después de que Angular pinta el modo manual.
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

    const faltante = this.cantidadRequerida - this.totalSeleccionado;
    this.hayFaltante = !this.modoFefo && faltante > EPSILON;
    this.faltanteLabel = this.hayFaltante
      ? `Faltan ${faltante} — el resto lo completa FEFO automáticamente.`
      : '';
    // Siempre se puede confirmar: en FEFO no hay nada que elegir, y en manual lo que falte lo
    // resuelve el backend. Bloquear acá dejaría al cajero sin salida.
    this.puedeConfirmar = true;
    this.cdr.markForCheck();
  }

  confirmar(): void {
    if (this.modoFefo) {
      this.dialogRef.close({ lotes: [] } as SeleccionarLoteVentaDialogResult);
      return;
    }
    const lotes: VentaItemLoteInput[] = this.lotesElegidos
      .filter((elegido) => elegido.cantidad > EPSILON)
      .map((elegido) => ({ loteId: elegido.loteId, cantidad: elegido.cantidad }));
    this.dialogRef.close({ lotes } as SeleccionarLoteVentaDialogResult);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
