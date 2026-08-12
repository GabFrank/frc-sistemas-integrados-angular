import { Component, Input } from "@angular/core";

/**
 * Tarjeta de KPI: icono de acento + valor grande + label. El color pinta el
 * icono (primary/success/warning/error/info). Muestra spinner mientras carga.
 * Clases globales .dash-stat-chip (src/styles/_dashboard.scss).
 */
@Component({
  selector: "dash-stat-chip",
  template: `
    <div class="dash-stat-chip" [ngClass]="'chip-' + color">
      <mat-icon class="dash-stat-icon">{{ icon }}</mat-icon>
      <div class="dash-stat-data">
        <span class="dash-stat-value">
          <mat-spinner *ngIf="loading; else valTpl" diameter="16"></mat-spinner>
          <ng-template #valTpl>{{ value }}</ng-template>
        </span>
        <span class="dash-stat-label">{{ label }}</span>
      </div>
    </div>
  `,
})
export class DashStatChipComponent {
  @Input() icon = "insights";
  @Input() value: string | number = "";
  @Input() label = "";
  /** 'primary' | 'success' | 'warning' | 'error' | 'info' */
  @Input() color = "primary";
  @Input() loading = false;
}
