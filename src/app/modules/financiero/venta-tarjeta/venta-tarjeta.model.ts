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
}
