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
  EtapaTransferencia,
  TipoTransferencia,
  Transferencia,
  TransferenciaEstado,
  TransferenciaItem,
} from "../transferencia.model";
import { Tab } from "../../../../layouts/tab/tab.model";
import { SelectionModel } from "@angular/cdk/collections";
import { ModificarItemDialogComponent } from "../modificar-item-dialog/modificar-item-dialog.component";
import { FormControl, Validators } from "@angular/forms";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { MatSelect } from "@angular/material/select";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Subscription } from "rxjs";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { TabService } from "../../../../layouts/tab/tab.service";
import { PresentacionService } from "../../../productos/presentacion/presentacion.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";
import { DialogoNuevasFuncionesComponent } from "../../../../shared/components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component";
import { ListTransferenciaComponent } from "../list-transferencia/list-transferencia.component";

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

  @ViewChild("filtroProductoInput", { static: false }) filtroProductoInput: ElementRef;
  
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
    "menu",
  ];

  selectedSucursalOrigen: Sucursal;

  selectedSucursalDestino: Sucursal;

  selectedTransferencia = new Transferencia();

  selectedTransferenciaItem: TransferenciaItem;

  selectedProducto = new Producto();

  dataSource = new MatTableDataSource<TransferenciaItem>([]);

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
    private dialogoService: DialogosService
  ) {}

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
      this.codigoInput.nativeElement.focus();
    }, 1000);

    setTimeout(() => {
      this.monedaList = this.monedaService.monedaList;
      this.monedaList?.length > 0
        ? this.onMonedaSelect(this.monedaList[0])
        : null;
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

    setTimeout(() => {
      this.matDialog.open(DialogoNuevasFuncionesComponent, {
        data: {
          id: 123,
          componente: EditTransferenciaComponent,
          titulo: "Nuevas funciones en esta pantalla de transferencias",
          mensaje: `
          1 - A partir de ahora tenemos paginación en la tabla, ya no será utilizado el botón cargar más. Podes seleccionar la cantidad de itens para mostrar en la lista y navegar con los controles que estan en la barra inferior de la lista.\n
          2 - Al pasar productos pesables, el sistema no avisará sobre productos duplicados. Verificar atentamente para no pasar dos veces el mismo producto.
          `,
        },
        width: "60%",
      });
    }, 1000);
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
    this.transferenciaService
      .onGetTransferenciaItensPorTransferenciaId(
        this.selectedTransferencia.id,
        this.pageIndex,
        this.pageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
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
      transferencia: this.selectedTransferencia
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
              }
            });
        }
        setTimeout(() => {
          this.cantPresentacionInput.nativeElement.select();
        }, 100);
      });
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
    this.cargandoService.openDialog();
    this.transferenciaService
      .onSaveTransferenciaItem(auxItem.toInput(), precioCosto)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.cargandoService.closeDialog();
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
            ? new Date(item.vencimientoPreTransferencia)
            : null
        );
        this.matSelect.focus();
        this.matSelect.open();
      });
  }

  onFinalizar() {
    this.transferenciaService
      .onFinalizar(this.selectedTransferencia)
      .pipe()
      .subscribe((res) => {
        if (res) {
          this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          this.selectedTransferencia.etapa =
            EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN;
          this.verificarEtapa();
        }
      });
  }

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

  onEditClick(row) {}

  onConfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem();
    item = Object.assign(newItem, item);
    if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.PREPARACION_MERCADERIA
    ) {
      item.cantidadPreparacion = item.cantidadPreTransferencia;
      item.presentacionPreparacion = item.presentacionPreTransferencia;
      item.vencimientoPreparacion = item?.vencimientoPreTransferencia;
    } else if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.TRANSPORTE_VERIFICACION
    ) {
      item.cantidadTransporte = item.cantidadPreparacion;
      item.presentacionTransporte = item.presentacionPreparacion;
      item.vencimientoTransporte = item?.vencimientoPreparacion;
    } else if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.RECEPCION_EN_VERIFICACION
    ) {
      item.cantidadRecepcion = item.cantidadTransporte;
      item.presentacionRecepcion = item.presentacionTransporte;
      item.vencimientoRecepcion = item?.vencimientoTransporte;
    }
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
        this.onVerificarConfirmados();
      });
  }

  onDesconfirm(item: TransferenciaItem) {
    let newItem = new TransferenciaItem();
    item = Object.assign(newItem, item);
    if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.PREPARACION_MERCADERIA
    ) {
      item.cantidadPreparacion = null;
      item.presentacionPreparacion = null;
      item.vencimientoPreparacion = null;
    } else if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.TRANSPORTE_VERIFICACION
    ) {
      item.cantidadTransporte = null;
      item.presentacionTransporte = null;
      item.vencimientoTransporte = null;
    } else if (
      this.selectedTransferencia?.etapa ==
      EtapaTransferencia.RECEPCION_EN_VERIFICACION
    ) {
      item.cantidadRecepcion = null;
      item.presentacionRecepcion = null;
      item.vencimientoRecepcion = null;
    }
    this.transferenciaService
      .onSaveTransferenciaItem(item.toInput())
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSourceWithId(
            this.dataSource.data,
            res,
            res.id
          );
        }
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
              this.onVerificarConfirmados();
            });
        }
      });
  }

  onAvanzarEtapa(etapa) {
    this.transferenciaService
      .onAvanzarEtapa(this.selectedTransferencia, etapa)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.selectedTransferencia.etapa = etapa;
          this.verificarEtapa();
          if (etapa == EtapaTransferencia.PRE_TRANSFERENCIA_ORIGEN) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_ORIGEN;
          } else if (etapa == EtapaTransferencia.TRANSPORTE_EN_CAMINO) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_TRANSITO;
          } else if (etapa == EtapaTransferencia.RECEPCION_EN_VERIFICACION) {
            this.selectedTransferencia.estado = TransferenciaEstado.EN_DESTINO;
          }
        }
      });
  }

  onSelectEstado(etapa: EtapaTransferencia) {}

  onSelectEtapa(e) {}

  onSolicitarModificarItem(item) {}
  onSolicitarRechazarItem(item) {}

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
    this.cantPresentacionInput.nativeElement.select();
    this.matSelect.close();
  }
  onCantidadPresentacionEnter() {
    this.vencimientoInput.nativeElement.select();
  }
  onCantidadUnidadEnter() {}

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
      this.precioUnidadControl.setValue(
        this.precioPresentacionControl.value /
          this.presentacionControl.value?.cantidad
      );
    }
    if (this.selectedTransferencia?.id != null) {
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
        Object.assign(item, this.selectedTransferenciaItem);
        item.activo = true;
        item.cantidadPreTransferencia = this.cantidadPresentacionControl.value;
        item.vencimientoPreTransferencia = this.vencimientoControl.value;
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
          item.vencimientoPreTransferencia = this.vencimientoControl.value;
          item.transferencia = this.selectedTransferencia;
          item.presentacionPreTransferencia = this.presentacionControl.value;
          item.poseeVencimiento = this.vencimientoControl.value != null;
          this.onSaveTransferenciaItem(item, this.precioUnidadControl.value);
          this.onClear();
        }
      });
    }
  }

  onVencimientoEnter(date?: string) {
    if (date != null && this.vencimientoControl.value == null)
      this.vencimientoControl.setValue(new Date(date));

    if (
      this.selectedTransferencia.sucursalOrigen?.nombre?.includes("COMPRAS")
    ) {
      this.precioUnidadInput.nativeElement.select();
    } else {
      if (this.selectedTransferencia?.id != null) {
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
          Object.assign(item, this.selectedTransferenciaItem);
          item.activo = true;
          item.cantidadPreTransferencia =
            this.cantidadPresentacionControl.value;
          item.vencimientoPreTransferencia =
            this.vencimientoControl.value != null
              ? new Date(this.vencimientoControl.value)
              : null;
          item.transferencia = this.selectedTransferencia;
          item.presentacionPreTransferencia = this.presentacionControl.value;
          item.poseeVencimiento = this.vencimientoControl.value != null;
          this.onSaveTransferenciaItem(item);
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
            item.vencimientoPreTransferencia = this.vencimientoControl.value;
            item.transferencia = this.selectedTransferencia;
            item.presentacionPreTransferencia = this.presentacionControl.value;
            item.poseeVencimiento = this.vencimientoControl.value != null;
            this.onSaveTransferenciaItem(item);
            this.onClear();
          }
        });
      }
    }
  }

  onCodigoFocus() {
    this.codigoInput.nativeElement.select();
  }

  onClear() {
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
    if(!this.filtroProductosOpen){
      this.getTransferenciaItemList();
    } else {
      setTimeout(() => {
        this.focusFilterProductoInput()
      }, 100);
    }
  }

  focusFilterProductoInput(){
    this.filtroProductoInput.nativeElement.focus();
  }

  onFilterProducto() {
    let texto: string = this.filtroProductoControl.value;
    if (texto != null && texto.trim().length > 0) {
      this.transferenciaService.onGetTransferenciaItensPorTransferenciaIdWithFilter(
        null,
        texto,
        this.pageIndex,
        this.pageSize
      ).pipe(untilDestroyed(this)).subscribe((res: PageInfo<TransferenciaItem>) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
    }
  }

}
