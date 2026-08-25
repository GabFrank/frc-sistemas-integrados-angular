import { TestBed } from '@angular/core/testing';
import { QrLectorService } from './qr-lector.service';
import { QrErrorTipo } from './qr-lector.model';

/**
 * Los códigos de estas pruebas NO son inventados: son los que central emite hoy, copiados
 * de ImpresionService y PreGastoService. Si alguno deja de parsear, hay papeles impresos
 * circulando que el lector va a rechazar.
 */
describe('QrLectorService', () => {
  let service: QrLectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QrLectorService);
  });

  describe('códigos reales emitidos por central', () => {
    it('parsea el QR de solicitud de pago (ImpresionService:687)', () => {
      const res = service.parse('frc-0-SOLPAG-412-412-ListSolicitudPagoComponent-null-null');
      expect(res.ok).toBeTrue();
      expect(res.qr.tipoEntidad).toBe('SOLPAG');
      expect(res.qr.idOrigen).toBe(412);
      // sucursalId viene hardcodeado en 0: no sirve para identificar la sucursal.
      expect(res.qr.sucursalId).toBe(0);
      // Los "null" de texto del emisor no deben llegar como el string "null".
      expect(res.qr.campo6).toBeNull();
      expect(res.qr.campo7).toBeNull();
    });

    it('parsea el QR de retiro de pre-gasto, que corre las posiciones (PreGastoService:500)', () => {
      // Acá el 6º segmento es el qrToken, no un nombre de componente.
      const res = service.parse('frc-5-PRE_GASTO_RETIRO-123-1-A1B2C3D4-1724500000000');
      expect(res.ok).toBeFalse();
      // No es soportado por la caja, pero el parser tiene que reconocerlo y decir por qué.
      expect(res.error.tipo).toBe(QrErrorTipo.TIPO_DESCONOCIDO);
      expect(res.error.mensaje).toContain('PRE_GASTO_RETIRO');
    });

    it('parsea el QR de transferencia en PDF, que sí trae sucursal real (ImpresionService:880)', () => {
      const res = service.parse('frc-3-TRF-77-77-EditTransferenciaComponent-null-null');
      expect(res.ok).toBeFalse();
      expect(res.error.tipo).toBe(QrErrorTipo.TIPO_DESCONOCIDO);
    });
  });

  describe('suciedad del lector físico', () => {
    it('tolera el CR/LF que agrega el lector al terminar', () => {
      const res = service.parse('frc-0-SOLPAG-412-412-ListSolicitudPagoComponent-null-null\r\n');
      expect(res.ok).toBeTrue();
      // Sin el saneo, el CR quedaría pegado al último segmento sin que se note.
      expect(res.qr.campo7).toBeNull();
      expect(res.qr.raw.endsWith('null')).toBeTrue();
    });

    it('tolera espacios de relleno alrededor', () => {
      const res = service.parse('   frc-0-SOLPAG-412-412-X-null-null   ');
      expect(res.ok).toBeTrue();
    });

    it('un guión de más queda dentro del último campo, no corre las posiciones', () => {
      const res = service.parse('frc-0-SOLPAG-412-412-Comp-null-2026-08-24');
      expect(res.ok).toBeTrue();
      // Lo que importa: el tipo y el id siguen leyéndose bien pese al guión extra.
      expect(res.qr.tipoEntidad).toBe('SOLPAG');
      expect(res.qr.idOrigen).toBe(412);
    });
  });

  describe('rechazos', () => {
    it('rechaza un código vacío', () => {
      const res = service.parse('   ');
      expect(res.ok).toBeFalse();
      expect(res.error.tipo).toBe(QrErrorTipo.VACIO);
    });

    it('rechaza un código de barras de producto', () => {
      const res = service.parse('7791234567890');
      expect(res.ok).toBeFalse();
      expect(res.error.tipo).toBe(QrErrorTipo.PREFIJO_INVALIDO);
    });

    it('rechaza un código truncado', () => {
      const res = service.parse('frc-0-SOLPAG');
      expect(res.ok).toBeFalse();
      expect(res.error.tipo).toBe(QrErrorTipo.INCOMPLETO);
    });

    it('rechaza un código sin número de documento', () => {
      const res = service.parse('frc-0-SOLPAG-null-null-X-null-null');
      expect(res.ok).toBeFalse();
      expect(res.error.tipo).toBe(QrErrorTipo.INCOMPLETO);
    });

    it('acepta el prefijo en mayúsculas', () => {
      const res = service.parse('FRC-0-SOLPAG-412-412-X-null-null');
      expect(res.ok).toBeTrue();
    });
  });

  describe('sucursalDe', () => {
    it('ignora el sucursalId cuando viene en 0', () => {
      const res = service.parse('frc-0-SOLPAG-412-412-X-null-null');
      expect(res.ok).toBeTrue();
      // idCentral repite idOrigen, así que no hay sucursal utilizable.
      expect(service.sucursalDe(res.qr)).toBeNull();
    });

    it('usa el sucursalId real cuando el emisor lo manda', () => {
      const res = service.parse('frc-3-RETIRO-1151-3-X-null-null');
      expect(res.ok).toBeTrue();
      expect(service.sucursalDe(res.qr)).toBe(3);
    });

    it('cae al idCentral cuando difiere del idOrigen', () => {
      const res = service.parse('frc-0-RETIRO-1151-4-X-null-null');
      expect(res.ok).toBeTrue();
      // Es el caso del retiro: PK compuesta (id, sucursalId) con la sucursal en idCentral.
      expect(service.sucursalDe(res.qr)).toBe(4);
    });
  });
});
