import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import type { ECharts } from "echarts";
import { EChartsOption } from "echarts";
import { Tema, TemaService } from "../../services/tema.service";
import { GRAFICO_COLORES, opcionesSegunTema } from "../../utils/grafico-echarts.theme";

@UntilDestroy()
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
  private opcionesOriginales: EChartsOption | null = null;
  private tema: Tema;

  /** Las opciones que recibe el gráfico: las de entrada con los grises del tema actual. */
  opcionesTema: EChartsOption | null = null;

  @Input() titulo?: string;
  @Input() set opciones(valor: EChartsOption | null) {
    this.opcionesOriginales = valor;
    this.opcionesTema = opcionesSegunTema(valor, this.tema);
  }
  get opciones(): EChartsOption | null {
    return this.opcionesOriginales;
  }
  @Input() cargando = false;
  @Input() hayDatos = false;
  @Input() datosListos = true;
  @Input() mensajeVacio =
    "No hay datos disponibles para los filtros seleccionados";
  @Input() mensajeInicial = "Seleccione filtros para visualizar datos";
  @Input() alturaMinima = "500px";

  constructor(temaService: TemaService, cdr: ChangeDetectorRef) {
    this.tema = temaService.tema;
    temaService.tema$.pipe(untilDestroyed(this)).subscribe((tema) => {
      if (tema === this.tema) {
        return;
      }
      this.tema = tema;
      this.opcionesTema = opcionesSegunTema(this.opcionesOriginales, tema);
      cdr.markForCheck();
    });
  }

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
      backgroundColor: this.tema === "claro" ? "#ffffff" : GRAFICO_COLORES.backgroundDark,
    });
  }
}
