import { DecimalPipe } from "@angular/common";
import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Optional,
  Renderer2,
} from "@angular/core";
import { MatTooltip } from "@angular/material/tooltip";

@Directive({
  selector: "[formattedTooltip]",
})
export class FormattedTooltipDirective {
  private _formattedText: string = '';

  // Adjust the input to accept an array of objects
  @Input() set formattedTooltip(values: { prefix: string, amount: number }[]) {
    if (values && Array.isArray(values)) {
      // Map each object to a formatted string and join them with a line break or any other separator
      this._formattedText = values.map(value => {
        const formattedAmount = this.decimalPipe.transform(value.amount, '1.0-2') || '';
        return `${value.prefix} ${formattedAmount}`;
      }).join('\n');  // Use '\n' for a new line in tooltips, or choose another separator as needed
      
      this.updateTooltipMessage();
    }
  }

  constructor(private decimalPipe: DecimalPipe, @Optional() private matTooltip: MatTooltip) {}

  ngOnInit() {
    this.updateTooltipMessage();
  }

  private updateTooltipMessage() {
    if (this.matTooltip && this._formattedText !== undefined) {
      this.matTooltip.message = this._formattedText;
    }
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.updateTooltipMessage();
    if (this.matTooltip) {
      this.matTooltip.show();
    }
  }
}
