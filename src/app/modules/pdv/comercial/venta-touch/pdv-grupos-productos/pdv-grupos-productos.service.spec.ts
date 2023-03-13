import { TestBed } from '@angular/core/testing';

import { PdvGruposProductosService } from './pdv-grupos-productos.service';

describe('PdvGruposProductosService', () => {
  let service: PdvGruposProductosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdvGruposProductosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
