import { esCentralSinMonedaPorModulo, mensajeCotizacionVieja, mensajeSinCotizacion } from './configuracion-moneda-modulo.service';

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

describe('esCentralSinMonedaPorModulo', () => {
  it('reconoce el rechazo de un central sin V258.5', () => {
    expect(esCentralSinMonedaPorModulo({ message: 'Validation error of type UnknownType: Unknown type ModuloMoneda' })).toBeTrue();
    expect(esCentralSinMonedaPorModulo({ graphQLErrors: [{ message: "Validation error of type FieldUndefined: Field 'configuracionesMonedaModulo' in type 'Query' is undefined" }] })).toBeTrue();
  });

  it('un error de red o de permiso no es eso', () => {
    expect(esCentralSinMonedaPorModulo({ message: 'Http failure response for http://localhost:8081/graphql: 0 Unknown Error' })).toBeFalse();
    expect(esCentralSinMonedaPorModulo({ message: 'No autorizado: hace falta el rol CONFIGURAR MONEDA' })).toBeFalse();
    expect(esCentralSinMonedaPorModulo(null)).toBeFalse();
  });
});

describe('mensajeCotizacionVieja', () => {
  it('saca el detalle del rechazo COTIZACION_VIEJA, también con el prefijo de graphql-java', () => {
    expect(mensajeCotizacionVieja('COTIZACION_VIEJA: La ultima cotizacion de DOLAR es del 23/03/2026.'))
      .toBe('La ultima cotizacion de DOLAR es del 23/03/2026.');
    expect(mensajeCotizacionVieja('Exception while fetching data (/saveConfiguracionMonedaModulo) : COTIZACION_VIEJA: La ultima cotizacion de REAL es del 01/01/2026.'))
      .toBe('La ultima cotizacion de REAL es del 01/01/2026.');
  });

  it('otro rechazo no es suyo', () => {
    expect(mensajeCotizacionVieja('SIN_COTIZACION: DOLAR no tiene cotizacion cargada.')).toBeNull();
    expect(mensajeCotizacionVieja(null)).toBeNull();
  });
});
