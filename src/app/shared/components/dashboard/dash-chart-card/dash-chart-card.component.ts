import { Component, Input } from "@angular/core";
import { EChartsOption } from "echarts";

/**
 * Card de gráfico del dashboard. Envuelve frc-grafico-shell (ngx-echarts) y le
 * agrega header con icono/titulo y una zona para chips de rango (ng-content).
 * Clases globales .dash-chart-card (src/styles/_dashboard.scss).
 */
@Component({
  selector: "dash-chart-card",
  template: `
    <div class="dash-chart-card">
      <div class="dash-chart-header">
        <dash-section-header [icon]="icon" [title]="title"></dash-section-header>
        <div class="dash-chart-chips"><ng-content></ng-content></div>
      </div>
      <frc-grafico-shell
        [opciones]="opciones"
        [cargando]="cargando"
        [hayDatos]="hayDatos"
        [datosListos]="datosListos"
        [alturaMinima]="alturaMinima"
        [mensajeVacio]="mensajeVacio"
      ></frc-grafico-shell>
    </div>
  `,
})
export class DashChartCardComponent {
  @Input() icon = "show_chart";
  @Input() title = "";
  @Input() opciones: EChartsOption | null = null;
  @Input() cargando = false;
  @Input() hayDatos = false;
  @Input() datosListos = true;
  @Input() alturaMinima = "300px";
  @Input() mensajeVacio = "Sin datos en el período";
}
