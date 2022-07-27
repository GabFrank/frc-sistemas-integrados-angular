import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { CurrencyMask } from "../../../../../commons/core/utils/numbersUtils";
import { MainService } from "../../../../../main.service";
import { Producto } from "../../../../../modules/productos/producto/producto.model";
import { TipoPrecio } from "../../../../../modules/productos/tipo-precio/tipo-precio.model";
import { TecladoNumericoComponent } from "../../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { WindowInfoService } from "../../../../../shared/services/window-info.service";
import { PrecioDelivery } from "../../../../operaciones/delivery/precio-delivery.model";
import { PrecioPorSucursal } from "../../../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../../../../productos/presentacion/presentacion.model";
import { PdvGruposProductos } from "../pdv-grupos-productos/pdv-grupos-productos.model";

export class ProductoCategoriaDialogData {
  producto: Producto;
  presentaciones: Presentacion[];
  cantidad?: number;
  texto?;
}

export class ProductoCategoriaResponseData {
  presentacion: Presentacion;
  precio: PrecioPorSucursal;
  cantidad: number;
  tipoPrecio: TipoPrecio;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from "../../../../../../environments/environment";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-producto-categoria-dialog",
  templateUrl: "./producto-categoria-dialog.component.html",
  styleUrls: ["./producto-categoria-dialog.component.css"],
})
export class ProductoCategoriaDialogComponent implements OnInit {
  @ViewChild("cantidad", { static: false }) cantidadInput: ElementRef;

  presentaciones: Presentacion[] = [];
  tipoPrecio: TipoPrecio;
  tiposPrecios: TipoPrecio[];
  cantidad = 1;
  formGroup: FormGroup;
  currency = new CurrencyMask();
  mostrarTipoPrecios = true;
  desplegarTipoPrecio = true;
  selectedPresentacion: Presentacion;
  selectedPrecio: PrecioPorSucursal;
  filteredPrecios: string[]
  modoPrecio: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ProductoCategoriaDialogData,
    public dialogRef: MatDialogRef<ProductoCategoriaDialogComponent>,
    public windowInfo: WindowInfoService,
    public matDialog: MatDialog,
    public mainService: MainService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.presentaciones = data?.presentaciones;
    this.cantidad = +data?.cantidad;
    this.filteredPrecios = environment['precios']
    this.modoPrecio = environment['modo']
    if(this.filteredPrecios!=null && this.modoPrecio == 'ONLY'){
      this.presentaciones.filter((p, index) => {
        this.presentaciones[index].precios = p.precios.filter(pre => this.filteredPrecios?.includes(pre.tipoPrecio.descripcion))
        return this.presentaciones[index].precios.length > 0
      })
    } else if(this.filteredPrecios!=null && this.modoPrecio == 'MIXTO'){
      this.presentaciones.filter((p, index) => {
        let foundPrecios = p.precios.filter(pre => this.filteredPrecios?.includes(pre.tipoPrecio.descripcion))
        if(foundPrecios.length > 0){
          this.presentaciones[index].precios = foundPrecios;
        }
        return true;
      })
    } else if(this.filteredPrecios!=null && this.modoPrecio=='NOT'){
      this.presentaciones.filter((p, index) => {
        this.presentaciones[index].precios = p.precios.filter(pre => !this.filteredPrecios?.includes(pre.tipoPrecio.descripcion))
        return this.presentaciones[index].precios.length > 0
      })
    }
  }

  ngOnInit(): void {
    this.createForm();
    this.setFocusToCantidad();

    this.formGroup.controls.cantidad.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res == 0 || res == null) {
        this.formGroup.controls.cantidad.setValue(1);
        this.setFocusToCantidad();
      }
    });
  }

  createForm() {
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null),
    });
    if (this.data.cantidad > 0) {
      this.formGroup.get("cantidad").setValue(this.data.cantidad);
    } else {
      this.formGroup.get("cantidad").setValue(1);
    }
  }

  cambiarTipoPrecio(tipo) {
    this.tipoPrecio = this.tiposPrecios.find((tp) => tp.id == tipo);
    this.setFocusToCantidad();
  }

  openTecladoNumerico() {
    let dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.cantidad,
      },
    });
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res > 0) {
        this.formGroup.get("cantidad").setValue(res);
      }
      this.setFocusToCantidad();
    });
  }

  onGridCardClick(presentacion?: Presentacion) {
    this.selectedPresentacion = presentacion;
    let response: ProductoCategoriaResponseData = null;
    if (this.selectedPrecio == null) {
      this.selectedPrecio = this.selectedPresentacion?.precios.find(
        (p) => p.principal == true
      );
      this.selectedPrecio == null ? this.desplegarTipoPrecio = true: null;
    }
    if(this.selectedPresentacion!=null && this.selectedPrecio!=null){
      response = {
        presentacion: this.selectedPresentacion,
        precio: this.selectedPrecio,
        cantidad: this.formGroup.get("cantidad").value,
        tipoPrecio: this.tipoPrecio,
      };
      this.dialogRef.close(response);
    } else if(this.selectedPrecio==null && this.selectedPresentacion?.precios.length > 0){
      response = {
        presentacion: this.selectedPresentacion,
        precio: this.selectedPresentacion?.precios[0],
        cantidad: this.formGroup.get("cantidad").value,
        tipoPrecio: this.tipoPrecio,
      };
      this.dialogRef.close(response);
    } else {
      this.notificacionService.openWarn('No existe precio disponible')
    }
    
  }

  setFocusToCantidad() {
    setTimeout(() => {
      this.cantidadInput.nativeElement.focus();
      this.cantidadInput.nativeElement.select();
    }, 0);
  }

  setCantidad(i) {
    let cantidad = this.formGroup.controls.cantidad.value;
    if (cantidad == 1) {
      this.formGroup.controls.cantidad.setValue(i);
    } else {
      this.formGroup.controls.cantidad.setValue(cantidad + i);
    }
  }

  onDesplegarTipoPrecio(presentacion: Presentacion) {
    this.selectedPresentacion = presentacion;
    switch (presentacion?.precios?.length) {
      case 0:
        this.desplegarTipoPrecio = false;
        break;
      // case 1:
      //   this.selectedPrecio = presentacion.precios[0];

      //   break;
      default:
        this.desplegarTipoPrecio = true;
        break;
    }
  }
}
