import { Component, Input } from "@angular/core";

/**
 * Encabezado de una card de dashboard: icono + titulo + badge opcional.
 * Usa las clases globales .dash-section-header (src/styles/_dashboard.scss).
 */
@Component({
  selector: "dash-section-header",
  template: `
    <div class="dash-section-header">
      <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
      <span class="dash-section-title">{{ title }}</span>
      <span class="dash-section-spacer"></span>
      <span *ngIf="badge != null" class="dash-badge" [ngClass]="badgeClass">
        {{ badge }}
      </span>
    </div>
  `,
})
export class DashSectionHeaderComponent {
  @Input() icon?: string;
  @Input() title = "";
  @Input() badge?: string | number | null;
  /** '' | 'badge-warning' | 'badge-error' */
  @Input() badgeClass = "";
}
