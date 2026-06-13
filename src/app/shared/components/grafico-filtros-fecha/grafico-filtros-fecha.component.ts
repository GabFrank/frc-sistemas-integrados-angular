import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, startWith } from "rxjs";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  generarRangoFechaGrafico,
  listarAnhosGrafico,
} from "../../../commons/core/utils/dateUtils";
import {
  MESES_ETIQUETAS_CORTAS,
  MESES_GRAFICO,
  MesGraficoOption,
} from "../../constants/grafico.constants";
import { RangoFechaGrafico } from "./grafico-filtros-fecha.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "frc-grafico-filtros-fecha",
  templateUrl: "./grafico-filtros-fecha.component.html",
  styleUrls: ["./grafico-filtros-fecha.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoFiltrosFechaComponent implements OnInit {
  @Input() mostrarDia = true;
  @Input() cantidadAnhos = 5;
  @Input() etiquetaDia = "Día Específico";
  @Input() mostrarBotonLimpiar = true;

  @Output() rangoChange = new EventEmitter<RangoFechaGrafico | RangoFechaGrafico[]>();

  anhoControl = new FormControl<number[]>([new Date().getFullYear()]);
  mesControl = new FormControl<number | null>(new Date().getMonth() + 1);
  fechaControl = new FormControl<Date | null>(null);

  meses: MesGraficoOption[] = MESES_GRAFICO;
  anhos: number[] = [];

  ngOnInit(): void {
    this.anhos = listarAnhosGrafico(this.cantidadAnhos);

    this.mesControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() =>
        this.fechaControl.setValue(null, { emitEvent: false })
      );

    this.anhoControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() =>
        this.fechaControl.setValue(null, { emitEvent: false })
      );

    this.anhoControl.valueChanges
      .pipe(
        startWith(this.anhoControl.value),
        debounceTime(0),
        untilDestroyed(this)
      )
      .subscribe(() => this.emitirRangoActual());

    this.mesControl.valueChanges
      .pipe(
        startWith(this.mesControl.value),
        debounceTime(0),
        untilDestroyed(this)
      )
      .subscribe(() => this.emitirRangoActual());

    this.fechaControl.valueChanges
      .pipe(
        startWith(this.fechaControl.value),
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => this.emitirRangoActual());
  }

  limpiarFiltros(): void {
    this.anhoControl.setValue([new Date().getFullYear()]);
    this.mesControl.setValue(new Date().getMonth() + 1);
    this.fechaControl.setValue(null);
  }

  private normalizarAnhos(anhosSel?: number[] | null): number[] {
    const anhos = anhosSel ?? this.anhoControl.value ?? [];
    if (!anhos.length) {
      return [new Date().getFullYear()];
    }
    return Array.from(
      new Set(
        anhos
          .map((a) => Number(a))
          .filter((a) => Number.isFinite(a))
      )
    ).sort((a, b) => a - b);
  }

  private emitirRangoActual(): void {
    const anhos = this.normalizarAnhos();
    const mes = this.mesControl.value;
    const fechaDia = this.fechaControl.value;

    if (fechaDia) {
      const anho = fechaDia.getFullYear();
      const periodo = generarRangoFechaGrafico(anho, mes, fechaDia);
      this.rangoChange.emit({
        ...periodo,
        anho,
        anhos: [anho],
        mes,
        fechaDia,
      });
      return;
    }

    const variosAnhos = anhos.length > 1;
    const rangos: RangoFechaGrafico[] = anhos.map((anho, indice) => {
      const periodo = generarRangoFechaGrafico(anho, mes, null);
      return {
        ...periodo,
        anho,
        anhos,
        mes,
        fechaDia: null,
        indice,
        etiqueta: this.etiquetaPeriodo(anho, mes, variosAnhos, false),
      };
    });

    if (rangos.length === 1) {
      this.rangoChange.emit(rangos[0]);
      return;
    }

    this.rangoChange.emit(rangos);
  }

  private etiquetaPeriodo(
    anho: number,
    mes: number | null,
    variosAnhos: boolean,
    esDia: boolean
  ): string {
    if (esDia) {
      return String(anho);
    }
    if (mes) {
      const mesNombre =
        MESES_GRAFICO.find((m) => m.valor === mes)?.nombre ??
        MESES_ETIQUETAS_CORTAS[mes - 1] ??
        `Mes ${mes}`;
      return variosAnhos ? `${mesNombre} ${anho}` : mesNombre;
    }
    return String(anho);
  }
}
