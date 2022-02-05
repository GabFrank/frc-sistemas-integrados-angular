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
import { Subscription } from "rxjs";
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

@Component({
  selector: "app-venta-touch",
  templateUrl: "./venta-touch.component.html",
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

  formaPagoList: FormaPago[];

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
    setTimeout(() => {
      this.codigoInput.nativeElement.focus();
    }, 0);

    printService.print("print");
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

    this.tabService.tabChangedEvent.subscribe((res) => {
      if (this.data.active == true) {
        this.setFocusToCodigoInput();
      }
    });

    this.ventaSub = this.cajaService
      .onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual.id)
      .subscribe((res) => {
        console.log(res);
        if (res == null) {
          this.openSelectCajaDialog();
        } else {
          this.selectedCaja = res;
        }
      });
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
    this.selectCajaDialog.afterClosed().subscribe((res) => {
      console.log(res);
      this.isDialogOpen = false;
      let response: AdicionarCajaResponse = res;
      if (res == "salir") {
        this.tabService.removeTab(this.tabService.currentIndex);
      } else if (response?.caja != null) {
        this.selectedCaja = response?.caja;
        console.log(res);
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
    this.getMonedas.fetch(null, { errorPolicy: "all" }).subscribe((res) => {
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
    console.log("hola");
    this.cargandoService.openDialog(false, "Cargando favoritos");
    this.pdvCategoriaService.onGetCategorias().subscribe((res) => {
      this.cargandoService.openDialog(false, "Cargando Otros");
      setTimeout(() => {
        this.cargandoService.closeDialog();
        this.cargandoService.closeDialog();
      }, 2000);
      if (res.errors == null) {
        this.pdvCategorias = res.data.data;
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
    this.getTiposPrecios.fetch().subscribe((res) => {
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
    this.dialog
      .open(SelectProductosDialogComponent, {
        data: {
          productos,
          descripcion,
        },
      })
      .afterClosed()
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
        cantidad = Math.round(cantidad);
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
    let presentacionCaja = item.producto.presentaciones.find((p) => {
      if (p.cantidad <= cantidad && p.cantidad > 1) {
        return p;
      }
    });
    if (presentacionCaja != null) {
      Object.assign(item2, item);
      item2.presentacion = presentacionCaja;
      item2.precioVenta = item2.presentacion.precios.find(
        (precio) => precio?.principal == true
      );
      if (item2.precioVenta != null) {
        let factor = Math.floor(cantidad / item2.presentacion.cantidad);
        let cantAux = item2.presentacion.cantidad * factor;
        item2.cantidad = factor;
        cantidad -= cantAux;
        item.cantidad = cantidad;
        this.addItem(item2);
      }
    } else {
    }

    if (this.itemList.length > 0 && index == null) {
      index = this.itemList.findIndex(
        (i) =>
          i.presentacion.id == item.presentacion.id &&
          i.precioVenta.precio == item.precioVenta.precio
      );
    }
    if (index != -1 && index != null) {
      console.log("encontro un index", index);
      this.itemList[index].cantidad += cantidad;
    } else {
      console.log("es nuevo");
      if (item.cantidad > 0) this.itemList.push(item);
    }
    this.calcularTotales();
    item.cantidad = cantidad;
    if (item.cantidad > 0) this.ultimoAdicionado.push(item);
    // this.ultimoAdicionado[this.ultimoAdicionado.length - 1].index =
    //   itemIndex > -1 ? itemIndex : this.itemList.length - 1;
    this.formGroup.get("codigo").setValue("");
    this.formGroup.get("cantidad").setValue(1);
    this.setFocusToCodigoInput();
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  removeItem(item: VentaItem, index?) {
    if (item == null && index == null) {
      this.isDialogOpen = true;
      this.confirmDialogService
        .confirm("Atención!!", "Realmente desea eliminar la lista de itens?")
        .subscribe((res) => {
          if (res) {
            this.itemList = [];
            this.setFocusToCodigoInput();
            this.calcularTotales();
          }
          this.isDialogOpen = false;
        });
    } else {
      this.itemList.splice(index, 1);
      this.setFocusToCodigoInput();
      this.calcularTotales();
    }
  }

  editItem(item: VentaItem, index) {
    this.isDialogOpen = true;
    let ref = this.dialog.open(EditItemDialogComponent, {
      data: {
        item,
      },
    });
    ref.afterClosed().subscribe((res) => {
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
      this.isDialogOpen = false;
      this.setFocusToCodigoInput();
    });
  }

  buscarProductoDialog() {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      cantidad: this.formGroup.get("cantidad").value,
      texto: this.formGroup.get("codigo").value,
      selectedTipoPrecio: this.selectedTipoPrecio,
      tiposPrecios: this.tiposPrecios,
      mostrarStock: true,
      mostrarOpciones: true,
    };
    let ref = this.dialog.open(PdvSearchProductoDialogComponent, {
      height: "98%",
      data,
      autoFocus: false,
      restoreFocus: true,
    });
    this.formGroup.get("codigo").setValue(null);
    ref.afterClosed().subscribe((res) => {
      if (res != null) {
        let response: PdvSearchProductoResponseData = res;
        this.formGroup.get("cantidad").setValue(response.cantidad);
        let item = new VentaItem();
        item.cantidad = this.formGroup.controls.cantidad.value;
        item.producto = response.producto;
        item.presentacion = response.presentacion;
        item.precioVenta = response.precio;
        this.addItem(item);
      }
      this.isDialogOpen = false;
      this.setFocusToCodigoInput();
    });
  }

  @HostListener("document:keyup", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    console.log(this.data);
    if (this.data.active == true) {
      switch (event.key) {
        case "Escape":
          break;
        case "Enter":
          let codigo = this.formGroup.get("codigo").value;
          if (codigo != null && codigo != "") {
            this.buscarPorCodigo(codigo);
          } else if (!this.isDialogOpen) {
            this.onPagoClick();
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
      .fetch({
        texto,
      })
      .subscribe((res) => {
        if (res.errors == null) {
          producto = res.data.data;
          if (producto != null) {
            this.isAudio ? this.beepService.beep() : null;
            console.log(producto);
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
    item.cantidad = this.formGroup.controls.cantidad.value;
    item.producto = producto;
    item.presentacion = producto?.presentaciones.find(
      (p) => p.principal == true
    );
    item.precioVenta = item?.presentacion?.precios.find(
      (p) => p.principal == true
    );
    if(item.presentacion == null || item.precioVenta == null){
      this.notificacionSnackbar.notification$.next({
        texto: 'El producto no tiene precio',
        duracion: 2,
        color: NotificacionColor.warn
      })
    } else {
      this.addItem(item);
    }
  }

  setFocusToCodigoInput() {
    if (this.codigoInput != null && !this.isDialogOpen) {
      setTimeout(() => {
        this.codigoInput.nativeElement.focus();
      }, 10);
    }
  }

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
      let ref = this.dialog
        .open(PagoTouchComponent, {
          autoFocus: true,
          restoreFocus: true,
          data: {
            valor: this.totalGs,
          },
          width: "80vw",
          height: "80vh",
        })
        .afterClosed()
        .subscribe((res) => {
          if (res != null) {
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
            console.log(venta, cobro);
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
    this.cargandoService.openDialog(true);
    //guardar la compra, si la compra se guardo con exito, imprimir ticket y resetForm()
    console.log(this.selectedCaja);
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
    console.log(venta, cobro);
    this.onSaveVenta(venta, cobro);
  }

  onSaveVenta(venta, cobro) {
    this.ventaTouchServive.onSaveVenta(venta, cobro).subscribe((res) => {
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
    this.dialog
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
      .afterClosed()
      .subscribe((resDialog) => {
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
              })
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
                      })
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
                          })
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
      });
  }

  addPdvCategoria() {
    this.isDialogOpen = true;
    this.dialog
      .open(AddCategoriaDialogComponent, {
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.pdvCategorias.push(res);
        }
      });
  }

  addPdvProducto(pdvGrupo?: PdvGrupo) {
    this.isDialogOpen = true;
    this.dialog
      .open(AdicionarPdvProductoDialogComponent, {
        restoreFocus: true,
        data: {
          pdvCategoria: this.selectedPdvCategoria,
          pdvGrupo,
        },
        width: "70%",
        height: "60%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.pdvCategorias.push(res);
        }
      });
  }

  ngOnDestroy(): void {
    this.ventaSub.unsubscribe();
  }

  openUtilitarios() {
    this.isDialogOpen = true;
    this.dialog
      .open(UtilitariosDialogComponent, {
        data: {
          caja: this.selectedCaja,
        },
        width: "70%",
        disableClose: false,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed()
      .subscribe((res) => {
        console.log(res);

        if (res != null) {
          if (res.conteoCierre != null) {
            this.selectedCaja = null;
            this.openSelectCajaDialog();
          }
        }

        this.isDialogOpen = false;
      });
  }
}
