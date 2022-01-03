import { TestBed } from '@angular/core/testing';

import { VentaTouchService } from './venta-touch.service';

describe('VentaTouchService', () => {
  let service: VentaTouchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VentaTouchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
