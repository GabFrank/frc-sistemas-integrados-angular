export interface VentaTarjeta {
  id: number;
  sucursalId: number;
  caja?: { id: number };
  sucursal?: { id: number; nombre: string; };
  venta?: { id: number; totalGs: number; };
  terminalPos?: {
    id: number; codigo: string; descripcion: string;
    proveedorServicio?: { id: number };
    moneda?: { id: number; simbolo: string; decimales?: number };
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
}
