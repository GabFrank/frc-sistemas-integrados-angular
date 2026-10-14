import { EstadoDE } from '../documento-electronico/documento-electronico.model';
import { FacturaLegal } from './factura-legal.model';
import { esFacturaElectronica, facturaActiva, puedeCancelarseFactura } from './factura-legal-estado';

const CDC = '01800000000000000000000000000000000000000000';

function papel(activo: boolean | null | undefined): FacturaLegal {
  return { activo } as FacturaLegal;
}

function electronica(activo: boolean | null, estado: EstadoDE): FacturaLegal {
  return { activo, cdc: CDC, documentoElectronico: { estado } } as FacturaLegal;
}

describe('estado de la factura legal', () => {
  describe('papel', () => {
    it('activo en null o sin definir es activa y se puede cancelar', () => {
      for (const activo of [null, undefined]) {
        expect(facturaActiva(papel(activo))).toBe(true);
        expect(puedeCancelarseFactura(papel(activo))).toBe(true);
      }
    });

    it('activo en true es activa y se puede cancelar', () => {
      expect(facturaActiva(papel(true))).toBe(true);
      expect(puedeCancelarseFactura(papel(true))).toBe(true);
    });

    it('activo en false es inactiva y no se puede cancelar', () => {
      expect(facturaActiva(papel(false))).toBe(false);
      expect(puedeCancelarseFactura(papel(false))).toBe(false);
    });

    it('un cdc vacío o en blanco sigue siendo papel', () => {
      expect(esFacturaElectronica({ cdc: '' } as FacturaLegal)).toBe(false);
      expect(esFacturaElectronica({ cdc: '   ' } as FacturaLegal)).toBe(false);
    });
  });

  describe('electrónica', () => {
    it('aprobada se puede cancelar, con activo en null o en true', () => {
      expect(puedeCancelarseFactura(electronica(null, EstadoDE.APROBADO))).toBe(true);
      expect(puedeCancelarseFactura(electronica(true, EstadoDE.APROBADO))).toBe(true);
    });

    it('sin aprobar no se puede cancelar aunque activo esté en true', () => {
      for (const estado of [EstadoDE.PENDIENTE, EstadoDE.EN_LOTE, EstadoDE.RECHAZADO, EstadoDE.CANCELADO]) {
        expect(puedeCancelarseFactura(electronica(true, estado))).withContext(estado).toBe(false);
        expect(puedeCancelarseFactura(electronica(null, estado))).withContext(estado).toBe(false);
      }
    });

    it('sin documento electrónico no se puede cancelar', () => {
      expect(puedeCancelarseFactura({ activo: true, cdc: CDC } as FacturaLegal)).toBe(false);
    });
  });
});
