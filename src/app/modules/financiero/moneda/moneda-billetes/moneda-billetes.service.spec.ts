import { TestBed } from '@angular/core/testing';

import { MonedaBilletesService } from './moneda-billetes.service';

describe('MonedaBilletesService', () => {
  let service: MonedaBilletesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonedaBilletesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
