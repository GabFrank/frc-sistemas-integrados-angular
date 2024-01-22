import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[noSpaces]'
})
export class NoSpacesDirective {

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    const value = this.el.nativeElement.value;
    // Prevent space at the start
    if (!value && event.key === ' ') {
      event.preventDefault();
    }
  }

  @HostListener('blur', ['$event']) onBlur(event: FocusEvent) {
    let value = this.el.nativeElement.value;
    // Remove space at the end if input loses focus
    this.el.nativeElement.value = value.replace(/\s+$/, '');
  }
}
