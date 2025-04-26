import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[showAfterDelay]'
})
export class ShowAfterDelayDirective implements OnInit, OnDestroy {

  @Input('appShowAfterDelay') delay: number = 10000; // default delay 10 seconds
  private timeoutId: any;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    console.log('iniciando directiva');
    
    this.el.nativeElement.style.display = 'none'; // Hide the element initially

    this.timeoutId = setTimeout(() => {
      this.el.nativeElement.style.display = ''; // Show the element after delay
      console.log('delay completed');
      
    }, this.delay);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeoutId); // Clear timeout if the element is destroyed
  }
}
