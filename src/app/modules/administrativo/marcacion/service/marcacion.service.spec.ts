import { TestBed } from '@angular/core/testing';

import { MarcacionService } from './marcacion.service';

describe('MarcacionService', () => {
  let service: MarcacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarcacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
