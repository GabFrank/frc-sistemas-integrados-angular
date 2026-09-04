import { codificarQr, descodificarQr } from '../../../../shared/qr-code/qr-code.component';
import { VentaTarjeta } from '../venta-tarjeta.model';
import { construirQrPayloadVentaTarjeta } from './venta-tarjeta-qr-payload';

/**
 * Réplica exacta de la validación del mobile (frc-mobile, venta-tarjeta-qr.service.ts →
 * procesarQrVenta). No se importa de allá porque son repos separados: si el mobile cambia el
 * contrato, este espejo tiene que cambiar con él, y estos tests son los que avisan.
 */
function parsearComoElCelular(texto: string, cajaActualId: number) {
  if (!texto || !texto.startsWith('frc-')) {
    return { ok: false, motivo: 'qr-invalido' };
  }
  const qrData = descodificarQr(texto);
  if (qrData.tipoEntidad !== 'VT') {
    return { ok: false, motivo: 'no-es-venta-tarjeta' };
  }
  if (qrData.componentToOpen !== 'RegistroVentaTarjetaComponent') {
    return { ok: false, motivo: 'qr-no-reconocido' };
  }
  const partes = (qrData.data || '').split('|');
  const cajaIdQr = Number(partes[0]);
  const monto = Number(partes[1]);
  const ventaTarjetaId = partes[2] ? Number(partes[2]) : null;

  if (cajaIdQr !== Number(cajaActualId)) {
    return { ok: false, motivo: 'caja-distinta' };
  }

  return {
    ok: true,
    navigation: {
      ventaId: Number(qrData.idOrigen),
      cajaId: cajaIdQr,
      monto,
      sucursalId: Number(qrData.sucursalId),
      ventaTarjetaId
    }
  };
}

const PENDIENTE: VentaTarjeta = {
  id: 512,
  sucursalId: 3,
  caja: { id: 77 },
  venta: { id: 90210, totalGs: 60000 },
  terminalPos: { id: 4, codigo: 'TPOS-VPX-01', descripcion: 'VALIDAPIX CAJA 1' },
  monto: 60000,
  estado: 'PENDIENTE',
  creadoEn: '2026-09-03T10:00:00'
};

describe('construirQrPayloadVentaTarjeta', () => {

  it('el celular acepta el QR y recupera todos los datos de navegación', () => {
    const texto = codificarQr(construirQrPayloadVentaTarjeta(PENDIENTE));

    const r: any = parsearComoElCelular(texto, 77);

    expect(r.ok).toBeTrue();
    expect(r.navigation.ventaId).toBe(90210);
    expect(r.navigation.cajaId).toBe(77);
    expect(r.navigation.monto).toBe(60000);
    expect(r.navigation.sucursalId).toBe(3);
    expect(r.navigation.ventaTarjetaId).toBe(512);
  });

  it('la cadena arranca con "frc-" — un JSON.stringify acá rompe el flujo entero', () => {
    const texto = codificarQr(construirQrPayloadVentaTarjeta(PENDIENTE));

    expect(texto.startsWith('frc-')).toBeTrue();
    expect(parsearComoElCelular(JSON.stringify(construirQrPayloadVentaTarjeta(PENDIENTE)), 77).motivo)
      .toBe('qr-invalido');
  });

  it('marca VT como tipo de entidad y el componente que el mobile sabe abrir', () => {
    const payload = construirQrPayloadVentaTarjeta(PENDIENTE);

    expect(payload.tipoEntidad).toBe('VT');
    expect(payload.componentToOpen).toBe('RegistroVentaTarjetaComponent');
  });

  it('data es posicional: cajaId|monto|ventaTarjetaId', () => {
    expect(construirQrPayloadVentaTarjeta(PENDIENTE).data).toBe('77|60000|512');
  });

  it('idOrigen lleva el id de la VENTA, no el de la venta_tarjeta', () => {
    const payload = construirQrPayloadVentaTarjeta(PENDIENTE);

    expect(payload.idOrigen).toBe(90210);
    expect(payload.idOrigen).not.toBe(PENDIENTE.id);
  });

  it('ningún campo mete un "-", que es el separador de codificarQr', () => {
    const payload = construirQrPayloadVentaTarjeta(PENDIENTE);

    expect(String(payload.data).includes('-')).toBeFalse();
    expect(String(payload.componentToOpen).includes('-')).toBeFalse();
    expect(String(payload.tipoEntidad).includes('-')).toBeFalse();
  });

  it('el QR de otra caja se rechaza como caja-distinta', () => {
    const texto = codificarQr(construirQrPayloadVentaTarjeta(PENDIENTE));

    expect(parsearComoElCelular(texto, 99).motivo).toBe('caja-distinta');
  });

  it('sin caja en la fila, el celular NO confunde el faltante con una caja ajena', () => {
    // Number('') === 0, así que un data "|monto|id" hacía que el mobile dijera "pertenece a otra
    // caja" cuando en realidad el dato nunca viajó. Preferimos no ofrecer el QR en ese caso.
    const sinCaja: VentaTarjeta = { ...PENDIENTE, caja: undefined };

    expect(construirQrPayloadVentaTarjeta(sinCaja).data).toBe('|60000|512');
    expect(parsearComoElCelular(codificarQr(construirQrPayloadVentaTarjeta(sinCaja)), 77).motivo)
      .toBe('caja-distinta');
  });
});
