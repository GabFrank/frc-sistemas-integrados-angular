/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { TimbradoService } from './timbrado.service';

describe('Service: Timbrado', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimbradoService]
    });
  });

  it('should ...', inject([TimbradoService], (service: TimbradoService) => {
    expect(service).toBeTruthy();
  }));
});
