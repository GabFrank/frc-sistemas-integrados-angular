import { FormatoQrPos } from './formato-qr-pos.model';
import {
  cuponVencido,
  formatoCruzado,
  MAX_LONGITUD_QR,
  ordenarPorProveedor,
  parsearCupon,
} from './qr-pos-parser';

/** Los decimales reales de financiero.moneda: GUARANI 0, REAL 2, DOLAR 2. */
const DECIMALES = { 1: 0, 2: 2, 3: 2 };

const FRCP1: FormatoQrPos = {
  id: 1,
  nombre: 'ValidaPix FRCP1',
  activo: true,
  patron:
    '^FRCP1\\*(?<auth>[A-Z0-9]{0,20})\\*(?<bol>[A-Z0-9]{0,20})\\*(?<cur>PYG|BRL|USD)\\*(?<amt>[0-9]{1,15})\\*(?<ref>[A-Z0-9]{0,40})\\*(?<ts>[0-9]{12})$',
  mapeo: JSON.stringify({
    codigoAutorizacion: { de: 'auth' },
    numeroBoleta: { de: 'bol' },
    moneda: { de: 'cur', mapa: { PYG: 1, BRL: 2, USD: 3 } },
    monto: { de: 'amt', escalaSegunMoneda: true },
    identificadorTransaccion: { de: 'ref' },
    fecha: { de: 'ts', formato: 'yyyyMMddHHmm', zona: 'America/Asuncion' },
  }),
  ejemplo: 'FRCP1*CXF1**BRL*9455*E60701190202608271700DY5BCKNPMBQ*202608271401',
};

/** Cupón real de ValidaPix, el que trajo Gabriel el 2026-08-27. */
const CUPON_REAL = 'FRCP1*CXF1**BRL*9455*E60701190202608271700DY5BCKNPMBQ*202608271401';

describe('qr-pos-parser', () => {
  it('lee el cupón real de ValidaPix campo por campo', () => {
    const r = parsearCupon(CUPON_REAL, [FRCP1], DECIMALES);

    expect(r.ok).toBeTrue();
    expect(r.datos.codigoAutorizacion).toBe('CXF1');
    expect(r.datos.monedaId).toBe(2);
    expect(r.datos.identificadorTransaccion).toBe('E60701190202608271700DY5BCKNPMBQ');
    expect(r.datos.qrCrudo).toBe(CUPON_REAL);
  });

  // Trampa 1: BOL viene vacío y el cupón trae '**'. Colapsar los vacíos corre las posiciones y
  // la moneda se leería como número de boleta.
  it('trata el número de boleta vacío como dato válido, sin correr las posiciones', () => {
    const r = parsearCupon(CUPON_REAL, [FRCP1], DECIMALES);

    expect(r.datos.numeroBoleta).toBe('');
    expect(r.datos.monedaId).toBe(2); // y NO interpretó 'BRL' como boleta
  });

  // Trampa 2: el importe viene en la menor unidad y cuánto vale depende de la moneda.
  it('escala el importe según los decimales de la moneda', () => {
    const enReales = parsearCupon(CUPON_REAL, [FRCP1], DECIMALES);
    expect(enReales.datos.monto).toBe(94.55);

    const enGuaranies = parsearCupon(
      'FRCP1*CXF1**PYG*9455*E607011902026082717AAA*202608271401',
      [FRCP1],
      DECIMALES
    );
    expect(enGuaranies.datos.monto).toBe(9455);
  });

  // Trampa 3: TS es hora local. Interpretarlo como UTC lo correría 3 horas.
  it('interpreta la fecha como hora local, no como UTC', () => {
    const r = parsearCupon(CUPON_REAL, [FRCP1], DECIMALES);
    const f = r.datos.fecha;

    expect(f.getFullYear()).toBe(2026);
    expect(f.getMonth()).toBe(7); // agosto
    expect(f.getDate()).toBe(27);
    expect(f.getHours()).toBe(14);
    expect(f.getMinutes()).toBe(1);
  });

  it('rechaza una cadena que ningún formato reconoce', () => {
    const r = parsearCupon('CUALQUIER COSA', [FRCP1], DECIMALES);

    expect(r.ok).toBeFalse();
    expect(r.error).toContain('no corresponde a ningún formato');
  });

  it('rechaza una cadena más larga que el tope', () => {
    const r = parsearCupon('X'.repeat(MAX_LONGITUD_QR + 1), [FRCP1], DECIMALES);

    expect(r.ok).toBeFalse();
    expect(r.error).toContain('máximo');
  });

  it('avisa cuando no hay ningún formato cargado', () => {
    const r = parsearCupon(CUPON_REAL, [], DECIMALES);

    expect(r.ok).toBeFalse();
    expect(r.error).toContain('Formatos de QR');
  });

  // Un patrón inválido llega por replicación y se evalúa en el PDV: no puede tumbar la caja.
  it('saltea un formato con patrón inválido y sigue con los demás', () => {
    const roto: FormatoQrPos = { id: 9, nombre: 'roto', activo: true, patron: '^(?<a', mapeo: '{}' };
    const r = parsearCupon(CUPON_REAL, [roto, FRCP1], DECIMALES);

    expect(r.ok).toBeTrue();
    expect(r.datos.formato.nombre).toBe('ValidaPix FRCP1');
  });

  it('rechaza una fecha que no existe', () => {
    const r = parsearCupon(
      'FRCP1*CXF1**BRL*9455*E607011902026082717AAA*202602300000',
      [FRCP1],
      DECIMALES
    );

    expect(r.ok).toBeFalse();
    expect(r.error).toContain('no existe');
  });

  it('rechaza una moneda que el mapeo no conoce', () => {
    const conArs: FormatoQrPos = {
      ...FRCP1,
      patron: FRCP1.patron.replace('PYG|BRL|USD', 'PYG|BRL|USD|ARS'),
    };
    const r = parsearCupon(
      'FRCP1*CXF1**ARS*9455*E607011902026082717AAA*202608271401',
      [conArs],
      DECIMALES
    );

    expect(r.ok).toBeFalse();
    expect(r.error).toContain('no está en el mapeo');
  });

  describe('ordenarPorProveedor', () => {
    const delProveedor: FormatoQrPos = { id: 1, nombre: 'suyo', activo: true, proveedorServicio: { id: 7 } };
    const comodin: FormatoQrPos = { id: 2, nombre: 'comodín', activo: true };
    const ajeno: FormatoQrPos = { id: 3, nombre: 'ajeno', activo: true, proveedorServicio: { id: 8 } };

    it('pone primero el del proveedor de la terminal escaneada', () => {
      const orden = ordenarPorProveedor([ajeno, comodin, delProveedor], 7);
      expect(orden.map((f) => f.nombre)).toEqual(['suyo', 'comodín', 'ajeno']);
    });

    it('deja los ajenos al final en vez de descartarlos, para poder detectar la terminal equivocada', () => {
      const orden = ordenarPorProveedor([ajeno, delProveedor], 7);
      expect(orden.length).toBe(2);
    });

    it('descarta los formatos inactivos', () => {
      const orden = ordenarPorProveedor([{ ...comodin, activo: false }, delProveedor], 7);
      expect(orden.map((f) => f.nombre)).toEqual(['suyo']);
    });
  });

  describe('cuponVencido', () => {
    it('acepta un cupón de hace una hora', () => {
      const hace1h = new Date(Date.now() - 3600 * 1000);
      expect(cuponVencido(hace1h)).toBeFalse();
    });

    it('marca vencido un cupón de hace más de 24 horas', () => {
      const hace25h = new Date(Date.now() - 25 * 3600 * 1000);
      expect(cuponVencido(hace25h)).toBeTrue();
    });

    it('no considera vencido un cupón sin fecha', () => {
      expect(cuponVencido(undefined)).toBeFalse();
    });
  });

  describe('ordenarPorProveedor — tipos del id', () => {
    const deValidaPix: FormatoQrPos = { id: 1, nombre: 'vpx', activo: true, proveedorServicioId: 7 };
    const deBancard: FormatoQrPos = { id: 2, nombre: 'bcd', activo: true, proveedorServicioId: 8 };
    const comodin: FormatoQrPos = { id: 3, nombre: 'comodin', activo: true };

    // El id de la terminal sale de ProveedorServicio.id, que es `ID` de GraphQL y llega STRING.
    // Con === estricto el formato propio quedaba empatado con los ajenos y el comodín se probaba
    // antes, justo al revés de lo que la función existe para lograr.
    it('pone primero el formato de la terminal aunque su id venga como string', () => {
      const r = ordenarPorProveedor([comodin, deBancard, deValidaPix], '7' as any);

      expect(r[0].nombre).toBe('vpx');
    });

    it('el comodín va antes que los formatos de otros proveedores', () => {
      const r = ordenarPorProveedor([deBancard, comodin], '7' as any);

      expect(r[0].nombre).toBe('comodin');
      expect(r[1].nombre).toBe('bcd');
    });
  });

  describe('formatoCruzado', () => {
    const deValidaPix: FormatoQrPos = { id: 1, nombre: 'x', proveedorServicioId: 7 };
    const deBancard: FormatoQrPos = { id: 2, nombre: 'y', proveedorServicioId: 8 };
    const comodinFmt: FormatoQrPos = { id: 3, nombre: 'z' };

    it('detecta el cupón de otro proveedor', () => {
      expect(formatoCruzado(deBancard, 7)).toBeTrue();
    });

    it('no marca cruce cuando el formato es del mismo proveedor de la terminal', () => {
      expect(formatoCruzado(deValidaPix, 7)).toBeFalse();
    });

    it('un formato comodín nunca es cruce', () => {
      expect(formatoCruzado(comodinFmt, 7)).toBeFalse();
    });

    it('sin proveedor conocido de la terminal, no hay nada que comparar', () => {
      expect(formatoCruzado(deBancard, undefined)).toBeFalse();
    });

    // Los dos valores vienen del mismo backend con tipos GraphQL distintos: el del formato es
    // `Int` (número) y el de la terminal sale de ProveedorServicio.id, que es `ID!` (string).
    // Sin normalizar, 7 !== '7' daba true y todo cupón correcto se marcaba como cruzado.
    it('no marca cruce cuando el id de la terminal viene como string (ID de GraphQL)', () => {
      expect(formatoCruzado(deValidaPix, '7' as any)).toBeFalse();
    });

    it('sigue detectando el cruce real con el id de la terminal como string', () => {
      expect(formatoCruzado(deBancard, '7' as any)).toBeTrue();
    });

    it('no marca cruce cuando el formato trae el proveedor anidado como string', () => {
      const anidado: FormatoQrPos = { id: 4, nombre: 'w', proveedorServicio: { id: '7' } as any };
      expect(formatoCruzado(anidado, 7)).toBeFalse();
    });
  });
});
