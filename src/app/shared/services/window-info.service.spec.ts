import { TestBed } from '@angular/core/testing';

import { WindowInfoService } from './window-info.service';

describe('WindowInfoService', () => {
  let service: WindowInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WindowInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
