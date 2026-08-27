import { RutaHojaComponent } from '../ruta-hoja/ruta-hoja.component';
import { TransferenciaTimelineDialogComponent } from "../../../transferencias/transferencia-timeline-dialog/transferencia-timeline-dialog.component";
import { TipoEntidad } from "./../../../../generics/tipo-entidad.enum";
import {
  QrCodeComponent,
  QrData,
} from "./../../../../shared/qr-code/qr-code.component";
import { CargandoDialogService } from "./../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { TransferenciaService } from "./../transferencia.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatTableDataSource } from "@angular/material/table";
import { MainService } from "../../../../main.service";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SeleccionarSucursalDialogComponent } from "../seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { CreateItemDialogComponent } from "../create-item-dialog/create-item-dialog.component";
import {
  CurrencyMask,
  stringToInteger,
  updateDataSource,
  updateDataSourceInsertFirst,
  updateDataSourceWithId,
} from "../../../../commons/core/utils/numbersUtils";
import {
  EtapaAsignacionLote,
  EtapaTransferencia,
  TipoTransferencia,
  Transferencia,
  TransferenciaEstado,
  TransferenciaItem,
  TransferenciaItemAlerta,
  TransferenciaItemLoteInput,
  TransferenciaItemView,
} from "../transferencia.model";
import {
  aplicarConfirmacion,
  nombreEtapaDeOrigen,
  puedeConfirmar,
} from "../transferencia-item-confirmacion";
import {
  SeleccionarLotesDialogComponent,
  SeleccionarLotesDialogData,
  SeleccionarLotesDialogResult,
} from "../seleccionar-lotes-dialog/seleccionar-lotes-dialog.component";
import { Tab } from "../../../../layouts/tab/tab.model";
import { SelectionModel } from "@angular/cdk/collections";
import { ModificarItemDialogComponent } from "../modificar-item-dialog/modificar-item-dialog.component";
import { FormControl, Validators } from "@angular/forms";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { MatSelect } from "@angular/material/select";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Observable, Subscription, of } from "rxjs";
import { finalize, map, switchMap } from "rxjs/operators";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { TabService } from "../../../../layouts/tab/tab.service";
import { PresentacionService } from "../../../productos/presentacion/presentacion.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";
import { DialogoNuevasFuncionesComponent } from "../../../../shared/components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component";
import { ListTransferenciaComponent } from "../list-transferencia/list-transferencia.component";
import {
  dateToString,
  parseShortDate,
  validarFecha,
} from "../../../../commons/core/utils/dateUtils";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { ConfiguracionTransferenciaService } from '../configuracion-transferencia-dialog/configuracion-transferencia.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-transferencia",
  templateUrl: "./edit-transferencia.component.html",
  styleUrls: ["./edit-transferencia.component.scss"],
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
export class EditTransferenciaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("codigoInput", { static: false }) codigoInput: ElementRef;
  @ViewChild("cantPresentacionInput", { static: false })
  cantPresentacionInput: ElementRef;
  @ViewChild("precioPresentacionInput", { static: false })
  precioPresentacionInput: ElementRef;
  @ViewChild("precioUnidadInput", { static: false })
  precioUnidadInput: ElementRef;
  @ViewChild("vencimientoInput", { static: false })
  vencimientoInput: ElementRef;
  @ViewChild("matSelect", { static: false }) matSelect: MatSelect;
  @ViewChild("monedaInput", { static: false }) monedaInput: ElementRef;
  @ViewChild("monedaVueltoInput", { static: false })
  monedaVueltoInput: ElementRef;

  @ViewChild("filtroProductoInput", { static: false })
  filtroProductoInput: ElementRef;

  @Input()
  data: Tab;

  columnsToDisplay = [
    "producto",
    "codigo",
    "presentacion",
    "cantidad",
    "precio",
    "vencimiento",
    "estado",
    "vencido",
    "menu",
  ];

  selectedSucursalOrigen: Sucursal;

  selectedSucursalDestino: Sucursal;

  selectedTransferencia = new Transferencia();

  selectedTransferenciaItem: TransferenciaItem;

  selectedProducto = new Producto();

  dataSource = new MatTableDataSource<TransferenciaItemView>([]);

  expandedElement: TransferenciaItem;

  selectedEtapa: EtapaTransferencia;

  isDialogOpen = false;

  currencyMask = new CurrencyMask();

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<TransferenciaItem>;

  isLastPage = false;

  isPreTransferenciaCreacion = false;
  isPreTransferenciaOrigen = false;
  isPreparacionMercaderia = false;
  isPreparacionMercaderiaConcluida = false;
  isTransporteVerificacion = false;
  isTransporteEnCamino = false;
  isTransporteEnDestino = false;
  isRecepcionEnVerificacion = false;
  isRecepcionConcluida = false;
  isAllConfirmedPreparacion = false;
  isAllConfirmedTransporte = false;
  isAllConfirmedRecepcion = false;

  isOrigen = false;
  isDestino = false;
  isPesable = false;
  selection = new SelectionModel<TransferenciaItem>(true, []);

  etapaList;

  puedeEditar = false;

  selectedResponsable;

  codigoControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl(null, Validators.required);
  cantidadPresentacionControl = new FormControl(1, [
    Validators.min(0),
    Validators.pattern("\\d+([.]\\d+)?"),
  ]);
  cantidadUnidadControl = new FormControl(1, [
    Validators.min(0),
    Validators.pattern("\\d+([.]\\d+)?"),
  ]);
  vencimientoControl = new FormControl(null);
  /**
   * Lotes elegidos para el ítem que se está cargando, todavía sin guardar. Se manda junto con la
   * mutación que crea el ítem. Null significa "no tocar la asignación", que es lo que ve el
   * backend en cualquier guardado que no pase por la elección de lotes.
   */
  lotesPendientes: TransferenciaItemLoteInput[] = null;
  /**
   * Presentación con la que se hizo la elección pendiente. Si el operador cambia de presentación
   * después de elegir lotes, el reparto queda expresado en una medida que ya no es la del ítem,
   * así que hay que volver a pedirlo.
   */
  private presentacionDeLotesPendientes: number = null;
  monedaControl = new FormControl(null);
  precioUnidadControl = new FormControl(null, Validators.required);
  precioPresentacionControl = new FormControl(null, Validators.required);

  monedaList: Moneda[];
  filteredMonedaList: Moneda[];
  selectedMoneda: Moneda;
  monedaSub: Subscription;
  monedaTimer;

  //filtro de productos
  filtroProductosOpen = false;
  filtroProductoControl = new FormControl(null);
  constructor(
    private matDialog: MatDialog,
    public mainService: MainService,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private productoService: ProductoService,
    private monedaService: MonedaService,
    private tabService: TabService,
    private presentacionService: PresentacionService,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private configuracionTransferenciaService: ConfiguracionTransferenciaService
  ) { }

  ngOnInit(): void {
    this.selectedTransferencia = new Transferencia();
    this.dataSource.data = [];
    this.etapaList = Object.values(EtapaTransferencia);
    this.selectedTransferencia.usuarioPreTransferencia =
      this.mainService.usuarioActual;
    this.selectedTransferencia.tipo = TipoTransferencia.MANUAL;
    this.selectedTransferencia.estado = TransferenciaEstado.ABIERTA;
    this.selectedTransferencia.etapa =
      EtapaTransferencia.PRE_TRANSFERENCIA_CREACION;

    if (this.data?.tabData != null && this.data?.tabData["id"]) {
      this.cargarDatos();
    } else {
      setTimeout(() => {
        this.selectSucursales();
        this.verificarEtapa();
      }, 1000);
    }

    this.cantidadUnidadControl.disable();

    this.cantidadPresentacionControl.valueChanges.subscribe((res) => {
      if (res != null && this.presentacionControl.valid) {
        this.cantidadUnidadControl.enable();
        this.cantidadUnidadControl.setValue(
          this.presentacionControl.value?.cantidad * res
        );
        this.cantidadUnidadControl.disable();
      }
    });

    setTimeout(() => {
      if (this.codigoInput != null) {
        this.codigoInput.nativeElement.focus();
      }
    }, 1000);

    setTimeout(() => {
      this.monedaService.onGetAll().subscribe((data: Moneda[]) => {
        this.monedaList = data;
        this.monedaList?.length > 0
          ? this.onMonedaSelect(this.monedaList[0])
          : null;
      });
    }, 1000);

    // this.monedaSub = this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
    //   if (this.monedaControl.dirty) {
    //     if (res == "") this.selectedMoneda = null;
    //     if (this.monedaTimer != null) {
    //       clearTimeout(this.monedaTimer);
    //     }
    //     if (res != null && res.length != 0) {
    //       this.monedaTimer = setTimeout(() => {
    //         this.filteredMonedaList = this.monedaList.filter(p => p.id == res || comparatorLike(res, p.denominacion))
    //         if (this.filteredMonedaList.length == 1) {
    //           this.onMonedaSelect(this.filteredMonedaList[0]);
    //           this.onMonedaAutocompleteClose();
    //         } else {
    //           this.onMonedaAutocompleteClose();
    //           this.onMonedaSelect(null);
    //         }
    //       }, 500);
    //     } else {
    //       this.filteredMonedaList = [];
    //     }
    //   }
    // });

    this.monedaControl.setValue("1 - GUARANI");
    this.monedaControl.disable();
  }

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    if (this.isDialogOpen) {
      return null;
    }
    if (
      this.selectedTransferencia.etapa ==
      EtapaTransferencia.PRE_TRANSFERENCIA_CREACION
    ) {
      switch (key) {
        default:
          break;
      }
    }
  }

  onMonedaSelect(e) {
    if (e?.id != null) {
      this.selectedMoneda = e;
      this.monedaControl.setValue(
        this.selectedMoneda?.id + " - " + this.selectedMoneda?.denominacion
      );
    }
  }

  selectSucursales() {
    this.isDialogOpen = true;
    this.matDialog
      .open(SeleccionarSucursalDialogComponent, {
        width: "80%",
        height: "70%",
        disableClose: false,
        data: {
          sucursalOrigen: this.selectedTransferencia?.sucursalOrigen,
          sucursalDestino: this.selectedTransferencia?.sucursalDestino,
        },
      })
      .afterClosed()
      .subscribe(async (res) => {
        this.isDialogOpen = false;
        if (res != null) {
          let auxTransf = new Transferencia();
          Object.assign(auxTransf, this.selectedTransferencia);

          auxTransf.sucursalOrigen = res["sucursalOrigen"];
          auxTransf.sucursalDestino = res["sucursalDestino"];
          // this.codigoInput.nativeElement.focus();
          // if (this.selectedTransferencia?.id != null) {
          this.transferenciaService
            .onSaveTransferencia(auxTransf.toInput())
            .pipe(untilDestroyed(this))
            .subscribe((saveTransferenciaRes) => {
              this.selectedTransferencia.sucursalOrigen =
                saveTransferenciaRes.sucursalOrigen;
              this.selectedTransferencia.sucursalDestino =
                saveTransferenciaRes.sucursalDestino;
              this.selectedTransferencia.id = saveTransferenciaRes.id;
              this.tabService.changeCurrentTabName(
                "Transferencia " + this.selectedTransferencia.id
              );
            });
          // }
        } else {
          this.dialogoService
            .confirm(
              "Atención!!",
              "Para iniciar una transferencia debes de seleccionar las sucursales de origen y destino",
              null,
              null,
              true,
              "Selec. sucursales",
              "Salir"
            )
            .subscribe((res2) => {
              if (res2 == true) {
                this.selectSucursales();
              } else {
                this.tabService.removeCurrentTab();
              }
            });
        }
      });
  }

  cargarDatos() {
    // this.cargandoService.openDialog(false, "Cargando datos");
    let id = this.data.tabData["id"];
    if (id != null) {
      this.transferenciaService
        .onGetTransferencia(id)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          // this.cargandoService.closeDialog();
          if (res != null) {
            this.selectedTransferencia = new Transferencia();
            Object.assign(this.selectedTransferencia, res);
            setTimeout(() => {
              this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
              this.pageSize = this.paginator.pageSizeOptions[1];
            }, 0);
            this.getTransferenciaItemList();
            this.isOrigen =
              this.selectedTransferencia?.sucursalOrigen?.id ==
              this.mainService?.sucursalActual?.id;
            this.isDestino =
              this.selectedTransferencia?.sucursalDestino?.id ==
              this.mainService?.sucursalActual?.id;
            this.onVerificarConfirmados();
            this.verificarEtapa();
          }
        });
    }
  }

  getTransferenciaItemList() {
    this.cargarPaginaItems(
      this.transferenciaService.onGetTransferenciaItensPorTransferenciaId(
        this.selectedTransferencia.id,
        this.pageIndex,
        this.pageSize
      )
    );
  }

  private cargarPaginaItems(items$: Observable<PageInfo<TransferenciaItem>>): void {
    items$
      .pipe(
        switchMap((res) => {
          const items = res?.getContent ?? [];
          const itemIds = items
            .map((item) => item.id)
            .filter((id) => id != null);
          if (!this.selectedTransferencia?.id || itemIds.length === 0) {
            return of({ res, alertas: [] as TransferenciaItemAlerta[] });
          }
          return this.transferenciaService
            .onAlertasTransferenciaItems(this.selectedTransferencia.id, itemIds)
            .pipe(map((alertas) => ({ res, alertas })));
        }),
        untilDestroyed(this)
      )
      .subscribe(({ res, alertas }) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = this.combinarItemsConAlertas(
            res.getContent,
            alertas
          );
        }
      });
  }

  private combinarItemsConAlertas(
    items: TransferenciaItem[],
    alertas: TransferenciaItemAlerta[]
  ): TransferenciaItemView[] {
    const alertaPorItemId = new Map<number, TransferenciaItemAlerta>();
    for (const alerta of alertas) {
      alertaPorItemId.set(alerta.transferenciaItemId, alerta);
    }

    return items.map((item) => {
      const alerta = alertaPorItemId.get(item.id);
      const alertaVencido = alerta?.alertaVencido ?? false;
      return Object.assign({}, item, {
        alertaVencido,
        alertaAveriado: alerta?.alertaAveriado ?? false,
        textoVencido: alertaVencido ? "Si" : "No",
        // Solo los productos con control de lote pueden elegir de que lote salen.
        esProductoConLote:
          item.presentacionPreTransferencia?.producto?.lote === true,
      }) as TransferenciaItemView;
    });
  }

  private actualizarAlertasPaginaActual(): void {
    const items = this.dataSource.data ?? [];
    const itemIds = items.map((item) => item.id).filter((id) => id != null);
    if (!this.selectedTransferencia?.id || itemIds.length === 0) {
      return;
    }

    this.transferenciaService
      .onAlertasTransferenciaItems(this.selectedTransferencia.id, itemIds)
      .pipe(untilDestroyed(this))
      .subscribe((alertas) => {
        this.dataSource.data = this.combinarItemsConAlertas(items, alertas);
      });
  }

  onRefresh() {
    this.ngOnInit();
  }

  verificarEtapa() {
    this.setAllEtapasFalse();
    switch (this.selectedTransferencia?.etapa) {
      case EtapaTransferencia.PRE_TRANSFERENCIA_CREACION:
        this.isPreTransferenciaCreacion = true;
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioPreTransferencia;
        break;
      case EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN:
        this.isPreTransferenciaOrigen = true;
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioPreTransferencia;
        break;
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        this.isPreparacionMercaderia = true;
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioPreparacion;
        break;
      case EtapaTransferencia.PREPARACION_MERCADERIA_CONCLUIDA:
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioPreparacion;
        this.isPreparacionMercaderiaConcluida = true;
        this.dataSource.data = this.dataSource.data.filter(
          (i) => i.motivoRechazoPreparacion == null
        );
        break;
      case EtapaTransferencia.TRANSPORTE_VERIFICACION:
        this.isTransporteVerificacion = true;
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioTransporte;
        this.dataSource.data = this.dataSource.data.filter(
          (i) => i.motivoRechazoPreparacion == null
        );
        break;
      case EtapaTransferencia.TRANSPORTE_EN_CAMINO:
        this.selectedResponsable =
          this.selectedTransferencia?.usuarioTransporte;
        this.isTransporteEnCamino = true;
        this.dataSource.data = this.dataSource.data.filter(
          (i) =>
            i.motivoRechazoPreparacion == null &&
            i.motivoRechazoTransporte == null
        );
        break;
      case EtapaTransferencia.TRANSPORTE_EN_DESTINO:
        this.isTransporteEnDestino = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        break;
      case EtapaTransferencia.RECEPCION_EN_VERIFICACION:
        this.isRecepcionEnVerificacion = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        this.dataSource.data = this.dataSource.data.filter(
          (i) =>
            i.motivoRechazoPreparacion == null &&
            i.motivoRechazoTransporte == null
        );
        break;
      case EtapaTransferencia.RECEPCION_CONCLUIDA:
        this.isRecepcionConcluida = true;
        this.selectedResponsable = this.selectedTransferencia?.usuarioRecepcion;
        break;
      default:
        break;
    }

    if (
      this.selectedResponsable.id == this.mainService.usuarioActual.id ||
      this.selectedResponsable.id == null
    ) {
      this.puedeEditar = true;
    }
    this.onVerificarConfirmados();
  }

  setAllEtapasFalse() {
    this.isPreTransferenciaCreacion = false;
    this.isPreTransferenciaOrigen = false;
    this.isPreparacionMercaderia = false;
    this.isPreparacionMercaderiaConcluida = false;
    this.isTransporteVerificacion = false;
    this.isTransporteEnCamino = false;
    this.isTransporteEnDestino = false;
    this.isRecepcionEnVerificacion = false;
    this.isRecepcionConcluida = false;
  }

  onAddItem(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
      transferencia: this.selectedTransferencia,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.selectedProducto = response.producto;
        this.precioUnidadControl.setValue(
          this.selectedProducto?.costo?.ultimoPrecioCompra
        );
        this.presentacionControl.setValue(response.presentacion);
        this.cantidadPresentacionControl.setValue(1);
        let codigo = response.presentacion?.codigoPrincipal?.codigo;
        if (codigo == null) codigo = response.producto.codigoPrincipal;
        this.codigoControl.setValue(codigo);
        let foundItem = this.dataSource.data?.find(
          (t) =>
            t.presentacionPreTransferencia?.producto?.id ==
            this.presentacionControl.value?.producto?.id
        );

        if (foundItem != null && !this.selectedProducto?.balanza) {
          this.dialogoService
            .confirm(
              "Ya existe un producto cargado en la lista",
              "Desea editar el item?"
            )
            .subscribe((dialogRes) => {
              if (dialogRes) {
                this.onEditItem(foundItem);
                return;
              }
              // Sigue cargando una segunda linea del mismo producto: si es de lote, hay que
              // elegir de cual sale igual que en el alta normal.
              if (this.abrirSeleccionDeLotesSiCorresponde()) return;
              setTimeout(() => {
                this.cantPresentacionInput.nativeElement.select();
              }, 100);
            });
          return;
        }

        // Productos con control de lote: se elige de que lote sale antes de seguir, porque el
        // reparto entre lotes es justamente lo que define cuanto se transfiere.
        if (this.abrirSeleccionDeLotesSiCorresponde()) return;

        setTimeout(() => {
          this.cantPresentacionInput.nativeElement.select();
        }, 100);
      });
  }

  /**
   * Abre la elección de lotes al cargar un ítem nuevo, si corresponde.
   *
   * Acá la relación se invierte respecto del menú de la grilla: el ítem todavía no existe y no
   * tiene cantidad, así que el total que se reparte entre lotes ES la cantidad a transferir.
   * La selección queda pendiente hasta que se guarda el ítem, porque recién ahí hay un id al
   * cual asociarla.
   *
   * Se llama desde varios puntos de entrada (búsqueda, código de barra, combo de presentación),
   * por eso concentra todas las guardas acá en vez de repetirlas en cada llamador.
   *
   * @returns true si abrió el diálogo, para que el llamador no siga moviendo el foco.
   */
  private abrirSeleccionDeLotesSiCorresponde(): boolean {
    if (!this.isPreTransferenciaCreacion) return false;
    if (this.selectedProducto?.lote !== true) return false;
    const presentacion = this.presentacionControl.value;
    if (presentacion == null) return false;
    // Ya eligió lotes PARA ESTA presentación: no reabrir. Si la presentación cambió sí hay que
    // reabrir, porque el reparto quedó expresado en una medida que ya no es la del ítem.
    if (
      this.lotesPendientes != null &&
      this.presentacionDeLotesPendientes === presentacion.id
    ) {
      return false;
    }

    this.onElegirLotesDeItemNuevo();
    return true;
  }

  private onElegirLotesDeItemNuevo(): void {
    const producto = this.selectedProducto;
    const sucursalOrigenId = this.selectedTransferencia?.sucursalOrigen?.id;
    if (producto?.id == null || sucursalOrigenId == null) {
      return;
    }

    const data: SeleccionarLotesDialogData = {
      productoId: producto.id,
      productoDescripcion: `${producto.id} - ${producto.descripcion}`,
      sucursalOrigenId,
      sucursalOrigenNombre: this.selectedTransferencia?.sucursalOrigen?.nombre,
      cantidad: 0,
      etapa: EtapaAsignacionLote.PRE_TRANSFERENCIA,
      presentacionId: this.presentacionControl.value?.id,
      cantidadDefinidaPorLotes: true,
    };

    this.isDialogOpen = true;
    this.matDialog
      .open(SeleccionarLotesDialogComponent, { data, disableClose: true })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: SeleccionarLotesDialogResult) => {
        this.isDialogOpen = false;
        if (res == null) {
          // Canceló: se sigue como un producto cualquiera y el backend reparte por FEFO.
          this.lotesPendientes = null;
          this.presentacionDeLotesPendientes = null;
          setTimeout(() => {
            this.cantPresentacionInput.nativeElement.select();
          }, 100);
          return;
        }
        this.lotesPendientes = res.lotes;
        this.presentacionDeLotesPendientes = this.presentacionControl.value?.id;
        this.aplicarCantidadDeLotes(res.total);
      });
  }

  /**
   * Lleva el total elegido al campo de cantidad. El diálogo ya trabaja en presentaciones, que es
   * la misma unidad del campo, así que se escribe tal cual; `cantidadUnidadControl` se actualiza
   * solo por la suscripción de `cantidadPresentacionControl`.
   */
  private aplicarCantidadDeLotes(totalPresentaciones: number): void {
    this.cantidadPresentacionControl.setValue(totalPresentaciones);
    setTimeout(() => {
      this.vencimientoInput.nativeElement.select();
    }, 100);
  }

  createItem(presentacion: Presentacion, item?, cantidad?) {
    this.isDialogOpen = true;
    this.matDialog
      .open(CreateItemDialogComponent, {
        data: {
          item,
          presentacion,
          transferencia: this.selectedTransferencia,
          cantidad,
        },
        width: "40%",
        disableClose: true,
      })
      .afterClosed()
      .subscribe(async (res) => {
        this.isDialogOpen = false;
        if (res != null) {
          if (this.selectedTransferencia?.id == null) {
            this.onSaveTransferencia().then(() => {
              this.onSaveTransferenciaItem(res["item"]);
            });
          } else {
            this.onSaveTransferenciaItem(res["item"]);
          }
        }
      });
  }

  onSaveTransferencia(): Promise<any> {
    this.cargandoService.openDialog();
    return new Promise((resolve, reject) => {
      this.transferenciaService
        .onSaveTransferencia(this.selectedTransferencia.toInput())
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog();
          if (res != null) {
            this.selectedTransferencia = res;
            resolve(res);
          } else {
            reject();
          }
        });
    });
  }

  onSaveTransferenciaItem(item: TransferenciaItem, precioCosto?: number) {
    item.usuario = this.mainService.usuarioActual;
    let auxItem = new TransferenciaItem();
    let isNew = item?.id == null;
    Object.assign(auxItem, item);
    auxItem.transferencia = this.selectedTransferencia;

    const input = auxItem.toInput();
    // Los lotes elegidos al cargar el ítem viajan en la misma mutación que lo crea. Se consume
    // el buffer acá, de forma sincrónica, porque el llamador hace onClear() apenas vuelve.
    if (this.lotesPendientes != null) {
      input.lotesAsignados = this.lotesPendientes;
      input.etapaAsignacionLote = EtapaAsignacionLote.PRE_TRANSFERENCIA;
      this.lotesPendientes = null;
      this.presentacionDeLotesPendientes = null;
    }

    this.cargandoService.openDialog();
    this.transferenciaService
      .onSaveTransferenciaItem(input, precioCosto)
      .pipe(untilDestroyed(this))
      // El openDialog de arriba es el overlay bloqueante de TODA la app: si el backend
      // rechaza el item y nadie lo cierra, la pantalla queda tapada y hay que recargar.
      .pipe(finalize(() => this.cargandoService.closeDialog()))
      .subscribe((res) => {
        if (res != null) {
          if (!isNew) {
            this.dataSource.data = updateDataSourceWithId(
              this.dataSource.data,
              res,
              res?.id
            );
          } else {
            this.dataSource.data = updateDataSourceInsertFirst(
              this.dataSource.data,
              res
            );
            if (this.pageSize == this.dataSource.data?.length)
              this.dataSource.data.pop();
            this.paginator.length = this.paginator.length + 1;
          }
          this.actualizarAlertasPaginaActual();
        }
      });
  }

  onDeleteItem(item: TransferenciaItem, index) {
    this.transferenciaService
      .onDeleteTransferenciaItem(item.id)
      .subscribe((res) => {
        if (res) {
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            null,
            index
          );
          this.paginator.length = this.dataSource.data.length;
        }
      });
  }

  onEditItem(item: TransferenciaItem) {
    this.selectedTransferenciaItem = item;
    this.presentacionService
      .onGetPresentacionesPorProductoId(
        item.presentacionPreTransferencia.producto.id
      )
      .subscribe((res) => {
        this.selectedProducto = item.presentacionPreTransferencia.producto;
        this.selectedProducto.presentaciones = res;
        this.presentacionControl.setValue(
          res.find((p) => p.id == item.presentacionPreTransferencia.id)
        );
        if (
          this.precioPresentacionControl?.value?.codigoPrincipal?.codigo != null
        ) {
          this.codigoControl.setValue(
            this.presentacionControl?.value?.codigoPrincipal?.codigo
          );
        } else {
          this.codigoControl.setValue(
            item?.presentacionPreTransferencia?.producto?.codigoPrincipal
          );
        }
        this.cantidadPresentacionControl.setValue(
          item.cantidadPreTransferencia
        );
        this.vencimientoControl.setValue(
          item.vencimientoPreTransferencia != null
            ? dateToString(item.vencimientoPreTransferencia, "dd/MM/yy")
            : null
        );
        this.matSelect.focus();
        this.matSelect.open();
      });
  }

  // onFinalizar() {
  //   this.transferenciaService
  //     .onFinalizar(this.selectedTransferencia)
  //     .pipe(untilDestroyed(this))
  //     .subscribe((res) => {
  //       if (res) {
  //         this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
  //         this.selectedTransferencia.etapa =
  //           EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN;
  //         this.verificarEtapa();
  //       }
  //     });
  // }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  onSelectRow(row) {
    this.selection.toggle(row);
  }

  onEditClick(row) { }

  /**
   * Abre la elección manual de los lotes de los que sale un ítem.
   *
   * Solo tiene sentido en creación y en preparación: una vez que la mercadería salió del
   * depósito, el desglose ya quedó fijado contra el movimiento de stock.
   */
  onElegirLotes(item: TransferenciaItemView): void {
    const etapaAsignacion = this.etapaAsignacionActual();
    if (etapaAsignacion == null) {
      return;
    }
    const producto = item?.presentacionPreTransferencia?.producto;
    const sucursalOrigenId = this.selectedTransferencia?.sucursalOrigen?.id;
    if (producto?.id == null || sucursalOrigenId == null) {
      return;
    }

    const esPreparacion = etapaAsignacion === EtapaAsignacionLote.PREPARACION;
    const presentacion = esPreparacion
      ? item?.presentacionPreparacion ?? item?.presentacionPreTransferencia
      : item?.presentacionPreTransferencia;

    const data: SeleccionarLotesDialogData = {
      productoId: producto.id,
      productoDescripcion: `${producto.id} - ${producto.descripcion}`,
      sucursalOrigenId,
      sucursalOrigenNombre: this.selectedTransferencia?.sucursalOrigen?.nombre,
      // La cantidad del ítem ya está en presentaciones, que es la unidad del diálogo.
      cantidad: esPreparacion
        ? item?.cantidadPreparacion ?? item?.cantidadPreTransferencia
        : item?.cantidadPreTransferencia,
      etapa: etapaAsignacion,
      presentacionId: presentacion?.id,
      asignacionActual: item.lotesAsignados,
    };

    // Sin esto, tipear cantidades dentro del diálogo dispara los atajos de teclado de la pantalla.
    this.isDialogOpen = true;
    this.matDialog
      .open(SeleccionarLotesDialogComponent, { data })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: SeleccionarLotesDialogResult) => {
        this.isDialogOpen = false;
        if (res != null) {
          this.guardarAsignacionDeLotes(item, res);
        }
      });
  }

  /**
   * Etapa de asignación que corresponde a la etapa actual de la transferencia.
   * Null significa que en este momento no se pueden elegir lotes.
   */
  private etapaAsignacionActual(): EtapaAsignacionLote {
    switch (this.selectedTransferencia?.etapa) {
      case EtapaTransferencia.PRE_TRANSFERENCIA_CREACION:
      case EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN:
        return EtapaAsignacionLote.PRE_TRANSFERENCIA;
      case EtapaTransferencia.PREPARACION_MERCADERIA:
        return EtapaAsignacionLote.PREPARACION;
      default:
        return null;
    }
  }

  /**
   * Persiste el reparto elegido. Se manda `lotesAsignados` explícitamente: cuando ese campo no
   * viaja, el backend deja la asignación como estaba, que es lo que hace el resto de la pantalla.
   */
  private guardarAsignacionDeLotes(
    item: TransferenciaItem,
    seleccion: SeleccionarLotesDialogResult
  ): void {
    const auxItem = new TransferenciaItem();
    Object.assign(auxItem, item);
    auxItem.usuario = this.mainService.usuarioActual;
    auxItem.transferencia = this.selectedTransferencia;

    const input = auxItem.toInput();
    input.lotesAsignados = seleccion.lotes;
    input.etapaAsignacionLote = seleccion.etapa;

    this.cargandoService.openDialog();
    this.transferenciaService
      .onSaveTransferenciaItem(input)
      .pipe(untilDestroyed(this))
      // Idem: el overlay se cierra pase lo que pase, no solo cuando el guardado sale bien.
      .pipe(finalize(() => this.cargandoService.closeDialog()))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(
            this.dataSource.data,
            res,
            res?.id
          );
          // Recalcula alertas y las propiedades derivadas de la grilla sobre la fila nueva.
          this.actualizarAlertasPaginaActual();
          this.notificacionService.openSucess("Lotes asignados");
        }
      });
  }

  onConfirm(item: TransferenciaItem) {
    const etapa = this.selectedTransferencia?.etapa;

    // Un item que no paso por la etapa anterior no tiene de donde copiar. Antes se guardaba el null
    // igual y la fila quedaba en "Falta verificar" para siempre, sin decir por que.
    if (!puedeConfirmar(item, etapa)) {
      this.notificacionService.openWarn(
        'Este producto no tiene datos de ' +
          nombreEtapaDeOrigen(etapa) +
          ', así que no se puede verificar. Si no llegó, corresponde rechazarlo.'
      );
      return;
    }

    let newItem = new TransferenciaItem();
    item = Object.assign(newItem, item);
    item.usuario = item.usuario ?? this.mainService.usuarioActual;
    aplicarConfirmacion(item, etapa);

    this.transferenciaService
      .onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(
            this.dataSource.data,
            item,
            item.id
          );
        }
        this.actualizarAlertasPaginaActual();
        this.onVerificarConfirmados();
      });
  }

  onDesconfirm(item: TransferenciaItem) {
    // Se limpia con una mutation dedicada: en saveTransferenciaItem la ausencia de un campo
    // significa "no lo toques", asi que mandar nulls ya no vacia nada.
    this.transferenciaService
      .onDesconfirmarTransferenciaItem(
        item.id,
        this.selectedTransferencia?.etapa
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(
            this.dataSource.data,
            res,
            res.id
          );
        }
        this.actualizarAlertasPaginaActual();
        this.onVerificarConfirmados();
      });
  }

  onVerificarConfirmados() {
    let okPreparacion = true;
    let okTransporte = true;
    let okRecepcion = true;
    this.dataSource.data.find((i) => {
      if (
        this.selectedTransferencia.etapa ==
        EtapaTransferencia.PREPARACION_MERCADERIA &&
        i.cantidadPreparacion == null &&
        i.vencimientoPreparacion == null &&
        i.motivoRechazoPreparacion == null
      ) {
        okPreparacion = false;
      } else if (
        this.selectedTransferencia.etapa ==
        EtapaTransferencia.TRANSPORTE_VERIFICACION &&
        i.cantidadTransporte == null &&
        i.vencimientoTransporte == null &&
        i.motivoRechazoTransporte == null
      ) {
        okTransporte = false;
      } else if (
        this.selectedTransferencia.etapa ==
        EtapaTransferencia.RECEPCION_EN_VERIFICACION &&
        i.cantidadRecepcion == null &&
        i.vencimientoRecepcion == null &&
        i.motivoRechazoRecepcion == null
      ) {
        okRecepcion = false;
      }
    });
    this.isAllConfirmedPreparacion = okPreparacion;
    this.isAllConfirmedTransporte = okTransporte;
    this.isAllConfirmedRecepcion = okRecepcion;
  }

  onModificarCantidad(item) {
    this.onModificarItem(item, true, false, false);
  }
  onModificarVencimiento(item) {
    this.onModificarItem(item, false, true, false);
  }
  onRechazar(item) {
    this.onModificarItem(item, false, false, true);
  }

  onModificarItem(
    item,
    cantidad?: boolean,
    vencimiento?: boolean,
    rechazar?: boolean
  ) {
    this.isDialogOpen = true;
    this.matDialog
      .open(ModificarItemDialogComponent, {
        data: {
          item,
          isCantidad: cantidad,
          isVencimiento: vencimiento,
          isRechazar: rechazar,
          etapa: this.selectedTransferencia?.etapa,
        },
        width: "500px",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        if (res?.item != null) {
          // El dialogo devuelve la fila de la grilla, que puede venir sin usuario. Sin esto el input
          // sale con usuarioId en null y el backend no lo puede guardar.
          res["item"].usuario =
            res["item"].usuario ?? this.mainService.usuarioActual;
          this.transferenciaService
            .onSaveTransferenciaItem(res["item"].toInput())
            .pipe(untilDestroyed(this))
            .subscribe((res2) => {
              if (res2 != null) {
                this.dataSource.data = updateDataSourceWithId(
                  this.dataSource.data,
                  res2,
                  res2.id
                );
              }
              this.actualizarAlertasPaginaActual();
              this.onVerificarConfirmados();
            });
        }
      });
  }

  onAvanzarEtapa(etapa) {
    console.log('etapa', etapa);
    this.transferenciaService
      .onAvanzarEtapa(this.selectedTransferencia, etapa)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.selectedTransferencia.etapa = etapa;
          this.verificarEtapa();
          if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_CREACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_TRANSITO;
          } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
          }
        }
      });
  }



  onSelectEstado(etapa: EtapaTransferencia) { }

  onSelectEtapa(e) { }

  onSolicitarModificarItem(item) { }
  onSolicitarRechazarItem(item) { }

  onQrClick() {
    let codigo: QrData = {
      sucursalId: this.mainService.sucursalActual.id,
      tipoEntidad: TipoEntidad.TRANSFERENCIA,
      idOrigen: this.selectedTransferencia.id,
      idCentral: this.selectedTransferencia.id,
      componentToOpen: "EditTransferenciaComponent",
    };
    this.isDialogOpen = true;
    this.matDialog
      .open(QrCodeComponent, {
        data: {
          codigo: codigo,
          nombre: "Transferencia",
          imprimir: true,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        if (res == "imprimir") {
          this.transferenciaService.onImprimirTransferencia(
            this.selectedTransferencia.id,
            true
          );
        }
      });
  }

  onOpenTimeLine() {
    this.isDialogOpen = true;
    this.matDialog
      .open(TransferenciaTimelineDialogComponent, {
        data: this.selectedTransferencia,
        width: "70vw",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
      });
  }

  onSearchPorCodigo() {
    if (this.codigoControl.valid) {
      let text = this.codigoControl.value;
      this.isPesable = false;
      let peso;
      let codigo;
      if (text.length == 13 && text.substring(0, 2) == "20") {
        this.isPesable = true;
        codigo = text.substring(2, 7);
        peso = +text.substring(7, 12) / 1000;
        text = codigo;
        this.cantidadUnidadControl.enable();
        this.cantidadPresentacionControl.setValue(peso);
        this.cantidadUnidadControl.setValue(peso);
        this.cantidadPresentacionControl.disable();
        this.cantidadUnidadControl.disable();
        this.presentacionControl.disable();
      } else {
        this.cantidadPresentacionControl.enable();
        this.presentacionControl.enable();
      }
      this.productoService.onGetProductoPorCodigo(text).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.isPesable = this.selectedProducto.balanza == true;
          let foundItem = this.dataSource.data?.find(
            (t) =>
              t.presentacionPreTransferencia?.producto?.id ==
              this.selectedProducto?.id
          );
          if (foundItem != null && !this.selectedProducto?.balanza) {
            this.dialogoService
              .confirm(
                "Ya existe un producto cargado en la lista",
                "Desea editar el item?"
              )
              .subscribe((dialogRes) => {
                if (dialogRes) {
                  this.onEditItem(foundItem);
                } else {
                  this.precioUnidadControl.setValue(
                    this.selectedProducto?.costo?.ultimoPrecioCompra
                  );
                  if (this.selectedProducto?.presentaciones?.length == 1) {
                    this.presentacionControl.setValue(
                      this.selectedProducto.presentaciones[0]
                    );
                    if (!this.isPesable) {
                      this.cantidadPresentacionControl.setValue(1);
                      this.cantidadUnidadControl.setValue(
                        this.presentacionControl.value?.cantidad
                      );
                    }
                    if (this.abrirSeleccionDeLotesSiCorresponde()) {
                      return;
                    }
                    if (this.selectedProducto.balanza) {
                      this.vencimientoInput.nativeElement.select();
                    } else {
                      this.cantPresentacionInput.nativeElement.select();
                    }
                  } else if (
                    this.selectedProducto?.presentaciones?.length > 1
                  ) {
                    this.presentacionControl.setValue(
                      this.selectedProducto.presentaciones[0]
                    );
                    this.matSelect.focus();
                    this.matSelect.open();
                  } else {
                  }
                }
              });
          } else {
            this.precioUnidadControl.setValue(
              this.selectedProducto?.costo?.ultimoPrecioCompra
            );
            if (this.selectedProducto?.presentaciones?.length == 1) {
              this.presentacionControl.setValue(
                this.selectedProducto.presentaciones[0]
              );
              if (!this.isPesable) {
                this.cantidadPresentacionControl.setValue(1);
                this.cantidadUnidadControl.setValue(
                  this.presentacionControl.value?.cantidad
                );
              }
              if (this.abrirSeleccionDeLotesSiCorresponde()) {
                return;
              }
              if (this.selectedProducto.balanza) {
                this.vencimientoInput.nativeElement.select();
              } else {
                this.cantPresentacionInput.nativeElement.select();
              }
            } else if (this.selectedProducto?.presentaciones?.length > 1) {
              this.presentacionControl.setValue(
                this.selectedProducto.presentaciones[0]
              );
              this.matSelect.focus();
              this.matSelect.open();
            } else {
            }
          }
        } else {
          this.onAddItem(this.codigoControl.value);
        }
      });
    } else {
      this.onAddItem();
    }
  }
  onPresentacionSelect() {
    // Producto con lote: elegir de que lote sale reemplaza al paso de cargar la cantidad,
    // porque la cantidad sale del reparto entre lotes.
    if (this.abrirSeleccionDeLotesSiCorresponde()) {
      this.matSelect?.close();
      return;
    }

    const tienePrecioUnidad = this.precioUnidadControl.value != null && this.precioUnidadControl.value > 0;
    const tienePrecioPresentacion = this.precioPresentacionControl.value != null && this.precioPresentacionControl.value > 0;

    if (tienePrecioUnidad || tienePrecioPresentacion) {
      let costoUnidadParaValidar = 0;

      if (tienePrecioUnidad) {
        const nuevoPrecioPresentacion = this.precioUnidadControl.value * this.presentacionControl.value?.cantidad;
        this.precioPresentacionControl.setValue(nuevoPrecioPresentacion);
        costoUnidadParaValidar = this.precioUnidadControl.value;
      } else if (tienePrecioPresentacion) {
        costoUnidadParaValidar = this.precioPresentacionControl.value / this.presentacionControl.value?.cantidad;
        this.precioUnidadControl.setValue(costoUnidadParaValidar);
      }

      this.onValidarCostoConDialogo().then((puedeGuardar) => {
        if (puedeGuardar) {
          this.cantPresentacionInput.nativeElement.select();
          this.matSelect.close();
        } else {
          if (!tienePrecioUnidad && tienePrecioPresentacion) {
            this.precioUnidadControl.setValue(null);
          }
          this.matSelect.focus();
        }
      });
    } else {
      this.cantPresentacionInput.nativeElement.select();
      this.matSelect.close();
    }
  }
  onCantidadPresentacionEnter() {
    this.vencimientoInput.nativeElement.select();
  }
  onCantidadUnidadEnter() { }

  onPrecioUnidadEnter() {
    if (this.precioUnidadControl.value != null) {
      this.precioPresentacionControl.setValue(
        this.precioUnidadControl.value *
        this.presentacionControl.value?.cantidad
      );
    }
    this.precioPresentacionInput.nativeElement.select();
  }

  onPrecioPresentacionEnter() {
    if (this.precioPresentacionControl.value != null) {
      const costoUnidadCalculado = this.precioPresentacionControl.value / this.presentacionControl.value?.cantidad;

      const costoUnidadOriginal = this.precioUnidadControl.value;
      this.precioUnidadControl.setValue(costoUnidadCalculado);

      this.onValidarCostoConDialogo().then((puedeGuardar) => {
        if (!puedeGuardar) {
          this.precioUnidadControl.setValue(costoUnidadOriginal);
          this.precioPresentacionInput.nativeElement.select();
          return;
        }

        this.onEjecutarGuardadoItem();
      });
      return;
    }

    this.onEjecutarGuardadoItem();
  }

  onVencimientoEnter(date?: string) {
    if (date != null) {
      let validDate = validarFecha(date);
      if (!validDate) {
        this.vencimientoInput.nativeElement.select();
        this.notificacionService.openWarn(
          "Fecha invalida, favor voler a verificar"
        );
        return;
      }
    }

    if (
      this.selectedTransferencia.sucursalOrigen?.nombre?.includes("COMPRAS")
    ) {
      this.precioUnidadInput.nativeElement.select();
    } else {
      this.onValidarCostoConDialogo().then((puedeGuardar) => {
        if (puedeGuardar) {
          this.onEjecutarGuardadoItem();
        }
      });
    }
  }

  onDateInput(event: any): void {
    let input = event.target.value.replace(/\D/g, ""); // Remove any non-digit characters

    if (input.length > 2 && input.length <= 4) {
      // Add slash after day
      input = `${input.slice(0, 2)}/${input.slice(2)}`;
    } else if (input.length > 4) {
      // Add slashes after day and month
      input = `${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 6)}`;
    }

    this.vencimientoControl.setValue(input, { emitEvent: false }); // Update the form control without emitting an event
  }

  onCodigoFocus() {
    this.codigoInput.nativeElement.select();
  }

  onClear() {
    this.lotesPendientes = null;
    this.presentacionDeLotesPendientes = null;
    this.selectedProducto = null;
    this.presentacionControl.setValue(null);
    this.isPesable = false;
    this.cantidadPresentacionControl.setValue(1);
    this.cantidadUnidadControl.setValue(1);
    this.vencimientoControl.setValue(null);
    this.codigoControl.setValue(null);
    this.codigoInput.nativeElement.select();
    this.precioUnidadControl.setValue(null);
    this.precioPresentacionControl.setValue(null);
    this.selectedTransferenciaItem = null;
  }

  nuevaTransferencia() {
    this.tabService.removeCurrentTab();
    this.tabService.addTab(
      new Tab(EditTransferenciaComponent, "Nueva transferencia", null, null)
    );
  }

  onMonedaAutocompleteClose() {
    setTimeout(() => {
      this.monedaInput.nativeElement.select();
    }, 100);
  }

  onImprimir() {
    this.transferenciaService.onImprimirTransferencia(
      this.selectedTransferencia.id
    );
  }

  onDatepickerClosed() {
    this.vencimientoInput.nativeElement.select();
  }

  onSave() {
    if (this.selectedTransferencia.sucursalOrigen.nombre.includes("COMPRA")) {
      this.onPrecioPresentacionEnter();
    } else {
      this.onVencimientoEnter();
    }
  }

  onCantidadItensFocusOut() {
    this.onRefresh();
  }

  onCantidadPresentacionFocusOut() {
    if (this.cantidadPresentacionControl.value > 1000) {
      this.dialogoService
        .confirm(
          "Atención!!",
          "La cantidad ingresada es: " +
          stringToInteger(this.cantidadPresentacionControl.value?.toString()),
          "Desea continuar?"
        )
        .subscribe((res) => {
          if (!res) {
            this.cantPresentacionInput.nativeElement.select();
          } else {
            this.vencimientoInput.nativeElement.focus();
          }
        });
    }
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.getTransferenciaItemList();
  }

  abrirFiltroProductos() {
    this.filtroProductosOpen = !this.filtroProductosOpen;
    if (!this.filtroProductosOpen) {
      this.getTransferenciaItemList();
    } else {
      setTimeout(() => {
        this.focusFilterProductoInput();
      }, 100);
    }
  }

  focusFilterProductoInput() {
    this.filtroProductoInput.nativeElement.focus();
  }

  onFilterProducto() {
    let texto: string = this.filtroProductoControl.value;
    if (texto != null && texto.trim().length > 0) {
      this.cargarPaginaItems(
        this.transferenciaService.onGetTransferenciaItensPorTransferenciaIdWithFilter(
          this.selectedTransferencia.id,
          texto,
          this.pageIndex,
          this.pageSize
        )
      );
    }
  }

  onValidarCostoConDialogo(): Promise<boolean> {
    return new Promise((resolve) => {
      const costoIngresado = this.precioUnidadControl.value;
      const producto = this.selectedProducto;

      if (!costoIngresado || !producto?.costo) {
        resolve(true);
        return;
      }

      const { costoMedio, ultimoPrecioCompra } = producto.costo;

      const variacionVsMedio = this.onCalcularVariacionPorcentual(costoIngresado, costoMedio);
      const variacionVsUltimo = this.onCalcularVariacionPorcentual(costoIngresado, ultimoPrecioCompra);
      const variacionMaxima = Math.max(variacionVsMedio, variacionVsUltimo);

      if (variacionMaxima > 75) {
        const referencias = this.onConstruirMensajeReferencias(costoMedio, ultimoPrecioCompra, variacionVsMedio, variacionVsUltimo);

        this.dialogoService.confirm(
          "Atención!!",
          `Costo ingresado: ${costoIngresado.toLocaleString()} Gs.`,
          "¿Está seguro de que desea guardar este costo?",
          [referencias],
          true,
          "Guardar de todas formas",
          "Revisar costo"
        ).subscribe(resolve);
        return;
      }

      resolve(true);
    });
  }

  private onCalcularVariacionPorcentual(costoActual: number, costoReferencia: number): number {
    if (!costoReferencia || costoReferencia === 0) return 0;
    return ((costoActual - costoReferencia) / costoReferencia) * 100;
  }

  private onConstruirMensajeReferencias(costoMedio: number, ultimoPrecioCompra: number, varMedio: number, varUltimo: number): string {
    const referencias = [];

    if (costoMedio) {
      referencias.push(`Promedio: ${costoMedio.toLocaleString()} (+${varMedio.toFixed(0)}%)`);
    }

    if (ultimoPrecioCompra && ultimoPrecioCompra !== costoMedio) {
      referencias.push(`Última compra: ${ultimoPrecioCompra.toLocaleString()} Gs. (+${varUltimo.toFixed(0)}%)`);
    }

    return referencias.join(' | ');
  }

  onEjecutarGuardadoItem() {
    if (this.selectedProducto == null) return;

    const sucursalOrigenId = this.selectedTransferencia?.sucursalOrigen?.id;
    const productoId = this.selectedProducto?.id;

    if (productoId != null && sucursalOrigenId != null) {
      this.cargandoService.openDialog(false, "Verificando stock...");
      this.productoService.onGetStockPorProductoAndSucursal(productoId, sucursalOrigenId, true)
        .subscribe({
          next: (stock) => {
            if (stock != null && stock < 0) {
              this.configuracionTransferenciaService.onGetConfiguracion().subscribe({
                next: (config) => {
                  this.cargandoService.closeDialog();
                  if (!config?.permitirStockNegativo) {
                    this.notificacionService.openWarn(
                      `El producto tiene stock negativo (${stock}) y no puede ser transferido.`
                    );
                    this.onClear();
                    return;
                  }
                  this.procederConGuardadoItem();
                },
                error: () => {
                  this.cargandoService.closeDialog();
                  this.notificacionService.openWarn(
                    `El producto tiene stock negativo (${stock}) y no puede ser transferido.`
                  );
                  this.onClear();
                }
              });
            } else {
              this.cargandoService.closeDialog();
              this.procederConGuardadoItem();
            }
          },
          error: (err) => {
            this.cargandoService.closeDialog();
            this.notificacionService.openAlgoSalioMal("Error al verificar el stock del producto");
          }
        });
    } else {
      this.procederConGuardadoItem();
    }
  }

  procederConGuardadoItem() {
    if (this.selectedTransferencia?.id != null) {
      this.cantidadPresentacionControl.enable();
      this.presentacionControl.enable();
      if (
        this.selectedProducto != null &&
        this.presentacionControl.valid &&
        this.cantidadPresentacionControl.valid
      ) {
        let item = new TransferenciaItem();
        Object.assign(item, this.selectedTransferenciaItem);
        item.activo = true;
        item.cantidadPreTransferencia = this.cantidadPresentacionControl.value;
        item.vencimientoPreTransferencia = parseShortDate(
          this.vencimientoControl.value
        );
        item.transferencia = this.selectedTransferencia;
        item.presentacionPreTransferencia = this.presentacionControl.value;
        item.poseeVencimiento = this.vencimientoControl.value != null;
        this.onSaveTransferenciaItem(item, this.precioUnidadControl.value);
        this.onClear();
      }
    } else {
      this.onSaveTransferencia().then((res) => {
        this.cantidadPresentacionControl.enable();
        this.presentacionControl.enable();
        if (
          this.selectedProducto != null &&
          this.presentacionControl.valid &&
          this.cantidadPresentacionControl.valid &&
          (this.vencimientoControl.value == null ||
            this.vencimientoControl.value >= new Date())
        ) {
          let item = new TransferenciaItem();
          item.activo = true;
          item.cantidadPreTransferencia =
            this.cantidadPresentacionControl.value;
          item.vencimientoPreTransferencia = parseShortDate(
            this.vencimientoControl.value
          );
          item.transferencia = this.selectedTransferencia;
          item.presentacionPreTransferencia = this.presentacionControl.value;
          item.poseeVencimiento = this.vencimientoControl.value != null;
          console.log(item);

          this.onSaveTransferenciaItem(item, this.precioUnidadControl.value);
          this.onClear();
        }
      });
    }
  }
}
