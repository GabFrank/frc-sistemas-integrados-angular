import { TestBed } from '@angular/core/testing';

import { ActualizacionService } from './actualizacion.service';

describe('ActualizacionService', () => {
  let service: ActualizacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActualizacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
