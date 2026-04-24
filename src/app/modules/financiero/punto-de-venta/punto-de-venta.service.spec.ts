/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PuntoDeVentaService } from './punto-de-venta.service';

describe('Service: PuntoDeVenta', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PuntoDeVentaService]
    });
  });

  it('should ...', inject([PuntoDeVentaService], (service: PuntoDeVentaService) => {
    expect(service).toBeTruthy();
  }));
});
