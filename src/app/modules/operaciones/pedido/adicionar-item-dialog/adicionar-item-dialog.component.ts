import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Color } from "highcharts";
import {
  CurrencyMask,
  stringToCantidad,
  stringToDecimal,
  stringToInteger,
  stringToUnknown,
} from "../../../../commons/core/utils/numbersUtils";
import { MainService } from "../../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { PrecioPorSucursal } from "../../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { SeleccionarPresentacionDialogComponent } from "../../../productos/presentacion/seleccionar-presentacion-dialog/seleccionar-presentacion-dialog.component";
import {
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { CompraEstado } from "../../compra/compra-enums";
import { CompraItem } from "../../compra/compra-item.model";
import { CompraService } from "../../compra/compra.service";
import { MovimientoStockService } from "../../movimiento-stock/movimiento-stock.service";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { PedidoService } from "../pedido.service";

export class AdicionarPedidoItemDialog {
  pedido: Pedido;
  pedidoItem: PedidoItem;
}

@Component({
  selector: "app-adicionar-item-dialog",
  templateUrl: "./adicionar-item-dialog.component.html",
  styleUrls: ["./adicionar-item-dialog.component.scss"],
})
export class AdicionarItemDialogComponent implements OnInit {
  @ViewChild("productoInput", { static: false })
  productoInput: ElementRef;

  @ViewChild("cantidadInput", { static: false })
  cantidadInput: ElementRef;

  formGroup: FormGroup;

  productoControl = new FormControl(null, Validators.required);
  productoIdControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl("", Validators.required);
  existenciaControl = new FormControl();
  precioPorPresentacionControl = new FormControl(0);
  descuentoControl = new FormControl(0);
  costoMedioControl = new FormControl();
  precioUltimaCompra = new FormControl();
  precioPorUnidadControl = new FormControl(0);
  cantidadControl = new FormControl(null, Validators.required);
  cantidadUnidadControl = new FormControl(null, Validators.required);
  existencia = null;
  currencyMask = new CurrencyMask();
  selectedPedidoItem: PedidoItem;

  selectedProducto: Producto;
  selectedPresentacion: Presentacion;

  ultimasComprasList: CompraItem[];
  productoPrecios: PrecioPorSucursal[];

  historicoComprasdisplayedColumns = [
    "id",
    "proveedor",
    "precio",
    "cantidad",
    "accion",
  ];
  preciosdisplayedColumns = [
    "id",
    "tipoPrecio",
    "cantidad",
    "precio",
    "accion",
  ];
  preciosDataSource = new MatTableDataSource<PrecioPorSucursal>([]);
  historicoComprasDataSource = new MatTableDataSource<CompraItem>([]);

  isEditar = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPedidoItemDialog,
    private matDialogRef: MatDialogRef<AdicionarItemDialogComponent>,
    private productoService: ProductoService,
    private cargandoDialog: CargandoDialogService,
    private notificacionBar: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private mainService: MainService,
    private stockService: MovimientoStockService,
    private compraService: CompraService,
    private dialogoService: DialogosService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      id: this.productoIdControl,
      cantidad: this.cantidadControl,
      precio: this.precioPorPresentacionControl,
      descuento: this.descuentoControl,
      producto: this.productoControl,
      cantidadUnidad: this.cantidadUnidadControl,
      precioPorUnidad: this.precioPorUnidadControl,
    });

    if (this.data.pedidoItem != null) {
      this.cargarPedidoItem(this.data.pedidoItem);
    } else {
      console.log('nuevo pedido item')
    }
  }

  cargarPedidoItem(pedidoItem: PedidoItem) {
    this.isEditar = false;
    this.pedidoService.onGetPedidoItem(pedidoItem.id).subscribe((res) => {
      if (res != null) {
        this.selectedPedidoItem = new PedidoItem();
        Object.assign(this.selectedPedidoItem, res);
        this.cantidadControl.setValue(
          pedidoItem.cantidad / pedidoItem.presentacion.cantidad
        );
        this.cantidadUnidadControl.setValue(pedidoItem.cantidad);
        this.precioPorUnidadControl.setValue(pedidoItem.precioUnitario);
        this.precioPorPresentacionControl.setValue(
          (
            pedidoItem.precioUnitario * pedidoItem.presentacion.cantidad
          ).toFixed(0)
        );
        this.descuentoControl.setValue(pedidoItem.descuentoUnitario * pedidoItem.presentacion.cantidad);
        this.productoService
          .getProducto(pedidoItem.producto.id)
          .subscribe((res) => {
            if (res != null) {
              this.onSelectProducto(res);
              this.getInfoExtra();
            }
          });
        this.selectedPresentacion = pedidoItem.presentacion;
        this.formGroup.disable();
      }
    });
  }

  onSearchProductoById(id) {
    this.cargandoDialog.openDialog();
    this.productoService.getProducto(id).subscribe((res) => {
      this.cargandoDialog.closeDialog();
      if (res?.id != null) {
        this.onSelectProducto(res);
        this.matDialog
          .open(SeleccionarPresentacionDialogComponent, {
            data: {
              producto: res,
            },
            width: "60%",
            disableClose: false,
          })
          .afterClosed()
          .subscribe((res2) => {
            if (res2 != null) {
              this.selectedPresentacion = res2;
              this.getInfoExtra();
            }
          });
      } else {
        this.notificacionBar.notification$.next({
          texto: "Producto no encontrado",
          color: NotificacionColor.warn,
          duracion: 2,
        });
        this.onSelectProducto(null);
        this.selectedPresentacion = null;
      }
    });
  }

  onCodigoKeyup(key) {
    switch (key) {
      case "Enter":
        if (this.productoIdControl.value != null)
          this.onSearchProductoById(this.productoIdControl.value);
        break;
      default:
        break;
    }
  }

  onSelectProducto(producto: Producto) {
    if (producto != null) {
      this.selectedProducto = producto;
      this.productoIdControl.setValue(this.selectedProducto.id);
      this.productoControl.setValue(this.selectedProducto.descripcion);
    } else {
      this.selectedProducto = producto;
      this.productoIdControl.setValue(null);
      this.productoControl.setValue(null);
    }
  }

  getExistencia() {
    if (this.selectedProducto != null) {
      this.stockService
        .onGetStockPorProducto(this.selectedProducto.id)
        .subscribe((res) => {
          if (res != null) {
            this.existencia = res;
          }
        });
    } else {
      this.existencia = null;
    }
  }

  onSearchProducto() {
    let texto: string = this.productoControl.value;
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: texto.toUpperCase(),
        },
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          let response: PdvSearchProductoResponseData = res;
          this.onSelectProducto(response.producto);
          this.selectedPresentacion = response.presentacion;
          this.getInfoExtra();
        }
      });
  }

  getInfoExtra() {
    this.getExistencia();
    this.getListaPrecios();
    this.getHistorico();
    this.onGetCosto();
    this.cantidadInput.nativeElement.focus();
  }

  onInputFocus() {
    this.productoInput.nativeElement.select();
  }

  getHistorico() {
    let listaCompras: CompraItem[] = [];
    this.compraService
      .getItemPorProductoId(this.selectedProducto.id)
      .subscribe((res) => {
        if (res != null) {
          this.historicoComprasDataSource.data = res.filter(e => e.compra?.estado == CompraEstado.ACTIVO);
        }
      });
  }

  getListaPrecios() {
    let listaPrecios: PrecioPorSucursal[] = [];
    this.selectedProducto.presentaciones.forEach((p) => {
      p.precios.forEach((e) => {
        listaPrecios.push(e);
        e.presentacion = p;
      });
    });
    this.preciosDataSource.data = listaPrecios;
  }

  onProgramar(precio: PrecioPorSucursal) {}

  onGetCosto() {
    if (this.selectedProducto != null) {
      this.productoService
        .onGetProductoParaPedido(this.selectedProducto.id)
        .subscribe((res) => {
          if (res != null) {
            this.selectedProducto.costo = res.costo;
          }
        });
    } else {
      this.selectedProducto.costo = null;
    }
  }

  onCantidadFocusout() {
    if (
      this.selectedPresentacion != null &&
      this.cantidadControl.value != null &&
      this.cantidadControl.value > 0
    ) {
      this.cantidadUnidadControl.setValue(
        this.cantidadControl.value * this.selectedPresentacion.cantidad
      );
    }
  }

  onCantidadUnidadFocusout() {
    if (
      this.selectedPresentacion != null &&
      this.cantidadUnidadControl.value != null &&
      this.cantidadUnidadControl.value > 0
    ) {
      this.cantidadControl.setValue(
        this.cantidadUnidadControl.value / this.selectedPresentacion.cantidad
      );
    }
  }

  onPrecioPorPresentacionFocusout() {
    if (
      this.selectedPresentacion != null &&
      this.precioPorPresentacionControl.value != null &&
      this.precioPorPresentacionControl.value > 0
    ) {
      this.precioPorUnidadControl.setValue(
        (
          this.precioPorPresentacionControl.value /
          this.selectedPresentacion.cantidad
        ).toFixed(3)
      );
    }
  }

  onPrecioPorUnidadFocusout() {
    if (
      this.selectedPresentacion != null &&
      this.precioPorUnidadControl.value != null &&
      this.precioPorUnidadControl.value > 0
    ) {
      this.precioPorPresentacionControl.setValue(
        this.precioPorUnidadControl.value * this.selectedPresentacion.cantidad
      );
    }
  }

  onGuardar() {
    if (
      this.selectedProducto != null &&
      this.selectedPresentacion != null &&
      this.formGroup.valid
    ) {
      let precioUnidad: number = +this.precioPorUnidadControl.value;
      let precioPresentacion: number = +this.precioPorPresentacionControl.value;
      this.dialogoService
        .confirm("Confirmar acción:", null, null, [
          `Producto: ${this.selectedProducto.descripcion.toUpperCase()}`,
          `Presentacion: ${stringToCantidad(
            this.selectedPresentacion.cantidad.toFixed(3).toString()
          )}`,
          `Cantidad por unidad: ${stringToCantidad(
            (this.selectedPresentacion.cantidad * this.cantidadControl.value)
              .toFixed(3)
              .toString()
          )}`,
          `Cantidad por presentación: ${stringToCantidad(
            (+this.cantidadControl.value).toFixed(3).toString()
          )}`,
          `Precio por unidad: ${stringToInteger(
            precioUnidad.toFixed(0).toString()
          )}`,
          `Precio por presentación: ${stringToInteger(
            precioPresentacion.toFixed(0).toString()
          )}`,
        ])
        .subscribe((res) => {
          if (res) {
            let pedidoItem: PedidoItem = new PedidoItem();
            let descuentoTotal =
              this.descuentoControl.value * this.cantidadControl.value;
            if (this.selectedPedidoItem != null) {
              pedidoItem.id = this.selectedPedidoItem.id;
              pedidoItem.notaRecepcion = this.selectedPedidoItem.notaRecepcion;
            }
            pedidoItem.pedido = this.data.pedido;
            pedidoItem.producto = this.selectedProducto;
            pedidoItem.presentacion = this.selectedPresentacion;
            pedidoItem.precioUnitario = this.precioPorUnidadControl.value;
            pedidoItem.cantidad = this.cantidadUnidadControl.value;
            pedidoItem.valorTotal =
              pedidoItem?.precioUnitario * pedidoItem?.cantidad -
              descuentoTotal;
            pedidoItem.descuentoUnitario =
              this.descuentoControl.value / this.selectedPresentacion.cantidad;
            this.matDialogRef.close(pedidoItem);
          }
        });
    }
  }

  onEdit() {
    this.isEditar = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }
}
