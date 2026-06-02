import { FormControl } from "@angular/forms";

/** Centinela en el multi-select; las sucursales reales tienen id > 0 */
export const SUCURSAL_TODOS_VALOR = 0;

/**
 * Multi-select de sucursales con opción "Todos".
 * Selección vacía o "Todos" equivale a consultar todas las sucursales.
 */
export class GraficoFiltroSucursalesMulti {
  readonly todosValor = SUCURSAL_TODOS_VALOR;
  readonly control = new FormControl<number[]>([]);

  private ultimaSeleccion: number[] = [];

  onSeleccionChange(
    sucursalesSel: number[] | null,
    alFinalizar?: () => void
  ): void {
    const sucursales = sucursalesSel || [];
    const teniaTodos = this.ultimaSeleccion.includes(this.todosValor);
    const tieneTodos = sucursales.includes(this.todosValor);

    if (tieneTodos && sucursales.length > 1) {
      const nuevaSeleccion = teniaTodos
        ? sucursales.filter((s) => s !== this.todosValor)
        : [this.todosValor];
      this.control.setValue(nuevaSeleccion, { emitEvent: false });
      this.ultimaSeleccion = nuevaSeleccion;
      this.control.updateValueAndValidity({ emitEvent: true });
      alFinalizar?.();
      return;
    }

    this.ultimaSeleccion = sucursales;
    alFinalizar?.();
  }

  limpiar(): void {
    this.control.setValue([]);
    this.ultimaSeleccion = [];
  }

  /** IDs de sucursal para consultas; [] = todas las sucursales */
  normalizarIds(sucIds?: number[] | null): number[] {
    const ids = sucIds ?? this.control.value ?? [];
    if (!ids.length || ids.includes(this.todosValor)) {
      return [];
    }
    return ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  resolverParaConsultaMulti(
    sucIds?: number[] | null
  ): Array<number | null> {
    const ids = this.normalizarIds(sucIds);
    return ids.length ? Array.from(new Set(ids)) : [null];
  }
}
