import { TestBed } from '@angular/core/testing';

import { CrearExcelService } from './crear-excel.service';

describe('CrearExcelService', () => {
  let service: CrearExcelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrearExcelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
