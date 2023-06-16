import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CurrencyMask } from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PedidoItem } from "../../pedido/edit-pedido/pedido-item.model";
import { CompraItemEstado } from "../compra-enums";
import { CompraItem } from "../compra-item.model";
import { CompraService } from "../compra.service";

class AdicionarDetalleCompraItemDialogData {
  compraItem: CompraItem;
  pedidoItem: PedidoItem;
  modificarPrecio?: boolean
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-adicionar-detalle-compra-item-dialog",
  templateUrl: "./adicionar-detalle-compra-item-dialog.component.html",
  styleUrls: ["./adicionar-detalle-compra-item-dialog.component.scss"],
})
export class AdicionarDetalleCompraItemDialogComponent implements OnInit {
  @ViewChild("cantidadPorUnidadInput", { static: false })
  cantidadPorUnidadInput: ElementRef;

  @ViewChild("cantidadPorPresentacionInput", { static: false })
  cantidadPorPresentacionInput: ElementRef;

  @ViewChild("vencimientoInput", { static: false })
  vencimientoInput: ElementRef;

  @ViewChild("loteInput", { static: false })
  loteInput: ElementRef;

  @ViewChild('guardarBtn', { static: false, read: MatButton })
  guardarBtn: MatButton;

  selectedCompraItem = new CompraItem;
  cantidadPorUnidadControl = new FormControl(null, Validators.required);
  cantidadPorPresentacionControl = new FormControl(null, Validators.required);
  precioPorUnidadControl = new FormControl(null, Validators.required);
  precioPorPresentacionControl = new FormControl(null, Validators.required);
  descuentoPorUnidadControl = new FormControl(null, Validators.required);
  descuentoPorPresentacionControl = new FormControl(null, Validators.required);
  vencimientoControl = new FormControl();
  loteControl = new FormControl();
  currencyMask = new CurrencyMask;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarDetalleCompraItemDialogData,
    private matDialogRef: MatDialogRef<AdicionarDetalleCompraItemDialogComponent>,
    private compraService: CompraService,
    private cargandoDialog: CargandoDialogService
  ) {}

  ngOnInit(): void {
    if (this.data.compraItem != null) {
      this.cargarDatos(this.data.compraItem);
    }
  }

  cargarDatos(compraItem: CompraItem) {
    Object.assign(this.selectedCompraItem, compraItem)
    this.cantidadPorUnidadControl.setValue(this.selectedCompraItem.cantidad);
    this.cantidadPorPresentacionControl.setValue(
      this.selectedCompraItem.cantidad /
        this.selectedCompraItem.presentacion.cantidad
    );
    this.vencimientoControl.setValue(this.selectedCompraItem.vencimiento);
    this.loteControl.setValue(this.selectedCompraItem.lote);
  }

  onGuardar() {
    this.cargandoDialog.openDialog()
    this.selectedCompraItem.cantidad = this.cantidadPorUnidadControl.value
    this.selectedCompraItem.vencimiento = this.vencimientoControl.value
    this.selectedCompraItem.lote = this.loteControl.value
    if(this.onComparar(this.selectedCompraItem, this.data.pedidoItem)){
      this.selectedCompraItem.estado = CompraItemEstado.MODIFICADO
    } else {
      this.selectedCompraItem.estado = CompraItemEstado.SIN_MODIFICACIONN
    }
    this.selectedCompraItem.verificado = false;
    this.compraService.onSaveCompraItem(this.selectedCompraItem.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
      this.cargandoDialog.closeDialog()
      if(res!=null){
        this.matDialogRef.close(this.selectedCompraItem)
      }
    })
  }

  onCancelar() {
    this.matDialogRef.close(null);
  }

  onEnter(input) {
    switch (input) {
      case "unidad":
        this.cantidadPorPresentacionInput.nativeElement.focus();
        break;
      case "presentacion":
        if(this.cantidadPorPresentacionControl.valid){
          this.vencimientoInput.nativeElement.focus();
        }
        break;
      case "vencimiento":
        this.loteInput.nativeElement.focus();
        break;
      case "lote":
        this.guardarBtn._elementRef.nativeElement.focus();
        break;

      default:
        break;
    }
  }

  focusout(input) {
    switch (input) {
      case "unidad":
        this.cantidadPorPresentacionControl.setValue(
          this.cantidadPorUnidadControl.value /
            this.selectedCompraItem.presentacion.cantidad
        );
        break;
      case "presentacion":
        if(this.cantidadPorPresentacionControl.valid){
          this.cantidadPorUnidadControl.setValue(this.cantidadPorPresentacionControl.value * this.selectedCompraItem.presentacion.cantidad )
        }
        break;
      default:
        break;
    }
  }

  onComparar(compraItem: CompraItem, pedidoItem: PedidoItem): boolean {
    if (
      (compraItem.precioUnitario != pedidoItem?.precioUnitario ||
      compraItem.descuentoUnitario != pedidoItem?.descuentoUnitario ||
      compraItem.cantidad != pedidoItem?.cantidad)
    ) {
      return true;
    } else {
      return false;
    }
  }
}
