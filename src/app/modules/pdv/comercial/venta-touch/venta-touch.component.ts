import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { interval, Subscription } from "rxjs";
import { isInt } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { MonedasGetAllGQL } from "../../../../modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { Delivery } from "../../../../modules/operaciones/delivery/delivery.model";
import { DeliveryEstado } from "../../../../modules/operaciones/delivery/enums";
import { DeliveryInput } from "../../../../modules/operaciones/delivery/graphql/delivery-input.model";
import { SaveDeliveryGQL } from "../../../../modules/operaciones/delivery/graphql/saveDelivery";
import { SaveVueltoGQL } from "../../../../modules/operaciones/vuelto/graphql/saveVuelto";
import { VueltoInput } from "../../../../modules/operaciones/vuelto/vuelto-input.model";
import { SaveVueltoItemGQL } from "../../../../modules/operaciones/vuelto/vuelto-item/graphql/saveVueltoItem";
import { VueltoItemInput } from "../../../../modules/operaciones/vuelto/vuelto-item/vuelto-item-input.model";
import { Codigo } from "../../../../modules/productos/codigo/codigo.model";
import { ProductoPorCodigoGQL } from "../../../../modules/productos/producto/graphql/productoPorCodigo";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../../modules/productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../../modules/productos/producto/producto.model";
import { AllTiposPreciosGQL } from "../../../../modules/productos/tipo-precio/graphql/allTiposPrecios";
import { TipoPrecio } from "../../../../modules/productos/tipo-precio/tipo-precio.model";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { BeepService } from "../../../../shared/beep/beep.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import { AdicionarConteoResponse } from "../../../financiero/conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { AdicionarCajaResponse } from "../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CobroDetalle } from "../../../operaciones/venta/cobro/cobro-detalle.model";
import { Cobro } from "../../../operaciones/venta/cobro/cobro.model";
import { TipoVenta } from "../../../operaciones/venta/enums/tipo-venta.enums";
import { VentaEstado } from "../../../operaciones/venta/enums/venta-estado.enums";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { DeliveryDialogComponent } from "./delivery-dialog/delivery-dialog.component";
import { EditItemDialogComponent } from "./edit-item-dialog/edit-item-dialog.component";
import {
  PagoResponseData,
  PagoTouchComponent,
} from "./pago-touch/pago-touch.component";
import { AddCategoriaDialogComponent } from "./pdv-categoria/add-categoria-dialog/add-categoria-dialog.component";
import { PdvCategoria } from "./pdv-categoria/pdv-categoria.model";
import { PdvCategoriaService } from "./pdv-categoria/pdv-categoria.service";
import { PdvGruposProductos } from "./pdv-grupos-productos/pdv-grupos-productos.model";
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaResponseData,
} from "./producto-categoria-dialog/producto-categoria-dialog.component";
import { SeleccionarCajaDialogComponent } from "./seleccionar-caja-dialog/seleccionar-caja-dialog.component";
import {
  SelectProductosDialogComponent,
  SelectProductosResponseData,
} from "./select-productos-dialog/select-productos-dialog.component";
import { UtilitariosDialogComponent } from "./utilitarios-dialog/utilitarios-dialog.component";
import { VentaTouchService } from "./venta-touch.service";
import { NgxPrintElementService } from "ngx-print-element";
import { AdicionarPdvProductoDialogComponent } from "./adicionar-pdv-producto-dialog/adicionar-pdv-producto-dialog.component";
import { PdvGrupo } from "./pdv-grupo/pdv-grupo.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { SeleccionarEnvaseDialogComponent } from "./seleccionar-envase-dialog/seleccionar-envase-dialog.component";

export interface Item {
  producto: Producto;
  cantidad;
  precio;
  index?;
  numero?;
  tipoPrecio?: TipoPrecio;
  caja?: Boolean;
  unidadPorCaja?: number;
}

export enum TipoMedida {
  unidad = "Unid.",
  caja = "Caja",
}

export interface PdvTouchData {
  auxiliar: boolean;
  titulo: String;
}


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-venta-touch",
  templateUrl: "./venta-touch2.component.html",
  styleUrls: ["./venta-touch.component.css"],
})
export class VentaTouchComponent implements OnInit, OnDestroy {
  @Input() data: Tab;

  @ViewChild("codigoInput", { static: false })
  codigoInput: ElementRef;

  selectedCaja: PdvCaja;

  isCargandoPDV = true;
  displayedColumns = ["numero", "descripcion", "cantidad", "precio", "total"];
  dataSource = new MatTableDataSource<VentaItem>();
  winHeigth;
  winWidth;
  totalGs = 0;
  descuentoGs = 0;
  cambioRs = 0;
  cambioDs = 0;
  cambioArg = 0;
  formGroup: FormGroup;
  selectedPdvCategoria: PdvCategoria;
  pdvCategorias: PdvCategoria[] = [];
  ultimoAdicionado: VentaItem[] = [];
  tiposPrecios: TipoPrecio[] = [];
  selectedTipoPrecio: TipoPrecio;
  itemList: VentaItem[] = [];
  isDialogOpen;
  isAudio = true;
  isAuxiliar = false;
  monedas: Moneda[] = [];
  mostrarTipoPrecios = false;
  ventaSub: Subscription;
  selectCajaDialog: MatDialogRef<SeleccionarCajaDialogComponent>;
  dialogReference;
  formaPagoList: FormaPago[];
  disableCobroRapido = false;

  constructor(
    private dialog: MatDialog,
    public windowInfo: WindowInfoService,
    public mainService: MainService,
    public getProductoByCodigo: ProductoPorCodigoGQL,
    private notificacionSnackbar: NotificacionSnackbarService,
    private pdvCategoriaService: PdvCategoriaService,
    private getTiposPrecios: AllTiposPreciosGQL,
    private beepService: BeepService,
    private tabService: TabService,
    private getMonedas: MonedasGetAllGQL,
    private saveDelivery: SaveDeliveryGQL,
    private saveVuelto: SaveVueltoGQL,
    private saveVueltoItem: SaveVueltoItemGQL,
    private productoService: ProductoService,
    private confirmDialogService: DialogosService,
    private ventaTouchServive: VentaTouchService,
    private matDialog: MatDialog,
    private cajaService: CajaService,
    private formaPagoService: FormaPagoService,
    private cargandoService: CargandoDialogService,
    public printService: NgxPrintElementService
  ) {
    this.winHeigth = windowInfo.innerHeight + "px";
    this.winWidth = windowInfo.innerWidth + "px";
    this.isDialogOpen = false;
    // setTimeout(() => {
    //   this.codigoInput.nativeElement.focus();
    // }, 0);
  }

  ngOnInit(): void {
    this.formaPagoList = [];
    this.dataSource.data = this.itemList;
    this.createForm();
    this.buscarPdvCategoria();
    this.setPrecios();
    this.getFormaPagos();

    setTimeout(() => {
      this.isAuxiliar = this.data?.tabData?.data?.auxiliar;
    }, 0);

    // this.tabService.tabChangedEvent.pipe(untilDestroyed(this)).subscribe((res) => {
    //   if (this.data.active == true) {
    //     this.setFocusToCodigoInput();
    //   }
    // });

    this.cajaService
      .onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual.id).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res == null) {
          this.openSelectCajaDialog();
        } else {
          this.selectedCaja = res;
        }
      });
    console.log(this.ventaSub)

  }

  getFormaPagos() {
    this.formaPagoService.onGetAllFormaPago().subscribe((res) => {
      if (res != null) {
        this.formaPagoList = res;
      }
    });
  }

  openSelectCajaDialog() {
    this.isDialogOpen = true;
    this.selectCajaDialog = this.matDialog.open(
      SeleccionarCajaDialogComponent,
      {
        autoFocus: false,
        restoreFocus: true,
        disableClose: true,
      }
    );
    this.dialogReference = this.selectCajaDialog;
    this.selectCajaDialog.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      this.selectCajaDialog = null
      this.isDialogOpen = false;
      let response: AdicionarCajaResponse = res;
      if (res == "salir") {
        this.tabService.removeTab(this.tabService.currentIndex);
      } else if (response?.caja != null) {
        this.selectedCaja = response?.caja;
        if (response?.conteoApertura != null) {
        }
        if (response?.conteoCierre != null) {
          this.selectedCaja = null;
          this.openSelectCajaDialog();
        }
        this.isDialogOpen = false;
      } else {
        this.openSelectCajaDialog();
      }
    });
  }

  closeSelectCajaDialog() {
    if (this.selectCajaDialog != null) {
      this.selectCajaDialog.close();
    }
  }

  setPrecios() {
    this.getMonedas.fetch(null, { errorPolicy: "all" }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.errors == null) {
        this.monedas = res.data.data;
        this.cambioRs = this.monedas.find(
          (m) => m.denominacion == "REAL"
        )?.cambio;
        this.cambioDs = this.monedas.find(
          (m) => m.denominacion == "DOLAR"
        )?.cambio;
        this.cambioArg = this.monedas.find(
          (m) => m.denominacion == "PESO ARG"
        )?.cambio;
        return true;
      }
    });
  }

  createForm(): boolean {
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null),
      codigo: new FormControl(null),
    });
    this.formGroup.get("cantidad").setValue(1);
    return true;
  }

  buscarPdvCategoria() {
    this.cargandoService.openDialog(false, "Cargando favoritos");
    this.pdvCategoriaService.onGetCategorias().pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.openDialog(false, "Cargando Otros");
      setTimeout(() => {
        this.cargandoService.closeDialog();
        this.cargandoService.closeDialog();
      }, 2000);
      if (res.errors == null) {
        this.pdvCategorias = res.data.data;
        this.pdvCategorias.forEach((cat) => {
          cat.grupos.forEach((gr) => {
            if (gr.activo == true) {
              this.pdvCategoriaService
                .onGetGrupoProductosPorGrupoId(gr.id).pipe(untilDestroyed(this))
                .subscribe((res) => {
                  if (res != null) {
                    console.log("cargando: " + gr.descripcion);
                    gr.pdvGruposProductos = res;
                  }
                });
            }
          });
          console.log("carga completa");
        });
        this.selectedPdvCategoria = this.pdvCategorias[0];
        this.isCargandoPDV = false;
      } else {
        this.notificacionSnackbar.notification$.next({
          texto: "No fue posible cargar categorias",
          color: NotificacionColor.warn,
          duracion: 3,
        });
      }
    });
  }

  buscarTiposPrecios() {
    this.getTiposPrecios.fetch().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.errors) {
        this.tiposPrecios = res.data.data;
        this.selectedTipoPrecio = this.tiposPrecios[0];
      } else {
        this.notificacionSnackbar.notification$.next({
          texto: "No fue posible cargar tipos de precios",
          color: NotificacionColor.warn,
          duracion: 3,
        });
      }
    });
  }

  onGridCardClick(pdvGruposProductos: PdvGruposProductos[], descripcion) {
    let productos: Producto[] = [];
    pdvGruposProductos.forEach((e) => {
      productos.push(e.producto);
    });
    this.dialogReference = this.dialog
      .open(SelectProductosDialogComponent, {
        data: {
          productos,
          descripcion,
        },
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let respuesta: SelectProductosResponseData = res;
        if (res != null) {
          let item: VentaItem = new VentaItem();
          item.presentacion = respuesta.data.presentacion;
          item.precioVenta = respuesta.data.precio;
          item.producto = respuesta.producto;
          item.cantidad = respuesta.data.cantidad;
          this.addItem(item);
        }
        this.dialogReference = undefined;
      });
  }

  calcularTotales() {
    this.totalGs = 0;
    this.itemList.forEach((item) => {
      this.totalGs += Math.round(+item.cantidad * +item.precioVenta.precio);
    });
  }

  onCodigoKeyUpEvent(key) {
    let texto: String = this.formGroup.get("codigo").value;
    switch (key) {
      case " ":
      case "*":
      case "+":
      case "-":
      case "Tab":
        if (texto != null && texto != " " && +texto > 0) {
          this.formGroup
            .get("cantidad")
            .setValue(+this.formGroup.get("codigo").value);
          this.formGroup.get("codigo").setValue(null);
        }
        break;
      case "Enter":
        break;

      default:
        break;
    }
  }

  addItem(item: VentaItem, index?) {
    let cantidad = item.cantidad;
    if (item.producto.balanza != true) {
      if (!isInt(cantidad)) {
        cantidad = 1;
      }
    }
    let item2 = new VentaItem();
    if (item.presentacion == null) {
      item.presentacion = item.producto.presentaciones.find(
        (p) => p.principal == true
      );
    }
    if (item.precioVenta == null) {
      item.precioVenta = item.presentacion.precios.find(
        (p) => p.principal == true
      );
    }
    let presentacionCaja: Presentacion;
    item.producto.presentaciones.forEach((p) => {
      console.log(p.cantidad, cantidad, item?.presentacion?.cantidad);
      if (
        p.cantidad <= cantidad * item.presentacion.cantidad &&
        p.cantidad > 1 &&
        p.id != item?.presentacion?.id &&
        p.cantidad > item?.presentacion.cantidad
      ) {
        presentacionCaja = p;
      }
    });
    if (presentacionCaja != null) {
      Object.assign(item2, item);
      item2.presentacion = presentacionCaja;
      item2.precioVenta = item2.presentacion.precios.find(
        (precio) => precio?.principal == true
      );
      if (item2.precioVenta != null) {
        let factor = Math.floor(
          (cantidad * item.presentacion.cantidad) / item2.presentacion.cantidad
        );
        let cantAux = item2.presentacion.cantidad * factor;
        item2.cantidad = factor;
        cantidad -= cantAux / item.presentacion.cantidad;
        item.cantidad = cantidad;
        this.addItem(item2);
      }
    }

    if (this.itemList.length > 0 && index == null) {
      console.log("entro aca");
      index = this.itemList.findIndex(
        (i) =>
          i.presentacion.id == item.presentacion.id &&
          i.precioVenta.precio == item.precioVenta.precio
      );
    }
    if (index != -1 && index != null) {
      this.itemList[index].cantidad += cantidad;
      console.log("entro alla");
    } else {
      if (item.cantidad > 0) {
        if (item.producto?.envase != null) {
          this.dialogReference = this.dialog
            .open(SeleccionarEnvaseDialogComponent, {
              data: {
                envase: item.producto.envase,
                cantidad: item.cantidad * item.presentacion.cantidad,
              },
              disableClose: true,
            })
            .afterClosed().pipe(untilDestroyed(this))
            .subscribe((res) => {
              console.log(this.dialogReference);
              this.dialogReference = undefined;
              if (res != null) {
                this.addItem(res);
              }
            });
        }
        this.itemList.push(item);
      }
    }
    this.calcularTotales();
    item.cantidad = cantidad;
    if (item.cantidad > 0) this.ultimoAdicionado.push(item);
    // this.ultimoAdicionado[this.ultimoAdicionado.length - 1].index =
    //   itemIndex > -1 ? itemIndex : this.itemList.length - 1;
    this.formGroup.get("codigo").setValue("");
    this.formGroup.get("cantidad").setValue(1);
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  removeItem(item: VentaItem, index?) {
    if (item == null && index == null) {
      this.dialogReference = this.confirmDialogService
        .confirm("Atención!!", "Realmente desea eliminar la lista de itens?").pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            this.itemList = [];
            this.calcularTotales();
          }
          this.dialogReference = undefined;
        });
    } else {
      this.itemList.splice(index, 1);
      this.calcularTotales();
    }
  }

  editItem(item: VentaItem, index) {
    let dialogReference = this.dialog.open(EditItemDialogComponent, {
      data: {
        item,
      },
    });
    dialogReference.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        switch (res) {
          case -1:
          case 0:
            this.removeItem(item, index);
            break;
          default:
            this.removeItem(item, index);
            item.cantidad = res;
            this.addItem(item);
            break;
        }
      }
      this.dialogReference = undefined;
    });
  }

  buscarProductoDialog() {
    let data: PdvSearchProductoData = {
      cantidad: this.formGroup.get("cantidad").value,
      texto: this.formGroup.get("codigo").value,
      selectedTipoPrecio: this.selectedTipoPrecio,
      tiposPrecios: this.tiposPrecios,
      mostrarStock: true,
      mostrarOpciones: true,
    };
    this.dialogReference = this.dialog.open(PdvSearchProductoDialogComponent, {
      height: "98%",
      data,
      autoFocus: false,
      restoreFocus: true,
    });
    this.formGroup.get("codigo").setValue("");
    this.dialogReference.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.formGroup.get("cantidad").setValue(response.cantidad);
        let item = new VentaItem();
        item.cantidad = this.formGroup.controls.cantidad.value;
        item.producto = response.producto;
        item.presentacion = response.presentacion;
        item.precioVenta = response.precio;
        this.addItem(item);
      }
      this.dialogReference = undefined;
    });
  }

  @HostListener("document:keyup", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    if (this.data.active == true && this.dialogReference == undefined) {
      switch (event.key) {
        case "Escape":
          break;
        case "Enter":
          let codigo = this.formGroup.get("codigo").value;
          if (codigo != null && codigo != "") {
            this.buscarPorCodigo(codigo);
          } else if (this.dialogReference == undefined) {
            console.log(this.dialogReference)
            // this.onPagoClick();
          }
          break;
        case "F9":
          this.buscarProductoDialog();
          break;
        default:
          break;
      }
    }
  }

  buscarPorCodigo(texto: string) {
    let producto: Producto;
    if (texto == null || texto == " " || texto == "") return null;
    this.getProductoByCodigo
      .fetch(
        {
          texto,
        },
        { fetchPolicy: "no-cache", errorPolicy: "all" }
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          producto = res.data.data;
          if (producto != null) {
            this.isAudio ? this.beepService.beep() : null;
            this.crearItem(producto, texto);
            this.formGroup.get("codigo").setValue(null);
          } else {
            this.isAudio ? this.beepService.boop() : null;
            this.buscarProductoDialog();
            this.notificacionSnackbar.notification$.next({
              texto: "Producto no encontrado",
              color: NotificacionColor.warn,
              duracion: 2,
            });
          }
        }
      });
  }

  crearItem(producto: Producto, texto?, index?) {
    let item: VentaItem = new VentaItem();
    let selectedCodigo: Codigo;
    let selectedPresentacion: Presentacion;
    item.cantidad = this.formGroup.controls.cantidad.value;
    item.producto = producto;
    if (texto != null) {
      item.presentacion = producto?.presentaciones.find((p) => {
        p.codigos.find((c) => {
          if (c.codigo == texto) {
            selectedCodigo = c;
            selectedPresentacion = p;
          }
        });
      });
      item.presentacion = selectedPresentacion;
    } else {
      item.presentacion = producto?.presentaciones.find(
        (p) => p.principal == true
      );
    }
    item.precioVenta = item?.presentacion?.precios.find(
      (p) => p.principal == true
    );
    if (item.presentacion == null || item.precioVenta == null) {
      this.notificacionSnackbar.notification$.next({
        texto: "El producto no tiene precio",
        duracion: 2,
        color: NotificacionColor.warn,
      });
    } else {
      this.addItem(item);
    }
  }

  // setFocusToCodigoInput() {
  //   console.log("dando focus a input");
  //   if (this.codigoInput != null && this.matDialog["_parentDialog"] == null) {
  //     setTimeout(() => {
  //       this.codigoInput.nativeElement.focus();
  //     }, 10);
  //   }
  // }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  pdvAuxiliarClick() {
    let auxIndex = this.tabService.tabs.findIndex(
      (t) => t.title == "Venta Auxiliar"
    );
    let pdvIndex = this.tabService.tabs.findIndex((t) => t.title == "Venta");

    if (!this.isAuxiliar) {
      if (auxIndex != -1) {
        return this.tabService.setTabActive(auxIndex);
      }
      let data: PdvTouchData = {
        auxiliar: true,
        titulo: "Venta Auxiliar",
      };
      return this.tabService.addTab(
        new Tab(
          VentaTouchComponent,
          "Venta Auxiliar",
          { data: data },
          VentaTouchComponent
        )
      );
    } else {
      return this.tabService.setTabActive(pdvIndex);
    }
  }

  onPagoClick() {
    this.isDialogOpen = true;
    if (this.itemList?.length > 0) {
      this.dialogReference = this.dialog
        .open(PagoTouchComponent, {
          autoFocus: true,
          restoreFocus: true,
          data: {
            valor: this.totalGs,
          },
          width: "80vw",
          height: "80vh",
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.cargandoService.openDialog();
            let response: PagoResponseData = res;
            let venta = new Venta();
            venta.totalGs = this.totalGs;
            venta.totalRs = this.totalGs / this.cambioRs;
            venta.totalDs = this.totalGs / this.cambioDs;
            venta.ventaItemList = this.itemList;
            venta.caja = this.selectedCaja;
            let cobro = new Cobro();
            cobro.totalGs = this.totalGs;
            cobro.cobroDetalleList = [];
            // cobroDetalle.
            if (response.pagoItemList != null) {
              response.pagoItemList.forEach((p) => {
                let cobroDetalle = new CobroDetalle();
                cobroDetalle.moneda = p.moneda;
                cobroDetalle.cambio = p.moneda.cambio;
                cobroDetalle.formaPago = p.formaPago;
                cobroDetalle.descuento = p.descuento;
                cobroDetalle.aumento = p.aumento;
                cobroDetalle.vuelto = p.vuelto;
                cobroDetalle.pago = p.pago;
                cobroDetalle.valor = p.valor;
                if (cobroDetalle.aumento)
                  cobroDetalle.valor = cobroDetalle.valor * -1;
                cobro.cobroDetalleList.push(cobroDetalle);
              });
            }
            this.onSaveVenta(venta, cobro);
            this.dialogReference = undefined;
          }
          this.isDialogOpen = false;
        });
    }
  }

  resetForm() {
    this.itemList = [];
    this.formGroup.controls.cantidad.setValue(1);
    this.formGroup.controls.codigo.setValue("");
    this.selectedTipoPrecio = this.tiposPrecios[0];
    this.totalGs = 0;
  }

  onTicketClick() {
    this.disableCobroRapido = true;
    this.cargandoService.openDialog(true);
    //guardar la compra, si la compra se guardo con exito, imprimir ticket y resetForm()
    let venta = new Venta();
    venta.formaPago = this.formaPagoService.formaPagoList.find(
      (f) => f.descripcion == "EFECTIVO"
    );
    venta.totalGs = this.totalGs;
    venta.totalRs = this.totalGs / this.cambioRs;
    venta.totalDs = this.totalGs / this.cambioDs;
    venta.ventaItemList = this.itemList;
    venta.caja = this.selectedCaja;
    let cobro = new Cobro();
    cobro.totalGs = this.totalGs;
    let cobroDetalle = new CobroDetalle();
    cobroDetalle.moneda = this.monedas.find((m) => m.denominacion == "GUARANI");
    cobroDetalle.cambio = cobroDetalle.moneda.cambio;
    cobroDetalle.formaPago = this.formaPagoList.find(
      (f) => f.descripcion == "EFECTIVO"
    );
    cobroDetalle.descuento = false;
    cobroDetalle.aumento = false;
    cobroDetalle.vuelto = false;
    cobroDetalle.pago = true;
    cobroDetalle.valor = this.totalGs;
    cobro.cobroDetalleList = [cobroDetalle];
    // cobroDetalle.
    this.onSaveVenta(venta, cobro);
    this.disableCobroRapido = false;
  }

  onSaveVenta(venta, cobro) {
    this.cargandoService.openDialog();
    this.ventaTouchServive.onSaveVenta(venta, cobro).pipe(untilDestroyed(this)).subscribe((res) => {
      this.cargandoService.closeDialog();
      if (res == true) {
        this.notificacionSnackbar.notification$.next({
          color: NotificacionColor.success,
          texto: "Venta guardada con éxito",
          duracion: 2,  
        });
        this.resetForm();
      } else {
        this.notificacionSnackbar.notification$.next({
          color: NotificacionColor.danger,
          texto: "Ups! Ocurrió un problema al guardar",
          duracion: 3,
        });
      }
    });
  }

  onDeliveryClick() {
    this.isDialogOpen = true;
    this.dialogReference = this.dialog
      .open(DeliveryDialogComponent, {
        data: {
          valor: this.totalGs,
          monedas: this.monedas,
        },
        autoFocus: false,
        restoreFocus: true,
        width: "80vw",
        height: "90vh",
        panelClass: ["deliveryBackground"],
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((resDialog) => {
        this.isDialogOpen = false;
        if (resDialog != null) {
          let vueltoId;
          let vueltoList: VueltoItemInput[] = resDialog["vueltoList"];
          if (vueltoList.length > 0) {
            let vueltoInput: VueltoInput = {
              id: null,
              activo: true,
            };
            this.saveVuelto
              .mutate({
                entity: vueltoInput,
              }).pipe(untilDestroyed(this))
              .subscribe((resVuelto) => {
                if (resVuelto != null) {
                  vueltoId = resVuelto.data["saveVuelto"]["id"];
                  vueltoList.forEach((v) => {
                    let aux: VueltoItemInput = {
                      monedaId: v.monedaId,
                      valor: v.valor,
                      vueltoId: vueltoId,
                    };
                    this.saveVueltoItem
                      .mutate({
                        entity: aux,
                      }).pipe(untilDestroyed(this))
                      .subscribe((resVueltoItem) => {
                        let deliveryInput: DeliveryInput = {
                          estado: DeliveryEstado.ABIERTO,
                          precioId: resDialog["deliveryInput"]["precioId"],
                          telefono: resDialog["deliveryInput"]["telefono"],
                          valor: resDialog["deliveryInput"]["valor"],
                          direccion: resDialog["deliveryInput"]["direccion"],
                          barrioId: resDialog["deliveryInput"]["barrioId"],
                          vueltoId: resVuelto.data["saveVuelto"]["id"],
                          entregadorId:
                            resDialog["deliveryInput"]["entregadorId"],
                          usuarioId: resDialog["deliveryInput"]["usuarioId"],
                          vehiculoId: resDialog["deliveryInput"]["vehiculoId"],
                          ventaId: resDialog["deliveryInput"]["ventaId"],
                        };
                        this.saveDelivery
                          .mutate({
                            entity: deliveryInput,
                          }).pipe(untilDestroyed(this))
                          .subscribe((resDelivery) => {
                            let savedDelivery = new Delivery();
                            savedDelivery = resDelivery.data;
                            if (savedDelivery.id != null) {
                            }
                            this.resetForm();
                          });
                      });
                  });
                }
              });
          }
        }
        this.dialogReference = undefined;
      });
  }

  addPdvCategoria() {
    this.isDialogOpen = true;
    this.dialogReference = this.dialog
      .open(AddCategoriaDialogComponent, {
        restoreFocus: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.pdvCategorias.push(res);
        }
        this.dialogReference = undefined;
      });
  }

  addPdvProducto(pdvGrupo?: PdvGrupo) {
    this.isDialogOpen = true;
    this.dialogReference = this.dialog
      .open(AdicionarPdvProductoDialogComponent, {
        restoreFocus: true,
        data: {
          pdvCategoria: this.selectedPdvCategoria,
          pdvGrupo,
        },
        width: "70%",
        height: "60%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.pdvCategorias.push(res);
        }
        this.dialogReference = undefined;
      });
  }

  ngOnDestroy(): void {
  }

  openUtilitarios() {
    this.isDialogOpen = true;
    this.dialogReference = this.dialog
      .open(UtilitariosDialogComponent, {
        data: {
          caja: this.selectedCaja,
        },
        width: "70%",
        disableClose: false,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (res.conteoCierre != null) {
            this.selectedCaja = null;
            this.openSelectCajaDialog();
          }
        }
        this.dialogReference = undefined;
      });
  }
}


