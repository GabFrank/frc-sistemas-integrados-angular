import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService } from '../../../../layouts/tab/tab.service';
import { MainService } from '../../../../main.service';
import { MonedasGetAllGQL } from '../../../../modules/financiero/moneda/graphql/monedasGetAll';
import { Moneda } from '../../../../modules/financiero/moneda/moneda.model';
import { Delivery } from '../../../../modules/operaciones/delivery/delivery.model';
import { DeliveryEstado } from '../../../../modules/operaciones/delivery/enums';
import { DeliveryInput } from '../../../../modules/operaciones/delivery/graphql/delivery-input.model';
import { SaveDeliveryGQL } from '../../../../modules/operaciones/delivery/graphql/saveDelivery';
import { SaveVueltoGQL } from '../../../../modules/operaciones/vuelto/graphql/saveVuelto';
import { VueltoInput } from '../../../../modules/operaciones/vuelto/vuelto-input.model';
import { SaveVueltoItemGQL } from '../../../../modules/operaciones/vuelto/vuelto-item/graphql/saveVueltoItem';
import { VueltoItemInput } from '../../../../modules/operaciones/vuelto/vuelto-item/vuelto-item-input.model';
import { Codigo } from '../../../../modules/productos/codigo/codigo.model';
import { ProductoPorCodigoGQL } from '../../../../modules/productos/producto/graphql/productoPorCodigo';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from '../../../../modules/productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { Producto } from '../../../../modules/productos/producto/producto.model';
import { AllTiposPreciosGQL } from '../../../../modules/productos/tipo-precio/graphql/allTiposPrecios';
import { TipoPrecio } from '../../../../modules/productos/tipo-precio/tipo-precio.model';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../notificacion-snackbar.service';
import { BeepService } from '../../../../shared/beep/beep.service';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { VentaItem } from '../../../operaciones/venta/venta-item.model';
import { DeliveryDialogComponent } from './delivery-dialog/delivery-dialog.component';
import { EditItemDialogComponent } from './edit-item-dialog/edit-item-dialog.component';
import { PagoTouchComponent } from './pago-touch/pago-touch.component';
import { PdvCategoria } from './pdv-categoria/pdv-categoria.model';
import { PdvCategoriaService } from './pdv-categoria/pdv-categoria.service';
import { PdvGruposProductos } from './pdv-grupos-productos/pdv-grupos-productos.model';
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaResponseData,
} from './producto-categoria-dialog/producto-categoria-dialog.component';
import { SelectProductosDialogComponent, SelectProductosResponseData } from './select-productos-dialog/select-productos-dialog.component';

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
  unidad = 'Unid.',
  caja = 'Caja',
}

export interface PdvTouchData {
  auxiliar: boolean;
  titulo: String;
}

@Component({
  selector: 'app-venta-touch',
  templateUrl: './venta-touch.component.html',
  styleUrls: ['./venta-touch.component.css'],
})
export class VentaTouchComponent implements OnInit {
  @Input() data: Tab;

  @ViewChild('codigoInput', { static: false })
  codigoInput: ElementRef;

  isCargandoPDV = true;
  displayedColumns = ['numero', 'descripcion', 'cantidad', 'precio', 'total'];
  dataSource = new MatTableDataSource<VentaItem>();
  winHeigth;
  winWidth;
  totalGs = 0;
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
    private saveVueltoItem: SaveVueltoItemGQL
  ) {
    this.winHeigth = windowInfo.innerHeight + 'px';
    this.winWidth = windowInfo.innerWidth + 'px';
    this.isDialogOpen = false;
    setTimeout(() => {
      this.codigoInput.nativeElement.focus();
    }, 0);
  }

  ngOnInit(): void {

    this.dataSource.data = this.itemList;
    this.createForm() 
    this.buscarPdvCategoria() 
    this.setPrecios();

    setTimeout(() => {
      this.isAuxiliar = this.data?.tabData?.data?.auxiliar;
    }, 0);

    this.tabService.tabChangedEvent.subscribe((res) => {
      if (this.data.active == true) {
        this.setFocusToCodigoInput();
      }
    });
    
  }

  setPrecios() {
    this.getMonedas.fetch(null, {errorPolicy: 'all'}).subscribe((res) => {
      if (res.errors==null) {
        this.monedas = res.data.data;
        this.cambioRs = this.monedas.find(
          (m) => m.denominacion == 'REAL'
        )?.cambio;
        this.cambioDs = this.monedas.find(
          (m) => m.denominacion == 'DOLAR'
        )?.cambio;
        this.cambioArg = this.monedas.find(
          (m) => m.denominacion == 'PESO ARG'
        )?.cambio;
        return true;
      }
    });
  }

  createForm() : boolean{
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null),
      codigo: new FormControl(null),
    });
    this.formGroup.get('cantidad').setValue(1);
    return true;
  }

  buscarPdvCategoria(){
    this.pdvCategoriaService.onGetCategorias().subscribe((res) => {
      if (res.errors==null) {
        this.pdvCategorias = res.data.data;
        this.selectedPdvCategoria = this.pdvCategorias[0];
        this.isCargandoPDV = false;
      } else {
        this.notificacionSnackbar.notification$.next({
          texto: 'No fue posible cargar categorias',
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
          texto: 'No fue posible cargar tipos de precios',
          color: NotificacionColor.warn,
          duracion: 3,
        });
      }
    });
  }

  onGridCardClick(pdvGruposProductos: PdvGruposProductos[], descripcion) {
    let productos: Producto[] = []
    pdvGruposProductos.forEach(e => {
      productos.push(e.producto)
    })
    this.dialog.open(SelectProductosDialogComponent, {
      data: {
        productos,
        descripcion
      }
    }).afterClosed().subscribe(res => {
      let respuesta: SelectProductosResponseData = res;
      if(res!=null){
        let item: VentaItem = new VentaItem();
        item.presentacion = respuesta.data.presentacion
        item.precio = respuesta.data.precio;
        item.producto = respuesta.producto;
        item.cantidad = respuesta.data.cantidad;
        this.addItem(item)
      }
    })
  }

  calcularTotales() {
    this.totalGs = 0;
    this.itemList.forEach((item) => {
      this.totalGs += Math.round(+item.cantidad * +item.precio.precio);
    });
  }

  onCodigoKeyUpEvent(key) {
    let texto: String = this.formGroup.get('codigo').value;
    switch (key) {
      case ' ':
      case '*':
      case '+':
      case '-':
      case 'Tab':
        if (texto != null && texto != ' ' && +texto > 0) {
          this.formGroup
            .get('cantidad')
            .setValue(+this.formGroup.get('codigo').value);
          this.formGroup.get('codigo').setValue(null);
        }
        break;
      case 'Enter':
        
        break;

      default:
        break;
    }
  }

  addItem(item: VentaItem, index?) {
    console.log(item.cantidad)
    let cantidad = item.cantidad;
    let item2 = new VentaItem;
    let presentacionCaja = item.producto.presentaciones.find(p => p.cantidad <= cantidad && p.tipoPresentacion.id == 2);
    if(presentacionCaja!=null){
      Object.assign(item2, item)
      item2.presentacion = presentacionCaja;
      item2.precio = item2.presentacion.precios.find(precio => precio?.principal == true)
      console.log(item, item2)
      if(item2.precio!=null){
        console.log(cantidad, '/', item2.presentacion.cantidad)
        let factor = Math.floor(cantidad / item2.presentacion.cantidad)
        let cantAux = item2.presentacion.cantidad * factor;
        item2.cantidad = factor;
        console.log('cantidad de caja', factor)
        console.log('cantidad a restar de las unidades', cantAux)
        cantidad -= cantAux;
        console.log('cantidad final para unidades', cantidad)
        item.cantidad = cantidad;
        console.log('cantidad final de caja', item2.cantidad)
        this.addItem(item2)
      }
    } else {
    }


    if(this.itemList.length>0 && index==null){
      index = this.itemList.findIndex(i => i.presentacion.id == item.presentacion.id && i.precio.precio == item.precio.precio);
    }
    if(index!=-1 && index!=null){
      console.log("encontro un index", index)
      this.itemList[index].cantidad += cantidad;
    } else {
      console.log("es nuevo")
      this.itemList.push(item)
    }
    this.calcularTotales();
    item.cantidad = cantidad;
    this.ultimoAdicionado.push(item);
    // this.ultimoAdicionado[this.ultimoAdicionado.length - 1].index =
    //   itemIndex > -1 ? itemIndex : this.itemList.length - 1;
    this.formGroup.get('codigo').setValue('');
    this.formGroup.get('cantidad').setValue(1);
    this.setFocusToCodigoInput();
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  removeItem(item: VentaItem) {
    // let ultAd = this.ultimoAdicionado[this.ultimoAdicionado.length - 1];
    // if (this.itemList.length > 0) {
    //   if (item != null) {
    //     let index = this.itemList.findIndex((il) => {
    //       if (il.presentacion.id == item.presentacion.id) {
    //         this.ultimoAdicionado.splice(
    //           this.ultimoAdicionado.findIndex((ul) => ul.numero == il.numero),
    //           1
    //         );
    //         return il;
    //       }
    //     });
    //     this.itemList.splice(index, 1);
    //   } else {
    //     let deleteIndex = this.itemList.findIndex(
    //       (il) => il.numero === ultAd.numero
    //     );
    //     if (this.itemList[deleteIndex].cantidad > ultAd.cantidad) {
    //       this.itemList[deleteIndex].cantidad =
    //         +this.itemList[deleteIndex].cantidad - ultAd.cantidad;
    //     } else {
    //       this.itemList.splice(deleteIndex, 1);
    //     }
    //     this.ultimoAdicionado.pop();
    //   }
    // }
    // this.setFocusToCodigoInput();
    // this.calcularTotales();
  }

  editItem(item: VentaItem) {
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
            this.removeItem(item);
            break;
          default:
            // let index = this.itemList.findIndex(
            //   (il) => il.numero == item.numero
            // );
            // this.removeItem(item);
            // if (item.caja) {
            //   this.formGroup.get('cantidad').setValue(res / item.unidadPorCaja);
            // } else {
            //   this.formGroup.get('cantidad').setValue(res);
            // }
            // if (item.tipoPrecio != null) {
            //   this.selectedTipoPrecio = item.tipoPrecio;
            // }
            // this.crearItem(item.producto, null, index);
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
      cantidad: this.formGroup.get('cantidad').value,
      texto: this.formGroup.get('codigo').value,
      selectedTipoPrecio: this.selectedTipoPrecio,
      tiposPrecios: this.tiposPrecios,
    };
    let ref = this.dialog.open(PdvSearchProductoDialogComponent, {
      data,
      autoFocus: false,
      restoreFocus: true,
    });
    this.formGroup.get('codigo').setValue(null);
    ref.afterClosed().subscribe((res) => {
      if (res != null) {
        let response: PdvSearchProductoResponseData = res;
        this.selectedTipoPrecio = response.tipoPrecio;
        this.formGroup.get('cantidad').setValue(response.cantidad);
        this.crearItem(response.producto);
      }
      this.isDialogOpen = false;
      this.setFocusToCodigoInput();
    });
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case 'Escape':
        break;
      case 'Enter':
        let codigo = this.formGroup.get('codigo').value;
        if (codigo != null && codigo != '') {
          this.buscarPorCodigo(codigo);
        } else if (!this.isDialogOpen) {
          this.onPagoClick();
        }
        break;
      case 'F9':
        this.buscarProductoDialog();
        break;
      default:
        break;
    }
  }

  buscarPorCodigo(texto: string) {
    let producto: Producto;
    if (texto == null || texto == ' ' || texto == '') return null;
    this.getProductoByCodigo
      .fetch({
        texto,
      })
      .subscribe((res) => {
        if (res.errors==null) {
          producto = res.data.data;
          if (producto != null) {
            this.isAudio ? this.beepService.beep() : null;
            console.log(producto)
            this.crearItem(producto, texto);
            this.formGroup.get('codigo').setValue(null);
          } else {
            this.buscarProductoDialog()
            // this.isAudio ? this.beepService.boop() : null;
            // this.notificacionSnackbar.notification$.next({
            //   texto: 'Producto no encontrado',
            //   color: NotificacionColor.warn,
            //   duracion: 3,
            // });
          }
        }
      });
  }

  crearItem(producto: Producto, texto?, index?) {
    let items: Item[] = [];
    let unidadPorCaja = producto.unidadPorCaja;
    let cantidadIngresada: number = this.formGroup.get('cantidad').value;
    let cantidadPorCaja: number;
    let unidadSobrantes = 0;
    let codigo: Codigo;
    let codigoPorUnidad: Codigo;
    let isOnlyCajas = false;
    let isCaja = false;
    let isPromocion = false;
    let isGarantia = false;

    if (texto == null) {
      texto = producto.codigos.find((c) => {
        // if (c.principal && c.caja != true) {
        //   return c;
        // }
      }).codigo;
    }

    // if (this.selectedTipoPrecio.id != 1) {
    //   codigo = producto.codigos.find(
    //     (c) => c?.tipoPrecio?.id == this.selectedTipoPrecio.id
    //   );
    //   let item: Item = {
    //     cantidad: cantidadIngresada * codigo.cantidad,
    //     precio: codigo.preciosPorSucursal.find(
    //       (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
    //     ).precio,
    //     producto,
    //     caja: codigo.caja,
    //     unidadPorCaja: codigo.cantidad,
    //     tipoPrecio: codigo?.tipoPrecio,
    //   };
    //   this.addItem(item, index);
    // } else {
    //   if (cantidadIngresada >= unidadPorCaja) {
    //     cantidadPorCaja = Math.floor(cantidadIngresada / unidadPorCaja);
    //     unidadSobrantes = cantidadIngresada - cantidadPorCaja * unidadPorCaja;
    //     cantidadIngresada = 0;
    //   }
    //   if (cantidadPorCaja > 0) {
    //     codigo = producto.codigos.find((c) => {
    //       if (c.caja && c.principal) {
    //         return c;
    //       }
    //     });
    //     let item: Item = {
    //       cantidad: cantidadPorCaja * codigo.cantidad,
    //       precio: codigo.preciosPorSucursal.find(
    //         (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
    //       ).precio,
    //       caja: true,
    //       producto,
    //       unidadPorCaja: codigo.cantidad,
    //       tipoPrecio: codigo?.tipoPrecio,
    //     };
    //     this.addItem(item, index);
    //   }
    //   if (unidadSobrantes > 0) {
    //     codigo = producto.codigos.find(
    //       (c) => c.codigo == unidadSobrantes + texto
    //     );
    //     if (codigo == null) {
    //       codigo = producto.codigos.find((c) => {
    //         if (c.principal && c.caja != true) {
    //           return c;
    //         }
    //       });
    //     }
    //     let item: Item = {
    //       cantidad: unidadSobrantes,
    //       producto,
    //       precio: codigo.preciosPorSucursal.find(
    //         (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
    //       ).precio,
    //       caja: false,
    //       tipoPrecio: codigo?.tipoPrecio,
    //     };
    //     this.addItem(item, index);
    //   } else {
    //     if (cantidadIngresada > 0) {
    //       codigo = producto.codigos.find((c) => {
    //         if (c.codigo == cantidadIngresada + texto) {
    //           cantidadIngresada = 1;
    //           return c;
    //         }
    //       });
    //       codigo == null
    //         ? (codigo = producto.codigos.find((c) => c.codigo == texto))
    //         : null;
    //       if (codigo == null) {
    //         codigo = producto.codigos.find((c) => {
    //           if (c.principal && c.caja != true) {
    //             return c;
    //           }
    //         });
    //       }
    //       if (codigo.referenciaCodigo != null) {
    //         codigo = producto.codigos.find(
    //           (c) => c.id == codigo.referenciaCodigo.id
    //         );
    //       }
    //       let item: Item = {
    //         cantidad: cantidadIngresada * codigo.cantidad,
    //         producto,
    //         precio: codigo.preciosPorSucursal.find(
    //           (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
    //         ).precio,
    //         caja: codigo.caja,
    //         unidadPorCaja: producto.unidadPorCaja,
    //         tipoPrecio: codigo?.tipoPrecio,
    //       };
    //       this.addItem(item, index);
    //     }
    //   }
    // }
  }

  setFocusToCodigoInput() {
    if (this.codigoInput != null && !this.isDialogOpen) {
      setTimeout(() => {
        this.codigoInput.nativeElement.focus();
      }, 1);
    }
  }

  cambiarTipoPrecio(tipo) {
    this.selectedTipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
  }

  pdvAuxiliarClick() {
    let auxIndex = this.tabService.tabs.findIndex(
      (t) => t.title == 'Venta Auxiliar'
    );
    let pdvIndex = this.tabService.tabs.findIndex(
      (t) => t.title == 'Venta Touch'
    );

    if (!this.isAuxiliar) {
      if (auxIndex != -1) {
        return this.tabService.setTabActive(auxIndex);
      }
      let data: PdvTouchData = {
        auxiliar: true,
        titulo: 'Venta Auxiliar',
      };
      return this.tabService.addTab(
        new Tab(
          VentaTouchComponent,
          'Venta Auxiliar',
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
    if(this.itemList?.length > 0){
      let ref = this.dialog
      .open(PagoTouchComponent, {
        autoFocus: false,
        restoreFocus: true,
        data: {
          valor: this.totalGs,
        },
        width: '100vw',
        height: '80vh',
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.resetForm();
        }
        this.isDialogOpen = false;
      });
    }
    
  }

  resetForm() {
    this.itemList = [];
    this.formGroup.controls.cantidad.setValue(1);
    this.formGroup.controls.codigo.setValue('');
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  onTicketClick() {
    //guardar la compra, si la compra se guardo con exito, imprimir ticket y resetForm()
    this.notificacionSnackbar.notification$.next({
      color: NotificacionColor.success,
      texto: 'Compra guardada con éxito',
      duracion: 2,
    });
    this.resetForm();
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
        width: '80vw',
        height: '90vh',
        panelClass: ['deliveryBackground'],
      })
      .afterClosed()
      .subscribe((resDialog) => {
        if (resDialog != null) {
          let vueltoId;
          let vueltoList: VueltoItemInput[] = resDialog['vueltoList'];
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
                  vueltoId = resVuelto.data['saveVuelto']['id'];
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
                        let deliveryInput : DeliveryInput = {
                          estado: DeliveryEstado.ABIERTO,
                          precioId: resDialog['deliveryInput']['precioId'],
                          telefono: resDialog['deliveryInput']['telefono'],
                          valor: resDialog['deliveryInput']['valor'],
                          direccion: resDialog['deliveryInput']['direccion'],
                          barrioId: resDialog['deliveryInput']['barrioId'],
                          vueltoId: resVuelto.data['saveVuelto']['id'],
                          entregadorId: resDialog['deliveryInput']['entregadorId'],
                          usuarioId: resDialog['deliveryInput']['usuarioId'],
                          vehiculoId: resDialog['deliveryInput']['vehiculoId'],
                          ventaId: resDialog['deliveryInput']['ventaId']
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
}
