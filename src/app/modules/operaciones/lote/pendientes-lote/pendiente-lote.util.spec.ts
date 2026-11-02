import { InfoPendienteLote } from '../lote.model';
import { esVencimientoDistinto, motivoNoConfirmar, restante } from './pendiente-lote.util';

function info(remanente: number, saldoSinLote: number, vencida = false): InfoPendienteLote {
  return {
    pendiente: { mslId: 1, sucursalId: 1, productoId: 1, cantidad: remanente, resuelto: 0, remanente },
    saldoSinLote, atribuidoManualDespues: 0, cantidadSugerida: Math.min(remanente, saldoSinLote),
    sincronizacionVencida: vencida, maxDesfaseMinutos: 15, lotesParecidos: []
  };
}

describe('pendiente-lote.util', () => {
  it('permite completar el total', () => {
    expect(motivoNoConfirmar(info(4, 4), 'L1', 4, false, '')).toBeNull();
  });
  it('no deja atribuir más que el SIN LOTE disponible', () => {
    expect(motivoNoConfirmar(info(4, 2), 'L1', 3, false, '')).toContain('SIN LOTE');
  });
  it('no deja atribuir más que lo pendiente', () => {
    expect(motivoNoConfirmar(info(4, 10), 'L1', 5, false, '')).toContain('pendiente');
  });
  it('bloquea si la sucursal no sincroniza', () => {
    expect(motivoNoConfirmar(info(4, 4, true), 'L1', 4, false, '')).toContain('sincroniza');
  });
  it('exige motivo para cerrar el remanente', () => {
    expect(motivoNoConfirmar(info(4, 2), 'L1', 2, true, '')).toContain('motivo');
    expect(motivoNoConfirmar(info(4, 2), 'L1', 2, true, 'vendido sin lote')).toBeNull();
    expect(motivoNoConfirmar(info(4, 2), 'L1', 2, false, '')).toBeNull();
  });
  it('calcula el restante y reconoce el aviso de vencimiento', () => {
    expect(restante(info(4, 2), 2)).toBe(2);
    expect(restante(info(4, 4), 4)).toBe(0);
    expect(esVencimientoDistinto([{ message: 'VENCIMIENTO_DISTINTO: el lote X' }])).toBeTrue();
    expect(esVencimientoDistinto('otro error')).toBeFalse();
  });
});
