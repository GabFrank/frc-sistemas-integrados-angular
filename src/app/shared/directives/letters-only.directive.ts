import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[lettersOnly]'
})
export class LettersOnlyDirective {

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    // Allow letters (A-Z, a-z), space, backspace, tab, enter, end, home, left arrow, right arrow
    const regex = /^[A-Za-z\s]$/;
    const specialKeys = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Enter'];

    if (specialKeys.indexOf(event.key) !== -1 || regex.test(event.key)) {
      return; // Allow control keys and letters
    } else {
      event.preventDefault(); // Prevent all other keys
    }
  }
}
