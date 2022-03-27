import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-boton',
  templateUrl: './boton.component.html',
  styleUrls: ['./boton.component.scss']
})
export class BotonComponent implements OnInit {

  nombre = 'Boton'
  disableExpression;
  color = 'primary';

  constructor() { }

  ngOnInit(): void {
  }

  onClick(){

  }

}
