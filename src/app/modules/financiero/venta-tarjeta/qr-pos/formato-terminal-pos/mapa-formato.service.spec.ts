import { MapaFormatoService } from './mapa-formato.service';

/**
 * `urlCentral` arma la dirección que termina en el QR de la muestra y a la que se suben las fotos.
 * Hasta el 2026-09-24 ignoraba la configuración y armaba `http://:8081/...` en la app instalada:
 * estos casos fijan que sale de la misma configuración con la que Apollo habla con central.
 *
 * Karma corre por `http://localhost`, así que acá se ve el camino HTTP. El de la web publicada
 * (HTTPS, sin puerto) es `urlsDeServidor`, cubierto por las pantallas que ya hablan GraphQL así.
 */
describe('MapaFormatoService.urlCentral', () => {
  const ruta = '/public/captura-muestra/TOKEN';

  function servicioCon(config: any): MapaFormatoService {
    const configService = { getConfig: () => config } as any;
    // Sólo `configService` participa de urlCentral; el resto de las dependencias no se tocan.
    return new (MapaFormatoService as any)(null, null, configService);
  }

  it('usa la ip y el puerto de central de la configuración, como las cajas de farmacia', () => {
    const s = servicioCon({ serverCentralIp: '159.203.86.103', serverCentralPort: '8082' });
    expect(s.urlCentral(ruta)).toBe('http://159.203.86.103:8082' + ruta);
  });

  it('no usa la del filial aunque esté configurada', () => {
    const s = servicioCon({
      serverCentralIp: '159.203.86.103', serverCentralPort: '8082',
      serverIp: '192.168.0.146', serverPort: '8082',
    });
    expect(s.urlCentral(ruta)).toBe('http://159.203.86.103:8082' + ruta);
  });

  it('sin configuración de central cae al host de la página y al puerto de desarrollo', () => {
    const esperado = `http://${window.location.hostname || 'localhost'}:8081${ruta}`;
    expect(servicioCon({ serverCentralIp: '', serverCentralPort: '' }).urlCentral(ruta)).toBe(esperado);
    expect(servicioCon(null).urlCentral(ruta)).toBe(esperado);
  });
});
