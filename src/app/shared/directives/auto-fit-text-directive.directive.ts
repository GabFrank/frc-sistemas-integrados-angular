import { Directive, ElementRef, Renderer2, HostListener, AfterViewInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[autoFitText]'
})
export class AutoFitTextDirective implements AfterViewInit, OnDestroy {

  private resizeObserver: ResizeObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    // Trigger text resize after view is initialized
    this.resizeText();

    // Observe element size changes
    this.resizeObserver = new ResizeObserver(() => this.resizeText());
    this.resizeObserver.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    // Clean up observer to prevent memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.el.nativeElement);
    }
  }

  private resizeText(): void {
    const element = this.el.nativeElement;

    // Get the container's width and height
    const parentWidth = element.clientWidth;
    const parentHeight = element.clientHeight;

    // Set an initial large font size to start with
    let fontSize = 100; // starting high for the first check
    this.renderer.setStyle(element, 'fontSize', `${fontSize}px`);

    // Continuously reduce the font size until it fits both width and height
    while ((element.scrollWidth > parentWidth || element.scrollHeight > parentHeight) && fontSize > 10) {
      fontSize -= 1;
      this.renderer.setStyle(element, 'fontSize', `${fontSize}px`);
    }
  }
}
