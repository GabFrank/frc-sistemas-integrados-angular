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
 * Filtros de período para gráficos: año + meses y rango de días son mutuamente excluyentes.
 * Con uno o más meses seleccionados se filtra por mes; sin meses, el rango de días queda activo
 * (puede abarcar más de un mes).
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
  /** true cuando no hay meses seleccionados y el rango de días puede usarse */
  rangoDiasActivo = false;

  private ultimaSeleccionMeses: number[] = [new Date().getMonth() + 1];

  limpiar(): void {
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue([new Date().getMonth() + 1]);
    this.ultimaSeleccionMeses = [new Date().getMonth() + 1];
    this.fechaRangoGroup.setValue({ inicio: null, fin: null });
    this.actualizarEstadoRangoDias();
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

  tieneMesesSeleccionados(
    mesesSel: number[] | null | undefined = this.mesControl.value
  ): boolean {
    return (mesesSel?.length ?? 0) > 0;
  }

  normalizarMesesSeleccionados(
    mesesSel: number[] | null | undefined
  ): number[] {
    if (!mesesSel?.length) {
      return [];
    }
    if (mesesSel.includes(MES_TODOS_VALOR)) {
      return MESES_DEL_ANHO;
    }
    return mesesSel;
  }

  obtenerRangoDiasSeleccionado(): RangoFechaPeriodo | null {
    const { inicio, fin } = this.fechaRangoGroup.getRawValue();
    if (!inicio || !fin) {
      return null;
    }
    return generarRangoFechaGraficoDesdeRango(inicio, fin);
  }

  obtenerRangoDiasSiAplica(): RangoFechaPeriodo | null {
    if (this.tieneMesesSeleccionados()) {
      return null;
    }
    return this.obtenerRangoDiasSeleccionado();
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

  calcularRangoAnho(anho: number): RangoFechaPeriodo {
    return {
      inicio: `${anho}-01-01 00:00:00`,
      fin: `${anho}-12-31 23:59:59`,
    };
  }

  resolverRangosConsulta(anho: number): RangoFechaPeriodo[] {
    const mesesSel = this.mesControl.value;

    if (!this.tieneMesesSeleccionados(mesesSel)) {
      const rangoDias = this.obtenerRangoDiasSeleccionado();
      return rangoDias ? [rangoDias] : [this.calcularRangoAnho(anho)];
    }

    const meses = this.normalizarMesesSeleccionados(mesesSel);
    return meses.map((mes) => this.calcularRangoMes(anho, mes));
  }

  actualizarEstadoRangoDias(): void {
    const anho = this.anhoControl.value || new Date().getFullYear();
    const tieneMeses = this.tieneMesesSeleccionados();

    if (tieneMeses) {
      this.rangoDiasActivo = false;
      this.minFechaRango = null;
      this.maxFechaRango = null;
      this.fechaRangoGroup.setValue(
        { inicio: null, fin: null },
        { emitEvent: false }
      );
      this.fechaRangoGroup.disable({ emitEvent: false });
    } else {
      this.rangoDiasActivo = true;
      this.minFechaRango = new Date(anho, 0, 1);
      this.maxFechaRango = new Date(anho, 11, 31);
      this.fechaRangoGroup.enable({ emitEvent: false });
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
        this.actualizarEstadoRangoDias();
        onChange();
      });

    this.actualizarEstadoRangoDias();
  }
}

/** @deprecated Usar GraficoFiltrosPeriodo */
export const GraficoFiltroRangoFechas = GraficoFiltrosPeriodo;
