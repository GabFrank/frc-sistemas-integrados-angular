import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[numericOnly]'
})
export class NumericOnlyDirective {

  /** `numericOnly` sin valor la deja activa; `[numericOnly]="false"` la apaga (ej. pasaporte de un extranjero). */
  @Input() numericOnly: boolean | '' = '';

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    if (this.numericOnly === false) return;
    const allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    if (allowedKeys.includes(event.key)) {
      return;  // Allow navigation keys
    }
  
    // Block space key
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      return;
    }

    // Block negative sign
    if (event.key === '-') {
      event.preventDefault();
      return;
    }
  
    // Check if it's a number
    const isNumber = new RegExp(/^\d+$/).test(event.key);
    if (!isNumber) {
      event.preventDefault(); // Prevent default if it's not a number
    }
  }

  @HostListener('input', ['$event']) onInput(event: InputEvent) {
    if (this.numericOnly === false) return;
    // Sanitize value on any input (including paste/composition)
    const currentValue: string = this.el.nativeElement.value ?? '';
    const sanitizedValue = currentValue.replace(/[^\d]/g, '');
    if (sanitizedValue !== currentValue) {
      this.el.nativeElement.value = sanitizedValue;
    }
  }
  
}
