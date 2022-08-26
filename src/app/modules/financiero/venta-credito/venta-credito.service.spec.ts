import { TestBed } from '@angular/core/testing';

import { VentaCreditoService } from './venta-credito.service';

describe('VentaCreditoService', () => {
  let service: VentaCreditoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentaCreditoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
