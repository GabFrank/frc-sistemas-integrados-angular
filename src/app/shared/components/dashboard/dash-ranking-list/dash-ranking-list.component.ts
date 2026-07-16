import { Component, Input } from "@angular/core";

export interface DashRankingItem {
  nombre: string;
  /** Valor destacado a la derecha del nombre (ej. "24 uds"). */
  valorPrincipal: string | number;
  /** Valor secundario debajo de la barra (ej. "960.000 Gs"). */
  valorSecundario?: string | number;
  /** 0-100 para la barra de progreso. */
  porcentaje?: number;
}

/**
 * Lista rankeada (top N) con medalla oro/plata/bronce y barra de progreso.
 * Clases globales .dash-ranking-* (src/styles/_dashboard.scss).
 */
@Component({
  selector: "dash-ranking-list",
  template: `
    <div class="dash-card">
      <dash-section-header [icon]="icon" [title]="title"></dash-section-header>

      <div *ngIf="!items?.length" class="dash-empty">
        <mat-icon>inbox</mat-icon>
        <span>{{ emptyText }}</span>
      </div>

      <div class="dash-ranking-list" *ngIf="items?.length">
        <div
          *ngFor="let item of items; let i = index"
          class="dash-ranking-item"
        >
          <div
            class="dash-ranking-rank"
            [ngClass]="{
              'rank-gold': i === 0,
              'rank-silver': i === 1,
              'rank-bronze': i === 2
            }"
          >
            {{ i + 1 }}
          </div>
          <div class="dash-ranking-info">
            <div class="dash-ranking-name-row">
              <span class="dash-ranking-name">{{ item.nombre }}</span>
              <span class="dash-ranking-secondary">{{
                item.valorPrincipal
              }}</span>
            </div>
            <div
              *ngIf="item.porcentaje != null"
              class="dash-ranking-bar-container"
            >
              <div
                class="dash-ranking-bar"
                [style.width.%]="item.porcentaje"
              ></div>
            </div>
            <span
              *ngIf="item.valorSecundario != null"
              class="dash-ranking-total"
            >
              {{ item.valorSecundario }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashRankingListComponent {
  @Input() icon = "leaderboard";
  @Input() title = "";
  @Input() items: DashRankingItem[] = [];
  @Input() emptyText = "Sin datos en el período";
}
