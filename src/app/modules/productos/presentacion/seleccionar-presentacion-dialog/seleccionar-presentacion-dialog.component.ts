import { Component, HostListener, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Producto } from "../../producto/producto.model";
import { Presentacion } from "../presentacion.model";
import { PresentacionService } from "../presentacion.service";

export class SeleccionarPresentacionData {
  producto: Producto;
}

@UntilDestroy({checkProperties: true})
@Component({
  selector: "app-seleccionar-presentacion-dialog",
  templateUrl: "./seleccionar-presentacion-dialog.component.html",
  styleUrls: ["./seleccionar-presentacion-dialog.component.scss"],
})
export class SeleccionarPresentacionDialogComponent implements OnInit {
  selectedPresentacion: Presentacion;
  selectedProducto: Producto;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarPresentacionData,
    private matDialogRef: MatDialogRef<SeleccionarPresentacionDialogComponent>,
    private presentacionService: PresentacionService
  ) {
    if (data?.producto != null) {
      this.selectedProducto = data.producto;
      presentacionService.onGetPresentacionesPorProductoId(this.selectedProducto.id).subscribe(res => {
        console.log(res);
        this.selectedProducto.presentaciones = res;
        this.selectedPresentacion = res[0]
      })
    }
  }

  ngOnInit(): void {}

  onSelectPresentacion(presentacion: Presentacion){
    presentacion.producto = this.selectedProducto;
    this.matDialogRef.close(presentacion);
  }

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    if (this.data?.producto.presentaciones.length > 0) {
      let index = this.selectedProducto.presentaciones.findIndex(
        (p) => p == this.selectedPresentacion
      );
      let lenght = this.selectedProducto.presentaciones.length;
      switch (key) {
        case "ArrowRight":
          if (index + 1 < lenght) {
            this.selectedPresentacion =
              this.selectedProducto.presentaciones[++index];
          } else {
            index = 0;
            this.selectedPresentacion =
              this.selectedProducto.presentaciones[index];
          }
          break;
        case "ArrowLeft":
          if (index > 0) {
            this.selectedPresentacion =
              this.selectedProducto.presentaciones[--index];
          } else {
            index = lenght - 1;
            this.selectedPresentacion =
              this.selectedProducto.presentaciones[index];
          }
          break;
          case 'Enter': 
            if(this.selectedPresentacion!=null){
              this.matDialogRef.close(this.selectedPresentacion)
            }
          break;
        default:
          break;
      }
    }
  }
}
