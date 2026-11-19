import { PageEvent } from '@angular/material/paginator';
import { BehaviorSubject, EMPTY, Observable, Subject, Subscription, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { PageInfo } from '../../../app.component';

/** Lo que muestra una lista paginada en el central: la página pedida y lo que vino. */
export interface EstadoPaginacion<T> {
  pageIndex: number;
  pageSize: number;
  /** Total de registros según el central (`getTotalElements`). */
  total: number;
  items: T[];
  cargando: boolean;
  /** La última carga no llegó: la página volvió a la última que sí cargó. */
  fallo: boolean;
}

/** Lo único que la lista necesita de la página del central. */
export type PaginaCentral<T> = Pick<PageInfo<T>, 'getContent' | 'getTotalElements'>;

export interface OpcionesPaginacion<T> {
  /** Pide una página al central. `null` = el servicio ya avisó el error. */
  cargar: (pageIndex: number, pageSize: number) => Observable<PaginaCentral<T> | null>;
  pageSize?: number;
  pageSizeOptions?: number[];
  /** Para lo que la pantalla haga además con la respuesta (un resumen, un mapeo propio). */
  alCargar?: (pagina: PaginaCentral<T>) => void;
  /** La carga no llegó (la lista ya volvió a la última página cargada): para un aviso propio de la pantalla. */
  alFallar?: () => void;
}

/** `nueva`: la pide un filtro nuevo (otra consulta), no un cambio de página de la misma. */
interface Pedido { pageIndex: number; pageSize: number; nueva: boolean; }

export const PAGE_SIZE_OPTIONS_POR_DEFECTO = [15, 25, 50, 100];

/**
 * Estado y carga de una lista que pagina el central (#772). La pantalla solo dice cómo pedir una
 * página; esto guarda página, tamaño y total, y se encarga de:
 * - descartar la respuesta de una página vieja si se pasan páginas rápido (gana la última pedida);
 * - si falla un cambio de página, volver a la última página que cargó (#390); si falla un filtro nuevo, quedar vacía
 *   en la página 1 (no mostrar datos de otro filtro);
 * - retroceder si la página quedó vacía (por ejemplo, después de borrar el último de la última página).
 *
 * El estado vive en un BehaviorSubject (como el tablero de notificaciones): la tabla lo lee con
 * `[dataSource]="pag.items$"` y el paginador con la directiva `[paginacion]`, así una pantalla OnPush se
 * actualiza sola.
 *
 * Con `@UntilDestroy({ checkProperties: true })` en la pantalla, `unsubscribe()` se llama solo al cerrarla.
 */
export class PaginacionLista<T> {
  readonly pageSizeOptions: number[];

  private readonly estado: BehaviorSubject<EstadoPaginacion<T>>;
  readonly estado$: Observable<EstadoPaginacion<T>>;
  readonly items$: Observable<T[]>;

  /** `null` cancela la carga en camino sin pedir otra. */
  private readonly pedidos = new Subject<Pedido | null>();
  private readonly suscripcion: Subscription;
  private ultimaCargada: { pageIndex: number; pageSize: number };

  constructor(private readonly opciones: OpcionesPaginacion<T>) {
    this.pageSizeOptions = opciones.pageSizeOptions ?? PAGE_SIZE_OPTIONS_POR_DEFECTO;
    const pageSize = opciones.pageSize ?? this.pageSizeOptions[0];
    this.ultimaCargada = { pageIndex: 0, pageSize };
    this.estado = new BehaviorSubject<EstadoPaginacion<T>>({
      pageIndex: 0, pageSize, total: 0, items: [], cargando: false, fallo: false,
    });
    this.estado$ = this.estado.asObservable();
    this.items$ = this.estado$.pipe(map(e => e.items), distinctUntilChanged());

    this.suscripcion = this.pedidos.pipe(
      switchMap(pedido => pedido == null ? EMPTY : opciones.cargar(pedido.pageIndex, pedido.pageSize).pipe(
        catchError(error => {
          console.error('[PaginacionLista]', error);
          return of(null);
        }),
        map(res => ({ pedido, res })),
      )),
    ).subscribe(({ pedido, res }) => this.recibir(pedido, res));
  }

  // Para el código de la pantalla; en el HTML usar estado$ | async (sin getters en bindings).
  get pageIndex(): number { return this.estado.value.pageIndex; }
  get pageSize(): number { return this.estado.value.pageSize; }
  get total(): number { return this.estado.value.total; }
  get items(): T[] { return this.estado.value.items; }

  /** Filtro nuevo, Buscar o Limpiar: vuelve a la página 1. */
  filtrar(): void {
    this.pedir(0, this.pageSize, true);
  }

  /** Repite la página actual (después de guardar o borrar). */
  recargar(): void {
    this.pedir(this.pageIndex, this.pageSize);
  }

  /** Cambio de página o de tamaño desde el paginador. */
  onPage(e: PageEvent): void {
    this.pedir(e.pageIndex, e.pageSize);
  }

  /** Vacía la lista sin pedir nada (por ejemplo, al limpiar un filtro obligatorio). */
  limpiar(): void {
    this.pedidos.next(null);
    this.estado.next({ ...this.estado.value, pageIndex: 0, total: 0, items: [], cargando: false, fallo: false });
  }

  unsubscribe(): void {
    this.suscripcion.unsubscribe();
  }

  private pedir(pageIndex: number, pageSize: number, nueva = false): void {
    this.estado.next({ ...this.estado.value, pageIndex, pageSize, cargando: true });
    this.pedidos.next({ pageIndex, pageSize, nueva });
  }

  private recibir(pedido: Pedido, res: PaginaCentral<T> | null): void {
    if (res == null) {
      if (pedido.nueva) {
        // Lo que se ve es de la consulta anterior (otro filtro): mostrarlo confundiría.
        this.ultimaCargada = { pageIndex: 0, pageSize: pedido.pageSize };
        this.estado.next({ pageIndex: 0, pageSize: pedido.pageSize, total: 0, items: [], cargando: false, fallo: true });
      } else {
        this.estado.next({ ...this.estado.value, ...this.ultimaCargada, cargando: false, fallo: true });
      }
      this.opciones.alFallar?.();
      return;
    }
    const total = res.getTotalElements ?? 0;
    const items = res.getContent ?? [];
    if (items.length === 0 && pedido.pageIndex > 0) {
      const ultimaPagina = Math.max(0, Math.ceil(total / pedido.pageSize) - 1);
      if (ultimaPagina < pedido.pageIndex) {
        this.pedir(ultimaPagina, pedido.pageSize);
        return;
      }
    }
    const { pageIndex, pageSize } = pedido;
    this.ultimaCargada = { pageIndex, pageSize };
    this.estado.next({ pageIndex, pageSize, total, items, cargando: false, fallo: false });
    this.opciones.alCargar?.(res);
  }
}
