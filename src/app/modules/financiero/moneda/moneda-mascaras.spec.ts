import { Moneda } from './moneda.model';
import { MonedaService } from './moneda.service';

/**
 * La fábrica única de máscaras tiene que dar lo mismo que las copias locales que reemplazó y que
 * la regla anterior por denominación. Las copias están transcriptas acá tal cual eran.
 */
const PYG = Object.assign(new Moneda(), { id: 1, denominacion: 'GUARANI', simbolo: 'Gs.', decimales: 0 });
const USD = Object.assign(new Moneda(), { id: 2, denominacion: 'DOLAR', simbolo: 'U$', decimales: 2 });
const BRL = Object.assign(new Moneda(), { id: 3, denominacion: 'REAL', simbolo: 'R$', decimales: 2 });
const SIN_DECIMALES = [
  Object.assign(new Moneda(), { denominacion: 'GUARANI', simbolo: 'Gs.' }),
  Object.assign(new Moneda(), { denominacion: 'DOLAR', simbolo: 'U$' }),
  Object.assign(new Moneda(), { denominacion: 'REAL' }),
];
const TODAS = [PYG, USD, BRL, ...SIN_DECIMALES, null];

// ajustar-saldo-cuenta-dialog (antes)
function ajustarSaldo(moneda: any): any {
  const decimales = moneda?.decimales != null
    ? moneda.decimales
    : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
  return {
    align: 'right', allowNegative: false, decimal: ',', precision: decimales, thousands: '.',
    prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '', suffix: '', nullable: true, min: 0, max: null,
  };
}

// add-operacion-financiera-dialog (antes)
function operacionFinanciera(moneda: any): any {
  const decimales = moneda?.decimales != null ? moneda.decimales
    : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
  return {
    allowNegative: false, allowZero: true, precision: decimales, thousands: '.',
    decimal: decimales > 0 ? ',' : '', align: 'right', prefix: moneda?.simbolo ? moneda.simbolo + ' ' : '',
    suffix: '', nullable: true, min: 0, max: null,
  };
}

// pagar-compras-dialog y maletin-tesoreria-dialog (antes, iguales entre sí)
function pagarComprasYMaletin(moneda: any): any {
  const dec = moneda?.decimales != null ? moneda.decimales
    : ((moneda?.denominacion || '').toUpperCase().includes('GUARANI') ? 0 : 2);
  return {
    allowNegative: false, allowZero: false, precision: dec,
    thousands: '.', decimal: dec > 0 ? ',' : '', align: 'right',
    prefix: (moneda?.simbolo ? moneda.simbolo + ' ' : ''), suffix: '', nullable: true, min: 0, max: null,
  };
}

describe('MonedaService — máscaras de montos', () => {
  const service = new MonedaService(null, null, null, null, null, null);

  it('currencyOptionsByMoneda da lo mismo que la regla por denominación para PYG, USD y BRL', () => {
    const anterior = (m: Moneda) => m.denominacion === 'GUARANI'
      ? service.currencyOptionsGuarani : service.currencyOptionsNoGuarani;
    [PYG, USD, BRL, ...SIN_DECIMALES].forEach((m) => {
      expect(service.currencyOptionsByMoneda(m)).toBe(anterior(m));
    });
  });

  it('currencyOptionsByMoneda decide por decimales cuando vienen', () => {
    const pygMalNombrado = Object.assign(new Moneda(), { denominacion: 'GUARANIES', decimales: 0 });
    expect(service.currencyOptionsByMoneda(pygMalNombrado)).toBe(service.currencyOptionsGuarani);
    const tres = service.currencyOptionsByMoneda(Object.assign(new Moneda(), { denominacion: 'X', decimales: 3 }));
    expect(tres.precision).toBe(3);
    expect(tres.thousands).toBe(',');
    expect(service.currencyOptionsNoGuarani.precision).toBe(2);
  });

  it('reemplaza la copia del ajuste de saldo', () => {
    TODAS.forEach((m) => expect(service.currencyOptionsMontoPositivo(m, { decimalSinDecimales: ',' }))
      .toEqual(ajustarSaldo(m)));
  });

  it('reemplaza la copia de la operación financiera', () => {
    TODAS.forEach((m) => expect(service.currencyOptionsMontoPositivo(m, { allowZero: true }))
      .toEqual(operacionFinanciera(m)));
  });

  it('reemplaza las copias del pago de compras y del maletín', () => {
    TODAS.forEach((m) => expect(service.currencyOptionsMontoPositivo(m, { allowZero: false }))
      .toEqual(pagarComprasYMaletin(m)));
  });
});
