import { TestBed } from '@angular/core/testing';

import { MovimientoStockService } from './movimiento-stock.service';

describe('MovimientoStockService', () => {
  let service: MovimientoStockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovimientoStockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
