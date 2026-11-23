import {
  configuracionesVisibles, esCentralSinMonedaPorModulo, mensajeCotizacionVieja, mensajeSinCotizacion, otrasActivasConLaMismaMoneda
} from './configuracion-moneda-modulo.service';
import { ConfiguracionMonedaModulo, ModuloMoneda } from './configuracion-moneda-modulo.model';

function cfg(id: number, modulo: ModuloMoneda, sucursalId: number | null, monedaId: number, desde: string,
             activo = true): ConfiguracionMonedaModulo {
  return {
    id, modulo, activo, vigenteDesde: desde as any,
    sucursal: sucursalId != null ? ({ id: sucursalId } as any) : null,
    moneda: { id: monedaId } as any,
    usuarioNickname: null, creadoEn: null,
  };
}

describe('configuracionesVisibles', () => {
  const ahora = new Date('2026-11-14T12:00:00');
  const ids = (l: ConfiguracionMonedaModulo[]) => l.map((c) => c.id);

  it('por clave deja la activa que rige y esconde las anteriores y las inactivas', () => {
    const filas = [
      cfg(12, ModuloMoneda.PDV, 2, 2, '2026-11-11T08:00:00'),
      cfg(11, ModuloMoneda.PDV, 2, 2, '2026-11-10T16:00:00'),
      cfg(10, ModuloMoneda.PDV, 2, 2, '2026-11-09T16:00:00', false),
      cfg(9, ModuloMoneda.PRECIOS, null, 2, '2026-11-10T16:00:00'),
      cfg(8, ModuloMoneda.PDV, null, 1, '2026-11-01T00:00:00'),
    ];
    expect(ids(configuracionesVisibles(filas, ahora))).toEqual([12, 9, 8]);
  });

  it('muestra las programadas además de la que rige', () => {
    const filas = [
      cfg(3, ModuloMoneda.COMPRAS, null, 1, '2026-12-01T00:00:00'),
      cfg(2, ModuloMoneda.COMPRAS, null, 2, '2026-11-10T00:00:00'),
      cfg(1, ModuloMoneda.COMPRAS, null, 1, '2026-11-01T00:00:00'),
    ];
    expect(ids(configuracionesVisibles(filas, ahora))).toEqual([3, 2]);
  });

  it('con el reloj de la PC adelantado menos de un día no esconde la que rige en el central', () => {
    // El central (12:00) todavía rige la 2; la PC (20:00) ya pasó el inicio de la 3, programada a las 15:00.
    const filas = [
      cfg(3, ModuloMoneda.COMPRAS, null, 1, '2026-11-14T15:00:00'),
      cfg(2, ModuloMoneda.COMPRAS, null, 2, '2026-11-10T00:00:00'),
    ];
    expect(ids(configuracionesVisibles(filas, new Date('2026-11-14T20:00:00')))).toEqual([3, 2]);
  });

  it('una clave sin activas muestra su fila más reciente', () => {
    const filas = [
      cfg(20, ModuloMoneda.COSTOS, null, 2, '2026-11-13T10:00:00', false),
      cfg(4, ModuloMoneda.COSTOS, null, 2, '2026-11-10T15:00:00', false),
    ];
    expect(ids(configuracionesVisibles(filas, ahora))).toEqual([20]);
  });
});

describe('otrasActivasConLaMismaMoneda', () => {
  it('cuenta las otras activas de la misma clave y moneda', () => {
    const filas = [
      cfg(12, ModuloMoneda.PDV, 2, 2, '2026-11-11T08:00:00'),
      cfg(11, ModuloMoneda.PDV, 2, 2, '2026-11-10T16:00:00'),
      cfg(10, ModuloMoneda.PDV, 2, 2, '2026-11-09T16:00:00', false),
      cfg(9, ModuloMoneda.PDV, 2, 1, '2026-11-08T16:00:00'),
      cfg(8, ModuloMoneda.PDV, null, 2, '2026-11-08T16:00:00'),
    ];
    expect(otrasActivasConLaMismaMoneda(filas, filas[0])).toBe(1);
    expect(otrasActivasConLaMismaMoneda(filas, filas[3])).toBe(0);
  });
});

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
