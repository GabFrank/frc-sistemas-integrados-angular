import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { Producto } from "../../../productos/producto/producto.model";
import { PedidoItem } from "../edit-pedido/pedido-item.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { PedidoService } from "../pedido.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { forkJoin, map } from "rxjs";
import { BotonComponent } from "../../../../shared/components/boton/boton.component";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatSelect } from "@angular/material/select";
import { MatInput } from "@angular/material/input";

export interface DividirItemDialogData {
  pedidoItem: PedidoItem;
  pedido: Pedido;
  producto: Producto;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "dividir-item-dialog",
  templateUrl: "./dividir-item-dialog.component.html",
  styleUrls: ["./dividir-item-dialog.component.scss"],
})
export class DividirItemDialogComponent implements OnInit {
  @ViewChild("scrollContainer") private scrollContainer: ElementRef;
  @ViewChild("saveBtn", { read: BotonComponent }) saveBtn: BotonComponent;
  @ViewChildren("addBtn") addBtn: QueryList<MatIconButton>;
  @ViewChildren("presentacionSelect") presentacionSelect: QueryList<MatSelect>;
  @ViewChildren("cantidadPresentacionInput")
  cantidadPresentacionInput: QueryList<MatInput>;

  cantidadParcial = 0;
  cantidadPorUnidad = 0;
  precioTotal = 0;
  cantObservables = 0;

  codigoControl: FormControl[] = [
    new FormControl(null, Validators.required),
    new FormControl(null, Validators.required),
  ];
  descripcionControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  presentacionControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  cantidadUnidadControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  cantidadPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  formaPagoControl: FormControl[] = [
    new FormControl(null),
    new FormControl(null),
  ];
  precioPorPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  precioUnitarioControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];
  valorTotalControl: FormControl[] = [new FormControl(0), new FormControl(0)];
  descuentoPresentacionControl: FormControl[] = [
    new FormControl(0),
    new FormControl(0),
  ];

  //mascara para formatear los numeros a monedas
  currencyMask = new CurrencyMask();

  selectedPedidoItem: PedidoItem;
  presentacionList: Presentacion[];

  selectedPedido: Pedido;
  selectedProducto: Producto;

  cantItens = 2;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DividirItemDialogData,
    private productoService: ProductoService,
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<DividirItemDialogComponent>
  ) {}

  ngOnInit(): void {
    this.onCargarDatos();
  }

  onCargarDatos() {
    if (this.data?.pedido != null) {
      this.selectedPedido = this.data.pedido;
    }
    if (this.data?.pedidoItem != null) {
      this.selectedPedidoItem = this.data.pedidoItem;
    }

    this.productoService
      .getProducto(this.selectedPedidoItem.producto.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.onCargarItem();
        }
      });

    this.pedidoService
      .onGetPedidoInfoCompleta(this.selectedPedidoItem.pedido.id)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedPedido = res;
        }
      });
  }
  onCargarItem() {
    this.presentacionList = this.selectedProducto.presentaciones;
    this.codigoControl[0].setValue(
      this.selectedPedidoItem?.producto?.codigoPrincipal
    );
    this.descripcionControl[0].setValue(this.selectedProducto.descripcion);
    this.presentacionControl[0].setValue(
      this.presentacionList?.find(
        (p) => p.id === this.selectedPedidoItem.presentacionCreacion.id
      )
    );
    this.presentacionControl[1].setValue(this.presentacionControl[0].value);
    this.cantidadPresentacionControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion
    );
    this.cantidadUnidadControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad
    );
    this.cantidadPorUnidad = this.cantidadUnidadControl[0].value;

    this.precioPorPresentacionControl[0].setValue(
      this.selectedPedidoItem.precioUnitarioCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad
    );
    this.precioPorPresentacionControl[1].setValue(
      this.precioPorPresentacionControl[0].value
    );
    this.precioPorPresentacionControl[0].disable();
    this.precioPorPresentacionControl[1].disable();

    this.precioUnitarioControl[0].setValue(
      this.selectedPedidoItem.precioUnitarioCreacion
    );
    this.precioUnitarioControl[1].setValue(this.precioUnitarioControl[0].value);
    this.precioUnitarioControl[0].disable();
    this.precioUnitarioControl[1].disable();

    this.descuentoPresentacionControl[0].setValue(
      this.selectedPedidoItem.presentacionCreacion.cantidad *
        this.selectedPedidoItem?.descuentoUnitarioCreacion
    );
    this.descuentoPresentacionControl[1].setValue(
      this.descuentoPresentacionControl[0].value
    );
    this.descuentoPresentacionControl[0].disable();
    this.descuentoPresentacionControl[1].disable();

    this.valorTotalControl[0].setValue(
      this.selectedPedidoItem.cantidadCreacion *
        this.selectedPedidoItem.presentacionCreacion.cantidad *
        (this.selectedPedidoItem.precioUnitarioCreacion -
          this.selectedPedidoItem.descuentoUnitarioCreacion)
    );

    this.precioTotal = this.valorTotalControl[0].value;
    this.valorTotalControl[0].disable();
    this.valorTotalControl[1].disable();

    this.agregarObservables(0);
    this.agregarObservables(1);

    this.verificarCantidades();
  }

  verificarCantidades() {
    this.cantidadParcial = 0;
    this.cantidadUnidadControl.forEach((c) => {
      this.cantidadParcial = this.cantidadParcial + c.value;
    });

    if (this.cantidadParcial != this.cantidadPorUnidad) {
      this.cantidadPresentacionControl.forEach((c) => {
        c.markAsTouched();
        c.markAsDirty();
        c.setErrors({ error: true });
      });
    } else {
      this.cantidadPresentacionControl.forEach((c) => c.setErrors(null));
    }
  }

  agregarObservables(index: number) {
    this.presentacionControl[index].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cantidadUnidadControl[index].setValue(
            this.presentacionControl[index].value?.cantidad *
              this.cantidadPresentacionControl[index].value,
            { emitEvent: false }
          );
          this.valorTotalControl[index].setValue(
            (this.selectedPedidoItem.precioUnitarioCreacion -
              this.selectedPedidoItem.descuentoUnitarioCreacion) *
              this.cantidadUnidadControl[index].value
          );
          this.verificarCantidades();
        }
      });

    this.cantidadPresentacionControl[index].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.cantidadUnidadControl[index].setValue(
            this.presentacionControl[index].value?.cantidad *
              this.cantidadPresentacionControl[index].value,
            { emitEvent: false }
          );
          this.valorTotalControl[index].setValue(
            (this.selectedPedidoItem.precioUnitarioCreacion -
              this.selectedPedidoItem.descuentoUnitarioCreacion) *
              this.cantidadUnidadControl[index].value
          );
          this.verificarCantidades();
        }

        let nombre: string;
        nombre = null;
      });
  }

  onAddItem() {
    this.presentacionControl.push(
      new FormControl(this.presentacionControl[0].value)
    );
    this.cantidadPresentacionControl.push(new FormControl(0));
    this.cantidadUnidadControl.push(new FormControl(0));
    this.precioPorPresentacionControl.push(
      new FormControl(this.precioPorPresentacionControl[0].value)
    );
    this.precioPorPresentacionControl[
      this.presentacionControl.length - 1
    ].disable();
    this.precioUnitarioControl.push(
      new FormControl(this.precioUnitarioControl[0].value)
    );
    this.precioUnitarioControl[this.presentacionControl.length - 1].disable();
    this.descuentoPresentacionControl.push(
      new FormControl(this.descripcionControl[0].value)
    );
    this.descuentoPresentacionControl[
      this.presentacionControl.length - 1
    ].disable();
    this.valorTotalControl.push(new FormControl(0));
    this.valorTotalControl[this.presentacionControl.length - 1].disable();
    this.agregarObservables(this.presentacionControl.length - 1);
    this.scrollToBottom();
  }

  onDeleteItem(index) {
    this.presentacionControl.splice(index, 1);
    this.cantidadPresentacionControl.splice(index, 1);
    this.cantidadUnidadControl.splice(index, 1);
    this.precioPorPresentacionControl.splice(index, 1);
    this.precioUnitarioControl.splice(index, 1);
    this.descuentoPresentacionControl.splice(index, 1);
    this.valorTotalControl.splice(index, 1);
    this.verificarCantidades();
  }

  scrollToTop(): void {
    this.scrollContainer.nativeElement.scrollTop = 0;
  }

  scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  onGuardar() {
    let pedidoItemList: PedidoItem[] = [];
    let newPedidoItem = new PedidoItem();
    Object.assign(newPedidoItem, this.selectedPedidoItem);
    newPedidoItem.presentacionCreacion = this.presentacionControl[0].value;
    newPedidoItem.cantidadCreacion = this.cantidadPresentacionControl[0].value;
    newPedidoItem.valorTotal = this.valorTotalControl[0].value;
    pedidoItemList.push(newPedidoItem);
    this.cantidadPresentacionControl.forEach((value, index) => {
      if (this.cantidadPresentacionControl[index].value > 0 && index > 0) {
        let auxPedidoItem = new PedidoItem();
        Object.assign(auxPedidoItem, this.selectedPedidoItem);
        auxPedidoItem.id = null;
        auxPedidoItem.creadoEn = null;
        auxPedidoItem.usuarioCreacion = null;
        auxPedidoItem.notaRecepcion = null;
        auxPedidoItem.presentacionCreacion = this.presentacionControl[index].value;
        auxPedidoItem.cantidadCreacion = this.cantidadPresentacionControl[index].value;
        auxPedidoItem.valorTotal = this.valorTotalControl[index].value;
        pedidoItemList.push(auxPedidoItem);
      }
    });

    console.log(pedidoItemList);
    

    if (pedidoItemList?.length > 1) {
      const saveItemObservables = pedidoItemList.map((pi, index) =>
        this.pedidoService.onSaveItem(pi.toInput()).pipe(
          // Map each response back to its index
          map((response) => ({ index, response }))
        )
      );
    
      forkJoin(saveItemObservables).subscribe({
        next: (responses) => {
          // Update pedidoItemList with the responses at the correct index
          responses.forEach(({ index, response }) => {
            pedidoItemList[index] = response;
          });
          this.dialogRef.close(pedidoItemList);
        },
        error: (err) => {
          console.error("Error saving items", err);
          // Handle errors if necessary
        }
      });
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onCantidadPresentacionEnter(index: number) {
    if (index == this.presentacionControl.length - 1) {
      if (this.cantidadParcial != this.cantidadPorUnidad) {
        this.addBtn.last._elementRef.nativeElement.focus();
      } else {
        this.saveBtn.btn.focus();
      }
    }
  }

  onPresentacionChange(index) {
    // this.presentacionSelect.get(index).close();
    // this.cantidadPresentacionInput.get(index).focus();
  }
}
