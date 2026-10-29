import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationHttpService } from './notification-http.service';
import { ConfiguracionService } from './configuracion.service';

/** El central exige token en /notification/** (issue #521 del central). */
describe('NotificationHttpService', () => {
  let service: NotificationHttpService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('token_central');
    localStorage.removeItem('token');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationHttpService,
        { provide: ConfiguracionService, useValue: { getConfig: () => ({ serverCentralIp: 'central', serverCentralPort: '8081' }) } },
      ],
    });
    service = TestBed.inject(NotificationHttpService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('token_central');
    localStorage.removeItem('token');
  });

  it('manda el token del central', () => {
    localStorage.setItem('token_central', 'tc');
    localStorage.setItem('token', 'tf');
    service.sendGastoNotification(1, 2, 3, 1000).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/notification/gasto/1/2/3/1000'));
    expect(req.request.headers.get('Authorization')).toBe('Token tc');
    req.flush({});
  });

  it('sin token del central usa el de la filial', () => {
    localStorage.setItem('token', 'tf');
    service.sendVentaStockCriticoNotification({ ventaId: 1, sucursalId: 2, items: [] }).subscribe();
    const req = http.expectOne(r => r.url.endsWith('/notification/venta-stock-critico'));
    expect(req.request.headers.get('Authorization')).toBe('Token tf');
    req.flush({});
  });

  it('las seis notificaciones llevan el header', () => {
    localStorage.setItem('token_central', 'tc');
    service.sendCompraCreditoNotification(1, 2, 3, 100).subscribe();
    service.sendGastoNotification(1, 2, 3, 100).subscribe();
    service.sendRetiroNotification(1, 2, 3, 100).subscribe();
    service.sendVentaTransferenciaNotification(1, 2, 100).subscribe();
    service.sendDiferenciaMaletinNotification(1, 2, 100).subscribe();
    service.sendVentaStockCriticoNotification({ ventaId: 1, sucursalId: 2, items: [] }).subscribe();
    const reqs = http.match(r => r.url.includes('/notification/'));
    expect(reqs.length).toBe(6);
    reqs.forEach(r => {
      expect(r.request.headers.get('Authorization')).toBe('Token tc');
      r.flush({});
    });
  });

  it('sin ningun token no manda el header', () => {
    service.sendRetiroNotification(1, 2, 3, 100).subscribe();
    const req = http.expectOne(r => r.url.includes('/notification/retiro/'));
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
