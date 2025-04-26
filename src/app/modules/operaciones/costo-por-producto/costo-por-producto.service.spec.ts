import { TestBed } from '@angular/core/testing';

import { CostoPorProductoService } from './costo-por-producto.service';

describe('CostoPorProductoService', () => {
  let service: CostoPorProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CostoPorProductoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
