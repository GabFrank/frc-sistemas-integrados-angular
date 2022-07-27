import { TestBed } from '@angular/core/testing';

import { FacturaLegalService } from './factura-legal.service';

describe('FacturaLegalService', () => {
  let service: FacturaLegalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturaLegalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
