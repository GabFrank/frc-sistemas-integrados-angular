import { cantidadParaLotePrincipal, lotesExtraValidos, LoteExtra } from './recepcion-mercaderia-verificar-item-dialog.component';

/** Lotes flexibles (#429): una compra con dos lotes para la misma sucursal se puede cerrar. */
describe('Verificación con varios lotes por sucursal', () => {
  const extra = (lote: string, cantidad: number): LoteExtra => ({ lote, vencimiento: null, cantidad });

  it('sin lotes adicionales el principal se lleva todo y es válido', () => {
    expect(cantidadParaLotePrincipal(4, [])).toBe(4);
    expect(lotesExtraValidos(4, [])).toBeTrue();
  });

  it('4 recibidas con 2 en un lote adicional: 2 quedan para el principal', () => {
    expect(cantidadParaLotePrincipal(4, [extra('LOTE-B', 2)])).toBe(2);
    expect(lotesExtraValidos(4, [extra('LOTE-B', 2)])).toBeTrue();
  });

  it('los adicionales no pueden pasarse de lo recibido', () => {
    expect(cantidadParaLotePrincipal(4, [extra('LOTE-B', 3), extra('LOTE-C', 2)])).toBe(-1);
    expect(lotesExtraValidos(4, [extra('LOTE-B', 3), extra('LOTE-C', 2)])).toBeFalse();
  });

  it('un adicional sin número o sin cantidad no es válido', () => {
    expect(lotesExtraValidos(4, [extra('', 2)])).toBeFalse();
    expect(lotesExtraValidos(4, [extra('LOTE-B', 0)])).toBeFalse();
  });
});
