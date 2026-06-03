import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import type { ECharts } from "echarts";
import { EChartsOption } from "echarts";
import { GRAFICO_COLORES } from "../../utils/grafico-echarts.theme";

@Component({
  selector: "frc-grafico-shell",
  templateUrl: "./grafico-shell.component.html",
  styleUrls: ["./grafico-shell.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "frc-grafico-shell-host",
  },
})
export class GraficoShellComponent {
  private chart: ECharts | null = null;

  @Input() titulo?: string;
  @Input() opciones: EChartsOption | null = null;
  @Input() cargando = false;
  @Input() hayDatos = false;
  @Input() datosListos = true;
  @Input() mensajeVacio =
    "No hay datos disponibles para los filtros seleccionados";
  @Input() mensajeInicial = "Seleccione filtros para visualizar datos";
  @Input() alturaMinima = "500px";

  onChartInit(chart: ECharts): void {
    this.chart = chart;
  }

  /** PNG en data URL (base64) del gráfico renderizado, o null si aún no hay instancia. */
  obtenerImagenPng(): string | null {
    if (!this.chart) {
      return null;
    }
    return this.chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: GRAFICO_COLORES.backgroundDark,
    });
  }
}
