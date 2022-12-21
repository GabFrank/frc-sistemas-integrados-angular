import {
  AfterViewInit,
  Component,
  ElementRef, Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Observable, Subject, Subscription } from "rxjs";
import { isInt } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { MonedasGetAllGQL } from "../../../../modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { SaveDeliveryGQL } from "../../../../modules/operaciones/delivery/graphql/saveDelivery";
import { SaveVueltoGQL } from "../../../../modules/operaciones/vuelto/graphql/saveVuelto";
import { SaveVueltoItemGQL } from "../../../../modules/operaciones/vuelto/vuelto-item/graphql/saveVueltoItem";
import { Codigo } from "../../../../modules/productos/codigo/codigo.model";
import { Producto } from "../../../../modules/productos/producto/producto.model";
import { AllTiposPreciosGQL } from "../../../../modules/productos/tipo-precio/graphql/allTiposPrecios";
import { TipoPrecio } from "../../../../modules/productos/tipo-precio/tipo-precio.model";
import {
  NotificacionColor,
  NotificacionSnackbarService
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { AdicionarCajaResponse } from "../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CobroDetalle } from "../../../operaciones/venta/cobro/cobro-detalle.model";
import { Cobro } from "../../../operaciones/venta/cobro/cobro.model";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import {
  PagoResponseData,
  PagoTouchComponent
} from "./pago-touch/pago-touch.component";
import { PdvCategoria } from "./pdv-categoria/pdv-categoria.model";
import { PdvGrupo } from "./pdv-grupo/pdv-grupo.model";
import { SeleccionarCajaDialogComponent } from "./seleccionar-caja-dialog/seleccionar-caja-dialog.component";
import { SeleccionarEnvaseDialogComponent } from "./seleccionar-envase-dialog/seleccionar-envase-dialog.component";
import {
  SelectProductosDialogComponent,
  SelectProductosResponseData
} from "./select-productos-dialog/select-productos-dialog.component";
import { UtilitariosDialogComponent } from "./utilitarios-dialog/utilitarios-dialog.component";
import { VentaTouchService } from "./venta-touch.service";

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

export interface VentaTouchData {
  isDelivery;
  venta: Venta;
}


import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from "../../../../../environments/environment";
import { VentaCredito, VentaCreditoCuotaInput } from "../../../financiero/venta-credito/venta-credito.model";
import { VentaCreditoService } from "../../../financiero/venta-credito/venta-credito.service";
import { Delivery } from "../../../operaciones/delivery/delivery.model";
import { DeliveryEstado } from "../../../operaciones/delivery/enums";
import { VentaEstado } from "../../../operaciones/venta/enums/venta-estado.enums";
import { VentaService } from "../../../operaciones/venta/venta.service";
import { DeliveryService } from "./delivery-dialog/delivery.service";
import { ListDeliveryComponent, ListDeliveryData } from "./list-delivery/list-delivery.component";
import { DescuentoDialogComponent, DescuentoDialogData } from "./pago-touch/descuento-dialog/descuento-dialog.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-venta-touch",
  templateUrl: "./venta-touch.component.html",
  styleUrls: ["./venta-touch.component.css"],
})
export class VentaTouchComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('container', { read: ElementRef }) container: ElementRef;

  @Input() data: Tab;

  // selectedCaja: PdvCaja;
  selectedVenta: Venta;
  winHeigth;
  winWidth;
  totalGs = 0;
  descuentoGs = 0;
  cambioRs = 1;
  cambioDs = 1;
  cambioArg = 1;
  selectedPdvCategoria: PdvCategoria;
  ultimoAdicionado: VentaItem[] = [];
  tiposPrecios: TipoPrecio[] = [];
  selectedTipoPrecio: TipoPrecio;
  selectedItemList: VentaItem[] = [];
  itemList: VentaItem[] = [];
  itemList2: VentaItem[] = [];
  isDialogOpen;
  isAuxiliar = false;
  monedas: Moneda[] = [];
  mostrarTipoPrecios = false;
  ventaSub: Subscription;
  selectCajaDialog: MatDialogRef<SeleccionarCajaDialogComponent>;
  dialogReference;
  formaPagoList: FormaPago[];
  disableCobroRapido = false;
  buscadorFocusSub: Subject<void> = new Subject<void>();
  buscadorOpenSearch: Subject<void> = new Subject<void>();
  filteredPrecios: string[];
  modoPrecio: string;
  isDelivery = false;
  selectedDelivery: Delivery
  constructor(
    @Inject(MAT_DIALOG_DATA) private dialogData: VentaTouchData,
    private dialog: MatDialog,
    public windowInfo: WindowInfoService,
    public mainService: MainService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private getTiposPrecios: AllTiposPreciosGQL,
    private tabService: TabService,
    private getMonedas: MonedasGetAllGQL,
    private saveDelivery: SaveDeliveryGQL,
    private saveVuelto: SaveVueltoGQL,
    private saveVueltoItem: SaveVueltoItemGQL,
    private confirmDialogService: DialogosService,
    private ventaTouchServive: VentaTouchService,
    private matDialog: MatDialog,
    private cajaService: CajaService,
    private formaPagoService: FormaPagoService,
    private cargandoService: CargandoDialogService,
    private dialogoService: DialogosService,
    private ventaCreditoService: VentaCreditoService,
    private ventaService: VentaService,
    private deliveryService: DeliveryService
  ) {
    this.winHeigth = windowInfo.innerHeight + "px";
    this.winWidth = windowInfo.innerWidth + "px";
    this.isDialogOpen = false;
    this.filteredPrecios = environment['precios']
    this.modoPrecio = environment['modo']
  }

  ngOnInit(): void {
    this.formaPagoList = [];
    this.setPrecios();
    this.getFormaPagos();

    setTimeout(() => {
      this.isAuxiliar = this.data?.tabData?.data?.auxiliar;
    }, 0);

    this.cajaService.onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.cajaService.selectedCaja = res;

          if (this.cajaService.selectedCaja == null || this.cajaService.selectedCaja?.conteoApertura == null) {
            this.openSelectCajaDialog()
          }
        } else {
          this.openSelectCajaDialog()
        }
      })

    setTimeout(() => {
      this.buscadorFocusSub.next()
    }, 3000);

    this.selectedItemList = this.itemList;

    if (this.dialogData?.venta) {
      this.selectedVenta = this.dialogData?.venta;
      this.totalGs = this.selectedVenta?.totalGs
      this.selectedItemList = this.selectedVenta?.ventaItemList;
    }


  }

  ngAfterViewInit(): void {
    this.tabService.tabSub.pipe(untilDestroyed(this)).subscribe(res => {
      setTimeout(() => {
        if (this.tabService?.currentTab()?.title == 'Venta') {
          this.buscadorFocusSub.next()
        }
      }, 500);
    })

    this.container.nativeElement.addEventListener('keydown', (e) => {
      if (!this.isDialogOpen) {
        switch (e.key) {
          case "F12":
            if (this.itemList.length > 0) {
              this.onPagoClick()
            }
            break;
          case "F11":
            if (this.itemList.length > 0 && !this.disableCobroRapido) {
              this.onTicketClick(true)
            }
            break;
          case "F10":
            this.onDeliveryClick()
            break;
          case "F9":
            this.buscadorOpenSearch.next()
            break;
          case "F8":
            this.onTicketClick(false);
            break;
          case "F7":
            break;
          case "F6":
            break;
          case "F5":
            break;
          case "F4":
            break;
          case "F3":
            break;
          case "F2":
            this.pdvAuxiliarClick()
            break;
          case "F1":
            this.openUtilitarios()
            break;
          case "Escape":
            if (this.selectedItemList.length > 0) this.removeItem({})
            break;
          default:
            break;
        }
      }
    })
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
        data: { pdvCaja: this.cajaService?.selectedCaja },
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
        // } else if (response?.caja != null) {
        //   this.cajaService?.selectedCaja = response?.caja;
        //   if (response?.conteoApertura == null) {
        //     this.dialogoService.confirm('Atención', 'Esta caja no posee conteo inicial. Desea realizar el conteo inicial?').subscribe(dialogRes => {
        //       if(dialogRes){
        //         this.openSelectCajaDialog()
        //       } else {
        //         this.tabService.removeTab(this.tabService.currentIndex)
        //       }
        //     })
        //   }
        //   if (response?.conteoCierre != null) {
        //     this.cajaService?.selectedCaja = null;
        //     this.openSelectCajaDialog();
        //   }
        //   this.isDialogOpen = false;
        // } else {
        //   this.openSelectCajaDialog();
        // }
      } else {
        if (this.cajaService.selectedCaja?.conteoApertura == null) {
          this.dialogoService.confirm('Atención', 'Esta caja no posee conteo inicial. Desea realizar el conteo inicial?').subscribe(dialogRes => {
            if (dialogRes) {
              this.openSelectCajaDialog()
            } else {
              this.tabService.removeTab(this.tabService.currentIndex)
            }
          })
        }
        if (this.cajaService.selectedCaja?.conteoCierre != null) {
          this.cajaService.selectedCaja = null;
          this.openSelectCajaDialog();
        }
        this.isDialogOpen = false;
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

  onGridCardClick(grupo: PdvGrupo) {
    this.isDialogOpen = true;
    let descripcion = grupo.descripcion;
    let pdvGruposProductos = grupo.pdvGruposProductos;
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
        this.isDialogOpen = false;
        let respuesta: SelectProductosResponseData = res;
        if (res != null) {
          let item: VentaItem = new VentaItem();
          item.presentacion = respuesta.data.presentacion;
          item.precioVenta = respuesta.data?.precio;
          item.precio = respuesta.data?.precio?.precio;
          item.producto = respuesta.producto;
          item.cantidad = respuesta.data.cantidad;
          this.addItem(item);
        }
        this.dialogReference = undefined;
        this.buscadorFocusSub.next()
      });
  }

  calcularTotales() {
    this.totalGs = 0;
    this.selectedItemList.forEach((item) => {
      this.totalGs += Math.round(+item.cantidad * +item?.precio);
    });
  }

  addItem(item: VentaItem, index?) {
    item.precio = item?.precioVenta?.precio;
    let cantidad = item.cantidad;
    if (item.producto.balanza != true) {
      if (!isInt(cantidad)) {
        cantidad = 1;
      }
    }
    let item2 = new VentaItem();
    if (item.presentacion == null) {
      item.presentacion = item.producto.presentaciones.find(
        (p) => p.principal == true && p.activo == true
      );
    }
    if (item.precioVenta == null) {
      if (this.filteredPrecios == null || this.modoPrecio == 'NOT') {
        item.precioVenta = item.presentacion.precios?.find(
          (p) => p.principal == true && p.activo == true
        );
      } else if (this.modoPrecio?.includes('MIXTO') || this.modoPrecio?.includes('ONLY')) {
        item.precioVenta = item?.presentacion?.precios.find(
          (p) => this.filteredPrecios.includes(p.tipoPrecio?.descripcion) && p.activo == true
        );
      }
    }

    let presentacionCaja: Presentacion;
    item.producto.presentaciones.forEach((p) => {
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
      if (this.filteredPrecios == null || this.modoPrecio == 'NOT') {
        item2.precioVenta = item2.presentacion?.precios?.find(
          (precio) => precio?.principal == true && precio.activo == true
        );
      } else if (this.modoPrecio?.includes('MIXTO') || this.modoPrecio?.includes('ONLY')) {
        item2.precioVenta = item2.presentacion?.precios?.find(
          (p) => this.filteredPrecios.includes(p.tipoPrecio?.descripcion) && p.activo == true
        );
      }

      if (item2.precioVenta != null) {
        let factor = Math.floor(
          (cantidad * item.presentacion.cantidad) / item2.presentacion.cantidad
        );
        let cantAux = item2.presentacion.cantidad * factor;
        item2.cantidad = factor;
        cantidad -= cantAux / item.presentacion.cantidad;
        item.cantidad = cantidad;
        item.precio = item?.precioVenta?.precio;

        this.addItem(item2);
      }
    }

    if (this.selectedItemList.length > 0 && index == null) {
      index = this.selectedItemList.findIndex(
        (i) =>
          i.presentacion?.id == item.presentacion?.id &&
          i.precioVenta?.precio == item.precioVenta?.precio
      );
    }
    if (index != -1 && index != null) {
      this.selectedItemList[index].cantidad += cantidad;
    } else {
      if (item.cantidad > 0) {
        if (item.producto?.envase != null) {
          this.isDialogOpen = true;
          this.dialogReference = this.dialog
            .open(SeleccionarEnvaseDialogComponent, {
              data: {
                envase: item.producto.envase,
                cantidad: item.cantidad * item.presentacion.cantidad,
              },
              disableClose: true,
            })
            .afterClosed().pipe(untilDestroyed(this))
            .subscribe((envaseRes) => {
              this.isDialogOpen = false;
              this.dialogReference = undefined;
              if (envaseRes != null) {
                this.addItem(envaseRes);
              }
            });
        }
        if (this.isDelivery) {
          item.venta = this.selectedDelivery.venta;
          item.activo = true;
          this.ventaService.onSaveVentaItem(item.toInput()).subscribe(ventaItemRes => {
            if (ventaItemRes != null) {
              this.selectedItemList.push(item);
            }
          })
        } else {
          this.selectedItemList.push(item);
        }
      }
    }
    this.calcularTotales();
    item.cantidad = cantidad;
    if (item.cantidad > 0) this.ultimoAdicionado.push(item);
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  removeItem(event: any) {
    let item = event['item']
    let index = event['i']
    if (item == null && index == null) {
      this.dialogReference = this.confirmDialogService
        .confirm("Atención!!", "Realmente desea eliminar la lista de itens?").pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res) {
            if (this.isAuxiliar) {
              this.itemList2 = []
            } else {
              this.itemList = []
            }
            this.selectedItemList = [];
            this.calcularTotales();
          }
          this.dialogReference = undefined;
        });
    } else {
      this.selectedItemList.splice(index, 1);
      this.calcularTotales();
    }
  }

  editItem(event: any) {
    let item = new VentaItem;
    Object.assign(item, event['item'])
    let index = event['i']

    let data: DescuentoDialogData = {
      valorTotal: item.precioVenta.precio,
      saldo: 0,
      cambioDs: this.cambioDs,
      cambioRs: this.cambioRs
    }
    this.matDialog.open(DescuentoDialogComponent, {
      data: data
    }).afterClosed().subscribe(res => {
      if (res > 0) {
        item.valorDescuento = res;
        this.selectedItemList[index] = item;
        this.calcularTotales()
      }
    })
  }

  crearItem(eventData: any, index?) {
    let producto = eventData['producto']
    let texto = eventData['texto']
    let cantidad = eventData['cantidad']
    let item: VentaItem = new VentaItem();
    let selectedCodigo: Codigo;
    let selectedPresentacion: Presentacion;
    item.cantidad = cantidad;
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
        (p) => p.principal == true && p.activo == true
      );
    }
    if (this.filteredPrecios == null || this.modoPrecio == 'NOT') {
      item.precioVenta = item?.presentacion?.precios?.find(
        (p) => p.principal == true && p.activo == true
      );
    } else if (this.modoPrecio?.includes('MIXTO') || this.modoPrecio?.includes('ONLY')) {
      item.precioVenta = item?.presentacion?.precios?.find(
        (p) => this.filteredPrecios.includes(p.tipoPrecio?.descripcion) && p.activo == true
      );
      if (item.precioVenta == null) {
        item.precioVenta = item?.presentacion?.precios?.find(
          (p) => p.principal == true && p.activo == true
        );
      }
    }

    if (item.presentacion == null || item.precioVenta == null) {
      this.notificacionSnackbar.notification$.next({
        texto: "El producto no tiene precio",
        duracion: 2,
        color: NotificacionColor.warn,
      });
    } else {
      this.addItem(item);
    }
    this.buscadorFocusSub.next()
  }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  pdvAuxiliarClick() {
    if (this.isDelivery) {
      this.isDelivery = false;
      this.selectedItemList = []
      this.calcularTotales()
    } else {
      if (!this.isAuxiliar) {
        this.isAuxiliar = true;
        this.selectedItemList = this.itemList2;
        this.calcularTotales()
      } else {
        this.isAuxiliar = false;
        this.selectedItemList = this.itemList;
        this.calcularTotales()
      }
    }
    this.buscadorFocusSub.next()
  }

  onPagoClick() {
    this.isDialogOpen = true;
    if (this.selectedItemList?.length > 0) {
      let descuento = 0;
      this.selectedItemList.forEach(vi => {
        descuento += vi.cantidad * vi.valorDescuento;
      })
      this.dialogReference = this.dialog
        .open(PagoTouchComponent, {
          autoFocus: true,
          restoreFocus: true,
          data: {
            valor: this.totalGs,
            itemList: this.selectedItemList,
            descuento: descuento,
            delivery: this.selectedDelivery
          },
          width: "80vw",
          height: "80vh",
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isDialogOpen = false;
          if (res != null) {
            this.cargandoService.openDialog();
            let response: PagoResponseData = res;
            let venta = new Venta();
            venta.totalGs = this.totalGs;
            venta.totalRs = this.totalGs / this.cambioRs;
            venta.totalDs = this.totalGs / this.cambioDs;
            venta.ventaItemList = this.selectedItemList;
            venta.caja = this.cajaService?.selectedCaja;
            let cobro = new Cobro();
            cobro.totalGs = this.totalGs;
            cobro.cobroDetalleList = [];
            // cobroDetalle.
            if (response.cobroDetalleList != null) {
              response.cobroDetalleList.forEach((cobroDetalle) => {
                if (cobroDetalle.descuento) {
                  cobro.totalGs -= cobroDetalle.valor
                }
                if (cobroDetalle.aumento)
                  cobroDetalle.valor = cobroDetalle.valor * -1;
                cobro.cobroDetalleList.push(cobroDetalle);
              });
            }

            this.cargandoService.closeDialog();
            let ventaCredito: VentaCredito = res['ventaCredito'];
            let ventaCreditoCuotaInputList: VentaCreditoCuotaInput[] = res['itens']
            if (ventaCredito != null) venta.cliente = ventaCredito.cliente;
            if (this.isDelivery) {
              this.deliveryService.onSaveDeliveryEstado(this.selectedDelivery.id, DeliveryEstado.CONCLUIDO).subscribe(delRes => {
                console.log(delRes);
                this.isDelivery = false;
                this.selectedDelivery = null;
                this.selectedItemList = [];
                this.calcularTotales()
              })
            } else {
              this.onSaveVenta(venta, cobro, !(response?.facturado == true) || ventaCredito != null, ventaCredito?.toInput(), ventaCreditoCuotaInputList).subscribe(ventaRes => {
                console.log(ventaRes);
              })
            }
            this.dialogReference = undefined;
          } else if (this.isDelivery) {
            this.isDelivery = false;
            this.selectedDelivery = null;
            this.selectedItemList = [];
            this.calcularTotales()
          }
          this.buscadorFocusSub.next()
        });
    }
  }

  resetForm() {
    if (!this.isAuxiliar) {
      this.itemList = []
      this.selectedItemList = this.itemList;
    } else {
      this.itemList2 = [];
      this.selectedItemList = this.itemList2;
    }
    this.selectedTipoPrecio = this.tiposPrecios[0];
    this.totalGs = 0;
  }

  onTicketClick(ticket?: boolean) {
    this.disableCobroRapido = true;
    //guardar la compra, si la compra se guardo con exito, imprimir ticket y resetForm()
    let venta = new Venta();
    venta.formaPago = this.formaPagoService.formaPagoList.find(
      (f) => f.descripcion == "EFECTIVO"
    );
    let descuento = 0;
    venta.totalGs = this.totalGs;
    venta.totalRs = this.totalGs / this.cambioRs;
    venta.totalDs = this.totalGs / this.cambioDs;
    venta.ventaItemList = this.selectedItemList;
    venta.caja = this.cajaService?.selectedCaja;
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
    this.selectedItemList.forEach(vi => {
      descuento += vi.valorDescuento;
    })
    if (descuento > 0) {
      let cobroDetalleDesc = new CobroDetalle();
      cobroDetalleDesc.moneda = this.monedas.find((m) => m.denominacion == "GUARANI");
      cobroDetalleDesc.cambio = cobroDetalleDesc.moneda.cambio;
      cobroDetalleDesc.formaPago = this.formaPagoList.find(
        (f) => f.descripcion == "EFECTIVO"
      );
      cobroDetalleDesc.descuento = true;
      cobroDetalleDesc.aumento = false;
      cobroDetalleDesc.vuelto = false;
      cobroDetalleDesc.pago = false;
      cobroDetalleDesc.valor = descuento;
      cobro.cobroDetalleList.push(cobroDetalleDesc);
    }
    // cobroDetalle.
    this.onSaveVenta(venta, cobro, ticket).subscribe().unsubscribe();
    this.disableCobroRapido = false;
    this.buscadorFocusSub.next()
  }

  onSaveVenta(venta, cobro, ticket, ventaCreditoInput?, ventaCreditoCuotaInputList?): Observable<Venta> {
    this.cargandoService.openDialog();
    return new Observable(obs => {
      this.ventaTouchServive.onSaveVenta(venta, cobro, ticket, ventaCreditoInput, ventaCreditoCuotaInputList).pipe(untilDestroyed(this)).subscribe((res) => {
        this.cargandoService.closeDialog();
        console.log(res);

        if (res.id != null) {
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.success,
            texto: "Venta guardada con éxito",
            duracion: 2,
          });
          this.resetForm();
          obs.next(res)
        } else {
          this.notificacionSnackbar.notification$.next({
            color: NotificacionColor.danger,
            texto: "Ups! Ocurrió un problema al guardar",
            duracion: 3,
          });
          obs.next(null)
        }
      });
    })
  }

  onDeliveryClick() {
    this.isDialogOpen = true;
    if (this.selectedDelivery == null) {
      this.selectedDelivery = new Delivery;
      let venta = new Venta();
      venta.caja = this.cajaService?.selectedCaja;
      venta.estado = VentaEstado.ABIERTA;
      venta.totalGs = this.totalGs;
      venta.totalRs = this.totalGs / this.cambioRs;
      venta.totalDs = this.totalGs / this.cambioDs;
      venta.valorDescuento = this.descuentoGs;
      venta.ventaItemList = this.selectedItemList;
      venta.isDelivery = true;
      this.selectedDelivery.venta = venta;
      this.selectedDelivery.estado = DeliveryEstado.ABIERTO;
    }
    let data: ListDeliveryData = {
      delivery: this.selectedDelivery,
      cambioRs: this.cambioRs,
      cambioDs: this.cambioDs,
      monedaList: this.monedas,
      formaPagoList: this.formaPagoList
    }
    this.matDialog.open(ListDeliveryComponent, {
      width: '100vw',
      maxWidth: '99vw',
      height: '80vh',
      data: data,
      autoFocus: false
    }).afterClosed().subscribe(res => {
      if (res != null) {
        if (res['delivery'] != null) {
          this.selectedDelivery = new Delivery;
          Object.assign(this.selectedDelivery, res['delivery']);
          this.isDelivery = true;
        }
        switch (res['role']) {
          case 'para-entrega':
            this.isDelivery = false;
            this.selectedDelivery = null;
            this.selectedItemList = []
            this.calcularTotales()
            break;
          case 'edit':
            if (this.selectedDelivery != null) {
              this.isDelivery = true;
              this.selectedItemList = []
              if (this.selectedDelivery.venta != null) {
                this.ventaService.onGetPorId(this.selectedDelivery.venta.id).subscribe(ventaRes => {
                  if (ventaRes != null) {
                    this.selectedDelivery.venta = ventaRes;
                    this.selectedItemList = this.selectedDelivery.venta.ventaItemList;
                    this.calcularTotales()
                  }
                })
              }
            }
            break;
          case 'finalizar':
            this.selectedItemList = this.selectedDelivery.venta.ventaItemList;
            this.calcularTotales()
            this.onPagoClick();
            break;
          default:
            this.isDelivery = false;
            this.selectedDelivery = null;
            this.selectedItemList = []
            this.calcularTotales()
            break;
        }
      } else {
        this.isDelivery = false;
        this.selectedDelivery = null;
        this.selectedItemList = []
        this.calcularTotales()
      }
      this.isDialogOpen = false;
    })
  }

  ngOnDestroy(): void {
  }

  openUtilitarios() {
    this.isDialogOpen = true;
    this.dialogReference = this.dialog
      .open(UtilitariosDialogComponent, {
        data: {
          caja: this.cajaService?.selectedCaja,
        },
        width: "95%",
        disableClose: false,
        restoreFocus: true,
        autoFocus: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.isDialogOpen = false;
        if (this.cajaService?.selectedCaja != null) {
          if (this.cajaService?.selectedCaja.conteoApertura == null) {
            this.openSelectCajaDialog();
          } else if (this.cajaService?.selectedCaja.conteoCierre != null) {
            this.cajaService.selectedCaja = null;
            this.openSelectCajaDialog();
          }
        }
        this.dialogReference = undefined;
        this.buscadorFocusSub.next()
      });
  }

  // @HostListener("document:keydown", ["$event"]) onKeydownHandler(
  //   event: KeyboardEvent
  // ) {
  //   if (this.tabService.currentTab().title == 'Venta') {
  //     if (!this.isDialogOpen) {
  //       switch (event.key) {
  //         case "F12":
  //           if (this.itemList.length > 0) {
  //             this.onPagoClick()
  //           }
  //           break;
  //         case "F11":
  //           if (this.itemList.length > 0 && !this.disableCobroRapido) {
  //             this.onTicketClick(true)
  //           }
  //           break;
  //         case "F10":
  //           this.onDeliveryClick()
  //           break;
  //         case "F9":
  //           this.buscadorOpenSearch.next()
  //           break;
  //         case "F8":
  //           this.onTicketClick(false);
  //           break;
  //         case "F7":
  //           break;
  //         case "F6":
  //           break;
  //         case "F5":
  //           break;
  //         case "F4":
  //           break;
  //         case "F3":
  //           break;
  //         case "F2":
  //           this.pdvAuxiliarClick()
  //           break;
  //         case "F1":
  //           this.openUtilitarios()
  //           break;
  //         case "Escape":
  //           if (this.selectedItemList.length > 0) this.removeItem({})
  //           break;
  //         default:
  //           break;
  //       }
  //     }
  //   }
  // }

  // onKeyDown(event) {
  //   {
  //     console.log(event.key);

  //     if (!this.isDialogOpen) {
  //       switch (event.key) {
  //         case "F12":
  //           if (this.itemList.length > 0) {
  //             this.onPagoClick()
  //           }
  //           break;
  //         case "F11":
  //           if (this.itemList.length > 0 && !this.disableCobroRapido) {
  //             this.onTicketClick(true)
  //           }
  //           break;
  //         case "F10":
  //           this.onDeliveryClick()
  //           break;
  //         case "F9":
  //           this.buscadorOpenSearch.next()
  //           break;
  //         case "F8":
  //           this.onTicketClick(false);
  //           break;
  //         case "F7":
  //           break;
  //         case "F6":
  //           break;
  //         case "F5":
  //           break;
  //         case "F4":
  //           break;
  //         case "F3":
  //           console.log('log on venta');
  //           break;
  //         case "F2":
  //           this.pdvAuxiliarClick()
  //           break;
  //         case "F1":
  //           this.openUtilitarios()
  //           break;
  //         case "Escape":
  //           if (this.selectedItemList.length > 0) this.removeItem({})
  //           break;
  //         default:
  //           break;
  //       }
  //     }

  //   }
  // }
}


/*
- quitar papas rusticas
- burger especiales son: Sr. Miyagi, Tentation, Chicken (ya tenes todos los precios vd)
- quesadilla 4 quesos: 30.000 gs
- Nembo fit: Cammbiar bife ancho por Bife nomas, precio 20.000 gs
- Quitar los adicionales para milanesa napolitana y bife a caballo

*/

