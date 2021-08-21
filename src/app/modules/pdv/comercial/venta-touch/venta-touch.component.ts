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
import { DeliveryDialogComponent } from './delivery-dialog/delivery-dialog.component';
import { EditItemDialogComponent } from './edit-item-dialog/edit-item-dialog.component';
import { PagoTouchComponent } from './pago-touch/pago-touch.component';
import { PdvCategoriaFullInfoGQL } from './pdv-categoria/graphql/getCategoriaFullInfo';
import { PdvCategoria } from './pdv-categoria/pdv-categoria.model';
import { PdvGruposProductos } from './pdv-grupos-productos/pdv-grupos-productos.model';
import {
  ProductoCategoriaDialogComponent,
  ProductoCategoriaResponseData,
} from './producto-categoria-dialog/producto-categoria-dialog.component';

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

  displayedColumns = ['numero', 'descripcion', 'cantidad', 'precio', 'total'];
  dataSource = new MatTableDataSource<Item>();
  winHeigth;
  winWidth;
  totalGs = 0;
  cambioRs = 0;
  cambioDs = 0;
  cambioArg = 0;
  formGroup: FormGroup;
  selectedCategoria: PdvCategoria;
  categorias: PdvCategoria[] = [];
  ultimoAdicionado: Item[] = [];
  tiposPrecios: TipoPrecio[] = [];
  selectedTipoPrecio: TipoPrecio;
  itemList: Item[] = [];
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
    private getCategorias: PdvCategoriaFullInfoGQL,
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
    this.calcularTotales();
    this.createForm();
    this.buscarCategorias();
    this.buscarTiposPrecios();
    this.setPrecios();

    setTimeout(() => {
      this.isAuxiliar = this.data?.tabData?.data?.auxiliar;
    }, 0);

    this.tabService.tabChangedEvent.subscribe((res) => {
      if (this.data.active == true) {
        this.setFocusToCodigoInput();
      }
    });

    this.totalGs = 80000;

  }

  setPrecios() {
    this.getMonedas.fetch().subscribe((res) => {
      if (!res.errors) {
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
      }
    });
  }

  createForm() {
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null),
      codigo: new FormControl(null),
    });
    this.formGroup.get('cantidad').setValue(1);
  }

  buscarCategorias() {
    this.getCategorias.fetch().subscribe((res) => {
      if (!res.errors) {
        this.categorias = res.data.data;
        this.selectedCategoria = this.categorias[1];
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

  onGridCardClick(productos: PdvGruposProductos[]) {
    if (this.formGroup.get('codigo').value != null) {
      this.formGroup
        .get('cantidad')
        .setValue(this.formGroup.get('codigo').value);
    }
    this.formGroup.get('codigo').setValue(null);
    if (productos.length > 0) {
      this.isDialogOpen = true;
      let ref = this.dialog.open(ProductoCategoriaDialogComponent, {
        data: {
          productos,
          tipoPrecio: this.selectedTipoPrecio,
          cantidad: this.formGroup.get('cantidad').value,
          tiposPrecios: this.tiposPrecios,
        },
      });
      ref.afterClosed().subscribe((res: ProductoCategoriaResponseData) => {
        if (res) {
          this.selectedTipoPrecio = res.tipoPrecio;
          this.formGroup.get('cantidad').setValue(res.cantidad);
          this.crearItem(res.producto);
        }
        this.setFocusToCodigoInput();
        this.isDialogOpen = false;
      });
    } else {
      this.notificacionSnackbar.notification$.next({
        texto: 'No hay productos en este grupo',
        color: NotificacionColor.warn,
        duracion: 3,
      });
    }
  }

  calcularTotales() {
    this.totalGs = 0;
    this.itemList.forEach((item) => {
      this.totalGs += Math.round(+item.cantidad * +item.precio);
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
        } else if (texto.length > 0) {
          this.buscarProductoDialog();
        }
        break;
      case 'Enter':
        break;

      default:
        break;
    }
  }

  addItem(item: Item, index?) {
    let itemIndex = this.itemList.findIndex((i) => {
      if (
        i.producto.id == item.producto.id &&
        i.precio == item.precio &&
        item.caja == i.caja
      ) {
        return i;
      }
    });
    if (itemIndex > -1 && this.itemList[itemIndex].precio == item.precio) {
      this.itemList[itemIndex].cantidad =
        +this.itemList[itemIndex].cantidad + +item.cantidad;
      item.numero = this.itemList[itemIndex].numero;
    } else {
      item.numero = Math.random();
      item.tipoPrecio == this.selectedTipoPrecio;
      if (index != null) {
        this.itemList.splice(index, 0, item);
      } else {
        this.itemList.push(item);
      }
    }
    this.calcularTotales();
    this.ultimoAdicionado.push(item);
    // this.ultimoAdicionado[this.ultimoAdicionado.length - 1].index =
    //   itemIndex > -1 ? itemIndex : this.itemList.length - 1;
    this.formGroup.get('codigo').setValue('');
    this.formGroup.get('cantidad').setValue(1);
    this.setFocusToCodigoInput();
    this.selectedTipoPrecio = this.tiposPrecios[0];
  }

  removeItem(item: Item) {
    let ultAd = this.ultimoAdicionado[this.ultimoAdicionado.length - 1];
    if (this.itemList.length > 0) {
      if (item != null) {
        let index = this.itemList.findIndex((il) => {
          if (il.numero == item.numero) {
            this.ultimoAdicionado.splice(
              this.ultimoAdicionado.findIndex((ul) => ul.numero == il.numero),
              1
            );
            return il;
          }
        });
        this.itemList.splice(index, 1);
      } else {
        let deleteIndex = this.itemList.findIndex(
          (il) => il.numero === ultAd.numero
        );
        if (this.itemList[deleteIndex].cantidad > ultAd.cantidad) {
          this.itemList[deleteIndex].cantidad =
            +this.itemList[deleteIndex].cantidad - ultAd.cantidad;
        } else {
          this.itemList.splice(deleteIndex, 1);
        }
        this.ultimoAdicionado.pop();
      }
    }
    this.setFocusToCodigoInput();
    this.calcularTotales();
  }

  editItem(item: Item) {
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
            let index = this.itemList.findIndex(
              (il) => il.numero == item.numero
            );
            this.removeItem(item);
            if (item.caja) {
              this.formGroup.get('cantidad').setValue(res / item.unidadPorCaja);
            } else {
              this.formGroup.get('cantidad').setValue(res);
            }
            if (item.tipoPrecio != null) {
              this.selectedTipoPrecio = item.tipoPrecio;
            }
            this.crearItem(item.producto, null, index);
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
        if (!res.errors) {
          this.formGroup.get('codigo').setValue(null);
          producto = res.data.data;
          if (producto != null) {
            this.isAudio ? this.beepService.beep() : null;
            this.crearItem(producto, texto);
          } else {
            this.isAudio ? this.beepService.boop() : null;
            this.notificacionSnackbar.notification$.next({
              texto: 'Producto no encontrado',
              color: NotificacionColor.warn,
              duracion: 3,
            });
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
        if (c.principal && c.caja != true) {
          return c;
        }
      }).codigo;
    }

    if (this.selectedTipoPrecio.id != 1) {
      codigo = producto.codigos.find(
        (c) => c?.tipoPrecio?.id == this.selectedTipoPrecio.id
      );
      let item: Item = {
        cantidad: cantidadIngresada * codigo.cantidad,
        precio: codigo.preciosPorSucursal.find(
          (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
        ).precio,
        producto,
        caja: codigo.caja,
        unidadPorCaja: codigo.cantidad,
        tipoPrecio: codigo?.tipoPrecio,
      };
      this.addItem(item, index);
    } else {
      if (cantidadIngresada >= unidadPorCaja) {
        cantidadPorCaja = Math.floor(cantidadIngresada / unidadPorCaja);
        unidadSobrantes = cantidadIngresada - cantidadPorCaja * unidadPorCaja;
        cantidadIngresada = 0;
      }
      if (cantidadPorCaja > 0) {
        codigo = producto.codigos.find((c) => {
          if (c.caja && c.principal) {
            return c;
          }
        });
        let item: Item = {
          cantidad: cantidadPorCaja * codigo.cantidad,
          precio: codigo.preciosPorSucursal.find(
            (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
          ).precio,
          caja: true,
          producto,
          unidadPorCaja: codigo.cantidad,
          tipoPrecio: codigo?.tipoPrecio,
        };
        this.addItem(item, index);
      }
      if (unidadSobrantes > 0) {
        codigo = producto.codigos.find(
          (c) => c.codigo == unidadSobrantes + texto
        );
        if (codigo == null) {
          codigo = producto.codigos.find((c) => {
            if (c.principal && c.caja != true) {
              return c;
            }
          });
        }
        let item: Item = {
          cantidad: unidadSobrantes,
          producto,
          precio: codigo.preciosPorSucursal.find(
            (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
          ).precio,
          caja: false,
          tipoPrecio: codigo?.tipoPrecio,
        };
        this.addItem(item, index);
      } else {
        if (cantidadIngresada > 0) {
          codigo = producto.codigos.find((c) => {
            if (c.codigo == cantidadIngresada + texto) {
              cantidadIngresada = 1;
              return c;
            }
          });
          codigo == null
            ? (codigo = producto.codigos.find((c) => c.codigo == texto))
            : null;
          if (codigo == null) {
            codigo = producto.codigos.find((c) => {
              if (c.principal && c.caja != true) {
                return c;
              }
            });
          }
          if (codigo.referenciaCodigo != null) {
            codigo = producto.codigos.find(
              (c) => c.id == codigo.referenciaCodigo.id
            );
          }
          let item: Item = {
            cantidad: cantidadIngresada * codigo.cantidad,
            producto,
            precio: codigo.preciosPorSucursal.find(
              (pps) => pps.sucursal.id == this.mainService.sucursalActual.id
            ).precio,
            caja: codigo.caja,
            unidadPorCaja: producto.unidadPorCaja,
            tipoPrecio: codigo?.tipoPrecio,
          };
          this.addItem(item, index);
        }
      }
    }
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
      });
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
