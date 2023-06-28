import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NotificacionSnackbarService } from '../../notificacion-snackbar.service';

@Directive({
  selector: '[copiarAClipboard]'
})
export class CopiarAClipboardDirective {

  @Input('copiarAClipboard') value: string;

  constructor(
    private elementRef: ElementRef,
    private notificacionService: NotificacionSnackbarService
  ) { }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.elementRef.nativeElement.style.cursor = 'context-menu';
    this.elementRef.nativeElement.style.caretColor = '#43a047';
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.elementRef.nativeElement.style.cursor = 'default';
  }

  @HostListener('click')
  onClick(): void {
    let textToCopy: string = (this.value === undefined || this.value === null
      || this.value == '') ? this.elementRef.nativeElement.textContent : this.value;
    textToCopy = textToCopy.trim();
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        this.showNotification('Copiado: ' + textToCopy);
      })
      .catch((error) => {
        console.error('Error copying text to clipboard:', error);
      });
  }

  private showNotification(message: string): void {
    this.notificacionService.openSucess(message)
  }
}
