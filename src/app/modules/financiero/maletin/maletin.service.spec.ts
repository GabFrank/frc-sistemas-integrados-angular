import { TestBed } from '@angular/core/testing';

import { MaletinService } from './maletin.service';

describe('MaletinService', () => {
  let service: MaletinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaletinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
