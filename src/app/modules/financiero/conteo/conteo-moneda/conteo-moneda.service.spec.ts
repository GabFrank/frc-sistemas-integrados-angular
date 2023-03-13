import { TestBed } from '@angular/core/testing';

import { ConteoMonedaService } from './conteo-moneda.service';

describe('ConteoMonedaService', () => {
  let service: ConteoMonedaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConteoMonedaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
