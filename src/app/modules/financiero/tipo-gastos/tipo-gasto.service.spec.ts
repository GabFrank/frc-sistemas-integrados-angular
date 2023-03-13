import { TestBed } from '@angular/core/testing';

import { TipoGastoService } from './tipo-gasto.service';

describe('TipoGastoService', () => {
  let service: TipoGastoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipoGastoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
