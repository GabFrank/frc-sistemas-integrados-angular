import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
  styleUrls: ['./buscador.component.scss']
})
export class BuscadorComponent implements OnInit {

  formGroup: FormGroup;
  cantidadControl = new FormControl(null, Validators.required)
  buscadorControl = new FormControl(null)

  constructor() { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      'cantidad': this.cantidadControl,
      'buscador': this.buscadorControl
    })
  }

  buscarProductoDialog(){
    
  }

}
