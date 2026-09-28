import { codificarQr, descodificarQr } from './qr-code.component';
import { TipoEntidad } from '../../generics/tipo-entidad.enum';

/**
 * El contrato de la cadena del QR, ejercitado con los montos que lo rompen.
 *
 * `codificarQr` une los campos con `-` y `descodificarQr` hace `split('-')` **por posición**: el
 * campo 6 es `data` porque es el séptimo pedazo, no porque se llame así. Un guión dentro de
 * cualquier campo corre todo lo que viene después, y el descodificado no falla — devuelve otra
 * cosa. Por eso `data` usa `|` adentro.
 *
 * El caso que importa es el monto: la seña del cobro lo mete crudo en `data`, y un monto negativo
 * trae su propio `-`. Nadie lo había probado (lo anotó la auditoría del plan de conciliación).
 */
describe('QR de la seña — el monto adentro de `data`', () => {

  const armar = (monto: number) =>
    codificarQr({
      sucursalId: 24,
      tipoEntidad: TipoEntidad.VENTA_TARJETA,
      idOrigen: 35518,
      idCentral: 35518,
      componentToOpen: 'RegistroVentaTarjetaComponent',
      data: 654 + '|' + monto + '|' + 36,
      timestamp: 1789585296361,
    });

  it('sobrevive a un monto entero', () => {
    const leido: any = descodificarQr(armar(32000));
    expect(leido.tipoEntidad).toBe('VT');
    expect(leido.idOrigen).toBe('35518');
    expect(leido.data).toBe('654|32000|36');
  });

  it('sobrevive a un monto con decimales: el punto no es separador', () => {
    const leido: any = descodificarQr(armar(55.5));
    expect(leido.data).toBe('654|55.5|36');
    expect(leido.data.split('|')[2]).toBe('36');
  });

  it('un monto NEGATIVO corre los campos: su `-` se confunde con el separador', () => {
    const cadena = armar(-32000);
    const leido: any = descodificarQr(cadena);

    // No es un capricho del test: es lo que hoy pasa. El `-` del monto agrega un pedazo, así que
    // `data` deja de ser el que estaba en la posición 6 y el timestamp cae fuera del objeto.
    expect(leido.data).not.toBe('654|-32000|36');
    expect(leido.timestamp).not.toBe('1789585296361');

    // Y se descodifica SIN error, que es lo que lo hace peligroso: quien lo lea cree que tiene un
    // QR válido. Si algún día un cobro puede ser negativo (una devolución con tarjeta), el
    // separador tiene que dejar de ser `-` o el monto tiene que salir de `data`.
    expect(leido.tipoEntidad).toBe('VT');
  });
});
