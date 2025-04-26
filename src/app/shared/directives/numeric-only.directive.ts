import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[numericOnly]'
})
export class NumericOnlyDirective {

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    console.log(event.key);
    
    let allowedKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowedKeys.includes(event.key)) {
      return;  // Allow navigation keys
    }
  
    // Block space key
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      return;
    }
  
    // Check if it's a number
    const isNumber = new RegExp(/^\d+$/).test(event.key);
    if (!isNumber) {
      event.preventDefault(); // Prevent default if it's not a number
    }
  }

  @HostListener('keyup', ['$event']) onKeyUp(event: KeyboardEvent) {
    let value = this.el.nativeElement.value;
    // Remove non-numeric characters
    value = value.replace(/[^\d]/g, '');

    if (value.length > 0) {
      // Remove the last character
      const lastChar = value.charAt(value.length - 1);
      value = value.slice(0, -1);

      // Trigger Angular's change detection by setting the value
      this.el.nativeElement.value = value;

      // Re-add the last character
      this.el.nativeElement.value += lastChar;
    } else {
      this.el.nativeElement.value = value;
    }
  }
  
}
