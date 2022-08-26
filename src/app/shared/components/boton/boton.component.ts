import { Component, Input, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('btn', { static: false }) btn: ElementRef;

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

  @Input()
  focusEvent = new BehaviorSubject<boolean>(false);

  constructor() { }

  ngOnInit(): void {
    this.focusEvent.pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.btn.nativeElement.focus()
      }
    })
  }

  onClick() {
    if (this.disableExpression != true) {
      this.clickEvent.emit()
      this.temporaryDisable = true;
      setTimeout(() => {
        this.temporaryDisable = false;
      }, 1000);
    }
  }

}
