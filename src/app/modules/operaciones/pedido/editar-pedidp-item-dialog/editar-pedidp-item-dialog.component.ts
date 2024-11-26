import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { Producto } from "../../../productos/producto/producto.model";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import {
  PedidoItem,
  PedidoItemMotivoModificacion,
  PedidoItemMotivoRechazo,
} from "../edit-pedido/pedido-item.model";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { BotonComponent } from "../../../../shared/components/boton/boton.component";
import { TransferenciaItemMotivoModificacion } from "../../transferencia/transferencia.model";
import { PedidoService } from "../pedido.service";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ProductoService } from "../../../productos/producto/producto.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { MatSelect } from "@angular/material/select";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";

export class EditarPedidpItemDialogData {
  pedido: Pedido;
  pedidoItem: PedidoItem;
  rechazar?: boolean;
  reabrir?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "editar-pedidp-item-dialog",
  templateUrl: "./editar-pedidp-item-dialog.component.html",
  styleUrls: ["./editar-pedidp-item-dialog.component.scss"],
})
export class EditarPedidpItemDialogComponent implements OnInit {
  @ViewChild("saveBtn", { read: BotonComponent }) saveBtn: BotonComponent;
  @ViewChild("codigoInput", { static: false }) codigoInput: ElementRef;
  @ViewChild("cantidadPresentacionInput", { static: false })
  cantidadPresentacionInput: ElementRef;
  @ViewChild("cantidadUnidadInput", { static: false })
  cantidadUnidadInput: ElementRef;
  @ViewChild("presentacionSelect", { static: false, read: MatSelect })
  presentacionSelect: MatSelect;

  pedidoItemFormGroup: FormGroup;
  productoIdControl = new FormControl(null);
  codigoControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null);
  presentacionControl = new FormControl(null);
  cantidadUnidadControl = new FormControl(null);
  cantidadPresentacionControl = new FormControl(null);
  formaPagoControl = new FormControl(null);
  precioPorPresentacionControl = new FormControl(null);
  precioUnitarioControl = new FormControl(null);
  monedaControl = new FormControl(null);
  descuentoPresentacionControl = new FormControl(null);
  valorTotalControl = new FormControl(null);
  motivoModificacionControl = new FormControl();
  motivoRechazoControl = new FormControl();
  obsControl = new FormControl(null);
  motivoModificacionList: string[] = Object.values(
    PedidoItemMotivoModificacion
  );
  motivoRechazoList: string[] = Object.values(PedidoItemMotivoRechazo);

  presentacionList: Presentacion[];
  selectedPedido: Pedido;
  selectedPedidoItem: PedidoItem;
  selectedProducto: Producto;
  selectedMoneda: Moneda;
  currencyMask = new CurrencyMask();
  isPesable = false;
  isRechazar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditarPedidpItemDialogData,
    private pedidoService: PedidoService,
    private matDialogRef: MatDialogRef<EditarPedidpItemDialogComponent>,
    private productoService: ProductoService,
    private matDialog: MatDialog,
    private dialogService: DialogosService
  ) {}

  ngOnInit() {
    if (this.data?.rechazar) {
      this.isRechazar = true;
    }

    if (this.data?.pedidoItem != null) {
      this.selectedPedidoItem = this.data.pedidoItem;
      this.cargarDatos(
        this.selectedPedidoItem.producto,
        this.selectedPedidoItem.presentacionCreacion
      );
      if (this.data?.reabrir) {
        this.selectedPedidoItem.cancelado = false;
        this.selectedPedidoItem.motivoRechazoRecepcionNota = null;
        this.selectedPedidoItem.obsRecepcionNota = null;
        this.motivoRechazoControl.setValue(null);
        this.obsControl.setValue(null);
        this.onSaveItem();
      }
    }

    this.presentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.cantidadPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.precioPorPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });

    this.descuentoPresentacionControl.valueChanges.subscribe((data) => {
      this.calcularTotal();
    });
  }

  cargarDatos(producto: Producto, presentacion: Presentacion) {
    if (this.selectedPedidoItem != null) {
      this.selectedMoneda = this.data.pedido.moneda;
      this.selectedProducto = producto;
      this.productoIdControl.setValue(this.selectedProducto.id);
      this.codigoControl.setValue(this.selectedProducto.descripcion);
      this.presentacionList = this.selectedProducto.presentaciones;
      this.presentacionControl.setValue(
        this.presentacionList.find((p) => p.id === presentacion.id)
      );
      this.cantidadPresentacionControl.setValue(
        this.selectedPedidoItem.cantidadCreacion || 0
      );
      this.precioUnitarioControl.setValue(
        producto?.costo?.ultimoPrecioCompra ||
          this.selectedPedidoItem.precioUnitarioCreacion ||
          0
      );
      this.descuentoPresentacionControl.setValue(
        this.selectedPedidoItem.descuentoUnitario *
          this.presentacionControl.value.cantidad || 0
      );
      this.motivoModificacionControl.setValue(
        this.selectedPedidoItem?.motivoModificacionRecepcionNota?.split(",") ||
          []
      );
      this.motivoRechazoControl.setValue(
        this.selectedPedidoItem?.motivoRechazoRecepcionNota?.split(",") || []
      );
      this.obsControl.setValue(this.data.pedidoItem?.obsRecepcionNota);
      this.calcularTotal();
      setTimeout(() => {
        this.codigoInput.nativeElement.select();
      }, 500);
    }
  }

  onSearchPorCodigo() {
    setTimeout(() => {
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
            this.onSelectProducto(res);
          } else {
            this.onAddItem(this.codigoControl.value);
          }
        });
      } else {
        this.onAddItem();
      }
    }, 100);
  }

  onSelectProducto(
    producto: Producto,
    presentacion?: Presentacion,
    openPresentacion = true
  ) {
    this.cargarDatos(producto, presentacion);
  }

  calcularTotal() {
    this.cantidadUnidadControl.setValue(
      this.presentacionControl.value.cantidad *
        this.cantidadPresentacionControl.value,
      { emitEvent: false }
    );
    this.precioPorPresentacionControl.setValue(
      (this.precioUnitarioControl.value || 0) *
        this.presentacionControl.value.cantidad,
      { emitEvent: false }
    );
    this.valorTotalControl.setValue(
      (this.precioPorPresentacionControl.value -
        this.descuentoPresentacionControl.value) *
        this.cantidadPresentacionControl.value,
      { emitEvent: false }
    );
  }

  onAddItem(texto?) {
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        let response: PdvSearchProductoResponseData = res;
        this.onSelectProducto(response.producto, response.presentacion);
      });
  }

  onCodigoFocus() {}
  onSaveItem() {
    let auxPedidoItem = new PedidoItem();
    Object.assign(auxPedidoItem, this.selectedPedidoItem);
    this.selectedPedidoItem = auxPedidoItem;
    this.selectedPedidoItem.producto = this.selectedProducto;
    this.selectedPedidoItem.presentacionCreacion =
      this.presentacionControl.value;
    this.selectedPedidoItem.cantidadCreacion =
      this.cantidadPresentacionControl.value;
    this.selectedPedidoItem.precioUnitarioCreacion =
      this.precioUnitarioControl.value;
    this.selectedPedidoItem.descuentoUnitarioCreacion =
      this.descuentoPresentacionControl.value /
      this.selectedPedidoItem.presentacionCreacion.cantidad;
    this.selectedPedidoItem.valorTotal =
      this.cantidadPresentacionControl.value *
      (this.precioPorPresentacionControl.value -
        this.descuentoPresentacionControl.value);
    this.selectedPedidoItem.motivoRechazoRecepcionNota =
      this.motivoRechazoControl.value;
    this.selectedPedidoItem.motivoModificacionRecepcionNota =
      this.motivoModificacionControl.value?.toString();
    this.selectedPedidoItem.obsRecepcionNota =
      this.obsControl.value?.toUpperCase();
    this.pedidoService
      .onSaveItem(this.selectedPedidoItem.toInput())
      .subscribe((pedidoItemRes) => {
        if (pedidoItemRes != null) {
          this.matDialogRef.close(pedidoItemRes);
        }
      });
  }

  onRechazarItem() {
    this.dialogService
      .confirm(
        "Atención!!",
        "Realmente desea cancelar este item?",
        "Esta acción se puede revertir"
      )
      .subscribe((res) => {
        if (res) {
          this.selectedPedidoItem.motivoRechazoRecepcionNota =
            this.motivoRechazoControl.value?.toString();
          this.selectedPedidoItem.obsRecepcionNota =
            this.obsControl.value?.toUpperCase();
          this.selectedPedidoItem.cancelado = true;
          this.onSaveItem();
        }
      });
  }

  onClearItem() {}
  onSalir() {
    this.matDialogRef.close();
  }
}
