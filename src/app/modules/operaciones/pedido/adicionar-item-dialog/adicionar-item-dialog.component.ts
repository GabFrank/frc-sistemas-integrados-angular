import { Component, ElementRef, Inject, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Color } from "highcharts";
import { MainService } from "../../../../main.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PrecioPorSucursal } from "../../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";
import { SeleccionarPresentacionDialogComponent } from "../../../productos/presentacion/seleccionar-presentacion-dialog/seleccionar-presentacion-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoService } from "../../../productos/producto/producto.service";
import { CompraItem } from "../../compra/compra-item.model";
import { Pedido } from "../edit-pedido/pedido.model";

export class AdicionarPedidoItemDialog {
  pedido: Pedido;
}

@Component({
  selector: "app-adicionar-item-dialog",
  templateUrl: "./adicionar-item-dialog.component.html",
  styleUrls: ["./adicionar-item-dialog.component.scss"],
})
export class AdicionarItemDialogComponent implements OnInit {

  @ViewChild("productoInput", { static: false })
  productoInput: ElementRef;

  formGroup: FormGroup;

  productoControl = new FormControl(null, Validators.required);
  productoIdControl = new FormControl(null, Validators.required);
  presentacionControl = new FormControl(null, Validators.required);
  existenciaControl = new FormControl();
  precioControl = new FormControl(null, Validators.required);
  descuentoControl = new FormControl(null, Validators.required);
  costoMedioControl = new FormControl();
  precioUltimaCompra = new FormControl();
  cantidadControl = new FormControl(null, Validators.required);
  existencia = null;

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
  preciosdisplayedColumns = ["id", "presentacion", "precio", "accion"];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPedidoItemDialog,
    private matDialogRef: MatDialogRef<AdicionarItemDialogComponent>,
    private productoService: ProductoService,
    private cargandoDialog: CargandoDialogService,
    private notificacionBar: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      cantidad: this.cantidadControl,
      precio: this.precioControl,
      descuento: this.descuentoControl,
      producto: this.productoControl,
      presentacion: this.presentacionControl,
    });
  }

  onSearchProductoById(id){
    this.cargandoDialog.openDialog()
    this.productoService.getProducto(id).subscribe(res => {
      this.cargandoDialog.closeDialog()
      if(res?.id!=null){
        this.onSelectProducto(res);
        this.matDialog.open(SeleccionarPresentacionDialogComponent, {
          data: {
            producto: res
          },
          width: '60%',
          disableClose: false
        }).afterClosed().subscribe(res2 => {
          if(res2!=null){
            this.selectedPresentacion = res2;  
            this.existencia = this.getExistencia(res);
          }
        })
      } else {
        this.notificacionBar.notification$.next({
          texto: 'Producto no encontrado',
          color: NotificacionColor.warn,
          duracion: 2
        })
        this.onSelectProducto(null);
        this.selectedPresentacion = null;
      }
    })
  }

  onCodigoKeyup(key) {
    switch (key) {
      case "Enter":
      case "Tab":
      case "Space":
        console.log('enter o tab o space')
        this.onSearchProductoById(this.productoIdControl.value)
        break;
      default:
        break;
    }
  }

  onSelectProducto(producto: Producto){
    if(producto!=null){
      this.selectedProducto = producto;
      this.productoIdControl.setValue(this.selectedProducto.id)
      this.productoControl.setValue(this.selectedProducto.descripcion)
    } else {
      this.selectedProducto = producto;
      this.productoIdControl.setValue(null)
      this.productoControl.setValue(null)
    }
    
  }

  getExistencia(producto: Producto): number {
    console.log(producto)
    return producto?.sucursales?.find(
      (s) => s.sucursal.id == this.mainService.sucursalActual.id
    ).existencia;
  }


}
