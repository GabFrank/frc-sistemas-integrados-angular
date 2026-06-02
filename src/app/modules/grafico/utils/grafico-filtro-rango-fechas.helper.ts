import { FormControl, FormGroup } from "@angular/forms";
import { combineLatest, Observable } from "rxjs";
import { startWith } from "rxjs/operators";
import {
  generarRangoFechaGraficoDesdeRango,
  listarAnhosGrafico,
  RangoFechaPeriodo,
} from "../../../commons/core/utils/dateUtils";
import {
  MESES_GRAFICO,
  MesGraficoOption,
} from "../../../shared/constants/grafico.constants";

const MES_TODOS_VALOR = 0;
const MESES_DEL_ANHO = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Filtros de período para gráficos: año + meses (obligatorio) y rango de días opcional
 * cuando hay un solo mes seleccionado (mismo criterio que forma-pago).
 */
export class GraficoFiltrosPeriodo {
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number[]>([new Date().getMonth() + 1]);
  fechaRangoGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null),
  });

  readonly anhos: number[] = listarAnhosGrafico();
  readonly meses: MesGraficoOption[] = [
    { valor: MES_TODOS_VALOR, nombre: "Todas" },
    ...MESES_GRAFICO,
  ];

  minFechaRango: Date | null = null;
  maxFechaRango: Date | null = null;
  mostrarRangoDias = false;

  private ultimaSeleccionMeses: number[] = [new Date().getMonth() + 1];

  limpiar(): void {
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue([new Date().getMonth() + 1]);
    this.ultimaSeleccionMeses = [new Date().getMonth() + 1];
    this.fechaRangoGroup.setValue({ inicio: null, fin: null });
    this.actualizarLimitesRangoDias();
  }

  onMesesChange(mesesSel: number[] | null): void {
    const meses = mesesSel || [];
    const teniaTodas = this.ultimaSeleccionMeses.includes(MES_TODOS_VALOR);
    const tieneTodas = meses.includes(MES_TODOS_VALOR);

    if (tieneTodas && meses.length > 1) {
      const nuevaSeleccion = teniaTodas
        ? meses.filter((m) => m !== MES_TODOS_VALOR)
        : [MES_TODOS_VALOR];
      this.mesControl.setValue(nuevaSeleccion, { emitEvent: false });
      this.ultimaSeleccionMeses = nuevaSeleccion;
      this.mesControl.updateValueAndValidity({ emitEvent: true });
      return;
    }

    this.ultimaSeleccionMeses = meses;
  }

  normalizarMesesSeleccionados(
    mesesSel: number[] | null | undefined
  ): number[] {
    if (!mesesSel?.length) {
      return [new Date().getMonth() + 1];
    }
    if (mesesSel.includes(MES_TODOS_VALOR)) {
      return MESES_DEL_ANHO;
    }
    return mesesSel;
  }

  obtenerRangoDiasSeleccionado(): RangoFechaPeriodo | null {
    const { inicio, fin } = this.fechaRangoGroup.value;
    if (!inicio || !fin) {
      return null;
    }
    return generarRangoFechaGraficoDesdeRango(inicio, fin);
  }

  obtenerRangoDiasSiAplica(): RangoFechaPeriodo | null {
    const mesesFinal = this.normalizarMesesSeleccionados(this.mesControl.value);
    return mesesFinal.length === 1 ? this.obtenerRangoDiasSeleccionado() : null;
  }

  calcularRangoMes(anho: number, mes: number): RangoFechaPeriodo {
    const mesStr = String(mes).padStart(2, "0");
    const ultimoDia = new Date(anho, mes, 0);
    const mesMaxStr = String(ultimoDia.getMonth() + 1).padStart(2, "0");
    const diaMaxStr = String(ultimoDia.getDate()).padStart(2, "0");

    return {
      inicio: `${anho}-${mesStr}-01 00:00:00`,
      fin: `${anho}-${mesMaxStr}-${diaMaxStr} 23:59:59`,
    };
  }

  resolverRangoParaMes(anho: number, mes: number): RangoFechaPeriodo {
    const rangoDias = this.obtenerRangoDiasSiAplica();
    return rangoDias ?? this.calcularRangoMes(anho, mes);
  }

  actualizarLimitesRangoDias(): void {
    const anho = this.anhoControl.value || new Date().getFullYear();
    const mesesFinal = this.normalizarMesesSeleccionados(this.mesControl.value);

    if (mesesFinal.length === 1) {
      const mes = mesesFinal[0];
      this.minFechaRango = new Date(anho, mes - 1, 1);
      this.maxFechaRango = new Date(anho, mes, 0);
      this.mostrarRangoDias = true;

      const actualInicio = this.fechaRangoGroup.value.inicio;
      if (
        actualInicio &&
        (actualInicio.getFullYear() !== anho ||
          actualInicio.getMonth() !== mes - 1)
      ) {
        this.fechaRangoGroup.setValue(
          { inicio: null, fin: null },
          { emitEvent: false }
        );
      }
    } else {
      this.mostrarRangoDias = false;
      this.minFechaRango = null;
      this.maxFechaRango = null;
      this.fechaRangoGroup.setValue(
        { inicio: null, fin: null },
        { emitEvent: false }
      );
    }
  }

  configurarLimitesRangoDias(
    untilDestroyedPipe: (
      source: Observable<[number | null, number[] | null]>
    ) => Observable<[number | null, number[] | null]>,
    onChange: () => void
  ): void {
    combineLatest([
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value)),
    ])
      .pipe(untilDestroyedPipe)
      .subscribe(() => {
        this.actualizarLimitesRangoDias();
        onChange();
      });

    this.actualizarLimitesRangoDias();
  }
}

/** @deprecated Usar GraficoFiltrosPeriodo */
export const GraficoFiltroRangoFechas = GraficoFiltrosPeriodo;
