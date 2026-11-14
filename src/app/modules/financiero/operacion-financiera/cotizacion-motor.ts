/**
 * Motor de la cotización del cambio de divisa (desk #720 §2-3, central #603). Funciones puras: el diálogo guarda el
 * estado y las llama.
 *
 * Formato de casa de cambio: la cotización siempre es «unidades de la moneda MENOR por 1 de la MAYOR» (1 US$ = 5,60 R$;
 * 1 US$ = 6.400 Gs). Si el origen es la mayor, destino = origen × cot; si es la menor, destino = origen ÷ cot.
 *
 * La cotización es el ancla: escrita por el usuario o traída del sistema queda FIJA y los montos se calculan con ella;
 * vacía, se CALCULA de los dos montos y se recalcula al editarlos. Antes el campo derivado era «el que no está entre
 * los dos últimos tocados», y apenas se tocaban los dos montos la cotización quedaba derivada: escribir el origen
 * recalculaba la cotización y el destino no se movía.
 */
export interface MonedaMotor {
  id?: number;
  principal?: boolean;
  /** Última cotización contra la moneda principal (Gs por 1). Null si no hay; la principal vale 1. */
  valorEnGs?: number | null;
}

/**
 * true si el origen es la moneda de mayor valor; null si todavía no se puede decidir. Entre la principal y una divisa,
 * la divisa. Con las dos cotizaciones, la de mayor valor. Si falta alguna, la de monto menor (si ya están los dos).
 */
export function origenEsMayor(origen: MonedaMotor, destino: MonedaMotor, montoOrigen?: number | null,
                              montoDestino?: number | null): boolean | null {
  if (!origen || !destino) return null;
  if (origen.principal && !destino.principal) return false;
  if (destino.principal && !origen.principal) return true;
  const vo = origen.principal ? 1 : origen.valorEnGs;
  const vd = destino.principal ? 1 : destino.valorEnGs;
  if (vo > 0 && vd > 0 && vo !== vd) return vo > vd;
  if (montoOrigen > 0 && montoDestino > 0) return montoOrigen <= montoDestino;
  return null;
}

export function destinoDesdeOrigen(origen: number, cot: number, mayorEsOrigen: boolean): number {
  return mayorEsOrigen ? origen * cot : origen / cot;
}

export function origenDesdeDestino(destino: number, cot: number, mayorEsOrigen: boolean): number {
  return mayorEsOrigen ? destino / cot : destino * cot;
}

/** «Menor por 1 mayor» a partir de los montos. */
export function cotizacionDeMontos(origen: number, destino: number, mayorEsOrigen: boolean): number {
  return mayorEsOrigen ? destino / origen : origen / destino;
}

/**
 * La cotización cruzada del sistema entre dos divisas, las dos contra la principal: 1 US$ = 6.400 Gs y 1 R$ = 1.200 Gs
 * dan 5,33 R$ por 1 US$. Null si falta alguna.
 */
export function cotizacionCruzada(mayor: MonedaMotor, menor: MonedaMotor): number | null {
  const vMayor = mayor?.principal ? 1 : mayor?.valorEnGs;
  const vMenor = menor?.principal ? 1 : menor?.valorEnGs;
  if (!(vMayor > 0) || !(vMenor > 0)) return null;
  return vMayor / vMenor;
}

/** Lo que tiene que cambiar después de que el usuario editó un campo. undefined = no tocar ese campo. */
export interface Recalculo {
  montoOrigen?: number;
  montoDestino?: number;
  cotizacion?: number;
}

/**
 * Qué recalcular. `fija`: la cotización es del usuario o del sistema. `editado`: el campo que acaba de cambiar.
 * Fija: un monto calcula el otro; la cotización nunca se recalcula sola. Calculada: con los dos montos se calcula.
 */
export function recalcular(editado: 'origen' | 'destino' | 'cotizacion', fija: boolean,
                           v: { origen?: number | null; destino?: number | null; cotizacion?: number | null },
                           mayorEsOrigen: boolean | null): Recalculo {
  if (mayorEsOrigen == null) return {};
  const cot = v.cotizacion > 0 ? v.cotizacion : null;
  if (fija && cot) {
    if (editado === 'destino') {
      return v.destino != null ? { montoOrigen: origenDesdeDestino(v.destino, cot, mayorEsOrigen) } : {};
    }
    // Origen, o la cotización recién escrita: se recalcula el destino (si no hay origen, el origen desde el destino).
    if (v.origen != null) return { montoDestino: destinoDesdeOrigen(v.origen, cot, mayorEsOrigen) };
    if (editado === 'cotizacion' && v.destino != null) return { montoOrigen: origenDesdeDestino(v.destino, cot, mayorEsOrigen) };
    return {};
  }
  if (v.origen > 0 && v.destino > 0) return { cotizacion: cotizacionDeMontos(v.origen, v.destino, mayorEsOrigen) };
  return {};
}
