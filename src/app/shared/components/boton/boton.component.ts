import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

export interface BotonData {
  nombre: string
  icon: string
  iconSize: number
  clickEvent: any
  expression: boolean
}

@Component({
  selector: 'app-boton',
  templateUrl: './boton.component.html',
  styleUrls: ['./boton.component.scss']
})
export class BotonComponent implements OnInit {

  @Input()
  nombre = 'Boton'

  @Input()
  disableExpression: boolean;

  @Input()
  color = 'primary';

  @Input()
  icon;

  @Input()
  iconSize = 1;

  temporaryDisable = false;


  @Output()
  clickEvent = new EventEmitter;

  constructor() { }

  ngOnInit(): void {
  }

  onClick(){
    this.clickEvent.emit()
    this.temporaryDisable = true;
    setTimeout(() => {
      this.temporaryDisable = false;
    }, 1000);
  }

}
