/**
 * Valores indexados por id de sucursal, que encuentran la sucursal venga su id como venga.
 *
 * `Sucursal.id` se declara `number`, pero es `ID` en el schema y Apollo lo entrega como string
 * (`"1"`). Un `Map<number, T>` con la clave convertida y buscado con el `id` tal como vino de
 * GraphQL no encuentra nada, y el `?? 0` del llamador lo muestra como cero: es lo que dejó el
 * stock por sucursal en cero en beta. Acá el id se normaliza igual al guardar y al buscar.
 *
 * Un id vacío o que no es un entero no es una clave: `set` lo ignora y `get` devuelve
 * `undefined`. Sin eso `Number("")` sería 0, y `Number("abc")` sería NaN, que `Map` trata como una
 * sola clave, así que dos ids basura se encontrarían entre sí.
 */
export class PorSucursal<T> {
  private readonly valores = new Map<number, T>();

  set(sucursalId: number | string, valor: T): void {
    const clave = PorSucursal.normalizar(sucursalId);
    if (clave != null) {
      this.valores.set(clave, valor);
    }
  }

  get(sucursalId: number | string): T | undefined {
    const clave = PorSucursal.normalizar(sucursalId);
    return clave == null ? undefined : this.valores.get(clave);
  }

  private static normalizar(sucursalId: number | string): number | null {
    if (sucursalId == null || (typeof sucursalId === 'string' && sucursalId.trim() === '')) {
      return null;
    }
    const clave = Number(sucursalId);
    return Number.isInteger(clave) ? clave : null;
  }
}
