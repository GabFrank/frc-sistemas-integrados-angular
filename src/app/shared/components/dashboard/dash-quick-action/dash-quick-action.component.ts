import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Acceso directo moderno: badge de icono de color + titulo. Emite (action).
 * Clases globales .dash-quick-action (src/styles/_dashboard.scss).
 */
@Component({
  selector: "dash-quick-action",
  template: `
    <button
      class="dash-quick-action"
      type="button"
      [disabled]="disabled"
      [matTooltip]="tooltip || title"
      (click)="action.emit()"
    >
      <span class="dash-quick-action-icon" [style.background-color]="color">
        <mat-icon>{{ icon }}</mat-icon>
      </span>
      <span>{{ title }}</span>
    </button>
  `,
})
export class DashQuickActionComponent {
  @Input() icon = "bolt";
  @Input() title = "";
  @Input() color = "#689f38";
  @Input() disabled = false;
  @Input() tooltip?: string;
  @Output() action = new EventEmitter<void>();
}
