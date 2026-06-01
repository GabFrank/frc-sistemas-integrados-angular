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

  @Output() rangoChange = new EventEmitter<RangoFechaGrafico>();

  anhoControl = new FormControl<number>(new Date().getFullYear());
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
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue(new Date().getMonth() + 1);
    this.fechaControl.setValue(null);
  }

  private emitirRangoActual(): void {
    const anho = this.anhoControl.value ?? new Date().getFullYear();
    const mes = this.mesControl.value;
    const fechaDia = this.fechaControl.value;
    const periodo = generarRangoFechaGrafico(anho, mes, fechaDia);

    this.rangoChange.emit({
      ...periodo,
      anho,
      mes,
      fechaDia,
    });
  }
}
