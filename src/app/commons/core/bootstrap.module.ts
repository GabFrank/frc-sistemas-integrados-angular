import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatRowKeyboardSelectionDirective } from './utils/mat-row-keyboard-selection.directive';



@NgModule({
  declarations: [MatRowKeyboardSelectionDirective],
  imports: [
    CommonModule,
    NgbModule
  ],
  exports: [
    NgbModule,
    MatRowKeyboardSelectionDirective
  ]
})
export class BootstrapModule { }
