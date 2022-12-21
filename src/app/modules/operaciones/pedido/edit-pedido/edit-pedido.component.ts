import {
  animate, state,
  style,
  transition, trigger
} from "@angular/animations";
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, Subscription } from "rxjs";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Moneda } from "../../../../modules/financiero/moneda/moneda.model";
import { Proveedor } from "../../../../modules/personas/proveedor/proveedor.model";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Vendedor } from "../../../personas/vendedor/vendedor.model";
import { VendedorService } from "../../../personas/vendedor/vendedor.service";
import { AdicionarDetalleCompraItemDialogComponent } from "../../compra/adicionar-detalle-compra-item-dialog/adicionar-detalle-compra-item-dialog.component";
import { CompraEstado } from "../../compra/compra-enums";
import { CompraItem } from "../../compra/compra-item.model";
import { Compra } from "../../compra/compra.model";
import { CompraService } from "../../compra/compra.service";
import { AdicionarItemDialogComponent } from "../adicionar-item-dialog/adicionar-item-dialog.component";
import {
  AdicionarNotaRecepcionDialogComponent
} from "../nota-recepcion/adicionar-nota-recepcion-dialog/adicionar-nota-recepcion-dialog.component";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { NotaRecepcionService } from "../nota-recepcion/nota-recepcion.service";
import { PedidoService } from "../pedido.service";
import { PedidoEstado } from "./pedido-enums";
import { PedidoItem } from "./pedido-item.model";
import { Pedido } from "./pedido.model";

export interface Transaction {
  item: string;
  cost: number;
}

import { MatDatepicker } from "@angular/material/datepicker";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AdicionarProveedorDialogComponent } from "../../../personas/proveedor/adicionar-proveedor-dialog/adicionar-proveedor-dialog.component";
import { MatSelect } from "@angular/material/select";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-edit-pedido",
  templateUrl: "./edit-pedido.component.html",
  styleUrls: ["./edit-pedido.component.scss"],
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
export class EditPedidoComponent implements OnInit {
  @ViewChild("stepper", { static: false }) stepper: MatStepper;
  isVuelto = false;

  @Input()
  data;

  @ViewChild("proveedorInput", { static: false })
  proveedorInput: ElementRef;

  @ViewChild("plazoInput", { static: false })
  plazoInput: ElementRef;

  @ViewChild("fechaInput", { static: false })
  fechaInput: ElementRef;

  @ViewChild("vendedorInput", { static: false })
  vendedorInput: MatSelect;

  @ViewChild("formaPagoInput", { static: false })
  formaPagoInput: MatSelect;

  @ViewChild("monedaInput", { static: false })
  monedaInput: MatSelect;

  @ViewChild("picker", { static: false })
  calendar: MatDatepicker<any>;

  detalleForm: FormGroup = new FormGroup({});

  idControl = new FormControl();
  vendedorControl = new FormControl();
  proveedorControl = new FormControl(null, Validators.required);
  fechaEntregaControl = new FormControl();
  formaPagoControl = new FormControl();
  estadoControl = new FormControl(PedidoEstado.ABIERTO);
  monedaControl = new FormControl();
  plazoCreditoControl = new FormControl(8);
  descuentoControl = new FormControl(0);
  creadoEnControl = new FormControl();
  usuarioControl = new FormControl();
  creditoControl = new FormControl(true);

  selectedPedido: Pedido;
  selectedProveedor: Proveedor;
  selectedVendedor: Vendedor;
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;
  selectedUsuario: Usuario;

  proveedorList: Proveedor[];
  proveedorSub: Subscription;
  proveedorTimer;

  vendedorList: Vendedor[];
  vendedorSub: Subscription;
  vendedorTimer;

  formaPagoList: FormaPago[];
  formaPagoSub: Subscription;
  formaPagoTimer;

  monedaList: Moneda[];
  monedaSub: Subscription;
  monedaTimer;

  descuentoItem = 0;
  descuentoGeneral = 0;
  valorTotal = 0;

  //table
  columnsToDisplay = [
    "producto",
    "presentacion",
    "cantidad",
    "precioUnitario",
    "descuentoUnitario",
    "valorTotal",
    "acciones",
  ];
  dataSource = new MatTableDataSource<PedidoItem>([]);
  expandedPedidoItem: PedidoItem | null;
  valorParcial = 0;

  //table nota recepcion
  columnsToDisplayNotaRecepcion = [
    "id",
    "tipo",
    "numero",
    "valor",
    "descuento",
    "valorFinal",
    "cantItens",
    "responsable",
    "acciones",
  ];

  columnsToDisplayMercaderiaRecepcion = [
    "id",
    "tipo",
    "numero",
    "valor",
    "valorFinal",
    "cantItens",
    "acciones",
  ];
  dataSourceNotaRecepcion = new MatTableDataSource<NotaRecepcion>([]);
  expandedNotaRecepcion: NotaRecepcion | null;

  isEditar = false;

  selectedCompra: Compra;
  compraItemList: CompraItem[];
  selectedCompraItem: CompraItem;

  constructor(
    private proveedorService: ProveedorService,
    private vendedorService: VendedorService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService,
    private matDialog: MatDialog,
    private pedidoService: PedidoService,
    private dialogoService: DialogosService,
    private notaRecepcionService: NotaRecepcionService,
    private compraService: CompraService,
    private cargandoDialog: CargandoDialogService
  ) { }

  ngOnInit(): void {
    this.createDetalleForm();
    this.monedaControl.disable();
    this.proveedorList = [];
    this.vendedorList = [];
    this.formaPagoList = [];
    this.monedaList = [];

    this.formaPagoService.onGetAllFormaPago().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.formaPagoList = res;
        if (this.formaPagoList.length > 0) {
          this.onFormaPagoSelect(
            this.formaPagoList.find((f) => f.descripcion == "EFECTIVO")
          );
        }
      }
    });

    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.monedaList = res;
        if (this.monedaList.length > 0) {
          this.onMonedaSelect(
            this.monedaList.find((f) => f.denominacion == "GUARANI")
          );
        }
      }
    });

    this.proveedorSub = this.proveedorControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res == "") this.selectedProveedor = null;
      if (this.proveedorTimer != null) {
        clearTimeout(this.proveedorTimer);
      }
      if (res != null && res.length != 0) {
        this.proveedorTimer = setTimeout(() => {
          this.proveedorService.onSearch(res).pipe(untilDestroyed(this)).subscribe((response) => {
            this.proveedorList = response;
            if (this.proveedorList.length == 1) {
              this.onProveedorSelect(this.proveedorList[0]);
              this.onProveedorAutocompleteClose();
            } else {
              this.onProveedorAutocompleteClose();
              this.onProveedorSelect(null);
            }
          });
        }, 500);
      } else {
        this.proveedorList = [];
      }
    });


    if (this.data?.tabData != null) {
      this.cargarPedido(+this.data?.tabData["data"].id);
    } else {
      console.log("nuevo pedido");
    }

    setTimeout(() => {
      this.proveedorInput.nativeElement.focus();
    }, 1000);
  }

  cargarPedido(id) {
    this.cargandoDialog.openDialog();
    this.dataSource.data = [];
    this.pedidoService.onGetPedidoInfoCompleta(id).pipe(untilDestroyed(this)).subscribe((res) => {
      this.isEditar = true;
      if (res != null) {
        console.log(res);
        this.selectedPedido = new Pedido();
        Object.assign(this.selectedPedido, res);
        this.onProveedorSelect(this.selectedPedido.proveedor);
        this.onMonedaSelect(this.selectedPedido.moneda);
        this.onFormaPagoSelect(this.selectedPedido.formaPago);
        this.creditoControl.setValue(this.selectedPedido.plazoCredito > 1);
        this.plazoCreditoControl.setValue(this.selectedPedido.plazoCredito);
        this.fechaEntregaControl.setValue(this.selectedPedido.fechaDeEntrega);
        this.selectedPedido.pedidoItens.forEach((p) => {
          this.addItem(p);
        });
        this.detalleForm.disable();
        console.log(res);
        this.notaRecepcionService
          .onGetNotaRecepcionPorPedidoId(this.selectedPedido.id).pipe(untilDestroyed(this))
          .subscribe((res2) => {
            console.log(res2);
            if (res != null) {
              console.log(res2);
              this.dataSourceNotaRecepcion.data = res2;
            }
          });
        this.cargandoDialog.closeDialog();
      }
    });
  }

  createDetalleForm() {
    this.detalleForm = new FormGroup({
      id: this.idControl,
      vendedor: this.vendedorControl,
      proveedor: this.proveedorControl,
      fechaEntrega: this.fechaEntregaControl,
      formaPago: this.formaPagoControl,
      estado: this.estadoControl,
      plazoCredito: this.plazoCreditoControl,
      descuento: this.descuentoControl,
      creadoEn: this.creadoEnControl,
      usuario: this.usuarioControl,
    });
  }

  onProveedorSelect(e: Proveedor) {
    if (e?.id != null) {
      this.selectedProveedor = e;
      this.proveedorControl.setValue(
        this.selectedProveedor?.id +
        " - " +
        this.selectedProveedor?.persona?.nombre
      );
      if (e?.vendedores != null) {
        this.vendedorList = e.vendedores;
        this.proveedorInput.nativeElement.select();
      }
      setTimeout(() => {
        let formaPago = this.formaPagoList.find(fp => fp.descripcion == 'CHEQUE');
        if (this.selectedProveedor?.credito == true) this.onFormaPagoSelect(formaPago);
        if (this.selectedProveedor?.chequeDias != null) this.plazoCreditoControl.setValue(this.selectedProveedor.chequeDias)
      }, 1000);
    }
  }

  onProveedorAutocompleteClose() {
    setTimeout(() => {
      this.proveedorInput.nativeElement.select();
    }, 100);
  }

  onFormaPagoSelect(e: FormaPago) {
    if (e?.id != null) {
      this.selectedFormaPago = e;
      this.formaPagoControl.setValue(this.selectedFormaPago.id);
    }
  }

  onMonedaSelect(e: Moneda) {
    if (e?.id != null) {
      this.selectedMoneda = e;
      this.monedaControl.setValue(this.selectedMoneda.id);
    }
  }

  onAdicionar() {
    if (this.selectedPedido == null) {
      this.onGuardar().pipe(untilDestroyed(this)).subscribe((res) => {
        if (res) {
          this.matDialog
            .open(AdicionarItemDialogComponent, {
              data: {
                pedido: this.selectedPedido,
              },
              // maxWidth: '100vw',
              // maxHeight: '100vh',
              height: '80%',
              width: '100%',
              // panelClass: 'full-screen-modal',
              disableClose: false,
            })
            .afterClosed().pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res != null) {
                this.updateItem(res);
              }
            });
        }
      });
    } else {
      this.matDialog
        .open(AdicionarItemDialogComponent, {
          data: {
            pedido: this.selectedPedido,
          },
          width: "100%",
          height: "70%",
          disableClose: false,
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.updateItem(res);
          }
        });
    }
  }

  addItem(pedidoItem: PedidoItem, index?: number) {
    this.dataSource.data = updateDataSource(this.dataSource.data, pedidoItem);
  }

  updateItem(pedidoItem: PedidoItem) {
    this.cargandoDialog.openDialog()
    let index;
    if (pedidoItem?.id != null) {
      index = this.dataSource.data.findIndex((e) => e.id == pedidoItem.id);
    }
    this.pedidoService.onSaveItem(pedidoItem.toInput()).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        pedidoItem.id = res.id;
        pedidoItem.compraItem = res.compraItem;
        if (index != -1) {
          this.dataSource.data = updateDataSource(this.dataSource.data, pedidoItem, index);
        } else {
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            pedidoItem
          );
        }
        this.cargandoDialog.closeDialog()
      }
    });
  }

  onGuardar(): Observable<boolean> {
    return new Observable((obs) => {
      let pedido = new Pedido();
      if (this.selectedPedido != null) {
        pedido.id = this.selectedPedido.id;
        pedido.usuario = this.selectedPedido.usuario;
        pedido.creadoEn = this.selectedPedido.creadoEn;
      }
      pedido.proveedor = this.selectedProveedor;
      pedido.descuento = this.descuentoControl.value + this.descuentoItem;
      pedido.fechaDeEntrega = this.fechaEntregaControl.value;
      pedido.formaPago = this.selectedFormaPago;
      pedido.moneda = this.selectedMoneda;
      pedido.pedidoItens = this.dataSource.data;
      pedido.plazoCredito = this.plazoCreditoControl.value;
      pedido.valorTotal = this.valorTotal;
      pedido.vendedor = this.selectedVendedor;
      pedido.pedidoItens = this.dataSource.data;
      pedido.estado = PedidoEstado.ABIERTO;
      this.pedidoService.onSave(pedido.toInput()).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          pedido.id = res.id;
          this.selectedPedido = pedido;
          obs.next(true);
        } else {
          obs.next(false);
        }
      });
    });
  }

  onEditar() {
    this.isEditar = false;
    this.detalleForm.enable();
  }

  goTo(text) {
    switch (text) {
      case "detalle-pedido":
        this.stepper.selectedIndex = 0;
        break;

      case "recepcion-nota":
        if (this.selectedPedido.estado == PedidoEstado.ABIERTO && this.dataSource.data.length > 0) {
          this.dialogoService
            .confirm("Iniciar recepción de nota?", null).pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                this.selectedPedido.estado = PedidoEstado.EN_RECEPCION_NOTA;
                this.pedidoService
                  .onSave(this.selectedPedido.toInput()).pipe(untilDestroyed(this))
                  .subscribe((res) => {
                    let compra = new Compra();
                    compra.estado = CompraEstado.PRE_COMPRA;
                    compra.pedido = this.selectedPedido;
                    compra.proveedor = this.selectedPedido.proveedor;
                    this.compraService
                      .onSaveCompra(compra.toInput()).pipe(untilDestroyed(this))
                      .subscribe((res2) => {
                        console.log(res2);
                        if (res2 != null) {
                          this.cargandoDialog.closeDialog();
                          this.selectedPedido.compra = res2;
                          this.goTo("recepcion-nota");
                        }
                      });
                  });
              }
            });
        }
        if (
          this.selectedPedido != null &&
          this.dataSource.data.length > 0 &&
          (this.selectedPedido.estado == PedidoEstado.EN_RECEPCION_NOTA ||
            this.selectedPedido.estado == PedidoEstado.EN_RECEPCION_MERCADERIA)
        ) {
          this.stepper.selectedIndex = 1;
        }
        break;
      case "recepcion-mercaderia":
        if (this.selectedPedido.estado == PedidoEstado.EN_RECEPCION_NOTA) {
          this.cargandoDialog.openDialog();
          this.dialogoService
            .confirm("Iniciar recepción de mercaderia?", null).pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                this.selectedPedido.estado =
                  PedidoEstado.EN_RECEPCION_MERCADERIA;
                this.pedidoService.onSave(this.selectedPedido.toInput()).pipe(untilDestroyed(this)).subscribe(res2 => {
                  if (res2 !== null) {
                    this.cargandoDialog.closeDialog();
                    this.stepper.selectedIndex = 2;
                  }
                })
              }
            });
        } else if (this.selectedPedido.estado >= PedidoEstado.EN_RECEPCION_MERCADERIA) {
          this.stepper.selectedIndex = 2;
        }

        break;

      case "detalle-compra":
        if (
          this.dataSource.data.length - this.getCantidadItensVerificados() ==
          0
        ) {
        }
        break;

      default:
        break;
    }
  }

  openItem(pedidoItem: PedidoItem) {
    if (this.selectedPedido != null || true) {
      this.matDialog
        .open(AdicionarItemDialogComponent, {
          data: {
            pedido: this.selectedPedido,
            pedidoItem,
          },
          width: "100%",
          height: "70%",
          disableClose: false,
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.updateItem(res);
          }
        });
    }
  }

  deleteItem(pedidoItem: PedidoItem) {
    let index = this.dataSource.data.findIndex((i) => i == pedidoItem);
    this.pedidoService.onDeletePedidoItem(pedidoItem.id).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res == true) {
        if (index != -1) {
          let arr: PedidoItem[] = this.dataSource.data;
          arr.splice(index, 1);
          this.dataSource.data = [];
          arr.forEach((e) => {
            this.addItem(e);
          });
        }
      }
    });
  }

  getCantidadItensCargados(): number {
    let cantidad = 0;
    this.dataSourceNotaRecepcion.data.forEach((e) => {
      if (e.pedidoItemList != null) {
        e.pedidoItemList.forEach((n) => {
          cantidad += 1;
        });
      }
    });
    return cantidad;
  }

  getCantidadItensVerificados(): number {
    let cantidad = 0;
    this.dataSourceNotaRecepcion.data.forEach((e) => {
      if (e.pedidoItemList != null) {
        e.pedidoItemList.forEach((n) => {
          if (n.compraItem.verificado == true) {
            cantidad++;
          }
        });
      }
    });
    return cantidad;
  }

  getValorTotal(): number {
    let valor = 0;
    this.dataSource.data.forEach((n) => {
      valor += (n.precioUnitario - n.descuentoUnitario) * n.cantidad;
    });
    return valor;
  }

  getDescuento(): number {
    let valor = 0;
    this.dataSource.data.forEach((n) => {
      valor += n.descuentoUnitario * n.cantidad;
    });
    return valor;
  }

  onAdicionarNotaPedido() {
    console.log(this.selectedPedido);
    this.matDialog
      .open(AdicionarNotaRecepcionDialogComponent, {
        data: {
          pedido: this.selectedPedido,
        },
        width: "100%",
        height: "70%",
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cargarPedido(this.selectedPedido.id);
        }
      });
  }

  openNotaRecepcion(notaRecepcion: NotaRecepcion, i) {
    if (this.selectedPedido != null) {
      this.matDialog
        .open(AdicionarNotaRecepcionDialogComponent, {
          data: {
            notaRecepcion,
            pedido: this.selectedPedido,
          },
          width: "100%",
          height: "70%",
          disableClose: true,
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.cargarPedido(this.selectedPedido.id);
          }
        });
    }
  }

  deleteItemNotaRecepcion(nota, i) { }

  crearCompraItem(item: PedidoItem): CompraItem {
    let compraItem = new CompraItem();
    compraItem.compra = this.selectedPedido.compra;
    compraItem.pedidoItem = item;
    compraItem.cantidad = item.cantidad;
    compraItem.precioUnitario = item.precioUnitario;
    compraItem.producto = item.producto;
    compraItem.presentacion = item.presentacion;
    compraItem.descuentoUnitario = item.descuentoUnitario;
    compraItem.bonificacion =
      item.precioUnitario == 0 ||
      item.precioUnitario.toFixed(0) == item.descuentoUnitario.toFixed(0);
    return compraItem;
  }

  onConfirmarItem(item: PedidoItem, pedidoItemIndex, notaRecepcionIndex) {
    this.cargandoDialog.openDialog();
    let compraItem = new CompraItem();
    Object.assign(compraItem, item.compraItem);
    compraItem.verificado = true;
    this.compraService
      .onSaveCompraItem(compraItem.toInput()).pipe(untilDestroyed(this))
      .subscribe((res) => {
        console.log(res);
        this.cargandoDialog.closeDialog();
        if (res != null) {
          item.compraItem.verificado = true;
          let notaRecepcion =
            this.dataSourceNotaRecepcion.data[notaRecepcionIndex];
          notaRecepcion.pedidoItemList[pedidoItemIndex] = item;
          this.dataSourceNotaRecepcion.data = updateDataSource(
            this.dataSourceNotaRecepcion.data,
            notaRecepcion,
            notaRecepcionIndex
          );
        }
      });
  }

  onModificarItem(item: PedidoItem, pedidoItemIndex, notaRecepcionIndex) {
    // let compraItem = new CompraItem();
    // if (item?.compraItem?.id != null) {
    //   compraItem.id = item.compraItem.id;
    // }
    // compraItem.compra = this.selectedPedido.compra;
    // compraItem.pedidoItem = item;
    // compraItem.cantidad = item.cantidad;
    // compraItem.precioUnitario = item.precioUnitario;
    // compraItem.producto = item.producto;
    // compraItem.presentacion = item.presentacion;
    // compraItem.descuentoUnitario = item.descuentoUnitario;
    // compraItem.bonificacion =
    //   item.precioUnitario == 0 ||
    //   item.precioUnitario.toFixed(0) == item.descuentoUnitario.toFixed(0);
    // item.compraItem = compraItem;
    this.matDialog
      .open(AdicionarDetalleCompraItemDialogComponent, {
        data: {
          compraItem: item.compraItem,
          pedidoItem: item,
          modificarPrecio: false
        },
        width: "100%",
        disableClose: true,
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (res != null) {
            item.compraItem = res;
            let notaRecepcion =
              this.dataSourceNotaRecepcion.data[notaRecepcionIndex];
            notaRecepcion.pedidoItemList[pedidoItemIndex] = item;
            console.log(notaRecepcion);
            this.dataSourceNotaRecepcion.data = updateDataSource(
              this.dataSourceNotaRecepcion.data,
              notaRecepcion,
              notaRecepcionIndex
            );
          }
        }
      });
  }

  onAddProveedor() {
    this.matDialog.open(AdicionarProveedorDialogComponent, {
      width: '50%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.onProveedorSelect(res)
      }
    })
  }

  openCalendar() {
    this.calendar.open()
  }

  onProveedorEnter() {
    this.vendedorInput.focus()
  }

  onVendedorEnter() {
    this.vendedorInput.close()
    this.formaPagoInput.focus()
  }

  onFormaPagoEnter(){
    this.monedaInput.focus()
  }

  onMonedaEnter() {
    this.plazoInput.nativeElement.select()
  }

  onPlazoEnter() {
    this.fechaInput.nativeElement.select()
  }

  onFechaEntregaEnter() {

  }
}
