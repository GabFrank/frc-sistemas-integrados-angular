import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarDetalleCompraItemDialogComponent } from './adicionar-detalle-compra-item-dialog.component';

describe('AdicionarDetalleCompraItemDialogComponent', () => {
  let component: AdicionarDetalleCompraItemDialogComponent;
  let fixture: ComponentFixture<AdicionarDetalleCompraItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarDetalleCompraItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarDetalleCompraItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
