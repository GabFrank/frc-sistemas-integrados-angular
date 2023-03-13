import { TestBed } from '@angular/core/testing';

import { VueltoService } from './vuelto.service';

describe('VueltoService', () => {
  let service: VueltoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VueltoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
