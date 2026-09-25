export interface VentaTarjeta {
  id: number;
  sucursalId: number;

  /**
   * El CENTRAL devuelve los objetos `caja` / `venta`; el FILIAL devuelve los escalares
   * `cajaId` / `ventaId`. Conviven porque las dos pantallas usan el mismo modelo: la lista del
   * sidebar consulta al central y la del PDV al filial.
   */
  cajaId?: number;
  ventaId?: number;

  caja?: { id: number };
  sucursal?: { id: number; nombre: string; };
  venta?: { id: number; totalGs: number; };
  terminalPos?: {
    id: number; codigo: string; descripcion: string;
    /**
     * Si en esta terminal se puede tipear el cupón a mano. `null` = hereda la configuración
     * general.
     *
     * Se pide acá porque el diálogo de completar un pendiente tiene que respetarla igual que el
     * del PDV: si no, apagar la perilla cierra la carga a mano durante la venta y la deja abierta
     * al completar después — la misma configuración valiendo o no según por qué puerta entró.
     */
    cargaManualPermitida?: boolean;
    proveedorServicio?: { id: number };
    moneda?: { id: number; simbolo: string; decimales?: number };
    /**
     * Formato del modelo de aparato. De acá sale el tipo, que decide qué camino se le ofrece al
     * cajero y cuál se le cierra. `null` = sin configurar, y entonces el diálogo bloquea.
     *
     * Es un tipo propio y no `TerminalPos` del módulo de terminales: esta interfaz describe lo que
     * la query de `venta_tarjeta` trae anidado, que es un subconjunto.
     */
    formatoTerminalPos?: { id?: number; nombre?: string; tipo?: string; mapeo?: string };
  };
  /**
   * Moneda del cobro que este registro respalda. Es la que hay que usar para mostrar `monto` y
   * `montoEscaneado`: la de la terminal es configuración mutable, y usarla hacía que cambiarla
   * reescribiera el significado de todo el histórico de esa terminal.
   */
  moneda?: { id: number; simbolo: string; decimales?: number };
  monto: number;
  montoEscaneado?: number;
  estado: string;
  creadoEn: string;
  usuario?: { id: number; nickname: string; };
  /**
   * Simbolo y formato de `monto` / `montoEscaneado`, calculados una sola vez al recibir la fila.
   * Se precalculan porque el template no puede llamar funciones ni getters (costo de change
   * detection) y porque los decimales dependen de la moneda: Gs. no lleva ninguno y R$ lleva dos,
   * asi que un `1.0-2` fijo mostraba "55,5 R$" en vez de "55,50 R$".
   */
  simboloMoneda?: string;
  digitosMoneda?: string;
  /**
   * Por qué este cobro quedó sin conciliar: `CUPON_NO_IMPRESO` | `POS_FALLADO` | `CUPON_PERDIDO` |
   * `OTRO`. `null` en todo lo que no sea NO_COMPLETADO, y también en los NO_COMPLETADO viejos:
   * antes de esta entrega el estado no guardaba ni quién lo marcó ni por qué.
   */
  noCompletadoMotivo?: string;
  /** Lo que el cajero escribió. Obligatorio cuando el motivo es `OTRO`. */
  noCompletadoObservacion?: string;
  /** Quién decidió cerrar sin conciliar. Es a quien hay que preguntarle al revisar. */
  noCompletadoPor?: { id: number; nickname: string; };
  noCompletadoEn?: string;
  /**
   * Quién devolvió este cobro de `NO_COMPLETADO` a `PENDIENTE`, y cuándo. `null` = nunca se
   * reabrió.
   *
   * Conviven con las `noCompletado*`: reabrir NO las borra. Si las limpiara, la fila volvería a
   * decir sólo «pendiente» y se perdería justo lo que §8 existe para guardar — por qué alguien la
   * había dado por perdida. Con las dos puestas, la fila cuenta la historia entera: se marcó por
   * X, y después Y la reabrió.
   */
  reabiertoPor?: { id: number; nickname: string; };
  reabiertoEn?: string;
  /** El motivo en palabras, calculado al recibir la fila: el template no puede llamar funciones. */
  motivoTexto?: string;
}

/** Los motivos válidos, con el texto que ve el cajero. Espeja el CHECK de la columna (V102.5). */
export const MOTIVOS_NO_COMPLETADO: { valor: string; texto: string }[] = [
  { valor: 'CUPON_NO_IMPRESO', texto: 'El cupón no se imprimió' },
  { valor: 'POS_FALLADO', texto: 'La terminal falló después de cobrar' },
  { valor: 'CUPON_PERDIDO', texto: 'El cupón se perdió' },
  { valor: 'OTRO', texto: 'Otro motivo' },
];

/** El texto de un motivo, o el código crudo si viniera uno que esta versión no conoce. */
export function textoMotivoNoCompletado(motivo: string): string {
  if (!motivo) return null;
  const m = MOTIVOS_NO_COMPLETADO.find((x) => x.valor === motivo);
  return m ? m.texto : motivo;
}
