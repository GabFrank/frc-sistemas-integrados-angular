import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoPedidoDialogComponent } from './pago-pedido-dialog.component';

describe('PagoPedidoDialogComponent', () => {
  let component: PagoPedidoDialogComponent;
  let fixture: ComponentFixture<PagoPedidoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PagoPedidoDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoPedidoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
