import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Producto } from '../../../modules/productos/producto/producto.model';

@Component({
  selector: 'app-imagebase64',
  templateUrl: './imagebase64.component.html',
  styleUrls: ['./imagebase64.component.css']
})
export class Imagebase64Component implements OnInit {

  @Input()
  producto: Producto;

  @Input()
  width;

  @Input()
  height;

  @Input()
  objectFit;

  base64Image;
  sinImagen;

  constructor(    
    private domSanitizer: DomSanitizer,
    ) { }

  ngOnInit(): void {
    this.cargarImagen()
  }

  cargarImagen() {
    this.sinImagen = this.producto?.imagenPrincipal ? false : true;
    this.base64Image = this.domSanitizer.bypassSecurityTrustResourceUrl(
      `data:image/png;base64 , ${this.producto.imagenPrincipal}`
    );
  }

}
