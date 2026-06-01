import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { EChartsOption } from "echarts";

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
  @Input() titulo?: string;
  @Input() opciones: EChartsOption | null = null;
  @Input() cargando = false;
  @Input() hayDatos = false;
  @Input() datosListos = true;
  @Input() mensajeVacio =
    "No hay datos disponibles para los filtros seleccionados";
  @Input() mensajeInicial = "Seleccione filtros para visualizar datos";
  @Input() alturaMinima = "500px";
}
