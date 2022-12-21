import { Component, Input, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';

export interface BotonData {
  nombre: string
  icon: string
  iconSize: number
  clickEvent: any
  expression: boolean
}

@UntilDestroy()
@Component({
  selector: 'app-boton',
  templateUrl: './boton.component.html',
  styleUrls: ['./boton.component.scss']
})
export class BotonComponent implements OnInit {

  @ViewChild('btn', { static: false }) btn: MatButton;

  @Input()
  nombre;

  @Input()
  disableExpression: boolean;

  @Input()
  color = 'primary';

  @Input()
  icon;

  @Input()
  iconSize = 1;

  @Input()
  clickDelay = 1000;

  @Input()
  prefix;

  @Input()
  sufix;
  
  temporaryDisable = false;

  isNumber = false;


  @Output()
  clickEvent = new EventEmitter;

  @Input()
  focusEvent = new BehaviorSubject<boolean>(false);

  constructor() { }

  ngOnInit(): void {
    this.focusEvent.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.btn.focus()
      }
    })

    if(Number(this.nombre) == +this.nombre) this.isNumber = true;
  }

  onClick() {
    if (this.disableExpression != true) {
      this.clickEvent.emit()
      this.temporaryDisable = true;
      setTimeout(() => {
        this.temporaryDisable = false;
      }, this.clickDelay);
    }
  }

  onGetFocus() {
    this.btn.focus()
  }
}
