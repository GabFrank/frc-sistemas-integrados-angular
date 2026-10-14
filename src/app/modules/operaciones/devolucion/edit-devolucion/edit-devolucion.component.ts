import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EMPTY, Subscription } from "rxjs";
import { catchError, timeout } from "rxjs/operators";
import { PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";

/** Abrir una devolución y sus ítems: lo espera el usuario (#390). */
const CONSULTA_PANTALLA = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
import {
  updateDataSourceWithId,
} from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { EtiquetasDevolucionService } from "../etiquetas/etiquetas-devolucion.service";
import { ColectaDevolucionService } from "../colecta/colecta-devolucion.service";
import { OperacionDevolucionService } from "../operacion-devolucion/operacion-devolucion.service";
import {
  CancelarDevolucionDialogComponent,
  CancelarDevolucionDialogResult,
} from "../cancelar-devolucion-dialog/cancelar-devolucion-dialog.component";
import {
  ColectarDialogComponent,
  ColectarDialogResult,
} from "../colecta/colectar-dialog/colectar-dialog.component";
import {
  ImprimirEtiquetasDialogComponent,
  ImprimirEtiquetasDialogResult,
} from "../etiquetas/imprimir-etiquetas-dialog/imprimir-etiquetas-dialog.component";
import { MainService } from "../../../../main.service";
import {
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoData,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { CreateItemDialogComponent } from "../create-item-dialog/create-item-dialog.component";
import {
  ReingresoCanjeDialogComponent,
  ReingresoCanjeDialogResult,
} from "../reingreso-canje-dialog/reingreso-canje-dialog.component";
import {
  Devolucion,
  DevolucionEstado,
  DevolucionItem,
  MotivoAveria,
  TipoDevolucion,
} from "../devolucion.model";
import { DevolucionService } from "../devolucion.service";
import { ListDevolucionComponent } from "../list-devolucion/list-devolucion.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-devolucion",
  templateUrl: "./edit-devolucion.component.html",
  styleUrls: ["./edit-devolucion.component.scss"],
})
export class EditDevolucionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  @Input() data: Tab;

  readonly TipoDevolucion = TipoDevolucion;
  readonly DevolucionEstado = DevolucionEstado;

  selectedDevolucion = new Devolucion();
  dataSource = new MatTableDataSource<DevolucionItem>([]);
  isDialogOpen = false;

  tipoControl = new FormControl(TipoDevolucion.SIN_PROVEEDOR, Validators.required);
  sucursalControl = new FormControl(null, Validators.required);

  // El mat-select compara por referencia; la sucursal cargada es otra instancia
  // que las de sucursalList, así que se compara por id.
  compareSucursal = (a: Sucursal, b: Sucursal): boolean => a?.id === b?.id;
  observacionControl = new FormControl(null);

  nroNotaCreditoControl = new FormControl(null);
  montoAcreditadoControl = new FormControl(null);

  selectedProveedor: Proveedor;
  proveedorTexto = "";

  sucursalList: Sucursal[] = [];
  motivosAveria: MotivoAveria[] = [];
  tipoList = Object.values(TipoDevolucion);

  // flags precalculados (no llamar funciones desde el HTML)
  esNuevo = true;
  /**
   * La devolución pedida no cargó. Sin esto la pantalla quedaba como «nueva» y editable: Guardar o Agregar ítem
   * creaban otra devolución en vez de editar la abierta (#390).
   */
  cargaFallo = false;
  /** La carga falló por la red (se ofrece «Reintentar»); un no encontrado no se reintenta. */
  cargaReintentable = false;
  /** Los ítems no cargaron: no se ofrecen acciones de estado sobre una tabla vacía (#390). */
  itemsFallo = false;
  /**
   * Se está cargando una devolución existente: mientras tanto no es «nueva» ni editable (con el central lento,
   * Guardar en esa ventana también creaba otra devolución) (#390).
   */
  cargandoDevolucion = false;
  /** Precalculado para el template: el id de la pestaña aunque la devolución no haya cargado. */
  tituloId: string = null;
  esPendiente = true;
  esConProveedor = false;
  puedeEditarCabecera = true;
  canAvanzarSeparado = false;
  canAvanzarRetirado = false;
  canAvanzarDescartado = false;
  canColectar = false;
  canCanjear = false;
  canAcreditar = false;
  canCancelar = false;
  /** Hay un guardado de la cabecera en curso, y si llegó otro cambio mientras tanto. */
  private guardandoCabecera = false;
  private guardarCabeceraPendiente = false;
  canRevertir = false;
  procesando = false; // evita doble-submit de las acciones de estado
  canjeMode = false;
  acreditarMode = false;
  private refrescoSub: Subscription;

  /** Los ítems se piden al central de a una página: una devolución puede tener muchos productos. */
  itemsPageIndex = 0;
  itemsPageSize = 20;
  totalItems = 0;

  columnsToDisplay = [
    "producto",
    "presentacion",
    "cantidad",
    "motivoAveria",
    "costo",
    "lote",
    "vencimiento",
    "menu",
  ];

  columnsCanje = [
    "producto",
    "presentacion",
    "cantidad",
    "cantidadReingresada",
    "vencimientoReingreso",
    "accionReingreso",
  ];

  constructor(
    private matDialog: MatDialog,
    public mainService: MainService,
    private devolucionService: DevolucionService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService,
    private tabService: TabService,
    private reporteService: ReporteService,
    private etiquetasService: EtiquetasDevolucionService,
    private colectaService: ColectaDevolucionService,
    private operacionService: OperacionDevolucionService
  ) {}

  ngOnInit(): void {
    this.selectedDevolucion = new Devolucion();
    this.selectedDevolucion.tipo = TipoDevolucion.SIN_PROVEEDOR;
    this.selectedDevolucion.estado = DevolucionEstado.PENDIENTE;

    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      // Con null (error del servidor) res.filter lanzaba TypeError (#390).
      this.sucursalList = (res ?? []).filter((s) => s.id != 0);
      if (this.selectedDevolucion?.id == null) {
        let actual = this.sucursalList.find(
          (s) => s.id == this.mainService.sucursalActual?.id
        );
        if (actual != null) {
          this.sucursalControl.setValue(actual);
        }
      }
    });

    this.devolucionService
      .onGetMotivosAveriaActivos()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.motivosAveria = res ?? [];
      });

    this.tipoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((tipo: TipoDevolucion) => {
        this.esConProveedor = tipo == TipoDevolucion.CON_PROVEEDOR;
      });

    if (this.data?.tabData != null && this.data?.tabData["id"] != null) {
      this.cargarDatos(this.data.tabData["id"]);
    } else {
      this.esNuevo = true;
      this.esConProveedor =
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR;
      this.computeEstadoFlags();
    }

    // La pestaña queda viva en segundo plano: al volver, releer la devolución por
    // si otra pestaña le cambió el estado (#222).
    this.tabService
      .onTabReactivada(this.data)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refrescarAlVolver());
  }

  cargarDatos(id: number) {
    this.tituloId = id != null ? "#" + id : null;
    this.esNuevo = false;
    this.cargandoDevolucion = true;
    this.computeEstadoFlags();
    this.devolucionService
      .onGetDevolucion(id, true, undefined, PROPAGAR_ERROR_DE_RED, CONSULTA_PANTALLA)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          // null: el servicio ya avisó («Item no encontrado» o el error del servidor); no se reintenta.
          this.cargandoDevolucion = false;
          if (res == null) { this.marcarCargaFallida(false); return; }
          this.cargaFallo = false;
          this.aplicarDevolucion(res);
        },
        error: () => { this.cargandoDevolucion = false; this.marcarCargaFallida(true); }
      });
  }

  /** Bloquea la pantalla: nada se guarda ni se agrega sobre una devolución que no cargó. */
  private marcarCargaFallida(reintentable: boolean) {
    this.cargaFallo = true;
    this.esNuevo = false;
    this.cargaReintentable = reintentable;
    this.computeEstadoFlags();
    if (reintentable) {
      this.notificacionService.openWarn("No se pudo cargar la devolución: el servidor no responde.", 5);
    }
  }

  onReintentarCarga() {
    const id = this.data?.tabData?.["id"];
    if (id != null) this.cargarDatos(id);
  }

  private aplicarDevolucion(res: Devolucion, silencioso = false) {
    this.selectedDevolucion = new Devolucion();
    Object.assign(this.selectedDevolucion, res);
    this.esNuevo = false;
    this.tipoControl.setValue(this.selectedDevolucion.tipo);
    this.esConProveedor =
      this.selectedDevolucion.tipo == TipoDevolucion.CON_PROVEEDOR;
    this.selectedProveedor = this.selectedDevolucion.proveedor;
    this.proveedorTexto =
      this.selectedDevolucion.proveedor?.persona?.nombre ?? "";
    this.sucursalControl.setValue(this.selectedDevolucion.sucursalOrigen);
    this.observacionControl.setValue(this.selectedDevolucion.observacion);
    this.nroNotaCreditoControl.setValue(this.selectedDevolucion.nroNotaCredito);
    this.montoAcreditadoControl.setValue(
      this.selectedDevolucion.montoAcreditado
    );
    this.marcarSinCambios();
    this.getItems(silencioso);
    this.computeEstadoFlags();
  }

  /**
   * Relee la devolución al volver a la pestaña. Sin nada a medio cargar se aplica
   * todo; si el usuario estaba editando, no se pisan sus campos: solo se
   * actualizan estado y botones, para no ofrecer acciones de un estado viejo.
   */
  private refrescarAlVolver() {
    // Si la carga había fallado, al volver a la pestaña se reintenta (#390).
    if (this.cargaFallo && this.cargaReintentable && !this.cargandoDevolucion) { this.onReintentarCarga(); return; }
    const id = this.selectedDevolucion?.id;
    if (id == null || this.procesando) return;
    const estadoAnterior = this.selectedDevolucion.estado;
    this.refrescoSub?.unsubscribe();
    this.refrescoSub = this.devolucionService
      .onGetDevolucion(id, true, true)
      .pipe(
        // Corte propio, más corto que el del link, para no dejar la pantalla esperando.
        timeout(15000),
        catchError(() => EMPTY),
        untilDestroyed(this)
      )
      .subscribe((res) => {
        if (res == null || this.procesando) return;
        if (!this.hayEdicionPendiente()) {
          this.aplicarDevolucion(res, true);
        } else {
          Object.assign(this.selectedDevolucion, res);
          if (this.selectedDevolucion.estado != DevolucionEstado.RETIRADO) {
            // Canje y acreditación solo valen desde RETIRADO: fallarían.
            this.canjeMode = false;
            this.acreditarMode = false;
          }
          this.computeEstadoFlags();
        }
        if (this.selectedDevolucion.estado != estadoAnterior) {
          this.notificacionService.openWarn(
            `La devolución cambió a ${this.selectedDevolucion.estado} en otra pestaña`,
            6
          );
        }
      });
  }

  private hayEdicionPendiente(): boolean {
    const controles = [
      this.tipoControl,
      this.sucursalControl,
      this.observacionControl,
      this.nroNotaCreditoControl,
      this.montoAcreditadoControl,
    ];
    return (
      this.canjeMode ||
      this.acreditarMode ||
      controles.some((c) => c.dirty) ||
      (this.selectedProveedor?.id ?? null) !=
        (this.selectedDevolucion?.proveedor?.id ?? null) ||
      // Texto tipeado en el buscador de proveedor sin confirmar la búsqueda.
      (this.proveedorTexto ?? "") !=
        (this.selectedProveedor?.persona?.nombre ?? "")
    );
  }

  private marcarSinCambios() {
    this.tipoControl.markAsPristine();
    this.sucursalControl.markAsPristine();
    this.observacionControl.markAsPristine();
    this.nroNotaCreditoControl.markAsPristine();
    this.montoAcreditadoControl.markAsPristine();
  }

  getItems(silencioso = false) {
    if (this.selectedDevolucion?.id == null) return;
    this.devolucionService
      .onGetDevolucionItemsPorDevolucionPage(
        this.selectedDevolucion.id,
        this.itemsPageIndex,
        this.itemsPageSize,
        true,
        silencioso,
        PROPAGAR_ERROR_DE_RED,
        CONSULTA_PANTALLA
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res == null) { this.marcarItemsFallidos(silencioso); return; }
          // Se borró lo último de una página que ya no existe: se vuelve a la anterior.
          if ((res.getContent?.length ?? 0) == 0 && this.itemsPageIndex > 0 && res.getTotalElements > 0) {
            this.itemsPageIndex = Math.max(0, (res.getTotalPages ?? 1) - 1);
            this.getItems(silencioso);
            return;
          }
          this.itemsFallo = false;
          this.totalItems = res.getTotalElements ?? 0;
          this.dataSource.data = res.getContent ?? [];
          this.computeEstadoFlags();
        },
        error: () => this.marcarItemsFallidos(silencioso)
      });
  }

  onItemsPage(e: PageEvent) {
    this.itemsPageIndex = e.pageIndex;
    this.itemsPageSize = e.pageSize;
    this.getItems();
  }

  private marcarItemsFallidos(silencioso: boolean) {
    this.itemsFallo = true;
    this.totalItems = 0;
    this.dataSource.data = [];
    this.computeEstadoFlags();
    if (!silencioso) {
      this.notificacionService.openWarn("No se pudieron cargar los ítems de la devolución: no se puede avanzar hasta reintentar.", 5);
    }
  }

  /**
   * Habilita/deshabilita los controles reactivos de la cabecera desde el
   * componente (no con [disabled] en el HTML, que dispara el warning de
   * reactive forms y el "changed after checked").
   */
  private actualizarHabilitacionCabecera() {
    if (this.puedeEditarCabecera) {
      this.tipoControl.enable({ emitEvent: false });
      this.sucursalControl.enable({ emitEvent: false });
    } else {
      this.tipoControl.disable({ emitEvent: false });
      this.sucursalControl.disable({ emitEvent: false });
    }
  }

  computeEstadoFlags() {
    const estado = this.selectedDevolucion?.estado;
    const conProveedor =
      this.selectedDevolucion?.tipo == TipoDevolucion.CON_PROVEEDOR ||
      this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR;

    this.esPendiente = estado == null || estado == DevolucionEstado.PENDIENTE;
    this.puedeEditarCabecera = !this.cargaFallo && !this.cargandoDevolucion && (this.esNuevo || this.esPendiente);
    this.actualizarHabilitacionCabecera();

    this.canAvanzarSeparado = false;
    this.canAvanzarRetirado = false;
    this.canAvanzarDescartado = false;
    this.canColectar = false;
    this.canCanjear = false;
    this.canAcreditar = false;
    this.canCancelar = false;
    this.canRevertir = false;

    // Sin la devolución o sin sus ítems no se ofrece ninguna acción de estado (#390).
    if (this.selectedDevolucion?.id == null || this.cargaFallo || this.itemsFallo) {
      return;
    }

    switch (estado) {
      case DevolucionEstado.PENDIENTE:
        this.canAvanzarSeparado = true;
        this.canCancelar = true;
        break;
      case DevolucionEstado.SEPARADO:
        if (conProveedor) {
          this.canAvanzarRetirado = true;
          this.canColectar = true; // enviar a un depósito antes del retiro
        } else {
          this.canAvanzarDescartado = true;
        }
        this.canCancelar = true;
        this.canRevertir = true; // SEPARADO -> PENDIENTE (reingresa stock)
        break;
      case DevolucionEstado.COLECTADO:
        // Ya en el depósito: falta que el proveedor retire.
        this.canAvanzarRetirado = true;
        this.canRevertir = true; // COLECTADO -> SEPARADO
        break;
      case DevolucionEstado.RETIRADO:
        this.canCanjear = true;
        this.canAcreditar = true;
        this.canRevertir = true; // RETIRADO -> COLECTADO/SEPARADO
        break;
      case DevolucionEstado.CANJEADO:
        this.canRevertir = true; // CANJEADO -> RETIRADO (saca del stock lo reingresado)
        break;
      default:
        break;
    }
  }

  onBuscarProveedor() {
    this.proveedorService
      .onSearchProveedorPorTexto(this.proveedorTexto)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProveedor = res;
          this.proveedorTexto = res.persona?.nombre;
          this.onCabeceraCambiada();
        }
      });
  }

  onRemoverProveedor() {
    this.selectedProveedor = null;
    this.proveedorTexto = "";
    this.onCabeceraCambiada();
  }

  /**
   * Guarda la cabecera apenas cambia: no hay botón Guardar. Se llama desde los eventos del
   * usuario (elegir tipo, sucursal o proveedor; salir de la observación), no desde
   * `valueChanges`, para que cargar la pantalla no dispare un guardado.
   *
   * Si todavía falta algo —una devolución con proveedor sin proveedor elegido— no guarda ni
   * avisa: se guarda cuando esté completo. Los guardados van de a uno: dos seguidos sobre una
   * devolución nueva crearían dos.
   */
  onCabeceraCambiada() {
    if (!this.puedeEditarCabecera) return;
    if (this.sucursalControl.invalid || this.tipoControl.invalid) return;
    if (this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR && this.selectedProveedor == null) return;
    if (this.guardandoCabecera) {
      this.guardarCabeceraPendiente = true;
      return;
    }
    this.guardandoCabecera = true;
    const alTerminar = () => {
      this.guardandoCabecera = false;
      if (this.guardarCabeceraPendiente) {
        this.guardarCabeceraPendiente = false;
        this.onCabeceraCambiada();
      }
    };
    this.onGuardarCabecera().then(alTerminar, alTerminar);
  }

  /** La observación se guarda al salir del campo, y solo si cambió. */
  onObservacionEditada() {
    if (this.observacionControl.dirty) this.onCabeceraCambiada();
  }

  onGuardarCabecera(): Promise<Devolucion> {
    return new Promise((resolve, reject) => {
      if (this.sucursalControl.invalid || this.tipoControl.invalid) {
        this.notificacionService.openWarn(
          "Complete tipo y sucursal antes de guardar"
        );
        reject();
        return;
      }
      if (
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR &&
        this.selectedProveedor == null
      ) {
        this.notificacionService.openWarn(
          "Debe seleccionar un proveedor para una devolución con proveedor"
        );
        reject();
        return;
      }

      let aux = new Devolucion();
      Object.assign(aux, this.selectedDevolucion);
      aux.tipo = this.tipoControl.value;
      aux.proveedor =
        this.tipoControl.value == TipoDevolucion.CON_PROVEEDOR
          ? this.selectedProveedor
          : null;
      aux.sucursalOrigen = this.sucursalControl.value;
      aux.observacion =
        this.observacionControl.value != null
          ? ("" + this.observacionControl.value).toUpperCase()
          : null;
      aux.usuario = this.mainService.usuarioActual;
      if (aux.fecha == null) aux.fecha = new Date();
      if (aux.estado == null) aux.estado = DevolucionEstado.PENDIENTE;

      this.devolucionService
        .onSaveDevolucion(aux.toInput())
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res != null) {
              Object.assign(this.selectedDevolucion, res);
              this.esNuevo = false;
              this.tipoControl.markAsPristine();
              this.sucursalControl.markAsPristine();
              this.observacionControl.markAsPristine();
              this.tabService.changeCurrentTabName(
                "Devol. " + this.selectedDevolucion.id
              );
              this.computeEstadoFlags();
              resolve(this.selectedDevolucion);
            } else {
              reject();
            }
          },
          () => reject()
        );
    });
  }

  onAddItem() {
    // Con un guardado en curso la devolución todavía puede no tener id: se espera.
    if (this.guardandoCabecera) return;
    if (this.selectedDevolucion?.id == null) {
      this.onGuardarCabecera().then(() => this.abrirBusquedaProducto(), () => {});
    } else {
      this.abrirBusquedaProducto();
    }
  }

  abrirBusquedaProducto() {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
      // Filtrar/mostrar stock por la sucursal de origen de la devolucion (no sucursalActual,
      // que en el server cloud administrativo no aplica). Coincide con lo que valida el backend.
      sucursalFiltro: this.sucursalControl.value,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: PdvSearchProductoResponseData) => {
        this.isDialogOpen = false;
        if (res?.presentacion != null) {
          this.abrirCreateItem(res, null);
        }
      });
  }

  abrirCreateItem(res: PdvSearchProductoResponseData, item: DevolucionItem) {
    this.isDialogOpen = true;
    this.matDialog
      .open(CreateItemDialogComponent, {
        data: {
          item,
          producto: res?.producto,
          presentacion: res?.presentacion,
          tipo: this.selectedDevolucion.tipo,
          motivosAveria: this.motivosAveria,
          sucursalId: this.selectedDevolucion?.sucursalOrigen?.id,
        },
        width: "40%",
        disableClose: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((dialogRes) => {
        this.isDialogOpen = false;
        if (dialogRes?.item != null) {
          this.onSaveItem(dialogRes.item);
        }
      });
  }

  onSaveItem(item: DevolucionItem) {
    let isNew = item?.id == null;
    let aux = new DevolucionItem();
    Object.assign(aux, item);
    aux.devolucion = this.selectedDevolucion;
    // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
    this.devolucionService
      .onSaveDevolucionItem(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res != null) {
            if (isNew) {
              // Los nuevos van primero: se vuelve a la primera página.
              this.itemsPageIndex = 0;
              this.getItems(true);
            } else {
              this.dataSource.data = updateDataSourceWithId(
                this.dataSource.data,
                res,
                res.id
              );
            }
          }
        },
        error: () => {}
      });
  }

  onEditItem(item: DevolucionItem) {
    let res: PdvSearchProductoResponseData = {
      producto: item.producto,
      presentacion: item.presentacion,
    };
    this.abrirCreateItem(res, item);
  }

  onDeleteItem(item: DevolucionItem) {
    this.devolucionService
      .onDeleteDevolucionItem(item.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) this.getItems(true);
      });
  }

  onAvanzar(estado: DevolucionEstado) {
    this.dialogosService
      .confirm(
        "Atención!!",
        "¿Confirma avanzar la devolución al estado " + estado + "?"
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.ejecutarAvanzar(estado);
        }
      });
  }

  ejecutarAvanzar(estado: DevolucionEstado) {
    if (this.procesando) return;
    this.procesando = true;
    this.devolucionService
      .onAvanzarEstado(this.selectedDevolucion.id, estado)
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          this.procesando = false;
          if (res != null) {
            Object.assign(this.selectedDevolucion, res);
            this.canjeMode = false;
            this.acreditarMode = false;
            this.computeEstadoFlags();
            // Al separar, ofrecer imprimir las etiquetas de las cajas.
            if (estado === DevolucionEstado.SEPARADO) {
              this.onImprimirEtiquetas();
            }
          }
        },
        () => (this.procesando = false)
      );
  }

  /** Revierte la devolución un estado hacia atrás (transición segura del backend). */
  onRevertir() {
    const esCanje = this.selectedDevolucion?.estado === DevolucionEstado.CANJEADO;
    this.dialogosService
      .confirm(
        "Atención!!",
        esCanje
          ? "¿Revertir el canje? Se saca del stock lo que se había reingresado y la devolución vuelve a RETIRADO."
          : "¿Revertir la devolución un estado hacia atrás?"
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (!confirmado) return;
        if (this.procesando) return;
        this.procesando = true;
        this.operacionService
          .onRevertirEstado(this.selectedDevolucion.id)
          .pipe(untilDestroyed(this))
          .subscribe(
            (res) => {
              this.procesando = false;
              if (res != null) {
                Object.assign(this.selectedDevolucion, res);
                this.canjeMode = false;
                this.acreditarMode = false;
                this.computeEstadoFlags();
                // Al deshacer un canje los ítems conservan lo reingresado: se releen para corregirlo.
                if (esCanje) this.getItems(true);
              }
            },
            () => (this.procesando = false)
          );
      });
  }

  /** Muestra si ya está separada o más avanzada (para el botón de reimpresión). */
  get puedeImprimirEtiquetas(): boolean {
    const e = this.selectedDevolucion?.estado;
    return (
      e === DevolucionEstado.SEPARADO ||
      e === DevolucionEstado.RETIRADO ||
      e === DevolucionEstado.CANJEADO ||
      e === DevolucionEstado.ACREDITADO ||
      e === DevolucionEstado.DESCARTADO
    );
  }

  /** Abre el diálogo de impresión de etiquetas de separado. */
  onImprimirEtiquetas() {
    if (!this.selectedDevolucion?.id || this.totalItems === 0) return;
    // La tabla tiene una sola página: las etiquetas necesitan todos los ítems.
    this.devolucionService
      .onGetDevolucionItemsPorDevolucion(this.selectedDevolucion.id)
      .pipe(untilDestroyed(this))
      .subscribe((items) => {
        if (items?.length > 0) this.abrirDialogoEtiquetas(items);
      });
  }

  private abrirDialogoEtiquetas(items: DevolucionItem[]) {
    this.matDialog
      .open(ImprimirEtiquetasDialogComponent, {
        data: {
          devolucionId: this.selectedDevolucion.id,
          identificador: this.selectedDevolucion.identificador,
          items,
        },
        width: "560px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: ImprimirEtiquetasDialogResult) => {
        if (res?.accion === "ticket") {
          this.etiquetasService
            .onImprimirTicket(this.selectedDevolucion.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (ok) =>
                ok
                  ? this.notificacionService.openSucess("Etiquetas enviadas")
                  : this.notificacionService.openWarn("No se pudo imprimir"),
              error: () =>
                this.notificacionService.openAlgoSalioMal(
                  "Error al imprimir las etiquetas"
                ),
            });
        } else if (res?.accion === "pdf") {
          this.etiquetasService
            .onGetPdf(this.selectedDevolucion.id)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (pdf) => {
                if (pdf) {
                  this.reporteService.onAdd(
                    `Etiquetas ${this.selectedDevolucion.identificador}`,
                    pdf
                  );
                  this.tabService.addTab(
                    new Tab(ReportesComponent, "Reportes", null, null)
                  );
                }
              },
              error: () =>
                this.notificacionService.openAlgoSalioMal(
                  "Error al generar las etiquetas"
                ),
            });
        }
      });
  }

  /** Envía la devolución separada a un depósito (colecta interna -> COLECTADO). */
  onColectar() {
    this.matDialog
      .open(ColectarDialogComponent, {
        data: { sucursalOrigenId: this.selectedDevolucion.sucursalOrigen?.id },
        width: "420px",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: ColectarDialogResult) => {
        if (!res?.sucursalDestinoId) return;
        if (this.procesando) return;
        this.procesando = true;
        const usuarioId = this.mainService.usuarioActual?.id;
        this.colectaService
          .onColectar(this.selectedDevolucion.id, res.sucursalDestinoId, usuarioId)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (dev) => {
              this.procesando = false;
              if (dev != null) {
                Object.assign(this.selectedDevolucion, dev);
                this.computeEstadoFlags();
                this.notificacionService.openSucess(
                  "Enviado a " + res.sucursalDestinoNombre
                );
              }
            },
            error: () => {
              this.procesando = false;
              this.notificacionService.openAlgoSalioMal(
                "No se pudo colectar la devolución"
              );
            },
          });
      });
  }

  onIniciarCanje() {
    this.canjeMode = true;
    this.acreditarMode = false;
  }

  /**
   * Abre el diálogo de reingreso para un ítem y lo guarda en el central en el momento: la tabla
   * muestra una página, así que «Confirmar canje» no tiene todos los ítems para mandarlos juntos.
   * Lo guardado no mueve stock hasta confirmar el canje.
   */
  onRegistrarReingreso(item: DevolucionItem) {
    this.isDialogOpen = true;
    this.matDialog
      .open(ReingresoCanjeDialogComponent, {
        data: { item },
        width: "30%",
        disableClose: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: ReingresoCanjeDialogResult) => {
        this.isDialogOpen = false;
        if (res == null) return;
        const aux = new DevolucionItem();
        Object.assign(aux, item);
        aux.cantidadReingresada = res.cantidadReingresada;
        aux.vencimientoReingreso = res.vencimientoReingreso;
        aux.loteReingreso = res.loteReingreso;
        aux.devolucion = this.selectedDevolucion;
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
        this.devolucionService
          .onSaveDevolucionItem(aux.toInput())
          .pipe(untilDestroyed(this))
          .subscribe({
            next: (guardado) => {
              if (guardado == null) return;
              item.cantidadReingresada = res.cantidadReingresada;
              item.vencimientoReingreso = res.vencimientoReingreso;
              item.loteReingreso = res.loteReingreso;
              // Nueva referencia para refrescar la tabla.
              this.dataSource.data = [...this.dataSource.data];
            },
            error: () => {}
          });
      });
  }

  /** Los reingresos ya se guardaron uno por uno al registrarlos: solo falta avanzar a CANJEADO. */
  onConfirmarCanje() {
    if (this.itemsFallo) return;
    if (this.totalItems == 0) {
      this.notificacionService.openWarn("No hay items para canjear");
      return;
    }
    this.ejecutarAvanzar(DevolucionEstado.CANJEADO);
  }

  onIniciarAcreditar() {
    this.acreditarMode = true;
    this.canjeMode = false;
  }

  onConfirmarAcreditar() {
    if (this.procesando || this.itemsFallo) return;
    this.procesando = true;
    this.devolucionService
      .onAcreditar(
        this.selectedDevolucion.id,
        this.nroNotaCreditoControl.value != null
          ? ("" + this.nroNotaCreditoControl.value).toUpperCase()
          : null,
        this.montoAcreditadoControl.value
      )
      .pipe(untilDestroyed(this))
      .subscribe(
        (res) => {
          this.procesando = false;
          if (res != null) {
            Object.assign(this.selectedDevolucion, res);
            this.acreditarMode = false;
            this.nroNotaCreditoControl.markAsPristine();
            this.montoAcreditadoControl.markAsPristine();
            this.computeEstadoFlags();
          }
        },
        () => (this.procesando = false)
      );
  }

  onCancelar() {
    this.matDialog
      .open(CancelarDevolucionDialogComponent, { width: "460px" })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: CancelarDevolucionDialogResult | undefined) => {
        if (!res) return; // cerró sin confirmar
        if (this.procesando) return;
        this.procesando = true;
        this.devolucionService
          .onCancelar(this.selectedDevolucion.id, res.motivo)
          .pipe(untilDestroyed(this))
          .subscribe(
            (dev) => {
              this.procesando = false;
              if (dev != null) {
                Object.assign(this.selectedDevolucion, dev);
                this.computeEstadoFlags();
              }
            },
            () => (this.procesando = false)
          );
      });
  }

  onVolver() {
    this.tabService.addTab(
      new Tab(
        ListDevolucionComponent,
        "Lista de devoluciones",
        null,
        EditDevolucionComponent
      )
    );
  }
}
