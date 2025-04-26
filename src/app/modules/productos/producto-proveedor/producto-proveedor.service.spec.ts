import { TestBed } from '@angular/core/testing';

import { ProductoProveedorService } from './producto-proveedor.service';

describe('ProductoProveedorService', () => {
  let service: ProductoProveedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductoProveedorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
