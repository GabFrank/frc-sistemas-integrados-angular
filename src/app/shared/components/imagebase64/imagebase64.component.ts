import { Component, Input, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Presentacion } from "../../../modules/productos/presentacion/presentacion.model";
import { Producto } from "../../../modules/productos/producto/producto.model";

@Component({
  selector: "app-imagebase64",
  templateUrl: "./imagebase64.component.html",
  styleUrls: ["./imagebase64.component.css"],
})
export class Imagebase64Component implements OnInit {
  @Input()
  presentaciones: Presentacion[];

  @Input()
  width;

  @Input()
  height;

  @Input()
  objectFit;

  base64Image;
  sinImagen;
  imagenPrincipal = null;

  constructor(private domSanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.cargarImagen();
  }

  cargarImagen() {
    this.presentaciones?.find((p) => {
      if (p.principal == true) {
        this.imagenPrincipal = p?.imagenPrincipal
        // this.sinImagen = imagenPrincipal ? false : true;
        // this.base64Image = this.domSanitizer.bypassSecurityTrustResourceUrl(
        //   `${imagenPrincipal}`
        // );
      }
    });
  }
}
