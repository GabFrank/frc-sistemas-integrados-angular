import { Component, HostListener, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Producto } from "../../producto/producto.model";
import { Presentacion } from "../presentacion.model";

export class SeleccionarPresentacionData {
  producto: Producto;
}

@Component({
  selector: "app-seleccionar-presentacion-dialog",
  templateUrl: "./seleccionar-presentacion-dialog.component.html",
  styleUrls: ["./seleccionar-presentacion-dialog.component.scss"],
})
export class SeleccionarPresentacionDialogComponent implements OnInit {
  selectedPresentacion: Presentacion;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarPresentacionData,
    private matDialogRef: MatDialogRef<SeleccionarPresentacionDialogComponent>
  ) {
    if (data?.producto != null) {
      if (data.producto?.presentaciones != null) {
        if (data.producto?.presentaciones.length > 0) {
          this.selectedPresentacion = data.producto?.presentaciones[0];
        }
      }
    }
  }

  ngOnInit(): void {}

  @HostListener("window:keyup", ["$event"])
  keyEvent(event: KeyboardEvent) {
    let key = event.key;
    console.log(key);
    if (this.data?.producto.presentaciones.length > 0) {
      let index = this.data.producto.presentaciones.findIndex(
        (p) => p == this.selectedPresentacion
      );
      let lenght = this.data.producto.presentaciones.length;
      console.log(index, lenght);
      switch (key) {
        case "ArrowRight":
          if (index + 1 < lenght) {
            this.selectedPresentacion =
              this.data.producto.presentaciones[++index];
          } else {
            index = 0;
            this.selectedPresentacion =
              this.data.producto.presentaciones[index];
          }
          break;
        case "ArrowLeft":
          if (index > 0) {
            this.selectedPresentacion =
              this.data.producto.presentaciones[--index];
          } else {
            index = lenght - 1;
            this.selectedPresentacion =
              this.data.producto.presentaciones[index];
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
