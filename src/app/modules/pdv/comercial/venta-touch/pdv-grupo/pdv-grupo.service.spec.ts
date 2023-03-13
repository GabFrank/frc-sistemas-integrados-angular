import { TestBed } from '@angular/core/testing';

import { PdvGrupoService } from './pdv-grupo.service';

describe('PdvGrupoService', () => {
  let service: PdvGrupoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdvGrupoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
