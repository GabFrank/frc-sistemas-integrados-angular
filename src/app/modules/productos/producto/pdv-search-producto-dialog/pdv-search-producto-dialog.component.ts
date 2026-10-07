import { ProductoForPdvGQL } from "../graphql/productoSearchForPdv";
import { TipoPrecio } from "../../tipo-precio/tipo-precio.model";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Inject,
  HostListener,
  ChangeDetectorRef,
} from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MainService } from "../../../../main.service";
import { TecladoNumericoComponent } from "../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { esSucursalCompras } from "../../../empresarial/sucursal/sucursal-compras.util";
import { ROLES } from "../../../personas/roles/roles.enum";
import { Producto } from "../producto.model";
import { ProductoService } from "../producto.service";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { off } from "process";
import { Presentacion } from "../../presentacion/presentacion.model";
import { PrecioPorSucursal } from "../../precio-por-sucursal/precio-por-sucursal.model";
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaDialogData,
} from "../../../pdv/comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component";
import { SelectPrecioDialogComponent } from "../../precio-por-sucursal/select-precio-dialog/select-precio-dialog.component";
import { MovimientoStockService } from "../../../operaciones/movimiento-stock/movimiento-stock.service";
import { ProductoComponent } from "../edit-producto/producto.component";
import { forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  QueryError,
  ContextoConsulta,
  TIMEOUT_CONSULTA_DE_FONDO_MS,
} from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";

/** La búsqueda por descripción puede tardar más que un escaneo. */
const TIMEOUT_BUSQUEDA_MOSTRADOR_MS = 20000;
/**
 * Búsqueda y detalle: el error de red y el del servidor llegan al diálogo, que avisa una vez (antes solo en modo
 * mostrador; en el resto la búsqueda quedaba «buscando» para siempre) (#390).
 */
const LECTURA_DETALLE: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const LECTURA_POR_CODIGO: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { show: false },
};
const CONSULTA_DETALLE: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Un aviso por caída, no uno por cada pausa al tipear. */
const INTERVALO_AVISO_SIN_RESPUESTA_MS = 10000;

export interface PdvSearchProductoData {
  texto?: any;
  cantidad?: number;
  tiposPrecios?: TipoPrecio[];
  selectedTipoPrecio?: TipoPrecio;
  mostrarOpciones?: boolean;
  mostrarStock?: boolean;
  conservarUltimaBusqueda?: boolean;
  costo?: boolean;
  transferencia?: Transferencia;
  // Sucursal explicita para filtrar/mostrar stock (ej. devoluciones), independiente
  // de sucursalActual (que en el server cloud/administrativo no aplica). Si se pasa,
  // la busqueda y el stock mostrado se calculan sobre esta sucursal.
  sucursalFiltro?: Sucursal;
  servidor?: boolean;
  /**
   * Solo el buscador del POS (#390): si el servidor no responde, avisa en vez de quedar «buscando»,
   * descarta respuestas de búsquedas viejas y no borra la lista. Sin esto, todo queda como antes.
   */
  modoMostrador?: boolean;
  modoSeleccionMultiple?: boolean;
  productosSeleccionados?: Producto[];
}

export interface PdvSearchProductoResponseData {
  producto?: Producto;
  presentacion?: Presentacion;
  precio?: PrecioPorSucursal;
  cantidad?: number;
  productos?: Producto[];
  /** Texto que el usuario escribió en el campo de búsqueda al momento de seleccionar */
  searchText?: string;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../../environments/environment";
import { Transferencia } from "../../../operaciones/transferencia/transferencia.model";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";
@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-pdv-search-producto-dialog",
  templateUrl: "./pdv-search-producto-dialog.component.html",
  styleUrls: ["./pdv-search-producto-dialog.component.css"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class PdvSearchProductoDialogComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild("tableRows", { static: false, read: ElementRef })
  tableElement: ElementRef<HTMLElement>;
  @ViewChild("presentacionCard", { static: false, read: ElementRef })
  presentacionCardElement: ElementRef<HTMLElement>;
  @ViewChild("buscarInput", { static: false }) buscarInput: ElementRef;

  selectedRowIndex = -1;
  selectedPresentacionRowIndex = -1;
  selectedPrecioRowIndex = -1;
  selectedRow: any;
  formGroup: FormGroup;
  dataSource: MatTableDataSource<Producto>;
  productos: Producto[];
  selectedPrecio: PrecioPorSucursal;
  displayedColumns: string[] = [
    "id",
    "descripcion",
    "codigo",
    // "acciones"
  ];
  expandedProducto: Producto | null;
  NumberUtils;
  sucursalActual: Sucursal;
  sucursalActualIndex: number;
  tiposPrecios: TipoPrecio[];
  selectedTipoPrecio: TipoPrecio;
  isSearching = false;
  onSearchTimer;
  /** Tanda vigente: una respuesta de una tanda anterior se descarta. */
  private busquedaId = 0;
  private ultimoAvisoSinRespuesta = 0;
  productoDetailList: Producto[];
  mostrarTipoPrecios = false;
  desplegarTipoPrecios = false;
  selectedPresentacion: Presentacion;
  precios: string[];
  modoPrecio: string;
  isTransferencia: boolean = false;
  /**
   * Transferencia con COMPRAS de un lado, y sin `VER_STOCK_COMPRAS`: el stock de ese lado no se
   * pide y se muestra "—". Solo en transferencias; las demás pantallas que usan este buscador no
   * cambian.
   */
  ocultarStockOrigen = false;
  ocultarStockDestino = false;
  existenciaOrigen: number = 0;
  existenciaDestino: number = 0;
  modoSeleccionMultiple = false;
  /** Producto expandido cuyo detalle no se pudo cargar: en vez del spinner se ofrece reintentar (#390). */
  detalleFallidoId: number | null = null;
  /** Productos con el detalle pidiéndose (no se pide dos veces). */
  private detalleEnCarga = new Set<number>();
  productosSeleccionadosMap = new Map<number, Producto>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PdvSearchProductoData,
    public dialogRef: MatDialogRef<PdvSearchProductoDialogComponent>,
    public mainService: MainService,
    private matDialog: MatDialog,
    private productoService: ProductoService,
    private _el: ElementRef,
    private stockService: MovimientoStockService,
    private configService: ConfiguracionService,
    private cdr: ChangeDetectorRef,
    private notificacionSnackbar: NotificacionSnackbarService
  ) {
    if (data?.mostrarStock == true) {
      this.displayedColumns = [
        "id",
        "descripcion",
        "codigo",
        "existencia",
        // "acciones"
      ];
      if (this.configService.getConfig().precios) {
        this.precios = this.configService.getConfig().precios.split(',').map(precio => precio.trim());
      }
      if (this.configService.getConfig().modo) {
        this.modoPrecio = this.configService.getConfig().modo?.trim();
      }
      console.log('Configuracion de precios', this.precios, this.modoPrecio);
    }
  }

  ngOnInit(): void {
    console.log('Iniciando dialogo de busqueda de producto');
    this.dataSource = new MatTableDataSource<Producto>([]);
    this.modoSeleccionMultiple = !!this.data?.modoSeleccionMultiple;

    if (this.modoSeleccionMultiple) {
      this.displayedColumns = ['seleccion', ...this.displayedColumns.filter(c => c !== 'acciones')];
      (this.data.productosSeleccionados || []).forEach(p => {
        if (p?.id) this.productosSeleccionadosMap.set(p.id, p);
      });
    }

    this.createForm();

    this.productoDetailList = [];

    if (this.data.conservarUltimaBusqueda == true && !this.data?.texto) {
      this.formGroup
        .get("buscarControl")
        .setValue(this.productoService.lastSearchText);
    }

    if (this.data?.transferencia != null) {
      this.isTransferencia = true;
    } else {
      this.isTransferencia = false;
    }

    if (this.isTransferencia && !this.mainService.tieneAlgunRol([ROLES.VER_STOCK_COMPRAS])) {
      this.ocultarStockOrigen = esSucursalCompras(this.data.transferencia.sucursalOrigen);
      this.ocultarStockDestino = esSucursalCompras(this.data.transferencia.sucursalDestino);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.buscarInput.nativeElement.focus();
    }, 300);
  }

  createForm() {
    this.formGroup = new FormGroup({
      buscarControl: new FormControl(null),
      cantidad: new FormControl(null),
      soloStock: new FormControl(false)
    });

    this.formGroup
      .get("buscarControl")
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((value) => {
        if (value != null) this.onSearchProducto(value);
      });

    this.formGroup
      .get("soloStock")
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((checked) => {
        const textoActual = this.formGroup.get("buscarControl").value;
        if (textoActual) {
          this.onSearchProducto(textoActual);
        }
      })

    this.formGroup.get("buscarControl").setValue(this.data?.texto);
    this.formGroup.get("cantidad").setValue(this.data?.cantidad);
  }

  onSearchProducto(text: string, offset?: number) {
    this.isSearching = true;
    const soloStock = this.formGroup.get("soloStock").value;

    if (this.data.conservarUltimaBusqueda == true)
      this.productoService.lastSearchText = text;
    if (this.onSearchTimer != null) {
      clearTimeout(this.onSearchTimer);
    }

    let sucursalIdParaFiltro = this.sucursalActual?.id;
    if (this.isTransferencia && this.data?.transferencia?.sucursalOrigen) {
      sucursalIdParaFiltro = this.data.transferencia.sucursalOrigen.id;
    }
    if (this.data?.sucursalFiltro?.id != null) {
      sucursalIdParaFiltro = this.data.sucursalFiltro.id;
    }

    if (text == "" || text == null || text == " ") {
      // Invalida la tanda en vuelo: su respuesta no debe repoblar una lista que se acaba de vaciar.
      this.busquedaId++;
      this.dataSource != undefined ? (this.dataSource.data = []) : null;
      this.isSearching = false;
    } else {
      this.onSearchTimer = setTimeout(() => {
        // Determinar si el texto parece un código de barras (solo dígitos con ≥3 caracteres)
        const esCodigo = /^\d{3,}$/.test(text.trim());

        const mostrador = this.data?.modoMostrador === true;
        const id = ++this.busquedaId;
        let fallo = false;
        const errorConf: QueryError = LECTURA_DETALLE;
        // Fuera del mostrador una búsqueda con filtro de stock puede tardar: 60 s en vez de 20
        const contexto: ContextoConsulta = {
          timeoutMs: mostrador ? TIMEOUT_BUSQUEDA_MOSTRADOR_MS : TIMEOUT_POR_DEFECTO_MS,
          silenciarAvisoTimeout: true,
        };
        const marcarFallo = () => {
          fallo = true;
          return of([]);
        };

        // Siempre buscar por descripción
        const busquedaDescripcion$ = this.productoService
          .onSearch(text, offset, sucursalIdParaFiltro, soloStock, true, this.data.servidor, false, errorConf, contexto)
          .pipe(catchError(marcarFallo));

        // Si parece código de barras, buscar también por código en paralelo
        const busquedaCodigo$ = esCodigo
          ? this.productoService
              // Un error del servidor en la búsqueda por código (p. ej. código repetido) no descarta los
              // resultados por descripción: llega como null = «sin coincidencia por código»
              .onGetProductoPorCodigo(text.trim(), this.data.servidor, false, LECTURA_POR_CODIGO, contexto)
              .pipe(
                map((p: Producto) => (p ? [p] : [])),
                catchError(marcarFallo)
              )
          : of([]);

        forkJoin([busquedaDescripcion$, busquedaCodigo$])
          .pipe(untilDestroyed(this))
          .subscribe(([porDescripcion, porCodigo]: [Producto[], Producto[]]) => {
            // Otra tanda empezó después: esta respuesta ya no corresponde a lo que está escrito.
            if (id !== this.busquedaId) return;
            if (fallo) {
              this.avisarSinRespuesta();
              this.isSearching = false;
              // Mostrador: no pisa la lista buena con []. Al paginar nunca se vacía (ni se simula «fin de lista»).
              // En el resto, una primera página fallida no deja a la vista los resultados de otra búsqueda.
              if (!mostrador && offset == null) {
                this.dataSource.data = [];
                this.expandedProducto = null;
                this.limpiarSeleccionDePresentacion();
              }
              return;
            }
            // Combinar resultados evitando duplicados (por id)
            const idsVistos = new Set<number>();
            const combinados: Producto[] = [];

            // Primero agregar los del código (mayor prioridad)
            for (const p of porCodigo ?? []) {
              if (p?.id && !idsVistos.has(p.id)) {
                idsVistos.add(p.id);
                combinados.push(p);
              }
            }
            // Luego los de descripción
            for (const p of porDescripcion ?? []) {
              if (p?.id && !idsVistos.has(p.id)) {
                idsVistos.add(p.id);
                combinados.push(p);
              }
            }

            if (offset == null) {
              this.dataSource.data = combinados;
              // Lista nueva: lo expandido y lo seleccionado eran de la anterior
              this.expandedProducto = null;
              this.limpiarSeleccionDePresentacion();
            } else {
              this.dataSource.data = [...this.dataSource.data, ...combinados];
            }

            if (this.isTransferencia || this.data?.sucursalFiltro?.id != null) {
              this.dataSource.data.forEach((p, index) => {
                this.mostrarStock(p, index);
              });
            }

            this.buscarInput.nativeElement.focus();
            this.isSearching = false;
          });
      }, 1000);
    }
  }

  private avisarSinRespuesta(): void {
    const ahora = Date.now();
    if (ahora - this.ultimoAvisoSinRespuesta < INTERVALO_AVISO_SIN_RESPUESTA_MS) return;
    this.ultimoAvisoSinRespuesta = ahora;
    this.notificacionSnackbar.openWarn("No se pudo buscar: el servidor no responde", 4);
  }

  highlight(index: number) {
    if (index >= 0 && index <= this.dataSource.data.length - 1) {
      // Otra fila: la presentación y el precio elegidos eran del producto anterior
      if (index !== this.selectedRowIndex) this.limpiarSeleccionDePresentacion();
      this.selectedRowIndex = index;
    }
  }

  /**
   * La presentación y el precio seleccionados son de UNA fila. Si quedaran al cambiar de producto, Enter o una
   * tecla numérica devolverían el producto nuevo con la presentación o el precio del anterior.
   */
  private limpiarSeleccionDePresentacion(): void {
    this.selectedPresentacion = undefined;
    this.selectedPrecio = undefined;
    this.selectedPresentacionRowIndex = -1;
  }

  toggleSeleccion(producto: Producto, event?: Event): void {
    event?.stopPropagation();
    if (!producto?.id) return;
    if (this.productosSeleccionadosMap.has(producto.id)) {
      this.productosSeleccionadosMap.delete(producto.id);
    } else {
      this.productosSeleccionadosMap.set(producto.id, producto);
    }
    this.cdr.markForCheck();
  }

  isSeleccionado(producto: Producto): boolean {
    return producto?.id != null && this.productosSeleccionadosMap.has(producto.id);
  }

  cantidadSeleccionados(): number {
    return this.productosSeleccionadosMap.size;
  }

  aplicarSeleccionMultiple(): void {
    const productos = Array.from(this.productosSeleccionadosMap.values());
    this.dialogRef.close({ productos } as PdvSearchProductoResponseData);
  }

  onFilaClick(producto: Producto, index: number): void {
    if (this.modoSeleccionMultiple) {
      this.toggleSeleccion(producto);
      this.highlight(index);
      return;
    }
    this.expandedProducto = null;
    this.highlight(index);
    this.tableKeyDownEvent('Enter', index);
  }

  highlightPresentacion(index: number) {
    const presentaciones = this.dataSource.data?.[this.selectedRowIndex]?.presentaciones;
    if (presentaciones == null || presentaciones.length === 0) {
      // La fila resaltada no tiene presentaciones (sin cargar, o ninguna tras el filtro de precios)
      this.limpiarSeleccionDePresentacion();
      return;
    }
    // Fuera de rango se queda en el borde
    index = Math.min(Math.max(index, 0), presentaciones.length - 1);
    this.selectedPresentacionRowIndex = index;
    this.selectedPresentacion = presentaciones[index];
    // Sin precios no queda el precio de la presentación anterior
    this.selectedPrecio = this.selectedPresentacion?.precios?.length > 0
      ? this.selectedPresentacion.precios[0]
      : undefined;
  }

  getProductoDetail(producto: Producto, index?) {
    if (producto == null) return;
    if (producto.presentaciones != null) {
      // Ya cargado (segunda visita): se vuelve a seleccionar SU primera presentación
      if (this.dataSource.data[this.selectedRowIndex] === producto) this.highlightPresentacion(0);
      return;
    }
    if (this.detalleEnCarga.has(producto.id)) return;
    this.detalleEnCarga.add(producto.id);
    if (this.detalleFallidoId === producto.id) this.detalleFallidoId = null;
    const fallo = () => {
      this.detalleEnCarga.delete(producto.id);
      // Solo si el producto sigue a la vista y expandido
      if (this.expandedProducto === producto && this.dataSource.data.includes(producto)) {
        this.detalleFallidoId = producto.id;
        this.notificacionSnackbar.openWarn("No se pudo cargar el producto: usá «Reintentar».", 5);
      }
    };
    this.productoService
      .getProducto(producto.id, this.data.servidor, LECTURA_DETALLE, CONSULTA_DETALLE)
      .pipe(untilDestroyed(this))
      .subscribe({ error: fallo, next: (res) => {
        if (res == null) {
          fallo();
          return;
        }
        this.detalleEnCarga.delete(producto.id);
        let presentaciones = res.presentaciones ?? [];
        if (this.precios != null && this.modoPrecio == "ONLY") {
          presentaciones = presentaciones.filter((p) => {
            p.precios = p.precios?.filter((pre) =>
              this.precios?.includes(pre?.tipoPrecio?.descripcion)
            );
            return p.precios?.length > 0;
          });
        }
        if (this.precios != null && this.modoPrecio == "MIXTO") {
          presentaciones.forEach((p) => {
            const foundPrecios = p.precios?.filter((pre) =>
              this.precios?.includes(pre?.tipoPrecio?.descripcion)
            );
            if (foundPrecios?.length > 0) {
              p.precios = foundPrecios;
            }
          });
        } else if (this.precios != null && this.modoPrecio == "NOT") {
          presentaciones = presentaciones.filter((p) => {
            p.precios = p.precios?.filter(
              (pre) => !this.precios?.includes(pre?.tipoPrecio?.descripcion)
            );
            return p.precios?.length > 0;
          });
        }
        // Al producto que se pidió, no al índice de entonces: la lista pudo cambiar mientras tanto
        producto.presentaciones = presentaciones;
        if (this.expandedProducto === producto && this.dataSource.data[this.selectedRowIndex] === producto) {
          this.highlightPresentacion(0);
        }
      } });
  }

  reintentarDetalle(producto: Producto): void {
    this.getProductoDetail(producto);
    // El botón desaparece al reintentar: el foco vuelve a la tabla para seguir con el teclado
    this.setFocustEvent();
  }

  /** La fila resaltada está desplegada y tiene sus presentaciones cargadas (lo que el usuario ve). */
  private filaExpandidaConDetalle(): boolean {
    const fila = this.dataSource.data?.[this.selectedRowIndex];
    return fila != null && this.expandedProducto === fila && fila.presentaciones != null;
  }

  scroll(id) {
    let el = document.getElementById(id);
    el.scrollIntoView();
  }

  tableKeyDownEvent(key, index) {
    switch (key) {
      case "ArrowDown":
        this.highlight(index + 1);
        this.expandedProducto = null;
        // this.highlightPresentacion(0);
        break;
      case "ArrowUp":
        this.highlight(index - 1);
        this.expandedProducto = null;
        // this.highlightPresentacion(0);
        break;
      case "Enter": {
        const fila = this.dataSource.data[index];
        if (fila == null) break;
        if (this.expandedProducto == null) {
          this.expandedProducto = fila;
          this.getProductoDetail(fila, index);
        } else if (this.expandedProducto === fila) {
          if (fila.presentaciones == null) {
            // Todavía sin detalle: si falló, Enter reintenta; no hay nada que devolver
            if (this.detalleFallidoId === fila.id) this.getProductoDetail(fila, index);
            break;
          }
          this.onPresentacionClick(
            fila.presentaciones[this.selectedPresentacionRowIndex],
            fila,
            null
          );
        }
        break;
      }
      case "ArrowRight":
        if (!this.filaExpandidaConDetalle()) break;
        this.highlightPresentacion(
          this.selectedPresentacionRowIndex == -1 ? 0 : this.selectedPresentacionRowIndex + 1
        );
        break;
      case "ArrowLeft":
        if (!this.filaExpandidaConDetalle()) break;
        this.highlightPresentacion(
          this.selectedPresentacionRowIndex == -1 ? 0 : this.selectedPresentacionRowIndex - 1
        );
        break;
      default:
        // Tecla numérica = tipo de precio de la presentación seleccionada (+" " también es 0: se excluye)
        if (typeof key === "string" && key.trim() !== "" && !isNaN(+key)) {
          const fila = this.dataSource.data[this.selectedRowIndex];
          const presentacion = this.selectedPresentacion;
          // Solo con la fila resaltada desplegada y si la presentación seleccionada es suya
          if (!this.filaExpandidaConDetalle() || presentacion == null || !fila.presentaciones.includes(presentacion)) break;
          const precio = presentacion.precios?.find(
            (p) => String(p?.tipoPrecio?.id) === key
          );
          this.onPresentacionClick(presentacion, fila, precio);
        }
        break;
    }
  }

  setFocustEvent() {
    setTimeout(() => {
      // this will make the execution after the above boolean has changed
      if (this.tableElement != undefined) {
        this.tableElement.nativeElement.focus();
      }
    }, 100);
  }

  keydownEvent(e) {
    if (e == "ArrowDown" || e == "Tab") {
      if (this.dataSource.data?.length > 0) {
        this.highlight(0);
        this.setFocustEvent();
      }
    } else if (e == "Enter") {
      this.onSearchProducto(this.formGroup.controls.buscarControl.value);
    }
  }

  isNumber(val): boolean {
    return typeof val === "number";
  }

  getExistencia(producto: Producto): number {
    return producto?.sucursales?.find(
      (s) => s.sucursal.id == this.sucursalActual.id
    ).existencia;
  }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  openTecladoNumerico() {
    let dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.formGroup.get("cantidad").value,
      },
    });
    dialog
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res > 0) {
          this.formGroup.get("cantidad").setValue(res);
        }
      });
  }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "Escape":
        break;
      case "Enter":
        break;
      default:
      case "ArrowDown":
        break;
      case "ArrowUp":
        break;
      case "F1":
        this.mostrarTipoPrecios = true;
        break;
        break;
    }
  }

  cargarMasDatos() {
    this.onSearchProducto(
      this.formGroup.controls.buscarControl.value,
      this.dataSource.data.length
    );
  }

  limpiarBusqueda(): void {
    this.formGroup.get('buscarControl')?.setValue(null);
    // Ni la tanda en vuelo ni la que espera su pausa repueblan la lista que se acaba de vaciar
    if (this.onSearchTimer != null) clearTimeout(this.onSearchTimer);
    this.busquedaId++;
    this.isSearching = false;
    this.expandedProducto = null;
    this.limpiarSeleccionDePresentacion();
    this.dataSource.data = [];
    setTimeout(() => {
      this.buscarInput?.nativeElement?.focus();
    }, 50);
  }

  onPresentacionClick(
    presentacion?: Presentacion,
    producto?: Producto,
    precio?: PrecioPorSucursal
  ) {
    if (presentacion == null || producto == null) return;
    // La presentación tiene que ser de ese producto y el precio de esa presentación
    if (producto.presentaciones != null && !producto.presentaciones.includes(presentacion)) return;
    if (precio == null && presentacion.precios != null) {
      precio = this.selectedPrecio;
    }
    if (precio != null && !presentacion.precios?.includes(precio)) return;
    presentacion.producto = producto;
    const searchText = this.formGroup.controls.buscarControl.value || '';
    let response: PdvSearchProductoResponseData = {
      producto,
      presentacion,
      cantidad: this.formGroup.controls.cantidad.value,
      precio,
      searchText,
    };

    if (producto != null && presentacion != null && precio != null) {
      this.dialogRef.close(response);
    }
  }

  onMostrarTipoPrecios(presentacion: Presentacion) {
    this.desplegarTipoPrecios = true;
    // Presentación, índice y precio quedan alineados: Enter y los números devuelven la que se marcó
    const indice = this.dataSource.data?.[this.selectedRowIndex]?.presentaciones?.indexOf(presentacion) ?? -1;
    if (indice >= 0) {
      this.highlightPresentacion(indice);
    } else {
      this.selectedPresentacion = presentacion;
    }
  }

  presentacionArrowRightEvent(index, el?) {
    this.highlightPresentacion(index + 1);
  }

  presentacionArrowLeftEvent(index, el) {
    this.highlightPresentacion(index - 1);
  }

  setCantidad(i) {
    let cantidad = this.formGroup.controls.cantidad.value;
    if (cantidad == 1) {
      this.formGroup.controls.cantidad.setValue(i);
    } else {
      this.formGroup.controls.cantidad.setValue(cantidad + i);
    }
  }

  mostrarStock(producto: Producto, index?) {
    if (this.isTransferencia) {
      if (!this.ocultarStockOrigen) {
        this.productoService
          .onGetStockPorProductoAndSucursal(
            producto.id,
            this.data.transferencia.sucursalOrigen.id,
            this.data.servidor
          )
          .subscribe((stock) => {
            if (stock != null) {
              producto.stockPorProducto = stock;
              this.dataSource[index] = producto;
            }
          });
      }
      if (!this.ocultarStockDestino) {
        this.productoService
          .onGetStockPorProductoAndSucursal(
            producto.id,
            this.data.transferencia.sucursalDestino.id,
            this.data.servidor
          )
          .subscribe((stock) => {
            if (stock != null) {
              producto.stockPorProductoDestino = stock;
              this.dataSource[index] = producto;
            }
          });
      }
    } else if (this.data?.sucursalFiltro?.id != null) {
      this.productoService
        .onGetStockPorProductoAndSucursal(
          producto.id,
          this.data.sucursalFiltro.id,
          this.data.servidor
        )
        .pipe(untilDestroyed(this))
        .subscribe((stock) => {
          if (stock != null) {
            producto.stockPorProducto = stock;
            this.dataSource[index] = producto;
          }
        });
    } else {
      this.stockService
        .onGetStockPorProducto(producto.id, null, this.data.servidor)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            producto.stockPorProducto = res;
            this.dataSource[index] = producto;
          }
        });
    }
  }

  mostrarCodigoPrincipal(producto: Producto, index?) {
    this.stockService
      .onGetStockPorProducto(producto.id, null, this.data.servidor)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          producto.stockPorProducto = res;
          this.dataSource[index] = producto;
        }
      });
  }

  abrirProductoDialog(producto?: Producto) {
    this.matDialog
      .open(ProductoComponent, {
        data: {
          isDialog: true,
          producto: producto,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = [];
          this.expandedProducto = null;
          this.limpiarSeleccionDePresentacion();
          this.onSearchProducto(res.descripcion, 0);
        }
      });
  }
}
