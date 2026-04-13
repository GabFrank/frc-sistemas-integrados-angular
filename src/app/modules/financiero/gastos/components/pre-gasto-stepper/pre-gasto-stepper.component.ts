import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pre-gasto-stepper',
  templateUrl: './pre-gasto-stepper.component.html',
  styleUrls: ['./pre-gasto-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreGastoStepperComponent {
  @Input() pasoActual: number = 0;
  @Input() step1Visible: boolean = true;
  
  @Output() pasoSeleccionado = new EventEmitter<number>();

  irAPaso(paso: number): void {
    if (this.isStepVisible(paso)) {
      this.pasoSeleccionado.emit(paso);
    }
  }

  isStepVisible(step: number): boolean {
    if (step === 1) return this.step1Visible;
    return true;
  }

  getStepNumber(step: number): number {
    let num = 0;
    for (let i = 0; i <= step; i++) {
       if (this.isStepVisible(i)) num++;
    }
    return num;
  }
}
