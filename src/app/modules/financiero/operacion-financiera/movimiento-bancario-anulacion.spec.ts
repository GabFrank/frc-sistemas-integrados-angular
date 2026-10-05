import { accionAnularMovimientoBancario, PermisosAnulacionBancaria } from './movimiento-bancario-anulacion';

describe('accionAnularMovimientoBancario', () => {
  const TODO: PermisosAnulacionBancaria = { gestionar: true, pagarCpp: true };
  const SOLO_PAGAR: PermisosAnulacionBancaria = { gestionar: false, pagarCpp: true };
  const NADA: PermisosAnulacionBancaria = { gestionar: false, pagarCpp: false };
  const mov = (m: any) => ({ anulado: false, origenTipo: null, origenId: null, pagoId: null, ...m });

  it('no ofrece menú en un movimiento ya anulado, aunque sea de un pago', () => {
    const a = accionAnularMovimientoBancario(mov({ anulado: true, origenTipo: 'PAGO_CPP', origenId: 5, pagoId: 5 }), TODO);
    expect(a.visible).toBeFalse();
    expect(a.habilitada).toBeFalse();
  });

  it('no ofrece menú en el contra-movimiento de una anulación', () => {
    // Su origenId es el id del movimiento original, no un pago ni una operación.
    const a = accionAnularMovimientoBancario(mov({ origenTipo: 'ANULACION', origenId: 77 }), TODO);
    expect(a.visible).toBeFalse();
  });

  it('anula por evento la pata bancaria de un pago', () => {
    const a = accionAnularMovimientoBancario(mov({ origenTipo: 'PAGO_CPP', origenId: 5, pagoId: 5 }), TODO);
    expect(a.habilitada).toBeTrue();
    expect(a.via).toBe('PAGO');
    expect(a.aviso).toContain('notas de recepción');
  });

  it('anula por evento el cheque al contado de un pago, que no trae origenId', () => {
    const a = accionAnularMovimientoBancario(mov({ origenTipo: 'CHEQUE', origenId: null, pagoId: 9 }), TODO);
    expect(a.habilitada).toBeTrue();
    expect(a.via).toBe('PAGO');
  });

  it('no anula el cobro de un cheque diferido: su origenId es el cheque, no un pago', () => {
    const a = accionAnularMovimientoBancario(mov({ origenTipo: 'CHEQUE', origenId: 31, pagoId: null }), TODO);
    expect(a.visible).toBeTrue();
    expect(a.habilitada).toBeFalse();
    expect(a.tooltip).toContain('Cheques');
  });

  it('avisa lo que pasa de verdad con cada documento', () => {
    const aviso = (origenTipo: string) => accionAnularMovimientoBancario(mov({ origenTipo, origenId: 1, pagoId: 1 }), TODO).aviso;
    expect(aviso('GASTO')).toContain('cancelado');
    expect(aviso('RRHH_LIQUIDACION_FINAL')).toContain('sigue dado de baja');
    expect(aviso('RRHH_LIQUIDACION_SUELDO')).toContain('aprobada');
    expect(aviso('RRHH_AGUINALDO')).toContain('aprobado');
    expect(aviso('RRHH_VALE')).toContain('vale');
  });

  it('no anula un movimiento de pago que ningún evento reclama', () => {
    for (const origenTipo of ['PAGO_CPP', 'GASTO', 'RRHH_VALE']) {
      const a = accionAnularMovimientoBancario(mov({ origenTipo, origenId: 5, pagoId: null }), TODO);
      expect(a.habilitada).withContext(origenTipo).toBeFalse();
      expect(a.tooltip).withContext(origenTipo).toContain('anterior al motor');
    }
  });

  it('anula entera una operación financiera', () => {
    const a = accionAnularMovimientoBancario(mov({ origenTipo: 'OPERACION_FINANCIERA', origenId: 12 }), TODO);
    expect(a.habilitada).toBeTrue();
    expect(a.via).toBe('OPERACION');
  });

  it('deja deshabilitado lo que se anula desde otro módulo', () => {
    const casos: [string, number | null, string][] = [
      ['ACREDITACION_POS', 3, 'POS'],
      ['VENTA_CREDITO_COBRO', 4, 'crédito'],
      ['MANUAL', null, 'otro ajuste'],
    ];
    for (const [origenTipo, origenId, texto] of casos) {
      const a = accionAnularMovimientoBancario(mov({ origenTipo, origenId }), TODO);
      expect(a.visible).withContext(origenTipo).toBeTrue();
      expect(a.habilitada).withContext(origenTipo).toBeFalse();
      expect(a.tooltip).withContext(origenTipo).toContain(texto);
    }
  });

  it('deja deshabilitado un origen nulo o que no conoce', () => {
    for (const origenTipo of [null, undefined, 'ALGO_NUEVO']) {
      const a = accionAnularMovimientoBancario(mov({ origenTipo, origenId: 8 }), TODO);
      expect(a.habilitada).withContext(String(origenTipo)).toBeFalse();
      expect(a.tooltip).withContext(String(origenTipo)).toContain('sin origen');
    }
  });

  it('con CPP PAGAR anula pagos pero no operaciones financieras', () => {
    expect(accionAnularMovimientoBancario(mov({ origenTipo: 'GASTO', origenId: 1, pagoId: 1 }), SOLO_PAGAR).habilitada).toBeTrue();
    const op = accionAnularMovimientoBancario(mov({ origenTipo: 'OPERACION_FINANCIERA', origenId: 2 }), SOLO_PAGAR);
    expect(op.habilitada).toBeFalse();
    expect(op.tooltip).toContain('permiso');
  });

  it('sin rol de tesorería no anula nada', () => {
    const pago = accionAnularMovimientoBancario(mov({ origenTipo: 'PAGO_CPP', origenId: 1, pagoId: 1 }), NADA);
    expect(pago.visible).toBeTrue();
    expect(pago.habilitada).toBeFalse();
    expect(pago.tooltip).toContain('permiso');
    expect(accionAnularMovimientoBancario(mov({ origenTipo: 'OPERACION_FINANCIERA', origenId: 2 }), NADA).habilitada).toBeFalse();
  });
});
