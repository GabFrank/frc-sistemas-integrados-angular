import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Subject, Subscription } from "rxjs";
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
import { Producto } from "../../../../modules/productos/producto/producto.model";
import { AllTiposPreciosGQL } from "../../../../modules/productos/tipo-precio/graphql/allTiposPrecios";
import { TipoPrecio } from "../../../../modules/productos/tipo-precio/tipo-precio.model";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { AdicionarCajaResponse } from "../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CobroDetalle } from "../../../operaciones/venta/cobro/cobro-detalle.model";
import { Cobro } from "../../../operaciones/venta/cobro/cobro.model";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { DeliveryDialogComponent } from "./delivery-dialog/delivery-dialog.component";
import { EditItemDialogComponent } from "./edit-item-dialog/edit-item-dialog.component";
import {
  PagoResponseData,
  PagoTouchComponent,
} from "./pago-touch/pago-touch.component";
import { PdvCategoria } from "./pdv-categoria/pdv-categoria.model";
import { SeleccionarCajaDialogComponent } from "./seleccionar-caja-dialog/seleccionar-caja-dialog.component";
import {
  SelectProductosDialogComponent,
  SelectProductosResponseData,
} from "./select-productos-dialog/select-productos-dialog.component";
import { UtilitariosDialogComponent } from "./utilitarios-dialog/utilitarios-dialog.component";
import { VentaTouchService } from "./venta-touch.service";
import { NgxPrintElementService } from "ngx-print-element";
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

  selectedCaja: PdvCaja;

  winHeigth;
  winWidth;
  totalGs = 0;
  descuentoGs = 0;
  cambioRs = 0;
  cambioDs = 0;
  cambioArg = 0;
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


  constructor(
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
    public printService: NgxPrintElementService
  ) {
    this.winHeigth = windowInfo.innerHeight + "px";
    this.winWidth = windowInfo.innerWidth + "px";
    this.isDialogOpen = false;
  }

  ngOnInit(): void {
    this.formaPagoList = [];
    this.setPrecios();
    this.getFormaPagos();

    setTimeout(() => {
      this.isAuxiliar = this.data?.tabData?.data?.auxiliar;
    }, 0);

    this.cajaService
      .onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual.id).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res)
        this.selectedCaja = res;
        if (res == null || res?.conteoApertura == null) {
          this.openSelectCajaDialog();
        }
      });

    // this.ventaTouchServive.cajaSub
    // .pipe(untilDestroyed(this))
    // .subscribe(res => {
    //   if(res==null || res?.conteoApertura==null){
    //     this.selectedCaja = res;
    //     this.openSelectCajaDialog()
    //   }
    // })

    setTimeout(() => {
      this.buscadorFocusSub.next()
    }, 3000);

    this.selectedItemList = this.itemList;
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
        data: { pdvCaja: this.selectedCaja },
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
        this.buscadorFocusSub.next()
      });
  }

  calcularTotales() {
    this.totalGs = 0;
    this.selectedItemList.forEach((item) => {
      this.totalGs += Math.round(+item.cantidad * +item.precioVenta.precio);
    });
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

    if (this.selectedItemList.length > 0 && index == null) {
      console.log("entro aca");
      index = this.selectedItemList.findIndex(
        (i) =>
          i.presentacion.id == item.presentacion.id &&
          i.precioVenta.precio == item.precioVenta.precio
      );
    }
    if (index != -1 && index != null) {
      this.selectedItemList[index].cantidad += cantidad;
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
        this.selectedItemList.push(item);
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
            if(this.isAuxiliar){
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
    // let item = event['item']
    // let index = event['i']
    // let dialogReference = this.dialog.open(EditItemDialogComponent, {
    //   data: {
    //     item,
    //   },
    // });
    // dialogReference.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
    //   if (res != null) {
    //     switch (res) {
    //       case -1:
    //       case 0:
    //         this.removeItem({ item, index });
    //         break;
    //       default:
    //         this.removeItem({ item, index });
    //         item.cantidad = res;
    //         this.addItem(item);
    //         break;
    //     }
    //   }
    //   this.dialogReference = undefined;
    //   this.buscadorFocusSub.next()
    // });
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
    this.buscadorFocusSub.next()
  }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  pdvAuxiliarClick() {
    if (!this.isAuxiliar) {
      this.isAuxiliar = true;
      this.selectedItemList = this.itemList2;
      this.calcularTotales()
    } else {
      this.isAuxiliar = false;
      this.selectedItemList = this.itemList;
      this.calcularTotales()
    }
    this.buscadorFocusSub.next()
  }

  onPagoClick() {
    this.isDialogOpen = true;
    if (this.selectedItemList?.length > 0) {
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
            venta.ventaItemList = this.selectedItemList;
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
            this.cargandoService.closeDialog();
            this.onSaveVenta(venta, cobro, true);
            this.dialogReference = undefined;
          }
          this.isDialogOpen = false;
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

  onTicketClick(ticket?:boolean) {
    this.disableCobroRapido = true;
    //guardar la compra, si la compra se guardo con exito, imprimir ticket y resetForm()
    let venta = new Venta();
    venta.formaPago = this.formaPagoService.formaPagoList.find(
      (f) => f.descripcion == "EFECTIVO"
    );
    venta.totalGs = this.totalGs;
    venta.totalRs = this.totalGs / this.cambioRs;
    venta.totalDs = this.totalGs / this.cambioDs;
    venta.ventaItemList = this.selectedItemList;
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
    this.onSaveVenta(venta, cobro, ticket);
    this.disableCobroRapido = false;
    this.buscadorFocusSub.next()
  }

  onSaveVenta(venta, cobro, ticket) {
    this.cargandoService.openDialog();
    this.ventaTouchServive.onSaveVenta(venta, cobro, ticket).pipe(untilDestroyed(this)).subscribe((res) => {
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
        console.log(res)
        if (res['caja'] != null) {
          if (res['caja'].conteoApertura == null) {
            this.selectedCaja = res['caja'];
            this.openSelectCajaDialog();
          } else if (res['caja'].conteoCierre != null) {
            this.selectedCaja = null;
            this.openSelectCajaDialog();
          }
        }
        this.dialogReference = undefined;
        this.buscadorFocusSub.next()
      });
  }
}


