import { TestBed } from '@angular/core/testing';

import { InnerDialogService } from './inner-dialog.service';

describe('InnerDialogService', () => {
  let service: InnerDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InnerDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
