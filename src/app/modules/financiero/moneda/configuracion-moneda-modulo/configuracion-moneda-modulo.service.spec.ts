import { mensajeSinCotizacion } from './configuracion-moneda-modulo.service';

describe('mensajeSinCotizacion', () => {
  it('traduce el rechazo SIN_COTIZACION, también con el prefijo de graphql-java', () => {
    expect(mensajeSinCotizacion('SIN_COTIZACION: DOLAR no tiene cotizacion cargada.'))
      .toBe('Sin cotización: DOLAR no tiene cotizacion cargada.');
    expect(mensajeSinCotizacion('Exception while fetching data (/saveConfiguracionMonedaModulo) : SIN_COTIZACION: REAL no tiene'))
      .toBe('Sin cotización: REAL no tiene');
    expect(mensajeSinCotizacion('SIN_COTIZACION')).toBe('Sin cotización: la moneda no tiene cotización cargada.');
  });

  it('otro rechazo no es suyo', () => {
    expect(mensajeSinCotizacion('Solo el modulo PDV admite una moneda por sucursal.')).toBeNull();
    expect(mensajeSinCotizacion(null)).toBeNull();
    expect(mensajeSinCotizacion(undefined)).toBeNull();
  });
});
